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
 * @providesModule NavigationCardStack
 * @flow
 */
'use strict';

const NavigationAnimatedView = require('NavigationAnimatedView');
const NavigationCard = require('NavigationCard');
const NavigationCardStackStyleInterpolator = require('NavigationCardStackStyleInterpolator');
const NavigationCardStackPanResponder = require('NavigationCardStackPanResponder');
const NavigationPropTypes = require('NavigationPropTypes');
const React = require('React');
const ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');
const StyleSheet = require('StyleSheet');

const emptyFunction = require('fbjs/lib/emptyFunction');

const {PropTypes} = React;
const {Directions} = NavigationCardStackPanResponder;

import type {
  NavigationActionCaller,
  NavigationState,
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

import type {
  NavigationGestureDirection,
} from 'NavigationCardStackPanResponder';

type Props = {
  direction: NavigationGestureDirection,
  navigationState: NavigationState,
  onNavigate: NavigationActionCaller,
  renderOverlay: ?NavigationSceneRenderer,
  renderScene: NavigationSceneRenderer,
};

type DefaultProps = {
  direction: NavigationGestureDirection,
  renderOverlay: ?NavigationSceneRenderer,
};

/**
 * A controlled navigation view that renders a stack of cards.
 *
 *     +------------+
 *   +-+            |
 * +-+ |            |
 * | | |            |
 * | | |  Focused   |
 * | | |   Card     |
 * | | |            |
 * +-+ |            |
 *   +-+            |
 *     +------------+
 */
class NavigationCardStack extends React.Component<DefaultProps, Props, void> {
  _renderScene : NavigationSceneRenderer;

  static propTypes = {
    direction: PropTypes.oneOf([Directions.HORIZONTAL, Directions.VERTICAL]),
    navigationState: NavigationPropTypes.navigationState.isRequired,
    onNavigate: NavigationPropTypes.SceneRendererProps.onNavigate,
    renderOverlay: PropTypes.func,
    renderScene: PropTypes.func.isRequired,
  };

  static defaultProps: DefaultProps = {
    direction: Directions.HORIZONTAL,
    renderOverlay: emptyFunction.thatReturnsNull,
  };

  constructor(props: Props, context: any) {
    super(props, context);
  }

  componentWillMount(): void {
    this._renderScene = this._renderScene.bind(this);
  }

  shouldComponentUpdate(nextProps: Object, nextState: void): boolean {
    return ReactComponentWithPureRenderMixin.shouldComponentUpdate.call(
      this,
      nextProps,
      nextState
    );
  }

  render(): ReactElement<any> {
    return (
      <NavigationAnimatedView
        navigationState={this.props.navigationState}
        renderOverlay={this.props.renderOverlay}
        renderScene={this._renderScene}
        onNavigate={this.props.onNavigate}
        // $FlowFixMe - style should be declared
        style={[styles.animatedView, this.props.style]}
      />
    );
  }

  _renderScene(props: NavigationSceneRendererProps): ReactElement<any> {
    const isVertical = this.props.direction === 'vertical';

    const style = isVertical ?
      NavigationCardStackStyleInterpolator.forVertical(props) :
      NavigationCardStackStyleInterpolator.forHorizontal(props);

    const panHandlers = isVertical ?
      NavigationCardStackPanResponder.forVertical(props) :
      NavigationCardStackPanResponder.forHorizontal(props);

    return (
      <NavigationCard
        {...props}
        key={'card_' + props.scene.key}
        panHandlers={panHandlers}
        renderScene={this.props.renderScene}
        style={style}
      />
    );
  }
}

const styles = StyleSheet.create({
  animatedView: {
    flex: 1,
  },
});

module.exports = NavigationCardStack;
