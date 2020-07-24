const WebSocket = require('ws');
const uuid = require('uuid');

const server = new WebSocket.Server({ 
  port: 8081,
});

server.sendAll = (data) => {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN)
      client.send(data);
  });
};

server.sendAllBut = (data, ignoreClient) => {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== ignoreClient)
      client.send(data);
  });
};

let clients = [];
function mmdt(type, data) { return JSON.stringify({ type, data }); } //make me data type

server.on('connection', (ws) => {
  ws.isAlive = true;
  ws.sendData = { name: getName(Date.now()), id: uuid.v4() }
  clients.push(ws.sendData);

  ws.send(mmdt('yourId', ws.sendData.id));
  ws.send(mmdt('baseUpdate', clients));
  server.sendAllBut(mmdt('newClient', ws.sendData), ws);

  ws.on('message', (data) => {
    if (data === '__pong__') { 
      //console.log(ws.sendData.name + ' pong');
      return ws.isAlive = true;
    }

    server.sendAllBut(data, ws);
  });

  ws.on('close', () => {
    clients = clients.filter(el => el.id !== ws.sendData.id) 
    server.sendAllBut(mmdt('removeClient', ws.sendData.id), ws);
  });
});

const pinger = setInterval(() => {
  server.clients.forEach((client) => {
    if (!client.isAlive) return console.log(client.name + ' is not responding');

    client.isAlive = false;
    client.send('__ping__');
  });
}, 10000);











//================================================================//
const names = ['Liam', 'Emma', 'Noah', 'Olivia', 'William Ava', 'James Isabella', 'Oliver', 'Sophia', 'Benjamin', 'Charlotte', 'Elijah', 'Mia', 'Lucas Amelia', 'Mason Harper', 'Logan Evelyn', 'Liam', 'Noah', 'William', 'James', 'Logan', 'Benjamin', 'Mason', 'Elijah', 'Oliver', 'Jacob', 'Lucas', 'Michael', 'Alexander', 'Ethan', 'Daniel', 'Matthew', 'Aiden', 'Henry', 'Joseph', 'Jackson', 'Samuel', 'Sebastian', 'David', 'Carter', 'Wyatt', 'Jayden', 'John', 'Owen', 'Dylan', 'Luke', 'Gabriel', 'Anthony', 'Isaac', 'Grayson', 'Jack', 'Julian', 'Levi', 'Christopher', 'Joshua', 'Andrew', 'Lincoln', 'Mateo', 'Ryan', 'Jaxon', 'Nathan', 'Aaron', 'Isaiah', 'Thomas', 'Charles', 'Caleb', 'Josiah', 'Christian', 'Hunter', 'Eli', 'Jonathan', 'Connor', 'Landon', 'Adrian', 'Asher', 'Cameron', 'Leo', 'Theodore', 'Jeremiah', 'Hudson', 'Robert', 'Easton', 'Nolan', 'Nicholas', 'Ezra', 'Colton', 'Angel', 'Brayden', 'Jordan', 'Dominic', 'Austin', 'Ian', 'Adam', 'Elias', 'Jaxson', 'Greyson', 'Jose', 'Ezekiel', 'Carson', 'Evan', 'Maverick', 'Bryson', 'Jace', 'Cooper', 'Xavier', 'Parker', 'Roman', 'Jason', 'Santiago', 'Chase', 'Sawyer', 'Gavin', 'Leonardo', 'Kayden'];
const getName = (seed) => { return names[seed % names.length]; }
//================================================================//
