/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 * @flow-strict
 */

'use strict';

const React = require('react');
const ReactTestRenderer = require('react-test-renderer');
const TextInput = require('../TextInput');
const ReactNative = require('../../../Renderer/shims/ReactNative');

import Component from '@reactions/component';

const {
  enter,
  expectRendersMatchingSnapshot,
} = require('../../../Utilities/ReactNativeTestTools');

jest.unmock('../TextInput');

describe('TextInput tests', () => {
  let input;
  let inputRef;
  let onChangeListener;
  let onChangeTextListener;
  const initialValue = 'initialValue';
  beforeEach(() => {
    inputRef = React.createRef(null);
    onChangeListener = jest.fn();
    onChangeTextListener = jest.fn();
    const renderTree = ReactTestRenderer.create(
      <Component initialState={{text: initialValue}}>
        {({setState, state}) => (
          <TextInput
            ref={inputRef}
            value={state.text}
            onChangeText={text => {
              onChangeTextListener(text);
              setState({text});
            }}
            onChange={event => {
              onChangeListener(event);
            }}
          />
        )}
      </Component>,
    );
    input = renderTree.root.findByType(TextInput);
  });
  it('has expected instance functions', () => {
    expect(inputRef.current.isFocused).toBeInstanceOf(Function); // Would have prevented S168585
    expect(inputRef.current.clear).toBeInstanceOf(Function);
    expect(inputRef.current.focus).toBeInstanceOf(jest.fn().constructor);
    expect(inputRef.current.blur).toBeInstanceOf(jest.fn().constructor);
    expect(inputRef.current.setNativeProps).toBeInstanceOf(
      jest.fn().constructor,
    );
    expect(inputRef.current.measure).toBeInstanceOf(jest.fn().constructor);
    expect(inputRef.current.measureInWindow).toBeInstanceOf(
      jest.fn().constructor,
    );
    expect(inputRef.current.measureLayout).toBeInstanceOf(
      jest.fn().constructor,
    );
  });
  it('calls onChange callbacks', () => {
    expect(input.props.value).toBe(initialValue);
    const message = 'This is a test message';
    enter(input, message);
    expect(input.props.value).toBe(message);
    expect(onChangeTextListener).toHaveBeenCalledWith(message);
    expect(onChangeListener).toHaveBeenCalledWith({
      nativeEvent: {text: message},
    });
  });

  it('should have support being focused and unfocused', () => {
    const textInputRef = React.createRef(null);
    ReactTestRenderer.create(<TextInput ref={textInputRef} value="value1" />);

    expect(textInputRef.current.isFocused()).toBe(false);
    ReactNative.findNodeHandle = jest.fn().mockImplementation(ref => {
      if (ref == null) {
        return null;
      }

      if (
        ref === textInputRef.current ||
        ref === textInputRef.current.getNativeRef()
      ) {
        return 1;
      }

      return 2;
    });

    TextInput.State.focusTextInput(textInputRef.current);
    expect(textInputRef.current.isFocused()).toBe(true);
    expect(TextInput.State.currentlyFocusedInput()).toBe(textInputRef.current);
    // This function is currently deprecated and will be removed in the future
    expect(TextInput.State.currentlyFocusedField()).toBe(
      ReactNative.findNodeHandle(textInputRef.current),
    );
    TextInput.State.blurTextInput(textInputRef.current);
    expect(textInputRef.current.isFocused()).toBe(false);
    expect(TextInput.State.currentlyFocusedInput()).toBe(null);
    // This function is currently deprecated and will be removed in the future
    expect(TextInput.State.currentlyFocusedField()).toBe(null);
  });

  it('should unfocus when other TextInput is focused', () => {
    const textInputRe1 = React.createRef(null);
    const textInputRe2 = React.createRef(null);

    ReactTestRenderer.create(
      <>
        <TextInput ref={textInputRe1} value="value1" />
        <TextInput ref={textInputRe2} value="value2" />
      </>,
    );
    ReactNative.findNodeHandle = jest.fn().mockImplementation(ref => {
      if (
        ref === textInputRe1.current ||
        ref === textInputRe1.current.getNativeRef()
      ) {
        return 1;
      }

      if (
        ref === textInputRe2.current ||
        ref === textInputRe2.current.getNativeRef()
      ) {
        return 2;
      }

      return 3;
    });

    expect(textInputRe1.current.isFocused()).toBe(false);
    expect(textInputRe2.current.isFocused()).toBe(false);

    const inputTag1 = ReactNative.findNodeHandle(textInputRe1.current);
    const inputTag2 = ReactNative.findNodeHandle(textInputRe2.current);

    TextInput.State.focusTextInput(textInputRe1.current);

    expect(textInputRe1.current.isFocused()).toBe(true);
    expect(textInputRe2.current.isFocused()).toBe(false);
    expect(TextInput.State.currentlyFocusedInput()).toBe(textInputRe1.current);
    // This function is currently deprecated and will be removed in the future
    expect(TextInput.State.currentlyFocusedField()).toBe(inputTag1);

    TextInput.State.focusTextInput(textInputRe2.current);

    expect(textInputRe1.current.isFocused()).toBe(false);
    expect(textInputRe2.current.isFocused()).toBe(true);
    expect(TextInput.State.currentlyFocusedInput()).toBe(textInputRe2.current);
    // This function is currently deprecated and will be removed in the future
    expect(TextInput.State.currentlyFocusedField()).toBe(inputTag2);
  });

  it('should render as expected', () => {
    expectRendersMatchingSnapshot(
      'TextInput',
      () => <TextInput />,
      () => {
        jest.dontMock('../TextInput');
      },
    );
  });
});
