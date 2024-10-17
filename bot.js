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
whatsappClient.on('error', (error) => {
    console.error('Ошибка WhatsApp:', error);
});
whatsappClient.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('WhatsApp готов к использованию');
}));
bot.command('whatsapp', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const mark = ((_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.split(' ')[1]) || '';
    if (mark)
        return ctx.reply('/whatsapp <марка>');
    try {
        const chats = yield whatsappClient.getChats();
        if (chats.length === 0) {
            return;
        }
        for (const chat of chats) {
            const searchMessages = yield whatsappClient.searchMessages(mark, {
                chatId: chat.id._serialized,
                limit: 10,
                page: 1,
            });
            const mediaGroup = [];
            let allText = ''; // Переменная для хранения текста сообщений
            let currentAuthor = null; // Переменная для хранения автора сообщений
            for (const message of searchMessages) {
                // Устанавливаем текущего автора, если это первое сообщение
                if (!currentAuthor) {
                    currentAuthor = message.author;
                }
                // Проверяем, что автор сообщения совпадает
                if (message.author === currentAuthor) {
                    if (message.body && !message.hasMedia) {
                        allText += `${message.body}\n`;
                    }
                    else if (message.hasMedia) {
                        try {
                            const media = yield message.downloadMedia();
                            // Проверяем наличие данных
                            if (!media || !media.data) {
                                console.warn('Медиафайл не найден или не содержит данных:', media);
                                continue;
                            }
                            const buffer = Buffer.from(media.data, 'base64');
                            const photo = grammy_1.InputMediaBuilder.photo(new grammy_1.InputFile(buffer, media.filename || `file-${searchMessages.indexOf(message)}`));
                            // Добавляем только изображения в группу
                            if (media.mimetype.startsWith('image/')) {
                                if (mediaGroup.length < 10) {
                                    mediaGroup.push(photo);
                                }
                            }
                            else {
                                console.log('Неподдерживаемый тип файла:', media.mimetype);
                            }
                        }
                        catch (err) {
                            console.error('Ошибка при загрузке медиа:', err);
                            yield ctx.reply('Ошибка при загрузке медиа.');
                        }
                    }
                }
            }
            // Отправляем медиа с текстом в caption, если есть медиафайлы
            if (mediaGroup.length > 0) {
                yield ctx.replyWithMediaGroup(mediaGroup.map((media, index) => (Object.assign(Object.assign({}, media), { caption: index === 0 ? allText.trim() : '' }))));
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
