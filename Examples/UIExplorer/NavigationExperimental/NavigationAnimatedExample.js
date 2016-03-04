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
  Animated,
  NavigationExperimental,
  StyleSheet,
  ScrollView,
} = React;
var NavigationExampleRow = require('./NavigationExampleRow');
var {
  AnimatedView: NavigationAnimatedView,
  Card: NavigationCard,
  RootContainer: NavigationRootContainer,
  Reducer: NavigationReducer,
  Header: NavigationHeader,
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
    this._renderNavigated = this._renderNavigated.bind(this);
  }
  render() {
    return (
      <NavigationRootContainer
        reducer={NavigationBasicReducer}
        ref={navRootContainer => { this.navRootContainer = navRootContainer; }}
        persistenceKey="NavigationAnimExampleState"
        renderNavigation={this._renderNavigated}
      />
    );
  }
  handleBackAction() {
    return (
      this.navRootContainer &&
      this.navRootContainer.handleNavigation(NavigationRootContainer.getBackAction())
    );
  }
  _renderNavigated(navigationState, onNavigate) {
    if (!navigationState) {
      return null;
    }
    return (
      <NavigationAnimatedView
        navigationState={navigationState}
        style={styles.animatedView}
        renderOverlay={(props) => (
          <NavigationHeader
            navigationState={props.navigationParentState}
            position={props.position}
            getTitle={state => state.key}
          />
        )}
        setTiming={(pos, navState) => {
          Animated.timing(pos, {toValue: navState.index, duration: 1000}).start();
        }}
        renderScene={(props) => (
          <NavigationCard
            key={props.navigationState.key}
            index={props.index}
            navigationState={props.navigationParentState}
            position={props.position}
            layout={props.layout}>
            <ScrollView style={styles.scrollView}>
              <NavigationExampleRow
                text={props.navigationState.key}
              />
              <NavigationExampleRow
                text="Push!"
                onPress={() => {
                  onNavigate({
                    type: 'push',
                    key: 'Route #' + props.navigationParentState.children.length
                  });
                }}
              />
              <NavigationExampleRow
                text="Exit Animated Nav Example"
                onPress={this.props.onExampleExit}
              />
            </ScrollView>
          </NavigationCard>
        )}
      />
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
