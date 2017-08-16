/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule InspectorOverlay
 * @flow
 */
'use strict';

var Dimensions = require('Dimensions');
var ElementBox = require('ElementBox');
var PropTypes = require('prop-types');
var React = require('React');
var StyleSheet = require('StyleSheet');
var UIManager = require('UIManager');
var View = require('View');

type EventLike = {
  nativeEvent: Object,
};

class InspectorOverlay extends React.Component {
  props: {
    inspected?: {
      frame?: Object,
      style?: any,
    },
    inspectedViewTag?: number,
    onTouchViewTag: (tag: number, frame: Object, pointerY: number) => void,
  };

  static propTypes = {
    inspected: PropTypes.shape({
      frame: PropTypes.object,
      style: PropTypes.any,
    }),
    inspectedViewTag: PropTypes.number,
    onTouchViewTag: PropTypes.func.isRequired,
  };

  findViewForTouchEvent = (e: EventLike) => {
    var {locationX, locationY} = e.nativeEvent.touches[0];
    UIManager.findSubviewIn(
      this.props.inspectedViewTag,
      [locationX, locationY],
      (nativeViewTag, left, top, width, height) => {
        this.props.onTouchViewTag(nativeViewTag, {left, top, width, height}, locationY);
      }
    );
  };

  shouldSetResponser = (e: EventLike): bool => {
    this.findViewForTouchEvent(e);
    return true;
  };

  render() {
    var content = null;
    if (this.props.inspected) {
      content = <ElementBox frame={this.props.inspected.frame} style={this.props.inspected.style} />;
    }

    return (
      <View
        onStartShouldSetResponder={this.shouldSetResponser}
        onResponderMove={this.findViewForTouchEvent}
        style={[styles.inspector, {height: Dimensions.get('window').height}]}>
        {content}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  inspector: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
  },
});

module.exports = InspectorOverlay;
