/*! @license MIT ©2013 Ruben Verborgh */
var express = require('express');

/* A server with content negotiation. */
function Server(resourceProvider) {
  var server = express();

  /* Index resource */
  server.get('/', function (req, res) {
    res.send('Welcome to the index resource.');
  });

  /* Other resources */
  server.get(/^(\/.+)/, function (req, res) {
    var identifier = req.params[0];
    res.set('Content-Type', 'application/json');
    resourceProvider.findResource(identifier, true).then(
    function (resource) {
      res.send(JSON.stringify(resource, null, 2));
    },
    function (error) {
      var errorResponse = { 'error': identifier + ' not found' };
      res.send(404, JSON.stringify(errorResponse, null, 2));
    });
  });

  return server;
}

module.exports = Server;
