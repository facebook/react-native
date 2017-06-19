/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */
'use strict';

const ListViewDataSource = require('ListViewDataSource');
const React = require('React');
const ScrollView = require('ScrollView');
const StaticRenderer = require('StaticRenderer');

class ListViewMock extends React.Component {
  static latestRef: ?ListViewMock;
  static defaultProps = {
    renderScrollComponent: props => <ScrollView {...props} />,
  };
  componentDidMount() {
    ListViewMock.latestRef = this;
  }
  render() {
    const {dataSource, renderFooter, renderHeader} = this.props;
    const rows = [renderHeader && renderHeader()];
    const allRowIDs = dataSource.rowIdentities;
    for (let sectionIdx = 0; sectionIdx < allRowIDs.length; sectionIdx++) {
      const sectionID = dataSource.sectionIdentities[sectionIdx];
      const rowIDs = allRowIDs[sectionIdx];
      for (let rowIdx = 0; rowIdx < rowIDs.length; rowIdx++) {
        const rowID = rowIDs[rowIdx];
        // Row IDs are only unique in a section
        rows.push(
          <StaticRenderer
            key={'section_' + sectionID + '_row_' + rowID}
            shouldUpdate={true}
            render={this.props.renderRow.bind(
              null,
              dataSource.getRowData(sectionIdx, rowIdx),
              sectionID,
              rowID,
            )}
          />,
        );
      }
    }
    renderFooter && rows.push(renderFooter());
    return this.props.renderScrollComponent({...this.props, children: rows});
  }
  static DataSource = ListViewDataSource;
}

module.exports = ListViewMock;
