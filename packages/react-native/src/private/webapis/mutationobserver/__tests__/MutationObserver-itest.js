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

import type MutationObserverType from 'react-native/src/private/webapis/mutationobserver/MutationObserver';
import type MutationRecordType from 'react-native/src/private/webapis/mutationobserver/MutationRecord';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {View} from 'react-native';
import setUpMutationObserver from 'react-native/src/private/setup/setUpMutationObserver';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

declare const MutationObserver: Class<MutationObserverType>;
declare const MutationRecord: Class<MutationRecordType>;

setUpMutationObserver();

function ensureReactNativeElement(value: mixed): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

function ensureMutationRecordArray(
  value: mixed,
): $ReadOnlyArray<MutationRecord> {
  return ensureInstance(value, Array).map((element: mixed) =>
    ensureInstance(element, MutationRecord),
  );
}

describe('MutationObserver', () => {
  describe('constructor(callback)', () => {
    it('should throw if `callback` is not provided', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        return new MutationObserver();
      }).toThrow(
        "Failed to construct 'MutationObserver': 1 argument required, but only 0 present.",
      );
    });

    it('should throw if `callback` is not a function', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        return new MutationObserver('not a function!');
      }).toThrow(
        "Failed to construct 'MutationObserver': parameter 1 is not of type 'Function'.",
      );
    });
  });

  describe('observe(target, {childList: boolean, subtree: boolean})', () => {
    it('should throw if `target` is not a `ReactNativeElement`', () => {
      const observer = new MutationObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        observer.observe('something');
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    });

    it('should throw if the `childList` option is not provided', () => {
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
        const observer = new MutationObserver(() => {});
        observer.observe(node);
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': The options object must set 'childList' to true.",
      );

      expect(() => {
        const observer = new MutationObserver(() => {});
        // $FlowExpectedError[incompatible-call]
        observer.observe(node, {childList: false});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': The options object must set 'childList' to true.",
      );

      expect(() => {
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true});
      }).not.toThrow();

      expect(() => {
        const observer = new MutationObserver(() => {});
        // $FlowExpectedError[incompatible-call]
        observer.observe(node, {childList: 1});
      }).not.toThrow();
    });

    it('should throw if the `attributes` option is provided', () => {
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
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true, attributes: true});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': attributes is not supported",
      );
    });

    it('should throw if the `attributeFilter` option is provided', () => {
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
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true, attributeFilter: []});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': attributeFilter is not supported",
      );
    });

    it('should throw if the `attributeOldValue` option is provided', () => {
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
        const observer = new MutationObserver(() => {});
        // $FlowExpected
        observer.observe(node, {childList: true, attributeOldValue: true});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': attributeOldValue is not supported",
      );
    });

    it('should throw if the `characterData` option is provided', () => {
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
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true, characterData: true});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': characterData is not supported",
      );
    });

    it('should throw if the `characterDataOldValue` option is provided', () => {
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
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true, characterDataOldValue: true});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': characterDataOldValue is not supported",
      );
    });

    it('should ignore calls to observe disconnected targets', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            key="node1"
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

      const observerCallback = () => {};
      const observer = new MutationObserver(observerCallback);

      expect(() => {
        observer.observe(node, {childList: true});
      }).not.toThrow();
    });

    it('should report direct children added to and removed from an observed node (childList: true, subtree: false) ', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            key="node1"
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}
          />,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      const observerCallbackCallArgs = [];
      const observerCallback = (...args: $ReadOnlyArray<mixed>) => {
        observerCallbackCallArgs.push(args);
      };
      const observer = new MutationObserver(observerCallback);
      observer.observe(node, {childList: true});

      // Does not report anything initially
      expect(observerCallbackCallArgs.length).toBe(0);

      let maybeChildNode1, maybeChildNode2;

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View
              key="node1-1"
              ref={receivedChildNode => {
                maybeChildNode1 = receivedChildNode;
              }}
            />
            <View
              key="node1-2"
              ref={receivedChildNode => {
                maybeChildNode2 = receivedChildNode;
              }}
            />
          </View>,
        );
      });

      const childNode1 = ensureReactNativeElement(maybeChildNode1);
      const childNode2 = ensureReactNativeElement(maybeChildNode2);

      expect(observerCallbackCallArgs.length).toBe(1);
      const firstCall = nullthrows(observerCallbackCallArgs.at(-1));
      expect(firstCall.length).toBe(2);

      const firstRecords = ensureMutationRecordArray(firstCall[0]);
      expect(firstRecords).toBeInstanceOf(Array);
      expect(firstRecords.length).toBe(1);
      expect(firstRecords[0]).toBeInstanceOf(MutationRecord);

      const firstRecord = firstRecords[0];
      expect(firstRecord.type).toBe('childList');
      expect(firstRecord.target).toBe(node);
      expect(firstRecord.addedNodes).toBeInstanceOf(NodeList);
      expect(firstRecord.addedNodes[0]).toBe(childNode1);
      expect(firstRecord.addedNodes[1]).toBe(childNode2);
      expect(firstRecord.removedNodes).toBeInstanceOf(NodeList);
      expect(firstRecord.removedNodes.length).toBe(0);

      expect(firstCall[1]).toBe(observer);

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-2" />
          </View>,
        );
      });

      expect(observerCallbackCallArgs.length).toBe(2);
      const secondCall = nullthrows(observerCallbackCallArgs.at(-1));
      expect(secondCall.length).toBe(2);

      const secondRecords = ensureMutationRecordArray(secondCall[0]);
      expect(secondRecords.length).toBe(1);
      expect(secondRecords[0]).toBeInstanceOf(MutationRecord);

      const secondRecord = secondRecords[0];
      expect(secondRecord.type).toBe('childList');
      expect(secondRecord.target).toBe(node);
      expect(secondRecord.addedNodes).toBeInstanceOf(NodeList);
      expect([...secondRecord.addedNodes]).toEqual([]);
      expect(secondRecord.removedNodes).toBeInstanceOf(NodeList);
      expect([...secondRecord.removedNodes]).toEqual([childNode1]);

      expect(secondCall[1]).toBe(observer);
    });

    it('should NOT report changes in transitive children when `subtree` is not set to true', () => {
      let maybeObservedNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            key="node1"
            ref={receivedNode => {
              maybeObservedNode = receivedNode;
            }}>
            <View key="node1-1" />
          </View>,
        );
      });

      const observedNode = ensureReactNativeElement(maybeObservedNode);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(observedNode, {childList: true});

      // Does not report anything initially
      expect(observerCallback).not.toHaveBeenCalled();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1">
              <View key="node1-1-1" />
            </View>
          </View>,
        );
      });

      expect(observerCallback).not.toHaveBeenCalled();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" />
          </View>,
        );
      });

      expect(observerCallback).not.toHaveBeenCalled();
    });

    it('should report changes in transitive children when `subtree` is set to true', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            key="node1"
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}>
            <View key="node1-1" />
          </View>,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(node, {childList: true, subtree: true});

      // Does not report anything initially
      expect(observerCallback).not.toHaveBeenCalled();

      let maybeNode111;

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1">
              <View
                key="node1-1-1"
                ref={receivedGrandchildNode => {
                  maybeNode111 = receivedGrandchildNode;
                }}
              />
            </View>
          </View>,
        );
      });

      const node111 = ensureReactNativeElement(maybeNode111);

      expect(observerCallback).toHaveBeenCalledTimes(1);
      const firstCall = observerCallback.mock.lastCall;
      const firstRecords = ensureMutationRecordArray(firstCall[0]);
      expect(firstRecords.length).toBe(1);
      expect([...firstRecords[0].addedNodes]).toEqual([node111]);
      expect([...firstRecords[0].removedNodes]).toEqual([]);

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" />
          </View>,
        );
      });

      expect(observerCallback).toHaveBeenCalledTimes(2);
      const secondRecords = ensureMutationRecordArray(
        observerCallback.mock.lastCall[0],
      );
      expect(secondRecords.length).toBe(1);
      expect([...secondRecords[0].addedNodes]).toEqual([]);
      expect([...secondRecords[0].removedNodes]).toEqual([node111]);
    });

    it('should report changes in different parts of the subtree as separate entries (subtree = true)', () => {
      let maybeNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            key="node1"
            ref={receivedNode => {
              maybeNode = receivedNode;
            }}>
            <View key="node1-1" />
            <View key="node1-2" />
          </View>,
        );
      });

      const node = ensureReactNativeElement(maybeNode);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(node, {childList: true, subtree: true});

      // Does not report anything initially
      expect(observerCallback).not.toHaveBeenCalled();

      let maybeNode111, maybeNode121;

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1">
              <View
                key="node1-1-1"
                ref={receivedGrandchildNode => {
                  maybeNode111 = receivedGrandchildNode;
                }}
              />
            </View>
            <View key="node1-2">
              <View
                key="node1-2-1"
                ref={receivedGrandchildNode => {
                  maybeNode121 = receivedGrandchildNode;
                }}
              />
            </View>
          </View>,
        );
      });

      const node111 = ensureReactNativeElement(maybeNode111);
      const node121 = ensureReactNativeElement(maybeNode121);

      expect(observerCallback).toHaveBeenCalledTimes(1);
      const firstCall = observerCallback.mock.lastCall;
      const firstRecords = ensureMutationRecordArray(firstCall[0]);
      expect(firstRecords.length).toBe(2);
      expect([...firstRecords[0].addedNodes]).toEqual([node111]);
      expect([...firstRecords[0].removedNodes]).toEqual([]);
      expect([...firstRecords[1].addedNodes]).toEqual([node121]);
      expect([...firstRecords[1].removedNodes]).toEqual([]);

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" />
            <View key="node1-2" />
          </View>,
        );
      });

      expect(observerCallback).toHaveBeenCalledTimes(2);
      const secondCall = observerCallback.mock.lastCall;
      const secondRecords = ensureMutationRecordArray(secondCall[0]);
      expect(secondRecords.length).toBe(2);
      expect([...secondRecords[0].addedNodes]).toEqual([]);
      expect([...secondRecords[0].removedNodes]).toEqual([node111]);
      expect([...secondRecords[1].addedNodes]).toEqual([]);
      expect([...secondRecords[1].removedNodes]).toEqual([node121]);

      expect(secondCall[1]).toBe(observer);
    });

    describe('multiple observers', () => {
      it('should report changes to multiple observers observing different subtrees', () => {
        let maybeNode1;
        let maybeNode2;

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <>
              <View
                key="node1"
                ref={receivedNode => {
                  maybeNode1 = receivedNode;
                }}
              />
              <View
                key="node2"
                ref={receivedNode => {
                  maybeNode2 = receivedNode;
                }}
              />
            </>,
          );
        });

        const node1 = ensureReactNativeElement(maybeNode1);
        const node2 = ensureReactNativeElement(maybeNode2);

        const observerCallback1 = jest.fn();
        const observer1 = new MutationObserver(observerCallback1);
        observer1.observe(node1, {childList: true, subtree: true});

        const observerCallback2 = jest.fn();
        const observer2 = new MutationObserver(observerCallback2);
        observer2.observe(node2, {childList: true, subtree: true});

        // Does not report anything initially
        expect(observerCallback1).not.toHaveBeenCalled();
        expect(observerCallback2).not.toHaveBeenCalled();

        let maybeChildNode11;
        let maybeChildNode21;

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1">
                <View
                  key="node1-1"
                  ref={receivedNode => {
                    maybeChildNode11 = receivedNode;
                  }}
                />
              </View>
              <View key="node2">
                <View
                  key="node2-1"
                  ref={receivedNode => {
                    maybeChildNode21 = receivedNode;
                  }}
                />
              </View>
            </>,
          );
        });

        const childNode11 = ensureReactNativeElement(maybeChildNode11);
        const childNode21 = ensureReactNativeElement(maybeChildNode21);

        expect(observerCallback1).toHaveBeenCalledTimes(1);
        const observer1Records1 = ensureMutationRecordArray(
          observerCallback1.mock.lastCall[0],
        );
        expect(observer1Records1.length).toBe(1);
        expect([...observer1Records1[0].addedNodes]).toEqual([childNode11]);
        expect([...observer1Records1[0].removedNodes]).toEqual([]);

        expect(observerCallback2).toHaveBeenCalledTimes(1);
        const observer2Records1 = ensureMutationRecordArray(
          observerCallback2.mock.lastCall[0],
        );
        expect(observer2Records1.length).toBe(1);
        expect([...observer2Records1[0].addedNodes]).toEqual([childNode21]);
        expect([...observer2Records1[0].removedNodes]).toEqual([]);

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1" />
              <View key="node2" />
            </>,
          );
        });

        expect(observerCallback1).toHaveBeenCalledTimes(2);
        const observer1Records2 = ensureMutationRecordArray(
          observerCallback1.mock.lastCall[0],
        );
        expect(observer1Records2.length).toBe(1);
        expect([...observer1Records2[0].addedNodes]).toEqual([]);
        expect([...observer1Records2[0].removedNodes]).toEqual([childNode11]);

        expect(observerCallback2).toHaveBeenCalledTimes(2);
        const observer2Records2 = ensureMutationRecordArray(
          observerCallback2.mock.lastCall[0],
        );
        expect(observer2Records2.length).toBe(1);
        expect([...observer2Records2[0].addedNodes]).toEqual([]);
        expect([...observer2Records2[0].removedNodes]).toEqual([childNode21]);
      });

      it('should report changes to multiple observers observing the same subtree', () => {
        let maybeNode1;
        let maybeNode2;

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View
              key="node1"
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}>
              <View
                key="node1-1"
                ref={receivedNode => {
                  maybeNode2 = receivedNode;
                }}
              />
            </View>,
          );
        });

        const node1 = ensureReactNativeElement(maybeNode1);
        const node2 = ensureReactNativeElement(maybeNode2);

        const observerCallback1 = jest.fn();
        const observer1 = new MutationObserver(observerCallback1);
        observer1.observe(node1, {childList: true, subtree: true});

        const observerCallback2 = jest.fn();
        const observer2 = new MutationObserver(observerCallback2);
        observer2.observe(node2, {childList: true, subtree: true});

        // Does not report anything initially
        expect(observerCallback1).not.toHaveBeenCalled();
        expect(observerCallback2).not.toHaveBeenCalled();

        let maybeChildNode111;

        Fantom.runTask(() => {
          root.render(
            <View key="node1">
              <View key="node1-1">
                <View
                  key="node-1-1-1"
                  ref={receivedNode => {
                    maybeChildNode111 = receivedNode;
                  }}
                />
              </View>
            </View>,
          );
        });

        const childNode111 = ensureReactNativeElement(maybeChildNode111);

        expect(observerCallback1).toHaveBeenCalledTimes(1);
        const observer1Records1 = ensureMutationRecordArray(
          observerCallback1.mock.lastCall[0],
        );
        expect(observer1Records1.length).toBe(1);
        expect([...observer1Records1[0].addedNodes]).toEqual([childNode111]);
        expect([...observer1Records1[0].removedNodes]).toEqual([]);
        expect(observerCallback2).toHaveBeenCalledTimes(1);
        const observer2Records1 = ensureMutationRecordArray(
          observerCallback2.mock.lastCall[0],
        );
        expect(observer2Records1.length).toBe(1);
        expect([...observer2Records1[0].addedNodes]).toEqual([childNode111]);
        expect([...observer2Records1[0].removedNodes]).toEqual([]);

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1">
                <View key="node1-1" />
              </View>
            </>,
          );
        });

        expect(observerCallback1).toHaveBeenCalledTimes(2);
        const observer1Records2 = ensureMutationRecordArray(
          observerCallback1.mock.lastCall[0],
        );
        expect(observer1Records2.length).toBe(1);
        expect([...observer1Records2[0].addedNodes]).toEqual([]);
        expect([...observer1Records2[0].removedNodes]).toEqual([childNode111]);

        expect(observerCallback2).toHaveBeenCalledTimes(2);
        const observer2Records2 = ensureMutationRecordArray(
          observerCallback2.mock.lastCall[0],
        );
        expect(observer2Records2.length).toBe(1);
        expect([...observer2Records2[0].addedNodes]).toEqual([]);
        expect([...observer2Records2[0].removedNodes]).toEqual([childNode111]);
      });
    });

    describe('multiple observed nodes in the same observer', () => {
      it('should report changes in disjoint observations', () => {
        let maybeNode1;
        let maybeNode2;

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <>
              <View
                key="node1"
                ref={receivedNode => {
                  maybeNode1 = receivedNode;
                }}
              />
              <View
                key="node2"
                ref={receivedNode => {
                  maybeNode2 = receivedNode;
                }}
              />
            </>,
          );
        });

        const node1 = ensureReactNativeElement(maybeNode1);
        const node2 = ensureReactNativeElement(maybeNode2);

        const observerCallback = jest.fn();
        const observer = new MutationObserver(observerCallback);
        observer.observe(node1, {childList: true, subtree: true});
        observer.observe(node2, {childList: true, subtree: true});

        // Does not report anything initially
        expect(observerCallback).not.toHaveBeenCalled();

        let maybeChildNode11;
        let maybeChildNode21;

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1">
                <View
                  key="node1-1"
                  ref={receivedNode => {
                    maybeChildNode11 = receivedNode;
                  }}
                />
              </View>
              <View key="node2">
                <View
                  key="node2-1"
                  ref={receivedNode => {
                    maybeChildNode21 = receivedNode;
                  }}
                />
              </View>
            </>,
          );
        });

        const childNode11 = ensureReactNativeElement(maybeChildNode11);
        const childNode21 = ensureReactNativeElement(maybeChildNode21);

        expect(observerCallback).toHaveBeenCalledTimes(1);
        const records = ensureMutationRecordArray(
          observerCallback.mock.lastCall[0],
        );
        expect(records.length).toBe(2);
        expect([...records[0].addedNodes]).toEqual([childNode11]);
        expect([...records[0].removedNodes]).toEqual([]);
        expect([...records[1].addedNodes]).toEqual([childNode21]);
        expect([...records[1].removedNodes]).toEqual([]);

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1" />
              <View key="node2" />
            </>,
          );
        });

        expect(observerCallback).toHaveBeenCalledTimes(2);
        const records2 = ensureMutationRecordArray(
          observerCallback.mock.lastCall[0],
        );
        expect(records2.length).toBe(2);
        expect([...records2[0].addedNodes]).toEqual([]);
        expect([...records2[0].removedNodes]).toEqual([childNode11]);
        expect([...records2[1].addedNodes]).toEqual([]);
        expect([...records2[1].removedNodes]).toEqual([childNode21]);
      });

      it('should report changes in joint observations', () => {
        let maybeNode1;
        let maybeNode11;

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View
              key="node1"
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}>
              <View
                key="node1-1"
                ref={receivedNode => {
                  maybeNode11 = receivedNode;
                }}
              />
            </View>,
          );
        });

        const node1 = ensureReactNativeElement(maybeNode1);
        const node11 = ensureReactNativeElement(maybeNode11);

        const observerCallback = jest.fn();
        const observer = new MutationObserver(observerCallback);
        observer.observe(node1, {childList: true, subtree: true});
        observer.observe(node11, {childList: true, subtree: true});

        // Does not report anything initially
        expect(observerCallback).not.toHaveBeenCalled();

        let maybeChildNode111;

        Fantom.runTask(() => {
          root.render(
            <View key="node1">
              <View key="node1-1">
                <View
                  key="node1-1-1"
                  ref={receivedNode => {
                    maybeChildNode111 = receivedNode;
                  }}
                />
              </View>
            </View>,
          );
        });

        const childNode111 = ensureReactNativeElement(maybeChildNode111);

        expect(observerCallback).toHaveBeenCalledTimes(1);
        const records = ensureMutationRecordArray(
          observerCallback.mock.lastCall[0],
        );
        expect(records.length).toBe(1);
        expect([...records[0].addedNodes]).toEqual([childNode111]);
        expect([...records[0].removedNodes]).toEqual([]);

        Fantom.runTask(() => {
          root.render(
            <View key="node1">
              <View key="node1-1" />
            </View>,
          );
        });

        expect(observerCallback).toHaveBeenCalledTimes(2);
        const records2 = ensureMutationRecordArray(
          observerCallback.mock.lastCall[0],
        );
        expect(records2.length).toBe(1);
        expect([...records2[0].addedNodes]).toEqual([]);
        expect([...records2[0].removedNodes]).toEqual([childNode111]);
      });
    });
  });

  describe('disconnect()', () => {
    it('should stop observing targets', () => {
      let maybeObservedNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            key="node1"
            ref={receivedNode => {
              maybeObservedNode = receivedNode;
            }}
          />,
        );
      });

      const observedNode = ensureReactNativeElement(maybeObservedNode);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(observedNode, {childList: true});

      // Does not report anything initially
      expect(observerCallback).not.toHaveBeenCalled();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" />
            <View key="node1-2" />
          </View>,
        );
      });

      expect(observerCallback).toHaveBeenCalledTimes(1);

      observer.disconnect();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-2" />
          </View>,
        );
      });

      expect(observerCallback).toHaveBeenCalledTimes(1);
    });

    it('should correctly unobserve targets that are disconnected after observing', () => {
      let maybeObservedNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            key="node1"
            ref={receivedNode => {
              maybeObservedNode = receivedNode;
            }}
          />,
        );
      });

      const observedNode = ensureReactNativeElement(maybeObservedNode);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(observedNode, {childList: true});

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(observedNode.isConnected).toBe(false);

      expect(() => {
        observer.disconnect();
      }).not.toThrow();
    });

    it('should correctly unobserve targets that are disconnected before observing', () => {
      let maybeObservedNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            key="node1"
            ref={receivedNode => {
              maybeObservedNode = receivedNode;
            }}
          />,
        );
      });

      const observedNode = ensureReactNativeElement(maybeObservedNode);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(observedNode.isConnected).toBe(false);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(observedNode, {childList: true});

      expect(() => {
        observer.disconnect();
      }).not.toThrow();
    });
  });
});
