/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableAccessToHostTreeInFabric:true
 */

/* eslint-disable lint/sort-imports */
import type IntersectionObserverType from '../IntersectionObserver';

import setUpIntersectionObserver from '../../../setup/setUpIntersectionObserver';
import ReactNativeElement from '../../dom/nodes/ReactNativeElement';
import * as React from 'react';

import ensureInstance from '../../../utilities/ensureInstance';

import '../../../../../Libraries/Core/InitializeCore.js';
import Fantom from '@react-native/fantom';
import {unstable_benchmark} from '@react-native/fantom';

import ScrollView from '../../../../../Libraries/Components/ScrollView/ScrollView';
import View from '../../../../../Libraries/Components/View/View';

declare const IntersectionObserver: Class<IntersectionObserverType>;

setUpIntersectionObserver();

let maybeNode;
let node: ReactNativeElement;

let maybeScrollViewNode;
let scrollViewNode: ReactNativeElement;
let observer: IntersectionObserverType;
const root = Fantom.createRoot();
let mockCallback = jest.fn();

// References Fantom height settings
const DEFAULT_VIEWPORT_HEIGHT = 844;

unstable_benchmark
  .suite('IntersectionObserver')
  .test(
    'Create IntersectionObserver',
    () => {
      Fantom.runTask(() => {
        observer = new IntersectionObserver(mockCallback, {});
      });
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
      },
    },
  )
  .test(
    'Observe a mounted view',
    () => {
      Fantom.runTask(() => {
        observer.observe(node);
      });
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
        Fantom.runTask(() => {
          root.render(
            <View
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />,
          );
          observer = new IntersectionObserver(mockCallback, {});
        });
        node = ensureInstance(maybeNode, ReactNativeElement);
      },
      afterEach: () => {
        Fantom.runTask(() => {
          observer.disconnect();
          root.render(<></>);
        });
      },
    },
  )
  .test(
    'ScrollView no intersection, no observation',
    () => {
      // Move ScrollView offset to i * 100
      const scrollIncrement = DEFAULT_VIEWPORT_HEIGHT / 3;
      for (let i = 1; i <= 3; i++) {
        Fantom.runOnUIThread(() => {
          Fantom.scrollTo(scrollViewNode, {
            x: 0,
            y: i * scrollIncrement,
          });
        });
        Fantom.runWorkLoop();
      }
    },
    {
      beforeEach: () => {
        // Render a View that won't intersect with viewport
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              ref={receivedNode => {
                maybeScrollViewNode = receivedNode;
              }}>
              <View style={{width: 100, height: DEFAULT_VIEWPORT_HEIGHT * 2}} />
              <View style={{width: 100, height: 100}} />
            </ScrollView>,
          );
        });
        scrollViewNode = ensureInstance(
          maybeScrollViewNode,
          ReactNativeElement,
        );
      },
      afterEach: () => {
        Fantom.runTask(() => {
          root.render(<></>);
        });
      },
    },
  )
  .test(
    'ScrollView no intersection, observation',
    () => {
      // Move ScrollView offset to i * 100
      const scrollIncrement = DEFAULT_VIEWPORT_HEIGHT / 3;
      for (let i = 1; i <= 3; i++) {
        Fantom.runOnUIThread(() => {
          Fantom.scrollTo(scrollViewNode, {
            x: 0,
            y: i * scrollIncrement,
          });
        });
        Fantom.runWorkLoop();
      }
    },
    {
      beforeEach: () => {
        // fails when I do mockClear()
        mockCallback = jest.fn();

        // Render a View that won't intersect with viewport
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              ref={receivedNode => {
                maybeScrollViewNode = receivedNode;
              }}>
              <View style={{width: 100, height: DEFAULT_VIEWPORT_HEIGHT * 2}} />
              <View
                ref={receivedNode => {
                  maybeNode = receivedNode;
                }}
                style={{width: 100, height: 100}}
              />
            </ScrollView>,
          );
        });
        scrollViewNode = ensureInstance(
          maybeScrollViewNode,
          ReactNativeElement,
        );
        node = ensureInstance(maybeNode, ReactNativeElement);
        Fantom.runTask(() => {
          observer = new IntersectionObserver(mockCallback, {});
          observer.observe(node);
        });
      },
      afterEach: () => {
        expect(mockCallback.mock.calls.length).toBe(1);

        const [entries] = mockCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(false);

        Fantom.runTask(() => {
          root.render(<></>);
        });
      },
    },
  )
  .test(
    'ScrollView intersection, no observation',
    () => {
      // Scroll by 1/3 of screen height each time
      const scrollIncrement = DEFAULT_VIEWPORT_HEIGHT / 3;
      for (let i = 1; i <= 3; i++) {
        Fantom.runOnUIThread(() => {
          Fantom.scrollTo(scrollViewNode, {
            x: 0,
            y: i * scrollIncrement,
          });
        });
        Fantom.runWorkLoop();
      }
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
        // Render a View that won't intersect with viewport
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              ref={receivedNode => {
                maybeScrollViewNode = receivedNode;
              }}>
              <View
                style={{width: 100, height: 1.6 * DEFAULT_VIEWPORT_HEIGHT}}
              />
              <View style={{width: 100, height: 100}} />
            </ScrollView>,
          );
        });
        scrollViewNode = ensureInstance(
          maybeScrollViewNode,
          ReactNativeElement,
        );
      },
      afterEach: () => {
        Fantom.runTask(() => {
          root.render(<></>);
        });
      },
    },
  )
  .test(
    'ScrollView intersection, observation',
    () => {
      // Scroll by 1/3 of screen height each time
      const scrollIncrement = DEFAULT_VIEWPORT_HEIGHT / 3;
      for (let i = 1; i <= 3; i++) {
        Fantom.runOnUIThread(() => {
          Fantom.scrollTo(scrollViewNode, {
            x: 0,
            y: i * scrollIncrement,
          });
        });
        Fantom.runWorkLoop();
      }
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
        // Render a View that won't intersect with viewport
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              ref={receivedNode => {
                maybeScrollViewNode = receivedNode;
              }}>
              <View
                style={{width: 100, height: 1.6 * DEFAULT_VIEWPORT_HEIGHT}}
              />
              <View
                ref={receivedNode => {
                  maybeNode = receivedNode;
                }}
                style={{width: 100, height: 100}}
              />
            </ScrollView>,
          );
        });
        scrollViewNode = ensureInstance(
          maybeScrollViewNode,
          ReactNativeElement,
        );
        node = ensureInstance(maybeNode, ReactNativeElement);
        Fantom.runTask(() => {
          observer = new IntersectionObserver(mockCallback, {threshold: 1});
          observer.observe(node);
        });
      },
      afterEach: () => {
        expect(mockCallback.mock.calls.length).toBe(2);

        const [nonIntersectingEntries] = mockCallback.mock.calls[0];
        expect(nonIntersectingEntries.length).toBe(1);
        expect(nonIntersectingEntries[0].isIntersecting).toBe(false);

        const [intersectingEntries] = mockCallback.mock.calls[1];
        expect(intersectingEntries.length).toBe(1);
        expect(intersectingEntries[0].isIntersecting).toBe(true);

        Fantom.runTask(() => {
          root.render(<></>);
        });
      },
    },
  );
