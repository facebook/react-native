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

const React = require('react');
const ReactNative = require('react-native');
const {
  NavigationExperimental,
  ScrollView,
  StyleSheet,
} = ReactNative;
const NavigationExampleRow = require('./NavigationExampleRow');
const {
  Reducer: NavigationReducer,
} = NavigationExperimental;

const ExampleReducer = NavigationReducer.StackReducer({
  getPushedReducerForAction: (action) => {
    if (action.type === 'push') {
      return (state) => state || {key: action.key};
    }
    return null;
  },
  getReducerForState: (initialState) => (state) => state || initialState,
  initialState: {
    key: 'BasicExampleStackKey',
    index: 0,
    routes: [
      {key: 'First Route'},
    ],
  },
});

const NavigationBasicExample = React.createClass({

  getInitialState: function() {
    return ExampleReducer();
  },

  render: function() {
    return (
      <ScrollView style={styles.topView}>
        <NavigationExampleRow
          text={`Current page: ${this.state.croutes[this.state.index].key}`}
        />
        <NavigationExampleRow
          text={`Push page #${this.state.routes.length}`}
          onPress={() => {
            this._handleAction({ type: 'push', key: 'page #' + this.state.routes.length });
          }}
        />
        <NavigationExampleRow
          text="pop"
          onPress={() => {
            this._handleAction({ type: 'BackAction' });
          }}
        />
        <NavigationExampleRow
          text="Exit Basic Nav Example"
          onPress={this.props.onExampleExit}
        />
      </ScrollView>
    );
  },

  _handleAction(action) {
    if (!action) {
      return false;
    }
    const newState = ExampleReducer(this.state, action);
    if (newState === this.state) {
      return false;
    }
    this.setState(newState);
    return true;
  },

  handleBackAction() {
    return this._handleAction({ type: 'BackAction' });
  },

});

const styles = StyleSheet.create({
  topView: {
    backgroundColor: '#E9E9EF',
    flex: 1,
    paddingTop: 30,
  },
});

module.exports = NavigationBasicExample;
