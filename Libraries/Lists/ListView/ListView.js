/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ListView
 * @flow
 */
'use strict';

var ListViewDataSource = require('ListViewDataSource');
var Platform = require('Platform');
var React = require('React');
var PropTypes = require('prop-types');
var ReactNative = require('ReactNative');
var RCTScrollViewManager = require('NativeModules').ScrollViewManager;
var ScrollView = require('ScrollView');
var ScrollResponder = require('ScrollResponder');
var StaticRenderer = require('StaticRenderer');
var TimerMixin = require('react-timer-mixin');
var View = require('View');

var cloneReferencedElement = require('react-clone-referenced-element');
var createReactClass = require('create-react-class');
var isEmpty = require('isEmpty');
var merge = require('merge');

var DEFAULT_PAGE_SIZE = 1;
var DEFAULT_INITIAL_ROWS = 10;
var DEFAULT_SCROLL_RENDER_AHEAD = 1000;
var DEFAULT_END_REACHED_THRESHOLD = 1000;
var DEFAULT_SCROLL_CALLBACK_THROTTLE = 50;


/**
 * ListView - A core component designed for efficient display of vertically
 * scrolling lists of changing data. The minimal API is to create a
 * [`ListView.DataSource`](docs/listviewdatasource.html), populate it with a simple
 * array of data blobs, and instantiate a `ListView` component with that data
 * source and a `renderRow` callback which takes a blob from the data array and
 * returns a renderable component.
 *
 * Minimal example:
 *
 * ```
 * class MyComponent extends Component {
 *   constructor() {
 *     super();
 *     const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
 *     this.state = {
 *       dataSource: ds.cloneWithRows(['row 1', 'row 2']),
 *     };
 *   }
 *
 *   render() {
 *     return (
 *       <ListView
 *         dataSource={this.state.dataSource}
 *         renderRow={(rowData) => <Text>{rowData}</Text>}
 *       />
 *     );
 *   }
 * }
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
 *  * Only re-render changed rows - the rowHasChanged function provided to the
 *    data source tells the ListView if it needs to re-render a row because the
 *    source data has changed - see ListViewDataSource for more details.
 *
 *  * Rate-limited row rendering - By default, only one row is rendered per
 *    event-loop (customizable with the `pageSize` prop). This breaks up the
 *    work into smaller chunks to reduce the chance of dropping frames while
 *    rendering rows.
 */

var ListView = createReactClass({
  displayName: 'ListView',
  _childFrames: ([]: Array<Object>),
  _sentEndForContentLength: (null: ?number),
  _scrollComponent: (null: any),
  _prevRenderedRowsCount: 0,
  _visibleRows: ({}: Object),
  scrollProperties: ({}: Object),

  mixins: [ScrollResponder.Mixin, TimerMixin],

  statics: {
    DataSource: ListViewDataSource,
  },

  /**
   * You must provide a renderRow function. If you omit any of the other render
   * functions, ListView will simply skip rendering them.
   *
   * - renderRow(rowData, sectionID, rowID, highlightRow);
   * - renderSectionHeader(sectionData, sectionID);
   */
  propTypes: {
    ...ScrollView.propTypes,
    /**
     * An instance of [ListView.DataSource](docs/listviewdatasource.html) to use
     */
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
     * a renderable component to be rendered as the row. By default the data
     * is exactly what was put into the data source, but it's also possible to
     * provide custom extractors. ListView can be notified when a row is
     * being highlighted by calling `highlightRow(sectionID, rowID)`. This
     * sets a boolean value of adjacentRowHighlighted in renderSeparator, allowing you
     * to control the separators above and below the highlighted row. The highlighted
     * state of a row can be reset by calling highlightRow(null).
     */
    renderRow: PropTypes.func.isRequired,
    /**
     * How many rows to render on initial component mount. Use this to make
     * it so that the first screen worth of data appears at one time instead of
     * over the course of multiple frames.
     */
    initialListSize: PropTypes.number.isRequired,
    /**
     * Called when all rows have been rendered and the list has been scrolled
     * to within onEndReachedThreshold of the bottom. The native scroll
     * event is provided.
     */
    onEndReached: PropTypes.func,
    /**
     * Threshold in pixels (virtual, not physical) for calling onEndReached.
     */
    onEndReachedThreshold: PropTypes.number.isRequired,
    /**
     * Number of rows to render per event loop. Note: if your 'rows' are actually
     * cells, i.e. they don't span the full width of your view (as in the
     * ListViewGridLayoutExample), you should set the pageSize to be a multiple
     * of the number of cells per row, otherwise you're likely to see gaps at
     * the edge of the ListView as new pages are loaded.
     */
    pageSize: PropTypes.number.isRequired,
    /**
     * () => renderable
     *
     * The header and footer are always rendered (if these props are provided)
     * on every render pass. If they are expensive to re-render, wrap them
     * in StaticContainer or other mechanism as appropriate. Footer is always
     * at the bottom of the list, and header at the top, on every render pass.
     */
    renderFooter: PropTypes.func,
    renderHeader: PropTypes.func,
    /**
     * (sectionData, sectionID) => renderable
     *
     * If provided, a header is rendered for this section.
     */
    renderSectionHeader: PropTypes.func,
    /**
     * (props) => renderable
     *
     * A function that returns the scrollable component in which the list rows
     * are rendered. Defaults to returning a ScrollView with the given props.
     */
    renderScrollComponent: PropTypes.func.isRequired,
    /**
     * How early to start rendering rows before they come on screen, in
     * pixels.
     */
    scrollRenderAheadDistance: PropTypes.number.isRequired,
    /**
     * (visibleRows, changedRows) => void
     *
     * Called when the set of visible rows changes. `visibleRows` maps
     * { sectionID: { rowID: true }} for all the visible rows, and
     * `changedRows` maps { sectionID: { rowID: true | false }} for the rows
     * that have changed their visibility, with true indicating visible, and
     * false indicating the view has moved out of view.
     */
    onChangeVisibleRows: PropTypes.func,
    /**
     * A performance optimization for improving scroll perf of
     * large lists, used in conjunction with overflow: 'hidden' on the row
     * containers. This is enabled by default.
     */
    removeClippedSubviews: PropTypes.bool,
    /**
     * Makes the sections headers sticky. The sticky behavior means that it
     * will scroll with the content at the top of the section until it reaches
     * the top of the screen, at which point it will stick to the top until it
     * is pushed off the screen by the next section header. This property is
     * not supported in conjunction with `horizontal={true}`. Only enabled by
     * default on iOS because of typical platform standards.
     */
    stickySectionHeadersEnabled: PropTypes.bool,
    /**
     * An array of child indices determining which children get docked to the
     * top of the screen when scrolling. For example, passing
     * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
     * top of the scroll view. This property is not supported in conjunction
     * with `horizontal={true}`.
     */
    stickyHeaderIndices: PropTypes.arrayOf(PropTypes.number).isRequired,
    /**
     * Flag indicating whether empty section headers should be rendered. In the future release
     * empty section headers will be rendered by default, and the flag will be deprecated.
     * If empty sections are not desired to be rendered their indices should be excluded from sectionID object.
     */
    enableEmptySections: PropTypes.bool,
  },

  /**
   * Exports some data, e.g. for perf investigations or analytics.
   */
  getMetrics: function() {
    return {
      contentLength: this.scrollProperties.contentLength,
      totalRows: (this.props.enableEmptySections ? this.props.dataSource.getRowAndSectionCount() : this.props.dataSource.getRowCount()),
      renderedRows: this.state.curRenderedRowsCount,
      visibleRows: Object.keys(this._visibleRows).length,
    };
  },

  /**
   * Provides a handle to the underlying scroll responder.
   * Note that `this._scrollComponent` might not be a `ScrollView`, so we
   * need to check that it responds to `getScrollResponder` before calling it.
   */
  getScrollResponder: function() {
    if (this._scrollComponent && this._scrollComponent.getScrollResponder) {
      return this._scrollComponent.getScrollResponder();
    }
  },

  getScrollableNode: function() {
    if (this._scrollComponent && this._scrollComponent.getScrollableNode) {
      return this._scrollComponent.getScrollableNode();
    } else {
      return ReactNative.findNodeHandle(this._scrollComponent);
    }
  },

  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   *
   * See `ScrollView#scrollTo`.
   */
  scrollTo: function(...args: Array<mixed>) {
    if (this._scrollComponent && this._scrollComponent.scrollTo) {
      this._scrollComponent.scrollTo(...args);
    }
  },

  /**
   * If this is a vertical ListView scrolls to the bottom.
   * If this is a horizontal ListView scrolls to the right.
   *
   * Use `scrollToEnd({animated: true})` for smooth animated scrolling,
   * `scrollToEnd({animated: false})` for immediate scrolling.
   * If no options are passed, `animated` defaults to true.
   *
   * See `ScrollView#scrollToEnd`.
   */
  scrollToEnd: function(options?: ?{ animated?: ?boolean }) {
    if (this._scrollComponent) {
      if (this._scrollComponent.scrollToEnd) {
        this._scrollComponent.scrollToEnd(options);
      } else {
        console.warn(
          'The scroll component used by the ListView does not support ' +
          'scrollToEnd. Check the renderScrollComponent prop of your ListView.'
        );
      }
    }
  },

  /**
   * Displays the scroll indicators momentarily.
   *
   * @platform ios
   */
  flashScrollIndicators: function() {
    if (this._scrollComponent && this._scrollComponent.flashScrollIndicators) {
      this._scrollComponent.flashScrollIndicators();
    }
  },

  setNativeProps: function(props: Object) {
    if (this._scrollComponent) {
      this._scrollComponent.setNativeProps(props);
    }
  },

  /**
   * React life cycle hooks.
   */

  getDefaultProps: function() {
    return {
      initialListSize: DEFAULT_INITIAL_ROWS,
      pageSize: DEFAULT_PAGE_SIZE,
      renderScrollComponent: props => <ScrollView {...props} />,
      scrollRenderAheadDistance: DEFAULT_SCROLL_RENDER_AHEAD,
      onEndReachedThreshold: DEFAULT_END_REACHED_THRESHOLD,
      stickySectionHeadersEnabled: Platform.OS === 'ios',
      stickyHeaderIndices: [],
    };
  },

  getInitialState: function() {
    return {
      curRenderedRowsCount: this.props.initialListSize,
      highlightedRow: ({} : Object),
    };
  },

  getInnerViewNode: function() {
    return this._scrollComponent.getInnerViewNode();
  },

  componentWillMount: function() {
    // this data should never trigger a render pass, so don't put in state
    this.scrollProperties = {
      visibleLength: null,
      contentLength: null,
      offset: 0
    };
    this._childFrames = [];
    this._visibleRows = {};
    this._prevRenderedRowsCount = 0;
    this._sentEndForContentLength = null;
  },

  componentDidMount: function() {
    // do this in animation frame until componentDidMount actually runs after
    // the component is laid out
    this.requestAnimationFrame(() => {
      this._measureAndUpdateScrollProps();
    });
  },

  componentWillReceiveProps: function(nextProps: Object) {
    if (this.props.dataSource !== nextProps.dataSource ||
        this.props.initialListSize !== nextProps.initialListSize) {
      this.setState((state, props) => {
        this._prevRenderedRowsCount = 0;
        return {
          curRenderedRowsCount: Math.min(
            Math.max(
              state.curRenderedRowsCount,
              props.initialListSize
            ),
            props.enableEmptySections ? props.dataSource.getRowAndSectionCount() : props.dataSource.getRowCount()
          ),
        };
      }, () => this._renderMoreRowsIfNeeded());
    }
  },

  componentDidUpdate: function() {
    this.requestAnimationFrame(() => {
      this._measureAndUpdateScrollProps();
    });
  },

  _onRowHighlighted: function(sectionID: string, rowID: string) {
    this.setState({highlightedRow: {sectionID, rowID}});
  },

  render: function() {
    var bodyComponents = [];

    var dataSource = this.props.dataSource;
    var allRowIDs = dataSource.rowIdentities;
    var rowCount = 0;
    var stickySectionHeaderIndices = [];

    const {renderSectionHeader} = this.props;

    var header = this.props.renderHeader && this.props.renderHeader();
    var footer = this.props.renderFooter && this.props.renderFooter();
    var totalIndex = header ? 1 : 0;

    for (var sectionIdx = 0; sectionIdx < allRowIDs.length; sectionIdx++) {
      var sectionID = dataSource.sectionIdentities[sectionIdx];
      var rowIDs = allRowIDs[sectionIdx];
      if (rowIDs.length === 0) {
        if (this.props.enableEmptySections === undefined) {
          var warning = require('fbjs/lib/warning');
          warning(false, 'In next release empty section headers will be rendered.'
                  + ' In this release you can use \'enableEmptySections\' flag to render empty section headers.');
          continue;
        } else {
          var invariant = require('fbjs/lib/invariant');
          invariant(
            this.props.enableEmptySections,
            'In next release \'enableEmptySections\' flag will be deprecated, empty section headers will always be rendered.'
            + ' If empty section headers are not desirable their indices should be excluded from sectionIDs object.'
            + ' In this release \'enableEmptySections\' may only have value \'true\' to allow empty section headers rendering.');
        }
      }

      if (renderSectionHeader) {
        const element = renderSectionHeader(
          dataSource.getSectionHeaderData(sectionIdx),
          sectionID
        );
        if (element) {
          bodyComponents.push(React.cloneElement(element, {key: 's_' + sectionID}));
          if (this.props.stickySectionHeadersEnabled) {
            stickySectionHeaderIndices.push(totalIndex);
          }
          totalIndex++;
        }
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
              this._onRowHighlighted
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
          if (separator) {
            bodyComponents.push(
              <View key={'s_' + comboID}>
                {separator}
              </View>
            );
            totalIndex++;
          }
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
      ...props
    } = this.props;
    if (!props.scrollEventThrottle) {
      props.scrollEventThrottle = DEFAULT_SCROLL_CALLBACK_THROTTLE;
    }
    if (props.removeClippedSubviews === undefined) {
      props.removeClippedSubviews = true;
    }
    Object.assign(props, {
      onScroll: this._onScroll,
      stickyHeaderIndices: this.props.stickyHeaderIndices.concat(stickySectionHeaderIndices),

      // Do not pass these events downstream to ScrollView since they will be
      // registered in ListView's own ScrollResponder.Mixin
      onKeyboardWillShow: undefined,
      onKeyboardWillHide: undefined,
      onKeyboardDidShow: undefined,
      onKeyboardDidHide: undefined,
    });

    return cloneReferencedElement(renderScrollComponent(props), {
      ref: this._setScrollComponentRef,
      onContentSizeChange: this._onContentSizeChange,
      onLayout: this._onLayout,
    }, header, bodyComponents, footer);
  },

  /**
   * Private methods
   */

  _measureAndUpdateScrollProps: function() {
    var scrollComponent = this.getScrollResponder();
    if (!scrollComponent || !scrollComponent.getInnerViewNode) {
      return;
    }

    // RCTScrollViewManager.calculateChildFrames is not available on
    // every platform
    RCTScrollViewManager && RCTScrollViewManager.calculateChildFrames &&
      RCTScrollViewManager.calculateChildFrames(
        ReactNative.findNodeHandle(scrollComponent),
        this._updateVisibleRows,
      );
  },

  _setScrollComponentRef: function(scrollComponent: Object) {
    this._scrollComponent = scrollComponent;
  },

  _onContentSizeChange: function(width: number, height: number) {
    var contentLength = !this.props.horizontal ? height : width;
    if (contentLength !== this.scrollProperties.contentLength) {
      this.scrollProperties.contentLength = contentLength;
      this._updateVisibleRows();
      this._renderMoreRowsIfNeeded();
    }
    this.props.onContentSizeChange && this.props.onContentSizeChange(width, height);
  },

  _onLayout: function(event: Object) {
    var {width, height} = event.nativeEvent.layout;
    var visibleLength = !this.props.horizontal ? height : width;
    if (visibleLength !== this.scrollProperties.visibleLength) {
      this.scrollProperties.visibleLength = visibleLength;
      this._updateVisibleRows();
      this._renderMoreRowsIfNeeded();
    }
    this.props.onLayout && this.props.onLayout(event);
  },

  _maybeCallOnEndReached: function(event?: Object) {
    if (this.props.onEndReached &&
        this.scrollProperties.contentLength !== this._sentEndForContentLength &&
        this._getDistanceFromEnd(this.scrollProperties) < this.props.onEndReachedThreshold &&
        this.state.curRenderedRowsCount === (this.props.enableEmptySections ? this.props.dataSource.getRowAndSectionCount() : this.props.dataSource.getRowCount())) {
      this._sentEndForContentLength = this.scrollProperties.contentLength;
      this.props.onEndReached(event);
      return true;
    }
    return false;
  },

  _renderMoreRowsIfNeeded: function() {
    if (this.scrollProperties.contentLength === null ||
      this.scrollProperties.visibleLength === null ||
      this.state.curRenderedRowsCount === (this.props.enableEmptySections ? this.props.dataSource.getRowAndSectionCount() : this.props.dataSource.getRowCount())) {
      this._maybeCallOnEndReached();
      return;
    }

    var distanceFromEnd = this._getDistanceFromEnd(this.scrollProperties);
    if (distanceFromEnd < this.props.scrollRenderAheadDistance) {
      this._pageInNewRows();
    }
  },

  _pageInNewRows: function() {
    this.setState((state, props) => {
      var rowsToRender = Math.min(
        state.curRenderedRowsCount + props.pageSize,
        (props.enableEmptySections ? props.dataSource.getRowAndSectionCount() : props.dataSource.getRowCount())
      );
      this._prevRenderedRowsCount = state.curRenderedRowsCount;
      return {
        curRenderedRowsCount: rowsToRender
      };
    }, () => {
      this._measureAndUpdateScrollProps();
      this._prevRenderedRowsCount = this.state.curRenderedRowsCount;
    });
  },

  _getDistanceFromEnd: function(scrollProperties: Object) {
    return scrollProperties.contentLength - scrollProperties.visibleLength - scrollProperties.offset;
  },

  _updateVisibleRows: function(updatedFrames?: Array<Object>) {
    if (!this.props.onChangeVisibleRows) {
      return; // No need to compute visible rows if there is no callback
    }
    if (updatedFrames) {
      updatedFrames.forEach((newFrame) => {
        this._childFrames[newFrame.index] = merge(newFrame);
      });
    }
    var isVertical = !this.props.horizontal;
    var dataSource = this.props.dataSource;
    var visibleMin = this.scrollProperties.offset;
    var visibleMax = visibleMin + this.scrollProperties.visibleLength;
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
        if (this.props.renderSeparator &&
           (rowIdx !== rowIDs.length - 1 || sectionIdx === allRowIDs.length - 1)){
          totalIndex++;
        }
        if (!frame) {
          break;
        }
        var rowVisible = visibleSection[rowID];
        var min = isVertical ? frame.y : frame.x;
        var max = min + (isVertical ? frame.height : frame.width);
        if ((!min && !max) || (min === max)) {
          break;
        }
        if (min > visibleMax || max < visibleMin) {
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

  _onScroll: function(e: Object) {
    var isVertical = !this.props.horizontal;
    this.scrollProperties.visibleLength = e.nativeEvent.layoutMeasurement[
      isVertical ? 'height' : 'width'
    ];
    this.scrollProperties.contentLength = e.nativeEvent.contentSize[
      isVertical ? 'height' : 'width'
    ];
    this.scrollProperties.offset = e.nativeEvent.contentOffset[
      isVertical ? 'y' : 'x'
    ];
    this._updateVisibleRows(e.nativeEvent.updatedChildFrames);
    if (!this._maybeCallOnEndReached(e)) {
      this._renderMoreRowsIfNeeded();
    }

    if (this.props.onEndReached &&
        this._getDistanceFromEnd(this.scrollProperties) > this.props.onEndReachedThreshold) {
      // Scrolled out of the end zone, so it should be able to trigger again.
      this._sentEndForContentLength = null;
    }

    this.props.onScroll && this.props.onScroll(e);
  },
});

module.exports = ListView;
