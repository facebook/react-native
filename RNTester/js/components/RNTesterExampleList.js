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
const RNTesterComponentTitle = require('./RNTesterComponentTitle');
const RNTesterBookmarkButton = require('./RNTesterBookmarkButton');
const React = require('react');

import {AsyncStorage} from 'react-native';

const {
  Platform,
  SectionList,
  StyleSheet,
  Text,
  Button,
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
  updateSectionsList?: Function,
  ...
};

const PlatformLogoContainer = ({platform}: PlatformLogoPropsType) => {
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
    this.setState({
      active: !this.state.active,
    });
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
  };

  _onPress = () => {
    this.props.updateSectionsList();
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
              underlayColor={'rgb(242,242,242)'}
              onPress={this._onPress}>
              <View
                style={[
                  styles.row,
                  {backgroundColor: theme.SystemBackgroundColor},
                ]}>
                <View style={styles.rowTextContent}>
                  <RNTesterComponentTitle>
                    {item.module.title}
                  </RNTesterComponentTitle>

                  <View style={{flexDirection: 'row', marginBottom: 5}}>
                    <Text style={{color: 'blue'}}>Category: </Text>
                    <Text>{item.category || 'Components/Basic'}</Text>
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

class RNTesterExampleList extends React.Component<Props, $FlowFixMeState> {
  static contextType = RNTesterBookmarkContext;

  constructor(props) {
    super(props);
    this.state = {
      components: props.list.ComponentExamples,
      api: props.list.APIExamples,
      recentComponents: [],
      recentApis: [],
    };
  }

  componentDidMount() {
    AsyncStorage.getItem('RecentComponents', (err, storedString) => {
      if (err || !storedString) {
        return;
      }
      const recentComponents = JSON.parse(storedString);
      this.setState({
        recentComponents: recentComponents,
      });
    });
    AsyncStorage.getItem('RecentApi', (err, storedString) => {
      if (err || !storedString) {
        return;
      }
      const recentApis = JSON.parse(storedString);
      this.setState({
        recentApis: recentApis,
      });
    });
  }

  updateSectionsList = (index, key) => {
    if (key === 'Components') {
      let openedItem = this.state.components[index];
      let componentsCopy = [...this.state.recentComponents];
      const ind = componentsCopy.findIndex(component => component.key === openedItem.key);
      if(ind != -1) {
        componentsCopy.splice(ind, 1);
      }
      if (this.state.recentComponents.length >= 5) {
        componentsCopy.pop();
      }
      componentsCopy.unshift(openedItem);
      AsyncStorage.setItem('RecentComponents', JSON.stringify(componentsCopy));
    } else {
      let openedItem = this.state.api[index];
      let apisCopy = [...this.state.recentApis];
      const ind = apisCopy.findIndex(api => api.key === openedItem.key);
      if(ind != -1) {
        apisCopy.splice(ind, 1);
      }
      if (this.state.recentApis.length >= 5) {
        apisCopy.pop();
      }
      apisCopy.unshift(openedItem);
      AsyncStorage.setItem('RecentApi', JSON.stringify(apisCopy));
    }
  };

  render(): React.Node {
    const filter = ({example, filterRegex, category}) =>
      filterRegex.test(example.module.title) &&
      (!category || example.category === category) &&
      (!Platform.isTV || example.supportsTVOS);

    const {screen} = this.props;
    let sections = [];
    if (screen === 'component') {
      if (this.state.recentComponents.length > 0) {
        sections = [
          {
            data: this.state.recentComponents,
            key: 'RECENT_COMPONENTS',
            title: 'Recently viewed'
          },
          {
            data: this.state.components,
            key: 'COMPONENTS',
            title: 'Components'
          },
        ];
      } else {
        sections = [
          {
            data: this.state.components,
            key: 'Components',
          },
        ];
      }
    } else if (screen === 'api') {
      if (this.state.recentApis.length > 0) {
        sections = [
          {
            data: this.state.recentApis,
            key: 'RECENT_APIS',
            title: 'Recently viewed'
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
    } else {
      sections = [];
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
                sections={sections}
                filter={filter}
                render={({filteredSections}) => (
                  <SectionList
                    sections={filteredSections}
                    extraData={filteredSections}
                    renderItem={this._renderItem}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustContentInsets={false}
                    keyboardDismissMode="on-drag"
                    renderSectionHeader={renderSectionHeader}
                    ListFooterComponent={() => (
                      <View style={{height: 80}}></View>
                    )}
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
        updateSectionsList={() => this.updateSectionsList(index, section.key)}
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

module.exports = RNTesterExampleList;
