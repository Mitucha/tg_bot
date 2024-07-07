const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
    'telegrammBot_db',
    'root',
    'NfUoXeoOBa9m',
    {
        host: 'master.ea8ccf8c-645d-49e5-a8bb-7c822a5582be.c.dbaas.selcloud.ru',
        port: 5432,
        dialect: 'postgres'
    }
)