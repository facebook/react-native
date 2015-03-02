'use strict';

function ModuleDescriptor(fields) {
  if (!fields.id) {
    throw new Error('Missing required fields id');
  }
  this.id = fields.id;

  if (!fields.path) {
    throw new Error('Missing required fields path');
  }
  this.path = fields.path;

  if (!fields.dependencies) {
    throw new Error('Missing required fields dependencies');
  }
  this.dependencies = fields.dependencies;

  this.resolveDependency = fields.resolveDependency;

  this.entry = fields.entry || false;

  this.isPolyfill = fields.isPolyfill || false;

  this._fields = fields;
}

ModuleDescriptor.prototype.toJSON = function() {
  return {
    id: this.id,
    path: this.path,
    dependencies: this.dependencies
  };
};

module.exports = ModuleDescriptor;
