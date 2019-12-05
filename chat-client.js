var socket = require('socket.io-client')('http://192.168.1.250:3000')
const repl = require('repl')
const chalk = require('chalk')
var inquirer = require('inquirer')
var channels = ['Général', 'Workplace', 'Tech', 'News']

const start = async () => {

    console.log('\nBonjour, bienvenue sur le tchat MellonMellon\n')

    var { nick } = await inquirer.prompt([
        {
            type: 'input',
            name: 'nick',
            message: '/nick _nickname_',
            validate: function (value) {
                var valid = false
                var resSplit = value.split(' ')
                if (value == `/nick ${resSplit[1]}`) {
                    valid = true
                }
                return valid || "Veuillez réessayer"
            }
        }
    ])
    nick = nick.split(' ')[1]
    console.log('Votre pseudo: ' + nick)
    socket.emit('nouveau_client', nick)

    socket.on('nouveau_client', (nick) => {
        if (nick == null) {
            console.log("pseudo déjà existant")
            return start()
        }
        else {
            console.log(nick + ' a rejoint le salon')
        }
    })

    var { list } = await inquirer.prompt([
        {
            type: 'input',
            name: 'list',
            message: '/list [string]',
            validate: function (value) {
                var valid = false
                var resSplit = value.split(' ')
                if (value == `/list`) {
                    console.log(chalk.blue('\n' + channels))
                    valid = true
                }
                if (value == `/list ${resSplit[1]}`) {
                    for(var i = 0; i < channels.length; i++){
                        if(channels[i].includes(resSplit[1])){
                            console.log(chalk.blue('\n' + channels[i]))
                        }
                    }
                    valid = true
                }
                return valid || "Veuillez réessayer"
            }
        }
    ])
    socket.emit('list', list)

    socket.on('connect', () => {
        console.log(chalk.green('=== start chatting ==='))
    })

    socket.on('message', (data) => {
        insereMessage(data.nick, data.message)
    })

    function insereMessage(nick, message) {
        console.log(chalk.blue(nick + ': ' + message))
    }

    socket.on('disconnect', function () {
        socket.emit('disconnect')
    });

    repl.start({
        prompt: '',
        eval: (cmd) => {
            socket.send(cmd, nick)
        }
    })
}

start()