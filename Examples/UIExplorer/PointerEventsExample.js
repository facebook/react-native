/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
} = React;

var ExampleBox = React.createClass({
  getInitialState: function() {
    return {
      log: [],
    };
  },
  handleLog: function(msg) {
    this.state.log = this.state.log.concat([msg]);
  },
  flushReactChanges: function() {
    this.forceUpdate();
  },
  /**
   * Capture phase of bubbling to append separator before any of the bubbling
   * happens.
   */
  handleTouchCapture: function() {
    this.state.log = this.state.log.concat(['---']);
  },
  render: function() {
    return (
      <View>
        <View
          onTouchEndCapture={this.handleTouchCapture}
          onTouchStart={this.flushReactChanges}>
          <this.props.Component onLog={this.handleLog} />
        </View>
        <View
          style={styles.logBox}>
          <DemoText style={styles.logText}>
            {this.state.log.join('\n')}
          </DemoText>
        </View>
      </View>
    );
  }
});


var NoneExample = React.createClass({
  render: function() {
    return (
      <View
        onTouchStart={() => this.props.onLog('A unspecified touched')}
        style={styles.box}>
        <DemoText style={styles.text}>
          A: unspecified
        </DemoText>
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
});

/**
 * Special demo text that makes itself untouchable so that it doesn't destroy
 * the experiment and confuse the output.
 */
var DemoText = React.createClass({
  render: function() {
    return (
      <View pointerEvents="none">
        <Text
          style={this.props.style}>
          {this.props.children}
        </Text>
      </View>
    );
  }
});

var BoxNoneExample = React.createClass({
  render: function() {
    return (
      <View
        onTouchStart={() => this.props.onLog('A unspecified touched')}
        style={styles.box}>
        <DemoText style={styles.text}>
          A: unspecified
        </DemoText>
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
            <DemoText style={styles.text}>
              C: unspecified
            </DemoText>
          </View>
          <View
            pointerEvents="auto"
            onTouchStart={() => this.props.onLog('C explicitly unspecified touched')}
            style={[styles.box]}>
            <DemoText style={[styles.text]}>
              C: explicitly unspecified
            </DemoText>
          </View>
        </View>
      </View>
    );
  }
});

var BoxOnlyExample = React.createClass({
  render: function() {
    return (
      <View
        onTouchStart={() => this.props.onLog('A unspecified touched')}
        style={styles.box}>
        <DemoText style={styles.text}>
          A: unspecified
        </DemoText>
        <View
          pointerEvents="box-only"
          onTouchStart={() => this.props.onLog('B box-only touched')}
          style={styles.box}>
          <DemoText style={styles.text}>
            B: box-only
          </DemoText>
          <View
            onTouchStart={() => this.props.onLog('C unspecified touched')}
            style={[styles.box, styles.boxPassedThrough]}>
            <DemoText style={[styles.text, styles.textPassedThrough]}>
              C: unspecified
            </DemoText>
          </View>
          <View
            pointerEvents="auto"
            onTouchStart={() => this.props.onLog('C explicitly unspecified touched')}
            style={[styles.box, styles.boxPassedThrough]}>
            <DemoText style={[styles.text, styles.textPassedThrough]}>
              C: explicitly unspecified
            </DemoText>
          </View>
        </View>
      </View>
    );
  }
});

type ExampleClass = {
  Component: ReactClass<any>,
  title: string,
  description: string,
};

var exampleClasses: Array<ExampleClass> = [
  {
    Component: NoneExample,
    title: '`none`',
    description: '`none` causes touch events on the container and its child components to pass through to the parent container.',
  },
  {
    Component: BoxNoneExample,
    title: '`box-none`',
    description: '`box-none` causes touch events on the container to pass through and will only detect touch events on its child components.',
  },
  {
    Component: BoxOnlyExample,
    title: '`box-only`',
    description: '`box-only` causes touch events on the container\'s child components to pass through and will only detect touch events on the container itself.',
  }
];

var infoToExample = (info) => {
  return {
    title: info.title,
    description: info.description,
    render: function() {
      return <ExampleBox key={info.title} Component={info.Component} />;
    },
  };
};

var styles = StyleSheet.create({
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
  bottomSpacer: {
    marginBottom: 100,
  },
});

exports.framework = 'React';
exports.title = 'Pointer Events';
exports.description = 'Demonstrates the use of the pointerEvents prop of a ' +
  'View to control how touches should be handled.';
exports.examples = exampleClasses.map(infoToExample);
