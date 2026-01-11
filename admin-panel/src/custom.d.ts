declare module '*.svg'
declare module '*?url'

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_BASE?: string
  readonly VITE_DIRECT_API?: string
  readonly DEV?: boolean
  // add other env vars here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}








