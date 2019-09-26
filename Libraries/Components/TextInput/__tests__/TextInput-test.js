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

import Component from '@reactions/component';

const {enter} = require('../../../Utilities/ReactNativeTestTools');

jest.unmock('../TextInput');

describe('TextInput tests', () => {
  let input;
  let onChangeListener;
  let onChangeTextListener;
  const initialValue = 'initialValue';
  beforeEach(() => {
    onChangeListener = jest.fn();
    onChangeTextListener = jest.fn();
    const renderTree = ReactTestRenderer.create(
      <Component initialState={{text: initialValue}}>
        {({setState, state}) => (
          <TextInput
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
    expect(input.instance.isFocused).toBeInstanceOf(Function); // Would have prevented S168585
    expect(input.instance.clear).toBeInstanceOf(Function);
    expect(input.instance.focus).toBeInstanceOf(jest.fn().constructor);
    expect(input.instance.blur).toBeInstanceOf(jest.fn().constructor);
    expect(input.instance.setNativeProps).toBeInstanceOf(jest.fn().constructor);
    expect(input.instance.measure).toBeInstanceOf(jest.fn().constructor);
    expect(input.instance.measureInWindow).toBeInstanceOf(
      jest.fn().constructor,
    );
    expect(input.instance.measureLayout).toBeInstanceOf(jest.fn().constructor);
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
});
