const http = require('http')
const path = require('path')
const express = require('express')
const socket = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = socket(server);

const port = process.env.PORT || 80;

//Essentials
let connections = [];
let waitingQueue = [];
let pairs = [];

//Middleware
app.set('view engine', 'ejs');
app.use("/asset", express.static(path.join(__dirname, "/public")));

//Routing
app.get("/", (req, res) => {
    res.render('index');
})

app.get("/total-user", (req, res) => {
    res.status(200).json({
        count: connections.length
    })
})

app.get("/*", (req, res) => {
    res.render('error');
})


//Socket 

io.on('connection', socket => {
    connections.push(socket.id);
    
    socket.on('join-chat', interest => {
        let anyUser;
        let isAny = false;

        const myId = socket.id;
        waitingQueue.some(user => {
            if (user.interest === interest) {
                isAny = true;
                anyUser = user.id;

                return true;
            }
        })
        if (isAny) {
            socket.emit('partner', anyUser);
            socket.to(anyUser).emit('partner', socket.id);
            
            pairs.push([anyUser, socket.id]);

            waitingQueue = waitingQueue.filter(user => user.id !== anyUser);
        } else {
            waitingQueue.push({ id: myId, interest });
        }
    });

    socket.on('user typing', partner => {
        socket.to(partner).emit('user typing');
    })

    socket.on('user not typing', partner => {
        socket.to(partner).emit('user not typing');
    })

    socket.on('message', payload => {
        const { to, message } = payload;

        socket.to(to).emit('message', message);
    })

    socket.on('user disconnected', partner => {
        pairs = pairs.filter(pair => !pair.includes(socket.id));

        socket.to(partner).emit('user disconnected');
    })

    socket.on('disconnect', () => {
        waitingQueue = waitingQueue.filter(user => user.id !== socket.id);

        for (pair of pairs) {
            if (pair.includes(socket.id)) {
                socket.to(pair[pair.indexOf(socket.id) === 1 ? 0 : 1]).emit('user disconnected');

                pairs.splice(pairs.indexOf(pair));
            }
        }

        connections = connections.filter(id => id !== socket.id);
    })
})

server.listen(port, () => console.log(`Server started at port: ${port}`))

