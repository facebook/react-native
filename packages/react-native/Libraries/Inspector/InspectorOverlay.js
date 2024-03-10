/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {PressEvent} from '../Types/CoreEventTypes';
import type {InspectedElement} from './Inspector';

const View = require('../Components/View/View');
const StyleSheet = require('../StyleSheet/StyleSheet');
const ElementBox = require('./ElementBox');
const React = require('react');

type Props = $ReadOnly<{|
  inspected?: ?InspectedElement,
  onTouchPoint: (locationX: number, locationY: number) => void,
|}>;

function InspectorOverlay({inspected, onTouchPoint}: Props): React.Node {
  const findViewForTouchEvent = (e: PressEvent) => {
    const {locationX, locationY} = e.nativeEvent.touches[0];

    onTouchPoint(locationX, locationY);
  };

  const handleStartShouldSetResponder = (e: PressEvent): boolean => {
    findViewForTouchEvent(e);
    return true;
  };

  let content = null;
  if (inspected) {
    content = <ElementBox frame={inspected.frame} style={inspected.style} />;
  }

  return (
    <View
      onStartShouldSetResponder={handleStartShouldSetResponder}
      onResponderMove={findViewForTouchEvent}
      nativeID="inspectorOverlay" /* TODO: T68258846. */
      style={styles.inspector}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  inspector: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

module.exports = InspectorOverlay;
