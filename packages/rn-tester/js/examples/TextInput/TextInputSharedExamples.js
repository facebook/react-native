/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {
  Button,
  Platform,
  Text,
  TextInput,
  View,
  StyleSheet,
} = require('react-native');

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

const styles = StyleSheet.create({
  default: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
  multiline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    height: 50,
    padding: 4,
    marginBottom: 4,
  },
  singleLine: {
    fontSize: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  label: {
    width: 115,
    alignItems: 'flex-end',
    marginRight: 10,
    paddingTop: 2,
  },
  inputContainer: {
    flex: 1,
  },
  rewriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainder: {
    textAlign: 'right',
    width: 24,
  },
  hashtag: {
    color: 'blue',
    fontWeight: 'bold',
  },
  eventLabel: {
    margin: 3,
    fontSize: 12,
  },
});

class WithLabel extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <View style={styles.labelContainer}>
        <View style={styles.label}>
          <Text>{this.props.label}</Text>
        </View>
        <View style={styles.inputContainer}>{this.props.children}</View>
      </View>
    );
  }
}

class RewriteExample extends React.Component<$FlowFixMeProps, any> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    const limit = 20;
    const remainder = limit - this.state.text.length;
    const remainderColor = remainder > 5 ? 'blue' : 'red';
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          testID="rewrite_sp_underscore_input"
          autoCorrect={false}
          multiline={false}
          maxLength={limit}
          onChangeText={text => {
            text = text.replace(/ /g, '_');
            this.setState({text});
          }}
          style={styles.default}
          value={this.state.text}
        />
        <Text style={[styles.remainder, {color: remainderColor}]}>
          {remainder}
        </Text>
      </View>
    );
  }
}

class RewriteExampleInvalidCharacters extends React.Component<
  $FlowFixMeProps,
  any,
> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          testID="rewrite_no_sp_input"
          autoCorrect={false}
          multiline={false}
          onChangeText={text => {
            this.setState({text: text.replace(/\s/g, '')});
          }}
          style={styles.default}
          value={this.state.text}
        />
      </View>
    );
  }
}

class RewriteInvalidCharactersAndClearExample extends React.Component<
  $FlowFixMeProps,
  any,
> {
  inputRef: ?React.ElementRef<typeof TextInput> = null;

  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          testID="rewrite_clear_input"
          autoCorrect={false}
          ref={ref => {
            this.inputRef = ref;
          }}
          multiline={true}
          onChangeText={text => {
            this.setState({text: text.replace(/ /g, '')});
          }}
          style={styles.default}
          value={this.state.text}
        />
        <Button
          testID="rewrite_clear_button"
          onPress={() => {
            if (this.inputRef != null) {
              this.inputRef.clear();
            }
          }}
          title="Clear"
        />
      </View>
    );
  }
}

class BlurOnSubmitExample extends React.Component<{...}> {
  ref1 = React.createRef();
  ref2 = React.createRef();
  ref3 = React.createRef();
  ref4 = React.createRef();
  ref5 = React.createRef();

  render() {
    return (
      <View>
        <TextInput
          ref={this.ref1}
          style={styles.singleLine}
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref2.current?.focus()}
        />
        <TextInput
          ref={this.ref2}
          style={styles.singleLine}
          keyboardType="email-address"
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref3.current?.focus()}
        />
        <TextInput
          ref={this.ref3}
          style={styles.singleLine}
          keyboardType="url"
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref4.current?.focus()}
        />
        <TextInput
          ref={this.ref4}
          style={styles.singleLine}
          keyboardType="numeric"
          placeholder="blurOnSubmit = false"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref5.current?.focus()}
        />
        <TextInput
          ref={this.ref5}
          style={styles.singleLine}
          keyboardType="numbers-and-punctuation"
          placeholder="blurOnSubmit = true"
          returnKeyType="done"
        />
      </View>
    );
  }
}

class TextEventsExample extends React.Component<{...}, $FlowFixMeState> {
  state = {
    curText: '<No Event>',
    prevText: '<No Event>',
    prev2Text: '<No Event>',
    prev3Text: '<No Event>',
  };

  updateText = (text: string) => {
    this.setState(state => {
      return {
        curText: text,
        prevText: state.curText,
        prev2Text: state.prevText,
        prev3Text: state.prev2Text,
      };
    });
  };

  render() {
    return (
      <View>
        <TextInput
          autoCapitalize="none"
          placeholder="Enter text to see events"
          autoCorrect={false}
          multiline
          onFocus={() => this.updateText('onFocus')}
          onBlur={() => this.updateText('onBlur')}
          onChange={event =>
            this.updateText('onChange text: ' + event.nativeEvent.text)
          }
          onContentSizeChange={event =>
            this.updateText(
              'onContentSizeChange size: ' +
                JSON.stringify(event.nativeEvent.contentSize),
            )
          }
          onEndEditing={event =>
            this.updateText('onEndEditing text: ' + event.nativeEvent.text)
          }
          onSubmitEditing={event =>
            this.updateText('onSubmitEditing text: ' + event.nativeEvent.text)
          }
          onKeyPress={event =>
            this.updateText('onKeyPress key: ' + event.nativeEvent.key)
          }
          style={styles.singleLine}
        />
        <Text style={styles.eventLabel}>
          {this.state.curText}
          {'\n'}
          (prev: {this.state.prevText}){'\n'}
          (prev2: {this.state.prev2Text}){'\n'}
          (prev3: {this.state.prev3Text})
        </Text>
      </View>
    );
  }
}

class TokenizedTextExample extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: 'Hello #World'};
  }
  render() {
    //define delimiter
    let delimiter = /\s+/;

    //split string
    let _text = this.state.text;
    let token,
      index,
      parts = [];
    while (_text) {
      delimiter.lastIndex = 0;
      token = delimiter.exec(_text);
      if (token === null) {
        break;
      }
      index = token.index;
      if (token[0].length === 0) {
        index = 1;
      }
      parts.push(_text.substr(0, index));
      parts.push(token[0]);
      index = index + token[0].length;
      _text = _text.slice(index);
    }
    parts.push(_text);

    //highlight hashtags
    parts = parts.map(text => {
      if (/^#/.test(text)) {
        return (
          <Text testID="hashtag" key={text} style={styles.hashtag}>
            {text}
          </Text>
        );
      } else {
        return text;
      }
    });

    return (
      <View style={{flexDirection: 'row'}}>
        <TextInput
          testID="text-input"
          multiline={true}
          style={styles.multiline}
          onChangeText={text => {
            this.setState({text});
          }}>
          <Text>{parts}</Text>
        </TextInput>
      </View>
    );
  }
}

type SelectionExampleState = {
  selection: $ReadOnly<{|
    start: number,
    end: number,
  |}>,
  value: string,
  ...
};

class SelectionExample extends React.Component<
  $FlowFixMeProps,
  SelectionExampleState,
> {
  _textInput: React.ElementRef<typeof TextInput> | null = null;

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  constructor(props) {
    super(props);
    this.state = {
      selection: {start: 0, end: 0},
      value: props.value,
    };
  }

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  onSelectionChange({nativeEvent: {selection}}) {
    this.setState({selection});
  }

  getRandomPosition() {
    const length = this.state.value.length;
    return Math.round(Math.random() * length);
  }

  select(start: number, end: number) {
    this._textInput?.focus();
    this.setState({selection: {start, end}});
    if (this.props.imperative) {
      this._textInput?.setSelection(start, end);
    }
  }

  selectRandom() {
    const positions = [
      this.getRandomPosition(),
      this.getRandomPosition(),
    ].sort();
    this.select(...positions);
  }

  placeAt(position: number) {
    this.select(position, position);
  }

  placeAtRandom() {
    this.placeAt(this.getRandomPosition());
  }

  render() {
    const length = this.state.value.length;

    return (
      <View>
        <View style={{flexDirection: 'row'}}>
          <TextInput
            testID={`${this.props.testID}-text-input`}
            multiline={this.props.multiline}
            onChangeText={value => this.setState({value})}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onSelectionChange={this.onSelectionChange.bind(this)}
            ref={textInput => (this._textInput = textInput)}
            selection={this.props.imperative ? undefined : this.state.selection}
            style={this.props.style}
            value={this.state.value}
          />
        </View>
        <View>
          <Text testID={`${this.props.testID}-selection`}>
            selection ={' '}
            {`{start:${this.state.selection.start},end:${this.state.selection.end}}`}
          </Text>
          <Text
            testID={`${this.props.testID}-cursor-start`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.placeAt.bind(this, 0)}>
            Place at Start (0, 0)
          </Text>
          <Text
            testID={`${this.props.testID}-cursor-end`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.placeAt.bind(this, length)}>
            Place at End ({length}, {length})
          </Text>
          {/* $FlowFixMe[method-unbinding] added when improving typing for this
           * parameters */}
          <Text onPress={this.placeAtRandom.bind(this)}>Place at Random</Text>
          <Text
            testID={`${this.props.testID}-select-all`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.select.bind(this, 0, length)}>
            Select All
          </Text>
          {/* $FlowFixMe[method-unbinding] added when improving typing for this
           * parameters */}
          <Text onPress={this.selectRandom.bind(this)}>Select Random</Text>
        </View>
      </View>
    );
  }
}

module.exports = ([
  {
    title: 'Auto-focus',
    render: function (): React.Node {
      return (
        <TextInput
          autoFocus={true}
          style={styles.default}
          accessibilityLabel="I am the accessibility label for text input"
        />
      );
    },
  },
  {
    name: 'maxLength',
    title: "Live Re-Write (<sp>  ->  '_') + maxLength",
    render: function (): React.Node {
      return <RewriteExample />;
    },
  },
  {
    title: 'Live Re-Write (no spaces allowed)',
    render: function (): React.Node {
      return <RewriteExampleInvalidCharacters />;
    },
  },
  {
    name: 'clearButton',
    title: 'Live Re-Write (no spaces allowed) and clear',
    render: function (): React.Node {
      return <RewriteInvalidCharactersAndClearExample />;
    },
  },
  {
    title: 'Auto-capitalize',
    name: 'autoCapitalize',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="none">
            <TextInput
              testID="capitalize-none"
              autoCapitalize="none"
              style={styles.default}
            />
          </WithLabel>
          <WithLabel label="sentences">
            <TextInput
              testID="capitalize-sentences"
              autoCapitalize="sentences"
              style={styles.default}
            />
          </WithLabel>
          <WithLabel label="words">
            <TextInput
              testID="capitalize-words"
              autoCapitalize="words"
              style={styles.default}
            />
          </WithLabel>
          <WithLabel label="characters">
            <TextInput
              testID="capitalize-characters"
              autoCapitalize="characters"
              style={styles.default}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Auto-correct',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="true">
            <TextInput autoCorrect={true} style={styles.default} />
          </WithLabel>
          <WithLabel label="false">
            <TextInput autoCorrect={false} style={styles.default} />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Keyboard types',
    name: 'keyboardTypes',
    render: function (): React.Node {
      const keyboardTypes = [
        'default',
        'ascii-capable',
        'numbers-and-punctuation',
        'url',
        'number-pad',
        'phone-pad',
        'name-phone-pad',
        'email-address',
        'decimal-pad',
        'twitter',
        'web-search',
        'ascii-capable-number-pad',
        'numeric',
      ];
      const examples = keyboardTypes.map(type => {
        return (
          <WithLabel key={type} label={type}>
            <TextInput keyboardType={type} style={styles.default} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Blur on submit',
    render: function (): React.Element<any> {
      return <BlurOnSubmitExample />;
    },
  },
  {
    title: 'Event handling',
    render: function (): React.Element<any> {
      return <TextEventsExample />;
    },
  },
  {
    title: 'fontFamily, fontWeight and fontStyle',
    render: function (): React.Node {
      const fontFamilyA = Platform.OS === 'ios' ? 'Cochin' : 'sans-serif';
      const fontFamilyB = Platform.OS === 'ios' ? 'Courier' : 'serif';

      return (
        <View>
          <TextInput
            style={[styles.singleLine, {fontFamily: fontFamilyA}]}
            placeholder={`Custom fonts like ${fontFamilyA} are supported`}
          />
          <TextInput
            style={[
              styles.singleLine,
              {fontFamily: fontFamilyA, fontWeight: 'bold'},
            ]}
            placeholder={`${fontFamilyA} bold`}
          />
          <TextInput
            style={[
              styles.singleLine,
              {fontFamily: fontFamilyA, fontWeight: '500'},
            ]}
            placeholder={`${fontFamilyA} 500`}
          />
          <TextInput
            style={[
              styles.singleLine,
              {fontFamily: fontFamilyA, fontStyle: 'italic'},
            ]}
            placeholder={`${fontFamilyA} italic`}
          />
          <TextInput
            style={[styles.singleLine, {fontFamily: fontFamilyB}]}
            placeholder={fontFamilyB}
          />
        </View>
      );
    },
  },
  {
    title: 'Attributed text',
    name: 'attributedText',
    render: function (): React.Node {
      return <TokenizedTextExample />;
    },
  },
  {
    title: 'Text selection & cursor placement',
    name: 'cursorPlacement',
    render: function (): React.Node {
      return (
        <View>
          <SelectionExample
            testID="singleline"
            style={styles.default}
            value="text selection can be changed"
          />
          <SelectionExample
            testID="multiline"
            multiline
            style={styles.multiline}
            value={'multiline text selection\ncan also be changed'}
          />
        </View>
      );
    },
  },
  {
    title: 'Text selection & cursor placement (imperative)',
    name: 'cursorPlacementImperative',
    render: function (): React.Node {
      return (
        <View>
          <SelectionExample
            testID="singlelineImperative"
            style={styles.default}
            value="text selection can be changed imperatively"
            imperative={true}
          />
          <SelectionExample
            testID="multilineImperative"
            multiline
            style={styles.multiline}
            value={'multiline text selection\ncan also be changed imperatively'}
            imperative={true}
          />
        </View>
      );
    },
  },
]: Array<RNTesterModuleExample>);
