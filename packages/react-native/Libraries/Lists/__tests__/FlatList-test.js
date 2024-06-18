/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const {create} = require('../../../jest/renderer');
const FlatList = require('../FlatList');
const React = require('react');

describe('FlatList', () => {
  it('renders simple list', async () => {
    const component = await create(
      <FlatList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders simple list (multiple columns)', async () => {
    const component = await create(
      <FlatList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        renderItem={({item}) => <item value={item.key} />}
        numColumns={2}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders simple list using ListItemComponent', async () => {
    function ListItemComponent({item}) {
      return <item value={item.key} />;
    }
    const component = await create(
      <FlatList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        ListItemComponent={ListItemComponent}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders simple list using ListItemComponent (multiple columns)', async () => {
    function ListItemComponent({item}) {
      return <item value={item.key} />;
    }
    const component = await create(
      <FlatList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        ListItemComponent={ListItemComponent}
        numColumns={2}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders empty list', async () => {
    const component = await create(
      <FlatList data={[]} renderItem={({item}) => <item value={item.key} />} />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders null list', async () => {
    const component = await create(
      <FlatList
        data={undefined}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('renders all the bells and whistles', async () => {
    const component = await create(
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
  it('getNativeScrollRef for case where it returns a native view', async () => {
    jest.resetModules();
    jest.unmock('../../Components/ScrollView/ScrollView');

    const listRef = React.createRef(null);

    await create(
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

  it('getNativeScrollRef for case where it returns a native scroll view', async () => {
    jest.resetModules();
    jest.unmock('../../Components/ScrollView/ScrollView');

    function ListItemComponent({item}) {
      return <item value={item.key} />;
    }
    const listRef = React.createRef(null);

    await create(
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

  it('calls renderItem for all data items', async () => {
    const data = [
      {key: 'i1'},
      null,
      undefined,
      {key: 'i2'},
      null,
      undefined,
      {key: 'i3'},
    ];

    const renderItemInOneColumn = jest.fn();
    await create(<FlatList data={data} renderItem={renderItemInOneColumn} />);

    expect(renderItemInOneColumn).toHaveBeenCalledTimes(7);

    const renderItemInThreeColumns = jest.fn();

    await create(
      <FlatList
        data={data}
        renderItem={renderItemInThreeColumns}
        numColumns={3}
      />,
    );

    expect(renderItemInThreeColumns).toHaveBeenCalledTimes(7);
  });
  it('renders array-like data', async () => {
    const arrayLike = {
      length: 3,
      0: {key: 'i1'},
      1: {key: 'i2'},
      2: {key: 'i3'},
    };

    const component = await create(
      <FlatList
        data={arrayLike}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
  it('ignores invalid data', async () => {
    const component = await create(
      <FlatList
        data={123456}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });
});
