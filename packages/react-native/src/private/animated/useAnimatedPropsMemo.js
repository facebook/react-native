/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type AnimatedProps from '../../../Libraries/Animated/nodes/AnimatedProps';
import type {AnimatedPropsAllowlist} from '../../../Libraries/Animated/nodes/AnimatedProps';
import type {AnimatedStyleAllowlist} from '../../../Libraries/Animated/nodes/AnimatedStyle';

import {AnimatedEvent} from '../../../Libraries/Animated/AnimatedEvent';
import AnimatedNode from '../../../Libraries/Animated/nodes/AnimatedNode';
import {isPlainObject} from '../../../Libraries/Animated/nodes/AnimatedObject';
import flattenStyle from '../../../Libraries/StyleSheet/flattenStyle';
import nullthrows from 'nullthrows';
import {useMemo, useState} from 'react';

type CompositeKey = {
  style?: {[string]: CompositeKeyComponent},
  [string]:
    | CompositeKeyComponent
    | AnimatedEvent
    | $ReadOnlyArray<mixed>
    | $ReadOnly<{[string]: mixed}>,
};

type CompositeKeyComponent =
  | AnimatedNode
  | Array<CompositeKeyComponent | null>
  | {[string]: CompositeKeyComponent};

type $ReadOnlyCompositeKey = $ReadOnly<{
  style?: $ReadOnly<{[string]: CompositeKeyComponent}>,
  [string]:
    | $ReadOnlyCompositeKeyComponent
    | AnimatedEvent
    | $ReadOnlyArray<mixed>
    | $ReadOnly<{[string]: mixed}>,
}>;

type $ReadOnlyCompositeKeyComponent =
  | AnimatedNode
  | $ReadOnlyArray<$ReadOnlyCompositeKeyComponent | null>
  | $ReadOnly<{[string]: $ReadOnlyCompositeKeyComponent}>;

/**
 * A hook that returns an `AnimatedProps` object that is memoized based on the
 * subset of `props` that are instances of `AnimatedNode` or `AnimatedEvent`.
 */
export function useAnimatedPropsMemo(
  create: () => AnimatedProps,
  // TODO: Make this two separate arguments after the experiment is over. This
  // is only an array-like structure to make it easier to experiment with this
  // and `useMemo`.
  [allowlist, props]: [?AnimatedPropsAllowlist, {[string]: mixed}],
): AnimatedProps {
  const compositeKey = useMemo(
    () => createCompositeKeyForProps(props, allowlist),
    [allowlist, props],
  );

  const [state, setState] = useState<{
    allowlist: ?AnimatedPropsAllowlist,
    compositeKey: $ReadOnlyCompositeKey | null,
    value: AnimatedProps,
  }>(() => ({
    allowlist,
    compositeKey,
    value: create(),
  }));

  if (
    state.allowlist !== allowlist ||
    !areCompositeKeysEqual(state.compositeKey, compositeKey)
  ) {
    setState({
      allowlist,
      compositeKey,
      value: create(),
    });
  }
  return state.value;
}

/**
 * Creates a new composite key for a `props` object that can be used to detect
 * whether a new `AnimatedProps` instance must be created.
 *
 * - With an allowlist, those props are searched for `AnimatedNode` instances.
 * - Without an allowlist, `style` is searched for `AnimatedNode` instances,
 *   but all other objects and arrays are included (not searched). We do not
 *   search objects and arrays without an allowlist in case they are very large
 *   data structures. We safely traverse `style` becuase it is bounded.
 *
 * Any `AnimatedEvent` instances at the first depth are always included.
 *
 * If `props` contains no `AnimatedNode` or `AnimatedEvent` instances, this
 * returns null.
 */
export function createCompositeKeyForProps(
  props: $ReadOnly<{[string]: mixed}>,
  allowlist: ?AnimatedPropsAllowlist,
): $ReadOnlyCompositeKey | null {
  let compositeKey: CompositeKey | null = null;

  const keys = Object.keys(props);
  for (let ii = 0, length = keys.length; ii < length; ii++) {
    const key = keys[ii];
    const value = props[key];

    if (allowlist == null || hasOwn(allowlist, key)) {
      let compositeKeyComponent;
      if (key === 'style') {
        // $FlowFixMe[incompatible-call] - `style` is a valid argument.
        // $FlowFixMe[incompatible-type] - `flattenStyle` returns an object.
        const flatStyle: ?{[string]: mixed} = flattenStyle(value);
        if (flatStyle != null) {
          compositeKeyComponent = createCompositeKeyForObject(
            flatStyle,
            allowlist?.style,
          );
        }
      } else if (
        value instanceof AnimatedNode ||
        value instanceof AnimatedEvent
      ) {
        compositeKeyComponent = value;
      } else if (Array.isArray(value)) {
        compositeKeyComponent =
          allowlist == null ? value : createCompositeKeyForArray(value);
      } else if (isPlainObject(value)) {
        compositeKeyComponent =
          allowlist == null ? value : createCompositeKeyForObject(value);
      }
      if (compositeKeyComponent != null) {
        if (compositeKey == null) {
          compositeKey = {} as CompositeKey;
        }
        compositeKey[key] = compositeKeyComponent;
      }
    }
  }

  return compositeKey;
}

/**
 * Creates a new composite key for an array that retains all values that are or
 * contain `AnimatedNode` instances, and `null` for the rest.
 *
 * If `array` contains no `AnimatedNode` instances, this returns null.
 */
function createCompositeKeyForArray(
  array: $ReadOnlyArray<mixed>,
): $ReadOnlyArray<$ReadOnlyCompositeKeyComponent | null> | null {
  let compositeKey: Array<$ReadOnlyCompositeKeyComponent | null> | null = null;

  for (let ii = 0, length = array.length; ii < length; ii++) {
    const value = array[ii];

    let compositeKeyComponent;
    if (value instanceof AnimatedNode) {
      compositeKeyComponent = value;
    } else if (Array.isArray(value)) {
      compositeKeyComponent = createCompositeKeyForArray(value);
    } else if (isPlainObject(value)) {
      compositeKeyComponent = createCompositeKeyForObject(value);
    }
    if (compositeKeyComponent != null) {
      if (compositeKey == null) {
        compositeKey = new Array<$ReadOnlyCompositeKeyComponent | null>(
          array.length,
        ).fill(null);
      }
      compositeKey[ii] = compositeKeyComponent;
    }
  }

  return compositeKey;
}

/**
 * Creates a new composite key for an object that retains only properties that
 * are or contain `AnimatedNode` instances.
 *
 * When used to create composite keys for `style` props:
 *
 * - With an allowlist, those properties are searched.
 * - Without an allowlist, every property is searched.
 *
 * If `object` contains no `AnimatedNode` instances, this returns null.
 */
function createCompositeKeyForObject(
  object: $ReadOnly<{[string]: mixed}>,
  allowlist?: ?AnimatedStyleAllowlist,
): $ReadOnly<{[string]: $ReadOnlyCompositeKeyComponent}> | null {
  let compositeKey: {[string]: $ReadOnlyCompositeKeyComponent} | null = null;

  const keys = Object.keys(object);
  for (let ii = 0, length = keys.length; ii < length; ii++) {
    const key = keys[ii];

    if (allowlist == null || hasOwn(allowlist, key)) {
      const value = object[key];

      let compositeKeyComponent;
      if (value instanceof AnimatedNode) {
        compositeKeyComponent = value;
      } else if (Array.isArray(value)) {
        compositeKeyComponent = createCompositeKeyForArray(value);
      } else if (isPlainObject(value)) {
        compositeKeyComponent = createCompositeKeyForObject(value);
      }
      if (compositeKeyComponent != null) {
        if (compositeKey == null) {
          compositeKey = {} as {[string]: $ReadOnlyCompositeKeyComponent};
        }
        compositeKey[key] = compositeKeyComponent;
      }
    }
  }

  return compositeKey;
}

export function areCompositeKeysEqual(
  maybePrev: $ReadOnlyCompositeKey | null,
  maybeNext: $ReadOnlyCompositeKey | null,
  allowlist: ?AnimatedPropsAllowlist,
): boolean {
  if (maybePrev === maybeNext) {
    return true;
  }
  if (maybePrev === null || maybeNext === null) {
    return false;
  }
  // Help Flow retain the type refinements of these.
  const prev = maybePrev;
  const next = maybeNext;

  const keys = Object.keys(prev);
  const length = keys.length;
  if (length !== Object.keys(next).length) {
    return false;
  }
  for (let ii = 0; ii < length; ii++) {
    const key = keys[ii];
    if (!hasOwn(next, key)) {
      return false;
    }
    const prevComponent = prev[key];
    const nextComponent = next[key];

    if (key === 'style') {
      // We know style components are objects with non-mixed values.
      if (
        !areCompositeKeyComponentsEqual(
          // $FlowIgnore[incompatible-cast]
          prevComponent as $ReadOnlyCompositeKeyComponent,
          // $FlowIgnore[incompatible-cast]
          nextComponent as $ReadOnlyCompositeKeyComponent,
        )
      ) {
        return false;
      }
    } else if (
      prevComponent instanceof AnimatedNode ||
      prevComponent instanceof AnimatedEvent
    ) {
      if (prevComponent !== nextComponent) {
        return false;
      }
    } else {
      // When `allowlist` is null, the components must be the same. Otherwise,
      // we created the components using deep traversal, so deep compare them.
      if (allowlist == null) {
        if (prevComponent !== nextComponent) {
          return false;
        }
      } else {
        if (
          !areCompositeKeyComponentsEqual(
            // $FlowIgnore[incompatible-cast]
            prevComponent as $ReadOnlyCompositeKeyComponent,
            // $FlowIgnore[incompatible-cast]
            nextComponent as $ReadOnlyCompositeKeyComponent,
          )
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function areCompositeKeyComponentsEqual(
  prev: $ReadOnlyCompositeKeyComponent | null,
  next: $ReadOnlyCompositeKeyComponent | null,
): boolean {
  if (prev === next) {
    return true;
  }
  if (prev instanceof AnimatedNode) {
    return prev === next;
  }
  if (Array.isArray(prev)) {
    if (!Array.isArray(next)) {
      return false;
    }
    const length = prev.length;
    if (length !== next.length) {
      return false;
    }
    for (let ii = 0; ii < length; ii++) {
      if (!areCompositeKeyComponentsEqual(prev[ii], next[ii])) {
        return false;
      }
    }
    return true;
  }
  if (isPlainObject(prev)) {
    if (!isPlainObject(next)) {
      return false;
    }
    const keys = Object.keys(prev);
    const length = keys.length;
    if (length !== Object.keys(next).length) {
      return false;
    }
    for (let ii = 0; ii < length; ii++) {
      const key = keys[ii];
      if (
        !hasOwn(nullthrows(next), key) ||
        !areCompositeKeyComponentsEqual(prev[key], next[key])
      ) {
        return false;
      }
    }
    return true;
  }
  return false;
}

// Supported versions of JSC do not implement the newer Object.hasOwn. Remove
// this shim when they do.
// $FlowIgnore[method-unbinding]
const _hasOwnProp = Object.prototype.hasOwnProperty;
const hasOwn: (obj: $ReadOnly<{...}>, prop: string) => boolean =
  // $FlowIgnore[method-unbinding]
  Object.hasOwn ?? ((obj, prop) => _hasOwnProp.call(obj, prop));
