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
const Platform = require('../Utilities/Platform'); // TODO(macOS ISS#2323203)

const invariant = require('invariant');

import type {ViewToken} from './ViewabilityHelper';
import type {
  Props as VirtualizedListProps,
  SelectedRowIndexPathType, // TODO(macOS ISS#2323203)
} from './VirtualizedList';
import type {ScrollEvent} from '../Types/CoreEventTypes'; // TODO(macOS ISS#2323203)

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
    isSelected?: boolean, // TODO(macOS ISS#2323203)
    section: SectionBase<SectionItemT>,
    separators: {
      highlight: () => void,
      unhighlight: () => void,
      updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
    },
  }) => ?React.Element<any>,
  ItemSeparatorComponent?: ?React.ComponentType<any>,
  keyExtractor?: (item: SectionItemT, index?: ?number) => string,
};

type RequiredProps<SectionT: SectionBase<any>> = {
  sections: $ReadOnlyArray<SectionT>,
};

type OptionalProps<SectionT: SectionBase<any>> = {
  /**
   * Handles key down events and updates selection based on the key event
   *
   * @platform macos
   */
  enableSelectionOnKeyPress?: ?boolean, // TODO(macOS ISS#2323203)
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
    isSelected?: boolean, // TODO(macOS ISS#2323203)
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
   * DEPRECATED: Virtualization provides significant performance and memory optimizations, but fully
   * unmounts react instances that are outside of the render window. You should only need to disable
   * this for debugging purposes.
   */
  disableVirtualization?: ?boolean,
  keyExtractor: (item: Item, index: number) => string,
  onEndReached?: ?({distanceFromEnd: number}) => void,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?() => void,
  /**
   * If provided, processes key press and mouse click events to update selection state
   * and invokes the provided function to notify of selection state changes.
   *
   * @platform macos
   */
  onSelectionChanged?: ?Function, // TODO(macOS ISS#2323203)
  /**
   * If provided, called when 'Enter' key is pressed on an item.
   *
   * @platform macos
   */
  onSelectionEntered?: ?Function, // TODO(macOS ISS#2323203)
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
export type ScrollToLocationParamsType = {|
  animated?: ?boolean,
  itemIndex: number,
  sectionIndex: number,
  viewOffset?: number,
  viewPosition?: number,
|};

type DefaultProps = {|
  ...typeof VirtualizedList.defaultProps,
  data: $ReadOnlyArray<Item>,
|};

type State = {
  childProps: VirtualizedListProps,
  selectedRowIndexPath: SelectedRowIndexPathType, // TODO(macOS ISS#2323203)
};

/**
 * Right now this just flattens everything into one list and uses VirtualizedList under the
 * hood. The only operation that might not scale well is concatting the data arrays of all the
 * sections when new props are received, which should be plenty fast for up to ~10,000 items.
 */
class VirtualizedSectionList<
  SectionT: SectionBase<any>,
> extends React.PureComponent<Props<SectionT>, State> {
  static defaultProps: DefaultProps = {
    ...VirtualizedList.defaultProps,
    data: [],
  };

  scrollToLocation(params: ScrollToLocationParamsType) {
    let index = params.itemIndex;
    for (let i = 0; i < params.sectionIndex; i++) {
      index += this.props.getItemCount(this.props.sections[i].data) + 2;
    }
    let viewOffset = params.viewOffset || 0;
    if (params.itemIndex > 0 && this.props.stickySectionHeadersEnabled) {
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
    const itemCount = props.sections
      ? props.sections.reduce((v, section) => {
          stickyHeaderIndices.push(v + offset);
          return v + props.getItemCount(section.data) + 2; // Add two for the section header and footer.
        }, 0)
      : 0;

    return {
      childProps: {
        ...props,
        renderItem: this._renderItem,
        ItemSeparatorComponent: undefined, // Rendered with renderItem
        data: props.sections,
        getItemCount: () => itemCount,
        // $FlowFixMe
        getItem: (sections, index) => getItem(props, sections, index),
        keyExtractor: this._keyExtractor,
        onViewableItemsChanged: props.onViewableItemsChanged
          ? this._onViewableItemsChanged
          : undefined,
        stickyHeaderIndices: props.stickySectionHeadersEnabled
          ? stickyHeaderIndices
          : undefined,
      },
      selectedRowIndexPath: {sectionIndex: 0, rowIndex: -1}, // TODO(macOS ISS#2323203)
    };
  }
  // [TODO(macOS ISS#2323203)
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
    let index = rowIndexPath.rowIndex + 1;
    for (let ii = 0; ii < rowIndexPath.sectionIndex; ii++) {
      index += this.props.sections[ii].data.length + 2;
    }
    this._listRef.ensureItemAtIndexIsVisible(index);
  };

  _handleKeyDown = (e: ScrollEvent) => {
    if (Platform.OS === 'macos') {
      const event = e.nativeEvent;
      const key = event.key;
      let prevIndexPath = this.state.selectedRowIndexPath;
      let nextIndexPath = null;
      const sectionIndex = this.state.selectedRowIndexPath.sectionIndex;
      const rowIndex = this.state.selectedRowIndexPath.rowIndex;

      if (key === 'DOWN_ARROW') {
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
      } else if (key === 'UP_ARROW') {
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
      } else if (key === 'ENTER') {
        if (this.props.onSelectionEntered) {
          const item = this.props.sections[sectionIndex].data[rowIndex];
          this.props.onSelectionEntered(item);
        }
      }
    }
  }; // ]TODO(macOS ISS#2323203)

  render(): React.Node {
    let keyEventHandler = this.props.onScrollKeyDown; // [TODO(macOS ISS#2323203)
    if (!keyEventHandler) {
      keyEventHandler = this.props.enableSelectionOnKeyPress
        ? this._handleKeyDown
        : null;
    }
    const preferredScrollerStyleDidChangeHandler = this.props
      .onPreferredScrollerStyleDidChange; // ]TODO(macOS ISS#2323203)
    return (
      <VirtualizedList
        {...this.state.childProps}
        ref={this._captureRef}
        onScrollKeyDown={keyEventHandler}
        onPreferredScrollerStyleDidChange={
          preferredScrollerStyleDidChangeHandler
        }
        {...this.state.selectedRowIndexPath}
      /> // TODO(macOS ISS#2323203)
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
        const extractor = section.keyExtractor || keyExtractor;
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

  // [TODO(macOS ISS#2323203)
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
  // ]TODO(macOS ISS#2323203)

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
          isSelected={this._isItemSelected(item)} // TODO(macOS ISS#2323203)
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
  isSelected: boolean, // TODO(macOS ISS#2323203)
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
      isSelected, // TODO(macOS ISS#2323203)
      section,
    } = this.props;
    const element = this.props.renderItem({
      item,
      index,
      isSelected, // TODO(macOS ISS#2323203)
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
      /* $FlowFixMe(>=0.89.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.89 was deployed. To see the error, delete
       * this comment and run Flow. */
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

function getItem(
  props: Props<SectionBase<any>>,
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

module.exports = VirtualizedSectionList;
