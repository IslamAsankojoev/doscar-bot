import { Client, LocalAuth } from "whatsapp-web.js";
import { Bot, InputFile, InputMediaBuilder } from "grammy";
import qrcode from "qrcode-terminal";
import { InputMediaPhoto, InputMediaAudio, InputMediaDocument, InputMediaVideo } from "grammy/types";

const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
});

const bot = new Bot('7725321117:AAH0PLbmbiQ-A1NiaB9mksa5mlr8pPc_Mbg'); 

whatsappClient.on('qr', (qr) => {
    console.log('Сканируйте этот QR-код для авторизации в WhatsApp:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('error', (error) => {
    console.error('Ошибка WhatsApp:', error);
});


whatsappClient.on('ready', async () => {
    console.log('WhatsApp готов к использованию');
});

bot.command('whatsapp', async (ctx) => {
    const mark = ctx.message?.text?.split(' ')[1] || '';
    if(mark) return ctx.reply('/whatsapp <марка>');
    try { 
        const chats = await whatsappClient.getChats();
        if (chats.length === 0) {
            return;
        }

        for (const chat of chats) {
            const searchMessages = await whatsappClient.searchMessages(mark, {
                chatId: chat.id._serialized,
                limit: 10,
                page: 1,
            })
            const mediaGroup = [];
            let allText = '';  // Переменная для хранения текста сообщений
            let currentAuthor = null;  // Переменная для хранения автора сообщений

            for (const message of searchMessages) {
                // Устанавливаем текущего автора, если это первое сообщение
                if (!currentAuthor) {
                    currentAuthor = message.author;
                }

                // Проверяем, что автор сообщения совпадает
                if (message.author === currentAuthor) {
                    if (message.body && !message.hasMedia) {
                        allText += `${message.body}\n`;
                    } else if (message.hasMedia) {
                        try {
                            const media = await message.downloadMedia();

                            // Проверяем наличие данных
                            if (!media || !media.data) {
                                console.warn('Медиафайл не найден или не содержит данных:', media);
                                continue;
                            }

                            const buffer = Buffer.from(media.data, 'base64');
                            const photo = InputMediaBuilder.photo(new InputFile(buffer, media.filename || `file-${searchMessages.indexOf(message)}`));

                            // Добавляем только изображения в группу
                            if (media.mimetype.startsWith('image/')) {
                                if (mediaGroup.length < 10) {
                                    mediaGroup.push(photo);
                                }
                            } else {
                                console.log('Неподдерживаемый тип файла:', media.mimetype);
                            }
                        } catch (err) {
                            console.error('Ошибка при загрузке медиа:', err);
                            await ctx.reply('Ошибка при загрузке медиа.');
                        }
                    }
                }
            }

            // Отправляем медиа с текстом в caption, если есть медиафайлы
           if (mediaGroup.length > 0) {
                await ctx.replyWithMediaGroup(mediaGroup.map((media, index) => ({
                    ...media,
                    caption: index === 0 ? allText.trim() : '',  // Добавляем текст в первый медиафайл
                })));
            }
        }

    } catch (error) {
        console.error('Ошибка при получении сообщений:', error);
        await ctx.reply('Произошла ошибка при получении сообщений из WhatsApp.');
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
