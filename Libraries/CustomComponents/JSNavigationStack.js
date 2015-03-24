/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule JSNavigationStack
 */

"use strict"

var AnimationsDebugModule = require('NativeModules').AnimationsDebugModule;
var Backstack = require('Backstack');
var Dimensions = require('Dimensions');
var InteractionMixin = require('InteractionMixin');
var JSNavigationStackAnimationConfigs = require('JSNavigationStackAnimationConfigs');
var PanResponder = require('PanResponder');
var React = require('React');
var StaticContainer = require('StaticContainer.react');
var StyleSheet = require('StyleSheet');
var Subscribable = require('Subscribable');
var TimerMixin = require('TimerMixin');
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

var JSNavigationStack = React.createClass({

  propTypes: {
    animationConfigRouteMapper: PropTypes.func,
    routeMapper: PropTypes.shape({
      navigationItemForRoute: PropTypes.func,
    }),
    initialRoute: PropTypes.object,
    initialRouteStack: PropTypes.arrayOf(PropTypes.object),
    // Will emit the target route on mounting and before each nav transition,
    // overriding the handler in this.props.navigator
    onWillFocus: PropTypes.func,
    // Will emit the new route after mounting and after each nav transition,
    // overriding the handler in this.props.navigator
    onDidFocus: PropTypes.func,
    // Will be called with (ref, indexInStack) when an item ref resolves
    onItemRef: PropTypes.func,
    // Define the component to use for the nav bar, which will get navState and navigator props
    navigationBar: PropTypes.node,
    // The navigator object from a parent JSNavigationStack
    navigator: PropTypes.object,

    /**
     * Should the backstack back button "jump" back instead of pop? Set to true
     * if a jump forward might happen after the android back button is pressed,
     * so the scenes will remain mounted
     */
    shouldJumpOnBackstackPop: PropTypes.bool,
  },

  statics: {
    AnimationConfigs: JSNavigationStackAnimationConfigs,
  },

  mixins: [TimerMixin, InteractionMixin, Subscribable.Mixin],

  getDefaultProps: function() {
    return {
      animationConfigRouteMapper: () => JSNavigationStackAnimationConfigs.PushFromRight,
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
        'JSNavigationStack requires props.initialRoute or props.initialRouteStack.'
      );
    }
    return {
      animationConfigStack: routeStack.map(
        (route) => this.props.animationConfigRouteMapper(route)
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
    this.memoizedNavigationOperations = {
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
      // We want to bubble focused routes to the top navigation stack. If we are
      // a child, this will allow us to call this.props.navigator.on*Focus
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
    var animationConfig = this.state.animationConfigStack[this.state.presentedIndex];
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
      animationConfigStack: nextRouteStack.map(
        this.props.animationConfigRouteMapper
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
        this.state.animationConfigStack[this.state.fromIndex].defaultTransitionVelocity
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
      this.state.animationConfigStack[this.state.fromIndex]
    );
    this.state.isAnimating = true;
    this.spring.setVelocity(v);
    this.spring.setEndValue(1);
    this._emitWillFocus(this.state.toIndex);
  },

  _transitionToFromIndexWithVelocity: function(v) {
    this._configureSpring(
      this.state.animationConfigStack[this.state.fromIndex]
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
    var animationConfig = this.state.animationConfigStack[this.state.presentedIndex];
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
    var animationConfig = this.state.animationConfigStack[this.state.presentedIndex];
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
      var animationConfig = this.state.animationConfigStack[this.state.presentedIndex];
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
    var animationConfig = this.state.animationConfigStack[animationIndex];
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
    var activeAnimationConfigStack = this.state.animationConfigStack.slice(0, activeLength);
    var nextStack = activeStack.concat([route]);
    var nextIDStack = activeIDStack.concat([getuid()]);
    var nextAnimationConfigStack = activeAnimationConfigStack.concat([
      this.props.animationConfigRouteMapper(route),
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
      animationConfigStack: nextAnimationConfigStack,
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
    var nextAnimationModeStack = this.state.animationConfigStack.slice();
    nextIDStack[index] = getuid();
    nextRouteStack[index] = route;
    nextAnimationModeStack[index] = this.props.animationConfigRouteMapper(route);

    this.setState({
      idStack: nextIDStack,
      routeStack: nextRouteStack,
      animationConfigStack: nextAnimationModeStack,
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
        animationConfigStack: this.state.animationConfigStack.slice(0, newStackLength),
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
    var routeMapper = this.props.routeMapper;
    var child = routeMapper.navigationItemForRoute(
      route,
      this.memoizedNavigationOperations,
      this._onItemRef.bind(null, this.state.idStack[i])
    );

    var initialSceneStyle =
      i === this.state.presentedIndex ? styles.presentNavItem : styles.futureNavItem;
    return (
      <StaticContainer key={'nav' + i} shouldUpdate={shouldUpdateChild}>
        <View ref={'scene_' + i} style={[initialSceneStyle, this.props.sceneStyle]}>
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
      navigationOperations: this.memoizedNavigationOperations,
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

module.exports = JSNavigationStack;
