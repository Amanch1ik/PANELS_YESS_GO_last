export const API_DOCS_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    adminLogin: '/admin/auth/login',
    refresh: '/auth/refresh',
    token: '/auth/token',
    oauthToken: '/oauth/token'
  },
  partners: {
    list: '/partners',
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
    list: '/products',
    create: '/products',
    update: (id: string|number) => `/products/${id}`,
    delete: (id: string|number) => `/products/${id}`,
    images: (id: string|number) => `/products/${id}/images`
  },
  messages: {
    list: '/messages'
  },
  users: {
    list: '/users'
  },
}


