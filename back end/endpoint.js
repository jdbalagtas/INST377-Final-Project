
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// supabase 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// GET endpoint
app.get('/cities', async (req, res) => {
  const { data, error } = await supabase
    .from('cities')
    .select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST endpoint
app.post('/reports', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .insert([req.body]);
  if (error) return res.status(500).json({ error });
  res.json(data);
});

module.exports = app;