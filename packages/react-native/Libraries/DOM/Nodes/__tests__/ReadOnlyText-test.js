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

import type ReactNativeElement from '../ReactNativeElement';

import invariant from 'invariant';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {act} from 'react-test-renderer';

jest.mock('../../../ReactNative/FabricUIManager', () =>
  require('../../../ReactNative/__mocks__/FabricUIManager'),
);

const MOCK_CONTAINER_TAG = 11;

describe('ReadOnlyText', () => {
  let ReactFabric;
  let NativeText;
  let ReadOnlyText;
  let ReadOnlyNode;

  beforeEach(() => {
    jest.resetModules();

    // Installs the global `nativeFabricUIManager` pointing to the mock.
    require('../../../ReactNative/__mocks__/FabricUIManager');
    require('../../../ReactNative/ReactNativeFeatureFlags').enableAccessToHostTreeInFabric =
      () => true;

    ReactFabric = require('../../../Renderer/shims/ReactFabric');
    NativeText = require('../../../Text/TextNativeComponent').NativeText;
    ReadOnlyText = require('../ReadOnlyText').default;
    ReadOnlyNode = require('../ReadOnlyNode').default;
  });

  it('should be used to create public text instances when the `enableAccessToHostTreeInFabric` feature flag is enabled', () => {
    let lastParentNode;

    act(() => {
      ReactFabric.render(
        <NativeText
          ref={node => {
            lastParentNode = node;
          }}>
          Some text
        </NativeText>,
        MOCK_CONTAINER_TAG,
      );
    });

    // $FlowExpectedError[incompatible-type]
    const parentNode: ReadOnlyNode = nullthrows(lastParentNode);
    const textNode = parentNode.childNodes[0];

    expect(textNode).toBeInstanceOf(ReadOnlyText);
  });

  describe('extends `ReadOnlyNode`', () => {
    describe('nodeName', () => {
      it('returns "#text"', () => {
        let lastParentNode;

        act(() => {
          ReactFabric.render(
            <NativeText
              ref={node => {
                lastParentNode = node;
              }}>
              Some text
            </NativeText>,
            MOCK_CONTAINER_TAG,
          );
        });

        // $FlowExpectedError[incompatible-type]
        const parentNode: ReadOnlyNode = nullthrows(lastParentNode);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeName).toBe('#text');
      });
    });

    describe('nodeType', () => {
      it('returns ReadOnlyNode.TEXT_NODE', () => {
        let lastParentNode;

        act(() => {
          ReactFabric.render(
            <NativeText
              ref={node => {
                lastParentNode = node;
              }}>
              Some text
            </NativeText>,
            MOCK_CONTAINER_TAG,
          );
        });

        // $FlowExpectedError[incompatible-type]
        const parentNode: ReadOnlyNode = nullthrows(lastParentNode);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeType).toBe(ReadOnlyNode.TEXT_NODE);
      });
    });

    describe('nodeValue / textContent', () => {
      it('returns the string data contained in the node', () => {
        let lastParentNode;

        act(() => {
          ReactFabric.render(
            <NativeText
              ref={node => {
                lastParentNode = node;
              }}>
              Some text
            </NativeText>,
            MOCK_CONTAINER_TAG,
          );
        });

        // $FlowExpectedError[incompatible-type]
        const parentNode: ReadOnlyNode = nullthrows(lastParentNode);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeValue).toBe('Some text');
        expect(textNode.textContent).toBe('Some text');
      });
    });

    describe('traversal', () => {
      it('only preserves text nodes when their contents do not change', () => {
        let lastParentElement;
        let lastChildElementA;

        act(() => {
          ReactFabric.render(
            <NativeText
              key="parent"
              ref={element => {
                lastParentElement = element;
              }}>
              Text A
              <NativeText
                key="childA"
                ref={element => {
                  lastChildElementA = element;
                }}
              />
              Text B
            </NativeText>,
            MOCK_CONTAINER_TAG,
          );
        });

        // $FlowExpectedError[incompatible-type]
        const parentElement: ReactNativeElement = nullthrows(lastParentElement);
        // $FlowExpectedError[incompatible-type]
        const childElementA: ReactNativeElement = nullthrows(lastChildElementA);

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        expect(childTextA.textContent).toBe('Text A');
        const childTextB = parentElement.childNodes[2];
        invariant(
          childTextB instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        expect(childTextB.textContent).toBe('Text B');

        // Validate structure
        expect(parentElement.childNodes.length).toBe(3);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).toBe(childTextB);

        // Change contents of the second text only
        act(() => {
          ReactFabric.render(
            <NativeText
              key="parent"
              ref={element => {
                lastParentElement = element;
              }}>
              Text A
              <NativeText
                key="childA"
                ref={element => {
                  lastChildElementA = element;
                }}
              />
              Text B modified
            </NativeText>,
            MOCK_CONTAINER_TAG,
          );
        });

        expect(parentElement.childNodes.length).toBe(3);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).not.toBe(childTextB);
        expect(parentElement.childNodes[2]).toBeInstanceOf(ReadOnlyText);
        expect(parentElement.childNodes[2]).toMatchObject({
          data: 'Text B modified',
        });
        expect(childTextB.isConnected).toBe(false);
      });
    });
  });

  describe('extends `ReadOnlyCharacterData`', () => {
    describe('data / length', () => {
      it('returns the string data and its length, respectively', () => {
        let lastParentNode;

        act(() => {
          ReactFabric.render(
            <NativeText
              ref={node => {
                lastParentNode = node;
              }}>
              Some text
            </NativeText>,
            MOCK_CONTAINER_TAG,
          );
        });

        // $FlowExpectedError[incompatible-type]
        const parentNode: ReadOnlyNode = nullthrows(lastParentNode);
        // $FlowExpectedError[incompatible-type]
        const textNode: ReadOnlyText = parentNode.childNodes[0];

        expect(textNode.data).toBe('Some text');
        expect(textNode.length).toBe('Some text'.length);
      });
    });

    describe('previousElementSibling / nextElementSibling', () => {
      it('return updated relative elements', () => {
        let lastParentElement;
        let lastChildElementA;
        let lastChildElementB;
        let lastChildElementC;

        act(() => {
          ReactFabric.render(
            <NativeText
              key="parent"
              ref={element => {
                lastParentElement = element;
              }}>
              Text A
              <NativeText
                key="childA"
                ref={element => {
                  lastChildElementA = element;
                }}
              />
              Text B
              <NativeText
                key="childB"
                ref={element => {
                  lastChildElementB = element;
                }}
              />
              Text C
              <NativeText
                key="childC"
                ref={element => {
                  lastChildElementC = element;
                }}
              />
              Text D
            </NativeText>,
            MOCK_CONTAINER_TAG,
          );
        });

        // $FlowExpectedError[incompatible-type]
        const parentElement: ReactNativeElement = nullthrows(lastParentElement);
        // $FlowExpectedError[incompatible-type]
        const childElementA: ReactNativeElement = nullthrows(lastChildElementA);
        // $FlowExpectedError[incompatible-type]
        const childElementB: ReactNativeElement = nullthrows(lastChildElementB);
        // $FlowExpectedError[incompatible-type]
        const childElementC: ReactNativeElement = nullthrows(lastChildElementC);

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextB = parentElement.childNodes[2];
        invariant(
          childTextB instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextC = parentElement.childNodes[4];
        invariant(
          childTextC instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextD = parentElement.childNodes[6];
        invariant(
          childTextD instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );

        // Validate structure
        expect(parentElement.childNodes.length).toBe(7);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).toBe(childTextB);
        expect(parentElement.childNodes[3]).toBe(childElementB);
        expect(parentElement.childNodes[4]).toBe(childTextC);
        expect(parentElement.childNodes[5]).toBe(childElementC);
        expect(parentElement.childNodes[6]).toBe(childTextD);

        expect(childTextA.previousElementSibling).toBe(null);
        expect(childTextA.nextElementSibling).toBe(childElementA);

        expect(childTextB.previousElementSibling).toBe(childElementA);
        expect(childTextB.nextElementSibling).toBe(childElementB);

        expect(childTextC.previousElementSibling).toBe(childElementB);
        expect(childTextC.nextElementSibling).toBe(childElementC);

        expect(childTextD.previousElementSibling).toBe(childElementC);
        expect(childTextD.nextElementSibling).toBe(null);
      });
    });

    describe('substringData', () => {
      it('returns a slice of the text content', () => {
        let lastParentElement;

        act(() => {
          ReactFabric.render(
            <NativeText
              key="parent"
              ref={element => {
                lastParentElement = element;
              }}>
              Text A
            </NativeText>,
            MOCK_CONTAINER_TAG,
          );
        });

        // $FlowExpectedError[incompatible-type]
        const parentElement: ReactNativeElement = nullthrows(lastParentElement);

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );

        expect(childTextA.substringData(0, 1)).toBe('T');
        expect(childTextA.substringData(0, 5)).toBe('Text ');
        // Count > length
        expect(childTextA.substringData(0, 10)).toBe('Text A');
        // Count = length
        expect(childTextA.substringData(0, 6)).toBe('Text A');
        expect(childTextA.substringData(0, 0)).toBe('');
        // Negative count
        expect(childTextA.substringData(0, -1)).toBe('Text A');
        expect(childTextA.substringData(0, -10)).toBe('Text A');

        expect(childTextA.substringData(1, 3)).toBe('ext');
        expect(childTextA.substringData(5, 1)).toBe('A');
        // Offset + count > length
        expect(childTextA.substringData(5, 2)).toBe('A');
        // Offset = length
        expect(childTextA.substringData(6, 1)).toBe('');
        // Offset = length & negative count
        expect(childTextA.substringData(6, -1)).toBe('');
        // Negative count
        expect(childTextA.substringData(5, -1)).toBe('A');

        // Out of bounds offset
        expect(() => {
          childTextA.substringData(-1, 0);
        }).toThrow();
        expect(() => {
          childTextA.substringData(7, 0);
        }).toThrow();
      });
    });
  });
});
