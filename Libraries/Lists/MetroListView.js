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

const ListView = require('ListView');
const React = require('React');
const RefreshControl = require('RefreshControl');
const ScrollView = require('ScrollView');

const invariant = require('fbjs/lib/invariant');

type Item = any;

type NormalProps = {
  FooterComponent?: React.ComponentType<*>,
  renderItem: (info: Object) => ?React.Element<any>,
  /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
   * suppresses an error when upgrading Flow's support for React. To see the
   * error delete this comment and run Flow. */
  renderSectionHeader?: ({section: Object}) => ?React.Element<any>,
  SeparatorComponent?: ?React.ComponentType<*>, // not supported yet

  // Provide either `items` or `sections`
  items?: ?Array<Item>, // By default, an Item is assumed to be {key: string}
  // $FlowFixMe - Something is a little off with the type Array<Item>
  sections?: ?Array<{key: string, data: Array<Item>}>,

  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?Function,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: boolean,
  /**
   * If true, renders items next to each other horizontally instead of stacked vertically.
   */
  horizontal?: ?boolean,
};
type DefaultProps = {
  keyExtractor: (item: Item, index: number) => string,
};
type Props = NormalProps & DefaultProps;

/**
 * This is just a wrapper around the legacy ListView that matches the new API of FlatList, but with
 * some section support tacked on. It is recommended to just use FlatList directly, this component
 * is mostly for debugging and performance comparison.
 */
class MetroListView extends React.Component<Props, $FlowFixMeState> {
  scrollToEnd(params?: ?{animated?: ?boolean}) {
    throw new Error('scrollToEnd not supported in legacy ListView.');
  }
  scrollToIndex(params: {
    animated?: ?boolean,
    index: number,
    viewPosition?: number,
  }) {
    throw new Error('scrollToIndex not supported in legacy ListView.');
  }
  scrollToItem(params: {
    animated?: ?boolean,
    item: Item,
    viewPosition?: number,
  }) {
    throw new Error('scrollToItem not supported in legacy ListView.');
  }
  scrollToLocation(params: {
    animated?: ?boolean,
    itemIndex: number,
    sectionIndex: number,
    viewOffset?: number,
    viewPosition?: number,
  }) {
    throw new Error('scrollToLocation not supported in legacy ListView.');
  }
  scrollToOffset(params: {animated?: ?boolean, offset: number}) {
    const {animated, offset} = params;
    // $FlowFixMe Invalid prop usage
    this._listRef.scrollTo(
      this.props.horizontal ? {x: offset, animated} : {y: offset, animated},
    );
  }
  getListRef() {
    return this._listRef;
  }
  setNativeProps(props: Object) {
    if (this._listRef) {
      this._listRef.setNativeProps(props);
    }
  }
  static defaultProps: DefaultProps = {
    keyExtractor: (item, index) => item.key || String(index),
    renderScrollComponent: (props: Props) => {
      if (props.onRefresh) {
        return (
          // $FlowFixMe Invalid prop usage
          <ScrollView
            {...props}
            refreshControl={
              /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss)
               * This comment suppresses an error when upgrading Flow's support
               * for React. To see the error delete this comment and run Flow.
               */
              <RefreshControl
                refreshing={props.refreshing}
                onRefresh={props.onRefresh}
              />
            }
          />
        );
      } else {
        // $FlowFixMe Invalid prop usage
        return <ScrollView {...props} />;
      }
    },
  };
  state = this._computeState(this.props, {
    ds: new ListView.DataSource({
      rowHasChanged: (itemA, itemB) => true,
      sectionHeaderHasChanged: () => true,
      getSectionHeaderData: (dataBlob, sectionID) =>
        this.state.sectionHeaderData[sectionID],
    }),
    sectionHeaderData: {},
  });
  UNSAFE_componentWillReceiveProps(newProps: Props) {
    this.setState(state => this._computeState(newProps, state));
  }
  render() {
    return (
      // $FlowFixMe Found when typing ListView
      <ListView
        {...this.props}
        dataSource={this.state.ds}
        ref={this._captureRef}
        renderRow={this._renderRow}
        renderFooter={this.props.FooterComponent && this._renderFooter}
        renderSectionHeader={this.props.sections && this._renderSectionHeader}
        renderSeparator={this.props.SeparatorComponent && this._renderSeparator}
      />
    );
  }
  _listRef: ?ListView;
  _captureRef = ref => {
    this._listRef = ref;
  };
  _computeState(props: Props, state) {
    const sectionHeaderData = {};
    if (props.sections) {
      invariant(!props.items, 'Cannot have both sections and items props.');
      const sections = {};
      props.sections.forEach((sectionIn, ii) => {
        const sectionID = 's' + ii;
        sections[sectionID] = sectionIn.data;
        sectionHeaderData[sectionID] = sectionIn;
      });
      return {
        ds: state.ds.cloneWithRowsAndSections(sections),
        sectionHeaderData,
      };
    } else {
      invariant(!props.sections, 'Cannot have both sections and items props.');
      return {
        // $FlowFixMe Found when typing ListView
        ds: state.ds.cloneWithRows(props.items),
        sectionHeaderData,
      };
    }
  }
  /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
   * suppresses an error when upgrading Flow's support for React. To see the
   * error delete this comment and run Flow. */
  _renderFooter = () => <this.props.FooterComponent key="$footer" />;
  _renderRow = (item, sectionID, rowID, highlightRow) => {
    return this.props.renderItem({item, index: rowID});
  };
  _renderSectionHeader = (section, sectionID) => {
    const {renderSectionHeader} = this.props;
    invariant(
      renderSectionHeader,
      'Must provide renderSectionHeader with sections prop',
    );
    return renderSectionHeader({section});
  };
  _renderSeparator = (sID, rID) => (
    /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error when upgrading Flow's support for React. To see the
     * error delete this comment and run Flow. */
    <this.props.SeparatorComponent key={sID + rID} />
  );
}

module.exports = MetroListView;
