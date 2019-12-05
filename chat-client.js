var socket = require('socket.io-client')('http://192.168.1.250:3000');
const repl = require('repl')
const chalk = require('chalk');
var inquirer = require('inquirer');
// var figlet = require('figlet');
var tabSalon = ['Général', 'Workplace', 'Tech', 'News']
var choiceIsValid = false

// const titleFiglet = () => {
//     figlet.text('Tchat!', {
//         font: 'doom',
//         horizontalLayout: 'default',
//         verticalLayout: 'default'
//     }, function (err, data) {
//         if (err) {
//             console.log('Something went wrong...');
//             console.dir(err);
//             return;
//         }
//         console.log(data);
//     });
// }

const start = async () => {

    console.log('\nBonjour, bienvenue sur le tchat MellonMellon\n');
    // titleFiglet()

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

    let command = ''

    do {
        console.log("Pour de l'aide: /help")
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
                console.log('join channel')
                break;
            case "/quit":
                choiceIsValid = true
                console.log('quit channel')
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