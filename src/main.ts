// Ensure esbuild/Vite object spread helpers exist in all environments and workers
const g: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};
if (!g.__spreadValues) {
  g.__spreadValues = (a: any, b: any) => {
    if (!b) return a;
    for (const prop in b) {
      if (Object.prototype.hasOwnProperty.call(b, prop)) a[prop] = b[prop];
    }
    if (Object.getOwnPropertySymbols) {
      for (const sym of Object.getOwnPropertySymbols(b)) {
        if (Object.prototype.propertyIsEnumerable.call(b, sym)) a[sym] = b[sym];
      }
    }
    return a;
  };
}
if (!g.__spreadProps) {
  g.__spreadProps = (a: any, b: any) => Object.defineProperties(a, Object.getOwnPropertyDescriptors(b));
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
// import { provideHttpClient } from '@angular/common/http';
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
