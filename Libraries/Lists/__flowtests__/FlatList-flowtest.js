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

const FlatList = require('../FlatList');
const React = require('react');

function renderMyListItem(info: {
  item: {title: string, ...},
  index: number,
  ...
}) {
  return <span />;
}

module.exports = {
  testEverythingIsFine(): React.Node {
    const data = [
      {
        title: 'Title Text',
        key: 1,
      },
    ];
    return <FlatList renderItem={renderMyListItem} data={data} />;
  },

  testBadDataWithTypicalItem(): React.Node {
    const data = [
      {
        title: 6,
        key: 1,
      },
    ];
    // $FlowExpectedError - bad title type 6, should be string
    return <FlatList renderItem={renderMyListItem} data={data} />;
  },

  testMissingFieldWithTypicalItem(): React.Node {
    const data = [
      {
        key: 1,
      },
    ];
    // $FlowExpectedError - missing title
    return <FlatList renderItem={renderMyListItem} data={data} />;
  },

  testGoodDataWithBadCustomRenderItemFunction(): React.Node {
    const data = [
      {
        widget: 6,
        key: 1,
      },
    ];
    return (
      <FlatList
        renderItem={info => (
          <span>
            {
              // $FlowExpectedError - bad widgetCount type 6, should be Object
              info.item.widget.missingProp
            }
          </span>
        )}
        data={data}
      />
    );
  },

  testBadRenderItemFunction(): $TEMPORARY$array<React.Node> {
    const data = [
      {
        title: 'foo',
        key: 1,
      },
    ];
    return [
      // $FlowExpectedError - title should be inside `item`
      <FlatList renderItem={(info: {title: string}) => <span />} data={data} />,
      <FlatList
        // $FlowExpectedError - bad index type string, should be number
        renderItem={(info: {item: any, index: string}) => <span />}
        data={data}
      />,
      <FlatList
        // $FlowExpectedError - bad title type number, should be string
        renderItem={(info: {item: {title: number}}) => <span />}
        data={data}
      />,
      // EverythingIsFine
      <FlatList
        // $FlowExpectedError - bad title type number, should be string
        renderItem={(info: {item: {title: string, ...}, ...}) => <span />}
        data={data}
      />,
    ];
  },

  testOtherBadProps(): $TEMPORARY$array<React.Node> {
    return [
      // $FlowExpectedError - bad numColumns type "lots"
      <FlatList renderItem={renderMyListItem} data={[]} numColumns="lots" />,
      // $FlowExpectedError - bad windowSize type "big"
      <FlatList renderItem={renderMyListItem} data={[]} windowSize="big" />,
      // $FlowExpectedError - missing `data` prop
      <FlatList renderItem={renderMyListItem} />,
    ];
  },
};
