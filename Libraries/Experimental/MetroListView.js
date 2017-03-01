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
 * @providesModule MetroListView
 * @flow
 */
'use strict';

const ListView = require('ListView');
const React = require('React');
const RefreshControl = require('RefreshControl');
const ScrollView = require('ScrollView');

const invariant = require('fbjs/lib/invariant');

type Item = any;

type NormalProps = {
  FooterComponent?: ReactClass<*>,
  renderItem: ({item: Item, index: number}) => ?React.Element<*>,
  renderSectionHeader?: ({section: Object}) => ?React.Element<*>,
  SeparatorComponent?: ?ReactClass<*>, // not supported yet

  // Provide either `items` or `sections`
  items?: ?Array<Item>, // By default, an Item is assumed to be {key: string}
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
};
type DefaultProps = {
  shouldItemUpdate: (curr: {item: Item}, next: {item: Item}) => boolean,
  keyExtractor: (item: Item) => string,
};
type Props = NormalProps & DefaultProps;

/**
 * This is just a wrapper around the legacy ListView that matches the new API of FlatList, but with
 * some section support tacked on. It is recommended to just use FlatList directly, this component
 * is mostly for debugging and performance comparison.
 */
class MetroListView extends React.Component {
  props: Props;
  scrollToEnd(params?: ?{animated?: ?boolean}) {
    throw new Error('scrollToEnd not supported in legacy ListView.');
  }
  scrollToIndex(params: {animated?: ?boolean, index: number, viewPosition?: number}) {
    throw new Error('scrollToIndex not supported in legacy ListView.');
  }
  scrollToItem(params: {animated?: ?boolean, item: Item, viewPosition?: number}) {
    throw new Error('scrollToItem not supported in legacy ListView.');
  }
  scrollToOffset(params: {animated?: ?boolean, offset: number}) {
    const {animated, offset} = params;
    this._listRef.scrollTo(
      this.props.horizontal ? {x: offset, animated} : {y: offset, animated}
    );
  }
  static defaultProps: DefaultProps = {
    shouldItemUpdate: () => true,
    keyExtractor: (item, index) => item.key || index,
    renderScrollComponent: (props: Props) => {
      if (props.onRefresh) {
        return (
          <ScrollView
            {...props}
            refreshControl={
              <RefreshControl
                refreshing={props.refreshing}
                onRefresh={props.onRefresh}
              />
            }
          />
        );
      } else {
        return <ScrollView {...props} />;
      }
    },
  };
  state = this._computeState(
    this.props,
    {
      ds: new ListView.DataSource({
        rowHasChanged: (itemA, itemB) => this.props.shouldItemUpdate({item: itemA}, {item: itemB}),
        sectionHeaderHasChanged: () => true,
        getSectionHeaderData: (dataBlob, sectionID) => this.state.sectionHeaderData[sectionID],
      }),
      sectionHeaderData: {},
    },
  );
  componentWillReceiveProps(newProps: Props) {
    this.setState((state) => this._computeState(newProps, state));
  }
  render() {
    return (
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
  _listRef: ListView;
  _captureRef = (ref) => { this._listRef = ref; };
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
        ds: state.ds.cloneWithRows(props.items),
        sectionHeaderData,
      };
    }
  }
  _renderFooter = () => <this.props.FooterComponent key="$footer" />;
  _renderRow = (item, sectionID, rowID, highlightRow) => {
    return this.props.renderItem({item, index: rowID});
  };
  _renderSectionHeader = (section, sectionID) => {
    const {renderSectionHeader} = this.props;
    invariant(renderSectionHeader, 'Must provide renderSectionHeader with sections prop');
    return renderSectionHeader({section});
  }
  _renderSeparator = (sID, rID) => <this.props.SeparatorComponent key={sID + rID} />;
}

module.exports = MetroListView;
