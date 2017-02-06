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
const VirtualizedList = require('VirtualizedList');

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
  keyExtractor?: (item: Item, index: number) => string,
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
  shouldItemUpdate?: ?(
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

  _hasWarnedLegacy = false;
  _listRef: VirtualizedList;
  _captureRef = (ref) => { this._listRef = ref; };
  render() {
    if (this.props.legacyImplementation) {
      // Warning: may not have full feature parity and is meant more for debugging and performance
      // comparison.
      if (!this._hasWarnedLegacy) {
        console.warn(
          'FlatList: Using legacyImplementation - some features not supported and performance ' +
          'may suffer'
        );
        this._hasWarnedLegacy = true;
      }
      return <MetroListView {...this.props} items={this.props.data} ref={this._captureRef} />;
    } else {
      return <VirtualizedList {...this.props} ref={this._captureRef} />;
    }
  }
}

module.exports = FlatList;
