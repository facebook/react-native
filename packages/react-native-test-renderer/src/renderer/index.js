/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {Element, ElementType} from 'react';

import * as FabricUIManager from 'react-native/Libraries/ReactNative/__mocks__/FabricUIManager';
import ReactFabric from 'react-native/Libraries/Renderer/shims/ReactFabric';
import {act} from 'react-test-renderer';

type FiberPartial = {
  pendingProps: {
    children: $ReadOnlyArray<ReactNode>,
    ...
  },
  ...
};

type ReactNode = {
  children: ?Array<ReactNode>,
  props: {text?: string | null, ...},
  viewName: string,
  instanceHandle: FiberPartial,
};

type RenderedNodeJSON = {
  type: string,
  props: {[propName: string]: any, ...},
  children: null | Array<RenderedJSON>,
  $$typeof?: symbol, // Optional because we add it with defineProperty().
};
type RenderedJSON = RenderedNodeJSON | string;

type RenderResult = {
  toJSON: () => Array<RenderedJSON> | RenderedJSON | null,
  findAll: (predicate: (ReactNode) => boolean) => Array<ReactNode>,
};

function buildRenderResult(rootNode: ReactNode): RenderResult {
  return {
    toJSON: () => toJSON(rootNode),
    findAll: (predicate: ReactNode => boolean) => findAll(rootNode, predicate),
  };
}

export function render(element: Element<ElementType>): RenderResult {
  const manager = FabricUIManager.getFabricUIManager();
  if (!manager) {
    throw new Error('No FabricUIManager found');
  }
  const containerTag = Math.round(Math.random() * 1000000);
  act(() => {
    ReactFabric.render(element, containerTag, () => {}, true);
  });

  // $FlowFixMe
  const root: [ReactNode] = manager.getRoot(containerTag);

  if (root == null) {
    throw new Error('No root found for containerTag ' + containerTag);
  }

  return buildRenderResult(root[0]);
}

function toJSON(node: ReactNode): RenderedJSON {
  let renderedChildren = null;
  if (node.children != null && node.children.length > 0) {
    renderedChildren = node.children.map(c => toJSON(c));
  }

  if (node.viewName === 'RCTRawText') {
    return node.props.text ?? '';
  }

  const {children: _children, ...props} =
    node.instanceHandle?.pendingProps ?? {};
  const json: RenderedNodeJSON = {
    type: node.viewName,
    props,
    children: renderedChildren,
  };

  Object.defineProperty(json, '$$typeof', {
    value: Symbol.for('react.test.json'),
  });

  return json;
}

function findAll(
  node: ReactNode,
  predicate: ReactNode => boolean,
): Array<ReactNode> {
  const results = [];

  if (predicate(node)) {
    results.push(node);
  }

  if (node.children != null && node.children.length > 0) {
    for (const child of node.children) {
      results.push(...findAll(child, predicate));
    }
  }

  return results;
}
