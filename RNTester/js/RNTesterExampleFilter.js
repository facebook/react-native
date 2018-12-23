/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const Platform = require('Platform');
const React = require('react');
const StyleSheet = require('StyleSheet');
const TextInput = require('TextInput');
const View = require('View');

import type {RNTesterExample} from './RNTesterList.ios';

type Props = {
  render: Function,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
  },
};

class RNTesterExampleFilter extends React.Component<Props, $FlowFixMeState> {
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
      /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.68 was deployed. To see the error delete this
       * comment and run Flow. */
      this.props.disableSearch ||
      (filterRegex.test(example.module.title) &&
        (!Platform.isTV || example.supportsTVOS));

    const filteredSections = this.props.sections.map(section => ({
      ...section,
      data: section.data.filter(filter),
    }));

    return (
      <View>
        {this._renderTextInput()}
        {this.props.render({filteredSections})}
      </View>
    );
  }

  _renderTextInput(): ?React.Element<any> {
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
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
          underlineColorAndroid="transparent"
          style={styles.searchTextInput}
          testID="explorer_search"
          value={this.state.filter}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  searchRow: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  searchTextInput: {
    backgroundColor: 'white',
    borderColor: '#cccccc',
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 8,
    paddingVertical: 0,
    height: 35,
  },
});

module.exports = RNTesterExampleFilter;
