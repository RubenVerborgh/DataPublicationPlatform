/*! @license MIT ©2013 Ruben Verborgh */
var fs = require('fs'),
    path = require('path'),
    Q = require('q');

var idMatcher = /^([a-z]+)_id$/;

/* Resource provider that uses a JSON file tree for storage. */
function JsonResourceProvider(path, host) {
  this.path = path;
  this.host = host;
}

JsonResourceProvider.prototype = {
  /* Looks up a resource by key and returns it through the callback. */
  findResource: function (key, addChildResources) {
    if (!/^\/[a-z]+s\/\d+$/.test(key))
      return Q.reject(new Error('invalid resource identifier: ' + key));

    // Determine the file path (files are grouped in three-digit folders)
    var self = this,
        kind = key.match(/([a-z]+)s/)[1],
        folderName = path.join(this.path, key.replace(/(\d{3})/g, '$1/').replace(/\d+$/, '')),
        fileName = path.join(folderName, key.match(/\d+/) + '.json');

    // Read and parse the JSON file from disk
    return Q.nfcall(fs.readFile, fileName, 'utf8')
    .then(JSON.parse)
    .then(function (resource) {
      // Add this application's identifiers
      resource.kind = kind;
      resource.url = 'http://' + self.host + key;

      // Instantiate child resources if requested
      if (addChildResources) {
        var childResources = [];
        // Find all `id` keys in the resource, which indicate child resources
        Object.keys(resource).forEach(function (key) {
          var value = resource[key], idMatch, type;
          if (value) {
            // Case { type: { id: 123 } }
            if (value.id) {
              childResources.push(self.addChildResource(resource, key, value.id));
            }
            // Case { type_id: 123 }
            else if (idMatch = key.match(idMatcher)) {
              type = idMatch[1];
              delete resource[key];
              childResources.push(self.addChildResource(resource, type, value));
            }
            // Case { types: { x_id: 123, y_id: 124 } }
            else if (value instanceof Array) {
              for (var i = 0; i < value.length; i++) {
                var item = value[i];
                for (key in item)
                  if (idMatch = key.match(idMatcher)) {
                    type = idMatch[1];
                    item[type + '_url'] = ['http:/', self.host, type + 's', item[key]].join('/');
                    delete item[key];
                  }
              }
            }
          }
        });
        return Q.all(childResources).then(function () { return resource; });
      }
      return resource;
    });
  },

  /* Adds a child resource to the specified resource. */
  addChildResource: function (resource, type, id) {
    return this.findResource('/' + type + 's/' + id, false).then(function (childResource) {
      resource[type] = childResource;
    }, function (error) {});
  },

  /* Return the categories in the dataset. */
  getCategories: function () {
    var self = this;
    return Q.nfcall(fs.readdir, this.path).then(function (paths) {
      var categories =  paths.filter(function (path) { return (/s$/).test(path); })
                             .map(function (path) {
                                    return { title: path, url: ['http:/', self.host, path].join('/') };
                                  });
      return { kind: 'categories', categories: categories };
    });
  },
};

module.exports = JsonResourceProvider;
