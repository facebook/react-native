/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule RNTesterExampleList
 */
'use strict';

const Platform = require('Platform');
const React = require('react');
const SectionList = require('SectionList');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TextInput = require('TextInput');
const TouchableHighlight = require('TouchableHighlight');
const RNTesterActions = require('./RNTesterActions');
const RNTesterStatePersister = require('./RNTesterStatePersister');
const View = require('View');

import type {
  RNTesterExample,
} from './RNTesterList.ios';
import type {
  PassProps,
} from './RNTesterStatePersister';
import type {
  StyleObj,
} from 'StyleSheetTypes';

type Props = {
  onNavigate: Function,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
  },
  persister: PassProps<*>,
  searchTextInputStyle: StyleObj,
  style?: ?StyleObj,
};

class RowComponent extends React.PureComponent<{
  item: Object,
  onNavigate: Function,
  onPress?: Function,
  onShowUnderlay?: Function,
  onHideUnderlay?: Function,
}> {
  _onPress = () => {
    if (this.props.onPress) {
      this.props.onPress();
      return;
    }
    this.props.onNavigate(RNTesterActions.ExampleAction(this.props.item.key));
  };
  render() {
    const {item} = this.props;
    return (
      <TouchableHighlight {...this.props} onPress={this._onPress}>
        <View style={styles.row}>
          <Text style={styles.rowTitleText}>
            {item.module.title}
          </Text>
          <Text style={styles.rowDetailText}>
            {item.module.description}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const renderSectionHeader = ({section}) =>
  <Text style={styles.sectionHeader}>
    {section.title}
  </Text>;

class RNTesterExampleList extends React.Component<Props, $FlowFixMeState> {
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
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={{backgroundColor: 'white'}}
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

  _renderItem = ({item, separators}) => (
    <RowComponent
      item={item}
      onNavigate={this.props.onNavigate}
      onShowUnderlay={separators.highlight}
      onHideUnderlay={separators.unhighlight}
    />
  );

  _renderTitleRow(): ?React.Element<any> {
    if (!this.props.displayTitleRow) {
      return null;
    }
    return (
      <RowComponent
        item={{module: {
          title: 'RNTester',
          description: 'React Native Examples',
        }}}
        onNavigate={this.props.onNavigate}
        onPress={() => {
          this.props.onNavigate(RNTesterActions.ExampleList());
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
    this.props.onNavigate(RNTesterActions.ExampleAction(exampleKey));
  }
}

const ItemSeparator = ({highlighted}) => (
  <View style={highlighted ? styles.separatorHighlighted : styles.separator} />
);

RNTesterExampleList = RNTesterStatePersister.createContainer(RNTesterExampleList, {
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
  separatorHighlighted: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgb(217, 217, 217)',
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

module.exports = RNTesterExampleList;
