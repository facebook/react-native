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
*/
'use strict';

var React = require('react-native');
var {
  AsyncStorage,
  ScrollView,
  StyleSheet,
  View,
} = React;
var NavigationExampleRow = require('./NavigationExampleRow');

/*
 * Heads up! This file is not the real navigation example- only a utility to switch between them.
 *
 * To learn how to use the Navigation API, take a look at the following example files:
 */
var EXAMPLES = {
  'Tabs': require('./NavigationTabsExample'),
  'Basic': require('./NavigationBasicExample'),
  'Animated Card Stack': require('./NavigationAnimatedExample'),
  'Composition': require('./NavigationCompositionExample'),
};

var EXAMPLE_STORAGE_KEY = 'NavigationExampleExample';

var NavigationExperimentalExample = React.createClass({
  statics: {
    title: 'Navigation (Experimental)',
    description: 'Upcoming navigation APIs and animated navigation views',
    external: true,
  },

  getInitialState: function() {
    return {
      exampe: null,
    };
  },

  componentDidMount() {
    AsyncStorage.getItem(EXAMPLE_STORAGE_KEY, (err, example) => {
      if (err || !example) {
        this.setState({
          example: 'menu',
        });
        return;
      }
      this.setState({
        example,
      });
    });
  },

  setExample: function(example) {
    this.setState({
      example,
    });
    AsyncStorage.setItem(EXAMPLE_STORAGE_KEY, example);
  },

  _renderMenu: function() {
    var exitRow = null;
    if (this.props.onExampleExit) {
      exitRow = (
        <NavigationExampleRow
          text="Exit Navigation Examples"
          onPress={this.props.onExampleExit}
        />
      );
    }
    return (
      <View style={styles.menu}>
        <ScrollView>
          {this._renderExampleList()}
          {exitRow}
        </ScrollView>
      </View>
    );
  },

  _renderExampleList: function() {
    return Object.keys(EXAMPLES).map(exampleName => (
      <NavigationExampleRow
        key={exampleName}
        text={exampleName}
        onPress={() => {
          this.setExample(exampleName);
        }}
      />
    ));
  },

  _exitInnerExample: function() {
    this.setExample('menu');
  },

  handleBackAction: function() {
    const wasHandledByExample = (
      this.exampleRef &&
      this.exampleRef.handleBackAction &&
      this.exampleRef.handleBackAction()
    );
    if (wasHandledByExample) {
      return true;
    }
    if (this.state.example && this.state.example !== 'menu') {
      this._exitInnerExample();
      return true;
    }
    return false;
  },

  render: function() {
    if (this.state.example === 'menu') {
      return this._renderMenu();
    }
    if (EXAMPLES[this.state.example]) {
      var Component = EXAMPLES[this.state.example];
      return (
        <Component
          onExampleExit={this._exitInnerExample}
          ref={exampleRef => { this.exampleRef = exampleRef; }}
        />
      );
    }
    return null;
  },
});

const styles = StyleSheet.create({
  menu: {
    backgroundColor: '#E9E9EF',
    flex: 1,
    marginTop: 20,
  },
});

module.exports = NavigationExperimentalExample;
