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

const RNTesterPage = require('../../components/RNTesterPage');
const React = require('react');

const infoLog = require('react-native');

const {
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
} = require('../../components/ListExampleShared');
const {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  View,
} = require('react-native');

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
|};

const FlatListExample = () => {
  const [state, setState] = React.useState({
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
    numColumns: 1,
    multiColumn: true,
    header: false,
    footer: false,
  });

  const _onChangeFilterText = (filterText) => {
    setState({filterText});
  };

  const _onChangeScrollToIndex = (text) => {
    _listRef.scrollToIndex({viewPosition: 0.5, index: Number(text)});
  };

  const _scrollPos = new Animated.Value(0);
  const _scrollSinkX = Animated.event(
    [{nativeEvent: {contentOffset: {x: _scrollPos}}}],
    {useNativeDriver: true},
  );
  const _scrollSinkY = Animated.event(
    [{nativeEvent: {contentOffset: {y: _scrollPos}}}],
    {useNativeDriver: true},
  );

  let _listRef: React.ElementRef<typeof Animated.FlatList>;

  React.useEffect(() => {
    _listRef.recordInteraction();
  });

  const filterRegex = new RegExp(String(state.filterText), 'i');
  const filter = (item) =>
    filterRegex.test(item.text) || filterRegex.test(item.title);
  const filteredData = state.data.filter(filter);

  const _captureRef = (ref) => {
    _listRef = ref;
  };
  const _getItemLayout = (data: any, index: number) => {
    return getItemLayout(data, index, state.horizontal);
  };
  const _onEndReached = () => {
    if (state.data.length >= 1000) {
      return;
    }
    setState((state) => ({
      data: state.data.concat(genItemData(100, state.data.length)),
    }));
  };

  const _onRefresh = () => Alert.alert('onRefresh: nothing to refresh :P');
  const _renderItemComponent = () => {
    const flatListPropKey = state.useFlatListItemComponent
      ? 'ListItemComponent'
      : 'renderItem';

    return {
      renderItem: undefined,
      /* $FlowFixMe(>=0.111.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.111 was deployed. To see the error, delete
       * this comment and run Flow. */
      [flatListPropKey]: ({item, separators}) => {
        return (
          <ItemComponent
            item={item}
            horizontal={state.horizontal}
            fixedHeight={state.fixedHeight}
            onPress={_pressItem}
            onShowUnderlay={separators.highlight}
            onHideUnderlay={separators.unhighlight}
          />
        );
      },
    };
  };
  const flatListItemRendererProps = _renderItemComponent();
  // This is called when items change viewability by scrolling into or out of
  // the viewable area.
  const _onViewableItemsChanged = (info: {
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
    if (state.logViewable) {
      infoLog(
        'onViewableItemsChanged: ',
        info.changed.map((v) => ({...v, item: '...'})),
      );
    }
  };
  const _pressItem = (key: string) => {
    _listRef && _listRef.recordInteraction();
    pressItem(this, key);
  };

  return (
    <RNTesterPage noSpacer={true} noScroll={true} title="Simple list of items">
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <View style={styles.options}>
            <PlainInput
              onChangeText={_onChangeFilterText}
              placeholder="Search..."
              value={state.filterText}
            />
            <PlainInput
              onChangeText={_onChangeScrollToIndex}
              placeholder="scrollToIndex..."
            />
          </View>
          <View style={styles.options}>
            {renderSmallSwitchOption(state, 'virtualized', setState)}
            {renderSmallSwitchOption(state, 'horizontal', setState)}
            {renderSmallSwitchOption(state, 'fixedHeight', setState)}
            {renderSmallSwitchOption(state, 'log', setState)}
            {renderSmallSwitchOption(state, 'inverted', setState)}
            {renderSmallSwitchOption(state, 'empty', setState)}
            {renderSmallSwitchOption(state, 'debug', setState)}
            {renderSmallSwitchOption(
              state,
              'useFlatListItemComponent',
              setState,
            )}
            {renderSmallSwitchOption(state, 'header', setState)}
            {renderSmallSwitchOption(state, 'footer', setState)}
            {renderSmallSwitchOption(state, 'seperator', setState)}
            {renderSmallSwitchOption(state, 'multiColumn', setState)}
            {Platform.OS === 'android' && (
              <View>
                <TextInput
                  placeholder="Fading edge length"
                  underlineColorAndroid="black"
                  keyboardType={'numeric'}
                  onChange={(event) =>
                    setState({
                      fadingEdgeLength: Number(event.nativeEvent.text),
                    })
                  }
                />
              </View>
            )}
            <Spindicator value={_scrollPos} />
          </View>
        </View>
        <SeparatorComponent />
        <Animated.FlatList
          fadingEdgeLength={state.fadingEdgeLength}
          ItemSeparatorComponent={ItemSeparatorComponent}
          ListHeaderComponent={<HeaderComponent />}
          ListFooterComponent={FooterComponent}
          ListEmptyComponent={ListEmptyComponent}
          data={state.empty ? [] : filteredData}
          debug={state.debug}
          disableVirtualization={!state.virtualized}
          getItemLayout={state.fixedHeight ? _getItemLayout : undefined}
          horizontal={state.horizontal}
          inverted={state.inverted}
          key={(state.horizontal ? 'h' : 'v') + (state.fixedHeight ? 'f' : 'd')}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          numColumns={1}
          onEndReached={_onEndReached}
          onRefresh={_onRefresh}
          onScroll={state.horizontal ? _scrollSinkX : _scrollSinkY}
          onViewableItemsChanged={_onViewableItemsChanged}
          ref={_captureRef}
          refreshing={false}
          contentContainerStyle={styles.list}
          viewabilityConfig={VIEWABILITY_CONFIG}
          {...flatListItemRendererProps}
        />
      </View>
    </RNTesterPage>
  );
};

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

exports.title = '<FlatList>';
exports.description = 'Performant, scrollable list of data.';
exports.simpleExampleContainer = true;
exports.examples = [
  {
    title: 'Simple list of items',
    render: function (): React.Element<typeof FlatListExample> {
      return <FlatListExample />;
    },
  },
];
