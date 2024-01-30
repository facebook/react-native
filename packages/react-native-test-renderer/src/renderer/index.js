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

type ReactNode = {
  children: Array<ReactNode>,
  props: {...},
  viewName: string,
  instanceHandle: {
    memoizedProps: {testID: ?string, ...},
    ...
  },
};

type RootReactNode = $ReadOnlyArray<ReactNode>;

type RenderResult = {
  toJSON: () => string,
};

function buildRenderResult(rootNode: RootReactNode): RenderResult {
  return {
    toJSON: () => stringify(rootNode),
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
  const root: RootReactNode = manager.getRoot(containerTag);

  if (root == null) {
    throw new Error('No root found for containerTag ' + containerTag);
  }

  return buildRenderResult(root);
}

function stringify(
  node: RootReactNode | ReactNode,
  indent: string = '',
): string {
  const nextIndent = '  ' + indent;
  if (Array.isArray(node)) {
    return `<>
${node.map(n => nextIndent + stringify(n, nextIndent)).join('\n')}
</>`;
  }
  const children = node.children;
  const props = node.props
    ? Object.entries(node.props)
        .map(([k, v]) => ` ${k}=${JSON.stringify(v) ?? ''}`)
        .join('')
    : '';

  if (children.length > 0) {
    return `<${node.viewName}${props}>
${children.map(c => nextIndent + stringify(c, nextIndent)).join('\n')}
${indent}</${node.viewName}>`;
  } else {
    return `<${node.viewName}${props} />`;
  }
}
