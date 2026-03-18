/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {enter} = require('../../../Utilities/ReactNativeTestTools');
const TextInput = require('../TextInput').default;
const {create} = require('@react-native/jest-preset/jest/renderer');
const React = require('react');
const {createRef, useState} = require('react');
const ReactTestRenderer = require('react-test-renderer');

jest.unmock('../TextInput');

/**
 * Tests that verify JS-level TextInput behavior during IME composition
 * scenarios. The actual IME guards (markedTextRange checks, deferred
 * defaultTextAttributes, etc.) are in the native layer and tested by
 * RCTTextInputComponentViewIMETests.mm. These tests verify that the JS
 * component correctly handles the event patterns produced by native
 * during CJK composition.
 */
describe('TextInput IME composition behavior', () => {
  describe('controlled component with CJK composition', () => {
    it('handles intermediate composition text via onChange', () => {
      // Simulates Korean IME: ㅎ → 하 → 한 → 한글
      // Each step fires onChange from native. The controlled component should
      // update its value at each step without losing state.
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer: $FlowFixMe;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      const input = renderer.root.findByType(TextInput);

      // Simulate Korean composition steps
      const compositionSteps = ['ㅎ', '하', '한', '한글'];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(4);
      expect(onChangeText.mock.calls.map(c => c[0])).toEqual(
        compositionSteps,
      );
      expect(currentText).toBe('한글');
    });

    it('handles Japanese composition with conversion', () => {
      // Simulates Japanese IME: か → かん → 漢 → 漢字
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer: $FlowFixMe;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      const input = renderer.root.findByType(TextInput);

      const compositionSteps = ['か', 'かん', '漢', '漢字'];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(4);
      expect(currentText).toBe('漢字');
    });

    it('preserves existing text when composition appends', () => {
      // User types "hello" then starts CJK composition: "hello" → "helloㅎ" → "hello하" → "hello한"
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('hello');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer: $FlowFixMe;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      const input = renderer.root.findByType(TextInput);

      ReactTestRenderer.act(() => {
        enter(input, 'helloㅎ');
      });
      ReactTestRenderer.act(() => {
        enter(input, 'hello하');
      });
      ReactTestRenderer.act(() => {
        enter(input, 'hello한');
      });

      expect(onChangeText).toHaveBeenCalledTimes(3);
      expect(currentText).toBe('hello한');
    });
  });

  describe('controlled component with maxLength and CJK', () => {
    it('allows composition text through onChange even at maxLength boundary', () => {
      // With maxLength=5 and existing text "1234", native allows composition
      // past the limit during IME (enforced after commit). The JS side should
      // receive the full text from native's onChange event.
      const onChangeText = jest.fn();

      function ControlledInput() {
        const [text, setText] = useState('1234');
        return (
          <TextInput
            value={text}
            maxLength={5}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer: $FlowFixMe;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      const input = renderer.root.findByType(TextInput);

      // During composition, native sends text that may temporarily exceed maxLength.
      // JS receives it as-is from native onChange.
      ReactTestRenderer.act(() => {
        enter(input, '1234ㅎ');
      });
      expect(onChangeText).toHaveBeenLastCalledWith('1234ㅎ');

      // After composition commits, native truncates and sends final text.
      ReactTestRenderer.act(() => {
        enter(input, '1234한');
      });
      expect(onChangeText).toHaveBeenLastCalledWith('1234한');

      // Native may send truncated text after enforcing maxLength post-commit.
      ReactTestRenderer.act(() => {
        enter(input, '12345');
      });
      expect(onChangeText).toHaveBeenLastCalledWith('12345');
    });
  });

  describe('uncontrolled component with CJK composition', () => {
    it('fires onChange and onChangeText during composition', () => {
      const onChange = jest.fn();
      const onChangeText = jest.fn();

      let renderer: $FlowFixMe;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TextInput onChange={onChange} onChangeText={onChangeText} />,
        );
      });

      const input = renderer.root.findByType(TextInput);

      ReactTestRenderer.act(() => {
        enter(input, 'ㅎ');
      });
      ReactTestRenderer.act(() => {
        enter(input, '한');
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChangeText).toHaveBeenCalledTimes(2);
      expect(onChangeText.mock.calls).toEqual([['ㅎ'], ['한']]);
    });
  });

  describe('multiline with CJK composition', () => {
    it('handles composition in multiline mode', () => {
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledMultiline() {
        const [text, setText] = useState('line1\n');
        currentText = text;
        return (
          <TextInput
            multiline
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer: $FlowFixMe;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledMultiline />);
      });

      const input = renderer.root.findByType(TextInput);

      // Composition on second line
      ReactTestRenderer.act(() => {
        enter(input, 'line1\nㅎ');
      });
      ReactTestRenderer.act(() => {
        enter(input, 'line1\n한');
      });
      ReactTestRenderer.act(() => {
        enter(input, 'line1\n한글');
      });

      expect(onChangeText).toHaveBeenCalledTimes(3);
      expect(currentText).toBe('line1\n한글');
    });
  });

  describe('value prop change during simulated composition', () => {
    it('controlled component can set value after composition text arrives', () => {
      // Simulates: native fires onChange with composition text, then JS
      // transforms the text (e.g., uppercase) and sets it back.
      const ref = createRef<React.ElementRef<typeof TextInput>>();

      function TransformingInput() {
        const [text, setText] = useState('');
        return (
          <TextInput
            ref={ref}
            value={text}
            onChangeText={t => {
              // Transform: just accept the text as-is
              setText(t);
            }}
          />
        );
      }

      let renderer: $FlowFixMe;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransformingInput />);
      });

      const input = renderer.root.findByType(TextInput);

      // Composition intermediate
      ReactTestRenderer.act(() => {
        enter(input, '한');
      });

      expect(input.props.value).toBe('한');

      // Final committed text
      ReactTestRenderer.act(() => {
        enter(input, '한글');
      });

      expect(input.props.value).toBe('한글');
    });
  });
});
