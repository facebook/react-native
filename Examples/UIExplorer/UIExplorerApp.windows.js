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
 * @providesModule UIExplorerApp
 * @flow
 */
'use strict';

const React = require('react-native');
const {
  AppRegistry,
  BackAndroid,
  NavigationExperimental,
  SplitViewWindows,    
  StyleSheet,
  View,
} = React;
const {
  RootContainer: NavigationRootContainer,
} = NavigationExperimental;
const UIExplorerActions = require('./UIExplorerActions');
const UIExplorerExampleList = require('./UIExplorerExampleListWindows');
const UIExplorerList = require('./UIExplorerList');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const UIExplorerStateTitleMap = require('./UIExplorerStateTitleMap');
const UIExplorerHeaderWindows = require('./UIExplorerHeaderWindows');

var PANE_WIDTH = 250;

class UIExplorerApp extends React.Component {
  componentWillMount() {
    BackAndroid.addEventListener('hardwareBackPress', this._handleBackButtonPress.bind(this));
  }
  
  render() {
    return (
      <NavigationRootContainer
        persistenceKey="UIExplorerStateNavState"
        ref={navRootRef => { this._navigationRootRef = navRootRef; }}
        reducer={UIExplorerNavigationReducer}
        renderNavigation={this._renderApp.bind(this)}
      />
    );
  }
  
  _renderApp(navigationState, onNavigate) {
    if (!navigationState) {
      return null;
    }
    return (
      <SplitViewWindows
        panePosition={SplitViewWindows.positions.Left}
        paneWidth={PANE_WIDTH}
        keyboardDismissMode="on-drag"
        onDrawerOpen={() => {
          this._overrideBackPressForSplitView = true;
        }}
        onDrawerClose={() => {
          this._overrideBackPressForSplitView = false;
        }}
        ref={(splitView) => { this.splitView = splitView; }}
        renderPaneView={this._renderPaneContent.bind(this, onNavigate)}>
        {this._renderNavigation(navigationState, onNavigate)}
      </SplitViewWindows>
    );
  }
  
  _renderPaneContent(onNavigate) {
    return (
      <UIExplorerExampleList
        list={UIExplorerList}
        displayTitleRow={true}
        disableSearch={true}
        onNavigate={(action) => {
          this.pane && this.pane.closePane();
          onNavigate(action);
        }}
      />
    );
  }

  _renderNavigation(navigationState, onNavigate) {
    if (navigationState.externalExample) {
      var Component = UIExplorerList.Modules[navigationState.externalExample];
      return (
        <Component
          onExampleExit={() => {
            onNavigate(NavigationRootContainer.getBackAction());
          }}
          ref={(example) => { this._exampleRef = example; }}
        />
      );
    }
    const {stack} = navigationState;
    const title = UIExplorerStateTitleMap(stack.children[stack.index]);
    if (stack && stack.children[1]) {
      const {key} = stack.children[1];
      const ExampleModule = UIExplorerList.Modules[key];
      const ExampleComponent = UIExplorerExampleList.makeRenderable(ExampleModule);
      return (
        <View style={styles.container}>
          <UIExplorerHeaderWindows
            onPress={() => this.splitView.openPane()} 
            title={title}
            style={styles.header}
          />
          <ExampleComponent
            ref={(example) => { this._exampleRef = example; }}
          />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <UIExplorerHeaderWindows
          onPress={() => this.splitView.openPane()} 
          title={title}
          style={styles.header}
        />
        <UIExplorerExampleList
          list={UIExplorerList}
          {...stack.children[0]}
        />
      </View>
    );
  }

  _handleBackButtonPress() {
    if (
      this._exampleRef &&
      this._exampleRef.handleBackAction &&
      this._exampleRef.handleBackAction()
    ) {
      return true;
    }
    if (this._navigationRootRef) {
      return this._navigationRootRef.handleNavigation(
        NavigationRootContainer.getBackAction()
      );
    }
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#E9EAED',
  },
});

AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

module.exports = UIExplorerApp;
