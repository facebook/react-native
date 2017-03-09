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
 * @providesModule UIExplorerExampleList
 */
'use strict';

const Platform = require('Platform');
const React = require('react');
const SectionList = require('SectionList');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TextInput = require('TextInput');
const TouchableHighlight = require('TouchableHighlight');
const UIExplorerActions = require('./UIExplorerActions');
const UIExplorerStatePersister = require('./UIExplorerStatePersister');
const View = require('View');

import type {
  UIExplorerExample,
} from './UIExplorerList.ios';
import type {
  PassProps,
} from './UIExplorerStatePersister';
import type {
  StyleObj,
} from 'StyleSheetTypes';

type Props = {
  onNavigate: Function,
  list: {
    ComponentExamples: Array<UIExplorerExample>,
    APIExamples: Array<UIExplorerExample>,
  },
  persister: PassProps<*>,
  searchTextInputStyle: StyleObj,
  style?: ?StyleObj,
};

class RowComponent extends React.PureComponent {
  props: {
    item: Object,
    onNavigate: Function,
    onPress?: Function,
  };
  _onPress = () => {
    if (this.props.onPress) {
      this.props.onPress();
      return;
    }
    this.props.onNavigate(UIExplorerActions.ExampleAction(this.props.item.key));
  };
  render() {
    const {item} = this.props;
    return (
      <View>
        <TouchableHighlight onPress={this._onPress}>
          <View style={styles.row}>
            <Text style={styles.rowTitleText}>
              {item.module.title}
            </Text>
            <Text style={styles.rowDetailText}>
              {item.module.description}
            </Text>
          </View>
        </TouchableHighlight>
        <View style={styles.separator} />
      </View>
    );
  }
}

const renderSectionHeader = ({section}) =>
  <Text style={styles.sectionHeader}>
    {section.title}
  </Text>;

class UIExplorerExampleList extends React.Component {
  props: Props

  render() {
    const filterText = this.props.persister.state.filter;
    const filterRegex = new RegExp(String(filterText), 'i');
    const filter = (example) =>
      this.props.disableSearch ||
        filterRegex.test(example.module.title) &&
        (!Platform.isTVOS || example.supportsTVOS);

    const sections = [
      {
        data: this.props.list.ComponentExamples.filter(filter),
        title: 'COMPONENTS',
        key: 'c',
      },
      {
        data: this.props.list.APIExamples.filter(filter),
        title: 'APIS',
        key: 'a',
      },
    ];
    return (
      <View style={[styles.listContainer, this.props.style]}>
        {this._renderTitleRow()}
        {this._renderTextInput()}
        <SectionList
          style={styles.list}
          sections={sections}
          renderItem={this._renderItem}
          enableEmptySections={true}
          itemShouldUpdate={this._itemShouldUpdate}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustContentInsets={false}
          keyboardDismissMode="on-drag"
          legacyImplementation={false}
          renderSectionHeader={renderSectionHeader}
        />
      </View>
    );
  }

  _itemShouldUpdate(curr, prev) {
    return curr.item !== prev.item;
  }

  _renderItem = ({item}) => <RowComponent item={item} onNavigate={this.props.onNavigate} />;

  _renderTitleRow(): ?React.Element<any> {
    if (!this.props.displayTitleRow) {
      return null;
    }
    return (
      <RowComponent
        item={{module: {
          title: 'UIExplorer',
          description: 'React Native Examples',
        }}}
        onNavigate={this.props.onNavigate}
        onPress={() => {
          this.props.onNavigate(UIExplorerActions.ExampleList());
        }}
      />
    );
  }

  _renderTextInput(): ?React.Element<any> {
    if (this.props.disableSearch) {
      return null;
    }
    return (
      <View style={styles.searchRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="always"
          onChangeText={text => {
            this.props.persister.setState(() => ({filter: text}));
          }}
          placeholder="Search..."
          underlineColorAndroid="transparent"
          style={[styles.searchTextInput, this.props.searchTextInputStyle]}
          testID="explorer_search"
          value={this.props.persister.state.filter}
        />
      </View>
    );
  }

  _handleRowPress(exampleKey: string): void {
    this.props.onNavigate(UIExplorerActions.ExampleAction(exampleKey));
  }
}

UIExplorerExampleList = UIExplorerStatePersister.createContainer(UIExplorerExampleList, {
  cacheKeySuffix: () => 'mainList',
  getInitialState: () => ({filter: ''}),
});

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  list: {
    backgroundColor: '#eeeeee',
  },
  sectionHeader: {
    backgroundColor: '#eeeeee',
    padding: 5,
    fontWeight: '500',
    fontSize: 11,
  },
  row: {
    backgroundColor: 'white',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#bbbbbb',
    marginLeft: 15,
  },
  rowTitleText: {
    fontSize: 17,
    fontWeight: '500',
  },
  rowDetailText: {
    fontSize: 15,
    color: '#888888',
    lineHeight: 20,
  },
  searchRow: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  searchTextInput: {
    backgroundColor: 'white',
    borderColor: '#cccccc',
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 8,
    paddingVertical: 0,
    height: 35,
  },
});

module.exports = UIExplorerExampleList;
