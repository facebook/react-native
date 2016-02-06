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

const React = require('react-native');
const {
  NavigationExperimental,
  ScrollView,
  StyleSheet,
  View,
} = React;
const {
  Container: NavigationContainer,
  RootContainer: NavigationRootContainer,
  Reducer: NavigationReducer,
} = NavigationExperimental;

const NavigationExampleRow = require('./NavigationExampleRow');
const NavigationExampleTabBar = require('./NavigationExampleTabBar');

class ExmpleTabPage extends React.Component {
  render() {
    const currentTabRoute = this.props.tabs[this.props.index];
    return (
      <ScrollView style={styles.tabPage}>
        <NavigationExampleRow
          text={`Current Tab is: ${currentTabRoute.key}`}
        />
        {this.props.tabs.map((tab, index) => (
          <NavigationExampleRow
            key={tab.key}
            text={`Go to ${tab.key}`}
            onPress={() => {
              this.props.onNavigate(NavigationReducer.TabsReducer.JumpToAction(index));
            }}
          />
        ))}
        <NavigationExampleRow
          text="Exit Tabs Example"
          onPress={this.props.onExampleExit}
        />
      </ScrollView>
    );
  }
}
ExmpleTabPage = NavigationContainer.create(ExmpleTabPage);

const ExampleTabsReducer = NavigationReducer.TabsReducer({
  tabReducers: [
    (lastRoute) => lastRoute || {key: 'one'},
    (lastRoute) => lastRoute || {key: 'two'},
    (lastRoute) => lastRoute || {key: 'three'},
  ],
});

const NavigationTabsExample = React.createClass({
  render: function() {
    return (
      <NavigationRootContainer
        reducer={ExampleTabsReducer}
        persistenceKey="NAV_EXAMPLE_STATE_TABS"
        renderNavigation={(navigationState) => {
          if (!navigationState) { return null; }
          return (
            <View style={styles.topView}>
              <ExmpleTabPage
                tabs={navigationState.children}
                index={navigationState.index}
                onExampleExit={this.props.onExampleExit}
              />
              <NavigationExampleTabBar
                tabs={navigationState.children}
                index={navigationState.index}
              />
            </View>
          );
        }}
      />
    );
  },
});

const styles = StyleSheet.create({
  topView: {
    flex: 1,
    paddingTop: 30,
  },
  tabPage: {
    backgroundColor: '#E9E9EF',
  },
});

module.exports = NavigationTabsExample;
