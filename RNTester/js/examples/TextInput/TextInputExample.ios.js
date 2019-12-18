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
  InputAccessoryView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Slider,
  Switch,
  Alert,
} = require('react-native');

const TextInputSharedExamples = require('./TextInputSharedExamples.js');

import type {RNTesterExampleModuleItem} from '../../types/RNTesterTypes';

class WithLabel extends React.Component<$FlowFixMeProps> {
  render() {
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

class TextInputAccessoryViewExample extends React.Component<{...}, *> {
  constructor(props) {
    super(props);
    this.state = {text: 'Placeholder Text'};
  }

  render() {
    const inputAccessoryViewID = 'inputAccessoryView1';
    return (
      <View>
        <TextInput
          style={styles.default}
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

class RewriteExampleKana extends React.Component<$FlowFixMeProps, any> {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          multiline={false}
          onChangeText={text => {
            this.setState({text: text.replace(/ひ/g, '日')});
          }}
          style={styles.default}
          value={this.state.text}
        />
      </View>
    );
  }
}

class SecureEntryExample extends React.Component<$FlowFixMeProps, any> {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      password: '',
      isSecureTextEntry: true,
    };
  }
  render() {
    return (
      <View>
        <TextInput
          secureTextEntry={true}
          style={styles.default}
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
          <TextInput
            style={styles.default}
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
  constructor(props) {
    super(props);

    this.state = {
      width: 100,
      multiline: true,
      text: '',
      contentSize: {
        width: 0,
        height: 0,
      },
    };
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.setState({
      multiline: props.multiline,
    });
  }

  render() {
    const {style, multiline, ...props} = this.props;
    return (
      <View>
        <Text>Width:</Text>
        <Slider
          value={100}
          minimumValue={0}
          maximumValue={100}
          step={10}
          onValueChange={value => this.setState({width: value})}
        />
        <Text>Multiline:</Text>
        <Switch
          value={this.state.multiline}
          onValueChange={value => this.setState({multiline: value})}
        />
        <Text>TextInput:</Text>
        <TextInput
          value="prop"
          multiline={this.state.multiline}
          style={[style, {width: this.state.width + '%'}]}
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
});

exports.displayName = (undefined: ?string);
exports.title = '<TextInput>';
exports.description = 'Single and multi-line text inputs.';
exports.examples = ([
  ...TextInputSharedExamples,
  {
    title: 'Live Re-Write (ひ -> 日)',
    render: function(): React.Node {
      return <RewriteExampleKana />;
    },
  },
  {
    title: 'Keyboard Accessory View',
    render: function(): React.Node {
      return <TextInputAccessoryViewExample />;
    },
  },
  {
    title: 'Nested content and `value` property',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="singleline">
            <TextInput style={styles.default} value="(value property)">
              (first raw text node)
              <Text style={{color: 'red'}}>(internal raw text node)</Text>
              (last raw text node)
            </TextInput>
          </WithLabel>
          <WithLabel label="multiline">
            <TextInput
              style={styles.default}
              multiline={true}
              value="(value property)">
              (first raw text node)
              <Text style={{color: 'red'}}>(internal raw text node)</Text>
              (last raw text node)
            </TextInput>
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Keyboard appearance',
    render: function(): React.Node {
      const keyboardAppearance = ['default', 'light', 'dark'];
      const examples = keyboardAppearance.map(type => {
        return (
          <WithLabel key={type} label={type}>
            <TextInput keyboardAppearance={type} style={styles.default} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Return key types',
    render: function(): React.Node {
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
            <TextInput returnKeyType={type} style={styles.default} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Enable return key automatically',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="true">
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
    title: 'Secure text entry',
    render: function(): React.Node {
      return <SecureEntryExample />;
    },
  },
  {
    title: 'Colored input text',
    render: function(): React.Node {
      return (
        <View>
          <TextInput
            style={[styles.default, {color: 'blue'}]}
            defaultValue="Blue"
          />
          <TextInput
            style={[styles.default, {color: 'green'}]}
            defaultValue="Green"
          />
        </View>
      );
    },
  },
  {
    title: 'Colored highlight/cursor for text input',
    render: function(): React.Node {
      return (
        <View>
          <TextInput
            style={styles.default}
            selectionColor={'green'}
            defaultValue="Highlight me"
          />
          <TextInput
            style={styles.default}
            selectionColor={'rgba(86, 76, 205, 1)'}
            defaultValue="Highlight me"
          />
        </View>
      );
    },
  },
  {
    title: 'Clear button mode',
    render: function(): React.Node {
      const clearButtonModes = [
        'never',
        'while-editing',
        'unless-editing',
        'always',
      ];
      const examples = clearButtonModes.map(mode => {
        return (
          <WithLabel key={mode} label={mode}>
            <TextInput
              style={styles.default}
              clearButtonMode={mode}
              defaultValue={mode}
            />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Clear and select',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="clearTextOnFocus">
            <TextInput
              placeholder="text is cleared on focus"
              defaultValue="text is cleared on focus"
              style={styles.default}
              clearTextOnFocus={true}
            />
          </WithLabel>
          <WithLabel label="selectTextOnFocus">
            <TextInput
              placeholder="text is selected on focus"
              defaultValue="text is selected on focus"
              style={styles.default}
              selectTextOnFocus={true}
            />
          </WithLabel>
          <WithLabel label="clearTextOnFocus (multiline)">
            <TextInput
              placeholder="text is cleared on focus"
              defaultValue="text is cleared on focus"
              style={styles.default}
              clearTextOnFocus={true}
              multiline={true}
            />
          </WithLabel>
          <WithLabel label="selectTextOnFocus (multiline)">
            <TextInput
              placeholder="text is selected on focus"
              defaultValue="text is selected on focus"
              style={styles.default}
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
    render: function(): React.Node {
      return (
        <View>
          <TextInput
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
    render: function(): React.Node {
      return (
        <View>
          <TextInput
            placeholder="multiline text input"
            multiline={true}
            style={styles.multiline}
          />
          <TextInput
            placeholder="multiline text input with font styles and placeholder"
            multiline={true}
            clearTextOnFocus={true}
            autoCorrect={true}
            autoCapitalize="words"
            placeholderTextColor="red"
            keyboardType="url"
            style={[styles.multiline, styles.multilineWithFontStyles]}
          />
          <TextInput
            placeholder="multiline text input with max length"
            maxLength={5}
            multiline={true}
            style={styles.multiline}
          />
          <TextInput
            placeholder="uneditable multiline text input"
            editable={false}
            multiline={true}
            style={styles.multiline}
          />
          <TextInput
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
    title: 'TextInput Intrinsic Size',
    render: function(): React.Node {
      return (
        <View>
          <Text>Singleline TextInput</Text>
          <View style={{height: 80}}>
            <TextInput
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
            <TextInput
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
            <TextInput
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
    render: function(): React.Node {
      return (
        <View>
          <TextInput
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
    render: function(): React.Node {
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
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="maxLength: 5">
            <TextInput maxLength={5} style={styles.default} />
          </WithLabel>
          <WithLabel label="maxLength: 5 with placeholder">
            <TextInput
              maxLength={5}
              placeholder="ZIP code entry"
              style={styles.default}
            />
          </WithLabel>
          <WithLabel label="maxLength: 5 with default value already set">
            <TextInput
              maxLength={5}
              defaultValue="94025"
              style={styles.default}
            />
          </WithLabel>
          <WithLabel label="maxLength: 5 with very long default value already set">
            <TextInput
              maxLength={5}
              defaultValue="9402512345"
              style={styles.default}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Text Content Type',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="emailAddress">
            <TextInput textContentType="emailAddress" style={styles.default} />
          </WithLabel>
          <WithLabel label="name">
            <TextInput textContentType="name" style={styles.default} />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput Placeholder Styles',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="letterSpacing: 10 lineHeight: 20 textAlign: 'center'">
            <TextInput
              placeholder="multiline text input"
              multiline={true}
              style={[styles.multiline, styles.multilinePlaceholderStyles]}
            />
          </WithLabel>
          <WithLabel label="letterSpacing: 10 textAlign: 'center'">
            <TextInput
              placeholder="singleline"
              style={[styles.default, styles.singlelinePlaceholderStyles]}
            />
          </WithLabel>
        </View>
      );
    },
  },
]: Array<RNTesterExampleModuleItem>);
