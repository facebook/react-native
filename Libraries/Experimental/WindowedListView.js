/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WindowedListView
 * @flow
 */
'use strict';

const Batchinator = require('Batchinator');
const IncrementalGroup = require('IncrementalGroup');
const React = require('React');
const ScrollView = require('ScrollView');
const Set = require('Set');
const StyleSheet = require('StyleSheet');
const Systrace = require('Systrace');
const View = require('View');
const ViewabilityHelper = require('ViewabilityHelper');

const clamp = require('clamp');
const deepDiffer = require('deepDiffer');
const infoLog = require('infoLog');
const invariant = require('fbjs/lib/invariant');
const nullthrows = require('fbjs/lib/nullthrows');

import type {NativeMethodsMixinType} from 'ReactNativeTypes';

const DEBUG = false;

/**
 * An experimental ListView implementation designed for efficient memory usage
 * when rendering huge/infinite lists. It works by rendering a subset of rows
 * and replacing offscreen rows with an empty spacer, which means that it has to
 * re-render rows when scrolling back up.
 *
 * Note that rows must be the same height when they are re-mounted as when they
 * are unmounted otherwise the content will jump around. This means that any
 * state that affects the height, such as tap to expand, should be stored
 * outside the row component to maintain continuity.
 *
 * This is not a drop-in replacement for `ListView` - many features are not
 * supported, including section headers, dataSources, horizontal layout, etc.
 *
 * Row data should be provided as a simple array corresponding to rows.  `===`
 * is used to determine if a row has changed and should be re-rendered.
 *
 * Rendering is done incrementally one row at a time to minimize the amount of
 * work done per JS event tick. Individual rows can also use <Incremental>
 * to further break up the work and keep the app responsive and improve scroll
 * perf if rows get exceedingly complex.
 *
 * Note that it's possible to scroll faster than rows can be rendered. Instead
 * of showing the user a bunch of un-mounted blank space, WLV sets contentInset
 * to prevent scrolling into unrendered areas. Supply the
 * `renderWindowBoundaryIndicator` prop to indicate the boundary to the user,
 * e.g. with a row placeholder.
 */
type Props = {
  /**
   * A simple array of data blobs that are passed to the renderRow function in
   * order. Note there is no dataSource like in the standard `ListView`.
   */
  data: Array<{rowKey: string, rowData: any}>,
  /**
   * Takes a data blob from the `data` array prop plus some meta info and should
   * return a row.
   */
  renderRow: (
    rowData: any, sectionIdx: number, rowIdx: number, rowKey: string
  ) => ?React.Element<any>,
  /**
   * Rendered when the list is scrolled faster than rows can be rendered.
   */
  renderWindowBoundaryIndicator?: (
    showIndicator: boolean,
  ) => ?React.Element<any>,
  /**
   * Always rendered at the bottom of all the rows.
   */
  renderFooter?: (
    showFooter: boolean,
  ) => ?React.Element<any>,
  /**
   * Pipes through normal onScroll events from the underlying `ScrollView`.
   */
  onScroll?: (event: Object) => void,
  /**
   * Called when the rows that are visible in the viewport change.
   */
  onVisibleRowsChanged?: (firstIdx: number, count: number) => void,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewablePercentThreshold` prop.
   */
  onViewableRowsChanged?: (viewableRows: Array<number>) => void,
  /**
   * The percent of a row that must be visible to consider it "viewable".
   */
  viewablePercentThreshold: number,
  /**
   * Number of rows to render on first mount.
   */
  initialNumToRender: number,
  /**
   * Maximum number of rows to render while scrolling, i.e. the window size.
   */
  maxNumToRender: number,
  /**
   * Number of rows to render beyond the viewport. Note that this combined with
   * `maxNumToRender` and the number of rows that can fit in one screen will
   * determine how many rows to render above the viewport.
   */
  numToRenderAhead: number,
  /**
   * Used to log perf events for async row rendering.
   */
  asyncRowPerfEventName?: string,
  /**
   * A function that returns the scrollable component in which the list rows
   * are rendered. Defaults to returning a ScrollView with the given props.
   */
  renderScrollComponent: (props: ?Object) => React.Element<any>,
  /**
   * Use to disable incremental rendering when not wanted, e.g. to speed up initial render.
   */
  disableIncrementalRendering: boolean,
  /**
   * This determines how frequently events such as scroll and layout can trigger a re-render.
   */
  recomputeRowsBatchingPeriod: number,
  /**
   * Called when rows will be mounted/unmounted. Mounted rows always form a contiguous block so it
   * is expressed as a range of start plus count.
   */
  onMountedRowsWillChange?: (firstIdx: number, count: number) => void,
  /**
   * Change this when you want to make sure the WindowedListView will re-render, for example when
   * the result of `renderScrollComponent` might change. It will be compared in
   * `shouldComponentUpdate`.
   */
  shouldUpdateToken?: string,
};

type State = {
  boundaryIndicatorHeight?: number,
  firstRow: number,
  lastRow: number,
};
class WindowedListView extends React.Component<Props, State> {
  /**
   * Recomputing which rows to render is batched up and run asynchronously to avoid wastful updates,
   * e.g. from multiple layout updates in rapid succession.
   */
  _computeRowsToRenderBatcher: Batchinator;
  _firstVisible: number = -1;
  _lastVisible: number = -1;
  _scrollOffsetY: number = 0;
  _isScrolling: boolean = false;
  _frameHeight: number = 0;
  _rowFrames: {[key: string]: Object} = {};
  _rowRenderMode: {[key: string]: null | 'async' | 'sync'} = {};
  _rowFramesDirty: boolean = false;
  _hasCalledOnEndReached: boolean = false;
  _willComputeRowsToRender: boolean = false;
  _viewableRows: Array<number> = [];
  _cellsInProgress: Set<string> = new Set();
  _scrollRef: ?ScrollView;
  _viewabilityHelper: ViewabilityHelper;

  static defaultProps = {
    initialNumToRender: 10,
    maxNumToRender: 30,
    numToRenderAhead: 10,
    viewablePercentThreshold: 50,
    /* $FlowFixMe(>=0.59.0 site=react_native_fb) This comment suppresses an
     * error caught by Flow 0.59 which was not caught before. Most likely, this
     * error is because an exported function parameter is missing an
     * annotation. Without an annotation, these parameters are uncovered by
     * Flow. */
    renderScrollComponent: (props) => <ScrollView {...props} />,
    disableIncrementalRendering: false,
    recomputeRowsBatchingPeriod: 10, // This should capture most events that happen within a frame
  };

  constructor(props: Props) {
    super(props);
    invariant(
      this.props.numToRenderAhead < this.props.maxNumToRender,
      'WindowedListView: numToRenderAhead must be less than maxNumToRender'
    );
    this._computeRowsToRenderBatcher = new Batchinator(
      () => this._computeRowsToRender(this.props),
      this.props.recomputeRowsBatchingPeriod,
    );
    this._viewabilityHelper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: this.props.viewablePercentThreshold,
    });
    this.state = {
      firstRow: 0,
      lastRow: Math.min(this.props.data.length, this.props.initialNumToRender) - 1,
    };
  }
  getScrollResponder(): ?ScrollView {
    return this._scrollRef &&
      this._scrollRef.getScrollResponder &&
      this._scrollRef.getScrollResponder();
  }
  shouldComponentUpdate(newProps: Props, newState: State): boolean {
    DEBUG && infoLog('WLV: shouldComponentUpdate...');
    if (newState !== this.state) {
      DEBUG && infoLog('  yes: ', {newState, oldState: this.state});
      return true;
    }
    for (const key in newProps) {
      if (key !== 'data' && newProps[key] !== this.props[key]) {
        DEBUG && infoLog('  yes, non-data prop change: ', {key});
        return true;
      }
    }
    const newDataSubset = newProps.data.slice(newState.firstRow, newState.lastRow + 1);
    const prevDataSubset = this.props.data.slice(this.state.firstRow, this.state.lastRow + 1);
    if (newDataSubset.length !== prevDataSubset.length) {
      DEBUG && infoLog(
        '  yes, subset length: ',
        {newLen: newDataSubset.length, oldLen: prevDataSubset.length}
      );
      return true;
    }
    for (let idx = 0; idx < newDataSubset.length; idx++) {
      if (newDataSubset[idx].rowData !== prevDataSubset[idx].rowData ||
          newDataSubset[idx].rowKey !== prevDataSubset[idx].rowKey) {
        DEBUG && infoLog(
          '  yes, data change: ',
          {idx, new: newDataSubset[idx], old: prevDataSubset[idx]}
        );
        return true;
      }
    }
    DEBUG && infoLog('  knope');
    return false;
  }
  UNSAFE_componentWillReceiveProps() {
    this._computeRowsToRenderBatcher.schedule();
  }
  _onMomentumScrollEnd = (e: Object) => {
    this._onScroll(e);
  };
  _getFrameMetrics = (index: number): ?{length: number, offset: number} => {
    const frame = this._rowFrames[this.props.data[index].rowKey];
    return frame && {length: frame.height, offset: frame.y};
  }
  _onScroll = (e: Object) => {
    const newScrollY = e.nativeEvent.contentOffset.y;
    this._isScrolling = this._scrollOffsetY !== newScrollY;
    this._scrollOffsetY = newScrollY;
    this._frameHeight = e.nativeEvent.layoutMeasurement.height;
    // We don't want to enqueue any updates if any cells are in the middle of an incremental render,
    // because it would just be wasted work.
    if (this._cellsInProgress.size === 0) {
      this._computeRowsToRenderBatcher.schedule();
    }
    if (this.props.onViewableRowsChanged && Object.keys(this._rowFrames).length) {
      const viewableRows = this._viewabilityHelper.computeViewableItems(
        this.props.data.length,
        e.nativeEvent.contentOffset.y,
        e.nativeEvent.layoutMeasurement.height,
        this._getFrameMetrics,
      );
      if (deepDiffer(viewableRows, this._viewableRows)) {
        this._viewableRows = viewableRows;
        nullthrows(this.props.onViewableRowsChanged)(this._viewableRows);
      }
    }
    this.props.onScroll && this.props.onScroll(e);
  };
  // Caller does the diffing so we don't have to.
  _onNewLayout = (params: {rowKey: string, layout: Object}) => {
    const {rowKey, layout} = params;
    if (DEBUG) {
      const prev = this._rowFrames[rowKey] || {};
      infoLog(
        'record layout for row: ',
        {k: rowKey, h: layout.height, y: layout.y, x: layout.x, hp: prev.height, yp: prev.y}
      );
      if (this._rowFrames[rowKey]) {
        const deltaY = Math.abs(this._rowFrames[rowKey].y - layout.y);
        const deltaH = Math.abs(this._rowFrames[rowKey].height - layout.height);
        if (deltaY > 2 || deltaH > 2) {
          const dataEntry = this.props.data.find((datum) => datum.rowKey === rowKey);
          console.warn(
            'layout jump: ',
            {dataEntry, prevLayout: this._rowFrames[rowKey], newLayout: layout}
          );
        }
      }
    }
    this._rowFrames[rowKey] = {...layout, offscreenLayoutDone: true};
    this._rowFramesDirty = true;
    if (this._cellsInProgress.size === 0) {
      this._computeRowsToRenderBatcher.schedule();
    }
  };
  _onWillUnmountCell = (rowKey: string) => {
    if (this._rowFrames[rowKey]) {
      this._rowFrames[rowKey].offscreenLayoutDone = false;
      this._rowRenderMode[rowKey] = null;
    }
  };
  /**
   * This is used to keep track of cells that are in the process of rendering. If any cells are in
   * progress, then other updates are skipped because they will just be wasted work.
   */
  _onProgressChange = ({rowKey, inProgress}: {rowKey: string, inProgress: boolean}) => {
    if (inProgress) {
      this._cellsInProgress.add(rowKey);
    } else {
      this._cellsInProgress.delete(rowKey);
    }
  };
  componentWillUnmount() {
    this._computeRowsToRenderBatcher.dispose();
  }
  _computeRowsToRender(props: Object): void {
    const totalRows = props.data.length;
    if (totalRows === 0) {
      this._updateVisibleRows(-1, -1);
      this.setState({
        firstRow: 0,
        lastRow: -1,
      });
      return;
    }
    const rowFrames = this._rowFrames;
    let firstVisible = -1;
    let lastVisible = 0;
    let lastRow = clamp(0, this.state.lastRow, totalRows - 1);
    const top = this._scrollOffsetY;
    const bottom = top + this._frameHeight;
    for (let idx = 0; idx < lastRow; idx++) {
      const frame = rowFrames[props.data[idx].rowKey];
      if (!frame) {
        // No frame - sometimes happens when they come out of order, so just wait for the rest.
        return;
      }
      if (((frame.y + frame.height) > top) && (firstVisible < 0)) {
        firstVisible = idx;
      }
      if (frame.y < bottom) {
        lastVisible = idx;
      } else {
        break;
      }
    }
    if (firstVisible === -1) {
      firstVisible = 0;
    }
    this._updateVisibleRows(firstVisible, lastVisible);

    // Unfortuantely, we can't use <Incremental> to simplify our increment logic in this function
    // because we need to make sure that cells are rendered in the right order one at a time when
    // scrolling back up.

    const numRendered = lastRow - this.state.firstRow + 1;
    // Our last row target that we will approach incrementally
    const targetLastRow = clamp(
      numRendered - 1, // Don't reduce numRendered when scrolling back up
      lastVisible + props.numToRenderAhead, // Primary goal
      totalRows - 1, // Don't render past the end
    );
    // Increment the last row one at a time per JS event loop
    if (targetLastRow > this.state.lastRow) {
      lastRow++;
    } else if (targetLastRow < this.state.lastRow) {
      lastRow--;
    }
    // Once last row is set, figure out the first row
    const firstRow = Math.max(
      0, // Don't render past the top
      lastRow - props.maxNumToRender + 1, // Don't exceed max to render
      lastRow - numRendered, // Don't render more than 1 additional row
    );
    if (lastRow >= totalRows) {
      // It's possible that the number of rows decreased by more than one
      // increment could compensate for.  Need to make sure we don't render more
      // than one new row at a time, but don't want to render past the end of
      // the data.
      lastRow = totalRows - 1;
    }
    if (props.onEndReached) {
      // Make sure we call onEndReached exactly once every time we reach the
      // end.  Resets if scroll back up and down again.
      const willBeAtTheEnd = lastRow === (totalRows - 1);
      if (willBeAtTheEnd && !this._hasCalledOnEndReached) {
        props.onEndReached();
        this._hasCalledOnEndReached = true;
      } else {
        // If lastRow is changing, reset so we can call onEndReached again
        this._hasCalledOnEndReached = this.state.lastRow === lastRow;
      }
    }
    const rowsShouldChange = firstRow !== this.state.firstRow || lastRow !== this.state.lastRow;
    if (this._rowFramesDirty || rowsShouldChange) {
      if (rowsShouldChange) {
        props.onMountedRowsWillChange &&
          props.onMountedRowsWillChange(firstRow, lastRow - firstRow + 1);
        infoLog(
          'WLV: row render range will change:',
          {firstRow, firstVis: this._firstVisible, lastVis: this._lastVisible, lastRow},
        );
      }
      this._rowFramesDirty = false;
      this.setState({firstRow, lastRow});
    }
  }
  _updateVisibleRows(newFirstVisible: number, newLastVisible: number) {
    if (this.props.onVisibleRowsChanged) {
      if (this._firstVisible !== newFirstVisible ||
          this._lastVisible !== newLastVisible) {
        this.props.onVisibleRowsChanged(newFirstVisible, newLastVisible - newFirstVisible + 1);
      }
    }
    this._firstVisible = newFirstVisible;
    this._lastVisible = newLastVisible;
  }
  render(): React.Node {
    const {firstRow} = this.state;
    const lastRow = clamp(0, this.state.lastRow, this.props.data.length - 1);
    const rowFrames = this._rowFrames;
    const rows = [];
    let spacerHeight = 0;
    // Incremental rendering is a tradeoff between throughput and responsiveness. When we have
    // plenty of buffer (say 50% of the target), we render incrementally to keep the app responsive.
    // If we are dangerously low on buffer (say below 25%) we always disable incremental to try to
    // catch up as fast as possible. In the middle, we only disable incremental while scrolling
    // since it's unlikely the user will try to press a button while scrolling. We also ignore the
    // "buffer" size when we are bumped up against the edge of the available data.
    const firstBuffer = firstRow === 0 ? Infinity : this._firstVisible - firstRow;
    const lastBuffer = lastRow === this.props.data.length - 1
      ? Infinity
      : lastRow - this._lastVisible;
    const minBuffer = Math.min(firstBuffer, lastBuffer);
    const disableIncrementalRendering = this.props.disableIncrementalRendering ||
      (this._isScrolling && minBuffer < this.props.numToRenderAhead * 0.5) ||
      (minBuffer < this.props.numToRenderAhead * 0.25);
    // Render mode is sticky while the component is mounted.
    for (let ii = firstRow; ii <= lastRow; ii++) {
      const rowKey = this.props.data[ii].rowKey;
      if (
        this._rowRenderMode[rowKey] === 'sync' ||
        (disableIncrementalRendering && this._rowRenderMode[rowKey] !== 'async')
      ) {
        this._rowRenderMode[rowKey] = 'sync';
      } else {
        this._rowRenderMode[rowKey] = 'async';
      }
    }
    for (let ii = firstRow; ii <= lastRow; ii++) {
      const rowKey = this.props.data[ii].rowKey;
      if (!rowFrames[rowKey]) {
        break; // if rowFrame missing, no following ones will exist so quit early
      }
      // Look for the first row where offscreen layout is done (only true for mounted rows) or it
      // will be rendered synchronously and set the spacer height such that it will offset all the
      // unmounted rows before that one using the saved frame data.
      if (rowFrames[rowKey].offscreenLayoutDone || this._rowRenderMode[rowKey] === 'sync') {
        if (ii > 0) {
          const prevRowKey = this.props.data[ii - 1].rowKey;
          const frame = rowFrames[prevRowKey];
          spacerHeight = frame ? frame.y + frame.height : 0;
        }
        break;
      }
    }
    let showIndicator = false;
    if (
      spacerHeight > (this.state.boundaryIndicatorHeight || 0) &&
      this.props.renderWindowBoundaryIndicator
    ) {
      showIndicator = true;
      spacerHeight -= this.state.boundaryIndicatorHeight || 0;
    }
    DEBUG && infoLog('render top spacer with height ', spacerHeight);
    rows.push(<View key="sp-top" style={{height: spacerHeight}} />);
    if (this.props.renderWindowBoundaryIndicator) {
      // Always render it, even if removed, so that we can get the height right away and don't waste
      // time creating/ destroying it. Should see if there is a better spinner option that is not as
      // expensive.
      rows.push(
        <View
          style={!showIndicator && styles.remove}
          key="ind-top"
          onLayout={(e) => {
            const layout = e.nativeEvent.layout;
            if (layout.height !== this.state.boundaryIndicatorHeight) {
              this.setState({boundaryIndicatorHeight: layout.height});
            }
          }}>
          {this.props.renderWindowBoundaryIndicator(showIndicator)}
        </View>
      );
    }
    for (let idx = firstRow; idx <= lastRow; idx++) {
      const rowKey = this.props.data[idx].rowKey;
      const includeInLayout = this._rowRenderMode[rowKey] === 'sync' ||
        (this._rowFrames[rowKey] && this._rowFrames[rowKey].offscreenLayoutDone);
      rows.push(
        <CellRenderer
          key={rowKey}
          rowKey={rowKey}
          rowIndex={idx}
          onNewLayout={this._onNewLayout}
          onWillUnmount={this._onWillUnmountCell}
          includeInLayout={includeInLayout}
          onProgressChange={this._onProgressChange}
          asyncRowPerfEventName={this.props.asyncRowPerfEventName}
          rowData={this.props.data[idx].rowData}
          renderRow={this.props.renderRow}
        />
      );
    }
    const lastRowKey = this.props.data[lastRow].rowKey;
    const showFooter = this._rowFrames[lastRowKey] &&
        this._rowFrames[lastRowKey].offscreenLayoutDone &&
        lastRow === this.props.data.length - 1;
    if (this.props.renderFooter) {
      rows.push(
        <View
          key="ind-footer"
          style={showFooter ? styles.include : styles.remove}>
          {this.props.renderFooter(showFooter)}
        </View>
      );
    }
    if (this.props.renderWindowBoundaryIndicator) {
      rows.push(
        <View
          key="ind-bot"
          style={showFooter ? styles.remove : styles.include}
          onLayout={(e) => {
            const layout = e.nativeEvent.layout;
            if (layout.height !== this.state.boundaryIndicatorHeight) {
              this.setState({boundaryIndicatorHeight: layout.height});
            }
          }}>
          {this.props.renderWindowBoundaryIndicator(!showFooter)}
        </View>
      );
    }
    // Prevent user from scrolling into empty space of unmounted rows.
    const contentInset = {top: firstRow === 0 ? 0 : -spacerHeight};
    return (
      this.props.renderScrollComponent({
        scrollEventThrottle: 50,
        removeClippedSubviews: true,
        ...this.props,
        contentInset,
        ref: (ref) => { this._scrollRef = ref; },
        onScroll: this._onScroll,
        onMomentumScrollEnd: this._onMomentumScrollEnd,
        children: rows,
      })
    );
  }
}

// performance testing id, unique for each component mount cycle
let g_perf_update_id = 0;

type CellProps = {
  /**
   * Row-specific data passed to renderRow and used in shouldComponentUpdate with ===
   */
  rowData: mixed,
  rowKey: string,
  /**
   * Renders the actual row contents.
   */
   renderRow: (
      rowData: mixed, sectionIdx: number, rowIdx: number, rowKey: string
   ) => ?React.Element<any>,
  /**
   * Index of the row, passed through to other callbacks.
   */
  rowIndex: number,
  /**
   * Used for marking async begin/end events for row rendering.
   */
  asyncRowPerfEventName: ?string,
  /**
   * Initially false to indicate the cell should be rendered "offscreen" with position: absolute so
   * that incremental rendering doesn't cause things to jump around. Once onNewLayout is called
   * after offscreen rendering has completed, includeInLayout will be set true and the finished cell
   * can be dropped into place.
   *
   * This is coordinated outside this component so the parent can syncronize this re-render with
   * managing the placeholder sizing.
   */
  includeInLayout: boolean,
  /**
   * Updates the parent with the latest layout. Only called when incremental rendering is done and
   * triggers the parent to re-render this row with includeInLayout true.
   */
  onNewLayout: (params: {rowKey: string, layout: Object}) => void,
  /**
   * Used to track when rendering is in progress so the parent can avoid wastedful re-renders that
   * are just going to be invalidated once the cell finishes.
   */
  onProgressChange: (progress: {rowKey: string, inProgress: boolean}) => void,
  /**
   * Used to invalidate the layout so the parent knows it needs to compensate for the height in the
   * placeholder size.
   */
  onWillUnmount: (rowKey: string) => void,
};
class CellRenderer extends React.Component<CellProps> {
  _containerRef: NativeMethodsMixinType;
  _offscreenRenderDone = false;
  _timeout = 0;
  _lastLayout: ?Object = null;
  _perfUpdateID: number = 0;
  _asyncCookie: any;
  _includeInLayoutLatch: boolean = false;
  UNSAFE_componentWillMount() {
    if (this.props.asyncRowPerfEventName) {
      this._perfUpdateID = g_perf_update_id++;
      this._asyncCookie = Systrace.beginAsyncEvent(
        this.props.asyncRowPerfEventName + this._perfUpdateID
      );
      // $FlowFixMe(>=0.28.0)
      infoLog(`perf_asynctest_${this.props.asyncRowPerfEventName}_start ${this._perfUpdateID} ` +
        `${Date.now()}`);
    }
    if (this.props.includeInLayout) {
      this._includeInLayoutLatch = true;
    }
    this.props.onProgressChange({rowKey: this.props.rowKey, inProgress: true});
  }
  _onLayout = (e) => {
    const layout = e.nativeEvent.layout;
    const layoutChanged = deepDiffer(this._lastLayout, layout);
    this._lastLayout = layout;
    if (!this._offscreenRenderDone || !layoutChanged) {
      return; // Don't send premature or duplicate updates
    }
    this.props.onNewLayout({
      rowKey: this.props.rowKey,
      layout,
    });
  };
  _updateParent() {
    invariant(!this._offscreenRenderDone, 'should only finish rendering once');
    this._offscreenRenderDone = true;

    // If this is not called before calling onNewLayout, the number of inProgress cells will remain
    // non-zero, and thus the onNewLayout call will not fire the needed state change update.
    this.props.onProgressChange({rowKey: this.props.rowKey, inProgress: false});

    // If an onLayout event hasn't come in yet, then we skip here and assume it will come in later.
    // This happens when Incremental is disabled and _onOffscreenRenderDone is called faster than
    // layout can happen.
    this._lastLayout &&
      this.props.onNewLayout({rowKey: this.props.rowKey, layout: this._lastLayout});

    DEBUG && infoLog('\n   >>>>>  display row ' + this.props.rowIndex + '\n\n\n');
    if (this.props.asyncRowPerfEventName) {
      // Note this doesn't include the native render time but is more accurate than also including
      // the JS render time of anything that has been queued up.
      Systrace.endAsyncEvent(
        this.props.asyncRowPerfEventName + this._perfUpdateID,
        this._asyncCookie
      );
      // $FlowFixMe(>=0.28.0)
      infoLog(`perf_asynctest_${this.props.asyncRowPerfEventName}_end ${this._perfUpdateID} ` +
        `${Date.now()}`);
    }
  }
  _onOffscreenRenderDone = () => {
    DEBUG && infoLog('_onOffscreenRenderDone for row ' + this.props.rowIndex);
    if (this._includeInLayoutLatch) {
      this._updateParent(); // rendered straight into layout, so no need to flush
    } else {
      this._timeout = setTimeout(() => this._updateParent(), 1); // Flush any pending layout events.
    }
  };
  componentWillUnmount() {
    /* $FlowFixMe(>=0.63.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.63 was deployed. To see the error delete this
     * comment and run Flow. */
    clearTimeout(this._timeout);
    this.props.onProgressChange({rowKey: this.props.rowKey, inProgress: false});
    this.props.onWillUnmount(this.props.rowKey);
  }
  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.includeInLayout && !this.props.includeInLayout) {
      invariant(this._offscreenRenderDone, 'Should never try to add to layout before render done');
      this._includeInLayoutLatch = true; // Once we render in layout, make sure it sticks.
      this._containerRef.setNativeProps({style: styles.include});
    }
  }
  shouldComponentUpdate(newProps: CellProps) {
    return newProps.rowData !== this.props.rowData;
  }
  _setRef = (ref) => {
    /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error when upgrading Flow's support for React. To see the
     * error delete this comment and run Flow. */
    this._containerRef = ref;
  };
  render() {
    let debug;
    if (DEBUG) {
      infoLog('render cell ' + this.props.rowIndex);
      const Text = require('Text');
      debug = <Text style={{backgroundColor: 'lightblue'}}>
        Row: {this.props.rowIndex}
      </Text>;
    }
    const style = this._includeInLayoutLatch ? styles.include : styles.remove;
    return (
      <IncrementalGroup
        disabled={this._includeInLayoutLatch}
        onDone={this._onOffscreenRenderDone}
        name={`WLVCell_${this.props.rowIndex}`}>
        <View
          ref={this._setRef}
          style={style}
          onLayout={this._onLayout}>
          {debug}
          {this.props.renderRow(this.props.rowData, 0, this.props.rowIndex, this.props.rowKey)}
          {debug}
        </View>
      </IncrementalGroup>
    );
  }
}

const removedXOffset = DEBUG ? 123 : 0;

const styles = StyleSheet.create({
  include: {
    position: 'relative',
    left: 0,
    right: 0,
    opacity: 1,
  },
  remove: {
    position: 'absolute',
    left: removedXOffset,
    right: -removedXOffset,
    opacity: DEBUG ? 0.1 : 0,
  },
});

module.exports = WindowedListView;
