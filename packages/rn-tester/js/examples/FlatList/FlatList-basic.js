/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {AnimatedComponentType} from 'react-native/Libraries/Animated/createAnimatedComponent';
import typeof FlatListType from 'react-native/Libraries/Lists/FlatList';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import * as React from 'react';
import {
  Alert,
  Animated,
  I18nManager,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import RNTesterPage from '../../components/RNTesterPage';
import infoLog from 'react-native/Libraries/Utilities/infoLog';
import {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  PlainInput,
  SeparatorComponent,
  Spindicator,
  genItemData,
  getItemLayout,
  pressItem,
  renderSmallSwitchOption,
} from '../../components/ListExampleShared';

import type {Item} from '../../components/ListExampleShared';

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

type Props = $ReadOnly<{||}>;
type State = {|
  data: Array<Item>,
  debug: boolean,
  horizontal: boolean,
  inverted: boolean,
  filterText: string,
  fixedHeight: boolean,
  logViewable: boolean,
  virtualized: boolean,
  empty: boolean,
  useFlatListItemComponent: boolean,
  fadingEdgeLength: number,
  onPressDisabled: boolean,
  textSelectable: boolean,
  isRTL: boolean,
|};

const IS_RTL = I18nManager.isRTL;

class FlatListExample extends React.PureComponent<Props, State> {
  state: State = {
    data: genItemData(100),
    debug: false,
    horizontal: false,
    inverted: false,
    filterText: '',
    fixedHeight: true,
    logViewable: false,
    virtualized: true,
    empty: false,
    useFlatListItemComponent: false,
    fadingEdgeLength: 0,
    onPressDisabled: false,
    textSelectable: true,
    isRTL: IS_RTL,
  };

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  _onChangeFilterText = filterText => {
    this.setState({filterText});
  };

  _onChangeScrollToIndex = (text: mixed) => {
    this._listRef.scrollToIndex({viewPosition: 0.5, index: Number(text)});
  };

  _scrollPos = new Animated.Value(0);
  _scrollSinkX = Animated.event(
    [{nativeEvent: {contentOffset: {x: this._scrollPos}}}],
    {useNativeDriver: true},
  );
  _scrollSinkY = Animated.event(
    [{nativeEvent: {contentOffset: {y: this._scrollPos}}}],
    {useNativeDriver: true},
  );

  componentDidUpdate() {
    this._listRef.recordInteraction(); // e.g. flipping logViewable switch
  }

  _setBooleanValue: string => boolean => void = key => value =>
    this.setState({[key]: value});

  _setIsRTL: boolean => void = value => {
    I18nManager.forceRTL(value);
    this.setState({isRTL: value});
    Alert.alert(
      'Reload this page',
      'Please reload this page to change the UI direction! ' +
        'All examples in this app will be affected. ' +
        'Check them out to see what they look like in RTL layout.',
    );
  };

  render(): React.Node {
    const filterRegex = new RegExp(String(this.state.filterText), 'i');
    const filter = (item: Item) =>
      filterRegex.test(item.text) || filterRegex.test(item.title);
    const filteredData = this.state.data.filter(filter);
    const flatListItemRendererProps = this._renderItemComponent();
    return (
      <RNTesterPage
        noSpacer={true}
        noScroll={true}
        title="Simple list of items">
        <View style={styles.container}>
          <View style={styles.searchRow}>
            <View style={styles.options}>
              <PlainInput
                onChangeText={this._onChangeFilterText}
                placeholder="Search..."
                value={this.state.filterText}
              />
              <PlainInput
                onChangeText={this._onChangeScrollToIndex}
                placeholder="scrollToIndex..."
              />
            </View>
            <View style={styles.options}>
              {renderSmallSwitchOption(
                'Virtualized',
                this.state.virtualized,
                this._setBooleanValue('virtualized'),
              )}
              {renderSmallSwitchOption(
                'Horizontal',
                this.state.horizontal,
                this._setBooleanValue('horizontal'),
              )}
              {renderSmallSwitchOption(
                'Fixed Height',
                this.state.fixedHeight,
                this._setBooleanValue('fixedHeight'),
              )}
              {renderSmallSwitchOption(
                'Log Viewable',
                this.state.logViewable,
                this._setBooleanValue('logViewable'),
              )}
              {renderSmallSwitchOption(
                'Inverted',
                this.state.inverted,
                this._setBooleanValue('inverted'),
              )}
              {renderSmallSwitchOption(
                'Empty',
                this.state.empty,
                this._setBooleanValue('empty'),
              )}
              {renderSmallSwitchOption(
                'Debug',
                this.state.debug,
                this._setBooleanValue('debug'),
              )}
              {renderSmallSwitchOption(
                'onPress Disabled',
                this.state.onPressDisabled,
                this._setBooleanValue('onPressDisabled'),
              )}
              {renderSmallSwitchOption(
                'Text Selectable',
                this.state.textSelectable,
                this._setBooleanValue('textSelectable'),
              )}
              {renderSmallSwitchOption(
                'Use FlatListItemComponent',
                this.state.useFlatListItemComponent,
                this._setBooleanValue('useFlatListItemComponent'),
              )}
              {renderSmallSwitchOption(
                'Is RTL',
                this.state.isRTL,
                this._setIsRTL,
              )}
              {Platform.OS === 'android' && (
                <View>
                  <TextInput
                    placeholder="Fading edge length"
                    underlineColorAndroid="black"
                    keyboardType={'numeric'}
                    onChange={event =>
                      this.setState({
                        fadingEdgeLength: Number(event.nativeEvent.text),
                      })
                    }
                  />
                </View>
              )}
              <Spindicator value={this._scrollPos} />
            </View>
          </View>
          <SeparatorComponent />
          <Animated.FlatList
            fadingEdgeLength={this.state.fadingEdgeLength}
            ItemSeparatorComponent={ItemSeparatorComponent}
            ListHeaderComponent={<HeaderComponent />}
            ListFooterComponent={FooterComponent}
            ListEmptyComponent={ListEmptyComponent}
            data={this.state.empty ? [] : filteredData}
            debug={this.state.debug}
            disableVirtualization={!this.state.virtualized}
            getItemLayout={
              this.state.fixedHeight ? this._getItemLayout : undefined
            }
            accessibilityRole="list"
            horizontal={this.state.horizontal}
            inverted={this.state.inverted}
            key={
              (this.state.horizontal ? 'h' : 'v') +
              (this.state.fixedHeight ? 'f' : 'd')
            }
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            numColumns={1}
            onEndReached={this._onEndReached}
            onRefresh={this._onRefresh}
            onScroll={
              this.state.horizontal ? this._scrollSinkX : this._scrollSinkY
            }
            onViewableItemsChanged={this._onViewableItemsChanged}
            ref={this._captureRef}
            refreshing={false}
            contentContainerStyle={styles.list}
            viewabilityConfig={VIEWABILITY_CONFIG}
            {...flatListItemRendererProps}
          />
        </View>
      </RNTesterPage>
    );
  }
  _captureRef = (
    ref: React.ElementRef<
      AnimatedComponentType<
        React.ElementConfig<FlatListType>,
        React.ElementRef<FlatListType>,
      >,
    >,
  ) => {
    this._listRef = ref;
  };
  _getItemLayout = (data: any, index: number) => {
    return getItemLayout(data, index, this.state.horizontal);
  };
  _onEndReached = () => {
    if (this.state.data.length >= 1000) {
      return;
    }
    this.setState(state => ({
      data: state.data.concat(genItemData(100, state.data.length)),
    }));
  };
  _onPressCallback = () => {
    const {onPressDisabled} = this.state;
    const warning = () => console.log('onPress disabled');
    const onPressAction = onPressDisabled ? warning : this._pressItem;
    return onPressAction;
  };
  _onRefresh = () => Alert.alert('onRefresh: nothing to refresh :P');
  _renderItemComponent = () => {
    const flatListPropKey = this.state.useFlatListItemComponent
      ? 'ListItemComponent'
      : 'renderItem';

    return {
      renderItem: undefined,
      /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb)
       * This comment suppresses an error found when Flow v0.111 was deployed.
       * To see the error, delete this comment and run Flow. */
      /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
       * Flow's LTI update could not be added via codemod */
      [flatListPropKey]: ({item, separators}) => {
        return (
          <ItemComponent
            item={item}
            horizontal={this.state.horizontal}
            fixedHeight={this.state.fixedHeight}
            onPress={this._onPressCallback()}
            onShowUnderlay={separators.highlight}
            onHideUnderlay={separators.unhighlight}
            textSelectable={this.state.textSelectable}
          />
        );
      },
    };
  };
  // This is called when items change viewability by scrolling into or out of
  // the viewable area.
  _onViewableItemsChanged = (info: {
    changed: Array<{
      key: string,
      isViewable: boolean,
      item: any,
      index: ?number,
      section?: any,
      ...
    }>,
    ...
  }) => {
    // Impressions can be logged here
    if (this.state.logViewable) {
      infoLog(
        'onViewableItemsChanged: ',
        info.changed.map(v => ({...v, item: '...'})),
      );
    }
  };

  _pressItem = (key: string) => {
    this._listRef && this._listRef.recordInteraction();
    const index = Number(key);
    const itemState = pressItem(this.state.data[index]);
    this.setState(state => ({
      ...state,
      data: [
        ...state.data.slice(0, index),
        itemState,
        ...state.data.slice(index + 1),
      ],
    }));
  };

  _listRef: React.ElementRef<typeof Animated.FlatList>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgb(239, 239, 244)',
    flex: 1,
  },
  list: {
    backgroundColor: 'white',
    flexGrow: 1,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchRow: {
    paddingHorizontal: 10,
  },
});

export default ({
  title: 'Basic',
  name: 'basic',
  description: 'Simple list of items',
  render: () => <FlatListExample />,
}: RNTesterModuleExample);
