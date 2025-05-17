/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  AppContainerRootViewRef,
  DebuggingOverlayRef,
} from '../ReactNative/AppContainer-dev';

import DebuggingOverlayRegistry from './DebuggingOverlayRegistry';
import {useEffect} from 'react';

const useSubscribeToDebuggingOverlayRegistry = (
  rootViewRef: AppContainerRootViewRef,
  debuggingOverlayRef: DebuggingOverlayRef,
) => {
  useEffect(() => {
    const subscriber = {rootViewRef, debuggingOverlayRef};

    DebuggingOverlayRegistry.subscribe(subscriber);
    return () => DebuggingOverlayRegistry.unsubscribe(subscriber);
  }, [rootViewRef, debuggingOverlayRef]);
};

export default useSubscribeToDebuggingOverlayRegistry;
