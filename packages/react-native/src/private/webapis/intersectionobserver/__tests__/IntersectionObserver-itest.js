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

import type IntersectionObserverType from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserver';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {ScrollView, View} from 'react-native';
import setUpIntersectionObserver from 'react-native/src/private/setup/setUpIntersectionObserver';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import DOMRectReadOnly from 'react-native/src/private/webapis/geometry/DOMRectReadOnly';
import IntersectionObserverEntry from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserverEntry';

declare const IntersectionObserver: Class<IntersectionObserverType>;

setUpIntersectionObserver();

function ensureReactNativeElement(value: mixed): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

export function expectRectEquals(
  rect: DOMRectReadOnly,
  expected: {x: number, y: number, width: number, height: number},
): boolean {
  const {x, y, width, height} = expected;
  if (
    !(
      rect.x === x &&
      rect.y === y &&
      rect.width === width &&
      rect.height === height
    )
  ) {
    const received = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
    throw new Error(
      `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(received)}`,
    );
  }
  return true;
}

describe('IntersectionObserver', () => {
  let observer: IntersectionObserver;

  afterEach(() => {
    Fantom.runTask(() => {
      if (observer != null) {
        observer.disconnect();
      }
    });
  });

  describe('constructor(callback, {root, rootMargin, threshold, rnRootThreshold})', () => {
    it('should throw if `callback` is not provided', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        return new IntersectionObserver();
      }).toThrow(
        "Failed to construct 'IntersectionObserver': 1 argument required, but only 0 present.",
      );
    });

    it('should throw if `callback` is not a function', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        return new IntersectionObserver('not a function!');
      }).toThrow(
        "Failed to construct 'IntersectionObserver': parameter 1 is not of type 'Function'.",
      );
    });

    it('should throw if `root` is provided', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      expect(() => {
        // $FlowExpectedError[prop-missing] root is not even defined in Flow.
        return new IntersectionObserver(() => {}, {root: node});
      }).toThrow(
        "Failed to construct 'IntersectionObserver': root is not supported",
      );
    });

    it('should throw if `rootMargin` is provided', () => {
      expect(() => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        return new IntersectionObserver(() => {}, {rootMargin: '10px'});
      }).toThrow(
        "Failed to construct 'IntersectionObserver': rootMargin is not supported",
      );
    });

    it('should throw if `threshold` contains a value lower than 0 or greater than 1', () => {
      expect(() => {
        return new IntersectionObserver(() => {}, {threshold: 1.01});
      }).toThrow(
        "Failed to construct 'IntersectionObserver': Threshold values must be numbers between 0 and 1",
      );

      expect(() => {
        return new IntersectionObserver(() => {}, {threshold: -0.01});
      }).toThrow(
        "Failed to construct 'IntersectionObserver': Threshold values must be numbers between 0 and 1",
      );
    });

    it('should throw if `threshold` contains a value that cannot be casted to a finite number', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        return new IntersectionObserver(() => {}, {threshold: ['test']});
      }).toThrow(
        "Failed to read the 'threshold' property from 'IntersectionObserverInit': The provided double value is non-finite.",
      );
    });

    it('should provide access to `root`, `rootMargin` and `thresholds`', () => {
      observer = new IntersectionObserver(() => {});

      expect(observer.root).toBe(null);
      expect(observer.rootMargin).toBe('0px 0px 0px 0px');
      expect(observer.thresholds).toEqual([0]);
    });

    it('should normalize `threshold` values', () => {
      // Sets default value
      expect(new IntersectionObserver(() => {}).thresholds).toEqual([0]);
      // Sets default value
      expect(
        new IntersectionObserver(() => {}, {threshold: []}).thresholds,
      ).toEqual([0]);

      // Converts to array
      expect(
        new IntersectionObserver(() => {}, {threshold: 0.5}).thresholds,
      ).toEqual([0.5]);

      // Sorts
      expect(
        new IntersectionObserver(() => {}, {threshold: [0.5, 0, 1]}).thresholds,
      ).toEqual([0, 0.5, 1]);

      // Does NOT deduplicate (browsers don't do it - shrug)
      expect(
        new IntersectionObserver(() => {}, {threshold: [0.5, 0.5, 0.5]})
          .thresholds,
      ).toEqual([0.5, 0.5, 0.5]);

      // Casts to number
      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {threshold: [true]}).thresholds,
      ).toEqual([1]);
      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {threshold: [false]}).thresholds,
      ).toEqual([0]);
      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {threshold: ['']}).thresholds,
      ).toEqual([0]);
    });

    it('should not throw if rnRootThreshold is null or undefined', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        return new IntersectionObserver(() => {}, {rnRootThreshold: null});
      }).not.toThrow();

      expect(() => {
        return new IntersectionObserver(() => {}, {
          rnRootThreshold: undefined,
        });
      }).not.toThrow();
    });

    it('should throw if rnRootThreshold is set to an invalid value', () => {
      expect(() => {
        return new IntersectionObserver(() => {}, {
          // $FlowExpectedError[incompatible-call]
          rnRootThreshold: 2,
        });
      }).toThrow(
        "Failed to construct 'IntersectionObserver': Threshold values must be numbers between 0 and 1",
      );

      expect(() => {
        return new IntersectionObserver(() => {}, {
          // $FlowExpectedError[incompatible-call]
          rnRootThreshold: 'invalid',
        });
      }).toThrow(
        "Failed to read the 'rnRootThreshold' property from 'IntersectionObserverInit': The provided double value is non-finite.",
      );
    });

    it('should default to null if rnRootThreshold is not set or invalid', () => {
      expect(
        new IntersectionObserver(() => {}, {}).rnRootThresholds,
      ).toBeNull();

      expect(
        new IntersectionObserver(() => {}, {threshold: 1}).rnRootThresholds,
      ).toBeNull();
      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {rnRootThreshold: null})
          .rnRootThresholds,
      ).toBeNull();

      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: undefined})
          .rnRootThresholds,
      ).toBeNull();

      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: []})
          .rnRootThresholds,
      ).toBeNull();

      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {rnRootThreshold: [null]})
          .rnRootThresholds,
      ).toBeNull();
    });

    it('should normalize `rnRootThreshold` values', () => {
      // Sets default value
      expect(new IntersectionObserver(() => {}).rnRootThresholds).toBeNull();
      // Sets default value
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: []})
          .rnRootThresholds,
      ).toBeNull();

      // Converts to array
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: 0.5})
          .rnRootThresholds,
      ).toEqual([0.5]);

      // Sorts
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: [0.5, 0, 1]})
          .rnRootThresholds,
      ).toEqual([0, 0.5, 1]);

      // Does NOT deduplicate (browsers don't do it - shrug)
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: [0.5, 0.5, 0.5]})
          .rnRootThresholds,
      ).toEqual([0.5, 0.5, 0.5]);

      // Casts to number
      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {rnRootThreshold: [true]})
          .rnRootThresholds,
      ).toEqual([1]);
      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {rnRootThreshold: [false]})
          .rnRootThresholds,
      ).toEqual([0]);
      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {rnRootThreshold: ['']})
          .rnRootThresholds,
      ).toEqual([0]);
    });

    it('should default thresholds to empty if rnRootThreshold is validly', () => {
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: 0.5}).thresholds,
      ).toEqual([]);

      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: [1]}).thresholds,
      ).toEqual([]);
    });

    it('should default thresholds to [0] if rnRootThreshold is invalidly set', () => {
      expect(
        // $FlowExpectedError[incompatible-call]
        new IntersectionObserver(() => {}, {rnRootThreshold: null}).thresholds,
      ).toEqual([0]);

      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: []}).thresholds,
      ).toEqual([0]);
    });
  });

  describe('observe(target)', () => {
    it('should throw if `target` is not a `ReactNativeElement`', () => {
      observer = new IntersectionObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        observer.observe('something');
      }).toThrow(
        "Failed to execute 'observe' on 'IntersectionObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    });

    it('should start observing the target when called for the first time (using normalized thresholds)', () => {
      let maybeNode;
      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <View
            style={{width: 100, height: 100}}
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [1, 0.5, 0],
        });
        observer.observe(node);
      });

      expect(observer.thresholds).toEqual([0, 0.5, 1]);
      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(true);

      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expect(entries[0].target).toBe(node);
      expect(entries[0].intersectionRatio).toBe(1);
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });

      expect(reportedObserver).toBe(observer);
    });

    it('should ignore subsequent calls to observe a target already being observed', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            style={{width: 100, height: 100}}
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });
      const node = ensureReactNativeElement(maybeNode);

      const intersectionObserverCallback = jest.fn();

      // Let observer to run
      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [0, 0.5, 1],
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].target).toBe(node);
      expect(reportedObserver).toBe(observer);

      // Observe the same node and let observer run again
      Fantom.runTask(() => {
        observer.observe(node);
      });

      // Expect no additional calls
      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
    });

    it('should ignore disconnected targets', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            style={{width: 100, height: 100}}
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(node.isConnected).toBe(false);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
        observer.observe(node);
      });

      expect(intersectionObserverCallback).not.toHaveBeenCalled();
    });

    it('should report completely non-intersecting initial state correctly', () => {
      let maybeNode;
      let maybeScrollNode;

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });
      const scrollNode = ensureReactNativeElement(maybeScrollNode);
      // Ensure View is not intersecting with ScrollView
      Fantom.scrollTo(scrollNode, {x: 0, y: 200});

      const node = ensureReactNativeElement(maybeNode);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [0],
          rnRootThreshold: [0.5],
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(0);
      expect(entries[0].rnRootIntersectionRatio).toBe(0);
      expect(entries[0].isIntersecting).toBe(false);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -200,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    it('should report partial non-intersecting initial state correctly', () => {
      let maybeNode;
      let maybeScrollNode;

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });

      const scrollNode = ensureReactNativeElement(maybeScrollNode);
      const node = ensureReactNativeElement(maybeNode);

      // Scroll such that View is partially intersecting
      Fantom.scrollTo(scrollNode, {x: 0, y: 25});

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [1],
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(0.5);
      expect(entries[0].rnRootIntersectionRatio).toBe(0.00125);
      expect(entries[0].isIntersecting).toBe(false);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 50,
        height: 25,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -25,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    it('should report partial intersecting initial state correctly', () => {
      let maybeNode;
      let maybeScrollNode;

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });
      const scrollNode = ensureReactNativeElement(maybeScrollNode);
      const node = ensureReactNativeElement(maybeNode);

      // Scroll such that View is partially intersecting
      Fantom.scrollTo(scrollNode, {x: 0, y: 25});

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [],
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(0.5);
      expect(entries[0].rnRootIntersectionRatio).toBe(0.00125);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 50,
        height: 25,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -25,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    it('should report subsequent updates correctly', () => {
      let maybeNode;
      let maybeScrollNode;

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
            <View
              style={{width: 100, height: 100}}
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });

      const node = ensureReactNativeElement(maybeNode);
      const scrollNode = ensureReactNativeElement(maybeScrollNode);

      expect(node.isConnected).toBe(true);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(1);
      expect(entries[0].rnRootIntersectionRatio).toBe(0.01);
      expect(entries[0].isIntersecting).toBe(true);

      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });

      expect(reportedObserver).toBe(observer);

      // Move the view out of the viewport
      Fantom.scrollTo(scrollNode, {x: 0, y: 200});

      expect(node.isConnected).toBe(true);
      expect(intersectionObserverCallback).toHaveBeenCalledTimes(2);
      const [entries2, reportedObserver2] =
        intersectionObserverCallback.mock.lastCall;
      expect(entries2.length).toBe(1);
      expect(entries2[0].isIntersecting).toBe(false);
      expect(entries2[0].target).toBe(node);

      expectRectEquals(entries2[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expectRectEquals(entries2[0].boundingClientRect, {
        x: 0,
        y: -200,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries2[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
      expect(reportedObserver2).toBe(observer);
    });

    it('should report updates to the right observers', () => {
      let maybeNode1;
      let maybeNode2;
      let maybeScrollNode;
      let observer1: IntersectionObserver;
      let observer2: IntersectionObserver;

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}
            />
            <View
              style={{width: 200, height: 200}}
              ref={receivedNode => {
                maybeNode2 = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });
      const node1 = ensureReactNativeElement(maybeNode1);
      const node2 = ensureReactNativeElement(maybeNode2);
      const scrollNode = ensureReactNativeElement(maybeScrollNode);

      // Scroll such that node1 is not intersecting and node 2 is intersecting
      Fantom.scrollTo(scrollNode, {x: 0, y: 100});

      const intersectionObserverCallback1 = jest.fn();
      const intersectionObserverCallback2 = jest.fn();

      Fantom.runTask(() => {
        observer1 = new IntersectionObserver(intersectionObserverCallback1, {
          threshold: [0],
        });

        observer1.observe(node1);
        observer1.observe(node2);

        observer2 = new IntersectionObserver(intersectionObserverCallback2, {
          threshold: [1],
        });
        observer2.observe(node2);
      });

      // Verify observer1 is reporting right thing
      expect(intersectionObserverCallback1).toHaveBeenCalledTimes(1);
      const [entries1, reportedObserver1] =
        intersectionObserverCallback1.mock.lastCall;

      expect(reportedObserver1).toBe(observer1);
      expect(entries1.length).toBe(2);

      expect(entries1[0].isIntersecting).toBe(false);
      expect(entries1[0].intersectionRatio).toBe(0);
      expect(entries1[0].target).toBe(node1);

      expectRectEquals(entries1[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expectRectEquals(entries1[0].boundingClientRect, {
        x: 0,
        y: -100,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries1[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });

      expect(entries1[1].isIntersecting).toBe(true);
      expect(entries1[1].intersectionRatio).toBe(0.75);
      expect(entries1[1].target).toBe(node2);

      // Verify observer2 is reporting no intersection because the threshold is 1
      expect(intersectionObserverCallback2).toHaveBeenCalledTimes(1);
      const [entries2, reportedObserver2] =
        intersectionObserverCallback2.mock.lastCall;

      expect(reportedObserver2).toBe(observer2);
      expect(entries2.length).toBe(1);

      expect(entries2[0].isIntersecting).toBe(false);
      expect(entries2[0].intersectionRatio).toBe(0.75);
      expect(entries2[0].target).toBe(node2);

      expectRectEquals(entries2[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 200,
        height: 150,
      });
      expectRectEquals(entries2[0].boundingClientRect, {
        x: 0,
        y: -50,
        width: 200,
        height: 200,
      });
      expectRectEquals(entries2[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    describe('rootThreshold', () => {
      it('should report partial intersecting initial state correctly', () => {
        let maybeNode;

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100}}
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />,
          );
        });

        const node = ensureReactNativeElement(maybeNode);

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rnRootThreshold: [1, 0.5, 0],
          });
          observer.observe(node);
        });

        expect(observer.rnRootThresholds).toEqual([0, 0.5, 1]);
        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);

        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(true);
        expect(entries[0].target).toBe(node);
        expect(entries[0].intersectionRatio).toBe(1);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.01);

        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });

        expect(reportedObserver).toBe(observer);
      });

      it('should report partial non-intersecting initial state correctly', () => {
        let maybeNode;
        let maybeScrollNode;

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
              <View
                style={{width: 50, height: 50}}
                ref={receivedNode => {
                  maybeNode = receivedNode;
                }}
              />
            </ScrollView>,
          );
        });
        const node = ensureReactNativeElement(maybeNode);
        const scrollNode = ensureReactNativeElement(maybeScrollNode);

        Fantom.scrollTo(scrollNode, {x: 0, y: 25});

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rnRootThreshold: [0.5],
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0.5);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.00125);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 50,
          height: 25,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: -25,
          width: 50,
          height: 50,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
      });

      it('should report completely non-intersecting initial state correctly', () => {
        let maybeNode;
        let maybeScrollNode;

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
              <View
                style={{width: 50, height: 50}}
                ref={receivedNode => {
                  maybeNode = receivedNode;
                }}
              />
            </ScrollView>,
          );
        });
        const node = ensureReactNativeElement(maybeNode);
        const scrollNode = ensureReactNativeElement(maybeScrollNode);

        Fantom.scrollTo(scrollNode, {x: 0, y: 200});

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rnRootThreshold: [0.5],
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0);
        expect(entries[0].rnRootIntersectionRatio).toBe(0);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: -200,
          width: 50,
          height: 50,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
      });

      it('should report subsequent updates correctly', () => {
        let maybeNode;
        let maybeScrollNode;

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
              <View
                style={{
                  width: 1000,
                  height: 1000,
                }}
                ref={receivedNode => {
                  maybeNode = receivedNode;
                }}
              />
              <View
                style={{
                  width: 1000,
                  height: 2000, // This view purely to add height
                }}
              />
            </ScrollView>,
          );
        });

        const node = ensureReactNativeElement(maybeNode);
        const scrollNode = ensureReactNativeElement(maybeScrollNode);

        // Scroll such that target View is not intersecting
        Fantom.scrollTo(scrollNode, {x: 0, y: 2000});

        expect(node.isConnected).toBe(true);

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rnRootThreshold: [1],
          });
          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0);
        expect(entries[0].rnRootIntersectionRatio).toBe(0);
        expect(entries[0].isIntersecting).toBe(false);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: -2000,
          width: 1000,
          height: 1000,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });

        expect(reportedObserver).toBe(observer);

        // Scroll target View into viewport
        Fantom.scrollTo(scrollNode, {x: 0, y: 0});

        expect(node.isConnected).toBe(true);
        expect(intersectionObserverCallback).toHaveBeenCalledTimes(2);
        const [entries2, reportedObserver2] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries2.length).toBe(1);
        expect(entries2[0].isIntersecting).toBe(true);
        expect(entries2[0].intersectionRatio).toBe(1);
        expect(entries2[0].rnRootIntersectionRatio).toBe(1);
        expect(entries2[0].target).toBe(node);

        expectRectEquals(entries2[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
        expectRectEquals(entries2[0].boundingClientRect, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
        expectRectEquals(entries2[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });

        expect(reportedObserver2).toBe(observer);
      });
    });
  });

  describe('unobserve(target)', () => {
    it('should throw if `target` is not a `ReactNativeElement`', () => {
      observer = new IntersectionObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        observer.unobserve('something');
      }).toThrow(
        "Failed to execute 'unobserve' on 'IntersectionObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    });

    it('should ignore the call if `target` was not observed (not fail)', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);
      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback);
        observer.unobserve(node);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should stop observing the target if it was observed', () => {
      let maybeNode;
      let maybeScrollNode;

      const root = Fantom.createRoot();
      // View is not intersecting with ScrollView
      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={receivedNode => (maybeScrollNode = receivedNode)}>
            <View
              style={{width: 100, height: 100}}
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });

      const node = ensureReactNativeElement(maybeNode);
      const scrollNode = ensureReactNativeElement(maybeScrollNode);

      Fantom.scrollTo(scrollNode, {x: 0, y: 100});

      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback, {threshold: 1});
        observer.observe(node);
      });

      // Should get initial non-intersecting entry on observation
      expect(callback).toHaveBeenCalledTimes(1);
      const [entries] = callback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(false);

      Fantom.runTask(() => {
        observer.unobserve(node);
      });

      // Update View such that it is intersecting
      Fantom.runTask(() => {
        root.render(
          <ScrollView>
            <View
              style={{width: 100, height: 100}}
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });

      // Expect no additional callback calls
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should stop observing the target if it was observed (detached target after observing)', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback);
        observer.observe(node);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(node.isConnected).toBe(false);

      Fantom.runTask(() => {
        observer.unobserve(node);
      });

      // expect no change in callback
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should stop observing the target if it was observed (detached target before observing)', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      Fantom.runTask(() => {
        root.render(<></>);
      });
      expect(node.isConnected).toBe(false);

      observer = new IntersectionObserver(() => {});
      observer.observe(node);
      observer.unobserve(node);
    });

    it('should not report the initial state if the target is unobserved before it is delivered', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
        observer.observe(node);
        observer.unobserve(node);
      });

      expect(intersectionObserverCallback).not.toHaveBeenCalled();
    });

    it('should not report updates if the target is unobserved before they are delivered', () => {
      let maybeNode;
      let maybeScrollNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <ScrollView
            ref={receivedNode => {
              maybeScrollNode = receivedNode;
            }}>
            <View
              style={{width: 100, height: 100}}
              ref={receivedNode => {
                maybeNode = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });

      const scrollNode = ensureReactNativeElement(maybeScrollNode);

      // Scroll such that view is not intersecting with ScrollView
      Fantom.scrollTo(scrollNode, {
        x: 0,
        y: 100,
      });

      const node = ensureReactNativeElement(maybeNode);

      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback, {threshold: 1});
        observer.observe(node);
      });

      // Should get initial non-intersecting entry on observation
      expect(callback).toHaveBeenCalledTimes(1);
      const [entries] = callback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(false);

      Fantom.runTask(() => {
        observer.unobserve(node);
      });

      // Scroll ScrollView such that View is intersecting
      Fantom.scrollTo(scrollNode, {
        x: 0,
        y: 0,
      });

      // The callback should not be called again because the target was
      // unobserved before the callback was called with the update.
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not report updates if the target is unobserved before they are delivered (with other active targets)', () => {
      let maybeNode1;
      let maybeNode2;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}
            />
            <View
              style={{width: 200, height: 200}}
              ref={receivedNode => {
                maybeNode2 = receivedNode;
              }}
            />
          </>,
        );
      });
      const node1 = ensureReactNativeElement(maybeNode1);
      const node2 = ensureReactNativeElement(maybeNode2);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: 0,
        });

        observer.observe(node1);
        observer.observe(node2);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);

      Fantom.runTask(() => {
        observer.unobserve(node1);
      });

      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}
            />
            <View
              style={{width: 200, height: 200}}
              ref={receivedNode => {
                maybeNode2 = receivedNode;
              }}
            />
          </>,
        );
      });

      // There should be no additional callback becuase node1 was unobserved
      // and node2 has no change in intersecting state (threshold 0)
      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
    });

    // This is a regression test for a bug where the registration data for the
    // target was incorrectly cleaned up when a single observer stopped
    // observing it.
    it('should work with multiple intersection observer instances', () => {
      let maybeNode;
      let observer1: IntersectionObserver;
      let observer2: IntersectionObserver;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      Fantom.runTask(() => {
        observer1 = new IntersectionObserver(() => {});
        observer2 = new IntersectionObserver(() => {});

        observer1.observe(node);
        observer2.observe(node);

        observer1.unobserve(node);

        // The second call shouldn't log errors (that would make the test fail).
        observer2.unobserve(node);
      });
    });
  });

  describe('disconnect', () => {
    it('should do nothing if no targets are observed (not fail)', () => {
      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback);
        observer.disconnect();
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should stop observing all observed targets', () => {
      let maybeNode1;
      let maybeNode2;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}
            />
            <View
              style={{width: 200, height: 200}}
              ref={receivedNode => {
                maybeNode2 = receivedNode;
              }}
            />
          </>,
        );
      });
      const node1 = ensureReactNativeElement(maybeNode1);
      const node2 = ensureReactNativeElement(maybeNode2);

      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback);

        observer.observe(node1);
        observer.observe(node2);

        observer.disconnect();
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
