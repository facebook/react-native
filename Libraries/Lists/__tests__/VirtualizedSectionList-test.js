/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 * @emails oncall+react_native
 */
'use strict';

const React = require('react');
const ReactTestRenderer = require('react-test-renderer');

const VirtualizedSectionList = require('../VirtualizedSectionList');

describe('VirtualizedSectionList', () => {
  it('renders simple list', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedSectionList
        sections={[
          {title: 's1', data: [{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]},
        ]}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, key) => data[key]}
        getItemCount={data => data.length}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders empty list', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedSectionList
        sections={[]}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, key) => data[key]}
        getItemCount={data => data.length}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders null list', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedSectionList
        sections={undefined}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, key) => data[key]}
        getItemCount={data => 0}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders empty list with empty component', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedSectionList
        sections={[]}
        ListEmptyComponent={() => <empty />}
        ListFooterComponent={() => <footer />}
        ListHeaderComponent={() => <header />}
        getItem={(data, key) => data[key]}
        getItemCount={data => data.length}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders list with empty component', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedSectionList
        sections={[{title: 's1', data: [{key: 'hello'}]}]}
        ListEmptyComponent={() => <empty />}
        getItem={(data, key) => data[key]}
        getItemCount={data => data.length}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders all the bells and whistles', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedSectionList
        ItemSeparatorComponent={() => <separator />}
        ListEmptyComponent={() => <empty />}
        ListFooterComponent={() => <footer />}
        ListHeaderComponent={() => <header />}
        sections={[
          {
            title: 's1',
            data: new Array(5).fill().map((_, ii) => ({id: String(ii)})),
          },
        ]}
        getItem={(data, key) => data[key]}
        getItemCount={data => data.length}
        getItemLayout={({index}) => ({length: 50, offset: index * 50})}
        inverted={true}
        keyExtractor={(item, index) => item.id}
        onRefresh={jest.fn()}
        refreshing={false}
        renderItem={({item}) => <item value={item.id} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('handles separators correctly', () => {
    const infos = [];
    const component = ReactTestRenderer.create(
      <VirtualizedSectionList
        ItemSeparatorComponent={props => <separator {...props} />}
        sections={[
          {title: 's0', data: [{key: 'i0'}, {key: 'i1'}, {key: 'i2'}]},
        ]}
        renderItem={info => {
          infos.push(info);
          return <item title={info.item.key} />;
        }}
        getItem={(data, key) => data[key]}
        getItemCount={data => data.length}
      />,
    );
    expect(component).toMatchSnapshot();
    infos[1].separators.highlight();
    expect(component).toMatchSnapshot();
    infos[2].separators.updateProps('leading', {press: true});
    expect(component).toMatchSnapshot();
    infos[1].separators.unhighlight();
  });

  it('handles nested lists', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedSectionList
        sections={[{title: 'outer', data: [{key: 'outer0'}, {key: 'outer1'}]}]}
        renderItem={outerInfo => (
          <VirtualizedSectionList
            sections={[
              {
                title: 'inner',
                data: [
                  {key: outerInfo.item.key + ':inner0'},
                  {key: outerInfo.item.key + ':inner1'},
                ],
              },
            ]}
            horizontal={outerInfo.item.key === 'outer1'}
            renderItem={innerInfo => {
              return <item title={innerInfo.item.key} />;
            }}
            getItem={(data, key) => data[key]}
            getItemCount={data => data.length}
          />
        )}
        getItem={(data, key) => data[key]}
        getItemCount={data => data.length}
      />,
    );
    expect(component).toMatchSnapshot();
  });
});
