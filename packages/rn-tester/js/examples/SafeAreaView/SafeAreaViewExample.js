/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  Modal,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} = require('react-native');

class SafeAreaViewExample extends React.Component<
  {...},
  {|
    modalVisible: boolean,
    emulateUnlessSupported: boolean,
  |},
> {
  state = {
    modalVisible: false,
    emulateUnlessSupported: true,
  };

  _setModalVisible = visible => {
    this.setState({modalVisible: visible});
  };

  render() {
    return (
      <View>
        <Modal
          visible={this.state.modalVisible}
          onRequestClose={() => this._setModalVisible(false)}
          animationType="slide"
          supportedOrientations={['portrait', 'landscape']}>
          <View style={styles.modal}>
            <SafeAreaView
              style={styles.safeArea}
              emulateUnlessSupported={this.state.emulateUnlessSupported}>
              <View style={styles.safeAreaContent}>
                <Button
                  onPress={this._setModalVisible.bind(this, false)}
                  title="Close"
                />
                <Text>emulateUnlessSupported:</Text>
                <Switch
                  onValueChange={value =>
                    this.setState({emulateUnlessSupported: value})
                  }
                  value={this.state.emulateUnlessSupported}
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>
        <Button
          onPress={this._setModalVisible.bind(this, true)}
          title="Present Modal Screen with SafeAreaView"
        />
        <Text>emulateUnlessSupported:</Text>
        <Switch
          onValueChange={value =>
            this.setState({emulateUnlessSupported: value})
          }
          value={this.state.emulateUnlessSupported}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    height: 1000,
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: '#ffaaaa',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = 'SafeAreaView';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/safeareaview';
exports.description =
  'SafeAreaView automatically applies paddings reflect the portion of the view that is not covered by other (special) ancestor views.';
exports.examples = [
  {
    title: '<SafeAreaView> Example',
    description:
      'SafeAreaView automatically applies paddings reflect the portion of the view that is not covered by other (special) ancestor views.',
    render: (): React.Node => <SafeAreaViewExample />,
  },
];
