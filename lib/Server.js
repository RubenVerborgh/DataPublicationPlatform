/*! @license MIT ©2013 Ruben Verborgh */
var express = require('express'),
    Negotiator = require('negotiator'),
    Q = require('Q');

// Content types and the corresponding representation generators
var representers = {
  'application/json': new (require('./representers/JsonRepresenter'))(),
  'text/html': new (require('./representers/HtmlRepresenter'))(),
};

/* A server with content negotiation. */
function Server(host, datasource) {
  var server = express();

  /* Index resource */
  server.get('/', function (req, res) {
    datasource.getCategories().then(createRepresenter(req, res, 200));
  });

  /* Other resources */
  server.get(/^(\/.+)/, function (req, res) {
    // Retrieve the resource
    var identifier = req.params[0],
        resource = datasource.findResource(identifier, true);

    // Represent and send the resource
    Q.when(resource).then(createRepresenter(req, res, 200))
    // If this fails, send an error message
    .then(null, function (error) {
      var resource = { kind: 'error', title: identifier + ' not found', detail: error.message };
      return createRepresenter(req, res, 404)(resource);
    });
  });

  /* Creates and sends an appropriate representation of the given resource */
  function createRepresenter(req, res, status) {
    return function (resource) {
      var contentType = new Negotiator(req).preferredMediaType(Object.keys(representers)),
          representer = representers[contentType];
      res.set('Content-Type', contentType);
      return Q.when(representer.represent(resource)).then(function (representation) {
        res.send(status, representation);
      });
    };
  }

  return server;
}

module.exports = Server;
