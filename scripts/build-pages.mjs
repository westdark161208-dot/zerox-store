import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
// Explicit application entrypoints. Never publish cloudflare/, tests/, docs/ or .git/.
const files = [
  'purchase-receipt.css', 'product-payment.html', 'product-payment.js', 'system-holograms.js', 'header-wallet.js', 'wallet-payment.html', 'wallet-payment.js',
  'founder-balances.js', 'provider-intelligence.js','delivery-readiness.js','ra-associations.js', 'control-visuals.js', 'providers-panel.js', 'console.css', 'panel-theme.css', 'wallet-view.js',
  'regional-config.js', 'region-selector.js', 'region-selector.css',
  'security.html', 'security.js', 'security.css',
  'control.html', 'control.js', 'control.css', 'control-finance.js',
  'editor-elements.js', 'store-editor.js', 'store-editor.css',
  'payment-test.html', 'payment-test.js', 'index.html', 'admin.html', 'manage.html', 'profile.html',
  'app.js', 'diamonds.js', 'diamond-catalog.js', 'diamond-collection.js',
  'payments-config.js', 'resellers.js', 'resellers-admin.js', 'manage.js', 'profile.js',
  'styles.css', 'diamond-collection.css', 'responsive.css', 'manage.css', 'profile.css',
  'manifest.json', 'service-worker.js'
];
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of files) await cp(join(root, file), join(out, file));
// Media only: new source/config files cannot accidentally enter the public build.
const media = /\.(png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|otf|mp4|webm|mp3|ogg)$/i;
let count = files.length;
async function copyMedia(dir, relative = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = join(relative, entry.name);
    if (entry.isDirectory() && (relative || entry.name === 'assets')) await copyMedia(join(dir, entry.name), rel);
    else if (entry.isFile() && media.test(entry.name)) {
      const info = await stat(join(root, rel));
      if (info.size > 25 * 1024 * 1024) throw new Error(`Asset exceeds Pages file limit: ${rel}`);
      await mkdir(join(out, relative), { recursive: true });
      await cp(join(root, rel), join(out, rel)); count++;
    }
  }
}
await copyMedia(root);
console.log(`Public build ready: dist/ (${count} files). Backend and recipes excluded.`);
