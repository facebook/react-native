/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule NavigationHeader
 * @flow
 */
'use strict';

const Animated = require('Animated');
const Image = require('Image');
const NavigationContainer = require('NavigationContainer');
const NavigationRootContainer = require('NavigationRootContainer');
const React = require('react-native');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableOpacity = require('TouchableOpacity');
const View = require('View');

import type {
  NavigationState,
  NavigationParentState
} from 'NavigationStateUtils';

type Props = {
  navigationState: NavigationParentState,
  onNavigate: Function,
  position: Animated.Value,
  getTitle: (navState: NavigationState) => string,
};

class NavigationHeader extends React.Component {
  _handleBackPress: Function;
  props: Props;
  componentWillMount() {
    this._handleBackPress = this._handleBackPress.bind(this);
  }
  render() {
    var state = this.props.navigationState;
    return (
      <Animated.View
        style={[
          styles.header,
        ]}>
        {state.children.map(this._renderTitle, this)}
        {this._renderBackButton()}
      </Animated.View>
    );
  }
  _renderBackButton() {
    if (this.props.navigationState.index === 0) {
      return null;
    }
    return (
      <TouchableOpacity style={styles.backButton} onPress={this._handleBackPress}>
        <Image source={require('./back_chevron.png')} style={styles.backButtonImage} />
      </TouchableOpacity>
    );
  }
  _renderTitle(childState, index) {
    return (
      <Animated.Text
        key={childState.key}
        style={[
          styles.title,
          {
            opacity: this.props.position.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [0, 1, 0],
            }),
            left: this.props.position.interpolate({
              inputRange: [index - 1, index + 1],
              outputRange: [200, -200],
            }),
            right: this.props.position.interpolate({
              inputRange: [index - 1, index + 1],
              outputRange: [-200, 200],
            }),
          },
        ]}>
        {this.props.getTitle(childState)}
      </Animated.Text>
    );
  }
  _handleBackPress() {
    this.props.onNavigate(NavigationRootContainer.getBackAction());
  }
}

NavigationHeader = NavigationContainer.create(NavigationHeader);

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 18,
    fontWeight: '500',
    color: '#0A0A0A',
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
  },
  header: {
    backgroundColor: '#EFEFF2',
    paddingTop: 20,
    top: 0,
    height: 64,
    right: 0,
    left: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: '#828287',
    position: 'absolute',
  },
  backButton: {
    width: 29,
    height: 37,
    position: 'absolute',
    bottom: 4,
    left: 2,
    padding: 8,
  },
  backButtonImage: {
    width: 13,
    height: 21,
  },
});

module.exports = NavigationHeader;
