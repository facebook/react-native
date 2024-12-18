/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {RefObject} from 'react';
import type {HostInstance} from 'react-native';
import type {SyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';

import PopupMenuAndroidNativeComponent, {
  Commands,
} from './PopupMenuAndroidNativeComponent.android';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {useCallback, useImperativeHandle, useRef} from 'react';

type PopupMenuSelectionEvent = SyntheticEvent<
  $ReadOnly<{
    item: number,
  }>,
>;

type PopupMenuDismissEvent = SyntheticEvent<$ReadOnly<{}>>;

export type PopupMenuAndroidInstance = {
  +show: () => void,
};

type Props = {
  menuItems: $ReadOnlyArray<string>,
  onSelectionChange: number => void,
  onDismiss?: () => void,
  children: React.Node,
  instanceRef: RefObject<?PopupMenuAndroidInstance>,
};

export default function PopupMenuAndroid({
  menuItems,
  onSelectionChange,
  onDismiss,
  children,
  instanceRef,
}: Props): React.Node {
  const nativeRef = useRef<HostInstance | null>(null);
  const _onSelectionChange = useCallback(
    (event: PopupMenuSelectionEvent) => {
      onSelectionChange(event.nativeEvent.item);
    },
    [onSelectionChange],
  );
  const _onDismiss = useCallback(
    (event: PopupMenuDismissEvent) => {
      onDismiss?.();
    },
    [onDismiss],
  );

  useImperativeHandle(instanceRef, ItemViewabilityInstance => {
    return {
      show() {
        Commands.show(nullthrows(nativeRef.current));
      },
    };
  });

  return (
    <PopupMenuAndroidNativeComponent
      ref={nativeRef}
      onPopupMenuSelectionChange={_onSelectionChange}
      onPopupMenuDismiss={_onDismiss}
      menuItems={menuItems}>
      {children}
    </PopupMenuAndroidNativeComponent>
  );
}
