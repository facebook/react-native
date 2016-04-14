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

var React = require('react');
var ReactNative = require('react-native');
var {
  Navigator,
  StyleSheet,
  ScrollView,
  TabBarIOS,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

var _getRandomRoute = function() {
  return {
    randNumber: Math.ceil(Math.random() * 1000),
  };
};

class NavButton extends React.Component {
  render() {
    return (
      <TouchableHighlight
        style={styles.button}
        underlayColor="#B5B5B5"
        onPress={this.props.onPress}>
        <Text style={styles.buttonText}>{this.props.text}</Text>
      </TouchableHighlight>
    );
  }
}

var ROUTE_STACK = [
  _getRandomRoute(),
  _getRandomRoute(),
  _getRandomRoute(),
];
var INIT_ROUTE_INDEX = 1;

class JumpingNavBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabIndex: props.initTabIndex,
    };
  }
  handleWillFocus(route) {
    var tabIndex = ROUTE_STACK.indexOf(route);
    this.setState({ tabIndex, });
  }
  render() {
    return (
      <View style={styles.tabs}>
        <TabBarIOS>
          <TabBarIOS.Item
            icon={require('image!tabnav_notification')}
            selected={this.state.tabIndex === 0}
            onPress={() => {
              this.props.onTabIndex(0);
              this.setState({ tabIndex: 0, });
            }}>
            <View />
          </TabBarIOS.Item>
          <TabBarIOS.Item
            icon={require('image!tabnav_list')}
            selected={this.state.tabIndex === 1}
            onPress={() => {
              this.props.onTabIndex(1);
              this.setState({ tabIndex: 1, });
            }}>
            <View />
          </TabBarIOS.Item>
          <TabBarIOS.Item
            icon={require('image!tabnav_settings')}
            selected={this.state.tabIndex === 2}
            onPress={() => {
              this.props.onTabIndex(2);
              this.setState({ tabIndex: 2, });
            }}>
            <View />
          </TabBarIOS.Item>
        </TabBarIOS>
      </View>
    );
  }
}

var JumpingNavSample = React.createClass({
  render: function() {
    return (
      <Navigator
        debugOverlay={false}
        style={styles.appContainer}
        ref={(navigator) => {
          this._navigator = navigator;
        }}
        initialRoute={ROUTE_STACK[INIT_ROUTE_INDEX]}
        initialRouteStack={ROUTE_STACK}
        renderScene={this.renderScene}
        configureScene={() => ({
          ...Navigator.SceneConfigs.HorizontalSwipeJump,
        })}
        navigationBar={
          <JumpingNavBar
            ref={(navBar) => { this.navBar = navBar; }}
            initTabIndex={INIT_ROUTE_INDEX}
            routeStack={ROUTE_STACK}
            onTabIndex={(index) => {
              this._navigator.jumpTo(ROUTE_STACK[index]);
            }}
          />
        }
      />
    );
  },

  renderScene: function(route, navigator) {
    var backBtn;
    var forwardBtn;
    if (ROUTE_STACK.indexOf(route) !== 0) {
      backBtn = (
        <NavButton
          onPress={() => {
            navigator.jumpBack();
          }}
          text="jumpBack"
        />
      );
    }
    if (ROUTE_STACK.indexOf(route) !== ROUTE_STACK.length - 1) {
      forwardBtn = (
        <NavButton
          onPress={() => {
            navigator.jumpForward();
          }}
          text="jumpForward"
        />
      );
    }
    return (
      <ScrollView style={styles.scene}>
        <Text style={styles.messageText}>#{route.randNumber}</Text>
        {backBtn}
        {forwardBtn}
        <NavButton
          onPress={() => {
            navigator.jumpTo(ROUTE_STACK[1]);
          }}
          text="jumpTo middle route"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.pop();
          }}
          text="Exit Navigation Example"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.push({
              message: 'Came from jumping example',
            });
          }}
          text="Nav Menu"
        />
      </ScrollView>
    );
  },
});

var styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CDCDCD',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  appContainer: {
    overflow: 'hidden',
    backgroundColor: '#dddddd',
    flex: 1,
  },
  messageText: {
    fontSize: 17,
    fontWeight: '500',
    padding: 15,
    marginTop: 50,
    marginLeft: 15,
  },
  scene: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#EAEAEA',
  },
  tabs: {
    height: 50,
  }
});

module.exports = JumpingNavSample;
