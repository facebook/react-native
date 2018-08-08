/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const React = require('React');
const View = require('View');
const VirtualizedList = require('VirtualizedList');

const invariant = require('fbjs/lib/invariant');

import type {ViewToken} from 'ViewabilityHelper';
import type {Props as VirtualizedListProps} from 'VirtualizedList';

type Item = any;
type SectionItem = any;

type SectionBase = {
  // Must be provided directly on each section.
  data: $ReadOnlyArray<SectionItem>,
  key?: string,

  // Optional props will override list-wide props just for this section.
  renderItem?: ?({
    item: SectionItem,
    index: number,
    section: SectionBase,
    separators: {
      highlight: () => void,
      unhighlight: () => void,
      updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
    },
  }) => ?React.Element<any>,
  ItemSeparatorComponent?: ?React.ComponentType<any>,
  keyExtractor?: (item: SectionItem, index: ?number) => string,

  // TODO: support more optional/override props
  // FooterComponent?: ?ReactClass<any>,
  // HeaderComponent?: ?ReactClass<any>,
  // onViewableItemsChanged?: ({viewableItems: Array<ViewToken>, changed: Array<ViewToken>}) => void,
};

type RequiredProps<SectionT: SectionBase> = {
  sections: $ReadOnlyArray<SectionT>,
};

type OptionalProps<SectionT: SectionBase> = {
  /**
   * Rendered after the last item in the last section.
   */
  ListFooterComponent?: ?(React.ComponentType<any> | React.Element<any>),
  /**
   * Rendered at the very beginning of the list.
   */
  ListHeaderComponent?: ?(React.ComponentType<any> | React.Element<any>),
  /**
   * Default renderer for every item in every section.
   */
  renderItem?: (info: {
    item: Item,
    index: number,
    section: SectionT,
    separators: {
      highlight: () => void,
      unhighlight: () => void,
      updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
    },
  }) => ?React.Element<any>,
  /**
   * Rendered at the top of each section.
   */
  renderSectionHeader?: ?({section: SectionT}) => ?React.Element<any>,
  /**
   * Rendered at the bottom of each section.
   */
  renderSectionFooter?: ?({section: SectionT}) => ?React.Element<any>,
  /**
   * Rendered at the bottom of every Section, except the very last one, in place of the normal
   * ItemSeparatorComponent.
   */
  SectionSeparatorComponent?: ?React.ComponentType<any>,
  /**
   * Rendered at the bottom of every Item except the very last one in the last section.
   */
  ItemSeparatorComponent?: ?React.ComponentType<any>,
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
  onRefresh?: ?() => void,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewabilityConfig` prop.
   */
  onViewableItemsChanged?: ?({
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
  }) => void,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: ?boolean,
};

export type Props<SectionT> = RequiredProps<SectionT> &
  OptionalProps<SectionT> &
  VirtualizedListProps;

type DefaultProps = typeof VirtualizedList.defaultProps & {
  data: $ReadOnlyArray<Item>,
};
type State = {childProps: VirtualizedListProps};

/**
 * Right now this just flattens everything into one list and uses VirtualizedList under the
 * hood. The only operation that might not scale well is concatting the data arrays of all the
 * sections when new props are received, which should be plenty fast for up to ~10,000 items.
 */
class VirtualizedSectionList<SectionT: SectionBase> extends React.PureComponent<
  Props<SectionT>,
  State,
> {
  static defaultProps: DefaultProps = {
    ...VirtualizedList.defaultProps,
    data: [],
  };

  scrollToLocation(params: {
    animated?: ?boolean,
    itemIndex: number,
    sectionIndex: number,
    viewPosition?: number,
  }) {
    let index = params.itemIndex + 1;
    for (let ii = 0; ii < params.sectionIndex; ii++) {
      index += this.props.sections[ii].data.length + 2;
    }
    const toIndexParams = {
      ...params,
      index,
    };
    this._listRef.scrollToIndex(toIndexParams);
  }

  getListRef(): VirtualizedList {
    return this._listRef;
  }

  constructor(props: Props<SectionT>, context: Object) {
    super(props, context);
    this.state = this._computeState(props);
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props<SectionT>) {
    this.setState(this._computeState(nextProps));
  }

  _computeState(props: Props<SectionT>): State {
    const offset = props.ListHeaderComponent ? 1 : 0;
    const stickyHeaderIndices = [];
    const itemCount = props.sections.reduce((v, section) => {
      stickyHeaderIndices.push(v + offset);
      return v + section.data.length + 2; // Add two for the section header and footer.
    }, 0);

    return {
      childProps: {
        ...props,
        renderItem: this._renderItem,
        ItemSeparatorComponent: undefined, // Rendered with renderItem
        data: props.sections,
        getItemCount: () => itemCount,
        getItem,
        keyExtractor: this._keyExtractor,
        onViewableItemsChanged: props.onViewableItemsChanged
          ? this._onViewableItemsChanged
          : undefined,
        stickyHeaderIndices: props.stickySectionHeadersEnabled
          ? stickyHeaderIndices
          : undefined,
      },
    };
  }

  render() {
    return (
      <VirtualizedList {...this.state.childProps} ref={this._captureRef} />
    );
  }

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
    header?: ?boolean, // True if this is the section header
    leadingItem?: ?Item,
    leadingSection?: ?SectionT,
    trailingItem?: ?Item,
    trailingSection?: ?SectionT,
  } {
    let itemIndex = index;
    const defaultKeyExtractor = this.props.keyExtractor;
    for (let ii = 0; ii < this.props.sections.length; ii++) {
      const section = this.props.sections[ii];
      const key = section.key || String(ii);
      itemIndex -= 1; // The section adds an item for the header
      if (itemIndex >= section.data.length + 1) {
        itemIndex -= section.data.length + 1; // The section adds an item for the footer.
      } else if (itemIndex === -1) {
        return {
          section,
          key: key + ':header',
          index: null,
          header: true,
          trailingSection: this.props.sections[ii + 1],
        };
      } else if (itemIndex === section.data.length) {
        return {
          section,
          key: key + ':footer',
          index: null,
          header: false,
          trailingSection: this.props.sections[ii + 1],
        };
      } else {
        const keyExtractor = section.keyExtractor || defaultKeyExtractor;
        return {
          section,
          key: key + ':' + keyExtractor(section.data[itemIndex], itemIndex),
          index: itemIndex,
          leadingItem: section.data[itemIndex - 1],
          leadingSection: this.props.sections[ii - 1],
          trailingItem: section.data[itemIndex + 1],
          trailingSection: this.props.sections[ii + 1],
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
      /* $FlowFixMe(>=0.63.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.63 was deployed. To see the error delete this
       * comment and run Flow. */
      key: keyExtractor(viewable.item, info.index),
      section: info.section,
    };
  };

  _onViewableItemsChanged = ({
    viewableItems,
    changed,
  }: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
  }) => {
    if (this.props.onViewableItemsChanged) {
      this.props.onViewableItemsChanged({
        viewableItems: viewableItems
          .map(this._convertViewable, this)
          .filter(Boolean),
        changed: changed.map(this._convertViewable, this).filter(Boolean),
      });
    }
  };

  _renderItem = ({item, index}: {item: Item, index: number}) => {
    const info = this._subExtractor(index);
    if (!info) {
      return null;
    }
    const infoIndex = info.index;
    if (infoIndex == null) {
      const {section} = info;
      if (info.header === true) {
        const {renderSectionHeader} = this.props;
        return renderSectionHeader ? renderSectionHeader({section}) : null;
      } else {
        const {renderSectionFooter} = this.props;
        return renderSectionFooter ? renderSectionFooter({section}) : null;
      }
    } else {
      const renderItem = info.section.renderItem || this.props.renderItem;
      const SeparatorComponent = this._getSeparatorComponent(index, info);
      invariant(renderItem, 'no renderItem!');
      return (
        <ItemWithSeparator
          SeparatorComponent={SeparatorComponent}
          LeadingSeparatorComponent={
            infoIndex === 0 ? this.props.SectionSeparatorComponent : undefined
          }
          cellKey={info.key}
          index={infoIndex}
          item={item}
          leadingItem={info.leadingItem}
          leadingSection={info.leadingSection}
          onUpdateSeparator={this._onUpdateSeparator}
          prevCellKey={(this._subExtractor(index - 1) || {}).key}
          ref={ref => {
            this._cellRefs[info.key] = ref;
          }}
          renderItem={renderItem}
          section={info.section}
          trailingItem={info.trailingItem}
          trailingSection={info.trailingSection}
        />
      );
    }
  };

  _onUpdateSeparator = (key: string, newProps: Object) => {
    const ref = this._cellRefs[key];
    ref && ref.updateSeparatorProps(newProps);
  };

  _getSeparatorComponent(
    index: number,
    info?: ?Object,
  ): ?React.ComponentType<any> {
    info = info || this._subExtractor(index);
    if (!info) {
      return null;
    }
    const ItemSeparatorComponent =
      info.section.ItemSeparatorComponent || this.props.ItemSeparatorComponent;
    const {SectionSeparatorComponent} = this.props;
    const isLastItemInList = index === this.state.childProps.getItemCount() - 1;
    const isLastItemInSection = info.index === info.section.data.length - 1;
    if (SectionSeparatorComponent && isLastItemInSection) {
      return SectionSeparatorComponent;
    }
    if (ItemSeparatorComponent && !isLastItemInSection && !isLastItemInList) {
      return ItemSeparatorComponent;
    }
    return null;
  }

  _cellRefs = {};
  _listRef: VirtualizedList;
  _captureRef = ref => {
    /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error when upgrading Flow's support for React. To see the
     * error delete this comment and run Flow. */
    this._listRef = ref;
  };
}

type ItemWithSeparatorCommonProps = $ReadOnly<{|
  leadingItem: ?Item,
  leadingSection: ?Object,
  section: Object,
  trailingItem: ?Item,
  trailingSection: ?Object,
|}>;

type ItemWithSeparatorProps = $ReadOnly<{|
  ...ItemWithSeparatorCommonProps,
  LeadingSeparatorComponent: ?React.ComponentType<any>,
  SeparatorComponent: ?React.ComponentType<any>,
  cellKey: string,
  index: number,
  item: Item,
  onUpdateSeparator: (cellKey: string, newProps: Object) => void,
  prevCellKey?: ?string,
  renderItem: Function,
|}>;

type ItemWithSeparatorState = {
  separatorProps: $ReadOnly<{|
    highlighted: false,
    ...ItemWithSeparatorCommonProps,
  |}>,
  leadingSeparatorProps: $ReadOnly<{|
    highlighted: false,
    ...ItemWithSeparatorCommonProps,
  |}>,
};

class ItemWithSeparator extends React.Component<
  ItemWithSeparatorProps,
  ItemWithSeparatorState,
> {
  state = {
    separatorProps: {
      highlighted: false,
      leadingItem: this.props.item,
      leadingSection: this.props.leadingSection,
      section: this.props.section,
      trailingItem: this.props.trailingItem,
      trailingSection: this.props.trailingSection,
    },
    leadingSeparatorProps: {
      highlighted: false,
      leadingItem: this.props.leadingItem,
      leadingSection: this.props.leadingSection,
      section: this.props.section,
      trailingItem: this.props.item,
      trailingSection: this.props.trailingSection,
    },
  };

  _separators = {
    highlight: () => {
      ['leading', 'trailing'].forEach(s =>
        this._separators.updateProps(s, {highlighted: true}),
      );
    },
    unhighlight: () => {
      ['leading', 'trailing'].forEach(s =>
        this._separators.updateProps(s, {highlighted: false}),
      );
    },
    updateProps: (select: 'leading' | 'trailing', newProps: Object) => {
      const {LeadingSeparatorComponent, cellKey, prevCellKey} = this.props;
      if (select === 'leading' && LeadingSeparatorComponent != null) {
        this.setState(state => ({
          leadingSeparatorProps: {...state.leadingSeparatorProps, ...newProps},
        }));
      } else {
        this.props.onUpdateSeparator(
          (select === 'leading' && prevCellKey) || cellKey,
          newProps,
        );
      }
    },
  };

  static getDerivedStateFromProps(
    props: ItemWithSeparatorProps,
    prevState: ItemWithSeparatorState,
  ): ?ItemWithSeparatorState {
    return {
      separatorProps: {
        ...prevState.separatorProps,
        leadingItem: props.item,
        leadingSection: props.leadingSection,
        section: props.section,
        trailingItem: props.trailingItem,
        trailingSection: props.trailingSection,
      },
      leadingSeparatorProps: {
        ...prevState.leadingSeparatorProps,
        leadingItem: props.leadingItem,
        leadingSection: props.leadingSection,
        section: props.section,
        trailingItem: props.item,
        trailingSection: props.trailingSection,
      },
    };
  }

  updateSeparatorProps(newProps: Object) {
    this.setState(state => ({
      separatorProps: {...state.separatorProps, ...newProps},
    }));
  }

  render() {
    const {
      LeadingSeparatorComponent,
      SeparatorComponent,
      item,
      index,
      section,
    } = this.props;
    const element = this.props.renderItem({
      item,
      index,
      section,
      separators: this._separators,
    });
    const leadingSeparator = LeadingSeparatorComponent && (
      <LeadingSeparatorComponent {...this.state.leadingSeparatorProps} />
    );
    const separator = SeparatorComponent && (
      <SeparatorComponent {...this.state.separatorProps} />
    );
    return leadingSeparator || separator ? (
      <View>
        {leadingSeparator}
        {element}
        {separator}
      </View>
    ) : (
      element
    );
  }
}

function getItem(sections: ?$ReadOnlyArray<Item>, index: number): ?Item {
  if (!sections) {
    return null;
  }
  let itemIdx = index - 1;
  for (let ii = 0; ii < sections.length; ii++) {
    if (itemIdx === -1 || itemIdx === sections[ii].data.length) {
      // We intend for there to be overflow by one on both ends of the list.
      // This will be for headers and footers. When returning a header or footer
      // item the section itself is the item.
      return sections[ii];
    } else if (itemIdx < sections[ii].data.length) {
      // If we are in the bounds of the list's data then return the item.
      return sections[ii].data[itemIdx];
    } else {
      itemIdx -= sections[ii].data.length + 2; // Add two for the header and footer
    }
  }
  return null;
}

module.exports = VirtualizedSectionList;
