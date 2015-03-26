/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. (“Facebook”) owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the “Software”).  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * (“Your Software”).  Facebook reserves all rights not expressly granted to
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
 * @providesModule Navigator
 */
'use strict';

var AnimationsDebugModule = require('NativeModules').AnimationsDebugModule;
var Backstack = require('Backstack');
var Dimensions = require('Dimensions');
var InteractionMixin = require('InteractionMixin');
var NavigatorSceneConfigs = require('NavigatorSceneConfigs');
var NavigatorNavigationBar = require('NavigatorNavigationBar');
var NavigatorBreadcrumbNavigationBar = require('NavigatorBreadcrumbNavigationBar');
var PanResponder = require('PanResponder');
var React = require('React');
var StaticContainer = require('StaticContainer.react');
var StyleSheet = require('StyleSheet');
var Subscribable = require('Subscribable');
var TimerMixin = require('react-timer-mixin');
var View = require('View');

var clamp = require('clamp');
var invariant = require('invariant');
var keyMirror = require('keyMirror');
var merge = require('merge');
var rebound = require('rebound');

var PropTypes = React.PropTypes;

var SCREEN_WIDTH = Dimensions.get('window').width;
var SCREEN_HEIGHT = Dimensions.get('window').height;

var OFF_SCREEN = {style: {opacity: 0}};

var NAVIGATION_BAR_REF = 'navigationBar_ref';

var __uid = 0;
function getuid() {
  return __uid++;
}

var nextComponentUid = 0;

// styles moved to the top of the file so getDefaultProps can refer to it
var styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  defaultSceneStyle: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  presentNavItem: {
    position: 'absolute',
    overflow: 'hidden',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  futureNavItem: {
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    opacity: 0,
  },
  transitioner: {
    flex: 1,
    backgroundColor: '#555555',
    overflow: 'hidden',
  }
});

/**
 * Use `Navigator` to transition between different scenes in your app. To
 * accomplish this, provide route objects to the navigator to identify each
 * scene, and also a `renderScene` function that the navigator can use to
 * render the scene for a given route.
 *
 * To change the animation or gesture properties of the scene, provide a
 * `configureScene` prop to get the config object for a given route. See
 * `Navigator.SceneConfigs` for default animations and more info on
 * scene config options.
 *
 * ### Basic Usage
 *
 * ```
 *   <Navigator
 *     initialRoute={{name: 'My First Scene', index: 0}}
 *     renderScene={(route, navigator) =>
 *       <MySceneComponent
 *         name={route.name}
 *         onForward={() => {
 *           var nextIndex = route.index + 1;
 *           navigator.push({
 *             name: 'Scene ' + nextIndex,
 *             index: nextIndex,
 *           });
 *         }}
 *         onBack={() => {
 *           if (route.index > 0) {
 *             navigator.pop();
 *           }
 *         }}
 *       />
 *     }
 *   />
 * ```
 *
 * ### Navigation Methods
 *
 * `Navigator` can be told to navigate in two ways. If you have a ref to
 * the element, you can invoke several methods on it to trigger navigation:
 *
 *  - `jumpBack()` - Jump backward without unmounting the current scene
 *  - `jumpForward()` - Jump forward to the next scene in the route stack
 *  - `jumpTo(route)` - Transition to an existing scene without unmounting
 *  - `push(route)` - Navigate forward to a new scene, squashing any scenes
 *     that you could `jumpForward` to
 *  - `pop()` - Transition back and unmount the current scene
 *  - `replace(route)` - Replace the current scene with a new route
 *  - `replaceAtIndex(route, index)` - Replace a scene as specified by an index
 *  - `replacePrevious(route)` - Replace the previous scene
 *  - `immediatelyResetRouteStack(routeStack)` - Reset every scene with an
 *     array of routes
 *  - `popToRoute(route)` - Pop to a particular scene, as specified by it's
 *     route. All scenes after it will be unmounted
 *  - `popToTop()` - Pop to the first scene in the stack, unmounting every
 *     other scene
 *
 * ### Navigator Object
 *
 * The navigator object is made available to scenes through the `renderScene`
 * function. The object has all of the navigation methods on it, as well as a
 * few utilities:
 *
 *  - `parentNavigator` - a refrence to the parent navigator object that was
 *     passed in through props.navigator
 *  - `onWillFocus` - used to pass a navigation focus event up to the parent
 *     navigator
 *  - `onDidFocus` - used to pass a navigation focus event up to the parent
 *     navigator
 *
 */
var Navigator = React.createClass({

  propTypes: {
    /**
     * Optional function that allows configuration about scene animations and
     * gestures. Will be invoked with the route and should return a scene
     * configuration object
     *
     * ```
     * (route) => Navigator.SceneConfigs.FloatFromRight
     * ```
     */
    configureScene: PropTypes.func,

    /**
     * Required function which renders the scene for a given route. Will be
     * invoked with the route, the navigator object, and a ref handler that
     * will allow a ref to your scene to be provided by props.onItemRef
     *
     * ```
     * (route, navigator, onRef) =>
     *   <MySceneComponent title={route.title} ref={onRef} />
     * ```
     */
    renderScene: PropTypes.func.isRequired,

    /**
     * Provide a single "route" to start on. A route is an arbitrary object
     * that the navigator will use to identify each scene before rendering.
     * Either initialRoute or initialRouteStack is required.
     */
    initialRoute: PropTypes.object,

    /**
     * Provide a set of routes to initially mount the scenes for. Required if no
     * initialRoute is provided
     */
    initialRouteStack: PropTypes.arrayOf(PropTypes.object),

    /**
     * Will emit the target route upon mounting and before each nav transition,
     * overriding the handler in this.props.navigator. This overrides the onDidFocus
     * handler that would be found in this.props.navigator
     */
    onWillFocus: PropTypes.func,

    /**
     * Will be called with the new route of each scene after the transition is
     * complete or after the initial mounting. This overrides the onDidFocus
     * handler that would be found in this.props.navigator
     */
    onDidFocus: PropTypes.func,

    /**
     * Will be called with (ref, indexInStack) when the scene ref changes
     */
    onItemRef: PropTypes.func,

    /**
     * Optionally provide a navigation bar that persists across scene
     * transitions
     */
    navigationBar: PropTypes.node,

    /**
     * Optionally provide the navigator object from a parent Navigator
     */
    navigator: PropTypes.object,

    /**
     * Styles to apply to the container of each scene
     */
    sceneStyle: View.propTypes.style,

    /**
     * Should the backstack back button "jump" back instead of pop? Set to true
     * if a jump forward might happen after the android back button is pressed,
     * so the scenes will remain mounted
     */
    shouldJumpOnBackstackPop: PropTypes.bool,
  },

  statics: {
    BreadcrumbNavigationBar: NavigatorBreadcrumbNavigationBar,
    NavigationBar: NavigatorNavigationBar,
    SceneConfigs: NavigatorSceneConfigs,
  },

  mixins: [TimerMixin, InteractionMixin, Subscribable.Mixin],

  getDefaultProps: function() {
    return {
      configureScene: () => NavigatorSceneConfigs.PushFromRight,
      sceneStyle: styles.defaultSceneStyle,
    };
  },

  getInitialState: function() {
    var routeStack = this.props.initialRouteStack || [];
    var initialRouteIndex = 0;
    if (this.props.initialRoute && routeStack.length) {
      initialRouteIndex = routeStack.indexOf(this.props.initialRoute);
      invariant(
        initialRouteIndex !== -1,
        'initialRoute is not in initialRouteStack.'
      );
    } else if (this.props.initialRoute) {
      routeStack = [this.props.initialRoute];
    } else {
      invariant(
        routeStack.length >= 1,
        'Navigator requires props.initialRoute or props.initialRouteStack.'
      );
    }
    return {
      sceneConfigStack: routeStack.map(
        (route) => this.props.configureScene(route)
      ),
      idStack: routeStack.map(() => getuid()),
      routeStack,
      // These are tracked to avoid rendering everything all the time.
      updatingRangeStart: initialRouteIndex,
      updatingRangeLength: initialRouteIndex + 1,
      // Either animating or gesturing.
      isAnimating: false,
      jumpToIndex: routeStack.length - 1,
      presentedIndex: initialRouteIndex,
      isResponderOnlyToBlockTouches: false,
      fromIndex: initialRouteIndex,
      toIndex: initialRouteIndex,
    };
  },

  componentWillMount: function() {
    this.navigatorActions = {
      jumpBack: this.jumpBack,
      jumpForward: this.jumpForward,
      jumpTo: this.jumpTo,
      push: this.push,
      pop: this.pop,
      replace: this.replace,
      replaceAtIndex: this.replaceAtIndex,
      replacePrevious: this.replacePrevious,
      replacePreviousAndPop: this.replacePreviousAndPop,
      immediatelyResetRouteStack: this.immediatelyResetRouteStack,
      resetTo: this.resetTo,
      popToRoute: this.popToRoute,
      popToTop: this.popToTop,
      parentNavigator: this.props.navigator,
      // We want to bubble focused routes to the top navigation stack. If we
      // are a child navigator, this allows us to call props.navigator.on*Focus
      // of the topmost Navigator
      onWillFocus: this.props.onWillFocus,
      onDidFocus: this.props.onDidFocus,
    };

    this.panGesture = PanResponder.create({
      onStartShouldSetPanResponderCapture: this._handleStartShouldSetPanResponderCapture,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderRelease: this._handlePanResponderRelease,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderTerminate: this._handlePanResponderTerminate,
    });
    this._itemRefs = {};
    this._interactionHandle = null;
    this._backstackComponentKey = 'jsnavstack' + nextComponentUid;
    nextComponentUid++;

    Backstack.eventEmitter && this.addListenerOn(
      Backstack.eventEmitter,
      'popNavigation',
      this._onBackstackPopState);

    this._emitWillFocus(this.state.presentedIndex);
  },

  _configureSpring: function(animationConfig) {
    var config = this.spring.getSpringConfig();
    config.friction = animationConfig.springFriction;
    config.tension = animationConfig.springTension;
  },

  componentDidMount: function() {
    this.springSystem = new rebound.SpringSystem();
    this.spring = this.springSystem.createSpring();
    this.spring.setRestSpeedThreshold(0.05);
    var animationConfig = this.state.sceneConfigStack[this.state.presentedIndex];
    animationConfig && this._configureSpring(animationConfig);
    this.spring.addListener(this);
    this.onSpringUpdate();

    // Fill up the Backstack with routes that have been provided in
    // initialRouteStack
    this._fillBackstackRange(0, this.state.routeStack.indexOf(this.props.initialRoute));
    this._emitDidFocus(this.state.presentedIndex);
  },

  componentWillUnmount: function() {
    Backstack.removeComponentHistory(this._backstackComponentKey);
  },

  _onBackstackPopState: function(componentKey, stateKey, state) {
    if (componentKey !== this._backstackComponentKey) {
      return;
    }
    if (!this._canNavigate()) {
      // A bit hacky: if we can't actually handle the pop, just push it back on the stack
      Backstack.pushNavigation(componentKey, stateKey, state);
    } else {
      if (this.props.shouldJumpOnBackstackPop) {
        this._jumpToWithoutBackstack(state.fromRoute);
      } else {
        this._popToRouteWithoutBackstack(state.fromRoute);
      }
    }
  },

  /**
   * @param {RouteStack} nextRouteStack Next route stack to reinitialize. This
   * doesn't accept stack item `id`s, which implies that all existing items are
   * destroyed, and then potentially recreated according to `routeStack`. Does
   * not animate, immediately replaces and rerenders navigation bar and stack
   * items.
   */
  immediatelyResetRouteStack: function(nextRouteStack) {
    var destIndex = nextRouteStack.length - 1;
    this.setState({
      idStack: nextRouteStack.map(getuid),
      routeStack: nextRouteStack,
      sceneConfigStack: nextRouteStack.map(
        this.props.configureScene
      ),
      updatingRangeStart: 0,
      updatingRangeLength: nextRouteStack.length,
      presentedIndex: destIndex,
      jumpToIndex: destIndex,
      toIndex: destIndex,
      fromIndex: destIndex,
    }, () => {
      this.onSpringUpdate();
    });
  },

  /**
   * TODO: Accept callback for spring completion.
   */
  _requestTransitionTo: function(topOfStack) {
    if (topOfStack !== this.state.presentedIndex) {
      invariant(!this.state.isAnimating, 'Cannot navigate while transitioning');
      this.state.fromIndex = this.state.presentedIndex;
      this.state.toIndex = topOfStack;
      this.spring.setOvershootClampingEnabled(false);
      if (AnimationsDebugModule) {
        AnimationsDebugModule.startRecordingFps();
      }
      this._transitionToToIndexWithVelocity(
        this.state.sceneConfigStack[this.state.fromIndex].defaultTransitionVelocity
      );
    }
  },

  /**
   * `onSpring*` spring delegate. Wired up via `spring.addListener(this)`
   */
  onSpringEndStateChange: function() {
    if (!this._interactionHandle) {
      this._interactionHandle = this.createInteractionHandle();
    }
  },

  onSpringUpdate: function() {
    this._transitionBetween(
      this.state.fromIndex,
      this.state.toIndex,
      this.spring.getCurrentValue()
    );
  },

  onSpringAtRest: function() {
    this.state.isAnimating = false;
    this._completeTransition();
    this.spring.setCurrentValue(0).setAtRest();
    if (this._interactionHandle) {
      this.clearInteractionHandle(this._interactionHandle);
      this._interactionHandle = null;
    }
  },

  _completeTransition: function() {
    if (this.spring.getCurrentValue() === 1) {
      var presentedIndex = this.state.toIndex;
      this.state.fromIndex = presentedIndex;
      this.state.presentedIndex = presentedIndex;
      this._emitDidFocus(presentedIndex);
      this._removePoppedRoutes();
      if (AnimationsDebugModule) {
        AnimationsDebugModule.stopRecordingFps();
      }
      this._hideOtherScenes(presentedIndex);
    }
  },

  _transitionToToIndexWithVelocity: function(v) {
    this._configureSpring(
      // For visual consistency, the from index is always used to configure the spring
      this.state.sceneConfigStack[this.state.fromIndex]
    );
    this.state.isAnimating = true;
    this.spring.setVelocity(v);
    this.spring.setEndValue(1);
    this._emitWillFocus(this.state.toIndex);
  },

  _transitionToFromIndexWithVelocity: function(v) {
    this._configureSpring(
      this.state.sceneConfigStack[this.state.fromIndex]
    );
    this.state.isAnimating = true;
    this.spring.setVelocity(v);
    this.spring.setEndValue(0);
  },

  _emitDidFocus: function(index) {
    var route = this.state.routeStack[index];
    if (this.props.onDidFocus) {
      this.props.onDidFocus(route);
    } else if (this.props.navigator && this.props.navigator.onDidFocus) {
      this.props.navigator.onDidFocus(route);
    }
  },

  _emitWillFocus: function(index) {
    var route = this.state.routeStack[index];
    if (this.props.onWillFocus) {
      this.props.onWillFocus(route);
    } else if (this.props.navigator && this.props.navigator.onWillFocus) {
      this.props.navigator.onWillFocus(route);
    }
  },

  /**
   * Does not delete the scenes - merely hides them.
   */
  _hideOtherScenes: function(activeIndex) {
    for (var i = 0; i < this.state.routeStack.length; i++) {
      if (i === activeIndex) {
        continue;
      }
      var sceneRef = 'scene_' + i;
      this.refs[sceneRef] &&
        this.refs['scene_' + i].setNativeProps(OFF_SCREEN);
    }
  },

  /**
   * Becomes the responder on touch start (capture) while animating so that it
   * blocks all touch interactions inside of it. However, this responder lock
   * means nothing more than that. We record if the sole reason for being
   * responder is to block interactions (`isResponderOnlyToBlockTouches`).
   */
  _handleStartShouldSetPanResponderCapture: function(e, gestureState) {
    return this.state.isAnimating;
  },

  _handleMoveShouldSetPanResponder: function(e, gestureState) {
    var currentRoute = this.state.routeStack[this.state.presentedIndex];
    var animationConfig = this.state.sceneConfigStack[this.state.presentedIndex];
    if (!animationConfig.enableGestures) {
      return false;
    }
    var currentLoc = animationConfig.isVertical ? gestureState.moveY : gestureState.moveX;
    var travelDist = animationConfig.isVertical ? gestureState.dy : gestureState.dx;
    var oppositeAxisTravelDist =
      animationConfig.isVertical ? gestureState.dx : gestureState.dy;
    var moveStartedInRegion = currentLoc < animationConfig.edgeHitWidth;
    var moveTravelledFarEnough =
      travelDist >= animationConfig.gestureDetectMovement &&
      travelDist > oppositeAxisTravelDist * animationConfig.directionRatio;
    return (
      !this.state.isResponderOnlyToBlockTouches &&
      moveStartedInRegion &&
      !this.state.isAnimating &&
      this.state.presentedIndex > 0 &&
      moveTravelledFarEnough
    );
  },

  _handlePanResponderGrant: function(e, gestureState) {
    this.state.isResponderOnlyToBlockTouches = this.state.isAnimating;
    if (!this.state.isAnimating) {
      this.state.fromIndex = this.state.presentedIndex;
      this.state.toIndex = this.state.presentedIndex - 1;
    }
  },

  _handlePanResponderRelease: function(e, gestureState) {
    if (this.state.isResponderOnlyToBlockTouches) {
      this.state.isResponderOnlyToBlockTouches = false;
      return;
    }
    var animationConfig = this.state.sceneConfigStack[this.state.presentedIndex];
    var velocity = animationConfig.isVertical ? gestureState.vy : gestureState.vx;
    // It's not the real location. There is no *real* location - that's the
    // point of the pan gesture.
    var pseudoLocation = animationConfig.isVertical ?
      gestureState.y0 + gestureState.dy :
      gestureState.x0 + gestureState.dx;
    var still = Math.abs(velocity) < animationConfig.notMoving;
    if (this.spring.getCurrentValue() === 0) {
      this.spring.setCurrentValue(0).setAtRest();
      this._completeTransition();
      return;
    }
    var transitionVelocity =
      still && animationConfig.pastPointOfNoReturn(pseudoLocation) ? animationConfig.snapVelocity :
      still && !animationConfig.pastPointOfNoReturn(pseudoLocation) ? -animationConfig.snapVelocity :
      clamp(-10, velocity, 10);  // What are Rebound UoM?

    this.spring.setOvershootClampingEnabled(true);
    if (transitionVelocity < 0) {
      this._transitionToFromIndexWithVelocity(transitionVelocity);
    } else {
      this._manuallyPopBackstack(1);
      this._transitionToToIndexWithVelocity(transitionVelocity);
    }
  },

  _handlePanResponderTerminate: function(e, gestureState) {
    this.state.isResponderOnlyToBlockTouches = false;
    this._transitionToFromIndexWithVelocity(0);
  },

  _handlePanResponderMove: function(e, gestureState) {
    if (!this.state.isResponderOnlyToBlockTouches) {
      var animationConfig = this.state.sceneConfigStack[this.state.presentedIndex];
      var distance = animationConfig.isVertical ? gestureState.dy : gestureState.dx;
      var gestureDetectMovement = animationConfig.gestureDetectMovement;
      var nextProgress = (distance - gestureDetectMovement) /
        (animationConfig.screenDimension - gestureDetectMovement);
      this.spring.setCurrentValue(clamp(0, nextProgress, 1));
    }
  },

  _transitionSceneStyle: function(fromIndex, toIndex, progress, index) {
    var viewAtIndex = this.refs['scene_' + index];
    if (viewAtIndex === null || viewAtIndex === undefined) {
      return;
    }
    // Use toIndex animation when we move forwards. Use fromIndex when we move back
    var animationIndex = this.state.presentedIndex < toIndex ? toIndex : fromIndex;
    var animationConfig = this.state.sceneConfigStack[animationIndex];
    var styleToUse = {};
    var useFn = index < fromIndex || index < toIndex ?
      animationConfig.interpolators.out :
      animationConfig.interpolators.into;
    var directionAdjustedProgress = fromIndex < toIndex ? progress : 1 - progress;
    var didChange = useFn(styleToUse, directionAdjustedProgress);
    if (didChange) {
      viewAtIndex.setNativeProps({style: styleToUse});
    }
  },

  _transitionBetween: function(fromIndex, toIndex, progress) {
    this._transitionSceneStyle(fromIndex, toIndex, progress, fromIndex);
    this._transitionSceneStyle(fromIndex, toIndex, progress, toIndex);
    var navBar = this.refs[NAVIGATION_BAR_REF];
    if (navBar && navBar.updateProgress) {
      navBar.updateProgress(progress, fromIndex, toIndex);
    }
  },

  _handleResponderTerminationRequest: function() {
    return false;
  },

  _resetUpdatingRange: function() {
    this.state.updatingRangeStart = 0;
    this.state.updatingRangeLength = this.state.routeStack.length;
  },

  _canNavigate: function() {
    return !this.state.isAnimating;
  },

  _jumpNWithoutBackstack: function(n) {
    var destIndex = this._getDestIndexWithinBounds(n);
    if (!this._canNavigate()) {
      return; // It's busy animating or transitioning.
    }
    var requestTransitionAndResetUpdatingRange = () => {
      this._requestTransitionTo(destIndex);
      this._resetUpdatingRange();
    };
    this.setState({
      updatingRangeStart: destIndex,
      updatingRangeLength: 1,
      toIndex: destIndex,
    }, requestTransitionAndResetUpdatingRange);
  },

  _fillBackstackRange: function(start, end) {
    invariant(
      start <= end,
      'Can only fill the backstack forward. Provide end index greater than start'
    );
    for (var i = 0; i < (end - start); i++) {
      var fromIndex = start + i;
      var toIndex = start + i + 1;
      Backstack.pushNavigation(
        this._backstackComponentKey,
        toIndex,
        {
          fromRoute: this.state.routeStack[fromIndex],
          toRoute: this.state.routeStack[toIndex],
        }
      );
    }
  },

  _getDestIndexWithinBounds: function(n) {
    var currentIndex = this.state.presentedIndex;
    var destIndex = currentIndex + n;
    invariant(
      destIndex >= 0,
      'Cannot jump before the first route.'
    );
    var maxIndex = this.state.routeStack.length - 1;
    invariant(
      maxIndex >= destIndex,
      'Cannot jump past the last route.'
    );
    return destIndex;
  },

  _jumpN: function(n) {
    var currentIndex = this.state.presentedIndex;
    if (!this._canNavigate()) {
      return; // It's busy animating or transitioning.
    }
    if (n > 0) {
      this._fillBackstackRange(currentIndex, currentIndex + n);
    } else {
      var landingBeforeIndex = currentIndex + n + 1;
      Backstack.resetToBefore(
        this._backstackComponentKey,
        landingBeforeIndex
      );
    }
    this._jumpNWithoutBackstack(n);
  },

  jumpTo: function(route) {
    var destIndex = this.state.routeStack.indexOf(route);
    invariant(
      destIndex !== -1,
      'Cannot jump to route that is not in the route stack'
    );
    this._jumpN(destIndex - this.state.presentedIndex);
  },

  _jumpToWithoutBackstack: function(route) {
    var destIndex = this.state.routeStack.indexOf(route);
    invariant(
      destIndex !== -1,
      'Cannot jump to route that is not in the route stack'
    );
    this._jumpNWithoutBackstack(destIndex - this.state.presentedIndex);
  },

  jumpForward: function() {
    this._jumpN(1);
  },

  jumpBack: function() {
    this._jumpN(-1);
  },

  push: function(route) {
    invariant(!!route, 'Must supply route to push');
    if (!this._canNavigate()) {
      return; // It's busy animating or transitioning.
    }
    var activeLength = this.state.presentedIndex + 1;
    var activeStack = this.state.routeStack.slice(0, activeLength);
    var activeIDStack = this.state.idStack.slice(0, activeLength);
    var activeAnimationConfigStack = this.state.sceneConfigStack.slice(0, activeLength);
    var nextStack = activeStack.concat([route]);
    var nextIDStack = activeIDStack.concat([getuid()]);
    var nextAnimationConfigStack = activeAnimationConfigStack.concat([
      this.props.configureScene(route),
    ]);
    var requestTransitionAndResetUpdatingRange = () => {
      this._requestTransitionTo(nextStack.length - 1);
      this._resetUpdatingRange();
    };
    var navigationState = {
      toRoute: route,
      fromRoute: this.state.routeStack[this.state.routeStack.length - 1],
    };
    Backstack.pushNavigation(
      this._backstackComponentKey,
      this.state.routeStack.length,
      navigationState);

    this.setState({
      idStack: nextIDStack,
      routeStack: nextStack,
      sceneConfigStack: nextAnimationConfigStack,
      jumpToIndex: nextStack.length - 1,
      updatingRangeStart: nextStack.length - 1,
      updatingRangeLength: 1,
    }, requestTransitionAndResetUpdatingRange);
  },

   _manuallyPopBackstack: function(n) {
    Backstack.resetToBefore(this._backstackComponentKey, this.state.routeStack.length - n);
  },

  /**
   * Like popN, but doesn't also update the Backstack.
   */
  _popNWithoutBackstack: function(n) {
    if (n === 0 || !this._canNavigate()) {
      return;
    }
    invariant(
      this.state.presentedIndex - n >= 0,
      'Cannot pop below zero'
    );
    this.state.jumpToIndex = this.state.presentedIndex - n;
    this._requestTransitionTo(
      this.state.presentedIndex - n
    );
  },

  popN: function(n) {
    if (n === 0 || !this._canNavigate()) {
      return;
    }
    this._popNWithoutBackstack(n);
    this._manuallyPopBackstack(n);
  },

  pop: function() {
    if (this.props.navigator && this.state.routeStack.length === 1) {
      return this.props.navigator.pop();
    }
    this.popN(1);
  },

  /**
   * Replace a route in the navigation stack.
   *
   * `index` specifies the route in the stack that should be replaced.
   * If it's negative, it counts from the back.
   */
  replaceAtIndex: function(route, index) {
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
    var nextAnimationModeStack = this.state.sceneConfigStack.slice();
    nextIDStack[index] = getuid();
    nextRouteStack[index] = route;
    nextAnimationModeStack[index] = this.props.configureScene(route);

    this.setState({
      idStack: nextIDStack,
      routeStack: nextRouteStack,
      sceneConfigStack: nextAnimationModeStack,
      updatingRangeStart: index,
      updatingRangeLength: 1,
    }, () => {
      this._resetUpdatingRange();
      if (index === this.state.presentedIndex) {
        this._emitWillFocus(this.state.presentedIndex);
        this._emitDidFocus(this.state.presentedIndex);
      }
    });
  },

  /**
   * Replaces the current scene in the stack.
   */
  replace: function(route) {
    this.replaceAtIndex(route, this.state.presentedIndex);
  },

  /**
   * Replace the current route's parent.
   */
  replacePrevious: function(route) {
    this.replaceAtIndex(route, this.state.presentedIndex - 1);
  },

  popToTop: function() {
    this.popToRoute(this.state.routeStack[0]);
  },

  _getNumToPopForRoute: function(route) {
    var indexOfRoute = this.state.routeStack.indexOf(route);
    invariant(
      indexOfRoute !== -1,
      'Calling pop to route for a route that doesn\'t exist!'
    );
    return this.state.routeStack.length - indexOfRoute - 1;
  },

  /**
   * Like popToRoute, but doesn't update the Backstack, presumably because it's already up to date.
   */
  _popToRouteWithoutBackstack: function(route) {
    var numToPop = this._getNumToPopForRoute(route);
    this._popNWithoutBackstack(numToPop);
  },

  popToRoute: function(route) {
    var numToPop = this._getNumToPopForRoute(route);
    this.popN(numToPop);
  },

  replacePreviousAndPop: function(route) {
    if (this.state.routeStack.length < 2 || !this._canNavigate()) {
      return;
    }
    this.replacePrevious(route);
    this.pop();
  },

  resetTo: function(route) {
    invariant(!!route, 'Must supply route to push');
    if (this._canNavigate()) {
      this.replaceAtIndex(route, 0);
      this.popToRoute(route);
    }
  },

  _onItemRef: function(itemId, ref) {
    this._itemRefs[itemId] = ref;
    var itemIndex = this.state.idStack.indexOf(itemId);
    if (itemIndex === -1) {
      return;
    }
    this.props.onItemRef && this.props.onItemRef(ref, itemIndex);
  },

  _removePoppedRoutes: function() {
    var newStackLength = this.state.jumpToIndex + 1;
    // Remove any unneeded rendered routes.
    if (newStackLength < this.state.routeStack.length) {
      var updatingRangeStart = newStackLength; // One past the top
      var updatingRangeLength = this.state.routeStack.length - newStackLength + 1;
      this.state.idStack.slice(newStackLength).map((removingId) => {
        this._itemRefs[removingId] = null;
      });
      this.setState({
        updatingRangeStart: updatingRangeStart,
        updatingRangeLength: updatingRangeLength,
        sceneConfigStack: this.state.sceneConfigStack.slice(0, newStackLength),
        idStack: this.state.idStack.slice(0, newStackLength),
        routeStack: this.state.routeStack.slice(0, newStackLength),
      }, this._resetUpdatingRange);
    }
  },

  _routeToOptimizedStackItem: function(route, i) {
    var shouldUpdateChild =
      this.state.updatingRangeLength !== 0 &&
      i >= this.state.updatingRangeStart &&
      i <= this.state.updatingRangeStart + this.state.updatingRangeLength;
    var child = this.props.renderScene(
      route,
      this.navigatorActions,
      this._onItemRef.bind(null, this.state.idStack[i])
    );

    var initialSceneStyle =
      i === this.state.presentedIndex ? styles.presentNavItem : styles.futureNavItem;
    return (
      <StaticContainer key={'nav' + i} shouldUpdate={shouldUpdateChild}>
        <View
          key={this.state.idStack[i]}
          ref={'scene_' + i}
          style={[initialSceneStyle, this.props.sceneStyle]}>
          {child}
        </View>
      </StaticContainer>
    );
  },

  renderNavigationStackItems: function() {
    var shouldRecurseToNavigator = this.state.updatingRangeLength !== 0;
    // If not recursing update to navigator at all, may as well avoid
    // computation of navigator children.
    var items = shouldRecurseToNavigator ?
      this.state.routeStack.map(this._routeToOptimizedStackItem) : null;

    return (
      <StaticContainer shouldUpdate={shouldRecurseToNavigator}>
        <View
          style={styles.transitioner}
          {...this.panGesture.panHandlers}
          onResponderTerminationRequest={this._handleResponderTerminationRequest}>
          {items}
        </View>
      </StaticContainer>
    );
  },

  renderNavigationStackBar: function() {
    var NavigationBarClass = this.props.NavigationBarClass;
    if (!this.props.navigationBar) {
      return null;
    }
    return React.cloneElement(this.props.navigationBar, {
      ref: NAVIGATION_BAR_REF,
      navigator: this.navigatorActions,
      navState: this.state,
    });
  },

  render: function() {
    return (
      <View style={[styles.container, this.props.style]}>
        {this.renderNavigationStackItems()}
        {this.renderNavigationStackBar()}
      </View>
    );
  },
});

module.exports = Navigator;
