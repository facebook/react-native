/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import AnimatedProps from './nodes/AnimatedProps';
import {AnimatedEvent} from './AnimatedEvent';
import useRefEffect from '../Utilities/useRefEffect';
import NativeAnimatedHelper from './NativeAnimatedHelper';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

type ReducedProps<TProps> = {
  ...TProps,
  collapsable: boolean,
  ...
};
type CallbackRef<T> = T => mixed;

let animatedComponentNextId = 1;

export default function useAnimatedProps<TProps: {...}, TInstance>(
  props: TProps,
): [ReducedProps<TProps>, CallbackRef<TInstance | null>] {
  const [, scheduleUpdate] = useReducer(count => count + 1, 0);
  const onUpdateRef = useRef<?() => void>(null);

  // TODO: Only invalidate `node` if animated props or `style` change. In the
  // previous implementation, we permitted `style` to override props with the
  // same name property name as styles, so we can probably continue doing that.
  // The ordering of other props *should* not matter.
  const node = useMemo(
    () => new AnimatedProps(props, () => onUpdateRef.current?.()),
    [props],
  );
  useAnimatedPropsLifecycle(node);

  // TODO: This "effect" does three things:
  //
  //   1) Call `setNativeView`.
  //   2) Update `onUpdateRef`.
  //   3) Update listeners for `AnimatedEvent` props.
  //
  // Ideally, each of these would be separat "effects" so that they are not
  // unnecessarily re-run when irrelevant dependencies change. For example, we
  // should be able to hoist all `AnimatedEvent` props and only do #3 if either
  // the `AnimatedEvent` props change or `instance` changes.
  //
  // But there is no way to transparently compose three separate callback refs,
  // so we just combine them all into one for now.
  const refEffect = useCallback(
    instance => {
      // NOTE: This may be called more often than necessary (e.g. when `props`
      // changes), but `setNativeView` already optimizes for that.
      node.setNativeView(instance);

      // NOTE: This callback is only used by the JavaScript animation driver.
      onUpdateRef.current = () => {
        if (
          process.env.NODE_ENV === 'test' ||
          typeof instance !== 'object' ||
          typeof instance?.setNativeProps !== 'function' ||
          isFabricInstance(instance)
        ) {
          // Schedule an update for this component to update `reducedProps`,
          // but do not compute it immediately. If a parent also updated, we
          // need to merge those new props in before updating.
          scheduleUpdate();
        } else if (!node.__isNative) {
          // $FlowIgnore[not-a-function] - Assume it's still a function.
          instance.setNativeProps(node.__getAnimatedValue());
        } else {
          throw new Error(
            'Attempting to run JS driven animation on animated node ' +
              'that has been moved to "native" earlier by starting an ' +
              'animation with `useNativeDriver: true`',
          );
        }
      };

      const target = getEventTarget(instance);
      const events = [];

      for (const propName in props) {
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
    [props, node],
  );
  const callbackRef = useRefEffect<TInstance>(refEffect);

  return [reduceAnimatedProps<TProps>(node), callbackRef];
}

function reduceAnimatedProps<TProps>(
  node: AnimatedProps,
): ReducedProps<TProps> {
  // Force `collapsable` to be false so that the native view is not flattened.
  // Flattened views cannot be accurately referenced by the native driver.
  return {
    ...node.__getValue(),
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
function useAnimatedPropsLifecycle(node: AnimatedProps): void {
  const prevNodeRef = useRef<?AnimatedProps>(null);
  const isUnmountingRef = useRef<boolean>(false);

  const [animatedComponentId] = useState(
    () => `${animatedComponentNextId++}:animatedComponent`,
  );

  useLayoutEffect(() => {
    NativeAnimatedHelper.API.setWaitingForIdentifier(animatedComponentId);
  });

  useEffect(() => {
    NativeAnimatedHelper.API.unsetWaitingForIdentifier(animatedComponentId);
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
    hasFabricHandle(instance) ||
    // Some components have a setNativeProps function but aren't a host component
    // such as lists like FlatList and SectionList. These should also use
    // forceUpdate in Fabric since setNativeProps doesn't exist on the underlying
    // host component. This crazy hack is essentially special casing those lists and
    // ScrollView itself to use forceUpdate in Fabric.
    // If these components end up using forwardRef then these hacks can go away
    // as instance would actually be the underlying host component and the above check
    // would be sufficient.
    hasFabricHandle(instance?.getNativeScrollRef?.()) ||
    hasFabricHandle(instance?.getScrollResponder?.()?.getNativeScrollRef?.())
  );
}

// $FlowFixMe[unclear-type] - Legacy instance assumptions.
function hasFabricHandle(instance: any): boolean {
  // eslint-disable-next-line dot-notation
  return instance?.['_internalInstanceHandle']?.stateNode?.canonical != null;
}
