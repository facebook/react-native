/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 *
 * @format
 * @emails oncall+react_native
 */
'use strict';

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');

const FlatList = require('FlatList');

describe('FlatList', () => {
  it('renders simple list', () => {
    const component = ReactTestRenderer.create(
      <FlatList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders empty list', () => {
    const component = ReactTestRenderer.create(
      <FlatList data={[]} renderItem={({item}) => <item value={item.key} />} />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders null list', () => {
    const component = ReactTestRenderer.create(
      <FlatList
        data={undefined}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders all the bells and whistles', () => {
    const component = ReactTestRenderer.create(
      <FlatList
        ItemSeparatorComponent={() => <separator />}
        ListEmptyComponent={() => <empty />}
        ListFooterComponent={() => <footer />}
        ListHeaderComponent={() => <header />}
        data={new Array(5).fill().map((_, ii) => ({id: String(ii)}))}
        keyExtractor={(item, index) => item.id}
        getItemLayout={({index}) => ({length: 50, offset: index * 50})}
        numColumns={2}
        refreshing={false}
        onRefresh={jest.fn()}
        renderItem={({item}) => <item value={item.id} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
});
