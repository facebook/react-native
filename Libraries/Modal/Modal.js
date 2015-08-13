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

var PropTypes = require('ReactPropTypes');
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

    if (this.props.transparent) {
      var containerBackgroundColor = {backgroundColor: 'transparent'};
    }

    return (
      <RCTModalHostView
        animated={this.props.animated}
        transparent={this.props.transparent}
        style={styles.modal}>
        <View style={[styles.container, containerBackgroundColor]}>
          {this.props.children}
        </View>
      </RCTModalHostView>
    );
  }
}

Modal.propTypes = {
  animated: PropTypes.bool,
  transparent: PropTypes.bool,
};

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
