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

import type {GestureResponderEvent} from '../../../Libraries/Types/CoreEventTypes';
import type {InspectedElement} from './Inspector';

import React from 'react';

const View = require('../../../Libraries/Components/View/View').default;
const StyleSheet = require('../../../Libraries/StyleSheet/StyleSheet').default;
const ElementBox = require('./ElementBox').default;

type Props = $ReadOnly<{
  inspected?: ?InspectedElement,
  onTouchPoint: (locationX: number, locationY: number) => void,
}>;

function InspectorOverlay({inspected, onTouchPoint}: Props): React.Node {
  const findViewForTouchEvent = (e: GestureResponderEvent) => {
    const {locationX, locationY} = e.nativeEvent.touches[0];

    onTouchPoint(locationX, locationY);
  };

  const handleStartShouldSetResponder = (e: GestureResponderEvent): boolean => {
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

export default InspectorOverlay;
