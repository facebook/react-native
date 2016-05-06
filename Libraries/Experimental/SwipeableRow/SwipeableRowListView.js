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
 * @providesModule SwipeableRowListView
 * @flow
 */
'use strict';

const ListViewDataSource = require('ListViewDataSource');
const React = require('React');
const SwipeableRow = require('SwipeableRow');

const {PropTypes} = React;

/**
 * A container component that renders multiple SwipeableRow's in a provided
 * ListView implementation and allows a maximum of 1 SwipeableRow to be open at
 * any given time.
 */
const SwipeableRowListView = React.createClass({
  propTypes: {
    // Raw data blob for the ListView
    dataBlob: PropTypes.object.isRequired,
    /**
     * Provided implementation of ListView that will be used to render
     * SwipeableRow elements from dataBlob
     */
    listView: PropTypes.func.isRequired,
    maxSwipeDistance: PropTypes.number,
    // Callback method to render the view that will be unveiled on swipe
    renderRowSlideout: PropTypes.func.isRequired,
    // Callback method to render the swipeable view
    renderRowSwipeable: PropTypes.func.isRequired,
    rowIDs: PropTypes.array.isRequired,
    sectionIDs: PropTypes.array.isRequired,
  },

  getInitialState(): Object {
    const ds = new ListViewDataSource({
      getRowData: (data, sectionID, rowID) => data[rowID],
      getSectionHeaderData: (data, sectionID) => data[sectionID],
      rowHasChanged: (row1, row2) => row1 !== row2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    });

    return {
      dataSource: ds.cloneWithRowsAndSections(
        this.props.dataBlob,
        this.props.sectionIDs,
        this.props.rowIDs,
      ),
    };
  },

  render(): ReactElement {
    const CustomListView = this.props.listView;

    return (
      <CustomListView
        {...this.props}
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
      />
    );
  },

  _renderRow(rowData: Object, sectionID: string, rowID: string): ReactElement {
    return (
      <SwipeableRow
        slideoutView={this.props.renderRowSlideout(rowData, sectionID, rowID)}
        isOpen={rowData.isOpen}
        maxSwipeDistance={this.props.maxSwipeDistance}
        key={rowID}
        onOpen={() => this._onRowOpen(rowID)}>
        {this.props.renderRowSwipeable(
          rowData,
          sectionID,
          rowID,
          this.state.dataSource,
        )}
      </SwipeableRow>
    );
  },

  _onRowOpen(rowID: string): void {
    // Need to recreate dataSource object and not just update existing
    const blob = JSON.parse(JSON.stringify(this.props.dataBlob));
    blob[rowID].isOpen = true;

    this.setState({
      dataSource: this.state.dataSource.cloneWithRowsAndSections(
        blob,
        this.props.sectionIDs,
        this.props.rowIDs,
      ),
    });
  },
});

module.exports = SwipeableRowListView;
