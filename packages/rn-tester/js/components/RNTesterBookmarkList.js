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
  Image,
  View,
} = require('react-native');

import type {ViewStyleProp} from 'react-native';
import type {RNTesterExample} from '../types/RNTesterTypes';

import {RNTesterThemeContext} from './RNTesterTheme';
import {RNTesterBookmarkContext} from './RNTesterBookmark';

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

type ButtonState = {|active: boolean|};
type ButtonProps = {
  item: Object,
  section: Object,
  active: Boolean,
  onNavigate: Function,
  onPress?: Function,
  onShowUnderlay?: Function,
  onHideUnderlay?: Function,
  ...
};

function PlatformLogoContainer({platform}): React.Component {
  return (
    <View style={{flexDirection: 'row'}}>
      {(!platform || platform === 'ios') && (
        <Image
          style={styles.platformLogoStyle}
          source={require('../assets/apple.png')}
        />
      )}
      {(!platform || platform === 'android') && (
        <Image
          style={styles.platformLogoStyle}
          source={require('../assets/android.png')}
        />
      )}
    </View>
  );
}

class RowComponent extends React.PureComponent<ButtonProps, ButtonState> {
  static contextType = RNTesterBookmarkContext;

  constructor(props: ButtonProps) {
    super(props);
    this.state = {
      active: props.active,
      title: props.item.title,
      key: props.section.key,
    };
  }

  onButtonPress = () => {
    let bookmark = this.context;
    this.setState({
      active: !this.state.active,
    });
    if (!this.state.active) {
      if (this.state.key === 'APIS') {
        bookmark.AddApi(this.props.item.module.title, this.props.item);
      } else {
        bookmark.AddComponent(this.props.item.module.title, this.props.item);
      }
    } else {
      if (this.state.key === 'APIS') {
        bookmark.RemoveApi(this.props.item.module.title);
      } else {
        bookmark.RemoveComponent(this.props.item.module.title);
      }
    }
  };

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
              accessibilityLabel={
                item.module.title + ' ' + item.module.description
              }
              onPress={this._onPress}>
              <View
                style={[
                  styles.row,
                  {backgroundColor: theme.SystemBackgroundColor},
                ]}>
                <View style={styles.rowTextContent}>
                  <Text
                    style={[styles.rowTitleText, {color: theme.LabelColor}]}>
                    {item.module.title}
                  </Text>
                  <View style={{flexDirection: 'row', marginBottom: 5}}>
                    <Text style={{color: 'blue'}}>Category: </Text>
                    <Text>{item.module.category || 'Components/Basic'}</Text>
                  </View>
                  <Text
                    style={[
                      styles.rowDetailText,
                      {color: theme.SecondaryLabelColor},
                    ]}>
                    {item.module.description}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 0.15,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <TouchableHighlight
                    style={styles.imageViewStyle}
                    onPress={() => this.onButtonPress()}>
                    <Image
                      style={styles.imageStyle}
                      source={
                        this.state.active
                          ? require('../assets/bookmark-filled.png')
                          : require('../assets/bookmark-outline.png')
                      }
                    />
                  </TouchableHighlight>
                  <PlatformLogoContainer platform={item.module.platform} />
                </View>
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

class RNTesterBookmarkList extends React.Component<Props, $FlowFixMeState> {
  static contextType = RNTesterBookmarkContext;
  render(): React.Node {
    const bookmark = this.context;
    const filter = ({example, filterRegex}) => {
      return (
        filterRegex.test(example.module.title) &&
        (!Platform.isTV || example.supportsTVOS)
      );
    };
    const sections = [
      {
        data: Object.values(bookmark.Components),
        title: 'COMPONENTS',
        key: 'COMPONENTS',
      },
      {
        data: Object.values(bookmark.Api),
        title: 'APIS',
        key: 'APIS',
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
              <RNTesterExampleFilter
                testID="explorer_search"
                page="bookmarks_page"
                sections={sections}
                filter={filter}
                hideFilterPills
                render={({filteredSections}) => (
                  <SectionList
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

  _renderItem = ({item, section, separators}) => {
    let bookmark = this.context;
    return (
      <RowComponent
        item={item}
        section={section}
        active={!bookmark.checkBookmark(item.module.title, section.key)}
        onNavigate={this.props.onNavigate}
        onShowUnderlay={separators.highlight}
        onHideUnderlay={separators.unhighlight}
      />
    );
  };

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
    marginVertical: 4,
    marginHorizontal: 15,
    flexDirection: 'row',
    borderColor: 'blue',
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowTextContent: {
    flex: 0.8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 15,
  },
  separatorHighlighted: {
    height: StyleSheet.hairlineWidth,
  },
  rowTitleText: {
    fontSize: 20,
    fontWeight: '300',
    fontFamily: 'Times New Roman',
    marginBottom: 10,
  },
  rowDetailText: {
    fontSize: 12,
    lineHeight: 20,
  },
  imageStyle: {
    height: 25,
    width: 25,
  },
  imageViewStyle: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformLogoStyle: {
    height: 35,
    width: 30,
    position: 'relative',
    top: 20,
  },
});

module.exports = RNTesterBookmarkList;
