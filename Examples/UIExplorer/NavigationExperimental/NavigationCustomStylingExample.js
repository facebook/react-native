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

class NavigationCustomStylingExample extends React.Component {
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
        persistenceKey="NavigationCustomStylingExampleState"
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
        style={styles.header}
        navigationProps={props}
        renderTitleComponent={(navigationProps, scene) => {
          return (
            <NavigationHeader.Title
              textStyle={styles.titleText}>
              {scene.navigationState.key}
            </NavigationHeader.Title>);
        }}
        renderLeftComponent={(navigationProps, scene) => {
          return (
            <NavigationHeader.BackButton
              imageSource={require('./assets/back-icon.png')}
            />);
        }}
      />
    );
  }

  _renderCard(/*NavigationSceneRendererProps*/ props) {
    return (
      <NavigationCard
        {...props}
        style={styles.card}
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
          darkMode={true}
        />
        <NavigationExampleRow
          text="Push!"
          onPress={() => {
            props.onNavigate({
              type: 'push',
              key: 'Route #' + props.scenes.length,
            });
          }}
          darkMode={true}
        />
        <NavigationExampleRow
          text="Exit Custom Styling Example"
          onPress={this.props.onExampleExit}
          darkMode={true}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  animatedView: {
    flex: 1,
    backgroundColor: '#32383D',
  },
  scrollView: {
    marginTop: NavigationHeader.HEIGHT,
  },
  header: {
    backgroundColor: '#32383D',
    borderBottomColor: '#A1B4C4',
  },
  titleText: {
    color: '#1BC6B4',
  },
  card: {
    backgroundColor: '#32383D',
  },
});

module.exports = NavigationCustomStylingExample;
