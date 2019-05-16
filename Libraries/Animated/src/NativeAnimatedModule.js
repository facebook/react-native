/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';
import type {EndCallback} from './animations/Animation';

export type EventMapping = {|
  nativeEventPath: Array<string>,
  animatedValueTag: ?number,
|};

export type AnimatedNodeConfig = {|
  type?:
    | 'style'
    | 'value'
    | 'props'
    | 'interpolation'
    | 'addition'
    | 'diffclamp'
    | 'division'
    | 'multiplication'
    | 'modulus'
    | 'subtraction'
    | 'transform'
    | 'tracking',
|};

export type AnimatinigNodeConfig = {|
  type?: 'frames' | 'spring' | 'decay',
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
    config: AnimatinigNodeConfig,
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

  // EventEmitter
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeAnimatedModule');
