/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

import type {Props as FlatListProps} from 'FlatList';
import type {renderItemType} from 'VirtualizedList';

const React = require('React');
const SwipeableRow = require('SwipeableRow');
const FlatList = require('FlatList');

// TODO: Make this $ReadOnly and Exact. Will require doing the same to the props in
//       Libraries/Lists/*
type SwipableListProps = {
  /**
   * To alert the user that swiping is possible, the first row can bounce
   * on component mount.
   */
  bounceFirstRowOnMount: boolean,

  /**
   * Maximum distance to open to after a swipe
   */
  maxSwipeDistance: number | (Object => number),

  /**
   * Callback method to render the view that will be unveiled on swipe
   */
  renderQuickActions: renderItemType,
};

type Props<ItemT> = SwipableListProps & FlatListProps<ItemT>;

type State = {|
  openRowKey: ?string,
|};

/**
 * A container component that renders multiple SwipeableRow's in a FlatList
 * implementation. This is designed to be a drop-in replacement for the
 * standard React Native `FlatList`, so use it as if it were a FlatList, but
 * with extra props, i.e.
 *
 * <SwipeableListView renderRow={..} renderQuickActions={..} {..FlatList props} />
 *
 * SwipeableRow can be used independently of this component, but the main
 * benefit of using this component is
 *
 * - It ensures that at most 1 row is swiped open (auto closes others)
 * - It can bounce the 1st row of the list so users know it's swipeable
 * - Increase performance on iOS by locking list swiping when row swiping is occurring
 * - More to come
 */

class SwipeableFlatList<ItemT> extends React.Component<Props<ItemT>, State> {
  _flatListRef: ?FlatList<ItemT> = null;
  _shouldBounceFirstRowOnMount: boolean = false;

  static defaultProps = {
    ...FlatList.defaultProps,
    bounceFirstRowOnMount: true,
    renderQuickActions: () => null,
  };

  constructor(props: Props<ItemT>, context: any): void {
    super(props, context);
    this.state = {
      openRowKey: null,
    };

    this._shouldBounceFirstRowOnMount = this.props.bounceFirstRowOnMount;
  }

  render(): React.Node {
    return (
      <FlatList
        {...this.props}
        ref={ref => {
          this._flatListRef = ref;
        }}
        onScroll={this._onScroll}
        renderItem={this._renderItem}
        extraData={this.state}
      />
    );
  }

  _onScroll = (e): void => {
    // Close any opens rows on ListView scroll
    if (this.state.openRowKey) {
      this.setState({
        openRowKey: null,
      });
    }

    this.props.onScroll && this.props.onScroll(e);
  };

  _renderItem = (info: Object): ?React.Element<any> => {
    const slideoutView = this.props.renderQuickActions(info);
    const key = this.props.keyExtractor(info.item, info.index);

    // If renderQuickActions is unspecified or returns falsey, don't allow swipe
    if (!slideoutView) {
      return this.props.renderItem(info);
    }

    let shouldBounceOnMount = false;
    if (this._shouldBounceFirstRowOnMount) {
      this._shouldBounceFirstRowOnMount = false;
      shouldBounceOnMount = true;
    }

    return (
      <SwipeableRow
        slideoutView={slideoutView}
        isOpen={key === this.state.openRowKey}
        maxSwipeDistance={this._getMaxSwipeDistance(info)}
        onOpen={() => this._onOpen(key)}
        onClose={() => this._onClose(key)}
        shouldBounceOnMount={shouldBounceOnMount}
        onSwipeEnd={this._setListViewScrollable}
        onSwipeStart={this._setListViewNotScrollable}>
        {this.props.renderItem(info)}
      </SwipeableRow>
    );
  };

  // This enables rows having variable width slideoutView.
  _getMaxSwipeDistance(info: Object): number {
    if (typeof this.props.maxSwipeDistance === 'function') {
      return this.props.maxSwipeDistance(info);
    }

    return this.props.maxSwipeDistance;
  }

  _setListViewScrollableTo(value: boolean) {
    if (this._flatListRef) {
      this._flatListRef.setNativeProps({
        scrollEnabled: value,
      });
    }
  }

  _setListViewScrollable = () => {
    this._setListViewScrollableTo(true);
  };

  _setListViewNotScrollable = () => {
    this._setListViewScrollableTo(false);
  };

  _onOpen(key: any): void {
    this.setState({
      openRowKey: key,
    });
  }

  _onClose(key: any): void {
    this.setState({
      openRowKey: null,
    });
  }
}

module.exports = SwipeableFlatList;
