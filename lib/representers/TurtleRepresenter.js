/*! @license MIT ©2013 Ruben Verborgh */
var N3Writer = require('n3').Writer;

/* Prefixes */
var rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
var foaf = 'http://xmlns.com/foaf/0.1/';
var prefixes = {
  rdfs: rdfs,
  foaf: foaf,
};

/* A generator of Turtle representations. */
function TurtleRepresenter() { }

// Represents the specified resource
TurtleRepresenter.prototype.represent = function (resource) {
  // Set up the output streams
  var output = new StringWriter(), writer = new N3Writer(output, prefixes);
  function addTriple(subject, predicate, object) {
    writer.addTriple({ subject: subject, predicate: predicate, object: object });
  }

  // Create common identifiers
  var documentUrl = resource.url,
      baseUrl = documentUrl + '#',
      resourceUrl = baseUrl + 'concept',
      label = '"' + (resource.title || resource.name) + '"@en';
  writer.addPrefix('', baseUrl);

  // Add the triples
  addTriple(documentUrl, foaf + 'primaryTopic', resourceUrl);
  addTriple(resourceUrl, rdfs + 'label', label);

  // Send back the result
  writer.end();
  return output.buffer;
};

// Captures a stream into a string
function StringWriter() {
  return {
    buffer: '',
    write: function (data) { this.buffer += data; },
    end: function () {},
  };
}

module.exports = TurtleRepresenter;
