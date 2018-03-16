/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ListViewDataSource
 * @flow
 * @format
 */
'use strict';

var invariant = require('fbjs/lib/invariant');
var isEmpty = require('isEmpty');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
var warning = require('fbjs/lib/warning');

function defaultGetRowData(
  dataBlob: any,
  sectionID: number | string,
  rowID: number | string,
): any {
  return dataBlob[sectionID][rowID];
}

function defaultGetSectionHeaderData(
  dataBlob: any,
  sectionID: number | string,
): any {
  return dataBlob[sectionID];
}

type differType = (data1: any, data2: any) => boolean;

type ParamType = {
  rowHasChanged: differType,
  getRowData?: ?typeof defaultGetRowData,
  sectionHeaderHasChanged?: ?differType,
  getSectionHeaderData?: ?typeof defaultGetSectionHeaderData,
};

/**
 * Provides efficient data processing and access to the
 * `ListView` component.  A `ListViewDataSource` is created with functions for
 * extracting data from the input blob, and comparing elements (with default
 * implementations for convenience).  The input blob can be as simple as an
 * array of strings, or an object with rows nested inside section objects.
 *
 * To update the data in the datasource, use `cloneWithRows` (or
 * `cloneWithRowsAndSections` if you care about sections).  The data in the
 * data source is immutable, so you can't modify it directly.  The clone methods
 * suck in the new data and compute a diff for each row so ListView knows
 * whether to re-render it or not.
 *
 * In this example, a component receives data in chunks, handled by
 * `_onDataArrived`, which concats the new data onto the old data and updates the
 * data source.  We use `concat` to create a new array - mutating `this._data`,
 * e.g. with `this._data.push(newRowData)`, would be an error. `_rowHasChanged`
 * understands the shape of the row data and knows how to efficiently compare
 * it.
 *
 * ```
 * getInitialState: function() {
 *   var ds = new ListView.DataSource({rowHasChanged: this._rowHasChanged});
 *   return {ds};
 * },
 * _onDataArrived(newData) {
 *   this._data = this._data.concat(newData);
 *   this.setState({
 *     ds: this.state.ds.cloneWithRows(this._data)
 *   });
 * }
 * ```
 */

class ListViewDataSource {
  /**
   * You can provide custom extraction and `hasChanged` functions for section
   * headers and rows.  If absent, data will be extracted with the
   * `defaultGetRowData` and `defaultGetSectionHeaderData` functions.
   *
   * The default extractor expects data of one of the following forms:
   *
   *      { sectionID_1: { rowID_1: <rowData1>, ... }, ... }
   *
   *    or
   *
   *      { sectionID_1: [ <rowData1>, <rowData2>, ... ], ... }
   *
   *    or
   *
   *      [ [ <rowData1>, <rowData2>, ... ], ... ]
   *
   * The constructor takes in a params argument that can contain any of the
   * following:
   *
   * - getRowData(dataBlob, sectionID, rowID);
   * - getSectionHeaderData(dataBlob, sectionID);
   * - rowHasChanged(prevRowData, nextRowData);
   * - sectionHeaderHasChanged(prevSectionData, nextSectionData);
   */
  constructor(params: ParamType) {
    invariant(
      params && typeof params.rowHasChanged === 'function',
      'Must provide a rowHasChanged function.',
    );
    this._rowHasChanged = params.rowHasChanged;
    this._getRowData = params.getRowData || defaultGetRowData;
    this._sectionHeaderHasChanged = params.sectionHeaderHasChanged;
    this._getSectionHeaderData =
      params.getSectionHeaderData || defaultGetSectionHeaderData;

    this._dataBlob = null;
    this._dirtyRows = [];
    this._dirtySections = [];
    this._cachedRowCount = 0;

    // These two private variables are accessed by outsiders because ListView
    // uses them to iterate over the data in this class.
    this.rowIdentities = [];
    this.sectionIdentities = [];
  }

  /**
   * Clones this `ListViewDataSource` with the specified `dataBlob` and
   * `rowIdentities`. The `dataBlob` is just an arbitrary blob of data. At
   * construction an extractor to get the interesting information was defined
   * (or the default was used).
   *
   * The `rowIdentities` is a 2D array of identifiers for rows.
   * ie. [['a1', 'a2'], ['b1', 'b2', 'b3'], ...].  If not provided, it's
   * assumed that the keys of the section data are the row identities.
   *
   * Note: This function does NOT clone the data in this data source. It simply
   * passes the functions defined at construction to a new data source with
   * the data specified. If you wish to maintain the existing data you must
   * handle merging of old and new data separately and then pass that into
   * this function as the `dataBlob`.
   */
  cloneWithRows(
    dataBlob: $ReadOnlyArray<any> | {+[key: string]: any},
    rowIdentities: ?$ReadOnlyArray<string>,
  ): ListViewDataSource {
    var rowIds = rowIdentities ? [[...rowIdentities]] : null;
    if (!this._sectionHeaderHasChanged) {
      this._sectionHeaderHasChanged = () => false;
    }
    return this.cloneWithRowsAndSections({s1: dataBlob}, ['s1'], rowIds);
  }

  /**
   * This performs the same function as the `cloneWithRows` function but here
   * you also specify what your `sectionIdentities` are. If you don't care
   * about sections you should safely be able to use `cloneWithRows`.
   *
   * `sectionIdentities` is an array of identifiers for sections.
   * ie. ['s1', 's2', ...].  The identifiers should correspond to the keys or array indexes
   * of the data you wish to include.  If not provided, it's assumed that the
   * keys of dataBlob are the section identities.
   *
   * Note: this returns a new object!
   *
   * ```
   * const dataSource = ds.cloneWithRowsAndSections({
   *   addresses: ['row 1', 'row 2'],
   *   phone_numbers: ['data 1', 'data 2'],
   * }, ['phone_numbers']);
   * ```
   */
  cloneWithRowsAndSections(
    dataBlob: any,
    sectionIdentities: ?Array<string>,
    rowIdentities: ?Array<Array<string>>,
  ): ListViewDataSource {
    invariant(
      typeof this._sectionHeaderHasChanged === 'function',
      'Must provide a sectionHeaderHasChanged function with section data.',
    );
    invariant(
      !sectionIdentities ||
        !rowIdentities ||
        sectionIdentities.length === rowIdentities.length,
      'row and section ids lengths must be the same',
    );

    var newSource = new ListViewDataSource({
      getRowData: this._getRowData,
      getSectionHeaderData: this._getSectionHeaderData,
      rowHasChanged: this._rowHasChanged,
      sectionHeaderHasChanged: this._sectionHeaderHasChanged,
    });
    newSource._dataBlob = dataBlob;
    if (sectionIdentities) {
      newSource.sectionIdentities = sectionIdentities;
    } else {
      newSource.sectionIdentities = Object.keys(dataBlob);
    }
    if (rowIdentities) {
      newSource.rowIdentities = rowIdentities;
    } else {
      newSource.rowIdentities = [];
      newSource.sectionIdentities.forEach(sectionID => {
        newSource.rowIdentities.push(Object.keys(dataBlob[sectionID]));
      });
    }
    newSource._cachedRowCount = countRows(newSource.rowIdentities);

    newSource._calculateDirtyArrays(
      this._dataBlob,
      this.sectionIdentities,
      this.rowIdentities,
    );

    return newSource;
  }

  /**
   * Returns the total number of rows in the data source.
   *
   * If you are specifying the rowIdentities or sectionIdentities, then `getRowCount` will return the number of rows in the filtered data source.
   */
  getRowCount(): number {
    return this._cachedRowCount;
  }

  /**
   * Returns the total number of rows in the data source (see `getRowCount` for how this is calculated) plus the number of sections in the data.
   *
   * If you are specifying the rowIdentities or sectionIdentities, then `getRowAndSectionCount` will return the number of rows & sections in the filtered data source.
   */
  getRowAndSectionCount(): number {
    return this._cachedRowCount + this.sectionIdentities.length;
  }

  /**
   * Returns if the row is dirtied and needs to be rerendered
   */
  rowShouldUpdate(sectionIndex: number, rowIndex: number): boolean {
    var needsUpdate = this._dirtyRows[sectionIndex][rowIndex];
    warning(
      needsUpdate !== undefined,
      'missing dirtyBit for section, row: ' + sectionIndex + ', ' + rowIndex,
    );
    return needsUpdate;
  }

  /**
   * Gets the data required to render the row.
   */
  getRowData(sectionIndex: number, rowIndex: number): any {
    var sectionID = this.sectionIdentities[sectionIndex];
    var rowID = this.rowIdentities[sectionIndex][rowIndex];
    warning(
      sectionID !== undefined && rowID !== undefined,
      'rendering invalid section, row: ' + sectionIndex + ', ' + rowIndex,
    );
    return this._getRowData(this._dataBlob, sectionID, rowID);
  }

  /**
   * Gets the rowID at index provided if the dataSource arrays were flattened,
   * or null of out of range indexes.
   */
  getRowIDForFlatIndex(index: number): ?string {
    var accessIndex = index;
    for (var ii = 0; ii < this.sectionIdentities.length; ii++) {
      if (accessIndex >= this.rowIdentities[ii].length) {
        accessIndex -= this.rowIdentities[ii].length;
      } else {
        return this.rowIdentities[ii][accessIndex];
      }
    }
    return null;
  }

  /**
   * Gets the sectionID at index provided if the dataSource arrays were flattened,
   * or null for out of range indexes.
   */
  getSectionIDForFlatIndex(index: number): ?string {
    var accessIndex = index;
    for (var ii = 0; ii < this.sectionIdentities.length; ii++) {
      if (accessIndex >= this.rowIdentities[ii].length) {
        accessIndex -= this.rowIdentities[ii].length;
      } else {
        return this.sectionIdentities[ii];
      }
    }
    return null;
  }

  /**
   * Returns an array containing the number of rows in each section
   */
  getSectionLengths(): Array<number> {
    var results = [];
    for (var ii = 0; ii < this.sectionIdentities.length; ii++) {
      results.push(this.rowIdentities[ii].length);
    }
    return results;
  }

  /**
   * Returns if the section header is dirtied and needs to be rerendered
   */
  sectionHeaderShouldUpdate(sectionIndex: number): boolean {
    var needsUpdate = this._dirtySections[sectionIndex];
    warning(
      needsUpdate !== undefined,
      'missing dirtyBit for section: ' + sectionIndex,
    );
    return needsUpdate;
  }

  /**
   * Gets the data required to render the section header
   */
  getSectionHeaderData(sectionIndex: number): any {
    if (!this._getSectionHeaderData) {
      return null;
    }
    var sectionID = this.sectionIdentities[sectionIndex];
    warning(
      sectionID !== undefined,
      'renderSection called on invalid section: ' + sectionIndex,
    );
    return this._getSectionHeaderData(this._dataBlob, sectionID);
  }

  /**
   * Private members and methods.
   */

  _getRowData: typeof defaultGetRowData;
  _getSectionHeaderData: typeof defaultGetSectionHeaderData;
  _rowHasChanged: differType;
  _sectionHeaderHasChanged: ?differType;

  _dataBlob: any;
  _dirtyRows: Array<Array<boolean>>;
  _dirtySections: Array<boolean>;
  _cachedRowCount: number;

  // These two 'protected' variables are accessed by ListView to iterate over
  // the data in this class.
  rowIdentities: Array<Array<string>>;
  sectionIdentities: Array<string>;

  _calculateDirtyArrays(
    prevDataBlob: any,
    prevSectionIDs: Array<string>,
    prevRowIDs: Array<Array<string>>,
  ): void {
    // construct a hashmap of the existing (old) id arrays
    var prevSectionsHash = keyedDictionaryFromArray(prevSectionIDs);
    var prevRowsHash = {};
    for (var ii = 0; ii < prevRowIDs.length; ii++) {
      var sectionID = prevSectionIDs[ii];
      warning(
        !prevRowsHash[sectionID],
        'SectionID appears more than once: ' + sectionID,
      );
      prevRowsHash[sectionID] = keyedDictionaryFromArray(prevRowIDs[ii]);
    }

    // compare the 2 identity array and get the dirtied rows
    this._dirtySections = [];
    this._dirtyRows = [];

    var dirty;
    for (var sIndex = 0; sIndex < this.sectionIdentities.length; sIndex++) {
      var sectionID = this.sectionIdentities[sIndex];
      // dirty if the sectionHeader is new or _sectionHasChanged is true
      dirty = !prevSectionsHash[sectionID];
      var sectionHeaderHasChanged = this._sectionHeaderHasChanged;
      if (!dirty && sectionHeaderHasChanged) {
        dirty = sectionHeaderHasChanged(
          this._getSectionHeaderData(prevDataBlob, sectionID),
          this._getSectionHeaderData(this._dataBlob, sectionID),
        );
      }
      this._dirtySections.push(!!dirty);

      this._dirtyRows[sIndex] = [];
      for (
        var rIndex = 0;
        rIndex < this.rowIdentities[sIndex].length;
        rIndex++
      ) {
        var rowID = this.rowIdentities[sIndex][rIndex];
        // dirty if the section is new, row is new or _rowHasChanged is true
        dirty =
          !prevSectionsHash[sectionID] ||
          !prevRowsHash[sectionID][rowID] ||
          this._rowHasChanged(
            this._getRowData(prevDataBlob, sectionID, rowID),
            this._getRowData(this._dataBlob, sectionID, rowID),
          );
        this._dirtyRows[sIndex].push(!!dirty);
      }
    }
  }
}

function countRows(allRowIDs) {
  var totalRows = 0;
  for (var sectionIdx = 0; sectionIdx < allRowIDs.length; sectionIdx++) {
    var rowIDs = allRowIDs[sectionIdx];
    totalRows += rowIDs.length;
  }
  return totalRows;
}

function keyedDictionaryFromArray(arr) {
  if (isEmpty(arr)) {
    return {};
  }
  var result = {};
  for (var ii = 0; ii < arr.length; ii++) {
    var key = arr[ii];
    warning(!result[key], 'Value appears more than once in array: ' + key);
    result[key] = true;
  }
  return result;
}

module.exports = ListViewDataSource;
