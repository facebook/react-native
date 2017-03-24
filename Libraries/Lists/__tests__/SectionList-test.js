/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.disableAutomock();

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');

const SectionList = require('SectionList');

describe('SectionList', () => {
  it('renders empty list', () => {
    const component = ReactTestRenderer.create(
      <SectionList
        sections={[]}
        renderItem={({item}) => <item value={item.key} />}
      />
    );
    expect(component).toMatchSnapshot();
  });
  it('rendering empty section headers is fine', () => {
    const component = ReactTestRenderer.create(
      <SectionList
        sections={[{key: 's1', data: [{key: 'i1'}, {key: 'i2'}]}]}
        renderItem={({item}) => <item value={item.key} />}
        renderSectionHeader={() => null}
      />
    );
    expect(component).toMatchSnapshot();
  });
  it('renders all the bells and whistles', () => {
    const component = ReactTestRenderer.create(
      <SectionList
        ItemSeparatorComponent={() => <defaultItemSeparator />}
        ListFooterComponent={() => <footer />}
        ListHeaderComponent={() => <header />}
        SectionSeparatorComponent={() => <sectionSeparator />}
        sections={[
          {
            renderItem: ({item}) => <itemForSection1 value={item.id} />,
            key: '1st Section',
            keyExtractor: (item, index) => item.id,
            ItemSeparatorComponent: () => <itemSeparatorForSection1 />,
            data: [{id: 'i1s1'}, {id: 'i2s1'}],
          },
          {
            key: '2nd Section',
            data: [{key: 'i1s2'}, {key: 'i2s2'}],
          },
        ]}
        refreshing={false}
        onRefresh={jest.fn()}
        renderItem={({item}) => <defaultItem value={item.key} />}
        renderSectionHeader={({section}) => <sectionHeader value={section.key} />}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
