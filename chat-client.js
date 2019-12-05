var socket = require('socket.io-client')('http://192.168.1.11:3000');
const repl = require('repl')
const chalk = require('chalk');
var inquirer = require('inquirer');
var tabSalon = ['Général', 'Workplace', 'Tech', 'News']

const start = async () => {

    console.log('\nBonjour, bienvenue sur le tchat MellonMellon\n');

    var { nick } = await inquirer.prompt([
        {
            type: 'input',
            name: 'nick',
            message: 'pseudo:',
            validate: function (value) {
                var valid = false
                var resSplit = value.split(' ')
                if (value == `${resSplit[0]}`) {
                    valid = true
                }
                return valid || 'Veuillez réessayer';
            }
        }
    ])

    console.log('Votre pseudo: ' + nick)

    socket.emit('nouveau_client', nick);

    socket.on('nouveau_client', (nick) => {
        if (nick == null) {
            console.log("pseudo déjà existant")
            return start()
        } else {
            console.log(chalk.green(nick + ' a rejoint le salon'))
        }
    })

    function usersList() {
        socket.on('list_client', (clients) => {
            console.log('Liste des utilisateurs:')
            clients.map((c) => console.log('- ' + c))
            // console.log(clients)
        })
    }

    function channelList(choiceSplit) {
        var str = choiceSplit[1]
        if (str !== undefined) {
            for (var i = 0; i < tabSalon.length; i++) {
                if (tabSalon[i].includes(str)) {
                    console.log(chalk.blue('\n' + tabSalon[i]))
                }
            }
        } else {
            tabSalon.map((t) => console.log(chalk.blue(t)))
        }
    }

    function joinChannel(choice){
        var salonIsValid = false
        for(var i=0; i<tabSalon.length; i++){
            if(tabSalon[i].includes(choice)){
                socket.emit('channel', choice)
                salonIsValid= true
                console.log("Channel valide")
            } 
        }
        if(!salonIsValid){
            console.log("Ce channel n'est pas valide")
        }
    }

    function quitChannel(channel){
        socket.on('channel', choice)
        socket.emit('quit_channel', channel)
        // if(channel == choice){
            
        // }
    }

    let command = ''

    do {
        console.log("Liste des choix: /help")
        var { choice } = await inquirer.prompt([
            {
                type: 'input',
                name: 'choice',
                message: 'Votre choix:'
            }
        ])

        var choiceSplit = choice.split(' ')
        // console.log(choiceSplit)

        command = choiceSplit[0]

        switch (choiceSplit[0]) {
            case "/help":
                console.log("Choisissez une option:");
                console.log("/list [string]");
                console.log("/join _channel_");
                console.log("/quit _channel_")
                console.log("/users");
                // console.log("_message_")
                console.log("/msg _nick_ _message_")
                console.log("/exit");
                break;
            case "/list":
                choiceIsValid = true
                channelList(choiceSplit)
                break;
            case "/join":
                choiceIsValid = true
                joinChannel(choiceSplit[1])
                break;
            case "/quit":
                choiceIsValid = true
                quitChannel(choiceSplit[1])
                break;
            case "/users":
                choiceIsValid = true
                usersList()
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
    } while (command !== '/exit')

    socket.on('user_quit', function (nick) {
        socket.emit('disconnect')
        console.log(chalk.red(nick + ' a quitté le salon'))
    });

    // socket.on('connect', () => {
    //     console.log(chalk.green('=== start chatting ==='))
    // })

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