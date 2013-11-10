/*! @license MIT ©2013 Ruben Verborgh */
var qejs = require('qejs'),
    path = require('path'),
    Q = require('q');

/* A generator of HTML representations. */
function HtmlRepresenter() {
  this._templatesPath = path.join(__dirname, '../../templates/html/');
}

// Represents the specified resource
HtmlRepresenter.prototype.represent = function (resource) {
  var template = this._templatesPath + resource.kind + '.html';
  resource.resource = resource; // add self-reference for easy property lookup
  return qejs.renderFile(template, { locals: resource });
};

module.exports = HtmlRepresenter;
