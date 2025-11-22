const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'misinfo',
  user: 'postgres',
  password: 'postgres'
});

app.use(cors());
app.use(express.json());

// Get flagged content for a page
app.get('/rest/v1/flagged_content', async (req, res) => {
  try {
    const { page_url } = req.query;
    let query = 'SELECT * FROM flagged_content';
    const params = [];

    if (page_url) {
      query += ' WHERE page_url = $1';
      params.push(page_url);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create flagged content
app.post('/rest/v1/flagged_content', async (req, res) => {
  try {
    const { url, page_url, content, content_type, flag_type, note, selector } = req.body;

    const result = await pool.query(
      `INSERT INTO flagged_content
       (url, page_url, content, content_type, flag_type, note, selector)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [url, page_url, content, content_type, flag_type, note, selector]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Count flags for a page
app.get('/rest/v1/flagged_content/count', async (req, res) => {
  try {
    const { page_url } = req.query;
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM flagged_content WHERE page_url = $1',
      [page_url]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error counting:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
