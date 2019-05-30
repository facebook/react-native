/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {
  KeyboardAvoidingView,
  Modal,
  SegmentedControlIOS,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = require('react-native');

const RNTesterBlock = require('../../components/RNTesterBlock');
const RNTesterPage = require('../../components/RNTesterPage');

type Props = $ReadOnly<{||}>;
type State = {|
  behavior: string,
  modalOpen: boolean,
|};

class KeyboardAvoidingViewExample extends React.Component<Props, State> {
  state = {
    behavior: 'padding',
    modalOpen: false,
  };

  onSegmentChange = (segment: String) => {
    this.setState({behavior: segment.toLowerCase()});
  };

  renderExample = () => {
    return (
      <View style={styles.outerContainer}>
        <Modal animationType="fade" visible={this.state.modalOpen}>
          <KeyboardAvoidingView
            behavior={this.state.behavior}
            style={styles.container}>
            <SegmentedControlIOS
              onValueChange={this.onSegmentChange}
              selectedIndex={this.state.behavior === 'padding' ? 0 : 1}
              style={styles.segment}
              values={['Padding', 'Position']}
            />
            <TextInput placeholder="<TextInput />" style={styles.textInput} />
          </KeyboardAvoidingView>
          <TouchableHighlight
            onPress={() => this.setState({modalOpen: false})}
            style={styles.closeButton}>
            <Text>Close</Text>
          </TouchableHighlight>
        </Modal>

        <TouchableHighlight onPress={() => this.setState({modalOpen: true})}>
          <Text>Open Example</Text>
        </TouchableHighlight>
      </View>
    );
  };

  render() {
    return (
      <RNTesterPage title="Keyboard Avoiding View">
        <RNTesterBlock title="Keyboard-avoiding views move out of the way of the keyboard.">
          {this.renderExample()}
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  textInput: {
    borderRadius: 5,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 10,
  },
  segment: {
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    left: 10,
  },
});

exports.title = '<KeyboardAvoidingView>';
exports.description =
  'Base component for views that automatically adjust their height or position to move out of the way of the keyboard.';
exports.examples = [
  {
    title: 'Simple keyboard view',
    render: function(): React.Element<typeof KeyboardAvoidingViewExample> {
      return <KeyboardAvoidingViewExample />;
    },
  },
];
