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

import type {ScrollViewNativeProps} from '../../../Libraries/Components/ScrollView/ScrollViewNativeComponentType';
import type {ViewProps} from '../../../Libraries/Components/View/ViewPropTypes';
import type {HostComponent} from '../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {TScrollViewNativeImperativeHandle} from './useSyncOnScroll';

import ScrollContentViewNativeComponent from '../../../Libraries/Components/ScrollView/ScrollContentViewNativeComponent';
import ScrollViewNativeComponent from '../../../Libraries/Components/ScrollView/ScrollViewNativeComponent';
import View from '../../../Libraries/Components/View/View';
import Platform from '../../../Libraries/Utilities/Platform';
import useSyncOnScroll from './useSyncOnScroll';
import * as React from 'react';
import {forwardRef} from 'react';

// TODO: After upgrading to React 19, remove `forwardRef` from this component.
export const VScrollViewNativeComponent: React.AbstractComponent<
  ScrollViewNativeProps,
  TScrollViewNativeImperativeHandle,
  // $FlowExpectedError[incompatible-type] - Flow cannot model imperative handles, yet.
> = forwardRef(function VScrollViewNativeComponent(
  props: ScrollViewNativeProps,
  ref: ?React.RefSetter<TScrollViewNativeImperativeHandle | null>,
): React.Node {
  const [componentRef, enableSyncOnScroll] = useSyncOnScroll(ref);
  // NOTE: When `useSyncOnScroll` triggers an update, `props` will not have
  // changed. Notably, `props.children` will be the same, allowing React to
  // bail out during reconciliation.
  return (
    <ScrollViewNativeComponent
      {...props}
      ref={componentRef}
      enableSyncOnScroll={enableSyncOnScroll}
    />
  );
});

export const VScrollContentViewNativeComponent: HostComponent<ViewProps> =
  Platform.OS === 'android' ? View : ScrollContentViewNativeComponent;
