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

  /* Creates and sends an appropriate representation of the given resource */
  function createRepresenter(req, res, status) {
    return function (resource) {
      var contentType = new Negotiator(req).preferredMediaType(Object.keys(representers)),
          representer = representers[contentType];
      return Q.when(representer.represent(resource)).then(function (representation) {
        res.send(status, representation);
      })
      .then(null, function (error) {
        var errorResource = { kind: 'error', title: 'Not found', detail: error.message };
        return createRepresenter(req, res, 404)(errorResource);
      });
    };
  }

  return server;
}

module.exports = Server;
