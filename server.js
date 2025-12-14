const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = 3000;

// Activer CORS
server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.use(router);
server.listen(port, () => {
    console.log(`JSON Server démarré sur http://localhost:${port}`);
});