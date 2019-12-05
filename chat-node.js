const http = require('http').createServer()
const io = require('socket.io')(http)
const port = 3000
var ent = require('ent')
var clients = []
const chalk = require('chalk')

io.on('connection', function (socket, nick, port) {

   socket.on('nouveau_client', function (nick) {
        if(clients.includes(nick)) {
            console.log("Le pseudo est déjà utilisé")
            nick = null
            socket.emit('nouveau_client', nick)
        }
        else {
            socket.nick = nick
            console.log(chalk.green('utilisateur connecté: ' + nick))
            clients.push(nick)
            console.log(clients)
            socket.broadcast.emit('nouveau_client', nick)
        }
    })

    socket.on('message', function (message) {
        console.log(chalk.blue(socket.nick + ' : ' + message))
        socket.broadcast.emit('message', { nick: socket.nick, message: message })
    })

    socket.on('disconnect', function () {
        console.log(chalk.red(socket.nick + ' a quitté le salon'))
        socket.broadcast.emit('message', { nick: socket.nick, message: ' a quitté le salon' })
        clients.splice(clients.indexOf(socket.nick), 1);
        console.log(clients)
    })
})

http.listen(port, () => console.log(`server listening on port: ${port}`))