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

const VirtualizedList = require('../VirtualizedList');

describe('VirtualizedList', () => {
  it('renders simple list', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders simple list using ListItemComponent', () => {
    function ListItemComponent({item}) {
      return <item value={item.key} />;
    }
    const component = ReactTestRenderer.create(
      <VirtualizedList
        data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
        ListItemComponent={ListItemComponent}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('warns if both renderItem or ListItemComponent are specified. Uses ListItemComponent', () => {
    jest.spyOn(global.console, 'warn');
    function ListItemComponent({item}) {
      return <item value={item.key} testID={`${item.key}-ListItemComponent`} />;
    }
    const component = ReactTestRenderer.create(
      <VirtualizedList
        data={[{key: 'i1'}]}
        ListItemComponent={ListItemComponent}
        renderItem={({item}) => (
          <item value={item.key} testID={`${item.key}-renderItem`} />
        )}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
      />,
    );

    expect(console.warn.mock.calls).toEqual([
      [
        'VirtualizedList: Both ListItemComponent and renderItem props are present. ListItemComponent will take precedence over renderItem.',
      ],
    ]);
    expect(component).toMatchSnapshot();
    console.warn.mockRestore();
  });

  it('throws if no renderItem or ListItemComponent', () => {
    const componentFactory = () =>
      ReactTestRenderer.create(
        <VirtualizedList
          data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    expect(componentFactory).toThrow(
      'VirtualizedList: Either ListItemComponent or renderItem props are required but none were found.',
    );
  });

  it('renders empty list', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedList
        data={[]}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders null list', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedList
        data={undefined}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, index) => data[index]}
        getItemCount={data => 0}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders empty list with empty component', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedList
        data={[]}
        ListEmptyComponent={() => <empty />}
        ListFooterComponent={() => <footer />}
        ListHeaderComponent={() => <header />}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders list with empty component', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedList
        data={[{key: 'hello'}]}
        ListEmptyComponent={() => <empty />}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders all the bells and whistles', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedList
        ItemSeparatorComponent={() => <separator />}
        ListEmptyComponent={() => <empty />}
        ListFooterComponent={() => <footer />}
        ListHeaderComponent={() => <header />}
        data={new Array(5).fill().map((_, ii) => ({id: String(ii)}))}
        getItem={(data, index) => data[index]}
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

  it('test getItem functionality where data is not an Array', () => {
    const component = ReactTestRenderer.create(
      <VirtualizedList
        data={new Map([['id_0', {key: 'item_0'}]])}
        getItem={(data, index) => data.get('id_' + index)}
        getItemCount={(data: Map) => data.size}
        renderItem={({item}) => <item value={item.key} />}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('handles separators correctly', () => {
    const infos = [];
    const component = ReactTestRenderer.create(
      <VirtualizedList
        ItemSeparatorComponent={props => <separator {...props} />}
        data={[{key: 'i0'}, {key: 'i1'}, {key: 'i2'}]}
        renderItem={info => {
          infos.push(info);
          return <item title={info.item.key} />;
        }}
        getItem={(data, index) => data[index]}
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
      <VirtualizedList
        data={[{key: 'outer0'}, {key: 'outer1'}]}
        renderItem={outerInfo => (
          <VirtualizedList
            data={[
              {key: outerInfo.item.key + ':inner0'},
              {key: outerInfo.item.key + ':inner1'},
            ]}
            horizontal={outerInfo.item.key === 'outer1'}
            renderItem={innerInfo => {
              return <item title={innerInfo.item.key} />;
            }}
            getItem={(data, index) => data[index]}
            getItemCount={data => data.length}
          />
        )}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
      />,
    );
    expect(component).toMatchSnapshot();
  });

  it('returns the viewableItems correctly in the onViewableItemsChanged callback after changing the data', () => {
    const ITEM_HEIGHT = 800;
    let data = [{key: 'i1'}, {key: 'i2'}, {key: 'i3'}];
    const nativeEvent = {
      contentOffset: {y: 0, x: 0},
      layoutMeasurement: {width: 300, height: 600},
      contentSize: {width: 300, height: data.length * ITEM_HEIGHT},
      zoomScale: 1,
      contentInset: {right: 0, top: 0, left: 0, bottom: 0},
    };
    const onViewableItemsChanged = jest.fn();
    const props = {
      data,
      renderItem: ({item}) => <item value={item.key} />,
      getItem: (items, index) => items[index],
      getItemCount: items => items.length,
      getItemLayout: (items, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      onViewableItemsChanged,
    };

    const component = ReactTestRenderer.create(<VirtualizedList {...props} />);

    const instance = component.getInstance();

    instance._onScrollBeginDrag({nativeEvent});
    instance._onScroll({
      timeStamp: 1000,
      nativeEvent,
    });

    expect(onViewableItemsChanged).toHaveBeenCalledTimes(1);
    expect(onViewableItemsChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [expect.objectContaining({isViewable: true, key: 'i1'})],
      }),
    );
    data = [{key: 'i4'}, ...data];
    component.update(<VirtualizedList {...props} data={data} />);

    instance._onScroll({
      timeStamp: 2000,
      nativeEvent: {
        ...nativeEvent,
        contentOffset: {y: 100, x: 0},
      },
    });

    expect(onViewableItemsChanged).toHaveBeenCalledTimes(2);
    expect(onViewableItemsChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [expect.objectContaining({isViewable: true, key: 'i4'})],
      }),
    );
  });
});

describe('VirtualizedList > OnEndReached', () => {
  const ITEM_HEIGHT = 100;
  const INITIAL_ITEM_COUNT = 20;
  const APPENDED_ITEM_COUNT = 10;

  let listItems, onEndReached, instance;
  let shrinkedItemHeight;

  beforeEach(() => {
    shrinkedItemHeight = 0;

    listItems = appendNewItems([], INITIAL_ITEM_COUNT);

    onEndReached = jest.fn(function() {
      appendNewItems(listItems, APPENDED_ITEM_COUNT);
    });

    instance = createComponentInstance();
  });

  it('should not be called after initial rendering', () => {
    expect(onEndReached).not.toHaveBeenCalled();
    expect(listItems.length).toBe(INITIAL_ITEM_COUNT);
  });

  it('should be called when the item layout is shrinked', () => {
    expect(onEndReached).not.toHaveBeenCalled();
    expect(listItems.length).toBe(INITIAL_ITEM_COUNT);

    shrinkedItemHeight = ITEM_HEIGHT / 2;

    const scroll = createScrollMethod();
    scroll(0);

    expect(onEndReached).toHaveBeenCalledTimes(1);
    expect(listItems.length).toBe(INITIAL_ITEM_COUNT + APPENDED_ITEM_COUNT);
  });

  it('should be called once after scrolling by 800', () => {
    const scroll = createScrollMethod();
    scroll(800);

    expect(onEndReached).toHaveBeenCalledTimes(1);
    expect(onEndReached).toHaveBeenLastCalledWith({
      distanceFromEnd: 464,
    });
    expect(listItems.length).toBe(INITIAL_ITEM_COUNT + APPENDED_ITEM_COUNT);
  });

  it('should not be called twice in a short period while scrolling fast', () => {
    const scroll = createScrollMethod();
    scroll(800);

    expect(onEndReached).toHaveBeenCalledTimes(1);
    expect(onEndReached).toHaveBeenLastCalledWith({
      distanceFromEnd: 464,
    });
    expect(listItems.length).toBe(INITIAL_ITEM_COUNT + APPENDED_ITEM_COUNT);

    scroll(850, 50);
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('should be called when required to load more items', () => {
    const scroll = createScrollMethod();
    scroll(800);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    expect(listItems.length).toBe(INITIAL_ITEM_COUNT + APPENDED_ITEM_COUNT);

    scroll(1600);
    expect(onEndReached).toHaveBeenCalledTimes(2);
    expect(onEndReached).toHaveBeenLastCalledWith({
      distanceFromEnd: 664,
    });
    expect(listItems.length).toBe(INITIAL_ITEM_COUNT + APPENDED_ITEM_COUNT * 2);
  });

  function createComponentInstance() {
    const props = {
      data: listItems,
      renderItem: ({item}) => <item value={item.key} />,
      getItem: (items, index) => items[index],
      getItemCount: items => items.length,
      getItemLayout: (items, index) => ({
        length: shrinkedItemHeight ? shrinkedItemHeight : ITEM_HEIGHT,
        offset: (shrinkedItemHeight ? shrinkedItemHeight : ITEM_HEIGHT) * index,
        index,
      }),
      onEndReached,
    };

    const component = ReactTestRenderer.create(<VirtualizedList {...props} />);
    return component.getInstance();
  }

  function appendNewItems(items, count) {
    const nextId = (items.length > 0 ? items[items.length - 1].id : 0) + 1;

    for (let loop = 1; loop <= count; loop++) {
      const id = nextId + loop;
      items.push({
        id: id,
        key: `k${id}`,
      });
    }

    return items;
  }

  function createScrollMethod() {
    let scrollTimeStamp = 0;

    return function scroll(y, delay = 1000) {
      scrollTimeStamp += delay;

      const nativeEvent = {
        contentOffset: {y, x: 0},
        layoutMeasurement: {width: 414, height: 736},
        contentSize: {
          width: 414,
          height:
            listItems.length *
            (shrinkedItemHeight ? shrinkedItemHeight : ITEM_HEIGHT),
        },
        zoomScale: 1,
        contentInset: {right: 0, top: 0, left: 0, bottom: 0},
      };

      instance._onScroll({
        timeStamp: scrollTimeStamp,
        nativeEvent,
      });
    };
  }
});
