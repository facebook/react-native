/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule H2
 */
'use strict';

var Header = require('Header');
var React = require('React');

class H2 extends React.Component {
  render() {
    return <Header {...this.props} level={2}>{this.props.children}</Header>;
  }
}

module.exports = H2;
