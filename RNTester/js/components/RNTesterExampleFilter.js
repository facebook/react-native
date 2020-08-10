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
const RNTesterListFilters = require('./RNTesterListFilters');
const {StyleSheet, TextInput, View, ScrollView} = require('react-native');
import {RNTesterThemeContext} from './RNTesterTheme';

type Props = {
  filter: Function,
  render: Function,
  sections: Object,
  disableSearch?: boolean,
  testID?: string,
  hideFilterPills?: boolean,
  page: string, // possible values -> examples_page, components_page, bookmarks_page
  ...
};

type State = {filter: string, category: string, ...};

class RNTesterExampleFilter extends React.Component<Props, State> {
  state: State = {filter: '', category: ''};

  render(): React.Node {
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

    const filter = example => {
      const category = this.state.category;
      return (
        this.props.disableSearch ||
        this.props.filter({example, filterRegex, category})
      );
    };

    let filteredSections = this.props.sections.map(section => ({
      ...section,
      data: section.data.filter(filter),
    }));

    if(this.state.filter.trim() !== '' || this.state.category.trim() !== '') {
      filteredSections = filteredSections.filter(section => section.title !== 'Recently viewed');
    }

    return (
      <View style={styles.container}>
        {this._renderTextInput()}
        {this._renderFilteredSections(filteredSections)}
      </View>
    );
  }

  _renderFilteredSections(filteredSections): ?React.Element<any> {
    if (this.props.page === 'examples_page') {
      return (
        <ScrollView>
          {this.props.render({filteredSections})}
          {/**
           * This is a fake list item. It is needed to provide the ScrollView some bottom padding.
           * The height of this item is basically ScreenHeight - the height of (Header + bottom navbar)
           * */}
          <View style={{height: 280}} />
        </ScrollView>
      );
    } else {
      return this.props.render({filteredSections});
    }
  }

  _renderTextInput(): ?React.Element<any> {
    if (this.props.disableSearch) {
      return null;
    }
    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <View style={[styles.searchRow, {backgroundColor: '#F3F8FF'}]}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="always"
                onChangeText={text => {
                  this.setState(() => ({filter: text}));
                }}
                placeholder="Search..."
                placeholderTextColor={theme.PlaceholderTextColor}
                underlineColorAndroid="transparent"
                style={[
                  styles.searchTextInput,
                  {
                    color: theme.LabelColor,
                    backgroundColor: theme.SecondaryGroupedBackgroundColor,
                    borderColor: theme.QuaternaryLabelColor,
                  },
                ]}
                testID={this.props.testID}
                value={this.state.filter}
              />
              {!this.props.hideFilterPills && (
                <RNTesterListFilters
                  onFilterButtonPress={filterLabel =>
                    this.setState({category: filterLabel})
                  }
                />
              )}
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  searchRow: {
    padding: 10,
  },
  searchTextInput: {
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
