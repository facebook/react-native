/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BorderBox
 * @flow
 */
'use strict';

var React = require('React');
var View = require('View');

class BorderBox extends React.Component {
  render() {
    var box = this.props.box;
    if (!box) {
      return this.props.children;
    }
    var style = {
      borderTopWidth: box.top,
      borderBottomWidth: box.bottom,
      borderLeftWidth: box.left,
      borderRightWidth: box.right,
    };
    return (
      <View style={[style, this.props.style]}>
        {this.props.children}
      </View>
    );
  }
}

module.exports = BorderBox;

