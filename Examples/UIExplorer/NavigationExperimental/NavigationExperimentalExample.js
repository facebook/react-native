/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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

const AsyncStorage = require('AsyncStorage');
const NavigationExampleRow = require('./NavigationExampleRow');
const React = require('react');
const ScrollView = require('ScrollView');
const StyleSheet = require('StyleSheet');
const View = require('View');

/*
 * Heads up! This file is not the real navigation example- only a utility to switch between them.
 *
 * To learn how to use the Navigation API, take a look at the following example files:
 */
const EXAMPLES = {
  'CardStack + Header + Tabs Example': require('./NavigationCardStack-NavigationHeader-Tabs-example'),
  'CardStack Example': require('./NavigationCardStack-example'),
  'Transitioner + Animated View Example': require('./NavigationTransitioner-AnimatedView-example'),
};

const EXAMPLE_STORAGE_KEY = 'NavigationExperimentalExample';

const NavigationExperimentalExample = React.createClass({
  statics: {
    title: 'Navigation (Experimental)',
    description: 'Upcoming navigation APIs and animated navigation views',
    external: true,
  },

  getInitialState: function() {
    return {
      example: null,
    };
  },

  componentDidMount() {
    AsyncStorage.getItem(EXAMPLE_STORAGE_KEY, (err, example) => {
      if (err || !example || !EXAMPLES[example]) {
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
    let exitRow = null;
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
      const Component = EXAMPLES[this.state.example];
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
