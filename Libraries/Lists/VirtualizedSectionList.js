/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const Platform = require('../Utilities/Platform'); // TODO(macOS GH#774)
import invariant from 'invariant';
import type {ViewToken} from './ViewabilityHelper';
import type {SelectedRowIndexPathType} from './VirtualizedList'; // TODO(macOS GH#774)
import type {KeyEvent} from '../Types/CoreEventTypes'; // TODO(macOS GH#774)
import {keyExtractor as defaultKeyExtractor} from './VirtualizeUtils';
import {View, VirtualizedList} from 'react-native';
import * as React from 'react';

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
    // isSelected?: boolean, // TODO(macOS GH#774)
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
   * Handles key down events and updates selection based on the key event
   *
   * @platform macos
   */
  enableSelectionOnKeyPress?: ?boolean, // TODO(macOS GH#774)
  /**
   * Default renderer for every item in every section.
   */
  renderItem?: (info: {
    item: Item,
    index: number,
    isSelected?: boolean, // TODO(macOS GH#774)
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
  /**
   * If provided, processes key press and mouse click events to update selection state
   * and invokes the provided function to notify of selection state changes.
   *
   * @platform macos
   */
  onSelectionChanged?: ?(info: {
    previousSelection: Object,
    newSelection: Object,
    item: ?Item,
  }) => void, // TODO(macOS GH#774)
  /**
   * If provided, called when 'Enter' key is pressed on an item.
   *
   * @platform macos
   */
  onSelectionEntered?: ?(item: ?Item) => void, // TODO(macOS GH#774)
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

// TODO(macOS GH#774)
type State = {
  selectedRowIndexPath: SelectedRowIndexPathType,
  ...
};

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

  // TODO(macOS GH#774)
  constructor(props: Props<SectionT>, context: Object) {
    super(props, context);
    this.state = {
      selectedRowIndexPath: {sectionIndex: 0, rowIndex: -1},
    };
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
        {...this.state.selectedRowIndexPath} // TODO(macOS GH#774)
        ref={this._captureRef}
      />
    );
  }

  // [TODO(macOS GH#774)
  _selectRowAboveIndexPath = rowIndexPath => {
    let sectionIndex = rowIndexPath.sectionIndex;
    if (sectionIndex >= this.props.sections.length) {
      return rowIndexPath;
    }

    let row = rowIndexPath.rowIndex;
    let rowAbove = row - 1;

    if (rowAbove < 0) {
      if (sectionIndex > 0) {
        sectionIndex = sectionIndex - 1;
        rowAbove = Math.max(
          0,
          this.props.sections[sectionIndex].data.length - 1,
        );
      } else {
        rowAbove = row;
      }
    }
    const nextIndexPath = {sectionIndex: sectionIndex, rowIndex: rowAbove};
    this.setState(state => {
      return {selectedRowIndexPath: nextIndexPath};
    });
    return nextIndexPath;
  };

  _selectRowBelowIndexPath = rowIndexPath => {
    let sectionIndex = rowIndexPath.sectionIndex;
    if (sectionIndex >= this.props.sections.length) {
      return rowIndexPath;
    }

    const count = this.props.sections[sectionIndex].data.length;
    let row = rowIndexPath.rowIndex;
    let rowBelow = row + 1;

    if (rowBelow > count - 1) {
      if (sectionIndex < this.props.sections.length - 1) {
        sectionIndex = sectionIndex + 1;
        rowBelow = 0;
      } else {
        rowBelow = row;
      }
    }
    const nextIndexPath = {sectionIndex: sectionIndex, rowIndex: rowBelow};
    this.setState(state => {
      return {selectedRowIndexPath: nextIndexPath};
    });
    return nextIndexPath;
  };

  _ensureItemAtIndexPathIsVisible = rowIndexPath => {
    if (this._listRef) {
      let index = rowIndexPath.rowIndex + 1;
      for (let ii = 0; ii < rowIndexPath.sectionIndex; ii++) {
        index += this.props.sections[ii].data.length + 2;
      }
      this._listRef.ensureItemAtIndexIsVisible(index);
    }
  };

  _handleKeyDown = (e: KeyEvent) => {
    if (Platform.OS === 'macos') {
      if (e.defaultPrevented) {
        return;
      }

      const event = e.nativeEvent;
      const key = event.key;
      let prevIndexPath = this.state.selectedRowIndexPath;
      let nextIndexPath = null;
      const sectionIndex = this.state.selectedRowIndexPath.sectionIndex;
      const rowIndex = this.state.selectedRowIndexPath.rowIndex;

      if (key === 'ArrowDown') {
        nextIndexPath = this._selectRowBelowIndexPath(prevIndexPath);
        this._ensureItemAtIndexPathIsVisible(nextIndexPath);

        if (this.props.onSelectionChanged) {
          const item = this.props.sections[sectionIndex].data[rowIndex];
          this.props.onSelectionChanged({
            previousSelection: prevIndexPath,
            newSelection: nextIndexPath,
            item: item,
          });
        }
      } else if (key === 'ArrowUp') {
        nextIndexPath = this._selectRowAboveIndexPath(prevIndexPath);
        this._ensureItemAtIndexPathIsVisible(nextIndexPath);

        if (this.props.onSelectionChanged) {
          const item = this.props.sections[sectionIndex].data[rowIndex];
          this.props.onSelectionChanged({
            previousSelection: prevIndexPath,
            newSelection: nextIndexPath,
            item: item,
          });
        }
      } else if (key === 'Enter') {
        if (this.props.onSelectionEntered) {
          const item = this.props.sections[sectionIndex].data[rowIndex];
          this.props.onSelectionEntered(item);
        }
      }
    }
  }; // ]TODO(macOS GH#774)

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

  _subExtractor(index: number): ?{
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

  // [TODO(macOS GH#774)
  _isItemSelected = (item: Item): boolean => {
    let isSelected = false;
    if (this.state.selectedRowIndexPath) {
      const selection = this.state.selectedRowIndexPath;
      const sections = this.props.sections;
      if (sections && selection.sectionIndex < sections.length) {
        const section = sections[selection.sectionIndex];
        if (selection.rowIndex < section.data.length) {
          const selectedItem = section.data[selection.rowIndex];
          isSelected = item === selectedItem;
        }
      }
    }
    return isSelected;
  };
  // ]TODO(macOS GH#774)

  _renderItem =
    (listItemCount: number) =>
    ({item, index}: {item: Item, index: number, ...}) => {
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
            isSelected={this._isItemSelected(item)} // TODO(macOS GH#774)
            item={item}
            leadingItem={info.leadingItem}
            leadingSection={info.leadingSection}
            prevCellKey={(this._subExtractor(index - 1) || {}).key}
            // Callback to provide updateHighlight for this item
            setSelfHighlightCallback={this._setUpdateHighlightFor}
            setSelfUpdatePropsCallback={this._setUpdatePropsFor}
            // Provide child ability to set highlight/updateProps for previous item using prevCellKey
            updateHighlightFor={this._updateHighlightFor}
            updatePropsFor={this._updatePropsFor}
            renderItem={renderItem}
            section={info.section}
            trailingItem={info.trailingItem}
            trailingSection={info.trailingSection}
            inverted={!!this.props.inverted}
          />
        );
      }
    };

  _updatePropsFor = (cellKey, value) => {
    const updateProps = this._updatePropsMap[cellKey];
    if (updateProps != null) {
      updateProps(value);
    }
  };

  _updateHighlightFor = (cellKey, value) => {
    const updateHighlight = this._updateHighlightMap[cellKey];
    if (updateHighlight != null) {
      updateHighlight(value);
    }
  };

  _setUpdateHighlightFor = (cellKey, updateHighlightFn) => {
    if (updateHighlightFn != null) {
      this._updateHighlightMap[cellKey] = updateHighlightFn;
    } else {
      delete this._updateHighlightFor[cellKey];
    }
  };

  _setUpdatePropsFor = (cellKey, updatePropsFn) => {
    if (updatePropsFn != null) {
      this._updatePropsMap[cellKey] = updatePropsFn;
    } else {
      delete this._updatePropsMap[cellKey];
    }
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

  _updateHighlightMap = {};
  _updatePropsMap = {};
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
  isSelected: boolean, // TODO(macOS GH#774)
  setSelfHighlightCallback: (
    cellKey: string,
    updateFn: ?(boolean) => void,
  ) => void,
  setSelfUpdatePropsCallback: (
    cellKey: string,
    updateFn: ?(boolean) => void,
  ) => void,
  prevCellKey?: ?string,
  updateHighlightFor: (prevCellKey: string, value: boolean) => void,
  updatePropsFor: (prevCellKey: string, value: Object) => void,
  renderItem: Function,
  inverted: boolean,
|}>;

function ItemWithSeparator(props: ItemWithSeparatorProps): React.Node {
  const {
    LeadingSeparatorComponent,
    // this is the trailing separator and is associated with this item
    SeparatorComponent,
    cellKey,
    prevCellKey,
    setSelfHighlightCallback,
    updateHighlightFor,
    setSelfUpdatePropsCallback,
    updatePropsFor,
    item,
    isSelected, // TODO(macOS GH#774)
    index,
    section,
    inverted,
  } = props;

  const [leadingSeparatorHiglighted, setLeadingSeparatorHighlighted] =
    React.useState(false);

  const [separatorHighlighted, setSeparatorHighlighted] = React.useState(false);

  const [leadingSeparatorProps, setLeadingSeparatorProps] = React.useState({
    leadingItem: props.leadingItem,
    leadingSection: props.leadingSection,
    section: props.section,
    trailingItem: props.item,
    trailingSection: props.trailingSection,
  });
  const [separatorProps, setSeparatorProps] = React.useState({
    leadingItem: props.item,
    leadingSection: props.leadingSection,
    section: props.section,
    trailingItem: props.trailingItem,
    trailingSection: props.trailingSection,
  });

  React.useEffect(() => {
    setSelfHighlightCallback(cellKey, setSeparatorHighlighted);
    setSelfUpdatePropsCallback(cellKey, setSeparatorProps);

    return () => {
      setSelfUpdatePropsCallback(cellKey, null);
      setSelfHighlightCallback(cellKey, null);
    };
  }, [
    cellKey,
    setSelfHighlightCallback,
    setSeparatorProps,
    setSelfUpdatePropsCallback,
  ]);

  const separators = {
    highlight: () => {
      setLeadingSeparatorHighlighted(true);
      setSeparatorHighlighted(true);
      if (prevCellKey != null) {
        updateHighlightFor(prevCellKey, true);
      }
    },
    unhighlight: () => {
      setLeadingSeparatorHighlighted(false);
      setSeparatorHighlighted(false);
      if (prevCellKey != null) {
        updateHighlightFor(prevCellKey, false);
      }
    },
    updateProps: (
      select: 'leading' | 'trailing',
      newProps: $Shape<ItemWithSeparatorCommonProps>,
    ) => {
      if (select === 'leading') {
        if (LeadingSeparatorComponent != null) {
          setLeadingSeparatorProps({...leadingSeparatorProps, ...newProps});
        } else if (prevCellKey != null) {
          // update the previous item's separator
          updatePropsFor(prevCellKey, {...leadingSeparatorProps, ...newProps});
        }
      } else if (select === 'trailing' && SeparatorComponent != null) {
        setSeparatorProps({...separatorProps, ...newProps});
      }
    },
  };
  const element = props.renderItem({
    item,
    index,
    isSelected, // TODO(macOS GH#774)
    section,
    separators,
  });
  const leadingSeparator = LeadingSeparatorComponent != null && (
    <LeadingSeparatorComponent
      highlighted={leadingSeparatorHiglighted}
      {...leadingSeparatorProps}
    />
  );
  const separator = SeparatorComponent != null && (
    <SeparatorComponent
      highlighted={separatorHighlighted}
      {...separatorProps}
    />
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

/* $FlowFixMe[class-object-subtyping] added when improving typing for this
 * parameters */
// $FlowFixMe[method-unbinding]
module.exports = (VirtualizedSectionList: React.AbstractComponent<
  React.ElementConfig<typeof VirtualizedSectionList>,
  $ReadOnly<{
    getListRef: () => ?React.ElementRef<typeof VirtualizedList>,
    scrollToLocation: (params: ScrollToLocationParamsType) => void,
    ...
  }>,
>);
