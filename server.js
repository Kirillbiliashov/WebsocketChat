'use strict';

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const Storage = require('./storage.js');

const index = fs.readFileSync('./index.html', 'utf8');
const rooms = new Map();
const storage = new Storage();

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end(index);
});

server.listen(8000, () => {
  console.log('Listen port 8000');
});

const txtFilename = (name) => `${name}.txt`;

const ws = new WebSocket.Server({ server });

const types = {
  'create': (data, connection) => {
    const filename = txtFilename(data);
    if (!storage.exists(filename)) {
      rooms.set(data, [connection]);
      storage.save(filename);
    }
    else connection.send(JSON.stringify({ error: `Room ${data} already exists` }));
  },
  'enter': (data, connection) => {
    const filename = txtFilename(data);
    if (storage.exists(filename)) {
      rooms.get(data).push(connection);
      const messages = storage.get(filename);
      console.dir([messages]);
      for (const message of messages) {
        connection.send(JSON.stringify({ message }));
      }
    }
    else connection.send(JSON.stringify({ error: `Room ${data} does not exist` }));
  },
  'message': (data, connection) => {
    for (const [room, clients] of rooms.entries()) {
      if (clients.includes(connection)) {
        for (const client of clients) {
          if (client.readyState !== WebSocket.OPEN) continue;
          if (client === connection) continue;
          client.send(JSON.stringify({ message: data }), { binary: false });
        }
        storage.save(txtFilename(room), data);
      }
    }
  }
}

ws.on('connection', (connection, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`Connected ${ip}`);
  connection.on('message', (message) => {
    const obj = JSON.parse(message);
    const { data, type } = obj;
    const handler = types[type];
    handler(data, connection);
  });

  connection.on('close', () => {
    const values = rooms.values();
    for (const clients of values) {
      const idx = clients.indexOf(connection);
      if (idx > -1) clients.splice(idx, 1);
    }
    console.log(`Disconnected ${ip}`);
  });
});

ws.on('listening', () => storage.load(rooms));
