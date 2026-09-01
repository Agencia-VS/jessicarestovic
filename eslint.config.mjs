import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * `eslint-config-next` 16 ya publica configuración plana, así que se extiende
 * directo, sin el shim de compatibilidad.
 */
const config = [
  ...coreWebVitals,
  ...nextTypescript,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
