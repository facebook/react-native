/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import StyleSheet from '../../StyleSheet/StyleSheet';
import LayoutConformanceNativeComponent from './LayoutConformanceNativeComponent';
import * as React from 'react';

type Props = $ReadOnly<{
  /**
   * strict: Layout in accordance with W3C spec, even when breaking
   * compatibility: Layout with the same behavior as previous versions of React Native
   */
  mode: 'strict' | 'compatibility',

  children: React.Node,
}>;

// We want a graceful fallback for apps using legacy arch, but need to know
// ahead of time whether the component is available, so we test for global.
// This does not correctly handle mixed arch apps (which is okay, since we just
// degrade the error experience).
const isFabricUIManagerInstalled = global?.nativeFabricUIManager != null;

function LayoutConformance(props: Props): React.Node {
  return (
    <LayoutConformanceNativeComponent {...props} style={styles.container} />
  );
}

function UnimplementedLayoutConformance(props: Props): React.Node {
  if (__DEV__) {
    const warnOnce = require('../../Utilities/warnOnce');

    warnOnce(
      'layoutconformance-unsupported',
      '"LayoutConformance" is only supported in the New Architecture',
    );
  }

  return props.children;
}

export default (isFabricUIManagerInstalled
  ? LayoutConformance
  : UnimplementedLayoutConformance) as component(...Props);

const styles = StyleSheet.create({
  container: {
    display: 'contents',
  },
});
