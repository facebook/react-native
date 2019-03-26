/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const React = require('React');
const ListViewDataSource = require('ListViewDataSource');

// This class is purely a facsimile of ListView so that we can
// properly type it with Flow before migrating ListView off of
// createReactClass. If there are things missing here that are in
// ListView, that is unintentional.
class InternalListViewType<Props> extends React.Component<Props> {
  static DataSource = ListViewDataSource;
  setNativeProps(props: Object) {}
  flashScrollIndicators() {}
  getScrollResponder(): any {}
  getScrollableNode(): any {}
  // $FlowFixMe
  getMetrics(): Object {}
  scrollTo(...args: Array<mixed>) {}
  scrollToEnd(options?: ?{animated?: ?boolean}) {}
}

module.exports = InternalListViewType;
