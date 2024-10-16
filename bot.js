"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const grammy_1 = require("grammy");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const whatsappClient = new whatsapp_web_js_1.Client({
    authStrategy: new whatsapp_web_js_1.LocalAuth(),
});
const bot = new grammy_1.Bot('7725321117:AAH0PLbmbiQ-A1NiaB9mksa5mlr8pPc_Mbg');
whatsappClient.on('qr', (qr) => {
    console.log('Сканируйте этот QR-код для авторизации в WhatsApp:');
    qrcode_terminal_1.default.generate(qr, { small: true });
});
bot.command('whatsapp', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('whatsapp command');
    // const mark = ctx.message?.text?.split(' ')[1];
    // if(!mark) return;
    try {
        const chats = yield whatsappClient.getChats();
        if (chats.length === 0) {
            return;
        }
        const chatId = chats[0].id._serialized;
        const searchMessages = yield chats[0].fetchMessages({ limit: 10 });
        // await whatsappClient.searchMessages(mark, { 
        //     chatId: chatId,
        //     limit: 200,
        //  });
        searchMessages.forEach((message, index) => __awaiter(void 0, void 0, void 0, function* () {
            if (message.hasMedia) {
                console.log('Загружаем медиа:', message.id);
                try {
                    const media = yield message.downloadMedia();
                    const buffer = Buffer.from(media.data, 'base64');
                    if (media.mimetype.startsWith('image/')) {
                        yield ctx.replyWithPhoto(new grammy_1.InputFile(buffer, `image-${index}.jpg`), { caption: `${message.author || message.from}` });
                    }
                    else {
                        yield ctx.replyWithDocument(new grammy_1.InputFile(buffer, media.filename || `file-${index}`), { caption: `${message.author || message.from}` });
                    }
                }
                catch (err) {
                    console.error('Ошибка при загрузке медиа:', err);
                    ctx.reply('Ошибка при загрузке медиа.');
                }
            }
            else {
                ctx.reply(`${message.author || message.from}: ${message.body}`);
            }
        }));
    }
    catch (error) {
        console.error('Ошибка при получении сообщений:', error);
        ctx.reply('Произошла ошибка при получении сообщений из WhatsApp.');
    }
}));
whatsappClient.on('error', (error) => {
    console.error('Ошибка WhatsApp:', error);
});
bot.command('whatsapp', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('whatsapp command');
    try {
        const chats = yield whatsappClient.getChats();
        if (chats.length === 0) {
            return;
        }
        const chat = chats[0];
        const searchMessages = yield chat.fetchMessages({ limit: 50 });
        // Объект для группировки сообщений по mediaGroupId
        const mediaGroups = {};
        // Перебираем сообщения и группируем их
        for (const message of searchMessages) {
            if (message.hasMedia) {
                // Получаем mediaGroupId или используем уникальный id для отдельных медиа
                const groupId = '2';
                if (!mediaGroups[groupId]) {
                    mediaGroups[groupId] = [];
                }
                mediaGroups[groupId].push(message);
            }
            else {
                // Обработка текстовых сообщений или сообщений без медиа
                yield ctx.reply(`${message.author || message.from}: ${message.body}`);
            }
        }
        // Обрабатываем каждую группу медиа
        for (const groupId in mediaGroups) {
            const messagesInGroup = mediaGroups[groupId];
            const mediaArray = [];
            for (const message of messagesInGroup) {
                try {
                    const media = yield message.downloadMedia();
                    const buffer = Buffer.from(media.data, 'base64');
                    let inputMedia;
                    if (media.mimetype.startsWith('image/')) {
                        inputMedia = {
                            type: 'photo',
                            media: new grammy_1.InputFile(buffer),
                            caption: `${message.author || message.from}`,
                        };
                    }
                    else if (media.mimetype.startsWith('video/')) {
                        inputMedia = {
                            type: 'video',
                            media: new grammy_1.InputFile(buffer),
                            caption: `${message.author || message.from}`,
                        };
                    }
                    else {
                        // Для других типов файлов можно отправить их отдельно
                        yield ctx.replyWithDocument(new grammy_1.InputFile(buffer, media.filename || 'file'), { caption: `${message.author || message.from}` });
                        continue;
                    }
                    mediaArray.push(inputMedia);
                }
                catch (err) {
                    console.error('Ошибка при загрузке медиа:', err);
                    yield ctx.reply('Ошибка при загрузке медиа.');
                }
            }
            if (mediaArray.length > 0) {
                try {
                    // Telegram позволяет отправлять максимум 10 медиа в одном альбоме
                    const chunks = [];
                    for (let i = 0; i < mediaArray.length; i += 10) {
                        chunks.push(mediaArray.slice(i, i + 10));
                    }
                    for (const chunk of chunks) {
                        yield ctx.replyWithMediaGroup(chunk);
                    }
                }
                catch (err) {
                    console.error('Ошибка при отправке медиа-группы:', err);
                    yield ctx.reply('Ошибка при отправке медиа-группы.');
                }
            }
        }
    }
    catch (error) {
        console.error('Ошибка при получении сообщений:', error);
        yield ctx.reply('Произошла ошибка при получении сообщений из WhatsApp.');
    }
}));
bot.command('start', (ctx) => {
    ctx.reply('Привет! Отправь /whatsapp, чтобы получить последние сообщения из WhatsApp.');
});
whatsappClient.on('ready', () => {
    console.log('Запускаем Telegram-бота');
    bot.start();
});
whatsappClient.initialize();
