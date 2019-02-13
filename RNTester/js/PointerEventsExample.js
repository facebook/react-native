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
const ReactNative = require('react-native');
const {StyleSheet, Text, View} = ReactNative;

class ExampleBox extends React.Component<$FlowFixMeProps, $FlowFixMeState> {
  state = {
    log: [],
  };

  handleLog = msg => {
    this.state.log = this.state.log.concat([msg]);
  };

  flushReactChanges = () => {
    this.forceUpdate();
  };

  /**
   * Capture phase of bubbling to append separator before any of the bubbling
   * happens.
   */
  handleTouchCapture = () => {
    this.state.log = this.state.log.concat(['---']);
  };

  render() {
    return (
      <View>
        <View
          onTouchEndCapture={this.handleTouchCapture}
          onTouchStart={this.flushReactChanges}>
          {/* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
            * comment suppresses an error when upgrading Flow's support for
            * React. To see the error delete this comment and run Flow. */}
          <this.props.Component onLog={this.handleLog} />
        </View>
        <View style={styles.logBox}>
          <DemoText style={styles.logText}>
            {this.state.log.join('\n')}
          </DemoText>
        </View>
      </View>
    );
  }
}

class NoneExample extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <View
        onTouchStart={() => this.props.onLog('A unspecified touched')}
        style={styles.box}>
        <DemoText style={styles.text}>A: unspecified</DemoText>
        <View
          pointerEvents="none"
          onTouchStart={() => this.props.onLog('B none touched')}
          style={[styles.box, styles.boxPassedThrough]}>
          <DemoText style={[styles.text, styles.textPassedThrough]}>
            B: none
          </DemoText>
          <View
            onTouchStart={() => this.props.onLog('C unspecified touched')}
            style={[styles.box, styles.boxPassedThrough]}>
            <DemoText style={[styles.text, styles.textPassedThrough]}>
              C: unspecified
            </DemoText>
          </View>
        </View>
      </View>
    );
  }
}

/**
 * Special demo text that makes itself untouchable so that it doesn't destroy
 * the experiment and confuse the output.
 */
class DemoText extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <View pointerEvents="none">
        <Text style={this.props.style}>{this.props.children}</Text>
      </View>
    );
  }
}

class BoxNoneExample extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <View
        onTouchStart={() => this.props.onLog('A unspecified touched')}
        style={styles.box}>
        <DemoText style={styles.text}>A: unspecified</DemoText>
        <View
          pointerEvents="box-none"
          onTouchStart={() => this.props.onLog('B box-none touched')}
          style={[styles.box, styles.boxPassedThrough]}>
          <DemoText style={[styles.text, styles.textPassedThrough]}>
            B: box-none
          </DemoText>
          <View
            onTouchStart={() => this.props.onLog('C unspecified touched')}
            style={styles.box}>
            <DemoText style={styles.text}>C: unspecified</DemoText>
          </View>
          <View
            pointerEvents="auto"
            onTouchStart={() =>
              this.props.onLog('C explicitly unspecified touched')
            }
            style={[styles.box]}>
            <DemoText style={[styles.text]}>C: explicitly unspecified</DemoText>
          </View>
        </View>
      </View>
    );
  }
}

class BoxOnlyExample extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <View
        onTouchStart={() => this.props.onLog('A unspecified touched')}
        style={styles.box}>
        <DemoText style={styles.text}>A: unspecified</DemoText>
        <View
          pointerEvents="box-only"
          onTouchStart={() => this.props.onLog('B box-only touched')}
          style={styles.box}>
          <DemoText style={styles.text}>B: box-only</DemoText>
          <View
            onTouchStart={() => this.props.onLog('C unspecified touched')}
            style={[styles.box, styles.boxPassedThrough]}>
            <DemoText style={[styles.text, styles.textPassedThrough]}>
              C: unspecified
            </DemoText>
          </View>
          <View
            pointerEvents="auto"
            onTouchStart={() =>
              this.props.onLog('C explicitly unspecified touched')
            }
            style={[styles.box, styles.boxPassedThrough]}>
            <DemoText style={[styles.text, styles.textPassedThrough]}>
              C: explicitly unspecified
            </DemoText>
          </View>
        </View>
      </View>
    );
  }
}

type ExampleClass = {
  Component: React.ComponentType<any>,
  title: string,
  description: string,
};

const exampleClasses: Array<ExampleClass> = [
  {
    Component: NoneExample,
    title: '`none`',
    description:
      '`none` causes touch events on the container and its child components to pass through to the parent container.',
  },
  {
    Component: BoxNoneExample,
    title: '`box-none`',
    description:
      '`box-none` causes touch events on the container to pass through and will only detect touch events on its child components.',
  },
  {
    Component: BoxOnlyExample,
    title: '`box-only`',
    description:
      "`box-only` causes touch events on the container's child components to pass through and will only detect touch events on the container itself.",
  },
];

const infoToExample = info => {
  return {
    title: info.title,
    description: info.description,
    render: function() {
      return <ExampleBox key={info.title} Component={info.Component} />;
    },
  };
};

const styles = StyleSheet.create({
  text: {
    fontSize: 10,
    color: '#5577cc',
  },
  textPassedThrough: {
    color: '#88aadd',
  },
  box: {
    backgroundColor: '#aaccff',
    borderWidth: 1,
    borderColor: '#7799cc',
    padding: 10,
    margin: 5,
  },
  boxPassedThrough: {
    borderColor: '#99bbee',
  },
  logText: {
    fontSize: 9,
  },
  logBox: {
    padding: 20,
    margin: 10,
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
});

exports.framework = 'React';
exports.title = 'Pointer Events';
exports.description =
  'Demonstrates the use of the pointerEvents prop of a ' +
  'View to control how touches should be handled.';
/* $FlowFixMe(>=0.70.0 site=react_native_fb) This comment suppresses an error
 * found when Flow v0.70 was deployed. To see the error delete this comment
 * and run Flow. */
exports.examples = exampleClasses.map(infoToExample);
