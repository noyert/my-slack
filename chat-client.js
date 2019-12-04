var socket = require('socket.io-client')('http://localhost:3000');
const repl = require('repl')
const chalk = require('chalk');
var inquirer = require('inquirer');
var tabSalon = ['Général', 'Workplace', 'Tech', 'News']
var choix = "";

const start = async () => {

    console.log('\nBonjour, bienvenue sur le tchat MellonMellon\n');

    // const { port } = await inquirer.prompt([
    //     {
    //         type: 'input',
    //         name: 'port',
    //         message: '/server _host_[:port]',
    //         validate: function (value) {
    //             var valid = false
    //             var resSplit = value.split(' ')
    //             if (value == `/server ${resSplit[1]}`) {
    //                 valid = true
    //             }
    //             return valid || 'Please retry';
    //         },
    //     }
    // ])

    // var socket = require('socket.io-client')(port.split(' ')[1]);
    // socket.emit('nouveau_port', port.split(':')[2]);
    // console.log(port.split(' ')[1])
    // console.log(port)

    const { nick } = await inquirer.prompt([
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

    console.log('Votre pseudo: ' + nick)

    do {
        console.log("Choisissez une option");
        console.log("/list [string]");
        console.log("/join _channel_");
        console.log("/quit _channel_");
        console.log("/users");
        console.log("_message_");
        console.log("/msg _nick_ _message_");
        console.log("/exit");
        choix = 
        
        switch (choix) {
            case "1":
                
                break;

            case "2":
                
                break;

            case "3":
                
                break;
            default:
                console.log()
                break;
        }

    } while (choix !== '/exit');

    socket.emit('nouveau_client', nick);

    socket.on('disconnect', function () {
        socket.emit('disconnect')
    });

    socket.on('connect', () => {
        console.log(chalk.green('=== start chatting ==='))
    })

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

    // const { salon } = await inquirer.prompt([
    //     {
    //         type: 'list',
    //         name: 'salon',
    //         message: 'Choisissez un salon',
    //         choices: tabSalon,
    //         filter: function (val) {
    //             return val.toLowerCase();
    //         }
    //     }
    // ])
}

start()