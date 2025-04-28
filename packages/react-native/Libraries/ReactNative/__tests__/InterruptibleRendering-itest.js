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

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {startTransition, useDeferredValue, useEffect, useState} from 'react';
import {Text, TextInput} from 'react-native';
import {NativeEventCategory} from 'react-native/src/private/testing/fantom/specs/NativeFantom';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

function ensureReactNativeElement(value: mixed): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

describe('discrete event category', () => {
  it('interrupts React rendering and higher priority update is committed first', () => {
    const root = Fantom.createRoot();
    const textInputRef = React.createRef<HostInstance>();
    const importantTextNodeRef = React.createRef<HostInstance>();
    const deferredTextNodeRef = React.createRef<HostInstance>();
    let interruptRendering = false;
    let effectMock = jest.fn();
    let afterUpdate;

    function App(props: {text: string}) {
      const [text, setText] = useState('initial text');

      let deferredText = useDeferredValue(props.text);

      if (interruptRendering) {
        interruptRendering = false;
        const element = ensureReactNativeElement(textInputRef.current);
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
        // We must schedule a task that is run right after the above native event is
        // processed to be able to observe the results of rendering.
        Fantom.scheduleTask(afterUpdate);
      }

      useEffect(() => {
        effectMock({text, deferredText});
      }, [text, deferredText]);

      return (
        <>
          <TextInput onChangeText={setText} ref={textInputRef} />
          <Text ref={importantTextNodeRef}>Important text: {text}</Text>
          <Text ref={deferredTextNodeRef}>Deferred text: {deferredText}</Text>
        </>
      );
    }

    Fantom.runTask(() => {
      root.render(<App text={'first render'} />);
    });

    const importantTextNativeElement = ensureReactNativeElement(
      importantTextNodeRef.current,
    );
    const deferredTextNativeElement = ensureReactNativeElement(
      deferredTextNodeRef.current,
    );

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
  });
});

describe('continuous event category', () => {
  it('interrupts React rendering but update from continous event is delayed', () => {
    const root = Fantom.createRoot();
    const textInputRef = React.createRef<HostInstance>();
    const importantTextNodeRef = React.createRef<HostInstance>();
    const deferredTextNodeRef = React.createRef<HostInstance>();
    let interruptRendering = false;
    let effectMock = jest.fn();

    function App(props: {text: string}) {
      const [text, setText] = useState('initial text');

      let deferredText = useDeferredValue(props.text);

      if (interruptRendering) {
        interruptRendering = false;
        const element = ensureReactNativeElement(textInputRef.current);
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
            ref={textInputRef}
          />
          <Text ref={importantTextNodeRef}>Important text: {text}</Text>
          <Text ref={deferredTextNodeRef}>Deferred text: {deferredText}</Text>
        </>
      );
    }

    Fantom.runTask(() => {
      root.render(<App text={'first render'} />);
    });

    const importantTextNativeElement = ensureReactNativeElement(
      importantTextNodeRef.current,
    );
    const deferredTextNativeElement = ensureReactNativeElement(
      deferredTextNodeRef.current,
    );

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
  });
});
