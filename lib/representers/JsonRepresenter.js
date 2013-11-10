/*! @license MIT ©2013 Ruben Verborgh */

/* A generator of JSON representations. */
function JsonRepresenter() { }

// Represents the specified resource
JsonRepresenter.prototype.represent = function (resource) {
  // Strip internal fields
  delete resource.id;
  delete resource['tms:id'];

  // Serialize as JSON
  return JSON.stringify(resource, null, '  ');
};

module.exports = JsonRepresenter;
