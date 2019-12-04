const http = require('http').createServer();
const io = require('socket.io')(http);
const port = 3000
var ent = require('ent')
var clients = []
const chalk = require('chalk');

io.on('connection', function (socket, nick, port) {
    // socket.on('nouveau_port', function(port){
    //     socket.port = port
    //     // console.log('la?')
    //     // http.listen(port, () => console.log(`server listening on port: ${port}`))
    // })
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('nouveau_client', function (nick) {
        socket.nick = nick
        console.log(chalk.green('user connected: ' + nick))
        if(clients.includes(nick)){
            console.log('Le pseudo ' + nick + ' est déjà utilisé')
        } else {
            clients.push(nick)
            console.log(clients)
            socket.broadcast.emit('nouveau_client', nick)
        }
    });

    // Dès qu'on reçoit un message, on récupère le nick de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {
        console.log(chalk.blue(socket.nick + ' : ' + message))
        socket.broadcast.emit('message', { nick: socket.nick, message: message })
    });
    
    socket.on('disconnect', function () {
        console.log(chalk.red(socket.nick + ' a quitter le salon'))
        socket.broadcast.emit('message', { nick: socket.nick, message: ' a quitté le salon' })
        clients.splice(clients.indexOf(socket.nick), 1);
        console.log(clients)
    });
});

http.listen(port, () => console.log(`server listening on port: ${port}`))