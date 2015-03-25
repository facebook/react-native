/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  ListView,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = React;
var ReactNavigatorExample = require('./ReactNavigator/ReactNavigatorExample');

var createExamplePage = require('./createExamplePage');

var COMPONENTS = [
  require('./ActivityIndicatorExample'),
  require('./DatePickerExample'),
  require('./ImageExample'),
  require('./ListViewPagingExample'),
  require('./ListViewSimpleExample'),
  require('./MapViewExample'),
  require('./NavigatorIOSExample'),
  ReactNavigatorExample,
  require('./PickerExample'),
  require('./ScrollViewExample'),
  require('./SliderIOSExample'),
  require('./SwitchExample'),
  require('./TabBarExample'),
  require('./TextExample.ios'),
  require('./TextInputExample'),
  require('./TouchableExample'),
  require('./ViewExample'),
  require('./WebViewExample'),
];

var APIS = [
  require('./ActionSheetIOSExample'),
  require('./AdSupportIOSExample'),
  require('./AlertIOSExample'),
  require('./AppStateIOSExample'),
  require('./AsyncStorageExample'),
  require('./CameraRollExample.ios'),
  require('./GeolocationExample'),
  require('./LayoutExample'),
  require('./NetInfoExample'),
  require('./PointerEventsExample'),
  require('./PushNotificationIOSExample'),
  require('./StatusBarIOSExample'),
  require('./ResponderExample'),
  require('./TimerExample'),
  require('./VibrationIOSExample'),
];

var ds = new ListView.DataSource({
  rowHasChanged: (r1, r2) => r1 !== r2,
  sectionHeaderHasChanged: (h1, h2) => h1 !== h2,
});

class UIExplorerList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      dataSource: ds.cloneWithRowsAndSections({
        components: COMPONENTS,
        apis: APIS,
      }),
    };
  }

  render() {
    return (
      <View style={styles.listContainer}>
        <View style={styles.searchRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="always"
            onChangeText={this._search.bind(this)}
            placeholder="Search..."
            style={styles.searchTextInput}
          />
        </View>
        <ListView
          style={styles.list}
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)}
          renderSectionHeader={this._renderSectionHeader}
          automaticallyAdjustContentInsets={false}
        />
      </View>
    );
  }

  _renderSectionHeader(data, section) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>
          {section.toUpperCase()}
        </Text>
      </View>
    );
  }

  _renderRow(example, i) {
    return (
      <View key={i}>
        <TouchableHighlight onPress={() => this._onPressRow(example)}>
          <View style={styles.row}>
            <Text style={styles.rowTitleText}>
              {example.title}
            </Text>
            <Text style={styles.rowDetailText}>
              {example.description}
            </Text>
          </View>
        </TouchableHighlight>
        <View style={styles.separator} />
      </View>
    );
  }

  _search(text) {
    var regex = new RegExp(text, 'i');
    var filter = (component) => regex.test(component.title);

    this.setState({
      dataSource: ds.cloneWithRowsAndSections({
        components: COMPONENTS.filter(filter),
        apis: APIS.filter(filter),
      })
    });
  }

  _onPressRow(example) {
    if (example === ReactNavigatorExample) {
      this.props.onExternalExampleRequested(
        ReactNavigatorExample
      );
      return;
    }
    var Component = example.examples ?
      createExamplePage(null, example) :
      example;
    this.props.navigator.push({
      title: Component.title,
      component: Component,
    });
  }
}

var styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  list: {
    backgroundColor: '#eeeeee',
  },
  sectionHeader: {
    padding: 5,
  },
  group: {
    backgroundColor: 'white',
  },
  sectionHeaderTitle: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  row: {
    backgroundColor: 'white',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  separator: {
    height: 1 / PixelRatio.get(),
    backgroundColor: '#bbbbbb',
    marginLeft: 15,
  },
  rowTitleText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  rowDetailText: {
    fontSize: 15,
    color: '#888888',
    lineHeight: 20,
  },
  searchRow: {
    backgroundColor: '#eeeeee',
    paddingTop: 75,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
  },
  searchTextInput: {
    backgroundColor: 'white',
    borderColor: '#cccccc',
    borderRadius: 3,
    borderWidth: 1,
    height: 30,
    paddingLeft: 8,
  },
});

module.exports = UIExplorerList;
