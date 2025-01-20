/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableFixForViewCommandRace:true
 * @fantom_flags enableAccessToHostTreeInFabric:true
 */

import '../../../Core/InitializeCore.js';
import ensureInstance from '../../../../../react-native/src/private/utilities/ensureInstance';
import ReactNativeElement from '../../../../../react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import TextInput from '../TextInput';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {useEffect, useLayoutEffect, useRef} from 'react';

describe('focus view command', () => {
  it('creates view before dispatching view command from ref function', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <TextInput
          ref={node => {
            if (node) {
              node.focus();
            }
          }}
        />,
      );
    });

    const mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(2);
    expect(mountingLogs[0]).toBe('create view type: `AndroidTextInput`');
    expect(mountingLogs[1]).toBe(
      'dispatch command `focus` on component `AndroidTextInput`',
    );
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

      return <TextInput ref={textInputRef} />;
    }
    Fantom.runTask(() => {
      root.render(<Component />);
    });

    const mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(2);
    expect(mountingLogs[0]).toBe('create view type: `AndroidTextInput`');
    expect(mountingLogs[1]).toBe(
      'dispatch command `focus` on component `AndroidTextInput`',
    );
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

      return <TextInput ref={textInputRef} />;
    }
    Fantom.runTask(() => {
      root.render(<Component />);
    });

    const mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(2);
    expect(mountingLogs[0]).toBe('create view type: `AndroidTextInput`');
    expect(mountingLogs[1]).toBe(
      'dispatch command `focus` on component `AndroidTextInput`',
    );
  });
});

describe('focus and blur event', () => {
  it('sends focus and blur events', () => {
    const root = Fantom.createRoot();
    let maybeNode;

    let focusEvent = jest.fn();
    let blurEvent = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <TextInput
          onFocus={focusEvent}
          onBlur={blurEvent}
          ref={node => {
            maybeNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(maybeNode, ReactNativeElement);

    expect(focusEvent).toHaveBeenCalledTimes(0);
    expect(blurEvent).toHaveBeenCalledTimes(0);

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(element, 'focus');
    });

    // The tasks have not run.
    expect(focusEvent).toHaveBeenCalledTimes(0);
    expect(blurEvent).toHaveBeenCalledTimes(0);

    Fantom.runWorkLoop();

    expect(focusEvent).toHaveBeenCalledTimes(1);
    expect(blurEvent).toHaveBeenCalledTimes(0);

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(element, 'blur');
    });

    Fantom.runWorkLoop();

    expect(focusEvent).toHaveBeenCalledTimes(1);
    expect(blurEvent).toHaveBeenCalledTimes(1);
  });
});

describe('onChange', () => {
  it('delivers onChange event', () => {
    const root = Fantom.createRoot();
    let maybeNode;
    const onChange = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <TextInput
          onChange={event => {
            onChange(event.nativeEvent);
          }}
          ref={node => {
            maybeNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(maybeNode, ReactNativeElement);

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(element, 'change', {
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
    let maybeNode;
    const onChangeText = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <TextInput
          onChangeText={onChangeText}
          ref={node => {
            maybeNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(maybeNode, ReactNativeElement);

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(element, 'change', {
        text: 'Hello World',
      });
    });

    Fantom.runWorkLoop();

    expect(onChangeText).toHaveBeenCalledTimes(1);
    const [entry] = onChangeText.mock.lastCall;
    expect(entry).toEqual('Hello World');
  });
});
