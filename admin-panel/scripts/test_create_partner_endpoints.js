const axios = require('axios')
const proxyBase = 'http://127.0.0.1:3001/local-api'

const endpoints = [
  '/admin/partners',
  '/partners',
  '/api/admin/partners',
  '/partner/create',
  '/partners/create',
  '/api/partners',
  '/v1/partners',
  '/partner',
  '/partner/new',
  '/partners/new',
  '/partner/add',
  '/partners/add',
  '/admin/partner',
  '/admin/partner/create',
  '/api/v1/partners',
  '/api/partner',
  '/api/partner/create',
  '/partner/store',
  '/partners/store',
  '/partner/save',
  '/partners/save',
  '/admin/partners/store',
  '/api/admin/partners/create',
  '/api/v1/admin/partners',
  '/admin/api/partners',
  '/partner/api/create',
  '/partner/management/create',
  '/business/partners',
  '/business/partner/create'
]

const body = {
  name: `test_partner_${Date.now()}`,
  category: 'Кафе',
  phone: '+996500000000',
  email: 'test+proxy@yessgo.local',
  password: 'TempPass123'
}

async function tryEndpoint(ep, method) {
  const url = `${proxyBase}${ep}`
  try {
    const resp = await axios({
      method,
      url,
      data: body,
      timeout: 20000,
      headers: { 'Content-Type': 'application/json' }
    })
    return { endpoint: ep, method, status: resp.status, data: resp.data }
  } catch (err) {
    if (err.response) {
      return { endpoint: ep, method, status: err.response.status, data: err.response.data }
    }
    return { endpoint: ep, method, status: 'ERR', data: String(err.message) }
  }
}

(async () => {
  console.log('Starting endpoint probe:', new Date().toISOString())
  for (const ep of endpoints) {
    for (const method of ['post','put']) {
      const res = await tryEndpoint(ep, method)
      console.log(JSON.stringify(res))
      // if success (2xx) stop early
      if (typeof res.status === 'number' && res.status >= 200 && res.status < 300) {
        console.log('SUCCESS, stopping further probes.')
        process.exit(0)
      }
    }
  }
  console.log('Probe finished')
  process.exit(0)
})().catch(e => { console.error('Fatal', e); process.exit(2) })

