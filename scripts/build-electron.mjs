// Zabalí hlavní proces Electronu (včetně lokálního API a SDK) do jednoho souboru.
import { build } from 'esbuild';

await build({
  entryPoints: ['electron/main.ts'],
  outfile: 'dist-electron/main.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  sourcemap: false,
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
});
