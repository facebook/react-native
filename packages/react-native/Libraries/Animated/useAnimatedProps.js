/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventSubscription} from '../EventEmitter/NativeEventEmitter';
import type {AnimatedPropsAllowlist} from './nodes/AnimatedProps';

import NativeAnimatedHelper from '../../src/private/animated/NativeAnimatedHelper';
import {useAnimatedPropsMemo} from '../../src/private/animated/useAnimatedPropsMemo';
import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';
import {isPublicInstance as isFabricPublicInstance} from '../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstanceUtils';
import useRefEffect from '../Utilities/useRefEffect';
import {AnimatedEvent} from './AnimatedEvent';
import AnimatedProps from './nodes/AnimatedProps';
import {
  useCallback,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

type ReducedProps<TProps> = {
  ...TProps,
  collapsable: boolean,
  ...
};
type CallbackRef<T> = T => mixed;

type UpdateCallback = () => void;

const useMemoOrAnimatedPropsMemo =
  ReactNativeFeatureFlags.enableAnimatedPropsMemo()
    ? useAnimatedPropsMemo
    : useMemo;

export default function useAnimatedProps<TProps: {...}, TInstance>(
  props: TProps,
  allowlist?: ?AnimatedPropsAllowlist,
): [ReducedProps<TProps>, CallbackRef<TInstance | null>] {
  const [, scheduleUpdate] = useReducer<number, void>(count => count + 1, 0);
  const onUpdateRef = useRef<UpdateCallback | null>(null);
  const timerRef = useRef<TimeoutID | null>(null);

  const allowlistIfEnabled = ReactNativeFeatureFlags.enableAnimatedAllowlist()
    ? allowlist
    : null;

  const node = useMemoOrAnimatedPropsMemo(
    () =>
      new AnimatedProps(
        props,
        () => onUpdateRef.current?.(),
        allowlistIfEnabled,
      ),
    [allowlistIfEnabled, props],
  );

  const useNativePropsInFabric =
    ReactNativeFeatureFlags.shouldUseSetNativePropsInFabric();

  const useAnimatedPropsLifecycle =
    ReactNativeFeatureFlags.useInsertionEffectsForAnimations()
      ? useAnimatedPropsLifecycle_insertionEffects
      : useAnimatedPropsLifecycle_layoutEffects;

  useAnimatedPropsLifecycle(node);

  // TODO: This "effect" does three things:
  //
  //   1) Call `setNativeView`.
  //   2) Update `onUpdateRef`.
  //   3) Update listeners for `AnimatedEvent` props.
  //
  // Ideally, each of these would be separate "effects" so that they are not
  // unnecessarily re-run when irrelevant dependencies change. For example, we
  // should be able to hoist all `AnimatedEvent` props and only do #3 if either
  // the `AnimatedEvent` props change or `instance` changes.
  //
  // But there is no way to transparently compose three separate callback refs,
  // so we just combine them all into one for now.
  const refEffect = useCallback(
    (instance: TInstance) => {
      // NOTE: This may be called more often than necessary (e.g. when `props`
      // changes), but `setNativeView` already optimizes for that.
      node.setNativeView(instance);

      // NOTE: When using the JS animation driver, this callback is called on
      // every animation frame. When using the native driver, this callback is
      // called when the animation completes.
      onUpdateRef.current = () => {
        if (process.env.NODE_ENV === 'test') {
          // Check 1: this is a test.
          // call `scheduleUpdate` to bypass use of setNativeProps.
          return scheduleUpdate();
        }

        const isFabricNode = isFabricInstance(instance);
        if (node.__isNative) {
          // Check 2: this is an animation driven by native.
          // In native driven animations, this callback is only called once the animation completes.
          if (isFabricNode) {
            // Call `scheduleUpdate` to synchronise Fiber and Shadow tree.
            // Must not be called in Paper.
            scheduleUpdate();
          }
          return;
        }

        if (
          typeof instance !== 'object' ||
          typeof instance?.setNativeProps !== 'function'
        ) {
          // Check 3: the instance does not support setNativeProps. Call `scheduleUpdate`.
          return scheduleUpdate();
        }

        if (!isFabricNode) {
          // Check 4: this is a paper instance, call setNativeProps.
          // $FlowIgnore[not-a-function] - Assume it's still a function.
          // $FlowFixMe[incompatible-use]
          return instance.setNativeProps(node.__getAnimatedValue());
        }

        if (!useNativePropsInFabric) {
          // Check 5: setNativeProps are disabled.
          return scheduleUpdate();
        }

        // This is a Fabric instance and setNativeProps is supported.

        // $FlowIgnore[not-a-function] - Assume it's still a function.
        // $FlowFixMe[incompatible-use]
        instance.setNativeProps(node.__getAnimatedValue());

        // Keeping state of Fiber tree and Shadow tree in sync.
        //
        // This is done by calling `scheduleUpdate` which will trigger a commit.
        // However, React commit is not fast enough to drive animations.
        // This is where setNativeProps comes in handy but the state between
        // Fiber tree and Shadow tree needs to be kept in sync.
        // The goal is to call `scheduleUpdate` as little as possible to maintain
        // performance but frequently enough to keep state in sync.
        // Debounce is set to 48ms, which is 3 * the duration of a frame.
        // 3 frames was the highest value where flickering state was not observed.
        if (timerRef.current != null) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          scheduleUpdate();
        }, 48);
      };

      const target = getEventTarget(instance);
      const events = [];

      for (const propName in props) {
        // $FlowFixMe[invalid-computed-prop]
        const propValue = props[propName];
        if (propValue instanceof AnimatedEvent && propValue.__isNative) {
          propValue.__attach(target, propName);
          events.push([propName, propValue]);
        }
      }

      return () => {
        onUpdateRef.current = null;

        for (const [propName, propValue] of events) {
          propValue.__detach(target, propName);
        }
      };
    },
    [node, useNativePropsInFabric, props],
  );
  const callbackRef = useRefEffect<TInstance>(refEffect);

  return [reduceAnimatedProps<TProps>(node, props), callbackRef];
}

function reduceAnimatedProps<TProps>(
  node: AnimatedProps,
  props: TProps,
): ReducedProps<TProps> {
  // Force `collapsable` to be false so that the native view is not flattened.
  // Flattened views cannot be accurately referenced by the native driver.
  return {
    ...(ReactNativeFeatureFlags.enableAnimatedPropsMemo()
      ? node.__getValueWithStaticProps(props)
      : node.__getValue()),
    collapsable: false,
  };
}

/**
 * Manages the lifecycle of the supplied `AnimatedProps` by invoking `__attach`
 * and `__detach`. However, this is more complicated because `AnimatedProps`
 * uses reference counting to determine when to recursively detach its children
 * nodes. So in order to optimize this, we avoid detaching until the next attach
 * unless we are unmounting.
 */
function useAnimatedPropsLifecycle_layoutEffects(node: AnimatedProps): void {
  const prevNodeRef = useRef<?AnimatedProps>(null);
  const isUnmountingRef = useRef<boolean>(false);

  useEffect(() => {
    // It is ok for multiple components to call `flushQueue` because it noops
    // if the queue is empty. When multiple animated components are mounted at
    // the same time. Only first component flushes the queue and the others will noop.
    NativeAnimatedHelper.API.flushQueue();
    let drivenAnimationEndedListener: ?EventSubscription = null;
    if (node.__isNative) {
      drivenAnimationEndedListener =
        NativeAnimatedHelper.nativeEventEmitter.addListener(
          'onUserDrivenAnimationEnded',
          data => {
            node.update();
          },
        );
    }

    return () => {
      drivenAnimationEndedListener?.remove();
    };
  });

  useLayoutEffect(() => {
    isUnmountingRef.current = false;
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  useLayoutEffect(() => {
    node.__attach();
    if (prevNodeRef.current != null) {
      const prevNode = prevNodeRef.current;
      // TODO: Stop restoring default values (unless `reset` is called).
      prevNode.__restoreDefaultValues();
      prevNode.__detach();
      prevNodeRef.current = null;
    }
    return () => {
      if (isUnmountingRef.current) {
        // NOTE: Do not restore default values on unmount, see D18197735.
        node.__detach();
      } else {
        prevNodeRef.current = node;
      }
    };
  }, [node]);
}

/**
 * Manages the lifecycle of the supplied `AnimatedProps` by invoking `__attach`
 * and `__detach`. However, this is more complicated because `AnimatedProps`
 * uses reference counting to determine when to recursively detach its children
 * nodes. So in order to optimize this, we avoid detaching until the next attach
 * unless we are unmounting.
 */
function useAnimatedPropsLifecycle_insertionEffects(node: AnimatedProps): void {
  const prevNodeRef = useRef<?AnimatedProps>(null);
  const isUnmountingRef = useRef<boolean>(false);

  useEffect(() => {
    // It is ok for multiple components to call `flushQueue` because it noops
    // if the queue is empty. When multiple animated components are mounted at
    // the same time. Only first component flushes the queue and the others will noop.
    NativeAnimatedHelper.API.flushQueue();
    let drivenAnimationEndedListener: ?EventSubscription = null;
    if (node.__isNative) {
      drivenAnimationEndedListener =
        NativeAnimatedHelper.nativeEventEmitter.addListener(
          'onUserDrivenAnimationEnded',
          data => {
            node.update();
          },
        );
    }

    return () => {
      drivenAnimationEndedListener?.remove();
    };
  });

  useInsertionEffect(() => {
    isUnmountingRef.current = false;
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  useInsertionEffect(() => {
    node.__attach();
    if (prevNodeRef.current != null) {
      const prevNode = prevNodeRef.current;
      // TODO: Stop restoring default values (unless `reset` is called).
      prevNode.__restoreDefaultValues();
      prevNode.__detach();
      prevNodeRef.current = null;
    }
    return () => {
      if (isUnmountingRef.current) {
        // NOTE: Do not restore default values on unmount, see D18197735.
        node.__detach();
      } else {
        prevNodeRef.current = node;
      }
    };
  }, [node]);
}

function getEventTarget<TInstance>(instance: TInstance): TInstance {
  return typeof instance === 'object' &&
    typeof instance?.getScrollableNode === 'function'
    ? // $FlowFixMe[incompatible-use] - Legacy instance assumptions.
      instance.getScrollableNode()
    : instance;
}

// $FlowFixMe[unclear-type] - Legacy instance assumptions.
function isFabricInstance(instance: any): boolean {
  return (
    isFabricPublicInstance(instance) ||
    // Some components have a setNativeProps function but aren't a host component
    // such as lists like FlatList and SectionList. These should also use
    // forceUpdate in Fabric since setNativeProps doesn't exist on the underlying
    // host component. This crazy hack is essentially special casing those lists and
    // ScrollView itself to use forceUpdate in Fabric.
    // If these components end up using forwardRef then these hacks can go away
    // as instance would actually be the underlying host component and the above check
    // would be sufficient.
    isFabricPublicInstance(instance?.getNativeScrollRef?.()) ||
    isFabricPublicInstance(
      instance?.getScrollResponder?.()?.getNativeScrollRef?.(),
    )
  );
}
