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

import * as React from 'react';
import SectionList from '../SectionList';

function renderMyListItem(info: {
  item: {title: string, ...},
  index: number,
  ...
}) {
  return <span />;
}

const renderMyHeader = ({
  section,
}: {
  section: {fooNumber: number, ...} & Object,
  ...
}) => <span />;

module.exports = {
  testGoodDataWithGoodItem(): React.Node {
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

  testBadRenderItemFunction(): $TEMPORARY$array<React.Node> {
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
      <SectionList
        // $FlowExpectedError - title should be inside `item`
        renderItem={(info: {title: string, ...}) => <span />}
        sections={sections}
      />,
      <SectionList
        // $FlowExpectedError - bad index type string, should be number
        renderItem={(info: {index: string}) => <span />}
        sections={sections}
      />,
      // EverythingIsFine
      <SectionList
        renderItem={(info: {item: {title: string, ...}, ...}) => <span />}
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
        /* $FlowExpectedError - section has bad meta data `fooNumber` field of
         * type string */
        sections={sections}
      />
    );
  },
};
