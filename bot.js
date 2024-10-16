"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const client = new whatsapp_web_js_1.Client({
    authStrategy: new whatsapp_web_js_1.LocalAuth()
});
client.on('qr', (qr) => {
    // Генерируем QR-код для авторизации
    qrcode_terminal_1.default.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Клиент готов к работе!');
    // Здесь вы можете начать парсить сообщения
});
client.on('message', message => {
    console.log(`Сообщение из группы: ${message.body}`);
});
client.initialize();
