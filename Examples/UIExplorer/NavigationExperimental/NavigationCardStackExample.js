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

const NavigationExampleRow = require('./NavigationExampleRow');
const React = require('react');
const ReactNative = require('react-native');

const {
  NavigationExperimental,
  StyleSheet,
  ScrollView,
} = ReactNative;

const {
  CardStack: NavigationCardStack,
  StateUtils: NavigationStateUtils,
} = NavigationExperimental;

function createReducer(initialState) {
  return (currentState = initialState, action) => {
    switch (action.type) {
      case 'push':
        return NavigationStateUtils.push(currentState, {key: action.key});

      case 'BackAction':
      case 'back':
      case 'pop':
        return currentState.index > 0 ?
          NavigationStateUtils.pop(currentState) :
          currentState;

      default:
        return currentState;
    }
  };
}

const ExampleReducer = createReducer({
  index: 0,
  key: 'exmaple',
  children: [{key: 'First Route'}],
});

class NavigationCardStackExample extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      isHorizontal: true,
      navState: ExampleReducer(undefined, {}),
    };
  }

  componentWillMount() {
    this._renderScene = this._renderScene.bind(this);
    this._toggleDirection = this._toggleDirection.bind(this);
    this._handleAction = this._handleAction.bind(this);
  }

  render() {
    return (
      <NavigationCardStack
        direction={this.state.isHorizontal ? 'horizontal' : 'vertical'}
        navigationState={this.state.navState}
        onNavigate={this._handleAction}
        renderScene={this._renderScene}
        style={styles.main}
      />
    );
  }

  _handleAction(action): boolean {
    if (!action) {
      return false;
    }
    const newState = ExampleReducer(this.state.navState, action);
    if (newState === this.state.navState) {
      return false;
    }
    this.setState({
      navState: newState,
    });
    return true;
  }

  handleBackAction(): boolean {
    return this._handleAction({ type: 'BackAction', });
  }

  _renderScene(/*NavigationSceneRendererProps*/ props) {
    return (
      <ScrollView style={styles.scrollView}>
        <NavigationExampleRow
          text={
            this.state.isHorizontal ?
            'direction = "horizontal"' :
            'direction = "vertical"'
          }
          onPress={this._toggleDirection}
        />
        <NavigationExampleRow
          text={'route = ' + props.scene.route.key}
        />
        <NavigationExampleRow
          text="Push Route"
          onPress={() => {
            props.onNavigate({
              type: 'push',
              key: 'Route ' + props.scenes.length,
            });
          }}
        />
        <NavigationExampleRow
          text="Pop Route"
          onPress={() => {
            props.onNavigate({
              type: 'pop',
            });
          }}
        />
        <NavigationExampleRow
          text="Exit Card Stack Example"
          onPress={this.props.onExampleExit}
        />
      </ScrollView>
    );
  }

  _toggleDirection() {
    this.setState({
      isHorizontal: !this.state.isHorizontal,
    });
  }

}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  scrollView: {
    marginTop: 64
  },
});

module.exports = NavigationCardStackExample;
