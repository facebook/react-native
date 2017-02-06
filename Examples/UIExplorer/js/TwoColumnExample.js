/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  StyleSheet,
  View,
} = ReactNative;

const FlatList = require('FlatList');
const UIExplorerPage = require('./UIExplorerPage');

const infoLog = require('infoLog');

const {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  PlainInput,
  SeparatorComponent,
  genItemData,
  getItemLayout,
  pressItem,
  renderSmallSwitchOption,
} = require('./ListExampleShared');

class TwoColumnExample extends React.PureComponent {
  static title = 'Two Columns with FlatList';
  static description = 'Performant, scrollable list of data in two columns.';

  state = {
    data: genItemData(1000),
    filterText: '',
    fixedHeight: true,
    logViewable: false,
    virtualized: true,
  };
  _onChangeFilterText = (filterText) => {
    this.setState(() => ({filterText}));
  };
  render() {
    const filterRegex = new RegExp(String(this.state.filterText), 'i');
    const filter = (item) => (filterRegex.test(item.text) || filterRegex.test(item.title));
    const filteredData = this.state.data.filter(filter);
    const grid = [];
    for (let ii = 0; ii < filteredData.length; ii += 2) {
      const i1 = filteredData[ii];
      const i2 = filteredData[ii + 1];
      grid.push({columns: i2 ? [i1, i2] : [i1], key: i1.key + (i2 && i2.key)});
    }
    return (
      <UIExplorerPage
        title={this.props.navigator ? null : '<FlatList> - 2 Columns'}
        noSpacer={true}
        noScroll={true}>
        <View style={styles.searchRow}>
          <PlainInput
            onChangeText={this._onChangeFilterText}
            placeholder="Search..."
            value={this.state.filterText}
          />
          <View style={styles.row}>
            {renderSmallSwitchOption(this, 'virtualized')}
            {renderSmallSwitchOption(this, 'fixedHeight')}
            {renderSmallSwitchOption(this, 'logViewable')}
          </View>
        </View>
        <FlatList
          FooterComponent={FooterComponent}
          HeaderComponent={HeaderComponent}
          ItemComponent={this._renderItemComponent}
          SeparatorComponent={SeparatorComponent}
          getItemLayout={this.state.fixedHeight ? this._getItemLayout : undefined}
          data={grid}
          key={this.state.fixedHeight ? 'f' : 'v'}
          shouldItemUpdate={this._shouldItemUpdate}
          disableVirtualization={!this.state.virtualized}
          onViewableItemsChanged={this._onViewableItemsChanged}
          legacyImplementation={false}
        />
      </UIExplorerPage>
    );
  }
  _getItemLayout(data: any, index: number): {length: number, offset: number} {
    return getItemLayout(data, index);
  }
  _renderItemComponent = ({item}) => {
    return (
      <View style={styles.row}>
        {item.columns.map((it, ii) => (
          <ItemComponent
            key={ii}
            item={it}
            fixedHeight={this.state.fixedHeight}
            onPress={this._pressItem}
          />
        ))}
      </View>
    );
  };
  _shouldItemUpdate(curr, next) {
    // Note that this does not check state.fixedHeight because we blow away the whole list by
    // changing the key anyway.
    return curr.item.columns.some((cIt, idx) => cIt !== next.item.columns[idx]);
  }
  // This is called when items change viewability by scrolling into our out of the viewable area.
  _onViewableItemsChanged = (info: {
    changed: Array<{
      key: string, isViewable: boolean, item: {columns: Array<*>}, index: ?number, section?: any
    }>},
  ) => {
    // Impressions can be logged here
    if (this.state.logViewable) {
      infoLog('onViewableItemsChanged: ', info.changed.map((v) => ({...v, item: '...'})));
    }
  };
  _pressItem = (key: number) => {
    pressItem(this, key);
  };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  searchRow: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
});

module.exports = TwoColumnExample;
