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

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef, useEffect, useLayoutEffect, useRef} from 'react';
import {TextInput} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('focus view command', () => {
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
      const textInputRef = useRef<null | React.ElementRef<typeof TextInput>>(
        null,
      );

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
      const textInputRef = useRef<null | React.ElementRef<typeof TextInput>>(
        null,
      );

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

describe('focus and blur event', () => {
  it('sends focus and blur events', () => {
    const root = Fantom.createRoot();
    const nodeRef = createRef<HostInstance>();

    let focusEvent = jest.fn();
    let blurEvent = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <TextInput onFocus={focusEvent} onBlur={blurEvent} ref={nodeRef} />,
      );
    });

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    expect(focusEvent).toHaveBeenCalledTimes(0);
    expect(blurEvent).toHaveBeenCalledTimes(0);

    Fantom.runOnUIThread(() => {
      Fantom.enqueueNativeEvent(element, 'focus');
    });

    // The tasks have not run.
    expect(focusEvent).toHaveBeenCalledTimes(0);
    expect(blurEvent).toHaveBeenCalledTimes(0);

    Fantom.runWorkLoop();

    expect(focusEvent).toHaveBeenCalledTimes(1);
    expect(blurEvent).toHaveBeenCalledTimes(0);

    Fantom.runOnUIThread(() => {
      Fantom.enqueueNativeEvent(element, 'blur');
    });

    Fantom.runWorkLoop();

    expect(focusEvent).toHaveBeenCalledTimes(1);
    expect(blurEvent).toHaveBeenCalledTimes(1);
  });
});

describe('onChange', () => {
  it('delivers onChange event', () => {
    const root = Fantom.createRoot();
    const nodeRef = createRef<HostInstance>();
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
  it('delivers onChangeText event', () => {
    const root = Fantom.createRoot();
    const nodeRef = createRef<HostInstance>();
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

describe('props.selection', () => {
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
