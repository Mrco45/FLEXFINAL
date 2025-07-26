import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 4000;
const UPLOADS_DIR = path.resolve('./uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/images', express.static(UPLOADS_DIR));

// SQLite setup
let db;
(async () => {
  db = await open({
    filename: './orders.db',
    driver: sqlite3.Database
  });
  await db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT,
    phoneNumber TEXT,
    orderDate TEXT,
    items TEXT,
    totalCost REAL,
    amountPaid REAL,
    attachments TEXT,
    status TEXT
  )`);
})();

// API endpoints
app.get('/orders', async (req, res) => {
  const orders = await db.all('SELECT * FROM orders');
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items), attachments: JSON.parse(o.attachments) })));
});

app.get('/orders/:id', async (req, res) => {
  const order = await db.get('SELECT * FROM orders WHERE id = ?', req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = JSON.parse(order.items);
  order.attachments = JSON.parse(order.attachments);
  res.json(order);
});

app.post('/orders', async (req, res) => {
  const { customerName, phoneNumber, orderDate, items, totalCost, amountPaid, attachments, status } = req.body;
  const result = await db.run(
    'INSERT INTO orders (customerName, phoneNumber, orderDate, items, totalCost, amountPaid, attachments, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    customerName, phoneNumber, orderDate, JSON.stringify(items), totalCost, amountPaid, JSON.stringify(attachments), status
  );
  res.json({ id: result.lastID });
});

app.put('/orders/:id', async (req, res) => {
  const { customerName, phoneNumber, orderDate, items, totalCost, amountPaid, attachments, status } = req.body;
  await db.run(
    'UPDATE orders SET customerName=?, phoneNumber=?, orderDate=?, items=?, totalCost=?, amountPaid=?, attachments=?, status=? WHERE id=?',
    customerName, phoneNumber, orderDate, JSON.stringify(items), totalCost, amountPaid, JSON.stringify(attachments), status, req.params.id
  );
  res.json({ success: true });
});

app.delete('/orders/:id', async (req, res) => {
  await db.run('DELETE FROM orders WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// Image upload
app.post('/upload', upload.single('image'), (req, res) => {
  res.json({ filename: req.file.filename, url: `/images/${req.file.filename}` });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
