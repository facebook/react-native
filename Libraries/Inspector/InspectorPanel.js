/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule InspectorPanel
 * @flow
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var View = require('View');
var ElementProperties = require('ElementProperties');
var PerformanceOverlay = require('PerformanceOverlay');
var TouchableHighlight = require('TouchableHighlight');

var PropTypes = React.PropTypes;

class InspectorPanel extends React.Component {
  renderWaiting() {
    if (this.props.inspecting) {
      return (
        <Text style={styles.waitingText}>
          Tap something to inspect it
        </Text>
      );
    }
    return <Text style={styles.waitingText}>Nothing is inspected</Text>;
  }

  render() {
    var contents;
    if (this.props.inspected) {
      contents = (
        <ElementProperties
          style={this.props.inspected.style}
          frame={this.props.inspected.frame}
          hierarchy={this.props.hierarchy}
          selection={this.props.selection}
          setSelection={this.props.setSelection}
        />
      );
    } else if (this.props.perfing) {
      contents = (
        <PerformanceOverlay />
      );
    } else {
      contents = (
        <View style={styles.waiting}>
          {this.renderWaiting()}
        </View>
      );
    }
    return (
      <View style={styles.container}>
        {!this.props.devtoolsIsOpen && contents}
        <View style={styles.buttonRow}>
          <Button
            title={'Inspect'}
            pressed={this.props.inspecting}
            onClick={this.props.setInspecting}
          />
          <Button title={'Perf'}
            pressed={this.props.perfing}
            onClick={this.props.setPerfing}
          />
        </View>
      </View>
    );
  }
}

InspectorPanel.propTypes = {
  devtoolsIsOpen: PropTypes.bool,
  inspecting: PropTypes.bool,
  setInspecting: PropTypes.func,
  inspected: PropTypes.object,
  perfing: PropTypes.bool,
  setPerfing: PropTypes.func,
};

class Button extends React.Component {
  render() {
    return (
      <TouchableHighlight onPress={() => this.props.onClick(!this.props.pressed)} style={[
        styles.button,
        this.props.pressed && styles.buttonPressed
      ]}>
        <Text style={styles.buttonText}>{this.props.title}</Text>
      </TouchableHighlight>
    );
  }
}

var styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    margin: 2,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    margin: 5,
  },
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  waiting: {
    height: 100,
  },
  waitingText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 20,
  },
});

module.exports = InspectorPanel;
