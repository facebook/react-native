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
 * @providesModule WindowedListView
 * @flow
 */
'use strict';

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
const invariant = require('invariant');
const nullthrows = require('nullthrows');

import type ReactComponent from 'ReactComponent';

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
  data: Array<mixed>;
  /**
   * Takes a data blob from the `data` array prop plus some meta info and should
   * return a row.
   */
  renderRow: (
    data: mixed, sectionIdx: number, rowIdx: number, key: string
  ) => ?ReactElement;
  /**
   * Rendered when the list is scrolled faster than rows can be rendered.
   */
  renderWindowBoundaryIndicator?: () => ?ReactElement;
  /**
   * Always rendered at the bottom of all the rows.
   */
  renderFooter?: () => ?ReactElement;
  /**
   * Pipes through normal onScroll events from the underlying `ScrollView`.
   */
  onScroll?: (event: Object) => void;
  /**
   * Called when the rows that are visible in the viewport change.
   */
  onVisibleRowsChanged?: (firstIdx: number, count: number) => void;
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewablePercentThreshold` prop.
   */
  onViewableRowsChanged?: (viewableRows: Array<number>) => void;
  /**
   * The percent of a row that must be visible to consider it "viewable".
   */
  viewablePercentThreshold: number;
  /**
   * Number of rows to render on first mount.
   */
  initialNumToRender: number;
  /**
   * Maximum number of rows to render while scrolling, i.e. the window size.
   */
  maxNumToRender: number;
  /**
   * Number of rows to render beyond the viewport. Note that this combined with
   * `maxNumToRender` and the number of rows that can fit in one screen will
   * determine how many rows to render above the viewport.
   */
  numToRenderAhead: number;
  /**
   * Super dangerous and experimental - rows and all their decendents must be
   * fully stateless otherwise recycling their instances may introduce nasty
   * bugs. Some apps may see an improvement in perf, but sometimes perf and
   * memory usage can actually get worse with this.
   */
  enableDangerousRecycling: boolean;
  /**
   * Used to log perf events for async row rendering.
   */
  asyncRowPerfEventName: ?string;
  /**
   * A function that returns the scrollable component in which the list rows
   * are rendered. Defaults to returning a ScrollView with the given props.
   */
  renderScrollComponent: (props: ?Object) => ReactElement;
  /**
   * Use to disable incremental rendering when not wanted, e.g. to speed up initial render.
   */
  disableIncrementalRendering: boolean;
  /**
   * This determines how frequently events such as scroll and layout can trigger a re-render.
   */
  recomputeRowsBatchingPeriod: number;
  /**
   * Called when rows will be mounted/unmounted. Mounted rows always form a contiguous block so it is expressed as a
   * range of start plus count.
   */
  onMountedRowsWillChange: (firstIdx: number, count: number) => void;
};
const defaultProps = {
  enableDangerousRecycling: false,
  initialNumToRender: 10,
  maxNumToRender: 30,
  numToRenderAhead: 10,
  viewablePercentThreshold: 50,
  renderScrollComponent: (props) => <ScrollView {...props} />,
  disableIncrementalRendering: false,
  recomputeRowsBatchingPeriod: 100,
};
class WindowedListView extends React.Component {
  props: Props;
  state: {
    boundaryIndicatorHeight?: number;
    firstRow: number;
    lastRow: number;
    firstVisible: number;
    lastVisible: number;
  };
  _scrollOffsetY: number = 0;
  _frameHeight: number = 0;
  _rowFrames: Array<Object> = [];
  _hasCalledOnEndReached: bool = false;
  _willComputeRowsToRender: bool = false;
  _timeoutHandle: number = 0;
  _incrementPending: bool = false;
  _viewableRows: Array<number> = [];
  _cellsInProgress: Set<number> = new Set();
  _scrollRef: ?Object;
  constructor(props: Props) {
    super(props);
    invariant(
      this.props.numToRenderAhead < this.props.maxNumToRender,
      'WindowedListView: numToRenderAhead must be less than maxNumToRender'
    );
    this.state = {
      firstRow: 0,
      lastRow:
        Math.min(this.props.data.length, this.props.initialNumToRender) - 1,
      firstVisible: -1,
      lastVisible: -1,
    };
  }
  getScrollResponder(): ?ReactComponent {
    return this._scrollRef &&
      this._scrollRef.getScrollResponder &&
      this._scrollRef.getScrollResponder();
  }
  componentWillReceiveProps(newProps: Object) {
    // This has to happen immediately otherwise we could crash, e.g. if the data
    // array has gotten shorter.
    if (newProps.data.length < this._rowFrames.length) {
      this._rowFrames = this._rowFrames.splice(0, newProps.data.length);
    }
    this._computeRowsToRender(newProps);
  }
  _onScroll = (e: Object) => {
    this._scrollOffsetY = e.nativeEvent.contentOffset.y;
    this._frameHeight = e.nativeEvent.layoutMeasurement.height;
    // We don't want to enqueue any updates if any cells are in the middle of an incremental render,
    // because it would just be wasted work.
    if (this._cellsInProgress.size === 0) {
      this._enqueueComputeRowsToRender();
    }
    if (this.props.onViewableRowsChanged && this._rowFrames.length) {
      const viewableRows = ViewabilityHelper.computeViewableRows(
        this.props.viewablePercentThreshold,
        this._rowFrames,
        e.nativeEvent.contentOffset.y,
        e.nativeEvent.layoutMeasurement.height
      );
      if (deepDiffer(viewableRows, this._viewableRows)) {
        this._viewableRows = viewableRows;
        nullthrows(this.props.onViewableRowsChanged)(this._viewableRows);
      }
    }
    this.props.onScroll && this.props.onScroll(e);
  };
  // Caller does the diffing so we don't have to.
  _onNewLayout = (params: {rowIndex: number, layout: Object}) => {
    const {rowIndex, layout} = params;
    if (DEBUG) {
      const layoutPrev = this._rowFrames[rowIndex] || {};
      console.log(
        'record layout for row: ',
        {i: rowIndex, h: layout.height, y: layout.y, hp: layoutPrev.height, yp: layoutPrev.y}
      );
    }
    this._rowFrames[rowIndex] = {...layout, offscreenLayoutDone: true};
    if (this._cellsInProgress.size === 0) {
      this._enqueueComputeRowsToRender();
    }
  };
  _onWillUnmountCell = (rowIndex: number) => {
    if (this._rowFrames[rowIndex]) {
      this._rowFrames[rowIndex].offscreenLayoutDone = false;
    }
  };
  /**
   * This is used to keep track of cells that are in the process of rendering. If any cells are in progress, then
   * other updates are skipped because they will just be wasted work.
   */
  _onProgressChange = ({rowIndex, inProgress}: {rowIndex: number, inProgress: boolean}) => {
    if (inProgress) {
      this._cellsInProgress.add(rowIndex);
    } else {
      this._cellsInProgress.delete(rowIndex);
    }
  };
  /**
   * Recomputing which rows to render is batched up and run asynchronously to avoid wastful updates, e.g. from multiple
   * layout updates in rapid succession.
   */
  _enqueueComputeRowsToRender(): void {
    if (!this._willComputeRowsToRender) {
      this._willComputeRowsToRender = true; // batch up computations
      clearTimeout(this._timeoutHandle);
      this._timeoutHandle = setTimeout(
        () => {
          this._willComputeRowsToRender = false;
          this._incrementPending = false;
          this._computeRowsToRender(this.props);
        },
        this.props.recomputeRowsBatchingPeriod
      );
    }
  }
  componentWillUnmount() {
    clearTimeout(this._timeoutHandle);
  }
  _computeRowsToRender(props: Object): void {
    const totalRows = props.data.length;
    if (totalRows === 0) {
      this.setState({
        firstRow: 0,
        lastRow: -1,
        firstVisible: -1,
        lastVisible: -1,
      });
      return;
    }
    const rowFrames = this._rowFrames;
    let firstVisible = -1;
    let lastVisible = 0;
    const top = this._scrollOffsetY;
    const bottom = top + this._frameHeight;
    for (let idx = 0; idx < rowFrames.length; idx++) {
      const frame = rowFrames[idx];
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

    // Unfortuantely, we can't use <Incremental> to simplify our increment logic in this function because we need to
    // make sure that cells are rendered in the right order one at a time when scrolling back up.

    const numRendered = this.state.lastRow - this.state.firstRow + 1;
    // Our last row target that we will approach incrementally
    const targetLastRow = clamp(
      numRendered - 1, // Don't reduce numRendered when scrolling back up
      lastVisible + props.numToRenderAhead, // Primary goal
      totalRows - 1, // Don't render past the end
    );
    let lastRow = this.state.lastRow;
    // Increment the last row one at a time per JS event loop
    if (!this._incrementPending) {
      if (targetLastRow > this.state.lastRow) {
        lastRow++;
        this._incrementPending = true;
      } else if (targetLastRow < this.state.lastRow) {
        lastRow--;
        this._incrementPending = true;
      }
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
      // end.  Resets if scoll back up and down again.
      const willBeAtTheEnd = lastRow === (totalRows - 1);
      if (willBeAtTheEnd && !this._hasCalledOnEndReached) {
        props.onEndReached();
        this._hasCalledOnEndReached = true;
      } else {
        // If lastRow is changing, reset so we can call onEndReached again
        this._hasCalledOnEndReached = this.state.lastRow === lastRow;
      }
    }
    if (this.state.firstRow !== firstRow || this.state.lastRow !== lastRow) {
      this.props.onMountedRowsWillChange && this.props.onMountedRowsWillChange(firstRow, lastRow - firstRow + 1);
      console.log('WLV: row render range changed:', {firstRow, lastRow});
    }
    this.setState({firstRow, lastRow});
  }
  _updateVisibleRows(newFirstVisible: number, newLastVisible: number) {
    if (this.state.firstVisible !== newFirstVisible ||
        this.state.lastVisible !== newLastVisible) {
      if (this.props.onVisibleRowsChanged) {
        this.props.onVisibleRowsChanged(
          newFirstVisible,
          newLastVisible - newFirstVisible + 1);
      }
      this.setState({
        firstVisible: newFirstVisible,
        lastVisible: newLastVisible,
      });
    }
  }
  render(): ReactElement {
    const firstRow = this.state.firstRow;
    const lastRow = this.state.lastRow;
    const rowFrames = this._rowFrames;
    const rows = [];
    let spacerHeight = 0;
    for (let ii = firstRow; ii <= lastRow; ii++) {
      if (!rowFrames[ii]) {
        break; // if rowFrame missing, no following ones will exist so quit early
      }
      // Look for the first row where offscreen layout is done (only true for mounted rows) and set the spacer height
      // such that it will offset all the unmounted rows before that one using the saved frame data.
      if (rowFrames[ii].offscreenLayoutDone) {
        const frame = rowFrames[ii - 1];
        spacerHeight = frame ? frame.y + frame.height : 0;
        break;
      }
    }
    let showIndicator = false;
    if (spacerHeight > (this.state.boundaryIndicatorHeight || 0) && this.props.renderWindowBoundaryIndicator) {
      showIndicator = true;
      spacerHeight -= this.state.boundaryIndicatorHeight || 0;
    }
    DEBUG && console.log('render top spacer with height ', spacerHeight);
    rows.push(<View key="sp-top" style={{height: spacerHeight}} />);
    if (this.props.renderWindowBoundaryIndicator) {
      // Always render it, even if removed, so that we can get the height right away and don't waste time creating/
      // destroying it. Should see if there is a better spinner option that is not as expensive.
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
          {this.props.renderWindowBoundaryIndicator()}
        </View>
      );
    }
    for (let idx = firstRow; idx <= lastRow; idx++) {
      const key = '' + (this.props.enableDangerousRecycling ? (idx % this.props.maxNumToRender) : idx);
      rows.push(
        <CellRenderer
          key={key}
          recyclingKey={key}
          rowIndex={idx}
          onNewLayout={this._onNewLayout}
          onWillUnmount={this._onWillUnmountCell}
          includeInLayout={this.props.disableIncrementalRendering ||
            (this._rowFrames[idx] && this._rowFrames[idx].offscreenLayoutDone)}
          onProgressChange={this._onProgressChange}
          asyncRowPerfEventName={this.props.asyncRowPerfEventName}
          data={this.props.data[idx]}
          renderRow={this.props.renderRow}
        />
      );
    }
    const showFooter = this._rowFrames[lastRow] &&
        this._rowFrames[lastRow].offscreenLayoutDone &&
        lastRow === this.props.data.length - 1;
    if (this.props.renderFooter) {
      rows.push(
        <View
          key="ind-footer"
          style={showFooter ? styles.include : styles.remove}>
          {this.props.renderFooter()}
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
          {this.props.renderWindowBoundaryIndicator()}
        </View>
      );
    }
    // Prevent user from scrolling into empty space of unmounted rows.
    const contentInset = {top: firstRow === 0 ? 0 : -spacerHeight};
    return (
      <IncrementalGroup name="WLV" disabled={this.props.disableIncrementalRendering}>
        {this.props.renderScrollComponent({
          scrollEventThrottle: 50,
          removeClippedSubviews: true,
          ...this.props,
          contentInset,
          ref: (ref) => { this._scrollRef = ref; },
          onScroll: this._onScroll,
          children: rows,
        })}
      </IncrementalGroup>
    );
  }
}
WindowedListView.defaultProps = defaultProps;

// performance testing id, unique for each component mount cycle
let g_perf_update_id = 0;

type CellProps = {
  /**
   * Row-specific data passed to renderRow and used in shouldComponentUpdate with ===
   */
  data: mixed;
  /**
   * Renders the actual row contents.
   */
  renderRow: (data: mixed, sectionIdx: number, rowIdx: number) => ?ReactElement;
  /**
   * Index of the row, passed through to other callbacks.
   */
  rowIndex: number;
  /**
   * Used for marking async begin/end events for row rendering.
   */
  asyncRowPerfEventName: ?string;
  /**
   * Initially false to indicate the cell should be rendered "offscreen" with position: absolute so that incremental
   * rendering doesn't cause things to jump around. Once onNewLayout is called after offscreen rendering has completed,
   * includeInLayout will be set true and the finished cell can be dropped into place.
   *
   * This is coordinated outside this component so the parent can syncronize this re-render with managing the
   * placeholder sizing.
   */
  includeInLayout: boolean;
  /**
   * Updates the parent with the latest layout. Only called when incremental rendering is done and triggers the parent
   * to re-render this row with includeInLayout true.
   */
  onNewLayout: (params: {rowIndex: number, layout: ?Object}) => void;
  /**
   * Used to track when rendering is in progress so the parent can avoid wastedful re-renders that are just going to be
   * invalidated once the cell finishes.
   */
  onProgressChange: (progress: {rowIndex: number; inProgress: boolean}) => void;
  /**
   * Used to invalidate the layout so the parent knows it needs to compensate for the height in the placeholder size.
   */
  onWillUnmount: (rowIndex: number) => void;
};
class CellRenderer extends React.Component {
  props: CellProps;
  _offscreenRenderDone = false;
  _timer = 0;
  _lastLayout: ?Object = null;
  _perfUpdateID: number = 0;
  _asyncCookie: any;
  componentWillMount() {
    if (this.props.asyncRowPerfEventName) {
      this._perfUpdateID = g_perf_update_id++;
      this._asyncCookie = Systrace.beginAsyncEvent(this.props.asyncRowPerfEventName + this._perfUpdateID);
      console.log(`perf_asynctest_${this.props.asyncRowPerfEventName}_start ${this._perfUpdateID} ${Date.now()}`);
    }
    this.props.onProgressChange({rowIndex: this.props.rowIndex, inProgress: true});
  }
  _onLayout = (e) => {
    const layout = e.nativeEvent.layout;
    const layoutChanged = deepDiffer(this._lastLayout, layout);
    this._lastLayout = layout;
    if (!this._offscreenRenderDone || !layoutChanged) {
      return; // Don't send premature or duplicate updates
    }
    this.props.onNewLayout({
      rowIndex: this.props.rowIndex,
      layout,
    });
  };
  _onOffscreenRenderDone = () => {
    DEBUG && console.log('_onOffscreenRenderDone for row ' + this.props.rowIndex);
    this._timer = setTimeout(() => { // Flush any pending layout events.
      invariant(!this._offscreenRenderDone, 'should only finish rendering once');
      this._offscreenRenderDone = true;

      // If this is not called before calling onNewLayout, the number of inProgress cells will remain non-zero,
      // and thus the onNewLayout call will not fire the needed state change update.
      this.props.onProgressChange({rowIndex: this.props.rowIndex, inProgress: false});

      // If an onLayout event hasn't come in yet, then we skip here and assume it will come in later. This happens
      // when Incremental is disabled and _onOffscreenRenderDone is called faster than layout can happen.
      this._lastLayout && this.props.onNewLayout({rowIndex: this.props.rowIndex, layout: this._lastLayout});

      DEBUG && console.log('\n   >>>>>  display row ' + this.props.rowIndex + '\n\n\n');
      if (this.props.asyncRowPerfEventName) {
        Systrace.endAsyncEvent(this.props.asyncRowPerfEventName + this._perfUpdateID, this._asyncCookie);
        console.log(`perf_asynctest_${this.props.asyncRowPerfEventName}_end ${this._perfUpdateID} ${Date.now()}`);
      }
    }, 1);
  };
  componentWillUnmount() {
    clearTimeout(this._timer);
    this.props.onProgressChange({rowIndex: this.props.rowIndex, inProgress: false});
    this.props.onWillUnmount(this.props.rowIndex);
  }
  componentWillReceiveProps(newProps) {
    if (newProps.includeInLayout && !this.props.includeInLayout) {
      invariant(this._offscreenRenderDone, 'Should never try to add to layout before render done');
      this.refs.container.setNativeProps({style: styles.include});
    } else {
      invariant(!(this.props.includeInLayout && !newProps.includeInLayout), 'Should never unset includeInLayout');
    }
  }
  shouldComponentUpdate(newProps) {
    return newProps.data !== this.props.data;
  }
  render() {
    let debug;
    if (DEBUG) {
      console.log('render cell ' + this.props.rowIndex);
      const Text = require('Text');
      debug = <Text style={{backgroundColor: 'lightblue'}}>
        Row: {this.props.rowIndex}
      </Text>;
    }
    const style = this.props.includeInLayout ? styles.include : styles.remove;
    return (
      <IncrementalGroup onDone={this._onOffscreenRenderDone} name={`CellRenderer_${this.props.rowIndex}`}>
        <View
          ref="container"
          style={style}
          onLayout={this._onLayout}>
          {debug}
          {this.props.renderRow(this.props.data, 0, this.props.rowIndex)}
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
