/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../../types/RNTesterTypes';

import ExampleTextInput from './ExampleTextInput';

const TextInputSharedExamples = require('./TextInputSharedExamples.js');
const React = require('react');
const {StyleSheet, Switch, Text, View} = require('react-native');

class ToggleDefaultPaddingExample extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  constructor(props) {
    super(props);
    this.state = {hasPadding: false};
  }
  render(): React.Node {
    return (
      <View>
        <ExampleTextInput style={this.state.hasPadding ? {padding: 0} : null} />
        <Text
          onPress={() => this.setState({hasPadding: !this.state.hasPadding})}>
          Toggle padding
        </Text>
      </View>
    );
  }
}

class AutogrowingTextInputExample extends React.Component<{...}> {
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  constructor(props) {
    super(props);

    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
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

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  UNSAFE_componentWillReceiveProps(props) {
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    this.setState({
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      multiline: props.multiline,
    });
  }

  render(): React.Node {
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    const {style, multiline, ...props} = this.props;
    return (
      <View>
        <Text>Full width:</Text>
        <Switch
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          value={this.state.fullWidth}
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          onValueChange={value => this.setState({fullWidth: value})}
        />

        <Text>Multiline:</Text>
        <Switch
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          value={this.state.multiline}
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          onValueChange={value => this.setState({multiline: value})}
        />

        <Text>TextInput:</Text>
        {/* $FlowFixMe(>=0.122.0 site=react_native_android_fb) This comment
         * suppresses an error found when Flow v0.122.0 was deployed. To see
         * the error, delete this comment and run Flow. */}
        <ExampleTextInput
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          multiline={this.state.multiline}
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          style={[style, {width: this.state.fullWidth ? '100%' : '50%'}]}
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          onChangeText={value => this.setState({text: value})}
          onContentSizeChange={event =>
            /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
             * found when making Flow check .android.js files. */
            this.setState({contentSize: event.nativeEvent.contentSize})
          }
          {...props}
        />
        <Text>Plain text value representation:</Text>
        {/* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
         * found when making Flow check .android.js files. */}
        <Text>{this.state.text}</Text>
        {/* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
         * found when making Flow check .android.js files. */}
        <Text>Content Size: {JSON.stringify(this.state.contentSize)}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  multiline: {
    height: 60,
    fontSize: 16,
  },
  singleLine: {
    fontSize: 16,
  },
  singleLineWithHeightTextInput: {
    height: 30,
  },
  wrappedText: {
    maxWidth: 300,
  },
});

const examples: Array<RNTesterModuleExample> = [
  ...TextInputSharedExamples,
  {
    title: 'Colors and text inputs',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            style={[styles.singleLine]}
            defaultValue="Default color text"
          />
          <ExampleTextInput
            style={[styles.singleLine, {color: 'green'}]}
            defaultValue="Green Text"
          />
          <ExampleTextInput
            placeholder="Default placeholder text color"
            style={styles.singleLine}
          />
          <ExampleTextInput
            placeholder="Red placeholder text color"
            placeholderTextColor="red"
            style={styles.singleLine}
          />
          <ExampleTextInput
            placeholder="Default underline color"
            style={styles.singleLine}
          />
          <ExampleTextInput
            placeholder="Blue underline color"
            style={styles.singleLine}
            underlineColorAndroid="blue"
          />
          <ExampleTextInput
            defaultValue="Same BackgroundColor as View "
            style={[
              styles.singleLine,
              {backgroundColor: 'rgba(100, 100, 100, 0.3)'},
            ]}>
            <Text style={{backgroundColor: 'rgba(100, 100, 100, 0.3)'}}>
              Darker backgroundColor
            </Text>
          </ExampleTextInput>
          <ExampleTextInput
            defaultValue="Selection Color is red"
            selectionColor={'red'}
            style={styles.singleLine}
          />
          <ExampleTextInput
            defaultValue="Selection handles are red"
            selectionHandleColor={'red'}
            style={styles.singleLine}
          />
          <ExampleTextInput
            defaultValue="Cursor Color is red"
            cursorColor={'red'}
            style={styles.singleLine}
          />
        </View>
      );
    },
  },
  {
    title: 'Font Weight',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            defaultValue="Font Weight (default)"
            style={[styles.singleLine]}
          />
          {[
            'normal',
            'bold',
            '900',
            800,
            '700',
            '600',
            '500',
            '400',
            '300',
            '200',
            '100',
          ].map(fontWeight => (
            <ExampleTextInput
              defaultValue={`Font Weight (${fontWeight})`}
              key={fontWeight}
              style={[styles.singleLine, {fontWeight}]}
            />
          ))}
        </View>
      );
    },
  },
  {
    title: 'Text input, themes and heights',
    render: function (): React.Node {
      return (
        <ExampleTextInput
          placeholder="If you set height, beware of padding set from themes"
          style={[styles.singleLineWithHeightTextInput]}
        />
      );
    },
  },
  {
    title: 'letterSpacing',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            style={[styles.singleLine, {letterSpacing: 0}]}
            placeholder="letterSpacing = 0"
          />
          <ExampleTextInput
            style={[styles.singleLine, {letterSpacing: 2}]}
            placeholder="letterSpacing = 2"
          />
          <ExampleTextInput
            style={[styles.singleLine, {letterSpacing: 9}]}
            placeholder="letterSpacing = 9"
          />
          <ExampleTextInput
            style={[styles.singleLine, {letterSpacing: -1}]}
            placeholder="letterSpacing = -1"
          />
        </View>
      );
    },
  },
  {
    title: 'Passwords',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            defaultValue="iloveturtles"
            secureTextEntry={true}
            style={styles.singleLine}
          />
          <ExampleTextInput
            secureTextEntry={true}
            style={[styles.singleLine, {color: 'red'}]}
            placeholder="color is supported too"
            placeholderTextColor="red"
          />
        </View>
      );
    },
  },
  {
    title: 'Editable',
    render: function (): React.Node {
      return (
        <ExampleTextInput
          defaultValue="Can't touch this! (>'-')> ^(' - ')^ <('-'<) (>'-')> ^(' - ')^"
          editable={false}
          style={styles.singleLine}
        />
      );
    },
  },
  {
    title: 'Multiline',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            autoCorrect={true}
            placeholder="multiline, aligned top-left"
            placeholderTextColor="red"
            multiline={true}
            style={[
              styles.multiline,
              {textAlign: 'left', textAlignVertical: 'top'},
            ]}
          />
          <ExampleTextInput
            autoCorrect={true}
            placeholder="multiline, aligned center"
            placeholderTextColor="green"
            multiline={true}
            style={[
              styles.multiline,
              {textAlign: 'center', textAlignVertical: 'center'},
            ]}
          />
          <ExampleTextInput
            autoCorrect={true}
            multiline={true}
            style={[
              styles.multiline,
              {color: 'blue'},
              {textAlign: 'right', textAlignVertical: 'bottom'},
            ]}>
            <Text style={styles.multiline}>
              multiline with children, aligned bottom-right
            </Text>
          </ExampleTextInput>
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
    title: 'Fixed number of lines',
    platform: 'android',
    render: function (): React.Node {
      return (
        <View style={styles.wrappedText}>
          <ExampleTextInput
            numberOfLines={2}
            multiline={true}
            placeholder="Two line input using numberOfLines prop"
          />
          <ExampleTextInput
            numberOfLines={5}
            multiline={true}
            placeholder="Five line input using numberOfLines prop"
          />
          <ExampleTextInput
            rows={2}
            multiline={true}
            placeholder="Two line input using rows prop"
          />
          <ExampleTextInput
            rows={5}
            multiline={true}
            placeholder="Five line input using rows prop"
          />
        </View>
      );
    },
  },
  {
    title: 'Auto-expanding',
    render: function (): React.Node {
      return (
        <View style={styles.wrappedText}>
          <AutogrowingTextInputExample
            enablesReturnKeyAutomatically={true}
            returnKeyType="done"
            multiline={true}
            style={{maxHeight: 400, minHeight: 20, backgroundColor: '#eeeeee'}}>
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
    title: 'Text Auto Complete',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput autoComplete="country" placeholder="country" />
          <ExampleTextInput
            autoComplete="postal-address-country"
            placeholder="postal-address-country"
          />
          <ExampleTextInput
            autoComplete="one-time-code"
            placeholder="one-time-code"
          />
          <ExampleTextInput autoComplete="sms-otp" placeholder="sms-otp" />
        </View>
      );
    },
  },
  {
    title: 'Return key',
    render: function (): React.Node {
      const returnKeyTypes = [
        'none',
        'go',
        'search',
        'send',
        'done',
        'previous',
        'next',
      ];
      const returnKeyLabels = ['Compile', 'React Native'];
      const returnKeyExamples = returnKeyTypes.map(type => {
        return (
          <ExampleTextInput
            key={type}
            returnKeyType={type}
            placeholder={'returnKeyType: ' + type}
            style={styles.singleLine}
          />
        );
      });
      const types = returnKeyLabels.map(type => {
        return (
          <ExampleTextInput
            key={type}
            returnKeyLabel={type}
            placeholder={'returnKeyLabel: ' + type}
            style={styles.singleLine}
          />
        );
      });
      return (
        <View>
          {returnKeyExamples}
          {types}
        </View>
      );
    },
  },
  {
    title: 'Inline Images',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            inlineImageLeft="ic_menu_black_24dp"
            placeholder="This has drawableLeft set"
            style={styles.singleLine}
          />
          <ExampleTextInput
            inlineImageLeft="ic_menu_black_24dp"
            inlineImagePadding={30}
            placeholder="This has drawableLeft and drawablePadding set"
            style={styles.singleLine}
          />
          <ExampleTextInput
            placeholder="This does not have drawable props set"
            style={styles.singleLine}
          />
        </View>
      );
    },
  },
  {
    title: 'Toggle Default Padding',
    render: function (): React.Node {
      return <ToggleDefaultPaddingExample />;
    },
  },
];

module.exports = ({
  displayName: (undefined: ?string),
  title: 'TextInput',
  documentationURL: 'https://reactnative.dev/docs/textinput',
  category: 'Basic',
  description: 'Single and multi-line text inputs.',
  examples,
}: RNTesterModule);
