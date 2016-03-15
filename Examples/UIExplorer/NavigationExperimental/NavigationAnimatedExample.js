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

const React = require('react-native');

const {
  Animated,
  NavigationExperimental,
  StyleSheet,
  ScrollView,
} = React;

const  NavigationExampleRow = require('./NavigationExampleRow');

const  {
  AnimatedView: NavigationAnimatedView,
  Card: NavigationCard,
  Header: NavigationHeader,
  Reducer: NavigationReducer,
  RootContainer: NavigationRootContainer,
} = NavigationExperimental;

const NavigationBasicReducer = NavigationReducer.StackReducer({
  getPushedReducerForAction: (action) => {
    if (action.type === 'push') {
      return (state) => state || {key: action.key};
    }
    return null;
  },
  getReducerForState: (initialState) => (state) => state || initialState,
  initialState: {
    key: 'AnimatedExampleStackKey',
    index: 0,
    children: [
      {key: 'First Route'},
    ],
  },
});

class NavigationAnimatedExample extends React.Component {
  componentWillMount() {
    this._renderNavigation = this._renderNavigation.bind(this);
    this._renderCard = this._renderCard.bind(this);
    this._renderScene = this._renderScene.bind(this);
    this._renderHeader = this._renderHeader.bind(this);
  }
  render() {
    return (
      <NavigationRootContainer
        reducer={NavigationBasicReducer}
        ref={navRootContainer => { this.navRootContainer = navRootContainer; }}
        persistenceKey="NavigationAnimExampleState"
        renderNavigation={this._renderNavigation}
      />
    );
  }
  handleBackAction() {
    return (
      this.navRootContainer &&
      this.navRootContainer.handleNavigation(NavigationRootContainer.getBackAction())
    );
  }
  _renderNavigation(navigationState, onNavigate) {
    if (!navigationState) {
      return null;
    }
    return (
      <NavigationAnimatedView
        navigationState={navigationState}
        style={styles.animatedView}
        renderOverlay={this._renderHeader}
        applyAnimation={(pos, navState) => {
          Animated.timing(pos, {toValue: navState.index, duration: 500}).start();
        }}
        renderScene={this._renderCard}
      />
    );
  }

  _renderHeader(/*NavigationSceneRendererProps*/ props) {
    return (
      <NavigationHeader
        {...props}
        getTitle={state => state.key}
      />
    );
  }

  _renderCard(/*NavigationSceneRendererProps*/ props) {
    return (
      <NavigationCard
        {...props}
        key={'card_' + props.scene.navigationState.key}
        renderScene={this._renderScene}
      />
    );
  }

  _renderScene(/*NavigationSceneRendererProps*/ props) {
    return (
      <ScrollView style={styles.scrollView}>
        <NavigationExampleRow
          text={props.scene.navigationState.key}
        />
        <NavigationExampleRow
          text="Push!"
          onPress={() => {
            props.onNavigate({
              type: 'push',
              key: 'Route #' + props.scenes.length,
            });
          }}
        />
        <NavigationExampleRow
          text="Exit Animated Nav Example"
          onPress={this.props.onExampleExit}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  animatedView: {
    flex: 1,
  },
  scrollView: {
    marginTop: 64
  },
});

module.exports = NavigationAnimatedExample;
