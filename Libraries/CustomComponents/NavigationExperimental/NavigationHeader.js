/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

const React = require('React');
const ReactNative = require('react-native');
const NavigationHeaderTitle = require('NavigationHeaderTitle');
const NavigationHeaderBackButton = require('NavigationHeaderBackButton');
const NavigationPropTypes = require('NavigationPropTypes');
const NavigationHeaderStyleInterpolator = require('NavigationHeaderStyleInterpolator');
const ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');

const {
  Animated,
  Platform,
  StyleSheet,
  View,
} = ReactNative;

import type  {
  NavigationActionCaller,
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
  NavigationStyleInterpolator,
} from 'NavigationTypeDefinition';

type DefaultProps = {
  renderLeftComponent: NavigationSceneRenderer,
  renderRightComponent: NavigationSceneRenderer,
  renderTitleComponent: NavigationSceneRenderer,
};

type Props = NavigationSceneRendererProps & {
  renderLeftComponent: NavigationSceneRenderer,
  renderRightComponent: NavigationSceneRenderer,
  renderTitleComponent: NavigationSceneRenderer,
  onNavigate: NavigationActionCaller,
  style?: any,
  viewProps?: any,
};

type SubViewName = 'left' | 'title' | 'right';

const APPBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;
const {PropTypes} = React;

class NavigationHeader extends React.Component<DefaultProps, Props, any> {
  props: Props;

  static defaultProps = {

    renderTitleComponent: (props: NavigationSceneRendererProps) => {
      const {navigationState} = props;
      const title = String(navigationState.title || '');
      return <NavigationHeaderTitle>{title}</NavigationHeaderTitle>;
    },

    renderLeftComponent: (props: NavigationSceneRendererProps) => {
      if (props.scene.index === 0) {
        return null;
      }
      return (
        <NavigationHeaderBackButton
          onNavigate={props.onNavigate}
        />
      );
    },

    renderRightComponent: (props: NavigationSceneRendererProps) => {
      return null;
    },
  };

  static propTypes = {
    ...NavigationPropTypes.SceneRendererProps,
    renderLeftComponent: PropTypes.func,
    renderRightComponent: PropTypes.func,
    renderTitleComponent: PropTypes.func,
    style: View.propTypes.style,
    viewProps: PropTypes.shape(View.propTypes),
  };

  shouldComponentUpdate(nextProps: Props, nextState: any): boolean {
    return ReactComponentWithPureRenderMixin.shouldComponentUpdate.call(
      this,
      nextProps,
      nextState
    );
  }

  render(): ReactElement<any> {
    const { scenes, style, viewProps } = this.props;

    const scenesProps = scenes.map(scene => {
      const props = NavigationPropTypes.extractSceneRendererProps(this.props);
      props.scene = scene;
      return props;
    });

    return (
      <View style={[ styles.appbar, style ]} {...viewProps}>
        {scenesProps.map(this._renderLeft, this)}
        {scenesProps.map(this._renderTitle, this)}
        {scenesProps.map(this._renderRight, this)}
      </View>
    );
  }

  _renderLeft(props: NavigationSceneRendererProps): ?ReactElement<any> {
    return this._renderSubView(
      props,
      'left',
      this.props.renderLeftComponent,
      NavigationHeaderStyleInterpolator.forLeft,
    );
  }

  _renderTitle(props: NavigationSceneRendererProps): ?ReactElement<any> {
    return this._renderSubView(
      props,
      'title',
      this.props.renderTitleComponent,
      NavigationHeaderStyleInterpolator.forCenter,
    );
  }

  _renderRight(props: NavigationSceneRendererProps): ?ReactElement<any> {
    return this._renderSubView(
      props,
      'right',
      this.props.renderRightComponent,
      NavigationHeaderStyleInterpolator.forRight,
    );
  }

  _renderSubView(
    props: NavigationSceneRendererProps,
    name: SubViewName,
    renderer: NavigationSceneRenderer,
    styleInterpolator: NavigationStyleInterpolator,
  ): ?ReactElement<any> {
    const {
      scene,
      navigationState,
    } = props;

    const {
      index,
      isStale,
      key,
    } = scene;

    const offset = navigationState.index - index;

    if (Math.abs(offset) > 2) {
      // Scene is far away from the active scene. Hides it to avoid unnecessary
      // rendering.
      return null;
    }

    const subView = renderer(props);
    if (subView === null) {
      return null;
    }

    const pointerEvents = offset !== 0 || isStale ? 'none' : 'box-none';
    return (
      <Animated.View
        pointerEvents={pointerEvents}
        key={name + '_' + key}
        style={[
          styles[name],
          styleInterpolator(props),
        ]}>
        {subView}
      </Animated.View>
    );
  }

  static HEIGHT = APPBAR_HEIGHT + STATUSBAR_HEIGHT;
  static Title = NavigationHeaderTitle;
  static BackButton = NavigationHeaderBackButton;

}

const styles = StyleSheet.create({
  appbar: {
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? '#EFEFF2' : '#FFF',
    borderBottomColor: 'rgba(0, 0, 0, .15)',
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    elevation: 4,
    flexDirection: 'row',
    height: APPBAR_HEIGHT + STATUSBAR_HEIGHT,
    justifyContent: 'flex-start',
    left: 0,
    marginBottom: 16, // This is needed for elevation shadow
    position: 'absolute',
    right: 0,
    top: 0,
  },

  title: {
    bottom: 0,
    left: APPBAR_HEIGHT,
    marginTop: STATUSBAR_HEIGHT,
    position: 'absolute',
    right: APPBAR_HEIGHT,
    top: 0,
  },

  left: {
    bottom: 0,
    left: 0,
    marginTop: STATUSBAR_HEIGHT,
    position: 'absolute',
    top: 0,
  },

  right: {
    bottom: 0,
    marginTop: STATUSBAR_HEIGHT,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

module.exports = NavigationHeader;
