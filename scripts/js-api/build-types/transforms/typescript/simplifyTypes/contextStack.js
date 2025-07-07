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

import type {InlineVisitorState} from './visitorState';

type KeyofLayer = {
  type: 'keyof',
};

type OmitLayer = {
  type: 'omit',
};

type UnionLayer = {
  type: 'union',
};

type ExtendsLayer = {
  type: 'extends',
};

type ArrayLayer = {
  type: 'array',
};

type TypeAliasLayer = {
  type: 'typeAlias',
  typeParams?: string[],
};

type TypeParameterInstantiationLayer = {
  type: 'typeParameterInstantiation',
};

type UnresolvableTypeLayer = {
  type: 'unresolvableType',
};

type ResolvableTypeLayer = {
  type: 'resolvableType',
};

export type StackLayer =
  | KeyofLayer
  | OmitLayer
  | UnionLayer
  | ExtendsLayer
  | ArrayLayer
  | TypeAliasLayer
  | TypeParameterInstantiationLayer
  | UnresolvableTypeLayer
  | ResolvableTypeLayer;

export function pushLayer(state: InlineVisitorState, layer: StackLayer) {
  state.stack.push(layer);
}

export function popLayer(state: InlineVisitorState, type: StackLayer['type']) {
  const top = state.stack[state.stack.length - 1];
  if (!top || top.type !== type) {
    throw new Error(
      `Unexpected stack state. Expected ${type}, got ${top.type}`,
    );
  }
  state.stack.pop();
}

export function isDefiningType(
  state: InlineVisitorState,
  alias: string,
): boolean {
  return state.parentTypeAliases?.has(alias) ?? false;
}

export function insideKeyofLayer(state: InlineVisitorState): boolean {
  return state.stack.some(layer => layer.type === 'keyof');
}

export function insideOmitLayer(state: InlineVisitorState): boolean {
  return state.stack.some(layer => layer.type === 'omit');
}

export function insideUnionLayer(state: InlineVisitorState): boolean {
  return state.stack.some(layer => layer.type === 'union');
}

export function insideExtendsLayer(state: InlineVisitorState): boolean {
  return state.stack.some(layer => layer.type === 'extends');
}

export function insideArrayLayer(state: InlineVisitorState): boolean {
  return state.stack.some(layer => layer.type === 'array');
}

export function insideTypeAliasLayerWithTypeParam(
  state: InlineVisitorState,
  parameter: string,
): boolean {
  return state.stack.some(
    layer =>
      layer.type === 'typeAlias' &&
      layer.typeParams?.includes(parameter) === true,
  );
}

export function insideIndexedAccessLayer(state: InlineVisitorState): boolean {
  return state.stack.some(layer => layer.type === 'indexedAccess');
}

export function insideUnresolvableTypeInstantiation(
  state: InlineVisitorState,
): boolean {
  const lastUnresolvableTypeIdx = state.stack.findLastIndex(
    layer => layer.type === 'unresolvableType',
  );
  const lastResolvableTypeIdx = state.stack.findLastIndex(
    layer => layer.type === 'resolvableType',
  );
  const lastTypeParameterInstantiationIdx = state.stack.findLastIndex(
    layer => layer.type === 'typeParameterInstantiation',
  );

  return (
    lastUnresolvableTypeIdx >= 0 &&
    lastTypeParameterInstantiationIdx >= 0 &&
    lastResolvableTypeIdx < lastUnresolvableTypeIdx
  );
}
