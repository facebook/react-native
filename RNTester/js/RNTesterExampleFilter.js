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

import Platform from '../../Libraries/Utilities/Platform'; // TODO(macOS ISS#2323203)
const React = require('react');
const {StyleSheet, TextInput, View} = require('react-native');

type Props = {
  filter: Function,
  render: Function,
  sections: Object,
  disableSearch?: boolean,
  testID?: string,
};

type State = {
  filter: string,
};

class RNTesterExampleFilter extends React.Component<Props, State> {
  state = {filter: ''};

  render() {
    const filterText = this.state.filter;
    let filterRegex = /.*/;

    try {
      filterRegex = new RegExp(String(filterText), 'i');
    } catch (error) {
      console.warn(
        'Failed to create RegExp: %s\n%s',
        filterText,
        error.message,
      );
    }

    const filter = example =>
      this.props.disableSearch || this.props.filter({example, filterRegex});

    const filteredSections = this.props.sections.map(section => ({
      ...section,
      data: section.data.filter(filter),
    }));

    return (
      <View style={styles.container}>
        {this._renderTextInput()}
        {this.props.render({filteredSections})}
      </View>
    );
  }

  _renderTextInput(): ?React.Element<any> {
    if (this.props.disableSearch) {
      return null;
    }
    return (
      <View style={styles.searchRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="always"
          onChangeText={text => {
            this.setState(() => ({filter: text}));
          }}
          placeholder="Search..."
          placeholderTextColor={
            Platform.select({
              macos: {semantic: 'placeholderTextColor'},
              ios: {semantic: 'placeholderTextColor'},
              default: undefined,
            }) /*TODO(macOS ISS#2323203)*/
          }
          underlineColorAndroid="transparent"
          style={styles.searchTextInput}
          testID={this.props.testID}
          value={this.state.filter}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  searchRow: {
    // [TODO(macOS ISS#2323203)
    ...Platform.select({
      macos: {
        backgroundColor: {semantic: 'windowBackgroundColor'},
      },
      ios: {
        backgroundColor: {semantic: 'systemGroupedBackgroundColor'},
      },
      default: {
        // ]TODO(macOS ISS#2323203)
        backgroundColor: '#eeeeee',
      }, // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    padding: 10,
  },
  searchTextInput: {
    // [TODO(macOS ISS#2323203)
    ...Platform.select({
      macos: {
        color: {semantic: 'textColor'},
        backgroundColor: {semantic: 'textBackgroundColor'},
        borderColor: {semantic: 'quaternaryLabelColor'},
      },
      ios: {
        color: {semantic: 'labelColor'},
        backgroundColor: {semantic: 'secondarySystemGroupedBackgroundColor'},
        borderColor: {semantic: 'quaternaryLabelColor'},
      },
      default: {
        // ]TODO(macOS ISS#2323203)
        backgroundColor: 'white',
        borderColor: '#cccccc',
      }, // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 8,
    paddingVertical: 0,
    height: 35,
  },
  container: {
    flex: 1,
  },
});

module.exports = RNTesterExampleFilter;
