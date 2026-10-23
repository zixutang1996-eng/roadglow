import { readFileSync } from 'node:fs';
const VER = JSON.parse(readFileSync(new URL('./package.json', import.meta.url))).version;
process.env.VITE_APPVER = VER;
const BJ = ['beijing', 'shandong', 'shaanxi'].includes(process.env.VITE_EDITION);
export default { base: './', worker: { format: 'es' }, build: { target: BJ ? ['es2022', 'chrome89'] : 'es2022', chunkSizeWarningLimit: 1200 }, server: { host: '127.0.0.1', port: 18780 } };
