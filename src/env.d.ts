/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_API_BASE_URL: string; readonly VITE_HOST: string; readonly VITE_PORT: string }
interface ImportMeta { readonly env: ImportMetaEnv }
declare const __APP_ENV__: string
declare const __API_BASE_URL__: string
