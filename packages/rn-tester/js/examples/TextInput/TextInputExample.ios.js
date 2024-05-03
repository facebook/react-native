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

import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../../types/RNTesterTypes';
import type {KeyboardType} from 'react-native/Libraries/Components/TextInput/TextInput';

import ExampleTextInput from './ExampleTextInput';

const TextInputSharedExamples = require('./TextInputSharedExamples.js');
const React = require('react');
const {
  Alert,
  Button,
  InputAccessoryView,
  StyleSheet,
  Switch,
  Text,
  View,
} = require('react-native');

class WithLabel extends React.Component<$FlowFixMeProps> {
  render(): React.Node {
    return (
      <View style={styles.labelContainer}>
        <View style={styles.label}>
          <Text>{this.props.label}</Text>
        </View>
        {this.props.children}
      </View>
    );
  }
}

class TextInputAccessoryViewChangeTextExample extends React.Component<
  {...},
  {text: string},
> {
  constructor(props: void | {...}) {
    super(props);
    this.state = {text: 'Placeholder Text'};
  }

  render(): React.Node {
    const inputAccessoryViewID = 'inputAccessoryView1';
    return (
      <View>
        <Text>Set InputAccessoryView with ID & reset text:</Text>
        <ExampleTextInput
          inputAccessoryViewID={inputAccessoryViewID}
          onChangeText={text => this.setState({text})}
          value={this.state.text}
        />
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={{backgroundColor: 'white'}}>
            <Button
              onPress={() => this.setState({text: 'Placeholder Text'})}
              title="Reset Text"
            />
          </View>
        </InputAccessoryView>
      </View>
    );
  }
}

class TextInputAccessoryViewChangeKeyboardExample extends React.Component<
  {...},
  {keyboardType: string, text: string},
> {
  constructor(props: void | {...}) {
    super(props);
    this.state = {text: '', keyboardType: 'default'};
  }

  _switchKeyboard = () => {
    this.setState({
      keyboardType:
        this.state.keyboardType === 'default' ? 'number-pad' : 'default',
    });
  };

  render(): React.Node {
    const inputAccessoryViewID = 'inputAccessoryView2';
    return (
      <View>
        <Text>Set InputAccessoryView with ID & switch keyboard:</Text>
        {/* $FlowFixMe[incompatible-use] */}
        <ExampleTextInput
          inputAccessoryViewID={inputAccessoryViewID}
          onChangeText={text => this.setState({text})}
          value={this.state.text}
          // $FlowFixMe[incompatible-type]
          keyboardType={this.state.keyboardType}
          returnKeyType="done"
        />
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={{backgroundColor: 'white'}}>
            <Button onPress={this._switchKeyboard} title="Switch Keyboard" />
          </View>
        </InputAccessoryView>
      </View>
    );
  }
}

class TextInputAccessoryViewDefaultDoneButtonExample extends React.Component<
  $ReadOnly<{|
    keyboardType: KeyboardType,
  |}>,
  {text: string},
> {
  constructor(props: void | $ReadOnly<{keyboardType: KeyboardType}>) {
    super(props);
    this.state = {text: ''};
  }

  render(): React.Node {
    return (
      <ExampleTextInput
        onChangeText={text => this.setState({text})}
        value={this.state.text}
        keyboardType={this.props.keyboardType}
        returnKeyType="done"
      />
    );
  }
}

class RewriteExampleKana extends React.Component<$FlowFixMeProps, any> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render(): React.Node {
    return (
      <View style={styles.rewriteContainer}>
        <ExampleTextInput
          multiline={false}
          onChangeText={text => {
            this.setState({text: text.replace(/ひ/g, '日')});
          }}
          value={this.state.text}
        />
      </View>
    );
  }
}

class SecureEntryExample extends React.Component<$FlowFixMeProps, any> {
  constructor(props: any | void) {
    super(props);
    this.state = {
      text: '',
      password: '',
      isSecureTextEntry: true,
    };
  }
  render(): React.Node {
    return (
      <View>
        <ExampleTextInput
          secureTextEntry={true}
          defaultValue="abc"
          onChangeText={text => this.setState({text})}
          value={this.state.text}
        />
        <Text>Current text is: {this.state.text}</Text>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
          }}>
          <ExampleTextInput
            defaultValue="cde"
            onChangeText={text => this.setState({password: text})}
            secureTextEntry={this.state.isSecureTextEntry}
            value={this.state.password}
          />
          <Switch
            onValueChange={value => {
              this.setState({isSecureTextEntry: value});
            }}
            style={{marginLeft: 4}}
            value={this.state.isSecureTextEntry}
          />
        </View>
      </View>
    );
  }
}

class AutogrowingTextInputExample extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  constructor(props: any | void) {
    super(props);

    this.state = {
      multiline: true,
      fullWidth: true,
      text: '',
      contentSize: {
        width: 0,
        height: 0,
      },
    };
  }

  UNSAFE_componentWillReceiveProps(props: any) {
    this.setState({
      multiline: props.multiline,
    });
  }

  render(): React.Node {
    const {style, multiline, ...props} = this.props;
    return (
      <View>
        <Text>Full width:</Text>
        <Switch
          value={this.state.fullWidth}
          onValueChange={value => this.setState({fullWidth: value})}
        />

        <Text>Multiline:</Text>
        <Switch
          value={this.state.multiline}
          onValueChange={value => this.setState({multiline: value})}
        />

        <Text>TextInput:</Text>
        <ExampleTextInput
          value="prop"
          multiline={this.state.multiline}
          style={[style, {width: this.state.fullWidth ? '100%' : '50%'}]}
          onChangeText={value => this.setState({text: value})}
          onContentSizeChange={event =>
            this.setState({contentSize: event.nativeEvent.contentSize})
          }
          {...props}
        />
        <Text>Plain text value representation:</Text>
        <Text>{this.state.text}</Text>
        <Text>Content Size: {JSON.stringify(this.state.contentSize)}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  multiline: {
    height: 50,
    marginBottom: 4,
  },
  multilinePlaceholderStyles: {
    letterSpacing: 10,
    lineHeight: 20,
    textAlign: 'center',
  },
  multilineExpandable: {
    height: 'auto',
    maxHeight: 100,
  },
  multilineWithFontStyles: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Cochin',
    height: 60,
  },
  singlelinePlaceholderStyles: {
    letterSpacing: 10,
    textAlign: 'center',
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
  rewriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainder: {
    textAlign: 'right',
    width: 24,
  },
});

const textInputExamples: Array<RNTesterModuleExample> = [
  ...TextInputSharedExamples,
  {
    title: 'Live Re-Write (ひ -> 日)',
    render: function (): React.Node {
      return <RewriteExampleKana />;
    },
  },
  {
    title: 'Keyboard Input Accessory View',
    render: function (): React.Node {
      return (
        <View>
          <TextInputAccessoryViewChangeTextExample />
          <TextInputAccessoryViewChangeKeyboardExample />
        </View>
      );
    },
  },
  {
    title: "Default Input Accessory View with returnKeyType = 'done'",
    render: function (): React.Node {
      const keyboardTypesWithDoneButton = [
        'number-pad',
        'phone-pad',
        'decimal-pad',
        'ascii-capable-number-pad',
      ];
      const examples = keyboardTypesWithDoneButton.map(type => {
        return (
          <WithLabel key={'keyboardType: ' + type} label={type}>
            <TextInputAccessoryViewDefaultDoneButtonExample
              key={type}
              keyboardType={type}
            />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Nested content and `value` property',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="singleline">
            <ExampleTextInput value="(value property)">
              (first raw text node)
              <Text style={{color: 'red'}}>(internal raw text node)</Text>
              (last raw text node)
            </ExampleTextInput>
          </WithLabel>
          <WithLabel label="multiline">
            <ExampleTextInput multiline={true} value="(value property)">
              (first raw text node)
              <Text style={{color: 'red'}}>(internal raw text node)</Text>
              (last raw text node)
            </ExampleTextInput>
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Keyboard appearance',
    render: function (): React.Node {
      const keyboardAppearance = ['default', 'light', 'dark'];
      const examples = keyboardAppearance.map(type => {
        return (
          <WithLabel key={type} label={type}>
            <ExampleTextInput keyboardAppearance={type} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Return key types',
    render: function (): React.Node {
      const returnKeyTypes = [
        'default',
        'go',
        'google',
        'join',
        'next',
        'route',
        'search',
        'send',
        'yahoo',
        'done',
        'emergency-call',
      ];
      const examples = returnKeyTypes.map(type => {
        return (
          <WithLabel key={type} label={type}>
            <ExampleTextInput returnKeyType={type} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Enable return key automatically',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="true">
            <ExampleTextInput enablesReturnKeyAutomatically={true} />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Secure text entry',
    render: function (): React.Node {
      return <SecureEntryExample />;
    },
  },
  {
    title: 'Colored input text',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput style={{color: 'blue'}} defaultValue="Blue" />
          <ExampleTextInput style={{color: 'green'}} defaultValue="Green" />
        </View>
      );
    },
  },
  {
    title: 'Colored highlight/cursor for text input',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            selectionColor={'green'}
            defaultValue="Highlight me"
          />
          <ExampleTextInput
            selectionColor={'rgba(86, 76, 205, 1)'}
            defaultValue="Highlight me"
          />
        </View>
      );
    },
  },
  {
    title: 'Clear button mode',
    render: function (): React.Node {
      const clearButtonModes = [
        'never',
        'while-editing',
        'unless-editing',
        'always',
      ];
      const examples = clearButtonModes.map(mode => {
        return (
          <WithLabel key={mode} label={mode}>
            <ExampleTextInput clearButtonMode={mode} defaultValue={mode} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Clear and select',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="clearTextOnFocus">
            <ExampleTextInput
              placeholder="text is cleared on focus"
              defaultValue="text is cleared on focus"
              clearTextOnFocus={true}
            />
          </WithLabel>
          <WithLabel label="selectTextOnFocus">
            <ExampleTextInput
              placeholder="text is selected on focus"
              defaultValue="text is selected on focus"
              selectTextOnFocus={true}
            />
          </WithLabel>
          <WithLabel label="clearTextOnFocus (multiline)">
            <ExampleTextInput
              placeholder="text is cleared on focus"
              defaultValue="text is cleared on focus"
              clearTextOnFocus={true}
              multiline={true}
            />
          </WithLabel>
          <WithLabel label="selectTextOnFocus (multiline)">
            <ExampleTextInput
              placeholder="text is selected on focus"
              defaultValue="text is selected on focus"
              selectTextOnFocus={true}
              multiline={true}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Multiline blur on submit',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            style={styles.multiline}
            placeholder="blurOnSubmit = true"
            returnKeyType="next"
            blurOnSubmit={true}
            multiline={true}
            onSubmitEditing={event =>
              Alert.alert('Alert', event.nativeEvent.text)
            }
          />
        </View>
      );
    },
  },
  {
    title: 'Multiline',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            placeholder="multiline text input"
            multiline={true}
            style={styles.multiline}
          />
          <ExampleTextInput
            placeholder="multiline text input with font styles and placeholder"
            multiline={true}
            clearTextOnFocus={true}
            autoCorrect={true}
            autoCapitalize="words"
            placeholderTextColor="red"
            keyboardType="url"
            style={[styles.multiline, styles.multilineWithFontStyles]}
          />
          <ExampleTextInput
            placeholder="multiline text input with max length"
            maxLength={5}
            multiline={true}
            style={styles.multiline}
          />
          <ExampleTextInput
            placeholder="uneditable multiline text input"
            editable={false}
            multiline={true}
            style={styles.multiline}
          />
          <ExampleTextInput
            defaultValue="uneditable multiline text input with phone number detection: 88888888."
            editable={false}
            multiline={true}
            style={styles.multiline}
            dataDetectorTypes="phoneNumber"
          />
        </View>
      );
    },
  },
  {
    title: 'Editable and Read only',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            placeholder="editable text input using editable prop"
            editable
          />
          <ExampleTextInput
            placeholder="uneditable text input using editable prop"
            editable={false}
          />
          <ExampleTextInput
            placeholder="editable text input using readOnly prop"
            readOnly={false}
          />
          <ExampleTextInput
            placeholder="uneditable text input using readOnly prop"
            readOnly
          />
        </View>
      );
    },
  },
  {
    title: 'TextInput Intrinsic Size',
    render: function (): React.Node {
      return (
        <View>
          <Text>Singleline TextInput</Text>
          <View style={{height: 80}}>
            <ExampleTextInput
              style={{
                position: 'absolute',
                fontSize: 16,
                backgroundColor: '#eeeeee',
                borderColor: '#666666',
                borderWidth: 5,
                borderTopWidth: 20,
                borderRadius: 10,
                borderBottomRightRadius: 20,
                padding: 10,
                paddingTop: 20,
              }}
              testID="singleline_textinput"
              placeholder="Placeholder defines intrinsic size"
            />
          </View>
          <Text>Multiline TextInput</Text>
          <View style={{height: 130}}>
            <ExampleTextInput
              style={{
                position: 'absolute',
                fontSize: 16,
                backgroundColor: '#eeeeee',
                borderColor: '#666666',
                borderWidth: 5,
                borderTopWidth: 20,
                borderRadius: 10,
                borderBottomRightRadius: 20,
                padding: 10,
                paddingTop: 20,
                maxHeight: 100,
              }}
              testID="multiline_textinput"
              multiline={true}
              placeholder="Placeholder defines intrinsic size"
            />
          </View>
          <View>
            <ExampleTextInput
              style={{
                fontSize: 16,
                backgroundColor: '#eeeeee',
                borderColor: '#666666',
                borderWidth: 5,
                borderTopWidth: 20,
                borderRadius: 10,
                borderBottomRightRadius: 20,
                padding: 10,
                paddingTop: 20,
              }}
              testID="multiline_textinput_with_flex"
              multiline={true}
              placeholder="Placeholder defines intrinsic size"
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Auto-expanding',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            placeholder="height increases with content"
            defaultValue="React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and React. The focus of React Native is on developer efficiency across all the platforms you care about - learn once, write anywhere. Facebook uses React Native in multiple production apps and will continue investing in React Native."
            multiline={true}
            enablesReturnKeyAutomatically={true}
            returnKeyType="go"
            style={[styles.multiline, styles.multilineExpandable]}
          />
        </View>
      );
    },
  },
  {
    title: 'Auto-expanding',
    render: function (): React.Node {
      return (
        <View>
          <AutogrowingTextInputExample
            enablesReturnKeyAutomatically={true}
            returnKeyType="done"
            multiline={true}
            style={{
              maxHeight: 400,
              minHeight: 20,
              paddingTop: 0,
              backgroundColor: '#eeeeee',
              color: 'blue',
            }}>
            <Text style={{fontSize: 30, color: 'green'}}>huge</Text>
            generic generic generic
            <Text style={{fontSize: 6, color: 'red'}}>
              small small small small small small
            </Text>
            <Text>regular regular</Text>
            <Text style={{fontSize: 30, color: 'green'}}>
              huge huge huge huge huge
            </Text>
            generic generic generic
          </AutogrowingTextInputExample>
        </View>
      );
    },
  },
  {
    title: 'TextInput maxLength',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="maxLength: 5">
            <ExampleTextInput maxLength={5} />
          </WithLabel>
          <WithLabel label="maxLength: 5 with placeholder">
            <ExampleTextInput maxLength={5} placeholder="ZIP code entry" />
          </WithLabel>
          <WithLabel label="maxLength: 5 with default value already set">
            <ExampleTextInput maxLength={5} defaultValue="94025" />
          </WithLabel>
          <WithLabel label="maxLength: 5 with very long default value already set">
            <ExampleTextInput maxLength={5} defaultValue="9402512345" />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Text Auto Complete',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="country">
            <ExampleTextInput autoComplete="country" />
          </WithLabel>
          <WithLabel label="one-time-code">
            <ExampleTextInput autoComplete="one-time-code" />
          </WithLabel>
          <WithLabel label="birthdate-full">
            <ExampleTextInput autoComplete="birthdate-full" />
          </WithLabel>
          <WithLabel label="cc-name">
            <ExampleTextInput autoComplete="cc-name" />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Text Content Type',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="emailAddress">
            <ExampleTextInput textContentType="emailAddress" />
          </WithLabel>
          <WithLabel label="name">
            <ExampleTextInput textContentType="name" />
          </WithLabel>
          <WithLabel label="postalCode, when autoComplete set">
            <ExampleTextInput
              textContentType="postalCode"
              autoComplete="email"
            />
          </WithLabel>
          <WithLabel label="creditCardExpiration">
            <ExampleTextInput textContentType="creditCardExpiration" />
          </WithLabel>
          <WithLabel label="birthdate">
            <ExampleTextInput textContentType="birthdate" />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput Placeholder Styles',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="letterSpacing: 10 lineHeight: 20 textAlign: 'center'">
            <ExampleTextInput
              placeholder="multiline text input"
              multiline={true}
              style={[styles.multiline, styles.multilinePlaceholderStyles]}
            />
          </WithLabel>
          <WithLabel label="letterSpacing: 10 textAlign: 'center'">
            <ExampleTextInput
              placeholder="singleline"
              style={styles.singlelinePlaceholderStyles}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'showSoftInputOnFocus',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="showSoftInputOnFocus: false">
            <ExampleTextInput showSoftInputOnFocus={false} />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Line Break Strategy',
    render: function (): React.Node {
      const lineBreakStrategy = ['none', 'standard', 'hangul-word', 'push-out'];
      const textByCode = {
        en: 'lineBreakStrategy lineBreakStrategy lineBreakStrategy lineBreakStrategy',
        ko: '한글개행한글개행 한글개행한글개행 한글개행한글개행 한글개행한글개행 한글개행한글개행 한글개행한글개행',
        ja: 'かいぎょう かいぎょう かいぎょう かいぎょう かいぎょう かいぎょう',
        cn: '改行 改行 改行 改行 改行 改行 改行 改行 改行 改行 改行 改行',
      };
      return (
        <View>
          {lineBreakStrategy.map(strategy => {
            return (
              <View key={strategy} style={{marginBottom: 12}}>
                <Text
                  style={{
                    backgroundColor: 'lightgrey',
                  }}>{`Strategy: ${strategy}`}</Text>
                {Object.keys(textByCode).map(code => {
                  return (
                    <View key={code}>
                      <Text style={{fontWeight: 'bold'}}>{`[${code}]`}</Text>
                      <ExampleTextInput
                        multiline
                        lineBreakStrategyIOS={strategy}
                        defaultValue={textByCode[code]}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      );
    },
  },
  {
    title: 'iOS autoformatting behaviors',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="smartInsertDelete: true | undefined">
            <ExampleTextInput defaultValue="CopyAndPaste" />
          </WithLabel>
          <WithLabel label="smartInsertDelete: false">
            <ExampleTextInput
              smartInsertDelete={false}
              defaultValue="CopyAndPaste"
            />
          </WithLabel>
        </View>
      );
    },
  },
];

module.exports = ({
  displayName: (undefined: ?string),
  title: 'TextInput',
  documentationURL: 'https://reactnative.dev/docs/TextInput',
  category: 'Basic',
  description: 'Single and multi-line text inputs.',
  examples: textInputExamples,
}: RNTesterModule);
