const sequelize = require('./db')
const { UserModel, AttestationModel, ResultModel } = require('./models')
const {Bot, InlineKeyboard} = require('grammy')

function Admin(){
    bot.api.setMyCommands([
        {command: 'addAttestation', description: 'Добавить аттестацию'}
    ])
}

module.exports = Admin