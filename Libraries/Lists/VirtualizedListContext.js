/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type VirtualizedList from './VirtualizedList.js';
import * as React from 'react';
import {useMemo, useContext} from 'react';

type Frame = $ReadOnly<{
  offset: number,
  length: number,
  index: number,
  inLayout: boolean,
}>;

export type ChildListState = $ReadOnly<{
  first: number,
  last: number,
  frames: {[key: number]: Frame},
}>;

// Data propagated through nested lists (regardless of orientation) that is
// useful for producing diagnostics for usage errors involving nesting (e.g
// missing/duplicate keys).
export type ListDebugInfo = $ReadOnly<{
  cellKey: string,
  listKey: string,
  parent: ?ListDebugInfo,
  // We include all ancestors regardless of orientation, so this is not always
  // identical to the child's orientation.
  horizontal: boolean,
}>;

type Context = $ReadOnly<{
  cellKey: ?string,
  getScrollMetrics: () => {
    contentLength: number,
    dOffset: number,
    dt: number,
    offset: number,
    timestamp: number,
    velocity: number,
    visibleLength: number,
  },
  horizontal: ?boolean,
  getOutermostParentListRef: () => VirtualizedList,
  getNestedChildState: string => ?ChildListState,
  registerAsNestedChild: ({
    cellKey: string,
    key: string,
    ref: VirtualizedList,
    parentDebugInfo: ListDebugInfo,
  }) => ?ChildListState,
  unregisterAsNestedChild: ({
    key: string,
    state: ChildListState,
  }) => void,
  debugInfo: ListDebugInfo,
}>;

export const VirtualizedListContext: React.Context<?Context> = React.createContext(
  null,
);

/**
 * Resets the context. Intended for use by portal-like components (e.g. Modal).
 */
export function VirtualizedListContextResetter({
  children,
}: {
  children: React.Node,
}): React.Node {
  return (
    <VirtualizedListContext.Provider value={null}>
      {children}
    </VirtualizedListContext.Provider>
  );
}

/**
 * Sets the context with memoization. Intended to be used by `VirtualizedList`.
 */
export function VirtualizedListContextProvider({
  children,
  value,
}: {
  children: React.Node,
  value: Context,
}): React.Node {
  // Avoid setting a newly created context object if the values are identical.
  const context = useMemo(
    () => ({
      cellKey: null,
      getScrollMetrics: value.getScrollMetrics,
      horizontal: value.horizontal,
      getOutermostParentListRef: value.getOutermostParentListRef,
      getNestedChildState: value.getNestedChildState,
      registerAsNestedChild: value.registerAsNestedChild,
      unregisterAsNestedChild: value.unregisterAsNestedChild,
      debugInfo: {
        cellKey: value.debugInfo.cellKey,
        horizontal: value.debugInfo.horizontal,
        listKey: value.debugInfo.listKey,
        parent: value.debugInfo.parent,
      },
    }),
    [
      value.getScrollMetrics,
      value.horizontal,
      value.getOutermostParentListRef,
      value.getNestedChildState,
      value.registerAsNestedChild,
      value.unregisterAsNestedChild,
      value.debugInfo.cellKey,
      value.debugInfo.horizontal,
      value.debugInfo.listKey,
      value.debugInfo.parent,
    ],
  );
  return (
    <VirtualizedListContext.Provider value={context}>
      {children}
    </VirtualizedListContext.Provider>
  );
}

/**
 * Sets the `cellKey`. Intended to be used by `VirtualizedList` for each cell.
 */
export function VirtualizedListCellContextProvider({
  cellKey,
  children,
}: {
  cellKey: string,
  children: React.Node,
}): React.Node {
  const context = useContext(VirtualizedListContext);
  return (
    <VirtualizedListContext.Provider
      value={context == null ? null : {...context, cellKey}}>
      {children}
    </VirtualizedListContext.Provider>
  );
}
