var socket = require('socket.io-client')('http://192.168.1.11:3000');
const repl = require('repl')
const chalk = require('chalk');
var inquirer = require('inquirer');
var tabSalon = ['Général', 'Workplace', 'Tech', 'News']
var choiceIsValid = false

const start = async () => {

    console.log('\nBonjour, bienvenue sur le tchat MellonMellon\n');

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
                return valid || 'Please retry';
            }
        }
    ])

    nick = nick.split(' ')[1]
    console.log('Votre pseudo: ' + nick)

    console.log("Choisissez une option:");
    console.log("/list [string]");
    console.log("/join _channel_");
    console.log("/quit _channel_")
    console.log("/users");
    // console.log("_message_")
    console.log("/msg _nick_ _message_")
    console.log("/exit");

    while (!choiceIsValid) {
        var { choice } = await inquirer.prompt([
            {
                type: 'input',
                name: 'choice',
                message: 'Votre choix:'
            }
        ])

        var choiceSplit = choice.split(' ')
        console.log(choiceSplit)

        switch (choiceSplit[0]) {
            case "/list":
                choiceIsValid = true
                console.log('list')
                break;
            case "/join":
                choiceIsValid = true
                console.log('join channel')
                break;
            case "/quit":
                choiceIsValid = true
                console.log('quit channel')
                break;
            case "/users":
                choiceIsValid = true
                console.log('users')
                break;
            case "/msg":
                choiceIsValid = true
                console.log('MP')
                break;
            case "/exit":
                choiceIsValid = true
                console.log("Vous quittez le tchat MellonMellon")
                break;
            default:
                console.log('Votre choix n\'est pas valide')
                break;
        }
    }

    socket.emit('nouveau_client', nick);

    socket.on('disconnect', function () {
        socket.emit('disconnect')
    });

    // socket.on('connect', () => {
    //     console.log(chalk.green('=== start chatting ==='))
    // })

    socket.on('nouveau_client', (nick) => {
        console.log(nick + ' a rejoint le salon')
    })

    socket.on('message', (data) => {
        insereMessage(data.nick, data.message)
    })

    function insereMessage(nick, message) {
        console.log(chalk.blue(nick + ': ' + message))
    }

    repl.start({
        prompt: '',
        eval: (cmd) => {
            socket.send(cmd, nick)
        }
    })
}

start()