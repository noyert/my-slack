const http = require('http').createServer();
const io = require('socket.io')(http);
const port = 3000
var ent = require('ent')
var clients = []
const chalk = require('chalk');
var usersGeneral = []
var usersWorkplace = []
var usersTech = []
var usersNews = []

io.on('connection', function (socket, nick, port, choice) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
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
            // socket.emit('list_client', clients)
        }
    });

    // Dès qu'on reçoit un message, on récupère le nick de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {
        console.log(chalk.blue(socket.nick + ' : ' + message))
        socket.broadcast.emit('message', { nick: socket.nick, message: message })
    });

    socket.on('join_channel', function (choice, nick) {
        socket.join(choice)
        switch (choice) {
            case "général":
                usersGeneral.push(nick)
                break
            case "workplace":
                usersWorkplace.push(nick)
                break
            case "tech":
                usersTech.push(nick)
                break
            case "news":
                usersNews.push(nick)
                break
        }
        console.log(chalk.green(nick + ' a rejoint le channel ' + choice))
    })

    socket.on('channel_users', function (channel) {
        var clientsList = io.sockets.adapter.rooms[channel];
        var numClients = clientsList.length;
        console.log(chalk.blue('Il y a ' + numClients + ' utilisateur(s) connecté(s) sur le channel ' + channel))
        switch (channel) {
            case "général":
                usersGeneral.map((u) => console.log(chalk.blue('- ' + u)))
                break
            case "workplace":
                usersWorkplace.map((u) => console.log(chalk.blue('- ' + u)))
                break
            case "tech":
                usersTech.map((u) => console.log(chalk.blue('- ' + u)))
                break
            case "news":
                usersNews.map((u) => console.log(chalk.blue('- ' + u)))
                break
        }
    })

    socket.on('quit_channel', function (channel, nick) {
        socket.leave(channel)
        switch (channel) {
            case "général":
                usersGeneral.splice(usersGeneral.indexOf(nick), 1);
                break
            case "workplace":
                usersWorkplace.splice(usersWorkplace.indexOf(nick), 1);
                break
            case "tech":
                usersTech.splice(usersTech.indexOf(nick), 1);
                break
            case "news":
                usersNews.splice(usersNews.indexOf(nick), 1);
                break
        }
        console.log(chalk.red(nick + ' a quitté le channel ' + channel))
    })

    socket.on('disconnect', function () {
        console.log(chalk.red(socket.nick + ' a quitter le tchat'))
        socket.broadcast.emit('user_quit', socket.nick)
        clients.splice(clients.indexOf(socket.nick), 1);
        console.log(clients)
    });
});

http.listen(port, () => console.log(`server listening on port: ${port}`))