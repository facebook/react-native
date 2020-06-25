/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @generate-docs
 */

'use strict';

const Platform = require('../Utilities/Platform');
const deepDiffer = require('../Utilities/differ/deepDiffer');
const React = require('react');
const View = require('../Components/View/View');
const VirtualizedList = require('./VirtualizedList');
const StyleSheet = require('../StyleSheet/StyleSheet');

const invariant = require('invariant');

import {type ScrollResponderType} from '../Components/ScrollView/ScrollView';
import type {ScrollViewNativeComponentType} from '../Components/ScrollView/ScrollViewNativeComponentType.js';
import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {
  ViewToken,
  ViewabilityConfigCallbackPair,
} from './ViewabilityHelper';
import type {RenderItemType, RenderItemProps} from './VirtualizedList';

type RequiredProps<ItemT> = {|
  /**
    For simplicity, data is a plain array. If you want to use something else,
    like an immutable list, use the underlying
    [`VirtualizedList`](virtualizedlist.md) directly.
   */
  data: ?$ReadOnlyArray<ItemT>,
|};
type OptionalProps<ItemT> = {|
  /**
    ```jsx
    renderItem({ item, index, separators });
    ```

    Takes an item from `data` and renders it into the list.

    Provides additional metadata like `index` if you need it, as well as a more
    generic `separators.updateProps` function which let you set whatever props
    you want to change the rendering of either the leading separator or trailing
    separator in case the more common `highlight` and `unhighlight` (which set
    the `highlighted: boolean` prop) are insufficient for your use case.

    - `item` (Object): The item from `data` being rendered.
    - `index` (number): The index corresponding to this item in the `data`
      array.
    - `separators` (Object)
      - `highlight` (Function)
      - `unhighlight` (Function)
      - `updateProps` (Function)
        - `select` (enum('leading', 'trailing'))
        - `newProps` (Object)

    Example usage:

    ```jsx
    <FlatList
      ItemSeparatorComponent={Platform.OS !== 'android' && ({highlighted}) => (
        <View style={[style.separator, highlighted && {marginLeft: 0}]} />
      )}
      data={[{title: 'Title Text', key: 'item1'}]}
      renderItem={({item, index, separators}) => (
        <TouchableHighlight
          key={item.key}
          onPress={() => this._onPress(item)}
          onShowUnderlay={separators.highlight}
          onHideUnderlay={separators.unhighlight}>
          <View style={{backgroundColor: 'white'}}>
            <Text>{item.title}</Text>
          </View>
        </TouchableHighlight>
      )}
    />
    ```
   */
  renderItem?: ?RenderItemType<ItemT>,

  /**
    Optional custom style for multi-item rows generated when `numColumns > 1`.

    @type style object
   */
  columnWrapperStyle?: ViewStyleProp,
  /**
    A marker property for telling the list to re-render (since it implements
    `PureComponent`). If any of your `renderItem`, Header, Footer, etc.
    functions depend on anything outside of the `data` prop, stick it here and
    treat it immutably.
   */
  extraData?: any,
  /**
    ```jsx
    (data, index) => {length: number, offset: number, index: number}
    ```

    `getItemLayout` is an optional optimization that allows skipping the
    measurement of dynamic content if you know the size (height or width) of
    items ahead of time. `getItemLayout` is efficient if you have fixed size
    items, for example:

    ```jsx
      getItemLayout={(data, index) => (
        {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
      )}
    ```

    Adding `getItemLayout` can be a great performance boost for lists of several
    hundred items. Remember to include separator length (height or width) in
    your offset calculation if you specify `ItemSeparatorComponent`.
   */
  getItemLayout?: (
    data: ?Array<ItemT>,
    index: number,
  ) => {
    length: number,
    offset: number,
    index: number,
    ...
  },
  /**
    If true, renders items next to each other horizontally instead of stacked
    vertically.
   */
  horizontal?: ?boolean,
  /**
    How many items to render in the initial batch. This should be enough to fill
    the screen but not much more. Note these items will never be unmounted as
    part of the windowed rendering in order to improve perceived performance of
    scroll-to-top actions.
   */
  initialNumToRender: number,
  /**
    Instead of starting at the top with the first item, start at
    `initialScrollIndex`. This disables the "scroll to top" optimization that
    keeps the first `initialNumToRender` items always rendered and immediately
    renders the items starting at this initial index. Requires `getItemLayout`
    to be implemented.
   */
  initialScrollIndex?: ?number,
  /**
    Reverses the direction of scroll. Uses scale transforms of `-1`.
   */
  inverted?: ?boolean,
  /**
    ```jsx
    (item: object, index: number) => string;
    ```

    Used to extract a unique key for a given item at the specified index. Key is
    used for caching and as the react key to track item re-ordering. The default
    extractor checks `item.key`, then falls back to using the index, like React
    does.
   */
  keyExtractor: (item: ItemT, index: number) => string,
  /**
    Multiple columns can only be rendered with `horizontal={false}` and will
    zig-zag like a `flexWrap` layout. Items should all be the same height -
    masonry layouts are not supported.
   */
  numColumns: number,
  /**
    Fades out the edges of the the list content.

    If the value is greater than 0, the fading edges will be set accordingly to
    the current scroll direction and position, indicating if there is more
    content to show.

    @platform android
   */
  fadingEdgeLength?: ?number,
|};

type FlatListProps<ItemT> = {|
  ...RequiredProps<ItemT>,
  ...OptionalProps<ItemT>,
|};

type VirtualizedListProps = React.ElementConfig<typeof VirtualizedList>;

export type Props<ItemT> = {
  ...$Diff<
    VirtualizedListProps,
    {
      getItem: $PropertyType<VirtualizedListProps, 'getItem'>,
      getItemCount: $PropertyType<VirtualizedListProps, 'getItemCount'>,
      getItemLayout: $PropertyType<VirtualizedListProps, 'getItemLayout'>,
      renderItem: $PropertyType<VirtualizedListProps, 'renderItem'>,
      keyExtractor: $PropertyType<VirtualizedListProps, 'keyExtractor'>,
      ...
    },
  >,
  ...FlatListProps<ItemT>,
  ...
};

const defaultProps = {
  ...VirtualizedList.defaultProps,
  numColumns: 1,
  /**
    This may improve scroll performance for large lists. On Android the default
    value is true

    > Note: May have bugs (missing content) in some circumstances - use at your
    > own risk.
   */
  removeClippedSubviews: Platform.OS === 'android',
};
export type DefaultProps = typeof defaultProps;

/**
  A performant interface for rendering basic, flat lists, supporting the most
  handy features:

  - Fully cross-platform.
  - Optional horizontal mode.
  - Configurable viewability callbacks.
  - Header support.
  - Footer support.
  - Separator support.
  - Pull to Refresh.
  - Scroll loading.
  - ScrollToIndex support.
  - Multiple column support.

  If you need section support, use [`<SectionList>`](sectionlist.md).

  ```SnackPlayer name=flatlist-simple
  import React from 'react';
  import { SafeAreaView, View, FlatList, StyleSheet, Text } from 'react-native';
  import Constants from 'expo-constants';

  const DATA = [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'First Item',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'Second Item',
    },
    {
      id: '58694a0f-3da1-471f-bd96-145571e29d72',
      title: 'Third Item',
    },
  ];

  const Item = ({ title }) => {
    return (
      <View style={styles.item}>
        <Text style={styles.title}>{title}</Text>
      </View>
    );
  }

  const App = () => {
    const renderItem = ({ item }) => (
      <Item title={item.title} />
    );

    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={DATA}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: Constants.statusBarHeight,
    },
    item: {
      backgroundColor: '#f9c2ff',
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
    },
    title: {
      fontSize: 32,
    },
  });

  export default App;
  ```

  To render multiple columns, use the [`numColumns`](flatlist.md#numcolumns)
  prop. Using this approach instead of a `flexWrap` layout can prevent conflicts
  with the item height logic.

  More complex, multi-select example demonstrating `` usage for perf
  optimization and avoiding bugs.

  - By passing `extraData={selected}` to `FlatList` we make sure `FlatList`
    itself will re-render when the state changes. Without setting this prop,
    `FlatList` would not know it needs to re-render any items because it is a
    `PureComponent` and the prop comparison will not show any changes.
  - `keyExtractor` tells the list to use the `id`s for the react keys instead of
    the default `key` property.

  ```SnackPlayer name=flatlist-selectable
  import React from 'react';
  import {
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Text,
  } from 'react-native';
  import Constants from 'expo-constants';

  const DATA = [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'First Item',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'Second Item',
    },
    {
      id: '58694a0f-3da1-471f-bd96-145571e29d72',
      title: 'Third Item',
    },
  ];

  const Item = ({ id, title, selected, onSelect }) => {
    return (
      <TouchableOpacity
        onPress={() => onSelect(id)}
        style={[
          styles.item,
          { backgroundColor: selected ? '#6e3b6e' : '#f9c2ff' },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
    );
  }

  const App = () => {
    const [selected, setSelected] = React.useState(new Map());

    const onSelect = React.useCallback(
      id => {
        const newSelected = new Map(selected);
        newSelected.set(id, !selected.get(id));

        setSelected(newSelected);
      },
      [selected],
    );

    const renderItem = ({ item }) => (
      <Item
        id={item.id}
        title={item.title}
        selected={!!selected.get(item.id)}
        onSelect={onSelect}
      />
    );

    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={DATA}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          extraData={selected}
        />
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: Constants.statusBarHeight,
    },
    item: {
      backgroundColor: '#f9c2ff',
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
    },
    title: {
      fontSize: 32,
    },
  });

  export default App;
  ```

  This is a convenience wrapper around
  [`<VirtualizedList>`](virtualizedlist.md), and thus inherits its props (as
  well as those of [`<ScrollView>`](scrollview.md)) that aren't explicitly
  listed here, along with the following caveats:

  - Internal state is not preserved when content scrolls out of the render
    window. Make sure all your data is captured in the item data or external
    stores like Flux, Redux, or Relay.
  - This is a `PureComponent` which means that it will not re-render if `props`
    remain shallow-equal. Make sure that everything your `renderItem` function
    depends on is passed as a prop (e.g. `extraData`) that is not `===` after
    updates, otherwise your UI may not update on changes. This includes the
    `data` prop and parent component state.
  - In order to constrain memory and enable smooth scrolling, content is
    rendered asynchronously offscreen. This means it's possible to scroll faster
    than the fill rate and momentarily see blank content. This is a tradeoff
    that can be adjusted to suit the needs of each application, and we are
    working on improving it behind the scenes.
  - By default, the list looks for a `key` prop on each item and uses that for
    the React key. Alternatively, you can provide a custom `keyExtractor` prop.

  Inherits [ScrollView Props](scrollview.md#props), unless it is nested in
  another FlatList of same orientation.
 */
class FlatList<ItemT> extends React.PureComponent<Props<ItemT>, void> {
  static defaultProps: DefaultProps = defaultProps;
  props: Props<ItemT>;
  /**
    ```jsx
    scrollToEnd([params]);
    ```

    Scrolls to the end of the content. May be janky without `getItemLayout`
    prop.

    @param params See below
   */
  scrollToEnd(
    params?: ?{
      /**
        Whether the list should do an animation while scrolling. Defaults to
        `true`.
     */
      animated?: ?boolean,
      ...
    },
  ) {
    if (this._listRef) {
      this._listRef.scrollToEnd(params);
    }
  }

  /**
    ```jsx
    scrollToIndex(params);
    ```

    Scrolls to the item at the specified index such that it is positioned in the
    viewable area such that `viewPosition` 0 places it at the top, 1 at the
    bottom, and 0.5 centered in the middle.

    > Note: Cannot scroll to locations outside the render window without
    > specifying the `getItemLayout` prop.

    @param params See below
   */
  scrollToIndex(params: {
    /**
      Whether the list should do an animation while scrolling. Defaults to
      `true`.
     */
    animated?: ?boolean,
    /**
      The index to scroll to. Required.
     */
    index: number,
    /**
      A fixed number of pixels to offset the final target position.
     */
    viewOffset?: number,
    /**
      A value of `0` places the item specified by index at the top, `1` at the
      bottom, and `0.5` centered in the middle.
     */
    viewPosition?: number,
    ...
  }) {
    if (this._listRef) {
      this._listRef.scrollToIndex(params);
    }
  }

  /**
    ```jsx
    scrollToItem(params);
    ```

    Requires linear scan through data - use `scrollToIndex` instead if possible.

    > Note: Cannot scroll to locations outside the render window without
    > specifying the `getItemLayout` prop.

    @param params See below
   */
  scrollToItem(params: {
    /**
      Whether the list should do an animation while scrolling. Defaults to
      `true`.
     */
    animated?: ?boolean,
    /**
      The item to scroll to. Required.
     */
    item: ItemT,
    /**
      missing
     */
    viewPosition?: number,
    ...
  }) {
    if (this._listRef) {
      this._listRef.scrollToItem(params);
    }
  }

  /**
    ```jsx
    scrollToOffset(params);
    ```

    Scroll to a specific content pixel offset in the list.

    @param params See below
   */
  scrollToOffset(params: {
    /**
      The offset to scroll to. In case of `horizontal` being true, the offset is
      the x-value, in any other case the offset is the y-value. Required.
     */
    animated?: ?boolean,
    /**
      Whether the list should do an animation while scrolling. Defaults to
      `true`.
     */
    offset: number,
    ...
  }) {
    if (this._listRef) {
      this._listRef.scrollToOffset(params);
    }
  }

  /**
    ```jsx
    recordInteraction();
    ```

    Tells the list an interaction has occurred, which should trigger viewability
    calculations, e.g. if `waitForInteractions` is true and the user has not
    scrolled. This is typically called by taps on items or by navigation
    actions.
   */
  recordInteraction() {
    if (this._listRef) {
      this._listRef.recordInteraction();
    }
  }

  /**
    ```jsx
    flashScrollIndicators();
    ```

    Displays the scroll indicators momentarily.
   */
  flashScrollIndicators() {
    if (this._listRef) {
      this._listRef.flashScrollIndicators();
    }
  }

  /**
    ```jsx
    getScrollResponder();
    ```

    Provides a handle to the underlying scroll responder.
   */
  getScrollResponder(): ?ScrollResponderType {
    if (this._listRef) {
      return this._listRef.getScrollResponder();
    }
  }

  /**
    ```jsx
    getNativeScrollRef();
    ```

    Provides a reference to the underlying scroll component
   */
  getNativeScrollRef():
    | ?React.ElementRef<typeof View>
    | ?React.ElementRef<ScrollViewNativeComponentType> {
    if (this._listRef) {
      return this._listRef.getScrollRef();
    }
  }

  /**
    ```jsx
    getScrollableNode();
    ```

    Provides a handle to the underlying scroll node.
   */
  getScrollableNode(): any {
    if (this._listRef) {
      return this._listRef.getScrollableNode();
    }
  }

  setNativeProps(props: {[string]: mixed, ...}) {
    if (this._listRef) {
      this._listRef.setNativeProps(props);
    }
  }

  constructor(props: Props<ItemT>) {
    super(props);
    this._checkProps(this.props);
    if (this.props.viewabilityConfigCallbackPairs) {
      this._virtualizedListPairs = this.props.viewabilityConfigCallbackPairs.map(
        pair => ({
          viewabilityConfig: pair.viewabilityConfig,
          onViewableItemsChanged: this._createOnViewableItemsChanged(
            pair.onViewableItemsChanged,
          ),
        }),
      );
    } else if (this.props.onViewableItemsChanged) {
      this._virtualizedListPairs.push({
        /* $FlowFixMe(>=0.63.0 site=react_native_fb) This comment suppresses an
         * error found when Flow v0.63 was deployed. To see the error delete
         * this comment and run Flow. */
        viewabilityConfig: this.props.viewabilityConfig,
        onViewableItemsChanged: this._createOnViewableItemsChanged(
          this.props.onViewableItemsChanged,
        ),
      });
    }
  }

  componentDidUpdate(prevProps: Props<ItemT>) {
    invariant(
      prevProps.numColumns === this.props.numColumns,
      'Changing numColumns on the fly is not supported. Change the key prop on FlatList when ' +
        'changing the number of columns to force a fresh render of the component.',
    );
    invariant(
      prevProps.onViewableItemsChanged === this.props.onViewableItemsChanged,
      'Changing onViewableItemsChanged on the fly is not supported',
    );
    invariant(
      !deepDiffer(prevProps.viewabilityConfig, this.props.viewabilityConfig),
      'Changing viewabilityConfig on the fly is not supported',
    );
    invariant(
      prevProps.viewabilityConfigCallbackPairs ===
        this.props.viewabilityConfigCallbackPairs,
      'Changing viewabilityConfigCallbackPairs on the fly is not supported',
    );

    this._checkProps(this.props);
  }

  _listRef: ?React.ElementRef<typeof VirtualizedList>;
  _virtualizedListPairs: Array<ViewabilityConfigCallbackPair> = [];

  _captureRef = ref => {
    this._listRef = ref;
  };

  _checkProps(props: Props<ItemT>) {
    const {
      // $FlowFixMe this prop doesn't exist, is only used for an invariant
      getItem,
      // $FlowFixMe this prop doesn't exist, is only used for an invariant
      getItemCount,
      horizontal,
      numColumns,
      columnWrapperStyle,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,
    } = props;
    invariant(
      !getItem && !getItemCount,
      'FlatList does not support custom data formats.',
    );
    if (numColumns > 1) {
      invariant(!horizontal, 'numColumns does not support horizontal.');
    } else {
      invariant(
        !columnWrapperStyle,
        'columnWrapperStyle not supported for single column lists',
      );
    }
    invariant(
      !(onViewableItemsChanged && viewabilityConfigCallbackPairs),
      'FlatList does not support setting both onViewableItemsChanged and ' +
        'viewabilityConfigCallbackPairs.',
    );
  }

  _getItem = (data: Array<ItemT>, index: number) => {
    const {numColumns} = this.props;
    if (numColumns > 1) {
      const ret = [];
      for (let kk = 0; kk < numColumns; kk++) {
        const item = data[index * numColumns + kk];
        if (item != null) {
          ret.push(item);
        }
      }
      return ret;
    } else {
      return data[index];
    }
  };

  _getItemCount = (data: ?Array<ItemT>): number => {
    if (data) {
      const {numColumns} = this.props;
      return numColumns > 1 ? Math.ceil(data.length / numColumns) : data.length;
    } else {
      return 0;
    }
  };

  _keyExtractor = (items: ItemT | Array<ItemT>, index: number) => {
    const {keyExtractor, numColumns} = this.props;
    if (numColumns > 1) {
      invariant(
        Array.isArray(items),
        'FlatList: Encountered internal consistency error, expected each item to consist of an ' +
          'array with 1-%s columns; instead, received a single item.',
        numColumns,
      );
      return items
        .map((it, kk) => keyExtractor(it, index * numColumns + kk))
        .join(':');
    } else {
      // $FlowFixMe Can't call keyExtractor with an array
      return keyExtractor(items, index);
    }
  };

  _pushMultiColumnViewable(arr: Array<ViewToken>, v: ViewToken): void {
    const {numColumns, keyExtractor} = this.props;
    v.item.forEach((item, ii) => {
      invariant(v.index != null, 'Missing index!');
      const index = v.index * numColumns + ii;
      arr.push({...v, item, key: keyExtractor(item, index), index});
    });
  }

  _createOnViewableItemsChanged(
    onViewableItemsChanged: ?(info: {
      viewableItems: Array<ViewToken>,
      changed: Array<ViewToken>,
      ...
    }) => void,
  ) {
    return (info: {
      viewableItems: Array<ViewToken>,
      changed: Array<ViewToken>,
      ...
    }) => {
      const {numColumns} = this.props;
      if (onViewableItemsChanged) {
        if (numColumns > 1) {
          const changed = [];
          const viewableItems = [];
          info.viewableItems.forEach(v =>
            this._pushMultiColumnViewable(viewableItems, v),
          );
          info.changed.forEach(v => this._pushMultiColumnViewable(changed, v));
          onViewableItemsChanged({viewableItems, changed});
        } else {
          onViewableItemsChanged(info);
        }
      }
    };
  }

  _renderer = () => {
    const {
      ListItemComponent,
      renderItem,
      numColumns,
      columnWrapperStyle,
    } = this.props;

    let virtualizedListRenderKey = ListItemComponent
      ? 'ListItemComponent'
      : 'renderItem';

    const renderer = (props): React.Node => {
      if (ListItemComponent) {
        // $FlowFixMe Component isn't valid
        return <ListItemComponent {...props} />;
      } else if (renderItem) {
        return renderItem(props);
      } else {
        return null;
      }
    };

    return {
      /* $FlowFixMe(>=0.111.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.111 was deployed. To see the error, delete
       * this comment and run Flow. */
      [virtualizedListRenderKey]: (info: RenderItemProps<ItemT>) => {
        if (numColumns > 1) {
          const {item, index} = info;
          invariant(
            Array.isArray(item),
            'Expected array of items with numColumns > 1',
          );
          return (
            <View style={StyleSheet.compose(styles.row, columnWrapperStyle)}>
              {item.map((it, kk) => {
                const element = renderer({
                  item: it,
                  index: index * numColumns + kk,
                  separators: info.separators,
                });
                return element != null ? (
                  <React.Fragment key={kk}>{element}</React.Fragment>
                ) : null;
              })}
            </View>
          );
        } else {
          return renderer(info);
        }
      },
    };
  };

  render(): React.Node {
    const {numColumns, columnWrapperStyle, ...restProps} = this.props;

    return (
      <VirtualizedList
        {...restProps}
        getItem={this._getItem}
        getItemCount={this._getItemCount}
        keyExtractor={this._keyExtractor}
        ref={this._captureRef}
        viewabilityConfigCallbackPairs={this._virtualizedListPairs}
        {...this._renderer()}
      />
    );
  }
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row'},
});

module.exports = FlatList;
