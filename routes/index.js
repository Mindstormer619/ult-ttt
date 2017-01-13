var express = require('express');
var router = express.Router();
var randomstring = require('randomstring').generate;
var Promise = require('bluebird');
var jwt = Promise.promisifyAll(require('jsonwebtoken'));
var io = rootRequire('services/socketio').io;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/newgame', function(req, res, next) {
	var newGameUrl = randomstring({length: 8, charset: 'alphanumeric'});
	console.log(newGameUrl);
	jwt.signAsync({gameUrl: newGameUrl, player: 1}, 'put secret here', null) // XXX put JWT secret here
	.then(function(token) {
		return res.status(200).json({token: token, gameUrl: newGameUrl});
	})
	.catch(next);
});

router.get('/game/:gameid', function(req, res, next) {
	res.send("You have arrived at a game!"); /// XXX
});

io.of('/game')
.on('connection', function(socket) {
	console.log('connected by new user');

	socket.on('authentication', function(msg) {
		console.log('Received token ' + msg);
		jwt.verifyAsync(msg, "put secret here", null)
		.then(function(payload) {
			prettyLog(payload);
			socket.emit('authentication-response', 'Thou art authentic!');
		})
		.catch(function(err) {
			socket.emit('authentication-response', 'Begone, foul beast!');
			socket.disconnect();
		});
	});

	socket.on('disconnect', function() {
		console.log('Disconnected\n----');
	});
});

module.exports = router;
