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
    renderScrollComponent: (props) => <ScrollView {...props} />,
  }

  componentDidMount() {
    ListViewMock.latestRef = this;
  }

  render() {
    const { dataSource, renderFooter, renderHeader } = this.props;
    let rows = [renderHeader &&
      <StaticRenderer
        key="renderHeader"
        shouldUpdate={true}
        render={renderHeader}
      />
    ];

    const dataSourceRows = dataSource.rowIdentities.map((rowIdentity, rowIdentityIndex) => {
      const sectionID = dataSource.sectionIdentities[rowIdentityIndex];
      return rowIdentity.map((row, rowIndex) => (
        <StaticRenderer
          key={'section_' + sectionID + '_row_' + rowIndex}
          shouldUpdate={true}
          render={this.props.renderRow.bind(
            null,
            dataSource.getRowData(rowIdentityIndex, rowIndex),
            sectionID,
            row
          )}
        />
      ));
    });

    rows = [...rows, ...dataSourceRows];
    renderFooter && rows.push(
      <StaticRenderer
        key="renderFooter"
        shouldUpdate={true}
        render={renderFooter}
      />
    );

    return this.props.renderScrollComponent({...this.props, children: rows});
  }
  static DataSource = ListViewDataSource;
}

module.exports = ListViewMock;
