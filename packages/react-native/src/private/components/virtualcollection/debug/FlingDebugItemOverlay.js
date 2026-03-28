/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import View from '../../../../../Libraries/Components/View/View';
import StyleSheet from '../../../../../Libraries/StyleSheet/StyleSheet';
import Text from '../../../../../Libraries/Text/Text';
import * as ReactNativeFeatureFlags from '../../../featureflags/ReactNativeFeatureFlags';
import * as React from 'react';

let FlingDebugItemOverlay: ?component(nativeID: string);

if (ReactNativeFeatureFlags.enableVirtualViewDebugFeatures()) {
  component FlingDebugItemOverlayInternal(nativeID: string) {
    return (
      <View style={[styles.container]}>
        <Text style={styles.text}>{`(Fling Debug) ${nativeID}`}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      pointerEvents: 'none',
      backgroundColor: 'rgba(0,0,0, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(250,0,0, 0.5)',
      zIndex: 1000,
    },
    text: {
      fontSize: 18,
      backgroundColor: 'rgba(0,0,0, 0.5)',
      color: 'white',
    },
  });
  FlingDebugItemOverlay = FlingDebugItemOverlayInternal;
}

export default FlingDebugItemOverlay;
