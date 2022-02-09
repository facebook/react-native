/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import Platform from '../Utilities/Platform';

const ignoredViewConfigProps = new WeakSet<{...}>();

/**
 * Decorates ViewConfig values that are dynamically injected by the library,
 * react-native-gesture-handler. (T45765076)
 */
export function DynamicallyInjectedByGestureHandler<T: {...}>(object: T): T {
  ignoredViewConfigProps.add(object);
  return object;
}

/**
 * On iOS, ViewManager events declarations generate {eventName}: true entries
 * in ViewConfig valueAttributes. In our Static ViewConfig infra, we generate
 * these {eventName}: true entries during runtime by inspecting a ViewConfig's
 * bubblingEventTypes, and directEventTypes.
 *
 * However, not all event declarations generate these {eventName}: true entries.
 * So, the ViewConfig infra generates extra {eventName}: true entries for some
 * events. These extra entries are harmless. So, the logic below makes the ViewConfig
 * Validator ignore all extra {eventName}: true entries in static ViewConfig
 * validAttributes.
 *
 * TODO(T110872225): Remove this logic
 */
export function ConditionallyIgnoredEventHandlers<T: {[name: string]: true}>(
  value: T,
): T | void {
  if (
    Platform.OS === 'ios' &&
    !(global.RN$ViewConfigEventValidAttributesDisabled === true)
  ) {
    return value;
  }
  return undefined;
}

export function isIgnored(value: mixed): boolean {
  if (typeof value === 'object' && value != null) {
    return ignoredViewConfigProps.has(value);
  }
  return false;
}
