// Vygeneruje SHA-256 hash hesla pro .env (VITE_APP_PASSWORD_HASH) nebo src/config.ts.
// Použití:  npm run hash-password -- "MojeNoveHeslo"
import { createHash } from 'node:crypto';

const pw = process.argv[2];
if (!pw) {
  console.error('Použití: npm run hash-password -- "MojeNoveHeslo"');
  process.exit(1);
}
const hash = createHash('sha256').update(pw, 'utf8').digest('hex');
console.log(`\nSHA-256 hash:\n${hash}\n\nDo souboru .env vložte:\nVITE_APP_PASSWORD_HASH=${hash}\n`);
