/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('React');
const View = require('View');

class BorderBox extends React.Component<$FlowFixMeProps> {
  render() {
    const box = this.props.box;
    if (!box) {
      return this.props.children;
    }
    const style = {
      borderTopWidth: box.top,
      borderBottomWidth: box.bottom,
      borderLeftWidth: box.left,
      borderRightWidth: box.right,
    };
    return <View style={[style, this.props.style]}>{this.props.children}</View>;
  }
}

module.exports = BorderBox;
