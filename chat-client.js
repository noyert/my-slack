var socket = require('socket.io-client')('http://localhost:3000');
const repl = require('repl')
const chalk = require('chalk');
var inquirer = require('inquirer');
var tabSalon = ['général', 'workplace', 'tech', 'news']
var choiceChannel = ''
var clear = require('clear');
var isOkay = false

const start = async () => {

    clear();
    console.log('Bonjour, bienvenue sur le tchat MellonMellon\n');

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

    console.log('\nVotre pseudo: ' + nick)

    socket.emit('nouveau_client', nick);

    socket.on('nouveau_client', (nick) => {
        if (nick == null) {
            console.log("pseudo déjà existant")
            return start()
        } else {
            console.log('\n')
            console.log(chalk.green(nick + ' a rejoint le serveur'))
        }
    })

    socket.on('privateMsg', (data) => {
        console.log('\n')
        console.log(chalk.yellow(data.nick + ': ' + data.private))
    })

    socket.emit('disconnect', nick)
    socket.on('user_quit', function (nick) {
        console.log(chalk.red(`${nick} a quitté le serveur`))
    });

    function privateMsg(choiceSplit) {

        var rep = ''
        for (var i = 2; i < choiceSplit.length; i++) {
            rep += choiceSplit[i] + ' '
        }

        if (
            choiceSplit[1] !== undefined
            && choiceSplit[1] !== null
            && choiceSplit[2] !== undefined
            && choiceSplit[2] !== ' '
            && choiceSplit[2] !== ''
            && choiceSplit[2] !== null
        ) {
            socket.emit('private', { to: choiceSplit[1], private: rep })
        }
        else if (
            choiceSplit[1] === undefined
            || choiceSplit[1] === null
            || choiceSplit[1] === ''
            || choiceSplit[1] === ' '
        ) {
            console.log(chalk.red("Veuillez entrer un pseudo"))
        }
        else if (
            choiceSplit[2] === undefined
            || choiceSplit[2] == ''
            || choiceSplit[2] == ' '
            || choiceSplit[2] === null
        ) {
            console.log(chalk.red("Entrer du texte dans votre message"))
        }
    }

    socket.on('message', (data) => {
        insereMessage(data.nick, data.message)
    })

    function insereMessage(nick, message) {
        console.log(chalk.blue(nick + ': ' + message))
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

    function joinChannel(choice) {
        choice = choice.toLowerCase()
        var salonIsValid = false
        if (choiceChannel == '') {
            if (tabSalon.includes(choice)) {
                for (var i = 0; i < tabSalon.length; i++) {
                    if (tabSalon[i] == choice) {
                        socket.emit('join_channel', choice, nick)
                        salonIsValid = true
                        choiceChannel = choice
                        console.log(chalk.green("Vous avez rejoint le channel " + choice))
                    }
                }
            } else {
                salonIsValid = true
                tabSalon.push(choice)
                socket.emit('join_channel', choice, nick)
                choiceChannel = choice
                console.log(chalk.green("Vous avez créé et rejoint le channel " + choice))
            }
            if (!salonIsValid) {
                console.log(chalk.red("Ce channel n'est pas valide"))
            }
        } else {
            console.log(chalk.red('Vous êtes déjà dans le channel ' + choiceChannel))
        }
    }

    function usersChannel() {
        console.log(choiceChannel)
        if (choiceChannel !== '') {
            socket.emit('channel_users', choiceChannel)
            socket.on('nb_clients', (numClients) => {
                console.log(chalk.blue('Il y a ' + numClients + ' utilisateur(s) connecté(s) sur le channel ' + choiceChannel))
            })
        } else {
            console.log(chalk.red("Vous n'êtes pas dans un channel"))
        }
    }

    function quitChannel(channel) {
        channel = channel.toLowerCase()
        if (channel == choiceChannel) {
            socket.emit('quit_channel', channel, nick)
            console.log(chalk.red("Vous avez quitté le channel " + channel))
            choiceChannel = ''
        } else {
            console.log(chalk.red("Vous n'êtes pas dans ce channel"))
        }
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
                console.log("_message_")
                console.log("/msg _nick_ _message_")
                console.log("/exit");
                break;
            case "/list":
                channelList(choiceSplit)
                break;
            case "/join":
                joinChannel(choiceSplit[1])
                break;
            case "/quit":
                quitChannel(choiceSplit[1])
                break;
            case "/users":
                usersChannel()
                break;
            case "/msg":
                privateMsg(choiceSplit)
                break;
            case "/exit":
                console.log("Vous quittez le tchat MellonMellon")
                break;
            default:
                console.log('Votre choix n\'est pas valide')
                break;
        }
    } while (command !== '/exit')

    // socket.on('connect', () => {
    //     console.log(chalk.green('=== start chatting ==='))
    // })

    repl.start({
        prompt: '',
        eval: (cmd) => {
            socket.send(cmd, nick)
        }
    })
}

start()