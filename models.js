const sequelize = require('./db')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatId: {type: DataTypes.INTEGER, unique: true},
    compliteAtt: {type: DataTypes.INTEGER},
    name: {type: DataTypes.STRING},
    telegramm_id: {type: DataTypes.STRING, unique: true},
    cookies: {type: DataTypes.INTEGER}
})

const Attestation = sequelize.define('attestation', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    label: {type: DataTypes.STRING},
    data: {type: DataTypes.TEXT}
})

const Result = sequelize.define('result', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    id_user: {type: DataTypes.INTEGER},
    attestation_id: {type: DataTypes.INTEGER},
    result: {type: DataTypes.STRING}
})

module.exports = {
    UserModel: User,
    AttestationModel: Attestation,
    ResultModel: Result
};