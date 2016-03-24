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
const NavigationPropTypes = require('NavigationPropTypes');

const {
  Animated,
  Platform,
  StyleSheet,
  View,
} = React;

import type  {
  NavigationSceneRendererProps,
  NavigationScene,
} from 'NavigationTypeDefinition';

type Renderer = (props: NavigationSceneRendererProps, scene: NavigationScene) => ?ReactElement;

type DefaultProps = {
  renderTitleComponent: Renderer;
  renderLeftComponent: Renderer;
};

type Props = {
  navigationProps: NavigationSceneRendererProps;
  renderTitleComponent: Renderer;
  renderLeftComponent: Renderer;
  renderRightComponent: Renderer;
  style?: any;
}

const APPBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;

class NavigationHeader extends React.Component<DefaultProps, Props, void> {
  static defaultProps = {
    renderTitleComponent: (props, scene) => {
      const pageState = scene.navigationState;

      return <NavigationHeaderTitle>{pageState.title ? pageState.title : ''}</NavigationHeaderTitle>;
    },
    renderLeftComponent: (props, scene) => scene.index !== 0 ? <NavigationHeaderBackButton /> : null
  };

  static propTypes = {
    navigationProps: React.PropTypes.shape(NavigationPropTypes.SceneRenderer).isRequired,
    renderTitleComponent: React.PropTypes.func,
    renderLeftComponent: React.PropTypes.func,
    renderRightComponent: React.PropTypes.func,
    style: View.propTypes.style,
  };

  _renderLeftComponent(scene: NavigationScene) {
    const {
      renderLeftComponent,
      navigationProps,
    } = this.props;

    if (renderLeftComponent) {
      const {
        index,
        navigationState,
      } = scene;

      return (
        <Animated.View
          pointerEvents={navigationProps.navigationState.index === index ? 'auto' : 'none'}
          key={navigationState.key}
          style={[
            styles.left,
            {
              opacity: navigationProps.position.interpolate({
                inputRange: [ index - 1, index, index + 1 ],
                outputRange: [ 0, 1, 0 ],
              })
            }
          ]}
        >
          {renderLeftComponent(navigationProps, scene)}
        </Animated.View>
      );
    }

    return null;
  }

  _renderRightComponent(scene: NavigationScene) {
    const {
      renderRightComponent,
      navigationProps,
    } = this.props;

    if (renderRightComponent) {
      const {
        index,
        navigationState,
      } = scene;

      return (
        <Animated.View
          pointerEvents={navigationProps.navigationState.index === index ? 'auto' : 'none'}
          key={navigationState.key}
          style={[
            styles.right,
            {
              opacity: navigationProps.position.interpolate({
                inputRange: [ index - 1, index, index + 1 ],
                outputRange: [ 0, 1, 0 ],
              })
            }
          ]}
        >
          {renderRightComponent(navigationProps, scene)}
        </Animated.View>
      );
    }

    return null;
  }

  _renderTitleComponent(scene: NavigationScene) {
    const {
      renderTitleComponent,
      navigationProps,
    } = this.props;

    if (renderTitleComponent) {
      const {
        index,
        navigationState,
      } = scene;

      return (
        <Animated.View
          pointerEvents={navigationProps.navigationState.index === index ? 'auto' : 'none'}
          key={navigationState.key}
          style={[
            styles.title,
            {
              opacity: navigationProps.position.interpolate({
                inputRange: [ index - 1, index, index + 1 ],
                outputRange: [ 0, 1, 0 ],
              }),
              transform: [
                {
                  translateX: navigationProps.position.interpolate({
                    inputRange: [ index - 1, index + 1 ],
                    outputRange: [ 200, -200 ],
                  }),
                }
              ],
            }
          ]}
        >
          {renderTitleComponent(navigationProps, scene)}
        </Animated.View>
      );
    }

    return null;
  }

  render() {
    const { scenes } = this.props.navigationProps;

    return (
      <View style={[ styles.appbar, this.props.style ]}>
        {scenes.map(this._renderLeftComponent, this)}
        {scenes.map(this._renderTitleComponent, this)}
        {scenes.map(this._renderRightComponent, this)}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  appbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: Platform.OS === 'ios' ? '#EFEFF2' : '#FFF',
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

NavigationHeader = NavigationContainer.create(NavigationHeader);

NavigationHeader.HEIGHT = APPBAR_HEIGHT + STATUSBAR_HEIGHT;
NavigationHeader.Title = NavigationHeaderTitle;
NavigationHeader.BackButton = NavigationHeaderBackButton;

module.exports = NavigationHeader;
