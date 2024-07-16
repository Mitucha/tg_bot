require('dotenv').config()
const sequelize = require('./db')
const { UserModel, AttestationModel, ResultModel } = require('./models')
const {Bot, InlineKeyboard} = require('grammy')
const {cassir, cook} = require('./att')

let attArray = [
    /*{
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
    }*/
  ]
let intermediateResult = []
let cookies = 0 // Хардкодим Печеньки тут, чтобы, по окончанию теста, отправить их на сервер
//==============================
const bot = new Bot(process.env.BOT_API_KEY) //Подключение к боту

//Необходимые пользовательские команды

bot.api.setMyCommands(
    [{command: 'att', description: 'Пройти аттестацию'}]
)

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

async function sequenceOfQuestions(ctx, objOfArray){
    if(objOfArray == undefined){
        ctx.reply('Вы уже прошли аттестацию')
        return
    }
    const inlineKeyboard = new InlineKeyboard()
    .text(objOfArray.data[0], isDone(1, objOfArray.sucs)).row()
    .text(objOfArray.data[1], isDone(2, objOfArray.sucs)).row()
    .text(objOfArray.data[2], isDone(3, objOfArray.sucs)).row()
    .text(objOfArray.data[3], isDone(4, objOfArray.sucs))
    await ctx.reply(objOfArray.label, {reply_markup: inlineKeyboard})
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
    attArray = cassir
    sequenceOfQuestions(ctx, attArray.shift())
    
})

// Обработчик не верного ответа пользователя
bot.callbackQuery(['notDone'], async ctx => {
    if(attArray.length == 0){
        try{
            intermediateResult.push(20 - attArray.length)
            const User = await UserModel.findOne({where: {telegramm_id: JSON.stringify(ctx.from.id)}})
            if(User.cookies > 0) User.cookies += cookies
            else{User.cookies = cookies}
            await User.save()



            await ResultModel.create({
                id_user: User.id,
                attestation_id: 1,
                result: JSON.stringify(intermediateResult)
            })

            await ctx.reply(`Ты заработал ${User.cookies}🍪`)
            cookies = 0
        } catch(e){console.error(e)}
        
    }else{
        intermediateResult.push(20 - attArray.length)
        sequenceOfQuestions(ctx, attArray.shift())}
    
})

// Обработчик верного ответа пользователя
bot.callbackQuery('done', async ctx => {
    cookies++
    if(attArray.length == 0){
        try{
            const User = await UserModel.findOne({where: {telegramm_id: JSON.stringify(ctx.from.id)}})
            if(User.cookies > 0) User.cookies += cookies
            else{User.cookies = cookies}
            await User.save()

            await ResultModel.create({
                id_user: User.id,
                attestation_id: 1,
                result: JSON.stringify(intermediateResult)
            })

            await ctx.reply(`Ты заработал ${cookies}🍪`)
            cookies = 0
        } catch(e){console.log(e)}
    } else{sequenceOfQuestions(ctx, attArray.shift())}
})

bot.callbackQuery('button-2', async ctx => {
    attArray = cook
    sequenceOfQuestions(ctx, attArray.shift())
})

bot.callbackQuery('result_users', async ctx => {
    Res = await ResultModel.findAll()
    for(const i in Res){
        const name = await UserModel.findOne({where: {id: Res[i].id_user}})
        ctx.reply(`Сотрудник: ${name.name},
        № Аттестации: ${Res[i].attestation_id}
        Ошибки: ${Res[i].result}`)
    }
})
//==============================================================

bot.command('att', async (ctx) => {
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
    if(ctx.from.id === 556854769 || ctx.from.id === 66486108) {
        await ctx.reply("Здравствуй, администратор")
        const inlineKeyboard = new InlineKeyboard().text('Результаты пользователей', 'result_users')
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
        await ctx.reply(`Мы уже знакомы, ${registredUser.name}. У тебя ${registredUser.cookies} 🍪.`)
    }
    
    
  });

bot.start()

// В model.js добавить ключи к аттестации type_user ++++++++++++++++++++++++++++++++++
// Стереть существующую бд на хосте
// Подключить новую бд
// Подготовить аттестации +++++++++++++++++++++++++++++
// Добавить атестации в бд
// Переписать функцию прохождения аттестации так, чтобы в зависимости от type_user менялись тесты пользователя

// Сохранять прогресс пользователя (если тест был пройден, то он его перепройти не может), потому добавить ключ к пользователю, который не даст пройти пройденный тест
// Вывод результатов для администратора