const repl = require('repl')
const chalk = require('chalk')
var inquirer = require('inquirer')
const ss = require('socket.io-stream');
const fs = require('fs');

var tabSalon = ['général', 'workplace', 'tech', 'news']
var choiceChannel = ''
var clear = require('clear')

const start = async () => {

    clear()

    var { server } = await inquirer.prompt([
        {
            type: 'input',
            name: 'server',
            message: '_Adresse_[:port] :',
            validate: function (value) {
                var valid = false
                var resSplit = value.split(' ')
                var splitPort = value.split(':')
                if (
                    resSplit[1] !== null
                    && resSplit[1] !== undefined
                    && resSplit[1] !== ''
                    && resSplit[1] !== ' '
                ) {
                    valid = false
                } else if (
                    value == resSplit[0]
                    && resSplit[0].substr(0, 7) === 'http://'
                    && resSplit[0].substr(7) !== ''
                    && resSplit[0].substr(7) !== ' '
                    && resSplit[0].substr(7) !== null
                    && resSplit[0].substr(7) !== undefined
                ) {
                    valid = true
                    if (
                        splitPort[2] === null
                        || splitPort[2] === undefined
                        || splitPort[2] === ''
                        || splitPort[2] === ' '
                    ) {
                        splitPort[2] = '3000'
                        valid = true
                    }
                    if (!Number.isInteger(splitPort[2] * 1)) {
                        valid = false
                    }
                    console.log('\n')
                    console.log(splitPort[2])
                }
                return valid || 'Veuillez réessayer'
            }
        }
    ])

    var splitServer = server.split(':')

    if (splitServer[2] === null
        || splitServer[2] === undefined
        || splitServer[2] === ''
        || splitServer[2] === ' '
    ) {
        server += ':3000'
    }

    var socket = require('socket.io-client')(server)

    console.log('\nVotre serveur: ' + server)

    console.log('Bonjour, bienvenue sur le tchat MellonMellon\n')

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
                return valid || 'Veuillez réessayer'
            }
        }
    ])

    if (
        nick === ''
        || nick === ' '
        || nick === null
        || nick === undefined
    ) {
        return start()
    }

    console.log('\nVotre pseudo: ' + nick)

    socket.emit('nouveau_client', nick)

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
    })

    function channelMessage(choiceSplit) {

        var rep = ''
        for (var i = 0; i < choiceSplit.length; i++) {
            rep += choiceSplit[i] + ' '
        }

        if (
            rep === ''
            || rep === ' '
            || rep === null
            || rep === undefined
        ) {
            console.log("Veuillez entrer du texte")
            return
        }
        if (
            choiceChannel === null
            || choiceChannel === undefined
            || choiceChannel === ''
            || choiceChannel === ' '
        ) {
            console.log("Veuillez entrer dans un salon avant de parler")
            return
        }
        socket.emit('channelMessage', { channel: choiceChannel, message: rep })
    }

    socket.on('channMessage', (data) => {
        console.log('\n')
        console.log(chalk.blue(data.nick + ': ' + data.message))
    })

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

    function channelList(choiceSplit) {
        var str = choiceSplit[1]
        if (str !== undefined) {
            for (var i = 0; i < tabSalon.length; i++) {
                if (tabSalon[i].includes(str)) {
                    console.log(chalk.blue(tabSalon[i]))
                }
            }
        } else {
            tabSalon.map((t) => console.log(chalk.blue(t)))
        }
    }

    function joinChannel(choice) {
        if (
            choice !== undefined
            && choice !== null
            && choice !== ''
            && choice !== ' '
        ) {
            choice = choice.toLowerCase()
        } else {
            console.log("Vous n'avez pas indiqué de salon")
            return
        }
        if (choiceChannel == '') {
            if (tabSalon.includes(choice)) {
                for (var i = 0; i < tabSalon.length; i++) {
                    if (tabSalon[i] == choice) {
                        socket.emit('join_channel', choice, nick)
                        choiceChannel = choice
                        console.log(chalk.green("Vous avez rejoint le channel " + choice))
                    }
                }
            } else {
                tabSalon.push(choice)
                socket.emit('join_channel', choice, nick)
                choiceChannel = choice
                console.log(chalk.green("Vous avez rejoint le channel " + choice))
            }
        } else {
            socket.emit('quit_channel', choiceChannel, nick)
            choiceChannel = ''
            socket.emit('join_channel', choice, nick)
            choiceChannel = choice
        }
    }

    function usersChannel() {
        console.log(choiceChannel)
        if (choiceChannel !== '') {
            socket.emit('channel_users', choiceChannel)
            socket.once('list_clients', (numClients) => {
                console.log(chalk.blue('Il y a ' + numClients + ' utilisateur(s) connecté(s) sur le channel ' + choiceChannel))
            })
            socket.once('nick_users', (tabUsers) => {
                tabUsers.map((u) => console.log('- ' + u))
            })
        } else {
            console.log(chalk.red("Vous n'êtes pas dans un channel"))
        }
    }

    function sendFile(choice) {
        var rep = ''
        for (var i = 2; i < choice.length; i++) {
            rep += choice[i] + '_'
        }
        var repSplit = rep.split('')
        repSplit = repSplit.slice(0, -1)
        var filename = repSplit.join('')
        var repPoint = filename.split('.')
        if (repPoint.length > 1) {
            var ext = repPoint[repPoint.length - 1]
            console.log(ext)
        } else {
            console.log("Veuillez préciser l'extension")
            return
        }

        if (
            choice[1] !== undefined
            && choice[1] !== null
            && choice[2] !== undefined
            && choice[2] !== ' '
            && choice[2] !== ''
            && choice[2] !== null
        ) {
            if (
                ext !== null
                && ext !== undefined
                && ext !== ' '
                && ext !== ''
            ) {
                socket.emit('sendmeafile', { to: choice[1], file: filename })
            }
        }
        else if (
            choice[1] === undefined
            || choice[1] === null
            || choice[1] === ''
            || choice[1] === ' '
        ) {
            console.log(chalk.red("Veuillez entrer un pseudo"))
        }
        else if (
            choice[2] === undefined
            || choice[2] == ''
            || choice[2] == ' '
            || choice[2] === null
        ) {
            console.log(chalk.red("Veuillez séléctionner un fichier"))
        }
    }

    socket.on('error_file', () => {
        console.log("Le fichier n'existe pas")
    })

    socket.on('error_pseudo', () => {
        console.log("Le pseudo entré n'existe pas")
    })

    ss(socket).on('sending', function (stream, filename, nick) {
        while (fs.existsSync(filename)) {
            var lastPoint = filename.lastIndexOf('.')
            var fileTab = filename.split('')
            var name = ''
            var ext = ''

            for (var i = 0; i < lastPoint; i++) {
                name += fileTab[i]
            }
            for (var j = lastPoint; j < fileTab.length; j++) {
                ext += fileTab[j]
            }
            filename = `${name}-copie${ext}`
        }
        stream.pipe(fs.createWriteStream(filename))
        stream.on('end', function () {
            console.log(nick + ' vous a envoyé le fichier: ' + filename)
        })
    })

    function quitChannel(channel) {
        if (
            channel !== undefined
            && channel !== ''
            && channel !== null
            && channel !== ' '
        ) {
            channel = channel.toLowerCase()
        }
        else {
            console.log("Entrer le nom du channel")
            return
        }

        if (
            channel == choiceChannel
        ) {
            socket.emit('quit_channel', channel, nick)
            console.log(chalk.red("Vous avez quitté le channel " + channel))
            choiceChannel = ''
        }
        else {
            console.log(chalk.red("Vous n'êtes pas dans ce channel"))
        }
    }

    let command = ''
    console.log("Liste des choix: /help")

    do {
        var { choice } = await inquirer.prompt([
            {
                type: 'input',
                name: 'choice',
                message: 'Votre choix:'
            }
        ])

        var choiceSplit = choice.split(' ')

        command = choiceSplit[0]

        switch (choiceSplit[0]) {
            case "/help":
                console.log("Choisissez une option:")
                console.log("/list [string]")
                console.log("/join _channel_")
                console.log("/quit _channel_")
                console.log("/users")
                console.log("_message_")
                console.log("/msg _nick_ _message_")
                console.log("/send_file _nick_ _file_")
                console.log("/accept_file _nick_from_")
                console.log("/exit")
                break
            case "/list":
                channelList(choiceSplit)
                break
            case "/join":
                joinChannel(choiceSplit[1])
                break
            case "/quit":
                quitChannel(choiceSplit[1])
                break
            case "/users":
                usersChannel()
                break
            case "/msg":
                privateMsg(choiceSplit)
                break
            case "/send_file":
                sendFile(choiceSplit)
                break
            case "/accept_file":
                acceptFile(choiceSplit[1])
                break
            case "/exit":
                console.log('Vous quittez le serveur')
                process.exit()
                break
            default:
                channelMessage(choiceSplit)
                break
        }
    } while (command !== '/exit')

    repl.start({
        prompt: '',
        eval: (cmd) => {
            socket.send(cmd, nick)
        }
    })
}

start()