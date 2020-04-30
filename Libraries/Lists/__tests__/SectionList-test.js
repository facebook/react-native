/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const React = require('react');
const ReactTestRenderer = require('react-test-renderer');

const SectionList = require('../SectionList');

describe('SectionList', () => {
  it('renders empty list', () => {
    const component = ReactTestRenderer.create(
      <SectionList
        sections={[]}
        renderItem={({item}) => <item v={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('rendering empty section headers is fine', () => {
    const component = ReactTestRenderer.create(
      <SectionList
        sections={[{key: 's1', data: [{key: 'i1'}, {key: 'i2'}]}]}
        renderItem={({item}) => <item v={item.key} />}
        renderSectionHeader={() => null}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders all the bells and whistles', () => {
    const component = ReactTestRenderer.create(
      <SectionList
        initialNumToRender={Infinity}
        ItemSeparatorComponent={props => (
          <defaultItemSeparator v={propStr(props)} />
        )}
        ListEmptyComponent={props => <empty v={propStr(props)} />}
        ListFooterComponent={props => <footer v={propStr(props)} />}
        ListHeaderComponent={props => <header v={propStr(props)} />}
        SectionSeparatorComponent={props => (
          <sectionSeparator v={propStr(props)} />
        )}
        sections={[
          {
            renderItem: props => <itemForSection1 v={propStr(props)} />,
            key: 's1',
            keyExtractor: (item, index) => item.id,
            ItemSeparatorComponent: props => (
              <itemSeparatorForSection1 v={propStr(props)} />
            ),
            data: [{id: 'i1s1'}, {id: 'i2s1'}],
          },
          {
            key: 's2',
            data: [{key: 'i1s2'}, {key: 'i2s2'}],
          },
          {
            key: 's3',
            data: [{key: 'i1s3'}, {key: 'i2s3'}],
          },
        ]}
        refreshing={false}
        onRefresh={jest.fn()}
        renderItem={props => <defaultItem v={propStr(props)} />}
        renderSectionHeader={props => <sectionHeader v={propStr(props)} />}
        renderSectionFooter={props => <sectionFooter v={propStr(props)} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders a footer when there is no data', () => {
    const component = ReactTestRenderer.create(
      <SectionList
        sections={[{key: 's1', data: []}]}
        renderItem={({item}) => <item v={item.key} />}
        renderSectionHeader={props => <sectionHeader v={propStr(props)} />}
        renderSectionFooter={props => <sectionFooter v={propStr(props)} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders a footer when there is no data and no header', () => {
    const component = ReactTestRenderer.create(
      <SectionList
        sections={[{key: 's1', data: []}]}
        renderItem={({item}) => <item v={item.key} />}
        renderSectionFooter={props => <sectionFooter v={propStr(props)} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
});

function propStr(props) {
  return Object.keys(props)
    .map(k => {
      const propObj = props[k] || {};
      return `${k}:${propObj.key || propObj.id || props[k]}`;
    })
    .join(',');
}
