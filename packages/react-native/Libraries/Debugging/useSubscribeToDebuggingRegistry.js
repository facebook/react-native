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

import DebuggingRegistry from './DebuggingRegistry';
import {useEffect} from 'react';

const useSubscribeToDebuggingRegistry = (
  rootViewRef: AppContainerRootViewRef,
) => {
  useEffect(() => {
    const subscriber = {rootViewRef};

    DebuggingRegistry.subscribe(subscriber);
    return () => DebuggingRegistry.unsubscribe(subscriber);
  }, [rootViewRef]);
};

export default useSubscribeToDebuggingRegistry;
