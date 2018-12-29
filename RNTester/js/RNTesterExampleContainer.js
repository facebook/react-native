/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

import type {RNTesterExampleModule} from './Shared/RNTesterTypes';

const React = require('react');
const {Platform, StyleSheet, View, TextInput} = require('react-native');
const RNTesterBlock = require('./RNTesterBlock');
const RNTesterPage = require('./RNTesterPage');

type Props = $ReadOnly<{|
  module: RNTesterExampleModule,
|}>;

type State = {|
  filterText: string,
|};

class RNTesterExampleContainer extends React.Component<Props, State> {
  state = {filterText: ''};

  renderExample(example, i) {
    // Filter platform-specific examples
    const {description, platform} = example;
    let {title} = example;
    if (platform) {
      if (Platform.OS !== platform) {
        return null;
      }
      title += ' (' + platform + ' only)';
    }
    return (
      <RNTesterBlock key={i} title={title} description={description}>
        {example.render()}
      </RNTesterBlock>
    );
  }

  renderExamples() {
    const {module} = this.props;
    const {filterText} = this.state;
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

    const filter = example => filterRegex.test(example.title);

    return module.examples.filter(filter).map(this.renderExample);
  }

  renderFilter() {
    const {filterText} = this.state;

    return (
      <View style={styles.searchRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="always"
          onChangeText={text => {
            this.setState(() => ({filterText: text}));
          }}
          placeholder="Search..."
          underlineColorAndroid="transparent"
          style={styles.searchTextInput}
          testID="explorer_example_search"
          value={filterText}
        />
      </View>
    );
  }

  render(): React.Element<any> {
    if (!this.props.module.examples) {
      return <this.props.module />;
    }

    if (this.props.module.examples.length === 1) {
      const Example = this.props.module.examples[0].render;
      return <Example />;
    }

    return (
      <RNTesterPage title={this.props.title}>
        {this.renderFilter()}
        {this.renderExamples()}
      </RNTesterPage>
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

module.exports = RNTesterExampleContainer;
