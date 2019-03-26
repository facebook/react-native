/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Dimensions = require('Dimensions');
const ElementBox = require('ElementBox');
const PropTypes = require('prop-types');
const React = require('React');
const StyleSheet = require('StyleSheet');
const UIManager = require('UIManager');
const View = require('View');

type EventLike = {
  nativeEvent: Object,
};

class InspectorOverlay extends React.Component<{
  inspected?: {
    frame?: Object,
    style?: any,
  },
  inspectedViewTag?: number,
  onTouchViewTag: (tag: number, frame: Object, pointerY: number) => void,
}> {
  static propTypes = {
    inspected: PropTypes.shape({
      frame: PropTypes.object,
      style: PropTypes.any,
    }),
    inspectedViewTag: PropTypes.number,
    onTouchViewTag: PropTypes.func.isRequired,
  };

  findViewForTouchEvent = (e: EventLike) => {
    const {locationX, locationY} = e.nativeEvent.touches[0];
    UIManager.findSubviewIn(
      this.props.inspectedViewTag,
      [locationX, locationY],
      (nativeViewTag, left, top, width, height) => {
        this.props.onTouchViewTag(
          nativeViewTag,
          {left, top, width, height},
          locationY,
        );
      },
    );
  };

  shouldSetResponser = (e: EventLike): boolean => {
    this.findViewForTouchEvent(e);
    return true;
  };

  render() {
    let content = null;
    if (this.props.inspected) {
      content = (
        <ElementBox
          frame={this.props.inspected.frame}
          style={this.props.inspected.style}
        />
      );
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

const styles = StyleSheet.create({
  inspector: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
  },
});

module.exports = InspectorOverlay;
