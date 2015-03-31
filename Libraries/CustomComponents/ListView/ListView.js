/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. (“Facebook”) owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the “Software”).  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * (“Your Software”).  Facebook reserves all rights not expressly granted to
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
 * @providesModule ListView
 */
'use strict';

var ListViewDataSource = require('ListViewDataSource');
var React = require('React');
var RCTUIManager = require('NativeModules').UIManager;
var ScrollView = require('ScrollView');
var ScrollResponder = require('ScrollResponder');
var StaticRenderer = require('StaticRenderer');
var TimerMixin = require('react-timer-mixin');

var logError = require('logError');
var merge = require('merge');
var isEmpty = require('isEmpty');

var PropTypes = React.PropTypes;

var DEFAULT_PAGE_SIZE = 1;
var DEFAULT_INITIAL_ROWS = 10;
var DEFAULT_SCROLL_RENDER_AHEAD = 1000;
var DEFAULT_END_REACHED_THRESHOLD = 1000;
var DEFAULT_SCROLL_CALLBACK_THROTTLE = 50;
var RENDER_INTERVAL = 20;
var SCROLLVIEW_REF = 'listviewscroll';


/**
 * ListView - A core component designed for efficient display of vertically
 * scrolling lists of changing data.  The minimal API is to create a
 * `ListView.DataSource`, populate it with a simple array of data blobs, and
 * instantiate a `ListView` component with that data source and a `renderRow`
 * callback which takes a blob from the data array and returns a renderable
 * component.
 *
 * Minimal example:
 *
 * ```
 * getInitialState: function() {
 *   var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
 *   return {
 *     dataSource: ds.cloneWithRows(['row 1', 'row 2']),
 *   };
 * },
 *
 * render: function() {
 *   return (
 *     <ListView
 *       dataSource={this.state.dataSource}
 *       renderRow={(rowData) => <Text>{rowData}</Text>}
 *     />
 *   );
 * },
 * ```
 *
 * ListView also supports more advanced features, including sections with sticky
 * section headers, header and footer support, callbacks on reaching the end of
 * the available data (`onEndReached`) and on the set of rows that are visible
 * in the device viewport change (`onChangeVisibleRows`), and several
 * performance optimizations.
 *
 * There are a few performance operations designed to make ListView scroll
 * smoothly while dynamically loading potentially very large (or conceptually
 * infinite) data sets:
 *
 *  * Only re-render changed rows - the hasRowChanged function provided to the
 *    data source tells the ListView if it needs to re-render a row because the
 *    source data has changed - see ListViewDataSource for more details.
 *
 *  * Rate-limited row rendering - By default, only one row is rendered per
 *    event-loop (customizable with the `pageSize` prop).  This breaks up the
 *    work into smaller chunks to reduce the chance of dropping frames while
 *    rendering rows.
 */

var ListView = React.createClass({
  mixins: [ScrollResponder.Mixin, TimerMixin],

  statics: {
    DataSource: ListViewDataSource,
  },

  /**
   * You must provide a renderRow function. If you omit any of the other render
   * functions, ListView will simply skip rendering them.
   *
   * - renderRow(rowData, sectionID, rowID);
   * - renderSectionHeader(sectionData, sectionID);
   */
  propTypes: {
    ...ScrollView.propTypes,

    dataSource: PropTypes.instanceOf(ListViewDataSource).isRequired,
    /**
     * (rowData, sectionID, rowID) => renderable
     * Takes a data entry from the data source and its ids and should return
     * a renderable component to be rendered as the row.  By default the data
     * is exactly what was put into the data source, but it's also possible to
     * provide custom extractors.
     */
    renderRow: PropTypes.func.isRequired,
    /**
     * How many rows to render on initial component mount.  Use this to make
     * it so that the first screen worth of data apears at one time instead of
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
     * (sectionData, sectionID) => renderable
     *
     * If provided, a sticky header is rendered for this section.  The sticky
     * behavior means that it will scroll with the content at the top of the
     * section until it reaches the top of the screen, at which point it will
     * stick to the top until it is pushed off the screen by the next section
     * header.
     */
    renderSectionHeader: PropTypes.func,
    /**
     * How early to start rendering rows before they come on screen, in
     * pixels.
     */
    scrollRenderAheadDistance: React.PropTypes.number,
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
     * An experimental performance optimization for improving scroll perf of
     * large lists, used in conjunction with overflow: 'hidden' on the row
     * containers.  Use at your own risk.
     */
    removeClippedSubviews: React.PropTypes.bool,
  },

  /**
   * Exports some data, e.g. for perf investigations or analytics.
   */
  getMetrics: function() {
    return {
      contentHeight: this.scrollProperties.contentHeight,
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
    return this.refs[SCROLLVIEW_REF];
  },

  setNativeProps: function(props) {
    this.refs[SCROLLVIEW_REF].setNativeProps(props);
  },

  /**
   * React life cycle hooks.
   */

  getDefaultProps: function() {
    return {
      initialListSize: DEFAULT_INITIAL_ROWS,
      pageSize: DEFAULT_PAGE_SIZE,
      scrollRenderAheadDistance: DEFAULT_SCROLL_RENDER_AHEAD,
      onEndReachedThreshold: DEFAULT_END_REACHED_THRESHOLD,
    };
  },

  getInitialState: function() {
    return {
      curRenderedRowsCount: this.props.initialListSize,
      prevRenderedRowsCount: 0,
    };
  },

  componentWillMount: function() {
    // this data should never trigger a render pass, so don't put in state
    this.scrollProperties = {
      visibleHeight: null,
      contentHeight: null,
      offsetY: 0
    };
    this._childFrames = [];
    this._visibleRows = {};
  },

  componentDidMount: function() {
    // do this in animation frame until componentDidMount actually runs after
    // the component is laid out
    this.requestAnimationFrame(() => {
      this._measureAndUpdateScrollProps();
      this.setInterval(this._renderMoreRowsIfNeeded, RENDER_INTERVAL);
    });
  },

  componentWillReceiveProps: function(nextProps) {
    if (this.props.dataSource !== nextProps.dataSource) {
      this.setState({prevRenderedRowsCount: 0});
    }
  },

  render: function() {
    var bodyComponents = [];

    var dataSource = this.props.dataSource;
    var allRowIDs = dataSource.rowIdentities;
    var rowCount = 0;
    var sectionHeaderIndices = [];

    var header = this.props.renderHeader && this.props.renderHeader();
    var footer = this.props.renderFooter && this.props.renderFooter();
    var totalIndex = header ? 1 : 0;

    for (var sectionIdx = 0; sectionIdx < allRowIDs.length; sectionIdx++) {
      var sectionID = dataSource.sectionIdentities[sectionIdx];
      var rowIDs = allRowIDs[sectionIdx];
      if (rowIDs.length === 0) {
        continue;
      }

      if (this.props.renderSectionHeader) {
        var shouldUpdateHeader = rowCount >= this.state.prevRenderedRowsCount &&
          dataSource.sectionHeaderShouldUpdate(sectionIdx);
        bodyComponents.push(
          <StaticRenderer
            key={'s_' + sectionID}
            shouldUpdate={!!shouldUpdateHeader}
            render={this.props.renderSectionHeader.bind(
              null,
              dataSource.getSectionHeaderData(sectionIdx),
              sectionID
            )}
          />
        );
        sectionHeaderIndices.push(totalIndex++);
      }

      for (var rowIdx = 0; rowIdx < rowIDs.length; rowIdx++) {
        var rowID = rowIDs[rowIdx];
        var comboID = sectionID + rowID;
        var shouldUpdateRow = rowCount >= this.state.prevRenderedRowsCount &&
          dataSource.rowShouldUpdate(sectionIdx, rowIdx);
        var row =
          <StaticRenderer
            key={'r_' + comboID}
            shouldUpdate={!!shouldUpdateRow}
            render={this.props.renderRow.bind(
              null,
              dataSource.getRowData(sectionIdx, rowIdx),
              sectionID,
              rowID
            )}
          />;
        bodyComponents.push(row);
        totalIndex++;
        if (++rowCount === this.state.curRenderedRowsCount) {
          break;
        }
      }
      if (rowCount >= this.state.curRenderedRowsCount) {
        break;
      }
    }

    var props = merge(
      this.props, {
        onScroll: this._onScroll,
        stickyHeaderIndices: sectionHeaderIndices,
      }
    );
    if (!props.scrollEventThrottle) {
      props.scrollEventThrottle = DEFAULT_SCROLL_CALLBACK_THROTTLE;
    }

    return (
      <ScrollView {...props}
        ref={SCROLLVIEW_REF}>
        {header}
        {bodyComponents}
        {footer}
      </ScrollView>
    );
  },

  /**
   * Private methods
   */

  _measureAndUpdateScrollProps: function() {
    RCTUIManager.measureLayout(
      this.refs[SCROLLVIEW_REF].getInnerViewNode(),
      this.refs[SCROLLVIEW_REF].getNodeHandle(),
      logError,
      this._setScrollContentHeight
    );
    RCTUIManager.measureLayoutRelativeToParent(
      this.refs[SCROLLVIEW_REF].getNodeHandle(),
      logError,
      this._setScrollVisibleHeight
    );
  },

  _setScrollContentHeight: function(left, top, width, height) {
    this.scrollProperties.contentHeight = height;
  },

  _setScrollVisibleHeight: function(left, top, width, height) {
    this.scrollProperties.visibleHeight = height;
    this._updateVisibleRows();
  },

  _renderMoreRowsIfNeeded: function() {
    if (this.scrollProperties.contentHeight === null ||
      this.scrollProperties.visibleHeight === null ||
      this.state.curRenderedRowsCount === this.props.dataSource.getRowCount()) {
      return;
    }

    var distanceFromEnd = this._getDistanceFromEnd(this.scrollProperties);
    if (distanceFromEnd < this.props.scrollRenderAheadDistance) {
      this._pageInNewRows();
    }
  },

  _pageInNewRows: function() {
    var rowsToRender = Math.min(
      this.state.curRenderedRowsCount + this.props.pageSize,
      this.props.dataSource.getRowCount()
    );
    this.setState(
      {
        prevRenderedRowsCount: this.state.curRenderedRowsCount,
        curRenderedRowsCount: rowsToRender
      },
      () => {
        this._measureAndUpdateScrollProps();
        this.setState({
          prevRenderedRowsCount: this.state.curRenderedRowsCount,
        });
      }
    );
  },

  _getDistanceFromEnd: function(scrollProperties) {
    return scrollProperties.contentHeight -
      scrollProperties.visibleHeight -
      scrollProperties.offsetY;
  },

  _updateVisibleRows: function(e) {
    if (!this.props.onChangeVisibleRows) {
      return; // No need to compute visible rows if there is no callback
    }
    var updatedFrames = e && e.nativeEvent.updatedChildFrames;
    if (updatedFrames) {
      updatedFrames.forEach((frame) => {
        this._childFrames[frame.index] = merge(frame);
      });
    }
    var dataSource = this.props.dataSource;
    var visibleTop = this.scrollProperties.offsetY;
    var visibleBottom = visibleTop + this.scrollProperties.visibleHeight;
    var allRowIDs = dataSource.rowIdentities;

    var header = this.props.renderHeader && this.props.renderHeader();
    var totalIndex = header ? 1 : 0;
    var visibilityChanged = false;
    var changedRows = {};
    for (var sectionIdx = 0; sectionIdx < allRowIDs.length; sectionIdx++) {
      var rowIDs = allRowIDs[sectionIdx];
      if (rowIDs.length === 0) {
        continue;
      }
      var sectionID = dataSource.sectionIdentities[sectionIdx];
      if (this.props.renderSectionHeader) {
        totalIndex++;
      }
      var visibleSection = this._visibleRows[sectionID];
      if (!visibleSection) {
        visibleSection = {};
      }
      for (var rowIdx = 0; rowIdx < rowIDs.length; rowIdx++) {
        var rowID = rowIDs[rowIdx];
        var frame = this._childFrames[totalIndex];
        totalIndex++;
        if (!frame) {
          break;
        }
        var rowVisible = visibleSection[rowID];
        var top = frame.y;
        var bottom = top + frame.height;
        if (top > visibleBottom || bottom < visibleTop) {
          if (rowVisible) {
            visibilityChanged = true;
            delete visibleSection[rowID];
            if (!changedRows[sectionID]) {
              changedRows[sectionID] = {};
            }
            changedRows[sectionID][rowID] = false;
          }
        } else if (!rowVisible) {
          visibilityChanged = true;
          visibleSection[rowID] = true;
          if (!changedRows[sectionID]) {
            changedRows[sectionID] = {};
          }
          changedRows[sectionID][rowID] = true;
        }
      }
      if (!isEmpty(visibleSection)) {
        this._visibleRows[sectionID] = visibleSection;
      } else if (this._visibleRows[sectionID]) {
        delete this._visibleRows[sectionID];
      }
    }
    visibilityChanged && this.props.onChangeVisibleRows(this._visibleRows, changedRows);
  },

  _onScroll: function(e) {
    this.scrollProperties.visibleHeight = e.nativeEvent.layoutMeasurement.height;
    this.scrollProperties.contentHeight = e.nativeEvent.contentSize.height;
    this.scrollProperties.offsetY = e.nativeEvent.contentOffset.y;
    this._updateVisibleRows(e);
    var nearEnd = this._getDistanceFromEnd(this.scrollProperties) < this.props.onEndReachedThreshold;
    if (nearEnd &&
        this.props.onEndReached &&
        this.scrollProperties.contentHeight !== this._sentEndForContentHeight &&
        this.state.curRenderedRowsCount === this.props.dataSource.getRowCount()) {
      this._sentEndForContentHeight = this.scrollProperties.contentHeight;
      this.props.onEndReached(e);
    } else {
      this._renderMoreRowsIfNeeded();
    }

    this.props.onScroll && this.props.onScroll(e);
  },
});

module.exports = ListView;
