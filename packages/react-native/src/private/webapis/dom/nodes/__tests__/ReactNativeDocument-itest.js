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

import 'react-native/Libraries/Core/InitializeCore';

import Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {View} from 'react-native';
import ensureInstance from 'react-native/src/private/utilities/ensureInstance';
import ReactNativeDocument from 'react-native/src/private/webapis/dom/nodes/ReactNativeDocument';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import ReadOnlyNode from 'react-native/src/private/webapis/dom/nodes/ReadOnlyNode';

describe('ReactNativeDocument', () => {
  it('is connected until the surface is destroyed', () => {
    let lastNode;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={node => {
            lastNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(lastNode, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

    expect(document.isConnected).toBe(true);

    Fantom.runTask(() => {
      root.render(<></>);
    });

    expect(document.isConnected).toBe(true);

    Fantom.runTask(() => {
      root.destroy();
    });

    expect(document.isConnected).toBe(false);
  });

  it('allows traversal as a regular node', () => {
    let lastNode;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={node => {
            lastNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(lastNode, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

    expect(document.childNodes.length).toBe(1);
    expect(document.childNodes[0]).toBe(document.documentElement);
    expect(document.documentElement.parentNode).toBe(document);
    expect(document.documentElement.childNodes.length).toBe(1);
    expect(document.documentElement.childNodes[0]).toBe(element);
    expect(element.parentNode).toBe(document.documentElement);
  });

  it('allows traversal through document-specific methods', () => {
    let lastNode;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={node => {
            lastNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(lastNode, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

    expect(document.childElementCount).toBe(1);
    expect(document.firstElementChild).toBe(document.documentElement);
    expect(document.lastElementChild).toBe(document.documentElement);
    expect(document.children).toBeInstanceOf(HTMLCollection);
    expect([...document.children]).toEqual([document.documentElement]);
  });

  it('implements the abstract methods from ReadOnlyNode', () => {
    let lastNode;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={node => {
            lastNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(lastNode, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

    expect(document.nodeName).toBe('#document');
    expect(document.nodeType).toBe(ReadOnlyNode.DOCUMENT_NODE);
    expect(document.nodeValue).toBe(null);
    expect(document.textContent).toBe(null);
  });

  it('provides a documentElement node that behaves like a regular element', () => {
    let lastNode;

    const root = Fantom.createRoot({viewportWidth: 200, viewportHeight: 100});
    Fantom.runTask(() => {
      root.render(
        <View
          ref={node => {
            lastNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(lastNode, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

    const {x, y, width, height} =
      document.documentElement.getBoundingClientRect();

    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(width).toBe(200);
    expect(height).toBe(100);
  });

  it('implements compareDocumentPosition correctly', () => {
    let lastNode;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={node => {
            lastNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(lastNode, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);
    const documentElement = document.documentElement;

    /* eslint-disable no-bitwise */

    expect(document.compareDocumentPosition(document)).toBe(0);
    expect(
      document.documentElement.compareDocumentPosition(
        document.documentElement,
      ),
    ).toBe(0);

    expect(document.compareDocumentPosition(documentElement)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
        ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(document.compareDocumentPosition(element)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
        ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(documentElement.compareDocumentPosition(document)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
        ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
    );
    expect(documentElement.compareDocumentPosition(element)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
        ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(element.compareDocumentPosition(document)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
        ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
    );
    expect(element.compareDocumentPosition(documentElement)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
        ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
    );
  });

  it('is released when the root is destroyed', () => {
    let lastNode;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={node => {
            lastNode = node;
          }}
        />,
      );
    });

    let maybeWeakNode;
    let maybeWeakDocument;
    Fantom.runTask(() => {
      maybeWeakDocument = new WeakRef(
        ensureInstance(
          ensureInstance(lastNode, ReactNativeElement).ownerDocument,
          ReactNativeDocument,
        ),
      );
      maybeWeakNode = new WeakRef(ensureInstance(lastNode, ReactNativeElement));
    });

    const weakDocument = nullthrows(maybeWeakDocument);
    expect(weakDocument.deref()).toBeInstanceOf(ReactNativeDocument);

    const weakNode = nullthrows(maybeWeakNode);
    expect(weakNode.deref()).toBeInstanceOf(ReactNativeElement);

    Fantom.runTask(() => {
      root.destroy();
    });

    Fantom.runTask(() => {
      global.gc();
    });

    expect(lastNode).toBe(null);
    expect(weakNode.deref()).toBe(undefined);
    expect(weakDocument.deref()).toBe(undefined);
  });
});
