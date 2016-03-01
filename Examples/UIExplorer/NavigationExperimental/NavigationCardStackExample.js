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

const NavigationExampleRow = require('./NavigationExampleRow');
const React = require('react-native');

const {
  NavigationExperimental,
  StyleSheet,
  ScrollView,
} = React;

const NavigationCardStack = NavigationExperimental.CardStack;
const NavigationStateUtils = NavigationExperimental.StateUtils;

class NavigationCardStackExample extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.state = this._getInitialState();
    this._renderScene = this._renderScene.bind(this);
    this._push = this._push.bind(this);
    this._pop = this._pop.bind(this);
    this._toggleDirection = this._toggleDirection.bind(this);
  }

  render() {
    return (
      <NavigationCardStack
        direction={this.state.isHorizontal ? 'horizontal' : 'vertical'}
        navigationState={this.state.navigationState}
        renderScene={this._renderScene}
        style={styles.main}
      />
    );
  }

  _getInitialState() {
    const navigationState = {
      index: 0,
      children: [{key: 'First Route'}],
    };
    return {
      isHorizontal: true,
      navigationState,
    };
  }

  _push() {
    const state = this.state.navigationState;
    const nextState = NavigationStateUtils.push(
      state,
      {key: 'Route ' + (state.index + 1)},
    );
    this.setState({
      navigationState: nextState,
    });
  }

  _pop() {
    const state = this.state.navigationState;
    const nextState = state.index > 0 ?
      NavigationStateUtils.pop(state) :
      state;

    this.setState({
      navigationState: nextState,
    });
  }

  _renderScene(props) {
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
          text={'route = ' + props.navigationState.key}
        />
        <NavigationExampleRow
          text="Push Route"
          onPress={this._push}
        />
        <NavigationExampleRow
          text="Pop Route"
          onPress={this._pop}
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
