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
 * @providesModule NavigationCard
 * @flow
 */
'use strict';

const Animated = require('Animated');
const NavigationContainer = require('NavigationContainer');
const NavigationLinearPanResponder = require('NavigationLinearPanResponder');
const NavigationPropTypes = require('NavigationPropTypes');
const React = require('React');
const ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');
const StyleSheet = require('StyleSheet');
const View = require('View');

const {Directions} = NavigationLinearPanResponder;

import type  {
  NavigationAnimatedValue,
  NavigationLayout,
  NavigationPosition,
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

import type {
  NavigationGestureDirection
} from 'NavigationLinearPanResponder';

type State = {
  hash: string,
  height: number,
  width: number,
};

type Props = NavigationSceneRendererProps & {
  direction: NavigationGestureDirection,
  renderScene: NavigationSceneRenderer,
};

const {PropTypes} = React;

const propTypes = {
  ...NavigationPropTypes.SceneRenderer,
  direction: PropTypes.oneOf([Directions.HORIZONTAL, Directions.VERTICAL]),
  renderScene: PropTypes.func.isRequired,
};

const defaultProps = {
  direction: Directions.HORIZONTAL,
};

class AmimatedValueSubscription {
  _value: NavigationAnimatedValue;
  _token: string;

  constructor(value: NavigationAnimatedValue, callback: Function) {
    this._value = value;
    this._token = value.addListener(callback);
  }

  remove() {
    this._value.removeListener(this._token);
  }
}

/**
 * Class that provides the required information for the
 * `NavigationLinearPanResponder`. This class must implement
 * the interface `NavigationLinearPanResponderDelegate`.
 */
class PanResponderDelegate {
  _props : Props;

  constructor(props: Props) {
    this._props = props;
  }

  getDirection(): NavigationGestureDirection {
    return this._props.direction;
  }

  getIndex(): number {
    return this._props.navigationState.index;
  }

  getLayout(): NavigationLayout {
    return this._props.layout;
  }

  getPosition(): NavigationPosition {
    return this._props.position;
  }

  onNavigate(action: {type: string}): void {
    this._props.onNavigate && this._props.onNavigate(action);
  }
}

/**
 * Component that renders the scene as card for the <NavigationCardStack />.
 */
class NavigationCard extends React.Component {
  props: Props;
  state: State;
  _calculateState: (t: NavigationLayout) => State;
  _layoutListeners: Array<AmimatedValueSubscription>;

  constructor(props: Props, context: any) {
    super(props, context);

    this.state = this._calculateState(props.layout);
    this._layoutListeners = [];
  }

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    return ReactComponentWithPureRenderMixin.shouldComponentUpdate.call(
      this,
      nextProps,
      nextState
    );
  }

  componentWillMount(): void {
    this._calculateState = this._calculateState.bind(this);
  }

  componentDidMount(): void {
    this._applyLayout(this.props.layout);
  }

  componentWillUnmount(): void {
    this._layoutListeners.forEach(subscription => subscription.remove);
  }

  componentWillReceiveProps(nextProps: Props): void {
    this._applyLayout(nextProps.layout);
  }

  render(): ReactElement {
    const {
      direction,
      layout,
      navigationState,
      onNavigate,
      position,
      scene,
      scenes,
    } = this.props;

    const {
      height,
      width,
    } = this.state;

    const index = scene.index;
    const isVertical = direction === 'vertical';
    const inputRange = [index - 1, index, index + 1];
    const animatedStyle = {

      opacity: position.interpolate({
        inputRange,
        outputRange: [1, 1, 0.3],
      }),

      transform: [
        {
          scale: position.interpolate({
            inputRange,
            outputRange: [1, 1, 0.95],
          }),
        },
        {
          translateX: isVertical ? 0 :
            position.interpolate({
              inputRange,
              outputRange: [width, 0, -10],
            }),
        },
        {
          translateY: !isVertical ? 0 :
            position.interpolate({
              inputRange,
              outputRange: [height, 0, -10],
            }),
        },
      ],
    };

    let panHandlers = null;
    if (navigationState.index === index) {
      const delegate = new PanResponderDelegate(this.props);
      const panResponder = new NavigationLinearPanResponder(delegate);
      panHandlers = panResponder.panHandlers;
    }

    const sceneProps = {
      layout,
      navigationState,
      onNavigate,
      position,
      scene,
      scenes,
    };

    return (
      <Animated.View
        {...panHandlers}
        style={[styles.main, animatedStyle]}>
        {this.props.renderScene(sceneProps)}
      </Animated.View>
    );
  }

  _calculateState(layout: NavigationLayout): State {
    const width = layout.width.__getValue();
    const height = layout.height.__getValue();
    const hash = 'layout-' + width + '-' + height;
    const state = {
      height,
      width,
      hash,
    };
    return state;
  }

  _applyLayout(layout: NavigationLayout) {
    this._layoutListeners.forEach(subscription => subscription.remove);

    this._layoutListeners.length = 0;

    const callback = this._applyLayout.bind(this, layout);

    this._layoutListeners.push(
      new AmimatedValueSubscription(layout.width, callback),
      new AmimatedValueSubscription(layout.height, callback),
    );

    const nextState = this._calculateState(layout);
    if (nextState.hash !== this.state.hash) {
      this.setState(nextState);
    }
  }
}

NavigationCard.propTypes = propTypes;
NavigationCard.defaultProps = defaultProps;

const styles = StyleSheet.create({
  main: {
    backgroundColor: '#E9E9EF',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    top: 0,
  },
});

module.exports = NavigationContainer.create(NavigationCard);
