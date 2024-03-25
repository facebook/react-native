/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {ScrollResponderType} from '../Components/ScrollView/ScrollView';
import type {
  ScrollToLocationParamsType,
  SectionBase as _SectionBase,
  VirtualizedSectionListProps,
} from '@react-native/virtualized-lists';

import Platform from '../Utilities/Platform';
import {VirtualizedSectionList} from '@react-native/virtualized-lists';
import * as React from 'react';

type Item = any;

export type SectionBase<SectionItemT> = _SectionBase<SectionItemT>;

type RequiredProps<SectionT: SectionBase<any>> = {|
  /**
   * The actual data to render, akin to the `data` prop in [`<FlatList>`](https://reactnative.dev/docs/flatlist).
   *
   * General shape:
   *
   *     sections: $ReadOnlyArray<{
   *       data: $ReadOnlyArray<SectionItem>,
   *       renderItem?: ({item: SectionItem, ...}) => ?React.Element<*>,
   *       ItemSeparatorComponent?: ?ReactClass<{highlighted: boolean, ...}>,
   *     }>
   */
  sections: $ReadOnlyArray<SectionT>,
|};

type OptionalProps<SectionT: SectionBase<any>> = {|
  /**
   * Default renderer for every item in every section. Can be over-ridden on a per-section basis.
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
  initialNumToRender?: ?number,
  /**
   * Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: ?boolean,
  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks item.key, then
   * falls back to using the index, like react does. Note that this sets keys for each item, but
   * each overall section still needs its own key.
   */
  keyExtractor?: ?(item: Item, index: number) => string,
  /**
   * Called once when the scroll position gets within `onEndReachedThreshold` of the rendered
   * content.
   */
  onEndReached?: ?(info: {distanceFromEnd: number, ...}) => void,
  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
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
      keyExtractor: $PropertyType<
        VirtualizedSectionListProps<SectionT>,
        'keyExtractor',
      >,
      ...
    },
  >,
  ...RequiredProps<SectionT>,
  ...OptionalProps<SectionT>,
|};

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
 * [`<FlatList>`](https://reactnative.dev/docs/flatlist).
 *
 * Simple Examples:
 *
 *     <SectionList
 *       renderItem={({item}) => <ListItem title={item} />}
 *       renderSectionHeader={({section}) => <Header title={section.title} />}
 *       sections={[ // homogeneous rendering between sections
 *         {data: [...], title: ...},
 *         {data: [...], title: ...},
 *         {data: [...], title: ...},
 *       ]}
 *     />
 *
 *     <SectionList
 *       sections={[ // heterogeneous rendering between sections
 *         {data: [...], renderItem: ...},
 *         {data: [...], renderItem: ...},
 *         {data: [...], renderItem: ...},
 *       ]}
 *     />
 *
 * This is a convenience wrapper around [`<VirtualizedList>`](docs/virtualizedlist),
 * and thus inherits its props (as well as those of `ScrollView`) that aren't explicitly listed
 * here, along with the following caveats:
 *
 * - Internal state is not preserved when content scrolls out of the render window. Make sure all
 *   your data is captured in the item data or external stores like Flux, Redux, or Relay.
 * - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
 *   equal. Make sure that everything your `renderItem` function depends on is passed as a prop
 *   (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on
 *   changes. This includes the `data` prop and parent component state.
 * - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
 *   offscreen. This means it's possible to scroll faster than the fill rate and momentarily see
 *   blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
 *   and we are working on improving it behind the scenes.
 * - By default, the list looks for a `key` prop on each item and uses that for the React key.
 *   Alternatively, you can provide a custom `keyExtractor` prop.
 *
 */
export default class SectionList<
  SectionT: SectionBase<any>,
> extends React.PureComponent<Props<SectionT>, void> {
  props: Props<SectionT>;

  /**
   * Scrolls to the item at the specified `sectionIndex` and `itemIndex` (within the section)
   * positioned in the viewable area such that `viewPosition` 0 places it at the top (and may be
   * covered by a sticky header), 1 at the bottom, and 0.5 centered in the middle. `viewOffset` is a
   * fixed number of pixels to offset the final target position, e.g. to compensate for sticky
   * headers.
   *
   * Note: cannot scroll to locations outside the render window without specifying the
   * `getItemLayout` prop.
   */
  scrollToLocation(params: ScrollToLocationParamsType) {
    if (this._wrapperListRef != null) {
      this._wrapperListRef.scrollToLocation(params);
    }
  }

  /**
   * Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
   * if `waitForInteractions` is true and the user has not scrolled. This is typically called by
   * taps on items or by navigation actions.
   */
  recordInteraction() {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    listRef && listRef.recordInteraction();
  }

  /**
   * Displays the scroll indicators momentarily.
   *
   * @platform ios
   */
  flashScrollIndicators() {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    listRef && listRef.flashScrollIndicators();
  }

  /**
   * Provides a handle to the underlying scroll responder.
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
    const {
      stickySectionHeadersEnabled: _stickySectionHeadersEnabled,
      ...restProps
    } = this.props;
    const stickySectionHeadersEnabled =
      _stickySectionHeadersEnabled ?? Platform.OS === 'ios';
    return (
      /* $FlowFixMe[incompatible-type] Error revealed after improved builtin
       * React utility types */
      /* $FlowFixMe[incompatible-type] Error revealed after improved builtin
       * React utility types */
      <VirtualizedSectionList
        {...restProps}
        stickySectionHeadersEnabled={stickySectionHeadersEnabled}
        ref={this._captureRef}
        // $FlowFixMe[missing-local-annot]
        getItemCount={items => items.length}
        // $FlowFixMe[missing-local-annot]
        getItem={(items, index) => items[index]}
      />
    );
  }

  _wrapperListRef: ?React.ElementRef<typeof VirtualizedSectionList>;
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  _captureRef = ref => {
    this._wrapperListRef = ref;
  };
}
