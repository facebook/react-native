/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

const FlatList = require('../FlatList');

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
  it('renders simple list (multiple columns)', () => {
    const component = ReactTestRenderer.create(
      <FlatList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        renderItem={({item}) => <item value={item.key} />}
        numColumns={2}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders simple list using ListItemComponent', () => {
    function ListItemComponent({item}) {
      return <item value={item.key} />;
    }
    const component = ReactTestRenderer.create(
      <FlatList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        ListItemComponent={ListItemComponent}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders simple list using ListItemComponent (multiple columns)', () => {
    function ListItemComponent({item}) {
      return <item value={item.key} />;
    }
    const component = ReactTestRenderer.create(
      <FlatList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        ListItemComponent={ListItemComponent}
        numColumns={2}
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
  it('getNativeScrollRef for case where it returns a native view', () => {
    jest.resetModules();
    jest.unmock('../../Components/ScrollView/ScrollView');

    const listRef = React.createRef(null);

    ReactTestRenderer.create(
      <FlatList
        data={[{key: 'outer0'}, {key: 'outer1'}]}
        renderItem={outerInfo => (
          <FlatList
            data={[
              {key: outerInfo.item.key + ':inner0'},
              {key: outerInfo.item.key + ':inner1'},
            ]}
            renderItem={innerInfo => {
              return <item title={innerInfo.item.key} />;
            }}
            ref={listRef}
          />
        )}
      />,
    );

    const scrollRef = listRef.current.getNativeScrollRef();

    // This is checking if the ref acts like a host component. If we had an
    // `isHostComponent(ref)` method, that would be preferred.
    expect(scrollRef.measure).toBeInstanceOf(jest.fn().constructor);
    expect(scrollRef.measureLayout).toBeInstanceOf(jest.fn().constructor);
    expect(scrollRef.measureInWindow).toBeInstanceOf(jest.fn().constructor);
  });

  it('getNativeScrollRef for case where it returns a native scroll view', () => {
    jest.resetModules();
    jest.unmock('../../Components/ScrollView/ScrollView');

    function ListItemComponent({item}) {
      return <item value={item.key} />;
    }
    const listRef = React.createRef(null);

    ReactTestRenderer.create(
      <FlatList
        data={[{key: 'i4'}, {key: 'i2'}, {key: 'i3'}]}
        ListItemComponent={ListItemComponent}
        numColumns={2}
        ref={listRef}
      />,
    );

    const scrollRef = listRef.current.getNativeScrollRef();

    // This is checking if the ref acts like a host component. If we had an
    // `isHostComponent(ref)` method, that would be preferred.
    expect(scrollRef.measure).toBeInstanceOf(jest.fn().constructor);
    expect(scrollRef.measureLayout).toBeInstanceOf(jest.fn().constructor);
    expect(scrollRef.measureInWindow).toBeInstanceOf(jest.fn().constructor);
  });
});
