/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "ListViewDataSource",
  "docblock": "/**\\n * Provides efficient data processing and access to the\\n * \`ListView\` component.  A \`ListViewDataSource\` is created with functions for\\n * extracting data from the input blob, and comparing elements (with default\\n * implementations for convenience).  The input blob can be as simple as an\\n * array of strings, or an object with rows nested inside section objects.\\n *\\n * To update the data in the datasource, use \`cloneWithRows\` (or\\n * \`cloneWithRowsAndSections\` if you care about sections).  The data in the\\n * data source is immutable, so you can't modify it directly.  The clone methods\\n * suck in the new data and compute a diff for each row so ListView knows\\n * whether to re-render it or not.\\n *\\n * In this example, a component receives data in chunks, handled by\\n * \`_onDataArrived\`, which concats the new data onto the old data and updates the\\n * data source.  We use \`concat\` to create a new array - mutating \`this._data\`,\\n * e.g. with \`this._data.push(newRowData)\`, would be an error. \`_rowHasChanged\`\\n * understands the shape of the row data and knows how to efficiently compare\\n * it.\\n *\\n * \`\`\`\\n * getInitialState: function() \{\\n *   var ds = new ListViewDataSource(\{rowHasChanged: this._rowHasChanged});\\n *   return \{ds};\\n * },\\n * _onDataArrived(newData) \{\\n *   this._data = this._data.concat(newData);\\n *   this.setState(\{\\n *     ds: this.state.ds.cloneWithRows(this._data)\\n *   });\\n * }\\n * \`\`\`\\n */\\n",
  "methods": [
    \{
      "line": 103,
      "source": "constructor(params: ParamType) \{\\n    invariant(\\n      params && typeof params.rowHasChanged === 'function',\\n      'Must provide a rowHasChanged function.',\\n    );\\n    this._rowHasChanged = params.rowHasChanged;\\n    this._getRowData = params.getRowData || defaultGetRowData;\\n    this._sectionHeaderHasChanged = params.sectionHeaderHasChanged;\\n    this._getSectionHeaderData =\\n      params.getSectionHeaderData || defaultGetSectionHeaderData;\\n\\n    this._dataBlob = null;\\n    this._dirtyRows = [];\\n    this._dirtySections = [];\\n    this._cachedRowCount = 0;\\n\\n    // These two private variables are accessed by outsiders because ListView\\n    // uses them to iterate over the data in this class.\\n    this.rowIdentities = [];\\n    this.sectionIdentities = [];\\n  }",
      "docblock": "/**\\n   * You can provide custom extraction and \`hasChanged\` functions for section\\n   * headers and rows.  If absent, data will be extracted with the\\n   * \`defaultGetRowData\` and \`defaultGetSectionHeaderData\` functions.\\n   *\\n   * The default extractor expects data of one of the following forms:\\n   *\\n   *      \{ sectionID_1: \{ rowID_1: <rowData1>, ... }, ... }\\n   *\\n   *    or\\n   *\\n   *      \{ sectionID_1: [ <rowData1>, <rowData2>, ... ], ... }\\n   *\\n   *    or\\n   *\\n   *      [ [ <rowData1>, <rowData2>, ... ], ... ]\\n   *\\n   * The constructor takes in a params argument that can contain any of the\\n   * following:\\n   *\\n   * - getRowData(dataBlob, sectionID, rowID);\\n   * - getSectionHeaderData(dataBlob, sectionID);\\n   * - rowHasChanged(prevRowData, nextRowData);\\n   * - sectionHeaderHasChanged(prevSectionData, nextSectionData);\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ParamType\\",\\"length\\":1}",
          "name": "params"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "constructor"
    },
    \{
      "line": 141,
      "source": "cloneWithRows(\\n    dataBlob: $ReadOnlyArray<any> | \{+[key: string]: any},\\n    rowIdentities: ?$ReadOnlyArray<string>,\\n  ): ListViewDataSource \{\\n    var rowIds = rowIdentities ? [[...rowIdentities]] : null;\\n    if (!this._sectionHeaderHasChanged) \{\\n      this._sectionHeaderHasChanged = () => false;\\n    }\\n    return this.cloneWithRowsAndSections(\{s1: dataBlob}, ['s1'], rowIds);\\n  }",
      "docblock": "/**\\n   * Clones this \`ListViewDataSource\` with the specified \`dataBlob\` and\\n   * \`rowIdentities\`. The \`dataBlob\` is just an arbitrary blob of data. At\\n   * construction an extractor to get the interesting information was defined\\n   * (or the default was used).\\n   *\\n   * The \`rowIdentities\` is a 2D array of identifiers for rows.\\n   * ie. [['a1', 'a2'], ['b1', 'b2', 'b3'], ...].  If not provided, it's\\n   * assumed that the keys of the section data are the row identities.\\n   *\\n   * Note: This function does NOT clone the data in this data source. It simply\\n   * passes the functions defined at construction to a new data source with\\n   * the data specified. If you wish to maintain the existing data you must\\n   * handle merging of old and new data separately and then pass that into\\n   * this function as the \`dataBlob\`.\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "$ReadOnlyArray<any> | \{+[key: string]: any}",
          "name": "dataBlob"
        },
        \{
          "typehint": "?$ReadOnlyArray<string>",
          "name": "rowIdentities"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ListViewDataSource\\",\\"length\\":1}",
      "name": "cloneWithRows"
    },
    \{
      "line": 163,
      "source": "cloneWithRowsAndSections(\\n    dataBlob: any,\\n    sectionIdentities: ?Array<string>,\\n    rowIdentities: ?Array<Array<string>>,\\n  ): ListViewDataSource \{\\n    invariant(\\n      typeof this._sectionHeaderHasChanged === 'function',\\n      'Must provide a sectionHeaderHasChanged function with section data.',\\n    );\\n    invariant(\\n      !sectionIdentities ||\\n        !rowIdentities ||\\n        sectionIdentities.length === rowIdentities.length,\\n      'row and section ids lengths must be the same',\\n    );\\n\\n    var newSource = new ListViewDataSource(\{\\n      getRowData: this._getRowData,\\n      getSectionHeaderData: this._getSectionHeaderData,\\n      rowHasChanged: this._rowHasChanged,\\n      sectionHeaderHasChanged: this._sectionHeaderHasChanged,\\n    });\\n    newSource._dataBlob = dataBlob;\\n    if (sectionIdentities) \{\\n      newSource.sectionIdentities = sectionIdentities;\\n    } else \{\\n      newSource.sectionIdentities = Object.keys(dataBlob);\\n    }\\n    if (rowIdentities) \{\\n      newSource.rowIdentities = rowIdentities;\\n    } else \{\\n      newSource.rowIdentities = [];\\n      newSource.sectionIdentities.forEach(sectionID => \{\\n        newSource.rowIdentities.push(Object.keys(dataBlob[sectionID]));\\n      });\\n    }\\n    newSource._cachedRowCount = countRows(newSource.rowIdentities);\\n\\n    newSource._calculateDirtyArrays(\\n      this._dataBlob,\\n      this.sectionIdentities,\\n      this.rowIdentities,\\n    );\\n\\n    return newSource;\\n  }",
      "docblock": "/**\\n   * This performs the same function as the \`cloneWithRows\` function but here\\n   * you also specify what your \`sectionIdentities\` are. If you don't care\\n   * about sections you should safely be able to use \`cloneWithRows\`.\\n   *\\n   * \`sectionIdentities\` is an array of identifiers for  sections.\\n   * ie. ['s1', 's2', ...].  If not provided, it's assumed that the\\n   * keys of dataBlob are the section identities.\\n   *\\n   * Note: this returns a new object!\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "any",
          "name": "dataBlob"
        },
        \{
          "typehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}],\\"length\\":5,\\"nullable\\":true}",
          "name": "sectionIdentities"
        },
        \{
          "typehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}],\\"length\\":4}],\\"length\\":8,\\"nullable\\":true}",
          "name": "rowIdentities"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ListViewDataSource\\",\\"length\\":1}",
      "name": "cloneWithRowsAndSections"
    },
    \{
      "line": 210,
      "source": "getRowCount(): number \{\\n    return this._cachedRowCount;\\n  }",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "getRowCount"
    },
    \{
      "line": 214,
      "source": "getRowAndSectionCount(): number \{\\n    return this._cachedRowCount + this.sectionIdentities.length;\\n  }",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "getRowAndSectionCount"
    },
    \{
      "line": 221,
      "source": "rowShouldUpdate(sectionIndex: number, rowIndex: number): boolean \{\\n    var needsUpdate = this._dirtyRows[sectionIndex][rowIndex];\\n    warning(\\n      needsUpdate !== undefined,\\n      'missing dirtyBit for section, row: ' + sectionIndex + ', ' + rowIndex,\\n    );\\n    return needsUpdate;\\n  }",
      "docblock": "/**\\n   * Returns if the row is dirtied and needs to be rerendered\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "sectionIndex"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "rowIndex"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}",
      "name": "rowShouldUpdate"
    },
    \{
      "line": 233,
      "source": "getRowData(sectionIndex: number, rowIndex: number): any \{\\n    var sectionID = this.sectionIdentities[sectionIndex];\\n    var rowID = this.rowIdentities[sectionIndex][rowIndex];\\n    warning(\\n      sectionID !== undefined && rowID !== undefined,\\n      'rendering invalid section, row: ' + sectionIndex + ', ' + rowIndex,\\n    );\\n    return this._getRowData(this._dataBlob, sectionID, rowID);\\n  }",
      "docblock": "/**\\n   * Gets the data required to render the row.\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "sectionIndex"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "rowIndex"
        }
      ],
      "tparams": null,
      "returntypehint": "any",
      "name": "getRowData"
    },
    \{
      "line": 247,
      "source": "getRowIDForFlatIndex(index: number): ?string \{\\n    var accessIndex = index;\\n    for (var ii = 0; ii < this.sectionIdentities.length; ii++) \{\\n      if (accessIndex >= this.rowIdentities[ii].length) \{\\n        accessIndex -= this.rowIdentities[ii].length;\\n      } else \{\\n        return this.rowIdentities[ii][accessIndex];\\n      }\\n    }\\n    return null;\\n  }",
      "docblock": "/**\\n   * Gets the rowID at index provided if the dataSource arrays were flattened,\\n   * or null of out of range indexes.\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "index"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":2,\\"nullable\\":true}",
      "name": "getRowIDForFlatIndex"
    },
    \{
      "line": 263,
      "source": "getSectionIDForFlatIndex(index: number): ?string \{\\n    var accessIndex = index;\\n    for (var ii = 0; ii < this.sectionIdentities.length; ii++) \{\\n      if (accessIndex >= this.rowIdentities[ii].length) \{\\n        accessIndex -= this.rowIdentities[ii].length;\\n      } else \{\\n        return this.sectionIdentities[ii];\\n      }\\n    }\\n    return null;\\n  }",
      "docblock": "/**\\n   * Gets the sectionID at index provided if the dataSource arrays were flattened,\\n   * or null for out of range indexes.\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "index"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":2,\\"nullable\\":true}",
      "name": "getSectionIDForFlatIndex"
    },
    \{
      "line": 278,
      "source": "getSectionLengths(): Array<number> \{\\n    var results = [];\\n    for (var ii = 0; ii < this.sectionIdentities.length; ii++) \{\\n      results.push(this.rowIdentities[ii].length);\\n    }\\n    return results;\\n  }",
      "docblock": "/**\\n   * Returns an array containing the number of rows in each section\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}],\\"length\\":4}",
      "name": "getSectionLengths"
    },
    \{
      "line": 289,
      "source": "sectionHeaderShouldUpdate(sectionIndex: number): boolean \{\\n    var needsUpdate = this._dirtySections[sectionIndex];\\n    warning(\\n      needsUpdate !== undefined,\\n      'missing dirtyBit for section: ' + sectionIndex,\\n    );\\n    return needsUpdate;\\n  }",
      "docblock": "/**\\n   * Returns if the section header is dirtied and needs to be rerendered\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "sectionIndex"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}",
      "name": "sectionHeaderShouldUpdate"
    },
    \{
      "line": 301,
      "source": "getSectionHeaderData(sectionIndex: number): any \{\\n    if (!this._getSectionHeaderData) \{\\n      return null;\\n    }\\n    var sectionID = this.sectionIdentities[sectionIndex];\\n    warning(\\n      sectionID !== undefined,\\n      'renderSection called on invalid section: ' + sectionIndex,\\n    );\\n    return this._getSectionHeaderData(this._dataBlob, sectionID);\\n  }",
      "docblock": "/**\\n   * Gets the data required to render the section header\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "sectionIndex"
        }
      ],
      "tparams": null,
      "returntypehint": "any",
      "name": "getSectionHeaderData"
    }
  ],
  "type": "api",
  "line": 77,
  "requires": [
    \{
      "name": "fbjs/lib/invariant"
    },
    \{
      "name": "isEmpty"
    },
    \{
      "name": "fbjs/lib/warning"
    }
  ],
  "filepath": "Libraries/Lists/ListView/ListViewDataSource.js",
  "componentName": "ListViewDataSource",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"listviewdatasource","title":"ListViewDataSource","layout":"autodocs","category":"APIs","permalink":"docs/listviewdatasource.html","platform":"cross","next":"netinfo","previous":"linking","sidebar":false,"path":"Libraries/Lists/ListView/ListViewDataSource.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;