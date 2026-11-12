/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Sarvam AI subscription key for the site assistant.
   *
   * Anything prefixed VITE_ is compiled into the client bundle, so this key is
   * public by construction — that is accepted here because the site has no
   * backend to hide it behind. It lives in `.env.local` (gitignored) and never
   * in a committed file. See src/lib/sarvam.ts.
   */
  readonly VITE_SARVAM_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
