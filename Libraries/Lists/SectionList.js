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
const React = require('react');
const VirtualizedSectionList = require('./VirtualizedSectionList');

import type {ScrollResponderType} from '../Components/ScrollView/ScrollView';
import type {
  SectionBase as _SectionBase,
  Props as VirtualizedSectionListProps,
  ScrollToLocationParamsType,
} from './VirtualizedSectionList';

type Item = any;

export type SectionBase<SectionItemT> = _SectionBase<SectionItemT>;

type RequiredProps<SectionT: SectionBase<any>> = {|
  /**
    The actual data to render, akin to the `data` prop in [`<FlatList>`](flatlist).
   */
  sections: $ReadOnlyArray<SectionT>,
|};

type OptionalProps<SectionT: SectionBase<any>> = {|
  /**
    Default renderer for every item in every section. Can be over-ridden on a per-section basis.

    The render function will be passed an object with the following keys:

    - 'item' (object) - the item object as specified in this section's `data` key
    - 'index' (number) - Item's index within the section.
    - 'section' (object) - The full section object as specified in `sections`.
    - 'separators' (object) - An object with the following keys:
      - 'highlight' (function) - `() => void`
      - 'unhighlight' (function) - `() => void`
      - 'updateProps' (function) - `(select, newProps) => void`
        - 'select' (enum) - possible values are 'leading', 'trailing'
        - 'newProps' (object)
   */
  renderItem?: (info: {
    item: Item,
    index: number,
    section: SectionT,
    separators: {
      highlight: () => void,
      unhighlight: () => void,
      updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
      ...
    },
    ...
  }) => null | React.Element<any>,
  /**
    A marker property for telling the list to re-render (since it implements `PureComponent`). If
    any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the
    `data` prop, stick it here and treat it immutably.
   */
  extraData?: any,
  /**
    How many items to render in the initial batch. This should be enough to fill the screen but not
    much more. Note these items will never be unmounted as part of the windowed rendering in order
    to improve perceived performance of scroll-to-top actions.
   */
  initialNumToRender: number,
  /**
    Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: ?boolean,
  /**
    Used to extract a unique key for a given item at the specified index. Key is
    used for caching and as the React key to track item re-ordering. The default
    extractor checks `item.key`, then falls back to using the index, like React
    does. Note that this sets keys for each item, but each overall section still
    needs its own key.
   */
  keyExtractor: (item: Item, index: number) => string,
  /**
    Called once when the scroll position gets within `onEndReachedThreshold` of the rendered
    content.
   */
  onEndReached?: ?(info: {distanceFromEnd: number, ...}) => void,
  /**
    Note: may have bugs (missing content) in some circumstances - use at your own risk.

    This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean,
|};

export type Props<SectionT> = {|
  ...$Diff<
    VirtualizedSectionListProps<SectionT>,
    {
      getItem: $PropertyType<VirtualizedSectionListProps<SectionT>, 'getItem'>,
      getItemCount: $PropertyType<
        VirtualizedSectionListProps<SectionT>,
        'getItemCount',
      >,
      renderItem: $PropertyType<
        VirtualizedSectionListProps<SectionT>,
        'renderItem',
      >,
      ...
    },
  >,
  ...RequiredProps<SectionT>,
  ...OptionalProps<SectionT>,
|};

const defaultProps = {
  ...VirtualizedSectionList.defaultProps,
  stickySectionHeadersEnabled: Platform.OS === 'ios',
};

type DefaultProps = typeof defaultProps;

/**
  A performant interface for rendering sectioned lists, supporting the most handy features:
  - Fully cross-platform.
  - Configurable viewability callbacks.
  - List header support.
  - List footer support.
  - Item separator support.
  - Section header support.
  - Section separator support.
  - Heterogeneous data and item rendering support.
  - Pull to Refresh.
  - Scroll loading.

  If you don't need section support and want a simpler interface, use
  [`<FlatList>`](flatlist).

  ```SnackPlayer name=SectionList%20Function%20Component%20Example
  import React from "react";
  import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    SectionList
  } from "react-native";
  import Constants from "expo-constants";

  const DATA = [
    {
      title: "Main dishes",
      data: ["Pizza", "Burger", "Risotto"]
    },
    {
      title: "Sides",
      data: ["French Fries", "Onion Rings", "Fried Shrimps"]
    },
    {
      title: "Drinks",
      data: ["Water", "Coke", "Beer"]
    },
    {
      title: "Desserts",
      data: ["Cheese Cake", "Ice Cream"]
    }
  ];

  const Item = ({ title }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );

  const App = () => (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={DATA}
        keyExtractor={(item, index) => item + index}
        renderItem={({ item }) => <Item title={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
      />
    </SafeAreaView>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: Constants.statusBarHeight,
      marginHorizontal: 16
    },
    item: {
      backgroundColor: "#f9c2ff",
      padding: 20,
      marginVertical: 8
    },
    header: {
      fontSize: 32,
      backgroundColor: "#fff"
    },
    title: {
      fontSize: 24
    }
  });

  export default App;
  ```

  ```SnackPlayer name=SectionList%20Class%20Component%20Example
  import React, { Component } from "react";
  import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    SectionList
  } from "react-native";
  import Constants from "expo-constants";

  const DATA = [
    {
      title: "Main dishes",
      data: ["Pizza", "Burger", "Risotto"]
    },
    {
      title: "Sides",
      data: ["French Fries", "Onion Rings", "Fried Shrimps"]
    },
    {
      title: "Drinks",
      data: ["Water", "Coke", "Beer"]
    },
    {
      title: "Desserts",
      data: ["Cheese Cake", "Ice Cream"]
    }
  ];

  Item = ({ title }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );

  class App extends Component {
    render() {
      return (
        <SafeAreaView style={styles.container}>
          <SectionList
            sections={DATA}
            keyExtractor={(item, index) => item + index}
            renderItem={({ item }) => <Item title={item} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.header}>{title}</Text>
            )}
          />
        </SafeAreaView>
      );
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: Constants.statusBarHeight,
      marginHorizontal: 16
    },
    item: {
      backgroundColor: "#f9c2ff",
      padding: 20,
      marginVertical: 8
    },
    header: {
      fontSize: 32,
      backgroundColor: "#fff"
    },
    title: {
      fontSize: 24
    }
  });

  export default App;
  ```

  This is a convenience wrapper around [`<VirtualizedList>`](virtualizedlist),
  and thus inherits its props (as well as those of [`<ScrollView>`](scrollview))
  that aren't explicitly listed here, along with the following caveats:
  - Internal state is not preserved when content scrolls out of the render window. Make sure all
    your data is captured in the item data or external stores like Flux, Redux, or Relay.
  - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
    equal. Make sure that everything your `renderItem` function depends on is passed as a prop
    (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on
    changes. This includes the `data` prop and parent component state.
  - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
    offscreen. This means it's possible to scroll faster than the fill rate and momentarily see
    blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
    and we are working on improving it behind the scenes.
  - By default, the list looks for a `key` prop on each item and uses that for the React key.
    Alternatively, you can provide a custom `keyExtractor` prop.
 */
class SectionList<SectionT: SectionBase<any>> extends React.PureComponent<
  Props<SectionT>,
  void,
> {
  props: Props<SectionT>;
  static defaultProps: DefaultProps = defaultProps;

  /**
    ```jsx
    scrollToLocation(params);
    ```

    Scrolls to the item at the specified `sectionIndex` and `itemIndex` (within
    the section) positioned in the viewable area such that `viewPosition` 0
    places it at the top (and may be covered by a sticky header), 1 at the
    bottom, and 0.5 centered in the middle.

    > Note: Cannot scroll to locations outside the render window without
     specifying the `getItemLayout` or `onScrollToIndexFailed` prop.

    @param params See below
   */
  scrollToLocation(params: ScrollToLocationParamsType) {
    if (this._wrapperListRef != null) {
      this._wrapperListRef.scrollToLocation(params);
    }
  }

  /**
    Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
    if `waitForInteractions` is true and the user has not scrolled. This is typically called by
    taps on items or by navigation actions.
   */
  recordInteraction() {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    listRef && listRef.recordInteraction();
  }

  /**
    Displays the scroll indicators momentarily.

    ```jsx
    flashScrollIndicators();
    ```

    @platform ios
   */
  flashScrollIndicators() {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    listRef && listRef.flashScrollIndicators();
  }

  /**
    Provides a handle to the underlying scroll responder.
   */
  getScrollResponder(): ?ScrollResponderType {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    if (listRef) {
      return listRef.getScrollResponder();
    }
  }

  getScrollableNode(): any {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    if (listRef) {
      return listRef.getScrollableNode();
    }
  }

  setNativeProps(props: Object) {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    if (listRef) {
      listRef.setNativeProps(props);
    }
  }

  render(): React.Node {
    return (
      <VirtualizedSectionList
        {...this.props}
        ref={this._captureRef}
        getItemCount={items => items.length}
        getItem={(items, index) => items[index]}
      />
    );
  }

  _wrapperListRef: ?React.ElementRef<typeof VirtualizedSectionList>;
  _captureRef = ref => {
    /* $FlowFixMe(>=0.99.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.99 was deployed. To see the error, delete this
     * comment and run Flow. */
    this._wrapperListRef = ref;
  };
}

module.exports = SectionList;
