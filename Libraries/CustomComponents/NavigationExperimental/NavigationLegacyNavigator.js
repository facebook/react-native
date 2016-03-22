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
 * @providesModule NavigationLegacyNavigator
 * @flow
 */
'use strict';

const Animated = require('Animated');
const NavigationAnimatedValueSubscription = require('NavigationAnimatedValueSubscription');
const NavigationAnimatedView = require('NavigationAnimatedView');
const NavigationCard = require('NavigationCard');
const NavigationCardStackStyleInterpolator = require('NavigationCardStackStyleInterpolator');
const NavigationContext = require('NavigationContext');
const NavigationLegacyNavigatorRouteStack = require('NavigationLegacyNavigatorRouteStack');
const NavigationLinearPanResponder = require('NavigationLinearPanResponder');
const NavigatorBreadcrumbNavigationBar = require('NavigatorBreadcrumbNavigationBar');
const NavigatorNavigationBar = require('NavigatorNavigationBar');
const NavigatorSceneConfigs = require('NavigatorSceneConfigs');
const React = require('react-native');
const ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');

import type  {
  NavigationAnimatedValue,
  NavigationAnimationSetter,
  NavigationParentState,
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

type Props = {
  configureScene: any,
  initialRoute: any,
  initialRouteStack: any,
  navigationBar: any,
  navigationBarNavigator: any,
  navigator: any,
  onDidFocus: any,
  onWillFocus: any,
  renderScene: any,
  renderScene: any,
  style: any,
};

type State = {
  presentedIndex: number,
  routeStack: Array<any>,
};

function getConfigPopDirection(config: any): ?string {
  if (config && config.gestures && config.gestures.pop) {
    const direction = config.gestures.pop.direction;
    return direction ? String(direction) : null;
  }

  return null;
}

const RouteStack = NavigationLegacyNavigatorRouteStack;

/**
 * NavigationLegacyNavigator is meant to replace Navigator seemlessly with
 * minimum API changes.
 *
 * While the APIs remain compatible with Navigator, it is built with good
 * intention by using the new Navigation API such as
 * `NavigationAnimatedView`...etc.
 */
class NavigationLegacyNavigator extends React.Component<any, Props, State> {
  static BreadcrumbNavigationBar: any;
  static NavigationBar: any;
  static SceneConfigs: any;

  _applyAnimation: NavigationAnimationSetter;
  _navigationBarRef: any;
  _onNavigationBarRef: (ref: any) => void;
  _onPositionChange: (data: {value: number}) => void;
  _positionListener: ?NavigationAnimatedValueSubscription;
  _previousStack: NavigationLegacyNavigatorRouteStack;
  _renderCard: NavigationSceneRenderer;
  _renderHeader: NavigationSceneRenderer;
  _renderScene: NavigationSceneRenderer;
  _routeFocused: any;
  _routeToFocus: any;
  _stack: NavigationLegacyNavigatorRouteStack;
  _useAnimation: boolean;

  navigationContext: NavigationContext;
  parentNavigator: any;
  props: Props;
  state: State;

  constructor(props: Props, context: any) {
    super(props, context);

    const stack = this._getInitialRouteStack();

    // Unfortunately, due to historical reasons, the `state` has been exposed
    // as public members of the navigator, therefore we'd keep private state
    // as private members.
    this._previousStack = stack;
    this._stack = stack;
    this._useAnimation = false;

    // Legacy members portred from `Navigator`.
    this.parentNavigator = props.navigator;
    this.navigationContext = new NavigationContext();

    this.state = {
      routeStack: stack.toArray(),
      presentedIndex: stack.index,
    };
  }

  jumpTo(route: any): void {
    this._applyStack(this._stack.jumpTo(route));
  }

  jumpForward(): void {
    this._applyStack(this._stack.jumpForward());
  }

  jumpBack(): void {
    this._applyStack(this._stack.jumpBack());
  }

  push(route: any): void {
    this._applyStack(this._stack.push(route));
  }

  pop(): void {
    this._applyStack(this._stack.pop());
  }

  replaceAtIndex(route: any, index: number): void {
    this._applyStack(this._stack.replaceAtIndex(index, route));
  }

  replace(route: any): void {
    this.replaceAtIndex(route, this._stack.index);
  }

  replacePrevious(route: any): void {
    this.replaceAtIndex(route, this._stack.index - 1);
  }

  popToTop(): void {
    this._applyStack(this._stack.slice(0, 1));
  }

  popToRoute(route: any): void {
    this._applyStack(this._stack.popToRoute(route));
  }

  replacePreviousAndPop(route: any): void {
    this._applyStack(this._stack.replacePreviousAndPop(route));
  }

  resetTo(route: any): void {
    this._applyStack(this._stack.resetTo(route));
  }

  immediatelyResetRouteStack(routes: Array<any>): void {
    this._applyStack(this._stack.resetRoutes(routes), true);
  }

  getCurrentRoutes(): Array<any> {
    return this._stack.toArray();
  }

  // Lyfe cycle and private methods below.

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    return ReactComponentWithPureRenderMixin.shouldComponentUpdate.call(
      this,
      nextProps,
      nextState
    );
  }

  componentWillMount(): void {
    this._applyAnimation = this._applyAnimation.bind(this);
    this._onNavigationBarRef = this._onNavigationBarRef.bind(this);
    this._onPositionChange = this._onPositionChange.bind(this);
    this._renderCard = this._renderCard.bind(this);
    this._renderHeader = this._renderHeader.bind(this);
    this._renderScene = this._renderScene.bind(this);

    this._willFocus();
  }

  componentDidMount(): void {
    this._didFocus();
  }

  componentWillUnmount(): void {
    this._positionListener && this._positionListener.remove();
  }

  componentWillUpdate(nextProps: Props, nextState: State): void {
    this._willFocus();
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    if (this._useAnimation) {
      // will play animation.
      return;
    }
    this._didFocus();
  }

  render(): ReactElement {
    return (
      <NavigationAnimatedView
        applyAnimation={this._applyAnimation}
        navigationState={this._stack.toNavigationState()}
        renderOverlay={this._renderHeader}
        renderScene={this._renderCard}
        style={this.props.style}
      />
    );
  }

  _getInitialRouteStack(): RouteStack {
    const {initialRouteStack, initialRoute} = this.props;
    const routes = initialRouteStack || [initialRoute];
    const index = initialRoute ?
      routes.indexOf(initialRoute) :
      routes.length - 1;
    return new RouteStack(index, routes);
  }

  _renderHeader(props: NavigationSceneRendererProps): ?ReactElement {
    // `_renderHeader` is the always called before `_renderCard`. We should
    // subscribe to the position here.
    this._positionListener && this._positionListener.remove();
    this._positionListener = new NavigationAnimatedValueSubscription(
      props.position,
      this._onPositionChange,
    );

    const {navigationBar, navigationBarNavigator} = this.props;
    if (!navigationBar) {
      return null;
    }

    return React.cloneElement(
      navigationBar,
      {
        key: 'header_' + props.scene.key,
        ref: this._onNavigationBarRef,
        navigator: navigationBarNavigator || this,
        navState: {...this.state},
      }
    );
  }

  _renderCard(props: NavigationSceneRendererProps): ReactElement {
    const {scene} = props;
    const {configureScene} = this.props;

    let isVertical = false;

    if (configureScene) {
      const route = RouteStack.getRouteByNavigationState(scene.navigationState);
      const config = configureScene(route, this.state.routeStack);
      const direction = getConfigPopDirection(config);

      switch (direction) {
        case 'left-to-right':
          // default.
          break;

        case 'top-to-bottom':
          isVertical = true;
          break;

        default:
          // unsupported config.
          if (__DEV__) {
            console.warn('unsupported scene configuration %s', direction);
          }
      }
    }

    const style = isVertical ?
      NavigationCardStackStyleInterpolator.forVertical(props) :
      NavigationCardStackStyleInterpolator.forHorizontal(props);

    const panHandlers = isVertical ?
      NavigationLinearPanResponder.forVertical(props) :
      NavigationLinearPanResponder.forHorizontal(props);

    return (
      <NavigationCard
        {...props}
        key={'card_' + props.scene.key}
        panHandlers={panHandlers}
        renderScene={this._renderScene}
        style={style}
      />
    );
  }

  _renderScene(props: NavigationSceneRendererProps): ReactElement {
    const {navigationState} = props.scene;
    const route = RouteStack.getRouteByNavigationState(navigationState);
    return this.props.renderScene(route, this);
  }

  _applyStack(
    stack: NavigationLegacyNavigatorRouteStack,
    noAnimation: ?boolean,
  ): void {
    if (stack !== this._stack) {
      this._previousStack = this._stack;
      this._stack = stack;

      this._useAnimation = noAnimation ||
        this._previousStack.index !== stack.index;

      this.setState({
        presentedIndex: stack.index,
        routeStack: stack.toArray(),
      });
    }
  }

  _onNavigationBarRef(navigationBarRef: any): void {
    this._navigationBarRef = navigationBarRef;
    const {navigationBar} = this.props;
    if (navigationBar && typeof navigationBar.ref === 'function') {
      navigationBar.ref(navigationBarRef);
    }
  }

  _onPositionChange(data: {value: number}): void {
    const fromIndex = this._previousStack.index;
    const toIndex = this._stack.index;

    if (
      fromIndex !== toIndex &&
      this._navigationBarRef &&
      typeof this._navigationBarRef.updateProgress === 'function'
    ) {
      const progress = (data.value - fromIndex) / (toIndex - fromIndex);
      this._navigationBarRef.updateProgress(progress, fromIndex, toIndex);
    }

    const diff = this._stack.index - data.value;
    // When animation stops, the `diff` can still be very a small non-zero value
    // (e.g. 0.00000002). Call `willFocus` when `diff` is small enough.
    if (diff < 0.05) {
      this._didFocus();
    }
  }

  _applyAnimation(
    position: NavigationAnimatedValue,
    nextState: NavigationParentState,
    prevState: NavigationParentState,
  ): void {
    const {index} = nextState;

    if (!this._useAnimation) {
      position.setValue(index);
      return;
    }

    Animated.timing(
      position,
      {
        duration: 500,
        toValue: index,
      }
    ).start();
  }

  _willFocus(): void {
    const route = this._stack.get(this._stack.index);
    if (this._routeToFocus === route) {
      return;
    }
    this._routeToFocus = route;
    this.navigationContext.emit('willfocus', {route: route});
    this.props.onWillFocus && this.props.onWillFocus(route);
  }

  _didFocus(): void {
    const route = this._stack.get(this._stack.index);
    if (this._routeFocused === route) {
      return;
    }
    this._routeFocused = route;
    this.navigationContext.emit('didfocus', {route: route});
    this.props.onDidFocus && this.props.onDidFocus(route);
  }
}

// Legacy static members.
NavigationLegacyNavigator.BreadcrumbNavigationBar = NavigatorBreadcrumbNavigationBar;
NavigationLegacyNavigator.NavigationBar = NavigatorNavigationBar;
NavigationLegacyNavigator.SceneConfigs = NavigatorSceneConfigs;

module.exports = NavigationLegacyNavigator;
