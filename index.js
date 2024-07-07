require('dotenv').config()
const {Bot} = require('grammy')

const bot = new Bot(process.env.BOT_API_KEY)

bot.command('start', async stx => {
    await stx.reply('Привет, давай пройдем небольшую аттестацию, проверим твои знания. За каждый правильный ответ ты получишь «печеньку»')
    await stx.reply("Напиши свое Имя и Фамилию")
})

bot.on("message", async (ctx) => {
    if(ctx.from.id === 556854763 || ctx.from.id === 1366486108) {
        await ctx.reply("Здравствуй, хозяин")
        return
    }
    const message = ctx.message; // the message object
    await ctx.reply(message.text + ", приятно познакомиться")
  });

bot.start()