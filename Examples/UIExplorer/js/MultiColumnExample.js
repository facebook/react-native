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
 * @providesModule MultiColumnExample
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  FlatList,
  StyleSheet,
  Text,
  View,
} = ReactNative;

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

class MultiColumnExample extends React.PureComponent {
  static title = '<FlatList> - MultiColumn';
  static description = 'Performant, scrollable grid of data.';

  state = {
    data: genItemData(1000),
    filterText: '',
    fixedHeight: true,
    logViewable: false,
    numColumns: 2,
    virtualized: true,
  };
  _onChangeFilterText = (filterText) => {
    this.setState(() => ({filterText}));
  };
  _onChangeNumColumns = (numColumns) => {
    this.setState(() => ({numColumns: Number(numColumns)}));
  };
  render() {
    const filterRegex = new RegExp(String(this.state.filterText), 'i');
    const filter = (item) => (filterRegex.test(item.text) || filterRegex.test(item.title));
    const filteredData = this.state.data.filter(filter);
    return (
      <UIExplorerPage
        title={this.props.navigator ? null : '<FlatList> - MultiColumn'}
        noSpacer={true}
        noScroll={true}>
        <View style={styles.searchRow}>
          <View style={styles.row}>
            <PlainInput
              onChangeText={this._onChangeFilterText}
              placeholder="Search..."
              value={this.state.filterText}
            />
            <Text>   numColumns: </Text>
            <PlainInput
              clearButtonMode="never"
              onChangeText={this._onChangeNumColumns}
              value={this.state.numColumns ? String(this.state.numColumns) : ''}
            />
          </View>
          <View style={styles.row}>
            {renderSmallSwitchOption(this, 'virtualized')}
            {renderSmallSwitchOption(this, 'fixedHeight')}
            {renderSmallSwitchOption(this, 'logViewable')}
          </View>
        </View>
        <SeparatorComponent />
        <FlatList
          ItemSeparatorComponent={SeparatorComponent}
          ListFooterComponent={FooterComponent}
          ListHeaderComponent={HeaderComponent}
          getItemLayout={this.state.fixedHeight ? this._getItemLayout : undefined}
          data={filteredData}
          key={this.state.numColumns + (this.state.fixedHeight ? 'f' : 'v')}
          numColumns={this.state.numColumns || 1}
          onRefresh={() => alert('onRefresh: nothing to refresh :P')}
          refreshing={false}
          renderItem={this._renderItemComponent}
          disableVirtualization={!this.state.virtualized}
          onViewableItemsChanged={this._onViewableItemsChanged}
          legacyImplementation={false}
        />
      </UIExplorerPage>
    );
  }
  _getItemLayout(data: any, index: number): {length: number, offset: number, index: number} {
    return getItemLayout(data, index);
  }
  _renderItemComponent = ({item}) => {
    return (
      <ItemComponent
        item={item}
        fixedHeight={this.state.fixedHeight}
        onPress={this._pressItem}
      />
    );
  };
  // This is called when items change viewability by scrolling into or out of the viewable area.
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
    alignItems: 'center',
  },
  searchRow: {
    padding: 10,
  },
});

module.exports = MultiColumnExample;
