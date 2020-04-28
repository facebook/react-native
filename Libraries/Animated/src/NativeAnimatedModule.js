/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

type EndResult = {finished: boolean};
type EndCallback = (result: EndResult) => void;

export type EventMapping = {|
  nativeEventPath: Array<string>,
  animatedValueTag: ?number,
|};

export type AnimatedNodeConfig = {|
  // TODO: Type this with better enums.
  type: string,
|};

export type AnimatingNodeConfig = {|
  // TODO: Type this with better enums.
  type: string,
|};

export interface Spec extends TurboModule {
  +createAnimatedNode: (tag: ?number, config: AnimatedNodeConfig) => void;
  +startListeningToAnimatedNodeValue: (tag: ?number) => void;
  +stopListeningToAnimatedNodeValue: (tag: ?number) => void;
  +connectAnimatedNodes: (parentTag: ?number, childTag: ?number) => void;
  +disconnectAnimatedNodes: (parentTag: ?number, childTag: ?number) => void;
  +startAnimatingNode: (
    animationId: ?number,
    nodeTag: ?number,
    config: AnimatingNodeConfig,
    endCallback: EndCallback,
  ) => void;
  +stopAnimation: (animationId: ?number) => void;
  +setAnimatedNodeValue: (nodeTag: ?number, value: ?number) => void;
  +setAnimatedNodeOffset: (nodeTag: ?number, offset: ?number) => void;
  +flattenAnimatedNodeOffset: (nodeTag: ?number) => void;
  +extractAnimatedNodeOffset: (nodeTag: ?number) => void;
  +connectAnimatedNodeToView: (nodeTag: ?number, viewTag: ?number) => void;
  +disconnectAnimatedNodeFromView: (nodeTag: ?number, viewTag: ?number) => void;
  +dropAnimatedNode: (tag: ?number) => void;
  +addAnimatedEventToView: (
    viewTag: ?number,
    eventName: string,
    eventMapping: EventMapping,
  ) => void;
  +removeAnimatedEventFromView: (
    viewTag: ?number,
    eventName: string,
    animatedNodeTag: ?number,
  ) => void;

  // Events
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default (TurboModuleRegistry.get<Spec>('NativeAnimatedModule'): ?Spec);
