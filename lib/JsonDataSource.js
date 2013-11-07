/*! @license MIT ©2013 Ruben Verborgh */
var fs = require('fs'),
    path = require('path'),
    Q = require('q');

/* Resource provider that uses a JSON file tree for storage. */
function JsonResourceProvider(path) {
  this.path = path;
}

JsonResourceProvider.prototype = {
  /* Looks up a resource by key and returns it through the callback. */
  findResource: function (key, childResources) {
    if (!/^\/[a-z]+\/\d+$/.test(key))
      return Q.reject('invalid resource identifier: ' + key);

    // Determine the file path (files are grouped in three-digit folders)
    var folderName = path.join(this.path, key.replace(/(\d{3})/g, '$1/').replace(/\d+$/, '')),
        fileName = path.join(folderName, key.match(/\d+/) + '.json');

    // Read, parse, and return the file
    return Q.nfcall(fs.readFile, fileName, 'utf8')
    .then(JSON.parse)
    .then(function (json) {
      return json;
    });
  }
};

module.exports = JsonResourceProvider;
