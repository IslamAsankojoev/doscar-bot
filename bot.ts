import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    // Генерируем QR-код для авторизации
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Клиент готов к работе!');
    // Здесь вы можете начать парсить сообщения
});

client.on('message', message => {
    console.log(`Сообщение из группы: ${message.body}`);
});

client.initialize();
