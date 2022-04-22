const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;
require('dotenv').config({ path: './secure.env' })
const URL = process.env.URL;
const app = express();
app.use(express.json())

let options = {
    origin: "*"
}

app.use(cors(options))
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

//  register user just for demo not for production

app.post("/register", async function (req, res) {

    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("mumbaichat");
        let user = await db.collection("users").findOne({ email: req.body.email })
        if (user) {
            res.status(401).json({ message: "user already present" })
        } else {
            await db.collection("users").insertOne(req.body);
            res.json({ message: "sucessfully registered" })
        }

        connection.close();

    } catch (error) {
        console.log(error)
    }
})


//    login for the user 



app.post("/login", async function (req, res) {

    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("mumbaichat");
        let user = await db.collection("users").findOne({ email: req.body.email })
        if (user) {
            res.json(user)
        } else {
            res.status(401).json({ message: "no user present" })
        }
    } catch (error) {
        console.log(error)
    }
})


//     get the users from data base

app.get("/getuser", async function (req, res) {

    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("mumbaichat");
        let users = await db.collection("users").find({}).toArray()
        connection.close();
        res.send(users)

    } catch (error) {
        console.log(error)
    }
})



io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`)

    socket.on("join_room", (data) => {
        socket.join(data)
        console.log(data)
        console.log(`user with id : ${socket.id} joined room ${data}`)
    })

    socket.on("send_message", (data) => {

        socket.to(data.email).emit("receive_message", data)
    })

    socket.on("disconnect", () => {
        console.log(`user disconnectd ${socket.id}`)
    })

});

httpServer.listen(process.env.PORT || 3001, () => {
    console.log("server listening")
});