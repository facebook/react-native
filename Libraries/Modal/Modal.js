/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Modal
 * @flow
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');
var RCTModalHostView = requireNativeComponent('RCTModalHostView', null);

class Modal extends React.Component {
  render(): ?ReactElement {
    if (this.props.visible === false) {
      return null;
    }

    return (
      <RCTModalHostView animated={this.props.animated} style={styles.modal}>
        <View style={styles.container}>
          {this.props.children}
        </View>
      </RCTModalHostView>
    );
  }
}

var styles = StyleSheet.create({
  modal: {
    position: 'absolute',
  },
  container: {
    left: 0,
    position: 'absolute',
    top: 0,
  }
});

module.exports = Modal;
