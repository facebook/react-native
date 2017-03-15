/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule SectionList
 * @flow
 */
'use strict';

const MetroListView = require('MetroListView');
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
  SeparatorComponent?: ?ReactClass<any>,
  keyExtractor?: (item: SectionItemT) => string,

  // TODO: support more optional/override props
  // FooterComponent?: ?ReactClass<*>,
  // HeaderComponent?: ?ReactClass<*>,
  // onViewableItemsChanged?: ({viewableItems: Array<ViewToken>, changed: Array<ViewToken>}) => void,
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
   * Rendered at the top of each section. Sticky headers are not yet supported.
   */
  renderSectionHeader?: ?(info: {section: SectionT}) => ?React.Element<any>,
  /**
   * Rendered in between each section.
   */
  SectionSeparatorComponent?: ?ReactClass<any>,
  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks item.key, then
   * falls back to using the index, like react does.
   */
  keyExtractor: (item: Item, index: number) => string,
  onEndReached?: ?(info: {distanceFromEnd: number}) => void,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?() => void,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewabilityConfig` prop.
   */
  onViewableItemsChanged?: ?(info: {viewableItems: Array<ViewToken>, changed: Array<ViewToken>}) => void,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: ?boolean,
  /**
   * This is an optional optimization to minimize re-rendering items.
   */
  shouldItemUpdate: (
    prevProps: {item: Item, index: number},
    nextProps: {item: Item, index: number}
  ) => boolean,
};

type Props<SectionT> = RequiredProps<SectionT>
  & OptionalProps<SectionT>
  & VirtualizedSectionListProps<SectionT>;

type DefaultProps = typeof VirtualizedSectionList.defaultProps;

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
 * If you don't need section support and want a simpler interface, use [`<FlatList>`](/react-native/docs/flatlist.html).
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
  static defaultProps: DefaultProps = VirtualizedSectionList.defaultProps;

  render() {
    const List = this.props.legacyImplementation ? MetroListView : VirtualizedSectionList;
    return <List {...this.props} />;
  }
}

module.exports = SectionList;
