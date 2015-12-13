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

/**
 * A Modal component covers the native view (e.g. UIViewController, Activity)
 * that contains the React Native root.
 *
 * Use Modal in hybrid apps that embed React Native; Modal allows the portion of
 * your app written in React Native to present content above the enclosing
 * native view hierarchy.
 *
 * In apps written with React Native from the root view down, you should use
 * Navigator instead of Modal. With a top-level Navigator, you have more control
 * over how to present the modal scene over the rest of your app by using the
 * configureScene property.
 *
 * This component is only available in iOS at this time.
 */
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
        onDismiss={this.props.onDismiss}
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
  visible: PropTypes.bool,
  onDismiss: PropTypes.func,
};

Modal.defaultProps = {
  visible: true,
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
