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
const NavigationPropTypes = require('NavigationPropTypes');
const NavigationRootContainer = require('NavigationRootContainer');
const React = require('react-native');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableOpacity = require('TouchableOpacity');
const View = require('View');

import type  {
  NavigationState,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

type Props = NavigationSceneRendererProps & {
  getTitle: (navState: NavigationState) => object,
  getLeftButton: (navState: NavigationState) => func,
  getRightButton: (navState: NavigationState) => func,
};

const {PropTypes} = React;

const NavigationHeaderPropTypes = {
  ...NavigationPropTypes.SceneRenderer,
  getTitle: PropTypes.func.isRequired,
  getLeftButton: PropTypes.func,
  getRightButton: PropTypes.func,
  style: View.propTypes.style
};

class NavigationHeader extends React.Component {
  _handleBackPress: Function;

  props: Props;

  componentWillMount(): void {
    this._handleBackPress = this._handleBackPress.bind(this);
  }

  render(): ReactElement {
    var state = this.props.navigationState;
    return (
      <Animated.View
        style={[
          styles.header,
          (this.props.style ? this.props.style : null),
        ]}>
        {state.children.map(this._renderTitle, this)}
        {this._renderLeftButton()}
        {this._renderRightButton()}
      </Animated.View>
    );
  }

  _renderLeftButton(): ?ReactElement {
      if (this.props.navigationState.children.length <= 0) {
          return null
      }

      let lastChildIndex = this.props.navigationState.children.length - 1
      let childState = this.props.navigationState.children[lastChildIndex]
      let index = lastChildIndex

      let leftButton = (this.props.getLeftButton ? this.props.getLeftButton(childState) : null)

      if (leftButton == null) {
          leftButton = this._renderBackButton()
      }

      return (
        <Animated.View
          key={childState.key + '-LeftButton'}
          style={[
            styles.leftButton,
            {
              opacity: this.props.position.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [0, 1, 0],
              })
            },
          ]}>
          {leftButton}
        </Animated.View>
      );
  }

  _renderRightButton(): ?ReactElement {
      if (this.props.navigationState.children.length <= 0) {
          return null
      }

      let lastChildIndex = this.props.navigationState.children.length - 1
      let childState = this.props.navigationState.children[lastChildIndex]
      let index = lastChildIndex

      let rightButton = (this.props.getRightButton ? this.props.getRightButton(childState) : null)

      return (
        <Animated.View
          key={childState.key + '-RightButton'}
          style={[
            styles.rightButton,
            {
              opacity: this.props.position.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [0, 1, 0],
              })
            },
          ]}>
          {rightButton}
        </Animated.View>
      );
  }

  _renderBackButton(): ?ReactElement {
    if (this.props.navigationState.index === 0) {
      return null;
    }
    return (
      <TouchableOpacity style={styles.backButton} onPress={this._handleBackPress}>
        <Image source={require('./back_chevron.png')} style={styles.backButtonImage} />
      </TouchableOpacity>
    );
  }

  _renderTitle(childState: NavigationState, index:number): ?ReactElement {
    let title = this.props.getTitle(childState)

    if (title !== String) {
        return (
          <Animated.View
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
            {title}
          </Animated.View>
        );
    }

    return (
      <Animated.Text
        key={childState.key}
        style={[
          styles.titleText,
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
        {title}
      </Animated.Text>
    );
  }

  _handleBackPress(): void {
    this.props.onNavigate(NavigationRootContainer.getBackAction());
  }
}

NavigationHeader.propTypes = NavigationHeaderPropTypes;

NavigationHeader = NavigationContainer.create(NavigationHeader);

const styles = StyleSheet.create({
  title: {
    marginTop: 10,
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
  },
  titleText: {
    textAlign: 'center',
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
  leftButton: {
    height: 37,
    position: 'absolute',
    bottom: 4,
    left: 2,
  },
  rightButton: {
    height: 37,
    position: 'absolute',
    bottom: 4,
    right: 2,
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
