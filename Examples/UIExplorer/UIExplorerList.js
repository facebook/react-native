/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native/addons');
var {
  ListView,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

var createExamplePage = require('./createExamplePage');

var COMPONENTS = [
  require('./ActivityIndicatorExample'),
  require('./DatePickerExample'),
  require('./ImageExample'),
  require('./ListViewPagingExample'),
  require('./ListViewSimpleExample'),
  require('./MapViewExample'),
  require('./NavigatorIOSExample'),
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
  require('./AppStateExample'),
  require('./AppStateIOSExample'),
  require('./AsyncStorageExample'),
  require('./CameraRollExample.ios'),
  require('./GeolocationExample'),
  require('./LayoutExample'),
  require('./NetInfoExample'),
  require('./PointerEventsExample'),
  require('./StatusBarIOSExample'),
  require('./TimerExample'),
  require('./VibrationIOSExample'),
];

var UIExplorerList = React.createClass({

  getInitialState: function() {
    var ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
      sectionHeaderHasChanged: (h1, h2) => h1 !== h2,
    });
    return {
      dataSource: ds.cloneWithRowsAndSections({
        components: COMPONENTS,
        apis: APIS,
      }),
    };
  },

  render: function() {
    return (
      <ListView
        style={styles.list}
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        renderSectionHeader={this._renderSectionHeader}
      />
    );
  },

  _renderSectionHeader: function(data, section) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>
          {section.toUpperCase()}
        </Text>
      </View>
    );
  },

  _renderRow: function(example, i) {
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
  },

  _onPressRow: function(example) {
    var Component = example.examples ?
      createExamplePage(null, example) :
      example;
    this.props.navigator.push({
      title: Component.title,
      component: Component,
    });
  },
});

var styles = StyleSheet.create({
  list: {
    backgroundColor: '#eeeeee',
  },
  sectionHeader: {
    padding: 5,
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
});

module.exports = UIExplorerList;
