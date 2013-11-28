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
  /* Gets the categories in the dataset. */
  getCategories: function () {
    var host = this.host;
    // Enumerate the category folders
    return Q.nfcall(fs.readdir, this.path).then(function (paths) {
      var categories = paths.filter(function (path) { return (/s$/).test(path); })
                            .map(function (path) {
                                  return { title: path, url: ['http:/', host, path].join('/') };
                                });
      return { kind: 'categories', categories: categories };
    });
  },

  /* Gets the items of the specified category. */
  getCategoryItems: function (category) {
    var host = this.host, items = [], deferred = Q.defer(),
        index = path.join(this.path, category + 's', 'index.json');
    return Q.nfcall(fs.readFile, index).then(JSON.parse).then(function (items) {
      var title = category[0].toUpperCase() + category.substr(1) + 's';
      // Convert the file name to the corresponding identifier
      for (var i = 0; i < items.length; i++) {
        var item = items[i],
            id = item.file.match(/(\d+)\.json/)[1];
        item.url = 'http://' + host + '/' + category + 's/' + id;
        delete item.file;
      }
      return { kind: 'category', title: title, items: items };
    });
  },

  /* Gets a member of a category. */
  getCategoryItem: function (kind, id, addChildItems) {
    // Determine the file path (files are grouped in three-digit folders)
    var self = this,
        folderName = path.join(this.path, kind + 's', id.replace(/(\d{3})/g, '$1/').replace(/\d+$/, '')),
        fileName = path.join(folderName, id.match(/\d+/) + '.json');

    // Read and parse the JSON file from disk
    return Q.nfcall(fs.readFile, fileName, 'utf8')
    .then(JSON.parse)
    .then(function (resource) {
      // Add this application's identifiers
      resource.kind = kind;
      resource.url = 'http://' + self.host + '/' + kind + 's/' + id;

      // Instantiate child resources if requested
      if (addChildItems) {
        var childItems = [];
        // Find all `id` keys in the resource, which indicate child resources
        Object.keys(resource).forEach(function (key) {
          var value = resource[key], idMatch;
          if (value) {
            // Case { type: { id: 123 } }
            if (value.id) {
              childItems.push(self.getCategoryItem(key, value.id, false).then(function (item) {
                resource[key] = item;
              }, function (error) {}));
            }
            // Case { type_id: 123 }
            else if (idMatch = key.match(idMatcher)) {
              var kind = idMatch[1];
              childItems.push(self.getCategoryItem(kind, value, false).then(function (item) {
                resource[kind] = item;
              }, function (error) {}));
            }
            // Case { types: [ x_id: 123, y_id: 124 ] }
            else if (value instanceof Array) {
              for (var i = 0; i < value.length; i++) {
                var item = value[i];
                if (item.id) {
                  item.url = 'http://' + self.host + '/' + key + '/' + item.id;
                }
                else {
                  for (var itemKey in item) {
                    if (idMatch = itemKey.match(idMatcher)) {
                      type = idMatch[1];
                      item[type + '_url'] = ['http:/', self.host, type + 's', item[itemKey]].join('/');
                      delete item[itemKey];
                    }
                  }
                }
              }
            }
          }
        });
        return Q.all(childItems).then(function () { return resource; });
      }
      return resource;
    });
  },
};

module.exports = JsonResourceProvider;
