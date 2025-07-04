// ❌ Incorrecte per a modules CommonJS
// import { Client, LocalAuth } from 'whatsapp-web.js';

// ✅ Correcte
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import qrcode from 'qrcode-terminal';
import fetch from 'node-fetch';

const API_BASE = 'https://bdnmedia.cat/apiduna.php';
const USUARI_ID = 1;

// Autoritzats a fer servir el bot (substitueix per les teves IDs)
const allowedChats = ['34611223344@c.us', '34666777888@c.us'];

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneja el codi QR amb el teu mòbil per connectar.');
});

client.on('ready', () => {
    console.log('✅ Bot connectat correctament a WhatsApp.');
});

client.on('message', async msg => {
    const senderId = msg.from;
    if (!allowedChats.includes(senderId)) {
        console.log(`Ignorat missatge de ${senderId}`);
        return;
    }

    const raw = msg.body.trim();
    const hora = parseHora(raw);
    if (!hora) return;

    try {
        const res = await fetch(`${API_BASE}?usuari_id=${USUARI_ID}&hora=${hora}`);
        const data = await res.json();

        console.log(`[${new Date().toISOString()}] Missatge: ${raw} → API: ${data.message}`);

        const afegida = data.message.toLowerCase().includes("afegida");
        const resposta = `${afegida ? '✅ Afegida correctament' : '❌ Eliminada correctament'}`;

        const avui = await fetch(`${API_BASE}?usuari_id=${USUARI_ID}&mode=avui`);
        const hores = await avui.json();

        const formatades = hores
            .map(h => h.hora)
            .sort()
            .map(h => h === hora ? `*${h}*` : `_${h}_`);
        const llista = formatades.join(', ');

        await msg.reply(`⏱️ Hora *${hora}*\n${resposta}\n\nHores vistes avui (${hores.length}): ${llista}`);
    } catch (err) {
        console.error(`[ERROR] ${err}`);
        msg.reply('⚠️ Error de connexió amb l’API.');
    }
});

function parseHora(str) {
    const cleaned = str.replace(/[^0-9]/g, '');
    if (cleaned.length === 4) {
        const hh = cleaned.substring(0, 2);
        const mm = cleaned.substring(2, 4);
        if (parseInt(hh) < 24 && parseInt(mm) < 60) {
            return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
        }
    }
    return null;
}

client.initialize();
