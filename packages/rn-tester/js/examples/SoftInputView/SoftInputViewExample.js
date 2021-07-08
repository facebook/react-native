/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const React = require('react');
const {
  Button,
  ScrollView,
  SoftInputView,
  StyleSheet,
  Text,
  TextInput,
  View,
} = require('react-native');

const PRIMARY = 'rgb(100,200,250)';
const SECONDARY = 'rgb(240,120,160)';

const customInputNativeID = 'customSoftInputViewID';
const customInputHideOnFocusNativeID = 'customInputHideOnFocusNativeID';

type SoftInputProps = $ReadOnly<{||}>;
type SoftInputExampleState = $ReadOnly<{
  custom: ?boolean | null,
  text: string,
}>;
class SoftInputViewExample extends React.Component<
  SoftInputProps,
  SoftInputExampleState,
> {
  state = {
    custom: null,
    text: '',
  };
  render() {
    return (
      <>
        <View style={styles.fill}>
          <ScrollView style={styles.fill} keyboardDismissMode="interactive">
            <View style={styles.textInputContainer}>
              <Text style={styles.text}>Default input</Text>
              <TextInput
                onChangeText={newText => this.setState({text: newText})}
                placeholder="Default input"
                style={styles.textInput}
                value={this.state.text}
              />
            </View>
            <View style={styles.textInputContainer}>
              <Text style={styles.text}>Custom input</Text>
              <TextInput
                showSoftInputOnFocus={true}
                softInputViewID={customInputNativeID}
                style={styles.textInput}
                value={String(this.state.custom)}
              />
            </View>
            <View style={styles.textInputContainer}>
              <Text style={styles.text}>
                Custom input without soft input on focus
              </Text>
              <TextInput
                showSoftInputOnFocus={false}
                softInputViewID={customInputHideOnFocusNativeID}
                style={styles.textInput}
                value={String(this.state.custom)}
              />
            </View>
          </ScrollView>
          <SoftInputView nativeID={customInputNativeID}>
            <View style={styles.softInputContainer}>
              {[null, false, true].map(value => (
                <Button
                  color={this.state.custom === value ? SECONDARY : PRIMARY}
                  key={String(value)}
                  onPress={() => this.setState({custom: value})}
                  title={String(value)}
                />
              ))}
            </View>
          </SoftInputView>
          <SoftInputView nativeID={customInputHideOnFocusNativeID}>
            <View style={styles.softInputContainer}>
              {[null, false, true].map(value => (
                <Button
                  color={this.state.custom === value ? SECONDARY : PRIMARY}
                  key={String(value)}
                  onPress={() => this.setState({custom: value})}
                  title={String(value)}
                />
              ))}
            </View>
          </SoftInputView>
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  softInputContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: SECONDARY,
    flex: 1,
    justifyContent: 'center',
    minWidth: 200,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100,200,250,0.6)',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 60,
  },
  textInput: {
    alignSelf: 'stretch',
    color: SECONDARY,
    flex: 1,
    paddingLeft: 10,
  },
  text: {
    padding: 10,
    color: 'white',
  },
});

exports.title = 'SoftInputView';
exports.description = 'Example showing how to use an SoftInputView';
exports.examples = [
  {
    title: 'Simple view with non-text soft input',
    render: function(): React.Node {
      return <SoftInputViewExample />;
    },
  },
];
