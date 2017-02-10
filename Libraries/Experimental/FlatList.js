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
const View = require('View');
const VirtualizedList = require('VirtualizedList');

const invariant = require('invariant');

import type {Viewable} from 'ViewabilityHelper';

type Item = any;

type RequiredProps = {
  /**
   * Note this can be a normal class component, or a functional component, such as a render method
   * on your main component.
   */
  ItemComponent: ReactClass<{item: Item, index: number}>,
  /**
   * For simplicity, data is just a plain array. If you want to use something else, like an
   * immutable list, use the underlying `VirtualizedList` directly.
   */
  data: ?Array<Item>,
};
type OptionalProps = {
  /**
   * Rendered at the bottom of all the items.
   */
  FooterComponent?: ?ReactClass<*>,
  /**
   * Rendered at the top of all the items.
   */
  HeaderComponent?: ?ReactClass<*>,
  /**
   * Rendered in between each item, but not at the top or bottom.
   */
  SeparatorComponent?: ?ReactClass<*>,
  /**
   * getItemLayout is an optional optimizations that let us skip measurement of dynamic content if
   * you know the height of items a priori. getItemLayout is the most efficient, and is easy to use
   * if you have fixed height items, for example:
   *
   *   getItemLayout={(data, index) => ({length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index})}
   *
   * Remember to include separator length (height or width) in your offset calculation if you
   * specify `SeparatorComponent`.
   */
  getItemLayout?: (data: ?Array<Item>, index: number) => {length: number, offset: number},
  /**
   * If true, renders items next to each other horizontally instead of stacked vertically.
   */
  horizontal?: ?boolean,
  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks item.key, then
   * falls back to using the index, like react does.
   */
  keyExtractor: (item: Item, index: number) => string,
  /**
   * Multiple columns can only be rendered with horizontal={false} and will zig-zag like a flexWrap
   * layout. Items should all be the same height - masonry layouts are not supported.
   */
  numColumns?: number,
  /**
   * Called once when the scroll position gets within onEndReachedThreshold of the rendered content.
   */
  onEndReached?: ?({distanceFromEnd: number}) => void,
  onEndReachedThreshold?: ?number,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?Function,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewablePercentThreshold` prop.
   */
  onViewableItemsChanged?: ?({viewableItems: Array<Viewable>, changed: Array<Viewable>}) => void,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: ?boolean,
  /**
   * Optional optimization to minimize re-rendering items.
   */
  shouldItemUpdate: (
    prevProps: {item: Item, index: number},
    nextProps: {item: Item, index: number}
  ) => boolean,
};
type Props = RequiredProps & OptionalProps; // plus props from the underlying implementation

/**
 * A performant interface for rendering simple, flat lists, supporting the most handy features:
 *
 *  - Fully cross-platform.
 *  - Optional horizontal mode.
 *  - Viewability callbacks.
 *  - Footer support.
 *  - Separator support.
 *  - Pull to Refresh
 *
 * If you need sticky section header support, use ListView.
 *
 * Minimal Example:
 *
 *   <FlatList
 *     data={[{key: 'a', {key: 'b'}]}
 *     ItemComponent={({item}) => <Text>{item.key}</Text>}
 *   />
 */
class FlatList extends React.PureComponent {
  static defaultProps = {
    keyExtractor: VirtualizedList.defaultProps.keyExtractor,
    shouldItemUpdate: VirtualizedList.defaultProps.shouldItemUpdate,
  };
  props: Props;
  /**
   * Scrolls to the end of the content. May be janky without getItemLayout prop.
   */
  scrollToEnd(params?: ?{animated?: ?boolean}) {
    this._listRef.scrollToEnd(params);
  }

  /**
   * Scrolls to the item at a the specified index such that it is positioned in the viewable area
   * such that viewPosition 0 places it at the top, 1 at the bottom, and 0.5 centered in the middle.
   *
   * May be janky without getItemLayout prop.
   */
  scrollToIndex(params: {animated?: ?boolean, index: number, viewPosition?: number}) {
    this._listRef.scrollToIndex(params);
  }

  /**
   * Requires linear scan through data - use scrollToIndex instead if possible. May be janky without
   * `getItemLayout` prop.
  */
  scrollToItem(params: {animated?: ?boolean, item: Item, viewPosition?: number}) {
    this._listRef.scrollToItem(params);
  }

  /**
   * Scroll to a specific content pixel offset, like a normal ScrollView.
   */
  scrollToOffset(params: {animated?: ?boolean, offset: number}) {
    this._listRef.scrollToOffset(params);
  }

  componentWillMount() {
    this._checkProps(this.props);
  }

  componentWillReceiveProps(nextProps: Props) {
    this._checkProps(nextProps);
  }

  _hasWarnedLegacy = false;
  _listRef: VirtualizedList;

  _captureRef = (ref) => { this._listRef = ref; };

  _checkProps(props: Props) {
    const {getItem, getItemCount, horizontal, legacyImplementation, numColumns, } = props;
    invariant(!getItem && !getItemCount, 'FlatList does not support custom data formats.');
    if (numColumns > 1) {
      invariant(!horizontal, 'numColumns does not support horizontal.');
    }
    if (legacyImplementation) {
      invariant(!(numColumns > 1), 'Legacy list does not support multiple columns.');
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

  _getItem = (data: Array<Item>, index: number): Item | Array<Item> => {
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

  _getItemCount = (data: Array<Item>): number => {
    return Math.floor(data.length / (this.props.numColumns || 1));
  };

  _keyExtractor = (items: Item | Array<Item>, index: number): string => {
    const {keyExtractor, numColumns} = this.props;
    if (numColumns > 1) {
      return items.map((it, kk) => keyExtractor(it, index * numColumns + kk)).join(':');
    } else {
      return keyExtractor(items, index);
    }
  };

  _pushMultiColumnViewable(arr: Array<Viewable>, v: Viewable): void {
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

  _renderItem = ({item, index}) => {
    const {ItemComponent, numColumns} = this.props;
    if (numColumns > 1) {
      return (
        <View style={{flexDirection: 'row'}}>
          {item.map((it, kk) =>
            <ItemComponent key={kk} item={it} index={index * numColumns + kk} />)
          }
        </View>
      );
    } else {
      return <ItemComponent item={item} index={index} />;
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
          ItemComponent={this._renderItem}
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
