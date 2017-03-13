/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule FlatList
 * @flow
 */
'use strict';

const MetroListView = require('MetroListView'); // Used as a fallback legacy option
const React = require('React');
const ReactNative = require('ReactNative');
const View = require('View');
const VirtualizedList = require('VirtualizedList');

const invariant = require('fbjs/lib/invariant');

import type {StyleObj} from 'StyleSheetTypes';
import type {ViewabilityConfig, ViewToken} from 'ViewabilityHelper';
import type {Props as VirtualizedListProps} from 'VirtualizedList';

type RequiredProps<ItemT> = {
  /**
   * Takes an item from `data` and renders it into the list. Typical usage:
   *
   *     _renderItem = ({item}) => (
   *       <TouchableOpacity onPress={() => this._onPress(item)}>
   *         <Text>{item.title}}</Text>
   *       <TouchableOpacity/>
   *     );
   *     ...
   *     <FlatList data={[{title: 'Title Text', key: 'item1'}]} renderItem={this._renderItem} />
   *
   * Provides additional metadata like `index` if you need it.
   */
  renderItem: (info: {item: ItemT, index: number}) => ?React.Element<any>,
  /**
   * For simplicity, data is just a plain array. If you want to use something else, like an
   * immutable list, use the underlying `VirtualizedList` directly.
   */
  data: ?Array<ItemT>,
};
type OptionalProps<ItemT> = {
  /**
   * Rendered in between each item, but not at the top or bottom.
   */
  ItemSeparatorComponent?: ?ReactClass<any>,
  /**
   * Rendered at the bottom of all the items.
   */
  ListFooterComponent?: ?ReactClass<any>,
  /**
   * Rendered at the top of all the items.
   */
  ListHeaderComponent?: ?ReactClass<any>,
  /**
   * `getItemLayout` is an optional optimizations that let us skip measurement of dynamic content if
   * you know the height of items a priori. `getItemLayout` is the most efficient, and is easy to
   * use if you have fixed height items, for example:
   *
   *     getItemLayout={(data, index) => (
   *       {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
   *     )}
   *
   * Remember to include separator length (height or width) in your offset calculation if you
   * specify `ItemSeparatorComponent`.
   */
  getItemLayout?: (data: ?Array<ItemT>, index: number) =>
    {length: number, offset: number, index: number},
  /**
   * If true, renders items next to each other horizontally instead of stacked vertically.
   */
  horizontal?: ?boolean,
  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
   * falls back to using the index, like React does.
   */
  keyExtractor: (item: ItemT, index: number) => string,
  /**
   * Multiple columns can only be rendered with `horizontal={false}`` and will zig-zag like a
   * `flexWrap` layout. Items should all be the same height - masonry layouts are not supported.
   */
  numColumns: number,
  /**
   * Called once when the scroll position gets within `onEndReachedThreshold` of the rendered
   * content.
   */
  onEndReached?: ?(info: {distanceFromEnd: number}) => void,
  onEndReachedThreshold?: ?number,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?() => void,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewablePercentThreshold` prop.
   */
  onViewableItemsChanged?: ?(info: {viewableItems: Array<ViewToken>, changed: Array<ViewToken>}) => void,
  legacyImplementation?: ?boolean,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: ?boolean,
  /**
   * Optional custom style for multi-item rows generated when numColumns > 1
   */
  columnWrapperStyle?: StyleObj,
  /**
   * See `ViewabilityHelper` for flow type and further documentation.
   */
  viewabilityConfig?: ViewabilityConfig,
};
type Props<ItemT> = RequiredProps<ItemT> & OptionalProps<ItemT> & VirtualizedListProps;

const defaultProps = {
  ...VirtualizedList.defaultProps,
  getItem: undefined,
  getItemCount: undefined,
  numColumns: 1,
};
type DefaultProps = typeof defaultProps;

/**
 * A performant interface for rendering simple, flat lists, supporting the most handy features:
 *
 *  - Fully cross-platform.
 *  - Optional horizontal mode.
 *  - Configurable viewability callbacks.
 *  - Header support.
 *  - Footer support.
 *  - Separator support.
 *  - Pull to Refresh.
 *  - Scroll loading.
 *
 * If you need section support, use [`<SectionList>`](/react-native/docs/sectionlist.html).
 *
 * Minimal Example:
 *
 *     <FlatList
 *       data={[{key: 'a'}, {key: 'b'}]}
 *       renderItem={({item}) => <Text>{item.key}</Text>}
 *     />
 *
 * This is a convenience wrapper around [`<VirtualizedList>`](/react-native/docs/virtualizedlist.html),
 * and thus inherits the following caveats:
 *
 * - Internal state is not preserved when content scrolls out of the render window. Make sure all
 *   your data is captured in the item data or external stores like Flux, Redux, or Relay.
 * - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
 *   equal. Make sure that everything your `renderItem` function depends on is passed as a prop that
 *   is not `===` after updates, otherwise your UI may not update on changes. This includes the
 *   `data` prop and parent component state.
 * - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
 *   offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see
 *   blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
 *   and we are working on improving it behind the scenes.
 * - By default, the list looks for a `key` prop on each item and uses that for the React key.
 *   Alternatively, you can provide a custom `keyExtractor` prop.
 */
class FlatList<ItemT> extends React.PureComponent<DefaultProps, Props<ItemT>, void> {
  static defaultProps: DefaultProps = defaultProps;
  props: Props<ItemT>;
  /**
   * Scrolls to the end of the content. May be janky without `getItemLayout` prop.
   */
  scrollToEnd(params?: ?{animated?: ?boolean}) {
    this._listRef.scrollToEnd(params);
  }

  /**
   * Scrolls to the item at a the specified index such that it is positioned in the viewable area
   * such that `viewPosition` 0 places it at the top, 1 at the bottom, and 0.5 centered in the
   * middle.
   *
   * May be janky without `getItemLayout` prop.
   */
  scrollToIndex(params: {animated?: ?boolean, index: number, viewPosition?: number}) {
    this._listRef.scrollToIndex(params);
  }

  /**
   * Requires linear scan through data - use `scrollToIndex` instead if possible. May be janky
   * without `getItemLayout` prop.
   */
  scrollToItem(params: {animated?: ?boolean, item: ItemT, viewPosition?: number}) {
    this._listRef.scrollToItem(params);
  }

  /**
   * Scroll to a specific content pixel offset, like a normal `ScrollView`.
   */
  scrollToOffset(params: {animated?: ?boolean, offset: number}) {
    this._listRef.scrollToOffset(params);
  }

  /**
   * Tells the list an interaction has occured, which should trigger viewability calculations, e.g.
   * if `waitForInteractions` is true and the user has not scrolled. This is typically called by
   * taps on items or by navigation actions.
   */
  recordInteraction() {
    this._listRef.recordInteraction();
  }

  getScrollableNode() {
    if (this._listRef && this._listRef.getScrollableNode) {
      return this._listRef.getScrollableNode();
    } else {
      return ReactNative.findNodeHandle(this._listRef);
    }
  }

  componentWillMount() {
    this._checkProps(this.props);
  }

  componentWillReceiveProps(nextProps: Props<ItemT>) {
    this._checkProps(nextProps);
  }

  _hasWarnedLegacy = false;
  _listRef: VirtualizedList;

  _captureRef = (ref) => { this._listRef = ref; };

  _checkProps(props: Props<ItemT>) {
    const {
      getItem,
      getItemCount,
      horizontal,
      legacyImplementation,
      numColumns,
      columnWrapperStyle,
    } = props;
    invariant(!getItem && !getItemCount, 'FlatList does not support custom data formats.');
    if (numColumns > 1) {
      invariant(!horizontal, 'numColumns does not support horizontal.');
    } else {
      invariant(!columnWrapperStyle, 'columnWrapperStyle not supported for single column lists');
    }
    if (legacyImplementation) {
      invariant(numColumns === 1, 'Legacy list does not support multiple columns.');
      // Warning: may not have full feature parity and is meant more for debugging and performance
      // comparison.
      if (!this._hasWarnedLegacy) {
        console.warn(
          'FlatList: Using legacyImplementation - some features not supported and performance ' +
          'may suffer'
        );
        this._hasWarnedLegacy = true;
      }
    }
  }

  _getItem = (data: Array<ItemT>, index: number) => {
    const {numColumns} = this.props;
    if (numColumns > 1) {
      const ret = [];
      for (let kk = 0; kk < numColumns; kk++) {
        const item = data[index * numColumns + kk];
        item && ret.push(item);
      }
      return ret;
    } else {
      return data[index];
    }
  };

  _getItemCount = (data: ?Array<ItemT>): number => {
    return data ? Math.ceil(data.length / this.props.numColumns) : 0;
  };

  _keyExtractor = (items: ItemT | Array<ItemT>, index: number) => {
    const {keyExtractor, numColumns} = this.props;
    if (numColumns > 1) {
      invariant(
        Array.isArray(items),
        'FlatList: Encountered internal consistency error, expected each item to consist of an ' +
        'array with 1-%s columns; instead, received a single item.',
        numColumns,
      );
      return items.map((it, kk) => keyExtractor(it, index * numColumns + kk)).join(':');
    } else {
      return keyExtractor(items, index);
    }
  };

  _pushMultiColumnViewable(arr: Array<ViewToken>, v: ViewToken): void {
    const {numColumns, keyExtractor} = this.props;
    v.item.forEach((item, ii) => {
      invariant(v.index != null, 'Missing index!');
      const index = v.index * numColumns + ii;
      arr.push({...v, item, key: keyExtractor(item, index), index});
    });
  }
  _onViewableItemsChanged = (info) => {
    const {numColumns, onViewableItemsChanged} = this.props;
    if (!onViewableItemsChanged) {
      return;
    }
    if (numColumns > 1) {
      const changed = [];
      const viewableItems = [];
      info.viewableItems.forEach((v) => this._pushMultiColumnViewable(viewableItems, v));
      info.changed.forEach((v) => this._pushMultiColumnViewable(changed, v));
      onViewableItemsChanged({viewableItems, changed});
    } else {
      onViewableItemsChanged(info);
    }
  };

  _renderItem = (info: {item: ItemT | Array<ItemT>, index: number}) => {
    const {renderItem, numColumns, columnWrapperStyle} = this.props;
    if (numColumns > 1) {
      const {item, index} = info;
      invariant(Array.isArray(item), 'Expected array of items with numColumns > 1');
      return (
        <View style={[{flexDirection: 'row'}, columnWrapperStyle]}>
          {item.map((it, kk) => {
            const element = renderItem({item: it, index:  index * numColumns + kk});
            return element && React.cloneElement(element, {key: kk});
          })}
        </View>
      );
    } else {
      return renderItem(info);
    }
  };

  _shouldItemUpdate = (prev, next) => {
    const {numColumns, shouldItemUpdate} = this.props;
    if (numColumns > 1) {
      return prev.item.length !== next.item.length ||
        prev.item.some((prevItem, ii) => shouldItemUpdate(
          {item: prevItem, index: prev.index + ii},
          {item: next.item[ii], index: next.index + ii},
        ));
    } else {
      return shouldItemUpdate(prev, next);
    }
  };

  render() {
    if (this.props.legacyImplementation) {
      return <MetroListView {...this.props} items={this.props.data} ref={this._captureRef} />;
    } else {
      return (
        <VirtualizedList
          {...this.props}
          renderItem={this._renderItem}
          getItem={this._getItem}
          getItemCount={this._getItemCount}
          keyExtractor={this._keyExtractor}
          ref={this._captureRef}
          shouldItemUpdate={this._shouldItemUpdate}
          onViewableItemsChanged={this.props.onViewableItemsChanged && this._onViewableItemsChanged}
        />
      );
    }
  }
}

module.exports = FlatList;
