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

const React = require('react');
const SectionList = require('SectionList');

function renderMyListItem(info: {item: {title: string}, index: number}) {
  return <span />;
}

const renderMyHeader = ({section}: {section: {fooNumber: number} & Object}) => <span />;

module.exports = {
  testGoodDataWithGoodItem() {
    const sections = [{
      key: 'a', data: [{
        title: 'foo',
        key: 1,
      }],
    }];
    return <SectionList renderItem={renderMyListItem} sections={sections} />;
  },

  testBadRenderItemFunction() {
    const sections = [{
      key: 'a', data: [{
        title: 'foo',
        key: 1,
      }],
    }];
    return [
      // $FlowExpectedError - title should be inside `item`
      <SectionList renderItem={(info: {title: string}) => <span /> } sections={sections} />,
      // $FlowExpectedError - bad index type string, should be number
      <SectionList renderItem={(info: {index: string}) => <span /> } sections={sections} />,
      // EverythingIsFine
      <SectionList renderItem={(info: {item: {title: string}}) => <span /> } sections={sections} />,
    ];
  },

  testBadInheritedDefaultProp(): React.Element<*> {
    const sections = [];
    // $FlowExpectedError - bad windowSize type "big"
    return <SectionList renderItem={renderMyListItem} sections={sections} windowSize="big" />;
  },

  testMissingData(): React.Element<*> {
    // $FlowExpectedError - missing `sections` prop
    return <SectionList renderItem={renderMyListItem} />;
  },

  testBadSectionsShape(): React.Element<*> {
    const sections = [{
      key: 'a', items: [{
        title: 'foo',
        key: 1,
      }],
    }];
    // $FlowExpectedError - section missing `data` field
    return <SectionList renderItem={renderMyListItem} sections={sections} />;
  },

  testBadSectionsMetadata(): React.Element<*> {
    // $FlowExpectedError - section has bad meta data `fooNumber` field of type string
    const sections = [{
      key: 'a', fooNumber: 'string', data: [{
        title: 'foo',
        key: 1,
      }],
    }];
    return (
      <SectionList
        renderSectionHeader={renderMyHeader}
        renderItem={renderMyListItem}
        sections={sections}
      />
    );
  },
};
