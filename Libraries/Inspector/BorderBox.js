/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule BorderBox
 * @flow
 */
'use strict';

var React = require('React');
var View = require('View');

class BorderBox extends React.Component<$FlowFixMeProps> {
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

