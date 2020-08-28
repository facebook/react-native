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
import type {RNTesterBookmark} from './RNTesterBookmark.js';

const RNTesterActions = require('../utils/RNTesterActions');
const RNTesterExampleFilter = require('./RNTesterExampleFilter');
const RNTesterComponentTitle = require('./RNTesterComponentTitle');
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

import type {ViewStyleProp} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {RNTesterExample} from '../types/RNTesterTypes';
import {RNTesterThemeContext} from './RNTesterTheme';
import {RNTesterBookmarkContext} from './RNTesterBookmark';

type Props = {
  screen: string,
  onNavigate: Function,
  updateRecentlyViewedList: Function,
  recentApis: Array<RNTesterExample>,
  recentComponents: Array<RNTesterExample>,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
    ...
  },
  style?: ?ViewStyleProp,
  ...
};

type State = {
  components: Array<RNTesterExample>,
  api: Array<RNTesterExample>,
  recentComponents: Array<RNTesterExample>,
  recentApis: Array<RNTesterExample>,
  updateRecentlyViewedList: Function,
};

type ButtonState = {active: boolean, key: string, ...};
type ButtonProps = {
  item: Object,
  section: Object,
  active: boolean,
  onNavigate: Function,
  onPress?: Function,
  onShowUnderlay?: Function,
  onHideUnderlay?: Function,
  updateRecentlyViewedList: Function,
  ...
};

class RowComponent extends React.PureComponent<ButtonProps, ButtonState> {
  static contextType = RNTesterBookmarkContext;

  constructor(props: ButtonProps) {
    super(props);
    this.state = {
      active: props.active,
      title: props.item.module.title,
      key: props.section.key,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.active !== prevState.active) {
      return {active: nextProps.active};
    }
    return null;
  }

  onButtonPress = () => {
    let bookmark = this.context;
    if (!this.state.active) {
      if (this.state.key === 'APIS' || this.state.key === 'RECENT_APIS') {
        bookmark.AddApi(this.props.item.module.title, this.props.item);
      } else {
        bookmark.AddComponent(this.props.item.module.title, this.props.item);
      }
    } else {
      if (this.state.key === 'APIS' || this.state.key === 'RECENT_APIS') {
        bookmark.RemoveApi(this.props.item.module.title);
      } else {
        bookmark.RemoveComponent(this.props.item.module.title);
      }
    }
    this.setState({
      active: !this.state.active,
    });
  };

  _onPress = () => {
    this.props.updateRecentlyViewedList();
    if (this.props.onPress) {
      this.props.onPress();
      return;
    }
    this.props.onNavigate(RNTesterActions.ExampleAction(this.props.item.key));
  };
  render() {
    const {item} = this.props;
    const platform = item.module.platform;
    const onIos = !platform || platform === 'ios';
    const onAndroid = !platform || platform === 'android';
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
              style={styles.listItem}
              underlayColor={'rgb(242,242,242)'}
              onPress={this._onPress}>
              <View
                style={[
                  styles.row,
                  {backgroundColor: theme.SystemBackgroundColor},
                ]}>
                <View style={styles.topRowStyle}>
                  <RNTesterComponentTitle>
                    {item.module.title}
                  </RNTesterComponentTitle>
                  <TouchableHighlight
                    style={styles.imageViewStyle}
                    onPress={() => this.onButtonPress()}>
                    <Image
                      style={styles.imageStyle}
                      source={
                        this.state.active
                          ? require('../assets/bookmark-outline-blue.png')
                          : require('../assets/bookmark-outline-gray.png')
                      }
                    />
                  </TouchableHighlight>
                </View>
                <Text
                  style={[
                    styles.rowDetailText,
                    {color: theme.SecondaryLabelColor, marginBottom: 5},
                  ]}>
                  {item.module.description}
                </Text>
                <View style={styles.bottomRowStyle}>
                  <Text style={{color: theme.SecondaryLabelColor, width: 65}}>
                    {item.module.category || 'Other'}
                  </Text>
                  <View style={styles.platformLabelStyle}>
                    <Text
                      style={{
                        color: onIos ? '#787878' : theme.SeparatorColor,
                        fontWeight: onIos ? '500' : '300',
                      }}>
                      iOS
                    </Text>
                    <Text
                      style={{
                        color: onAndroid ? '#787878' : theme.SeparatorColor,
                        fontWeight: onAndroid ? '500' : '300',
                      }}>
                      Android
                    </Text>
                  </View>
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

class RNTesterExampleList extends React.Component<Props, State> {
  static contextType: React.Context<RNTesterBookmark> = RNTesterBookmarkContext;

  constructor(props: Props) {
    super(props);
    this.state = {
      components: props.list.ComponentExamples,
      api: props.list.APIExamples,
      recentComponents: props.recentComponents,
      recentApis: props.recentApis,
      updateRecentlyViewedList: (item, key) =>
        props.updateRecentlyViewedList(item, key),
    };
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State): State {
    if (
      nextProps.recentComponents.every(
        (component, index) => component !== prevState.recentComponents[index],
      ) &&
      nextProps.recentApis.every(
        (api, index) => api !== prevState.recentApis[index],
      )
    ) {
      return {
        ...prevState,
        recentComponents: nextProps.recentComponents,
        recentApis: nextProps.recentApis,
      };
    }
    return prevState;
  }

  render(): React.Node {
    const bookmark = this.context;
    const filter = ({example, filterRegex, category}) =>
      filterRegex.test(example.module.title) &&
      (!category || example.module.category === category) &&
      (!Platform.isTV || example.supportsTVOS);

    const {screen} = this.props;
    let sections = [];

    if (screen === 'component') {
      if (this.state.recentComponents.length > 0) {
        sections = [
          {
            data: this.state.recentComponents,
            key: 'RECENT_COMPONENTS',
            title: 'Recently viewed',
          },
          {
            data: this.state.components,
            key: 'COMPONENTS',
            title: 'Components',
          },
        ];
      } else {
        sections = [
          {
            data: this.state.components,
            key: 'COMPONENTS',
            title: 'Components',
          },
        ];
      }
    } else if (screen === 'api') {
      if (this.state.recentApis.length > 0) {
        sections = [
          {
            data: this.state.recentApis,
            key: 'RECENT_APIS',
            title: 'Recently viewed',
          },
          {
            data: this.state.api,
            key: 'APIS',
            title: 'APIS',
          },
        ];
      } else {
        sections = [
          {
            data: this.state.api,
            key: 'APIS',
            title: 'APIS',
          },
        ];
      }
    } else if (screen === 'bookmark') {
      sections = [
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
    } else {
      sections = [];
    }

    const isEmpty = sections.filter(s => s.data.length).length === 0;

    if (isEmpty) {
      return <EmptyState />;
    }

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
                page="components_page"
                // $FlowFixMe
                sections={sections}
                filter={filter}
                render={({filteredSections}) => (
                  <SectionList
                    sections={filteredSections}
                    extraData={filteredSections}
                    renderItem={this._renderItem}
                    ItemSeparatorComponent={ItemSeparator}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustContentInsets={false}
                    keyboardDismissMode="on-drag"
                    renderSectionHeader={renderSectionHeader}
                    ListFooterComponent={() => <View style={{height: 200}} />}
                  />
                )}
              />
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }

  _renderItem = ({item, section, separators, index}) => {
    let bookmark = this.context;
    return (
      <RowComponent
        item={item}
        section={section}
        active={!bookmark.checkBookmark(item.module.title, section.key)}
        onNavigate={this.props.onNavigate}
        onShowUnderlay={separators.highlight}
        onHideUnderlay={separators.unhighlight}
        updateRecentlyViewedList={() =>
          this.state.updateRecentlyViewedList(item, section.key)
        }
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

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyContainerInner}>
      <Image
        source={require('../assets/empty.png')}
        resizeMode="contain"
        style={styles.emptyImage}
      />
      <View>
        <Text style={styles.heading}>Bookmarks are empty</Text>
        <Text style={styles.subheading}>
          Please tap the{' '}
          <Image
            source={require('../assets/bookmark-outline-gray.png')}
            resizeMode="contain"
            style={styles.bookmarkIcon}
          />{' '}
          icon to bookmark examples.
        </Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listItem: {
    backgroundColor: Platform.select({ios: '#FFFFFF', android: '#F3F8FF'}),
  },
  sectionHeader: {
    padding: 5,
    fontWeight: '500',
    fontSize: 11,
  },
  row: {
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginVertical: Platform.select({ios: 4, android: 8}),
    marginHorizontal: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  separator: {
    height: Platform.select({ios: StyleSheet.hairlineWidth, android: 0}),
    marginHorizontal: Platform.select({ios: 15, android: 0}),
  },
  separatorHighlighted: {
    height: StyleSheet.hairlineWidth,
  },
  topRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  bottomRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowDetailText: {
    fontSize: 12,
    lineHeight: 20,
  },
  imageViewStyle: {
    height: 30,
    width: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    bottom: 5,
  },
  imageStyle: {
    height: 25,
    width: 25,
  },
  platformLabelStyle: {
    flexDirection: 'row',
    width: 100,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  emptyContainerInner: {
    marginTop: -150,
  },
  emptyImage: {
    maxWidth: '100%',
    height: 300,
  },
  heading: {
    fontSize: 24,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    textAlign: 'center',
  },
  bookmarkIcon: {
    width: 24,
    height: 24,
    transform: [{translateY: 4}],
  },
});

module.exports = RNTesterExampleList;
