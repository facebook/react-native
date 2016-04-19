/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Portal
 * @flow
 */
'use strict';

var Platform = require('Platform');
var React = require('React');
var ReactNative = require('ReactNative');
var StyleSheet = require('StyleSheet');
var UIManager = require('UIManager');
var View = require('View');

var _portalRef: any;

// Unique identifiers for modals.
var lastUsedTag = 0;

/*
 * Note: Only intended for Android at the moment.  Just use Modal in your iOS
 * code.
 *
 * A container that renders all the modals on top of everything else in the application.
 *
 * Portal makes it possible for application code to pass modal views all the way up to
 * the root element created in `renderApplication`.
 *
 * Never use `<Portal>` in your code. There is only one Portal instance rendered
 * by the top-level `renderApplication`.
 */
var Portal = React.createClass({
  _modals: {},

  statics: {
    /**
     * Use this to create a new unique tag for your component that renders
     * modals. A good place to allocate a tag is in `componentWillMount`
     * of your component.
     * See `showModal` and `closeModal`.
     */
    allocateTag: function(): string {
      return '__modal_' + (++lastUsedTag);
    },

    /**
     * Render a new modal.
     * @param tag A unique tag identifying the React component to render.
     * This tag can be later used in `closeModal`.
     * @param component A React component to be rendered.
     */
    showModal: function(tag: string, component: any) {
      if (!_portalRef) {
        console.error('Calling showModal but no Portal has been rendered.');
        return;
      }
      _portalRef._showModal(tag, component);
    },

    /**
     * Remove a modal from the collection of modals to be rendered.
     * @param tag A unique tag identifying the React component to remove.
     * Must exactly match the tag previously passed to `showModal`.
     */
    closeModal: function(tag: string) {
      if (!_portalRef) {
        console.error('Calling closeModal but no Portal has been rendered.');
        return;
      }
      _portalRef._closeModal(tag);
    },

    /**
     * Get an array of all the open modals, as identified by their tag string.
     */
    getOpenModals: function(): Array<string> {
      if (!_portalRef) {
        console.error('Calling getOpenModals but no Portal has been rendered.');
        return [];
      }
      return _portalRef._getOpenModals();
    },

    notifyAccessibilityService: function() {
      if (!_portalRef) {
        console.error('Calling closeModal but no Portal has been rendered.');
        return;
      }
      _portalRef._notifyAccessibilityService();
    },
  },

  getInitialState: function() {
    this._modals = {};
    return {};
  },

  _showModal: function(tag: string, component: any) {
    // We are about to open first modal, so Portal will appear.
    // Let's disable accessibility for background view on Android.
    if (this._getOpenModals().length === 0) {
      this.props.onModalVisibilityChanged(true);
    }

    this._modals[tag] = component;
    this.forceUpdate();
  },

  _closeModal: function(tag: string) {
    if (!this._modals.hasOwnProperty(tag)) {
      return;
    }
    // We are about to close last modal, so Portal will disappear.
    // Let's enable accessibility for application view on Android.
    if (this._getOpenModals().length === 1) {
      this.props.onModalVisibilityChanged(false);
    }

    delete this._modals[tag];
    this.forceUpdate();
  },

  _getOpenModals: function(): Array<string> {
    return Object.keys(this._modals);
  },

  _notifyAccessibilityService: function() {
    if (Platform.OS === 'android') {
      // We need to send accessibility event in a new batch, as otherwise
      // TextViews have no text set at the moment of populating event.
      setTimeout(() => {
        if (this._getOpenModals().length > 0) {
          UIManager.sendAccessibilityEvent(
            ReactNative.findNodeHandle(this),
            UIManager.AccessibilityEventTypes.typeWindowStateChanged);
        }
      }, 0);
    }
  },

  render: function() {
    _portalRef = this;
    if (!this._modals) {
      return null;
    }
    var modals = [];
    for (var tag in this._modals) {
      modals.push(this._modals[tag]);
    }
    if (modals.length === 0) {
      return null;
    }
    return (
      <View
        style={styles.modalsContainer}
        importantForAccessibility="yes">
        {modals}
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
