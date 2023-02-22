/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewStyleProp} from '../StyleSheet/StyleSheet';

import SafeAreaView from '../Components/SafeAreaView/SafeAreaView';

const ScrollView = require('../Components/ScrollView/ScrollView');
const TouchableHighlight = require('../Components/Touchable/TouchableHighlight');
const View = require('../Components/View/View');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Text = require('../Text/Text');
const ElementProperties = require('./ElementProperties');
const NetworkOverlay = require('./NetworkOverlay');
const PerformanceOverlay = require('./PerformanceOverlay');
const React = require('react');

type Props = $ReadOnly<{|
  devtoolsIsOpen: boolean,
  inspecting: boolean,
  setInspecting: (val: boolean) => void,
  perfing: boolean,
  setPerfing: (val: boolean) => void,
  touchTargeting: boolean,
  setTouchTargeting: (val: boolean) => void,
  networking: boolean,
  setNetworking: (val: boolean) => void,
  hierarchy?: ?Array<{|name: string|}>,
  selection?: ?number,
  setSelection: number => mixed,
  inspected?: ?$ReadOnly<{|
    style?: ?ViewStyleProp,
    frame?: ?$ReadOnly<{|
      top?: ?number,
      left?: ?number,
      width?: ?number,
      height: ?number,
    |}>,
    source?: ?{|
      fileName?: string,
      lineNumber?: number,
    |},
  |}>,
|}>;

class InspectorPanel extends React.Component<Props> {
  renderWaiting(): React.Node {
    if (this.props.inspecting) {
      return (
        <Text style={styles.waitingText}>Tap something to inspect it</Text>
      );
    }
    return <Text style={styles.waitingText}>Nothing is inspected</Text>;
  }

  render(): React.Node {
    let contents;
    if (this.props.inspected) {
      contents = (
        <ScrollView style={styles.properties}>
          <ElementProperties
            style={this.props.inspected.style}
            frame={this.props.inspected.frame}
            source={this.props.inspected.source}
            // $FlowFixMe[incompatible-type] : Hierarchy should be non-nullable
            hierarchy={this.props.hierarchy}
            selection={this.props.selection}
            setSelection={this.props.setSelection}
          />
        </ScrollView>
      );
    } else if (this.props.perfing) {
      contents = <PerformanceOverlay />;
    } else if (this.props.networking) {
      contents = <NetworkOverlay />;
    } else {
      contents = <View style={styles.waiting}>{this.renderWaiting()}</View>;
    }
    return (
      <SafeAreaView style={styles.container}>
        {!this.props.devtoolsIsOpen && contents}
        <View style={styles.buttonRow}>
          <InspectorPanelButton
            title={'Inspect'}
            pressed={this.props.inspecting}
            onClick={this.props.setInspecting}
          />
          <InspectorPanelButton
            title={'Perf'}
            pressed={this.props.perfing}
            onClick={this.props.setPerfing}
          />
          <InspectorPanelButton
            title={'Network'}
            pressed={this.props.networking}
            onClick={this.props.setNetworking}
          />
          <InspectorPanelButton
            title={'Touchables'}
            pressed={this.props.touchTargeting}
            onClick={this.props.setTouchTargeting}
          />
        </View>
      </SafeAreaView>
    );
  }
}

type InspectorPanelButtonProps = $ReadOnly<{|
  onClick: (val: boolean) => void,
  pressed: boolean,
  title: string,
|}>;

class InspectorPanelButton extends React.Component<InspectorPanelButtonProps> {
  render(): React.Node {
    return (
      <TouchableHighlight
        onPress={() => this.props.onClick(!this.props.pressed)}
        style={[styles.button, this.props.pressed && styles.buttonPressed]}>
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
