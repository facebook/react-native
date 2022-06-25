/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {StyleSheet, Text, View} = require('react-native');

type ExampleBoxComponentProps = $ReadOnly<{|
  onLog: (msg: string) => void,
|}>;

type ExampleBoxProps = $ReadOnly<{|
  Component: React.ComponentType<ExampleBoxComponentProps>,
|}>;

type ExampleBoxState = $ReadOnly<{|
  log: string[],
|}>;

class ExampleBox extends React.Component<ExampleBoxProps, ExampleBoxState> {
  state = {
    log: [],
  };

  handleLog = (msg: string) => {
    // $FlowFixMe
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
    // $FlowFixMe
    this.state.log = this.state.log.concat(['---']);
  };

  render() {
    const {Component} = this.props;
    return (
      <View>
        <View
          onTouchEndCapture={this.handleTouchCapture}
          onTouchStart={this.flushReactChanges}>
          <Component onLog={this.handleLog} />
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

type OverflowExampleProps = $ReadOnly<{|
  overflow: 'hidden' | 'visible',
  onLog: (msg: string) => void,
|}>;

class OverflowExample extends React.Component<OverflowExampleProps> {
  render() {
    const {overflow} = this.props;
    return (
      <View
        onTouchStart={() => this.props.onLog(`A overflow ${overflow} touched`)}
        style={[
          styles.box,
          styles.boxWithOverflowSet,
          {overflow: this.props.overflow},
        ]}>
        <DemoText style={styles.text}>A: overflow: {overflow}</DemoText>
        <View
          onTouchStart={() => this.props.onLog('B overflowing touched')}
          style={[styles.box, styles.boxOverflowing]}>
          <DemoText style={styles.text}>B: overflowing</DemoText>
        </View>
        <View
          onTouchStart={() => this.props.onLog('C fully outside touched')}
          style={[styles.box, styles.boxFullyOutside]}>
          <DemoText style={styles.text}>C: fully outside</DemoText>
          <View
            onTouchStart={() =>
              this.props.onLog('D fully outside child touched')
            }
            style={[styles.box, styles.boxFullyOutsideChild]}>
            <DemoText style={styles.text}>D: child of fully outside</DemoText>
          </View>
        </View>
      </View>
    );
  }
}

class OverflowVisibleExample extends React.Component<ExampleBoxComponentProps> {
  render() {
    return <OverflowExample {...this.props} overflow="visible" />;
  }
}

class OverflowHiddenExample extends React.Component<ExampleBoxComponentProps> {
  render() {
    return <OverflowExample {...this.props} overflow="hidden" />;
  }
}

type ExampleClass = {
  Component: React.ComponentType<any>,
  title: string,
  description: string,
  ...
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
  {
    Component: OverflowVisibleExample,
    title: '`overflow: visible`',
    description:
      '`overflow: visible` style should allow subelements that are outside of the parent box to be touchable. Tapping the parts of Box B outside Box A should print "B touched" and "A touched", and tapping Box C should also print "C touched" and "A touched".',
  },
  {
    Component: OverflowHiddenExample,
    title: '`overflow: hidden`',
    description:
      '`overflow: hidden` style should only allow subelements within the parent box to be touchable. Tapping just below Box A (where Box B would otherwise extend if it weren\'t cut off) should not trigger any touches or messages. Touching Box D (inside the bounds) should print "D touched" and "A touched".',
  },
];

const infoToExample = (info: ExampleClass) => {
  return {
    title: info.title,
    description: info.description,
    render: function () {
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
  boxWithOverflowSet: {
    paddingBottom: 40,
    marginBottom: 50,
  },
  boxOverflowing: {
    position: 'absolute',
    top: 30,
    paddingBottom: 40,
  },
  boxFullyOutside: {
    position: 'absolute',
    left: 200,
    top: 65,
  },
  boxFullyOutsideChild: {
    position: 'absolute',
    left: 0,
    top: -65,
    width: 100,
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
exports.category = 'Basic';
exports.description = ('Demonstrates the use of the pointerEvents prop of a ' +
  'View to control how touches should be handled.': string);
exports.examples = (exampleClasses.map(infoToExample): Array<any>);
