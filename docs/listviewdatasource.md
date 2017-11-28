---
id: listviewdatasource
title: ListViewDataSource
layout: docs
category: APIs
permalink: docs/listviewdatasource.html
next: netinfo
previous: linking
---

Provides efficient data processing and access to the
`ListView` component.  A `ListViewDataSource` is created with functions for
extracting data from the input blob, and comparing elements (with default
implementations for convenience).  The input blob can be as simple as an
array of strings, or an object with rows nested inside section objects.

To update the data in the datasource, use `cloneWithRows` (or
`cloneWithRowsAndSections` if you care about sections).  The data in the
data source is immutable, so you can't modify it directly.  The clone methods
suck in the new data and compute a diff for each row so ListView knows
whether to re-render it or not.

In this example, a component receives data in chunks, handled by
`_onDataArrived`, which concats the new data onto the old data and updates the
data source.  We use `concat` to create a new array - mutating `this._data`,
e.g. with `this._data.push(newRowData)`, would be an error. `_rowHasChanged`
understands the shape of the row data and knows how to efficiently compare
it.

```
getInitialState: function() {
  var ds = new ListView.DataSource({rowHasChanged: this._rowHasChanged});
  return {ds};
},
_onDataArrived(newData) {
  this._data = this._data.concat(newData);
  this.setState({
    ds: this.state.ds.cloneWithRows(this._data)
  });
}
```


### Methods

- [`constructor`](docs/listviewdatasource.html#constructor)
- [`cloneWithRows`](docs/listviewdatasource.html#clonewithrows)
- [`cloneWithRowsAndSections`](docs/listviewdatasource.html#clonewithrowsandsections)
- [`getRowCount`](docs/listviewdatasource.html#getrowcount)
- [`getRowAndSectionCount`](docs/listviewdatasource.html#getrowandsectioncount)
- [`rowShouldUpdate`](docs/listviewdatasource.html#rowshouldupdate)
- [`getRowData`](docs/listviewdatasource.html#getrowdata)
- [`getRowIDForFlatIndex`](docs/listviewdatasource.html#getrowidforflatindex)
- [`getSectionIDForFlatIndex`](docs/listviewdatasource.html#getsectionidforflatindex)
- [`getSectionLengths`](docs/listviewdatasource.html#getsectionlengths)
- [`sectionHeaderShouldUpdate`](docs/listviewdatasource.html#sectionheadershouldupdate)
- [`getSectionHeaderData`](docs/listviewdatasource.html#getsectionheaderdata)




---

# Reference

## Methods

### `constructor()`

```javascript
constructor(params)
```


You can provide custom extraction and `hasChanged` functions for section
headers and rows.  If absent, data will be extracted with the
`defaultGetRowData` and `defaultGetSectionHeaderData` functions.

The default extractor expects data of one of the following forms:

     { sectionID_1: { rowID_1: <rowData1>, ... }, ... }

   or

     { sectionID_1: [ <rowData1>, <rowData2>, ... ], ... }

   or

     [ [ <rowData1>, <rowData2>, ... ], ... ]

The constructor takes in a params argument that can contain any of the
following:

- getRowData(dataBlob, sectionID, rowID);
- getSectionHeaderData(dataBlob, sectionID);
- rowHasChanged(prevRowData, nextRowData);
- sectionHeaderHasChanged(prevSectionData, nextSectionData);




---

### `cloneWithRows()`

```javascript
cloneWithRows(dataBlob, rowIdentities)
```


Clones this `ListViewDataSource` with the specified `dataBlob` and
`rowIdentities`. The `dataBlob` is just an arbitrary blob of data. At
construction an extractor to get the interesting information was defined
(or the default was used).

The `rowIdentities` is a 2D array of identifiers for rows.
ie. [['a1', 'a2'], ['b1', 'b2', 'b3'], ...].  If not provided, it's
assumed that the keys of the section data are the row identities.

Note: This function does NOT clone the data in this data source. It simply
passes the functions defined at construction to a new data source with
the data specified. If you wish to maintain the existing data you must
handle merging of old and new data separately and then pass that into
this function as the `dataBlob`.




---

### `cloneWithRowsAndSections()`

```javascript
cloneWithRowsAndSections(dataBlob, sectionIdentities, rowIdentities)
```


This performs the same function as the `cloneWithRows` function but here
you also specify what your `sectionIdentities` are. If you don't care
about sections you should safely be able to use `cloneWithRows`.

`sectionIdentities` is an array of identifiers for sections.
ie. ['s1', 's2', ...].  The identifiers should correspond to the keys or array indexes
of the data you wish to include.  If not provided, it's assumed that the
keys of dataBlob are the section identities.

Note: this returns a new object!

```
const dataSource = ds.cloneWithRowsAndSections({
  addresses: ['row 1', 'row 2'],
  phone_numbers: ['data 1', 'data 2'],
}, ['phone_numbers']);
```




---

### `getRowCount()`

```javascript
getRowCount()
```


Returns the total number of rows in the data source.

If you are specifying the rowIdentities or sectionIdentities, then `getRowCount` will return the number of rows in the filtered data source.




---

### `getRowAndSectionCount()`

```javascript
getRowAndSectionCount()
```


Returns the total number of rows in the data source (see `getRowCount` for how this is calculated) plus the number of sections in the data.

If you are specifying the rowIdentities or sectionIdentities, then `getRowAndSectionCount` will return the number of rows & sections in the filtered data source.




---

### `rowShouldUpdate()`

```javascript
rowShouldUpdate(sectionIndex, rowIndex)
```


Returns if the row is dirtied and needs to be rerendered




---

### `getRowData()`

```javascript
getRowData(sectionIndex, rowIndex)
```


Gets the data required to render the row.




---

### `getRowIDForFlatIndex()`

```javascript
getRowIDForFlatIndex(index)
```


Gets the rowID at index provided if the dataSource arrays were flattened,
or null of out of range indexes.




---

### `getSectionIDForFlatIndex()`

```javascript
getSectionIDForFlatIndex(index)
```


Gets the sectionID at index provided if the dataSource arrays were flattened,
or null for out of range indexes.




---

### `getSectionLengths()`

```javascript
getSectionLengths()
```


Returns an array containing the number of rows in each section




---

### `sectionHeaderShouldUpdate()`

```javascript
sectionHeaderShouldUpdate(sectionIndex)
```


Returns if the section header is dirtied and needs to be rerendered




---

### `getSectionHeaderData()`

```javascript
getSectionHeaderData(sectionIndex)
```


Gets the data required to render the section header




