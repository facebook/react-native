/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

export type MutationObserverId = number;

// These types are not supported by the codegen.
type ShadowNode = mixed;
type InstanceHandle = mixed;
type ReactNativeElement = mixed;
type ReadOnlyNode = mixed;

export type NativeMutationRecord = {
  mutationObserverId: MutationObserverId,
  target: ReactNativeElement,
  addedNodes: $ReadOnlyArray<ReadOnlyNode>,
  removedNodes: $ReadOnlyArray<ReadOnlyNode>,
  ...
};

export type NativeMutationObserverObserveOptions = {
  mutationObserverId: number,
  targetShadowNode: ShadowNode,
  subtree: boolean,
};

export interface Spec extends TurboModule {
  +observe: (options: NativeMutationObserverObserveOptions) => void;
  +unobserve: (
    mutationObserverId: number,
    targetShadowNode: ShadowNode,
  ) => void;
  +connect: (
    notifyMutationObservers: () => void,
    // We need this to retain the public instance before React removes the
    // reference to it (which happen in mutations that remove nodes, or when
    // nodes are removed between the change and the callback is executed in JS).
    getPublicInstanceFromInstanceHandle: (
      instanceHandle: InstanceHandle,
    ) => ReadOnlyNode,
  ) => void;
  +disconnect: () => void;
  +takeRecords: () => $ReadOnlyArray<NativeMutationRecord>;
}

export default (TurboModuleRegistry.get<Spec>(
  'NativeMutationObserverCxx',
): ?Spec);
