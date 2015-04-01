/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Portal
 * @flow
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var _portalRef: any;

/*
 * A container that renders all the modals on top of everything else in the application.
 *
 * Portal makes it possible for application code to pass modal views all the way up to
 * the root element created in `renderApplication`.
 *
 * Never use `<Portal>` in your code. There is only one Portal instance rendered
 * by the top-level `renderApplication`.
 */
var Portal = React.createClass({
  statics: {
    showModal: function(component) {
      if (!_portalRef) {
        console.error('Calling showModal but no Portal has been rendered');
        return;
      }
      _portalRef.setState({modal: component});
    },

    closeModal: function() {
      if (!_portalRef) {
        console.error('Calling closeModal but no Portal has been rendered');
        return;
      }
      _portalRef.setState({modal: null});
    },
  },

  getInitialState: function() {
    return {modal: (null: any)};
  },

  render: function() {
    _portalRef = this;
    if (!this.state.modal) {
      return <View />;
    }
    return (
      <View style={styles.modalsContainer}>
        {this.state.modal}
      </View>
    );
  }
});

var styles = StyleSheet.create({
  modalsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

module.exports = Portal;
