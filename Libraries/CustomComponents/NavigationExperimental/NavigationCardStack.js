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

const NavigationTransitioner = require('NavigationTransitioner');
const NavigationCard = require('NavigationCard');
const NavigationCardStackStyleInterpolator = require('NavigationCardStackStyleInterpolator');
const NavigationCardStackPanResponder = require('NavigationCardStackPanResponder');
const NavigationPropTypes = require('NavigationPropTypes');
const React = require('React');
const ReactComponentWithPureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
const StyleSheet = require('StyleSheet');
const View = require('View');

const emptyFunction = require('fbjs/lib/emptyFunction');

const {PropTypes} = React;
const {Directions} = NavigationCardStackPanResponder;

import type {
  NavigationState,
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
  NavigationTransitionProps,
} from 'NavigationTypeDefinition';

import type {
  NavigationGestureDirection,
} from 'NavigationCardStackPanResponder';

type Props = {
  direction: NavigationGestureDirection,
  navigationState: NavigationState,
  onNavigateBack?: Function,
  renderOverlay: ?NavigationSceneRenderer,
  renderScene: NavigationSceneRenderer,
  cardStyle?: any,
  style: any,
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
  _render : NavigationSceneRenderer;
  _renderScene : NavigationSceneRenderer;

  static propTypes = {
    direction: PropTypes.oneOf([Directions.HORIZONTAL, Directions.VERTICAL]),
    navigationState: NavigationPropTypes.navigationState.isRequired,
    onNavigateBack: PropTypes.func,
    renderOverlay: PropTypes.func,
    renderScene: PropTypes.func.isRequired,
    cardStyle: View.propTypes.style,
  };

  static defaultProps: DefaultProps = {
    direction: Directions.HORIZONTAL,
    renderOverlay: emptyFunction.thatReturnsNull,
  };

  constructor(props: Props, context: any) {
    super(props, context);
  }

  componentWillMount(): void {
    this._render = this._render.bind(this);
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
      <NavigationTransitioner
        navigationState={this.props.navigationState}
        render={this._render}
        style={this.props.style}
      />
    );
  }

  _render(props: NavigationTransitionProps): ReactElement<any> {
    const {
       navigationState,
     } = props;

    let overlay = null;
    const renderOverlay = this.props.renderOverlay;

    if (renderOverlay) {
      const route = navigationState.routes[navigationState.index];

      const activeScene = props.scenes.find(
       scene => !scene.isStale && scene.route === route ? scene : undefined
      );

      overlay = renderOverlay({
       ...props,
       scene: activeScene
      });
    }

    const scenes = props.scenes.map(
     scene => this._renderScene({
       ...props,
       scene,
     }),
     this
    );

    return (
      <View
        style={styles.container}>
        <View
          style={styles.scenes}>
          {scenes}
        </View>
        {overlay}
      </View>
    );
  }

  _renderScene(props: NavigationSceneRendererProps): ReactElement<any> {
    const isVertical = this.props.direction === 'vertical';

    const style = isVertical ?
      NavigationCardStackStyleInterpolator.forVertical(props) :
      NavigationCardStackStyleInterpolator.forHorizontal(props);

    const panHandlersProps = {
      ...props,
      onNavigateBack: this.props.onNavigateBack,
    };
    const panHandlers = isVertical ?
      NavigationCardStackPanResponder.forVertical(panHandlersProps) :
      NavigationCardStackPanResponder.forHorizontal(panHandlersProps);

    return (
      <NavigationCard
        {...props}
        key={'card_' + props.scene.key}
        panHandlers={panHandlers}
        renderScene={this.props.renderScene}
        style={[style, this.props.cardStyle]}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scenes: {
    flex: 1,
  },
});

module.exports = NavigationCardStack;
