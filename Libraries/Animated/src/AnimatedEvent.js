/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule AnimatedEvent
 * @flow
 * @format
 */
'use strict';

const AnimatedValue = require('./nodes/AnimatedValue');
const NativeAnimatedHelper = require('./NativeAnimatedHelper');
const ReactNative = require('ReactNative');

const invariant = require('fbjs/lib/invariant');
const {shouldUseNativeDriver} = require('./NativeAnimatedHelper');

export type Mapping = {[key: string]: Mapping} | AnimatedValue;
export type EventConfig = {
  listener?: ?Function,
  useNativeDriver?: boolean,
};

function attachNativeEvent(
  viewRef: any,
  eventName: string,
  argMapping: Array<?Mapping>,
) {
  // Find animated values in `argMapping` and create an array representing their
  // key path inside the `nativeEvent` object. Ex.: ['contentOffset', 'x'].
  const eventMappings = [];

  const traverse = (value, path) => {
    if (value instanceof AnimatedValue) {
      value.__makeNative();

      eventMappings.push({
        nativeEventPath: path,
        animatedValueTag: value.__getNativeTag(),
      });
    } else if (typeof value === 'object') {
      for (const key in value) {
        traverse(value[key], path.concat(key));
      }
    }
  };

  invariant(
    argMapping[0] && argMapping[0].nativeEvent,
    'Native driven events only support animated values contained inside `nativeEvent`.',
  );

  // Assume that the event containing `nativeEvent` is always the first argument.
  traverse(argMapping[0].nativeEvent, []);

  const viewTag = ReactNative.findNodeHandle(viewRef);

  eventMappings.forEach(mapping => {
    NativeAnimatedHelper.API.addAnimatedEventToView(
      viewTag,
      eventName,
      mapping,
    );
  });

  return {
    detach() {
      eventMappings.forEach(mapping => {
        NativeAnimatedHelper.API.removeAnimatedEventFromView(
          viewTag,
          eventName,
          mapping.animatedValueTag,
        );
      });
    },
  };
}

class AnimatedEvent {
  _argMapping: Array<?Mapping>;
  _listeners: Array<Function> = [];
  _callListeners: Function;
  _attachedEvent: ?{
    detach: () => void,
  };
  __isNative: boolean;

  constructor(argMapping: Array<?Mapping>, config?: EventConfig = {}) {
    this._argMapping = argMapping;
    if (config.listener) {
      this.__addListener(config.listener);
    }
    this._callListeners = this._callListeners.bind(this);
    this._attachedEvent = null;
    this.__isNative = shouldUseNativeDriver(config);

    if (__DEV__) {
      this._validateMapping();
    }
  }

  __addListener(callback: Function): void {
    this._listeners.push(callback);
  }

  __removeListener(callback: Function): void {
    this._listeners = this._listeners.filter(listener => listener !== callback);
  }

  __attach(viewRef: any, eventName: string) {
    invariant(
      this.__isNative,
      'Only native driven events need to be attached.',
    );

    this._attachedEvent = attachNativeEvent(
      viewRef,
      eventName,
      this._argMapping,
    );
  }

  __detach(viewTag: any, eventName: string) {
    invariant(
      this.__isNative,
      'Only native driven events need to be detached.',
    );

    this._attachedEvent && this._attachedEvent.detach();
  }

  __getHandler() {
    if (this.__isNative) {
      return this._callListeners;
    }

    return (...args: any) => {
      const traverse = (recMapping, recEvt, key) => {
        if (typeof recEvt === 'number' && recMapping instanceof AnimatedValue) {
          recMapping.setValue(recEvt);
        } else if (typeof recMapping === 'object') {
          for (const mappingKey in recMapping) {
            /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
             * comment suppresses an error when upgrading Flow's support for
             * React. To see the error delete this comment and run Flow. */
            traverse(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
          }
        }
      };

      if (!this.__isNative) {
        this._argMapping.forEach((mapping, idx) => {
          traverse(mapping, args[idx], 'arg' + idx);
        });
      }
      this._callListeners(...args);
    };
  }

  _callListeners(...args) {
    this._listeners.forEach(listener => listener(...args));
  }

  _validateMapping() {
    const traverse = (recMapping, recEvt, key) => {
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
        traverse(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
      }
    };
  }
}

module.exports = {AnimatedEvent, attachNativeEvent};
