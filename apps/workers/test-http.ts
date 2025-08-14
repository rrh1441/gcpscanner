import express from 'express';
import axios from 'axios';

const app = express();

app.get('/test-axios', async (req, res) => {
  console.log('Testing axios request...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await axios.get('https://httpbin.org/delay/1', {
      timeout: 5000,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Axios failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/test-fetch', async (req, res) => {
  console.log('Testing fetch request...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://httpbin.org/delay/1', {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/test-dns', async (req, res) => {
  const dns = require('dns').promises;
  try {
    const addresses = await dns.resolve4('google.com');
    res.json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Test server listening on port ${PORT}`);
});