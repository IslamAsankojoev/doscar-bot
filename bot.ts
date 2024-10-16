// @ts-nocheck
import { Client, LocalAuth } from "whatsapp-web.js";
import { Bot } from "grammy";
import qrcode from "qrcode-terminal";
import fs from 'fs';
import path from 'path';

const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
});

const bot = new Bot('7725321117:AAH0PLbmbiQ-A1NiaB9mksa5mlr8pPc_Mbg'); 

whatsappClient.on('qr', (qr) => {
    console.log('Сканируйте этот QR-код для авторизации в WhatsApp:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp готов к использованию');
});

whatsappClient.on('error', (error) => {
    console.error('Ошибка WhatsApp:', error);
});

whatsappClient.on('message', (message) => {
    console.log(message.body);
});

bot.command('whatsapp', async (ctx) => {
    try {
        const chats = await whatsappClient.getChats();
        if (chats.length === 0) {
            return ctx.reply('В WhatsApp нет активных чатов.');
        }

        const lastChat = chats[1];
        const messages = await lastChat.fetchMessages({limit: 50});

        for (const msg of messages) {
            const date = new Date(msg.timestamp * 1000).toLocaleString();
            const sender = msg.fromMe ? 'Вы' : msg.author || msg.from || 'Контакт';

            if (msg.hasMedia) {
                const media = await msg.downloadMedia(); // Загружаем медиафайл
        
                // Проверяем, что медиафайл успешно загружен
                if (media) {
                    // Создаем путь для сохранения файла
                    const fileName = `whatsapp_image_${Date.now()}.${media.mimetype.split('/')[1]}`;
                    const filePath = path.join(__dirname, 'images', fileName);
        
                    // Записываем файл на диск
                    fs.writeFile(filePath, media.data, 'base64', (err) => {
                        if (err) {
                            console.error('Ошибка при сохранении файла:', err);
                        } else {
                            console.log(`Файл сохранен: ${filePath}`);
                        }
                    });
                } else {
                    console.error('Ошибка: не удалось загрузить медиафайл.');
                }
            }
        
        }

    } catch (error) {
        console.error('Ошибка при получении сообщений:', error);
        ctx.reply('Произошла ошибка при получении сообщений из WhatsApp.');
    }
});


bot.command('start', (ctx) => {
    ctx.reply('Привет! Отправь /whatsapp, чтобы получить последние сообщения из WhatsApp.');
});

whatsappClient.on('ready', () => {
    console.log('Запускаем Telegram-бота');
    bot.start();
});

whatsappClient.initialize();
