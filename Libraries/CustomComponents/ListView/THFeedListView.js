/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
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
 * @providesModule THFeedListView
 */
'use strict';

var ListViewDataSource = require('ListViewDataSource');
var React = require('React');
var RCTScrollViewManager = require('NativeModules').ScrollViewManager;
var ScrollView = require('ScrollView');
var ScrollResponder = require('ScrollResponder');
var StaticRenderer = require('StaticRenderer');
var TimerMixin = require('TimerMixin');

var isEmpty = require('isEmpty');
var logError = require('logError');
var merge = require('merge');
var performanceNow = require('performanceNow');

var PropTypes = React.PropTypes;

var DEFAULT_PAGE_SIZE = 1;
var DEFAULT_INITIAL_ROWS = 10;
var DEFAULT_END_REACHED_THRESHOLD = 1000;
var DEFAULT_SCROLL_CALLBACK_THROTTLE = 50;
var DEFAULT_TICK_FREQUENCY = 200;
var DEFAULT_ROWS_YIELD_TIME = 100;
var DEFAULT_END_SCROLL_TIMEOUT = 100;
var SCROLLVIEW_REF = 'listviewscroll';

/**
 * Simpler version of `ListView`, optimized for smooth scrolling in feed. This is
 * achieved by skipping unecessary processing caused by race condition (with paging
 * and handling view resize callback) and, more importantly, handling heavier 
 * computation (i.e rendering more rows, possibly fetching more data when end of 
 * feed is reached) only once current scroll gesture completes. 
 *
 * Internally, listview uses an periodic tick callback that will render ahead each time
 * additionl row(s), the number of which is controlled by `pageSize` props, until 
 * no more rows are available in data source.
 * 
 */

var THFeedListView = React.createClass({
  mixins: [ScrollResponder.Mixin, TimerMixin],

  statics: {
    DataSource: ListViewDataSource,
  },

  /**
   * You must provide a renderRow function. If you omit any of the other render
   * functions, ListView will simply skip rendering them.
   *
   * - renderRow(rowData, sectionID, rowID, highlightRow);
   */
  propTypes: {
    ...ScrollView.propTypes,

    dataSource: PropTypes.instanceOf(ListViewDataSource).isRequired,
    /**
     * (sectionID, rowID, adjacentRowHighlighted) => renderable
     *
     * If provided, a renderable component to be rendered as the separator
     * below each row but not the last row if there is a section header below.
     * Take a sectionID and rowID of the row above and whether its adjacent row
     * is highlighted.
     */
    renderSeparator: PropTypes.func,
    /**
     * (rowData, sectionID, rowID, highlightRow) => renderable
     *
     * Takes a data entry from the data source and its ids and should return
     * a renderable component to be rendered as the row.  By default the data
     * is exactly what was put into the data source, but it's also possible to
     * provide custom extractors. ListView can be notified when a row is
     * being highlighted by calling highlightRow function. The separators above and
     * below will be hidden when a row is highlighted. The highlighted state of
     * a row can be reset by calling highlightRow(null).
     */
    renderRow: PropTypes.func.isRequired,
    /**
     * How many rows to render on initial component mount.  Use this to make
     * it so that the first screen worth of data appears at one time instead of
     * over the course of multiple frames.
     */
    initialListSize: PropTypes.number,
    /**
     * Called when all rows have been rendered and the list has been scrolled
     * to within onEndReachedThreshold of the bottom.  The native scroll
     * event is provided.
     */
    onEndReached: PropTypes.func,
    /**
     * Threshold in pixels for onEndReached.
     */
    onEndReachedThreshold: PropTypes.number,
    /**
     * Number of rows to render per event loop.
     */
    pageSize: PropTypes.number,
    /**
     * () => renderable
     *
     * The header and footer are always rendered (if these props are provided)
     * on every render pass.  If they are expensive to re-render, wrap them
     * in StaticContainer or other mechanism as appropriate.  Footer is always
     * at the bottom of the list, and header at the top, on every render pass.
     */
    renderFooter: PropTypes.func,
    renderHeader: PropTypes.func,
    /**
     * (props) => renderable
     *
     * A function that returns the scrollable component in which the list rows
     * are rendered. Defaults to returning a ScrollView with the given props.
     */
    renderScrollComponent: React.PropTypes.func.isRequired,
    /**
     * (visibleRows, changedRows) => void
     *
     * Called when the set of visible rows changes.  `visibleRows` maps
     * { sectionID: { rowID: true }} for all the visible rows, and
     * `changedRows` maps { sectionID: { rowID: true | false }} for the rows
     * that have changed their visibility, with true indicating visible, and
     * false indicating the view has moved out of view.
     */
    onChangeVisibleRows: React.PropTypes.func,
    /**
     * A performance optimization for improving scroll perf of
     * large lists, used in conjunction with overflow: 'hidden' on the row
     * containers.  This is enabled by default.
     */
    removeClippedSubviews: React.PropTypes.bool,
  },

  /**
   * Exports some data, e.g. for perf investigations or analytics.
   */
  getMetrics: function() {
    return {
      contentLength: this._scrollProperties.contentLength,
      totalRows: this.props.dataSource.getRowCount(),
      renderedRows: this.state.curRenderedRowsCount,
      visibleRows: Object.keys(this._visibleRows).length,
    };
  },

  /**
   * Provides a handle to the underlying scroll responder to support operations
   * such as scrollTo.
   */
  getScrollResponder: function() {
    return this.refs[SCROLLVIEW_REF] &&
      this.refs[SCROLLVIEW_REF].getScrollResponder &&
      this.refs[SCROLLVIEW_REF].getScrollResponder();
  },

  getInnerViewNode: function() {
    return this.refs[SCROLLVIEW_REF] &&
      this.refs[SCROLLVIEW_REF].getInnerViewNode();
  },

  setNativeProps: function(props) {
    this.refs[SCROLLVIEW_REF] && 
      this.refs[SCROLLVIEW_REF].setNativeProps(props);
  },

  scrollTo: function(destY, destX) {
    this.getScrollResponder().scrollResponderScrollTo(destX || 0, destY || 0);
  },

  /**
   * React life cycle hooks.
   */

  getDefaultProps: function() {
    return {
      initialListSize: DEFAULT_INITIAL_ROWS,
      pageSize: DEFAULT_PAGE_SIZE,
      onEndReachedThreshold: DEFAULT_END_REACHED_THRESHOLD,
    };
  },

  getInitialState: function() {
    return {
      curRenderedRowsCount: this.props.initialListSize,
      highlightedRow: {},
    };
  },

  componentWillMount: function() {
    // this data should never trigger a render pass, so don't put in state
    this._scrollProperties = {
      visibleLength: null,
      contentLength: null,
      offset: 0
    };
    this._childFrames = [];
    this._visibleRows = {};
    this._prevRenderedRowsCount = 0;
    this._lastEndReachedContentLength = null;
    this._lastScrollEventTime = 0; // TODO(9622421): use native scroll events when available
    this._lastUpdateEventTime = 0;
  },

  componentDidMount: function() {
    // potentially trigger fetching additional data as soon as possible.
    this._callOnEndReachedIfNeeded();

    // schedule periodic check to check if we have more rows to render or need to feth more rows
    this.setInterval(this.onTick, DEFAULT_TICK_FREQUENCY);
  },

  componentWillReceiveProps: function(nextProps) {
    if (this.props.dataSource !== nextProps.dataSource) {
      this._prevRenderedRowsCount = 0;
    }
    if (this.props.initialListSize !== nextProps.initialListSize) {
      this.setState((state, props) => {
        return {
          curRenderedRowsCount: Math.max(
            state.curRenderedRowsCount,
            props.initialListSize
          ),
        };
      });
    }
  },

  componentDidUpdate: function () {
    this._lastUpdateEventTime = performanceNow();
  },

  onRowHighlighted: function(sectionID, rowID) {
    this.setState({highlightedRow: {sectionID, rowID}});
  },

  onTick: function() {
    if (!this.isMounted()) {
      return;
    }
    if (performanceNow() < this._lastScrollEventTime + DEFAULT_END_SCROLL_TIMEOUT) {
      // listview is currently scrolling, skip any work until scroll completes
      return;
    }
    if (performanceNow() < this._lastUpdateEventTime + DEFAULT_ROWS_YIELD_TIME) {
      // ensure at least enough time has elapsed between 2 row rendering
      return;
    }
    this._callOnEndReachedIfNeeded();
    this._renderMoreRowsIfAvailable();
  },

  render: function() {
    var dataSource = this.props.dataSource;
    var allRowIDs = dataSource.rowIdentities;
    var rowCount = 0;
    var header = this.props.renderHeader && this.props.renderHeader();
    var footer = this.props.renderFooter && this.props.renderFooter();
    var totalIndex = header ? 1 : 0;

    var bodyComponents = [];
    for (var sectionIdx = 0; sectionIdx < allRowIDs.length; sectionIdx++) {
      var sectionID = dataSource.sectionIdentities[sectionIdx];
      var rowIDs = allRowIDs[sectionIdx];
      if (rowIDs.length === 0) {
        continue;
      }

      for (var rowIdx = 0; rowIdx < rowIDs.length; rowIdx++) {
        var rowID = rowIDs[rowIdx];
        var comboID = sectionID + '_' + rowID;
        var shouldUpdateRow = rowCount >= this._prevRenderedRowsCount &&
          dataSource.rowShouldUpdate(sectionIdx, rowIdx);
        var row =
          <StaticRenderer
            key={'r_' + comboID}
            shouldUpdate={!!shouldUpdateRow}
            render={this.props.renderRow.bind(
              null,
              dataSource.getRowData(sectionIdx, rowIdx),
              sectionID,
              rowID,
              this.onRowHighlighted
            )}
          />;
        bodyComponents.push(row);
        totalIndex++;

        if (this.props.renderSeparator &&
            (rowIdx !== rowIDs.length - 1 || sectionIdx === allRowIDs.length - 1)) {
          var adjacentRowHighlighted =
            this.state.highlightedRow.sectionID === sectionID && (
              this.state.highlightedRow.rowID === rowID ||
              this.state.highlightedRow.rowID === rowIDs[rowIdx + 1]
            );
          var separator = this.props.renderSeparator(
            sectionID,
            rowID,
            adjacentRowHighlighted
          );
          bodyComponents.push(separator);
          totalIndex++;
        }
        if (++rowCount === this.state.curRenderedRowsCount) {
          break;
        }
      }
      if (rowCount >= this.state.curRenderedRowsCount) {
        break;
      }
    }

    var {
      renderScrollComponent,
      ...props,
    } = this.props;
    if (!props.scrollEventThrottle) {
      props.scrollEventThrottle = DEFAULT_SCROLL_CALLBACK_THROTTLE;
    }
    if (props.removeClippedSubviews === undefined) {
      props.removeClippedSubviews = true;
    }
    Object.assign(props, {
      onScroll: this._onScroll,

      // Do not pass these events downstream to ScrollView since they will be
      // registered in ListView's own ScrollResponder.Mixin
      onKeyboardWillShow: undefined,
      onKeyboardWillHide: undefined,
      onKeyboardDidShow: undefined,
      onKeyboardDidHide: undefined,
    });

    // TODO(ide): Use function refs so we can compose with the scroll
    // component's original ref instead of clobbering it
    return React.cloneElement(renderScrollComponent(props), {
      ref: SCROLLVIEW_REF,
      onContentSizeChange: this._onContentSizeChange,
      onLayout: this._onLayout,
    }, header, bodyComponents, footer);
  },

  /**
   * Private methods
   */

  _onContentSizeChange: function(width, height) {
    var contentLength = !this.props.horizontal ? height : width;
    this._scrollProperties.contentLength = contentLength;
    this.props.onContentSizeChange && this.props.onContentSizeChange(width, height);
  },

  _onLayout: function(event) {
    var {width, height} = event.nativeEvent.layout;
    var visibleLength = !this.props.horizontal ? height : width;
    this._scrollProperties.visibleLength = visibleLength;
    this.props.onLayout && this.props.onLayout(event);
  },

  _onScroll: function(e) {
    var data = e.nativeEvent;
    var isVertical = !this.props.horizontal;
    this._scrollProperties.visibleLength = data.layoutMeasurement[isVertical ? 'height' : 'width'];
    this._scrollProperties.contentLength = data.contentSize[isVertical ? 'height' : 'width'];
    this._scrollProperties.offset = data.contentOffset[isVertical ? 'y' : 'x'];
    this._lastScrollEventTime = performanceNow();
    this.props.onScroll && this.props.onScroll(e);
  },

  _callOnEndReachedIfNeeded: function() {
    if (!this.props.onEndReached) {
      // skip any processing if parent not interested in end of feed callbacks
      return;
    }
    if (this._getDistanceFromEnd() > this.props.onEndReachedThreshold) {
      // Scrolled out of the end zone, so it should be able to trigger again.
      this._lastEndReachedContentLength = null;
      return;
    }
    if (this.state.curRenderedRowsCount !== this.props.dataSource.getRowCount()) {
      // we have more rows to render, so we haven't reached end of feed
      return;
    }
    if (this._scrollProperties.contentLength && 
        this._scrollProperties.contentLength === this._lastEndReachedContentLength) {
      // we have already invoked end of feed callback for this given position in feed
      return;
    }
    this._lastEndReachedContentLength = this._scrollProperties.contentLength;
    this.props.onEndReached();
  },

  _renderMoreRowsIfAvailable: function() {
    if (this.state.curRenderedRowsCount !== this.props.dataSource.getRowCount()) {
      this.setState((state, props) => {
        var curRenderedRowsCount = Math.min(
          state.curRenderedRowsCount + props.pageSize,
          props.dataSource.getRowCount()
        );
        this._prevRenderedRowsCount = state.curRenderedRowsCount;
        return {curRenderedRowsCount};
      }, () => {
        this._prevRenderedRowsCount = this.state.curRenderedRowsCount;
      });
    }
  },

  _getDistanceFromEnd: function() {
    var scrollProperties = this._scrollProperties;
    var maxLength = Math.max(
      scrollProperties.contentLength,
      scrollProperties.visibleLength
    );
    return maxLength - scrollProperties.visibleLength - scrollProperties.offset;
  },

});

module.exports = THFeedListView;
