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

const infoLog = require('../../../../Libraries/Utilities/infoLog');

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
  };

  _onChangeFilterText = filterText => {
    this.setState({filterText});
  };

  _onChangeScrollToIndex = text => {
    this._listRef
      .getNode()
      .scrollToIndex({viewPosition: 0.5, index: Number(text)});
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
    this._listRef.getNode().recordInteraction(); // e.g. flipping logViewable switch
  }

  render(): React.Node {
    const filterRegex = new RegExp(String(this.state.filterText), 'i');
    const filter = item =>
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
              {renderSmallSwitchOption(this, 'virtualized')}
              {renderSmallSwitchOption(this, 'horizontal')}
              {renderSmallSwitchOption(this, 'fixedHeight')}
              {renderSmallSwitchOption(this, 'log')}
              {renderSmallSwitchOption(this, 'inverted')}
              {renderSmallSwitchOption(this, 'empty')}
              {renderSmallSwitchOption(this, 'debug')}
              {renderSmallSwitchOption(this, 'useFlatListItemComponent')}
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
  _captureRef = ref => {
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
  _onRefresh = () => Alert.alert('onRefresh: nothing to refresh :P');
  _renderItemComponent = () => {
    const flatListPropKey = this.state.useFlatListItemComponent
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
            horizontal={this.state.horizontal}
            fixedHeight={this.state.fixedHeight}
            onPress={this._pressItem}
            onShowUnderlay={separators.highlight}
            onHideUnderlay={separators.unhighlight}
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
    this._listRef.getNode().recordInteraction();
    pressItem(this, key);
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

exports.title = '<FlatList>';
exports.description = 'Performant, scrollable list of data.';
exports.simpleExampleContainer = true;
exports.examples = [
  {
    title: 'Simple list of items',
    render: function(): React.Element<typeof FlatListExample> {
      return <FlatListExample />;
    },
  },
];
