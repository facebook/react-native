/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {TextInputInstance} from '../TextInput.flow';

import ensureInstance from '../../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef, useEffect, useLayoutEffect, useRef} from 'react';
import {TextInput} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('<TextInput>', () => {
  describe('props', () => {
    describe('selection', () => {
      it('the selection is passed to component view by command', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TextInput nativeID="text-input" selection={{start: 0, end: 4}}>
              hello World!
            </TextInput>,
          );
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Update {type: "RootView", nativeID: (root)}',
          'Create {type: "AndroidTextInput", nativeID: "text-input"}',
          'Insert {type: "AndroidTextInput", parentNativeID: (root), index: 0, nativeID: "text-input"}',
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "setTextAndSelection, args: [0,null,0,4]"}',
        ]);
      });
    });

    describe('onChange', () => {
      it('is called when the change native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<TextInputInstance>();
        const onChange = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              onChange={event => {
                onChange(event.nativeEvent);
              }}
              ref={nodeRef}
            />,
          );
        });

        const element = ensureInstance(nodeRef.current, ReactNativeElement);

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(element, 'change', {
            text: 'Hello World',
          });
        });

        Fantom.runWorkLoop();

        expect(onChange).toHaveBeenCalledTimes(1);
        const [entry] = onChange.mock.lastCall;
        expect(entry.text).toEqual('Hello World');
      });
    });

    describe('onChangeText', () => {
      it('is called when the change native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<TextInputInstance>();
        const onChangeText = jest.fn();

        Fantom.runTask(() => {
          root.render(<TextInput onChangeText={onChangeText} ref={nodeRef} />);
        });

        const element = ensureInstance(nodeRef.current, ReactNativeElement);

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(element, 'change', {
            text: 'Hello World',
          });
        });

        Fantom.runWorkLoop();

        expect(onChangeText).toHaveBeenCalledTimes(1);
        const [entry] = onChangeText.mock.lastCall;
        expect(entry).toEqual('Hello World');
      });
    });

    describe('onFocus', () => {
      it('is called when the focus native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<TextInputInstance>();

        let focusEvent = jest.fn();

        Fantom.runTask(() => {
          root.render(<TextInput onFocus={focusEvent} ref={nodeRef} />);
        });

        const element = ensureInstance(nodeRef.current, ReactNativeElement);

        expect(focusEvent).toHaveBeenCalledTimes(0);

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(element, 'focus');
        });

        // The tasks have not run.
        expect(focusEvent).toHaveBeenCalledTimes(0);

        Fantom.runWorkLoop();

        expect(focusEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('onBlur', () => {
      it('is called when the blur native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<TextInputInstance>();

        let blurEvent = jest.fn();

        Fantom.runTask(() => {
          root.render(<TextInput onBlur={blurEvent} ref={nodeRef} />);
        });

        const element = ensureInstance(nodeRef.current, ReactNativeElement);

        expect(blurEvent).toHaveBeenCalledTimes(0);

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(element, 'blur');
        });

        // The tasks have not run.
        expect(blurEvent).toHaveBeenCalledTimes(0);

        Fantom.runWorkLoop();

        expect(blurEvent).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('ref', () => {
    it('is an element node', () => {
      const ref = createRef<TextInputInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<TextInput ref={ref} />);
      });

      expect(ref.current).toBeInstanceOf(ReactNativeElement);
    });

    it('provides additional methods: clear, isFocused, getNativeRef, setSelection', () => {
      const ref = createRef<TextInputInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<TextInput ref={ref} />);
      });

      const instance = nullthrows(ref.current);
      expect(instance.clear).toBeInstanceOf(Function);
      expect(instance.isFocused).toBeInstanceOf(Function);
      expect(instance.getNativeRef).toBeInstanceOf(Function);
    });

    describe('focus()', () => {
      it('dispatches the focus command', () => {
        const root = Fantom.createRoot();
        const ref = createRef<TextInputInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        root.takeMountingManagerLogs();

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.focus();
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "focus"}',
        ]);
      });

      it('creates view before dispatching view command from ref function', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              nativeID="text-input"
              ref={node => {
                if (node) {
                  node.focus();
                }
              }}
            />,
          );
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Update {type: "RootView", nativeID: (root)}',
          'Create {type: "AndroidTextInput", nativeID: "text-input"}',
          'Insert {type: "AndroidTextInput", parentNativeID: (root), index: 0, nativeID: "text-input"}',
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "focus"}',
        ]);
      });

      it('creates view before dispatching view command from useLayoutEffect', () => {
        const root = Fantom.createRoot();

        function Component() {
          const textInputRef = useRef<null | React.ElementRef<
            typeof TextInput,
          >>(null);

          useLayoutEffect(() => {
            textInputRef.current?.focus();
          });

          return <TextInput ref={textInputRef} nativeID="text-input" />;
        }
        Fantom.runTask(() => {
          root.render(<Component />);
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Update {type: "RootView", nativeID: (root)}',
          'Create {type: "AndroidTextInput", nativeID: "text-input"}',
          'Insert {type: "AndroidTextInput", parentNativeID: (root), index: 0, nativeID: "text-input"}',
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "focus"}',
        ]);
      });

      it('creates view before dispatching view command from useEffect', () => {
        const root = Fantom.createRoot();

        function Component() {
          const textInputRef = useRef<null | React.ElementRef<
            typeof TextInput,
          >>(null);

          useEffect(() => {
            textInputRef.current?.focus();
          });

          return <TextInput ref={textInputRef} nativeID="text-input" />;
        }

        Fantom.runTask(() => {
          root.render(<Component />);
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Update {type: "RootView", nativeID: (root)}',
          'Create {type: "AndroidTextInput", nativeID: "text-input"}',
          'Insert {type: "AndroidTextInput", parentNativeID: (root), index: 0, nativeID: "text-input"}',
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "focus"}',
        ]);
      });
    });

    describe('blur()', () => {
      it('does NOT dispatch any commands if the input is NOT focused', () => {
        const root = Fantom.createRoot();
        const ref = createRef<TextInputInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        root.takeMountingManagerLogs();

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.blur();
        });

        expect(root.takeMountingManagerLogs()).toEqual([]);
      });

      it('does dispatches the blur command if the input is focused', () => {
        const root = Fantom.createRoot();
        const ref = createRef<TextInputInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.focus();
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          instance.blur();
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "blur"}',
        ]);
      });
    });

    describe('clear()', () => {
      it('dispatches the clear command', () => {
        const root = Fantom.createRoot();
        const ref = createRef<TextInputInstance>();

        Fantom.runTask(() => {
          root.render(
            <TextInput nativeID="text-input" ref={ref} value="Some input" />,
          );
        });

        root.takeMountingManagerLogs();

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.clear();
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "setTextAndSelection, args: [0,"",0,0]"}',
        ]);
      });
    });

    describe('isFocused()', () => {
      it('returns true if the input is focused', () => {
        const root = Fantom.createRoot();
        const ref = createRef<TextInputInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        const instance = nullthrows(ref.current);

        expect(instance.isFocused()).toBe(false);

        Fantom.runTask(() => {
          instance.focus();
        });

        expect(instance.isFocused()).toBe(true);

        Fantom.runTask(() => {
          instance.blur();
        });

        expect(instance.isFocused()).toBe(false);
      });
    });

    describe('setSelection', () => {
      it('dispatches the setTextAndSelection command', () => {
        const root = Fantom.createRoot();
        const ref = createRef<TextInputInstance>();

        Fantom.runTask(() => {
          root.render(
            <TextInput nativeID="text-input" ref={ref} value="Some input" />,
          );
        });

        root.takeMountingManagerLogs();

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.setSelection(2, 5);
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "setTextAndSelection, args: [0,null,2,5]"}',
        ]);
      });
    });
  });
});
