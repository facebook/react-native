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
 * @providesModule SwipeableListViewDataSource
 */
'use strict';

const ListViewDataSource = require('ListViewDataSource');

/**
 * Data source wrapper around ListViewDataSource to allow for tracking of
 * which row is swiped open and close opened row(s) when another row is swiped
 * open.
 *
 * See https://github.com/facebook/react-native/pull/5602 for why
 * ListViewDataSource is not subclassed.
 */
class SwipeableListViewDataSource {
  _previousOpenRowID: string;
  _openRowID: string;

  _dataBlob: any;
  _dataSource: ListViewDataSource;

  rowIdentities: Array<Array<string>>;
  sectionIdentities: Array<string>;

  constructor(params: Object) {
    this._dataSource = new ListViewDataSource({
      getRowData: params.getRowData,
      getSectionHeaderData: params.getSectionHeaderData,
      rowHasChanged: (row1, row2) => {
        /**
         * Row needs to be re-rendered if its swiped open/close status is
         * changed, or its data blob changed.
         */
        return (
          (row1.id !== this._previousOpenRowID && row2.id === this._openRowID) ||
          (row1.id === this._previousOpenRowID && row2.id !== this._openRowID) ||
          params.rowHasChanged(row1, row2)
        );
      },
      sectionHeaderHasChanged: params.sectionHeaderHasChanged,
    });
  }

  cloneWithRowsAndSections(
    dataBlob: any,
    sectionIdentities: ?Array<string>,
    rowIdentities: ?Array<Array<string>>
  ): SwipeableListViewDataSource {
    this._dataSource = this._dataSource.cloneWithRowsAndSections(
      dataBlob,
      sectionIdentities,
      rowIdentities
    );

    this._dataBlob = dataBlob;
    this.rowIdentities = this._dataSource.rowIdentities;
    this.sectionIdentities = this._dataSource.sectionIdentities;

    return this;
  }

  // For the actual ListView to use
  getDataSource(): ListViewDataSource {
    return this._dataSource;
  }

  getOpenRowID(): ?string {
    return this._openRowID;
  }

  getFirstRowID(): ?string {
    /**
     * If rowIdentities is specified, find the first data row from there since
     * we don't want to attempt to bounce section headers. If unspecified, find
     * the first data row from _dataBlob.
     */
    if (this.rowIdentities) {
      return this.rowIdentities[0] && this.rowIdentities[0][0];
    }
    return Object.keys(this._dataBlob)[0];
  }

  setOpenRowID(rowID: string): SwipeableListViewDataSource {
    this._previousOpenRowID = this._openRowID;
    this._openRowID = rowID;

    this._dataSource = this._dataSource.cloneWithRowsAndSections(
      this._dataBlob,
      this.sectionIdentities,
      this.rowIdentities
    );

    return this;
  }
}

module.exports = SwipeableListViewDataSource;
