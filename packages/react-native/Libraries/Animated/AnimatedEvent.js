/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {PlatformConfig} from './AnimatedPlatformConfig';

import AnimatedNode from './nodes/AnimatedNode';
import AnimatedProps from './nodes/AnimatedProps';
import {findNodeHandle} from '../ReactNative/RendererProxy';
import NativeAnimatedHelper from '../../src/private/animated/NativeAnimatedHelper';
import AnimatedValue from './nodes/AnimatedValue';
import AnimatedValueXY from './nodes/AnimatedValueXY';
import invariant from 'invariant';

export type Mapping =
  | {[key: string]: Mapping, ...}
  | AnimatedValue
  | AnimatedValueXY;
export type EventMapping = {
  nativeEventPath: Array<string>,
  animatedValue: AnimatedValue | AnimatedValueXY,
  valueListenerId?: string,
}
export type EventConfig = {
  listener?: ?Function,
  useNativeDriver: boolean,
  platformConfig?: PlatformConfig,
};

const dummyListener = () => {};

// Find animated values in `argMapping` and create an array representing their
// key path inside the `nativeEvent` object. Ex.: ['contentOffset', 'x'].
function traverse(argMapping: mixed, path: Array<string>, mapping: ?Array<EventMapping>): Array<EventMapping> {
  if (!mapping) {
    mapping = [];
  }

  if (argMapping instanceof AnimatedValue) {
    mapping.push({
      nativeEventPath: path,
      animatedValue: argMapping,
    });
  } else if (argMapping instanceof AnimatedValueXY) {
    traverse(argMapping.x, path.concat('x'), mapping);
    traverse(argMapping.y, path.concat('y'), mapping);
  } else if (typeof argMapping === 'object') {
    for (const key in argMapping) {
      traverse(argMapping[key], path.concat(key), mapping);
    }
  }

  return mapping;
}

export function attachNativeEvent(
  viewRef: any,
  eventName: string,
  argMapping: $ReadOnlyArray<?Mapping>,
  platformConfig: ?PlatformConfig,
): {detach: () => void} {
  invariant(
    argMapping[0] && argMapping[0].nativeEvent,
    'Native driven events only support animated values contained inside `nativeEvent`.',
  );

  // Assume that the event containing `nativeEvent` is always the first argument.
  const eventMappings = traverse(argMapping[0].nativeEvent, []);

  const viewTag = findNodeHandle(viewRef);
  if (viewTag != null) {
    eventMappings.forEach(mapping => {
      mapping.animatedValue.__makeNative(platformConfig);

      NativeAnimatedHelper.API.addAnimatedEventToView(
        viewTag,
        eventName,
        {
          nativeEventPath: mapping.nativeEventPath,
          animatedValueTag: mapping.animatedValue.__getNativeTag(),
        },
      );

      mapping.valueListenerId = mapping.animatedValue.addListener(dummyListener);
    });
  }

  return {
    detach() {
      if (viewTag != null) {
        eventMappings.forEach(mapping => {
          NativeAnimatedHelper.API.removeAnimatedEventFromView(
            viewTag,
            eventName,
            // $FlowFixMe[incompatible-call]
            mapping.animatedValue.__getNativeTag(),
          );

          if (mapping.valueListenerId !== undefined) {
            mapping.animatedValue.removeListener(mapping.valueListenerId);
          }
        });
      }
    },
  };
}

function validateMapping(argMapping: $ReadOnlyArray<?Mapping>, args: any) {
  const validate = (recMapping: ?Mapping, recEvt: any, key: string) => {
    if (recMapping instanceof AnimatedValue) {
      invariant(
        typeof recEvt === 'number',
        'Bad mapping of event key ' +
          key +
          ', should be number but got ' +
          typeof recEvt,
      );
      return;
    }
    if (recMapping instanceof AnimatedValueXY) {
      invariant(
        typeof recEvt.x === 'number' && typeof recEvt.y === 'number',
        'Bad mapping of event key ' + key + ', should be XY but got ' + recEvt,
      );
      return;
    }
    if (typeof recEvt === 'number') {
      invariant(
        recMapping instanceof AnimatedValue,
        'Bad mapping of type ' +
          typeof recMapping +
          ' for key ' +
          key +
          ', event value must map to AnimatedValue',
      );
      return;
    }
    invariant(
      typeof recMapping === 'object',
      'Bad mapping of type ' + typeof recMapping + ' for key ' + key,
    );
    invariant(
      typeof recEvt === 'object',
      'Bad event of type ' + typeof recEvt + ' for key ' + key,
    );
    for (const mappingKey in recMapping) {
      validate(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
    }
  };

  invariant(
    args.length >= argMapping.length,
    'Event has less arguments than mapping',
  );
  argMapping.forEach((mapping, idx) => {
    validate(mapping, args[idx], 'arg' + idx);
  });
}

export class AnimatedEvent {
  _argMapping: $ReadOnlyArray<?Mapping>;
  _dependantAnimatedProps: Array<AnimatedProps> = [];
  _flushUpdatesTimer: any;
  _listeners: Array<Function> = [];
  _attachedEvent: ?{detach: () => void, ...};
  __isNative: boolean;
  __platformConfig: ?PlatformConfig;

  constructor(argMapping: $ReadOnlyArray<?Mapping>, config: EventConfig) {
    this._argMapping = argMapping;

    if (config == null) {
      console.warn('Animated.event now requires a second argument for options');
      config = {useNativeDriver: false};
    }

    if (config.listener) {
      this.__addListener(config.listener);
    }
    this._attachedEvent = null;
    this.__isNative = NativeAnimatedHelper.shouldUseNativeDriver(config);
    this.__platformConfig = config.platformConfig;
  }

  __addListener(callback: Function): void {
    this._listeners.push(callback);
  }

  __removeListener(callback: Function): void {
    this._listeners = this._listeners.filter(listener => listener !== callback);
  }

  __attach(viewRef: any, eventName: string): void {
    invariant(
      this.__isNative,
      'Only native driven events need to be attached.',
    );

    this._attachedEvent = attachNativeEvent(
      viewRef,
      eventName,
      this._argMapping,
      this.__platformConfig,
    );

    this._dependantAnimatedProps = this.__findAnimatedPropsNodes();
  }

  __detach(viewTag: any, eventName: string): void {
    invariant(
      this.__isNative,
      'Only native driven events need to be detached.',
    );

    this._attachedEvent && this._attachedEvent.detach();
  }

  __getHandler(): any | ((...args: any) => void) {
    if (this.__isNative) {
      if (__DEV__) {
        let validatedMapping = false;
        return (...args: any) => {
          if (!validatedMapping) {
            validateMapping(this._argMapping, args);
            validatedMapping = true;
          }
          this._callListeners(...args);
        };
      } else {
        return this._callListeners;
      }
    }

    let validatedMapping = false;
    return (...args: any) => {
      if (__DEV__ && !validatedMapping) {
        validateMapping(this._argMapping, args);
        validatedMapping = true;
      }

      const traverse = (
        recMapping: ?(Mapping | AnimatedValue),
        recEvt: any,
      ) => {
        if (recMapping instanceof AnimatedValue) {
          if (typeof recEvt === 'number') {
            recMapping.setValue(recEvt);
          }
        } else if (recMapping instanceof AnimatedValueXY) {
          if (typeof recEvt === 'object') {
            traverse(recMapping.x, recEvt.x);
            traverse(recMapping.y, recEvt.y);
          }
        } else if (typeof recMapping === 'object') {
          for (const mappingKey in recMapping) {
            /* $FlowFixMe[prop-missing] (>=0.120.0) This comment suppresses an
             * error found when Flow v0.120 was deployed. To see the error,
             * delete this comment and run Flow. */
            traverse(recMapping[mappingKey], recEvt[mappingKey]);
          }
        }
      };
      this._argMapping.forEach((mapping, idx) => {
        traverse(mapping, args[idx]);
      });

      this._callListeners(...args);
    };
  }

  __findAnimatedPropsNodesForValue(node: AnimatedNode): Array<AnimatedProps> {
    const result = [];

    if (node instanceof AnimatedProps) {
      result.push(node);
      return result;
    }

    for (const child of node.__getChildren()) {
      result.push(...this.__findAnimatedPropsNodesForValue(child));
    }

    return result;
  }

  __findAnimatedPropsNodes(): Array<AnimatedProps> {
    invariant(
      this._argMapping[0] && this._argMapping[0].nativeEvent,
      'Native driven events only support animated values contained inside `nativeEvent`.',
    );

    // Assume that the event containing `nativeEvent` is always the first argument.
    const eventMappings = traverse(this._argMapping[0].nativeEvent, []);
    const result: Array<AnimatedProps> = [];

    for (const mapping of eventMappings) {
      const animatedProps = this.__findAnimatedPropsNodesForValue(mapping.animatedValue)
      result.push(...animatedProps);
    }

    return result;
  }

  _callListeners = (...args: any) => {
    if (this._flushUpdatesTimer) {
      clearTimeout(this._flushUpdatesTimer);
    }

    // Don't update immediately in case more events will follow. Rendering on every frame
    // defeats the purpose of the native driver and we realistically want to commit once the
    // event stream ends.
    this._flushUpdatesTimer = setTimeout(() => {
      this._dependantAnimatedProps.forEach((node) => {
        node.update();
      });
    }, 64);

    this._listeners.forEach(listener => listener(...args));
  };
}
