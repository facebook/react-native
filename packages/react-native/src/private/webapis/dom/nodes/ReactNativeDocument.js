/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// flowlint unsafe-getters-setters:off

import type {RootTag} from '../../../../../Libraries/ReactNative/RootTag';
import type {ViewConfig} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type HTMLCollection from '../oldstylecollections/HTMLCollection';
import type {ReactNativeDocumentInstanceHandle} from './internals/ReactNativeDocumentInstanceHandle';
import type ReadOnlyElement from './ReadOnlyElement';

import {createHTMLCollection} from '../oldstylecollections/HTMLCollection';
import {
  createReactNativeDocumentElementInstanceHandle,
  setNativeElementReferenceForReactNativeDocumentElementInstanceHandle,
  setPublicInstanceForReactNativeDocumentElementInstanceHandle,
} from './internals/ReactNativeDocumentElementInstanceHandle';
import {createReactNativeDocumentInstanceHandle} from './internals/ReactNativeDocumentInstanceHandle';
import ReactNativeElement from './ReactNativeElement';
import ReadOnlyNode from './ReadOnlyNode';
import NativeDOM from './specs/NativeDOM';

export default class ReactNativeDocument extends ReadOnlyNode {
  _documentElement: ReactNativeElement;

  constructor(
    rootTag: RootTag,
    instanceHandle: ReactNativeDocumentInstanceHandle,
  ) {
    super(instanceHandle, null);
    this._documentElement = createDocumentElement(rootTag, this);
  }

  get childElementCount(): number {
    // just `documentElement`.
    return 1;
  }

  get children(): HTMLCollection<ReadOnlyElement> {
    return createHTMLCollection([this.documentElement]);
  }

  get documentElement(): ReactNativeElement {
    return this._documentElement;
  }

  get firstElementChild(): ReadOnlyElement | null {
    return this.documentElement;
  }

  get lastElementChild(): ReadOnlyElement | null {
    return this.documentElement;
  }

  get nodeName(): string {
    return '#document';
  }

  get nodeType(): number {
    return ReadOnlyNode.DOCUMENT_NODE;
  }

  get nodeValue(): null {
    return null;
  }

  get textContent(): null {
    return null;
  }
}

function createDocumentElement(
  rootTag: RootTag,
  ownerDocument: ReactNativeDocument,
): ReactNativeElement {
  // In the case of the document object, React does not create an instance
  // handle for it, so we create a custom one.
  const instanceHandle = createReactNativeDocumentElementInstanceHandle();

  // $FlowExpectedError[incompatible-type]
  const rootTagIsNumber: number = rootTag;
  // $FlowExpectedError[incompatible-type]
  const viewConfig: ViewConfig = null;

  const documentElement = new ReactNativeElement(
    rootTagIsNumber,
    viewConfig,
    instanceHandle,
    ownerDocument,
  );

  // The root shadow node was created ahead of time without an instance
  // handle, so we need to link them now.
  const rootShadowNode = NativeDOM.linkRootNode(rootTag, instanceHandle);
  setNativeElementReferenceForReactNativeDocumentElementInstanceHandle(
    instanceHandle,
    rootShadowNode,
  );
  setPublicInstanceForReactNativeDocumentElementInstanceHandle(
    instanceHandle,
    documentElement,
  );

  return documentElement;
}

export function createReactNativeDocument(
  rootTag: RootTag,
): ReactNativeDocument {
  const instanceHandle = createReactNativeDocumentInstanceHandle(rootTag);
  const document = new ReactNativeDocument(rootTag, instanceHandle);
  return document;
}
