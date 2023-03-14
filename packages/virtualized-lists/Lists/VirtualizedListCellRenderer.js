/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type {
  FocusEvent,
  LayoutEvent,
} from 'react-native/Libraries/Types/CoreEventTypes';
import type {CellRendererProps, RenderItemType} from './VirtualizedListProps';

import {View, StyleSheet} from 'react-native';
import {VirtualizedListCellContextProvider} from './VirtualizedListContext.js';
import invariant from 'invariant';
import * as React from 'react';

export type Props<ItemT> = {
  CellRendererComponent?: ?React.ComponentType<CellRendererProps<ItemT>>,
  ItemSeparatorComponent: ?React.ComponentType<
    any | {highlighted: boolean, leadingItem: ?ItemT},
  >,
  ListItemComponent?: ?(React.ComponentType<any> | React.Element<any>),
  cellKey: string,
  horizontal: ?boolean,
  index: number,
  inversionStyle: ViewStyleProp,
  item: ItemT,
  onCellLayout?: (event: LayoutEvent, cellKey: string, index: number) => void,
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
      cellKey,
      horizontal,
      item,
      index,
      inversionStyle,
      onCellFocusCapture,
      onCellLayout,
      renderItem,
    } = this.props;
    const element = this._renderElement(
      renderItem,
      ListItemComponent,
      item,
      index,
    );

    // NOTE: that when this is a sticky header, `onLayout` will get automatically extracted and
    // called explicitly by `ScrollViewStickyHeader`.
    const itemSeparator: React.Node = React.isValidElement(
      ItemSeparatorComponent,
    )
      ? // $FlowFixMe[incompatible-type]
        ItemSeparatorComponent
      : // $FlowFixMe[incompatible-type]
        ItemSeparatorComponent && (
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
        onFocusCapture={onCellFocusCapture}
        {...(onCellLayout && {onLayout: this._onLayout})}>
        {element}
        {itemSeparator}
      </View>
    ) : (
      <CellRendererComponent
        cellKey={cellKey}
        index={index}
        item={item}
        style={cellStyle}
        onFocusCapture={onCellFocusCapture}
        {...(onCellLayout && {onLayout: this._onLayout})}>
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
