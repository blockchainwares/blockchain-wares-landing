/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    isAuthenticated: boolean;
  }
}

/** Skrot SHA deployu albo "dev" — wstrzykiwany przez `vite.define` w astro.config.mjs. */
declare const __APP_VERSION__: string;
