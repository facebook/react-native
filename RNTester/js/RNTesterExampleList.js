/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
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

/* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found when
 * making Flow check .android.js files. */
import type {RNTesterExample} from './RNTesterList.ios';
import type {PassProps} from './RNTesterStatePersister';
import type {DangerouslyImpreciseStyleProp} from 'StyleSheet';

type Props = {
  onNavigate: Function,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
  },
  persister: PassProps<*>,
  searchTextInputStyle: DangerouslyImpreciseStyleProp,
  style?: ?DangerouslyImpreciseStyleProp,
};

class RowComponent extends React.PureComponent<{
  item: Object,
  isSelected?: ?boolean,
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
    const rowStyle = this.props.isSelected ? styles.selectedRow : styles.row;
    return (
      <TouchableHighlight
        onShowUnderlay={this.props.onShowUnderlay}
        onHideUnderlay={this.props.onHideUnderlay}
        accessibilityTraits={['group']}
        accessibilityLabel={item.module.title}
        onAccessibilityTap={this._onPress}
        acceptsKeyboardFocus={false}
        onPress={this._onPress}>
        <View style={rowStyle}>
          <Text style={styles.rowTitleText}>{item.module.title}</Text>
          <Text style={styles.rowDetailText}>{item.module.description}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const renderSectionHeader = ({section}) => (
  <Text style={styles.sectionHeader}>{section.title}</Text>
);

class RNTesterExampleList extends React.Component<Props, $FlowFixMeState> {
  render() {
    const filterText = this.props.persister.state.filter;
    const filterRegex = new RegExp(String(filterText), 'i');
    const filter = example =>
      /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.68 was deployed. To see the error delete this
       * comment and run Flow. */
      this.props.disableSearch ||
      (filterRegex.test(example.module.title) &&
        (!Platform.isTV || example.supportsTVOS));

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
          contentContainerStyle={Platform.select({macos: {backgroundColor: {semantic: 'separatorColor'}}, default: {backgroundColor: 'white'}})} // TODO(macOS ISS#2323203)
          style={styles.list}
          sections={sections}
          renderItem={this._renderItem}
          enableEmptySections={true}
          enableSelectionOnKeyPress={true}
          onSelectionEntered={this._handleOnSelectionEntered}
          itemShouldUpdate={this._itemShouldUpdate}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustContentInsets={false}
          keyboardDismissMode="on-drag"
          legacyImplementation={false}
          renderSectionHeader={renderSectionHeader}
          accessibilityLabel="RNTester Components"
          backgroundColor={Platform.select({macos: 'transparent', default: undefined})} // TODO(macOS ISS#2323203)
        />
      </View>
    );
  }

  _handleOnSelectionEntered = (item) => {
    const {key} = item;
    this.props.onNavigate(RNTesterActions.ExampleAction(key));
  }

  _itemShouldUpdate(curr, prev) {
    return curr.item !== prev.item;
  }

  _renderItem = ({item, isSelected, separators}) => (
    <RowComponent
      item={item}
      isSelected={isSelected}
      onNavigate={this.props.onNavigate}
      onShowUnderlay={separators.highlight}
      onHideUnderlay={separators.unhighlight}
    />
  );

  _renderTitleRow(): ?React.Element<any> {
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
    if (!this.props.displayTitleRow) {
      return null;
    }
    return (
      <RowComponent
        item={{
          module: {
            title: 'RNTester',
            description: 'React Native Examples',
          },
        }}
        onNavigate={this.props.onNavigate}
        onPress={() => {
          this.props.onNavigate(RNTesterActions.ExampleList());
        }}
      />
    );
  }

  _renderTextInput(): ?React.Element<any> {
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
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
          placeholderTextColor={Platform.select({macos: {semantic : 'placeholderTextColor'}, default: undefined})} // TODO(macOS ISS#2323203)
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

RNTesterExampleList = RNTesterStatePersister.createContainer(
  RNTesterExampleList,
  {
    cacheKeySuffix: () => 'mainList',
    getInitialState: () => ({filter: ''}),
  },
);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  list: {
    ...Platform.select({ // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {semantic: 'controlBackgroundColor'},
      },
      default: { // ]TODO(macOS ISS#2323203)
        backgroundColor: '#eeeeee',
      } // [TODO(macOS ISS#2323203)
    }) // ]TODO(macOS ISS#2323203)
  },
  sectionHeader: {
    ...Platform.select({ // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {semantic: 'unemphasizedSelectedContentBackgroundColor'},
        color: {semantic: 'headerTextColor'}
      },
      default: { // ]TODO(macOS ISS#2323203)
        backgroundColor: '#eeeeee',
        color: 'black'
      } // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    padding: 5,
    fontWeight: '500',
    fontSize: 11,
  },
  row: {
    ...Platform.select({ // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {semantic: 'controlBackgroundColor'},
        },
      default: { // ]TODO(macOS ISS#2323203)
        backgroundColor: 'white',
      } // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },  
  selectedRow: {
    backgroundColor: '#DDECF8',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    ...Platform.select({ // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {semantic: 'separatorColor'},
        },
      default: { // ]TODO(macOS ISS#2323203)
        backgroundColor: '#bbbbbb',
      } // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    marginLeft: 15,
  },
  separatorHighlighted: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgb(217, 217, 217)',
  },
  rowTitleText: {
    fontSize: 17,
    fontWeight: '500',
    ...Platform.select({ // [TODO(macOS ISS#2323203)
      macos: {
        color: {semantic: 'controlTextColor'},
        },
      default: { // ]TODO(macOS ISS#2323203)
        color: 'black',
      } // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
  },
  rowDetailText: {
    fontSize: 15,
    color: '#888888',
    lineHeight: 20,
  },
  searchRow: {
    ...Platform.select({ // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {semantic: 'unemphasizedSelectedContentBackgroundColor'},
        },
      default: { // ]TODO(macOS ISS#2323203)
        backgroundColor: '#eeeeee',
      } // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    padding: 10,
  },
  searchTextInput: {
    ...Platform.select({ // [TODO(macOS ISS#2323203)
      macos: {
        color: {semantic: 'textColor'},
        backgroundColor: {semantic: 'textBackgroundColor'},
        borderColor: {semantic: 'gridColor'},
        },
      default: { // ]TODO(macOS ISS#2323203)
        backgroundColor: 'white',
        borderColor: '#cccccc',
      } // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 8,
    paddingVertical: 0,
    height: 35,
  },
});

module.exports = RNTesterExampleList;
