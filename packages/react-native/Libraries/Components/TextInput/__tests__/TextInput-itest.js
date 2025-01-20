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
import {NativeEventCategory} from '../../../../src/private/specs/modules/NativeFantom';
import Text from '../../../Text/Text';
import View from '../../View/View';
import TextInput from '../TextInput';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

function ensureReactNativeElement(value: mixed): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

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

    root.destroy();
  });

  it('does not batch onChange events', () => {
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
        text: 'Hello World 1',
      });
      Fantom.dispatchNativeEvent(element, 'change', {
        text: 'Hello World 2',
      });
    });

    Fantom.runWorkLoop();

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[0][0].text).toBe('Hello World 1');
    expect(onChange.mock.calls[1][0].text).toBe('Hello World 2');

    root.destroy();
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

    root.destroy();
  });

  it('interrupts React rendering and higher priority update is committed first', () => {
    const root = Fantom.createRoot();
    let maybeTextInputNode;
    let importantTextNode;
    let deferredTextNode;
    let interruptRendering = false;
    let effectMock = jest.fn();
    let afterUpdate;

    function App(props: {text: string}) {
      const [text, setText] = useState('initial text');

      let deferredText = useDeferredValue(props.text);

      if (interruptRendering) {
        interruptRendering = false;
        const element = ensureReactNativeElement(maybeTextInputNode);
        Fantom.runOnUIThread(() => {
          Fantom.dispatchNativeEvent(
            element,
            'change',
            {
              text: 'update from native',
            },
            {
              category: NativeEventCategory.Discrete,
            },
          );
        });
        // We must schedule a task that is run right after the above native event is
        // processed to be able to observe the results of rendering.
        Fantom.scheduleTask(afterUpdate);
      }

      useEffect(() => {
        effectMock({text, deferredText});
      }, [text, deferredText]);

      return (
        <>
          <TextInput
            onChangeText={setText}
            ref={node => {
              maybeTextInputNode = node;
            }}
          />
          <Text
            ref={node => {
              importantTextNode = node;
            }}>
            Important text: {text}
          </Text>
          <Text
            ref={node => {
              deferredTextNode = node;
            }}>
            Deferred text: {deferredText}
          </Text>
        </>
      );
    }

    Fantom.runTask(() => {
      root.render(<App text={'first render'} />);
    });

    const importantTextNativeElement =
      ensureReactNativeElement(importantTextNode);
    const deferredTextNativeElement =
      ensureReactNativeElement(deferredTextNode);

    expect(importantTextNativeElement.textContent).toBe(
      'Important text: initial text',
    );
    expect(deferredTextNativeElement.textContent).toBe(
      'Deferred text: first render',
    );

    interruptRendering = true;

    let isImportantTextUpdatedBeforeDeferred = false;

    afterUpdate = () => {
      isImportantTextUpdatedBeforeDeferred =
        importantTextNativeElement.textContent ===
          'Important text: update from native' &&
        deferredTextNativeElement.textContent === 'Deferred text: first render';
    };

    Fantom.runTask(() => {
      startTransition(() => {
        root.render(<App text={'transition'} />);
      });
    });

    expect(isImportantTextUpdatedBeforeDeferred).toBe(true);

    expect(effectMock).toHaveBeenCalledTimes(3);
    expect(effectMock.mock.calls[0][0]).toEqual({
      text: 'initial text',
      deferredText: 'first render',
    });
    expect(effectMock.mock.calls[1][0]).toEqual({
      text: 'update from native',
      deferredText: 'first render',
    });
    expect(effectMock.mock.calls[2][0]).toEqual({
      text: 'update from native',
      deferredText: 'transition',
    });
    expect(importantTextNativeElement.textContent).toBe(
      'Important text: update from native',
    );
    expect(deferredTextNativeElement.textContent).toBe(
      'Deferred text: transition',
    );

    root.destroy();
  });
});

describe('onSelectionChange', () => {
  it('interrupts React rendering but update from continous event is delayed', () => {
    const root = Fantom.createRoot();
    let maybeTextInputNode;
    let importantTextNode;
    let deferredTextNode;
    let interruptRendering = false;
    let effectMock = jest.fn();

    function App(props: {text: string}) {
      const [text, setText] = useState('initial text');

      let deferredText = useDeferredValue(props.text);

      if (interruptRendering) {
        interruptRendering = false;
        const element = ensureReactNativeElement(maybeTextInputNode);
        Fantom.runOnUIThread(() => {
          Fantom.dispatchNativeEvent(
            element,
            'selectionChange',
            {
              selection: {
                start: 1,
                end: 5,
              },
            },
            {
              category: NativeEventCategory.Continuous,
            },
          );
        });
      }
      useEffect(() => {
        effectMock({text, deferredText});
      }, [text, deferredText]);

      return (
        <>
          <TextInput
            onSelectionChange={event => {
              setText(
                `start: ${event.nativeEvent.selection.start}, end: ${event.nativeEvent.selection.end}`,
              );
            }}
            ref={node => {
              maybeTextInputNode = node;
            }}
          />
          <Text
            ref={node => {
              importantTextNode = node;
            }}>
            Important text: {text}
          </Text>
          <Text
            ref={node => {
              deferredTextNode = node;
            }}>
            Deferred text: {deferredText}
          </Text>
        </>
      );
    }

    Fantom.runTask(() => {
      root.render(<App text={'first render'} />);
    });

    const importantTextNativeElement =
      ensureReactNativeElement(importantTextNode);
    const deferredTextNativeElement =
      ensureReactNativeElement(deferredTextNode);

    expect(importantTextNativeElement.textContent).toBe(
      'Important text: initial text',
    );
    expect(deferredTextNativeElement.textContent).toBe(
      'Deferred text: first render',
    );

    interruptRendering = true;

    Fantom.runTask(() => {
      startTransition(() => {
        root.render(<App text={'transition'} />);
      });
    });

    expect(effectMock).toHaveBeenCalledTimes(3);
    expect(effectMock.mock.calls[0][0]).toEqual({
      text: 'initial text',
      deferredText: 'first render',
    });
    expect(effectMock.mock.calls[1][0]).toEqual({
      text: 'initial text',
      deferredText: 'transition',
    });
    expect(effectMock.mock.calls[2][0]).toEqual({
      text: 'start: 1, end: 5',
      deferredText: 'transition',
    });
    expect(importantTextNativeElement.textContent).toBe(
      'Important text: start: 1, end: 5',
    );
    expect(deferredTextNativeElement.textContent).toBe(
      'Deferred text: transition',
    );

    root.destroy();
  });
});
