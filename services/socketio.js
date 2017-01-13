var express = require('express');


var methods = {};

methods.setupSocketIo = function(io) {
	methods.io = io;
};

module.exports = methods;
