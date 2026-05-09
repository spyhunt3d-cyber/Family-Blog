const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Generate Ghost Admin API JWT ──────────────────────────────
function getAdminToken() {
  const [id, secret] = process.env.GHOST_ADMIN_API_KEY.split(':');
  return jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/admin/'
  });
}

function ghostHeaders() {
  return {
    'Authorization': `Ghost ${getAdminToken()}`,
    'Content-Type': 'application/json',
    'Accept-Version': 'v5.0'
  };
}

const GHOST = process.env.GHOST_URL;

// ── GET /posts — list user's posts ───────────────────────────
router.get('/posts', async (req, res) => {
  try {
    const response = await fetch(
      `${GHOST}/ghost/api/admin/posts/?limit=50&order=updated_at+desc&fields=id,title,status,visibility,updated_at,published_at,feature_image`,
      { headers: ghostHeaders() }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /posts/:id — get single post ─────────────────────────
router.get('/posts/:id', async (req, res) => {
  try {
    const response = await fetch(
      `${GHOST}/ghost/api/admin/posts/${req.params.id}/?formats=html&source=html`,
      { headers: ghostHeaders() }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /posts — create post ─────────────────────────────────
router.post('/posts', async (req, res) => {
  try {
    const { title, html, status, visibility, feature_image, tags, excerpt } = req.body;

    const post = {
      title: title || 'Untitled',
      html: html || '',
      status: status || 'draft',
      visibility: visibility || 'members',
      feature_image: feature_image || null,
      custom_excerpt: excerpt || null,
      tags: tags ? tags.map(t => ({ name: t })) : []
    };

    const response = await fetch(`${GHOST}/ghost/api/admin/posts/?source=html`, {
      method: 'POST',
      headers: ghostHeaders(),
      body: JSON.stringify({ posts: [post] })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /posts/:id — update post ──────────────────────────────
router.put('/posts/:id', async (req, res) => {
  try {
    const { title, html, status, visibility, feature_image, tags, excerpt, updated_at } = req.body;

    const post = {
      title,
      html,
      status,
      visibility,
      feature_image: feature_image || null,
      custom_excerpt: excerpt || null,
      tags: tags ? tags.map(t => ({ name: t })) : [],
      updated_at
    };

    const response = await fetch(`${GHOST}/ghost/api/admin/posts/${req.params.id}/?formats=html&source=html`, {
      method: 'PUT',
      headers: ghostHeaders(),
      body: JSON.stringify({ posts: [post] })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /posts/:id — delete post ──────────────────────────
router.delete('/posts/:id', async (req, res) => {
  try {
    await fetch(`${GHOST}/ghost/api/admin/posts/${req.params.id}/`, {
      method: 'DELETE',
      headers: ghostHeaders()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /images — upload image ───────────────────────────────
router.post('/images', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    form.append('purpose', 'image');

    const token = getAdminToken();
    const response = await fetch(`${GHOST}/ghost/api/admin/images/upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Ghost ${token}`,
        'Accept-Version': 'v5.0',
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /tags — list tags ─────────────────────────────────────
router.get('/tags', async (req, res) => {
  try {
    const response = await fetch(
      `${GHOST}/ghost/api/admin/tags/?limit=all&fields=id,name`,
      { headers: ghostHeaders() }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /me — current session member ─────────────────────────
router.get('/me', (req, res) => {
  res.json({ member: req.session.member });
});

module.exports = router;
