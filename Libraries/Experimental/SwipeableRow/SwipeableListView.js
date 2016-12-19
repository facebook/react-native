/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  *
 *
 * @providesModule SwipeableListView
 * @flow
 */
'use strict';

const ListView = require('ListView');
const React = require('React');
const SwipeableListViewDataSource = require('SwipeableListViewDataSource');
const SwipeableRow = require('SwipeableRow');

const {PropTypes} = React;

type Props = {
  bounceFirstRowOnMount: boolean,
  dataSource: SwipeableListViewDataSource,
  maxSwipeDistance: number | (rowData: any, sectionID: string, rowID: string) => number,
  onScroll: ?Function,
  renderRow: Function,
  renderQuickActions: Function,
};

type State = {
  dataSource: Object,
};

/**
 * A container component that renders multiple SwipeableRow's in a ListView
 * implementation. This is designed to be a drop-in replacement for the
 * standard React Native `ListView`, so use it as if it were a ListView, but
 * with extra props, i.e.
 *
 * let ds = SwipeableListView.getNewDataSource();
 * ds.cloneWithRowsAndSections(dataBlob, ?sectionIDs, ?rowIDs);
 * // ..
 * <SwipeableListView renderRow={..} renderQuickActions={..} {..ListView props} />
 *
 * SwipeableRow can be used independently of this component, but the main
 * benefit of using this component is
 *
 * - It ensures that at most 1 row is swiped open (auto closes others)
 * - It can bounce the 1st row of the list so users know it's swipeable
 * - More to come
 */
class SwipeableListView extends React.Component {
  props: Props;
  state: State;

  _listViewRef: ?React.Element<any> = null;
  _shouldBounceFirstRowOnMount: boolean = false;

  static getNewDataSource(): Object {
    return new SwipeableListViewDataSource({
      getRowData: (data, sectionID, rowID) => data[sectionID][rowID],
      getSectionHeaderData: (data, sectionID) => data[sectionID],
      rowHasChanged: (row1, row2) => row1 !== row2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    });
  }

  static propTypes = {
    /**
     * To alert the user that swiping is possible, the first row can bounce
     * on component mount.
     */
    bounceFirstRowOnMount: PropTypes.bool.isRequired,
    /**
     * Use `SwipeableListView.getNewDataSource()` to get a data source to use,
     * then use it just like you would a normal ListView data source
     */
    dataSource: PropTypes.instanceOf(SwipeableListViewDataSource).isRequired,
    // Maximum distance to open to after a swipe
    maxSwipeDistance: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.func,
    ]).isRequired,
    // Callback method to render the swipeable view
    renderRow: PropTypes.func.isRequired,
    // Callback method to render the view that will be unveiled on swipe
    renderQuickActions: PropTypes.func.isRequired,
  };

  static defaultProps = {
    bounceFirstRowOnMount: false,
    renderQuickActions: () => null,
  };

  constructor(props: Props, context: any): void {
    super(props, context);

    this._shouldBounceFirstRowOnMount = this.props.bounceFirstRowOnMount;
    this.state = {
      dataSource: this.props.dataSource,
    };
  }

  componentWillReceiveProps(nextProps: Props): void {
    if (this.state.dataSource.getDataSource() !== nextProps.dataSource.getDataSource()) {
      this.setState({
        dataSource: nextProps.dataSource,
      });
    }
  }

  render(): React.Element<any> {
    return (
      <ListView
        {...this.props}
        ref={(ref) => {
          this._listViewRef = ref;
        }}
        dataSource={this.state.dataSource.getDataSource()}
        onScroll={this._onScroll}
        renderRow={this._renderRow}
      />
    );
  }

  _onScroll = (e): void => {
    // Close any opens rows on ListView scroll
    if (this.props.dataSource.getOpenRowID()) {
      this.setState({
        dataSource: this.state.dataSource.setOpenRowID(null),
      });
    }
    this.props.onScroll && this.props.onScroll(e);
  }

  /**
   * This is a work-around to lock vertical `ListView` scrolling on iOS and
   * mimic Android behaviour. Locking vertical scrolling when horizontal
   * scrolling is active allows us to significantly improve framerates
   * (from high 20s to almost consistently 60 fps)
   */
  _setListViewScrollable(value: boolean): void {
    if (this._listViewRef && typeof this._listViewRef.setNativeProps === 'function') {
      this._listViewRef.setNativeProps({
        scrollEnabled: value,
      });
    }
  }

  // Passing through ListView's getScrollResponder() function
  getScrollResponder(): ?Object {
    if (this._listViewRef && typeof this._listViewRef.getScrollResponder === 'function') {
      return this._listViewRef.getScrollResponder();
    }
  }

  // This enables rows having variable width slideoutView.
  _getMaxSwipeDistance = (rowData: Object, sectionID: string, rowID: string): number => {
    if (typeof this.props.maxSwipeDistance === 'function') {
      return this.props.maxSwipeDistance(rowData, sectionID, rowID);
    }

    return this.props.maxSwipeDistance;
  };

  _renderRow = (rowData: Object, sectionID: string, rowID: string): React.Element<any> => {
    const slideoutView = this.props.renderQuickActions(rowData, sectionID, rowID);

    // If renderQuickActions is unspecified or returns falsey, don't allow swipe
    if (!slideoutView) {
      return this.props.renderRow(rowData, sectionID, rowID);
    }

    let shouldBounceOnMount = false;
    if (this._shouldBounceFirstRowOnMount) {
      this._shouldBounceFirstRowOnMount = false;
      shouldBounceOnMount = rowID === this.props.dataSource.getFirstRowID();
    }

    return (
      <SwipeableRow
        slideoutView={slideoutView}
        isOpen={rowData.id === this.props.dataSource.getOpenRowID()}
        maxSwipeDistance={this._getMaxSwipeDistance(rowData, sectionID, rowID)}
        key={rowID}
        onOpen={() => this._onOpen(rowData.id)}
        onSwipeEnd={() => this._setListViewScrollable(true)}
        onSwipeStart={() => this._setListViewScrollable(false)}
        shouldBounceOnMount={shouldBounceOnMount}>
        {this.props.renderRow(rowData, sectionID, rowID)}
      </SwipeableRow>
    );
  };

  _onOpen(rowID: string): void {
    this.setState({
      dataSource: this.state.dataSource.setOpenRowID(rowID),
    });
  }
}

module.exports = SwipeableListView;
