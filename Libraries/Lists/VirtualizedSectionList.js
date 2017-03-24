/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule VirtualizedSectionList
 * @flow
 */
'use strict';

const React = require('React');
const View = require('View');
const VirtualizedList = require('VirtualizedList');

const invariant = require('fbjs/lib/invariant');
const warning = require('fbjs/lib/warning');

import type {ViewToken} from 'ViewabilityHelper';
import type {Props as VirtualizedListProps} from 'VirtualizedList';

type Item = any;
type SectionItem = any;

type SectionBase = {
  // Must be provided directly on each section.
  data: Array<SectionItem>,
  key: string,

  // Optional props will override list-wide props just for this section.
  renderItem?: ?({item: SectionItem, index: number}) => ?React.Element<*>,
  ItemSeparatorComponent?: ?ReactClass<*>,
  keyExtractor?: (item: SectionItem) => string,

  // TODO: support more optional/override props
  // FooterComponent?: ?ReactClass<*>,
  // HeaderComponent?: ?ReactClass<*>,
  // onViewableItemsChanged?: ({viewableItems: Array<ViewToken>, changed: Array<ViewToken>}) => void,
};

type RequiredProps<SectionT: SectionBase> = {
  sections: Array<SectionT>,
};

type OptionalProps<SectionT: SectionBase> = {
  /**
   * Rendered after the last item in the last section.
   */
  ListFooterComponent?: ?ReactClass<*>,
  /**
   * Rendered at the very beginning of the list.
   */
  ListHeaderComponent?: ?ReactClass<*>,
  /**
   * Default renderer for every item in every section.
   */
  renderItem: ({item: Item, index: number}) => ?React.Element<*>,
  /**
   * Rendered at the top of each section.
   */
  renderSectionHeader?: ?({section: SectionT}) => ?React.Element<*>,
  /**
   * Rendered at the bottom of every Section, except the very last one, in place of the normal
   * ItemSeparatorComponent.
   */
  SectionSeparatorComponent?: ?ReactClass<*>,
  /**
   * Rendered at the bottom of every Item except the very last one in the last section.
   */
  ItemSeparatorComponent?: ?ReactClass<*>,
  /**
   * Warning: Virtualization can drastically improve memory consumption for long lists, but trashes
   * the state of items when they scroll out of the render window, so make sure all relavent data is
   * stored outside of the recursive `renderItem` instance tree.
   */
  enableVirtualization?: ?boolean,
  keyExtractor: (item: Item, index: number) => string,
  onEndReached?: ?({distanceFromEnd: number}) => void,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?Function,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewabilityConfig` prop.
   */
  onViewableItemsChanged?: ?({viewableItems: Array<ViewToken>, changed: Array<ViewToken>}) => void,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: ?boolean,
};

export type Props<SectionT> =
  RequiredProps<SectionT> &
  OptionalProps<SectionT> &
  VirtualizedListProps;

type DefaultProps = (typeof VirtualizedList.defaultProps) & {data: Array<Item>};
type State = {childProps: VirtualizedListProps};

/**
 * Right now this just flattens everything into one list and uses VirtualizedList under the
 * hood. The only operation that might not scale well is concatting the data arrays of all the
 * sections when new props are received, which should be plenty fast for up to ~10,000 items.
 */
class VirtualizedSectionList<SectionT: SectionBase>
  extends React.PureComponent<DefaultProps, Props<SectionT>, State>
{
  props: Props<SectionT>;

  state: State;

  static defaultProps: DefaultProps = {
    ...VirtualizedList.defaultProps,
    data: [],
  };

  _keyExtractor = (item: Item, index: number) => {
    const info = this._subExtractor(index);
    return (info && info.key) || String(index);
  };

  _subExtractor(
    index: number,
  ): ?{
    section: SectionT,
    key: string, // Key of the section or combined key for section + item
    index: ?number, // Relative index within the section
  } {
    let itemIndex = index;
    const defaultKeyExtractor = this.props.keyExtractor;
    for (let ii = 0; ii < this.props.sections.length; ii++) {
      const section = this.props.sections[ii];
      const key = section.key;
      warning(
        key != null,
        'VirtualizedSectionList: A `section` you supplied is missing the `key` property.'
      );
      itemIndex -= 1; // The section itself is an item
      if (itemIndex >= section.data.length) {
        itemIndex -= section.data.length;
      } else if (itemIndex === -1) {
        return {section, key, index: null};
      } else {
        const keyExtractor = section.keyExtractor || defaultKeyExtractor;
        return {
          section,
          key: key + ':' + keyExtractor(section.data[itemIndex], itemIndex),
          index: itemIndex,
        };
      }
    }
  }

  _convertViewable = (viewable: ViewToken): ?ViewToken => {
    invariant(viewable.index != null, 'Received a broken ViewToken');
    const info = this._subExtractor(viewable.index);
    if (!info) {
      return null;
    }
    const keyExtractor = info.section.keyExtractor || this.props.keyExtractor;
    return {
      ...viewable,
      index: info.index,
      key: keyExtractor(viewable.item, info.index),
      section: info.section,
    };
  };

  _onViewableItemsChanged = (
    {viewableItems, changed}: {viewableItems: Array<ViewToken>, changed: Array<ViewToken>}
  ) => {
    if (this.props.onViewableItemsChanged) {
      this.props.onViewableItemsChanged({
        viewableItems: viewableItems.map(this._convertViewable, this).filter(Boolean),
        changed: changed.map(this._convertViewable, this).filter(Boolean),
      });
    }
  }

  _renderItem = ({item, index}: {item: Item, index: number}) => {
    const info = this._subExtractor(index);
    if (!info) {
      return null;
    } else if (info.index == null) {
      const {renderSectionHeader} = this.props;
      return renderSectionHeader ? renderSectionHeader({section: info.section}) : null;
    } else {
      const renderItem = info.section.renderItem ||
        this.props.renderItem;
      const SeparatorComponent = this._getSeparatorComponent(index, info);
      invariant(renderItem, 'no renderItem!');
      return (
        <View>
          {renderItem({item, index: info.index || 0})}
          {SeparatorComponent && <SeparatorComponent />}
        </View>
      );
    }
  };

  _getSeparatorComponent(index: number, info?: ?Object): ?ReactClass<*> {
    info = info || this._subExtractor(index);
    if (!info) {
      return null;
    }
    const ItemSeparatorComponent = info.section.ItemSeparatorComponent || this.props.ItemSeparatorComponent;
    const {SectionSeparatorComponent} = this.props;
    const isLastItemInList = index === this.state.childProps.getItemCount() - 1;
    const isLastItemInSection = info.index === info.section.data.length - 1;
    if (SectionSeparatorComponent && isLastItemInSection && !isLastItemInList) {
      return SectionSeparatorComponent;
    }
    if (ItemSeparatorComponent && !isLastItemInSection && !isLastItemInList) {
      return ItemSeparatorComponent;
    }
    return null;
  }

  _computeState(props: Props<SectionT>): State {
    const offset = props.ListHeaderComponent ? 1 : 0;
    const stickyHeaderIndices = [];
    const itemCount = props.sections.reduce(
      (v, section) => {
        stickyHeaderIndices.push(v + offset);
        return v + section.data.length + 1;
      },
      0
    );
    return {
      childProps: {
        ...props,
        renderItem: this._renderItem,
        ItemSeparatorComponent: undefined, // Rendered with renderItem
        data: props.sections,
        getItemCount: () => itemCount,
        getItem,
        keyExtractor: this._keyExtractor,
        onViewableItemsChanged:
          props.onViewableItemsChanged ? this._onViewableItemsChanged : undefined,
        stickyHeaderIndices: props.stickySectionHeadersEnabled ? stickyHeaderIndices : undefined,
      },
    };
  }

  constructor(props: Props<SectionT>, context: Object) {
    super(props, context);
    this.state = this._computeState(props);
  }

  componentWillReceiveProps(nextProps: Props<SectionT>) {
    this.setState(this._computeState(nextProps));
  }

  render() {
    return <VirtualizedList {...this.state.childProps} />;
  }
}

function getItem(sections: ?Array<Item>, index: number): ?Item {
  if (!sections) {
    return null;
  }
  let itemIdx = index - 1;
  for (let ii = 0; ii < sections.length; ii++) {
    if (itemIdx === -1) {
      return sections[ii]; // The section itself is the item
    } else if (itemIdx < sections[ii].data.length) {
      return sections[ii].data[itemIdx];
    } else {
      itemIdx -= (sections[ii].data.length + 1);
    }
  }
  return null;
}

module.exports = VirtualizedSectionList;
