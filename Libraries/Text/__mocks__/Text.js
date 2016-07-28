/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

const React = require('React');
const {Component} = React;

const RealText = require.requireActual('Text');

class Text extends Component {
  render() {
    const {children, ...props} = this.props;
    return React.createElement('Text', props, children);
  }
}
Text.propTypes = RealText.propTypes;

module.exports = Text;
