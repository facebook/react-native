/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// $FlowExpectedError[nonstrict-import] Making this module `strict-local` would require too many modules to revert back to `strict-local` as well.
import type ReactNativeElement from '../webapis/dom/nodes/ReactNativeElement';

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

/**
 * Represents an instance of a React Native host component — i.e. a component
 * directly backed by a native view (e.g. `<View>`, `<Text>`, `<TextInput>`).
 *
 * `HostInstance` is an alias for `ReactNativeElement`, which exposes a
 * DOM-compatible element interface. This aligns with the New Architecture's
 * approach of surfacing W3C-compatible APIs for direct manipulation of native
 * views.
 *
 * Obtain a `HostInstance` via a ref attached to a host component:
 *
 * ```tsx
 * const ref = useRef<HostInstance>(null);
 * <View ref={ref} />
 * ```
 *
 * You can then call DOM-like methods on the instance — for example, to measure
 * layout or imperatively focus a view:
 *
 * ```ts
 * ref.current?.measure((x, y, width, height) => { ... });
 * ref.current?.focus();
 * ```
 *
 * @remarks
 * - Only available on **host components** (components backed by a native view).
 *   Composite components — including most app-defined components — do not
 *   expose a `HostInstance` unless they forward a ref to an underlying host
 *   component via `forwardRef`.
 * - Prefer `setState` and controlled props over direct manipulation where
 *   possible. Direct manipulation bypasses React's reconciliation and can cause
 *   subtle conflicts if the same property is also managed via props.
 * - `setNativeProps` is the primary escape hatch for performance-sensitive
 *   cases, such as continuous animations, where triggering a full re-render
 *   would introduce unacceptable overhead.
 *
 * @see {@link https://reactnative.dev/docs/the-new-architecture/direct-manipulation-new-architecture | Direct Manipulation}
 */
export type HostInstance = ReactNativeElement;
