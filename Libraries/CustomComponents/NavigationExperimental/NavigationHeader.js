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

const React = require('react-native');
const NavigationContainer = require('NavigationContainer');
const NavigationHeaderTitle = require('NavigationHeaderTitle');
const NavigationHeaderBackButton = require('NavigationHeaderBackButton');

const {
  Animated,
  Platform,
  StyleSheet,
  View,
} = React;

const APPBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;

import type {
  NavigationScene,
} from 'NavigationStateUtils';

type Renderer = (scene: NavigationScene) => ReactElement;

type DefaultProps = {
  renderTitleComponent: Renderer;
  renderLeftComponent: Renderer;
};

type Props = {
  position: Animated.Value,
  scenes: Array<NavigationScene>;
  index: number;
  renderTitleComponent: Renderer;
  renderLeftComponent: Renderer;
  renderRightComponent: Renderer;
  style: any,
};

class NavigationHeader extends React.Component<DefaultProps, Props, void> {
  _renderLeftComponent(scene) {
    const {
      renderLeftComponent,
      position,
    } = this.props;

    if (renderLeftComponent) {
      const {
        index,
        state,
      } = scene;

      return (
        <Animated.View
          pointerEvents={this.props.index === index ? 'auto' : 'none'}
          key={state.key}
          style={[
            styles.left,
            {
              opacity: position.interpolate({
                inputRange: [ index - 1, index, index + 1 ],
                outputRange: [ 0, 1, 0 ],
              })
            }
          ]}
        >
          {renderLeftComponent(state, index)}
        </Animated.View>
      );
    }

    return null;
  }

  _renderRightComponent(scene) {
    const {
      renderRightComponent,
      position,
    } = this.props;

    if (renderRightComponent) {
      const {
        index,
        state,
      } = scene;

      return (
        <Animated.View
          pointerEvents={this.props.index === index ? 'auto' : 'none'}
          key={state.key}
          style={[
            styles.right,
            {
              opacity: position.interpolate({
                inputRange: [ index - 1, index, index + 1 ],
                outputRange: [ 0, 1, 0 ],
              })
            }
          ]}
        >
          {renderRightComponent(state, index)}
        </Animated.View>
      );
    }

    return null;
  }

  _renderTitleComponent(scene) {
    const {
      renderTitleComponent,
      position,
    } = this.props;

    if (renderTitleComponent) {
      const {
        index,
        state,
      } = scene;

      return (
        <Animated.View
          pointerEvents={this.props.index === index ? 'auto' : 'none'}
          key={state.key}
          style={[
            styles.title,
            {
              opacity: position.interpolate({
                inputRange: [ index - 1, index, index + 1 ],
                outputRange: [ 0, 1, 0 ],
              }),
              transform: [
                {
                  translateX: position.interpolate({
                    inputRange: [ index - 1, index + 1 ],
                    outputRange: [ 200, -200 ],
                  }),
                }
              ],
            }
          ]}
        >
          {renderTitleComponent(state, index)}
        </Animated.View>
      );
    }

    return null;
  }

  render() {
    const { scenes } = this.props;

    return (
      <View style={[ styles.appbar, this.props.style ]}>
        {scenes.map(this._renderLeftComponent, this)}
        {scenes.map(this._renderTitleComponent, this)}
        {scenes.map(this._renderRightComponent, this)}
      </View>
    );
  }
}

const renderTitleComponent = pageState => <NavigationHeaderTitle>{pageState.title}</NavigationHeaderTitle>;
const renderLeftComponent = (pageState, index) => index !== 0 ? <NavigationHeaderBackButton /> : null;

NavigationHeader.defaultProps = {
  renderTitleComponent,
  renderLeftComponent,
};

NavigationHeader.propTypes = {
  position: React.PropTypes.object.isRequired,
  scenes: React.PropTypes.arrayOf(React.PropTypes.shape({
    index: React.PropTypes.number,
    state: React.PropTypes.any,
  })).isRequired,
  index: React.PropTypes.number.isRequired,
  renderTitleComponent: React.PropTypes.func,
  renderLeftComponent: React.PropTypes.func,
  renderRightComponent: React.PropTypes.func,
  style: View.propTypes.style,
};

NavigationHeader.APPBAR_HEIGHT = APPBAR_HEIGHT;
NavigationHeader.STATUSBAR_HEIGHT = STATUSBAR_HEIGHT;

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, .9)' : 'rgba(255, 255, 255, 1)',
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderBottomColor: 'rgba(0, 0, 0, .15)',
    height: APPBAR_HEIGHT + STATUSBAR_HEIGHT,
    marginBottom: 16, // This is needed for elevation shadow
    elevation: 2,
  },

  title: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: APPBAR_HEIGHT,
    right: APPBAR_HEIGHT,
    marginTop: STATUSBAR_HEIGHT,
  },

  left: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    marginTop: STATUSBAR_HEIGHT,
  },

  right: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    marginTop: STATUSBAR_HEIGHT,
  }
});

module.exports = NavigationContainer.create(NavigationHeader);
