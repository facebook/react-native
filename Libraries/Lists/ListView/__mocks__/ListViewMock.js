/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
'use strict';

const ListViewDataSource = require('ListViewDataSource');
const React = require('React');
const ScrollView = require('ScrollView');
const StaticRenderer = require('StaticRenderer');

class ListViewMock extends React.Component<$FlowFixMeProps> {
  static latestRef: ?ListViewMock;
  static defaultProps = {
    /* $FlowFixMe(>=0.59.0 site=react_native_fb) This comment suppresses an
     * error caught by Flow 0.59 which was not caught before. Most likely, this
     * error is because an exported function parameter is missing an
     * annotation. Without an annotation, these parameters are uncovered by
     * Flow. */
    renderScrollComponent: props => <ScrollView {...props} />,
  };

  componentDidMount() {
    ListViewMock.latestRef = this;
  }

  render() {
    const {dataSource, renderFooter, renderHeader} = this.props;
    let rows = [
      renderHeader && (
        <StaticRenderer
          key="renderHeader"
          shouldUpdate={true}
          render={renderHeader}
        />
      ),
    ];

    const dataSourceRows = dataSource.rowIdentities.map(
      (rowIdentity, rowIdentityIndex) => {
        const sectionID = dataSource.sectionIdentities[rowIdentityIndex];
        return rowIdentity.map((row, rowIndex) => (
          <StaticRenderer
            key={'section_' + sectionID + '_row_' + rowIndex}
            shouldUpdate={true}
            render={this.props.renderRow.bind(
              null,
              dataSource.getRowData(rowIdentityIndex, rowIndex),
              sectionID,
              row,
            )}
          />
        ));
      },
    );

    rows = [...rows, ...dataSourceRows];
    renderFooter &&
      rows.push(
        <StaticRenderer
          key="renderFooter"
          shouldUpdate={true}
          render={renderFooter}
        />,
      );

    return this.props.renderScrollComponent({...this.props, children: rows});
  }
  static DataSource = ListViewDataSource;
}

module.exports = ListViewMock;
