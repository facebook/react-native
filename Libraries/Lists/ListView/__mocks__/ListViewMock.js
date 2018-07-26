/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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
