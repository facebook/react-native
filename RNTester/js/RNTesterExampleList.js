/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = require('react-native');
const RNTesterActions = require('./RNTesterActions');
const RNTesterExampleFilter = require('./RNTesterExampleFilter');

import type {RNTesterExample} from './Shared/RNTesterTypes';
import type {ViewStyleProp} from '../../Libraries/StyleSheet/StyleSheet';

type Props = {
  onNavigate: Function,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
  },
  style?: ?ViewStyleProp,
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
        onAccessibilityTap={this._onPress}
        acceptsKeyboardFocus={false} // TODO(macOS ISS#2323203)
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
    const filter = ({example, filterRegex}) =>
      filterRegex.test(example.module.title) &&
      (!Platform.isTV || example.supportsTVOS);

    const sections = [
      {
        data: this.props.list.ComponentExamples,
        title: 'COMPONENTS',
        key: 'c',
      },
      {
        data: this.props.list.APIExamples,
        title: 'APIS',
        key: 'a',
      },
    ];

    return (
      <View style={[styles.listContainer, this.props.style]}>
        {this._renderTitleRow()}
        <RNTesterExampleFilter
          testID="explorer_search"
          sections={sections}
          filter={filter}
          render={({filteredSections}) => (
            <SectionList
              ItemSeparatorComponent={ItemSeparator}
              contentContainerStyle={styles.sectionListContentContainer}
              style={styles.list}
              sections={filteredSections}
              renderItem={this._renderItem}
              enableEmptySections={true}
              itemShouldUpdate={this._itemShouldUpdate}
              keyboardShouldPersistTaps="handled"
              acceptsKeyboardFocus={true} // TODO(macOS ISS#2323203)
              onSelectionEntered={this._handleOnSelectionEntered} // TODO(macOS ISS#2323203)
              enableSelectionOnKeyPress={true} // TODO(macOS ISS#2323203)
              automaticallyAdjustContentInsets={false}
              keyboardDismissMode="on-drag"
              renderSectionHeader={renderSectionHeader}
              backgroundColor={Platform.select({
                macos: 'transparent',
                ios: 'transparent',
                default: undefined,
              })} // TODO(macOS ISS#2323203)
            />
          )}
        />
      </View>
    );
  }

  _handleOnSelectionEntered = item => {
    const {key} = item;
    this.props.onNavigate(RNTesterActions.ExampleAction(key));
  };

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

  _handleRowPress(exampleKey: string): void {
    this.props.onNavigate(RNTesterActions.ExampleAction(exampleKey));
  }
}

const ItemSeparator = ({highlighted}) => (
  <View style={highlighted ? styles.separatorHighlighted : styles.separator} />
);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  list: {
    ...Platform.select({
      // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {semantic: 'controlBackgroundColor'},
      },
      ios: {
        backgroundColor: {semantic: 'systemBackgroundColor'},
      },
      default: {
        // ]TODO(macOS ISS#2323203)
        backgroundColor: '#eeeeee',
      }, // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
  },
  sectionHeader: {
    ...Platform.select({
      // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {
          semantic: 'unemphasizedSelectedContentBackgroundColor',
        },
        color: {semantic: 'headerTextColor'},
      },
      ios: {
        backgroundColor: {
          semantic: 'systemGroupedBackgroundColor',
        },
        color: {semantic: 'secondaryLabelColor'},
      },
      default: {
        // ]TODO(macOS ISS#2323203)
        backgroundColor: '#eeeeee',
        color: 'black',
      }, // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    padding: 5,
    fontWeight: '500',
    fontSize: 11,
  },
  row: {
    ...Platform.select({
      // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {semantic: 'controlBackgroundColor'},
      },
      ios: {
        backgroundColor: {semantic: 'secondarySystemGroupedBackgroundColor'},
      },
      default: {
        // ]TODO(macOS ISS#2323203)
        backgroundColor: 'white',
      }, // [TODO(macOS ISS#2323203)
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
    ...Platform.select({
      // [TODO(macOS ISS#2323203)
      macos: {
        backgroundColor: {semantic: 'separatorColor'},
      },
      ios: {
        backgroundColor: {semantic: 'separatorColor'},
      },
      default: {
        // ]TODO(macOS ISS#2323203)
        backgroundColor: '#bbbbbb',
      }, // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
    marginLeft: 15,
  },
  separatorHighlighted: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgb(217, 217, 217)',
  },
  sectionListContentContainer: Platform.select({
    macos: {backgroundColor: {semantic: 'separatorColor'}},
    ios: {backgroundColor: {semantic: 'separatorColor'}},
    default: {backgroundColor: 'white'},
  }),
  rowTitleText: {
    fontSize: 17,
    fontWeight: '500',
    ...Platform.select({
      // [TODO(macOS ISS#2323203)
      macos: {
        color: {semantic: 'controlTextColor'},
      },
      ios: {
        color: {semantic: 'labelColor'},
      },
      default: {
        // ]TODO(macOS ISS#2323203)
        color: 'black',
      }, // [TODO(macOS ISS#2323203)
    }), // ]TODO(macOS ISS#2323203)
  },
  rowDetailText: {
    fontSize: 15,
    color: '#888888',
    lineHeight: 20,
  },
});

module.exports = RNTesterExampleList;
