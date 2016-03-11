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
 * @providesModule NavigationLegacyNavigator
 * @flow
 */
'use strict';

const NavigationAnimatedView = require('NavigationAnimatedView');
const NavigationCard = require('NavigationCard');
const NavigationContext = require('NavigationContext');
const NavigationLegacyNavigatorRouteStack = require('NavigationLegacyNavigatorRouteStack');
const NavigatorBreadcrumbNavigationBar = require('NavigatorBreadcrumbNavigationBar');
const NavigatorNavigationBar = require('NavigatorNavigationBar');
const NavigatorSceneConfigs = require('NavigatorSceneConfigs');
const React = require('react-native');
const ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');

const invariant = require('fbjs/lib/invariant');
const guid = require('guid');

import type  {
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

type State = any;

type Props = {
  configureScene: any,
  initialRoute: any,
  initialRouteStack: any,
  renderScene: any,
  style: any,
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
  static BreadcrumbNavigationBar;
  static NavigationBar: any;
  static SceneConfigs: any;

  _renderCard: NavigationSceneRenderer;
  _renderHeader: NavigationSceneRenderer;
  _renderScene: NavigationSceneRenderer;

  navigationContext: NavigationContext;

  constructor(props: Props, context: any) {
    super(props, context);

    this.navigationContext = new NavigationContext();

    const stack = this._getInitialRouteStack();
    this.state = {
      key: guid(),
      stack,
    };
  }

  jumpTo(route: any): void {
    const index = this.state.stack.indexOf(route);
    invariant(
      index > -1,
      'Cannot jump to route that is not in the route stack'
    );
    this._jumpToIndex(index);
  }

  jumpForward(): void {
    this._jumpToIndex(this.state.stack.index + 1);
  }

  jumpBack(): void {
    this._jumpToIndex(this.state.stack.index - 1);
  }

  push(route: any): void {
    this.setState({stack: this.state.stack.push(route)});
  }

  pop(): void {
    const {stack} = this.state;
    if (stack.size > 1) {
      this.setState({stack: stack.pop()});
    }
  }

  replaceAtIndex(route: any, index: number): void {
    const {stack} = this.state;

    if (index < 0) {
      index += stack.size;
    }

    if (index >= stack.size) {
      // Nothing to replace.
      return;
    }

    this.setState({stack: stack.replaceAtIndex(index, route)});
  }

  replace(route: any): void {
    this.replaceAtIndex(route, this.state.stack.index);
  }

  replacePrevious(route: any): void {
    this.replaceAtIndex(route, this.state.stack.index - 1);
  }

  popToTop(): void {
    this.setState({stack: this.state.stack.slice(0, 1)});
  }

  popToRoute(route: any): void {
    const {stack} = this.state;
    const nextIndex = stack.indexOf(route);
    invariant(
      nextIndex > -1,
      'Calling popToRoute for a route that doesn\'t exist!'
    );
    this.setState({stack: stack.slice(0, nextIndex + 1)});
  }

  replacePreviousAndPop(route: any): void {
    const {stack} = this.state;
    const nextIndex = stack.index - 1;
    if (nextIndex < 0) {
      return;
    }
    this.setState({stack: stack.replaceAtIndex(nextIndex, route).pop()});
  }

  resetTo(route: any): void {
    invariant(!!route, 'Must supply route');
    this.setState({stack: this.state.stack.slice(0).replaceAtIndex(0, route)});
  }

  immediatelyResetRouteStack(routes: Array<any>): void {
    const index = routes.length - 1;
    const stack = new RouteStack(index, routes);
    this.setState({
      key: guid(),
      stack,
    });
  }

  getCurrentRoutes(): Array<any> {
    return this.state.stack.toArray();
  }

  _jumpToIndex(index: number): void {
    const {stack} = this.state;
    if (index < 0 || index >= stack.size) {
      return;
    }
    const nextStack = stack.jumpToIndex(index);
    this.setState({stack: nextStack});
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
    this._renderCard = this._renderCard.bind(this);
    this._renderHeader = this._renderHeader.bind(this);
    this._renderScene = this._renderScene.bind(this);
  }

  render(): ReactElement {
    return (
      <NavigationAnimatedView
        key={'main_' + this.state.key}
        navigationState={this.state.stack.toNavigationState()}
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
    // TODO(hedger): Render the legacy header.
    return null;
  }

  _renderCard(props: NavigationSceneRendererProps): ReactElement {
    let direction = 'horizontal';

    const {navigationState} = props.scene;
    const {configureScene} = this.props;

    if (configureScene) {
      const route = RouteStack.getRouteByNavigationState(navigationState);
      const config = configureScene(route, this.state.stack.toArray());

      switch (getConfigPopDirection(config)) {
        case 'left-to-right':
          direction = 'horizontal';
          break;

        case 'top-to-bottom':
          direction = 'vertical';
          break;

        default:
          // unsupported config.
          if (__DEV__) {
            console.warn('unsupported scene configuration');
          }
      }
    }

    return (
      <NavigationCard
        {...props}
        direction={direction}
        key={'card_' + navigationState.key}
        renderScene={this._renderScene}
      />
    );
  }

  _renderScene(props: NavigationSceneRendererProps): ReactElement {
    const {navigationState} = props.scene;
    const route = RouteStack.getRouteByNavigationState(navigationState);
    return this.props.renderScene(route, this);
  }
}

// Legacy static members.
NavigationLegacyNavigator.BreadcrumbNavigationBar = NavigatorBreadcrumbNavigationBar;
NavigationLegacyNavigator.NavigationBar = NavigatorNavigationBar;
NavigationLegacyNavigator.SceneConfigs = NavigatorSceneConfigs;

module.exports = NavigationLegacyNavigator;
