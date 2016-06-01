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

/**
 * A container component that renders multiple SwipeableRow's in a ListView
 * implementation.
 */
const SwipeableListView = React.createClass({
  statics: {
    getNewDataSource(): Object {
      return new SwipeableListViewDataSource({
        getRowData: (data, sectionID, rowID) => data[rowID],
        getSectionHeaderData: (data, sectionID) => data[sectionID],
        sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
        rowHasChanged: (row1, row2) => row1 !== row2,
      });
    },
  },

  _listViewRef: (null: ?string),

  propTypes: {
    dataSource: PropTypes.instanceOf(SwipeableListViewDataSource).isRequired,
    maxSwipeDistance: PropTypes.number,
    // Callback method to render the swipeable view
    renderRow: PropTypes.func.isRequired,
    // Callback method to render the view that will be unveiled on swipe
    renderQuickActions: PropTypes.func.isRequired,
  },

  getDefaultProps(): Object {
    return {
      renderQuickActions: () => null,
    };
  },

  getInitialState(): Object {
    return {
      dataSource: this.props.dataSource,
    };
  },

  componentWillReceiveProps(nextProps: Object): void {
    if (
      this.state.dataSource.getDataSource() !== nextProps.dataSource.getDataSource()
    ) {
      this.setState({
        dataSource: nextProps.dataSource,
      });
    }
  },

  render(): ReactElement<any> {
    return (
      <ListView
        {...this.props}
        ref={(ref) => {
          this._listViewRef = ref;
        }}
        dataSource={this.state.dataSource.getDataSource()}
        renderRow={this._renderRow}
        scrollEnabled={this.state.scrollEnabled}
      />
    );
  },

  /**
   * This is a work-around to lock vertical `ListView` scrolling on iOS and
   * mimic Android behaviour. Locking vertical scrolling when horizontal
   * scrolling is active allows us to significantly improve framerates
   * (from high 20s to almost consistently 60 fps)
   */
  _setListViewScrollable(value: boolean): void {
    if (this._listViewRef && this._listViewRef.setNativeProps) {
      this._listViewRef.setNativeProps({
        scrollEnabled: value,
      });
    }
  },

  // Passing through ListView's getScrollResponder() function
  getScrollResponder(): ?Object {
    if (this._listViewRef && this._listViewRef.getScrollResponder) {
      return this._listViewRef.getScrollResponder();
    }
  },

  _renderRow(rowData: Object, sectionID: string, rowID: string): ReactElement<any> {
    const slideoutView = this.props.renderQuickActions(rowData, sectionID, rowID);

    // If renderRowSlideout is unspecified or returns falsey, don't allow swipe
    if (!slideoutView) {
      return this.props.renderRow(rowData, sectionID, rowID);
    }

    return (
      <SwipeableRow
        slideoutView={slideoutView}
        isOpen={rowData.id === this.props.dataSource.getOpenRowID()}
        maxSwipeDistance={this.props.maxSwipeDistance}
        key={rowID}
        onOpen={() => this._onOpen(rowData.id)}
        onSwipeEnd={() => this._setListViewScrollable(true)}
        onSwipeStart={() => this._setListViewScrollable(false)}>
        {this.props.renderRow(rowData, sectionID, rowID)}
      </SwipeableRow>
    );
  },

  _onOpen(rowID: string): void {
    this.setState({
      dataSource: this.state.dataSource.setOpenRowID(rowID),
    });
  },
});

module.exports = SwipeableListView;
