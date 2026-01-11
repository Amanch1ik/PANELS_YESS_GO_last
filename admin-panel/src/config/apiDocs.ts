export const API_DOCS_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    adminLogin: '/admin/auth/login',
    refresh: '/auth/refresh',
    token: '/auth/token',
    oauthToken: '/oauth/token'
  },
  partners: {
    list: '/partners/list',
    byId: (id: string|number) => `/partners/${id}`,
    products: {
      list: (partnerId: string|number) => `/partners/${partnerId}/products`,
      create: (partnerId: string|number) => `/partners/${partnerId}/products`,
      update: (partnerId: string|number, productId: string|number) => `/partners/${partnerId}/products/${productId}`,
      delete: (partnerId: string|number, productId: string|number) => `/partners/${partnerId}/products/${productId}`,
      images: (partnerId: string|number, productId: string|number) => `/partners/${partnerId}/products/${productId}/images`
    }
  },
  products: {
    // use promotions endpoint for admin product listing when backend exposes promotions
    list: '/promotions',
    create: '/promotions',
    update: (id: string|number) => `/products/${id}`,
    delete: (id: string|number) => `/products/${id}`,
    images: (id: string|number) => `/products/${id}/images`
  },
  messages: {
    list: '/messages'
  },
  users: {
    // Admin users endpoint
    list: '/admin/users'
  },
}


