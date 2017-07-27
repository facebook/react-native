/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigatorIOS
 * @flow
 */
'use strict';

var EventEmitter = require('EventEmitter');
var Image = require('Image');
var RCTNavigatorManager = require('NativeModules').NavigatorManager;
var React = require('React');
var PropTypes = require('prop-types');
var ReactNative = require('ReactNative');
var StaticContainer = require('StaticContainer.react');
var StyleSheet = require('StyleSheet');
var TVEventHandler = require('TVEventHandler');
var View = require('View');
var ViewPropTypes = require('ViewPropTypes');

var createReactClass = require('create-react-class');
var invariant = require('fbjs/lib/invariant');
var logError = require('logError');
var requireNativeComponent = require('requireNativeComponent');

const keyMirror = require('fbjs/lib/keyMirror');

var TRANSITIONER_REF = 'transitionerRef';

var __uid = 0;
function getuid() {
  return __uid++;
}

class NavigatorTransitionerIOS extends React.Component {
  requestSchedulingNavigation(cb) {
    RCTNavigatorManager.requestSchedulingJavaScriptNavigation(
      ReactNative.findNodeHandle(this),
      logError,
      cb
    );
  }

  render() {
    return (
      <RCTNavigator {...this.props}/>
    );
  }
}

const SystemIconLabels = {
  done: true,
  cancel: true,
  edit: true,
  save: true,
  add: true,
  compose: true,
  reply: true,
  action: true,
  organize: true,
  bookmarks: true,
  search: true,
  refresh: true,
  stop: true,
  camera: true,
  trash: true,
  play: true,
  pause: true,
  rewind: true,
  'fast-forward': true,
  undo: true,
  redo: true,
  'page-curl': true,
};
const SystemIcons = keyMirror(SystemIconLabels);

type SystemButtonType = $Enum<typeof SystemIconLabels>;

type Route = {
  component: Function,
  title: string,
  titleImage?: Object,
  passProps?: Object,
  backButtonTitle?: string,
  backButtonIcon?: Object,
  leftButtonTitle?: string,
  leftButtonIcon?: Object,
  leftButtonSystemIcon?: SystemButtonType,
  onLeftButtonPress?: Function,
  rightButtonTitle?: string,
  rightButtonIcon?: Object,
  rightButtonSystemIcon?: SystemButtonType,
  onRightButtonPress?: Function,
  wrapperStyle?: any,
};

type State = {
  idStack: Array<number>,
  routeStack: Array<Route>,
  requestedTopOfStack: number,
  observedTopOfStack: number,
  progress: number,
  fromIndex: number,
  toIndex: number,
  makingNavigatorRequest: boolean,
  updatingAllIndicesAtOrBeyond: ?number,
}

type Event = Object;

/**
 * Think of `<NavigatorIOS>` as simply a component that renders an
 * `RCTNavigator`, and moves the `RCTNavigator`'s `requestedTopOfStack` pointer
 * forward and backward. The `RCTNavigator` interprets changes in
 * `requestedTopOfStack` to be pushes and pops of children that are rendered.
 * `<NavigatorIOS>` always ensures that whenever the `requestedTopOfStack`
 * pointer is moved, that we've also rendered enough children so that the
 * `RCTNavigator` can carry out the push/pop with those children.
 * `<NavigatorIOS>` also removes children that will no longer be needed
 * (after the pop of a child has been fully completed/animated out).
 */

/**
 * `NavigatorIOS` is a wrapper around
 * [`UINavigationController`](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UINavigationController_Class/),
 * enabling you to implement a navigation stack. It works exactly the same as it
 * would on a native app using `UINavigationController`, providing the same
 * animations and behavior from UIKit.
 *
 * As the name implies, it is only available on iOS. Take a look at
 * [`React Navigation`](https://reactnavigation.org/) for a cross-platform
 * solution in JavaScript, or check out either of these components for native
 * solutions: [native-navigation](http://airbnb.io/native-navigation/),
 * [react-native-navigation](https://github.com/wix/react-native-navigation).
 *
 * To set up the navigator, provide the `initialRoute` prop with a route
 * object. A route object is used to describe each scene that your app
 * navigates to. `initialRoute` represents the first route in your navigator.
 *
 * ```
 * import React, { Component, PropTypes } from 'react';
 * import { NavigatorIOS, Text } from 'react-native';
 *
 * export default class NavigatorIOSApp extends Component {
 *   render() {
 *     return (
 *       <NavigatorIOS
 *         initialRoute={{
 *           component: MyScene,
 *           title: 'My Initial Scene',
 *         }}
 *         style={{flex: 1}}
 *       />
 *     );
 *   }
 * }
 *
 * class MyScene extends Component {
 *   static propTypes = {
 *     title: PropTypes.string.isRequired,
 *     navigator: PropTypes.object.isRequired,
 *   }
 *
 *   _onForward = () => {
 *     this.props.navigator.push({
 *       title: 'Scene ' + nextIndex,
 *     });
 *   }
 *
 *   render() {
 *     return (
 *       <View>
 *         <Text>Current Scene: { this.props.title }</Text>
 *         <TouchableHighlight onPress={this._onForward}>
 *           <Text>Tap me to load the next scene</Text>
 *         </TouchableHighlight>
 *       </View>
 *     )
 *   }
 * }
 * ```
 *
 * In this code, the navigator renders the component specified in initialRoute,
 * which in this case is `MyScene`. This component will receive a `route` prop
 * and a `navigator` prop representing the navigator. The navigator's navigation
 * bar will render the title for the current scene, "My Initial Scene".
 *
 * You can optionally pass in a `passProps` property to your `initialRoute`.
 * `NavigatorIOS` passes this in as props to the rendered component:
 *
 * ```
 * initialRoute={{
 *   component: MyScene,
 *   title: 'My Initial Scene',
 *   passProps: { myProp: 'foo' }
 * }}
 * ```
 *
 * You can then access the props passed in via `{this.props.myProp}`.
 *
 * #### Handling Navigation
 *
 * To trigger navigation functionality such as pushing or popping a view, you
 * have access to a `navigator` object. The object is passed in as a prop to any
 * component that is rendered by `NavigatorIOS`. You can then call the
 * relevant methods to perform the navigation action you need:
 *
 * ```
 * class MyView extends Component {
 *   _handleBackPress() {
 *     this.props.navigator.pop();
 *   }
 *
 *   _handleNextPress(nextRoute) {
 *     this.props.navigator.push(nextRoute);
 *   }
 *
 *   render() {
 *     const nextRoute = {
 *       component: MyView,
 *       title: 'Bar That',
 *       passProps: { myProp: 'bar' }
 *     };
 *     return(
 *       <TouchableHighlight onPress={() => this._handleNextPress(nextRoute)}>
 *         <Text style={{marginTop: 200, alignSelf: 'center'}}>
 *           See you on the other nav {this.props.myProp}!
 *         </Text>
 *       </TouchableHighlight>
 *     );
 *   }
 * }
 * ```
 *
 * You can also trigger navigator functionality from the `NavigatorIOS`
 * component:
 *
 * ```
 * class NavvyIOS extends Component {
 *   _handleNavigationRequest() {
 *     this.refs.nav.push({
 *       component: MyView,
 *       title: 'Genius',
 *       passProps: { myProp: 'genius' },
 *     });
 *   }
 *
 *   render() {
 *     return (
 *       <NavigatorIOS
 *         ref='nav'
 *         initialRoute={{
 *           component: MyView,
 *           title: 'Foo This',
 *           passProps: { myProp: 'foo' },
 *           rightButtonTitle: 'Add',
 *           onRightButtonPress: () => this._handleNavigationRequest(),
 *         }}
 *         style={{flex: 1}}
 *       />
 *     );
 *   }
 * }
 * ```
 *
 * The code above adds a `_handleNavigationRequest` private method that is
 * invoked from the `NavigatorIOS` component when the right navigation bar item
 * is pressed. To get access to the navigator functionality, a reference to it
 * is saved in the `ref` prop and later referenced to push a new scene into the
 * navigation stack.
 *
 * #### Navigation Bar Configuration
 *
 * Props passed to `NavigatorIOS` will set the default configuration
 * for the navigation bar. Props passed as properties to a route object will set
 * the configuration for that route's navigation bar, overriding any props
 * passed to the `NavigatorIOS` component.
 *
 * ```
 * _handleNavigationRequest() {
 *   this.refs.nav.push({
 *     //...
 *     passProps: { myProp: 'genius' },
 *     barTintColor: '#996699',
 *   });
 * }
 *
 * render() {
 *   return (
 *     <NavigatorIOS
 *       //...
 *       style={{flex: 1}}
 *       barTintColor='#ffffcc'
 *     />
 *   );
 * }
 * ```
 *
 * In the example above the navigation bar color is changed when the new route
 * is pushed.
 *
 */
var NavigatorIOS = createReactClass({
  displayName: 'NavigatorIOS',

  propTypes: {

    /**
     * NavigatorIOS uses `route` objects to identify child views, their props,
     * and navigation bar configuration. Navigation operations such as push
     * operations expect routes to look like this the `initialRoute`.
     */
    initialRoute: PropTypes.shape({
      /**
       * The React Class to render for this route
       */
      component: PropTypes.func.isRequired,

      /**
       * The title displayed in the navigation bar and the back button for this
       * route.
       */
      title: PropTypes.string.isRequired,

      /**
       * If set, a title image will appear instead of the text title.
       */
      titleImage: Image.propTypes.source,

      /**
       * Use this to specify additional props to pass to the rendered
       * component. `NavigatorIOS` will automatically pass in `route` and
       * `navigator` props to the comoponent.
       */
      passProps: PropTypes.object,

      /**
       * If set, the left navigation button image will be displayed using this
       * source. Note that this doesn't apply to the header of the current
       * view, but to those views that are subsequently pushed.
       */
      backButtonIcon: Image.propTypes.source,

      /**
       * If set, the left navigation button text will be set to this. Note that
       * this doesn't apply to the left button of the current view, but to
       * those views that are subsequently pushed
       */
      backButtonTitle: PropTypes.string,

      /**
       * If set, the left navigation button image will be displayed using
       * this source.
       */
      leftButtonIcon: Image.propTypes.source,

      /**
       * If set, the left navigation button will display this text.
       */
      leftButtonTitle: PropTypes.string,

      /**
       * If set, the left header button will appear with this system icon
       *
       * Supported icons are `done`, `cancel`, `edit`, `save`, `add`,
       * `compose`, `reply`, `action`, `organize`, `bookmarks`, `search`,
       * `refresh`, `stop`, `camera`, `trash`, `play`, `pause`, `rewind`,
       * `fast-forward`, `undo`, `redo`, and `page-curl`
       */
      leftButtonSystemIcon: PropTypes.oneOf(Object.keys(SystemIcons)),

      /**
       * This function will be invoked when the left navigation bar item is
       * pressed.
       */
      onLeftButtonPress: PropTypes.func,

      /**
       * If set, the right navigation button image will be displayed using
       * this source.
       */
      rightButtonIcon: Image.propTypes.source,

      /**
       * If set, the right navigation button will display this text.
       */
      rightButtonTitle: PropTypes.string,

      /**
       * If set, the right header button will appear with this system icon
       *
       * See leftButtonSystemIcon for supported icons
       */
      rightButtonSystemIcon: PropTypes.oneOf(Object.keys(SystemIcons)),

      /**
       * This function will be invoked when the right navigation bar item is
       * pressed.
       */
      onRightButtonPress: PropTypes.func,

      /**
       * Styles for the navigation item containing the component.
       */
      wrapperStyle: ViewPropTypes.style,

      /**
       * Boolean value that indicates whether the navigation bar is hidden.
       */
      navigationBarHidden: PropTypes.bool,

      /**
       * Boolean value that indicates whether to hide the 1px hairline
       * shadow.
       */
      shadowHidden: PropTypes.bool,

      /**
       * The color used for the buttons in the navigation bar.
       */
      tintColor: PropTypes.string,

      /**
       * The background color of the navigation bar.
       */
      barTintColor: PropTypes.string,

       /**
       * The text color of the navigation bar title.
       */
      titleTextColor: PropTypes.string,

       /**
       * Boolean value that indicates whether the navigation bar is
       * translucent.
       */
      translucent: PropTypes.bool,

    }).isRequired,

    /**
     * Boolean value that indicates whether the navigation bar is hidden
     * by default.
     */
    navigationBarHidden: PropTypes.bool,

    /**
     * Boolean value that indicates whether to hide the 1px hairline shadow
     * by default.
     */
    shadowHidden: PropTypes.bool,

    /**
     * The default wrapper style for components in the navigator.
     * A common use case is to set the `backgroundColor` for every scene.
     */
    itemWrapperStyle: ViewPropTypes.style,

    /**
     * The default color used for the buttons in the navigation bar.
     */
    tintColor: PropTypes.string,

    /**
     * The default background color of the navigation bar.
     */
    barTintColor: PropTypes.string,

    /**
     * The default text color of the navigation bar title.
     */
    titleTextColor: PropTypes.string,

    /**
     * Boolean value that indicates whether the navigation bar is
     * translucent by default
     */
    translucent: PropTypes.bool,

    /**
     * Boolean value that indicates whether the interactive pop gesture is
     * enabled. This is useful for enabling/disabling the back swipe navigation
     * gesture.
     *
     * If this prop is not provided, the default behavior is for the back swipe
     * gesture to be enabled when the navigation bar is shown and disabled when
     * the navigation bar is hidden. Once you've provided the
     * `interactivePopGestureEnabled` prop, you can never restore the default
     * behavior.
     */
    interactivePopGestureEnabled: PropTypes.bool,

  },

  navigator: (undefined: ?Object),

  componentWillMount: function() {
    // Precompute a pack of callbacks that's frequently generated and passed to
    // instances.
    this.navigator = {
      push: this.push,
      pop: this.pop,
      popN: this.popN,
      replace: this.replace,
      replaceAtIndex: this.replaceAtIndex,
      replacePrevious: this.replacePrevious,
      replacePreviousAndPop: this.replacePreviousAndPop,
      resetTo: this.resetTo,
      popToRoute: this.popToRoute,
      popToTop: this.popToTop,
    };
  },

  componentDidMount: function() {
    this._enableTVEventHandler();
  },

  componentWillUnmount: function() {
    this._disableTVEventHandler();
  },

  getDefaultProps: function(): Object {
    return {
      translucent: true,
    };
  },

  getInitialState: function(): State {
    return {
      idStack: [getuid()],
      routeStack: [this.props.initialRoute],
      // The navigation index that we wish to push/pop to.
      requestedTopOfStack: 0,
      // The last index that native has sent confirmation of completed push/pop
      // for. At this point, we can discard any views that are beyond the
      // `requestedTopOfStack`. A value of `null` means we have not received
      // any confirmation, ever. We may receive an `observedTopOfStack` without
      // ever requesting it - native can instigate pops of its own with the
      // backswipe gesture.
      observedTopOfStack: 0,
      progress: 1,
      fromIndex: 0,
      toIndex: 0,
      // Whether or not we are making a navigator request to push/pop. (Used
      // for performance optimization).
      makingNavigatorRequest: false,
      // Whether or not we are updating children of navigator and if so (not
      // `null`) which index marks the beginning of all updates. Used for
      // performance optimization.
      updatingAllIndicesAtOrBeyond: 0,
    };
  },

  _toFocusOnNavigationComplete: (undefined: any),

  _handleFocusRequest: function(item: any) {
    if (this.state.makingNavigatorRequest) {
      this._toFocusOnNavigationComplete = item;
    } else {
      this._getFocusEmitter().emit('focus', item);
    }
  },

  _focusEmitter: (undefined: ?EventEmitter),

  _getFocusEmitter: function(): EventEmitter {
    // Flow not yet tracking assignments to instance fields.
    var focusEmitter = this._focusEmitter;
    if (!focusEmitter) {
      focusEmitter = new EventEmitter();
      this._focusEmitter = focusEmitter;
    }
    return focusEmitter;
  },

  getChildContext: function(): {
    onFocusRequested: Function,
    focusEmitter: EventEmitter,
  } {
    return {
      onFocusRequested: this._handleFocusRequest,
      focusEmitter: this._getFocusEmitter(),
    };
  },

  childContextTypes: {
    onFocusRequested: PropTypes.func,
    focusEmitter: PropTypes.instanceOf(EventEmitter),
  },

  _tryLockNavigator: function(cb: () => void) {
    this.refs[TRANSITIONER_REF].requestSchedulingNavigation(
      (acquiredLock) => acquiredLock && cb()
    );
  },

  _handleNavigatorStackChanged: function(e: Event) {
    var newObservedTopOfStack = e.nativeEvent.stackLength - 1;

    invariant(
      newObservedTopOfStack <= this.state.requestedTopOfStack,
      'No navigator item should be pushed without JS knowing about it %s %s', newObservedTopOfStack, this.state.requestedTopOfStack
    );
    var wasWaitingForConfirmation =
      this.state.requestedTopOfStack !== this.state.observedTopOfStack;
    if (wasWaitingForConfirmation) {
      invariant(
        newObservedTopOfStack === this.state.requestedTopOfStack,
        'If waiting for observedTopOfStack to reach requestedTopOfStack, ' +
        'the only valid observedTopOfStack should be requestedTopOfStack.'
      );
    }
    // Mark the most recent observation regardless of if we can lock the
    // navigator. `observedTopOfStack` merely represents what we've observed
    // and this first `setState` is only executed to update debugging
    // overlays/navigation bar.
    // Also reset progress, toIndex, and fromIndex as they might not end
    // in the correct states for a two possible reasons:
    // Progress isn't always 0 or 1 at the end, the system rounds
    // If the Navigator is offscreen these values won't be updated
    // TOOD: Revisit this decision when no longer relying on native navigator.
    var nextState = {
      observedTopOfStack: newObservedTopOfStack,
      makingNavigatorRequest: false,
      updatingAllIndicesAtOrBeyond: null,
      progress: 1,
      toIndex: newObservedTopOfStack,
      fromIndex: newObservedTopOfStack,
    };
    this.setState(nextState, this._eliminateUnneededChildren);
  },

  _eliminateUnneededChildren: function() {
    // Updating the indices that we're deleting and that's all. (Truth: Nothing
    // even uses the indices in this case, but let's make this describe the
    // truth anyways).
    var updatingAllIndicesAtOrBeyond =
      this.state.routeStack.length > this.state.observedTopOfStack + 1 ?
      this.state.observedTopOfStack + 1 :
      null;
    this.setState({
      idStack: this.state.idStack.slice(0, this.state.observedTopOfStack + 1),
      routeStack: this.state.routeStack.slice(0, this.state.observedTopOfStack + 1),
      // Now we rerequest the top of stack that we observed.
      requestedTopOfStack: this.state.observedTopOfStack,
      makingNavigatorRequest: true,
      updatingAllIndicesAtOrBeyond: updatingAllIndicesAtOrBeyond,
    });
  },

  /**
   * Navigate forward to a new route.
   * @param route The new route to navigate to.
   */
  push: function(route: Route) {
    invariant(!!route, 'Must supply route to push');
    // Make sure all previous requests are caught up first. Otherwise reject.
    if (this.state.requestedTopOfStack === this.state.observedTopOfStack) {
      this._tryLockNavigator(() => {

        var nextStack = this.state.routeStack.concat([route]);
        var nextIDStack = this.state.idStack.concat([getuid()]);
        this.setState({
          // We have to make sure that we've also supplied enough views to
          // satisfy our request to adjust the `requestedTopOfStack`.
          idStack: nextIDStack,
          routeStack: nextStack,
          requestedTopOfStack: nextStack.length - 1,
          makingNavigatorRequest: true,
          updatingAllIndicesAtOrBeyond: nextStack.length - 1,
        });
      });
    }
  },

  /**
   * Go back N scenes at once. When N=1, behavior matches `pop()`.
   * @param n The number of scenes to pop.
   */
  popN: function(n: number) {
    if (n === 0) {
      return;
    }
    // Make sure all previous requests are caught up first. Otherwise reject.
    if (this.state.requestedTopOfStack === this.state.observedTopOfStack) {
      if (this.state.requestedTopOfStack > 0) {
        this._tryLockNavigator(() => {
          var newRequestedTopOfStack = this.state.requestedTopOfStack - n;
          invariant(newRequestedTopOfStack >= 0, 'Cannot pop below 0');
          this.setState({
            requestedTopOfStack: newRequestedTopOfStack,
            makingNavigatorRequest: true,
            updatingAllIndicesAtOrBeyond: this.state.requestedTopOfStack - n,
          });
        });
      }
    }
  },

  /**
   * Pop back to the previous scene.
   */
  pop: function() {
    this.popN(1);
  },

  /**
   * Replace a route in the navigation stack.
   *
   * @param route The new route that will replace the specified one.
   * @param index The route into the stack that should be replaced.
   *    If it is negative, it counts from the back of the stack.
   */
  replaceAtIndex: function(route: Route, index: number) {
    invariant(!!route, 'Must supply route to replace');
    if (index < 0) {
      index += this.state.routeStack.length;
    }

    if (this.state.routeStack.length <= index) {
      return;
    }

    // I don't believe we need to lock for a replace since there's no
    // navigation actually happening
    var nextIDStack = this.state.idStack.slice();
    var nextRouteStack = this.state.routeStack.slice();
    nextIDStack[index] = getuid();
    nextRouteStack[index] = route;

    this.setState({
      idStack: nextIDStack,
      routeStack: nextRouteStack,
      makingNavigatorRequest: false,
      updatingAllIndicesAtOrBeyond: index,
    });

  },

  /**
   * Replace the route for the current scene and immediately
   * load the view for the new route.
   * @param route The new route to navigate to.
   */
  replace: function(route: Route) {
    this.replaceAtIndex(route, -1);
  },

  /**
   * Replace the route/view for the previous scene.
   * @param route The new route to will replace the previous scene.
   */
  replacePrevious: function(route: Route) {
    this.replaceAtIndex(route, -2);
  },

  /**
   * Go back to the topmost item in the navigation stack.
   */
  popToTop: function() {
    this.popToRoute(this.state.routeStack[0]);
  },

  /**
   * Go back to the item for a particular route object.
   * @param route The new route to navigate to.
   */
  popToRoute: function(route: Route) {
    var indexOfRoute = this.state.routeStack.indexOf(route);
    invariant(
      indexOfRoute !== -1,
      'Calling pop to route for a route that doesn\'t exist!'
    );
    var numToPop = this.state.routeStack.length - indexOfRoute - 1;
    this.popN(numToPop);
  },

  /**
   * Replaces the previous route/view and transitions back to it.
   * @param route The new route that replaces the previous scene.
   */
  replacePreviousAndPop: function(route: Route) {
    // Make sure all previous requests are caught up first. Otherwise reject.
    if (this.state.requestedTopOfStack !== this.state.observedTopOfStack) {
      return;
    }
    if (this.state.routeStack.length < 2) {
      return;
    }
    this._tryLockNavigator(() => {
      this.replacePrevious(route);
      this.setState({
        requestedTopOfStack: this.state.requestedTopOfStack - 1,
        makingNavigatorRequest: true,
      });
    });
  },

  /**
   * Replaces the top item and pop to it.
   * @param route The new route that will replace the topmost item.
   */
  resetTo: function(route: Route) {
    invariant(!!route, 'Must supply route to push');
    // Make sure all previous requests are caught up first. Otherwise reject.
    if (this.state.requestedTopOfStack !== this.state.observedTopOfStack) {
      return;
    }
    this.replaceAtIndex(route, 0);
    this.popToRoute(route);
  },

  _handleNavigationComplete: function(e: Event) {
    // Don't propagate to other NavigatorIOS instances this is nested in:
    e.stopPropagation();

    if (this._toFocusOnNavigationComplete) {
      this._getFocusEmitter().emit('focus', this._toFocusOnNavigationComplete);
      this._toFocusOnNavigationComplete = null;
    }
    this._handleNavigatorStackChanged(e);
  },

  _routeToStackItem: function(routeArg: Route, i: number) {
    var {component, wrapperStyle, passProps, ...route} = routeArg;
    var {itemWrapperStyle, ...props} = this.props;
    var shouldUpdateChild =
      this.state.updatingAllIndicesAtOrBeyond != null &&
      this.state.updatingAllIndicesAtOrBeyond >= i;
    var Component = component;
    return (
      <StaticContainer key={'nav' + i} shouldUpdate={shouldUpdateChild}>
        <RCTNavigatorItem
          {...props}
          {...route}
          style={[
            styles.stackItem,
            itemWrapperStyle,
            wrapperStyle
          ]}>
          <Component
            navigator={this.navigator}
            route={route}
            {...passProps}
          />
        </RCTNavigatorItem>
      </StaticContainer>
    );
  },

  _renderNavigationStackItems: function() {
    var shouldRecurseToNavigator =
      this.state.makingNavigatorRequest ||
      this.state.updatingAllIndicesAtOrBeyond !== null;
    // If not recursing update to navigator at all, may as well avoid
    // computation of navigator children.
    var items = shouldRecurseToNavigator ?
      this.state.routeStack.map(this._routeToStackItem) : null;
    return (
      <StaticContainer shouldUpdate={shouldRecurseToNavigator}>
        <NavigatorTransitionerIOS
          ref={TRANSITIONER_REF}
          style={styles.transitioner}
          // $FlowFixMe(>=0.41.0)
          vertical={this.props.vertical}
          requestedTopOfStack={this.state.requestedTopOfStack}
          onNavigationComplete={this._handleNavigationComplete}
          interactivePopGestureEnabled={this.props.interactivePopGestureEnabled}>
          {items}
        </NavigatorTransitionerIOS>
      </StaticContainer>
    );
  },

  _tvEventHandler: (undefined: ?TVEventHandler),

  _enableTVEventHandler: function() {
    this._tvEventHandler = new TVEventHandler();
    this._tvEventHandler.enable(this, function(cmp, evt) {
      if (evt && evt.eventType === 'menu') {
        cmp.pop();
      }
    });
  },

  _disableTVEventHandler: function() {
    if (this._tvEventHandler) {
      this._tvEventHandler.disable();
      delete this._tvEventHandler;
    }
  },

  render: function() {
    return (
      // $FlowFixMe(>=0.41.0)
      <View style={this.props.style}>
        {this._renderNavigationStackItems()}
      </View>
    );
  },
});

var styles = StyleSheet.create({
  stackItem: {
    backgroundColor: 'white',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  transitioner: {
    flex: 1,
  },
});

var RCTNavigator = requireNativeComponent('RCTNavigator');
var RCTNavigatorItem = requireNativeComponent('RCTNavItem');

module.exports = NavigatorIOS;
