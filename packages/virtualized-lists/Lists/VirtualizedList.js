/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {CellMetricProps, ListOrientation} from './ListMetricsAggregator';
import type {ViewToken} from './ViewabilityHelper';
import type {
  Item,
  ListRenderItem,
  ListRenderItemInfo,
  Separators,
  VirtualizedListProps,
} from './VirtualizedListProps';
import type {
  LayoutChangeEvent,
  ScrollEvent,
  ScrollResponderType,
  StyleProp,
  ViewStyle,
} from 'react-native';

import clamp from '../Utilities/clamp';
import infoLog from '../Utilities/infoLog';
import {CellRenderMask} from './CellRenderMask';
import ChildListCollection from './ChildListCollection';
import FillRateHelper from './FillRateHelper';
import ListMetricsAggregator from './ListMetricsAggregator';
import StateSafePureComponent from './StateSafePureComponent';
import ViewabilityHelper from './ViewabilityHelper';
import CellRenderer from './VirtualizedListCellRenderer';
import {
  VirtualizedListCellContextProvider,
  VirtualizedListContext,
  VirtualizedListContextProvider,
} from './VirtualizedListContext.js';
import {
  horizontalOrDefault,
  initialNumToRenderOrDefault,
  maxToRenderPerBatchOrDefault,
  onEndReachedThresholdOrDefault,
  onStartReachedThresholdOrDefault,
  windowSizeOrDefault,
} from './VirtualizedListProps';
import {
  computeWindowedRenderLimits,
  keyExtractor as defaultKeyExtractor,
} from './VirtualizeUtils';
import invariant from 'invariant';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {cloneElement, isValidElement} from 'react';
import {
  I18nManager,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  findNodeHandle,
} from 'react-native';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

export type {ListRenderItemInfo, ListRenderItem, Separators};

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
  // Used to track items added at the start of the list for maintainVisibleContentPosition.
  firstVisibleItemKey: ?string,
  // When > 0 the scroll position available in JS is considered stale and should not be used.
  pendingScrollUpdateCount: number,
};

function getScrollingThreshold(threshold: number, visibleLength: number) {
  return (threshold * visibleLength) / 2;
}

/**
 * Base implementation for the more convenient [`<FlatList>`](https://reactnative.dev/docs/flatlist)
 * and [`<SectionList>`](https://reactnative.dev/docs/sectionlist) components, which are also better
 * documented. In general, this should only really be used if you need more flexibility than
 * `FlatList` provides, e.g. for use with immutable data instead of plain arrays.
 */
class VirtualizedList extends StateSafePureComponent<
  VirtualizedListProps,
  State,
> {
  static contextType: typeof VirtualizedListContext = VirtualizedListContext;

  scrollToEnd(params?: ?{animated?: ?boolean, ...}) {
    const animated = params ? params.animated : true;
    const veryLast = this.props.getItemCount(this.props.data) - 1;
    if (veryLast < 0) {
      return;
    }
    const frame = this._listMetrics.getCellMetricsApprox(veryLast, this.props);
    const offset = Math.max(
      0,
      frame.offset +
        frame.length +
        this._footerLength -
        this._scrollMetrics.visibleLength,
    );
    this.scrollToOffset({animated, offset});
  }

  scrollToIndex(params: {
    animated?: ?boolean,
    index: number,
    viewOffset?: number,
    viewPosition?: number,
    ...
  }): $FlowFixMe {
    const {data, getItemCount, getItemLayout, onScrollToIndexFailed} =
      this.props;
    const {animated, index, viewOffset, viewPosition} = params;
    invariant(index >= 0, `scrollToIndex out of range: requested ${index} but min is 0`);
    invariant(getItemCount(data) >= 1, 'scrollToIndex out of range: item length is 0');
    if (!getItemLayout && index > this._listMetrics.getHighestMeasuredCellIndex()) {
      onScrollToIndexFailed?.({
        averageItemLength: this._listMetrics.getAverageCellLength(),
        highestMeasuredFrameIndex: this._listMetrics.getHighestMeasuredCellIndex(),
        index,
      });
      return;
    }
    const frame = this._listMetrics.getCellMetricsApprox(Math.floor(index), this.props);
    const offset = Math.max(0, this._listMetrics.getCellOffsetApprox(index, this.props) - (viewPosition || 0) * (this._scrollMetrics.visibleLength - frame.length)) - (viewOffset || 0);
    this.scrollToOffset({offset, animated});
  }

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

  scrollToOffset(params: {animated?: ?boolean, offset: number, ...}) {
    const {animated, offset} = params;
    const scrollRef = this._scrollRef;
    if (scrollRef?.scrollTo == null) return;
    const {horizontal, rtl} = this._orientation();
    if (horizontal && rtl && !this._listMetrics.hasContentLength()) return;
    scrollRef.scrollTo({animated, ...this._scrollToParamsFromOffset(offset)});
  }

  _scrollToParamsFromOffset(offset: number): {x?: number, y?: number} {
    const {horizontal, rtl} = this._orientation();
    if (horizontal && rtl) {
      const cartOffset = this._listMetrics.cartesianOffset(offset + this._scrollMetrics.visibleLength);
      return horizontal ? {x: cartOffset} : {y: cartOffset};
    }
    return horizontal ? {x: offset} : {y: offset};
  }

  recordInteraction() {
    this._nestedChildLists.forEach(child => child.recordInteraction());
    this._viewabilityTuples.forEach(t => t.viewabilityHelper.recordInteraction());
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
  }

  flashScrollIndicators() {
    this._scrollRef?.flashScrollIndicators();
  }

  getScrollResponder(): ?ScrollResponderType {
    if (this._scrollRef?.getScrollResponder) return this._scrollRef.getScrollResponder();
  }

  getScrollableNode(): ?number {
    return this._scrollRef?.getScrollableNode ? this._scrollRef.getScrollableNode() : findNodeHandle<$FlowFixMe>(this._scrollRef);
  }

  getScrollRef(): ?React.ElementRef<typeof ScrollView> {
    // $FlowFixMe[prop-missing]
    return this._scrollRef?.getScrollRef ? this._scrollRef.getScrollRef() : this._scrollRef;
  }

  setNativeProps(props: Object) {
    this._scrollRef?.setNativeProps(props);
  }

  _getCellKey(): string {
    return this.context?.cellKey || 'rootList';
  }

  _getScrollMetrics = () => this._scrollMetrics;

  hasMore(): boolean {
    return this._hasMore;
  }

  _getOutermostParentListRef = () => this._isNestedWithSameOrientation() ? this.context.getOutermostParentListRef() : this;

  _registerAsNestedChild = (child: {cellKey: string, ref: VirtualizedList}) => {
    this._nestedChildLists.add(child.ref, child.cellKey);
    if (this._hasInteracted) child.ref.recordInteraction();
  };

  _unregisterAsNestedChild = (child: {ref: VirtualizedList}) => this._nestedChildLists.remove(child.ref);

  state: State;

  constructor(props: VirtualizedListProps) {
    super(props);
    this._checkProps(props);
    this._fillRateHelper = new FillRateHelper(this._listMetrics);

    this._viewabilityTuples = props.viewabilityConfigCallbackPairs 
      ? props.viewabilityConfigCallbackPairs.map(pair => ({
          viewabilityHelper: new ViewabilityHelper(pair.viewabilityConfig),
          onViewableItemsChanged: pair.onViewableItemsChanged,
        }))
      : (props.onViewableItemsChanged ? [{
          viewabilityHelper: new ViewabilityHelper(props.viewabilityConfig),
          onViewableItemsChanged: props.onViewableItemsChanged,
        }] : []);

    const initialRegion = VirtualizedList._initialRenderRegion(props);
    const minIndex = props.maintainVisibleContentPosition?.minIndexForVisible ?? 0;

    this.state = {
      cellsAroundViewport: initialRegion,
      renderMask: VirtualizedList._createRenderMask(props, initialRegion),
      firstVisibleItemKey: props.getItemCount(props.data) > minIndex ? VirtualizedList._getItemKey(props, minIndex) : null,
      pendingScrollUpdateCount: (props.initialScrollIndex ?? 0) > 0 ? 1 : 0,
    };
  }

  _checkProps(props: VirtualizedListProps) {
    invariant(!props.onScroll?.__isNative, 'Use Animated for native onScroll');
    invariant(windowSizeOrDefault(props.windowSize) > 0, 'windowSize must be > 0');
    invariant(props.getItemCount, 'getItemCount prop is required');
  }

  static _findItemIndexWithKey(props: VirtualizedListProps, key: string, hint: ?number): ?number {
    const itemCount = props.getItemCount(props.data);
    if (hint != null && hint >= 0 && hint < itemCount && VirtualizedList._getItemKey(props, hint) === key) return hint;
    for (let i = 0; i < itemCount; i++) {
      if (VirtualizedList._getItemKey(props, i) === key) return i;
    }
    return null;
  }

  static _getItemKey(props: any, index: number): string {
    const item = props.getItem(props.data, index);
    return VirtualizedList._keyExtractor(item, index, props);
  }

  static _createRenderMask(props: VirtualizedListProps, viewport: {first: number, last: number}, extra?: ?ReadonlyArray<{first: number, last: number}>): CellRenderMask {
    const itemCount = props.getItemCount(props.data);
    const mask = new CellRenderMask(itemCount);
    if (itemCount > 0) {
      [viewport, ...(extra ?? [])].forEach(r => mask.addCells(r));
      if ((props.initialScrollIndex ?? 0) <= 0) mask.addCells(VirtualizedList._initialRenderRegion(props));
      const stickySet = new Set(props.stickyHeaderIndices);
      VirtualizedList._ensureClosestStickyHeader(props, stickySet, mask, viewport.first);
    }
    return mask;
  }

  static _initialRenderRegion(props: VirtualizedListProps): {first: number, last: number} {
    const count = props.getItemCount(props.data);
    const first = Math.max(0, Math.min(count - 1, Math.floor(props.initialScrollIndex ?? 0)));
    const last = Math.min(count, first + initialNumToRenderOrDefault(props.initialNumToRender)) - 1;
    return {first, last};
  }

  static _ensureClosestStickyHeader(props: VirtualizedListProps, stickySet: Set<number>, mask: CellRenderMask, cellIdx: number) {
    const offset = props.ListHeaderComponent ? 1 : 0;
    for (let i = cellIdx - 1; i >= 0; i--) {
      if (stickySet.has(i + offset)) {
        mask.addCells({first: i, last: i});
        break;
      }
    }
  }

  _adjustCellsAroundViewport(props: VirtualizedListProps, cells: {first: number, last: number}, pendingCount: number): {first: number, last: number} {
    const {offset, visibleLength} = this._scrollMetrics;
    const contentLength = this._listMetrics.getContentLength();
    if (visibleLength <= 0 || contentLength <= 0) return cells.last >= props.getItemCount(props.data) ? VirtualizedList._constrainToItemCount(cells, props) : cells;
    if (pendingCount > 0) return cells;

    let newCells = computeWindowedRenderLimits(props, maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch), windowSizeOrDefault(props.windowSize), cells, this._listMetrics, this._scrollMetrics);
    if (this._nestedChildLists.size() > 0) {
      const childIdx = this._findFirstChildWithMore(newCells.first, newCells.last);
      if (childIdx != null) newCells.last = childIdx;
    }
    return newCells;
  }

  _findFirstChildWithMore(first: number, last: number): ?number {
    for (let i = first; i <= last; i++) {
      const key = this._indicesToKeys.get(i);
      if (key != null && this._nestedChildLists.anyInCell(key, c => c.hasMore())) return i;
    }
  }

  componentDidMount() {
    if (this._isNestedWithSameOrientation()) this.context.registerAsNestedChild({ref: this, cellKey: this.context.cellKey});
  }

  componentWillUnmount() {
    if (this._isNestedWithSameOrientation()) this.context.unregisterAsNestedChild({ref: this});
    clearTimeout(this._updateCellsToRenderTimeoutID);
    this._viewabilityTuples.forEach(t => t.viewabilityHelper.dispose());
    this._fillRateHelper.deactivateAndFlush();
  }

  static getDerivedStateFromProps(newProps: VirtualizedListProps, prevState: State): State {
    const itemCount = newProps.getItemCount(newProps.data);
    if (itemCount === prevState.renderMask.numCells()) return prevState;
    const constrained = VirtualizedList._constrainToItemCount(prevState.cellsAroundViewport, newProps);
    return {
      ...prevState,
      cellsAroundViewport: constrained,
      renderMask: VirtualizedList._createRenderMask(newProps, constrained),
    };
  }

  _pushCells(cells: Array<any>, stickyIndices: Array<number>, stickySet: Set<number>, first: number, last: number, inversionStyle: any) {
    const {ItemSeparatorComponent, data, getItem, getItemCount, renderItem} = this.props;
    const stickyOffset = this.props.ListHeaderComponent ? 1 : 0;
    const end = getItemCount(data) - 1;
    for (let i = first; i <= Math.min(end, last); i++) {
      const item = getItem(data, i);
      const key = VirtualizedList._keyExtractor(item, i, this.props);
      this._indicesToKeys.set(i, key);
      if (stickySet.has(i + stickyOffset)) stickyIndices.push(cells.length);
      cells.push(
        <CellRenderer
          key={key}
          cellKey={key}
          index={i}
          item={item}
          renderItem={renderItem}
          inversionStyle={inversionStyle}
          ItemSeparatorComponent={i < end ? ItemSeparatorComponent : undefined}
          onCellLayout={this._onCellLayout}
          ref={ref => {this._cellRefs[key] = ref;}}
        />
      );
    }
  }

  static _constrainToItemCount(cells: {first: number, last: number}, props: VirtualizedListProps): {first: number, last: number} {
    const count = props.getItemCount(props.data);
    const maxFirst = Math.max(0, count - 1 - maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch));
    return {first: clamp(0, cells.first, maxFirst), last: Math.min(count - 1, cells.last)};
  }

  _isNestedWithSameOrientation(): boolean {
    return !!(this.context && !!this.context.horizontal === horizontalOrDefault(this.props.horizontal));
  }

  _getSpacerKey = (v: boolean) => v ? 'height' : 'width';

  static _keyExtractor(item: any, index: number, props: any): string {
    return props.keyExtractor ? props.keyExtractor(item, index) : (item.key || item.id || String(index));
  }

  _renderEmptyComponent(element: any, inversionStyle: any): React.Node {
    return element.type === React.Fragment ? element : cloneElement(element, {
      onLayout: (e: any) => { this._onLayoutEmpty(e); element.props.onLayout?.(e); },
      style: StyleSheet.compose(inversionStyle, element.props.style),
    });
  }

  render(): React.Node {
    const {ListEmptyComponent, ListFooterComponent, ListHeaderComponent, data, horizontal, inverted} = this.props;
    const inversionStyle = inverted ? (horizontalOrDefault(horizontal) ? styles.horizontallyInverted : styles.verticallyInverted) : null;
    const cells = [];
    const stickySet = new Set(this.props.stickyHeaderIndices);
    const stickyIndices = [];

    if (ListHeaderComponent) {
      if (stickySet.has(0)) stickyIndices.push(0);
      const header = isValidElement(ListHeaderComponent) ? ListHeaderComponent : <ListHeaderComponent />;
      cells.push(
        <VirtualizedListCellContextProvider cellKey={this._getCellKey() + '-header'} key="$header">
          <View onLayout={this._onLayoutHeader} style={StyleSheet.compose(inversionStyle, this.props.ListHeaderComponentStyle)}>
            {header}
          </View>
        </VirtualizedListCellContextProvider>
      );
    }

    const itemCount = this.props.getItemCount(data);
    if (itemCount === 0 && ListEmptyComponent) {
      const empty = isValidElement(ListEmptyComponent) ? ListEmptyComponent : <ListEmptyComponent />;
      cells.push(<VirtualizedListCellContextProvider cellKey={this._getCellKey() + '-empty'} key="$empty">{this._renderEmptyComponent(empty, inversionStyle)}</VirtualizedListCellContextProvider>);
    }

    if (itemCount > 0) {
      const spacerKey = this._getSpacerKey(!horizontal);
      this.state.renderMask.enumerateRegions().forEach(region => {
        if (region.isSpacer && !this.props.disableVirtualization) {
          const m = this._listMetrics.getCellMetricsApprox(region.first, this.props);
          const lastM = this._listMetrics.getCellMetricsApprox(region.last, this.props);
          cells.push(<View key={`$spacer-${region.first}`} style={{[spacerKey]: lastM.offset + lastM.length - m.offset}} />);
        } else if (!region.isSpacer) {
          this._pushCells(cells, stickyIndices, stickySet, region.first, region.last, inversionStyle);
        }
      });
    }

    if (ListFooterComponent) {
      const footer = isValidElement(ListFooterComponent) ? ListFooterComponent : <ListFooterComponent />;
      cells.push(
        <VirtualizedListCellContextProvider cellKey={this._getFooterCellKey()} key="$footer">
          <View onLayout={this._onLayoutFooter} style={StyleSheet.compose(inversionStyle, this.props.ListFooterComponentStyle)}>
            {footer}
          </View>
        </VirtualizedListCellContextProvider>
      );
    }

    const scrollProps = {
      ...this.props,
      onContentSizeChange: this._onContentSizeChange,
      onLayout: this._onLayout,
      onScroll: this._onScroll,
      scrollEventThrottle: this.props.scrollEventThrottle ?? 0.0001,
      invertStickyHeaders: this.props.invertStickyHeaders ?? inverted,
      stickyHeaderIndices,
      style: inversionStyle ? [inversionStyle, this.props.style] : this.props.style,
    };

    return (
      <VirtualizedListContextProvider value={{cellKey: null, getScrollMetrics: this._getScrollMetrics, horizontal: horizontalOrDefault(horizontal), getOutermostParentListRef: this._getOutermostParentListRef, registerAsNestedChild: this._registerAsNestedChild, unregisterAsNestedChild: this._unregisterAsNestedChild}}>
        {cloneElement((this.props.renderScrollComponent || this._defaultRenderScrollComponent)(scrollProps), {ref: this._captureScrollRef}, cells)}
      </VirtualizedListContextProvider>
    );
  }

  _cellRefs: {[string]: any} = {};
  _fillRateHelper: FillRateHelper;
  _listMetrics: ListMetricsAggregator = new ListMetricsAggregator();
  _scrollMetrics: any = {offset: 0, visibleLength: 0, timestamp: 0, velocity: 0};
  _indicesToKeys: Map<number, string> = new Map();
  _nestedChildLists: ChildListCollection<VirtualizedList> = new ChildListCollection();
  _scrollRef: ?any = null;

  _captureScrollRef = (ref: any) => { this._scrollRef = ref; };

  /**
   * INI ADALAH FUNGSI YANG DIUBAH UNTUK FIX ISSUE #17553
   */
  _defaultRenderScrollComponent = props => {
    const onRefresh = props.onRefresh;
    if (this._isNestedWithSameOrientation()) {
      const {onContentSizeChange, ...otherProps} = props;
      return <View {...otherProps} />;
    } else if (onRefresh) {
      /* * Fix: Jika list dibalik (inverted), kita harus balikkan juga RefreshControl-nya
       * supaya ActivityIndicator muncul di 'visual top' dan tidak terbalik.
       */
      const inversionStyle = props.inverted 
        ? (horizontalOrDefault(props.horizontal) ? styles.horizontallyInverted : styles.verticallyInverted) 
        : null;

      return (
        <ScrollView
          {...props}
          refreshControl={
            props.refreshControl == null ? (
              <RefreshControl
                refreshing={props.refreshing}
                onRefresh={onRefresh}
                progressViewOffset={props.progressViewOffset}
                // Terapkan gaya balik di sini
                style={inversionStyle}
              />
            ) : (
              // Jika user pakai custom refreshControl, kita bungkus biar aman
              props.inverted ? <View style={inversionStyle}>{props.refreshControl}</View> : props.refreshControl
            )
          }
        />
      );
    } else {
      return <ScrollView {...props} />;
    }
  };

  _onCellLayout = (e: any, key: string, index: number) => {
    if (this._listMetrics.notifyCellLayout({cellIndex: index, cellKey: key, layout: e.nativeEvent.layout, orientation: this._orientation()})) {
      this._scheduleCellsToRenderUpdate();
    }
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
  };

  _onLayout = (e: any) => {
    this._scrollMetrics.visibleLength = this._selectLength(e.nativeEvent.layout);
    this._scheduleCellsToRenderUpdate();
  };

  _onContentSizeChange = (w: number, h: number) => {
    this._listMetrics.notifyListContentLayout({layout: {width: w, height: h}, orientation: this._orientation()});
    this._scheduleCellsToRenderUpdate();
  };

  _onScroll = (e: any) => {
    const offset = this._offsetFromScrollEvent(e);
    this._scrollMetrics = {...this._scrollMetrics, offset, visibleLength: this._selectLength(e.nativeEvent.layoutMeasurement)};
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
    this._scheduleCellsToRenderUpdate();
  };

  _offsetFromScrollEvent(e: any): number {
    const {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent;
    const {horizontal, rtl} = this._orientation();
    if (horizontal && rtl) return this._selectLength(contentSize) - (this._selectOffset(contentOffset) + this._selectLength(layoutMeasurement));
    return this._selectOffset(contentOffset);
  }

  _scheduleCellsToRenderUpdate() {
    if (this._updateCellsToRenderTimeoutID == null) {
      this._updateCellsToRenderTimeoutID = setTimeout(() => {
        this._updateCellsToRenderTimeoutID = null;
        this._updateCellsToRender();
      }, this.props.updateCellsBatchingPeriod ?? 50);
    }
  }

  _updateCellsToRender = () => {
    this.setState((state, props) => {
      const viewport = this._adjustCellsAroundViewport(props, state.cellsAroundViewport, state.pendingScrollUpdateCount);
      const mask = VirtualizedList._createRenderMask(props, viewport);
      return {cellsAroundViewport: viewport, renderMask: mask};
    });
  };

  _updateViewableItems(props: any, cells: any) {
    this._viewabilityTuples.forEach(t => t.viewabilityHelper.onUpdate(props, this._scrollMetrics.offset, this._scrollMetrics.visibleLength, this._listMetrics, (i, v, p) => ({index: i, isViewable: v, item: p.getItem(p.data, i), key: VirtualizedList._keyExtractor(p.getItem(p.data, i), i, p)}), t.onViewableItemsChanged, cells));
  }

  _orientation(): ListOrientation { return {horizontal: horizontalOrDefault(this.props.horizontal), rtl: I18nManager.isRTL}; }
  _selectLength(m: any) { return !horizontalOrDefault(this.props.horizontal) ? m.height : m.width; }
  _selectOffset(o: any) { return horizontalOrDefault(this.props.horizontal) ? o.x : o.y; }
  _getFooterCellKey() { return this._getCellKey() + '-footer'; }
  _onLayoutHeader = (e: any) => { this._headerLength = this._selectLength(e.nativeEvent.layout); };
  _onLayoutFooter = (e: any) => { this._footerLength = this._selectLength(e.nativeEvent.layout); };
  _onLayoutEmpty = (e: any) => {};
}

const styles = StyleSheet.create({
  verticallyInverted: Platform.OS === 'android' ? {transform: [{scale: -1}]} : {transform: [{scaleY: -1}]},
  horizontallyInverted: {transform: [{scaleX: -1}]},
});

export default VirtualizedList;               
