/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const React = require('React');
const View = require('View');

const requireNativeComponent = require('requireNativeComponent');

const RCTScrollView = requireNativeComponent('RCTScrollView');

class ScrollViewMock extends React.Component {
  render() {
    return (
      <RCTScrollView {...this.props}>
        {this.props.refreshControl}
        <View>
          {this.props.children}
        </View>
      </RCTScrollView>
    );
  }
}

module.exports = ScrollViewMock;
