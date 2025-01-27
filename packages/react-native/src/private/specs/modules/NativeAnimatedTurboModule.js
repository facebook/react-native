/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import shouldUseTurboAnimatedModule from '../../../../Libraries/Animated/shouldUseTurboAnimatedModule';
import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

type EndResult = {finished: boolean, value?: number, ...};
type EndCallback = (result: EndResult) => void;
type SaveValueCallback = (value: number) => void;

export type EventMapping = {
  nativeEventPath: Array<string>,
  animatedValueTag: ?number,
};

// The config has different keys depending on the type of the Node
// TODO(T54896888): Make these types strict
export type AnimatedNodeConfig = Object;
export type AnimatingNodeConfig = Object;

export interface Spec extends TurboModule {
  +startOperationBatch: () => void;
  +finishOperationBatch: () => void;
  +createAnimatedNode: (tag: number, config: AnimatedNodeConfig) => void;
  +updateAnimatedNodeConfig?: (tag: number, config: AnimatedNodeConfig) => void;
  +getValue: (tag: number, saveValueCallback: SaveValueCallback) => void;
  +startListeningToAnimatedNodeValue: (tag: number) => void;
  +stopListeningToAnimatedNodeValue: (tag: number) => void;
  +connectAnimatedNodes: (parentTag: number, childTag: number) => void;
  +disconnectAnimatedNodes: (parentTag: number, childTag: number) => void;
  +startAnimatingNode: (
    animationId: number,
    nodeTag: number,
    config: AnimatingNodeConfig,
    endCallback: EndCallback,
  ) => void;
  +stopAnimation: (animationId: number) => void;
  +setAnimatedNodeValue: (nodeTag: number, value: number) => void;
  +setAnimatedNodeOffset: (nodeTag: number, offset: number) => void;
  +flattenAnimatedNodeOffset: (nodeTag: number) => void;
  +extractAnimatedNodeOffset: (nodeTag: number) => void;
  +connectAnimatedNodeToView: (nodeTag: number, viewTag: number) => void;
  +disconnectAnimatedNodeFromView: (nodeTag: number, viewTag: number) => void;
  +restoreDefaultValues: (nodeTag: number) => void;
  +dropAnimatedNode: (tag: number) => void;
  +addAnimatedEventToView: (
    viewTag: number,
    eventName: string,
    eventMapping: EventMapping,
  ) => void;
  +removeAnimatedEventFromView: (
    viewTag: number,
    eventName: string,
    animatedNodeTag: number,
  ) => void;

  // Events
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;

  // All of the above in a batched mode
  +queueAndExecuteBatchedOperations?: (operationsAndArgs: Array<any>) => void;
}

const NativeModule: ?Spec = shouldUseTurboAnimatedModule()
  ? TurboModuleRegistry.get<Spec>('NativeAnimatedTurboModule')
  : null;

export default NativeModule;
