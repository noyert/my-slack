const http = require('http').createServer()
const io = require('socket.io')(http)
const port = 3000
var ent = require('ent')
var clients = []
const chalk = require('chalk')
var clear = require('clear')
var connectedUsers = {}
var tabNick = []

clear()

io.on('connection', function (socket) {

    socket.on('nouveau_client', function (nick) {
        if (clients.includes(nick)) {
            console.log('Le pseudo ' + nick + ' est déjà utilisé')
            nick = null
            socket.emit('nouveau_client', nick)
        } else {
            socket.nick = nick
            console.log(chalk.green(nick + ' a rejoint le tchat'))
            clients.push(nick)
            console.log(clients)
            socket.broadcast.emit('nouveau_client', nick)
            connectedUsers[nick] = socket
        }
    })

    // socket.on('message', function (message) {
    //     console.log(chalk.blue(socket.nick + ' : ' + message))
    //     socket.broadcast.emit('message', { nick: socket.nick, message: message })
    // })

    socket.on('private', function (data) {

        if (clients.includes(data.to)) {

            const to = data.to

            const private = data.private

            if (connectedUsers.hasOwnProperty(to)) {
                console.log(chalk.blue(socket.nick + ': ' + private))
                connectedUsers[to].emit('privateMsg', {
                    nick: socket.nick,
                    private: private
                })
            }
        }
        else {
            console.log(chalk.red("Le pseudo entré n'existe pas"))
        }
    })

    socket.on('channelMessage', function (data) {

        const channel = data.channel

        const message = data.message

        console.log(chalk.blue(socket.nick + ' a écrit: ' + message))

        io.to(channel).emit('channMessage', {
            nick: socket.nick,
            message: message
        })
    })

    socket.on('join_channel', function (choice, nick) {
        socket.join(choice)
        console.log(chalk.green(nick + ' a rejoint le channel ' + choice))
        var sid = socket.id
        console.log(sid)
    })

    socket.on('channel_users', function (channel) {
        var clientsList = io.sockets.adapter.rooms[channel];
        // console.log(clientsList)
        clientsList.nick  = socket.nick
        // console.log(clientsList.nick)
        // tabNick.push(clientsList.nick)
        // console.log(tabNick)
        var numClients = clientsList.length;
        console.log(chalk.blue('Il y a ' + numClients + ' utilisateur(s) connecté(s) sur le channel ' + channel))
        // tabNick.map((n) => console.log("- " + n))
        socket.emit('list_clients', numClients)
    })

    socket.on('quit_channel', function (channel, nick) {
        socket.leave(channel)
        console.log(chalk.red(nick + ' a quitté le channel ' + channel))
    })

    socket.on('disconnect', function () {
        console.log(chalk.red(socket.nick + ' a quitter le serveur'))
        socket.broadcast.emit('user_quit', socket.nick)
        clients.splice(clients.indexOf(socket.nick), 1)
        console.log(clients)
    })
})

http.listen(port, () => console.log(`server listening on port: ${port}`))