/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ScrollResponderType} from 'react-native/Libraries/Components/ScrollView/ScrollView';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type {
  LayoutEvent,
  ScrollEvent,
} from 'react-native/Libraries/Types/CoreEventTypes';
import type {ViewToken} from './ViewabilityHelper';
import type {
  FrameMetricProps,
  Item,
  Props,
  RenderItemProps,
  RenderItemType,
  Separators,
} from './VirtualizedListProps';

import {
  RefreshControl,
  ScrollView,
  View,
  StyleSheet,
  findNodeHandle,
} from 'react-native';
import Batchinator from '../Interaction/Batchinator';
import clamp from '../Utilities/clamp';
import infoLog from '../Utilities/infoLog';
import {CellRenderMask} from './CellRenderMask';
import ChildListCollection from './ChildListCollection';
import FillRateHelper from './FillRateHelper';
import StateSafePureComponent from './StateSafePureComponent';
import ViewabilityHelper from './ViewabilityHelper';
import CellRenderer from './VirtualizedListCellRenderer';
import {
  VirtualizedListCellContextProvider,
  VirtualizedListContext,
  VirtualizedListContextProvider,
} from './VirtualizedListContext.js';
import {
  computeWindowedRenderLimits,
  keyExtractor as defaultKeyExtractor,
} from './VirtualizeUtils';
import invariant from 'invariant';
import * as React from 'react';

export type {RenderItemProps, RenderItemType, Separators};

const ON_EDGE_REACHED_EPSILON = 0.001;

let _usedIndexForKey = false;
let _keylessItemComponentName: string = '';

type ViewabilityHelperCallbackTuple = {
  viewabilityHelper: ViewabilityHelper,
  onViewableItemsChanged: (info: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
    ...
  }) => void,
  ...
};

type State = {
  renderMask: CellRenderMask,
  cellsAroundViewport: {first: number, last: number},
};

/**
 * Default Props Helper Functions
 * Use the following helper functions for default values
 */

// horizontalOrDefault(this.props.horizontal)
function horizontalOrDefault(horizontal: ?boolean) {
  return horizontal ?? false;
}

// initialNumToRenderOrDefault(this.props.initialNumToRender)
function initialNumToRenderOrDefault(initialNumToRender: ?number) {
  return initialNumToRender ?? 10;
}

// maxToRenderPerBatchOrDefault(this.props.maxToRenderPerBatch)
function maxToRenderPerBatchOrDefault(maxToRenderPerBatch: ?number) {
  return maxToRenderPerBatch ?? 10;
}

// onStartReachedThresholdOrDefault(this.props.onStartReachedThreshold)
function onStartReachedThresholdOrDefault(onStartReachedThreshold: ?number) {
  return onStartReachedThreshold ?? 2;
}

// onEndReachedThresholdOrDefault(this.props.onEndReachedThreshold)
function onEndReachedThresholdOrDefault(onEndReachedThreshold: ?number) {
  return onEndReachedThreshold ?? 2;
}

// getScrollingThreshold(visibleLength, onEndReachedThreshold)
function getScrollingThreshold(threshold: number, visibleLength: number) {
  return (threshold * visibleLength) / 2;
}

// scrollEventThrottleOrDefault(this.props.scrollEventThrottle)
function scrollEventThrottleOrDefault(scrollEventThrottle: ?number) {
  return scrollEventThrottle ?? 50;
}

// windowSizeOrDefault(this.props.windowSize)
function windowSizeOrDefault(windowSize: ?number) {
  return windowSize ?? 21;
}

function findLastWhere<T>(
  arr: $ReadOnlyArray<T>,
  predicate: (element: T) => boolean,
): T | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return arr[i];
    }
  }

  return null;
}

/**
 * Base implementation for the more convenient [`<FlatList>`](https://reactnative.dev/docs/flatlist)
 * and [`<SectionList>`](https://reactnative.dev/docs/sectionlist) components, which are also better
 * documented. In general, this should only really be used if you need more flexibility than
 * `FlatList` provides, e.g. for use with immutable data instead of plain arrays.
 *
 * Virtualization massively improves memory consumption and performance of large lists by
 * maintaining a finite render window of active items and replacing all items outside of the render
 * window with appropriately sized blank space. The window adapts to scrolling behavior, and items
 * are rendered incrementally with low-pri (after any running interactions) if they are far from the
 * visible area, or with hi-pri otherwise to minimize the potential of seeing blank space.
 *
 * Some caveats:
 *
 * - Internal state is not preserved when content scrolls out of the render window. Make sure all
 *   your data is captured in the item data or external stores like Flux, Redux, or Relay.
 * - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
 *   equal. Make sure that everything your `renderItem` function depends on is passed as a prop
 *   (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on
 *   changes. This includes the `data` prop and parent component state.
 * - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
 *   offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see
 *   blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
 *   and we are working on improving it behind the scenes.
 * - By default, the list looks for a `key` or `id` prop on each item and uses that for the React key.
 *   Alternatively, you can provide a custom `keyExtractor` prop.
 * - As an effort to remove defaultProps, use helper functions when referencing certain props
 *
 */
class VirtualizedList extends StateSafePureComponent<Props, State> {
  static contextType: typeof VirtualizedListContext = VirtualizedListContext;

  // scrollToEnd may be janky without getItemLayout prop
  scrollToEnd(params?: ?{animated?: ?boolean, ...}) {
    const animated = params ? params.animated : true;
    const veryLast = this.props.getItemCount(this.props.data) - 1;
    if (veryLast < 0) {
      return;
    }
    const frame = this.__getFrameMetricsApprox(veryLast, this.props);
    const offset = Math.max(
      0,
      frame.offset +
        frame.length +
        this._footerLength -
        this._scrollMetrics.visibleLength,
    );

    if (this._scrollRef == null) {
      return;
    }

    if (this._scrollRef.scrollTo == null) {
      console.warn(
        'No scrollTo method provided. This may be because you have two nested ' +
          'VirtualizedLists with the same orientation, or because you are ' +
          'using a custom component that does not implement scrollTo.',
      );
      return;
    }

    this._scrollRef.scrollTo(
      horizontalOrDefault(this.props.horizontal)
        ? {x: offset, animated}
        : {y: offset, animated},
    );
  }

  // scrollToIndex may be janky without getItemLayout prop
  scrollToIndex(params: {
    animated?: ?boolean,
    index: number,
    viewOffset?: number,
    viewPosition?: number,
    ...
  }): $FlowFixMe {
    const {
      data,
      horizontal,
      getItemCount,
      getItemLayout,
      onScrollToIndexFailed,
    } = this.props;
    const {animated, index, viewOffset, viewPosition} = params;
    invariant(
      index >= 0,
      `scrollToIndex out of range: requested index ${index} but minimum is 0`,
    );
    invariant(
      getItemCount(data) >= 1,
      `scrollToIndex out of range: item length ${getItemCount(
        data,
      )} but minimum is 1`,
    );
    invariant(
      index < getItemCount(data),
      `scrollToIndex out of range: requested index ${index} is out of 0 to ${
        getItemCount(data) - 1
      }`,
    );
    if (!getItemLayout && index > this._highestMeasuredFrameIndex) {
      invariant(
        !!onScrollToIndexFailed,
        'scrollToIndex should be used in conjunction with getItemLayout or onScrollToIndexFailed, ' +
          'otherwise there is no way to know the location of offscreen indices or handle failures.',
      );
      onScrollToIndexFailed({
        averageItemLength: this._averageCellLength,
        highestMeasuredFrameIndex: this._highestMeasuredFrameIndex,
        index,
      });
      return;
    }
    const frame = this.__getFrameMetricsApprox(Math.floor(index), this.props);
    const offset =
      Math.max(
        0,
        this._getOffsetApprox(index, this.props) -
          (viewPosition || 0) *
            (this._scrollMetrics.visibleLength - frame.length),
      ) - (viewOffset || 0);

    if (this._scrollRef == null) {
      return;
    }

    if (this._scrollRef.scrollTo == null) {
      console.warn(
        'No scrollTo method provided. This may be because you have two nested ' +
          'VirtualizedLists with the same orientation, or because you are ' +
          'using a custom component that does not implement scrollTo.',
      );
      return;
    }

    this._scrollRef.scrollTo(
      horizontal ? {x: offset, animated} : {y: offset, animated},
    );
  }

  // scrollToItem may be janky without getItemLayout prop. Required linear scan through items -
  // use scrollToIndex instead if possible.
  scrollToItem(params: {
    animated?: ?boolean,
    item: Item,
    viewOffset?: number,
    viewPosition?: number,
    ...
  }) {
    const {item} = params;
    const {data, getItem, getItemCount} = this.props;
    const itemCount = getItemCount(data);
    for (let index = 0; index < itemCount; index++) {
      if (getItem(data, index) === item) {
        this.scrollToIndex({...params, index});
        break;
      }
    }
  }

  /**
   * Scroll to a specific content pixel offset in the list.
   *
   * Param `offset` expects the offset to scroll to.
   * In case of `horizontal` is true, the offset is the x-value,
   * in any other case the offset is the y-value.
   *
   * Param `animated` (`true` by default) defines whether the list
   * should do an animation while scrolling.
   */
  scrollToOffset(params: {animated?: ?boolean, offset: number, ...}) {
    const {animated, offset} = params;

    if (this._scrollRef == null) {
      return;
    }

    if (this._scrollRef.scrollTo == null) {
      console.warn(
        'No scrollTo method provided. This may be because you have two nested ' +
          'VirtualizedLists with the same orientation, or because you are ' +
          'using a custom component that does not implement scrollTo.',
      );
      return;
    }

    this._scrollRef.scrollTo(
      horizontalOrDefault(this.props.horizontal)
        ? {x: offset, animated}
        : {y: offset, animated},
    );
  }

  recordInteraction() {
    this._nestedChildLists.forEach(childList => {
      childList.recordInteraction();
    });
    this._viewabilityTuples.forEach(t => {
      t.viewabilityHelper.recordInteraction();
    });
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
  }

  flashScrollIndicators() {
    if (this._scrollRef == null) {
      return;
    }

    this._scrollRef.flashScrollIndicators();
  }

  /**
   * Provides a handle to the underlying scroll responder.
   * Note that `this._scrollRef` might not be a `ScrollView`, so we
   * need to check that it responds to `getScrollResponder` before calling it.
   */
  getScrollResponder(): ?ScrollResponderType {
    if (this._scrollRef && this._scrollRef.getScrollResponder) {
      return this._scrollRef.getScrollResponder();
    }
  }

  getScrollableNode(): ?number {
    if (this._scrollRef && this._scrollRef.getScrollableNode) {
      return this._scrollRef.getScrollableNode();
    } else {
      return findNodeHandle(this._scrollRef);
    }
  }

  getScrollRef():
    | ?React.ElementRef<typeof ScrollView>
    | ?React.ElementRef<typeof View> {
    if (this._scrollRef && this._scrollRef.getScrollRef) {
      return this._scrollRef.getScrollRef();
    } else {
      return this._scrollRef;
    }
  }

  setNativeProps(props: Object) {
    if (this._scrollRef) {
      this._scrollRef.setNativeProps(props);
    }
  }

  _getCellKey(): string {
    return this.context?.cellKey || 'rootList';
  }

  // $FlowFixMe[missing-local-annot]
  _getScrollMetrics = () => {
    return this._scrollMetrics;
  };

  hasMore(): boolean {
    return this._hasMore;
  }

  // $FlowFixMe[missing-local-annot]
  _getOutermostParentListRef = () => {
    if (this._isNestedWithSameOrientation()) {
      return this.context.getOutermostParentListRef();
    } else {
      return this;
    }
  };

  _registerAsNestedChild = (childList: {
    cellKey: string,
    ref: React.ElementRef<typeof VirtualizedList>,
  }): void => {
    this._nestedChildLists.add(childList.ref, childList.cellKey);
    if (this._hasInteracted) {
      childList.ref.recordInteraction();
    }
  };

  _unregisterAsNestedChild = (childList: {
    ref: React.ElementRef<typeof VirtualizedList>,
  }): void => {
    this._nestedChildLists.remove(childList.ref);
  };

  state: State;

  constructor(props: Props) {
    super(props);
    invariant(
      // $FlowFixMe[prop-missing]
      !props.onScroll || !props.onScroll.__isNative,
      'Components based on VirtualizedList must be wrapped with Animated.createAnimatedComponent ' +
        'to support native onScroll events with useNativeDriver',
    );
    invariant(
      windowSizeOrDefault(props.windowSize) > 0,
      'VirtualizedList: The windowSize prop must be present and set to a value greater than 0.',
    );

    invariant(
      props.getItemCount,
      'VirtualizedList: The "getItemCount" prop must be provided',
    );

    this._fillRateHelper = new FillRateHelper(this._getFrameMetrics);
    this._updateCellsToRenderBatcher = new Batchinator(
      this._updateCellsToRender,
      this.props.updateCellsBatchingPeriod ?? 50,
    );

    if (this.props.viewabilityConfigCallbackPairs) {
      this._viewabilityTuples = this.props.viewabilityConfigCallbackPairs.map(
        pair => ({
          viewabilityHelper: new ViewabilityHelper(pair.viewabilityConfig),
          onViewableItemsChanged: pair.onViewableItemsChanged,
        }),
      );
    } else {
      const {onViewableItemsChanged, viewabilityConfig} = this.props;
      if (onViewableItemsChanged) {
        this._viewabilityTuples.push({
          viewabilityHelper: new ViewabilityHelper(viewabilityConfig),
          onViewableItemsChanged: onViewableItemsChanged,
        });
      }
    }

    invariant(
      !this.context,
      'Unexpectedly saw VirtualizedListContext available in ctor',
    );

    const initialRenderRegion = VirtualizedList._initialRenderRegion(props);

    this.state = {
      cellsAroundViewport: initialRenderRegion,
      renderMask: VirtualizedList._createRenderMask(props, initialRenderRegion),
    };
  }

  static _createRenderMask(
    props: Props,
    cellsAroundViewport: {first: number, last: number},
    additionalRegions?: ?$ReadOnlyArray<{first: number, last: number}>,
  ): CellRenderMask {
    const itemCount = props.getItemCount(props.data);

    invariant(
      cellsAroundViewport.first >= 0 &&
        cellsAroundViewport.last >= cellsAroundViewport.first - 1 &&
        cellsAroundViewport.last < itemCount,
      `Invalid cells around viewport "[${cellsAroundViewport.first}, ${cellsAroundViewport.last}]" was passed to VirtualizedList._createRenderMask`,
    );

    const renderMask = new CellRenderMask(itemCount);

    if (itemCount > 0) {
      const allRegions = [cellsAroundViewport, ...(additionalRegions ?? [])];
      for (const region of allRegions) {
        renderMask.addCells(region);
      }

      // The initially rendered cells are retained as part of the
      // "scroll-to-top" optimization
      if (props.initialScrollIndex == null || props.initialScrollIndex <= 0) {
        const initialRegion = VirtualizedList._initialRenderRegion(props);
        renderMask.addCells(initialRegion);
      }

      // The layout coordinates of sticker headers may be off-screen while the
      // actual header is on-screen. Keep the most recent before the viewport
      // rendered, even if its layout coordinates are not in viewport.
      const stickyIndicesSet = new Set(props.stickyHeaderIndices);
      VirtualizedList._ensureClosestStickyHeader(
        props,
        stickyIndicesSet,
        renderMask,
        cellsAroundViewport.first,
      );
    }

    return renderMask;
  }

  static _initialRenderRegion(props: Props): {first: number, last: number} {
    const itemCount = props.getItemCount(props.data);
    const scrollIndex = Math.floor(Math.max(0, props.initialScrollIndex ?? 0));

    return {
      first: scrollIndex,
      last:
        Math.min(
          itemCount,
          scrollIndex + initialNumToRenderOrDefault(props.initialNumToRender),
        ) - 1,
    };
  }

  static _ensureClosestStickyHeader(
    props: Props,
    stickyIndicesSet: Set<number>,
    renderMask: CellRenderMask,
    cellIdx: number,
  ) {
    const stickyOffset = props.ListHeaderComponent ? 1 : 0;

    for (let itemIdx = cellIdx - 1; itemIdx >= 0; itemIdx--) {
      if (stickyIndicesSet.has(itemIdx + stickyOffset)) {
        renderMask.addCells({first: itemIdx, last: itemIdx});
        break;
      }
    }
  }

  _adjustCellsAroundViewport(
    props: Props,
    cellsAroundViewport: {first: number, last: number},
  ): {first: number, last: number} {
    const {data, getItemCount} = props;
    const onEndReachedThreshold = onEndReachedThresholdOrDefault(
      props.onEndReachedThreshold,
    );
    this._updateViewableItems(props, cellsAroundViewport);

    const {contentLength, offset, visibleLength} = this._scrollMetrics;
    const distanceFromEnd = contentLength - visibleLength - offset;

    // Wait until the scroll view metrics have been set up. And until then,
    // we will trust the initialNumToRender suggestion
    if (visibleLength <= 0 || contentLength <= 0) {
      return cellsAroundViewport.last >= getItemCount(data)
        ? VirtualizedList._constrainToItemCount(cellsAroundViewport, props)
        : cellsAroundViewport;
    }

    let newCellsAroundViewport: {first: number, last: number};
    if (props.disableVirtualization) {
      const renderAhead =
        distanceFromEnd < onEndReachedThreshold * visibleLength
          ? maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch)
          : 0;

      newCellsAroundViewport = {
        first: 0,
        last: Math.min(
          cellsAroundViewport.last + renderAhead,
          getItemCount(data) - 1,
        ),
      };
    } else {
      // If we have a non-zero initialScrollIndex and run this before we've scrolled,
      // we'll wipe out the initialNumToRender rendered elements starting at initialScrollIndex.
      // So let's wait until we've scrolled the view to the right place. And until then,
      // we will trust the initialScrollIndex suggestion.

      // Thus, we want to recalculate the windowed render limits if any of the following hold:
      // - initialScrollIndex is undefined or is 0
      // - initialScrollIndex > 0 AND scrolling is complete
      // - initialScrollIndex > 0 AND the end of the list is visible (this handles the case
      //   where the list is shorter than the visible area)
      if (
        props.initialScrollIndex &&
        !this._scrollMetrics.offset &&
        Math.abs(distanceFromEnd) >= Number.EPSILON
      ) {
        return cellsAroundViewport.last >= getItemCount(data)
          ? VirtualizedList._constrainToItemCount(cellsAroundViewport, props)
          : cellsAroundViewport;
      }

      newCellsAroundViewport = computeWindowedRenderLimits(
        props,
        maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch),
        windowSizeOrDefault(props.windowSize),
        cellsAroundViewport,
        this.__getFrameMetricsApprox,
        this._scrollMetrics,
      );
      invariant(
        newCellsAroundViewport.last < getItemCount(data),
        'computeWindowedRenderLimits() should return range in-bounds',
      );
    }

    if (this._nestedChildLists.size() > 0) {
      // If some cell in the new state has a child list in it, we should only render
      // up through that item, so that we give that list a chance to render.
      // Otherwise there's churn from multiple child lists mounting and un-mounting
      // their items.

      // Will this prevent rendering if the nested list doesn't realize the end?
      const childIdx = this._findFirstChildWithMore(
        newCellsAroundViewport.first,
        newCellsAroundViewport.last,
      );

      newCellsAroundViewport.last = childIdx ?? newCellsAroundViewport.last;
    }

    return newCellsAroundViewport;
  }

  _findFirstChildWithMore(first: number, last: number): number | null {
    for (let ii = first; ii <= last; ii++) {
      const cellKeyForIndex = this._indicesToKeys.get(ii);
      if (
        cellKeyForIndex != null &&
        this._nestedChildLists.anyInCell(cellKeyForIndex, childList =>
          childList.hasMore(),
        )
      ) {
        return ii;
      }
    }

    return null;
  }

  componentDidMount() {
    if (this._isNestedWithSameOrientation()) {
      this.context.registerAsNestedChild({
        ref: this,
        cellKey: this.context.cellKey,
      });
    }
  }

  componentWillUnmount() {
    if (this._isNestedWithSameOrientation()) {
      this.context.unregisterAsNestedChild({ref: this});
    }
    this._updateCellsToRenderBatcher.dispose({abort: true});
    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.dispose();
    });
    this._fillRateHelper.deactivateAndFlush();
  }

  static getDerivedStateFromProps(newProps: Props, prevState: State): State {
    // first and last could be stale (e.g. if a new, shorter items props is passed in), so we make
    // sure we're rendering a reasonable range here.
    const itemCount = newProps.getItemCount(newProps.data);
    if (itemCount === prevState.renderMask.numCells()) {
      return prevState;
    }

    const constrainedCells = VirtualizedList._constrainToItemCount(
      prevState.cellsAroundViewport,
      newProps,
    );

    return {
      cellsAroundViewport: constrainedCells,
      renderMask: VirtualizedList._createRenderMask(newProps, constrainedCells),
    };
  }

  _pushCells(
    cells: Array<Object>,
    stickyHeaderIndices: Array<number>,
    stickyIndicesFromProps: Set<number>,
    first: number,
    last: number,
    inversionStyle: ViewStyleProp,
  ) {
    const {
      CellRendererComponent,
      ItemSeparatorComponent,
      ListHeaderComponent,
      ListItemComponent,
      data,
      debug,
      getItem,
      getItemCount,
      getItemLayout,
      horizontal,
      renderItem,
    } = this.props;
    const stickyOffset = ListHeaderComponent ? 1 : 0;
    const end = getItemCount(data) - 1;
    let prevCellKey;
    last = Math.min(end, last);
    for (let ii = first; ii <= last; ii++) {
      const item = getItem(data, ii);
      const key = this._keyExtractor(item, ii, this.props);
      this._indicesToKeys.set(ii, key);
      if (stickyIndicesFromProps.has(ii + stickyOffset)) {
        stickyHeaderIndices.push(cells.length);
      }
      cells.push(
        <CellRenderer
          CellRendererComponent={CellRendererComponent}
          ItemSeparatorComponent={ii < end ? ItemSeparatorComponent : undefined}
          ListItemComponent={ListItemComponent}
          cellKey={key}
          debug={debug}
          fillRateHelper={this._fillRateHelper}
          getItemLayout={getItemLayout}
          horizontal={horizontal}
          index={ii}
          inversionStyle={inversionStyle}
          item={item}
          key={key}
          prevCellKey={prevCellKey}
          onCellLayout={this._onCellLayout}
          onUpdateSeparators={this._onUpdateSeparators}
          onCellFocusCapture={e => this._onCellFocusCapture(key)}
          onUnmount={this._onCellUnmount}
          ref={ref => {
            this._cellRefs[key] = ref;
          }}
          renderItem={renderItem}
        />,
      );
      prevCellKey = key;
    }
  }

  static _constrainToItemCount(
    cells: {first: number, last: number},
    props: Props,
  ): {first: number, last: number} {
    const itemCount = props.getItemCount(props.data);
    const last = Math.min(itemCount - 1, cells.last);

    const maxToRenderPerBatch = maxToRenderPerBatchOrDefault(
      props.maxToRenderPerBatch,
    );

    return {
      first: clamp(0, itemCount - 1 - maxToRenderPerBatch, cells.first),
      last,
    };
  }

  _onUpdateSeparators = (keys: Array<?string>, newProps: Object) => {
    keys.forEach(key => {
      const ref = key != null && this._cellRefs[key];
      ref && ref.updateSeparatorProps(newProps);
    });
  };

  _isNestedWithSameOrientation(): boolean {
    const nestedContext = this.context;
    return !!(
      nestedContext &&
      !!nestedContext.horizontal === horizontalOrDefault(this.props.horizontal)
    );
  }

  _getSpacerKey = (isVertical: boolean): string =>
    isVertical ? 'height' : 'width';

  _keyExtractor(
    item: Item,
    index: number,
    props: {
      keyExtractor?: ?(item: Item, index: number) => string,
      ...
    },
    // $FlowFixMe[missing-local-annot]
  ) {
    if (props.keyExtractor != null) {
      return props.keyExtractor(item, index);
    }

    const key = defaultKeyExtractor(item, index);
    if (key === String(index)) {
      _usedIndexForKey = true;
      if (item.type && item.type.displayName) {
        _keylessItemComponentName = item.type.displayName;
      }
    }
    return key;
  }

  render(): React.Node {
    if (__DEV__) {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const flatStyles = StyleSheet.flatten(this.props.contentContainerStyle);
      if (flatStyles != null && flatStyles.flexWrap === 'wrap') {
        console.warn(
          '`flexWrap: `wrap`` is not supported with the `VirtualizedList` components.' +
            'Consider using `numColumns` with `FlatList` instead.',
        );
      }
    }
    const {ListEmptyComponent, ListFooterComponent, ListHeaderComponent} =
      this.props;
    const {data, horizontal} = this.props;
    const inversionStyle = this.props.inverted
      ? horizontalOrDefault(this.props.horizontal)
        ? styles.horizontallyInverted
        : styles.verticallyInverted
      : null;
    const cells: Array<any | React.Node> = [];
    const stickyIndicesFromProps = new Set(this.props.stickyHeaderIndices);
    const stickyHeaderIndices = [];

    // 1. Add cell for ListHeaderComponent
    if (ListHeaderComponent) {
      if (stickyIndicesFromProps.has(0)) {
        stickyHeaderIndices.push(0);
      }
      const element = React.isValidElement(ListHeaderComponent) ? (
        ListHeaderComponent
      ) : (
        // $FlowFixMe[not-a-component]
        // $FlowFixMe[incompatible-type-arg]
        <ListHeaderComponent />
      );
      cells.push(
        <VirtualizedListCellContextProvider
          cellKey={this._getCellKey() + '-header'}
          key="$header">
          <View
            onLayout={this._onLayoutHeader}
            style={StyleSheet.compose(
              inversionStyle,
              this.props.ListHeaderComponentStyle,
            )}>
            {
              // $FlowFixMe[incompatible-type] - Typing ReactNativeComponent revealed errors
              element
            }
          </View>
        </VirtualizedListCellContextProvider>,
      );
    }

    // 2a. Add a cell for ListEmptyComponent if applicable
    const itemCount = this.props.getItemCount(data);
    if (itemCount === 0 && ListEmptyComponent) {
      const element: React.Element<any> = ((React.isValidElement(
        ListEmptyComponent,
      ) ? (
        ListEmptyComponent
      ) : (
        // $FlowFixMe[not-a-component]
        // $FlowFixMe[incompatible-type-arg]
        <ListEmptyComponent />
      )): any);
      cells.push(
        <VirtualizedListCellContextProvider
          cellKey={this._getCellKey() + '-empty'}
          key="$empty">
          {React.cloneElement(element, {
            onLayout: (event: LayoutEvent) => {
              this._onLayoutEmpty(event);
              if (element.props.onLayout) {
                element.props.onLayout(event);
              }
            },
            style: StyleSheet.compose(inversionStyle, element.props.style),
          })}
        </VirtualizedListCellContextProvider>,
      );
    }

    // 2b. Add cells and spacers for each item
    if (itemCount > 0) {
      _usedIndexForKey = false;
      _keylessItemComponentName = '';
      const spacerKey = this._getSpacerKey(!horizontal);

      const renderRegions = this.state.renderMask.enumerateRegions();
      const lastSpacer = findLastWhere(renderRegions, r => r.isSpacer);

      for (const section of renderRegions) {
        if (section.isSpacer) {
          // Legacy behavior is to avoid spacers when virtualization is
          // disabled (including head spacers on initial render).
          if (this.props.disableVirtualization) {
            continue;
          }

          // Without getItemLayout, we limit our tail spacer to the _highestMeasuredFrameIndex to
          // prevent the user for hyperscrolling into un-measured area because otherwise content will
          // likely jump around as it renders in above the viewport.
          const isLastSpacer = section === lastSpacer;
          const constrainToMeasured = isLastSpacer && !this.props.getItemLayout;
          const last = constrainToMeasured
            ? clamp(
                section.first - 1,
                section.last,
                this._highestMeasuredFrameIndex,
              )
            : section.last;

          const firstMetrics = this.__getFrameMetricsApprox(
            section.first,
            this.props,
          );
          const lastMetrics = this.__getFrameMetricsApprox(last, this.props);
          const spacerSize =
            lastMetrics.offset + lastMetrics.length - firstMetrics.offset;
          cells.push(
            <View
              key={`$spacer-${section.first}`}
              style={{[spacerKey]: spacerSize}}
            />,
          );
        } else {
          this._pushCells(
            cells,
            stickyHeaderIndices,
            stickyIndicesFromProps,
            section.first,
            section.last,
            inversionStyle,
          );
        }
      }

      if (!this._hasWarned.keys && _usedIndexForKey) {
        console.warn(
          'VirtualizedList: missing keys for items, make sure to specify a key or id property on each ' +
            'item or provide a custom keyExtractor.',
          _keylessItemComponentName,
        );
        this._hasWarned.keys = true;
      }
    }

    // 3. Add cell for ListFooterComponent
    if (ListFooterComponent) {
      const element = React.isValidElement(ListFooterComponent) ? (
        ListFooterComponent
      ) : (
        // $FlowFixMe[not-a-component]
        // $FlowFixMe[incompatible-type-arg]
        <ListFooterComponent />
      );
      cells.push(
        <VirtualizedListCellContextProvider
          cellKey={this._getFooterCellKey()}
          key="$footer">
          <View
            onLayout={this._onLayoutFooter}
            style={StyleSheet.compose(
              inversionStyle,
              this.props.ListFooterComponentStyle,
            )}>
            {
              // $FlowFixMe[incompatible-type] - Typing ReactNativeComponent revealed errors
              element
            }
          </View>
        </VirtualizedListCellContextProvider>,
      );
    }

    // 4. Render the ScrollView
    const scrollProps = {
      ...this.props,
      onContentSizeChange: this._onContentSizeChange,
      onLayout: this._onLayout,
      onScroll: this._onScroll,
      onScrollBeginDrag: this._onScrollBeginDrag,
      onScrollEndDrag: this._onScrollEndDrag,
      onMomentumScrollBegin: this._onMomentumScrollBegin,
      onMomentumScrollEnd: this._onMomentumScrollEnd,
      scrollEventThrottle: scrollEventThrottleOrDefault(
        this.props.scrollEventThrottle,
      ), // TODO: Android support
      invertStickyHeaders:
        this.props.invertStickyHeaders !== undefined
          ? this.props.invertStickyHeaders
          : this.props.inverted,
      stickyHeaderIndices,
      style: inversionStyle
        ? [inversionStyle, this.props.style]
        : this.props.style,
    };

    this._hasMore = this.state.cellsAroundViewport.last < itemCount - 1;

    const innerRet = (
      <VirtualizedListContextProvider
        value={{
          cellKey: null,
          getScrollMetrics: this._getScrollMetrics,
          horizontal: horizontalOrDefault(this.props.horizontal),
          getOutermostParentListRef: this._getOutermostParentListRef,
          registerAsNestedChild: this._registerAsNestedChild,
          unregisterAsNestedChild: this._unregisterAsNestedChild,
        }}>
        {React.cloneElement(
          (
            this.props.renderScrollComponent ||
            this._defaultRenderScrollComponent
          )(scrollProps),
          {
            ref: this._captureScrollRef,
          },
          cells,
        )}
      </VirtualizedListContextProvider>
    );
    let ret: React.Node = innerRet;
    if (__DEV__) {
      ret = (
        <ScrollView.Context.Consumer>
          {scrollContext => {
            if (
              scrollContext != null &&
              !scrollContext.horizontal ===
                !horizontalOrDefault(this.props.horizontal) &&
              !this._hasWarned.nesting &&
              this.context == null &&
              this.props.scrollEnabled !== false
            ) {
              // TODO (T46547044): use React.warn once 16.9 is sync'd: https://github.com/facebook/react/pull/15170
              console.error(
                'VirtualizedLists should never be nested inside plain ScrollViews with the same ' +
                  'orientation because it can break windowing and other functionality - use another ' +
                  'VirtualizedList-backed container instead.',
              );
              this._hasWarned.nesting = true;
            }
            return innerRet;
          }}
        </ScrollView.Context.Consumer>
      );
    }
    if (this.props.debug) {
      return (
        <View style={styles.debug}>
          {ret}
          {this._renderDebugOverlay()}
        </View>
      );
    } else {
      return ret;
    }
  }

  componentDidUpdate(prevProps: Props) {
    const {data, extraData} = this.props;
    if (data !== prevProps.data || extraData !== prevProps.extraData) {
      // clear the viewableIndices cache to also trigger
      // the onViewableItemsChanged callback with the new data
      this._viewabilityTuples.forEach(tuple => {
        tuple.viewabilityHelper.resetViewableIndices();
      });
    }
    // The `this._hiPriInProgress` is guaranteeing a hiPri cell update will only happen
    // once per fiber update. The `_scheduleCellsToRenderUpdate` will set it to true
    // if a hiPri update needs to perform. If `componentDidUpdate` is triggered with
    // `this._hiPriInProgress=true`, means it's triggered by the hiPri update. The
    // `_scheduleCellsToRenderUpdate` will check this condition and not perform
    // another hiPri update.
    const hiPriInProgress = this._hiPriInProgress;
    this._scheduleCellsToRenderUpdate();
    // Make sure setting `this._hiPriInProgress` back to false after `componentDidUpdate`
    // is triggered with `this._hiPriInProgress = true`
    if (hiPriInProgress) {
      this._hiPriInProgress = false;
    }
  }

  _averageCellLength = 0;
  _cellRefs: {[string]: null | CellRenderer<any>} = {};
  _fillRateHelper: FillRateHelper;
  _frames: {
    [string]: {
      inLayout?: boolean,
      index: number,
      length: number,
      offset: number,
    },
  } = {};
  _footerLength = 0;
  // Used for preventing scrollToIndex from being called multiple times for initialScrollIndex
  _hasTriggeredInitialScrollToIndex = false;
  _hasInteracted = false;
  _hasMore = false;
  _hasWarned: {[string]: boolean} = {};
  _headerLength = 0;
  _hiPriInProgress: boolean = false; // flag to prevent infinite hiPri cell limit update
  _highestMeasuredFrameIndex = 0;
  _indicesToKeys: Map<number, string> = new Map();
  _lastFocusedCellKey: ?string = null;
  _nestedChildLists: ChildListCollection<VirtualizedList> =
    new ChildListCollection();
  _offsetFromParentVirtualizedList: number = 0;
  _prevParentOffset: number = 0;
  // $FlowFixMe[missing-local-annot]
  _scrollMetrics = {
    contentLength: 0,
    dOffset: 0,
    dt: 10,
    offset: 0,
    timestamp: 0,
    velocity: 0,
    visibleLength: 0,
    zoomScale: 1,
  };
  _scrollRef: ?React.ElementRef<any> = null;
  _sentStartForContentLength = 0;
  _sentEndForContentLength = 0;
  _totalCellLength = 0;
  _totalCellsMeasured = 0;
  _updateCellsToRenderBatcher: Batchinator;
  _viewabilityTuples: Array<ViewabilityHelperCallbackTuple> = [];

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  _captureScrollRef = ref => {
    this._scrollRef = ref;
  };

  _computeBlankness() {
    this._fillRateHelper.computeBlankness(
      this.props,
      this.state.cellsAroundViewport,
      this._scrollMetrics,
    );
  }

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  _defaultRenderScrollComponent = props => {
    const onRefresh = props.onRefresh;
    if (this._isNestedWithSameOrientation()) {
      // $FlowFixMe[prop-missing] - Typing ReactNativeComponent revealed errors
      return <View {...props} />;
    } else if (onRefresh) {
      invariant(
        typeof props.refreshing === 'boolean',
        '`refreshing` prop must be set as a boolean in order to use `onRefresh`, but got `' +
          JSON.stringify(props.refreshing ?? 'undefined') +
          '`',
      );
      return (
        // $FlowFixMe[prop-missing] Invalid prop usage
        // $FlowFixMe[incompatible-use]
        <ScrollView
          {...props}
          refreshControl={
            props.refreshControl == null ? (
              <RefreshControl
                // $FlowFixMe[incompatible-type]
                refreshing={props.refreshing}
                onRefresh={onRefresh}
                progressViewOffset={props.progressViewOffset}
              />
            ) : (
              props.refreshControl
            )
          }
        />
      );
    } else {
      // $FlowFixMe[prop-missing] Invalid prop usage
      // $FlowFixMe[incompatible-use]
      return <ScrollView {...props} />;
    }
  };

  _onCellLayout = (e: LayoutEvent, cellKey: string, index: number): void => {
    const layout = e.nativeEvent.layout;
    const next = {
      offset: this._selectOffset(layout),
      length: this._selectLength(layout),
      index,
      inLayout: true,
    };
    const curr = this._frames[cellKey];
    if (
      !curr ||
      next.offset !== curr.offset ||
      next.length !== curr.length ||
      index !== curr.index
    ) {
      this._totalCellLength += next.length - (curr ? curr.length : 0);
      this._totalCellsMeasured += curr ? 0 : 1;
      this._averageCellLength =
        this._totalCellLength / this._totalCellsMeasured;
      this._frames[cellKey] = next;
      this._highestMeasuredFrameIndex = Math.max(
        this._highestMeasuredFrameIndex,
        index,
      );
      this._scheduleCellsToRenderUpdate();
    } else {
      this._frames[cellKey].inLayout = true;
    }

    this._triggerRemeasureForChildListsInCell(cellKey);

    this._computeBlankness();
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
  };

  _onCellFocusCapture(cellKey: string) {
    this._lastFocusedCellKey = cellKey;
    this._updateCellsToRender();
  }

  _onCellUnmount = (cellKey: string) => {
    const curr = this._frames[cellKey];
    if (curr) {
      this._frames[cellKey] = {...curr, inLayout: false};
    }
  };

  _triggerRemeasureForChildListsInCell(cellKey: string): void {
    this._nestedChildLists.forEachInCell(cellKey, childList => {
      childList.measureLayoutRelativeToContainingList();
    });
  }

  measureLayoutRelativeToContainingList(): void {
    // TODO (T35574538): findNodeHandle sometimes crashes with "Unable to find
    // node on an unmounted component" during scrolling
    try {
      if (!this._scrollRef) {
        return;
      }
      // We are assuming that getOutermostParentListRef().getScrollRef()
      // is a non-null reference to a ScrollView
      this._scrollRef.measureLayout(
        this.context.getOutermostParentListRef().getScrollRef(),
        (x, y, width, height) => {
          this._offsetFromParentVirtualizedList = this._selectOffset({x, y});
          this._scrollMetrics.contentLength = this._selectLength({
            width,
            height,
          });
          const scrollMetrics = this._convertParentScrollMetrics(
            this.context.getScrollMetrics(),
          );

          const metricsChanged =
            this._scrollMetrics.visibleLength !== scrollMetrics.visibleLength ||
            this._scrollMetrics.offset !== scrollMetrics.offset;

          if (metricsChanged) {
            this._scrollMetrics.visibleLength = scrollMetrics.visibleLength;
            this._scrollMetrics.offset = scrollMetrics.offset;

            // If metrics of the scrollView changed, then we triggered remeasure for child list
            // to ensure VirtualizedList has the right information.
            this._nestedChildLists.forEach(childList => {
              childList.measureLayoutRelativeToContainingList();
            });
          }
        },
        error => {
          console.warn(
            "VirtualizedList: Encountered an error while measuring a list's" +
              ' offset from its containing VirtualizedList.',
          );
        },
      );
    } catch (error) {
      console.warn(
        'measureLayoutRelativeToContainingList threw an error',
        error.stack,
      );
    }
  }

  _onLayout = (e: LayoutEvent) => {
    if (this._isNestedWithSameOrientation()) {
      // Need to adjust our scroll metrics to be relative to our containing
      // VirtualizedList before we can make claims about list item viewability
      this.measureLayoutRelativeToContainingList();
    } else {
      this._scrollMetrics.visibleLength = this._selectLength(
        e.nativeEvent.layout,
      );
    }
    this.props.onLayout && this.props.onLayout(e);
    this._scheduleCellsToRenderUpdate();
    this._maybeCallOnEdgeReached();
  };

  _onLayoutEmpty = (e: LayoutEvent) => {
    this.props.onLayout && this.props.onLayout(e);
  };

  _getFooterCellKey(): string {
    return this._getCellKey() + '-footer';
  }

  _onLayoutFooter = (e: LayoutEvent) => {
    this._triggerRemeasureForChildListsInCell(this._getFooterCellKey());
    this._footerLength = this._selectLength(e.nativeEvent.layout);
  };

  _onLayoutHeader = (e: LayoutEvent) => {
    this._headerLength = this._selectLength(e.nativeEvent.layout);
  };

  // $FlowFixMe[missing-local-annot]
  _renderDebugOverlay() {
    const normalize =
      this._scrollMetrics.visibleLength /
      (this._scrollMetrics.contentLength || 1);
    const framesInLayout = [];
    const itemCount = this.props.getItemCount(this.props.data);
    for (let ii = 0; ii < itemCount; ii++) {
      const frame = this.__getFrameMetricsApprox(ii, this.props);
      /* $FlowFixMe[prop-missing] (>=0.68.0 site=react_native_fb) This comment
       * suppresses an error found when Flow v0.68 was deployed. To see the
       * error delete this comment and run Flow. */
      if (frame.inLayout) {
        framesInLayout.push(frame);
      }
    }
    const windowTop = this.__getFrameMetricsApprox(
      this.state.cellsAroundViewport.first,
      this.props,
    ).offset;
    const frameLast = this.__getFrameMetricsApprox(
      this.state.cellsAroundViewport.last,
      this.props,
    );
    const windowLen = frameLast.offset + frameLast.length - windowTop;
    const visTop = this._scrollMetrics.offset;
    const visLen = this._scrollMetrics.visibleLength;

    return (
      <View style={[styles.debugOverlayBase, styles.debugOverlay]}>
        {framesInLayout.map((f, ii) => (
          <View
            key={'f' + ii}
            style={[
              styles.debugOverlayBase,
              styles.debugOverlayFrame,
              {
                top: f.offset * normalize,
                height: f.length * normalize,
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.debugOverlayBase,
            styles.debugOverlayFrameLast,
            {
              top: windowTop * normalize,
              height: windowLen * normalize,
            },
          ]}
        />
        <View
          style={[
            styles.debugOverlayBase,
            styles.debugOverlayFrameVis,
            {
              top: visTop * normalize,
              height: visLen * normalize,
            },
          ]}
        />
      </View>
    );
  }

  _selectLength(
    metrics: $ReadOnly<{
      height: number,
      width: number,
      ...
    }>,
  ): number {
    return !horizontalOrDefault(this.props.horizontal)
      ? metrics.height
      : metrics.width;
  }

  _selectOffset(
    metrics: $ReadOnly<{
      x: number,
      y: number,
      ...
    }>,
  ): number {
    return !horizontalOrDefault(this.props.horizontal) ? metrics.y : metrics.x;
  }

  _maybeCallOnEdgeReached() {
    const {
      data,
      getItemCount,
      onStartReached,
      onStartReachedThreshold,
      onEndReached,
      onEndReachedThreshold,
      initialScrollIndex,
    } = this.props;
    const {contentLength, visibleLength, offset} = this._scrollMetrics;
    let distanceFromStart = offset;
    let distanceFromEnd = contentLength - visibleLength - offset;

    // Especially when oERT is zero it's necessary to 'floor' very small distance values to be 0
    // since debouncing causes us to not fire this event for every single "pixel" we scroll and can thus
    // be at the edge of the list with a distance approximating 0 but not quite there.
    if (distanceFromStart < ON_EDGE_REACHED_EPSILON) {
      distanceFromStart = 0;
    }
    if (distanceFromEnd < ON_EDGE_REACHED_EPSILON) {
      distanceFromEnd = 0;
    }

    // TODO: T121172172 Look into why we're "defaulting" to a threshold of 2px
    // when oERT is not present (different from 2 viewports used elsewhere)
    const DEFAULT_THRESHOLD_PX = 2;

    const startThreshold =
      onStartReachedThreshold != null
        ? onStartReachedThreshold * visibleLength
        : DEFAULT_THRESHOLD_PX;
    const endThreshold =
      onEndReachedThreshold != null
        ? onEndReachedThreshold * visibleLength
        : DEFAULT_THRESHOLD_PX;
    const isWithinStartThreshold = distanceFromStart <= startThreshold;
    const isWithinEndThreshold = distanceFromEnd <= endThreshold;

    // First check if the user just scrolled within the end threshold
    // and call onEndReached only once for a given content length,
    // and only if onStartReached is not being executed
    if (
      onEndReached &&
      this.state.cellsAroundViewport.last === getItemCount(data) - 1 &&
      isWithinEndThreshold &&
      this._scrollMetrics.contentLength !== this._sentEndForContentLength
    ) {
      this._sentEndForContentLength = this._scrollMetrics.contentLength;
      onEndReached({distanceFromEnd});
    }

    // Next check if the user just scrolled within the start threshold
    // and call onStartReached only once for a given content length,
    // and only if onEndReached is not being executed
    else if (
      onStartReached != null &&
      this.state.cellsAroundViewport.first === 0 &&
      isWithinStartThreshold &&
      this._scrollMetrics.contentLength !== this._sentStartForContentLength
    ) {
      // On initial mount when using initialScrollIndex the offset will be 0 initially
      // and will trigger an unexpected onStartReached. To avoid this we can use
      // timestamp to differentiate between the initial scroll metrics and when we actually
      // received the first scroll event.
      if (!initialScrollIndex || this._scrollMetrics.timestamp !== 0) {
        this._sentStartForContentLength = this._scrollMetrics.contentLength;
        onStartReached({distanceFromStart});
      }
    }

    // If the user scrolls away from the start or end and back again,
    // cause onStartReached or onEndReached to be triggered again
    else {
      this._sentStartForContentLength = isWithinStartThreshold
        ? this._sentStartForContentLength
        : 0;
      this._sentEndForContentLength = isWithinEndThreshold
        ? this._sentEndForContentLength
        : 0;
    }
  }

  _onContentSizeChange = (width: number, height: number) => {
    if (
      width > 0 &&
      height > 0 &&
      this.props.initialScrollIndex != null &&
      this.props.initialScrollIndex > 0 &&
      !this._hasTriggeredInitialScrollToIndex
    ) {
      if (this.props.contentOffset == null) {
        this.scrollToIndex({
          animated: false,
          index: this.props.initialScrollIndex,
        });
      }
      this._hasTriggeredInitialScrollToIndex = true;
    }
    if (this.props.onContentSizeChange) {
      this.props.onContentSizeChange(width, height);
    }
    this._scrollMetrics.contentLength = this._selectLength({height, width});
    this._scheduleCellsToRenderUpdate();
    this._maybeCallOnEdgeReached();
  };

  /* Translates metrics from a scroll event in a parent VirtualizedList into
   * coordinates relative to the child list.
   */
  _convertParentScrollMetrics = (metrics: {
    visibleLength: number,
    offset: number,
    ...
  }): $FlowFixMe => {
    // Offset of the top of the nested list relative to the top of its parent's viewport
    const offset = metrics.offset - this._offsetFromParentVirtualizedList;
    // Child's visible length is the same as its parent's
    const visibleLength = metrics.visibleLength;
    const dOffset = offset - this._scrollMetrics.offset;
    const contentLength = this._scrollMetrics.contentLength;

    return {
      visibleLength,
      contentLength,
      offset,
      dOffset,
    };
  };

  _onScroll = (e: Object) => {
    this._nestedChildLists.forEach(childList => {
      childList._onScroll(e);
    });
    if (this.props.onScroll) {
      this.props.onScroll(e);
    }
    const timestamp = e.timeStamp;
    let visibleLength = this._selectLength(e.nativeEvent.layoutMeasurement);
    let contentLength = this._selectLength(e.nativeEvent.contentSize);
    let offset = this._selectOffset(e.nativeEvent.contentOffset);
    let dOffset = offset - this._scrollMetrics.offset;

    if (this._isNestedWithSameOrientation()) {
      if (this._scrollMetrics.contentLength === 0) {
        // Ignore scroll events until onLayout has been called and we
        // know our offset from our offset from our parent
        return;
      }
      ({visibleLength, contentLength, offset, dOffset} =
        this._convertParentScrollMetrics({
          visibleLength,
          offset,
        }));
    }

    const dt = this._scrollMetrics.timestamp
      ? Math.max(1, timestamp - this._scrollMetrics.timestamp)
      : 1;
    const velocity = dOffset / dt;

    if (
      dt > 500 &&
      this._scrollMetrics.dt > 500 &&
      contentLength > 5 * visibleLength &&
      !this._hasWarned.perf
    ) {
      infoLog(
        'VirtualizedList: You have a large list that is slow to update - make sure your ' +
          'renderItem function renders components that follow React performance best practices ' +
          'like PureComponent, shouldComponentUpdate, etc.',
        {dt, prevDt: this._scrollMetrics.dt, contentLength},
      );
      this._hasWarned.perf = true;
    }

    // For invalid negative values (w/ RTL), set this to 1.
    const zoomScale = e.nativeEvent.zoomScale < 0 ? 1 : e.nativeEvent.zoomScale;
    this._scrollMetrics = {
      contentLength,
      dt,
      dOffset,
      offset,
      timestamp,
      velocity,
      visibleLength,
      zoomScale,
    };
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
    if (!this.props) {
      return;
    }
    this._maybeCallOnEdgeReached();
    if (velocity !== 0) {
      this._fillRateHelper.activate();
    }
    this._computeBlankness();
    this._scheduleCellsToRenderUpdate();
  };

  _scheduleCellsToRenderUpdate() {
    const {first, last} = this.state.cellsAroundViewport;
    const {offset, visibleLength, velocity} = this._scrollMetrics;
    const itemCount = this.props.getItemCount(this.props.data);
    let hiPri = false;
    const onStartReachedThreshold = onStartReachedThresholdOrDefault(
      this.props.onStartReachedThreshold,
    );
    const onEndReachedThreshold = onEndReachedThresholdOrDefault(
      this.props.onEndReachedThreshold,
    );
    // Mark as high priority if we're close to the start of the first item
    // But only if there are items before the first rendered item
    if (first > 0) {
      const distTop =
        offset - this.__getFrameMetricsApprox(first, this.props).offset;
      hiPri =
        distTop < 0 ||
        (velocity < -2 &&
          distTop <
            getScrollingThreshold(onStartReachedThreshold, visibleLength));
    }
    // Mark as high priority if we're close to the end of the last item
    // But only if there are items after the last rendered item
    if (!hiPri && last >= 0 && last < itemCount - 1) {
      const distBottom =
        this.__getFrameMetricsApprox(last, this.props).offset -
        (offset + visibleLength);
      hiPri =
        distBottom < 0 ||
        (velocity > 2 &&
          distBottom <
            getScrollingThreshold(onEndReachedThreshold, visibleLength));
    }
    // Only trigger high-priority updates if we've actually rendered cells,
    // and with that size estimate, accurately compute how many cells we should render.
    // Otherwise, it would just render as many cells as it can (of zero dimension),
    // each time through attempting to render more (limited by maxToRenderPerBatch),
    // starving the renderer from actually laying out the objects and computing _averageCellLength.
    // If this is triggered in an `componentDidUpdate` followed by a hiPri cellToRenderUpdate
    // We shouldn't do another hipri cellToRenderUpdate
    if (
      hiPri &&
      (this._averageCellLength || this.props.getItemLayout) &&
      !this._hiPriInProgress
    ) {
      this._hiPriInProgress = true;
      // Don't worry about interactions when scrolling quickly; focus on filling content as fast
      // as possible.
      this._updateCellsToRenderBatcher.dispose({abort: true});
      this._updateCellsToRender();
      return;
    } else {
      this._updateCellsToRenderBatcher.schedule();
    }
  }

  _onScrollBeginDrag = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList._onScrollBeginDrag(e);
    });
    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.recordInteraction();
    });
    this._hasInteracted = true;
    this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e);
  };

  _onScrollEndDrag = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList._onScrollEndDrag(e);
    });
    const {velocity} = e.nativeEvent;
    if (velocity) {
      this._scrollMetrics.velocity = this._selectOffset(velocity);
    }
    this._computeBlankness();
    this.props.onScrollEndDrag && this.props.onScrollEndDrag(e);
  };

  _onMomentumScrollBegin = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList._onMomentumScrollBegin(e);
    });
    this.props.onMomentumScrollBegin && this.props.onMomentumScrollBegin(e);
  };

  _onMomentumScrollEnd = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList._onMomentumScrollEnd(e);
    });
    this._scrollMetrics.velocity = 0;
    this._computeBlankness();
    this.props.onMomentumScrollEnd && this.props.onMomentumScrollEnd(e);
  };

  _updateCellsToRender = () => {
    this.setState((state, props) => {
      const cellsAroundViewport = this._adjustCellsAroundViewport(
        props,
        state.cellsAroundViewport,
      );
      const renderMask = VirtualizedList._createRenderMask(
        props,
        cellsAroundViewport,
        this._getNonViewportRenderRegions(props),
      );

      if (
        cellsAroundViewport.first === state.cellsAroundViewport.first &&
        cellsAroundViewport.last === state.cellsAroundViewport.last &&
        renderMask.equals(state.renderMask)
      ) {
        return null;
      }

      return {cellsAroundViewport, renderMask};
    });
  };

  _createViewToken = (
    index: number,
    isViewable: boolean,
    props: FrameMetricProps,
    // $FlowFixMe[missing-local-annot]
  ) => {
    const {data, getItem} = props;
    const item = getItem(data, index);
    return {
      index,
      item,
      key: this._keyExtractor(item, index, props),
      isViewable,
    };
  };

  /**
   * Gets an approximate offset to an item at a given index. Supports
   * fractional indices.
   */
  _getOffsetApprox = (index: number, props: FrameMetricProps): number => {
    if (Number.isInteger(index)) {
      return this.__getFrameMetricsApprox(index, props).offset;
    } else {
      const frameMetrics = this.__getFrameMetricsApprox(
        Math.floor(index),
        props,
      );
      const remainder = index - Math.floor(index);
      return frameMetrics.offset + remainder * frameMetrics.length;
    }
  };

  __getFrameMetricsApprox: (
    index: number,
    props: FrameMetricProps,
  ) => {
    length: number,
    offset: number,
    ...
  } = (index, props) => {
    const frame = this._getFrameMetrics(index, props);
    if (frame && frame.index === index) {
      // check for invalid frames due to row re-ordering
      return frame;
    } else {
      const {data, getItemCount, getItemLayout} = props;
      invariant(
        index >= 0 && index < getItemCount(data),
        'Tried to get frame for out of range index ' + index,
      );
      invariant(
        !getItemLayout,
        'Should not have to estimate frames when a measurement metrics function is provided',
      );
      return {
        length: this._averageCellLength,
        offset: this._averageCellLength * index,
      };
    }
  };

  _getFrameMetrics = (
    index: number,
    props: FrameMetricProps,
  ): ?{
    length: number,
    offset: number,
    index: number,
    inLayout?: boolean,
    ...
  } => {
    const {data, getItem, getItemCount, getItemLayout} = props;
    invariant(
      index >= 0 && index < getItemCount(data),
      'Tried to get frame for out of range index ' + index,
    );
    const item = getItem(data, index);
    const frame = this._frames[this._keyExtractor(item, index, props)];
    if (!frame || frame.index !== index) {
      if (getItemLayout) {
        /* $FlowFixMe[prop-missing] (>=0.63.0 site=react_native_fb) This comment
         * suppresses an error found when Flow v0.63 was deployed. To see the error
         * delete this comment and run Flow. */
        return getItemLayout(data, index);
      }
    }
    return frame;
  };

  _getNonViewportRenderRegions = (
    props: FrameMetricProps,
  ): $ReadOnlyArray<{
    first: number,
    last: number,
  }> => {
    // Keep a viewport's worth of content around the last focused cell to allow
    // random navigation around it without any blanking. E.g. tabbing from one
    // focused item out of viewport to another.
    if (
      !(this._lastFocusedCellKey && this._cellRefs[this._lastFocusedCellKey])
    ) {
      return [];
    }

    const lastFocusedCellRenderer = this._cellRefs[this._lastFocusedCellKey];
    const focusedCellIndex = lastFocusedCellRenderer.props.index;
    const itemCount = props.getItemCount(props.data);

    // The cell may have been unmounted and have a stale index
    if (
      focusedCellIndex >= itemCount ||
      this._indicesToKeys.get(focusedCellIndex) !== this._lastFocusedCellKey
    ) {
      return [];
    }

    let first = focusedCellIndex;
    let heightOfCellsBeforeFocused = 0;
    for (
      let i = first - 1;
      i >= 0 && heightOfCellsBeforeFocused < this._scrollMetrics.visibleLength;
      i--
    ) {
      first--;
      heightOfCellsBeforeFocused += this.__getFrameMetricsApprox(
        i,
        props,
      ).length;
    }

    let last = focusedCellIndex;
    let heightOfCellsAfterFocused = 0;
    for (
      let i = last + 1;
      i < itemCount &&
      heightOfCellsAfterFocused < this._scrollMetrics.visibleLength;
      i++
    ) {
      last++;
      heightOfCellsAfterFocused += this.__getFrameMetricsApprox(
        i,
        props,
      ).length;
    }

    return [{first, last}];
  };

  _updateViewableItems(
    props: FrameMetricProps,
    cellsAroundViewport: {first: number, last: number},
  ) {
    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.onUpdate(
        props,
        this._scrollMetrics.offset,
        this._scrollMetrics.visibleLength,
        this._getFrameMetrics,
        this._createViewToken,
        tuple.onViewableItemsChanged,
        cellsAroundViewport,
      );
    });
  }
}

const styles = StyleSheet.create({
  verticallyInverted: {
    transform: [{scaleY: -1}],
  },
  horizontallyInverted: {
    transform: [{scaleX: -1}],
  },
  debug: {
    flex: 1,
  },
  debugOverlayBase: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  debugOverlay: {
    bottom: 0,
    width: 20,
    borderColor: 'blue',
    borderWidth: 1,
  },
  debugOverlayFrame: {
    left: 0,
    backgroundColor: 'orange',
  },
  debugOverlayFrameLast: {
    left: 0,
    borderColor: 'green',
    borderWidth: 2,
  },
  debugOverlayFrameVis: {
    left: 0,
    borderColor: 'red',
    borderWidth: 2,
  },
});

module.exports = VirtualizedList;
