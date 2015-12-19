/**
 * This module was copied from react-tools/src/React.js
 * in order to have web apps render to the DOM when
 * using react-native. The react-native team is most likely
 * working to make this oh-so-much-nicer.
 *
 * @providesModule React
 */

'use strict';

var ReactDOM = require('ReactDOM');
var ReactDOMServer = require('ReactDOMServer');
var ReactIsomorphic = require('ReactIsomorphic');

var assign = require('Object.assign');

var React = {};

assign(React, ReactIsomorphic);
assign(React, ReactDOM);
assign(React, ReactDOMServer);

React.version = '0.14.0-even';

module.exports = React;
