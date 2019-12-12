const http = require('http').createServer()
const io = require('socket.io')(http)
const ss = require('socket.io-stream');
const fs = require('fs');
var path = require('path');
const port = 3000
var clients = []
const chalk = require('chalk')
var clear = require('clear')
var connectedUsers = {}
var tabUsers = []
const ss = require('socket.io-stream')
const fs = require('fs')

clear()

io.on('connection', function (socket) {

    socket.on('nouveau_client', function (nick) {
        if (clients.includes(nick)) {
            console.log('Le pseudo ' + nick + ' est déjà utilisé')
            nick = null
            socket.emit('nouveau_client', nick)
        } else {
            socket.nick = nick
            console.log(chalk.green(nick + ' a rejoint le serveur'))
            clients.push(nick)
            console.log(clients)
            socket.broadcast.emit('nouveau_client', nick)
            connectedUsers[nick] = socket
        }
    })

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
            socket.emit('error_pseudo')
        }
    })

    socket.on('sendmeafile', function (data) {
        if (clients.includes(data.to)) {
            const to = data.to
            const file = data.file
            if (connectedUsers.hasOwnProperty(to)) {
                var stream = ss.createStream()
                fs.access(file, fs.F_OK, (err) => {
                    if (err) {
                      console.error('Erreur: ' + err)
                      socket.emit('error_file')
                      return;
                    }
                    // file exists
                    stream.on('end', function () {
                        console.log("Fichier envoyé")
                    })
                    ss(connectedUsers[to]).emit('sending', stream, file, socket.nick)
                    fs.createReadStream(file).pipe(stream)
                  })
            }
        } else {
            console.log(chalk.red("Le pseudo entré n'existe pas"))
            socket.emit('error_pseudo')
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
    })

    socket.on('channel_users', function (channel) {
        var clientsSocket = io.sockets.adapter.rooms[channel].sockets
        var clientsList = io.sockets.adapter.rooms[channel]
        var numClients = clientsList.length
        if (numClients == 1) {
            console.log(chalk.blue('Il y a ' + numClients + ' utilisateur connecté sur le channel ' + channel))
        } else {
            console.log(chalk.blue('Il y a ' + numClients + ' utilisateurs connectés sur le channel ' + channel))
        }
        socket.emit('list_clients', numClients)

        for (var clientId in clientsSocket) {
            var clientNick = io.sockets.connected[clientId].nick
            console.log('- ' + clientNick)
            tabUsers.push(clientNick)
        }
        socket.emit('nick_users', tabUsers)
        tabUsers = []
    })

    socket.on('quit_channel', function (channel, nick) {
        socket.leave(channel)
        console.log(chalk.red(nick + ' a quitté le channel ' + channel))
    })

    socket.on('sendmeafile', function (data) {
        if (clients.includes(data.to)) {
            const file = data.file
            const to = data.to 
            if (connectedUsers.hasOwnProperty(to)) {
                var stream = ss.createStream()
                stream.on('end', function () {
                    console.log('file sent')
                })
                ss(connectedUsers[to]).emit('sending', stream, file)
                fs.createReadStream(file).pipe(stream)
            }
            else {
                socket.emit('errorFile')
            }
        }
    })

    socket.on('disconnect', function () {
        console.log(chalk.red(socket.nick + ' a quitté le serveur'))
        socket.broadcast.emit('user_quit', socket.nick)
        clients.splice(clients.indexOf(socket.nick), 1)
        console.log(clients)
    })
})

http.listen(port, () => console.log(`server listening on port: ${port}`))