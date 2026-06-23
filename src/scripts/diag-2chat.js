/**
 * Diagnóstico 2chat — lista canais conectados e webhooks ativos.
 * Roda no Console do Railway: node src/scripts/diag-2chat.js
 */
import 'dotenv/config';

const KEY = process.env.TWOCHAT_API_KEY;
if (!KEY) {
  console.error('TWOCHAT_API_KEY não definida');
  process.exit(1);
}

const BASE = 'https://api.p.2chat.io/open';

async function call(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-User-API-Key': KEY }
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, raw: text.slice(0, 500) }; }
}

async function listarCanais() {
  console.log('\n========= CANAIS CONECTADOS =========');
  // 2chat costuma expor em /whatsapp/get-numbers
  const r = await call('/whatsapp/get-numbers');
  console.log(`status: ${r.status}`);
  if (r.data) {
    const lista = r.data.data || r.data;
    if (Array.isArray(lista)) {
      lista.forEach((c) => {
        const status = c.status || c.connection_status || '?';
        const numero = c.friendly_name || c.number || c.phone || c.session_key || '?';
        const uuid = c.uuid || c.id || '?';
        console.log(`  - ${numero} | status: ${status} | uuid: ${uuid}`);
      });
    } else {
      console.log('  Resposta:', JSON.stringify(r.data).slice(0, 400));
    }
  } else {
    console.log('  Raw:', r.raw);
  }
}

async function listarWebhooks() {
  console.log('\n========= WEBHOOKS ATIVOS =========');
  // 2chat costuma expor em /webhooks/list
  const r = await call('/webhooks/list');
  console.log(`status: ${r.status}`);
  if (r.data) {
    const lista = r.data.data || r.data;
    if (Array.isArray(lista)) {
      if (lista.length === 0) {
        console.log('  (nenhum webhook)');
      } else {
        lista.forEach((w) => {
          console.log(`  - ${w.event_name || w.event} -> ${w.hook_url}`);
          console.log(`    uuid: ${w.uuid} | on_number: ${w.on_number || '-'} | status: ${w.status || w.enabled}`);
        });
      }
    } else {
      console.log('  Resposta:', JSON.stringify(r.data).slice(0, 400));
    }
  } else {
    console.log('  Raw:', r.raw);
  }
}

async function run() {
  await listarCanais();
  await listarWebhooks();
  console.log('\n========= FIM =========');
}

run().catch((e) => console.error('erro:', e.message));
