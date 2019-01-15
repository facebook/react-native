/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const BatchedBridge = require('BatchedBridge');
const React = require('React');
const RecordingModule = require('NativeModules')
  .SwipeRefreshLayoutRecordingModule;
const ScrollView = require('ScrollView');
const StyleSheet = require('StyleSheet');
const RefreshControl = require('RefreshControl');
const Text = require('Text');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const View = require('View');

class Row extends React.Component {
  state = {
    clicks: 0,
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={this._onPress}>
        <View>
          <Text>{this.state.clicks + ' clicks'}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  _onPress = () => {
    this.setState({clicks: this.state.clicks + 1});
  };
}

let app = null;

class SwipeRefreshLayoutTestApp extends React.Component {
  state = {
    rows: 2,
  };

  componentDidMount() {
    app = this;
  }

  render() {
    const rows = [];
    for (let i = 0; i < this.state.rows; i++) {
      rows.push(<Row key={i} />);
    }
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            style={styles.content}
            refreshing={false}
            onRefresh={() => RecordingModule.onRefresh()}
          />
        }>
        {rows}
      </ScrollView>
    );
  }
}

const SwipeRefreshLayoutTestModule = {
  SwipeRefreshLayoutTestApp,
  setRows: function(rows) {
    if (app != null) {
      app.setState({rows});
    }
  },
};

BatchedBridge.registerCallableModule(
  'SwipeRefreshLayoutTestModule',
  SwipeRefreshLayoutTestModule,
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

module.exports = SwipeRefreshLayoutTestModule;
