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

const RNTesterActions = require('../utils/RNTesterActions');
const RNTesterExampleFilter = require('./RNTesterExampleFilter');
const React = require('react');

const {
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = require('react-native');

import type {ViewStyleProp} from '../../../Libraries/StyleSheet/StyleSheet';
import type {RNTesterExample} from '../types/RNTesterTypes';

import {RNTesterThemeContext} from './RNTesterTheme';

type Props = {
  onNavigate: Function,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
    ...
  },
  style?: ?ViewStyleProp,
  ...
};

class RowComponent extends React.PureComponent<{
  item: Object,
  onNavigate: Function,
  onPress?: Function,
  onShowUnderlay?: Function,
  onHideUnderlay?: Function,
  ...
}> {
  _onPress = () => {
    if (this.props.onPress) {
      this.props.onPress();
      return;
    }
    this.props.onNavigate(RNTesterActions.ExampleAction(this.props.item.key));
  };
  render() {
    const {item} = this.props;
    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <TouchableHighlight
              onShowUnderlay={this.props.onShowUnderlay}
              onHideUnderlay={this.props.onHideUnderlay}
              onPress={this._onPress}>
              <View
                style={[
                  styles.row,
                  {backgroundColor: theme.SystemBackgroundColor},
                ]}>
                <Text style={[styles.rowTitleText, {color: theme.LabelColor}]}>
                  {item.module.title}
                </Text>
                <Text
                  style={[
                    styles.rowDetailText,
                    {color: theme.SecondaryLabelColor},
                  ]}>
                  {item.module.description}
                </Text>
              </View>
            </TouchableHighlight>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const renderSectionHeader = ({section}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <Text
          style={[
            styles.sectionHeader,
            {
              color: theme.SecondaryLabelColor,
              backgroundColor: theme.GroupedBackgroundColor,
            },
          ]}>
          {section.title}
        </Text>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

class RNTesterExampleList extends React.Component<Props, $FlowFixMeState> {
  render(): React.Node {
    const filter = ({example, filterRegex}) =>
      filterRegex.test(example.module.title) &&
      (!Platform.isTV || example.supportsTVOS);

    const sections = [
      {
        data: this.props.list.ComponentExamples,
        title: 'COMPONENTS',
        key: 'c',
      },
      {
        data: this.props.list.APIExamples,
        title: 'APIS',
        key: 'a',
      },
    ];

    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <View
              style={[
                styles.listContainer,
                this.props.style,
                {backgroundColor: theme.SecondaryGroupedBackgroundColor},
              ]}>
              {this._renderTitleRow()}
              <RNTesterExampleFilter
                testID="explorer_search"
                sections={sections}
                filter={filter}
                render={({filteredSections}) => (
                  <SectionList
                    ItemSeparatorComponent={ItemSeparator}
                    contentContainerStyle={{
                      backgroundColor: theme.SeparatorColor,
                    }}
                    style={{backgroundColor: theme.SystemBackgroundColor}}
                    sections={filteredSections}
                    renderItem={this._renderItem}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustContentInsets={false}
                    keyboardDismissMode="on-drag"
                    renderSectionHeader={renderSectionHeader}
                  />
                )}
              />
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }

  _renderItem = ({item, separators}) => (
    <RowComponent
      item={item}
      onNavigate={this.props.onNavigate}
      onShowUnderlay={separators.highlight}
      onHideUnderlay={separators.unhighlight}
    />
  );

  _renderTitleRow(): ?React.Element<any> {
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
    if (!this.props.displayTitleRow) {
      return null;
    }
    return (
      <RowComponent
        item={{
          module: {
            title: 'RNTester',
            description: 'React Native Examples',
          },
        }}
        onNavigate={this.props.onNavigate}
        onPress={() => {
          this.props.onNavigate(RNTesterActions.ExampleList());
        }}
      />
    );
  }

  _handleRowPress(exampleKey: string): void {
    this.props.onNavigate(RNTesterActions.ExampleAction(exampleKey));
  }
}

const ItemSeparator = ({highlighted}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View
          style={
            highlighted
              ? [
                  styles.separatorHighlighted,
                  {backgroundColor: theme.OpaqueSeparatorColor},
                ]
              : [styles.separator, {backgroundColor: theme.SeparatorColor}]
          }
        />
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  sectionHeader: {
    padding: 5,
    fontWeight: '500',
    fontSize: 11,
  },
  row: {
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 15,
  },
  separatorHighlighted: {
    height: StyleSheet.hairlineWidth,
  },
  rowTitleText: {
    fontSize: 17,
    fontWeight: '500',
  },
  rowDetailText: {
    fontSize: 15,
    lineHeight: 20,
  },
});

module.exports = RNTesterExampleList;
