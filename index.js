require('dotenv').config()
const sequelize = require('./db')
const { UserModel, AttestationModel, ResultModel } = require('./models')

const {Bot, InlineKeyboard} = require('grammy')
// Импровизированная база данных
const db = [
    {
      label: 'В какие блюда входит болгарский перец?',
      data: [
        'Шаурма мини и вегетарианская шаурма',
        'Шаурма фитнес и греческий салат',
        'Греческий салат и вегетарианская шаурма',
        'Салат цезарь и деревенская шаурма'
      ],
      sucs: 2
    },
    {
      label: 'Сколько шагов сервиса мы используем?',
      data: [ '5', '7', '17', '3' ],
      sucs: 1
    },
    {
      label: 'Какая основа у адыгейской шаурмы?',
      data: [
        'пшеничная тортилья',
        'большой лаваш',
        'маленький лаваш',
        'сырная тортилья'
      ],
      sucs: 4
    }
  ]
const bot = new Bot(process.env.BOT_API_KEY)

bot.api.setMyCommands([
    {
        command: 'attestation',
        description: 'Пройти аттестацию'
    }
])

// Подключение  к базе данных
async function conectDB() {
    try{
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (e) {
        console.log('Подключение сломалось', e)
    }
}
conectDB()

// Старт бота
bot.command('start', async stx => {

    await stx.reply('Привет, давай пройдем небольшую аттестацию, проверим твои знания. За каждый правильный ответ ты получишь «печеньку»')
    await stx.reply("Напиши свое Имя и Фамилию")
})
// Определяем по выбору пользователя, кем он является в команде
async function sequenceOfQuestions(ctx, num){
    
    const context = db[num]
    const inlineKeyboard = new InlineKeyboard()
    .text(context.data[0], isDone(1, context.sucs)).row()
    .text(context.data[1], isDone(2, context.sucs)).row()
    .text(context.data[2], isDone(3, context.sucs)).row()
    .text(context.data[3], isDone(4, context.sucs))
    await ctx.reply(context.label, {reply_markup: inlineKeyboard})
}

let cookies = 0
function isDone(number, doneNum){
    if(number == doneNum){
        return 'done'
    }
    return 'notDone'
}


let leng = 0
bot.callbackQuery('button-1', async ctx => {
    sequenceOfQuestions(ctx, leng++)
    //const inlineKeyboard = new InlineKeyboard().text('14см', 'button-3').row().text('15см', 'button-4')
    //await ctx.reply('Какой длины у вас член? ', {reply_markup: inlineKeyboard})
})

bot.callbackQuery(['notDone'], async ctx => {
    if(leng + 1 > db.length){
        await ctx.reply(`Вы заработали ${cookies}🍪`)
        return leng = 0
    } 
    sequenceOfQuestions(ctx, leng++)
})

bot.callbackQuery(['done',], async ctx => {
    cookies++
    if(leng + 1 > db.length){
        const User = await UserModel.findOne({where: {telegramm_id: ctx.message.from.id}})
        User.cookies = cookies
        await User.save()
        await ctx.reply(`Ты заработал ${User.cookies}🍪`)
        return leng = 0
    } 
    sequenceOfQuestions(ctx, leng++)
})

bot.callbackQuery('button-2', async ctx => {
    sequenceOfQuestions(ctx, leng++)
})
//==============================================================
bot.command('attestation', async (ctx) => {
    const inlineKeyboard = new InlineKeyboard().text('Кассир', 'button-1').text('Повар', 'button-2')
    await ctx.reply('Выберите свою позицию ', {reply_markup: inlineKeyboard})
})

bot.on("message", async (ctx) => {
    // Есть ли пользователь в базе данных?
    const isRegistredUser = await UserModel.findOne({
        where: {
            telegramm_id: JSON.stringify(ctx.message.from.id)
        }
    })

    // Проверка на права администратора
    if(ctx.from.id === 556854763 || ctx.from.id === 366486108) {
        await ctx.reply("Здравствуй, хозяин")
        return
    }

    // Пользователь новый или старый. Алгоритм действий
    if(isRegistredUser === null) {
        await UserModel.create({
            chatId: JSON.stringify(ctx.message.chat.id),
            name: ctx.message.text,
            telegramm_id: JSON.stringify(ctx.message.from.id),
            compliteAtt: 0,
            cookies: 0
        })
        await ctx.reply(`Вот мы и познакомились, ${ctx.message.text}`)

        // Выбор направления курса

    } else{
        await ctx.reply(`Мы уже знакомы, ${isRegistredUser.name}. У тебя ${cookies} 🍪`)
        
        // Выбор направления курса
        
        
    }
    
    
  });

bot.start()