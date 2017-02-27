/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const FlatList = require('FlatList');
const React = require('react');

class MyListItem extends React.Component {
  props: {
    item: {
      title: string,
    },
  };
  render() {
    return <span />;
  }
}

module.exports = {
  testBadDataWithTypicalItemComponent(): React.Element<*> {
    // $FlowExpectedError - bad title type 6, should be string
    const data = [{
      title: 6,
      key: 1,
    }];
    return <FlatList ItemComponent={MyListItem} data={data} />;
  },

  testMissingFieldWithTypicalItemComponent(): React.Element<*> {
    const data = [{
      key: 1,
    }];
    // $FlowExpectedError - missing title
    return <FlatList ItemComponent={MyListItem} data={data} />;
  },

  testGoodDataWithGoodCustomItemComponentFunction() {
    const data = [{
      widgetCount: 3,
      key: 1,
    }];
    return (
      <FlatList
        ItemComponent={(props: {widgetCount: number}): React.Element<*> =>
          <MyListItem item={{title: props.widgetCount + ' Widgets'}} />
        }
        data={data}
      />
    );
  },

  testBadNonInheritedDefaultProp(): React.Element<*> {
    const data = [];
    // $FlowExpectedError - bad numColumns type "lots"
    return <FlatList ItemComponent={MyListItem} data={data} numColumns="lots" />;
  },

  testBadInheritedDefaultProp(): React.Element<*> {
    const data = [];
    // $FlowExpectedError - bad windowSize type "big"
    return <FlatList ItemComponent={MyListItem} data={data} windowSize="big" />;
  },

  testMissingData(): React.Element<*> {
    // $FlowExpectedError - missing `data` prop
    return <FlatList ItemComponent={MyListItem} />;
  },
};
