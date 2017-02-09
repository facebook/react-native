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
 * @providesModule VirtualizedList
 * @flow
 */
'use strict';

const Batchinator = require('Batchinator');
const React = require('React');
const RefreshControl = require('RefreshControl');
const ScrollView = require('ScrollView');
const View = require('View');
const ViewabilityHelper = require('ViewabilityHelper');

const infoLog = require('infoLog');
const invariant = require('fbjs/lib/invariant');

const {computeWindowedRenderLimits} = require('VirtualizeUtils');

import type {Viewable} from 'ViewabilityHelper';

type Item = any;
type ItemComponentType = ReactClass<{item: Item, index: number}>;

/**
 * Renders a virtual list of items given a data blob and accessor functions. Items that are outside
 * the render window are 'virtualized' e.g. unmounted or never rendered in the first place. This
 * improves performance and saves memory for large data sets, but will reset state on items that
 * scroll too far out of the render window.
 *
 * TODO: Note that LayoutAnimation and sticky section headers both have bugs when used with this and
 * are therefor not supported, but new Animated impl might work?
 * https://github.com/facebook/react-native/pull/11315
 *
 * TODO: removeClippedSubviews might not be necessary and may cause bugs?
 *
 */
type RequiredProps = {
  ItemComponent: ItemComponentType,
  /**
   * The default accessor functions assume this is an Array<{key: string}> but you can override
   * getItem, getItemCount, and keyExtractor to handle any type of index-based data.
   */
  data: any,
};
type OptionalProps = {
  FooterComponent?: ?ReactClass<*>,
  HeaderComponent?: ?ReactClass<*>,
  SeparatorComponent?: ?ReactClass<*>,
  /**
   * DEPRECATED: Virtualization provides significant performance and memory optimizations, but fully
   * unmounts react instances that are outside of the render window. You should only need to disable
   * this for debugging purposes.
   */
  disableVirtualization: boolean,
  getItem: (items: any, index: number) => ?Item,
  getItemCount: (items: any) => number,
  getItemLayout?: (items: any, index: number) => {length: number, offset: number}, // e.g. height, y
  horizontal: boolean,
  initialNumToRender: number,
  keyExtractor: (item: Item, index: number) => string,
  maxToRenderPerBatch: number,
  onEndReached: ({distanceFromEnd: number}) => void,
  onEndReachedThreshold: number, // units of visible length
  onLayout?: ?Function,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?Function,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewablePercentThreshold` prop.
   */
  onViewableItemsChanged?: ({viewableItems: Array<Viewable>, changed: Array<Viewable>}) => void,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: boolean,
  renderScrollComponent: (props: Object) => React.Element<*>,
  shouldItemUpdate: (
    props: {item: Item, index: number},
    nextProps: {item: Item, index: number}
  ) => boolean,
  updateCellsBatchingPeriod: number,
  /**
   * Percent of viewport that must be covered for a partially occluded item to count as
   * "viewable", 0-100. Fully visible items are always considered viewable. A value of 0 means
   * that a single pixel in the viewport makes the item viewable, and a value of 100 means that
   * an item must be either entirely visible or cover the entire viewport to count as viewable.
   */
  viewablePercentThreshold: number,
  windowSize: number, // units of visible length
};
type Props = RequiredProps & OptionalProps;

let _usedIndexForKey = false;

class VirtualizedList extends React.PureComponent {
  props: Props;

  // scrollToEnd may be janky without getItemLayout prop
  scrollToEnd(params?: ?{animated?: ?boolean}) {
    const animated = params ? params.animated : true;
    const veryLast = this.props.getItemCount(this.props.data) - 1;
    const frame = this._getFrameMetricsApprox(veryLast);
    const offset = frame.offset + frame.length + this._footerLength -
      this._scrollMetrics.visibleLength;
    this._scrollRef.scrollTo(
      this.props.horizontal ? {x: offset, animated} : {y: offset, animated}
    );
  }

  // scrollToIndex may be janky without getItemLayout prop
  scrollToIndex(params: {animated?: ?boolean, index: number, viewPosition?: number}) {
    const {data, horizontal, getItemCount} = this.props;
    const {animated, index, viewPosition} = params;
    if (!(index >= 0 && index < getItemCount(data))) {
      console.warn('scrollToIndex out of range ' + index);
      return;
    }
    const frame = this._getFrameMetricsApprox(index);
    const offset = Math.max(
      0,
      frame.offset - (viewPosition || 0) * (this._scrollMetrics.visibleLength - frame.length),
    );
    this._scrollRef.scrollTo(horizontal ? {x: offset, animated} : {y: offset, animated});
  }

  // scrollToItem may be janky without getItemLayout prop. Required linear scan through items -
  // use scrollToIndex instead if possible.
  scrollToItem(params: {animated?: ?boolean, item: Item, viewPosition?: number}) {
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

  scrollToOffset(params: {animated?: ?boolean, offset: number}) {
    const {animated, offset} = params;
    this._scrollRef.scrollTo(
      this.props.horizontal ? {x: offset, animated} : {y: offset, animated}
    );
  }

  static defaultProps: OptionalProps = {
    disableVirtualization: false,
    getItem: (data: any, index: number) => data[index],
    getItemCount: (data: any) => data ? data.length : 0,
    horizontal: false,
    initialNumToRender: 10,
    keyExtractor: (item: Item, index: number) => {
      if (item.key != null) {
        return item.key;
      }
      _usedIndexForKey = true;
      return String(index);
    },
    maxToRenderPerBatch: 10,
    onEndReached: () => {},
    onEndReachedThreshold: 2, // multiples of length
    renderScrollComponent: (props: Props) => {
      if (props.onRefresh) {
        invariant(
          typeof props.refreshing === 'boolean',
          '`refreshing` prop must be set as a boolean in order to use `onRefresh`, but got `' +
            JSON.stringify(props.refreshing) + '`',
        );
        return (
          <ScrollView
            {...props}
            refreshControl={
              <RefreshControl
                refreshing={props.refreshing}
                onRefresh={props.onRefresh}
              />
            }
          />
        );
      } else {
        return <ScrollView {...props} />;
      }
    },
    shouldItemUpdate: (
      props: {item: Item, index: number},
      nextProps: {item: Item, index: number},
    ) => true,
    updateCellsBatchingPeriod: 50,
    viewablePercentThreshold: 10,
    windowSize: 21, // multiples of length
  };

  state = {
    first: 0,
    last: this.props.initialNumToRender,
  };

  constructor(props: Props) {
    super(props);
    this._updateCellsToRenderBatcher = new Batchinator(
      this._updateCellsToRender,
      this.props.updateCellsBatchingPeriod,
    );
    this.state = {
      first: 0,
      last: Math.min(this.props.getItemCount(this.props.data), this.props.initialNumToRender) - 1,
    };
  }

  componentWillUnmount() {
    this._updateViewableItems(null);
    this._updateCellsToRenderBatcher.dispose();
  }

  componentWillReceiveProps(newProps: Props) {
    const {data, getItemCount, maxToRenderPerBatch} = newProps;
    // first and last could be stale (e.g. if a new, shorter items props is passed in), so we make
    // sure we're rendering a reasonable range here.
    this.setState({
      first: Math.max(0, Math.min(this.state.first, getItemCount(data) - 1 - maxToRenderPerBatch)),
      last: Math.max(0, Math.min(this.state.last, getItemCount(data) - 1)),
    });
    this._updateCellsToRenderBatcher.schedule();
  }

  render() {
    const {FooterComponent, HeaderComponent, SeparatorComponent} = this.props;
    const {data, disableVirtualization, getItem, horizontal, keyExtractor} = this.props;
    const cells = [];
    if (HeaderComponent) {
      cells.push(
        <View key="$header" onLayout={this._onLayoutHeader}>
          <HeaderComponent />
        </View>
      );
    }
    const itemCount = this.props.getItemCount(data);
    if (itemCount > 0) {
      _usedIndexForKey = false;
      const {first, last} = this.state;
      if (!disableVirtualization && first > 0) {
        const firstOffset = this._getFrameMetricsApprox(first).offset - this._headerLength;
        cells.push(
          <View key="$lead_spacer" style={{[!horizontal ? 'height' : 'width']: firstOffset}} />
        );
      }
      for (let ii = first; ii <= last; ii++) {
        const item = getItem(data, ii);
        invariant(item, 'No item for index ' + ii);
        const key = keyExtractor(item, ii);
        cells.push(
          <CellRenderer
            cellKey={key}
            index={ii}
            item={item}
            key={key}
            onLayout={this._onCellLayout}
            parentProps={this.props}
          />
        );
        if (SeparatorComponent && ii < last) {
          cells.push(<SeparatorComponent key={'sep' + ii}/>);
        }
      }
      if (!this._hasWarned.keys && _usedIndexForKey) {
        console.warn(
          'VirtualizedList: missing keys for items, make sure to specify a key property on each ' +
          'item or provide a custom keyExtractor.'
        );
        this._hasWarned.keys = true;
      }
      if (!disableVirtualization && last < itemCount - 1) {
        const lastFrame = this._getFrameMetricsApprox(last);
        const end = this.props.getItemLayout ?
          itemCount - 1 :
          Math.min(itemCount - 1, this._highestMeasuredFrameIndex);
        const endFrame = this._getFrameMetricsApprox(end);
        const tailSpacerLength =
          (endFrame.offset + endFrame.length) -
          (lastFrame.offset + lastFrame.length);
        cells.push(
          <View key="$tail_spacer" style={{[!horizontal ? 'height' : 'width']: tailSpacerLength}} />
        );
      }
    }
    if (FooterComponent) {
      cells.push(
        <View key="$footer" onLayout={this._onLayoutFooter}>
          <FooterComponent />
        </View>
      );
    }
    const ret = React.cloneElement(
      this.props.renderScrollComponent(this.props),
      {
        onContentSizeChange: this._onContentSizeChange,
        onLayout: this._onLayout,
        onScroll: this._onScroll,
        ref: this._captureScrollRef,
        scrollEventThrottle: 50, // TODO: Android support
      },
      cells,
    );
    return ret;
  }

  componentDidUpdate() {
    this._updateCellsToRenderBatcher.schedule();
  }

  _averageCellLength = 0;
  _hasWarned = {};
  _highestMeasuredFrameIndex = 0;
  _headerLength = 0;
  _frames = {};
  _footerLength = 0;
  _scrollMetrics = {
    visibleLength: 0, contentLength: 0, offset: 0, dt: 10, velocity: 0, timestamp: 0,
  };
  _scrollRef = (null: any);
  _sentEndForContentLength = 0;
  _totalCellLength = 0;
  _totalCellsMeasured = 0;
  _updateCellsToRenderBatcher: Batchinator;
  _viewableKeys: {[key: string]: boolean} = {};
  _viewableItems: Array<Viewable> = [];

  _captureScrollRef = (ref) => {
    this._scrollRef = ref;
  };

  _onCellLayout = (e, cellKey, index) => {
    const layout = e.nativeEvent.layout;
    const next = {offset: this._selectOffset(layout), length: this._selectLength(layout), index};
    const curr = this._frames[cellKey];
    if (!curr ||
      next.offset !== curr.offset ||
      next.length !== curr.length ||
      index !== curr.index
    ) {
      this._totalCellLength += next.length - (curr ? curr.length : 0);
      this._totalCellsMeasured += (curr ? 0 : 1);
      this._averageCellLength = this._totalCellLength / this._totalCellsMeasured;
      this._frames[cellKey] = next;
      this._highestMeasuredFrameIndex = Math.max(this._highestMeasuredFrameIndex, index);
      this._updateCellsToRenderBatcher.schedule();
    }
  };

  _onLayout = (e: Object) => {
    this._scrollMetrics.visibleLength = this._selectLength(e.nativeEvent.layout);
    this.props.onLayout && this.props.onLayout(e);
    this._updateCellsToRenderBatcher.schedule();
  };

  _onLayoutFooter = (e) => {
    this._footerLength = this._selectLength(e.nativeEvent.layout);
  };

  _onLayoutHeader = (e) => {
    this._headerLength = this._selectLength(e.nativeEvent.layout);
  };

  _selectLength(metrics: {height: number, width: number}): number {
    return !this.props.horizontal ? metrics.height : metrics.width;
  }

  _selectOffset(metrics: {x: number, y: number}): number {
    return !this.props.horizontal ? metrics.y : metrics.x;
  }

  _onContentSizeChange = (width: number, height: number) => {
    this._scrollMetrics.contentLength = this._selectLength({height, width});
    this._updateCellsToRenderBatcher.schedule();
  };

  _onScroll = (e: Object) => {
    const timestamp = e.timeStamp;
    const visibleLength = this._selectLength(e.nativeEvent.layoutMeasurement);
    const contentLength = this._selectLength(e.nativeEvent.contentSize);
    const offset = this._selectOffset(e.nativeEvent.contentOffset);
    const dt = Math.max(1, timestamp - this._scrollMetrics.timestamp);
    if (dt > 500 && this._scrollMetrics.dt > 500 && (contentLength > (5 * visibleLength)) &&
        !this._hasWarned.perf) {
      infoLog(
        'VirtualizedList: You have a large list that is slow to update - make sure ' +
        'shouldItemUpdate is implemented effectively and consider getItemLayout, PureComponent, ' +
        'etc.',
        {dt, prevDt: this._scrollMetrics.dt, contentLength},
      );
      this._hasWarned.perf = true;
    }
    const dOffset = offset - this._scrollMetrics.offset;
    const velocity = dOffset / dt;
    this._scrollMetrics = {contentLength, dt, offset, timestamp, velocity, visibleLength};
    const {data, getItemCount, onEndReached, onEndReachedThreshold, windowSize} = this.props;
    if (!data) {
      return;
    }
    const distanceFromEnd = contentLength - visibleLength - offset;
    const itemCount = getItemCount(data);
    if (distanceFromEnd < onEndReachedThreshold * visibleLength &&
        this._scrollMetrics.contentLength !== this._sentEndForContentLength &&
        this.state.last === itemCount - 1) {
      // Only call onEndReached for a given content length once.
      this._sentEndForContentLength = this._scrollMetrics.contentLength;
      onEndReached({distanceFromEnd});
    }
    const {first, last} = this.state;
    if ((first > 0 && velocity < 0) || (last < itemCount - 1 && velocity > 0)) {
      const distanceToContentEdge = Math.min(
        Math.abs(this._getFrameMetricsApprox(first).offset - offset),
        Math.abs(this._getFrameMetricsApprox(last).offset - (offset + visibleLength)),
      );
      const hiPri = distanceToContentEdge < (windowSize * visibleLength / 4);
      if (hiPri) {
        // Don't worry about interactions when scrolling quickly; focus on filling content as fast
        // as possible.
        this._updateCellsToRenderBatcher.dispose({abort: true});
        this._updateCellsToRender();
        return;
      }
    }
    this._updateCellsToRenderBatcher.schedule();
  };

  _updateCellsToRender = () => {
    const {data, disableVirtualization, getItemCount, onEndReachedThreshold} = this.props;
    this._updateViewableItems(data);
    if (!data) {
      return;
    }
    this.setState((state) => {
      let newState;
      if (!disableVirtualization) {
        newState = computeWindowedRenderLimits(
          this.props, state, this._getFrameMetricsApprox, this._scrollMetrics,
        );
      } else {
        const {contentLength, offset, visibleLength} = this._scrollMetrics;
        const distanceFromEnd = contentLength - visibleLength - offset;
        const renderAhead = distanceFromEnd < onEndReachedThreshold * visibleLength ?
          this.props.maxToRenderPerBatch : 0;
        newState = {
          first: 0,
          last: Math.min(state.last + renderAhead, getItemCount(data) - 1),
        };
      }
      return newState;
    });
  };

  _createViewable(index: number, isViewable: boolean): Viewable {
    const {data, getItem, keyExtractor} = this.props;
    const item = getItem(data, index);
    invariant(item, 'Missing item for index ' + index);
    return {index, item, key: keyExtractor(item, index), isViewable};
  }

  _getFrameMetricsApprox = (index: number): {length: number, offset: number} => {
    const frame = this._getFrameMetrics(index);
    if (frame && frame.index === index) { // check for invalid frames due to row re-ordering
      return frame;
    } else {
      const {getItemLayout} = this.props;
      invariant(
        !getItemLayout,
        'Should not have to estimate frames when a measurement metrics function is provided'
      );
      return {
        length: this._averageCellLength,
        offset: this._averageCellLength * index,
      };
    }
  };

  _getFrameMetrics = (index: number): ?{length: number, offset: number, index: number} => {
    const {data, getItem, getItemCount, getItemLayout, keyExtractor} = this.props;
    invariant(getItemCount(data) > index, 'Tried to get frame for out of range index ' + index);
    const item = getItem(data, index);
    let frame = item && this._frames[keyExtractor(item, index)];
    if (!frame || frame.index !== index) {
      if (getItemLayout) {
        frame = getItemLayout(data, index);
      }
    }
    return frame;
  };

  _updateViewableItems(data: any) {
    const {getItemCount, onViewableItemsChanged, viewablePercentThreshold} = this.props;
    if (!onViewableItemsChanged) {
      return;
    }
    let viewableIndices = [];
    if (data) {
      viewableIndices = ViewabilityHelper.computeViewableItems(
        viewablePercentThreshold,
        getItemCount(data),
        this._scrollMetrics.offset,
        this._scrollMetrics.visibleLength,
        this._getFrameMetrics,
        this.state,
      );
    }
    const viewableKeys = {};
    const viewableItems = viewableIndices.map((ii) => {
      const viewable = this._createViewable(ii, true);
      viewableKeys[viewable.key] = true;
      return viewable;
    });
    const changed = viewableItems.filter(v => !this._viewableKeys[v.key])
      .concat(
        this._viewableItems.filter(v => !viewableKeys[v.key])
        .map(v => ({...v, isViewable: false}))
      );
    if (changed.length > 0) {
      onViewableItemsChanged({viewableItems, changed});
      this._viewableItems = viewableItems;
      this._viewableKeys = viewableKeys;
    }
  }
}

class CellRenderer extends React.Component {
  props: {
    cellKey: string,
    index: number,
    item: Item,
    onLayout: (event: Object, cellKey: string, index: number) => void,
    parentProps: {
      ItemComponent: ItemComponentType,
      getItemLayout?: ?Function,
      shouldItemUpdate: (
        props: {item: Item, index: number},
        nextProps: {item: Item, index: number}
      ) => boolean,
    },
  };
  _onLayout = (e) => {
    this.props.onLayout(e, this.props.cellKey, this.props.index);
  }
  shouldComponentUpdate(nextProps, nextState) {
    const curr = {item: this.props.item, index: this.props.index};
    const next = {item: nextProps.item, index: nextProps.index};
    return nextProps.parentProps.shouldItemUpdate(curr, next);
  }
  render() {
    const {item, index, parentProps} = this.props;
    const {ItemComponent, getItemLayout} = parentProps;
    const element = <ItemComponent item={item} index={index} />;
    if (getItemLayout) {
      return element;
    }
    return (
      <View onLayout={this._onLayout}>
        {element}
      </View>
    );
  }
}

module.exports = VirtualizedList;
