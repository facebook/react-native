/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AlgoliaDocSearch
 */
'use strict';

var React = require('React');

class AlgoliaDocSearch extends React.Component {
  render() {
    return (
      <div className="algolia-search-wrapper">
        <input id="algolia-doc-search" tabIndex="0" type="text" placeholder="Search docs..." />
      </div>
    );
  }
}

module.exports = AlgoliaDocSearch;
