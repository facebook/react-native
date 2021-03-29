/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('react');
const View = require('../Components/View/View');
const VirtualizedList = require('./VirtualizedList');

const invariant = require('invariant');

import type {ViewToken} from './ViewabilityHelper';
import {keyExtractor as defaultKeyExtractor} from './VirtualizeUtils';
import VirtualizedSectionListInjection from './VirtualizedSectionListInjection';

type Item = any;

export type SectionBase<SectionItemT> = {
  /**
   * The data for rendering items in this section.
   */
  data: $ReadOnlyArray<SectionItemT>,
  /**
   * Optional key to keep track of section re-ordering. If you don't plan on re-ordering sections,
   * the array index will be used by default.
   */
  key?: string,
  // Optional props will override list-wide props just for this section.
  renderItem?: ?(info: {
    item: SectionItemT,
    index: number,
    section: SectionBase<SectionItemT>,
    separators: {
      highlight: () => void,
      unhighlight: () => void,
      updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
      ...
    },
    ...
  }) => null | React.Element<any>,
  ItemSeparatorComponent?: ?React.ComponentType<any>,
  keyExtractor?: (item: SectionItemT, index?: ?number) => string,
  ...
};

type RequiredProps<SectionT: SectionBase<any>> = {|
  sections: $ReadOnlyArray<SectionT>,
|};

type OptionalProps<SectionT: SectionBase<any>> = {|
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
      ...
    },
    ...
  }) => null | React.Element<any>,
  /**
   * Rendered at the top of each section. These stick to the top of the `ScrollView` by default on
   * iOS. See `stickySectionHeadersEnabled`.
   */
  renderSectionHeader?: ?(info: {
    section: SectionT,
    ...
  }) => null | React.Element<any>,
  /**
   * Rendered at the bottom of each section.
   */
  renderSectionFooter?: ?(info: {
    section: SectionT,
    ...
  }) => null | React.Element<any>,
  /**
   * Rendered at the top and bottom of each section (note this is different from
   * `ItemSeparatorComponent` which is only rendered between items). These are intended to separate
   * sections from the headers above and below and typically have the same highlight response as
   * `ItemSeparatorComponent`. Also receives `highlighted`, `[leading/trailing][Item/Separator]`,
   * and any custom props from `separators.updateProps`.
   */
  SectionSeparatorComponent?: ?React.ComponentType<any>,
  /**
   * Makes section headers stick to the top of the screen until the next one pushes it off. Only
   * enabled by default on iOS because that is the platform standard there.
   */
  stickySectionHeadersEnabled?: boolean,
  onEndReached?: ?({distanceFromEnd: number, ...}) => void,
|};

type VirtualizedListProps = React.ElementConfig<typeof VirtualizedList>;

export type Props<SectionT> = {|
  ...RequiredProps<SectionT>,
  ...OptionalProps<SectionT>,
  ...$Diff<
    VirtualizedListProps,
    {
      renderItem: $PropertyType<VirtualizedListProps, 'renderItem'>,
      data: $PropertyType<VirtualizedListProps, 'data'>,
      ...
    },
  >,
|};
export type ScrollToLocationParamsType = {|
  animated?: ?boolean,
  itemIndex: number,
  sectionIndex: number,
  viewOffset?: number,
  viewPosition?: number,
|};

type State = {childProps: VirtualizedListProps, ...};

/**
 * Right now this just flattens everything into one list and uses VirtualizedList under the
 * hood. The only operation that might not scale well is concatting the data arrays of all the
 * sections when new props are received, which should be plenty fast for up to ~10,000 items.
 */
class VirtualizedSectionList<
  SectionT: SectionBase<any>,
> extends React.PureComponent<Props<SectionT>, State> {
  scrollToLocation(params: ScrollToLocationParamsType) {
    let index = params.itemIndex;
    for (let i = 0; i < params.sectionIndex; i++) {
      index += this.props.getItemCount(this.props.sections[i].data) + 2;
    }
    let viewOffset = params.viewOffset || 0;
    if (this._listRef == null) {
      return;
    }
    if (params.itemIndex > 0 && this.props.stickySectionHeadersEnabled) {
      // $FlowFixMe[prop-missing] Cannot access private property
      const frame = this._listRef._getFrameMetricsApprox(
        index - params.itemIndex,
      );
      viewOffset += frame.length;
    }
    const toIndexParams = {
      ...params,
      viewOffset,
      index,
    };
    this._listRef.scrollToIndex(toIndexParams);
  }

  getListRef(): ?React.ElementRef<typeof VirtualizedList> {
    return this._listRef;
  }

  render(): React.Node {
    const {
      ItemSeparatorComponent, // don't pass through, rendered with renderItem
      SectionSeparatorComponent,
      renderItem: _renderItem,
      renderSectionFooter,
      renderSectionHeader,
      sections: _sections,
      stickySectionHeadersEnabled,
      ...passThroughProps
    } = this.props;

    const listHeaderOffset = this.props.ListHeaderComponent ? 1 : 0;

    const stickyHeaderIndices = this.props.stickySectionHeadersEnabled
      ? []
      : undefined;

    let itemCount = 0;
    for (const section of this.props.sections) {
      // Track the section header indices
      if (stickyHeaderIndices != null) {
        stickyHeaderIndices.push(itemCount + listHeaderOffset);
      }

      // Add two for the section header and footer.
      itemCount += 2;
      itemCount += this.props.getItemCount(section.data);
    }
    const renderItem = this._renderItem(itemCount);

    return (
      <VirtualizedList
        {...passThroughProps}
        keyExtractor={this._keyExtractor}
        stickyHeaderIndices={stickyHeaderIndices}
        renderItem={renderItem}
        data={this.props.sections}
        getItem={(sections, index) =>
          this._getItem(this.props, sections, index)
        }
        getItemCount={() => itemCount}
        onViewableItemsChanged={
          this.props.onViewableItemsChanged
            ? this._onViewableItemsChanged
            : undefined
        }
        ref={this._captureRef}
      />
    );
  }

  _getItem(
    props: Props<SectionT>,
    sections: ?$ReadOnlyArray<Item>,
    index: number,
  ): ?Item {
    if (!sections) {
      return null;
    }
    let itemIdx = index - 1;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionData = section.data;
      const itemCount = props.getItemCount(sectionData);
      if (itemIdx === -1 || itemIdx === itemCount) {
        // We intend for there to be overflow by one on both ends of the list.
        // This will be for headers and footers. When returning a header or footer
        // item the section itself is the item.
        return section;
      } else if (itemIdx < itemCount) {
        // If we are in the bounds of the list's data then return the item.
        return props.getItem(sectionData, itemIdx);
      } else {
        itemIdx -= itemCount + 2; // Add two for the header and footer
      }
    }
    return null;
  }

  _keyExtractor = (item: Item, index: number) => {
    const info = this._subExtractor(index);
    return (info && info.key) || String(index);
  };

  _subExtractor(
    index: number,
  ): ?{
    section: SectionT,
    // Key of the section or combined key for section + item
    key: string,
    // Relative index within the section
    index: ?number,
    // True if this is the section header
    header?: ?boolean,
    leadingItem?: ?Item,
    leadingSection?: ?SectionT,
    trailingItem?: ?Item,
    trailingSection?: ?SectionT,
    ...
  } {
    let itemIndex = index;
    const {getItem, getItemCount, keyExtractor, sections} = this.props;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionData = section.data;
      const key = section.key || String(i);
      itemIndex -= 1; // The section adds an item for the header
      if (itemIndex >= getItemCount(sectionData) + 1) {
        itemIndex -= getItemCount(sectionData) + 1; // The section adds an item for the footer.
      } else if (itemIndex === -1) {
        return {
          section,
          key: key + ':header',
          index: null,
          header: true,
          trailingSection: sections[i + 1],
        };
      } else if (itemIndex === getItemCount(sectionData)) {
        return {
          section,
          key: key + ':footer',
          index: null,
          header: false,
          trailingSection: sections[i + 1],
        };
      } else {
        const extractor =
          section.keyExtractor || keyExtractor || defaultKeyExtractor;
        return {
          section,
          key:
            key + ':' + extractor(getItem(sectionData, itemIndex), itemIndex),
          index: itemIndex,
          leadingItem: getItem(sectionData, itemIndex - 1),
          leadingSection: sections[i - 1],
          trailingItem: getItem(sectionData, itemIndex + 1),
          trailingSection: sections[i + 1],
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
    const keyExtractorWithNullableIndex = info.section.keyExtractor;
    const keyExtractorWithNonNullableIndex =
      this.props.keyExtractor || defaultKeyExtractor;
    const key =
      keyExtractorWithNullableIndex != null
        ? keyExtractorWithNullableIndex(viewable.item, info.index)
        : keyExtractorWithNonNullableIndex(viewable.item, info.index ?? 0);

    return {
      ...viewable,
      index: info.index,
      key,
      section: info.section,
    };
  };

  _onViewableItemsChanged = ({
    viewableItems,
    changed,
  }: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
    ...
  }) => {
    const onViewableItemsChanged = this.props.onViewableItemsChanged;
    if (onViewableItemsChanged != null) {
      onViewableItemsChanged({
        viewableItems: viewableItems
          .map(this._convertViewable, this)
          .filter(Boolean),
        changed: changed.map(this._convertViewable, this).filter(Boolean),
      });
    }
  };

  _renderItem = (listItemCount: number) => ({
    item,
    index,
  }: {
    item: Item,
    index: number,
    ...
  }) => {
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
      const SeparatorComponent = this._getSeparatorComponent(
        index,
        info,
        listItemCount,
      );
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
          inverted={!!this.props.inverted}
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
    listItemCount: number,
  ): ?React.ComponentType<any> {
    info = info || this._subExtractor(index);
    if (!info) {
      return null;
    }
    const ItemSeparatorComponent =
      info.section.ItemSeparatorComponent || this.props.ItemSeparatorComponent;
    const {SectionSeparatorComponent} = this.props;
    const isLastItemInList = index === listItemCount - 1;
    const isLastItemInSection =
      info.index === this.props.getItemCount(info.section.data) - 1;
    if (SectionSeparatorComponent && isLastItemInSection) {
      return SectionSeparatorComponent;
    }
    if (ItemSeparatorComponent && !isLastItemInSection && !isLastItemInList) {
      return ItemSeparatorComponent;
    }
    return null;
  }

  _cellRefs = {};
  _listRef: ?React.ElementRef<typeof VirtualizedList>;
  _captureRef = ref => {
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
  inverted: boolean,
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
  ...
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
      inverted,
    } = this.props;
    const element = this.props.renderItem({
      item,
      index,
      section,
      separators: this._separators,
    });
    const leadingSeparator = LeadingSeparatorComponent != null && (
      <LeadingSeparatorComponent {...this.state.leadingSeparatorProps} />
    );
    const separator = SeparatorComponent != null && (
      <SeparatorComponent {...this.state.separatorProps} />
    );
    return leadingSeparator || separator ? (
      <View>
        {inverted === false ? leadingSeparator : separator}
        {element}
        {inverted === false ? separator : leadingSeparator}
      </View>
    ) : (
      element
    );
  }
}

const VSLToExport: React.AbstractComponent<
  React.ElementConfig<typeof VirtualizedSectionList>,
  $ReadOnly<{
    getListRef: () => ?React.ElementRef<typeof VirtualizedList>,
    scrollToLocation: (params: ScrollToLocationParamsType) => void,
    ...
  }>,
> = VirtualizedSectionListInjection.unstable_VSL ?? VirtualizedSectionList;
module.exports = VSLToExport;
