import 'dotenv/config';

const API = 'https://api.p.2chat.io/open/webhooks/subscribe';
const KEY = process.env.TWOCHAT_API_KEY;
const CHANNEL_UUID = process.env.TWOCHAT_CHANNEL_UUID;
const BASE = process.env.TWOCHAT_WEBHOOK_BASE_URL;
// Número do canal monitorado (formato E.164, ex: +5511999998888)
// Aceita BOT_PHONE_NUMBERS (pode conter vários separados por vírgula — usa o primeiro)
const ON_NUMBER = (process.env.TWOCHAT_ON_NUMBER
  || (process.env.BOT_PHONE_NUMBERS || '').split(',')[0]
  || '').trim();

if (!KEY || !BASE) {
  console.error('Defina TWOCHAT_API_KEY e TWOCHAT_WEBHOOK_BASE_URL no .env');
  process.exit(1);
}
if (!ON_NUMBER) {
  console.error('Defina TWOCHAT_ON_NUMBER (ex: +5511999998888) — número do canal Alice conectado no 2chat');
  process.exit(1);
}

const HOOK_URL = `${BASE.replace(/\/+$/, '')}/webhook/2chat`;

// Eventos do 2chat que vamos assinar.
// Doc: https://developers.2chat.co/docs/API/WhatsApp/Web/webhooks/subscribe
const EVENTOS = [
  // Mensagens em conversas privadas (1-a-1)
  'whatsapp.message.received',
  'whatsapp.message.sent',
  'whatsapp.message.reaction',
  // Mensagens em GRUPOS (essencial pra Growper — clientes estão nos grupos)
  'whatsapp.group.message.received',
  'whatsapp.group.message.reaction'
];

async function subscribe(event) {
  const url = `${API}/${event}`;
  const body = {
    hook_url: HOOK_URL,
    on_number: ON_NUMBER
  };
  if (CHANNEL_UUID) body.waweb_uuid = CHANNEL_UUID;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-User-API-Key': KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  console.log(`[${event}] status ${res.status} -> ${text.slice(0, 200)}`);
}

async function run() {
  console.log(`[config] monitorando número: ${ON_NUMBER}`);
  console.log(`[config] webhook URL: ${HOOK_URL}`);
  for (const ev of EVENTOS) {
    try {
      await subscribe(ev);
    } catch (err) {
      console.error(`Falha em ${ev}:`, err.message);
    }
  }
}

run();
