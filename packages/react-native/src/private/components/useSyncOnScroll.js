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
import type {HostComponent} from '../../../Libraries/Renderer/shims/ReactNativeTypes';

import * as React from 'react';
import {useImperativeHandle, useRef, useState} from 'react';

export type TScrollViewNativeComponentInstance = React.ElementRef<
  HostComponent<ScrollViewNativeProps>,
>;

export type TScrollViewNativeImperativeHandle = {
  componentRef: React.RefObject<TScrollViewNativeComponentInstance | null>,
  unstable_setEnableSyncOnScroll: (enabled: true) => void,
};

/**
 * Hook used by `HScrollViewNativeComponent` and `VScrollViewNativeComponent`
 * to make an implementation of `unstable_setEnableSyncOnScroll` available that
 * does not require updating all `ScrollView` children.
 */
export default function useSyncOnScroll(
  inputRef: ?React.RefSetter<TScrollViewNativeImperativeHandle | null>,
): [React.RefSetter<TScrollViewNativeComponentInstance | null>, true | void] {
  const componentRef = useRef<TScrollViewNativeComponentInstance | null>(null);
  const [enableSyncOnScroll, setEnableSyncOnScroll] = useState<true | void>();

  useImperativeHandle<TScrollViewNativeImperativeHandle>(inputRef, () => {
    return {
      componentRef,
      unstable_setEnableSyncOnScroll(enabled: true): void {
        setEnableSyncOnScroll(enabled);
      },
    };
  }, []);

  return [componentRef, enableSyncOnScroll];
}
