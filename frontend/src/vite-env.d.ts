/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Spring Boot REST API (architecture.md §7). */
  readonly VITE_API_URL?: string;
  /** App display name used in the document title / UI headers. */
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
