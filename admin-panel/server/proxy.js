const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(bodyParser.json({ limit: '5mb' }))

const ADMIN_API_BASE = process.env.ADMIN_API_BASE || 'https://api.yessgo.org/api/v1'
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || null

if (!ADMIN_API_TOKEN) {
  console.warn('Warning: ADMIN_API_TOKEN is not set. Proxy requests to protected endpoints may fail.')
}

// Simple proxy for admin endpoints used by admin-panel frontend during development.
// POST /local-api/admin/partners -> forwarded to ${ADMIN_API_BASE}/admin/partners using server-side token
app.post('/local-api/admin/partners', async (req, res) => {
  try {
    const url = `${ADMIN_API_BASE}/admin/partners`
    const headers = {
      'Content-Type': 'application/json'
    }
    if (ADMIN_API_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_API_TOKEN}`

    const resp = await axios.post(url, req.body, { headers, timeout: 20000 })
    return res.status(resp.status).json(resp.data)
  } catch (err) {
    console.error('Proxy error POST /local-api/admin/partners:', err.message || err)
    if (err.response) {
      return res.status(err.response.status).json(err.response.data)
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
    console.error('Proxy error', req.method, req.path, err.message || err)
    if (err.response) {
      return res.status(err.response.status).json(err.response.data)
    }
    return res.status(502).json({ error: 'Bad Gateway', message: err.message })
  }
})

const port = process.env.PROXY_PORT || 3001
app.listen(port, () => {
  console.log(`Admin proxy listening on http://127.0.0.1:${port} -> ${ADMIN_API_BASE}`)
})


