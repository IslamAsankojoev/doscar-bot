import { Client, LocalAuth } from "whatsapp-web.js";
import { Bot, InputFile } from "grammy";
import qrcode from "qrcode-terminal";

const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
});

const bot = new Bot('7725321117:AAH0PLbmbiQ-A1NiaB9mksa5mlr8pPc_Mbg'); 

whatsappClient.on('qr', (qr) => {
    console.log('Сканируйте этот QR-код для авторизации в WhatsApp:');
    qrcode.generate(qr, { small: true });
});

bot.command('whatsapp', async (ctx) => {
    console.log('whatsapp command');
    // const mark = ctx.message?.text?.split(' ')[1];
    // if(!mark) return;
    try { 
        const chats = await whatsappClient.getChats();
        if (chats.length === 0) {
            return;
        }
    
        const chatId = chats[0].id._serialized;
        const searchMessages = await chats[0].fetchMessages({ limit: 10 });
        // await whatsappClient.searchMessages(mark, { 
        //     chatId: chatId,
        //     limit: 200,
        //  });

            searchMessages.forEach(async (message, index) => {
            if (message.hasMedia) {
                console.log('Загружаем медиа:', message.id);
                try {
                    const media = await message.downloadMedia();
                    const buffer = Buffer.from(media.data, 'base64');

                    if (media.mimetype.startsWith('image/')) {
                        await ctx.replyWithPhoto(new InputFile(buffer, `image-${index}.jpg`), { caption: `${message.author || message.from}` });
                    } else {
                        await ctx.replyWithDocument(new InputFile(buffer, media.filename || `file-${index}`), { caption: `${message.author || message.from}` });
                    }
                } catch (err) {
                    console.error('Ошибка при загрузке медиа:', err);
                    ctx.reply('Ошибка при загрузке медиа.');
                }
            } else {
                ctx.reply(`${message.author || message.from}: ${message.body}`);
            }
        });

    } catch (error) {
        console.error('Ошибка при получении сообщений:', error);
        ctx.reply('Произошла ошибка при получении сообщений из WhatsApp.');
    }
});


whatsappClient.on('error', (error) => {
    console.error('Ошибка WhatsApp:', error);
});

bot.command('whatsapp', async (ctx) => {
    console.log('whatsapp command');
    try { 
        const chats = await whatsappClient.getChats();
        if (chats.length === 0) {
            return;
        }
    
        const chat = chats[0];
        const searchMessages = await chat.fetchMessages({ limit: 50 });

        // Объект для группировки сообщений по mediaGroupId
        const mediaGroups = {} as Record<string, any[]>;

        // Перебираем сообщения и группируем их
        for (const message of searchMessages) {
            if (message.hasMedia) {
                // Получаем mediaGroupId или используем уникальный id для отдельных медиа
                const groupId = '2';

                if (!mediaGroups[groupId]) {
                    mediaGroups[groupId] = [];
                }
                mediaGroups[groupId].push(message);
            } else {
                // Обработка текстовых сообщений или сообщений без медиа
                await ctx.reply(`${message.author || message.from}: ${message.body}`);
            }
        }

        // Обрабатываем каждую группу медиа
        for (const groupId in mediaGroups) {
            const messagesInGroup = mediaGroups[groupId];
            const mediaArray = [];

            for (const message of messagesInGroup) {
                try {
                    const media = await message.downloadMedia();
                    const buffer = Buffer.from(media.data, 'base64');

                    let inputMedia;
                    if (media.mimetype.startsWith('image/')) {
                        inputMedia = {
                            type: 'photo',
                            media: new InputFile(buffer),
                            caption: `${message.author || message.from}`,
                        };
                    } else if (media.mimetype.startsWith('video/')) {
                        inputMedia = {
                            type: 'video',
                            media: new InputFile(buffer),
                            caption: `${message.author || message.from}`,
                        };
                    } else {
                        // Для других типов файлов можно отправить их отдельно
                        await ctx.replyWithDocument(new InputFile(buffer, media.filename || 'file'), { caption: `${message.author || message.from}` });
                        continue;
                    }

                    mediaArray.push(inputMedia);
                } catch (err) {
                    console.error('Ошибка при загрузке медиа:', err);
                    await ctx.reply('Ошибка при загрузке медиа.');
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
                        await ctx.replyWithMediaGroup(chunk as any);
                    }
                } catch (err) {
                    console.error('Ошибка при отправке медиа-группы:', err);
                    await ctx.reply('Ошибка при отправке медиа-группы.');
                }
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
