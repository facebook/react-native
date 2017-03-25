/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

function renderMyListItem(info: {item: {title: string}, index: number}) {
  return <span />;
}

module.exports = {
  testEverythingIsFine() {
    const data = [{
      title: 'Title Text',
      key: 1,
    }];
    return <FlatList renderItem={renderMyListItem} data={data} />;
  },

  testBadDataWithTypicalItem() {
    // $FlowExpectedError - bad title type 6, should be string
    const data = [{
      title: 6,
      key: 1,
    }];
    return <FlatList renderItem={renderMyListItem} data={data} />;
  },

  testMissingFieldWithTypicalItem() {
    const data = [{
      key: 1,
    }];
    // $FlowExpectedError - missing title
    return <FlatList renderItem={renderMyListItem} data={data} />;
  },

  testGoodDataWithBadCustomRenderItemFunction() {
    const data = [{
      widget: 6,
      key: 1,
    }];
    return (
      <FlatList
        renderItem={(info) =>
          // $FlowExpectedError - bad widgetCount type 6, should be Object
          <span>{info.item.widget.missingProp}</span>
        }
        data={data}
      />
    );
  },

  testBadRenderItemFunction() {
    const data = [{
      title: 'foo',
      key: 1,
    }];
    return [
      // $FlowExpectedError - title should be inside `item`
      <FlatList renderItem={(info: {title: string}) => <span /> } data={data} />,
      // $FlowExpectedError - bad index type string, should be number
      <FlatList renderItem={(info: {item: any, index: string}) => <span /> } data={data} />,
      // $FlowExpectedError - bad title type number, should be string
      <FlatList renderItem={(info: {item: {title: number}}) => <span /> } data={data} />,
      // EverythingIsFine
      <FlatList renderItem={(info: {item: {title: string}}) => <span /> } data={data} />,
    ];
  },

  testOtherBadProps() {
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
