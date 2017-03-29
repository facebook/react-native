/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SectionList
 * @flow
 */
'use strict';

const MetroListView = require('MetroListView');
const Platform = require('Platform');
const React = require('React');
const VirtualizedSectionList = require('VirtualizedSectionList');

import type {ViewToken} from 'ViewabilityHelper';
import type {Props as VirtualizedSectionListProps} from 'VirtualizedSectionList';

type Item = any;

type SectionBase<SectionItemT> = {
  // Must be provided directly on each section.
  data: Array<SectionItemT>,
  key: string,

  // Optional props will override list-wide props just for this section.
  renderItem?: ?(info: {item: SectionItemT, index: number}) => ?React.Element<any>,
  ItemSeparatorComponent?: ?ReactClass<any>,
  keyExtractor?: (item: SectionItemT) => string,

  // TODO: support more optional/override props
  // onViewableItemsChanged?: ...
};

type RequiredProps<SectionT: SectionBase<any>> = {
  sections: Array<SectionT>,
};

type OptionalProps<SectionT: SectionBase<any>> = {
  /**
   * Default renderer for every item in every section. Can be over-ridden on a per-section basis.
   */
  renderItem: (info: {item: Item, index: number}) => ?React.Element<any>,
  /**
   * Rendered in between adjacent Items within each section.
   */
  ItemSeparatorComponent?: ?ReactClass<any>,
  /**
   * Rendered at the very beginning of the list.
   */
  ListHeaderComponent?: ?ReactClass<any>,
  /**
   * Rendered at the very end of the list.
   */
  ListFooterComponent?: ?ReactClass<any>,
  /**
   * Rendered in between each section.
   */
  SectionSeparatorComponent?: ?ReactClass<any>,
  /**
   * A marker property for telling the list to re-render (since it implements `PureComponent`). If
   * any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the
   * `data` prop, stick it here and treat it immutably.
   */
  extraData?: any,
  /**
   * How many items to render in the initial batch. This should be enough to fill the screen but not
   * much more. Note these items will never be unmounted as part of the windowed rendering in order
   * to improve perceived performance of scroll-to-top actions.
   */
  initialNumToRender: number,
  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks item.key, then
   * falls back to using the index, like react does.
   */
  keyExtractor: (item: Item, index: number) => string,
  /**
   * Called once when the scroll position gets within `onEndReachedThreshold` of the rendered
   * content.
   */
  onEndReached?: ?(info: {distanceFromEnd: number}) => void,
  /**
   * How far from the end (in units of visible length of the list) the bottom edge of the
   * list must be from the end of the content to trigger the `onEndReached` callback.
   * Thus a value of 0.5 will trigger `onEndReached` when the end of the content is
   * within half the visible length of the list.
   */
  onEndReachedThreshold?: ?number,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?() => void,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewabilityConfig` prop.
   */
  onViewableItemsChanged?: ?(info: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
  }) => void,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: ?boolean,
  /**
   * Rendered at the top of each section. Sticky headers are not yet supported.
   */
  renderSectionHeader?: ?(info: {section: SectionT}) => ?React.Element<any>,
  /**
   * Makes section headers stick to the top of the screen until the next one pushes it off. Only
   * enabled by default on iOS because that is the platform standard there.
   */
  stickySectionHeadersEnabled?: boolean,
};

type Props<SectionT> = RequiredProps<SectionT>
  & OptionalProps<SectionT>
  & VirtualizedSectionListProps<SectionT>;

const defaultProps = {
  ...VirtualizedSectionList.defaultProps,
  stickySectionHeadersEnabled: Platform.OS === 'ios',
};

type DefaultProps = typeof defaultProps;

/**
 * A performant interface for rendering sectioned lists, supporting the most handy features:
 *
 *  - Fully cross-platform.
 *  - Configurable viewability callbacks.
 *  - List header support.
 *  - List footer support.
 *  - Item separator support.
 *  - Section header support.
 *  - Section separator support.
 *  - Heterogeneous data and item rendering support.
 *  - Pull to Refresh.
 *  - Scroll loading.
 *
 * If you don't need section support and want a simpler interface, use
 * [`<FlatList>`](/react-native/docs/flatlist.html).
 *
 * If you need _sticky_ section header support, use `ListView` for now.
 *
 * Simple Examples:
 *
 *     <SectionList
 *       renderItem={({item}) => <ListItem title={item.title}}
 *       renderSectionHeader={({section}) => <H1 title={section.key} />}
 *       sections={[ // homogenous rendering between sections
 *         {data: [...], key: ...},
 *         {data: [...], key: ...},
 *         {data: [...], key: ...},
 *       ]}
 *     />
 *
 *     <SectionList
 *       sections={[ // heterogeneous rendering between sections
 *         {data: [...], key: ..., renderItem: ...},
 *         {data: [...], key: ..., renderItem: ...},
 *         {data: [...], key: ..., renderItem: ...},
 *       ]}
 *     />
 *
 * This is a convenience wrapper around [`<VirtualizedList>`](/react-native/docs/virtualizedlist.html),
 * and thus inherits the following caveats:
 *
 * - Internal state is not preserved when content scrolls out of the render window. Make sure all
 *   your data is captured in the item data or external stores like Flux, Redux, or Relay.
 * - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
 *   equal. Make sure that everything your `renderItem` function depends on is passed as a prop that
 *   is not `===` after updates, otherwise your UI may not update on changes. This includes the
 *   `data` prop and parent component state.
 * - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
 *   offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see
 *   blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
 *   and we are working on improving it behind the scenes.
 * - By default, the list looks for a `key` prop on each item and uses that for the React key.
 *   Alternatively, you can provide a custom `keyExtractor` prop.
 */
class SectionList<SectionT: SectionBase<any>>
  extends React.PureComponent<DefaultProps, Props<SectionT>, void>
{
  props: Props<SectionT>;
  static defaultProps: DefaultProps = defaultProps;

  render() {
    const List = this.props.legacyImplementation ? MetroListView : VirtualizedSectionList;
    return <List {...this.props} />;
  }
}

module.exports = SectionList;
