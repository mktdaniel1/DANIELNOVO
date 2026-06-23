/**
 * Remove TODOS os webhooks ativos do 2chat (limpa pra reassinar do zero).
 * Roda: npm run unsubscribe
 */
import 'dotenv/config';

const KEY = process.env.TWOCHAT_API_KEY;
if (!KEY) {
  console.error('TWOCHAT_API_KEY não definida');
  process.exit(1);
}

const BASE = 'https://api.p.2chat.io/open';

async function call(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'X-User-API-Key': KEY, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, raw: text.slice(0, 400) }; }
}

async function run() {
  // tenta dois endpoints porque o 2chat varia
  const paths = ['/webhooks/get-list', '/webhooks/list', '/webhooks'];
  let webhooks = [];

  for (const p of paths) {
    const r = await call(p);
    if (r.status === 200 && r.data) {
      const lista = r.data.data || r.data.webhooks || r.data;
      if (Array.isArray(lista) && lista.length > 0) {
        webhooks = lista;
        console.log(`[list] endpoint ${p} retornou ${lista.length} webhook(s)`);
        break;
      }
    }
  }

  if (webhooks.length === 0) {
    console.log('Nenhum webhook ativo encontrado (ou endpoint de listagem mudou). Veja o painel do 2chat.');
    return;
  }

  for (const w of webhooks) {
    const uuid = w.uuid || w.id;
    if (!uuid) continue;
    const r = await call(`/webhooks/unsubscribe/${uuid}`, 'DELETE');
    console.log(`[unsubscribe] ${uuid} (${w.event_name || w.event}) -> status ${r.status}`);
  }
}

run().catch((e) => console.error('erro:', e.message));
