/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

/**
 * This module is for configuring React feature flags for React Native at Meta.
 * These dynamic flags are referenced by `ReactFeatureFlags.native-fb.js` in
 * React's open source repository: github.com/facebook/react
 *
 * ANY CHANGES TO THIS FILE SHOULD BE SYNCED WITH CHANGES IN REACT.
 */

import * as ReactNativeFeatureFlags from '../../featureflags/ReactNativeFeatureFlags';

export const alwaysThrottleRetries: boolean =
  ReactNativeFeatureFlags.alwaysThrottleRetriesInReact();

export const enableAddPropertiesFastPath: boolean =
  ReactNativeFeatureFlags.enableAddPropertiesFastPathInReact();

export const enableFabricCompleteRootInCommitPhase: boolean =
  ReactNativeFeatureFlags.enableFabricCompleteRootInCommitPhaseInReact();

export const enableLazyContextPropagation: boolean =
  ReactNativeFeatureFlags.enableLazyContextPropagationInReact();

export const enablePersistedModeClonedFlag: boolean =
  ReactNativeFeatureFlags.enablePersistedModeClonedFlagInReact();

export const enableShallowPropDiffing: boolean =
  ReactNativeFeatureFlags.enableShallowPropDiffingInReact();

export const passChildrenWhenCloningPersistedNodes: boolean =
  ReactNativeFeatureFlags.passChildrenWhenCloningPersistedNodesInReact();
