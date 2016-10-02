/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SwipeRefreshLayoutTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var RecordingModule = require('NativeModules').SwipeRefreshLayoutRecordingModule;
var ScrollView = require('ScrollView');
var RefreshControl = require('RefreshControl');
var Text = require('Text');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');
var View = require('View');

class Row extends React.Component {
  state = {
    clicks: 0,
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={this._onPress}>
        <View>
          <Text>
            {this.state.clicks + ' clicks'}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  _onPress = () => {
    this.setState({clicks: this.state.clicks + 1});
  };
}

var app = null;

class SwipeRefreshLayoutTestApp extends React.Component {
  state = {
    rows: 2,
  };

  componentDidMount() {
    app = this;
  }

  render() {
    var rows = [];
    for (var i = 0; i < this.state.rows; i++) {
      rows.push(<Row key={i} />);
    }
    return (
      <ScrollView
        style={{flex: 1}}
        refreshControl={
          <RefreshControl
            style={{flex: 1}}
            refreshing={false}
            onRefresh={() => RecordingModule.onRefresh()}
          />
        }>
        {rows}
      </ScrollView>
    );
  }
}

var SwipeRefreshLayoutTestModule = {
  SwipeRefreshLayoutTestApp,
  setRows: function(rows) {
    if (app != null) {
      app.setState({rows});
    }
  }
};

BatchedBridge.registerCallableModule(
  'SwipeRefreshLayoutTestModule',
  SwipeRefreshLayoutTestModule
);

module.exports = SwipeRefreshLayoutTestModule;
