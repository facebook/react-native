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

const ElementProperties = require('ElementProperties');
const NetworkOverlay = require('NetworkOverlay');
const PerformanceOverlay = require('PerformanceOverlay');
const React = require('React');
const PropTypes = require('prop-types');
const ScrollView = require('ScrollView');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');
const View = require('View');

class InspectorPanel extends React.Component<$FlowFixMeProps> {
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
    let contents;
    if (this.props.inspected) {
      contents = (
        <ScrollView style={styles.properties}>
          <ElementProperties
            style={this.props.inspected.style}
            frame={this.props.inspected.frame}
            source={this.props.inspected.source}
            hierarchy={this.props.hierarchy}
            selection={this.props.selection}
            setSelection={this.props.setSelection}
          />
        </ScrollView>
      );
    } else if (this.props.perfing) {
      contents = (
        <PerformanceOverlay />
      );
    } else if (this.props.networking) {
      contents = (
        <NetworkOverlay />
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
          <Button title={'Network'}
            pressed={this.props.networking}
            onClick={this.props.setNetworking}
          />
          <Button title={'Touchables'}
            pressed={this.props.touchTargeting}
            onClick={this.props.setTouchTargeting}
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
  touchTargeting: PropTypes.bool,
  setTouchTargeting: PropTypes.func,
  networking: PropTypes.bool,
  setNetworking: PropTypes.func,
};

class Button extends React.Component<$FlowFixMeProps> {
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

const styles = StyleSheet.create({
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
  properties: {
    height: 200,
  },
  waiting: {
    height: 100,
  },
  waitingText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 20,
    color: 'white',
  },
});

module.exports = InspectorPanel;
