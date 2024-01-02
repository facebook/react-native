/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Overlay} from './DebuggingOverlayNativeComponent';

import View from '../Components/View/View';
import UIManager from '../ReactNative/UIManager';
import StyleSheet from '../StyleSheet/StyleSheet';
import DebuggingOverlayNativeComponent, {
  Commands,
} from './DebuggingOverlayNativeComponent';
import * as React from 'react';

const {useRef, useImperativeHandle} = React;
const isNativeComponentReady =
  UIManager.hasViewManagerConfig('DebuggingOverlay');

type DebuggingOverlayHandle = {
  highlightTraceUpdates(updates: Overlay[]): void,
};

function DebuggingOverlay(
  _props: {},
  ref: React.RefSetter<DebuggingOverlayHandle>,
): React.Node {
  useImperativeHandle(
    ref,
    () => ({
      highlightTraceUpdates(updates) {
        if (!isNativeComponentReady) {
          return;
        }

        const nonEmptyRectangles = updates.filter(
          ({rect, color}) => rect.width >= 0 && rect.height >= 0,
        );

        if (nativeComponentRef.current != null) {
          Commands.draw(
            nativeComponentRef.current,
            JSON.stringify(nonEmptyRectangles),
          );
        }
      },
    }),
    [],
  );

  const nativeComponentRef = useRef<React.ElementRef<
    typeof DebuggingOverlayNativeComponent,
  > | null>(null);

  return (
    isNativeComponentReady && (
      <View pointerEvents="none" style={styles.overlay}>
        <DebuggingOverlayNativeComponent
          ref={nativeComponentRef}
          style={styles.overlay}
        />
      </View>
    )
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

const DebuggingOverlayWithForwardedRef: React.AbstractComponent<
  {},
  DebuggingOverlayHandle,
  React.Node,
> = React.forwardRef(DebuggingOverlay);

export default DebuggingOverlayWithForwardedRef;
