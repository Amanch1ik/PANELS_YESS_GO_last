const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(bodyParser.json({ limit: '5mb' }))

const ADMIN_API_BASE = process.env.ADMIN_API_BASE || 'https://api.yessgo.org/api/v1'
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || null
const ADMIN_API_MOCK = process.env.ADMIN_API_MOCK === 'true'

if (!ADMIN_API_TOKEN && !ADMIN_API_MOCK) {
  console.warn('Warning: ADMIN_API_TOKEN is not set. Proxy requests to protected endpoints may fail.')
}

// If mock mode is enabled, we will store simple data in a file under server/mock_db.json
const MOCK_DB_PATH = path.join(__dirname, 'mock_db.json')
if (ADMIN_API_MOCK) {
  // ensure mock DB exists
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify({ partners: [] }, null, 2), 'utf8')
    }
  } catch (err) {
    console.error('Failed to initialize mock DB:', err)
  }
}

// Simple proxy for admin endpoints used by admin-panel frontend during development.
// POST /local-api/admin/partners -> forwarded to ${ADMIN_API_BASE}/admin/partners using server-side token
app.post('/local-api/admin/partners', async (req, res) => {
  try {
    if (ADMIN_API_MOCK) {
      // Create partner in mock DB
      const raw = fs.readFileSync(MOCK_DB_PATH, 'utf8')
      const db = JSON.parse(raw || '{"partners": []}')
      const id = Date.now()
      const partner = { id, ...req.body, created_at: new Date().toISOString() }
      db.partners.push(partner)
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2), 'utf8')
      return res.status(201).json(partner)
    }

    const url = `${ADMIN_API_BASE}/admin/partners`
    const headers = {
      'Content-Type': 'application/json'
    }
    if (ADMIN_API_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_API_TOKEN}`

    const resp = await axios.post(url, req.body, { headers, timeout: 20000 })
    return res.status(resp.status).json(resp.data)
  } catch (err) {
    try {
      const status = err.response?.status
      const data = err.response?.data
      console.error('Proxy error POST /local-api/admin/partners:', 'status=', status, 'body=', data || err.message)
      if (status) return res.status(status).json(data)
    } catch (logErr) {
      console.error('Proxy logging failure', logErr)
    }
    return res.status(502).json({ error: 'Bad Gateway', message: err.message })
  }
})

// Generic proxy route (optional) - forwards any local-api request to ADMIN_API_BASE
app.use('/local-api', async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/?/, '/')
    const url = `${ADMIN_API_BASE}${targetPath}`
    const method = req.method.toLowerCase()
    const headers = { ...req.headers }
    if (ADMIN_API_TOKEN) headers['authorization'] = `Bearer ${ADMIN_API_TOKEN}`
    // Remove host header to avoid conflicts
    delete headers.host

    const axiosConfig = {
      url,
      method,
      headers,
      params: req.query,
      data: req.body,
      timeout: 20000
    }
    const resp = await axios(axiosConfig)
    return res.status(resp.status).json(resp.data)
  } catch (err) {
    try {
      const status = err.response?.status
      const data = err.response?.data
      console.error('Proxy error', req.method, req.path, 'status=', status, 'body=', data || err.message)
      if (status) return res.status(status).json(data)
    } catch (logErr) {
      console.error('Proxy logging failure', logErr)
    }
    return res.status(502).json({ error: 'Bad Gateway', message: err.message })
  }
})

const port = process.env.PROXY_PORT || 3001
app.listen(port, () => {
  console.log(`Admin proxy listening on http://127.0.0.1:${port} -> ${ADMIN_API_BASE}`)
})


