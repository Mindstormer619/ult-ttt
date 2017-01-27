var express = require('express');
var router = express.Router();
var randomstring = require('randomstring').generate;
var Promise = require('bluebird');
var jwt = Promise.promisifyAll(require('jsonwebtoken'));
var io = rootRequire('services/socketio').io;


var activeGames = [];
var activeSockets = [];


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Games' });
});


router.post('/newgame', function(req, res, next) {
	var newGameUrl = randomstring({length: 8, charset: 'alphanumeric'});
	var gameData = {gameUrl: newGameUrl, p1: null, p2: null};
	activeGames[newGameUrl] = gameData;

	return res.json({gameUrl: newGameUrl});
});


router.get('/game/:gameid', function(req, res, next) {
	res.render('game', {title: 'Game ' + req.params.gameid, gameUrl: req.params.gameid});
});


io.of('/game')
.on('connection', function(socket) {
	console.log("Incoming connection from " + socket.id);
	socket.on('gamecode', function(code) {
		console.log("Code submitted " + code);
		console.log(activeGames);

		if (activeGames[code] === undefined) {
			// this game does not exist
			socket.disconnect();
		}

		if (activeGames[code].p1 == null) {
			// no player 1 yet
			activeGames[code].p1 = socket.id;
			activeSockets[socket.id] = activeGames[code]

			socket.emit('game-response', 'Wait for P2');
		}
		else if (activeGames[code].p2 == null) {
			// no player 2 yet
			activeGames[code].p2 = socket.id;
			activeSockets[socket.id] = activeGames[code];

			socket.emit('game-response', 'Both players connected');
			socket.broadcast.to(activeGames[code].p1).emit('game-response', 'Both players connected');
		}
		else {
			socket.emit('game-response', 'Fuck you.');
			socket.disconnect();
		}
	});

	socket.on('disconnect', function() {
		console.log("Disconnected " + socket.id);
		console.log(activeGames);

		if (activeSockets[socket.id] === undefined) return;

		var gameCode = activeSockets[socket.id].gameUrl;
		delete activeSockets[socket.id];

		if (activeGames[gameCode].p1 == socket.id) activeGames[gameCode].p1 = null;
		else if (activeGames[gameCode].p2 == socket.id) activeGames[gameCode].p2 = null;
		else console.log("What the fuck.");
	});

	socket.on('message', function(msg) {
		console.log("Message from " + socket.id + " is " + msg);
		if (activeSockets[socket.id] === undefined) {
			socket.emit('game-response', 'Man just fuck you.');
			socket.disconnect();
		}

		var gameData = activeSockets[socket.id];
		var recipient = (gameData.p1 != socket.id) ? gameData.p1 : gameData.p2;

		console.log("recipient " + recipient);

		socket.broadcast.to(recipient).emit('player-message', {from: socket.id, msg: msg});
	});
});

module.exports = router;
