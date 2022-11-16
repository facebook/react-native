/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-strict
 * @format
 * @oncall react_native
 */

const ReactNative = require('../../../ReactNative/RendererProxy');
const {
  enter,
  expectRendersMatchingSnapshot,
} = require('../../../Utilities/ReactNativeTestTools');
const TextInput = require('../TextInput');
const React = require('react');
const ReactTestRenderer = require('react-test-renderer');

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
    function TextInputWrapper() {
      const [state, setState] = React.useState({text: initialValue});

      return (
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
      );
    }
    const renderTree = ReactTestRenderer.create(<TextInputWrapper />);
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
    ReactTestRenderer.act(() => {
      enter(input, message);
    });
    expect(input.props.value).toBe(message);
    expect(onChangeTextListener).toHaveBeenCalledWith(message);
    expect(onChangeListener).toHaveBeenCalledWith({
      nativeEvent: {text: message},
    });
  });

  function createTextInput(extraProps) {
    const textInputRef = React.createRef(null);
    ReactTestRenderer.create(
      <TextInput ref={textInputRef} value="value1" {...extraProps} />,
    );
    return textInputRef;
  }

  it('focus() should not do anything if the TextInput is not editable', () => {
    const textInputRef = createTextInput({editable: false});
    // currentProps is the property actually containing props at runtime
    textInputRef.current.currentProps = textInputRef.current.props;
    expect(textInputRef.current.isFocused()).toBe(false);

    TextInput.State.focusTextInput(textInputRef.current);
    expect(textInputRef.current.isFocused()).toBe(false);
  });

  it('should have support for being focused and blurred', () => {
    const textInputRef = createTextInput();

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

    TextInput.State.blurTextInput(textInputRef.current);
    expect(textInputRef.current.isFocused()).toBe(false);
    expect(TextInput.State.currentlyFocusedInput()).toBe(null);
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

    TextInput.State.focusTextInput(textInputRe1.current);

    expect(textInputRe1.current.isFocused()).toBe(true);
    expect(textInputRe2.current.isFocused()).toBe(false);
    expect(TextInput.State.currentlyFocusedInput()).toBe(textInputRe1.current);

    TextInput.State.focusTextInput(textInputRe2.current);

    expect(textInputRe1.current.isFocused()).toBe(false);
    expect(textInputRe2.current.isFocused()).toBe(true);
    expect(TextInput.State.currentlyFocusedInput()).toBe(textInputRe2.current);
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

describe('TextInput', () => {
  it('default render', () => {
    const instance = ReactTestRenderer.create(<TextInput />);

    expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessible={true}
        allowFontScaling={true}
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        onBlur={[Function]}
        onChange={[Function]}
        onChangeSync={null}
        onClick={[Function]}
        onFocus={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        selection={null}
        submitBehavior="blurAndSubmit"
        text=""
        underlineColorAndroid="transparent"
      />
    `);
  });

  it('has displayName', () => {
    expect(TextInput.displayName).toEqual('TextInput');
  });
});

describe('TextInput compat with web', () => {
  it('renders core props', () => {
    const props = {
      id: 'id',
      tabIndex: 0,
      testID: 'testID',
    };

    const instance = ReactTestRenderer.create(<TextInput {...props} />);

    expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessible={true}
        allowFontScaling={true}
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        nativeID="id"
        onBlur={[Function]}
        onChange={[Function]}
        onChangeSync={null}
        onClick={[Function]}
        onFocus={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        selection={null}
        submitBehavior="blurAndSubmit"
        testID="testID"
        text=""
        underlineColorAndroid="transparent"
      />
    `);
  });

  it('renders "aria-*" props', () => {
    const props = {
      'aria-activedescendant': 'activedescendant',
      'aria-atomic': true,
      'aria-autocomplete': 'list',
      'aria-busy': true,
      'aria-checked': true,
      'aria-columncount': 5,
      'aria-columnindex': 3,
      'aria-columnspan': 2,
      'aria-controls': 'controls',
      'aria-current': 'current',
      'aria-describedby': 'describedby',
      'aria-details': 'details',
      'aria-disabled': true,
      'aria-errormessage': 'errormessage',
      'aria-expanded': true,
      'aria-flowto': 'flowto',
      'aria-haspopup': true,
      'aria-hidden': true,
      'aria-invalid': true,
      'aria-keyshortcuts': 'Cmd+S',
      'aria-label': 'label',
      'aria-labelledby': 'labelledby',
      'aria-level': 3,
      'aria-live': 'polite',
      'aria-modal': true,
      'aria-multiline': true,
      'aria-multiselectable': true,
      'aria-orientation': 'portrait',
      'aria-owns': 'owns',
      'aria-placeholder': 'placeholder',
      'aria-posinset': 5,
      'aria-pressed': true,
      'aria-readonly': true,
      'aria-required': true,
      role: 'main',
      'aria-roledescription': 'roledescription',
      'aria-rowcount': 5,
      'aria-rowindex': 3,
      'aria-rowspan': 3,
      'aria-selected': true,
      'aria-setsize': 5,
      'aria-sort': 'ascending',
      'aria-valuemax': 5,
      'aria-valuemin': 0,
      'aria-valuenow': 3,
      'aria-valuetext': '3',
    };

    const instance = ReactTestRenderer.create(<TextInput {...props} />);

    expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessibilityState={
          Object {
            "busy": true,
            "checked": true,
            "disabled": true,
            "expanded": true,
            "selected": true,
          }
        }
        accessible={true}
        allowFontScaling={true}
        aria-activedescendant="activedescendant"
        aria-atomic={true}
        aria-autocomplete="list"
        aria-columncount={5}
        aria-columnindex={3}
        aria-columnspan={2}
        aria-controls="controls"
        aria-current="current"
        aria-describedby="describedby"
        aria-details="details"
        aria-errormessage="errormessage"
        aria-flowto="flowto"
        aria-haspopup={true}
        aria-hidden={true}
        aria-invalid={true}
        aria-keyshortcuts="Cmd+S"
        aria-label="label"
        aria-labelledby="labelledby"
        aria-level={3}
        aria-live="polite"
        aria-modal={true}
        aria-multiline={true}
        aria-multiselectable={true}
        aria-orientation="portrait"
        aria-owns="owns"
        aria-placeholder="placeholder"
        aria-posinset={5}
        aria-pressed={true}
        aria-readonly={true}
        aria-required={true}
        aria-roledescription="roledescription"
        aria-rowcount={5}
        aria-rowindex={3}
        aria-rowspan={3}
        aria-setsize={5}
        aria-sort="ascending"
        aria-valuemax={5}
        aria-valuemin={0}
        aria-valuenow={3}
        aria-valuetext="3"
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        onBlur={[Function]}
        onChange={[Function]}
        onChangeSync={null}
        onClick={[Function]}
        onFocus={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        role="main"
        selection={null}
        submitBehavior="blurAndSubmit"
        text=""
        underlineColorAndroid="transparent"
      />
    `);
  });

  it('renders styles', () => {
    const style = {
      display: 'flex',
      flex: 1,
      backgroundColor: 'white',
      marginInlineStart: 10,
      userSelect: 'none',
      verticalAlign: 'middle',
    };

    const instance = ReactTestRenderer.create(<TextInput style={style} />);

    expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessible={true}
        allowFontScaling={true}
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        onBlur={[Function]}
        onChange={[Function]}
        onChangeSync={null}
        onClick={[Function]}
        onFocus={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        selection={null}
        style={
          Object {
            "backgroundColor": "white",
            "display": "flex",
            "flex": 1,
            "marginInlineStart": 10,
            "textAlignVertical": "center",
            "userSelect": "none",
          }
        }
        submitBehavior="blurAndSubmit"
        text=""
        underlineColorAndroid="transparent"
      />
    `);
  });
});
