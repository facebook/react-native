/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('react');
const SectionList = require('SectionList');

function renderMyListItem(info: {item: {title: string}, index: number}) {
  return <span />;
}

const renderMyHeader = ({section}: {section: {fooNumber: number} & Object}) => (
  <span />
);

module.exports = {
  testGoodDataWithGoodItem() {
    const sections = [
      {
        key: 'a',
        data: [
          {
            title: 'foo',
            key: 1,
          },
        ],
      },
    ];
    return <SectionList renderItem={renderMyListItem} sections={sections} />;
  },

  testBadRenderItemFunction() {
    const sections = [
      {
        key: 'a',
        data: [
          {
            title: 'foo',
            key: 1,
          },
        ],
      },
    ];
    return [
      // $FlowExpectedError - title should be inside `item`
      <SectionList
        renderItem={(info: {title: string}) => <span />}
        sections={sections}
      />,
      <SectionList
        // $FlowExpectedError - bad index type string, should be number
        renderItem={(info: {index: string}) => <span />}
        sections={sections}
      />,
      // EverythingIsFine
      <SectionList
        renderItem={(info: {item: {title: string}}) => <span />}
        sections={sections}
      />,
    ];
  },

  testBadInheritedDefaultProp(): React.Element<*> {
    const sections = [];
    return (
      <SectionList
        renderItem={renderMyListItem}
        sections={sections}
        // $FlowExpectedError - bad windowSize type "big"
        windowSize="big"
      />
    );
  },

  testMissingData(): React.Element<*> {
    // $FlowExpectedError - missing `sections` prop
    return <SectionList renderItem={renderMyListItem} />;
  },

  testBadSectionsShape(): React.Element<*> {
    const sections = [
      /* $FlowFixMe(>=0.63.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.63 was deployed. To see the error delete this
       * comment and run Flow. */
      {
        key: 'a',
        items: [
          {
            title: 'foo',
            key: 1,
          },
        ],
      },
    ];
    // $FlowExpectedError - section missing `data` field
    return <SectionList renderItem={renderMyListItem} sections={sections} />;
  },

  testBadSectionsMetadata(): React.Element<*> {
    const sections = [
      {
        key: 'a',
        // $FlowExpectedError - section has bad meta data `fooNumber` field of type string
        fooNumber: 'string',
        data: [
          {
            title: 'foo',
            key: 1,
          },
        ],
      },
    ];
    return (
      <SectionList
        renderSectionHeader={renderMyHeader}
        renderItem={renderMyListItem}
        sections={sections}
      />
    );
  },
};
