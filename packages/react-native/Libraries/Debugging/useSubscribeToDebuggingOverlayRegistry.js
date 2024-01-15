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

import type {AppContainerRootViewRef} from '../ReactNative/AppContainer-dev';

import DebuggingOverlayRegistry from './DebuggingOverlayRegistry';
import {useEffect} from 'react';

const useSubscribeToDebuggingOverlayRegistry = (
  rootViewRef: AppContainerRootViewRef,
) => {
  useEffect(() => {
    const subscriber = {rootViewRef};

    DebuggingOverlayRegistry.subscribe(subscriber);
    return () => DebuggingOverlayRegistry.unsubscribe(subscriber);
  }, [rootViewRef]);
};

export default useSubscribeToDebuggingOverlayRegistry;
