"use strict";

/**
 * Helper methods for tests.
 */

var recast = require.requireActual('recast');

function stringify(value) {
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  return value;
}

/**
 * Returns a NodePath to the program node of the passed node
 */
function parse(src) {
  return new recast.types.NodePath(recast.parse(stringify(src)).program);
}

/**
 * Injects src into template by replacing the occurrence of %s.
 */
function parseWithTemplate(src, template) {
  return parse(template.replace('%s', stringify(src)));
}

/**
 * Default template that simply defines React and PropTypes.
 */
var REACT_TEMPLATE = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  '%s;',
].join('\n');

var MODULE_TEMPLATE = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  'var Component = React.createClass(%s);',
  'module.exports = Component'
].join('\n');

exports.parse = parse;
exports.parseWithTemplate = parseWithTemplate;
exports.REACT_TEMPLATE = REACT_TEMPLATE;
exports.MODULE_TEMPLATE = MODULE_TEMPLATE;
