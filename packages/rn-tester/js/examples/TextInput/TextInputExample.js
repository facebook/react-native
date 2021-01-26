/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  Text,
  TextInput,
  View,
  StyleSheet,
  Alert,
  Switch,
  ScrollView, 
  InputAccessoryView,
} = require('react-native');

import type {RNTesterExampleModuleItem} from '../../types/RNTesterTypes';
import {useState, useEffect} from 'react';

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
    flex: 1,
  },
  label: {
    width: 115,
    alignItems: 'flex-end',
    marginRight: 10,
    paddingTop: 2,
  },
  rewriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainder: {
    textAlign: 'right',
    width: 24,
  },
  row: {
    flex: 1,
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hashtag: {
    color: 'blue',
    fontWeight: 'bold',
  },
  eventLabel: {
    margin: 3,
    fontSize: 12,
  },
  singleLineWithHeightTextInput: {
    height: 30,
  },
});

const WithLabel = ({children, label}) => {
  return (
    <View style={styles.labelContainer}>
      <View style={styles.label}>
        <Text>{label}</Text>
      </View>
      {children}
    </View>
  );
};

class RewriteExample extends React.Component<$FlowFixMeProps, any> {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    return (
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter Filename">
          <TextInput
            testID="rewrite_sp_underscore_input"
            autoCorrect={false}
            multiline={false}
            onChangeText={text => {
              text = text.replace(/ /g, '_');
              this.setState({text});
            }}
            style={styles.default}
            value={this.state.text}
          />
        </WithLabel>
      </View>
    );
  }
}

const MaxLengthExample = () => {
  const [text, setText] = useState('');
  const limit = 20;
  const remainder = limit - text.length;
  const remainderColor = remainder > 5 ? 'blue' : 'red';
  return (
    <View style={styles.rewriteContainer}>
      <WithLabel label="Enter FileName">
        <TextInput
          testID="max_length_input"
          autoCorrect={false}
          multiline={false}
          style={styles.default}
          maxLength={limit}
          onChangeText={text => setText(text)}
          value={text}
        />
        <Text style={[styles.remainder, {color: remainderColor}]}>
          {remainder}
        </Text>
      </WithLabel>
    </View>
  );
};

const RewriteExampleInvalidCharacters = () => {
  const [text, setText] = useState('');
  return (
    <View style={styles.rewriteContainer}>
      <WithLabel label="Enter email:">
        <TextInput
          testID="rewrite_no_sp_input"
          autoCorrect={false}
          multiline={false}
          onChangeText={text => {
            setText(text.replace(/\s/g, ''));
          }}
          style={styles.default}
          value={text}
        />
      </WithLabel>
    </View>
  );
};

const TextInputClearExample = () => {
  const [value, setValue] = useState('');
  return (
    <View style={styles.rewriteContainer}>
      <WithLabel label="Enter username:">
        <TextInput
          testID="clear_text_input"
          autoCorrect={false}
          multiline={true}
          style={styles.default}
          onChangeText={text => setValue(text)}
          value={value}
        />
        <Button
          testID="rewrite_clear_button"
          onPress={() => setValue('')}
          title="Clear"
        />
      </WithLabel>
    </View>
  );
};

class TextEventsExample extends React.Component<{...}, $FlowFixMeState> {
  state = {
    curText: '<No Event>',
    prevText: '<No Event>',
    prev2Text: '<No Event>',
    prev3Text: '<No Event>',
  };

  updateText = text => {
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
  constructor(props) {
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
          <Text key={text} style={styles.hashtag}>
            {text}
          </Text>
        );
      } else {
        return text;
      }
    });

    return (
      <View>
        <TextInput
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
    end?: number,
  |}>,
  value: string,
  ...
};

class SelectionExample extends React.Component<
  $FlowFixMeProps,
  SelectionExampleState,
> {
  _textInput: any;

  constructor(props) {
    super(props);
    this.state = {
      selection: {start: 0, end: 0},
      value: props.value,
    };
  }

  onSelectionChange({nativeEvent: {selection}}) {
    this.setState({selection});
  }

  getRandomPosition() {
    const length = this.state.value.length;
    return Math.round(Math.random() * length);
  }

  select(start, end) {
    this._textInput.focus();
    this.setState({selection: {start, end}});
  }

  selectRandom() {
    const positions = [
      this.getRandomPosition(),
      this.getRandomPosition(),
    ].sort();
    this.select(...positions);
  }

  placeAt(position) {
    this.select(position, position);
  }

  placeAtRandom() {
    this.placeAt(this.getRandomPosition());
  }

  render() {
    const length = this.state.value.length;

    return (
      <View>
        <TextInput
          multiline={this.props.multiline}
          onChangeText={value => this.setState({value})}
          onSelectionChange={this.onSelectionChange.bind(this)}
          ref={textInput => (this._textInput = textInput)}
          selection={this.state.selection}
          style={this.props.style}
          value={this.state.value}
        />
        <View>
          <Text>selection = {JSON.stringify(this.state.selection)}</Text>
          <Text onPress={this.placeAt.bind(this, 0)}>
            Place at Start (0, 0)
          </Text>
          <Text onPress={this.placeAt.bind(this, length)}>
            Place at End ({length}, {length})
          </Text>
          <Text onPress={this.placeAtRandom.bind(this)}>Place at Random</Text>
          <Text onPress={this.select.bind(this, 0, length)}>Select All</Text>
          <Text onPress={this.selectRandom.bind(this)}>Select Random</Text>
        </View>
      </View>
    );
  }
}

const TextInputWithAutoFill = () => {
  const [enable, setEnabled] = useState(false);
  const [excludeDescendants, setExcludeDescendants] = useState(false);
  const [importantForAutofill, setImportantForAutofill] = useState(
    'noExcludeDescendants',
  );
  const toggleEnable = () => setEnabled(!enable);
  const toggleDescendants = () => setExcludeDescendants(!excludeDescendants);
  useEffect(() => {
    const value =
      enable && excludeDescendants
        ? 'yesExcludeDescendants'
        : excludeDescendants
        ? 'noExcludeDescendants'
        : enable
        ? 'yes'
        : 'no';
    setImportantForAutofill(value);
  });
  return (
    <View>
      <View style={styles.row}>
        <Text>Impotant for Autofill</Text>
        <Switch value={enable} onValueChange={toggleEnable} />
      </View>
      <View style={styles.row}>
        <Text>Exclude Descendants</Text>
        <Switch value={excludeDescendants} onValueChange={toggleDescendants} />
      </View>
      <WithLabel label="Username:">
        <TextInput
          style={styles.default}
          importantForAutofill={importantForAutofill}
        />
      </WithLabel>
    </View>
  );
};

const TextInputWithInputAccessoryView = () => {
  const inputAccessoryViewID = 'uniqueID';
  const initialText = 'Placeholder Text';
  const [text, setText] = useState(initialText);

  return (
    <>
      <ScrollView keyboardDismissMode="interactive">
        <TextInput
          style={{
            padding: 16,
            marginTop: 50,
          }}
          inputAccessoryViewID={inputAccessoryViewID}
          onChangeText={text => setText(text)}
          value={text}
        />
      </ScrollView>
      <InputAccessoryView nativeID={inputAccessoryViewID}>
        <Button onPress={() => setText(initialText)} title="Reset Text" />
      </InputAccessoryView>
    </>
  );
};

const EventHanderOnBlur = () => {
  return (
    <View style={styles.rewriteContainer}>
      <WithLabel label="Enter username:">
        <TextInput
          testID="EventHanderOnBlur"
          style={styles.default}
          onBlur={() => {
            Alert.alert('Alert', 'input element no longer in focus');
          }}
        />
      </WithLabel>
    </View>
  );
};

const EventHanderOnChange = () => {
  const [text, setText] = useState('');
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnChange"
            style={styles.default}
            onChange={event => setText(event.nativeEvent.text)}
          />
        </WithLabel>
      </View>
      <Text>
        {text === ''
          ? `Enter username to check if it's available`
          : ` Username "${text}" is available `}
      </Text>
    </View>
  );
};

const EventHanderOnChangeText = () => {
  const [text, setText] = useState('');
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnChangeText"
            style={styles.default}
            onChangeText={changedText => setText(changedText)}
          />
        </WithLabel>
      </View>
      <Text>
        {text === ''
          ? `Enter username to check if it's available`
          : ` Username "${text}" is available `}
      </Text>
    </View>
  );
};

const EventHanderOnEndEditing = () => {
  const [text, setText] = useState('');
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnEndEditing"
            style={styles.default}
            onChangeText={changedText => setText(changedText)}
            onEndEditing={event => {
              Alert.alert(
                'Alert',
                `input element editing ended, returned "${event.nativeEvent.text}" `,
              );
            }}
          />
        </WithLabel>
      </View>
    </View>
  );
};

const EventHanderOnFocus = () => {
  const [text, setText] = useState('');
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnFocus"
            style={styles.default}
            onChangeText={changedText => setText(changedText)}
            onFocus={event => {
              Alert.alert('Alert', `please ensure that username is unique`);
            }}
          />
        </WithLabel>
      </View>
    </View>
  );
};

const EventHanderOnKeyPress = () => {
  const [text, setText] = useState('');
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnKeyPress"
            style={styles.default}
            onChangeText={changedText => setText(changedText)}
          />
        </WithLabel>
      </View>
      <Text>
        {text === ''
          ? `Enter username to check if it's available`
          : ` Username "${text}" is available `}
      </Text>
    </View>
  );
};

const EventHanderOnLayout = () => {
  const [layout, setLayout] = useState({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  });
  const [counter, setCounter] = useState(0);

  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnLayout"
            style={styles.default}
            onLayout={event => {
              setLayout(event.nativeEvent.layout);
              setCounter(counter + 1);
            }}
          />
        </WithLabel>
      </View>
      <Text>{`
    Height: ${layout.height}
    Width: ${layout.width}
    X: ${layout.x}
    Y: ${layout.y}
    Times Layout Changed: ${counter - 1}
      `}</Text>
    </View>
  );
};

const EventHanderOnScroll = () => {
  const [stats, setStats] = useState({
    contentInset: {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    },
    contentOffset: {
      x: 0,
      y: 0,
    },
    contentSize: {
      height: 0,
      width: 0,
    },
    layoutMeasurement: {
      height: 0,
      width: 0,
    },
    responderIgnoreScroll: false,
    velocity: {
      x: 0,
      y: 0,
    },
  });
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnScroll"
            style={styles.default}
            multiline={true}
            onScroll={event => {
              setStats(event.nativeEvent);
            }}
          />
        </WithLabel>
      </View>
      <Text>{`
        contentOffset:
            x: ${stats.contentOffset.x}
            y: ${stats.contentOffset.y}
            
        layoutMeasurement: 
            width: ${stats.layoutMeasurement.width}
            height: ${stats.layoutMeasurement.height}
      `}</Text>
    </View>
  );
};

const EventHanderOnSelectionChange = () => {
  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnSelectionChange"
            style={styles.default}
            onSelectionChange={event => {
              setSelection(event.nativeEvent.selection);
            }}
          />
        </WithLabel>
      </View>
      <Text>{`
    Selection Start: ${selection.start}
    Selection End: ${selection.end}
    Characters Selected: ${selection.end - selection.start}
      `}</Text>
    </View>
  );
};

const EventHanderOnSubmitEditing = () => {
  const [text, setText] = useState('');
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHanderOnSubmitEditing"
            style={styles.default}
            onSubmitEditing={event => {
              setText(event.nativeEvent.text);
            }}
          />
        </WithLabel>
      </View>
      <Text>
        {text === ''
          ? `Enter username to check if it's available`
          : ` Username "${text}" is available `}
      </Text>
    </View>
  );
};

const EventHandlerOnTextInput = () => {
  const [stats, setStats] = useState({
    previousText: '',
    range: {
      end: 0,
      start: 0,
    },
    text: '',
  });
  return (
    <View>
      <View style={styles.rewriteContainer}>
        <WithLabel label="Enter username:">
          <TextInput
            testID="EventHandlerOnTextInput"
            style={styles.default}
            multiline={true}
            onTextInput={event => {
              setStats(event.nativeEvent);
            }}
          />
        </WithLabel>
      </View>
      <Text>{`
    previousText: ${stats.previousText}
    text: ${stats.text}
    range
        start: ${stats.range.start}
        end: ${stats.range.end}
      `}</Text>
    </View>
  );
};

exports.title = 'TextInput';
exports.description =
  'A foundational component for inputting text into the app via a keyboard.';
exports.documentationURL = 'https://reactnative.dev/docs/textinput';
exports.examples = ([
  {
    title: 'TextInput with autoFocus={true}',
    render: function(): React.Node {
      return (
        <WithLabel label="Enter Username">
          <TextInput
            testID="check_text_input"
            autoFocus={true}
            style={styles.default}
          />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with maxLength={limit}',
    render: function(): React.Node {
      return <MaxLengthExample />;
    },
  },
  {
    title: 'TextInput that does not allow spaces',
    render: function(): React.Node {
      return <RewriteExampleInvalidCharacters />;
    },
  },
  {
    title: "TextInput that replaces spaces with underscore '_'",
    render: function(): React.Node {
      return <RewriteExample />;
    },
  },
  {
    title: 'TextInput with blurOnSubmit={true}',
    render: function(): React.Node {
      return (
        <WithLabel label="Email Address:">
          <TextInput
            style={styles.default}
            returnKeyType="next"
            blurOnSubmit={true}
            onSubmitEditing={event =>
              Alert.alert('Alert', 'Submitted Value: ' + event.nativeEvent.text)
            }
          />
        </WithLabel>
      );
    },
  },
  {
    title: "TextInput along with 'Clear' button",
    render: function(): React.Node {
      return <TextInputClearExample />;
    },
  },
  {
    title: 'TextInput with clearButtonMode={true}',
    platform: 'iOS',
    render: function(): React.Node {
      return (
        <WithLabel label="Enter Username:">
          <TextInput style={styles.default} clearButtonMode="always" />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with allowFontScaling={false}',
    description:
      'Specifies whether fonts should scale to respect Text Size accessibility settings. The change will be visible when the Text Size is not default in accessibility settings.',
    render: function(): React.Node {
      return (
        <WithLabel label="Enter Name:">
          <TextInput style={styles.default} allowFontScaling={false} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with different autocaptialise settings',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="Enter Title">
            <TextInput
              autoCapitalize="words"
              style={styles.default}
              placeholder="Capitalise Words"
            />
          </WithLabel>
          <WithLabel label="Enter Description">
            <TextInput
              autoCapitalize="sentences"
              style={styles.default}
              placeholder="Capitalise Sentences"
            />
          </WithLabel>
          <WithLabel label="Enter Author Name">
            <TextInput
              autoCapitalize="characters"
              style={styles.default}
              placeholder="Capitalise Characters"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with autocorrect={true}',
    render: function(): React.Node {
      return (
        <WithLabel label="Search:">
          <TextInput autoCorrect={true} style={styles.default} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with caretHidden={true}',
    render: function(): React.Node {
      return (
        <WithLabel label="Enter OTP:">
          <TextInput caretHidden={true} style={styles.default} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with clearTextOnFocus={true}',
    platform: 'iOS',
    render: function(): React.Node {
      return (
        <WithLabel label="Enter Password:">
          <TextInput clearTextOnFocus={true} style={styles.default} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with contextMenuHidden={true}',
    description: '', //ToDo: Add a description for this field
    render: function(): React.Node {
      return (
        <WithLabel label="Enter Password:">
          <TextInput contextMenuHidden={true} style={styles.default} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with defaultValue=" "',
    render: function(): React.Node {
      return (
        <WithLabel label="Enter Name:">
          <TextInput defaultValue=" " style={styles.default} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with disableFullscreenUI={true}',
    platform: 'android',
    render: function(): React.Node {
      return (
        <WithLabel label="Enter Name:">
          <TextInput disableFullscreenUI={true} style={styles.default} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with editable={false}',
    render: function(): React.Node {
      return (
        <WithLabel label="Registered Email:">
          <TextInput
            defaultValue="tester@reactnative.dev"
            editable={false}
            style={styles.default}
          />
        </WithLabel>
      );
    },
  },
  {
    title: 'Enable return key automatically',
    platform: 'iOS',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="Send new message">
            <TextInput
              enablesReturnKeyAutomatically={true}
              style={styles.default}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with inlineImageLeft',
    render: function(): React.Node {
      return (
        <View>
          <Text>Without inlineImagePadding</Text>
          <WithLabel label="Search:">
            <TextInput style={styles.default} inlineImageLeft="magnify" />
          </WithLabel>
          <Text>With inlineImagePadding</Text>
          <WithLabel label="Search:">
            <TextInput
              style={styles.default}
              inlineImageLeft="magnify"
              inlineImagePadding={5}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with different importantForAutofill values',
    platform: 'android',
    render: function(): React.Node {
      return <TextInputWithAutoFill />;
    },
  },
  {
    title: 'TextInput with inputAccessoryView',
    platform: 'iOS',
    render: function(): React.Node {
      return <TextInputWithInputAccessoryView />;
    },
  },
  {
    title: 'TextInput with different keyboardAppearance',
    platform: 'iOS',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="Default">
            <TextInput style={styles.default} keyboardAppearance="default" />
          </WithLabel>
          <WithLabel label="Light">
            <TextInput style={styles.default} keyboardAppearance="light" />
          </WithLabel>
          <WithLabel label="Dark">
            <TextInput style={styles.default} keyboardAppearance="default" />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with maxFontSizeMultiplier={1.5}',
    description:
      'Specifies largest possible scale a font can reach when allowFontScaling is enabled. /n' +
      "Default Value is null/undefined./n Value '0' means no maximum size and ignores parent/global default. ",
    render: function(): React.Node {
      <WithLabel label="Enter Name:">
        <TextInput
          style={styles.default}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.5}
        />
      </WithLabel>;
    },
  },
  {
    title: 'TextInput with multiline={true}',
    render: function(): React.Node {
      return (
        <View>
          <Text>With Scroll</Text>
          <WithLabel label="Enter Short Bio">
            <TextInput
              style={styles.default}
              multiline={true}
              numberOfLines={10}
            />
          </WithLabel>
          <Text>Without Scroll</Text>
          <WithLabel label="Enter Short Bio">
            <TextInput
              style={styles.default}
              multiline={true}
              numberOfLines={10}
              scrollEnabled={false}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with placeholder={string}',
    render: function(): React.Node {
      return (
        <View>
          <Text>Default Placeholder Text Color</Text>
          <WithLabel label="Enter Name">
            <TextInput style={styles.default} placeholder="John Doe" />
          </WithLabel>
          <Text>Custom Placeholder Text Color</Text>
          <WithLabel label="Enter Name">
            <TextInput
              style={styles.default}
              placeholder="No special characters"
              placeholderTextColor="red"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with returnKeyLabel={string}',
    platform: 'android',
    render: function(): React.Node {
      return (
        <WithLabel label="Send Message">
          <TextInput style={styles.default} returnKeyLabel="Send" />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with different returnKeyType for cross-platform use',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="Search Product">
            <TextInput
              style={styles.default}
              returnKeyType="search"
              placeholder="Search Return Key"
            />
          </WithLabel>
          <WithLabel label="Enter Quantity">
            <TextInput
              style={styles.default}
              returnKeyType="next"
              placeholder="Next Return Key"
            />
          </WithLabel>
          <WithLabel label="Enter Amount">
            <TextInput
              style={styles.default}
              returnKeyType="done"
              placeholder="Done return key"
            />
          </WithLabel>
          <WithLabel label="Enter Total">
            <TextInput
              style={styles.default}
              returnKeyType="go"
              placeholder="Go return key"
            />
          </WithLabel>
          <WithLabel label="Enter Request:">
            <TextInput
              style={styles.default}
              returnKeyType="send"
              placeholder="Send Return Key"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with different returnKeyType',
    platform: 'iOS',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="Emergency Contact:">
            <TextInput
              style={styles.default}
              returnKeyType="emergency-call"
              placeholder="Emergency-call return key"
            />
          </WithLabel>
          <WithLabel label="Google Search:">
            <TextInput
              style={styles.default}
              returnKeyType="google"
              placeholder="Google Return Key"
            />
          </WithLabel>
          <WithLabel label="Enter Name:">
            <TextInput
              style={styles.default}
              returnKeyType="join"
              placeholder="Join Return Key"
            />
          </WithLabel>
          <WithLabel label="Enter Destination:">
            <TextInput
              style={styles.default}
              returnKeyType="route"
              placeholder="Route Return Key"
            />
          </WithLabel>
          <WithLabel label="Yahoo search:">
            <TextInput
              style={styles.default}
              returnKeyType="yahoo"
              placeholder="Yahoo Return Key"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with different returnKeyType',
    platform: 'android',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="First Name">
            <TextInput
              style={styles.default}
              returnKeyType="none"
              placeholder="No Return Key"
            />
          </WithLabel>
          <WithLabel label="Last Name">
            <TextInput
              style={styles.default}
              returnKeyType="previous"
              placeholder="Previous Return Key"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with rejectResponderTermination={false}',
    description: 'Add desc',
    platform: 'iOS',
    render: () => {
      return (
        <WithLabel label="text">
          <TextInput
            style={styles.default}
            rejectResponderTermination={false}
          />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with secureTextEntry={true}',
    render: () => {
      return (
        <WithLabel label="Password">
          <TextInput style={styles.default} secureTextEntry={true} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with selectTextOnFocus={true}',
    render: () => {
      return (
        <WithLabel label="Description">
          <TextInput
            style={styles.default}
            multiline={true}
            selectTextOnFocus={true}
          />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with different textAlign values',
    render: () => {
      return (
        <View>
          <WithLabel label="Username:">
            <TextInput
              style={styles.default}
              textAlign="left"
              placeholder="Left Align"
            />
          </WithLabel>
          <WithLabel label="Title:">
            <TextInput
              style={styles.default}
              textAlign="center"
              placeholder="Center Align"
            />
          </WithLabel>
          <WithLabel label="Amount:">
            <TextInput
              style={styles.default}
              textAlign="right"
              placeholder="Right Align"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput with value={default}',
    description:
      'The value to show for the text input. TextInput is a controlled component, which means the native value will be forced to match this value prop if provided. For most uses, this works great, but in some cases this may cause flickering - one common cause is preventing edits by keeping value the same. In addition to setting the same value, either set editable={false}, or set/update maxLength to prevent unwanted edits without flicker.',
    render: function(): React.Node {
      return (
        <WithLabel label="Organisation:">
          <TextInput value="React Native" style={styles.default} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with different Keyboard types',
    render: function(): React.Node {
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
    title: 'TextInput with different Text selection & cursor placement',
    render: function(): React.Node {
      return (
        <View>
          <SelectionExample
            style={styles.default}
            value="text selection can be changed"
          />
          <SelectionExample
            multiline
            style={styles.multiline}
            value={'multiline text selection\ncan also be changed'}
          />
        </View>
      );
    },
  },
  {
    title: "TextInput with selectionColor='yellow'",
    render: () => {
      return (
        <WithLabel label="Warning Message">
          <TextInput style={styles.default} selectionColor="yellow" />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with showSoftInputOnFocus={false}',
    platform: 'android',
    description:
      'When false, it will prevent the soft keyboard from showing when the field is focused. The default value is true.',
    render: () => {
      return (
        <WithLabel label="Name:">
          <TextInput style={styles.default} showSoftInputOnFocus={false} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with spellCheck={true}',
    platform: 'iOS',
    render: () => {
      return (
        <WithLabel label="Description:">
          <TextInput style={styles.default} spellCheck={true} />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with different values of textContentType',
    platform: 'iOS',
    description:
      'Give the keyboard and the system information about the expected semantic meaning for the content that users enter.',
    render: () => {
      const types = [
        'none',
        'URL',
        'addressCity',
        'addressCityAndState',
        'addressState',
        'countryName',
        'creditCardNumber',
        'emailAddress',
        'familyName',
        'fullStreetAddress',
        'givenName',
        'jobTitle',
        'location',
        'middleName',
        'name',
        'namePrefix',
        'nameSuffix',
        'nickname',
        'organizationName',
        'postalCode',
        'streetAddressLine1',
        'streetAddressLine2',
        'sublocality',
        'telephoneNumber',
        'username',
        'password',
      ];
      return types.map(type => (
        <WithLabel label={type} key={type}>
          <TextInput style={styles.default} textContentType={type} />
        </WithLabel>
      ));
    },
  },
  {
    title: "TextInput with textContentType='newPassword' and passwordRules",
    platform: 'iOS',
    render: () => {
      return (
        <WithLabel label="Password">
          <TextInput
            style={styles.default}
            secureTextEntry={true}
            textContentType="newPassword"
            passwordRules="required: lower; required: upper; required: digit; required: [-]; minlength: 20;"
          />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with different textBreakStrategy values',
    platform: 'android',
    description:
      'Set text break strategy on Android API Level 23+, possible values are simple, highQuality, balanced The default value is simple.',
    render: () => {
      const types = ['simple', 'highQuality', 'balanced'];
      return types.map(type => (
        <WithLabel label={type} key={type}>
          <TextInput style={styles.default} textBreakStrategy={type} />
        </WithLabel>
      ));
    },
  },
  {
    title: "TextInput with underlineColorAndroid='red'",
    platform: 'android',
    render: () => {
      return (
        <WithLabel label="Title">
          <TextInput style={styles.default} underlineColorAndroid="red" />
        </WithLabel>
      );
    },
  },
  {
    title: 'TextInput with different autoCompleteType values',
    platform: 'android',
    render: () => {
      const types = [
        'off',
        'username',
        'password',
        'email',
        'name',
        'tel',
        'street-address',
        'postal-code',
        'cc-number',
        'cc-csc',
        'cc-exp',
        'cc-exp-month',
        'cc-exp-year',
      ];
      return (
        <View>
          {types.map(type => (
            <WithLabel label={type} key={type}>
              <TextInput style={styles.default} autoCompleteType={type} />
            </WithLabel>
          ))}
        </View>
      );
    },
  },
  {
    title:
      "TextInput with dataDetectorTypes='all' with multiline={true} and editable={false}",
    platform: 'iOS',
    description:
      "Possible values for dataDetectorTypes are: 'phoneNumber', 'link' , 'address', 'calendarEvent', 'none', 'all'",
    render: () => {
      <WithLabel label="Personal Info">
        <TextInput
          style={styles.default}
          editable={false}
          multiline={true}
          dataDetectorTypes="all"
          value="Contact at 98293274 or email at abc@xyz.com. \n Meeting on 15/08/2020 in Menlo Park, California"
        />
      </WithLabel>;
    },
  },
  {
    title: 'Event handling',
    render: function(): React.Element<any> {
      return <TextEventsExample />;
    },
  },
  {
    title:
      'TextInput with different Style properties: fontFamily, fontWeight and fontStyle',
    render: function(): React.Node {
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
    title: 'TextInput Attributed text',
    render: function(): React.Node {
      return <TokenizedTextExample />;
    },
  },
  {
    title: 'onBlur handler',
    description:
      'onBlur handler can be used to perform operations after the element is moved out of focus, for example checking if input is valid or invalid',
    render: () => <EventHanderOnBlur />,
  },
  {
    title: 'onChange handler',
    description:
      'this handler is triggered when the text in the input component changes, and passes an event with the changed text to the listening function',
    render: () => <EventHanderOnChange />,
  },
  {
    title: 'onChangeText handler',
    description:
      'this handler is triggered when the text in the input component changes, and passes only the changed text  to the listening function',
    render: () => <EventHanderOnChangeText />,
  },
  {
    title: 'onEndEditing handler',
    description:
      'this handler is triggered when the editing event of the input component ends !!Verify!!',
    render: () => <EventHanderOnEndEditing />,
  },
  {
    title: 'onFocus handler',
    description:
      'this handler is triggered when the input element comes to user focus',
    render: () => <EventHanderOnFocus />,
  },
  {
    title: 'onKeyPress handler',
    description:
      'this handler is triggered when the user presses a key on the keyboard. On android, only inputs from soft keyboard are handled. It reports before the onChange bindings',
    render: () => <EventHanderOnKeyPress />,
  },
  {
    title: 'onLayout handler',
    description:
      'this handler is triggered when the layout of the input component changes. For example, the orientation of device is changed, and the layout of the component is changed. Also triggered when component mounts.',
    render: () => <EventHanderOnLayout />,
  },
  {
    title: 'onScroll handler',
    description:
      'this handler is triggered when the content inside the input component offsets due to size limitations. This is bound to happen when user enters text which exceeds the width of the component.',
    render: () => <EventHanderOnScroll />,
  },
  {
    title: 'onSelectionChange handler',
    description:
      'this handler is used to get the location of the currently selected text in the text component',
    render: () => <EventHanderOnSelectionChange />,
  },
  {
    title: 'onSubmitEditing handler',
    description:
      'this handler is used to receive the current value of the text input when the user presses the enter/go key on the soft keyboard.',
    render: () => <EventHanderOnSubmitEditing />,
  },
  {
    title: 'onTextInput handler',
    description:
      'this handler is used to keep track of input from the text component, and passes the current word and positions',
    render: () => <EventHandlerOnTextInput />,
  },
]: Array<RNTesterExampleModuleItem>);