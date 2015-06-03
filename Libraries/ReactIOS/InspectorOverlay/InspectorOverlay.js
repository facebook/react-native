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

var InspectorOverlay = React.createClass({
  getInitialState: function() {
    return {
      frame: null,
      hierarchy: [],
    };
  },

  findViewForTouchEvent: function(e) {
    var {locationX, locationY} = e.nativeEvent.touches[0];
    UIManager.findSubviewIn(
      this.props.inspectedViewTag,
      [locationX, locationY],
      (nativeViewTag, left, top, width, height) => {
        var instance = Inspector.findInstanceByNativeTag(this.props.rootTag, nativeViewTag);
        var hierarchy = Inspector.getOwnerHierarchy(instance);
        var publicInstance = instance.getPublicInstance();
        this.setState({
          hierarchy,
          frame: {left, top, width, height},
          style: publicInstance.props ? publicInstance.props.style : {},
        });
      }
    );
  },

  shouldSetResponser: function(e) {
    this.findViewForTouchEvent(e);
    return true;
  },

  render: function() {
    var content = [];

    if (this.state.frame) {
      var distanceToTop = this.state.frame.top;
      var distanceToBottom = Dimensions.get('window').height -
        (this.state.frame.top + this.state.frame.height);

      var justifyContent = distanceToTop > distanceToBottom
        ? 'flex-start'
        : 'flex-end';

      content.push(<ElementBox frame={this.state.frame} style={this.state.style} />);
      content.push(<ElementProperties hierarchy={this.state.hierarchy} />);
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

var ElementProperties = React.createClass({
  render: function() {
    var path = this.props.hierarchy.map((instance) => {
      return instance.getName ? instance.getName() : 'Unknown';
    }).join(' > ');
    return (
      <View style={styles.info}>
        <Text style={styles.path}>
          {path}
        </Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  inspector: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  info: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
  },
  path: {
    color: 'white',
    fontSize: 9,
  }
});

module.exports = InspectorOverlay;
