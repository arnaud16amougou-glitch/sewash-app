const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Dossier uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
app.use('/uploads', express.static(uploadDir));

// Connexion PostgreSQL avec DATABASE_URL (obligatoire sur Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware auth standard
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Middleware admin
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ==================== ROUTES PUBLIQUES ====================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Utilisateur non trouvé' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ROUTES RÉGIONS ET COMMUNES ====================
app.get('/api/regions', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, code FROM regions ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer les communes avec filtre région optionnel
app.get('/api/communes', async (req, res) => {
  const { region } = req.query;
  let query = `
    SELECT c.id, c.name, c.city, c.region_id, r.name as region_name
    FROM communes c
    JOIN regions r ON c.region_id = r.id
  `;
  const params = [];
  if (region) {
    query += ` WHERE r.code = $1`;
    params.push(region);
  }
  query += ` ORDER BY c.name`;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ROUTES BORNES ====================
// Route bornes avec filtre région (version complète avec jointures)
app.get('/api/bornes', async (req, res) => {
  const { region } = req.query;
  let query = `
    SELECT b.*, 
           ST_X(b.geom) as lng, ST_Y(b.geom) as lat,
           c.name as commune_name, d.name as departement_name, r.name as region_name
    FROM bornes b
    JOIN communes c ON b.commune_id = c.id
    JOIN departements d ON c.departement_id = d.id
    JOIN regions r ON d.region_id = r.id
  `;
  if (region) {
    query += ` WHERE r.code = '${region}'`;
  }
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// QR code pour une borne
app.get('/api/bornes/:code/qrcode', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query('SELECT qr_code FROM bornes WHERE code = $1', [code]);
    if (result.rows.length === 0) return res.status(404).send('Borne non trouvée');
    let qrCodeData = result.rows[0].qr_code;
    if (!qrCodeData) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const url = `${frontendUrl}/plainte?borne=${code}`;
      qrCodeData = await QRCode.toDataURL(url);
      await pool.query('UPDATE bornes SET qr_code = $1 WHERE code = $2', [qrCodeData, code]);
    }
    const base64Data = qrCodeData.replace(/^data:image\/png;base64,/, '');
    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': imgBuffer.length });
    res.end(imgBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// ==================== ROUTES PAP ====================
app.post('/api/pap', async (req, res) => {
  const { full_name, phone, id_card_number, commune_id, lat, lng, has_title, is_vulnerable, vulnerability_type } = req.body;
  const pap_code = `PAP-${Date.now()}`;
  const geom = lat && lng ? `POINT(${lng} ${lat})` : null;
  try {
    const result = await pool.query(
      `INSERT INTO pap (pap_code, full_name, phone, id_card_number, commune_id, geom, has_title, is_vulnerable, vulnerability_type)
       VALUES ($1, $2, $3, $4, $5, ST_GeomFromText($6, 4326), $7, $8, $9) RETURNING *`,
      [pap_code, full_name, phone, id_card_number, commune_id, geom, has_title || false, is_vulnerable || false, vulnerability_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pap', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, ST_X(p.geom) as lng, ST_Y(p.geom) as lat, c.name as commune_name
      FROM pap p LEFT JOIN communes c ON p.commune_id = c.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ROUTES BIENS ====================
app.post('/api/biens', async (req, res) => {
  const { pap_id, bien_type, surface_m2, description, photo_urls, evaluated_value } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO biens (pap_id, bien_type, surface_m2, description, photo_urls, evaluated_value)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [pap_id, bien_type, surface_m2, description, photo_urls || [], evaluated_value]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ROUTES PLAINTES ====================
app.post('/api/complaints', async (req, res) => {
  const { complaint_type, pap_id, worker_id, commune_id, description, media_urls, severity, is_vbg, vbg_confidential_data } = req.body;
  const complaint_code = `PLT-${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO complaints (complaint_code, complaint_type, pap_id, worker_id, commune_id, description, media_urls, severity, is_vbg, vbg_confidential_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [complaint_code, complaint_type, pap_id, worker_id, commune_id, description, media_urls, severity, is_vbg, vbg_confidential_data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/complaints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/complaints/:id/followup', async (req, res) => {
  const { id } = req.params;
  const { action, status } = req.body;
  try {
    await pool.query('INSERT INTO complaint_followups (complaint_id, action, actor_role) VALUES ($1, $2, $3)', [id, action, 'admin']);
    if (status) await pool.query('UPDATE complaints SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== UPLOAD PHOTOS ====================
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.post('/api/complaints/:id/photo', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const fileUrl = `/uploads/${req.file.filename}`;
  const result = await pool.query('SELECT media_urls FROM complaints WHERE id = $1', [id]);
  let urls = result.rows[0].media_urls || [];
  urls.push(fileUrl);
  await pool.query('UPDATE complaints SET media_urls = $1 WHERE id = $2', [urls, id]);
  res.json({ success: true, url: fileUrl });
});

app.post('/api/biens/:id/photo', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const fileUrl = `/uploads/${req.file.filename}`;
  const result = await pool.query('SELECT photo_urls FROM biens WHERE id = $1', [id]);
  let urls = result.rows[0].photo_urls || [];
  urls.push(fileUrl);
  await pool.query('UPDATE biens SET photo_urls = $1 WHERE id = $2', [urls, id]);
  res.json({ success: true, url: fileUrl });
});

// ==================== TABLEAU DE BORD (avec filtre région) ====================
app.get('/api/dashboard', async (req, res) => {
  const { region } = req.query;
  let whereClause = '';
  let params = [];
  if (region) {
    whereClause = ` WHERE r.code = $1`;
    params.push(region);
  }
  const queries = {
    totalComplaints: `SELECT COUNT(*) FROM complaints c JOIN communes com ON c.commune_id = com.id JOIN regions r ON com.region_id = r.id ${whereClause}`,
    resolvedComplaints: `SELECT COUNT(*) FROM complaints c JOIN communes com ON c.commune_id = com.id JOIN regions r ON com.region_id = r.id ${whereClause} AND c.status = 'resolue'`,
    totalPaps: `SELECT COUNT(*) FROM pap p JOIN communes com ON p.commune_id = com.id JOIN regions r ON com.region_id = r.id ${whereClause}`,
    indemnifiedPaps: `SELECT COUNT(*) FROM pap p JOIN communes com ON p.commune_id = com.id JOIN regions r ON com.region_id = r.id ${whereClause} AND p.status = 'indemnified'`,
    totalBornes: `SELECT COUNT(*) FROM bornes b JOIN communes com ON b.commune_id = com.id JOIN regions r ON com.region_id = r.id ${whereClause}`,
    activeBornes: `SELECT COUNT(*) FROM bornes b JOIN communes com ON b.commune_id = com.id JOIN regions r ON com.region_id = r.id ${whereClause} AND b.status = 'active'`
  };
  try {
    const stats = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await pool.query(query, params);
      stats[key] = parseInt(result.rows[0].count);
    }
    stats.resolutionRate = stats.totalComplaints ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0;
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EXPORTS PDF / EXCEL (avec filtre région) ====================
app.get('/api/export/pdf', async (req, res) => {
  const { region } = req.query;
  let whereClause = '';
  let params = [];
  if (region) {
    whereClause = ' WHERE r.code = $1';
    params.push(region);
  }
  const query = `
    SELECT c.complaint_code, c.complaint_type, c.status, c.description, c.created_at,
           com.name as commune_name, r.name as region_name
    FROM complaints c
    JOIN communes com ON c.commune_id = com.id
    JOIN regions r ON com.region_id = r.id
    ${whereClause}
    ORDER BY c.created_at DESC
  `;
  try {
    const result = await pool.query(query, params);
    const complaints = result.rows;
    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename=plaintes.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Liste des plaintes SEWASH', { align: 'center' });
    if (region) {
      const regionName = await pool.query('SELECT name FROM regions WHERE code = $1', [region]);
      doc.fontSize(12).text(`Région : ${regionName.rows[0]?.name || region}`, { align: 'center' });
    }
    doc.moveDown();
    complaints.forEach(c => {
      doc.fontSize(12).text(`N° ${c.complaint_code} - ${c.complaint_type} - ${c.status}`);
      doc.text(`Région: ${c.region_name} | Commune: ${c.commune_name}`);
      doc.text(`Description: ${(c.description || '').substring(0, 100)}...`);
      doc.text(`Date: ${new Date(c.created_at).toLocaleString()}`);
      doc.moveDown();
    });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/export/excel', async (req, res) => {
  const { region } = req.query;
  let whereClause = '';
  let params = [];
  if (region) {
    whereClause = ' WHERE r.code = $1';
    params.push(region);
  }
  const query = `
    SELECT c.complaint_code, c.complaint_type, c.status, c.description, c.created_at,
           com.name as commune_name, r.name as region_name
    FROM complaints c
    JOIN communes com ON c.commune_id = com.id
    JOIN regions r ON com.region_id = r.id
    ${whereClause}
    ORDER BY c.created_at DESC
  `;
  try {
    const result = await pool.query(query, params);
    const complaints = result.rows;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plaintes');
    worksheet.columns = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Région', key: 'region', width: 15 },
      { header: 'Commune', key: 'commune', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Statut', key: 'status', width: 10 },
      { header: 'Description', key: 'desc', width: 50 },
      { header: 'Date', key: 'date', width: 20 }
    ];
    complaints.forEach(c => {
      worksheet.addRow({
        code: c.complaint_code,
        region: c.region_name,
        commune: c.commune_name,
        type: c.complaint_type,
        status: c.status,
        desc: c.description,
        date: c.created_at
      });
    });
    res.setHeader('Content-Disposition', 'attachment; filename=plaintes.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== GESTION DES UTILISATEURS (admin) ====================
app.get('/api/users', isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, full_name, email, phone, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', isAdmin, async (req, res) => {
  const { username, password, role, full_name, email, phone } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Nom d’utilisateur et mot de passe requis' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, full_name, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role`,
      [username, hashed, role, full_name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') res.status(400).json({ error: 'Nom d’utilisateur déjà existant' });
    else res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, role, full_name, email, phone, password } = req.body;
  try {
    let query = 'UPDATE users SET username=$1, role=$2, full_name=$3, email=$4, phone=$5';
    const params = [username, role, full_name, email, phone];
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += ', password_hash=$6';
      params.push(hashed);
    }
    query += ` WHERE id=$${params.length+1} RETURNING id, username, role`;
    params.push(id);
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
  try {
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== LANCEMENT ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend SEWASH démarré sur le port ${PORT}`));