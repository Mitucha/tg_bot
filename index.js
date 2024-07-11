require('dotenv').config()
const sequelize = require('./db')
const { UserModel, AttestationModel, ResultModel } = require('./models')
const {Bot, InlineKeyboard} = require('grammy')

// Импровизированная база данных и переменные для счетчиков

const attestationItems = [
    {title: 'Аттестация Июня', data: 'qwerty', command: 'att1'},
    {title: 'Аттестация Августа', data: 'qwerty', command: 'att2'}
]

function commandAtt(arr){
    let result = []
    for (let i = 0; i < arr.length; i++){
        result.push(
            {command: arr[i].command, description: arr[i].title}
        )
    }
    return result
}

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
let leng = 0
let cookies = 0 // Хардкодим Печеньки тут, чтобы, по окончанию теста, отправить их на сервер
//==============================
const bot = new Bot(process.env.BOT_API_KEY) //Подключение к боту

//Необходимые пользовательские команды

bot.api.setMyCommands(commandAtt(attestationItems))

/*bot.api.setMyCommands([
    {
        command: 'attestation',
        description: 'Пройти аттестацию'
    }
])*/

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

    await stx.reply('Привет, давай пройдем небольшую аттестацию, проверим твои знания. За каждый правильный ответ ты получишь «печеньку»🍪')
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

// Функция для определения правильного варианта ответа на вопрос теста
function isDone(number, doneNum){
    if(number === doneNum){
        return 'done'
    }
    return 'notDone'
}

// Вызов теста
bot.callbackQuery('button-1', async ctx => {
    sequenceOfQuestions(ctx, leng++)
    //const inlineKeyboard = new InlineKeyboard().text('14см', 'button-3').row().text('15см', 'button-4')
    //await ctx.reply('Какой длины у вас член? ', {reply_markup: inlineKeyboard})
})

// Обработчик не верного ответа пользователя
bot.callbackQuery(['notDone'], async ctx => {
    if(leng == db.length){
        try{
            //const User = await UserModel.findOne({where: {telegramm_id: ctx.from.id}})
            //User.cookies = cookies
            //await User.save()
            //await ctx.reply(`Ты заработал ${User.cookies}🍪`)
            leng = 0
            await ctx.reply(`Ты заработал ${cookies}🍪`)
            cookies = 0
        } catch(e){console.error(e)}
        
    }else{sequenceOfQuestions(ctx, leng++)}
    
})

// Обработчик верного ответа пользователя
bot.callbackQuery('done', async ctx => {
    cookies++
    if(leng == db.length){
        //const User = await UserModel.findOne({where: {telegramm_id: ctx.from.id}})
        //User.cookies = cookies
        //await User.save()
        //await ctx.reply(`Ты заработал ${User.cookies}🍪`)
        leng = 0
        await ctx.reply(`Ты заработал ${cookies}🍪`)
        cookies = 0
    } else{sequenceOfQuestions(ctx, leng++)}
})

bot.callbackQuery('button-2', async ctx => {
    sequenceOfQuestions(ctx, leng++)
})

bot.callbackQuery('add_attestation', async ctx => {
    ctx.reply('Я жду список')
})
//==============================================================

bot.command('attestation', async (ctx) => {
    const inlineKeyboard = new InlineKeyboard().text('Кассир', 'button-1').text('Повар', 'button-2')
    await ctx.reply('Выберите свою позицию ', {reply_markup: inlineKeyboard})
})

bot.on("message", async (ctx) => {
    // Есть ли пользователь в базе данных?
    const registredUser = await UserModel.findOne({
        where: {
            telegramm_id: JSON.stringify(ctx.message.from.id)
        }
    })

    // Проверка на права администратора
    if(ctx.from.id === 556854769 || ctx.from.id === 366486108) {
        await ctx.reply("Здравствуй, администратор")
        const inlineKeyboard = new InlineKeyboard().text('Добавить аттестацию', 'add_attestation').row().text('Результаты пользователей')
        await ctx.reply('Какие будут действия?', {reply_markup: inlineKeyboard})
        return
    }

    // Пользователь новый или старый. Алгоритм действий
    if(registredUser === null) {
        await UserModel.create({
            chatId: JSON.stringify(ctx.message.chat.id),
            name: ctx.message.text,
            telegramm_id: JSON.stringify(ctx.message.from.id),
            compliteAtt: 0,
            cookies: 0
        })

        await ctx.reply(`Вот мы и познакомились, ${ctx.message.text}`)

    } else{
        //await ctx.reply(`Мы уже знакомы, ${registredUser.name}. У тебя ${cookies} 🍪.`)
        
        await ctx.reply(registredUser)
    }
    
    
  });

bot.start()