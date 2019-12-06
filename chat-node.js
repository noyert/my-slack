const http = require('http').createServer()
const io = require('socket.io')(http)
const port = 3000
var clients = []
const chalk = require('chalk')
var connectedUsers = {}

io.on('connection', function (socket) {

    socket.on('nouveau_client', function (nick) {
        if (clients.includes(nick)) {
            console.log('Le pseudo ' + nick + ' est déjà utilisé')
            nick = null
            socket.emit('nouveau_client', nick)
        } else {
            socket.nick = nick
            console.log(chalk.green('Utilisateur connecté: ' + nick))
            clients.push(nick)
            console.log(clients)
            socket.broadcast.emit('nouveau_client', nick)
            socket.emit('list_client', clients)
            connectedUsers[nick] = socket
        }
    })

    socket.on('message', function (message) {
        console.log(chalk.blue(socket.nick + ': ' + message))
        socket.broadcast.emit('message', { nick: socket.nick, message: message })
    })

    socket.on('private',function(data){

        if(clients.includes(data.to)){

            const to = data.to
            console.log(to)

            const private = data.private
            console.log(private)

            if(connectedUsers.hasOwnProperty(to)) {
                console.log(chalk.blue(socket.nick + ': ' + private))
                connectedUsers[to].emit('privateMsg',{
                    nick : socket.nick,
                    private : private
                })
            }
        }
        else {
            console.log(chalk.red("Le pseudo entré n'existe pas"))
        }
    
    }); 

    socket.on('disconnection', function () {
        console.log(chalk.red(socket.nick + ' a quitter le salon'))
        socket.broadcast.emit('user_quit', socket.nick)
        clients.splice(clients.indexOf(socket.nick), 1)
        console.log(clients)
    })
})

http.listen(port, () => console.log(`server listening on port: ${port}`))