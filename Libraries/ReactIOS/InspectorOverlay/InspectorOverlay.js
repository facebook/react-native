/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule InspectorOverlay
 */
'use strict';

var Dimensions = require('Dimensions');
var Inspector = require('Inspector');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var UIManager = require('NativeModules').UIManager;
var View = require('View');
var ElementBox = require('ElementBox');
var ElementProperties = require('ElementProperties');

var InspectorOverlay = React.createClass({
  getInitialState: function() {
    return {
      frame: null,
      pointerY: 0,
      hierarchy: [],
      selection: -1,
    };
  },

  findViewForTouchEvent: function(e) {
    var {locationX, locationY} = e.nativeEvent.touches[0];
    UIManager.findSubviewIn(
      this.props.inspectedViewTag,
      [locationX, locationY],
      (nativeViewTag, left, top, width, height) => {
        var instance = Inspector.findInstanceByNativeTag(this.props.rootTag, nativeViewTag);
        if (!instance) {
          return;
        }
        var hierarchy = Inspector.getOwnerHierarchy(instance);
        var publicInstance = instance.getPublicInstance();
        this.setState({
          hierarchy,
          pointerY: locationY,
          selection: hierarchy.length - 1,
          frame: {left, top, width, height},
          style: publicInstance.props ? publicInstance.props.style : {},
        });
      }
    );
  },

  setSelection(i) {
    var instance = this.state.hierarchy[i];
    var publicInstance = instance.getPublicInstance();
    UIManager.measure(React.findNodeHandle(instance), (x, y, width, height, left, top) => {
      this.setState({
        frame: {left, top, width, height},
        style: publicInstance.props ? publicInstance.props.style : {},
        selection: i,
      });
    });
  },

  shouldSetResponser: function(e) {
    this.findViewForTouchEvent(e);
    return true;
  },

  render: function() {
    var content = [];
    var justifyContent = 'flex-end';

    if (this.state.frame) {
      var distanceToTop = this.state.pointerY;
      var distanceToBottom = Dimensions.get('window').height - distanceToTop;

      justifyContent = distanceToTop > distanceToBottom
        ? 'flex-start'
        : 'flex-end';

      content.push(<ElementBox frame={this.state.frame} style={this.state.style} />);
      content.push(
        <ElementProperties
          style={this.state.style}
          frame={this.state.frame}
          hierarchy={this.state.hierarchy}
          selection={this.state.selection}
          setSelection={this.setSelection}
        />
      );
    } else {
      content.push(
        <View style={styles.welcomeMessage}>
          <Text style={styles.welcomeText}>Welcome to the inspector! Tap something to inspect it.</Text>
        </View>
      );
    }
    return (
      <View
        onStartShouldSetResponder={this.shouldSetResponser}
        onResponderMove={this.findViewForTouchEvent}
        style={[styles.inspector, {justifyContent}]}>
        {content}
      </View>
    );
  }
});

var styles = StyleSheet.create({
  welcomeMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    paddingVertical: 50,
  },
  welcomeText: {
    color: 'white',
  },
  inspector: {
    backgroundColor: 'rgba(255,255,255,0.0)',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

module.exports = InspectorOverlay;
