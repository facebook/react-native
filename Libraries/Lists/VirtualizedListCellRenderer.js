/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {FocusEvent, LayoutEvent} from '../Types/CoreEventTypes';
import type FillRateHelper from './FillRateHelper';
import type {RenderItemType} from './VirtualizedListProps';

import View from '../Components/View/View';
import StyleSheet from '../StyleSheet/StyleSheet';
import {VirtualizedListCellContextProvider} from './VirtualizedListContext.js';
import invariant from 'invariant';
import * as React from 'react';

export type Props<ItemT> = {
  CellRendererComponent?: ?React.ComponentType<any>,
  ItemSeparatorComponent: ?React.ComponentType<
    any | {highlighted: boolean, leadingItem: ?ItemT},
  >,
  ListItemComponent?: ?(React.ComponentType<any> | React.Element<any>),
  cellKey: string,
  debug?: ?boolean,
  fillRateHelper: FillRateHelper,
  getItemLayout?: (
    data: any,
    index: number,
  ) => {
    length: number,
    offset: number,
    index: number,
    ...
  },
  horizontal: ?boolean,
  index: number,
  inversionStyle: ViewStyleProp,
  item: ItemT,
  onCellLayout: (event: LayoutEvent, cellKey: string, index: number) => void,
  onCellFocusCapture?: (event: FocusEvent) => void,
  onUnmount: (cellKey: string) => void,
  onUpdateSeparators: (
    cellKeys: Array<?string>,
    props: $Shape<SeparatorProps<ItemT>>,
  ) => void,
  prevCellKey: ?string,
  renderItem?: ?RenderItemType<ItemT>,
  ...
};

type SeparatorProps<ItemT> = $ReadOnly<{|
  highlighted: boolean,
  leadingItem: ?ItemT,
|}>;

type State<ItemT> = {
  separatorProps: SeparatorProps<ItemT>,
  ...
};

export default class CellRenderer<ItemT> extends React.Component<
  Props<ItemT>,
  State<ItemT>,
> {
  state: State<ItemT> = {
    separatorProps: {
      highlighted: false,
      leadingItem: this.props.item,
    },
  };

  static getDerivedStateFromProps(
    props: Props<ItemT>,
    prevState: State<ItemT>,
  ): ?State<ItemT> {
    return {
      separatorProps: {
        ...prevState.separatorProps,
        leadingItem: props.item,
      },
    };
  }

  // TODO: consider factoring separator stuff out of VirtualizedList into FlatList since it's not
  // reused by SectionList and we can keep VirtualizedList simpler.
  // $FlowFixMe[missing-local-annot]
  _separators = {
    highlight: () => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators([cellKey, prevCellKey], {
        highlighted: true,
      });
    },
    unhighlight: () => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators([cellKey, prevCellKey], {
        highlighted: false,
      });
    },
    updateProps: (
      select: 'leading' | 'trailing',
      newProps: SeparatorProps<ItemT>,
    ) => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators(
        [select === 'leading' ? prevCellKey : cellKey],
        newProps,
      );
    },
  };

  updateSeparatorProps(newProps: SeparatorProps<ItemT>) {
    this.setState(state => ({
      separatorProps: {...state.separatorProps, ...newProps},
    }));
  }

  componentWillUnmount() {
    this.props.onUnmount(this.props.cellKey);
  }

  _onLayout = (nativeEvent: LayoutEvent): void => {
    this.props.onCellLayout &&
      this.props.onCellLayout(
        nativeEvent,
        this.props.cellKey,
        this.props.index,
      );
  };

  _renderElement(
    renderItem: ?RenderItemType<ItemT>,
    ListItemComponent: any,
    item: ItemT,
    index: number,
  ): React.Node {
    if (renderItem && ListItemComponent) {
      console.warn(
        'VirtualizedList: Both ListItemComponent and renderItem props are present. ListItemComponent will take' +
          ' precedence over renderItem.',
      );
    }

    if (ListItemComponent) {
      /* $FlowFixMe[not-a-component] (>=0.108.0 site=react_native_fb) This
       * comment suppresses an error found when Flow v0.108 was deployed. To
       * see the error, delete this comment and run Flow. */
      /* $FlowFixMe[incompatible-type-arg] (>=0.108.0 site=react_native_fb)
       * This comment suppresses an error found when Flow v0.108 was deployed.
       * To see the error, delete this comment and run Flow. */
      return React.createElement(ListItemComponent, {
        item,
        index,
        separators: this._separators,
      });
    }

    if (renderItem) {
      return renderItem({
        item,
        index,
        separators: this._separators,
      });
    }

    invariant(
      false,
      'VirtualizedList: Either ListItemComponent or renderItem props are required but none were found.',
    );
  }

  render(): React.Node {
    const {
      CellRendererComponent,
      ItemSeparatorComponent,
      ListItemComponent,
      debug,
      fillRateHelper,
      getItemLayout,
      horizontal,
      item,
      index,
      inversionStyle,
      onCellFocusCapture,
      renderItem,
    } = this.props;
    const element = this._renderElement(
      renderItem,
      ListItemComponent,
      item,
      index,
    );

    const onLayout =
      (getItemLayout && !debug && !fillRateHelper.enabled()) ||
      !this.props.onCellLayout
        ? undefined
        : this._onLayout;
    // NOTE: that when this is a sticky header, `onLayout` will get automatically extracted and
    // called explicitly by `ScrollViewStickyHeader`.
    const itemSeparator = React.isValidElement(ItemSeparatorComponent)
      ? ItemSeparatorComponent
      : ItemSeparatorComponent && (
          <ItemSeparatorComponent {...this.state.separatorProps} />
        );
    const cellStyle = inversionStyle
      ? horizontal
        ? [styles.rowReverse, inversionStyle]
        : [styles.columnReverse, inversionStyle]
      : horizontal
      ? [styles.row, inversionStyle]
      : inversionStyle;
    const result = !CellRendererComponent ? (
      <View
        style={cellStyle}
        onLayout={onLayout}
        onFocusCapture={onCellFocusCapture}
        /* $FlowFixMe[incompatible-type-arg] (>=0.89.0 site=react_native_fb) *
        This comment suppresses an error found when Flow v0.89 was deployed. *
        To see the error, delete this comment and run Flow. */
      >
        {element}
        {itemSeparator}
      </View>
    ) : (
      <CellRendererComponent
        {...this.props}
        style={cellStyle}
        onLayout={onLayout}
        onFocusCapture={onCellFocusCapture}>
        {element}
        {itemSeparator}
      </CellRendererComponent>
    );

    return (
      <VirtualizedListCellContextProvider cellKey={this.props.cellKey}>
        {result}
      </VirtualizedListCellContextProvider>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  columnReverse: {
    flexDirection: 'column-reverse',
  },
});
