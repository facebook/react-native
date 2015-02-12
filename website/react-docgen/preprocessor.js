"use strict";

var reactTools = require('react-tools');

function process(source) {
  return reactTools.transform(source, {harmony: true, stripTypes: true});
}

exports.process = process;
