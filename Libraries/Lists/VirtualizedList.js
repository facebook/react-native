/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ScrollResponderType} from '../Components/ScrollView/ScrollView';
import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {LayoutEvent, ScrollEvent} from '../Types/CoreEventTypes';
import type {
  ViewabilityConfig,
  ViewabilityConfigCallbackPair,
  ViewToken,
} from './ViewabilityHelper';

import {
  type ChildListState,
  type ListDebugInfo,
  VirtualizedListCellContextProvider,
  VirtualizedListContext,
  VirtualizedListContextProvider,
} from './VirtualizedListContext.js';
import {
  computeWindowedRenderLimits,
  keyExtractor as defaultKeyExtractor,
} from './VirtualizeUtils';
import * as React from 'react';

const RefreshControl = require('../Components/RefreshControl/RefreshControl');
const ScrollView = require('../Components/ScrollView/ScrollView');
const View = require('../Components/View/View');
const Batchinator = require('../Interaction/Batchinator');
const ReactNative = require('../Renderer/shims/ReactNative');
const flattenStyle = require('../StyleSheet/flattenStyle');
const StyleSheet = require('../StyleSheet/StyleSheet');
const infoLog = require('../Utilities/infoLog');
const FillRateHelper = require('./FillRateHelper');
const ViewabilityHelper = require('./ViewabilityHelper');
const invariant = require('invariant');

const ON_END_REACHED_EPSILON = 0.001;

type Item = any;

export type Separators = {
  highlight: () => void,
  unhighlight: () => void,
  updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
  ...
};

export type RenderItemProps<ItemT> = {
  item: ItemT,
  index: number,
  separators: Separators,
  ...
};

export type RenderItemType<ItemT> = (
  info: RenderItemProps<ItemT>,
) => React.Node;

type ViewabilityHelperCallbackTuple = {
  viewabilityHelper: ViewabilityHelper,
  onViewableItemsChanged: (info: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
    ...
  }) => void,
  ...
};

type RequiredProps = {|
  /**
   * The default accessor functions assume this is an Array<{key: string} | {id: string}> but you can override
   * getItem, getItemCount, and keyExtractor to handle any type of index-based data.
   */
  data?: any,
  /**
   * A generic accessor for extracting an item from any sort of data blob.
   */
  getItem: (data: any, index: number) => ?Item,
  /**
   * Determines how many items are in the data blob.
   */
  getItemCount: (data: any) => number,
|};
type OptionalProps = {|
  renderItem?: ?RenderItemType<Item>,
  /**
   * `debug` will turn on extra logging and visual overlays to aid with debugging both usage and
   * implementation, but with a significant perf hit.
   */
  debug?: ?boolean,
  /**
   * DEPRECATED: Virtualization provides significant performance and memory optimizations, but fully
   * unmounts react instances that are outside of the render window. You should only need to disable
   * this for debugging purposes. Defaults to false.
   */
  disableVirtualization?: ?boolean,
  /**
   * A marker property for telling the list to re-render (since it implements `PureComponent`). If
   * any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the
   * `data` prop, stick it here and treat it immutably.
   */
  extraData?: any,
  // e.g. height, y
  getItemLayout?: (
    data: any,
    index: number,
  ) => {
    length: number,
    offset: number,
    index: number,
    ...
  },
  horizontal?: ?boolean,
  /**
   * How many items to render in the initial batch. This should be enough to fill the screen but not
   * much more. Note these items will never be unmounted as part of the windowed rendering in order
   * to improve perceived performance of scroll-to-top actions.
   */
  initialNumToRender?: ?number,
  /**
   * Instead of starting at the top with the first item, start at `initialScrollIndex`. This
   * disables the "scroll to top" optimization that keeps the first `initialNumToRender` items
   * always rendered and immediately renders the items starting at this initial index. Requires
   * `getItemLayout` to be implemented.
   */
  initialScrollIndex?: ?number,
  /**
   * Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: ?boolean,
  keyExtractor?: ?(item: Item, index: number) => string,
  /**
   * Each cell is rendered using this element. Can be a React Component Class,
   * or a render function. Defaults to using View.
   */
  CellRendererComponent?: ?React.ComponentType<any>,
  /**
   * Rendered in between each item, but not at the top or bottom. By default, `highlighted` and
   * `leadingItem` props are provided. `renderItem` provides `separators.highlight`/`unhighlight`
   * which will update the `highlighted` prop, but you can also add custom props with
   * `separators.updateProps`.
   */
  ItemSeparatorComponent?: ?React.ComponentType<any>,
  /**
   * Takes an item from `data` and renders it into the list. Example usage:
   *
   *     <FlatList
   *       ItemSeparatorComponent={Platform.OS !== 'android' && ({highlighted}) => (
   *         <View style={[style.separator, highlighted && {marginLeft: 0}]} />
   *       )}
   *       data={[{title: 'Title Text', key: 'item1'}]}
   *       ListItemComponent={({item, separators}) => (
   *         <TouchableHighlight
   *           onPress={() => this._onPress(item)}
   *           onShowUnderlay={separators.highlight}
   *           onHideUnderlay={separators.unhighlight}>
   *           <View style={{backgroundColor: 'white'}}>
   *             <Text>{item.title}</Text>
   *           </View>
   *         </TouchableHighlight>
   *       )}
   *     />
   *
   * Provides additional metadata like `index` if you need it, as well as a more generic
   * `separators.updateProps` function which let's you set whatever props you want to change the
   * rendering of either the leading separator or trailing separator in case the more common
   * `highlight` and `unhighlight` (which set the `highlighted: boolean` prop) are insufficient for
   * your use-case.
   */
  ListItemComponent?: ?(React.ComponentType<any> | React.Element<any>),
  /**
   * Rendered when the list is empty. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListEmptyComponent?: ?(React.ComponentType<any> | React.Element<any>),
  /**
   * Rendered at the bottom of all the items. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListFooterComponent?: ?(React.ComponentType<any> | React.Element<any>),
  /**
   * Styling for internal View for ListFooterComponent
   */
  ListFooterComponentStyle?: ViewStyleProp,
  /**
   * Rendered at the top of all the items. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListHeaderComponent?: ?(React.ComponentType<any> | React.Element<any>),
  /**
   * Styling for internal View for ListHeaderComponent
   */
  ListHeaderComponentStyle?: ViewStyleProp,
  /**
   * A unique identifier for this list. If there are multiple VirtualizedLists at the same level of
   * nesting within another VirtualizedList, this key is necessary for virtualization to
   * work properly.
   */
  listKey?: string,
  /**
   * The maximum number of items to render in each incremental render batch. The more rendered at
   * once, the better the fill rate, but responsiveness may suffer because rendering content may
   * interfere with responding to button taps or other interactions.
   */
  maxToRenderPerBatch?: ?number,
  /**
   * Called once when the scroll position gets within `onEndReachedThreshold` of the rendered
   * content.
   */
  onEndReached?: ?(info: {distanceFromEnd: number, ...}) => void,
  /**
   * How far from the end (in units of visible length of the list) the bottom edge of the
   * list must be from the end of the content to trigger the `onEndReached` callback.
   * Thus a value of 0.5 will trigger `onEndReached` when the end of the content is
   * within half the visible length of the list. A value of 0 will not trigger until scrolling
   * to the very end of the list.
   */
  onEndReachedThreshold?: ?number,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?() => void,
  /**
   * Used to handle failures when scrolling to an index that has not been measured yet. Recommended
   * action is to either compute your own offset and `scrollTo` it, or scroll as far as possible and
   * then try again after more items have been rendered.
   */
  onScrollToIndexFailed?: ?(info: {
    index: number,
    highestMeasuredFrameIndex: number,
    averageItemLength: number,
    ...
  }) => void,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewabilityConfig` prop.
   */
  onViewableItemsChanged?: ?(info: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
    ...
  }) => void,
  persistentScrollbar?: ?boolean,
  /**
   * Set this when offset is needed for the loading indicator to show correctly.
   */
  progressViewOffset?: number,
  /**
   * A custom refresh control element. When set, it overrides the default
   * <RefreshControl> component built internally. The onRefresh and refreshing
   * props are also ignored. Only works for vertical VirtualizedList.
   */
  refreshControl?: ?React.Element<any>,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: ?boolean,
  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean,
  /**
   * Render a custom scroll component, e.g. with a differently styled `RefreshControl`.
   */
  renderScrollComponent?: (props: Object) => React.Element<any>,
  /**
   * Amount of time between low-pri item render batches, e.g. for rendering items quite a ways off
   * screen. Similar fill rate/responsiveness tradeoff as `maxToRenderPerBatch`.
   */
  updateCellsBatchingPeriod?: ?number,
  /**
   * See `ViewabilityHelper` for flow type and further documentation.
   */
  viewabilityConfig?: ViewabilityConfig,
  /**
   * List of ViewabilityConfig/onViewableItemsChanged pairs. A specific onViewableItemsChanged
   * will be called when its corresponding ViewabilityConfig's conditions are met.
   */
  viewabilityConfigCallbackPairs?: Array<ViewabilityConfigCallbackPair>,
  /**
   * Determines the maximum number of items rendered outside of the visible area, in units of
   * visible lengths. So if your list fills the screen, then `windowSize={21}` (the default) will
   * render the visible screen area plus up to 10 screens above and 10 below the viewport. Reducing
   * this number will reduce memory consumption and may improve performance, but will increase the
   * chance that fast scrolling may reveal momentary blank areas of unrendered content.
   */
  windowSize?: ?number,
  /**
   * The legacy implementation is no longer supported.
   */
  legacyImplementation?: empty,
|};

type Props = {|
  ...React.ElementConfig<typeof ScrollView>,
  ...RequiredProps,
  ...OptionalProps,
|};

let _usedIndexForKey = false;
let _keylessItemComponentName: string = '';

type State = {
  first: number,
  last: number,
};

/**
 * Default Props Helper Functions
 * Use the following helper functions for default values
 */

// horizontalOrDefault(this.props.horizontal)
function horizontalOrDefault(horizontal: ?boolean) {
  return horizontal ?? false;
}

// initialNumToRenderOrDefault(this.props.initialNumToRenderOrDefault)
function initialNumToRenderOrDefault(initialNumToRender: ?number) {
  return initialNumToRender ?? 10;
}

// maxToRenderPerBatchOrDefault(this.props.maxToRenderPerBatch)
function maxToRenderPerBatchOrDefault(maxToRenderPerBatch: ?number) {
  return maxToRenderPerBatch ?? 10;
}

// onEndReachedThresholdOrDefault(this.props.onEndReachedThreshold)
function onEndReachedThresholdOrDefault(onEndReachedThreshold: ?number) {
  return onEndReachedThreshold ?? 2;
}

// scrollEventThrottleOrDefault(this.props.scrollEventThrottle)
function scrollEventThrottleOrDefault(scrollEventThrottle: ?number) {
  return scrollEventThrottle ?? 50;
}

// windowSizeOrDefault(this.props.windowSize)
function windowSizeOrDefault(windowSize: ?number) {
  return windowSize ?? 21;
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
class VirtualizedList extends React.PureComponent<Props, State> {
  static contextType: typeof VirtualizedListContext = VirtualizedListContext;

  // scrollToEnd may be janky without getItemLayout prop
  scrollToEnd(params?: ?{animated?: ?boolean, ...}) {
    const animated = params ? params.animated : true;
    const veryLast = this.props.getItemCount(this.props.data) - 1;
    const frame = this.__getFrameMetricsApprox(veryLast);
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
  }) {
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
    const frame = this.__getFrameMetricsApprox(index);
    const offset =
      Math.max(
        0,
        frame.offset -
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
      childList.ref && childList.ref.recordInteraction();
    });
    this._viewabilityTuples.forEach(t => {
      t.viewabilityHelper.recordInteraction();
    });
    this._updateViewableItems(this.props.data);
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
      return ReactNative.findNodeHandle(this._scrollRef);
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

  _getListKey(): string {
    return this.props.listKey || this._getCellKey();
  }

  _getDebugInfo(): ListDebugInfo {
    return {
      listKey: this._getListKey(),
      cellKey: this._getCellKey(),
      horizontal: horizontalOrDefault(this.props.horizontal),
      parent: this.context?.debugInfo,
    };
  }

  _getScrollMetrics = () => {
    return this._scrollMetrics;
  };

  hasMore(): boolean {
    return this._hasMore;
  }

  _getOutermostParentListRef = () => {
    if (this._isNestedWithSameOrientation()) {
      return this.context.getOutermostParentListRef();
    } else {
      return this;
    }
  };

  _getNestedChildState = (key: string): ?ChildListState => {
    const existingChildData = this._nestedChildLists.get(key);
    return existingChildData && existingChildData.state;
  };

  _registerAsNestedChild = (childList: {
    cellKey: string,
    key: string,
    ref: VirtualizedList,
    parentDebugInfo: ListDebugInfo,
    ...
  }): ?ChildListState => {
    // Register the mapping between this child key and the cellKey for its cell
    const childListsInCell =
      this._cellKeysToChildListKeys.get(childList.cellKey) || new Set();
    childListsInCell.add(childList.key);
    this._cellKeysToChildListKeys.set(childList.cellKey, childListsInCell);
    const existingChildData = this._nestedChildLists.get(childList.key);
    if (existingChildData && existingChildData.ref !== null) {
      console.error(
        'A VirtualizedList contains a cell which itself contains ' +
          'more than one VirtualizedList of the same orientation as the parent ' +
          'list. You must pass a unique listKey prop to each sibling list.\n\n' +
          describeNestedLists({
            ...childList,
            // We're called from the child's componentDidMount, so it's safe to
            // read the child's props here (albeit weird).
            horizontal: !!childList.ref.props.horizontal,
          }),
      );
    }
    this._nestedChildLists.set(childList.key, {
      ref: childList.ref,
      state: null,
    });

    if (this._hasInteracted) {
      childList.ref.recordInteraction();
    }
  };

  _unregisterAsNestedChild = (childList: {
    key: string,
    state: ChildListState,
    ...
  }): void => {
    this._nestedChildLists.set(childList.key, {
      ref: null,
      state: childList.state,
    });
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

    let initialState = {
      first: this.props.initialScrollIndex || 0,
      last:
        Math.min(
          this.props.getItemCount(this.props.data),
          (this.props.initialScrollIndex || 0) +
            initialNumToRenderOrDefault(this.props.initialNumToRender),
        ) - 1,
    };

    if (this._isNestedWithSameOrientation()) {
      const storedState = this.context.getNestedChildState(this._getListKey());
      if (storedState) {
        initialState = storedState;
        this.state = storedState;
        this._frames = storedState.frames;
      }
    }

    this.state = initialState;
  }

  componentDidMount() {
    if (this._isNestedWithSameOrientation()) {
      this.context.registerAsNestedChild({
        cellKey: this._getCellKey(),
        key: this._getListKey(),
        ref: this,
        // NOTE: When the child mounts (here) it's not necessarily safe to read
        // the parent's props. This is why we explicitly propagate debugInfo
        // "down" via context and "up" again via this method call on the
        // parent.
        parentDebugInfo: this.context.debugInfo,
      });
    }
  }

  componentWillUnmount() {
    if (this._isNestedWithSameOrientation()) {
      this.context.unregisterAsNestedChild({
        key: this._getListKey(),
        state: {
          first: this.state.first,
          last: this.state.last,
          frames: this._frames,
        },
      });
    }
    this._updateViewableItems(null);
    this._updateCellsToRenderBatcher.dispose({abort: true});
    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.dispose();
    });
    this._fillRateHelper.deactivateAndFlush();
  }

  static getDerivedStateFromProps(newProps: Props, prevState: State): State {
    const {data, getItemCount} = newProps;
    const maxToRenderPerBatch = maxToRenderPerBatchOrDefault(
      newProps.maxToRenderPerBatch,
    );
    // first and last could be stale (e.g. if a new, shorter items props is passed in), so we make
    // sure we're rendering a reasonable range here.
    return {
      first: Math.max(
        0,
        Math.min(prevState.first, getItemCount(data) - 1 - maxToRenderPerBatch),
      ),
      last: Math.max(0, Math.min(prevState.last, getItemCount(data) - 1)),
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
      const key = this._keyExtractor(item, ii);
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

  _onUpdateSeparators = (keys: Array<?string>, newProps: Object) => {
    keys.forEach(key => {
      const ref = key != null && this._cellRefs[key];
      ref && ref.updateSeparatorProps(newProps);
    });
  };

  _isVirtualizationDisabled(): boolean {
    return this.props.disableVirtualization || false;
  }

  _isNestedWithSameOrientation(): boolean {
    const nestedContext = this.context;
    return !!(
      nestedContext &&
      !!nestedContext.horizontal === horizontalOrDefault(this.props.horizontal)
    );
  }

  _getSpacerKey = (isVertical: boolean): string =>
    isVertical ? 'height' : 'width';

  _keyExtractor(item: Item, index: number) {
    if (this.props.keyExtractor != null) {
      return this.props.keyExtractor(item, index);
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
      const flatStyles = flattenStyle(this.props.contentContainerStyle);
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
    const isVirtualizationDisabled = this._isVirtualizationDisabled();
    const inversionStyle = this.props.inverted
      ? horizontalOrDefault(this.props.horizontal)
        ? styles.horizontallyInverted
        : styles.verticallyInverted
      : null;
    const cells = [];
    const stickyIndicesFromProps = new Set(this.props.stickyHeaderIndices);
    const stickyHeaderIndices = [];
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
    const itemCount = this.props.getItemCount(data);
    if (itemCount > 0) {
      _usedIndexForKey = false;
      _keylessItemComponentName = '';
      const spacerKey = this._getSpacerKey(!horizontal);
      const lastInitialIndex = this.props.initialScrollIndex
        ? -1
        : initialNumToRenderOrDefault(this.props.initialNumToRender) - 1;
      const {first, last} = this.state;
      this._pushCells(
        cells,
        stickyHeaderIndices,
        stickyIndicesFromProps,
        0,
        lastInitialIndex,
        inversionStyle,
      );
      const firstAfterInitial = Math.max(lastInitialIndex + 1, first);
      if (!isVirtualizationDisabled && first > lastInitialIndex + 1) {
        let insertedStickySpacer = false;
        if (stickyIndicesFromProps.size > 0) {
          const stickyOffset = ListHeaderComponent ? 1 : 0;
          // See if there are any sticky headers in the virtualized space that we need to render.
          for (let ii = firstAfterInitial - 1; ii > lastInitialIndex; ii--) {
            if (stickyIndicesFromProps.has(ii + stickyOffset)) {
              const initBlock = this.__getFrameMetricsApprox(lastInitialIndex);
              const stickyBlock = this.__getFrameMetricsApprox(ii);
              const leadSpace =
                stickyBlock.offset -
                initBlock.offset -
                (this.props.initialScrollIndex ? 0 : initBlock.length);
              cells.push(
                <View key="$sticky_lead" style={{[spacerKey]: leadSpace}} />,
              );
              this._pushCells(
                cells,
                stickyHeaderIndices,
                stickyIndicesFromProps,
                ii,
                ii,
                inversionStyle,
              );
              const trailSpace =
                this.__getFrameMetricsApprox(first).offset -
                (stickyBlock.offset + stickyBlock.length);
              cells.push(
                <View key="$sticky_trail" style={{[spacerKey]: trailSpace}} />,
              );
              insertedStickySpacer = true;
              break;
            }
          }
        }
        if (!insertedStickySpacer) {
          const initBlock = this.__getFrameMetricsApprox(lastInitialIndex);
          const firstSpace =
            this.__getFrameMetricsApprox(first).offset -
            (initBlock.offset + initBlock.length);
          cells.push(
            <View key="$lead_spacer" style={{[spacerKey]: firstSpace}} />,
          );
        }
      }
      this._pushCells(
        cells,
        stickyHeaderIndices,
        stickyIndicesFromProps,
        firstAfterInitial,
        last,
        inversionStyle,
      );
      if (!this._hasWarned.keys && _usedIndexForKey) {
        console.warn(
          'VirtualizedList: missing keys for items, make sure to specify a key or id property on each ' +
            'item or provide a custom keyExtractor.',
          _keylessItemComponentName,
        );
        this._hasWarned.keys = true;
      }
      if (!isVirtualizationDisabled && last < itemCount - 1) {
        const lastFrame = this.__getFrameMetricsApprox(last);
        // Without getItemLayout, we limit our tail spacer to the _highestMeasuredFrameIndex to
        // prevent the user for hyperscrolling into un-measured area because otherwise content will
        // likely jump around as it renders in above the viewport.
        const end = this.props.getItemLayout
          ? itemCount - 1
          : Math.min(itemCount - 1, this._highestMeasuredFrameIndex);
        const endFrame = this.__getFrameMetricsApprox(end);
        const tailSpacerLength =
          endFrame.offset +
          endFrame.length -
          (lastFrame.offset + lastFrame.length);
        cells.push(
          <View key="$tail_spacer" style={{[spacerKey]: tailSpacerLength}} />,
        );
      }
    } else if (ListEmptyComponent) {
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
        React.cloneElement(element, {
          key: '$empty',
          onLayout: event => {
            this._onLayoutEmpty(event);
            if (element.props.onLayout) {
              element.props.onLayout(event);
            }
          },
          style: StyleSheet.compose(inversionStyle, element.props.style),
        }),
      );
    }
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

    this._hasMore =
      this.state.last < this.props.getItemCount(this.props.data) - 1;

    const innerRet = (
      <VirtualizedListContextProvider
        value={{
          cellKey: null,
          getScrollMetrics: this._getScrollMetrics,
          horizontal: horizontalOrDefault(this.props.horizontal),
          getOutermostParentListRef: this._getOutermostParentListRef,
          getNestedChildState: this._getNestedChildState,
          registerAsNestedChild: this._registerAsNestedChild,
          unregisterAsNestedChild: this._unregisterAsNestedChild,
          debugInfo: this._getDebugInfo(),
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
              this.context == null
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
  // Maps a cell key to the set of keys for all outermost child lists within that cell
  _cellKeysToChildListKeys: Map<string, Set<string>> = new Map();
  _cellRefs: {[string]: null | CellRenderer} = {};
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
  _nestedChildLists: Map<
    string,
    {
      ref: ?VirtualizedList,
      state: ?ChildListState,
      ...
    },
  > = new Map();
  _offsetFromParentVirtualizedList: number = 0;
  _prevParentOffset: number = 0;
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
      this.state,
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
    this._updateViewableItems(this.props.data);
  };

  _onCellUnmount = (cellKey: string) => {
    const curr = this._frames[cellKey];
    if (curr) {
      this._frames[cellKey] = {...curr, inLayout: false};
    }
  };

  _triggerRemeasureForChildListsInCell(cellKey: string): void {
    const childListKeys = this._cellKeysToChildListKeys.get(cellKey);
    if (childListKeys) {
      for (let childKey of childListKeys) {
        const childList = this._nestedChildLists.get(childKey);
        childList &&
          childList.ref &&
          childList.ref.measureLayoutRelativeToContainingList();
      }
    }
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
            this._cellKeysToChildListKeys.forEach(childListKeys => {
              if (childListKeys) {
                for (let childKey of childListKeys) {
                  const childList = this._nestedChildLists.get(childKey);
                  childList &&
                    childList.ref &&
                    childList.ref.measureLayoutRelativeToContainingList();
                }
              }
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
    this._maybeCallOnEndReached();
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

  _renderDebugOverlay() {
    const normalize =
      this._scrollMetrics.visibleLength /
      (this._scrollMetrics.contentLength || 1);
    const framesInLayout = [];
    const itemCount = this.props.getItemCount(this.props.data);
    for (let ii = 0; ii < itemCount; ii++) {
      const frame = this.__getFrameMetricsApprox(ii);
      /* $FlowFixMe[prop-missing] (>=0.68.0 site=react_native_fb) This comment
       * suppresses an error found when Flow v0.68 was deployed. To see the
       * error delete this comment and run Flow. */
      if (frame.inLayout) {
        framesInLayout.push(frame);
      }
    }
    const windowTop = this.__getFrameMetricsApprox(this.state.first).offset;
    const frameLast = this.__getFrameMetricsApprox(this.state.last);
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

  _maybeCallOnEndReached() {
    const {data, getItemCount, onEndReached, onEndReachedThreshold} =
      this.props;
    const {contentLength, visibleLength, offset} = this._scrollMetrics;
    let distanceFromEnd = contentLength - visibleLength - offset;

    // Especially when oERT is zero it's necessary to 'floor' very small distanceFromEnd values to be 0
    // since debouncing causes us to not fire this event for every single "pixel" we scroll and can thus
    // be at the "end" of the list with a distanceFromEnd approximating 0 but not quite there.
    if (distanceFromEnd < ON_END_REACHED_EPSILON) {
      distanceFromEnd = 0;
    }

    // TODO: T121172172 Look into why we're "defaulting" to a threshold of 2 when oERT is not present
    const threshold =
      onEndReachedThreshold != null ? onEndReachedThreshold * visibleLength : 2;
    if (
      onEndReached &&
      this.state.last === getItemCount(data) - 1 &&
      distanceFromEnd <= threshold &&
      this._scrollMetrics.contentLength !== this._sentEndForContentLength
    ) {
      // Only call onEndReached once for a given content length
      this._sentEndForContentLength = this._scrollMetrics.contentLength;
      onEndReached({distanceFromEnd});
    } else if (distanceFromEnd > threshold) {
      // If the user scrolls away from the end and back again cause
      // an onEndReached to be triggered again
      this._sentEndForContentLength = 0;
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
    this._maybeCallOnEndReached();
  };

  /* Translates metrics from a scroll event in a parent VirtualizedList into
   * coordinates relative to the child list.
   */
  _convertParentScrollMetrics = (metrics: {
    visibleLength: number,
    offset: number,
    ...
  }) => {
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
      childList.ref && childList.ref._onScroll(e);
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
    this._updateViewableItems(this.props.data);
    if (!this.props) {
      return;
    }
    this._maybeCallOnEndReached();
    if (velocity !== 0) {
      this._fillRateHelper.activate();
    }
    this._computeBlankness();
    this._scheduleCellsToRenderUpdate();
  };

  _scheduleCellsToRenderUpdate() {
    const {first, last} = this.state;
    const {offset, visibleLength, velocity} = this._scrollMetrics;
    const itemCount = this.props.getItemCount(this.props.data);
    let hiPri = false;
    const onEndReachedThreshold = onEndReachedThresholdOrDefault(
      this.props.onEndReachedThreshold,
    );
    const scrollingThreshold = (onEndReachedThreshold * visibleLength) / 2;
    // Mark as high priority if we're close to the start of the first item
    // But only if there are items before the first rendered item
    if (first > 0) {
      const distTop = offset - this.__getFrameMetricsApprox(first).offset;
      hiPri =
        hiPri || distTop < 0 || (velocity < -2 && distTop < scrollingThreshold);
    }
    // Mark as high priority if we're close to the end of the last item
    // But only if there are items after the last rendered item
    if (last < itemCount - 1) {
      const distBottom =
        this.__getFrameMetricsApprox(last).offset - (offset + visibleLength);
      hiPri =
        hiPri ||
        distBottom < 0 ||
        (velocity > 2 && distBottom < scrollingThreshold);
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
      childList.ref && childList.ref._onScrollBeginDrag(e);
    });
    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.recordInteraction();
    });
    this._hasInteracted = true;
    this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e);
  };

  _onScrollEndDrag = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList.ref && childList.ref._onScrollEndDrag(e);
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
      childList.ref && childList.ref._onMomentumScrollBegin(e);
    });
    this.props.onMomentumScrollBegin && this.props.onMomentumScrollBegin(e);
  };

  _onMomentumScrollEnd = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList.ref && childList.ref._onMomentumScrollEnd(e);
    });
    this._scrollMetrics.velocity = 0;
    this._computeBlankness();
    this.props.onMomentumScrollEnd && this.props.onMomentumScrollEnd(e);
  };

  _updateCellsToRender = () => {
    const {
      data,
      getItemCount,
      onEndReachedThreshold: _onEndReachedThreshold,
    } = this.props;
    const onEndReachedThreshold = onEndReachedThresholdOrDefault(
      _onEndReachedThreshold,
    );
    const isVirtualizationDisabled = this._isVirtualizationDisabled();
    this._updateViewableItems(data);
    if (!data) {
      return;
    }
    this.setState(state => {
      let newState: ?(
        | {first: number, last: number, ...}
        | $TEMPORARY$object<{first: number, last: number}>
      );
      const {contentLength, offset, visibleLength} = this._scrollMetrics;
      const distanceFromEnd = contentLength - visibleLength - offset;
      if (!isVirtualizationDisabled) {
        // If we run this with bogus data, we'll force-render window {first: 0, last: 0},
        // and wipe out the initialNumToRender rendered elements.
        // So let's wait until the scroll view metrics have been set up. And until then,
        // we will trust the initialNumToRender suggestion
        if (visibleLength > 0 && contentLength > 0) {
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
            !this.props.initialScrollIndex ||
            this._scrollMetrics.offset ||
            Math.abs(distanceFromEnd) < Number.EPSILON
          ) {
            newState = computeWindowedRenderLimits(
              this.props.data,
              this.props.getItemCount,
              maxToRenderPerBatchOrDefault(this.props.maxToRenderPerBatch),
              windowSizeOrDefault(this.props.windowSize),
              state,
              this.__getFrameMetricsApprox,
              this._scrollMetrics,
            );
          }
        }
      } else {
        const renderAhead =
          distanceFromEnd < onEndReachedThreshold * visibleLength
            ? maxToRenderPerBatchOrDefault(this.props.maxToRenderPerBatch)
            : 0;
        newState = {
          first: 0,
          last: Math.min(state.last + renderAhead, getItemCount(data) - 1),
        };
      }
      if (newState && this._nestedChildLists.size > 0) {
        const newFirst = newState.first;
        const newLast = newState.last;
        // If some cell in the new state has a child list in it, we should only render
        // up through that item, so that we give that list a chance to render.
        // Otherwise there's churn from multiple child lists mounting and un-mounting
        // their items.
        for (let ii = newFirst; ii <= newLast; ii++) {
          const cellKeyForIndex = this._indicesToKeys.get(ii);
          const childListKeys =
            cellKeyForIndex &&
            this._cellKeysToChildListKeys.get(cellKeyForIndex);
          if (!childListKeys) {
            continue;
          }
          let someChildHasMore = false;
          // For each cell, need to check whether any child list in it has more elements to render
          for (let childKey of childListKeys) {
            const childList = this._nestedChildLists.get(childKey);
            if (childList && childList.ref && childList.ref.hasMore()) {
              someChildHasMore = true;
              break;
            }
          }
          if (someChildHasMore) {
            newState.last = ii;
            break;
          }
        }
      }
      if (
        newState != null &&
        newState.first === state.first &&
        newState.last === state.last
      ) {
        newState = null;
      }
      return newState;
    });
  };

  _createViewToken = (index: number, isViewable: boolean) => {
    const {data, getItem} = this.props;
    const item = getItem(data, index);
    return {index, item, key: this._keyExtractor(item, index), isViewable};
  };

  __getFrameMetricsApprox: (index: number) => {
    length: number,
    offset: number,
    ...
  } = index => {
    const frame = this._getFrameMetrics(index);
    if (frame && frame.index === index) {
      // check for invalid frames due to row re-ordering
      return frame;
    } else {
      const {getItemLayout} = this.props;
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
  ): ?{
    length: number,
    offset: number,
    index: number,
    inLayout?: boolean,
    ...
  } => {
    const {data, getItem, getItemCount, getItemLayout} = this.props;
    invariant(
      getItemCount(data) > index,
      'Tried to get frame for out of range index ' + index,
    );
    const item = getItem(data, index);
    const frame = item && this._frames[this._keyExtractor(item, index)];
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

  _updateViewableItems(data: any) {
    const {getItemCount} = this.props;

    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.onUpdate(
        getItemCount(data),
        this._scrollMetrics.offset,
        this._scrollMetrics.visibleLength,
        this._getFrameMetrics,
        this._createViewToken,
        tuple.onViewableItemsChanged,
        this.state,
      );
    });
  }
}

type CellRendererProps = {
  CellRendererComponent?: ?React.ComponentType<any>,
  ItemSeparatorComponent: ?React.ComponentType<
    any | {highlighted: boolean, leadingItem: ?Item},
  >,
  ListItemComponent?: ?(React.ComponentType<any> | React.Element<any>),
  cellKey: string,
  debug?: ?boolean,
  fillRateHelper: FillRateHelper,
  getItemLayout?: (
    data: any,
    index: number,
  ) => {
    length: number,
    offset: number,
    index: number,
    ...
  },
  horizontal: ?boolean,
  index: number,
  inversionStyle: ViewStyleProp,
  item: Item,
  // This is extracted by ScrollViewStickyHeader
  onCellLayout: (event: Object, cellKey: string, index: number) => void,
  onUnmount: (cellKey: string) => void,
  onUpdateSeparators: (cellKeys: Array<?string>, props: Object) => void,
  prevCellKey: ?string,
  renderItem?: ?RenderItemType<Item>,
  ...
};

type CellRendererState = {
  separatorProps: $ReadOnly<{|
    highlighted: boolean,
    leadingItem: ?Item,
  |}>,
  ...
};

class CellRenderer extends React.Component<
  CellRendererProps,
  CellRendererState,
> {
  state = {
    separatorProps: {
      highlighted: false,
      leadingItem: this.props.item,
    },
  };

  static getDerivedStateFromProps(
    props: CellRendererProps,
    prevState: CellRendererState,
  ): ?CellRendererState {
    return {
      separatorProps: {
        ...prevState.separatorProps,
        leadingItem: props.item,
      },
    };
  }

  // TODO: consider factoring separator stuff out of VirtualizedList into FlatList since it's not
  // reused by SectionList and we can keep VirtualizedList simpler.
  _separators = {
    highlight: () => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators([cellKey, prevCellKey], {
        highlighted: true,
      });
    },
    unhighlight: () => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators([cellKey, prevCellKey], {
        highlighted: false,
      });
    },
    updateProps: (select: 'leading' | 'trailing', newProps: Object) => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators(
        [select === 'leading' ? prevCellKey : cellKey],
        newProps,
      );
    },
  };

  updateSeparatorProps(newProps: Object) {
    this.setState(state => ({
      separatorProps: {...state.separatorProps, ...newProps},
    }));
  }

  componentWillUnmount() {
    this.props.onUnmount(this.props.cellKey);
  }

  _onLayout = (nativeEvent: LayoutEvent): void => {
    this.props.onCellLayout &&
      this.props.onCellLayout(
        nativeEvent,
        this.props.cellKey,
        this.props.index,
      );
  };

  _renderElement(
    renderItem: any,
    ListItemComponent: any,
    item: any,
    index: any,
  ) {
    if (renderItem && ListItemComponent) {
      console.warn(
        'VirtualizedList: Both ListItemComponent and renderItem props are present. ListItemComponent will take' +
          ' precedence over renderItem.',
      );
    }

    if (ListItemComponent) {
      /* $FlowFixMe[not-a-component] (>=0.108.0 site=react_native_fb) This
       * comment suppresses an error found when Flow v0.108 was deployed. To
       * see the error, delete this comment and run Flow. */
      /* $FlowFixMe[incompatible-type-arg] (>=0.108.0 site=react_native_fb)
       * This comment suppresses an error found when Flow v0.108 was deployed.
       * To see the error, delete this comment and run Flow. */
      return React.createElement(ListItemComponent, {
        item,
        index,
        separators: this._separators,
      });
    }

    if (renderItem) {
      return renderItem({
        item,
        index,
        separators: this._separators,
      });
    }

    invariant(
      false,
      'VirtualizedList: Either ListItemComponent or renderItem props are required but none were found.',
    );
  }

  render() {
    const {
      CellRendererComponent,
      ItemSeparatorComponent,
      ListItemComponent,
      debug,
      fillRateHelper,
      getItemLayout,
      horizontal,
      item,
      index,
      inversionStyle,
      renderItem,
    } = this.props;
    const element = this._renderElement(
      renderItem,
      ListItemComponent,
      item,
      index,
    );

    const onLayout =
      (getItemLayout && !debug && !fillRateHelper.enabled()) ||
      !this.props.onCellLayout
        ? undefined
        : this._onLayout;
    // NOTE: that when this is a sticky header, `onLayout` will get automatically extracted and
    // called explicitly by `ScrollViewStickyHeader`.
    const itemSeparator = React.isValidElement(ItemSeparatorComponent)
      ? ItemSeparatorComponent
      : ItemSeparatorComponent && (
          <ItemSeparatorComponent {...this.state.separatorProps} />
        );
    const cellStyle = inversionStyle
      ? horizontal
        ? [styles.rowReverse, inversionStyle]
        : [styles.columnReverse, inversionStyle]
      : horizontal
      ? [styles.row, inversionStyle]
      : inversionStyle;
    const result = !CellRendererComponent ? (
      /* $FlowFixMe[incompatible-type-arg] (>=0.89.0 site=react_native_fb) *
        This comment suppresses an error found when Flow v0.89 was deployed. *
        To see the error, delete this comment and run Flow. */
      <View style={cellStyle} onLayout={onLayout}>
        {element}
        {itemSeparator}
      </View>
    ) : (
      <CellRendererComponent
        {...this.props}
        style={cellStyle}
        onLayout={onLayout}>
        {element}
        {itemSeparator}
      </CellRendererComponent>
    );

    return (
      <VirtualizedListCellContextProvider cellKey={this.props.cellKey}>
        {result}
      </VirtualizedListCellContextProvider>
    );
  }
}

function describeNestedLists(childList: {
  +cellKey: string,
  +key: string,
  +ref: VirtualizedList,
  +parentDebugInfo: ListDebugInfo,
  +horizontal: boolean,
  ...
}) {
  let trace =
    'VirtualizedList trace:\n' +
    `  Child (${childList.horizontal ? 'horizontal' : 'vertical'}):\n` +
    `    listKey: ${childList.key}\n` +
    `    cellKey: ${childList.cellKey}`;

  let debugInfo: ?ListDebugInfo = childList.parentDebugInfo;
  while (debugInfo) {
    trace +=
      `\n  Parent (${debugInfo.horizontal ? 'horizontal' : 'vertical'}):\n` +
      `    listKey: ${debugInfo.listKey}\n` +
      `    cellKey: ${debugInfo.cellKey}`;
    debugInfo = debugInfo.parent;
  }
  return trace;
}

const styles = StyleSheet.create({
  verticallyInverted: {
    transform: [{scaleY: -1}],
  },
  horizontallyInverted: {
    transform: [{scaleX: -1}],
  },
  row: {
    flexDirection: 'row',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  columnReverse: {
    flexDirection: 'column-reverse',
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
