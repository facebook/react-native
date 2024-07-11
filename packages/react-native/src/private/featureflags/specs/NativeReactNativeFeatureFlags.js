/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<b8c7186b243f18f18cb4a2c90811662b>>
 * @flow strict-local
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +commonTestFlag?: () => boolean;
  +allowCollapsableChildren?: () => boolean;
  +allowRecursiveCommitsWithSynchronousMountOnAndroid?: () => boolean;
  +batchRenderingUpdatesInEventLoop?: () => boolean;
  +destroyFabricSurfacesInReactInstanceManager?: () => boolean;
  +enableAlignItemsBaselineOnFabricIOS?: () => boolean;
  +enableCleanTextInputYogaNode?: () => boolean;
  +enableGranularShadowTreeStateReconciliation?: () => boolean;
  +enableMicrotasks?: () => boolean;
  +enableSynchronousStateUpdates?: () => boolean;
  +enableUIConsistency?: () => boolean;
  +fetchImagesInViewPreallocation?: () => boolean;
  +fixIncorrectScrollViewStateUpdateOnAndroid?: () => boolean;
  +fixMappingOfEventPrioritiesBetweenFabricAndReact?: () => boolean;
  +fixMissedFabricStateUpdatesOnAndroid?: () => boolean;
  +fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak?: () => boolean;
  +forceBatchingMountItemsOnAndroid?: () => boolean;
  +fuseboxEnabledDebug?: () => boolean;
  +fuseboxEnabledRelease?: () => boolean;
  +lazyAnimationCallbacks?: () => boolean;
  +setAndroidLayoutDirection?: () => boolean;
  +useImmediateExecutorInAndroidBridgeless?: () => boolean;
  +useModernRuntimeScheduler?: () => boolean;
  +useNativeViewConfigsInBridgelessMode?: () => boolean;
  +useRuntimeShadowNodeReferenceUpdate?: () => boolean;
  +useRuntimeShadowNodeReferenceUpdateOnLayout?: () => boolean;
  +useStateAlignmentMechanism?: () => boolean;
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
