/*! @license MIT ©2013 Ruben Verborgh */
var express = require('express'),
    Negotiator = require('negotiator'),
    Q = require('q'),
    path = require('path');

// Content types and the corresponding representation generators
var representers = {
  'text/html': new (require('./representers/HtmlRepresenter'))(),
  'text/turtle': new (require('./representers/TurtleRepresenter'))(),
  'application/json': new (require('./representers/JsonRepresenter'))(),
};

/* A server with content negotiation. */
function Server(host, datasource) {
  var server = express();

  /* All categories */
  server.get('/', function (req, res) {
    datasource.getCategories().then(createRepresenter(req, res, 200));
  });

  /* All items in a specific category */
  server.get(/^\/([a-z]+)s$/, function (req, res) {
    var categoryName = req.params[0],
        category = datasource.getCategoryItems(categoryName);
    Q.when(category).then(createRepresenter(req, res, 200));
  });

  /* An item from a category */
  server.get(/^\/([a-z]+)s\/(\d+)$/, function (req, res) {
    var categoryName = req.params[0], id = req.params[1],
        item = datasource.getCategoryItem(categoryName, id, true);
    Q.when(item).then(createRepresenter(req, res, 200));
  });

  /* Stylesheets */
  server.get(/^\/stylesheets\/\w+$/, function (req, res) {
    res.sendfile(path.join(__dirname, '../assets' + req.url + '.css'));
  });

  /* Creates and sends an appropriate representation of the given resource */
  function createRepresenter(req, res, status) {
    return function (resource) {
      // Get the preferred content type and the associated representer
      var contentType = new Negotiator(req).preferredMediaType(Object.keys(representers)),
          representer = representers[contentType];
      // Allow access from any source
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Try to represent the resource
      return Q.when(representer.represent(resource)).then(function (representation) {
        // Set the correct content type and send the representation
        res.setHeader('Content-Type', contentType);
        res.send(status, representation);
      })
      // If it fails, represent the error
      .then(null, function (error) {
        var errorResource = { kind: 'error', title: 'Not found', detail: error.message };
        return createRepresenter(req, res, 404)(errorResource);
      });
    };
  }

  return server;
}

module.exports = Server;
