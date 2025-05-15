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

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ReactNativeElement from '../../../../src/private/webapis/dom/nodes/ReactNativeElement';
import {getRawNativeDOMForTests} from '../../../../src/private/webapis/dom/nodes/specs/NativeDOM';
import TextInputState from '../../../Components/TextInput/TextInputState';
import View from '../../../Components/View/View';
import ReactFabricHostComponent from '../ReactFabricHostComponent';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';

export default function setUpTests({isModern}: {isModern: boolean}) {
  // TODO: move these tests to the test file for `ReactNativeElement` when the legacy implementation is removed.
  describe(`ReactFabricPublicInstance (${isModern ? 'modern' : 'legacy'})`, () => {
    it('should provide instances of the right class as refs in host components', () => {
      let node;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            ref={receivedNode => {
              node = receivedNode;
            }}
          />,
        );
      });

      expect(node).toBeInstanceOf(
        isModern ? ReactNativeElement : ReactFabricHostComponent,
      );
    });

    describe('blur', () => {
      test('blur() invokes TextInputState', () => {
        const root = Fantom.createRoot();

        let maybeNode;

        Fantom.runTask(() => {
          root.render(
            <View
              ref={node => {
                maybeNode = node;
              }}
            />,
          );
        });

        const node = nullthrows(maybeNode);

        const blurTextInput = jest.fn();

        // We don't support view commands in Fantom yet, so we have to mock this.
        TextInputState.blurTextInput = blurTextInput;

        Fantom.runTask(() => {
          node.blur();
        });

        expect(blurTextInput).toHaveBeenCalledTimes(1);
        expect(blurTextInput.mock.calls).toEqual([[node]]);
      });
    });

    describe('focus', () => {
      test('focus() invokes TextInputState', () => {
        const root = Fantom.createRoot();

        let maybeNode;

        Fantom.runTask(() => {
          root.render(
            <View
              ref={node => {
                maybeNode = node;
              }}
            />,
          );
        });

        const node = nullthrows(maybeNode);

        const focusTextInput = jest.fn();

        // We don't support view commands in Fantom yet, so we have to mock this.
        TextInputState.focusTextInput = focusTextInput;

        Fantom.runTask(() => {
          node.focus();
        });

        expect(focusTextInput).toHaveBeenCalledTimes(1);
        expect(focusTextInput.mock.calls).toEqual([[node]]);
      });
    });

    describe('measure', () => {
      it('component.measure(...) invokes callback', () => {
        const root = Fantom.createRoot();

        let maybeNode;

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={node => {
                maybeNode = node;
              }}
            />,
          );
        });

        const node = nullthrows(maybeNode);

        const callback = jest.fn();
        node.measure(callback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls).toEqual([[10, 10, 100, 100, 10, 10]]);
      });

      it('unmounted.measure(...) does nothing', () => {
        const root = Fantom.createRoot();

        let maybeNode;

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={node => {
                maybeNode = node;
              }}
            />,
          );
        });

        const node = nullthrows(maybeNode);

        Fantom.runTask(() => {
          root.render(<></>);
        });

        const callback = jest.fn();
        node.measure(callback);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('measureInWindow', () => {
      it('component.measureInWindow(...) invokes callback', () => {
        const root = Fantom.createRoot();

        let maybeNode;

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={node => {
                maybeNode = node;
              }}
            />,
          );
        });

        const node = nullthrows(maybeNode);

        const callback = jest.fn();
        node.measureInWindow(callback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls).toEqual([[10, 10, 100, 100]]);
      });

      it('unmounted.measureInWindow(...) does nothing', () => {
        const root = Fantom.createRoot();

        let maybeNode;

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={node => {
                maybeNode = node;
              }}
            />,
          );
        });

        const node = nullthrows(maybeNode);

        Fantom.runTask(() => {
          root.render(<></>);
        });

        const callback = jest.fn();
        node.measureInWindow(callback);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('measureLayout', () => {
      it('component.measureLayout(component, ...) invokes callback', () => {
        const root = Fantom.createRoot();

        let maybeParentNode;
        let maybeChildNode;

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={node => {
                maybeParentNode = node;
              }}>
              <View
                style={{width: 10, height: 10, left: 20, top: 20}}
                ref={node => {
                  maybeChildNode = node;
                }}
              />
            </View>,
          );
        });

        const parentNode = nullthrows(maybeParentNode);
        const childNode = nullthrows(maybeChildNode);

        const callback = jest.fn();
        childNode.measureLayout(parentNode, callback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls).toEqual([[20, 20, 10, 10]]);
      });

      it('unmounted.measureLayout(component, ...) does nothing', () => {
        const root = Fantom.createRoot();

        let maybeParentNode;
        let maybeChildNode;

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={node => {
                maybeParentNode = node;
              }}>
              <View
                style={{width: 10, height: 10, left: 20, top: 20}}
                ref={node => {
                  maybeChildNode = node;
                }}
              />
            </View>,
          );
        });

        const parentNode = nullthrows(maybeParentNode);
        const childNode = nullthrows(maybeChildNode);

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100, left: 10, top: 10}} />,
          );
        });

        const callback = jest.fn();
        childNode.measureLayout(parentNode, callback);

        expect(callback).not.toHaveBeenCalled();
      });

      it('component.measureLayout(unmounted, ...) does nothing', () => {
        const root = Fantom.createRoot();

        let maybeParentNode;
        let maybeChildNode;

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={node => {
                maybeParentNode = node;
              }}>
              <View
                style={{width: 10, height: 10, left: 20, top: 20}}
                ref={node => {
                  maybeChildNode = node;
                }}
              />
            </View>,
          );
        });

        const parentNode = nullthrows(maybeParentNode);
        const childNode = nullthrows(maybeChildNode);

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100, left: 10, top: 10}} />,
          );
        });

        const callback = jest.fn();
        parentNode.measureLayout(childNode, callback);

        expect(callback).not.toHaveBeenCalled();
      });

      it('unmounted.measureLayout(unmounted, ...) does nothing', () => {
        const root = Fantom.createRoot();

        let maybeParentNode;
        let maybeChildNode;

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={node => {
                maybeParentNode = node;
              }}>
              <View
                style={{width: 10, height: 10, left: 20, top: 20}}
                ref={node => {
                  maybeChildNode = node;
                }}
              />
            </View>,
          );
        });

        const parentNode = nullthrows(maybeParentNode);
        const childNode = nullthrows(maybeChildNode);

        Fantom.runTask(() => {
          root.render(<></>);
        });

        const callback = jest.fn();
        childNode.measureLayout(parentNode, callback);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('setNativeProps', () => {
      it('should propagate changes to the host component', () => {
        const root = Fantom.createRoot();
        const nodeRef = React.createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(<View ref={nodeRef} testID="first test id" />);
        });

        expect(
          root
            .getRenderedOutput({
              props: ['testID'],
            })
            .toJSX(),
        ).toEqual(<rn-view testID={'first test id'} />);

        const element = nullthrows(nodeRef.current);

        Fantom.runTask(() => {
          element.setNativeProps({testID: 'second test id'});
        });

        expect(
          root
            .getRenderedOutput({
              props: ['testID'],
            })
            .toJSX(),
        ).toEqual(<rn-view testID={'second test id'} />);
      });

      // TODO: delete when NativeDOM.setNativeProps is NOT nullable.
      // This logic is to ensure compatibility with old app versions without the native module method.
      if (isModern) {
        let RawNativeDOM;
        let originalSetNativeProps;

        beforeAll(() => {
          RawNativeDOM = nullthrows(getRawNativeDOMForTests());
          originalSetNativeProps = RawNativeDOM.setNativeProps;
        });

        beforeEach(() => {
          // $FlowExpectedError[cannot-write]
          RawNativeDOM.setNativeProps = originalSetNativeProps;
        });

        it('should propagate changes to the host component (when NativeDOM.setNativeProps is not available)', () => {
          // $FlowExpectedError[cannot-write]
          RawNativeDOM.setNativeProps = null;

          expect(RawNativeDOM.setNativeProps).toBeNull();

          const root = Fantom.createRoot();
          const nodeRef = React.createRef<HostInstance>();

          Fantom.runTask(() => {
            root.render(<View ref={nodeRef} testID="first test id" />);
          });

          expect(
            root
              .getRenderedOutput({
                props: ['testID'],
              })
              .toJSX(),
          ).toEqual(<rn-view testID={'first test id'} />);

          const element = nullthrows(nodeRef.current);

          Fantom.runTask(() => {
            element.setNativeProps({testID: 'second test id'});
          });

          expect(
            root
              .getRenderedOutput({
                props: ['testID'],
              })
              .toJSX(),
          ).toEqual(<rn-view testID={'second test id'} />);
        });
      }
    });
  });
}
