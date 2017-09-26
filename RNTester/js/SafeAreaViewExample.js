/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 * @providesModule SafeAreaViewExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {Button, Modal, SafeAreaView, StyleSheet, View} = ReactNative;

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = '<SafeAreaView>';
exports.description =
  'SafeAreaView automatically applies paddings reflect the portion of the view that is not covered by other (special) ancestor views.';

class SafeAreaViewExample extends React.Component<
  {},
  {|modalVisible: boolean|},
> {
  state = {
    modalVisible: false,
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
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.safeAreaContent}>
                <Button
                  onPress={this._setModalVisible.bind(this, false)}
                  title="Close"
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>
        <Button
          onPress={this._setModalVisible.bind(this, true)}
          title="Present Modal Screen with SafeAreaView"
        />
      </View>
    );
  }
}

exports.examples = [
  {
    title: 'SafeAreaViewExample',
    description:
      'SafeAreaView automatically applies paddings reflect the portion of the view that is not covered by other (special) ancestor views.',
    render: () => <SafeAreaViewExample />,
  },
];

var styles = StyleSheet.create({
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
