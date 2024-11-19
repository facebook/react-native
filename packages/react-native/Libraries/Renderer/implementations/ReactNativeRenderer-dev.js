/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @providesModule ReactNativeRenderer-dev
 * @preventMunge
 * @generated SignedSource<<4fbb60a6e6520f92ffc104738fdd5ce8>>
 */

"use strict";

if (__DEV__) {
  (function () {
    "use strict";

    /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
    if (
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart ===
        "function"
    ) {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
    }
    var React = require("react");
    require("react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore");
    var ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface");
    var Scheduler = require("scheduler");

    var ReactSharedInternals =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    // by calls to these methods by a Babel plugin.
    //
    // In PROD (or in packages without access to React internals),
    // they are left as they are instead.

    function warn(format) {
      {
        {
          for (
            var _len = arguments.length,
              args = new Array(_len > 1 ? _len - 1 : 0),
              _key = 1;
            _key < _len;
            _key++
          ) {
            args[_key - 1] = arguments[_key];
          }

          printWarning("warn", format, args);
        }
      }
    }
    function error(format) {
      {
        {
          for (
            var _len2 = arguments.length,
              args = new Array(_len2 > 1 ? _len2 - 1 : 0),
              _key2 = 1;
            _key2 < _len2;
            _key2++
          ) {
            args[_key2 - 1] = arguments[_key2];
          }

          printWarning("error", format, args);
        }
      }
    }

    function printWarning(level, format, args) {
      // When changing this logic, you might want to also
      // update consoleWithStackDev.www.js as well.
      {
        var ReactDebugCurrentFrame =
          ReactSharedInternals.ReactDebugCurrentFrame;
        var stack = ReactDebugCurrentFrame.getStackAddendum();

        if (stack !== "") {
          format += "%s";
          args = args.concat([stack]);
        } // eslint-disable-next-line react-internal/safe-string-coercion

        var argsWithFormat = args.map(function (item) {
          return String(item);
        }); // Careful: RN currently depends on this prefix

        argsWithFormat.unshift("Warning: " + format); // We intentionally don't use spread (or .apply) directly because it
        // breaks IE9: https://github.com/facebook/react/issues/13610
        // eslint-disable-next-line react-internal/no-production-logging

        Function.prototype.apply.call(console[level], console, argsWithFormat);
      }
    }

    var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

    function isArray(a) {
      return isArrayImpl(a);
    }

    var hasError = false;
    var caughtError = null;
    var getFiberCurrentPropsFromNode$1 = null;
    var getInstanceFromNode = null;
    var getNodeFromInstance = null;
    function setComponentTree(
      getFiberCurrentPropsFromNodeImpl,
      getInstanceFromNodeImpl,
      getNodeFromInstanceImpl
    ) {
      getFiberCurrentPropsFromNode$1 = getFiberCurrentPropsFromNodeImpl;
      getInstanceFromNode = getInstanceFromNodeImpl;
      getNodeFromInstance = getNodeFromInstanceImpl;

      {
        if (!getNodeFromInstance || !getInstanceFromNode) {
          error(
            "Injected " +
              "module is missing getNodeFromInstance or getInstanceFromNode."
          );
        }
      }
    }

    function validateEventDispatches(event) {
      {
        var dispatchListeners = event._dispatchListeners;
        var dispatchInstances = event._dispatchInstances;
        var listenersIsArr = isArray(dispatchListeners);
        var listenersLen = listenersIsArr
          ? dispatchListeners.length
          : dispatchListeners
          ? 1
          : 0;
        var instancesIsArr = isArray(dispatchInstances);
        var instancesLen = instancesIsArr
          ? dispatchInstances.length
          : dispatchInstances
          ? 1
          : 0;

        if (
          instancesIsArr !== listenersIsArr ||
          instancesLen !== listenersLen
        ) {
          error("EventPluginUtils: Invalid `event`.");
        }
      }
    }
    /**
     * Dispatch the event to the listener.
     * @param {SyntheticEvent} event SyntheticEvent to handle
     * @param {function} listener Application-level callback
     * @param {*} inst Internal component instance
     */

    function executeDispatch(event, listener, inst) {
      event.currentTarget = getNodeFromInstance(inst);

      try {
        listener(event);
      } catch (error) {
        if (!hasError) {
          hasError = true;
          caughtError = error;
        }
      }

      event.currentTarget = null;
    }
    /**
     * Standard/simple iteration through an event's collected dispatches.
     */

    function executeDispatchesInOrder(event) {
      var dispatchListeners = event._dispatchListeners;
      var dispatchInstances = event._dispatchInstances;

      {
        validateEventDispatches(event);
      }

      if (isArray(dispatchListeners)) {
        for (var i = 0; i < dispatchListeners.length; i++) {
          if (event.isPropagationStopped()) {
            break;
          } // Listeners and Instances are two parallel arrays that are always in sync.

          executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
        }
      } else if (dispatchListeners) {
        executeDispatch(event, dispatchListeners, dispatchInstances);
      }

      event._dispatchListeners = null;
      event._dispatchInstances = null;
    }
    /**
     * Standard/simple iteration through an event's collected dispatches, but stops
     * at the first dispatch execution returning true, and returns that id.
     *
     * @return {?string} id of the first dispatch execution who's listener returns
     * true, or null if no listener returned true.
     */

    function executeDispatchesInOrderStopAtTrueImpl(event) {
      var dispatchListeners = event._dispatchListeners;
      var dispatchInstances = event._dispatchInstances;

      {
        validateEventDispatches(event);
      }

      if (isArray(dispatchListeners)) {
        for (var i = 0; i < dispatchListeners.length; i++) {
          if (event.isPropagationStopped()) {
            break;
          } // Listeners and Instances are two parallel arrays that are always in sync.

          if (dispatchListeners[i](event, dispatchInstances[i])) {
            return dispatchInstances[i];
          }
        }
      } else if (dispatchListeners) {
        if (dispatchListeners(event, dispatchInstances)) {
          return dispatchInstances;
        }
      }

      return null;
    }
    /**
     * @see executeDispatchesInOrderStopAtTrueImpl
     */

    function executeDispatchesInOrderStopAtTrue(event) {
      var ret = executeDispatchesInOrderStopAtTrueImpl(event);
      event._dispatchInstances = null;
      event._dispatchListeners = null;
      return ret;
    }
    /**
     * Execution of a "direct" dispatch - there must be at most one dispatch
     * accumulated on the event or it is considered an error. It doesn't really make
     * sense for an event with multiple dispatches (bubbled) to keep track of the
     * return values at each dispatch execution, but it does tend to make sense when
     * dealing with "direct" dispatches.
     *
     * @return {*} The return value of executing the single dispatch.
     */

    function executeDirectDispatch(event) {
      {
        validateEventDispatches(event);
      }

      var dispatchListener = event._dispatchListeners;
      var dispatchInstance = event._dispatchInstances;

      if (isArray(dispatchListener)) {
        throw new Error("Invalid `event`.");
      }

      event.currentTarget = dispatchListener
        ? getNodeFromInstance(dispatchInstance)
        : null;
      var res = dispatchListener ? dispatchListener(event) : null;
      event.currentTarget = null;
      event._dispatchListeners = null;
      event._dispatchInstances = null;
      return res;
    }
    /**
     * @param {SyntheticEvent} event
     * @return {boolean} True iff number of dispatches accumulated is greater than 0.
     */

    function hasDispatches(event) {
      return !!event._dispatchListeners;
    }
    function rethrowCaughtError() {
      if (hasError) {
        var error = caughtError;
        hasError = false;
        caughtError = null;
        throw error;
      }
    }

    var assign = Object.assign;

    var EVENT_POOL_SIZE = 10;
    /**
     * @interface Event
     * @see http://www.w3.org/TR/DOM-Level-3-Events/
     */

    var EventInterface = {
      type: null,
      target: null,
      // currentTarget is set when dispatching; no use in copying it here
      currentTarget: function () {
        return null;
      },
      eventPhase: null,
      bubbles: null,
      cancelable: null,
      timeStamp: function (event) {
        return event.timeStamp || Date.now();
      },
      defaultPrevented: null,
      isTrusted: null
    };

    function functionThatReturnsTrue() {
      return true;
    }

    function functionThatReturnsFalse() {
      return false;
    }
    /**
     * Synthetic events are dispatched by event plugins, typically in response to a
     * top-level event delegation handler.
     *
     * These systems should generally use pooling to reduce the frequency of garbage
     * collection. The system should check `isPersistent` to determine whether the
     * event should be released into the pool after being dispatched. Users that
     * need a persisted event should invoke `persist`.
     *
     * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
     * normalizing browser quirks. Subclasses do not necessarily have to implement a
     * DOM interface; custom application-specific events can also subclass this.
     *
     * @param {object} dispatchConfig Configuration used to dispatch this event.
     * @param {*} targetInst Marker identifying the event target.
     * @param {object} nativeEvent Native browser event.
     * @param {DOMEventTarget} nativeEventTarget Target node.
     */

    function SyntheticEvent(
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      {
        // these have a getter/setter for warnings
        delete this.nativeEvent;
        delete this.preventDefault;
        delete this.stopPropagation;
        delete this.isDefaultPrevented;
        delete this.isPropagationStopped;
      }

      this.dispatchConfig = dispatchConfig;
      this._targetInst = targetInst;
      this.nativeEvent = nativeEvent;
      this._dispatchListeners = null;
      this._dispatchInstances = null;
      var Interface = this.constructor.Interface;

      for (var propName in Interface) {
        if (!Interface.hasOwnProperty(propName)) {
          continue;
        }

        {
          delete this[propName]; // this has a getter/setter for warnings
        }

        var normalize = Interface[propName];

        if (normalize) {
          this[propName] = normalize(nativeEvent);
        } else {
          if (propName === "target") {
            this.target = nativeEventTarget;
          } else {
            this[propName] = nativeEvent[propName];
          }
        }
      }

      var defaultPrevented =
        nativeEvent.defaultPrevented != null
          ? nativeEvent.defaultPrevented
          : nativeEvent.returnValue === false;

      if (defaultPrevented) {
        this.isDefaultPrevented = functionThatReturnsTrue;
      } else {
        this.isDefaultPrevented = functionThatReturnsFalse;
      }

      this.isPropagationStopped = functionThatReturnsFalse;
      return this;
    }

    assign(SyntheticEvent.prototype, {
      preventDefault: function () {
        this.defaultPrevented = true;
        var event = this.nativeEvent;

        if (!event) {
          return;
        }

        if (event.preventDefault) {
          event.preventDefault();
        } else if (typeof event.returnValue !== "unknown") {
          event.returnValue = false;
        }

        this.isDefaultPrevented = functionThatReturnsTrue;
      },
      stopPropagation: function () {
        var event = this.nativeEvent;

        if (!event) {
          return;
        }

        if (event.stopPropagation) {
          event.stopPropagation();
        } else if (typeof event.cancelBubble !== "unknown") {
          // The ChangeEventPlugin registers a "propertychange" event for
          // IE. This event does not support bubbling or cancelling, and
          // any references to cancelBubble throw "Member not found".  A
          // typeof check of "unknown" circumvents this issue (and is also
          // IE specific).
          event.cancelBubble = true;
        }

        this.isPropagationStopped = functionThatReturnsTrue;
      },

      /**
       * We release all dispatched `SyntheticEvent`s after each event loop, adding
       * them back into the pool. This allows a way to hold onto a reference that
       * won't be added back into the pool.
       */
      persist: function () {
        this.isPersistent = functionThatReturnsTrue;
      },

      /**
       * Checks if this event should be released back into the pool.
       *
       * @return {boolean} True if this should not be released, false otherwise.
       */
      isPersistent: functionThatReturnsFalse,

      /**
       * `PooledClass` looks for `destructor` on each instance it releases.
       */
      destructor: function () {
        var Interface = this.constructor.Interface;

        for (var propName in Interface) {
          {
            Object.defineProperty(
              this,
              propName,
              getPooledWarningPropertyDefinition(propName, Interface[propName])
            );
          }
        }

        this.dispatchConfig = null;
        this._targetInst = null;
        this.nativeEvent = null;
        this.isDefaultPrevented = functionThatReturnsFalse;
        this.isPropagationStopped = functionThatReturnsFalse;
        this._dispatchListeners = null;
        this._dispatchInstances = null;

        {
          Object.defineProperty(
            this,
            "nativeEvent",
            getPooledWarningPropertyDefinition("nativeEvent", null)
          );
          Object.defineProperty(
            this,
            "isDefaultPrevented",
            getPooledWarningPropertyDefinition(
              "isDefaultPrevented",
              functionThatReturnsFalse
            )
          );
          Object.defineProperty(
            this,
            "isPropagationStopped",
            getPooledWarningPropertyDefinition(
              "isPropagationStopped",
              functionThatReturnsFalse
            )
          );
          Object.defineProperty(
            this,
            "preventDefault",
            getPooledWarningPropertyDefinition("preventDefault", function () {})
          );
          Object.defineProperty(
            this,
            "stopPropagation",
            getPooledWarningPropertyDefinition(
              "stopPropagation",
              function () {}
            )
          );
        }
      }
    });
    SyntheticEvent.Interface = EventInterface;
    /**
     * Helper to reduce boilerplate when creating subclasses.
     */

    SyntheticEvent.extend = function (Interface) {
      var Super = this;

      var E = function () {};

      E.prototype = Super.prototype;
      var prototype = new E();

      function Class() {
        return Super.apply(this, arguments);
      }

      assign(prototype, Class.prototype);
      Class.prototype = prototype;
      Class.prototype.constructor = Class;
      Class.Interface = assign({}, Super.Interface, Interface);
      Class.extend = Super.extend;
      addEventPoolingTo(Class);
      return Class;
    };

    addEventPoolingTo(SyntheticEvent);
    /**
     * Helper to nullify syntheticEvent instance properties when destructing
     *
     * @param {String} propName
     * @param {?object} getVal
     * @return {object} defineProperty object
     */

    function getPooledWarningPropertyDefinition(propName, getVal) {
      function set(val) {
        var action = isFunction ? "setting the method" : "setting the property";
        warn(action, "This is effectively a no-op");
        return val;
      }

      function get() {
        var action = isFunction
          ? "accessing the method"
          : "accessing the property";
        var result = isFunction
          ? "This is a no-op function"
          : "This is set to null";
        warn(action, result);
        return getVal;
      }

      function warn(action, result) {
        {
          error(
            "This synthetic event is reused for performance reasons. If you're seeing this, " +
              "you're %s `%s` on a released/nullified synthetic event. %s. " +
              "If you must keep the original synthetic event around, use event.persist(). " +
              "See https://react.dev/link/event-pooling for more information.",
            action,
            propName,
            result
          );
        }
      }

      var isFunction = typeof getVal === "function";
      return {
        configurable: true,
        set: set,
        get: get
      };
    }

    function createOrGetPooledEvent(
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeInst
    ) {
      var EventConstructor = this;

      if (EventConstructor.eventPool.length) {
        var instance = EventConstructor.eventPool.pop();
        EventConstructor.call(
          instance,
          dispatchConfig,
          targetInst,
          nativeEvent,
          nativeInst
        );
        return instance;
      }

      return new EventConstructor(
        dispatchConfig,
        targetInst,
        nativeEvent,
        nativeInst
      );
    }

    function releasePooledEvent(event) {
      var EventConstructor = this;

      if (!(event instanceof EventConstructor)) {
        throw new Error(
          "Trying to release an event instance into a pool of a different type."
        );
      }

      event.destructor();

      if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
        EventConstructor.eventPool.push(event);
      }
    }

    function addEventPoolingTo(EventConstructor) {
      EventConstructor.getPooled = createOrGetPooledEvent;
      EventConstructor.eventPool = [];
      EventConstructor.release = releasePooledEvent;
    }

    /**
     * `touchHistory` isn't actually on the native event, but putting it in the
     * interface will ensure that it is cleaned up when pooled/destroyed. The
     * `ResponderEventPlugin` will populate it appropriately.
     */

    var ResponderSyntheticEvent = SyntheticEvent.extend({
      touchHistory: function (nativeEvent) {
        return null; // Actually doesn't even look at the native event.
      }
    });

    var TOP_TOUCH_START = "topTouchStart";
    var TOP_TOUCH_MOVE = "topTouchMove";
    var TOP_TOUCH_END = "topTouchEnd";
    var TOP_TOUCH_CANCEL = "topTouchCancel";
    var TOP_SCROLL = "topScroll";
    var TOP_SELECTION_CHANGE = "topSelectionChange";
    function isStartish(topLevelType) {
      return topLevelType === TOP_TOUCH_START;
    }
    function isMoveish(topLevelType) {
      return topLevelType === TOP_TOUCH_MOVE;
    }
    function isEndish(topLevelType) {
      return (
        topLevelType === TOP_TOUCH_END || topLevelType === TOP_TOUCH_CANCEL
      );
    }
    var startDependencies = [TOP_TOUCH_START];
    var moveDependencies = [TOP_TOUCH_MOVE];
    var endDependencies = [TOP_TOUCH_CANCEL, TOP_TOUCH_END];

    /**
     * Tracks the position and time of each active touch by `touch.identifier`. We
     * should typically only see IDs in the range of 1-20 because IDs get recycled
     * when touches end and start again.
     */

    var MAX_TOUCH_BANK = 20;
    var touchBank = [];
    var touchHistory = {
      touchBank: touchBank,
      numberActiveTouches: 0,
      // If there is only one active touch, we remember its location. This prevents
      // us having to loop through all of the touches all the time in the most
      // common case.
      indexOfSingleActiveTouch: -1,
      mostRecentTimeStamp: 0
    };

    function timestampForTouch(touch) {
      // The legacy internal implementation provides "timeStamp", which has been
      // renamed to "timestamp". Let both work for now while we iron it out
      // TODO (evv): rename timeStamp to timestamp in internal code
      return touch.timeStamp || touch.timestamp;
    }
    /**
     * TODO: Instead of making gestures recompute filtered velocity, we could
     * include a built in velocity computation that can be reused globally.
     */

    function createTouchRecord(touch) {
      return {
        touchActive: true,
        startPageX: touch.pageX,
        startPageY: touch.pageY,
        startTimeStamp: timestampForTouch(touch),
        currentPageX: touch.pageX,
        currentPageY: touch.pageY,
        currentTimeStamp: timestampForTouch(touch),
        previousPageX: touch.pageX,
        previousPageY: touch.pageY,
        previousTimeStamp: timestampForTouch(touch)
      };
    }

    function resetTouchRecord(touchRecord, touch) {
      touchRecord.touchActive = true;
      touchRecord.startPageX = touch.pageX;
      touchRecord.startPageY = touch.pageY;
      touchRecord.startTimeStamp = timestampForTouch(touch);
      touchRecord.currentPageX = touch.pageX;
      touchRecord.currentPageY = touch.pageY;
      touchRecord.currentTimeStamp = timestampForTouch(touch);
      touchRecord.previousPageX = touch.pageX;
      touchRecord.previousPageY = touch.pageY;
      touchRecord.previousTimeStamp = timestampForTouch(touch);
    }

    function getTouchIdentifier(_ref) {
      var identifier = _ref.identifier;

      if (identifier == null) {
        throw new Error("Touch object is missing identifier.");
      }

      {
        if (identifier > MAX_TOUCH_BANK) {
          error(
            "Touch identifier %s is greater than maximum supported %s which causes " +
              "performance issues backfilling array locations for all of the indices.",
            identifier,
            MAX_TOUCH_BANK
          );
        }
      }

      return identifier;
    }

    function recordTouchStart(touch) {
      var identifier = getTouchIdentifier(touch);
      var touchRecord = touchBank[identifier];

      if (touchRecord) {
        resetTouchRecord(touchRecord, touch);
      } else {
        touchBank[identifier] = createTouchRecord(touch);
      }

      touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
    }

    function recordTouchMove(touch) {
      var touchRecord = touchBank[getTouchIdentifier(touch)];

      if (touchRecord) {
        touchRecord.touchActive = true;
        touchRecord.previousPageX = touchRecord.currentPageX;
        touchRecord.previousPageY = touchRecord.currentPageY;
        touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
        touchRecord.currentPageX = touch.pageX;
        touchRecord.currentPageY = touch.pageY;
        touchRecord.currentTimeStamp = timestampForTouch(touch);
        touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
      } else {
        {
          warn(
            "Cannot record touch move without a touch start.\n" +
              "Touch Move: %s\n" +
              "Touch Bank: %s",
            printTouch(touch),
            printTouchBank()
          );
        }
      }
    }

    function recordTouchEnd(touch) {
      var touchRecord = touchBank[getTouchIdentifier(touch)];

      if (touchRecord) {
        touchRecord.touchActive = false;
        touchRecord.previousPageX = touchRecord.currentPageX;
        touchRecord.previousPageY = touchRecord.currentPageY;
        touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
        touchRecord.currentPageX = touch.pageX;
        touchRecord.currentPageY = touch.pageY;
        touchRecord.currentTimeStamp = timestampForTouch(touch);
        touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
      } else {
        {
          warn(
            "Cannot record touch end without a touch start.\n" +
              "Touch End: %s\n" +
              "Touch Bank: %s",
            printTouch(touch),
            printTouchBank()
          );
        }
      }
    }

    function printTouch(touch) {
      return JSON.stringify({
        identifier: touch.identifier,
        pageX: touch.pageX,
        pageY: touch.pageY,
        timestamp: timestampForTouch(touch)
      });
    }

    function printTouchBank() {
      var printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));

      if (touchBank.length > MAX_TOUCH_BANK) {
        printed += " (original size: " + touchBank.length + ")";
      }

      return printed;
    }

    var instrumentationCallback;
    var ResponderTouchHistoryStore = {
      /**
       * Registers a listener which can be used to instrument every touch event.
       */
      instrument: function (callback) {
        instrumentationCallback = callback;
      },
      recordTouchTrack: function (topLevelType, nativeEvent) {
        if (instrumentationCallback != null) {
          instrumentationCallback(topLevelType, nativeEvent);
        }

        if (isMoveish(topLevelType)) {
          nativeEvent.changedTouches.forEach(recordTouchMove);
        } else if (isStartish(topLevelType)) {
          nativeEvent.changedTouches.forEach(recordTouchStart);
          touchHistory.numberActiveTouches = nativeEvent.touches.length;

          if (touchHistory.numberActiveTouches === 1) {
            touchHistory.indexOfSingleActiveTouch =
              nativeEvent.touches[0].identifier;
          }
        } else if (isEndish(topLevelType)) {
          nativeEvent.changedTouches.forEach(recordTouchEnd);
          touchHistory.numberActiveTouches = nativeEvent.touches.length;

          if (touchHistory.numberActiveTouches === 1) {
            for (var i = 0; i < touchBank.length; i++) {
              var touchTrackToCheck = touchBank[i];

              if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
                touchHistory.indexOfSingleActiveTouch = i;
                break;
              }
            }

            {
              var activeRecord =
                touchBank[touchHistory.indexOfSingleActiveTouch];

              if (activeRecord == null || !activeRecord.touchActive) {
                error("Cannot find single active touch.");
              }
            }
          }
        }
      },
      touchHistory: touchHistory
    };

    /**
     * Accumulates items that must not be null or undefined.
     *
     * This is used to conserve memory by avoiding array allocations.
     *
     * @return {*|array<*>} An accumulation of items.
     */

    function accumulate(current, next) {
      if (next == null) {
        throw new Error("Accumulated items must not be null or undefined.");
      }

      if (current == null) {
        return next;
      } // Both are not empty. Warning: Never call x.concat(y) when you are not
      // certain that x is an Array (x could be a string with concat method).

      if (isArray(current)) {
        /* $FlowFixMe[incompatible-return] if `current` is `T` and `T` an array,
         * `isArray` might refine to the array element type of `T` */
        return current.concat(next);
      }

      if (isArray(next)) {
        /* $FlowFixMe[incompatible-return] unsound if `next` is `T` and `T` an array,
         * `isArray` might refine to the array element type of `T` */
        return [current].concat(next);
      }

      return [current, next];
    }

    /**
     * Accumulates items that must not be null or undefined into the first one. This
     * is used to conserve memory by avoiding array allocations, and thus sacrifices
     * API cleanness. Since `current` can be null before being passed in and not
     * null after this function, make sure to assign it back to `current`:
     *
     * `a = accumulateInto(a, b);`
     *
     * This API should be sparingly used. Try `accumulate` for something cleaner.
     *
     * @return {*|array<*>} An accumulation of items.
     */

    function accumulateInto(current, next) {
      if (next == null) {
        throw new Error("Accumulated items must not be null or undefined.");
      }

      if (current == null) {
        return next;
      } // Both are not empty. Warning: Never call x.concat(y) when you are not
      // certain that x is an Array (x could be a string with concat method).

      if (isArray(current)) {
        if (isArray(next)) {
          // $FlowFixMe[prop-missing] `isArray` does not ensure array is mutable
          // $FlowFixMe[method-unbinding]
          current.push.apply(current, next);
          return current;
        } // $FlowFixMe[prop-missing] `isArray` does not ensure array is mutable

        current.push(next);
        return current;
      }

      if (isArray(next)) {
        // A bit too dangerous to mutate `next`.

        /* $FlowFixMe[incompatible-return] unsound if `next` is `T` and `T` an array,
         * `isArray` might refine to the array element type of `T` */
        return [current].concat(next);
      }

      return [current, next];
    }

    /**
     * @param {array} arr an "accumulation" of items which is either an Array or
     * a single item. Useful when paired with the `accumulate` module. This is a
     * simple utility that allows us to reason about a collection of items, but
     * handling the case when there is exactly one item (and we do not need to
     * allocate an array).
     * @param {function} cb Callback invoked with each element or a collection.
     * @param {?} [scope] Scope used as `this` in a callback.
     */
    function forEachAccumulated(arr, cb, scope) {
      if (Array.isArray(arr)) {
        // $FlowFixMe[incompatible-call] if `T` is an array, `cb` cannot be called
        arr.forEach(cb, scope);
      } else if (arr) {
        cb.call(scope, arr);
      }
    }

    var FunctionComponent = 0;
    var ClassComponent = 1;
    var IndeterminateComponent = 2; // Before we know whether it is function or class

    var HostRoot = 3; // Root of a host tree. Could be nested inside another node.

    var HostPortal = 4; // A subtree. Could be an entry point to a different renderer.

    var HostComponent = 5;
    var HostText = 6;
    var Fragment = 7;
    var Mode = 8;
    var ContextConsumer = 9;
    var ContextProvider = 10;
    var ForwardRef = 11;
    var Profiler = 12;
    var SuspenseComponent = 13;
    var MemoComponent = 14;
    var SimpleMemoComponent = 15;
    var LazyComponent = 16;
    var IncompleteClassComponent = 17;
    var DehydratedFragment = 18;
    var SuspenseListComponent = 19;
    var ScopeComponent = 21;
    var OffscreenComponent = 22;
    var LegacyHiddenComponent = 23;
    var CacheComponent = 24;
    var TracingMarkerComponent = 25;
    var HostHoistable = 26;
    var HostSingleton = 27;

    /**
     * Instance of element that should respond to touch/move types of interactions,
     * as indicated explicitly by relevant callbacks.
     */

    var responderInst = null;
    /**
     * Count of current touches. A textInput should become responder iff the
     * selection changes while there is a touch on the screen.
     */

    var trackedTouchCount = 0;

    function changeResponder(nextResponderInst, blockHostResponder) {
      var oldResponderInst = responderInst;
      responderInst = nextResponderInst;

      if (ResponderEventPlugin.GlobalResponderHandler !== null) {
        ResponderEventPlugin.GlobalResponderHandler.onChange(
          oldResponderInst,
          nextResponderInst,
          blockHostResponder
        );
      }
    }

    var eventTypes = {
      /**
       * On a `touchStart`/`mouseDown`, is it desired that this element become the
       * responder?
       */
      startShouldSetResponder: {
        phasedRegistrationNames: {
          bubbled: "onStartShouldSetResponder",
          captured: "onStartShouldSetResponderCapture"
        },
        dependencies: startDependencies
      },

      /**
       * On a `scroll`, is it desired that this element become the responder? This
       * is usually not needed, but should be used to retroactively infer that a
       * `touchStart` had occurred during momentum scroll. During a momentum scroll,
       * a touch start will be immediately followed by a scroll event if the view is
       * currently scrolling.
       *
       * TODO: This shouldn't bubble.
       */
      scrollShouldSetResponder: {
        phasedRegistrationNames: {
          bubbled: "onScrollShouldSetResponder",
          captured: "onScrollShouldSetResponderCapture"
        },
        dependencies: [TOP_SCROLL]
      },

      /**
       * On text selection change, should this element become the responder? This
       * is needed for text inputs or other views with native selection, so the
       * JS view can claim the responder.
       *
       * TODO: This shouldn't bubble.
       */
      selectionChangeShouldSetResponder: {
        phasedRegistrationNames: {
          bubbled: "onSelectionChangeShouldSetResponder",
          captured: "onSelectionChangeShouldSetResponderCapture"
        },
        dependencies: [TOP_SELECTION_CHANGE]
      },

      /**
       * On a `touchMove`/`mouseMove`, is it desired that this element become the
       * responder?
       */
      moveShouldSetResponder: {
        phasedRegistrationNames: {
          bubbled: "onMoveShouldSetResponder",
          captured: "onMoveShouldSetResponderCapture"
        },
        dependencies: moveDependencies
      },

      /**
       * Direct responder events dispatched directly to responder. Do not bubble.
       */
      responderStart: {
        registrationName: "onResponderStart",
        dependencies: startDependencies
      },
      responderMove: {
        registrationName: "onResponderMove",
        dependencies: moveDependencies
      },
      responderEnd: {
        registrationName: "onResponderEnd",
        dependencies: endDependencies
      },
      responderRelease: {
        registrationName: "onResponderRelease",
        dependencies: endDependencies
      },
      responderTerminationRequest: {
        registrationName: "onResponderTerminationRequest",
        dependencies: []
      },
      responderGrant: {
        registrationName: "onResponderGrant",
        dependencies: []
      },
      responderReject: {
        registrationName: "onResponderReject",
        dependencies: []
      },
      responderTerminate: {
        registrationName: "onResponderTerminate",
        dependencies: []
      }
    }; // Start of inline: the below functions were inlined from
    // EventPropagator.js, as they deviated from ReactDOM's newer
    // implementations.

    function getParent$1(inst) {
      do {
        inst = inst.return; // TODO: If this is a HostRoot we might want to bail out.
        // That is depending on if we want nested subtrees (layers) to bubble
        // events to their parent. We could also go through parentNode on the
        // host node but that wouldn't work for React Native and doesn't let us
        // do the portal feature.
      } while (inst && inst.tag !== HostComponent);

      if (inst) {
        return inst;
      }

      return null;
    }
    /**
     * Return the lowest common ancestor of A and B, or null if they are in
     * different trees.
     */

    function getLowestCommonAncestor(instA, instB) {
      var depthA = 0;

      for (var tempA = instA; tempA; tempA = getParent$1(tempA)) {
        depthA++;
      }

      var depthB = 0;

      for (var tempB = instB; tempB; tempB = getParent$1(tempB)) {
        depthB++;
      } // If A is deeper, crawl up.

      while (depthA - depthB > 0) {
        instA = getParent$1(instA);
        depthA--;
      } // If B is deeper, crawl up.

      while (depthB - depthA > 0) {
        instB = getParent$1(instB);
        depthB--;
      } // Walk in lockstep until we find a match.

      var depth = depthA;

      while (depth--) {
        if (instA === instB || instA === instB.alternate) {
          return instA;
        }

        instA = getParent$1(instA);
        instB = getParent$1(instB);
      }

      return null;
    }
    /**
     * Return if A is an ancestor of B.
     */

    function isAncestor(instA, instB) {
      while (instB) {
        if (instA === instB || instA === instB.alternate) {
          return true;
        }

        instB = getParent$1(instB);
      }

      return false;
    }
    /**
     * Simulates the traversal of a two-phase, capture/bubble event dispatch.
     */

    function traverseTwoPhase$1(inst, fn, arg) {
      var path = [];

      while (inst) {
        path.push(inst);
        inst = getParent$1(inst);
      }

      var i;

      for (i = path.length; i-- > 0; ) {
        fn(path[i], "captured", arg);
      }

      for (i = 0; i < path.length; i++) {
        fn(path[i], "bubbled", arg);
      }
    }

    function getListener$1(inst, registrationName) {
      var stateNode = inst.stateNode;

      if (stateNode === null) {
        // Work in progress (ex: onload events in incremental mode).
        return null;
      }

      var props = getFiberCurrentPropsFromNode$1(stateNode);

      if (props === null) {
        // Work in progress.
        return null;
      }

      var listener = props[registrationName];

      if (listener && typeof listener !== "function") {
        throw new Error(
          "Expected `" +
            registrationName +
            "` listener to be a function, instead got a value of `" +
            typeof listener +
            "` type."
        );
      }

      return listener;
    }

    function listenerAtPhase$1(inst, event, propagationPhase) {
      var registrationName =
        event.dispatchConfig.phasedRegistrationNames[propagationPhase];
      return getListener$1(inst, registrationName);
    }

    function accumulateDirectionalDispatches$1(inst, phase, event) {
      {
        if (!inst) {
          error("Dispatching inst must not be null");
        }
      }

      var listener = listenerAtPhase$1(inst, event, phase);

      if (listener) {
        event._dispatchListeners = accumulateInto(
          event._dispatchListeners,
          listener
        );
        event._dispatchInstances = accumulateInto(
          event._dispatchInstances,
          inst
        );
      }
    }
    /**
     * Accumulates without regard to direction, does not look for phased
     * registration names. Same as `accumulateDirectDispatchesSingle` but without
     * requiring that the `dispatchMarker` be the same as the dispatched ID.
     */

    function accumulateDispatches$1(inst, ignoredDirection, event) {
      if (inst && event && event.dispatchConfig.registrationName) {
        var registrationName = event.dispatchConfig.registrationName;
        var listener = getListener$1(inst, registrationName);

        if (listener) {
          event._dispatchListeners = accumulateInto(
            event._dispatchListeners,
            listener
          );
          event._dispatchInstances = accumulateInto(
            event._dispatchInstances,
            inst
          );
        }
      }
    }
    /**
     * Accumulates dispatches on an `SyntheticEvent`, but only for the
     * `dispatchMarker`.
     * @param {SyntheticEvent} event
     */

    function accumulateDirectDispatchesSingle$1(event) {
      if (event && event.dispatchConfig.registrationName) {
        accumulateDispatches$1(event._targetInst, null, event);
      }
    }

    function accumulateDirectDispatches$1(events) {
      forEachAccumulated(events, accumulateDirectDispatchesSingle$1);
    }

    function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
      if (event && event.dispatchConfig.phasedRegistrationNames) {
        var targetInst = event._targetInst;
        var parentInst = targetInst ? getParent$1(targetInst) : null;
        traverseTwoPhase$1(
          parentInst,
          accumulateDirectionalDispatches$1,
          event
        );
      }
    }

    function accumulateTwoPhaseDispatchesSkipTarget(events) {
      forEachAccumulated(events, accumulateTwoPhaseDispatchesSingleSkipTarget);
    }

    function accumulateTwoPhaseDispatchesSingle$1(event) {
      if (event && event.dispatchConfig.phasedRegistrationNames) {
        traverseTwoPhase$1(
          event._targetInst,
          accumulateDirectionalDispatches$1,
          event
        );
      }
    }

    function accumulateTwoPhaseDispatches$1(events) {
      forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle$1);
    } // End of inline

    /**
     *
     * Responder System:
     * ----------------
     *
     * - A global, solitary "interaction lock" on a view.
     * - If a node becomes the responder, it should convey visual feedback
     *   immediately to indicate so, either by highlighting or moving accordingly.
     * - To be the responder means, that touches are exclusively important to that
     *   responder view, and no other view.
     * - While touches are still occurring, the responder lock can be transferred to
     *   a new view, but only to increasingly "higher" views (meaning ancestors of
     *   the current responder).
     *
     * Responder being granted:
     * ------------------------
     *
     * - Touch starts, moves, and scrolls can cause an ID to become the responder.
     * - We capture/bubble `startShouldSetResponder`/`moveShouldSetResponder` to
     *   the "appropriate place".
     * - If nothing is currently the responder, the "appropriate place" is the
     *   initiating event's `targetID`.
     * - If something *is* already the responder, the "appropriate place" is the
     *   first common ancestor of the event target and the current `responderInst`.
     * - Some negotiation happens: See the timing diagram below.
     * - Scrolled views automatically become responder. The reasoning is that a
     *   platform scroll view that isn't built on top of the responder system has
     *   began scrolling, and the active responder must now be notified that the
     *   interaction is no longer locked to it - the system has taken over.
     *
     * - Responder being released:
     *   As soon as no more touches that *started* inside of descendants of the
     *   *current* responderInst, an `onResponderRelease` event is dispatched to the
     *   current responder, and the responder lock is released.
     *
     * TODO:
     * - on "end", a callback hook for `onResponderEndShouldRemainResponder` that
     *   determines if the responder lock should remain.
     * - If a view shouldn't "remain" the responder, any active touches should by
     *   default be considered "dead" and do not influence future negotiations or
     *   bubble paths. It should be as if those touches do not exist.
     * -- For multitouch: Usually a translate-z will choose to "remain" responder
     *  after one out of many touches ended. For translate-y, usually the view
     *  doesn't wish to "remain" responder after one of many touches end.
     * - Consider building this on top of a `stopPropagation` model similar to
     *   `W3C` events.
     * - Ensure that `onResponderTerminate` is called on touch cancels, whether or
     *   not `onResponderTerminationRequest` returns `true` or `false`.
     *
     */

    /*                                             Negotiation Performed
                                             +-----------------------+
                                            /                         \
Process low level events to    +     Current Responder      +   wantsResponderID
determine who to perform negot-|   (if any exists at all)   |
iation/transition              | Otherwise just pass through|
-------------------------------+----------------------------+------------------+
Bubble to find first ID        |                            |
to return true:wantsResponderID|                            |
                               |                            |
     +-------------+           |                            |
     | onTouchStart|           |                            |
     +------+------+     none  |                            |
            |            return|                            |
+-----------v-------------+true| +------------------------+ |
|onStartShouldSetResponder|----->|onResponderStart (cur)  |<-----------+
+-----------+-------------+    | +------------------------+ |          |
            |                  |                            | +--------+-------+
            | returned true for|       false:REJECT +-------->|onResponderReject
            | wantsResponderID |                    |       | +----------------+
            | (now attempt     | +------------------+-----+ |
            |  handoff)        | |   onResponder          | |
            +------------------->|      TerminationRequest| |
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |         true:GRANT +-------->|onResponderGrant|
                               |                            | +--------+-------+
                               | +------------------------+ |          |
                               | |   onResponderTerminate |<-----------+
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |                    +-------->|onResponderStart|
                               |                            | +----------------+
Bubble to find first ID        |                            |
to return true:wantsResponderID|                            |
                               |                            |
     +-------------+           |                            |
     | onTouchMove |           |                            |
     +------+------+     none  |                            |
            |            return|                            |
+-----------v-------------+true| +------------------------+ |
|onMoveShouldSetResponder |----->|onResponderMove (cur)   |<-----------+
+-----------+-------------+    | +------------------------+ |          |
            |                  |                            | +--------+-------+
            | returned true for|       false:REJECT +-------->|onResponderRejec|
            | wantsResponderID |                    |       | +----------------+
            | (now attempt     | +------------------+-----+ |
            |  handoff)        | |   onResponder          | |
            +------------------->|      TerminationRequest| |
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |         true:GRANT +-------->|onResponderGrant|
                               |                            | +--------+-------+
                               | +------------------------+ |          |
                               | |   onResponderTerminate |<-----------+
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |                    +-------->|onResponderMove |
                               |                            | +----------------+
                               |                            |
                               |                            |
      Some active touch started|                            |
      inside current responder | +------------------------+ |
      +------------------------->|      onResponderEnd    | |
      |                        | +------------------------+ |
  +---+---------+              |                            |
  | onTouchEnd  |              |                            |
  +---+---------+              |                            |
      |                        | +------------------------+ |
      +------------------------->|     onResponderEnd     | |
      No active touches started| +-----------+------------+ |
      inside current responder |             |              |
                               |             v              |
                               | +------------------------+ |
                               | |    onResponderRelease  | |
                               | +------------------------+ |
                               |                            |
                               +                            + */

    /**
     * A note about event ordering in the `EventPluginRegistry`.
     *
     * Suppose plugins are injected in the following order:
     *
     * `[R, S, C]`
     *
     * To help illustrate the example, assume `S` is `SimpleEventPlugin` (for
     * `onClick` etc) and `R` is `ResponderEventPlugin`.
     *
     * "Deferred-Dispatched Events":
     *
     * - The current event plugin system will traverse the list of injected plugins,
     *   in order, and extract events by collecting the plugin's return value of
     *   `extractEvents()`.
     * - These events that are returned from `extractEvents` are "deferred
     *   dispatched events".
     * - When returned from `extractEvents`, deferred-dispatched events contain an
     *   "accumulation" of deferred dispatches.
     * - These deferred dispatches are accumulated/collected before they are
     *   returned, but processed at a later time by the `EventPluginRegistry` (hence the
     *   name deferred).
     *
     * In the process of returning their deferred-dispatched events, event plugins
     * themselves can dispatch events on-demand without returning them from
     * `extractEvents`. Plugins might want to do this, so that they can use event
     * dispatching as a tool that helps them decide which events should be extracted
     * in the first place.
     *
     * "On-Demand-Dispatched Events":
     *
     * - On-demand-dispatched events are not returned from `extractEvents`.
     * - On-demand-dispatched events are dispatched during the process of returning
     *   the deferred-dispatched events.
     * - They should not have side effects.
     * - They should be avoided, and/or eventually be replaced with another
     *   abstraction that allows event plugins to perform multiple "rounds" of event
     *   extraction.
     *
     * Therefore, the sequence of event dispatches becomes:
     *
     * - `R`s on-demand events (if any)   (dispatched by `R` on-demand)
     * - `S`s on-demand events (if any)   (dispatched by `S` on-demand)
     * - `C`s on-demand events (if any)   (dispatched by `C` on-demand)
     * - `R`s extracted events (if any)   (dispatched by `EventPluginRegistry`)
     * - `S`s extracted events (if any)   (dispatched by `EventPluginRegistry`)
     * - `C`s extracted events (if any)   (dispatched by `EventPluginRegistry`)
     *
     * In the case of `ResponderEventPlugin`: If the `startShouldSetResponder`
     * on-demand dispatch returns `true` (and some other details are satisfied) the
     * `onResponderGrant` deferred dispatched event is returned from
     * `extractEvents`. The sequence of dispatch executions in this case
     * will appear as follows:
     *
     * - `startShouldSetResponder` (`ResponderEventPlugin` dispatches on-demand)
     * - `touchStartCapture`       (`EventPluginRegistry` dispatches as usual)
     * - `touchStart`              (`EventPluginRegistry` dispatches as usual)
     * - `responderGrant/Reject`   (`EventPluginRegistry` dispatches as usual)
     */

    function setResponderAndExtractTransfer(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      var shouldSetEventType = isStartish(topLevelType)
        ? eventTypes.startShouldSetResponder
        : isMoveish(topLevelType)
        ? eventTypes.moveShouldSetResponder
        : topLevelType === TOP_SELECTION_CHANGE
        ? eventTypes.selectionChangeShouldSetResponder
        : eventTypes.scrollShouldSetResponder; // TODO: stop one short of the current responder.

      var bubbleShouldSetFrom = !responderInst
        ? targetInst
        : getLowestCommonAncestor(responderInst, targetInst); // When capturing/bubbling the "shouldSet" event, we want to skip the target
      // (deepest ID) if it happens to be the current responder. The reasoning:
      // It's strange to get an `onMoveShouldSetResponder` when you're *already*
      // the responder.

      var skipOverBubbleShouldSetFrom = bubbleShouldSetFrom === responderInst;
      var shouldSetEvent = ResponderSyntheticEvent.getPooled(
        shouldSetEventType,
        bubbleShouldSetFrom,
        nativeEvent,
        nativeEventTarget
      );
      shouldSetEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;

      if (skipOverBubbleShouldSetFrom) {
        accumulateTwoPhaseDispatchesSkipTarget(shouldSetEvent);
      } else {
        accumulateTwoPhaseDispatches$1(shouldSetEvent);
      }

      var wantsResponderInst =
        executeDispatchesInOrderStopAtTrue(shouldSetEvent);

      if (!shouldSetEvent.isPersistent()) {
        shouldSetEvent.constructor.release(shouldSetEvent);
      }

      if (!wantsResponderInst || wantsResponderInst === responderInst) {
        return null;
      }

      var extracted;
      var grantEvent = ResponderSyntheticEvent.getPooled(
        eventTypes.responderGrant,
        wantsResponderInst,
        nativeEvent,
        nativeEventTarget
      );
      grantEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
      accumulateDirectDispatches$1(grantEvent);
      var blockHostResponder = executeDirectDispatch(grantEvent) === true;

      if (responderInst) {
        var terminationRequestEvent = ResponderSyntheticEvent.getPooled(
          eventTypes.responderTerminationRequest,
          responderInst,
          nativeEvent,
          nativeEventTarget
        );
        terminationRequestEvent.touchHistory =
          ResponderTouchHistoryStore.touchHistory;
        accumulateDirectDispatches$1(terminationRequestEvent);
        var shouldSwitch =
          !hasDispatches(terminationRequestEvent) ||
          executeDirectDispatch(terminationRequestEvent);

        if (!terminationRequestEvent.isPersistent()) {
          terminationRequestEvent.constructor.release(terminationRequestEvent);
        }

        if (shouldSwitch) {
          var terminateEvent = ResponderSyntheticEvent.getPooled(
            eventTypes.responderTerminate,
            responderInst,
            nativeEvent,
            nativeEventTarget
          );
          terminateEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
          accumulateDirectDispatches$1(terminateEvent);
          extracted = accumulate(extracted, [grantEvent, terminateEvent]);
          changeResponder(wantsResponderInst, blockHostResponder);
        } else {
          var rejectEvent = ResponderSyntheticEvent.getPooled(
            eventTypes.responderReject,
            wantsResponderInst,
            nativeEvent,
            nativeEventTarget
          );
          rejectEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
          accumulateDirectDispatches$1(rejectEvent);
          extracted = accumulate(extracted, rejectEvent);
        }
      } else {
        extracted = accumulate(extracted, grantEvent);
        changeResponder(wantsResponderInst, blockHostResponder);
      }

      return extracted;
    }
    /**
     * A transfer is a negotiation between a currently set responder and the next
     * element to claim responder status. Any start event could trigger a transfer
     * of responderInst. Any move event could trigger a transfer.
     *
     * @param {string} topLevelType Record from `BrowserEventConstants`.
     * @return {boolean} True if a transfer of responder could possibly occur.
     */

    function canTriggerTransfer(topLevelType, topLevelInst, nativeEvent) {
      return (
        topLevelInst && // responderIgnoreScroll: We are trying to migrate away from specifically
        // tracking native scroll events here and responderIgnoreScroll indicates we
        // will send topTouchCancel to handle canceling touch events instead
        ((topLevelType === TOP_SCROLL && !nativeEvent.responderIgnoreScroll) ||
          (trackedTouchCount > 0 && topLevelType === TOP_SELECTION_CHANGE) ||
          isStartish(topLevelType) ||
          isMoveish(topLevelType))
      );
    }
    /**
     * Returns whether or not this touch end event makes it such that there are no
     * longer any touches that started inside of the current `responderInst`.
     *
     * @param {NativeEvent} nativeEvent Native touch end event.
     * @return {boolean} Whether or not this touch end event ends the responder.
     */

    function noResponderTouches(nativeEvent) {
      var touches = nativeEvent.touches;

      if (!touches || touches.length === 0) {
        return true;
      }

      for (var i = 0; i < touches.length; i++) {
        var activeTouch = touches[i];
        var target = activeTouch.target;

        if (target !== null && target !== undefined && target !== 0) {
          // Is the original touch location inside of the current responder?
          var targetInst = getInstanceFromNode(target);

          if (isAncestor(responderInst, targetInst)) {
            return false;
          }
        }
      }

      return true;
    }

    var ResponderEventPlugin = {
      /* For unit testing only */
      _getResponder: function () {
        return responderInst;
      },
      eventTypes: eventTypes,

      /**
       * We must be resilient to `targetInst` being `null` on `touchMove` or
       * `touchEnd`. On certain platforms, this means that a native scroll has
       * assumed control and the original touch targets are destroyed.
       */
      extractEvents: function (
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags
      ) {
        if (isStartish(topLevelType)) {
          trackedTouchCount += 1;
        } else if (isEndish(topLevelType)) {
          if (trackedTouchCount >= 0) {
            trackedTouchCount -= 1;
          } else {
            {
              warn(
                "Ended a touch event which was not counted in `trackedTouchCount`."
              );
            }

            return null;
          }
        }

        ResponderTouchHistoryStore.recordTouchTrack(topLevelType, nativeEvent);
        var extracted = canTriggerTransfer(
          topLevelType,
          targetInst,
          nativeEvent
        )
          ? setResponderAndExtractTransfer(
              topLevelType,
              targetInst,
              nativeEvent,
              nativeEventTarget
            )
          : null; // Responder may or may not have transferred on a new touch start/move.
        // Regardless, whoever is the responder after any potential transfer, we
        // direct all touch start/move/ends to them in the form of
        // `onResponderMove/Start/End`. These will be called for *every* additional
        // finger that move/start/end, dispatched directly to whoever is the
        // current responder at that moment, until the responder is "released".
        //
        // These multiple individual change touch events are are always bookended
        // by `onResponderGrant`, and one of
        // (`onResponderRelease/onResponderTerminate`).

        var isResponderTouchStart = responderInst && isStartish(topLevelType);
        var isResponderTouchMove = responderInst && isMoveish(topLevelType);
        var isResponderTouchEnd = responderInst && isEndish(topLevelType);
        var incrementalTouch = isResponderTouchStart
          ? eventTypes.responderStart
          : isResponderTouchMove
          ? eventTypes.responderMove
          : isResponderTouchEnd
          ? eventTypes.responderEnd
          : null;

        if (incrementalTouch) {
          var gesture = ResponderSyntheticEvent.getPooled(
            incrementalTouch,
            responderInst,
            nativeEvent,
            nativeEventTarget
          );
          gesture.touchHistory = ResponderTouchHistoryStore.touchHistory;
          accumulateDirectDispatches$1(gesture);
          extracted = accumulate(extracted, gesture);
        }

        var isResponderTerminate =
          responderInst && topLevelType === TOP_TOUCH_CANCEL;
        var isResponderRelease =
          responderInst &&
          !isResponderTerminate &&
          isEndish(topLevelType) &&
          noResponderTouches(nativeEvent);
        var finalTouch = isResponderTerminate
          ? eventTypes.responderTerminate
          : isResponderRelease
          ? eventTypes.responderRelease
          : null;

        if (finalTouch) {
          var finalEvent = ResponderSyntheticEvent.getPooled(
            finalTouch,
            responderInst,
            nativeEvent,
            nativeEventTarget
          );
          finalEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
          accumulateDirectDispatches$1(finalEvent);
          extracted = accumulate(extracted, finalEvent);
          changeResponder(null);
        }

        return extracted;
      },
      GlobalResponderHandler: null,
      injection: {
        /**
         * @param {{onChange: (ReactID, ReactID) => void} GlobalResponderHandler
         * Object that handles any change in responder. Use this to inject
         * integration with an existing touch handling system etc.
         */
        injectGlobalResponderHandler: function (GlobalResponderHandler) {
          ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
        }
      }
    };

    /**
     * Injectable ordering of event plugins.
     */
    var eventPluginOrder = null;
    /**
     * Injectable mapping from names to event plugin modules.
     */

    var namesToPlugins = {};
    /**
     * Recomputes the plugin list using the injected plugins and plugin ordering.
     *
     * @private
     */

    function recomputePluginOrdering() {
      if (!eventPluginOrder) {
        // Wait until an `eventPluginOrder` is injected.
        return;
      }

      for (var pluginName in namesToPlugins) {
        var pluginModule = namesToPlugins[pluginName]; // $FlowFixMe[incompatible-use] found when upgrading Flow

        var pluginIndex = eventPluginOrder.indexOf(pluginName);

        if (pluginIndex <= -1) {
          throw new Error(
            "EventPluginRegistry: Cannot inject event plugins that do not exist in " +
              ("the plugin ordering, `" + pluginName + "`.")
          );
        }

        if (plugins[pluginIndex]) {
          continue;
        }

        if (!pluginModule.extractEvents) {
          throw new Error(
            "EventPluginRegistry: Event plugins must implement an `extractEvents` " +
              ("method, but `" + pluginName + "` does not.")
          );
        }

        plugins[pluginIndex] = pluginModule;
        var publishedEvents = pluginModule.eventTypes;

        for (var eventName in publishedEvents) {
          if (
            !publishEventForPlugin(
              publishedEvents[eventName],
              pluginModule,
              eventName
            )
          ) {
            throw new Error(
              "EventPluginRegistry: Failed to publish event `" +
                eventName +
                "` for plugin `" +
                pluginName +
                "`."
            );
          }
        }
      }
    }
    /**
     * Publishes an event so that it can be dispatched by the supplied plugin.
     *
     * @param {object} dispatchConfig Dispatch configuration for the event.
     * @param {object} PluginModule Plugin publishing the event.
     * @return {boolean} True if the event was successfully published.
     * @private
     */

    function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
      if (eventNameDispatchConfigs.hasOwnProperty(eventName)) {
        throw new Error(
          "EventPluginRegistry: More than one plugin attempted to publish the same " +
            ("event name, `" + eventName + "`.")
        );
      }

      eventNameDispatchConfigs[eventName] = dispatchConfig;
      var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;

      if (phasedRegistrationNames) {
        for (var phaseName in phasedRegistrationNames) {
          if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
            var phasedRegistrationName = phasedRegistrationNames[phaseName];
            publishRegistrationName(phasedRegistrationName, pluginModule);
          }
        }

        return true;
      } else if (dispatchConfig.registrationName) {
        publishRegistrationName(dispatchConfig.registrationName, pluginModule);
        return true;
      }

      return false;
    }
    /**
     * Publishes a registration name that is used to identify dispatched events.
     *
     * @param {string} registrationName Registration name to add.
     * @param {object} PluginModule Plugin publishing the event.
     * @private
     */

    function publishRegistrationName(
      registrationName,
      pluginModule,
      eventName
    ) {
      if (registrationNameModules[registrationName]) {
        throw new Error(
          "EventPluginRegistry: More than one plugin attempted to publish the same " +
            ("registration name, `" + registrationName + "`.")
        );
      }

      registrationNameModules[registrationName] = pluginModule;

      {
        registrationName.toLowerCase();
      }
    }
    /**
     * Registers plugins so that they can extract and dispatch events.
     */

    /**
     * Ordered list of injected plugins.
     */

    var plugins = [];
    /**
     * Mapping from event name to dispatch config
     */

    var eventNameDispatchConfigs = {};
    /**
     * Mapping from registration name to plugin module
     */

    var registrationNameModules = {};

    /**
     * Injects an ordering of plugins (by plugin name). This allows the ordering
     * to be decoupled from injection of the actual plugins so that ordering is
     * always deterministic regardless of packaging, on-the-fly injection, etc.
     *
     * @param {array} InjectedEventPluginOrder
     * @internal
     */

    function injectEventPluginOrder(injectedEventPluginOrder) {
      if (eventPluginOrder) {
        throw new Error(
          "EventPluginRegistry: Cannot inject event plugin ordering more than " +
            "once. You are likely trying to load more than one copy of React."
        );
      } // Clone the ordering so it cannot be dynamically mutated.
      // $FlowFixMe[method-unbinding] found when upgrading Flow

      eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
      recomputePluginOrdering();
    }
    /**
     * Injects plugins to be used by plugin event system. The plugin names must be
     * in the ordering injected by `injectEventPluginOrder`.
     *
     * Plugins can be injected as part of page initialization or on-the-fly.
     *
     * @param {object} injectedNamesToPlugins Map from names to plugin modules.
     * @internal
     */

    function injectEventPluginsByName(injectedNamesToPlugins) {
      var isOrderingDirty = false;

      for (var pluginName in injectedNamesToPlugins) {
        if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
          continue;
        }

        var pluginModule = injectedNamesToPlugins[pluginName];

        if (
          !namesToPlugins.hasOwnProperty(pluginName) ||
          namesToPlugins[pluginName] !== pluginModule
        ) {
          if (namesToPlugins[pluginName]) {
            throw new Error(
              "EventPluginRegistry: Cannot inject two different event plugins " +
                ("using the same name, `" + pluginName + "`.")
            );
          }

          namesToPlugins[pluginName] = pluginModule;
          isOrderingDirty = true;
        }
      }

      if (isOrderingDirty) {
        recomputePluginOrdering();
      }
    }

    function getListener(inst, registrationName) {
      var stateNode = inst.stateNode;

      if (stateNode === null) {
        // Work in progress (ex: onload events in incremental mode).
        return null;
      }

      var props = getFiberCurrentPropsFromNode$1(stateNode);

      if (props === null) {
        // Work in progress.
        return null;
      }

      var listener = props[registrationName];

      if (listener && typeof listener !== "function") {
        throw new Error(
          "Expected `" +
            registrationName +
            "` listener to be a function, instead got a value of `" +
            typeof listener +
            "` type."
        );
      }

      return listener;
    }

    var customBubblingEventTypes =
        ReactNativePrivateInterface.ReactNativeViewConfigRegistry
          .customBubblingEventTypes,
      customDirectEventTypes =
        ReactNativePrivateInterface.ReactNativeViewConfigRegistry
          .customDirectEventTypes; // Start of inline: the below functions were inlined from
    // EventPropagator.js, as they deviated from ReactDOM's newer
    // implementations.
    // $FlowFixMe[missing-local-annot]

    function listenerAtPhase(inst, event, propagationPhase) {
      var registrationName =
        event.dispatchConfig.phasedRegistrationNames[propagationPhase];
      return getListener(inst, registrationName);
    } // $FlowFixMe[missing-local-annot]

    function accumulateDirectionalDispatches(inst, phase, event) {
      {
        if (!inst) {
          error("Dispatching inst must not be null");
        }
      }

      var listener = listenerAtPhase(inst, event, phase);

      if (listener) {
        event._dispatchListeners = accumulateInto(
          event._dispatchListeners,
          listener
        );
        event._dispatchInstances = accumulateInto(
          event._dispatchInstances,
          inst
        );
      }
    } // $FlowFixMe[missing-local-annot]

    function getParent(inst) {
      do {
        inst = inst.return; // TODO: If this is a HostRoot we might want to bail out.
        // That is depending on if we want nested subtrees (layers) to bubble
        // events to their parent. We could also go through parentNode on the
        // host node but that wouldn't work for React Native and doesn't let us
        // do the portal feature.
      } while (inst && inst.tag !== HostComponent);

      if (inst) {
        return inst;
      }

      return null;
    }
    /**
     * Simulates the traversal of a two-phase, capture/bubble event dispatch.
     */

    function traverseTwoPhase(inst, fn, arg, skipBubbling) {
      var path = [];

      while (inst) {
        path.push(inst);
        inst = getParent(inst);
      }

      var i;

      for (i = path.length; i-- > 0; ) {
        fn(path[i], "captured", arg);
      }

      if (skipBubbling) {
        // Dispatch on target only
        fn(path[0], "bubbled", arg);
      } else {
        for (i = 0; i < path.length; i++) {
          fn(path[i], "bubbled", arg);
        }
      }
    } // $FlowFixMe[missing-local-annot]

    function accumulateTwoPhaseDispatchesSingle(event) {
      if (event && event.dispatchConfig.phasedRegistrationNames) {
        traverseTwoPhase(
          event._targetInst,
          accumulateDirectionalDispatches,
          event,
          false
        );
      }
    } // $FlowFixMe[missing-local-annot]

    function accumulateTwoPhaseDispatches(events) {
      forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
    } // $FlowFixMe[missing-local-annot]

    function accumulateCapturePhaseDispatches(event) {
      if (event && event.dispatchConfig.phasedRegistrationNames) {
        traverseTwoPhase(
          event._targetInst,
          accumulateDirectionalDispatches,
          event,
          true
        );
      }
    }
    /**
     * Accumulates without regard to direction, does not look for phased
     * registration names. Same as `accumulateDirectDispatchesSingle` but without
     * requiring that the `dispatchMarker` be the same as the dispatched ID.
     */

    function accumulateDispatches(inst, ignoredDirection, event) {
      if (inst && event && event.dispatchConfig.registrationName) {
        var registrationName = event.dispatchConfig.registrationName;
        var listener = getListener(inst, registrationName);

        if (listener) {
          event._dispatchListeners = accumulateInto(
            event._dispatchListeners,
            listener
          );
          event._dispatchInstances = accumulateInto(
            event._dispatchInstances,
            inst
          );
        }
      }
    }
    /**
     * Accumulates dispatches on an `SyntheticEvent`, but only for the
     * `dispatchMarker`.
     * @param {SyntheticEvent} event
     */

    function accumulateDirectDispatchesSingle(event) {
      if (event && event.dispatchConfig.registrationName) {
        accumulateDispatches(event._targetInst, null, event);
      }
    }

    function accumulateDirectDispatches(events) {
      forEachAccumulated(events, accumulateDirectDispatchesSingle);
    } // End of inline

    var ReactNativeBridgeEventPlugin = {
      eventTypes: {},
      extractEvents: function (
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget
      ) {
        if (targetInst == null) {
          // Probably a node belonging to another renderer's tree.
          return null;
        }

        var bubbleDispatchConfig = customBubblingEventTypes[topLevelType];
        var directDispatchConfig = customDirectEventTypes[topLevelType];

        if (!bubbleDispatchConfig && !directDispatchConfig) {
          throw new Error( // $FlowFixMe[incompatible-type] - Flow doesn't like this string coercion because DOMTopLevelEventType is opaque
            'Unsupported top level event type "' + topLevelType + '" dispatched'
          );
        }

        var event = SyntheticEvent.getPooled(
          bubbleDispatchConfig || directDispatchConfig,
          targetInst,
          nativeEvent,
          nativeEventTarget
        );

        if (bubbleDispatchConfig) {
          var skipBubbling =
            event != null &&
            event.dispatchConfig.phasedRegistrationNames != null &&
            event.dispatchConfig.phasedRegistrationNames.skipBubbling;

          if (skipBubbling) {
            accumulateCapturePhaseDispatches(event);
          } else {
            accumulateTwoPhaseDispatches(event);
          }
        } else if (directDispatchConfig) {
          accumulateDirectDispatches(event);
        } else {
          return null;
        }

        return event;
      }
    };

    var ReactNativeEventPluginOrder = [
      "ResponderEventPlugin",
      "ReactNativeBridgeEventPlugin"
    ];

    /**
     * Make sure essential globals are available and are patched correctly. Please don't remove this
     * line. Bundles created by react-packager `require` it before executing any application code. This
     * ensures it exists in the dependency graph and can be `require`d.
     * TODO: require this in packager, not in React #10932517
     */
    /**
     * Inject module for resolving DOM hierarchy and plugin ordering.
     */

    injectEventPluginOrder(ReactNativeEventPluginOrder);
    /**
     * Some important event plugins included by default (without having to require
     * them).
     */

    injectEventPluginsByName({
      ResponderEventPlugin: ResponderEventPlugin,
      ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin
    });

    var instanceCache = new Map();
    var instanceProps = new Map();
    function precacheFiberNode(hostInst, tag) {
      instanceCache.set(tag, hostInst);
    }
    function uncacheFiberNode(tag) {
      instanceCache.delete(tag);
      instanceProps.delete(tag);
    }

    function getInstanceFromTag(tag) {
      return instanceCache.get(tag) || null;
    }

    function getTagFromInstance(inst) {
      var nativeInstance = inst.stateNode;
      var tag = nativeInstance._nativeTag;

      if (tag === undefined && nativeInstance.canonical != null) {
        // For compatibility with Fabric
        tag = nativeInstance.canonical.nativeTag;
        nativeInstance = nativeInstance.canonical.publicInstance;
      }

      if (!tag) {
        throw new Error("All native instances should have a tag.");
      }

      return nativeInstance;
    }
    function getFiberCurrentPropsFromNode(stateNode) {
      return instanceProps.get(stateNode._nativeTag) || null;
    }
    function updateFiberProps(tag, props) {
      instanceProps.set(tag, props);
    }

    // Used as a way to call batchedUpdates when we don't have a reference to
    // the renderer. Such as when we're dispatching events or if third party
    // libraries need to call batchedUpdates. Eventually, this API will go away when
    // everything is batched by default. We'll then have a similar API to opt-out of
    // scheduled work and instead do synchronous work.
    // Defaults
    var batchedUpdatesImpl = function (fn, bookkeeping) {
      return fn(bookkeeping);
    };

    var isInsideEventHandler = false;
    function batchedUpdates$1(fn, bookkeeping) {
      if (isInsideEventHandler) {
        // If we are currently inside another batch, we need to wait until it
        // fully completes before restoring state.
        return fn(bookkeeping);
      }

      isInsideEventHandler = true;

      try {
        return batchedUpdatesImpl(fn, bookkeeping);
      } finally {
        isInsideEventHandler = false;
      }
    }
    function setBatchingImplementation(
      _batchedUpdatesImpl,
      _discreteUpdatesImpl
    ) {
      batchedUpdatesImpl = _batchedUpdatesImpl;
    }

    /**
     * Internal queue of events that have accumulated their dispatches and are
     * waiting to have their dispatches executed.
     */

    var eventQueue = null;
    /**
     * Dispatches an event and releases it back into the pool, unless persistent.
     *
     * @param {?object} event Synthetic event to be dispatched.
     * @private
     */

    function executeDispatchesAndRelease(event) {
      if (event) {
        executeDispatchesInOrder(event);

        if (!event.isPersistent()) {
          event.constructor.release(event);
        }
      }
    } // $FlowFixMe[missing-local-annot]

    function executeDispatchesAndReleaseTopLevel(e) {
      return executeDispatchesAndRelease(e);
    }

    function runEventsInBatch(events) {
      if (events !== null) {
        eventQueue = accumulateInto(eventQueue, events);
      } // Set `eventQueue` to null before processing it so that we can tell if more
      // events get enqueued while processing.

      var processingEventQueue = eventQueue;
      eventQueue = null;

      if (!processingEventQueue) {
        return;
      }

      forEachAccumulated(
        processingEventQueue,
        executeDispatchesAndReleaseTopLevel
      );

      if (eventQueue) {
        throw new Error(
          "processEventQueue(): Additional events were enqueued while processing " +
            "an event queue. Support for this has not yet been implemented."
        );
      } // This would be a good time to rethrow if any of the event handlers threw.

      rethrowCaughtError();
    }

    /**
     * Version of `ReactBrowserEventEmitter` that works on the receiving side of a
     * serialized worker boundary.
     */
    // Shared default empty native event - conserve memory.

    var EMPTY_NATIVE_EVENT = {};
    /**
     * Selects a subsequence of `Touch`es, without destroying `touches`.
     *
     * @param {Array<Touch>} touches Deserialized touch objects.
     * @param {Array<number>} indices Indices by which to pull subsequence.
     * @return {Array<Touch>} Subsequence of touch objects.
     */
    // $FlowFixMe[missing-local-annot]

    function touchSubsequence(touches, indices) {
      var ret = [];

      for (var i = 0; i < indices.length; i++) {
        ret.push(touches[indices[i]]);
      }

      return ret;
    }
    /**
     * TODO: Pool all of this.
     *
     * Destroys `touches` by removing touch objects at indices `indices`. This is
     * to maintain compatibility with W3C touch "end" events, where the active
     * touches don't include the set that has just been "ended".
     *
     * @param {Array<Touch>} touches Deserialized touch objects.
     * @param {Array<number>} indices Indices to remove from `touches`.
     * @return {Array<Touch>} Subsequence of removed touch objects.
     */

    function removeTouchesAtIndices(touches, indices) {
      var rippedOut = []; // use an unsafe downcast to alias to nullable elements,
      // so we can delete and then compact.

      var temp = touches;

      for (var i = 0; i < indices.length; i++) {
        var index = indices[i];
        rippedOut.push(touches[index]);
        temp[index] = null;
      }

      var fillAt = 0;

      for (var j = 0; j < temp.length; j++) {
        var cur = temp[j];

        if (cur !== null) {
          temp[fillAt++] = cur;
        }
      }

      temp.length = fillAt;
      return rippedOut;
    }
    /**
     * Internal version of `receiveEvent` in terms of normalized (non-tag)
     * `rootNodeID`.
     *
     * @see receiveEvent.
     *
     * @param {rootNodeID} rootNodeID React root node ID that event occurred on.
     * @param {TopLevelType} topLevelType Top level type of event.
     * @param {?object} nativeEventParam Object passed from native.
     */

    function _receiveRootNodeIDEvent(
      rootNodeID,
      topLevelType,
      nativeEventParam
    ) {
      var nativeEvent = nativeEventParam || EMPTY_NATIVE_EVENT;
      var inst = getInstanceFromTag(rootNodeID);
      var target = null;

      if (inst != null) {
        target = inst.stateNode;
      }

      batchedUpdates$1(function () {
        runExtractedPluginEventsInBatch(
          topLevelType,
          inst,
          nativeEvent,
          target
        );
      }); // React Native doesn't use ReactControlledComponent but if it did, here's
      // where it would do it.
    }
    /**
     * Allows registered plugins an opportunity to extract events from top-level
     * native browser events.
     *
     * @return {*} An accumulation of synthetic events.
     * @internal
     */

    function extractPluginEvents(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      var events = null;
      var legacyPlugins = plugins;

      for (var i = 0; i < legacyPlugins.length; i++) {
        // Not every plugin in the ordering may be loaded at runtime.
        var possiblePlugin = legacyPlugins[i];

        if (possiblePlugin) {
          var extractedEvents = possiblePlugin.extractEvents(
            topLevelType,
            targetInst,
            nativeEvent,
            nativeEventTarget
          );

          if (extractedEvents) {
            events = accumulateInto(events, extractedEvents);
          }
        }
      }

      return events;
    }

    function runExtractedPluginEventsInBatch(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      var events = extractPluginEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget
      );
      runEventsInBatch(events);
    }
    /**
     * Publicly exposed method on module for native objc to invoke when a top
     * level event is extracted.
     * @param {rootNodeID} rootNodeID React root node ID that event occurred on.
     * @param {TopLevelType} topLevelType Top level type of event.
     * @param {object} nativeEventParam Object passed from native.
     */

    function receiveEvent(rootNodeID, topLevelType, nativeEventParam) {
      _receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam);
    }
    /**
     * Simple multi-wrapper around `receiveEvent` that is intended to receive an
     * efficient representation of `Touch` objects, and other information that
     * can be used to construct W3C compliant `Event` and `Touch` lists.
     *
     * This may create dispatch behavior that differs than web touch handling. We
     * loop through each of the changed touches and receive it as a single event.
     * So two `touchStart`/`touchMove`s that occur simultaneously are received as
     * two separate touch event dispatches - when they arguably should be one.
     *
     * This implementation reuses the `Touch` objects themselves as the `Event`s
     * since we dispatch an event for each touch (though that might not be spec
     * compliant). The main purpose of reusing them is to save allocations.
     *
     * TODO: Dispatch multiple changed touches in one event. The bubble path
     * could be the first common ancestor of all the `changedTouches`.
     *
     * One difference between this behavior and W3C spec: cancelled touches will
     * not appear in `.touches`, or in any future `.touches`, though they may
     * still be "actively touching the surface".
     *
     * Web desktop polyfills only need to construct a fake touch event with
     * identifier 0, also abandoning traditional click handlers.
     */

    function receiveTouches(eventTopLevelType, touches, changedIndices) {
      var changedTouches =
        eventTopLevelType === "topTouchEnd" ||
        eventTopLevelType === "topTouchCancel"
          ? removeTouchesAtIndices(touches, changedIndices)
          : touchSubsequence(touches, changedIndices);

      for (var jj = 0; jj < changedTouches.length; jj++) {
        var touch = changedTouches[jj]; // Touch objects can fulfill the role of `DOM` `Event` objects if we set
        // the `changedTouches`/`touches`. This saves allocations.

        touch.changedTouches = changedTouches;
        touch.touches = touches;
        var nativeEvent = touch;
        var rootNodeID = null;
        var target = nativeEvent.target;

        if (target !== null && target !== undefined) {
          if (target < 1) {
            {
              error("A view is reporting that a touch occurred on tag zero.");
            }
          } else {
            rootNodeID = target;
          }
        } // $FlowFixMe[incompatible-call] Shouldn't we *not* call it if rootNodeID is null?

        _receiveRootNodeIDEvent(rootNodeID, eventTopLevelType, nativeEvent);
      }
    }

    // Module provided by RN:
    var ReactNativeGlobalResponderHandler = {
      onChange: function (from, to, blockNativeResponder) {
        if (to !== null) {
          var tag = to.stateNode._nativeTag;
          ReactNativePrivateInterface.UIManager.setJSResponder(
            tag,
            blockNativeResponder
          );
        } else {
          ReactNativePrivateInterface.UIManager.clearJSResponder();
        }
      }
    };

    /**
     * Register the event emitter with the native bridge
     */

    ReactNativePrivateInterface.RCTEventEmitter.register({
      receiveEvent: receiveEvent,
      receiveTouches: receiveTouches
    });
    setComponentTree(
      getFiberCurrentPropsFromNode,
      getInstanceFromTag,
      getTagFromInstance
    );
    ResponderEventPlugin.injection.injectGlobalResponderHandler(
      ReactNativeGlobalResponderHandler
    );

    /**
     * `ReactInstanceMap` maintains a mapping from a public facing stateful
     * instance (key) and the internal representation (value). This allows public
     * methods to accept the user facing instance as an argument and map them back
     * to internal methods.
     *
     * Note that this module is currently shared and assumed to be stateless.
     * If this becomes an actual Map, that will break.
     */
    function get(key) {
      return key._reactInternals;
    }
    function set(key, value) {
      key._reactInternals = value;
    }

    // -----------------------------------------------------------------------------
    var enableSchedulingProfiler = false;
    var enableProfilerTimer = true;
    var enableProfilerCommitHooks = true;
    var enableProfilerNestedUpdatePhase = true;
    var syncLaneExpirationMs = 250;
    var transitionLaneExpirationMs = 5000;
    var enableLazyContextPropagation = false;
    var enableLegacyHidden = false;
    var enableAsyncActions = false;
    var enableBigIntSupport = false;

    // ATTENTION
    // When adding new symbols to this file,
    // Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
    // The Symbol used to tag the ReactElement-like types.
    var REACT_ELEMENT_TYPE = Symbol.for("react.element");
    var REACT_PORTAL_TYPE = Symbol.for("react.portal");
    var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
    var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
    var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
    var REACT_PROVIDER_TYPE = Symbol.for("react.provider"); // TODO: Delete with enableRenderableContext

    var REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
    var REACT_CONTEXT_TYPE = Symbol.for("react.context");
    var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
    var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
    var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
    var REACT_MEMO_TYPE = Symbol.for("react.memo");
    var REACT_LAZY_TYPE = Symbol.for("react.lazy");
    var REACT_SCOPE_TYPE = Symbol.for("react.scope");
    var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode");
    var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
    var REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
    var REACT_CACHE_TYPE = Symbol.for("react.cache");
    var REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker");
    var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
    var FAUX_ITERATOR_SYMBOL = "@@iterator";
    function getIteratorFn(maybeIterable) {
      if (maybeIterable === null || typeof maybeIterable !== "object") {
        return null;
      }

      var maybeIterator =
        (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
        maybeIterable[FAUX_ITERATOR_SYMBOL];

      if (typeof maybeIterator === "function") {
        return maybeIterator;
      }

      return null;
    }

    function getWrappedName$1(outerType, innerType, wrapperName) {
      var displayName = outerType.displayName;

      if (displayName) {
        return displayName;
      }

      var functionName = innerType.displayName || innerType.name || "";
      return functionName !== ""
        ? wrapperName + "(" + functionName + ")"
        : wrapperName;
    } // Keep in sync with react-reconciler/getComponentNameFromFiber

    function getContextName$1(type) {
      return type.displayName || "Context";
    }

    var REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"); // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.

    function getComponentNameFromType(type) {
      if (type == null) {
        // Host root, text node or just invalid type.
        return null;
      }

      if (typeof type === "function") {
        if (type.$$typeof === REACT_CLIENT_REFERENCE) {
          // TODO: Create a convention for naming client references with debug info.
          return null;
        }

        return type.displayName || type.name || null;
      }

      if (typeof type === "string") {
        return type;
      }

      switch (type) {
        case REACT_FRAGMENT_TYPE:
          return "Fragment";

        case REACT_PORTAL_TYPE:
          return "Portal";

        case REACT_PROFILER_TYPE:
          return "Profiler";

        case REACT_STRICT_MODE_TYPE:
          return "StrictMode";

        case REACT_SUSPENSE_TYPE:
          return "Suspense";

        case REACT_SUSPENSE_LIST_TYPE:
          return "SuspenseList";
      }

      if (typeof type === "object") {
        {
          if (typeof type.tag === "number") {
            error(
              "Received an unexpected object in getComponentNameFromType(). " +
                "This is likely a bug in React. Please file an issue."
            );
          }
        }

        switch (type.$$typeof) {
          case REACT_PROVIDER_TYPE: {
            var provider = type;
            return getContextName$1(provider._context) + ".Provider";
          }

          case REACT_CONTEXT_TYPE:
            var context = type;

            {
              return getContextName$1(context) + ".Consumer";
            }

          case REACT_CONSUMER_TYPE: {
            return null;
          }

          case REACT_FORWARD_REF_TYPE:
            return getWrappedName$1(type, type.render, "ForwardRef");

          case REACT_MEMO_TYPE:
            var outerName = type.displayName || null;

            if (outerName !== null) {
              return outerName;
            }

            return getComponentNameFromType(type.type) || "Memo";

          case REACT_LAZY_TYPE: {
            var lazyComponent = type;
            var payload = lazyComponent._payload;
            var init = lazyComponent._init;

            try {
              return getComponentNameFromType(init(payload));
            } catch (x) {
              return null;
            }
          }
        }
      }

      return null;
    }

    function getWrappedName(outerType, innerType, wrapperName) {
      var functionName = innerType.displayName || innerType.name || "";
      return (
        outerType.displayName ||
        (functionName !== ""
          ? wrapperName + "(" + functionName + ")"
          : wrapperName)
      );
    } // Keep in sync with shared/getComponentNameFromType

    function getContextName(type) {
      return type.displayName || "Context";
    }

    function getComponentNameFromFiber(fiber) {
      var tag = fiber.tag,
        type = fiber.type;

      switch (tag) {
        case CacheComponent:
          return "Cache";

        case ContextConsumer: {
          var context = type;
          return getContextName(context) + ".Consumer";
        }

        case ContextProvider: {
          var provider = type;
          return getContextName(provider._context) + ".Provider";
        }

        case DehydratedFragment:
          return "DehydratedFragment";

        case ForwardRef:
          return getWrappedName(type, type.render, "ForwardRef");

        case Fragment:
          return "Fragment";

        case HostHoistable:
        case HostSingleton:
        case HostComponent:
          // Host component type is the display name (e.g. "div", "View")
          return type;

        case HostPortal:
          return "Portal";

        case HostRoot:
          return "Root";

        case HostText:
          return "Text";

        case LazyComponent:
          // Name comes from the type in this case; we don't have a tag.
          return getComponentNameFromType(type);

        case Mode:
          if (type === REACT_STRICT_MODE_TYPE) {
            // Don't be less specific than shared/getComponentNameFromType
            return "StrictMode";
          }

          return "Mode";

        case OffscreenComponent:
          return "Offscreen";

        case Profiler:
          return "Profiler";

        case ScopeComponent:
          return "Scope";

        case SuspenseComponent:
          return "Suspense";

        case SuspenseListComponent:
          return "SuspenseList";

        case TracingMarkerComponent:
          return "TracingMarker";
        // The display name for this tags come from the user-provided type:

        case ClassComponent:
        case FunctionComponent:
        case IncompleteClassComponent:
        case IndeterminateComponent:
        case MemoComponent:
        case SimpleMemoComponent:
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }

          if (typeof type === "string") {
            return type;
          }

          break;
      }

      return null;
    }

    var NoFlags$1 =
      /*                      */
      0;
    var PerformedWork =
      /*                */
      1;
    var Placement =
      /*                    */
      2;
    var DidCapture =
      /*                   */
      128;
    var Hydrating =
      /*                    */
      4096; // You can change the rest (and add more).

    var Update =
      /*                       */
      4;
    /* Skipped value:                                 0b0000000000000000000000001000; */

    var ChildDeletion =
      /*                */
      16;
    var ContentReset =
      /*                 */
      32;
    var Callback =
      /*                     */
      64;
    /* Used by DidCapture:                            0b0000000000000000000010000000; */

    var ForceClientRender =
      /*            */
      256;
    var Ref =
      /*                          */
      512;
    var Snapshot =
      /*                     */
      1024;
    var Passive$1 =
      /*                      */
      2048;
    /* Used by Hydrating:                             0b0000000000000001000000000000; */

    var Visibility =
      /*                   */
      8192;
    var StoreConsistency =
      /*             */
      16384; // It's OK to reuse these bits because these flags are mutually exclusive for
    // different fiber types. We should really be doing this for as many flags as
    // possible, because we're about to run out of bits.

    var ScheduleRetry = StoreConsistency;
    var ShouldSuspendCommit = Visibility;
    var DidDefer = ContentReset;
    var LifecycleEffectMask =
      Passive$1 | Update | Callback | Ref | Snapshot | StoreConsistency; // Union of all commit flags (flags with the lifetime of a particular commit)

    var HostEffectMask =
      /*               */
      32767; // These are not really side effects, but we still reuse this field.

    var Incomplete =
      /*                   */
      32768;
    var ShouldCapture =
      /*                */
      65536;
    var ForceUpdateForLegacySuspense =
      /* */
      131072;
    var Forked =
      /*                       */
      1048576; // Static tags describe aspects of a fiber that are not specific to a render,
    // e.g. a fiber uses a passive effect (even if there are no updates on this particular render).
    // This enables us to defer more work in the unmount case,
    // since we can defer traversing the tree during layout to look for Passive effects,
    // and instead rely on the static flag as a signal that there may be cleanup work.

    var RefStatic =
      /*                    */
      2097152;
    var LayoutStatic =
      /*                 */
      4194304;
    var PassiveStatic =
      /*                */
      8388608;
    var MaySuspendCommit =
      /*             */
      16777216; // Flag used to identify newly inserted fibers. It isn't reset after commit unlike `Placement`.

    var PlacementDEV =
      /*                 */
      33554432;
    var MountLayoutDev =
      /*               */
      67108864;
    var MountPassiveDev =
      /*              */
      134217728; // Groups of flags that are used in the commit phase to skip over trees that
    // don't contain effects, by checking subtreeFlags.

    var BeforeMutationMask = // TODO: Remove Update flag from before mutation phase by re-landing Visibility
      // flag logic (see #20043)
      Update | Snapshot | 0;
    var MutationMask =
      Placement |
      Update |
      ChildDeletion |
      ContentReset |
      Ref |
      Hydrating |
      Visibility;
    var LayoutMask = Update | Callback | Ref | Visibility; // TODO: Split into PassiveMountMask and PassiveUnmountMask

    var PassiveMask = Passive$1 | Visibility | ChildDeletion; // Union of tags that don't get reset on clones.
    // This allows certain concepts to persist without recalculating them,
    // e.g. whether a subtree contains passive effects or portals.

    var StaticMask =
      LayoutStatic | PassiveStatic | RefStatic | MaySuspendCommit;

    var ReactCurrentOwner$3 = ReactSharedInternals.ReactCurrentOwner;
    function getNearestMountedFiber(fiber) {
      var node = fiber;
      var nearestMounted = fiber;

      if (!fiber.alternate) {
        // If there is no alternate, this might be a new tree that isn't inserted
        // yet. If it is, then it will have a pending insertion effect on it.
        var nextNode = node;

        do {
          node = nextNode;

          if ((node.flags & (Placement | Hydrating)) !== NoFlags$1) {
            // This is an insertion or in-progress hydration. The nearest possible
            // mounted fiber is the parent but we need to continue to figure out
            // if that one is still mounted.
            nearestMounted = node.return;
          } // $FlowFixMe[incompatible-type] we bail out when we get a null

          nextNode = node.return;
        } while (nextNode);
      } else {
        while (node.return) {
          node = node.return;
        }
      }

      if (node.tag === HostRoot) {
        // TODO: Check if this was a nested HostRoot when used with
        // renderContainerIntoSubtree.
        return nearestMounted;
      } // If we didn't hit the root, that means that we're in an disconnected tree
      // that has been unmounted.

      return null;
    }
    function isMounted(component) {
      {
        var owner = ReactCurrentOwner$3.current;

        if (owner !== null && owner.tag === ClassComponent) {
          var ownerFiber = owner;
          var instance = ownerFiber.stateNode;

          if (!instance._warnedAboutRefsInRender) {
            error(
              "%s is accessing isMounted inside its render() function. " +
                "render() should be a pure function of props and state. It should " +
                "never access something that requires stale data from the previous " +
                "render, such as refs. Move this logic to componentDidMount and " +
                "componentDidUpdate instead.",
              getComponentNameFromFiber(ownerFiber) || "A component"
            );
          }

          instance._warnedAboutRefsInRender = true;
        }
      }

      var fiber = get(component);

      if (!fiber) {
        return false;
      }

      return getNearestMountedFiber(fiber) === fiber;
    }

    function assertIsMounted(fiber) {
      if (getNearestMountedFiber(fiber) !== fiber) {
        throw new Error("Unable to find node on an unmounted component.");
      }
    }

    function findCurrentFiberUsingSlowPath(fiber) {
      var alternate = fiber.alternate;

      if (!alternate) {
        // If there is no alternate, then we only need to check if it is mounted.
        var nearestMounted = getNearestMountedFiber(fiber);

        if (nearestMounted === null) {
          throw new Error("Unable to find node on an unmounted component.");
        }

        if (nearestMounted !== fiber) {
          return null;
        }

        return fiber;
      } // If we have two possible branches, we'll walk backwards up to the root
      // to see what path the root points to. On the way we may hit one of the
      // special cases and we'll deal with them.

      var a = fiber;
      var b = alternate;

      while (true) {
        var parentA = a.return;

        if (parentA === null) {
          // We're at the root.
          break;
        }

        var parentB = parentA.alternate;

        if (parentB === null) {
          // There is no alternate. This is an unusual case. Currently, it only
          // happens when a Suspense component is hidden. An extra fragment fiber
          // is inserted in between the Suspense fiber and its children. Skip
          // over this extra fragment fiber and proceed to the next parent.
          var nextParent = parentA.return;

          if (nextParent !== null) {
            a = b = nextParent;
            continue;
          } // If there's no parent, we're at the root.

          break;
        } // If both copies of the parent fiber point to the same child, we can
        // assume that the child is current. This happens when we bailout on low
        // priority: the bailed out fiber's child reuses the current child.

        if (parentA.child === parentB.child) {
          var child = parentA.child;

          while (child) {
            if (child === a) {
              // We've determined that A is the current branch.
              assertIsMounted(parentA);
              return fiber;
            }

            if (child === b) {
              // We've determined that B is the current branch.
              assertIsMounted(parentA);
              return alternate;
            }

            child = child.sibling;
          } // We should never have an alternate for any mounting node. So the only
          // way this could possibly happen is if this was unmounted, if at all.

          throw new Error("Unable to find node on an unmounted component.");
        }

        if (a.return !== b.return) {
          // The return pointer of A and the return pointer of B point to different
          // fibers. We assume that return pointers never criss-cross, so A must
          // belong to the child set of A.return, and B must belong to the child
          // set of B.return.
          a = parentA;
          b = parentB;
        } else {
          // The return pointers point to the same fiber. We'll have to use the
          // default, slow path: scan the child sets of each parent alternate to see
          // which child belongs to which set.
          //
          // Search parent A's child set
          var didFindChild = false;
          var _child = parentA.child;

          while (_child) {
            if (_child === a) {
              didFindChild = true;
              a = parentA;
              b = parentB;
              break;
            }

            if (_child === b) {
              didFindChild = true;
              b = parentA;
              a = parentB;
              break;
            }

            _child = _child.sibling;
          }

          if (!didFindChild) {
            // Search parent B's child set
            _child = parentB.child;

            while (_child) {
              if (_child === a) {
                didFindChild = true;
                a = parentB;
                b = parentA;
                break;
              }

              if (_child === b) {
                didFindChild = true;
                b = parentB;
                a = parentA;
                break;
              }

              _child = _child.sibling;
            }

            if (!didFindChild) {
              throw new Error(
                "Child was not found in either parent set. This indicates a bug " +
                  "in React related to the return pointer. Please file an issue."
              );
            }
          }
        }

        if (a.alternate !== b) {
          throw new Error(
            "Return fibers should always be each others' alternates. " +
              "This error is likely caused by a bug in React. Please file an issue."
          );
        }
      } // If the root is not a host container, we're in a disconnected tree. I.e.
      // unmounted.

      if (a.tag !== HostRoot) {
        throw new Error("Unable to find node on an unmounted component.");
      }

      if (a.stateNode.current === a) {
        // We've determined that A is the current branch.
        return fiber;
      } // Otherwise B has to be current branch.

      return alternate;
    }
    function findCurrentHostFiber(parent) {
      var currentParent = findCurrentFiberUsingSlowPath(parent);
      return currentParent !== null
        ? findCurrentHostFiberImpl(currentParent)
        : null;
    }

    function findCurrentHostFiberImpl(node) {
      // Next we'll drill down this component to find the first HostComponent/Text.
      var tag = node.tag;

      if (
        tag === HostComponent ||
        tag === HostHoistable ||
        tag === HostSingleton ||
        tag === HostText
      ) {
        return node;
      }

      var child = node.child;

      while (child !== null) {
        var match = findCurrentHostFiberImpl(child);

        if (match !== null) {
          return match;
        }

        child = child.sibling;
      }

      return null;
    }
    function doesFiberContain(parentFiber, childFiber) {
      var node = childFiber;
      var parentFiberAlternate = parentFiber.alternate;

      while (node !== null) {
        if (node === parentFiber || node === parentFiberAlternate) {
          return true;
        }

        node = node.return;
      }

      return false;
    }

    // Modules provided by RN:
    var emptyObject$1 = {};
    /**
     * Create a payload that contains all the updates between two sets of props.
     *
     * These helpers are all encapsulated into a single module, because they use
     * mutation as a performance optimization which leads to subtle shared
     * dependencies between the code paths. To avoid this mutable state leaking
     * across modules, I've kept them isolated to this module.
     */
    // Tracks removed keys

    var removedKeys = null;
    var removedKeyCount = 0;
    var deepDifferOptions = {
      unsafelyIgnoreFunctions: true
    };

    function defaultDiffer(prevProp, nextProp) {
      if (typeof nextProp !== "object" || nextProp === null) {
        // Scalars have already been checked for equality
        return true;
      } else {
        // For objects and arrays, the default diffing algorithm is a deep compare
        return ReactNativePrivateInterface.deepDiffer(
          prevProp,
          nextProp,
          deepDifferOptions
        );
      }
    }

    function restoreDeletedValuesInNestedArray(
      updatePayload,
      node,
      validAttributes
    ) {
      if (isArray(node)) {
        var i = node.length;

        while (i-- && removedKeyCount > 0) {
          restoreDeletedValuesInNestedArray(
            updatePayload,
            node[i],
            validAttributes
          );
        }
      } else if (node && removedKeyCount > 0) {
        var obj = node;

        for (var propKey in removedKeys) {
          // $FlowFixMe[incompatible-use] found when upgrading Flow
          if (!removedKeys[propKey]) {
            continue;
          }

          var nextProp = obj[propKey];

          if (nextProp === undefined) {
            continue;
          }

          var attributeConfig = validAttributes[propKey];

          if (!attributeConfig) {
            continue; // not a valid native prop
          }

          if (typeof nextProp === "function") {
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            nextProp = true;
          }

          if (typeof nextProp === "undefined") {
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            nextProp = null;
          }

          if (typeof attributeConfig !== "object") {
            // case: !Object is the default case
            updatePayload[propKey] = nextProp;
          } else if (
            typeof attributeConfig.diff === "function" ||
            typeof attributeConfig.process === "function"
          ) {
            // case: CustomAttributeConfiguration
            var nextValue =
              typeof attributeConfig.process === "function"
                ? attributeConfig.process(nextProp)
                : nextProp;
            updatePayload[propKey] = nextValue;
          } // $FlowFixMe[incompatible-use] found when upgrading Flow

          removedKeys[propKey] = false;
          removedKeyCount--;
        }
      }
    }

    function diffNestedArrayProperty(
      updatePayload,
      prevArray,
      nextArray,
      validAttributes
    ) {
      var minLength =
        prevArray.length < nextArray.length
          ? prevArray.length
          : nextArray.length;
      var i;

      for (i = 0; i < minLength; i++) {
        // Diff any items in the array in the forward direction. Repeated keys
        // will be overwritten by later values.
        updatePayload = diffNestedProperty(
          updatePayload,
          prevArray[i],
          nextArray[i],
          validAttributes
        );
      }

      for (; i < prevArray.length; i++) {
        // Clear out all remaining properties.
        updatePayload = clearNestedProperty(
          updatePayload,
          prevArray[i],
          validAttributes
        );
      }

      for (; i < nextArray.length; i++) {
        // Add all remaining properties.
        updatePayload = addNestedProperty(
          updatePayload,
          nextArray[i],
          validAttributes
        );
      }

      return updatePayload;
    }

    function diffNestedProperty(
      updatePayload,
      prevProp,
      nextProp,
      validAttributes
    ) {
      if (!updatePayload && prevProp === nextProp) {
        // If no properties have been added, then we can bail out quickly on object
        // equality.
        return updatePayload;
      }

      if (!prevProp || !nextProp) {
        if (nextProp) {
          return addNestedProperty(updatePayload, nextProp, validAttributes);
        }

        if (prevProp) {
          return clearNestedProperty(updatePayload, prevProp, validAttributes);
        }

        return updatePayload;
      }

      if (!isArray(prevProp) && !isArray(nextProp)) {
        // Both are leaves, we can diff the leaves.
        return diffProperties(
          updatePayload,
          prevProp,
          nextProp,
          validAttributes
        );
      }

      if (isArray(prevProp) && isArray(nextProp)) {
        // Both are arrays, we can diff the arrays.
        return diffNestedArrayProperty(
          updatePayload,
          prevProp,
          nextProp,
          validAttributes
        );
      }

      if (isArray(prevProp)) {
        return diffProperties(
          updatePayload,
          ReactNativePrivateInterface.flattenStyle(prevProp),
          nextProp,
          validAttributes
        );
      }

      return diffProperties(
        updatePayload,
        prevProp,
        ReactNativePrivateInterface.flattenStyle(nextProp),
        validAttributes
      );
    }
    /**
     * addNestedProperty takes a single set of props and valid attribute
     * attribute configurations. It processes each prop and adds it to the
     * updatePayload.
     */

    function addNestedProperty(updatePayload, nextProp, validAttributes) {
      if (!nextProp) {
        return updatePayload;
      }

      if (!isArray(nextProp)) {
        // Add each property of the leaf.
        return addProperties(updatePayload, nextProp, validAttributes);
      }

      for (var i = 0; i < nextProp.length; i++) {
        // Add all the properties of the array.
        updatePayload = addNestedProperty(
          updatePayload,
          nextProp[i],
          validAttributes
        );
      }

      return updatePayload;
    }
    /**
     * clearNestedProperty takes a single set of props and valid attributes. It
     * adds a null sentinel to the updatePayload, for each prop key.
     */

    function clearNestedProperty(updatePayload, prevProp, validAttributes) {
      if (!prevProp) {
        return updatePayload;
      }

      if (!isArray(prevProp)) {
        // Add each property of the leaf.
        return clearProperties(updatePayload, prevProp, validAttributes);
      }

      for (var i = 0; i < prevProp.length; i++) {
        // Add all the properties of the array.
        updatePayload = clearNestedProperty(
          updatePayload,
          prevProp[i],
          validAttributes
        );
      }

      return updatePayload;
    }
    /**
     * diffProperties takes two sets of props and a set of valid attributes
     * and write to updatePayload the values that changed or were deleted.
     * If no updatePayload is provided, a new one is created and returned if
     * anything changed.
     */

    function diffProperties(
      updatePayload,
      prevProps,
      nextProps,
      validAttributes
    ) {
      var attributeConfig;
      var nextProp;
      var prevProp;

      for (var propKey in nextProps) {
        attributeConfig = validAttributes[propKey];

        if (!attributeConfig) {
          continue; // not a valid native prop
        }

        prevProp = prevProps[propKey];
        nextProp = nextProps[propKey]; // functions are converted to booleans as markers that the associated
        // events should be sent from native.

        if (typeof nextProp === "function") {
          nextProp = true; // If nextProp is not a function, then don't bother changing prevProp
          // since nextProp will win and go into the updatePayload regardless.

          if (typeof prevProp === "function") {
            prevProp = true;
          }
        } // An explicit value of undefined is treated as a null because it overrides
        // any other preceding value.

        if (typeof nextProp === "undefined") {
          nextProp = null;

          if (typeof prevProp === "undefined") {
            prevProp = null;
          }
        }

        if (removedKeys) {
          removedKeys[propKey] = false;
        }

        if (updatePayload && updatePayload[propKey] !== undefined) {
          // Something else already triggered an update to this key because another
          // value diffed. Since we're now later in the nested arrays our value is
          // more important so we need to calculate it and override the existing
          // value. It doesn't matter if nothing changed, we'll set it anyway.
          // Pattern match on: attributeConfig
          if (typeof attributeConfig !== "object") {
            // case: !Object is the default case
            updatePayload[propKey] = nextProp;
          } else if (
            typeof attributeConfig.diff === "function" ||
            typeof attributeConfig.process === "function"
          ) {
            // case: CustomAttributeConfiguration
            var nextValue =
              typeof attributeConfig.process === "function"
                ? attributeConfig.process(nextProp)
                : nextProp;
            updatePayload[propKey] = nextValue;
          }

          continue;
        }

        if (prevProp === nextProp) {
          continue; // nothing changed
        } // Pattern match on: attributeConfig

        if (typeof attributeConfig !== "object") {
          // case: !Object is the default case
          if (defaultDiffer(prevProp, nextProp)) {
            // a normal leaf has changed
            (updatePayload || (updatePayload = {}))[propKey] = nextProp;
          }
        } else if (
          typeof attributeConfig.diff === "function" ||
          typeof attributeConfig.process === "function"
        ) {
          // case: CustomAttributeConfiguration
          var shouldUpdate =
            prevProp === undefined ||
            (typeof attributeConfig.diff === "function"
              ? attributeConfig.diff(prevProp, nextProp)
              : defaultDiffer(prevProp, nextProp));

          if (shouldUpdate) {
            var _nextValue =
              typeof attributeConfig.process === "function" // $FlowFixMe[incompatible-use] found when upgrading Flow
                ? attributeConfig.process(nextProp)
                : nextProp;

            (updatePayload || (updatePayload = {}))[propKey] = _nextValue;
          }
        } else {
          // default: fallthrough case when nested properties are defined
          removedKeys = null;
          removedKeyCount = 0; // We think that attributeConfig is not CustomAttributeConfiguration at
          // this point so we assume it must be AttributeConfiguration.

          updatePayload = diffNestedProperty(
            updatePayload,
            prevProp,
            nextProp,
            attributeConfig
          );

          if (removedKeyCount > 0 && updatePayload) {
            restoreDeletedValuesInNestedArray(
              updatePayload,
              nextProp,
              attributeConfig
            );
            removedKeys = null;
          }
        }
      } // Also iterate through all the previous props to catch any that have been
      // removed and make sure native gets the signal so it can reset them to the
      // default.

      for (var _propKey in prevProps) {
        if (nextProps[_propKey] !== undefined) {
          continue; // we've already covered this key in the previous pass
        }

        attributeConfig = validAttributes[_propKey];

        if (!attributeConfig) {
          continue; // not a valid native prop
        }

        if (updatePayload && updatePayload[_propKey] !== undefined) {
          // This was already updated to a diff result earlier.
          continue;
        }

        prevProp = prevProps[_propKey];

        if (prevProp === undefined) {
          continue; // was already empty anyway
        } // Pattern match on: attributeConfig

        if (
          typeof attributeConfig !== "object" ||
          typeof attributeConfig.diff === "function" ||
          typeof attributeConfig.process === "function"
        ) {
          // case: CustomAttributeConfiguration | !Object
          // Flag the leaf property for removal by sending a sentinel.
          (updatePayload || (updatePayload = {}))[_propKey] = null;

          if (!removedKeys) {
            removedKeys = {};
          }

          if (!removedKeys[_propKey]) {
            removedKeys[_propKey] = true;
            removedKeyCount++;
          }
        } else {
          // default:
          // This is a nested attribute configuration where all the properties
          // were removed so we need to go through and clear out all of them.
          updatePayload = clearNestedProperty(
            updatePayload,
            prevProp,
            attributeConfig
          );
        }
      }

      return updatePayload;
    }
    /**
     * addProperties adds all the valid props to the payload after being processed.
     */

    function addProperties(updatePayload, props, validAttributes) {
      // TODO: Fast path
      return diffProperties(
        updatePayload,
        emptyObject$1,
        props,
        validAttributes
      );
    }
    /**
     * clearProperties clears all the previous props by adding a null sentinel
     * to the payload for each valid key.
     */

    function clearProperties(updatePayload, prevProps, validAttributes) {
      // TODO: Fast path
      return diffProperties(
        updatePayload,
        prevProps,
        emptyObject$1,
        validAttributes
      );
    }

    function create(props, validAttributes) {
      return addProperties(
        null, // updatePayload
        props,
        validAttributes
      );
    }
    function diff(prevProps, nextProps, validAttributes) {
      return diffProperties(
        null, // updatePayload
        prevProps,
        nextProps,
        validAttributes
      );
    }

    /**
     * In the future, we should cleanup callbacks by cancelling them instead of
     * using this.
     */
    function mountSafeCallback_NOT_REALLY_SAFE(context, callback) {
      return function () {
        if (!callback) {
          return undefined;
        } // This protects against createClass() components.
        // We don't know if there is code depending on it.
        // We intentionally don't use isMounted() because even accessing
        // isMounted property on a React ES6 class will trigger a warning.

        if (typeof context.__isMounted === "boolean") {
          if (!context.__isMounted) {
            return undefined;
          }
        } // FIXME: there used to be other branches that protected
        // against unmounted host components. But RN host components don't
        // define isMounted() anymore, so those checks didn't do anything.
        // They caused false positive warning noise so we removed them:
        // https://github.com/facebook/react-native/issues/18868#issuecomment-413579095
        // However, this means that the callback is NOT guaranteed to be safe
        // for host components. The solution we should implement is to make
        // UIManager.measure() and similar calls truly cancelable. Then we
        // can change our own code calling them to cancel when something unmounts.

        return callback.apply(context, arguments);
      };
    }
    function warnForStyleProps(props, validAttributes) {
      {
        for (var key in validAttributes.style) {
          if (!(validAttributes[key] || props[key] === undefined)) {
            error(
              "You are setting the style `{ %s" +
                ": ... }` as a prop. You " +
                "should nest it in a style object. " +
                "E.g. `{ style: { %s" +
                ": ... } }`",
              key,
              key
            );
          }
        }
      }
    }

    var ReactNativeFiberHostComponent = /*#__PURE__*/ (function () {
      function ReactNativeFiberHostComponent(
        tag,
        viewConfig,
        internalInstanceHandleDEV
      ) {
        this._children = void 0;
        this._nativeTag = void 0;
        this._internalFiberInstanceHandleDEV = void 0;
        this.viewConfig = void 0;
        this._nativeTag = tag;
        this._children = [];
        this.viewConfig = viewConfig;

        {
          this._internalFiberInstanceHandleDEV = internalInstanceHandleDEV;
        }
      }

      var _proto = ReactNativeFiberHostComponent.prototype;

      _proto.blur = function blur() {
        ReactNativePrivateInterface.TextInputState.blurTextInput(this);
      };

      _proto.focus = function focus() {
        ReactNativePrivateInterface.TextInputState.focusTextInput(this);
      };

      _proto.measure = function measure(callback) {
        ReactNativePrivateInterface.UIManager.measure(
          this._nativeTag,
          mountSafeCallback_NOT_REALLY_SAFE(this, callback)
        );
      };

      _proto.measureInWindow = function measureInWindow(callback) {
        ReactNativePrivateInterface.UIManager.measureInWindow(
          this._nativeTag,
          mountSafeCallback_NOT_REALLY_SAFE(this, callback)
        );
      };

      _proto.measureLayout = function measureLayout(
        relativeToNativeNode,
        onSuccess,
        onFail
        /* currently unused */
      ) {
        var relativeNode;

        if (typeof relativeToNativeNode === "number") {
          // Already a node handle
          relativeNode = relativeToNativeNode;
        } else {
          var nativeNode = relativeToNativeNode;

          if (nativeNode._nativeTag) {
            relativeNode = nativeNode._nativeTag;
          }
        }

        if (relativeNode == null) {
          {
            error(
              "Warning: ref.measureLayout must be called with a node handle or a ref to a native component."
            );
          }

          return;
        }

        ReactNativePrivateInterface.UIManager.measureLayout(
          this._nativeTag,
          relativeNode,
          mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
          mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
        );
      };

      _proto.setNativeProps = function setNativeProps(nativeProps) {
        {
          warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
        }

        var updatePayload = create(
          nativeProps,
          this.viewConfig.validAttributes
        ); // Avoid the overhead of bridge calls if there's no update.
        // This is an expensive no-op for Android, and causes an unnecessary
        // view invalidation for certain components (eg RCTTextInput) on iOS.

        if (updatePayload != null) {
          ReactNativePrivateInterface.UIManager.updateView(
            this._nativeTag,
            this.viewConfig.uiViewClassName,
            updatePayload
          );
        }
      };

      return ReactNativeFiberHostComponent;
    })();

    // This module only exists as an ESM wrapper around the external CommonJS
    var scheduleCallback$2 = Scheduler.unstable_scheduleCallback;
    var cancelCallback$1 = Scheduler.unstable_cancelCallback;
    var shouldYield = Scheduler.unstable_shouldYield;
    var requestPaint = Scheduler.unstable_requestPaint;
    var now$1 = Scheduler.unstable_now;
    var ImmediatePriority = Scheduler.unstable_ImmediatePriority;
    var UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
    var NormalPriority = Scheduler.unstable_NormalPriority;
    var IdlePriority = Scheduler.unstable_IdlePriority; // this doesn't actually exist on the scheduler, but it *does*

    // Helpers to patch console.logs to avoid logging during side-effect free
    // replaying on render function. This currently only patches the object
    // lazily which won't cover if the log function was extracted eagerly.
    // We could also eagerly patch the method.
    var disabledDepth = 0;
    var prevLog;
    var prevInfo;
    var prevWarn;
    var prevError;
    var prevGroup;
    var prevGroupCollapsed;
    var prevGroupEnd;

    function disabledLog() {}

    disabledLog.__reactDisabledLog = true;
    function disableLogs() {
      {
        if (disabledDepth === 0) {
          /* eslint-disable react-internal/no-production-logging */
          prevLog = console.log;
          prevInfo = console.info;
          prevWarn = console.warn;
          prevError = console.error;
          prevGroup = console.group;
          prevGroupCollapsed = console.groupCollapsed;
          prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

          var props = {
            configurable: true,
            enumerable: true,
            value: disabledLog,
            writable: true
          }; // $FlowFixMe[cannot-write] Flow thinks console is immutable.

          Object.defineProperties(console, {
            info: props,
            log: props,
            warn: props,
            error: props,
            group: props,
            groupCollapsed: props,
            groupEnd: props
          });
          /* eslint-enable react-internal/no-production-logging */
        }

        disabledDepth++;
      }
    }
    function reenableLogs() {
      {
        disabledDepth--;

        if (disabledDepth === 0) {
          /* eslint-disable react-internal/no-production-logging */
          var props = {
            configurable: true,
            enumerable: true,
            writable: true
          }; // $FlowFixMe[cannot-write] Flow thinks console is immutable.

          Object.defineProperties(console, {
            log: assign({}, props, {
              value: prevLog
            }),
            info: assign({}, props, {
              value: prevInfo
            }),
            warn: assign({}, props, {
              value: prevWarn
            }),
            error: assign({}, props, {
              value: prevError
            }),
            group: assign({}, props, {
              value: prevGroup
            }),
            groupCollapsed: assign({}, props, {
              value: prevGroupCollapsed
            }),
            groupEnd: assign({}, props, {
              value: prevGroupEnd
            })
          });
          /* eslint-enable react-internal/no-production-logging */
        }

        if (disabledDepth < 0) {
          error(
            "disabledDepth fell below zero. " +
              "This is a bug in React. Please file an issue."
          );
        }
      }
    }

    var rendererID = null;
    var injectedHook = null;
    var hasLoggedError = false;
    var isDevToolsPresent =
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined";
    function injectInternals(internals) {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined") {
        // No DevTools
        return false;
      }

      var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;

      if (hook.isDisabled) {
        // This isn't a real property on the hook, but it can be set to opt out
        // of DevTools integration and associated warnings and logs.
        // https://github.com/facebook/react/issues/3877
        return true;
      }

      if (!hook.supportsFiber) {
        {
          error(
            "The installed version of React DevTools is too old and will not work " +
              "with the current version of React. Please update React DevTools. " +
              "https://react.dev/link/react-devtools"
          );
        } // DevTools exists, even though it doesn't support Fiber.

        return true;
      }

      try {
        if (enableSchedulingProfiler);

        rendererID = hook.inject(internals); // We have successfully injected, so now it is safe to set up hooks.

        injectedHook = hook;
      } catch (err) {
        // Catch all errors because it is unsafe to throw during initialization.
        {
          error("React instrumentation encountered an error: %s.", err);
        }
      }

      if (hook.checkDCE) {
        // This is the real DevTools.
        return true;
      } else {
        // This is likely a hook installed by Fast Refresh runtime.
        return false;
      }
    }
    function onScheduleRoot(root, children) {
      {
        if (
          injectedHook &&
          typeof injectedHook.onScheduleFiberRoot === "function"
        ) {
          try {
            injectedHook.onScheduleFiberRoot(rendererID, root, children);
          } catch (err) {
            if (!hasLoggedError) {
              hasLoggedError = true;

              error("React instrumentation encountered an error: %s", err);
            }
          }
        }
      }
    }
    function onCommitRoot(root, eventPriority) {
      if (
        injectedHook &&
        typeof injectedHook.onCommitFiberRoot === "function"
      ) {
        try {
          var didError = (root.current.flags & DidCapture) === DidCapture;

          if (enableProfilerTimer) {
            var schedulerPriority;

            switch (eventPriority) {
              case DiscreteEventPriority:
                schedulerPriority = ImmediatePriority;
                break;

              case ContinuousEventPriority:
                schedulerPriority = UserBlockingPriority;
                break;

              case DefaultEventPriority:
                schedulerPriority = NormalPriority;
                break;

              case IdleEventPriority:
                schedulerPriority = IdlePriority;
                break;

              default:
                schedulerPriority = NormalPriority;
                break;
            }

            injectedHook.onCommitFiberRoot(
              rendererID,
              root,
              schedulerPriority,
              didError
            );
          }
        } catch (err) {
          {
            if (!hasLoggedError) {
              hasLoggedError = true;

              error("React instrumentation encountered an error: %s", err);
            }
          }
        }
      }
    }
    function onPostCommitRoot(root) {
      if (
        injectedHook &&
        typeof injectedHook.onPostCommitFiberRoot === "function"
      ) {
        try {
          injectedHook.onPostCommitFiberRoot(rendererID, root);
        } catch (err) {
          {
            if (!hasLoggedError) {
              hasLoggedError = true;

              error("React instrumentation encountered an error: %s", err);
            }
          }
        }
      }
    }
    function onCommitUnmount(fiber) {
      if (
        injectedHook &&
        typeof injectedHook.onCommitFiberUnmount === "function"
      ) {
        try {
          injectedHook.onCommitFiberUnmount(rendererID, fiber);
        } catch (err) {
          {
            if (!hasLoggedError) {
              hasLoggedError = true;

              error("React instrumentation encountered an error: %s", err);
            }
          }
        }
      }
    }
    function setIsStrictModeForDevtools(newIsStrictMode) {
      {
        if (newIsStrictMode) {
          disableLogs();
        } else {
          reenableLogs();
        }
      }
    } // Profiler API hooks

    function injectProfilingHooks(profilingHooks) {}

    function getLaneLabelMap() {
      {
        return null;
      }
    }

    var NoMode =
      /*                         */
      0; // TODO: Remove ConcurrentMode by reading from the root tag instead

    var ConcurrentMode =
      /*                 */
      1;
    var ProfileMode =
      /*                    */
      2;
    var StrictLegacyMode =
      /*               */
      8;
    var StrictEffectsMode =
      /*              */
      16;
    var NoStrictPassiveEffectsMode =
      /*     */
      64;

    // TODO: This is pretty well supported by browsers. Maybe we can drop it.
    var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback; // Count leading zeros.
    // Based on:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

    var log = Math.log;
    var LN2 = Math.LN2;

    function clz32Fallback(x) {
      var asUint = x >>> 0;

      if (asUint === 0) {
        return 32;
      }

      return (31 - ((log(asUint) / LN2) | 0)) | 0;
    }

    // If those values are changed that package should be rebuilt and redeployed.

    var TotalLanes = 31;
    var NoLanes =
      /*                        */
      0;
    var NoLane =
      /*                          */
      0;
    var SyncHydrationLane =
      /*               */
      1;
    var SyncLane =
      /*                        */
      2;
    var SyncLaneIndex = 1;
    var InputContinuousHydrationLane =
      /*    */
      4;
    var InputContinuousLane =
      /*             */
      8;
    var DefaultHydrationLane =
      /*            */
      16;
    var DefaultLane =
      /*                     */
      32;
    var SyncUpdateLanes = SyncLane | InputContinuousLane | DefaultLane;
    var TransitionHydrationLane =
      /*                */
      64;
    var TransitionLanes =
      /*                       */
      4194176;
    var TransitionLane1 =
      /*                        */
      128;
    var TransitionLane2 =
      /*                        */
      256;
    var TransitionLane3 =
      /*                        */
      512;
    var TransitionLane4 =
      /*                        */
      1024;
    var TransitionLane5 =
      /*                        */
      2048;
    var TransitionLane6 =
      /*                        */
      4096;
    var TransitionLane7 =
      /*                        */
      8192;
    var TransitionLane8 =
      /*                        */
      16384;
    var TransitionLane9 =
      /*                        */
      32768;
    var TransitionLane10 =
      /*                       */
      65536;
    var TransitionLane11 =
      /*                       */
      131072;
    var TransitionLane12 =
      /*                       */
      262144;
    var TransitionLane13 =
      /*                       */
      524288;
    var TransitionLane14 =
      /*                       */
      1048576;
    var TransitionLane15 =
      /*                       */
      2097152;
    var RetryLanes =
      /*                            */
      62914560;
    var RetryLane1 =
      /*                             */
      4194304;
    var RetryLane2 =
      /*                             */
      8388608;
    var RetryLane3 =
      /*                             */
      16777216;
    var RetryLane4 =
      /*                             */
      33554432;
    var SomeRetryLane = RetryLane1;
    var SelectiveHydrationLane =
      /*          */
      67108864;
    var NonIdleLanes =
      /*                          */
      134217727;
    var IdleHydrationLane =
      /*               */
      134217728;
    var IdleLane =
      /*                        */
      268435456;
    var OffscreenLane =
      /*                   */
      536870912;
    var DeferredLane =
      /*                    */
      1073741824; // Any lane that might schedule an update. This is used to detect infinite
    // update loops, so it doesn't include hydration lanes or retries.

    var UpdateLanes =
      SyncLane | InputContinuousLane | DefaultLane | TransitionLanes; // This function is used for the experimental timeline (react-devtools-timeline)
    var NoTimestamp = -1;
    var nextTransitionLane = TransitionLane1;
    var nextRetryLane = RetryLane1;

    function getHighestPriorityLanes(lanes) {
      {
        var pendingSyncLanes = lanes & SyncUpdateLanes;

        if (pendingSyncLanes !== 0) {
          return pendingSyncLanes;
        }
      }

      switch (getHighestPriorityLane(lanes)) {
        case SyncHydrationLane:
          return SyncHydrationLane;

        case SyncLane:
          return SyncLane;

        case InputContinuousHydrationLane:
          return InputContinuousHydrationLane;

        case InputContinuousLane:
          return InputContinuousLane;

        case DefaultHydrationLane:
          return DefaultHydrationLane;

        case DefaultLane:
          return DefaultLane;

        case TransitionHydrationLane:
          return TransitionHydrationLane;

        case TransitionLane1:
        case TransitionLane2:
        case TransitionLane3:
        case TransitionLane4:
        case TransitionLane5:
        case TransitionLane6:
        case TransitionLane7:
        case TransitionLane8:
        case TransitionLane9:
        case TransitionLane10:
        case TransitionLane11:
        case TransitionLane12:
        case TransitionLane13:
        case TransitionLane14:
        case TransitionLane15:
          return lanes & TransitionLanes;

        case RetryLane1:
        case RetryLane2:
        case RetryLane3:
        case RetryLane4:
          return lanes & RetryLanes;

        case SelectiveHydrationLane:
          return SelectiveHydrationLane;

        case IdleHydrationLane:
          return IdleHydrationLane;

        case IdleLane:
          return IdleLane;

        case OffscreenLane:
          return OffscreenLane;

        case DeferredLane:
          // This shouldn't be reachable because deferred work is always entangled
          // with something else.
          return NoLanes;

        default:
          {
            error("Should have found matching lanes. This is a bug in React.");
          } // This shouldn't be reachable, but as a fallback, return the entire bitmask.

          return lanes;
      }
    }

    function getNextLanes(root, wipLanes) {
      // Early bailout if there's no pending work left.
      var pendingLanes = root.pendingLanes;

      if (pendingLanes === NoLanes) {
        return NoLanes;
      }

      var nextLanes = NoLanes;
      var suspendedLanes = root.suspendedLanes;
      var pingedLanes = root.pingedLanes; // Do not work on any idle work until all the non-idle work has finished,
      // even if the work is suspended.

      var nonIdlePendingLanes = pendingLanes & NonIdleLanes;

      if (nonIdlePendingLanes !== NoLanes) {
        var nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;

        if (nonIdleUnblockedLanes !== NoLanes) {
          nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
        } else {
          var nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;

          if (nonIdlePingedLanes !== NoLanes) {
            nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
          }
        }
      } else {
        // The only remaining work is Idle.
        var unblockedLanes = pendingLanes & ~suspendedLanes;

        if (unblockedLanes !== NoLanes) {
          nextLanes = getHighestPriorityLanes(unblockedLanes);
        } else {
          if (pingedLanes !== NoLanes) {
            nextLanes = getHighestPriorityLanes(pingedLanes);
          }
        }
      }

      if (nextLanes === NoLanes) {
        // This should only be reachable if we're suspended
        // TODO: Consider warning in this path if a fallback timer is not scheduled.
        return NoLanes;
      } // If we're already in the middle of a render, switching lanes will interrupt
      // it and we'll lose our progress. We should only do this if the new lanes are
      // higher priority.

      if (
        wipLanes !== NoLanes &&
        wipLanes !== nextLanes && // If we already suspended with a delay, then interrupting is fine. Don't
        // bother waiting until the root is complete.
        (wipLanes & suspendedLanes) === NoLanes
      ) {
        var nextLane = getHighestPriorityLane(nextLanes);
        var wipLane = getHighestPriorityLane(wipLanes);

        if (
          // Tests whether the next lane is equal or lower priority than the wip
          // one. This works because the bits decrease in priority as you go left.
          nextLane >= wipLane || // Default priority updates should not interrupt transition updates. The
          // only difference between default updates and transition updates is that
          // default updates do not support refresh transitions.
          (nextLane === DefaultLane && (wipLane & TransitionLanes) !== NoLanes)
        ) {
          // Keep working on the existing in-progress tree. Do not interrupt.
          return wipLanes;
        }
      }

      return nextLanes;
    }
    function getEntangledLanes(root, renderLanes) {
      var entangledLanes = renderLanes;

      if ((entangledLanes & InputContinuousLane) !== NoLanes) {
        // When updates are sync by default, we entangle continuous priority updates
        // and default updates, so they render in the same batch. The only reason
        // they use separate lanes is because continuous updates should interrupt
        // transitions, but default updates should not.
        entangledLanes |= entangledLanes & DefaultLane;
      } // Check for entangled lanes and add them to the batch.
      //
      // A lane is said to be entangled with another when it's not allowed to render
      // in a batch that does not also include the other lane. Typically we do this
      // when multiple updates have the same source, and we only want to respond to
      // the most recent event from that source.
      //
      // Note that we apply entanglements *after* checking for partial work above.
      // This means that if a lane is entangled during an interleaved event while
      // it's already rendering, we won't interrupt it. This is intentional, since
      // entanglement is usually "best effort": we'll try our best to render the
      // lanes in the same batch, but it's not worth throwing out partially
      // completed work in order to do it.
      // TODO: Reconsider this. The counter-argument is that the partial work
      // represents an intermediate state, which we don't want to show to the user.
      // And by spending extra time finishing it, we're increasing the amount of
      // time it takes to show the final state, which is what they are actually
      // waiting for.
      //
      // For those exceptions where entanglement is semantically important,
      // we should ensure that there is no partial work at the
      // time we apply the entanglement.

      var allEntangledLanes = root.entangledLanes;

      if (allEntangledLanes !== NoLanes) {
        var entanglements = root.entanglements;
        var lanes = entangledLanes & allEntangledLanes;

        while (lanes > 0) {
          var index = pickArbitraryLaneIndex(lanes);
          var lane = 1 << index;
          entangledLanes |= entanglements[index];
          lanes &= ~lane;
        }
      }

      return entangledLanes;
    }

    function computeExpirationTime(lane, currentTime) {
      switch (lane) {
        case SyncHydrationLane:
        case SyncLane:
        case InputContinuousHydrationLane:
        case InputContinuousLane:
          // User interactions should expire slightly more quickly.
          //
          // NOTE: This is set to the corresponding constant as in Scheduler.js.
          // When we made it larger, a product metric in www regressed, suggesting
          // there's a user interaction that's being starved by a series of
          // synchronous updates. If that theory is correct, the proper solution is
          // to fix the starvation. However, this scenario supports the idea that
          // expiration times are an important safeguard when starvation
          // does happen.
          return currentTime + syncLaneExpirationMs;

        case DefaultHydrationLane:
        case DefaultLane:
        case TransitionHydrationLane:
        case TransitionLane1:
        case TransitionLane2:
        case TransitionLane3:
        case TransitionLane4:
        case TransitionLane5:
        case TransitionLane6:
        case TransitionLane7:
        case TransitionLane8:
        case TransitionLane9:
        case TransitionLane10:
        case TransitionLane11:
        case TransitionLane12:
        case TransitionLane13:
        case TransitionLane14:
        case TransitionLane15:
          return currentTime + transitionLaneExpirationMs;

        case RetryLane1:
        case RetryLane2:
        case RetryLane3:
        case RetryLane4:
          // TODO: Retries should be allowed to expire if they are CPU bound for
          // too long, but when I made this change it caused a spike in browser
          // crashes. There must be some other underlying bug; not super urgent but
          // ideally should figure out why and fix it. Unfortunately we don't have
          // a repro for the crashes, only detected via production metrics.
          return NoTimestamp;

        case SelectiveHydrationLane:
        case IdleHydrationLane:
        case IdleLane:
        case OffscreenLane:
        case DeferredLane:
          // Anything idle priority or lower should never expire.
          return NoTimestamp;

        default:
          {
            error("Should have found matching lanes. This is a bug in React.");
          }

          return NoTimestamp;
      }
    }

    function markStarvedLanesAsExpired(root, currentTime) {
      // TODO: This gets called every time we yield. We can optimize by storing
      // the earliest expiration time on the root. Then use that to quickly bail out
      // of this function.
      var pendingLanes = root.pendingLanes;
      var suspendedLanes = root.suspendedLanes;
      var pingedLanes = root.pingedLanes;
      var expirationTimes = root.expirationTimes; // Iterate through the pending lanes and check if we've reached their
      // expiration time. If so, we'll assume the update is being starved and mark
      // it as expired to force it to finish.
      // TODO: We should be able to replace this with upgradePendingLanesToSync
      //
      // We exclude retry lanes because those must always be time sliced, in order
      // to unwrap uncached promises.
      // TODO: Write a test for this

      var lanes = pendingLanes & ~RetryLanes;

      while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        var expirationTime = expirationTimes[index];

        if (expirationTime === NoTimestamp) {
          // Found a pending lane with no expiration time. If it's not suspended, or
          // if it's pinged, assume it's CPU-bound. Compute a new expiration time
          // using the current time.
          if (
            (lane & suspendedLanes) === NoLanes ||
            (lane & pingedLanes) !== NoLanes
          ) {
            // Assumes timestamps are monotonically increasing.
            expirationTimes[index] = computeExpirationTime(lane, currentTime);
          }
        } else if (expirationTime <= currentTime) {
          // This lane expired
          root.expiredLanes |= lane;
        }

        lanes &= ~lane;
      }
    } // This returns the highest priority pending lanes regardless of whether they
    function getLanesToRetrySynchronouslyOnError(
      root,
      originallyAttemptedLanes
    ) {
      if (root.errorRecoveryDisabledLanes & originallyAttemptedLanes) {
        // The error recovery mechanism is disabled until these lanes are cleared.
        return NoLanes;
      }

      var everythingButOffscreen = root.pendingLanes & ~OffscreenLane;

      if (everythingButOffscreen !== NoLanes) {
        return everythingButOffscreen;
      }

      if (everythingButOffscreen & OffscreenLane) {
        return OffscreenLane;
      }

      return NoLanes;
    }
    function includesSyncLane(lanes) {
      return (lanes & (SyncLane | SyncHydrationLane)) !== NoLanes;
    }
    function includesNonIdleWork(lanes) {
      return (lanes & NonIdleLanes) !== NoLanes;
    }
    function includesOnlyRetries(lanes) {
      return (lanes & RetryLanes) === lanes;
    }
    function includesOnlyNonUrgentLanes(lanes) {
      // TODO: Should hydration lanes be included here? This function is only
      // used in `updateDeferredValueImpl`.
      var UrgentLanes = SyncLane | InputContinuousLane | DefaultLane;
      return (lanes & UrgentLanes) === NoLanes;
    }
    function includesOnlyTransitions(lanes) {
      return (lanes & TransitionLanes) === lanes;
    }
    function includesBlockingLane(root, lanes) {
      var SyncDefaultLanes =
        InputContinuousHydrationLane |
        InputContinuousLane |
        DefaultHydrationLane |
        DefaultLane;
      return (lanes & SyncDefaultLanes) !== NoLanes;
    }
    function includesExpiredLane(root, lanes) {
      // This is a separate check from includesBlockingLane because a lane can
      // expire after a render has already started.
      return (lanes & root.expiredLanes) !== NoLanes;
    }
    function isTransitionLane(lane) {
      return (lane & TransitionLanes) !== NoLanes;
    }
    function claimNextTransitionLane() {
      // Cycle through the lanes, assigning each new transition to the next lane.
      // In most cases, this means every transition gets its own lane, until we
      // run out of lanes and cycle back to the beginning.
      var lane = nextTransitionLane;
      nextTransitionLane <<= 1;

      if ((nextTransitionLane & TransitionLanes) === NoLanes) {
        nextTransitionLane = TransitionLane1;
      }

      return lane;
    }
    function claimNextRetryLane() {
      var lane = nextRetryLane;
      nextRetryLane <<= 1;

      if ((nextRetryLane & RetryLanes) === NoLanes) {
        nextRetryLane = RetryLane1;
      }

      return lane;
    }
    function getHighestPriorityLane(lanes) {
      return lanes & -lanes;
    }
    function pickArbitraryLane(lanes) {
      // This wrapper function gets inlined. Only exists so to communicate that it
      // doesn't matter which bit is selected; you can pick any bit without
      // affecting the algorithms where its used. Here I'm using
      // getHighestPriorityLane because it requires the fewest operations.
      return getHighestPriorityLane(lanes);
    }

    function pickArbitraryLaneIndex(lanes) {
      return 31 - clz32(lanes);
    }

    function laneToIndex(lane) {
      return pickArbitraryLaneIndex(lane);
    }

    function includesSomeLane(a, b) {
      return (a & b) !== NoLanes;
    }
    function isSubsetOfLanes(set, subset) {
      return (set & subset) === subset;
    }
    function mergeLanes(a, b) {
      return a | b;
    }
    function removeLanes(set, subset) {
      return set & ~subset;
    }
    function intersectLanes(a, b) {
      return a & b;
    } // Seems redundant, but it changes the type from a single lane (used for
    // updates) to a group of lanes (used for flushing work).

    function laneToLanes(lane) {
      return lane;
    }
    function createLaneMap(initial) {
      // Intentionally pushing one by one.
      // https://v8.dev/blog/elements-kinds#avoid-creating-holes
      var laneMap = [];

      for (var i = 0; i < TotalLanes; i++) {
        laneMap.push(initial);
      }

      return laneMap;
    }
    function markRootUpdated$1(root, updateLane) {
      root.pendingLanes |= updateLane; // If there are any suspended transitions, it's possible this new update
      // could unblock them. Clear the suspended lanes so that we can try rendering
      // them again.
      //
      // TODO: We really only need to unsuspend only lanes that are in the
      // `subtreeLanes` of the updated fiber, or the update lanes of the return
      // path. This would exclude suspended updates in an unrelated sibling tree,
      // since there's no way for this update to unblock it.
      //
      // We don't do this if the incoming update is idle, because we never process
      // idle updates until after all the regular updates have finished; there's no
      // way it could unblock a transition.

      if (updateLane !== IdleLane) {
        root.suspendedLanes = NoLanes;
        root.pingedLanes = NoLanes;
      }
    }
    function markRootSuspended$1(root, suspendedLanes, spawnedLane) {
      root.suspendedLanes |= suspendedLanes;
      root.pingedLanes &= ~suspendedLanes; // The suspended lanes are no longer CPU-bound. Clear their expiration times.

      var expirationTimes = root.expirationTimes;
      var lanes = suspendedLanes;

      while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        expirationTimes[index] = NoTimestamp;
        lanes &= ~lane;
      }

      if (spawnedLane !== NoLane) {
        markSpawnedDeferredLane(root, spawnedLane, suspendedLanes);
      }
    }
    function markRootPinged$1(root, pingedLanes) {
      root.pingedLanes |= root.suspendedLanes & pingedLanes;
    }
    function markRootFinished(root, remainingLanes, spawnedLane) {
      var noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
      root.pendingLanes = remainingLanes; // Let's try everything again

      root.suspendedLanes = NoLanes;
      root.pingedLanes = NoLanes;
      root.expiredLanes &= remainingLanes;
      root.entangledLanes &= remainingLanes;
      root.errorRecoveryDisabledLanes &= remainingLanes;
      root.shellSuspendCounter = 0;
      var entanglements = root.entanglements;
      var expirationTimes = root.expirationTimes;
      var hiddenUpdates = root.hiddenUpdates; // Clear the lanes that no longer have pending work

      var lanes = noLongerPendingLanes;

      while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        entanglements[index] = NoLanes;
        expirationTimes[index] = NoTimestamp;
        var hiddenUpdatesForLane = hiddenUpdates[index];

        if (hiddenUpdatesForLane !== null) {
          hiddenUpdates[index] = null; // "Hidden" updates are updates that were made to a hidden component. They
          // have special logic associated with them because they may be entangled
          // with updates that occur outside that tree. But once the outer tree
          // commits, they behave like regular updates.

          for (var i = 0; i < hiddenUpdatesForLane.length; i++) {
            var update = hiddenUpdatesForLane[i];

            if (update !== null) {
              update.lane &= ~OffscreenLane;
            }
          }
        }

        lanes &= ~lane;
      }

      if (spawnedLane !== NoLane) {
        markSpawnedDeferredLane(
          root,
          spawnedLane, // This render finished successfully without suspending, so we don't need
          // to entangle the spawned task with the parent task.
          NoLanes
        );
      }
    }

    function markSpawnedDeferredLane(root, spawnedLane, entangledLanes) {
      // This render spawned a deferred task. Mark it as pending.
      root.pendingLanes |= spawnedLane;
      root.suspendedLanes &= ~spawnedLane; // Entangle the spawned lane with the DeferredLane bit so that we know it
      // was the result of another render. This lets us avoid a useDeferredValue
      // waterfall — only the first level will defer.

      var spawnedLaneIndex = laneToIndex(spawnedLane);
      root.entangledLanes |= spawnedLane;
      root.entanglements[spawnedLaneIndex] |=
        DeferredLane | // If the parent render task suspended, we must also entangle those lanes
        // with the spawned task, so that the deferred task includes all the same
        // updates that the parent task did. We can exclude any lane that is not
        // used for updates (e.g. Offscreen).
        (entangledLanes & UpdateLanes);
    }

    function markRootEntangled(root, entangledLanes) {
      // In addition to entangling each of the given lanes with each other, we also
      // have to consider _transitive_ entanglements. For each lane that is already
      // entangled with *any* of the given lanes, that lane is now transitively
      // entangled with *all* the given lanes.
      //
      // Translated: If C is entangled with A, then entangling A with B also
      // entangles C with B.
      //
      // If this is hard to grasp, it might help to intentionally break this
      // function and look at the tests that fail in ReactTransition-test.js. Try
      // commenting out one of the conditions below.
      var rootEntangledLanes = (root.entangledLanes |= entangledLanes);
      var entanglements = root.entanglements;
      var lanes = rootEntangledLanes;

      while (lanes) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;

        if (
          // Is this one of the newly entangled lanes?
          (lane & entangledLanes) | // Is this lane transitively entangled with the newly entangled lanes?
          (entanglements[index] & entangledLanes)
        ) {
          entanglements[index] |= entangledLanes;
        }

        lanes &= ~lane;
      }
    }
    function upgradePendingLaneToSync(root, lane) {
      // Since we're upgrading the priority of the given lane, there is now pending
      // sync work.
      root.pendingLanes |= SyncLane; // Entangle the sync lane with the lane we're upgrading. This means SyncLane
      // will not be allowed to finish without also finishing the given lane.

      root.entangledLanes |= SyncLane;
      root.entanglements[SyncLaneIndex] |= lane;
    }
    function markHiddenUpdate(root, update, lane) {
      var index = laneToIndex(lane);
      var hiddenUpdates = root.hiddenUpdates;
      var hiddenUpdatesForLane = hiddenUpdates[index];

      if (hiddenUpdatesForLane === null) {
        hiddenUpdates[index] = [update];
      } else {
        hiddenUpdatesForLane.push(update);
      }

      update.lane = lane | OffscreenLane;
    }
    function getBumpedLaneForHydration(root, renderLanes) {
      var renderLane = getHighestPriorityLane(renderLanes);
      var lane;

      if ((renderLane & SyncUpdateLanes) !== NoLane) {
        lane = SyncHydrationLane;
      } else {
        switch (renderLane) {
          case SyncLane:
            lane = SyncHydrationLane;
            break;

          case InputContinuousLane:
            lane = InputContinuousHydrationLane;
            break;

          case DefaultLane:
            lane = DefaultHydrationLane;
            break;

          case TransitionLane1:
          case TransitionLane2:
          case TransitionLane3:
          case TransitionLane4:
          case TransitionLane5:
          case TransitionLane6:
          case TransitionLane7:
          case TransitionLane8:
          case TransitionLane9:
          case TransitionLane10:
          case TransitionLane11:
          case TransitionLane12:
          case TransitionLane13:
          case TransitionLane14:
          case TransitionLane15:
          case RetryLane1:
          case RetryLane2:
          case RetryLane3:
          case RetryLane4:
            lane = TransitionHydrationLane;
            break;

          case IdleLane:
            lane = IdleHydrationLane;
            break;

          default:
            // Everything else is already either a hydration lane, or shouldn't
            // be retried at a hydration lane.
            lane = NoLane;
            break;
        }
      } // Check if the lane we chose is suspended. If so, that indicates that we
      // already attempted and failed to hydrate at that level. Also check if we're
      // already rendering that lane, which is rare but could happen.

      if ((lane & (root.suspendedLanes | renderLanes)) !== NoLane) {
        // Give up trying to hydrate and fall back to client render.
        return NoLane;
      }

      return lane;
    }
    function addFiberToLanesMap(root, fiber, lanes) {
      if (!isDevToolsPresent) {
        return;
      }

      var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;

      while (lanes > 0) {
        var index = laneToIndex(lanes);
        var lane = 1 << index;
        var updaters = pendingUpdatersLaneMap[index];
        updaters.add(fiber);
        lanes &= ~lane;
      }
    }
    function movePendingFibersToMemoized(root, lanes) {
      if (!isDevToolsPresent) {
        return;
      }

      var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
      var memoizedUpdaters = root.memoizedUpdaters;

      while (lanes > 0) {
        var index = laneToIndex(lanes);
        var lane = 1 << index;
        var updaters = pendingUpdatersLaneMap[index];

        if (updaters.size > 0) {
          updaters.forEach(function (fiber) {
            var alternate = fiber.alternate;

            if (alternate === null || !memoizedUpdaters.has(alternate)) {
              memoizedUpdaters.add(fiber);
            }
          });
          updaters.clear();
        }

        lanes &= ~lane;
      }
    }
    function getTransitionsForLanes(root, lanes) {
      {
        return null;
      }
    }

    var DiscreteEventPriority = SyncLane;
    var ContinuousEventPriority = InputContinuousLane;
    var DefaultEventPriority = DefaultLane;
    var IdleEventPriority = IdleLane;
    var currentUpdatePriority = NoLane;
    function getCurrentUpdatePriority() {
      return currentUpdatePriority;
    }
    function setCurrentUpdatePriority(newPriority) {
      currentUpdatePriority = newPriority;
    }
    function higherEventPriority(a, b) {
      return a !== 0 && a < b ? a : b;
    }
    function lowerEventPriority(a, b) {
      return a === 0 || a > b ? a : b;
    }
    function isHigherEventPriority(a, b) {
      return a !== 0 && a < b;
    }
    function lanesToEventPriority(lanes) {
      var lane = getHighestPriorityLane(lanes);

      if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
        return DiscreteEventPriority;
      }

      if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
        return ContinuousEventPriority;
      }

      if (includesNonIdleWork(lane)) {
        return DefaultEventPriority;
      }

      return IdleEventPriority;
    }

    // Renderers that don't support hydration
    // can re-export everything from this module.
    function shim$1() {
      throw new Error(
        "The current renderer does not support hydration. " +
          "This error is likely caused by a bug in React. " +
          "Please file an issue."
      );
    } // Hydration (when unsupported)
    var isSuspenseInstancePending = shim$1;
    var isSuspenseInstanceFallback = shim$1;
    var getSuspenseInstanceFallbackErrorDetails = shim$1;
    var registerSuspenseInstanceRetry = shim$1;
    var clearSuspenseBoundary = shim$1;
    var clearSuspenseBoundaryFromContainer = shim$1;
    var errorHydratingContainer = shim$1;

    // Renderers that don't support hydration
    // can re-export everything from this module.
    function shim() {
      throw new Error(
        "The current renderer does not support Resources. " +
          "This error is likely caused by a bug in React. " +
          "Please file an issue."
      );
    } // Resources (when unsupported)
    var suspendResource = shim;

    var getViewConfigForType =
      ReactNativePrivateInterface.ReactNativeViewConfigRegistry.get; // Unused
    // Unused
    // Counter for uniquely identifying views.
    // % 10 === 1 means it is a rootTag.
    // % 2 === 0 means it is a Fabric tag.

    var nextReactTag = 3;

    function allocateTag() {
      var tag = nextReactTag;

      if (tag % 10 === 1) {
        tag += 2;
      }

      nextReactTag = tag + 2;
      return tag;
    }

    function recursivelyUncacheFiberNode(node) {
      if (typeof node === "number") {
        // Leaf node (eg text)
        uncacheFiberNode(node);
      } else {
        uncacheFiberNode(node._nativeTag);

        node._children.forEach(recursivelyUncacheFiberNode);
      }
    }
    function appendInitialChild(parentInstance, child) {
      parentInstance._children.push(child);
    }
    function createInstance(
      type,
      props,
      rootContainerInstance,
      hostContext,
      internalInstanceHandle
    ) {
      var tag = allocateTag();
      var viewConfig = getViewConfigForType(type);

      {
        for (var key in viewConfig.validAttributes) {
          if (props.hasOwnProperty(key)) {
            ReactNativePrivateInterface.deepFreezeAndThrowOnMutationInDev(
              props[key]
            );
          }
        }
      }

      var updatePayload = create(props, viewConfig.validAttributes);
      ReactNativePrivateInterface.UIManager.createView(
        tag, // reactTag
        viewConfig.uiViewClassName, // viewName
        rootContainerInstance, // rootTag
        updatePayload // props
      );
      var component = new ReactNativeFiberHostComponent(
        tag,
        viewConfig,
        internalInstanceHandle
      );
      precacheFiberNode(internalInstanceHandle, tag);
      updateFiberProps(tag, props); // Not sure how to avoid this cast. Flow is okay if the component is defined
      // in the same file but if it's external it can't see the types.

      return component;
    }
    function createTextInstance(
      text,
      rootContainerInstance,
      hostContext,
      internalInstanceHandle
    ) {
      if (!hostContext.isInAParentText) {
        throw new Error(
          "Text strings must be rendered within a <Text> component."
        );
      }

      var tag = allocateTag();
      ReactNativePrivateInterface.UIManager.createView(
        tag, // reactTag
        "RCTRawText", // viewName
        rootContainerInstance, // rootTag
        {
          text: text
        } // props
      );
      precacheFiberNode(internalInstanceHandle, tag);
      return tag;
    }
    function finalizeInitialChildren(parentInstance, type, props, hostContext) {
      // Don't send a no-op message over the bridge.
      if (parentInstance._children.length === 0) {
        return false;
      } // Map from child objects to native tags.
      // Either way we need to pass a copy of the Array to prevent it from being frozen.

      var nativeTags = parentInstance._children.map(function (child) {
        return typeof child === "number"
          ? child // Leaf node (eg text)
          : child._nativeTag;
      });

      ReactNativePrivateInterface.UIManager.setChildren(
        parentInstance._nativeTag, // containerTag
        nativeTags // reactTags
      );
      return false;
    }
    function getRootHostContext(rootContainerInstance) {
      return {
        isInAParentText: false
      };
    }
    function getChildHostContext(parentHostContext, type) {
      var prevIsInAParentText = parentHostContext.isInAParentText;
      var isInAParentText =
        type === "AndroidTextInput" || // Android
        type === "RCTMultilineTextInputView" || // iOS
        type === "RCTSinglelineTextInputView" || // iOS
        type === "RCTText" ||
        type === "RCTVirtualText";

      if (prevIsInAParentText !== isInAParentText) {
        return {
          isInAParentText: isInAParentText
        };
      } else {
        return parentHostContext;
      }
    }
    function getPublicInstance(instance) {
      // $FlowExpectedError[prop-missing] For compatibility with Fabric
      if (
        instance.canonical != null &&
        instance.canonical.publicInstance != null
      ) {
        // $FlowFixMe[incompatible-return]
        return instance.canonical.publicInstance;
      }

      return instance;
    }
    var scheduleTimeout = setTimeout;
    var cancelTimeout = clearTimeout;
    var noTimeout = -1;
    function shouldSetTextContent(type, props) {
      // TODO (bvaughn) Revisit this decision.
      // Always returning false simplifies the createInstance() implementation,
      // But creates an additional child Fiber for raw text children.
      // No additional native views are created though.
      // It's not clear to me which is better so I'm deferring for now.
      // More context @ github.com/facebook/react/pull/8560#discussion_r92111303
      return false;
    }
    function getCurrentEventPriority() {
      return DefaultEventPriority;
    }
    function shouldAttemptEagerTransition() {
      return false;
    } // -------------------
    function appendChild(parentInstance, child) {
      var childTag = typeof child === "number" ? child : child._nativeTag;
      var children = parentInstance._children;
      var index = children.indexOf(child);

      if (index >= 0) {
        children.splice(index, 1);
        children.push(child);
        ReactNativePrivateInterface.UIManager.manageChildren(
          parentInstance._nativeTag, // containerTag
          [index], // moveFromIndices
          [children.length - 1], // moveToIndices
          [], // addChildReactTags
          [], // addAtIndices
          [] // removeAtIndices
        );
      } else {
        children.push(child);
        ReactNativePrivateInterface.UIManager.manageChildren(
          parentInstance._nativeTag, // containerTag
          [], // moveFromIndices
          [], // moveToIndices
          [childTag], // addChildReactTags
          [children.length - 1], // addAtIndices
          [] // removeAtIndices
        );
      }
    }
    function appendChildToContainer(parentInstance, child) {
      var childTag = typeof child === "number" ? child : child._nativeTag;
      ReactNativePrivateInterface.UIManager.setChildren(
        parentInstance, // containerTag
        [childTag] // reactTags
      );
    }
    function commitTextUpdate(textInstance, oldText, newText) {
      ReactNativePrivateInterface.UIManager.updateView(
        textInstance, // reactTag
        "RCTRawText", // viewName
        {
          text: newText
        } // props
      );
    }
    function commitMount(instance, type, newProps, internalInstanceHandle) {
      // Noop
    }
    function commitUpdate(
      instance,
      updatePayloadTODO,
      type,
      oldProps,
      newProps,
      internalInstanceHandle
    ) {
      var viewConfig = instance.viewConfig;
      updateFiberProps(instance._nativeTag, newProps);
      var updatePayload = diff(oldProps, newProps, viewConfig.validAttributes); // Avoid the overhead of bridge calls if there's no update.
      // This is an expensive no-op for Android, and causes an unnecessary
      // view invalidation for certain components (eg RCTTextInput) on iOS.

      if (updatePayload != null) {
        ReactNativePrivateInterface.UIManager.updateView(
          instance._nativeTag, // reactTag
          viewConfig.uiViewClassName, // viewName
          updatePayload // props
        );
      }
    }
    function insertBefore(parentInstance, child, beforeChild) {
      var children = parentInstance._children;
      var index = children.indexOf(child); // Move existing child or add new child?

      if (index >= 0) {
        children.splice(index, 1);
        var beforeChildIndex = children.indexOf(beforeChild);
        children.splice(beforeChildIndex, 0, child);
        ReactNativePrivateInterface.UIManager.manageChildren(
          parentInstance._nativeTag, // containerID
          [index], // moveFromIndices
          [beforeChildIndex], // moveToIndices
          [], // addChildReactTags
          [], // addAtIndices
          [] // removeAtIndices
        );
      } else {
        var _beforeChildIndex = children.indexOf(beforeChild);

        children.splice(_beforeChildIndex, 0, child);
        var childTag = typeof child === "number" ? child : child._nativeTag;
        ReactNativePrivateInterface.UIManager.manageChildren(
          parentInstance._nativeTag, // containerID
          [], // moveFromIndices
          [], // moveToIndices
          [childTag], // addChildReactTags
          [_beforeChildIndex], // addAtIndices
          [] // removeAtIndices
        );
      }
    }
    function insertInContainerBefore(parentInstance, child, beforeChild) {
      // TODO (bvaughn): Remove this check when...
      // We create a wrapper object for the container in ReactNative render()
      // Or we refactor to remove wrapper objects entirely.
      // For more info on pros/cons see PR #8560 description.
      if (typeof parentInstance === "number") {
        throw new Error("Container does not support insertBefore operation");
      }
    }
    function removeChild(parentInstance, child) {
      recursivelyUncacheFiberNode(child);
      var children = parentInstance._children;
      var index = children.indexOf(child);
      children.splice(index, 1);
      ReactNativePrivateInterface.UIManager.manageChildren(
        parentInstance._nativeTag, // containerID
        [], // moveFromIndices
        [], // moveToIndices
        [], // addChildReactTags
        [], // addAtIndices
        [index] // removeAtIndices
      );
    }
    function removeChildFromContainer(parentInstance, child) {
      recursivelyUncacheFiberNode(child);
      ReactNativePrivateInterface.UIManager.manageChildren(
        parentInstance, // containerID
        [], // moveFromIndices
        [], // moveToIndices
        [], // addChildReactTags
        [], // addAtIndices
        [0] // removeAtIndices
      );
    }
    function resetTextContent(instance) {
      // Noop
    }
    function hideInstance(instance) {
      var viewConfig = instance.viewConfig;
      var updatePayload = create(
        {
          style: {
            display: "none"
          }
        },
        viewConfig.validAttributes
      );
      ReactNativePrivateInterface.UIManager.updateView(
        instance._nativeTag,
        viewConfig.uiViewClassName,
        updatePayload
      );
    }
    function hideTextInstance(textInstance) {
      throw new Error("Not yet implemented.");
    }
    function unhideInstance(instance, props) {
      var viewConfig = instance.viewConfig;
      var updatePayload = diff(
        assign({}, props, {
          style: [
            props.style,
            {
              display: "none"
            }
          ]
        }),
        props,
        viewConfig.validAttributes
      );
      ReactNativePrivateInterface.UIManager.updateView(
        instance._nativeTag,
        viewConfig.uiViewClassName,
        updatePayload
      );
    }
    function unhideTextInstance(textInstance, text) {
      throw new Error("Not yet implemented.");
    }
    function preloadInstance(type, props) {
      // Return true to indicate it's already loaded
      return true;
    }
    function waitForCommitToBeReady() {
      return null;
    }

    var valueStack = [];
    var fiberStack;

    {
      fiberStack = [];
    }

    var index = -1;

    function createCursor(defaultValue) {
      return {
        current: defaultValue
      };
    }

    function pop(cursor, fiber) {
      if (index < 0) {
        {
          error("Unexpected pop.");
        }

        return;
      }

      {
        if (fiber !== fiberStack[index]) {
          error("Unexpected Fiber popped.");
        }
      }

      cursor.current = valueStack[index];
      valueStack[index] = null;

      {
        fiberStack[index] = null;
      }

      index--;
    }

    function push(cursor, value, fiber) {
      index++;
      valueStack[index] = cursor.current;

      {
        fiberStack[index] = fiber;
      }

      cursor.current = value;
    }

    var emptyContextObject = {};

    {
      Object.freeze(emptyContextObject);
    } // A cursor to the current merged context object on the stack.

    function hasContextChanged() {
      {
        return false;
      }
    }

    function isContextProvider(type) {
      {
        return false;
      }
    }

    function processChildContext(fiber, type, parentContext) {
      {
        return parentContext;
      }
    }

    function findCurrentUnmaskedContext(fiber) {
      {
        return emptyContextObject;
      }
    }

    var LegacyRoot = 0;
    var ConcurrentRoot = 1;

    // We use the existence of the state object as an indicator that the component
    // is hidden.
    var OffscreenVisible =
      /*                     */
      1;
    var OffscreenDetached =
      /*                    */
      2;
    var OffscreenPassiveEffectsConnected =
      /*     */
      4;
    function isOffscreenManual(offscreenFiber) {
      return (
        offscreenFiber.memoizedProps !== null &&
        offscreenFiber.memoizedProps.mode === "manual"
      );
    }

    /**
     * inlined Object.is polyfill to avoid requiring consumers ship their own
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
     */
    function is(x, y) {
      return (
        (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y) // eslint-disable-line no-self-compare
      );
    }

    var objectIs = typeof Object.is === "function" ? Object.is : is; // $FlowFixMe[method-unbinding]

    // This is imported by the event replaying implementation in React DOM. It's
    // in a separate file to break a circular dependency between the renderer and
    // the reconciler.
    function isRootDehydrated(root) {
      var currentState = root.current.memoizedState;
      return currentState.isDehydrated;
    }

    var contextStackCursor = createCursor(null);
    var contextFiberStackCursor = createCursor(null);
    var rootInstanceStackCursor = createCursor(null); // Represents the nearest host transition provider (in React DOM, a <form />)

    function requiredContext(c) {
      {
        if (c === null) {
          error(
            "Expected host context to exist. This error is likely caused by a bug " +
              "in React. Please file an issue."
          );
        }
      }

      return c;
    }

    function getRootHostContainer() {
      var rootInstance = requiredContext(rootInstanceStackCursor.current);
      return rootInstance;
    }

    function pushHostContainer(fiber, nextRootInstance) {
      // Push current root instance onto the stack;
      // This allows us to reset root when portals are popped.
      push(rootInstanceStackCursor, nextRootInstance, fiber); // Track the context and the Fiber that provided it.
      // This enables us to pop only Fibers that provide unique contexts.

      push(contextFiberStackCursor, fiber, fiber); // Finally, we need to push the host context to the stack.
      // However, we can't just call getRootHostContext() and push it because
      // we'd have a different number of entries on the stack depending on
      // whether getRootHostContext() throws somewhere in renderer code or not.
      // So we push an empty value first. This lets us safely unwind on errors.

      push(contextStackCursor, null, fiber);
      var nextRootContext = getRootHostContext(); // Now that we know this function doesn't throw, replace it.

      pop(contextStackCursor, fiber);
      push(contextStackCursor, nextRootContext, fiber);
    }

    function popHostContainer(fiber) {
      pop(contextStackCursor, fiber);
      pop(contextFiberStackCursor, fiber);
      pop(rootInstanceStackCursor, fiber);
    }

    function getHostContext() {
      var context = requiredContext(contextStackCursor.current);
      return context;
    }

    function pushHostContext(fiber) {
      var context = requiredContext(contextStackCursor.current);
      var nextContext = getChildHostContext(context, fiber.type); // Don't push this Fiber's context unless it's unique.

      if (context !== nextContext) {
        // Track the context and the Fiber that provided it.
        // This enables us to pop only Fibers that provide unique contexts.
        push(contextFiberStackCursor, fiber, fiber);
        push(contextStackCursor, nextContext, fiber);
      }
    }

    function popHostContext(fiber) {
      if (contextFiberStackCursor.current === fiber) {
        // Do not pop unless this Fiber provided the current context.
        // pushHostContext() only pushes Fibers that provide unique contexts.
        pop(contextStackCursor, fiber);
        pop(contextFiberStackCursor, fiber);
      }
    }

    var isHydrating = false; // This flag allows for warning supression when we expect there to be mismatches

    var hydrationErrors = null;

    function prepareToHydrateHostInstance(fiber, hostContext) {
      {
        throw new Error(
          "Expected prepareToHydrateHostInstance() to never be called. " +
            "This error is likely caused by a bug in React. Please file an issue."
        );
      }
    }

    function prepareToHydrateHostTextInstance(fiber) {
      {
        throw new Error(
          "Expected prepareToHydrateHostTextInstance() to never be called. " +
            "This error is likely caused by a bug in React. Please file an issue."
        );
      }
    }

    function prepareToHydrateHostSuspenseInstance(fiber) {
      {
        throw new Error(
          "Expected prepareToHydrateHostSuspenseInstance() to never be called. " +
            "This error is likely caused by a bug in React. Please file an issue."
        );
      }
    }

    function popHydrationState(fiber) {
      {
        return false;
      }
    }

    function upgradeHydrationErrorsToRecoverable() {
      if (hydrationErrors !== null) {
        // Successfully completed a forced client render. The errors that occurred
        // during the hydration attempt are now recovered. We will log them in
        // commit phase, once the entire tree has finished.
        queueRecoverableErrors(hydrationErrors);
        hydrationErrors = null;
      }
    }

    function getIsHydrating() {
      return isHydrating;
    }

    function queueHydrationError(error) {
      if (hydrationErrors === null) {
        hydrationErrors = [error];
      } else {
        hydrationErrors.push(error);
      }
    }

    // we wait until the current render is over (either finished or interrupted)
    // before adding it to the fiber/hook queue. Push to this array so we can
    // access the queue, fiber, update, et al later.

    var concurrentQueues = [];
    var concurrentQueuesIndex = 0;
    var concurrentlyUpdatedLanes = NoLanes;
    function finishQueueingConcurrentUpdates() {
      var endIndex = concurrentQueuesIndex;
      concurrentQueuesIndex = 0;
      concurrentlyUpdatedLanes = NoLanes;
      var i = 0;

      while (i < endIndex) {
        var fiber = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var queue = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var update = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var lane = concurrentQueues[i];
        concurrentQueues[i++] = null;

        if (queue !== null && update !== null) {
          var pending = queue.pending;

          if (pending === null) {
            // This is the first update. Create a circular list.
            update.next = update;
          } else {
            update.next = pending.next;
            pending.next = update;
          }

          queue.pending = update;
        }

        if (lane !== NoLane) {
          markUpdateLaneFromFiberToRoot(fiber, update, lane);
        }
      }
    }
    function getConcurrentlyUpdatedLanes() {
      return concurrentlyUpdatedLanes;
    }

    function enqueueUpdate$1(fiber, queue, update, lane) {
      // Don't update the `childLanes` on the return path yet. If we already in
      // the middle of rendering, wait until after it has completed.
      concurrentQueues[concurrentQueuesIndex++] = fiber;
      concurrentQueues[concurrentQueuesIndex++] = queue;
      concurrentQueues[concurrentQueuesIndex++] = update;
      concurrentQueues[concurrentQueuesIndex++] = lane;
      concurrentlyUpdatedLanes = mergeLanes(concurrentlyUpdatedLanes, lane); // The fiber's `lane` field is used in some places to check if any work is
      // scheduled, to perform an eager bailout, so we need to update it immediately.
      // TODO: We should probably move this to the "shared" queue instead.

      fiber.lanes = mergeLanes(fiber.lanes, lane);
      var alternate = fiber.alternate;

      if (alternate !== null) {
        alternate.lanes = mergeLanes(alternate.lanes, lane);
      }
    }

    function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
      var concurrentQueue = queue;
      var concurrentUpdate = update;
      enqueueUpdate$1(fiber, concurrentQueue, concurrentUpdate, lane);
      return getRootForUpdatedFiber(fiber);
    }
    function enqueueConcurrentHookUpdateAndEagerlyBailout(
      fiber,
      queue,
      update
    ) {
      // This function is used to queue an update that doesn't need a rerender. The
      // only reason we queue it is in case there's a subsequent higher priority
      // update that causes it to be rebased.
      var lane = NoLane;
      var concurrentQueue = queue;
      var concurrentUpdate = update;
      enqueueUpdate$1(fiber, concurrentQueue, concurrentUpdate, lane); // Usually we can rely on the upcoming render phase to process the concurrent
      // queue. However, since this is a bail out, we're not scheduling any work
      // here. So the update we just queued will leak until something else happens
      // to schedule work (if ever).
      //
      // Check if we're currently in the middle of rendering a tree, and if not,
      // process the queue immediately to prevent a leak.

      var isConcurrentlyRendering = getWorkInProgressRoot() !== null;

      if (!isConcurrentlyRendering) {
        finishQueueingConcurrentUpdates();
      }
    }
    function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
      var concurrentQueue = queue;
      var concurrentUpdate = update;
      enqueueUpdate$1(fiber, concurrentQueue, concurrentUpdate, lane);
      return getRootForUpdatedFiber(fiber);
    }
    function enqueueConcurrentRenderForLane(fiber, lane) {
      enqueueUpdate$1(fiber, null, null, lane);
      return getRootForUpdatedFiber(fiber);
    } // Calling this function outside this module should only be done for backwards
    // compatibility and should always be accompanied by a warning.

    function unsafe_markUpdateLaneFromFiberToRoot(sourceFiber, lane) {
      // NOTE: For Hyrum's Law reasons, if an infinite update loop is detected, it
      // should throw before `markUpdateLaneFromFiberToRoot` is called. But this is
      // undefined behavior and we can change it if we need to; it just so happens
      // that, at the time of this writing, there's an internal product test that
      // happens to rely on this.
      var root = getRootForUpdatedFiber(sourceFiber);
      markUpdateLaneFromFiberToRoot(sourceFiber, null, lane);
      return root;
    }

    function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
      // Update the source fiber's lanes
      sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
      var alternate = sourceFiber.alternate;

      if (alternate !== null) {
        alternate.lanes = mergeLanes(alternate.lanes, lane);
      } // Walk the parent path to the root and update the child lanes.

      var isHidden = false;
      var parent = sourceFiber.return;
      var node = sourceFiber;

      while (parent !== null) {
        parent.childLanes = mergeLanes(parent.childLanes, lane);
        alternate = parent.alternate;

        if (alternate !== null) {
          alternate.childLanes = mergeLanes(alternate.childLanes, lane);
        }

        if (parent.tag === OffscreenComponent) {
          // Check if this offscreen boundary is currently hidden.
          //
          // The instance may be null if the Offscreen parent was unmounted. Usually
          // the parent wouldn't be reachable in that case because we disconnect
          // fibers from the tree when they are deleted. However, there's a weird
          // edge case where setState is called on a fiber that was interrupted
          // before it ever mounted. Because it never mounts, it also never gets
          // deleted. Because it never gets deleted, its return pointer never gets
          // disconnected. Which means it may be attached to a deleted Offscreen
          // parent node. (This discovery suggests it may be better for memory usage
          // if we don't attach the `return` pointer until the commit phase, though
          // in order to do that we'd need some other way to track the return
          // pointer during the initial render, like on the stack.)
          //
          // This case is always accompanied by a warning, but we still need to
          // account for it. (There may be other cases that we haven't discovered,
          // too.)
          var offscreenInstance = parent.stateNode;

          if (
            offscreenInstance !== null &&
            !(offscreenInstance._visibility & OffscreenVisible)
          ) {
            isHidden = true;
          }
        }

        node = parent;
        parent = parent.return;
      }

      if (isHidden && update !== null && node.tag === HostRoot) {
        var root = node.stateNode;
        markHiddenUpdate(root, update, lane);
      }
    }

    function getRootForUpdatedFiber(sourceFiber) {
      // TODO: We will detect and infinite update loop and throw even if this fiber
      // has already unmounted. This isn't really necessary but it happens to be the
      // current behavior we've used for several release cycles. Consider not
      // performing this check if the updated fiber already unmounted, since it's
      // not possible for that to cause an infinite update loop.
      throwIfInfiniteUpdateLoopDetected(); // When a setState happens, we must ensure the root is scheduled. Because
      // update queues do not have a backpointer to the root, the only way to do
      // this currently is to walk up the return path. This used to not be a big
      // deal because we would have to walk up the return path to set
      // the `childLanes`, anyway, but now those two traversals happen at
      // different times.
      // TODO: Consider adding a `root` backpointer on the update queue.

      detectUpdateOnUnmountedFiber(sourceFiber, sourceFiber);
      var node = sourceFiber;
      var parent = node.return;

      while (parent !== null) {
        detectUpdateOnUnmountedFiber(sourceFiber, node);
        node = parent;
        parent = node.return;
      }

      return node.tag === HostRoot ? node.stateNode : null;
    }

    function detectUpdateOnUnmountedFiber(sourceFiber, parent) {
      {
        var alternate = parent.alternate;

        if (
          alternate === null &&
          (parent.flags & (Placement | Hydrating)) !== NoFlags$1
        ) {
          warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
        }
      }
    }

    var ReactCurrentActQueue$3 = ReactSharedInternals.ReactCurrentActQueue; // A linked list of all the roots with pending work. In an idiomatic app,
    // there's only a single root, but we do support multi root apps, hence this
    // extra complexity. But this module is optimized for the single root case.

    var firstScheduledRoot = null;
    var lastScheduledRoot = null; // Used to prevent redundant mircotasks from being scheduled.

    var didScheduleMicrotask = false; // `act` "microtasks" are scheduled on the `act` queue instead of an actual
    // microtask, so we have to dedupe those separately. This wouldn't be an issue
    // if we required all `act` calls to be awaited, which we might in the future.

    var didScheduleMicrotask_act = false; // Used to quickly bail out of flushSync if there's no sync work to do.

    var mightHavePendingSyncWork = false;
    var isFlushingWork = false;
    var currentEventTransitionLane = NoLane;
    function ensureRootIsScheduled(root) {
      // This function is called whenever a root receives an update. It does two
      // things 1) it ensures the root is in the root schedule, and 2) it ensures
      // there's a pending microtask to process the root schedule.
      //
      // Most of the actual scheduling logic does not happen until
      // `scheduleTaskForRootDuringMicrotask` runs.
      // Add the root to the schedule
      if (root === lastScheduledRoot || root.next !== null);
      else {
        if (lastScheduledRoot === null) {
          firstScheduledRoot = lastScheduledRoot = root;
        } else {
          lastScheduledRoot.next = root;
          lastScheduledRoot = root;
        }
      } // Any time a root received an update, we set this to true until the next time
      // we process the schedule. If it's false, then we can quickly exit flushSync
      // without consulting the schedule.

      mightHavePendingSyncWork = true; // At the end of the current event, go through each of the roots and ensure
      // there's a task scheduled for each one at the correct priority.

      if (ReactCurrentActQueue$3.current !== null) {
        // We're inside an `act` scope.
        if (!didScheduleMicrotask_act) {
          didScheduleMicrotask_act = true;
          scheduleImmediateTask(processRootScheduleInMicrotask);
        }
      } else {
        if (!didScheduleMicrotask) {
          didScheduleMicrotask = true;
          scheduleImmediateTask(processRootScheduleInMicrotask);
        }
      }

      {
        // While this flag is disabled, we schedule the render task immediately
        // instead of waiting a microtask.
        // TODO: We need to land enableDeferRootSchedulingToMicrotask ASAP to
        // unblock additional features we have planned.
        scheduleTaskForRootDuringMicrotask(root, now$1());
      }

      if (ReactCurrentActQueue$3.isBatchingLegacy && root.tag === LegacyRoot) {
        // Special `act` case: Record whenever a legacy update is scheduled.
        ReactCurrentActQueue$3.didScheduleLegacyUpdate = true;
      }
    }
    function flushSyncWorkOnAllRoots() {
      // This is allowed to be called synchronously, but the caller should check
      // the execution context first.
      flushSyncWorkAcrossRoots_impl(false);
    }
    function flushSyncWorkOnLegacyRootsOnly() {
      // This is allowed to be called synchronously, but the caller should check
      // the execution context first.
      flushSyncWorkAcrossRoots_impl(true);
    }

    function flushSyncWorkAcrossRoots_impl(onlyLegacy) {
      if (isFlushingWork) {
        // Prevent reentrancy.
        // TODO: Is this overly defensive? The callers must check the execution
        // context first regardless.
        return;
      }

      if (!mightHavePendingSyncWork) {
        // Fast path. There's no sync work to do.
        return;
      } // There may or may not be synchronous work scheduled. Let's check.

      var didPerformSomeWork;
      var errors = null;
      isFlushingWork = true;

      do {
        didPerformSomeWork = false;
        var root = firstScheduledRoot;

        while (root !== null) {
          if (onlyLegacy && root.tag !== LegacyRoot);
          else {
            var workInProgressRoot = getWorkInProgressRoot();
            var workInProgressRootRenderLanes =
              getWorkInProgressRootRenderLanes();
            var nextLanes = getNextLanes(
              root,
              root === workInProgressRoot
                ? workInProgressRootRenderLanes
                : NoLanes
            );

            if (includesSyncLane(nextLanes)) {
              // This root has pending sync work. Flush it now.
              try {
                didPerformSomeWork = true;
                performSyncWorkOnRoot(root, nextLanes);
              } catch (error) {
                // Collect errors so we can rethrow them at the end
                if (errors === null) {
                  errors = [error];
                } else {
                  errors.push(error);
                }
              }
            }
          }

          root = root.next;
        }
      } while (didPerformSomeWork);

      isFlushingWork = false; // If any errors were thrown, rethrow them right before exiting.
      // TODO: Consider returning these to the caller, to allow them to decide
      // how/when to rethrow.

      if (errors !== null) {
        if (errors.length > 1) {
          if (typeof AggregateError === "function") {
            // eslint-disable-next-line no-undef
            throw new AggregateError(errors);
          } else {
            for (var i = 1; i < errors.length; i++) {
              scheduleImmediateTask(throwError.bind(null, errors[i]));
            }

            var firstError = errors[0];
            throw firstError;
          }
        } else {
          var error = errors[0];
          throw error;
        }
      }
    }

    function throwError(error) {
      throw error;
    }

    function processRootScheduleInMicrotask() {
      // This function is always called inside a microtask. It should never be
      // called synchronously.
      didScheduleMicrotask = false;

      {
        didScheduleMicrotask_act = false;
      } // We'll recompute this as we iterate through all the roots and schedule them.

      mightHavePendingSyncWork = false;
      var currentTime = now$1();
      var prev = null;
      var root = firstScheduledRoot;

      while (root !== null) {
        var next = root.next;

        if (
          currentEventTransitionLane !== NoLane &&
          shouldAttemptEagerTransition()
        ) {
          // A transition was scheduled during an event, but we're going to try to
          // render it synchronously anyway. We do this during a popstate event to
          // preserve the scroll position of the previous page.
          upgradePendingLaneToSync(root, currentEventTransitionLane);
        }

        var nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);

        if (nextLanes === NoLane) {
          // This root has no more pending work. Remove it from the schedule. To
          // guard against subtle reentrancy bugs, this microtask is the only place
          // we do this — you can add roots to the schedule whenever, but you can
          // only remove them here.
          // Null this out so we know it's been removed from the schedule.
          root.next = null;

          if (prev === null) {
            // This is the new head of the list
            firstScheduledRoot = next;
          } else {
            prev.next = next;
          }

          if (next === null) {
            // This is the new tail of the list
            lastScheduledRoot = prev;
          }
        } else {
          // This root still has work. Keep it in the list.
          prev = root;

          if (includesSyncLane(nextLanes)) {
            mightHavePendingSyncWork = true;
          }
        }

        root = next;
      }

      currentEventTransitionLane = NoLane; // At the end of the microtask, flush any pending synchronous work. This has
      // to come at the end, because it does actual rendering work that might throw.

      flushSyncWorkOnAllRoots();
    }

    function scheduleTaskForRootDuringMicrotask(root, currentTime) {
      // This function is always called inside a microtask, or at the very end of a
      // rendering task right before we yield to the main thread. It should never be
      // called synchronously.
      //
      // TODO: Unless enableDeferRootSchedulingToMicrotask is off. We need to land
      // that ASAP to unblock additional features we have planned.
      //
      // This function also never performs React work synchronously; it should
      // only schedule work to be performed later, in a separate task or microtask.
      // Check if any lanes are being starved by other work. If so, mark them as
      // expired so we know to work on those next.
      markStarvedLanesAsExpired(root, currentTime); // Determine the next lanes to work on, and their priority.

      var workInProgressRoot = getWorkInProgressRoot();
      var workInProgressRootRenderLanes = getWorkInProgressRootRenderLanes();
      var nextLanes = getNextLanes(
        root,
        root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
      );
      var existingCallbackNode = root.callbackNode;

      if (
        // Check if there's nothing to work on
        nextLanes === NoLanes || // If this root is currently suspended and waiting for data to resolve, don't
        // schedule a task to render it. We'll either wait for a ping, or wait to
        // receive an update.
        //
        // Suspended render phase
        (root === workInProgressRoot && isWorkLoopSuspendedOnData()) || // Suspended commit phase
        root.cancelPendingCommit !== null
      ) {
        // Fast path: There's nothing to work on.
        if (existingCallbackNode !== null) {
          cancelCallback(existingCallbackNode);
        }

        root.callbackNode = null;
        root.callbackPriority = NoLane;
        return NoLane;
      } // Schedule a new callback in the host environment.

      if (includesSyncLane(nextLanes)) {
        // Synchronous work is always flushed at the end of the microtask, so we
        // don't need to schedule an additional task.
        if (existingCallbackNode !== null) {
          cancelCallback(existingCallbackNode);
        }

        root.callbackPriority = SyncLane;
        root.callbackNode = null;
        return SyncLane;
      } else {
        // We use the highest priority lane to represent the priority of the callback.
        var existingCallbackPriority = root.callbackPriority;
        var newCallbackPriority = getHighestPriorityLane(nextLanes);

        if (
          newCallbackPriority === existingCallbackPriority && // Special case related to `act`. If the currently scheduled task is a
          // Scheduler task, rather than an `act` task, cancel it and re-schedule
          // on the `act` queue.
          !(
            ReactCurrentActQueue$3.current !== null &&
            existingCallbackNode !== fakeActCallbackNode$1
          )
        ) {
          // The priority hasn't changed. We can reuse the existing task.
          return newCallbackPriority;
        } else {
          // Cancel the existing callback. We'll schedule a new one below.
          cancelCallback(existingCallbackNode);
        }

        var schedulerPriorityLevel;

        switch (lanesToEventPriority(nextLanes)) {
          case DiscreteEventPriority:
            schedulerPriorityLevel = ImmediatePriority;
            break;

          case ContinuousEventPriority:
            schedulerPriorityLevel = UserBlockingPriority;
            break;

          case DefaultEventPriority:
            schedulerPriorityLevel = NormalPriority;
            break;

          case IdleEventPriority:
            schedulerPriorityLevel = IdlePriority;
            break;

          default:
            schedulerPriorityLevel = NormalPriority;
            break;
        }

        var newCallbackNode = scheduleCallback$1(
          schedulerPriorityLevel,
          performConcurrentWorkOnRoot.bind(null, root)
        );
        root.callbackPriority = newCallbackPriority;
        root.callbackNode = newCallbackNode;
        return newCallbackPriority;
      }
    }

    function getContinuationForRoot(root, originalCallbackNode) {
      // This is called at the end of `performConcurrentWorkOnRoot` to determine
      // if we need to schedule a continuation task.
      //
      // Usually `scheduleTaskForRootDuringMicrotask` only runs inside a microtask;
      // however, since most of the logic for determining if we need a continuation
      // versus a new task is the same, we cheat a bit and call it here. This is
      // only safe to do because we know we're at the end of the browser task.
      // So although it's not an actual microtask, it might as well be.
      scheduleTaskForRootDuringMicrotask(root, now$1());

      if (root.callbackNode === originalCallbackNode) {
        // The task node scheduled for this root is the same one that's
        // currently executed. Need to return a continuation.
        return performConcurrentWorkOnRoot.bind(null, root);
      }

      return null;
    }
    var fakeActCallbackNode$1 = {};

    function scheduleCallback$1(priorityLevel, callback) {
      if (ReactCurrentActQueue$3.current !== null) {
        // Special case: We're inside an `act` scope (a testing utility).
        // Instead of scheduling work in the host environment, add it to a
        // fake internal queue that's managed by the `act` implementation.
        ReactCurrentActQueue$3.current.push(callback);
        return fakeActCallbackNode$1;
      } else {
        return scheduleCallback$2(priorityLevel, callback);
      }
    }

    function cancelCallback(callbackNode) {
      if (callbackNode === fakeActCallbackNode$1);
      else if (callbackNode !== null) {
        cancelCallback$1(callbackNode);
      }
    }

    function scheduleImmediateTask(cb) {
      if (ReactCurrentActQueue$3.current !== null) {
        // Special case: Inside an `act` scope, we push microtasks to the fake `act`
        // callback queue. This is because we currently support calling `act`
        // without awaiting the result. The plan is to deprecate that, and require
        // that you always await the result so that the microtasks have a chance to
        // run. But it hasn't happened yet.
        ReactCurrentActQueue$3.current.push(function () {
          cb();
          return null;
        });
      } // TODO: Can we land supportsMicrotasks? Which environments don't support it?
      // Alternatively, can we move this check to the host config?

      {
        // If microtasks are not supported, use Scheduler.
        scheduleCallback$2(ImmediatePriority, cb);
      }
    }

    function requestTransitionLane( // This argument isn't used, it's only here to encourage the caller to
      // check that it's inside a transition before calling this function.
      // TODO: Make this non-nullable. Requires a tweak to useOptimistic.
      transition
    ) {
      // The algorithm for assigning an update to a lane should be stable for all
      // updates at the same priority within the same event. To do this, the
      // inputs to the algorithm must be the same.
      //
      // The trick we use is to cache the first of each of these inputs within an
      // event. Then reset the cached values once we can be sure the event is
      // over. Our heuristic for that is whenever we enter a concurrent work loop.
      if (currentEventTransitionLane === NoLane) {
        // All transitions within the same event are assigned the same lane.
        currentEventTransitionLane = claimNextTransitionLane();
      }

      return currentEventTransitionLane;
    }

    var currentEntangledLane = NoLane; // A thenable that resolves when the entangled scope completes. It does not
    // resolve to a particular value because it's only used for suspending the UI
    // until the async action scope has completed.

    var currentEntangledActionThenable = null;

    function chainThenableValue(thenable, result) {
      // Equivalent to: Promise.resolve(thenable).then(() => result), except we can
      // cheat a bit since we know that that this thenable is only ever consumed
      // by React.
      //
      // We don't technically require promise support on the client yet, hence this
      // extra code.
      var listeners = [];
      var thenableWithOverride = {
        status: "pending",
        value: null,
        reason: null,
        then: function (resolve) {
          listeners.push(resolve);
        }
      };
      thenable.then(
        function (value) {
          var fulfilledThenable = thenableWithOverride;
          fulfilledThenable.status = "fulfilled";
          fulfilledThenable.value = result;

          for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            listener(result);
          }
        },
        function (error) {
          var rejectedThenable = thenableWithOverride;
          rejectedThenable.status = "rejected";
          rejectedThenable.reason = error;

          for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i]; // This is a perf hack where we call the `onFulfill` ping function
            // instead of `onReject`, because we know that React is the only
            // consumer of these promises, and it passes the same listener to both.
            // We also know that it will read the error directly off the
            // `.reason` field.

            listener(undefined);
          }
        }
      );
      return thenableWithOverride;
    }
    function peekEntangledActionLane() {
      return currentEntangledLane;
    }
    function peekEntangledActionThenable() {
      return currentEntangledActionThenable;
    }

    var UpdateState = 0;
    var ReplaceState = 1;
    var ForceUpdate = 2;
    var CaptureUpdate = 3; // Global state that is reset at the beginning of calling `processUpdateQueue`.
    // It should only be read right after calling `processUpdateQueue`, via
    // `checkHasForceUpdateAfterProcessing`.

    var hasForceUpdate = false;
    var didWarnUpdateInsideUpdate;
    var currentlyProcessingQueue;

    {
      didWarnUpdateInsideUpdate = false;
      currentlyProcessingQueue = null;
    }

    function initializeUpdateQueue(fiber) {
      var queue = {
        baseState: fiber.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
          pending: null,
          lanes: NoLanes,
          hiddenCallbacks: null
        },
        callbacks: null
      };
      fiber.updateQueue = queue;
    }
    function cloneUpdateQueue(current, workInProgress) {
      // Clone the update queue from current. Unless it's already a clone.
      var queue = workInProgress.updateQueue;
      var currentQueue = current.updateQueue;

      if (queue === currentQueue) {
        var clone = {
          baseState: currentQueue.baseState,
          firstBaseUpdate: currentQueue.firstBaseUpdate,
          lastBaseUpdate: currentQueue.lastBaseUpdate,
          shared: currentQueue.shared,
          callbacks: null
        };
        workInProgress.updateQueue = clone;
      }
    }
    function createUpdate(lane) {
      var update = {
        lane: lane,
        tag: UpdateState,
        payload: null,
        callback: null,
        next: null
      };
      return update;
    }
    function enqueueUpdate(fiber, update, lane) {
      var updateQueue = fiber.updateQueue;

      if (updateQueue === null) {
        // Only occurs if the fiber has been unmounted.
        return null;
      }

      var sharedQueue = updateQueue.shared;

      {
        if (
          currentlyProcessingQueue === sharedQueue &&
          !didWarnUpdateInsideUpdate
        ) {
          var componentName = getComponentNameFromFiber(fiber);

          error(
            "An update (setState, replaceState, or forceUpdate) was scheduled " +
              "from inside an update function. Update functions should be pure, " +
              "with zero side-effects. Consider using componentDidUpdate or a " +
              "callback.\n\nPlease update the following component: %s",
            componentName
          );

          didWarnUpdateInsideUpdate = true;
        }
      }

      if (isUnsafeClassRenderPhaseUpdate()) {
        // This is an unsafe render phase update. Add directly to the update
        // queue so we can process it immediately during the current render.
        var pending = sharedQueue.pending;

        if (pending === null) {
          // This is the first update. Create a circular list.
          update.next = update;
        } else {
          update.next = pending.next;
          pending.next = update;
        }

        sharedQueue.pending = update; // Update the childLanes even though we're most likely already rendering
        // this fiber. This is for backwards compatibility in the case where you
        // update a different component during render phase than the one that is
        // currently renderings (a pattern that is accompanied by a warning).

        return unsafe_markUpdateLaneFromFiberToRoot(fiber, lane);
      } else {
        return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
      }
    }
    function entangleTransitions(root, fiber, lane) {
      var updateQueue = fiber.updateQueue;

      if (updateQueue === null) {
        // Only occurs if the fiber has been unmounted.
        return;
      }

      var sharedQueue = updateQueue.shared;

      if (isTransitionLane(lane)) {
        var queueLanes = sharedQueue.lanes; // If any entangled lanes are no longer pending on the root, then they must
        // have finished. We can remove them from the shared queue, which represents
        // a superset of the actually pending lanes. In some cases we may entangle
        // more than we need to, but that's OK. In fact it's worse if we *don't*
        // entangle when we should.

        queueLanes = intersectLanes(queueLanes, root.pendingLanes); // Entangle the new transition lane with the other transition lanes.

        var newQueueLanes = mergeLanes(queueLanes, lane);
        sharedQueue.lanes = newQueueLanes; // Even if queue.lanes already include lane, we don't know for certain if
        // the lane finished since the last time we entangled it. So we need to
        // entangle it again, just to be sure.

        markRootEntangled(root, newQueueLanes);
      }
    }
    function enqueueCapturedUpdate(workInProgress, capturedUpdate) {
      // Captured updates are updates that are thrown by a child during the render
      // phase. They should be discarded if the render is aborted. Therefore,
      // we should only put them on the work-in-progress queue, not the current one.
      var queue = workInProgress.updateQueue; // Check if the work-in-progress queue is a clone.

      var current = workInProgress.alternate;

      if (current !== null) {
        var currentQueue = current.updateQueue;

        if (queue === currentQueue) {
          // The work-in-progress queue is the same as current. This happens when
          // we bail out on a parent fiber that then captures an error thrown by
          // a child. Since we want to append the update only to the work-in
          // -progress queue, we need to clone the updates. We usually clone during
          // processUpdateQueue, but that didn't happen in this case because we
          // skipped over the parent when we bailed out.
          var newFirst = null;
          var newLast = null;
          var firstBaseUpdate = queue.firstBaseUpdate;

          if (firstBaseUpdate !== null) {
            // Loop through the updates and clone them.
            var update = firstBaseUpdate;

            do {
              var clone = {
                lane: update.lane,
                tag: update.tag,
                payload: update.payload,
                // When this update is rebased, we should not fire its
                // callback again.
                callback: null,
                next: null
              };

              if (newLast === null) {
                newFirst = newLast = clone;
              } else {
                newLast.next = clone;
                newLast = clone;
              } // $FlowFixMe[incompatible-type] we bail out when we get a null

              update = update.next;
            } while (update !== null); // Append the captured update the end of the cloned list.

            if (newLast === null) {
              newFirst = newLast = capturedUpdate;
            } else {
              newLast.next = capturedUpdate;
              newLast = capturedUpdate;
            }
          } else {
            // There are no base updates.
            newFirst = newLast = capturedUpdate;
          }

          queue = {
            baseState: currentQueue.baseState,
            firstBaseUpdate: newFirst,
            lastBaseUpdate: newLast,
            shared: currentQueue.shared,
            callbacks: currentQueue.callbacks
          };
          workInProgress.updateQueue = queue;
          return;
        }
      } // Append the update to the end of the list.

      var lastBaseUpdate = queue.lastBaseUpdate;

      if (lastBaseUpdate === null) {
        queue.firstBaseUpdate = capturedUpdate;
      } else {
        lastBaseUpdate.next = capturedUpdate;
      }

      queue.lastBaseUpdate = capturedUpdate;
    }

    function getStateFromUpdate(
      workInProgress,
      queue,
      update,
      prevState,
      nextProps,
      instance
    ) {
      switch (update.tag) {
        case ReplaceState: {
          var payload = update.payload;

          if (typeof payload === "function") {
            // Updater function
            {
              enterDisallowedContextReadInDEV();
            }

            var nextState = payload.call(instance, prevState, nextProps);

            {
              if (workInProgress.mode & StrictLegacyMode) {
                setIsStrictModeForDevtools(true);

                try {
                  payload.call(instance, prevState, nextProps);
                } finally {
                  setIsStrictModeForDevtools(false);
                }
              }

              exitDisallowedContextReadInDEV();
            }

            return nextState;
          } // State object

          return payload;
        }

        case CaptureUpdate: {
          workInProgress.flags =
            (workInProgress.flags & ~ShouldCapture) | DidCapture;
        }
        // Intentional fallthrough

        case UpdateState: {
          var _payload = update.payload;
          var partialState;

          if (typeof _payload === "function") {
            // Updater function
            {
              enterDisallowedContextReadInDEV();
            }

            partialState = _payload.call(instance, prevState, nextProps);

            {
              if (workInProgress.mode & StrictLegacyMode) {
                setIsStrictModeForDevtools(true);

                try {
                  _payload.call(instance, prevState, nextProps);
                } finally {
                  setIsStrictModeForDevtools(false);
                }
              }

              exitDisallowedContextReadInDEV();
            }
          } else {
            // Partial state object
            partialState = _payload;
          }

          if (partialState === null || partialState === undefined) {
            // Null and undefined are treated as no-ops.
            return prevState;
          } // Merge the partial state and the previous state.

          return assign({}, prevState, partialState);
        }

        case ForceUpdate: {
          hasForceUpdate = true;
          return prevState;
        }
      }

      return prevState;
    }

    var didReadFromEntangledAsyncAction = false; // Each call to processUpdateQueue should be accompanied by a call to this. It's
    // only in a separate function because in updateHostRoot, it must happen after
    // all the context stacks have been pushed to, to prevent a stack mismatch. A
    // bit unfortunate.

    function suspendIfUpdateReadFromEntangledAsyncAction() {
      // Check if this update is part of a pending async action. If so, we'll
      // need to suspend until the action has finished, so that it's batched
      // together with future updates in the same action.
      // TODO: Once we support hooks inside useMemo (or an equivalent
      // memoization boundary like Forget), hoist this logic so that it only
      // suspends if the memo boundary produces a new value.
      if (didReadFromEntangledAsyncAction) {
        var entangledActionThenable = peekEntangledActionThenable();

        if (entangledActionThenable !== null) {
          // TODO: Instead of the throwing the thenable directly, throw a
          // special object like `use` does so we can detect if it's captured
          // by userspace.
          throw entangledActionThenable;
        }
      }
    }
    function processUpdateQueue(workInProgress, props, instance, renderLanes) {
      didReadFromEntangledAsyncAction = false; // This is always non-null on a ClassComponent or HostRoot

      var queue = workInProgress.updateQueue;
      hasForceUpdate = false;

      {
        currentlyProcessingQueue = queue.shared;
      }

      var firstBaseUpdate = queue.firstBaseUpdate;
      var lastBaseUpdate = queue.lastBaseUpdate; // Check if there are pending updates. If so, transfer them to the base queue.

      var pendingQueue = queue.shared.pending;

      if (pendingQueue !== null) {
        queue.shared.pending = null; // The pending queue is circular. Disconnect the pointer between first
        // and last so that it's non-circular.

        var lastPendingUpdate = pendingQueue;
        var firstPendingUpdate = lastPendingUpdate.next;
        lastPendingUpdate.next = null; // Append pending updates to base queue

        if (lastBaseUpdate === null) {
          firstBaseUpdate = firstPendingUpdate;
        } else {
          lastBaseUpdate.next = firstPendingUpdate;
        }

        lastBaseUpdate = lastPendingUpdate; // If there's a current queue, and it's different from the base queue, then
        // we need to transfer the updates to that queue, too. Because the base
        // queue is a singly-linked list with no cycles, we can append to both
        // lists and take advantage of structural sharing.
        // TODO: Pass `current` as argument

        var current = workInProgress.alternate;

        if (current !== null) {
          // This is always non-null on a ClassComponent or HostRoot
          var currentQueue = current.updateQueue;
          var currentLastBaseUpdate = currentQueue.lastBaseUpdate;

          if (currentLastBaseUpdate !== lastBaseUpdate) {
            if (currentLastBaseUpdate === null) {
              currentQueue.firstBaseUpdate = firstPendingUpdate;
            } else {
              currentLastBaseUpdate.next = firstPendingUpdate;
            }

            currentQueue.lastBaseUpdate = lastPendingUpdate;
          }
        }
      } // These values may change as we process the queue.

      if (firstBaseUpdate !== null) {
        // Iterate through the list of updates to compute the result.
        var newState = queue.baseState; // TODO: Don't need to accumulate this. Instead, we can remove renderLanes
        // from the original lanes.

        var newLanes = NoLanes;
        var newBaseState = null;
        var newFirstBaseUpdate = null;
        var newLastBaseUpdate = null;
        var update = firstBaseUpdate;

        do {
          // An extra OffscreenLane bit is added to updates that were made to
          // a hidden tree, so that we can distinguish them from updates that were
          // already there when the tree was hidden.
          var updateLane = removeLanes(update.lane, OffscreenLane);
          var isHiddenUpdate = updateLane !== update.lane; // Check if this update was made while the tree was hidden. If so, then
          // it's not a "base" update and we should disregard the extra base lanes
          // that were added to renderLanes when we entered the Offscreen tree.

          var shouldSkipUpdate = isHiddenUpdate
            ? !isSubsetOfLanes(getWorkInProgressRootRenderLanes(), updateLane)
            : !isSubsetOfLanes(renderLanes, updateLane);

          if (shouldSkipUpdate) {
            // Priority is insufficient. Skip this update. If this is the first
            // skipped update, the previous update/state is the new base
            // update/state.
            var clone = {
              lane: updateLane,
              tag: update.tag,
              payload: update.payload,
              callback: update.callback,
              next: null
            };

            if (newLastBaseUpdate === null) {
              newFirstBaseUpdate = newLastBaseUpdate = clone;
              newBaseState = newState;
            } else {
              newLastBaseUpdate = newLastBaseUpdate.next = clone;
            } // Update the remaining priority in the queue.

            newLanes = mergeLanes(newLanes, updateLane);
          } else {
            // This update does have sufficient priority.
            // Check if this update is part of a pending async action. If so,
            // we'll need to suspend until the action has finished, so that it's
            // batched together with future updates in the same action.
            if (
              updateLane !== NoLane &&
              updateLane === peekEntangledActionLane()
            ) {
              didReadFromEntangledAsyncAction = true;
            }

            if (newLastBaseUpdate !== null) {
              var _clone = {
                // This update is going to be committed so we never want uncommit
                // it. Using NoLane works because 0 is a subset of all bitmasks, so
                // this will never be skipped by the check above.
                lane: NoLane,
                tag: update.tag,
                payload: update.payload,
                // When this update is rebased, we should not fire its
                // callback again.
                callback: null,
                next: null
              };
              newLastBaseUpdate = newLastBaseUpdate.next = _clone;
            } // Process this update.

            newState = getStateFromUpdate(
              workInProgress,
              queue,
              update,
              newState,
              props,
              instance
            );
            var callback = update.callback;

            if (callback !== null) {
              workInProgress.flags |= Callback;

              if (isHiddenUpdate) {
                workInProgress.flags |= Visibility;
              }

              var callbacks = queue.callbacks;

              if (callbacks === null) {
                queue.callbacks = [callback];
              } else {
                callbacks.push(callback);
              }
            }
          } // $FlowFixMe[incompatible-type] we bail out when we get a null

          update = update.next;

          if (update === null) {
            pendingQueue = queue.shared.pending;

            if (pendingQueue === null) {
              break;
            } else {
              // An update was scheduled from inside a reducer. Add the new
              // pending updates to the end of the list and keep processing.
              var _lastPendingUpdate = pendingQueue; // Intentionally unsound. Pending updates form a circular list, but we
              // unravel them when transferring them to the base queue.

              var _firstPendingUpdate = _lastPendingUpdate.next;
              _lastPendingUpdate.next = null;
              update = _firstPendingUpdate;
              queue.lastBaseUpdate = _lastPendingUpdate;
              queue.shared.pending = null;
            }
          }
        } while (true);

        if (newLastBaseUpdate === null) {
          newBaseState = newState;
        }

        queue.baseState = newBaseState;
        queue.firstBaseUpdate = newFirstBaseUpdate;
        queue.lastBaseUpdate = newLastBaseUpdate;

        if (firstBaseUpdate === null) {
          // `queue.lanes` is used for entangling transitions. We can set it back to
          // zero once the queue is empty.
          queue.shared.lanes = NoLanes;
        } // Set the remaining expiration time to be whatever is remaining in the queue.
        // This should be fine because the only two other things that contribute to
        // expiration time are props and context. We're already in the middle of the
        // begin phase by the time we start processing the queue, so we've already
        // dealt with the props. Context in components that specify
        // shouldComponentUpdate is tricky; but we'll have to account for
        // that regardless.

        markSkippedUpdateLanes(newLanes);
        workInProgress.lanes = newLanes;
        workInProgress.memoizedState = newState;
      }

      {
        currentlyProcessingQueue = null;
      }
    }

    function callCallback(callback, context) {
      if (typeof callback !== "function") {
        throw new Error(
          "Invalid argument passed as callback. Expected a function. Instead " +
            ("received: " + callback)
        );
      }

      callback.call(context);
    }

    function resetHasForceUpdateBeforeProcessing() {
      hasForceUpdate = false;
    }
    function checkHasForceUpdateAfterProcessing() {
      return hasForceUpdate;
    }
    function deferHiddenCallbacks(updateQueue) {
      // When an update finishes on a hidden component, its callback should not
      // be fired until/unless the component is made visible again. Stash the
      // callback on the shared queue object so it can be fired later.
      var newHiddenCallbacks = updateQueue.callbacks;

      if (newHiddenCallbacks !== null) {
        var existingHiddenCallbacks = updateQueue.shared.hiddenCallbacks;

        if (existingHiddenCallbacks === null) {
          updateQueue.shared.hiddenCallbacks = newHiddenCallbacks;
        } else {
          updateQueue.shared.hiddenCallbacks =
            existingHiddenCallbacks.concat(newHiddenCallbacks);
        }
      }
    }
    function commitHiddenCallbacks(updateQueue, context) {
      // This component is switching from hidden -> visible. Commit any callbacks
      // that were previously deferred.
      var hiddenCallbacks = updateQueue.shared.hiddenCallbacks;

      if (hiddenCallbacks !== null) {
        updateQueue.shared.hiddenCallbacks = null;

        for (var i = 0; i < hiddenCallbacks.length; i++) {
          var callback = hiddenCallbacks[i];
          callCallback(callback, context);
        }
      }
    }
    function commitCallbacks(updateQueue, context) {
      var callbacks = updateQueue.callbacks;

      if (callbacks !== null) {
        updateQueue.callbacks = null;

        for (var i = 0; i < callbacks.length; i++) {
          var callback = callbacks[i];
          callCallback(callback, context);
        }
      }
    }

    // $FlowFixMe[method-unbinding]
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    /**
     * Performs equality by iterating through keys on an object and returning false
     * when any key has values which are not strictly equal between the arguments.
     * Returns true when the values of all keys are strictly equal.
     */

    function shallowEqual(objA, objB) {
      if (objectIs(objA, objB)) {
        return true;
      }

      if (
        typeof objA !== "object" ||
        objA === null ||
        typeof objB !== "object" ||
        objB === null
      ) {
        return false;
      }

      var keysA = Object.keys(objA);
      var keysB = Object.keys(objB);

      if (keysA.length !== keysB.length) {
        return false;
      } // Test for A's keys different from B.

      for (var i = 0; i < keysA.length; i++) {
        var currentKey = keysA[i];

        if (
          !hasOwnProperty.call(objB, currentKey) || // $FlowFixMe[incompatible-use] lost refinement of `objB`
          !objectIs(objA[currentKey], objB[currentKey])
        ) {
          return false;
        }
      }

      return true;
    }

    function describeBuiltInComponentFrame(name, ownerFn) {
      {
        var ownerName = null;

        if (ownerFn) {
          ownerName = ownerFn.displayName || ownerFn.name || null;
        }

        return describeComponentFrame(name, ownerName);
      }
    }
    function describeDebugInfoFrame(name, env) {
      return describeBuiltInComponentFrame(
        name + (env ? " (" + env + ")" : ""),
        null
      );
    }

    {
      var PossiblyWeakMap$1 = typeof WeakMap === "function" ? WeakMap : Map;
      new PossiblyWeakMap$1();
    }

    function describeComponentFrame(name, ownerName) {
      var sourceInfo = "";

      if (ownerName) {
        sourceInfo = " (created by " + ownerName + ")";
      }

      return "\n    in " + (name || "Unknown") + sourceInfo;
    }

    function describeClassComponentFrame(ctor, ownerFn) {
      {
        return describeFunctionComponentFrame(ctor, ownerFn);
      }
    }
    function describeFunctionComponentFrame(fn, ownerFn) {
      {
        if (!fn) {
          return "";
        }

        var name = fn.displayName || fn.name || null;
        var ownerName = null;

        if (ownerFn) {
          ownerName = ownerFn.displayName || ownerFn.name || null;
        }

        return describeComponentFrame(name, ownerName);
      }
    }

    function describeFiber(fiber) {
      var owner = fiber._debugOwner ? fiber._debugOwner.type : null;

      switch (fiber.tag) {
        case HostHoistable:
        case HostSingleton:
        case HostComponent:
          return describeBuiltInComponentFrame(fiber.type, owner);

        case LazyComponent:
          return describeBuiltInComponentFrame("Lazy", owner);

        case SuspenseComponent:
          return describeBuiltInComponentFrame("Suspense", owner);

        case SuspenseListComponent:
          return describeBuiltInComponentFrame("SuspenseList", owner);

        case FunctionComponent:
        case IndeterminateComponent:
        case SimpleMemoComponent:
          return describeFunctionComponentFrame(fiber.type, owner);

        case ForwardRef:
          return describeFunctionComponentFrame(fiber.type.render, owner);

        case ClassComponent:
          return describeClassComponentFrame(fiber.type, owner);

        default:
          return "";
      }
    }

    function getStackByFiberInDevAndProd(workInProgress) {
      try {
        var info = "";
        var node = workInProgress;

        do {
          info += describeFiber(node);

          if (true) {
            // Add any Server Component stack frames in reverse order.
            var debugInfo = node._debugInfo;

            if (debugInfo) {
              for (var i = debugInfo.length - 1; i >= 0; i--) {
                var entry = debugInfo[i];

                if (typeof entry.name === "string") {
                  info += describeDebugInfoFrame(entry.name, entry.env);
                }
              }
            }
          } // $FlowFixMe[incompatible-type] we bail out when we get a null

          node = node.return;
        } while (node);

        return info;
      } catch (x) {
        return "\nError generating stack: " + x.message + "\n" + x.stack;
      }
    }

    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    var current = null;
    var isRendering = false;
    function getCurrentFiberOwnerNameInDevOrNull() {
      {
        if (current === null) {
          return null;
        }

        var owner = current._debugOwner;

        if (owner !== null && typeof owner !== "undefined") {
          return getComponentNameFromFiber(owner);
        }
      }

      return null;
    }

    function getCurrentFiberStackInDev() {
      {
        if (current === null) {
          return "";
        } // Safe because if current fiber exists, we are reconciling,
        // and it is guaranteed to be the work-in-progress version.

        return getStackByFiberInDevAndProd(current);
      }
    }

    function resetCurrentFiber() {
      {
        ReactDebugCurrentFrame.getCurrentStack = null;
        current = null;
        isRendering = false;
      }
    }
    function setCurrentFiber(fiber) {
      {
        ReactDebugCurrentFrame.getCurrentStack =
          fiber === null ? null : getCurrentFiberStackInDev;
        current = fiber;
        isRendering = false;
      }
    }
    function getCurrentFiber() {
      {
        return current;
      }
    }
    function setIsRendering(rendering) {
      {
        isRendering = rendering;
      }
    }

    var ReactStrictModeWarnings = {
      recordUnsafeLifecycleWarnings: function (fiber, instance) {},
      flushPendingUnsafeLifecycleWarnings: function () {},
      recordLegacyContextWarning: function (fiber, instance) {},
      flushLegacyContextWarning: function () {},
      discardPendingWarnings: function () {}
    };

    {
      var findStrictRoot = function (fiber) {
        var maybeStrictRoot = null;
        var node = fiber;

        while (node !== null) {
          if (node.mode & StrictLegacyMode) {
            maybeStrictRoot = node;
          }

          node = node.return;
        }

        return maybeStrictRoot;
      };

      var setToSortedString = function (set) {
        var array = [];
        set.forEach(function (value) {
          array.push(value);
        });
        return array.sort().join(", ");
      };

      var pendingComponentWillMountWarnings = [];
      var pendingUNSAFE_ComponentWillMountWarnings = [];
      var pendingComponentWillReceivePropsWarnings = [];
      var pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
      var pendingComponentWillUpdateWarnings = [];
      var pendingUNSAFE_ComponentWillUpdateWarnings = []; // Tracks components we have already warned about.

      var didWarnAboutUnsafeLifecycles = new Set();

      ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function (
        fiber,
        instance
      ) {
        // Dedupe strategy: Warn once per component.
        if (didWarnAboutUnsafeLifecycles.has(fiber.type)) {
          return;
        }

        if (
          typeof instance.componentWillMount === "function" && // Don't warn about react-lifecycles-compat polyfilled components.
          instance.componentWillMount.__suppressDeprecationWarning !== true
        ) {
          pendingComponentWillMountWarnings.push(fiber);
        }

        if (
          fiber.mode & StrictLegacyMode &&
          typeof instance.UNSAFE_componentWillMount === "function"
        ) {
          pendingUNSAFE_ComponentWillMountWarnings.push(fiber);
        }

        if (
          typeof instance.componentWillReceiveProps === "function" &&
          instance.componentWillReceiveProps.__suppressDeprecationWarning !==
            true
        ) {
          pendingComponentWillReceivePropsWarnings.push(fiber);
        }

        if (
          fiber.mode & StrictLegacyMode &&
          typeof instance.UNSAFE_componentWillReceiveProps === "function"
        ) {
          pendingUNSAFE_ComponentWillReceivePropsWarnings.push(fiber);
        }

        if (
          typeof instance.componentWillUpdate === "function" &&
          instance.componentWillUpdate.__suppressDeprecationWarning !== true
        ) {
          pendingComponentWillUpdateWarnings.push(fiber);
        }

        if (
          fiber.mode & StrictLegacyMode &&
          typeof instance.UNSAFE_componentWillUpdate === "function"
        ) {
          pendingUNSAFE_ComponentWillUpdateWarnings.push(fiber);
        }
      };

      ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings =
        function () {
          // We do an initial pass to gather component names
          var componentWillMountUniqueNames = new Set();

          if (pendingComponentWillMountWarnings.length > 0) {
            pendingComponentWillMountWarnings.forEach(function (fiber) {
              componentWillMountUniqueNames.add(
                getComponentNameFromFiber(fiber) || "Component"
              );
              didWarnAboutUnsafeLifecycles.add(fiber.type);
            });
            pendingComponentWillMountWarnings = [];
          }

          var UNSAFE_componentWillMountUniqueNames = new Set();

          if (pendingUNSAFE_ComponentWillMountWarnings.length > 0) {
            pendingUNSAFE_ComponentWillMountWarnings.forEach(function (fiber) {
              UNSAFE_componentWillMountUniqueNames.add(
                getComponentNameFromFiber(fiber) || "Component"
              );
              didWarnAboutUnsafeLifecycles.add(fiber.type);
            });
            pendingUNSAFE_ComponentWillMountWarnings = [];
          }

          var componentWillReceivePropsUniqueNames = new Set();

          if (pendingComponentWillReceivePropsWarnings.length > 0) {
            pendingComponentWillReceivePropsWarnings.forEach(function (fiber) {
              componentWillReceivePropsUniqueNames.add(
                getComponentNameFromFiber(fiber) || "Component"
              );
              didWarnAboutUnsafeLifecycles.add(fiber.type);
            });
            pendingComponentWillReceivePropsWarnings = [];
          }

          var UNSAFE_componentWillReceivePropsUniqueNames = new Set();

          if (pendingUNSAFE_ComponentWillReceivePropsWarnings.length > 0) {
            pendingUNSAFE_ComponentWillReceivePropsWarnings.forEach(
              function (fiber) {
                UNSAFE_componentWillReceivePropsUniqueNames.add(
                  getComponentNameFromFiber(fiber) || "Component"
                );
                didWarnAboutUnsafeLifecycles.add(fiber.type);
              }
            );
            pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
          }

          var componentWillUpdateUniqueNames = new Set();

          if (pendingComponentWillUpdateWarnings.length > 0) {
            pendingComponentWillUpdateWarnings.forEach(function (fiber) {
              componentWillUpdateUniqueNames.add(
                getComponentNameFromFiber(fiber) || "Component"
              );
              didWarnAboutUnsafeLifecycles.add(fiber.type);
            });
            pendingComponentWillUpdateWarnings = [];
          }

          var UNSAFE_componentWillUpdateUniqueNames = new Set();

          if (pendingUNSAFE_ComponentWillUpdateWarnings.length > 0) {
            pendingUNSAFE_ComponentWillUpdateWarnings.forEach(function (fiber) {
              UNSAFE_componentWillUpdateUniqueNames.add(
                getComponentNameFromFiber(fiber) || "Component"
              );
              didWarnAboutUnsafeLifecycles.add(fiber.type);
            });
            pendingUNSAFE_ComponentWillUpdateWarnings = [];
          } // Finally, we flush all the warnings
          // UNSAFE_ ones before the deprecated ones, since they'll be 'louder'

          if (UNSAFE_componentWillMountUniqueNames.size > 0) {
            var sortedNames = setToSortedString(
              UNSAFE_componentWillMountUniqueNames
            );

            error(
              "Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. " +
                "See https://react.dev/link/unsafe-component-lifecycles for details.\n\n" +
                "* Move code with side effects to componentDidMount, and set initial state in the constructor.\n" +
                "\nPlease update the following components: %s",
              sortedNames
            );
          }

          if (UNSAFE_componentWillReceivePropsUniqueNames.size > 0) {
            var _sortedNames = setToSortedString(
              UNSAFE_componentWillReceivePropsUniqueNames
            );

            error(
              "Using UNSAFE_componentWillReceiveProps in strict mode is not recommended " +
                "and may indicate bugs in your code. " +
                "See https://react.dev/link/unsafe-component-lifecycles for details.\n\n" +
                "* Move data fetching code or side effects to componentDidUpdate.\n" +
                "* If you're updating state whenever props change, " +
                "refactor your code to use memoization techniques or move it to " +
                "static getDerivedStateFromProps. Learn more at: https://react.dev/link/derived-state\n" +
                "\nPlease update the following components: %s",
              _sortedNames
            );
          }

          if (UNSAFE_componentWillUpdateUniqueNames.size > 0) {
            var _sortedNames2 = setToSortedString(
              UNSAFE_componentWillUpdateUniqueNames
            );

            error(
              "Using UNSAFE_componentWillUpdate in strict mode is not recommended " +
                "and may indicate bugs in your code. " +
                "See https://react.dev/link/unsafe-component-lifecycles for details.\n\n" +
                "* Move data fetching code or side effects to componentDidUpdate.\n" +
                "\nPlease update the following components: %s",
              _sortedNames2
            );
          }

          if (componentWillMountUniqueNames.size > 0) {
            var _sortedNames3 = setToSortedString(
              componentWillMountUniqueNames
            );

            warn(
              "componentWillMount has been renamed, and is not recommended for use. " +
                "See https://react.dev/link/unsafe-component-lifecycles for details.\n\n" +
                "* Move code with side effects to componentDidMount, and set initial state in the constructor.\n" +
                "* Rename componentWillMount to UNSAFE_componentWillMount to suppress " +
                "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " +
                "To rename all deprecated lifecycles to their new names, you can run " +
                "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" +
                "\nPlease update the following components: %s",
              _sortedNames3
            );
          }

          if (componentWillReceivePropsUniqueNames.size > 0) {
            var _sortedNames4 = setToSortedString(
              componentWillReceivePropsUniqueNames
            );

            warn(
              "componentWillReceiveProps has been renamed, and is not recommended for use. " +
                "See https://react.dev/link/unsafe-component-lifecycles for details.\n\n" +
                "* Move data fetching code or side effects to componentDidUpdate.\n" +
                "* If you're updating state whenever props change, refactor your " +
                "code to use memoization techniques or move it to " +
                "static getDerivedStateFromProps. Learn more at: https://react.dev/link/derived-state\n" +
                "* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress " +
                "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " +
                "To rename all deprecated lifecycles to their new names, you can run " +
                "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" +
                "\nPlease update the following components: %s",
              _sortedNames4
            );
          }

          if (componentWillUpdateUniqueNames.size > 0) {
            var _sortedNames5 = setToSortedString(
              componentWillUpdateUniqueNames
            );

            warn(
              "componentWillUpdate has been renamed, and is not recommended for use. " +
                "See https://react.dev/link/unsafe-component-lifecycles for details.\n\n" +
                "* Move data fetching code or side effects to componentDidUpdate.\n" +
                "* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress " +
                "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " +
                "To rename all deprecated lifecycles to their new names, you can run " +
                "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" +
                "\nPlease update the following components: %s",
              _sortedNames5
            );
          }
        };

      var pendingLegacyContextWarning = new Map(); // Tracks components we have already warned about.

      var didWarnAboutLegacyContext = new Set();

      ReactStrictModeWarnings.recordLegacyContextWarning = function (
        fiber,
        instance
      ) {
        var strictRoot = findStrictRoot(fiber);

        if (strictRoot === null) {
          error(
            "Expected to find a StrictMode component in a strict mode tree. " +
              "This error is likely caused by a bug in React. Please file an issue."
          );

          return;
        } // Dedup strategy: Warn once per component.

        if (didWarnAboutLegacyContext.has(fiber.type)) {
          return;
        }

        var warningsForRoot = pendingLegacyContextWarning.get(strictRoot);

        if (
          fiber.type.contextTypes != null ||
          fiber.type.childContextTypes != null ||
          (instance !== null && typeof instance.getChildContext === "function")
        ) {
          if (warningsForRoot === undefined) {
            warningsForRoot = [];
            pendingLegacyContextWarning.set(strictRoot, warningsForRoot);
          }

          warningsForRoot.push(fiber);
        }
      };

      ReactStrictModeWarnings.flushLegacyContextWarning = function () {
        pendingLegacyContextWarning.forEach(function (fiberArray, strictRoot) {
          if (fiberArray.length === 0) {
            return;
          }

          var firstFiber = fiberArray[0];
          var uniqueNames = new Set();
          fiberArray.forEach(function (fiber) {
            uniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutLegacyContext.add(fiber.type);
          });
          var sortedNames = setToSortedString(uniqueNames);

          try {
            setCurrentFiber(firstFiber);

            error(
              "Legacy context API has been detected within a strict-mode tree." +
                "\n\nThe old API will be supported in all 16.x releases, but applications " +
                "using it should migrate to the new version." +
                "\n\nPlease update the following components: %s" +
                "\n\nLearn more about this warning here: https://react.dev/link/legacy-context",
              sortedNames
            );
          } finally {
            resetCurrentFiber();
          }
        });
      };

      ReactStrictModeWarnings.discardPendingWarnings = function () {
        pendingComponentWillMountWarnings = [];
        pendingUNSAFE_ComponentWillMountWarnings = [];
        pendingComponentWillReceivePropsWarnings = [];
        pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
        pendingComponentWillUpdateWarnings = [];
        pendingUNSAFE_ComponentWillUpdateWarnings = [];
        pendingLegacyContextWarning = new Map();
      };
    }

    /*
     * The `'' + value` pattern (used in perf-sensitive code) throws for Symbol
     * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
     *
     * The functions in this module will throw an easier-to-understand,
     * easier-to-debug exception with a clear errors message message explaining the
     * problem. (Instead of a confusing exception thrown inside the implementation
     * of the `value` object).
     */
    // $FlowFixMe[incompatible-return] only called in DEV, so void return is not possible.
    function typeName(value) {
      {
        // toStringTag is needed for namespaced types like Temporal.Instant
        var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
        var type =
          (hasToStringTag && value[Symbol.toStringTag]) ||
          value.constructor.name ||
          "Object"; // $FlowFixMe[incompatible-return]

        return type;
      }
    } // $FlowFixMe[incompatible-return] only called in DEV, so void return is not possible.

    function willCoercionThrow(value) {
      {
        try {
          testStringCoercion(value);
          return false;
        } catch (e) {
          return true;
        }
      }
    }

    function testStringCoercion(value) {
      // If you ended up here by following an exception call stack, here's what's
      // happened: you supplied an object or symbol value to React (as a prop, key,
      // DOM attribute, CSS property, string ref, etc.) and when React tried to
      // coerce it to a string using `'' + value`, an exception was thrown.
      //
      // The most common types that will cause this exception are `Symbol` instances
      // and Temporal objects like `Temporal.Instant`. But any object that has a
      // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
      // exception. (Library authors do this to prevent users from using built-in
      // numeric operators like `+` or comparison operators like `>=` because custom
      // methods are needed to perform accurate arithmetic or comparison.)
      //
      // To fix the problem, coerce this object or symbol value to a string before
      // passing it to React. The most reliable way is usually `String(value)`.
      //
      // To find which value is throwing, check the browser or debugger console.
      // Before this exception was thrown, there should be `console.error` output
      // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
      // problem and how that type was used: key, atrribute, input value prop, etc.
      // In most cases, this console output also shows the component and its
      // ancestor components where the exception happened.
      //
      // eslint-disable-next-line react-internal/safe-string-coercion
      return "" + value;
    }
    function checkKeyStringCoercion(value) {
      {
        if (willCoercionThrow(value)) {
          error(
            "The provided key is an unsupported type %s." +
              " This value must be coerced to a string before using it here.",
            typeName(value)
          );

          return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
        }
      }
    }
    function checkPropStringCoercion(value, propName) {
      {
        if (willCoercionThrow(value)) {
          error(
            "The provided `%s` prop is an unsupported type %s." +
              " This value must be coerced to a string before using it here.",
            propName,
            typeName(value)
          );

          return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
        }
      }
    }

    var ReactCurrentActQueue$2 = ReactSharedInternals.ReactCurrentActQueue;

    function getThenablesFromState(state) {
      {
        var devState = state;
        return devState.thenables;
      }
    } // An error that is thrown (e.g. by `use`) to trigger Suspense. If we
    // detect this is caught by userspace, we'll log a warning in development.

    var SuspenseException = new Error(
      "Suspense Exception: This is not a real error! It's an implementation " +
        "detail of `use` to interrupt the current render. You must either " +
        "rethrow it immediately, or move the `use` call outside of the " +
        "`try/catch` block. Capturing without rethrowing will lead to " +
        "unexpected behavior.\n\n" +
        "To handle async errors, wrap your component in an error boundary, or " +
        "call the promise's `.catch` method and pass the result to `use`"
    );
    var SuspenseyCommitException = new Error(
      "Suspense Exception: This is not a real error, and should not leak into " +
        "userspace. If you're seeing this, it's likely a bug in React."
    ); // This is a noop thenable that we use to trigger a fallback in throwException.
    // TODO: It would be better to refactor throwException into multiple functions
    // so we can trigger a fallback directly without having to check the type. But
    // for now this will do.

    var noopSuspenseyCommitThenable = {
      then: function () {
        {
          error(
            "Internal React error: A listener was unexpectedly attached to a " +
              '"noop" thenable. This is a bug in React. Please file an issue.'
          );
        }
      }
    };
    function createThenableState() {
      // The ThenableState is created the first time a component suspends. If it
      // suspends again, we'll reuse the same state.
      {
        return {
          didWarnAboutUncachedPromise: false,
          thenables: []
        };
      }
    }
    function isThenableResolved(thenable) {
      var status = thenable.status;
      return status === "fulfilled" || status === "rejected";
    }

    function noop() {}

    function trackUsedThenable(thenableState, thenable, index) {
      if (ReactCurrentActQueue$2.current !== null) {
        ReactCurrentActQueue$2.didUsePromise = true;
      }

      var trackedThenables = getThenablesFromState(thenableState);
      var previous = trackedThenables[index];

      if (previous === undefined) {
        trackedThenables.push(thenable);
      } else {
        if (previous !== thenable) {
          // Reuse the previous thenable, and drop the new one. We can assume
          // they represent the same value, because components are idempotent.
          {
            var thenableStateDev = thenableState;

            if (!thenableStateDev.didWarnAboutUncachedPromise) {
              // We should only warn the first time an uncached thenable is
              // discovered per component, because if there are multiple, the
              // subsequent ones are likely derived from the first.
              //
              // We track this on the thenableState instead of deduping using the
              // component name like we usually do, because in the case of a
              // promise-as-React-node, the owner component is likely different from
              // the parent that's currently being reconciled. We'd have to track
              // the owner using state, which we're trying to move away from. Though
              // since this is dev-only, maybe that'd be OK.
              //
              // However, another benefit of doing it this way is we might
              // eventually have a thenableState per memo/Forget boundary instead
              // of per component, so this would allow us to have more
              // granular warnings.
              thenableStateDev.didWarnAboutUncachedPromise = true; // TODO: This warning should link to a corresponding docs page.

              error(
                "A component was suspended by an uncached promise. Creating " +
                  "promises inside a Client Component or hook is not yet " +
                  "supported, except via a Suspense-compatible library or framework."
              );
            }
          } // Avoid an unhandled rejection errors for the Promises that we'll
          // intentionally ignore.

          thenable.then(noop, noop);
          thenable = previous;
        }
      } // We use an expando to track the status and result of a thenable so that we
      // can synchronously unwrap the value. Think of this as an extension of the
      // Promise API, or a custom interface that is a superset of Thenable.
      //
      // If the thenable doesn't have a status, set it to "pending" and attach
      // a listener that will update its status and result when it resolves.

      switch (thenable.status) {
        case "fulfilled": {
          var fulfilledValue = thenable.value;
          return fulfilledValue;
        }

        case "rejected": {
          var rejectedError = thenable.reason;
          checkIfUseWrappedInAsyncCatch(rejectedError);
          throw rejectedError;
        }

        default: {
          if (typeof thenable.status === "string") {
            // Only instrument the thenable if the status if not defined. If
            // it's defined, but an unknown value, assume it's been instrumented by
            // some custom userspace implementation. We treat it as "pending".
            // Attach a dummy listener, to ensure that any lazy initialization can
            // happen. Flight lazily parses JSON when the value is actually awaited.
            thenable.then(noop, noop);
          } else {
            // This is an uncached thenable that we haven't seen before.
            // Detect infinite ping loops caused by uncached promises.
            var root = getWorkInProgressRoot();

            if (root !== null && root.shellSuspendCounter > 100) {
              // This root has suspended repeatedly in the shell without making any
              // progress (i.e. committing something). This is highly suggestive of
              // an infinite ping loop, often caused by an accidental Async Client
              // Component.
              //
              // During a transition, we can suspend the work loop until the promise
              // to resolve, but this is a sync render, so that's not an option. We
              // also can't show a fallback, because none was provided. So our last
              // resort is to throw an error.
              //
              // TODO: Remove this error in a future release. Other ways of handling
              // this case include forcing a concurrent render, or putting the whole
              // root into offscreen mode.
              throw new Error(
                "async/await is not yet supported in Client Components, only " +
                  "Server Components. This error is often caused by accidentally " +
                  "adding `'use client'` to a module that was originally written " +
                  "for the server."
              );
            }

            var pendingThenable = thenable;
            pendingThenable.status = "pending";
            pendingThenable.then(
              function (fulfilledValue) {
                if (thenable.status === "pending") {
                  var fulfilledThenable = thenable;
                  fulfilledThenable.status = "fulfilled";
                  fulfilledThenable.value = fulfilledValue;
                }
              },
              function (error) {
                if (thenable.status === "pending") {
                  var rejectedThenable = thenable;
                  rejectedThenable.status = "rejected";
                  rejectedThenable.reason = error;
                }
              }
            );
          } // Check one more time in case the thenable resolved synchronously.

          switch (thenable.status) {
            case "fulfilled": {
              var fulfilledThenable = thenable;
              return fulfilledThenable.value;
            }

            case "rejected": {
              var rejectedThenable = thenable;
              var _rejectedError = rejectedThenable.reason;
              checkIfUseWrappedInAsyncCatch(_rejectedError);
              throw _rejectedError;
            }
          } // Suspend.
          //
          // Throwing here is an implementation detail that allows us to unwind the
          // call stack. But we shouldn't allow it to leak into userspace. Throw an
          // opaque placeholder value instead of the actual thenable. If it doesn't
          // get captured by the work loop, log a warning, because that means
          // something in userspace must have caught it.

          suspendedThenable = thenable;

          {
            needsToResetSuspendedThenableDEV = true;
          }

          throw SuspenseException;
        }
      }
    }
    // passed to the rest of the Suspense implementation — which, for historical
    // reasons, expects to receive a thenable.

    var suspendedThenable = null;
    var needsToResetSuspendedThenableDEV = false;
    function getSuspendedThenable() {
      // This is called right after `use` suspends by throwing an exception. `use`
      // throws an opaque value instead of the thenable itself so that it can't be
      // caught in userspace. Then the work loop accesses the actual thenable using
      // this function.
      if (suspendedThenable === null) {
        throw new Error(
          "Expected a suspended thenable. This is a bug in React. Please file " +
            "an issue."
        );
      }

      var thenable = suspendedThenable;
      suspendedThenable = null;

      {
        needsToResetSuspendedThenableDEV = false;
      }

      return thenable;
    }
    function checkIfUseWrappedInTryCatch() {
      {
        // This was set right before SuspenseException was thrown, and it should
        // have been cleared when the exception was handled. If it wasn't,
        // it must have been caught by userspace.
        if (needsToResetSuspendedThenableDEV) {
          needsToResetSuspendedThenableDEV = false;
          return true;
        }
      }

      return false;
    }
    function checkIfUseWrappedInAsyncCatch(rejectedReason) {
      // This check runs in prod, too, because it prevents a more confusing
      // downstream error, where SuspenseException is caught by a promise and
      // thrown asynchronously.
      // TODO: Another way to prevent SuspenseException from leaking into an async
      // execution context is to check the dispatcher every time `use` is called,
      // or some equivalent. That might be preferable for other reasons, too, since
      // it matches how we prevent similar mistakes for other hooks.
      if (rejectedReason === SuspenseException) {
        throw new Error(
          "Hooks are not supported inside an async component. This " +
            "error is often caused by accidentally adding `'use client'` " +
            "to a module that was originally written for the server."
        );
      }
    }

    var thenableState$1 = null;
    var thenableIndexCounter$1 = 0;

    function mergeDebugInfo(outer, inner) {
      if (inner == null) {
        return outer;
      } else if (outer === null) {
        return inner;
      } else {
        // If we have two debugInfo, we need to create a new one. This makes the array no longer
        // live so we'll miss any future updates if we received more so ideally we should always
        // do this after both have fully resolved/unsuspended.
        return outer.concat(inner);
      }
    }

    var didWarnAboutMaps;
    var didWarnAboutGenerators;
    var didWarnAboutStringRefs;
    var ownerHasKeyUseWarning;
    var ownerHasFunctionTypeWarning;
    var ownerHasSymbolTypeWarning;

    var warnForMissingKey = function (child, returnFiber) {};

    {
      didWarnAboutMaps = false;
      didWarnAboutGenerators = false;
      didWarnAboutStringRefs = {};
      /**
       * Warn if there's no key explicitly set on dynamic arrays of children or
       * object keys are not valid. This allows us to keep track of children between
       * updates.
       */

      ownerHasKeyUseWarning = {};
      ownerHasFunctionTypeWarning = {};
      ownerHasSymbolTypeWarning = {};

      warnForMissingKey = function (child, returnFiber) {
        if (child === null || typeof child !== "object") {
          return;
        }

        if (!child._store || child._store.validated || child.key != null) {
          return;
        }

        if (typeof child._store !== "object") {
          throw new Error(
            "React Component in warnForMissingKey should have a _store. " +
              "This error is likely caused by a bug in React. Please file an issue."
          );
        } // $FlowFixMe[cannot-write] unable to narrow type from mixed to writable object

        child._store.validated = true;
        var componentName =
          getComponentNameFromFiber(returnFiber) || "Component";

        if (ownerHasKeyUseWarning[componentName]) {
          return;
        }

        ownerHasKeyUseWarning[componentName] = true;

        error(
          "Each child in a list should have a unique " +
            '"key" prop. See https://react.dev/link/warning-keys for ' +
            "more information."
        );
      };
    }

    function isReactClass(type) {
      return type.prototype && type.prototype.isReactComponent;
    }

    function unwrapThenable(thenable) {
      var index = thenableIndexCounter$1;
      thenableIndexCounter$1 += 1;

      if (thenableState$1 === null) {
        thenableState$1 = createThenableState();
      }

      return trackUsedThenable(thenableState$1, thenable, index);
    }

    function convertStringRefToCallbackRef(
      returnFiber,
      current,
      element,
      mixedRef
    ) {
      {
        checkPropStringCoercion(mixedRef, "ref");
      }

      var stringRef = "" + mixedRef;
      var owner = element._owner;

      if (!owner) {
        throw new Error(
          "Element ref was specified as a string (" +
            stringRef +
            ") but no owner was set. This could happen for one of" +
            " the following reasons:\n" +
            "1. You may be adding a ref to a function component\n" +
            "2. You may be adding a ref to a component that was not created inside a component's render method\n" +
            "3. You have multiple copies of React loaded\n" +
            "See https://react.dev/link/refs-must-have-owner for more information."
        );
      }

      if (owner.tag !== ClassComponent) {
        throw new Error(
          "Function components cannot have string refs. " +
            "We recommend using useRef() instead. " +
            "Learn more about using refs safely here: " +
            "https://react.dev/link/strict-mode-string-ref"
        );
      }

      {
        if (
          // Will already warn with "Function components cannot be given refs"
          !(typeof element.type === "function" && !isReactClass(element.type))
        ) {
          var componentName =
            getComponentNameFromFiber(returnFiber) || "Component";

          if (!didWarnAboutStringRefs[componentName]) {
            error(
              'Component "%s" contains the string ref "%s". Support for string refs ' +
                "will be removed in a future major release. We recommend using " +
                "useRef() or createRef() instead. " +
                "Learn more about using refs safely here: " +
                "https://react.dev/link/strict-mode-string-ref",
              componentName,
              stringRef
            );

            didWarnAboutStringRefs[componentName] = true;
          }
        }
      }

      var inst = owner.stateNode;

      if (!inst) {
        throw new Error(
          "Missing owner for string ref " +
            stringRef +
            ". This error is likely caused by a " +
            "bug in React. Please file an issue."
        );
      } // Check if previous string ref matches new string ref

      if (
        current !== null &&
        current.ref !== null &&
        typeof current.ref === "function" &&
        current.ref._stringRef === stringRef
      ) {
        // Reuse the existing string ref
        var currentRef = current.ref;
        return currentRef;
      } // Create a new string ref

      var ref = function (value) {
        var refs = inst.refs;

        if (value === null) {
          delete refs[stringRef];
        } else {
          refs[stringRef] = value;
        }
      };

      ref._stringRef = stringRef;
      return ref;
    }

    function coerceRef(returnFiber, current, workInProgress, element) {
      var mixedRef;

      {
        // Old behavior.
        mixedRef = element.ref;
      }

      var coercedRef;

      if (
        typeof mixedRef === "string" ||
        typeof mixedRef === "number" ||
        typeof mixedRef === "boolean"
      ) {
        coercedRef = convertStringRefToCallbackRef(
          returnFiber,
          current,
          element,
          mixedRef
        );
      } else {
        coercedRef = mixedRef;
      } // TODO: If enableRefAsProp is on, we shouldn't use the `ref` field. We
      // should always read the ref from the prop.

      workInProgress.ref = coercedRef;
    }

    function throwOnInvalidObjectType(returnFiber, newChild) {
      // $FlowFixMe[method-unbinding]
      var childString = Object.prototype.toString.call(newChild);
      throw new Error(
        "Objects are not valid as a React child (found: " +
          (childString === "[object Object]"
            ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
            : childString) +
          "). " +
          "If you meant to render a collection of children, use an array " +
          "instead."
      );
    }

    function warnOnFunctionType(returnFiber, invalidChild) {
      {
        var parentName = getComponentNameFromFiber(returnFiber) || "Component";

        if (ownerHasFunctionTypeWarning[parentName]) {
          return;
        }

        ownerHasFunctionTypeWarning[parentName] = true;
        var name = invalidChild.displayName || invalidChild.name || "Component";

        if (returnFiber.tag === HostRoot) {
          error(
            "Functions are not valid as a React child. This may happen if " +
              "you return %s instead of <%s /> from render. " +
              "Or maybe you meant to call this function rather than return it.\n" +
              "  root.render(%s)",
            name,
            name,
            name
          );
        } else {
          error(
            "Functions are not valid as a React child. This may happen if " +
              "you return %s instead of <%s /> from render. " +
              "Or maybe you meant to call this function rather than return it.\n" +
              "  <%s>{%s}</%s>",
            name,
            name,
            parentName,
            name,
            parentName
          );
        }
      }
    }

    function warnOnSymbolType(returnFiber, invalidChild) {
      {
        var parentName = getComponentNameFromFiber(returnFiber) || "Component";

        if (ownerHasSymbolTypeWarning[parentName]) {
          return;
        }

        ownerHasSymbolTypeWarning[parentName] = true; // eslint-disable-next-line react-internal/safe-string-coercion

        var name = String(invalidChild);

        if (returnFiber.tag === HostRoot) {
          error(
            "Symbols are not valid as a React child.\n" + "  root.render(%s)",
            name
          );
        } else {
          error(
            "Symbols are not valid as a React child.\n" + "  <%s>%s</%s>",
            parentName,
            name,
            parentName
          );
        }
      }
    }

    function resolveLazy(lazyType) {
      var payload = lazyType._payload;
      var init = lazyType._init;
      return init(payload);
    } // This wrapper function exists because I expect to clone the code in each path
    // to be able to optimize each path individually by branching early. This needs
    // a compiler or we can do it manually. Helpers that don't need this branching
    // live outside of this function.

    function createChildReconciler(shouldTrackSideEffects) {
      function deleteChild(returnFiber, childToDelete) {
        if (!shouldTrackSideEffects) {
          // Noop.
          return;
        }

        var deletions = returnFiber.deletions;

        if (deletions === null) {
          returnFiber.deletions = [childToDelete];
          returnFiber.flags |= ChildDeletion;
        } else {
          deletions.push(childToDelete);
        }
      }

      function deleteRemainingChildren(returnFiber, currentFirstChild) {
        if (!shouldTrackSideEffects) {
          // Noop.
          return null;
        } // TODO: For the shouldClone case, this could be micro-optimized a bit by
        // assuming that after the first child we've already added everything.

        var childToDelete = currentFirstChild;

        while (childToDelete !== null) {
          deleteChild(returnFiber, childToDelete);
          childToDelete = childToDelete.sibling;
        }

        return null;
      }

      function mapRemainingChildren(currentFirstChild) {
        // Add the remaining children to a temporary map so that we can find them by
        // keys quickly. Implicit (null) keys get added to this set with their index
        // instead.
        var existingChildren = new Map();
        var existingChild = currentFirstChild;

        while (existingChild !== null) {
          if (existingChild.key !== null) {
            existingChildren.set(existingChild.key, existingChild);
          } else {
            existingChildren.set(existingChild.index, existingChild);
          }

          existingChild = existingChild.sibling;
        }

        return existingChildren;
      }

      function useFiber(fiber, pendingProps) {
        // We currently set sibling to null and index to 0 here because it is easy
        // to forget to do before returning it. E.g. for the single child case.
        var clone = createWorkInProgress(fiber, pendingProps);
        clone.index = 0;
        clone.sibling = null;
        return clone;
      }

      function placeChild(newFiber, lastPlacedIndex, newIndex) {
        newFiber.index = newIndex;

        if (!shouldTrackSideEffects) {
          // During hydration, the useId algorithm needs to know which fibers are
          // part of a list of children (arrays, iterators).
          newFiber.flags |= Forked;
          return lastPlacedIndex;
        }

        var current = newFiber.alternate;

        if (current !== null) {
          var oldIndex = current.index;

          if (oldIndex < lastPlacedIndex) {
            // This is a move.
            newFiber.flags |= Placement | PlacementDEV;
            return lastPlacedIndex;
          } else {
            // This item can stay in place.
            return oldIndex;
          }
        } else {
          // This is an insertion.
          newFiber.flags |= Placement | PlacementDEV;
          return lastPlacedIndex;
        }
      }

      function placeSingleChild(newFiber) {
        // This is simpler for the single child case. We only need to do a
        // placement for inserting new children.
        if (shouldTrackSideEffects && newFiber.alternate === null) {
          newFiber.flags |= Placement | PlacementDEV;
        }

        return newFiber;
      }

      function updateTextNode(
        returnFiber,
        current,
        textContent,
        lanes,
        debugInfo
      ) {
        if (current === null || current.tag !== HostText) {
          // Insert
          var created = createFiberFromText(
            textContent,
            returnFiber.mode,
            lanes
          );
          created.return = returnFiber;

          {
            created._debugInfo = debugInfo;
          }

          return created;
        } else {
          // Update
          var existing = useFiber(current, textContent);
          existing.return = returnFiber;

          {
            existing._debugInfo = debugInfo;
          }

          return existing;
        }
      }

      function updateElement(returnFiber, current, element, lanes, debugInfo) {
        var elementType = element.type;

        if (elementType === REACT_FRAGMENT_TYPE) {
          return updateFragment(
            returnFiber,
            current,
            element.props.children,
            lanes,
            element.key,
            debugInfo
          );
        }

        if (current !== null) {
          if (
            current.elementType === elementType || // Keep this check inline so it only runs on the false path:
            isCompatibleFamilyForHotReloading(current, element) || // Lazy types should reconcile their resolved type.
            // We need to do this after the Hot Reloading check above,
            // because hot reloading has different semantics than prod because
            // it doesn't resuspend. So we can't let the call below suspend.
            (typeof elementType === "object" &&
              elementType !== null &&
              elementType.$$typeof === REACT_LAZY_TYPE &&
              resolveLazy(elementType) === current.type)
          ) {
            // Move based on index
            var existing = useFiber(current, element.props);
            coerceRef(returnFiber, current, existing, element);
            existing.return = returnFiber;

            {
              existing._debugOwner = element._owner;
              existing._debugInfo = debugInfo;
            }

            return existing;
          }
        } // Insert

        var created = createFiberFromElement(element, returnFiber.mode, lanes);
        coerceRef(returnFiber, current, created, element);
        created.return = returnFiber;

        {
          created._debugInfo = debugInfo;
        }

        return created;
      }

      function updatePortal(returnFiber, current, portal, lanes, debugInfo) {
        if (
          current === null ||
          current.tag !== HostPortal ||
          current.stateNode.containerInfo !== portal.containerInfo ||
          current.stateNode.implementation !== portal.implementation
        ) {
          // Insert
          var created = createFiberFromPortal(portal, returnFiber.mode, lanes);
          created.return = returnFiber;

          {
            created._debugInfo = debugInfo;
          }

          return created;
        } else {
          // Update
          var existing = useFiber(current, portal.children || []);
          existing.return = returnFiber;

          {
            existing._debugInfo = debugInfo;
          }

          return existing;
        }
      }

      function updateFragment(
        returnFiber,
        current,
        fragment,
        lanes,
        key,
        debugInfo
      ) {
        if (current === null || current.tag !== Fragment) {
          // Insert
          var created = createFiberFromFragment(
            fragment,
            returnFiber.mode,
            lanes,
            key
          );
          created.return = returnFiber;

          {
            created._debugInfo = debugInfo;
          }

          return created;
        } else {
          // Update
          var existing = useFiber(current, fragment);
          existing.return = returnFiber;

          {
            existing._debugInfo = debugInfo;
          }

          return existing;
        }
      }

      function createChild(returnFiber, newChild, lanes, debugInfo) {
        if (
          (typeof newChild === "string" && newChild !== "") ||
          typeof newChild === "number" ||
          enableBigIntSupport
        ) {
          // Text nodes don't have keys. If the previous node is implicitly keyed
          // we can continue to replace it without aborting even if it is not a text
          // node.
          var created = createFiberFromText(
            // $FlowFixMe[unsafe-addition] Flow doesn't want us to use `+` operator with string and bigint
            "" + newChild,
            returnFiber.mode,
            lanes
          );
          created.return = returnFiber;

          {
            created._debugInfo = debugInfo;
          }

          return created;
        }

        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE: {
              var _created = createFiberFromElement(
                newChild,
                returnFiber.mode,
                lanes
              );

              coerceRef(returnFiber, null, _created, newChild);
              _created.return = returnFiber;

              {
                _created._debugInfo = mergeDebugInfo(
                  debugInfo,
                  newChild._debugInfo
                );
              }

              return _created;
            }

            case REACT_PORTAL_TYPE: {
              var _created2 = createFiberFromPortal(
                newChild,
                returnFiber.mode,
                lanes
              );

              _created2.return = returnFiber;

              {
                _created2._debugInfo = debugInfo;
              }

              return _created2;
            }

            case REACT_LAZY_TYPE: {
              var payload = newChild._payload;
              var init = newChild._init;
              return createChild(
                returnFiber,
                init(payload),
                lanes,
                mergeDebugInfo(debugInfo, newChild._debugInfo) // call merge after init
              );
            }
          }

          if (isArray(newChild) || getIteratorFn(newChild)) {
            var _created3 = createFiberFromFragment(
              newChild,
              returnFiber.mode,
              lanes,
              null
            );

            _created3.return = returnFiber;

            {
              _created3._debugInfo = mergeDebugInfo(
                debugInfo,
                newChild._debugInfo
              );
            }

            return _created3;
          } // Usable node types
          //
          // Unwrap the inner value and recursively call this function again.

          if (typeof newChild.then === "function") {
            var thenable = newChild;
            return createChild(
              returnFiber,
              unwrapThenable(thenable),
              lanes,
              mergeDebugInfo(debugInfo, newChild._debugInfo)
            );
          }

          if (newChild.$$typeof === REACT_CONTEXT_TYPE) {
            var context = newChild;
            return createChild(
              returnFiber,
              readContextDuringReconciliation(returnFiber, context, lanes),
              lanes,
              debugInfo
            );
          }

          throwOnInvalidObjectType(returnFiber, newChild);
        }

        {
          if (typeof newChild === "function") {
            warnOnFunctionType(returnFiber, newChild);
          }

          if (typeof newChild === "symbol") {
            warnOnSymbolType(returnFiber, newChild);
          }
        }

        return null;
      }

      function updateSlot(returnFiber, oldFiber, newChild, lanes, debugInfo) {
        // Update the fiber if the keys match, otherwise return null.
        var key = oldFiber !== null ? oldFiber.key : null;

        if (
          (typeof newChild === "string" && newChild !== "") ||
          typeof newChild === "number" ||
          enableBigIntSupport
        ) {
          // Text nodes don't have keys. If the previous node is implicitly keyed
          // we can continue to replace it without aborting even if it is not a text
          // node.
          if (key !== null) {
            return null;
          }

          return updateTextNode(
            returnFiber,
            oldFiber, // $FlowFixMe[unsafe-addition] Flow doesn't want us to use `+` operator with string and bigint
            "" + newChild,
            lanes,
            debugInfo
          );
        }

        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE: {
              if (newChild.key === key) {
                return updateElement(
                  returnFiber,
                  oldFiber,
                  newChild,
                  lanes,
                  mergeDebugInfo(debugInfo, newChild._debugInfo)
                );
              } else {
                return null;
              }
            }

            case REACT_PORTAL_TYPE: {
              if (newChild.key === key) {
                return updatePortal(
                  returnFiber,
                  oldFiber,
                  newChild,
                  lanes,
                  debugInfo
                );
              } else {
                return null;
              }
            }

            case REACT_LAZY_TYPE: {
              var payload = newChild._payload;
              var init = newChild._init;
              return updateSlot(
                returnFiber,
                oldFiber,
                init(payload),
                lanes,
                mergeDebugInfo(debugInfo, newChild._debugInfo)
              );
            }
          }

          if (isArray(newChild) || getIteratorFn(newChild)) {
            if (key !== null) {
              return null;
            }

            return updateFragment(
              returnFiber,
              oldFiber,
              newChild,
              lanes,
              null,
              mergeDebugInfo(debugInfo, newChild._debugInfo)
            );
          } // Usable node types
          //
          // Unwrap the inner value and recursively call this function again.

          if (typeof newChild.then === "function") {
            var thenable = newChild;
            return updateSlot(
              returnFiber,
              oldFiber,
              unwrapThenable(thenable),
              lanes,
              debugInfo
            );
          }

          if (newChild.$$typeof === REACT_CONTEXT_TYPE) {
            var context = newChild;
            return updateSlot(
              returnFiber,
              oldFiber,
              readContextDuringReconciliation(returnFiber, context, lanes),
              lanes,
              debugInfo
            );
          }

          throwOnInvalidObjectType(returnFiber, newChild);
        }

        {
          if (typeof newChild === "function") {
            warnOnFunctionType(returnFiber, newChild);
          }

          if (typeof newChild === "symbol") {
            warnOnSymbolType(returnFiber, newChild);
          }
        }

        return null;
      }

      function updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChild,
        lanes,
        debugInfo
      ) {
        if (
          (typeof newChild === "string" && newChild !== "") ||
          typeof newChild === "number" ||
          enableBigIntSupport
        ) {
          // Text nodes don't have keys, so we neither have to check the old nor
          // new node for the key. If both are text nodes, they match.
          var matchedFiber = existingChildren.get(newIdx) || null;
          return updateTextNode(
            returnFiber,
            matchedFiber, // $FlowFixMe[unsafe-addition] Flow doesn't want us to use `+` operator with string and bigint
            "" + newChild,
            lanes,
            debugInfo
          );
        }

        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE: {
              var _matchedFiber =
                existingChildren.get(
                  newChild.key === null ? newIdx : newChild.key
                ) || null;

              return updateElement(
                returnFiber,
                _matchedFiber,
                newChild,
                lanes,
                mergeDebugInfo(debugInfo, newChild._debugInfo)
              );
            }

            case REACT_PORTAL_TYPE: {
              var _matchedFiber2 =
                existingChildren.get(
                  newChild.key === null ? newIdx : newChild.key
                ) || null;

              return updatePortal(
                returnFiber,
                _matchedFiber2,
                newChild,
                lanes,
                debugInfo
              );
            }

            case REACT_LAZY_TYPE:
              var payload = newChild._payload;
              var init = newChild._init;
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                init(payload),
                lanes,
                mergeDebugInfo(debugInfo, newChild._debugInfo)
              );
          }

          if (isArray(newChild) || getIteratorFn(newChild)) {
            var _matchedFiber3 = existingChildren.get(newIdx) || null;

            return updateFragment(
              returnFiber,
              _matchedFiber3,
              newChild,
              lanes,
              null,
              mergeDebugInfo(debugInfo, newChild._debugInfo)
            );
          } // Usable node types
          //
          // Unwrap the inner value and recursively call this function again.

          if (typeof newChild.then === "function") {
            var thenable = newChild;
            return updateFromMap(
              existingChildren,
              returnFiber,
              newIdx,
              unwrapThenable(thenable),
              lanes,
              debugInfo
            );
          }

          if (newChild.$$typeof === REACT_CONTEXT_TYPE) {
            var context = newChild;
            return updateFromMap(
              existingChildren,
              returnFiber,
              newIdx,
              readContextDuringReconciliation(returnFiber, context, lanes),
              lanes,
              debugInfo
            );
          }

          throwOnInvalidObjectType(returnFiber, newChild);
        }

        {
          if (typeof newChild === "function") {
            warnOnFunctionType(returnFiber, newChild);
          }

          if (typeof newChild === "symbol") {
            warnOnSymbolType(returnFiber, newChild);
          }
        }

        return null;
      }
      /**
       * Warns if there is a duplicate or missing key
       */

      function warnOnInvalidKey(child, knownKeys, returnFiber) {
        {
          if (typeof child !== "object" || child === null) {
            return knownKeys;
          }

          switch (child.$$typeof) {
            case REACT_ELEMENT_TYPE:
            case REACT_PORTAL_TYPE:
              warnForMissingKey(child, returnFiber);
              var key = child.key;

              if (typeof key !== "string") {
                break;
              }

              if (knownKeys === null) {
                knownKeys = new Set();
                knownKeys.add(key);
                break;
              }

              if (!knownKeys.has(key)) {
                knownKeys.add(key);
                break;
              }

              error(
                "Encountered two children with the same key, `%s`. " +
                  "Keys should be unique so that components maintain their identity " +
                  "across updates. Non-unique keys may cause children to be " +
                  "duplicated and/or omitted — the behavior is unsupported and " +
                  "could change in a future version.",
                key
              );

              break;

            case REACT_LAZY_TYPE:
              var payload = child._payload;
              var init = child._init;
              warnOnInvalidKey(init(payload), knownKeys, returnFiber);
              break;
          }
        }

        return knownKeys;
      }

      function reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChildren,
        lanes,
        debugInfo
      ) {
        // This algorithm can't optimize by searching from both ends since we
        // don't have backpointers on fibers. I'm trying to see how far we can get
        // with that model. If it ends up not being worth the tradeoffs, we can
        // add it later.
        // Even with a two ended optimization, we'd want to optimize for the case
        // where there are few changes and brute force the comparison instead of
        // going for the Map. It'd like to explore hitting that path first in
        // forward-only mode and only go for the Map once we notice that we need
        // lots of look ahead. This doesn't handle reversal as well as two ended
        // search but that's unusual. Besides, for the two ended optimization to
        // work on Iterables, we'd need to copy the whole set.
        // In this first iteration, we'll just live with hitting the bad case
        // (adding everything to a Map) in for every insert/move.
        // If you change this code, also update reconcileChildrenIterator() which
        // uses the same algorithm.
        {
          // First, validate keys.
          var knownKeys = null;

          for (var i = 0; i < newChildren.length; i++) {
            var child = newChildren[i];
            knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
          }
        }

        var resultingFirstChild = null;
        var previousNewFiber = null;
        var oldFiber = currentFirstChild;
        var lastPlacedIndex = 0;
        var newIdx = 0;
        var nextOldFiber = null;

        for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
          if (oldFiber.index > newIdx) {
            nextOldFiber = oldFiber;
            oldFiber = null;
          } else {
            nextOldFiber = oldFiber.sibling;
          }

          var newFiber = updateSlot(
            returnFiber,
            oldFiber,
            newChildren[newIdx],
            lanes,
            debugInfo
          );

          if (newFiber === null) {
            // TODO: This breaks on empty slots like null children. That's
            // unfortunate because it triggers the slow path all the time. We need
            // a better way to communicate whether this was a miss or null,
            // boolean, undefined, etc.
            if (oldFiber === null) {
              oldFiber = nextOldFiber;
            }

            break;
          }

          if (shouldTrackSideEffects) {
            if (oldFiber && newFiber.alternate === null) {
              // We matched the slot, but we didn't reuse the existing fiber, so we
              // need to delete the existing child.
              deleteChild(returnFiber, oldFiber);
            }
          }

          lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

          if (previousNewFiber === null) {
            // TODO: Move out of the loop. This only happens for the first run.
            resultingFirstChild = newFiber;
          } else {
            // TODO: Defer siblings if we're not at the right index for this slot.
            // I.e. if we had null values before, then we want to defer this
            // for each null value. However, we also don't want to call updateSlot
            // with the previous one.
            previousNewFiber.sibling = newFiber;
          }

          previousNewFiber = newFiber;
          oldFiber = nextOldFiber;
        }

        if (newIdx === newChildren.length) {
          // We've reached the end of the new children. We can delete the rest.
          deleteRemainingChildren(returnFiber, oldFiber);

          return resultingFirstChild;
        }

        if (oldFiber === null) {
          // If we don't have any more existing children we can choose a fast path
          // since the rest will all be insertions.
          for (; newIdx < newChildren.length; newIdx++) {
            var _newFiber = createChild(
              returnFiber,
              newChildren[newIdx],
              lanes,
              debugInfo
            );

            if (_newFiber === null) {
              continue;
            }

            lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);

            if (previousNewFiber === null) {
              // TODO: Move out of the loop. This only happens for the first run.
              resultingFirstChild = _newFiber;
            } else {
              previousNewFiber.sibling = _newFiber;
            }

            previousNewFiber = _newFiber;
          }

          return resultingFirstChild;
        } // Add all children to a key map for quick lookups.

        var existingChildren = mapRemainingChildren(oldFiber); // Keep scanning and use the map to restore deleted items as moves.

        for (; newIdx < newChildren.length; newIdx++) {
          var _newFiber2 = updateFromMap(
            existingChildren,
            returnFiber,
            newIdx,
            newChildren[newIdx],
            lanes,
            debugInfo
          );

          if (_newFiber2 !== null) {
            if (shouldTrackSideEffects) {
              if (_newFiber2.alternate !== null) {
                // The new fiber is a work in progress, but if there exists a
                // current, that means that we reused the fiber. We need to delete
                // it from the child list so that we don't add it to the deletion
                // list.
                existingChildren.delete(
                  _newFiber2.key === null ? newIdx : _newFiber2.key
                );
              }
            }

            lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);

            if (previousNewFiber === null) {
              resultingFirstChild = _newFiber2;
            } else {
              previousNewFiber.sibling = _newFiber2;
            }

            previousNewFiber = _newFiber2;
          }
        }

        if (shouldTrackSideEffects) {
          // Any existing children that weren't consumed above were deleted. We need
          // to add them to the deletion list.
          existingChildren.forEach(function (child) {
            return deleteChild(returnFiber, child);
          });
        }

        return resultingFirstChild;
      }

      function reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChildrenIterable,
        lanes,
        debugInfo
      ) {
        // This is the same implementation as reconcileChildrenArray(),
        // but using the iterator instead.
        var iteratorFn = getIteratorFn(newChildrenIterable);

        if (typeof iteratorFn !== "function") {
          throw new Error(
            "An object is not an iterable. This error is likely caused by a bug in " +
              "React. Please file an issue."
          );
        }

        {
          // We don't support rendering Generators because it's a mutation.
          // See https://github.com/facebook/react/issues/12995
          if (
            typeof Symbol === "function" && // $FlowFixMe[prop-missing] Flow doesn't know about toStringTag
            newChildrenIterable[Symbol.toStringTag] === "Generator"
          ) {
            if (!didWarnAboutGenerators) {
              error(
                "Using Generators as children is unsupported and will likely yield " +
                  "unexpected results because enumerating a generator mutates it. " +
                  "You may convert it to an array with `Array.from()` or the " +
                  "`[...spread]` operator before rendering. Keep in mind " +
                  "you might need to polyfill these features for older browsers."
              );
            }

            didWarnAboutGenerators = true;
          } // Warn about using Maps as children

          if (newChildrenIterable.entries === iteratorFn) {
            if (!didWarnAboutMaps) {
              error(
                "Using Maps as children is not supported. " +
                  "Use an array of keyed ReactElements instead."
              );
            }

            didWarnAboutMaps = true;
          } // First, validate keys.
          // We'll get a different iterator later for the main pass.

          var _newChildren = iteratorFn.call(newChildrenIterable);

          if (_newChildren) {
            var knownKeys = null;

            var _step = _newChildren.next();

            for (; !_step.done; _step = _newChildren.next()) {
              var child = _step.value;
              knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
            }
          }
        }

        var newChildren = iteratorFn.call(newChildrenIterable);

        if (newChildren == null) {
          throw new Error("An iterable object provided no iterator.");
        }

        var resultingFirstChild = null;
        var previousNewFiber = null;
        var oldFiber = currentFirstChild;
        var lastPlacedIndex = 0;
        var newIdx = 0;
        var nextOldFiber = null;
        var step = newChildren.next();

        for (
          ;
          oldFiber !== null && !step.done;
          newIdx++, step = newChildren.next()
        ) {
          if (oldFiber.index > newIdx) {
            nextOldFiber = oldFiber;
            oldFiber = null;
          } else {
            nextOldFiber = oldFiber.sibling;
          }

          var newFiber = updateSlot(
            returnFiber,
            oldFiber,
            step.value,
            lanes,
            debugInfo
          );

          if (newFiber === null) {
            // TODO: This breaks on empty slots like null children. That's
            // unfortunate because it triggers the slow path all the time. We need
            // a better way to communicate whether this was a miss or null,
            // boolean, undefined, etc.
            if (oldFiber === null) {
              oldFiber = nextOldFiber;
            }

            break;
          }

          if (shouldTrackSideEffects) {
            if (oldFiber && newFiber.alternate === null) {
              // We matched the slot, but we didn't reuse the existing fiber, so we
              // need to delete the existing child.
              deleteChild(returnFiber, oldFiber);
            }
          }

          lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

          if (previousNewFiber === null) {
            // TODO: Move out of the loop. This only happens for the first run.
            resultingFirstChild = newFiber;
          } else {
            // TODO: Defer siblings if we're not at the right index for this slot.
            // I.e. if we had null values before, then we want to defer this
            // for each null value. However, we also don't want to call updateSlot
            // with the previous one.
            previousNewFiber.sibling = newFiber;
          }

          previousNewFiber = newFiber;
          oldFiber = nextOldFiber;
        }

        if (step.done) {
          // We've reached the end of the new children. We can delete the rest.
          deleteRemainingChildren(returnFiber, oldFiber);

          return resultingFirstChild;
        }

        if (oldFiber === null) {
          // If we don't have any more existing children we can choose a fast path
          // since the rest will all be insertions.
          for (; !step.done; newIdx++, step = newChildren.next()) {
            var _newFiber3 = createChild(
              returnFiber,
              step.value,
              lanes,
              debugInfo
            );

            if (_newFiber3 === null) {
              continue;
            }

            lastPlacedIndex = placeChild(_newFiber3, lastPlacedIndex, newIdx);

            if (previousNewFiber === null) {
              // TODO: Move out of the loop. This only happens for the first run.
              resultingFirstChild = _newFiber3;
            } else {
              previousNewFiber.sibling = _newFiber3;
            }

            previousNewFiber = _newFiber3;
          }

          return resultingFirstChild;
        } // Add all children to a key map for quick lookups.

        var existingChildren = mapRemainingChildren(oldFiber); // Keep scanning and use the map to restore deleted items as moves.

        for (; !step.done; newIdx++, step = newChildren.next()) {
          var _newFiber4 = updateFromMap(
            existingChildren,
            returnFiber,
            newIdx,
            step.value,
            lanes,
            debugInfo
          );

          if (_newFiber4 !== null) {
            if (shouldTrackSideEffects) {
              if (_newFiber4.alternate !== null) {
                // The new fiber is a work in progress, but if there exists a
                // current, that means that we reused the fiber. We need to delete
                // it from the child list so that we don't add it to the deletion
                // list.
                existingChildren.delete(
                  _newFiber4.key === null ? newIdx : _newFiber4.key
                );
              }
            }

            lastPlacedIndex = placeChild(_newFiber4, lastPlacedIndex, newIdx);

            if (previousNewFiber === null) {
              resultingFirstChild = _newFiber4;
            } else {
              previousNewFiber.sibling = _newFiber4;
            }

            previousNewFiber = _newFiber4;
          }
        }

        if (shouldTrackSideEffects) {
          // Any existing children that weren't consumed above were deleted. We need
          // to add them to the deletion list.
          existingChildren.forEach(function (child) {
            return deleteChild(returnFiber, child);
          });
        }

        return resultingFirstChild;
      }

      function reconcileSingleTextNode(
        returnFiber,
        currentFirstChild,
        textContent,
        lanes
      ) {
        // There's no need to check for keys on text nodes since we don't have a
        // way to define them.
        if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
          // We already have an existing node so let's just update it and delete
          // the rest.
          deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
          var existing = useFiber(currentFirstChild, textContent);
          existing.return = returnFiber;
          return existing;
        } // The existing first child is not a text node so we need to create one
        // and delete the existing ones.

        deleteRemainingChildren(returnFiber, currentFirstChild);
        var created = createFiberFromText(textContent, returnFiber.mode, lanes);
        created.return = returnFiber;
        return created;
      }

      function reconcileSingleElement(
        returnFiber,
        currentFirstChild,
        element,
        lanes,
        debugInfo
      ) {
        var key = element.key;
        var child = currentFirstChild;

        while (child !== null) {
          // TODO: If key === null and child.key === null, then this only applies to
          // the first item in the list.
          if (child.key === key) {
            var elementType = element.type;

            if (elementType === REACT_FRAGMENT_TYPE) {
              if (child.tag === Fragment) {
                deleteRemainingChildren(returnFiber, child.sibling);
                var existing = useFiber(child, element.props.children);
                existing.return = returnFiber;

                {
                  existing._debugOwner = element._owner;
                  existing._debugInfo = debugInfo;
                }

                return existing;
              }
            } else {
              if (
                child.elementType === elementType || // Keep this check inline so it only runs on the false path:
                isCompatibleFamilyForHotReloading(child, element) || // Lazy types should reconcile their resolved type.
                // We need to do this after the Hot Reloading check above,
                // because hot reloading has different semantics than prod because
                // it doesn't resuspend. So we can't let the call below suspend.
                (typeof elementType === "object" &&
                  elementType !== null &&
                  elementType.$$typeof === REACT_LAZY_TYPE &&
                  resolveLazy(elementType) === child.type)
              ) {
                deleteRemainingChildren(returnFiber, child.sibling);

                var _existing = useFiber(child, element.props);

                coerceRef(returnFiber, child, _existing, element);
                _existing.return = returnFiber;

                {
                  _existing._debugOwner = element._owner;
                  _existing._debugInfo = debugInfo;
                }

                return _existing;
              }
            } // Didn't match.

            deleteRemainingChildren(returnFiber, child);
            break;
          } else {
            deleteChild(returnFiber, child);
          }

          child = child.sibling;
        }

        if (element.type === REACT_FRAGMENT_TYPE) {
          var created = createFiberFromFragment(
            element.props.children,
            returnFiber.mode,
            lanes,
            element.key
          );
          created.return = returnFiber;

          {
            created._debugInfo = debugInfo;
          }

          return created;
        } else {
          var _created4 = createFiberFromElement(
            element,
            returnFiber.mode,
            lanes
          );

          coerceRef(returnFiber, currentFirstChild, _created4, element);
          _created4.return = returnFiber;

          {
            _created4._debugInfo = debugInfo;
          }

          return _created4;
        }
      }

      function reconcileSinglePortal(
        returnFiber,
        currentFirstChild,
        portal,
        lanes,
        debugInfo
      ) {
        var key = portal.key;
        var child = currentFirstChild;

        while (child !== null) {
          // TODO: If key === null and child.key === null, then this only applies to
          // the first item in the list.
          if (child.key === key) {
            if (
              child.tag === HostPortal &&
              child.stateNode.containerInfo === portal.containerInfo &&
              child.stateNode.implementation === portal.implementation
            ) {
              deleteRemainingChildren(returnFiber, child.sibling);
              var existing = useFiber(child, portal.children || []);
              existing.return = returnFiber;
              return existing;
            } else {
              deleteRemainingChildren(returnFiber, child);
              break;
            }
          } else {
            deleteChild(returnFiber, child);
          }

          child = child.sibling;
        }

        var created = createFiberFromPortal(portal, returnFiber.mode, lanes);
        created.return = returnFiber;
        return created;
      } // This API will tag the children with the side-effect of the reconciliation
      // itself. They will be added to the side-effect list as we pass through the
      // children and the parent.

      function reconcileChildFibersImpl(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes,
        debugInfo
      ) {
        // This function is not recursive.
        // If the top level item is an array, we treat it as a set of children,
        // not as a fragment. Nested arrays on the other hand will be treated as
        // fragment nodes. Recursion happens at the normal flow.
        // Handle top level unkeyed fragments as if they were arrays.
        // This leads to an ambiguity between <>{[...]}</> and <>...</>.
        // We treat the ambiguous cases above the same.
        // TODO: Let's use recursion like we do for Usable nodes?
        var isUnkeyedTopLevelFragment =
          typeof newChild === "object" &&
          newChild !== null &&
          newChild.type === REACT_FRAGMENT_TYPE &&
          newChild.key === null;

        if (isUnkeyedTopLevelFragment) {
          newChild = newChild.props.children;
        } // Handle object types

        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
              return placeSingleChild(
                reconcileSingleElement(
                  returnFiber,
                  currentFirstChild,
                  newChild,
                  lanes,
                  mergeDebugInfo(debugInfo, newChild._debugInfo)
                )
              );

            case REACT_PORTAL_TYPE:
              return placeSingleChild(
                reconcileSinglePortal(
                  returnFiber,
                  currentFirstChild,
                  newChild,
                  lanes
                )
              );

            case REACT_LAZY_TYPE:
              var payload = newChild._payload;
              var init = newChild._init;
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                init(payload),
                lanes,
                mergeDebugInfo(debugInfo, newChild._debugInfo)
              );
          }

          if (isArray(newChild)) {
            return reconcileChildrenArray(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes,
              mergeDebugInfo(debugInfo, newChild._debugInfo)
            );
          }

          if (getIteratorFn(newChild)) {
            return reconcileChildrenIterator(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes,
              mergeDebugInfo(debugInfo, newChild._debugInfo)
            );
          } // Usables are a valid React node type. When React encounters a Usable in
          // a child position, it unwraps it using the same algorithm as `use`. For
          // example, for promises, React will throw an exception to unwind the
          // stack, then replay the component once the promise resolves.
          //
          // A difference from `use` is that React will keep unwrapping the value
          // until it reaches a non-Usable type.
          //
          // e.g. Usable<Usable<Usable<T>>> should resolve to T
          //
          // The structure is a bit unfortunate. Ideally, we shouldn't need to
          // replay the entire begin phase of the parent fiber in order to reconcile
          // the children again. This would require a somewhat significant refactor,
          // because reconcilation happens deep within the begin phase, and
          // depending on the type of work, not always at the end. We should
          // consider as an future improvement.

          if (typeof newChild.then === "function") {
            var thenable = newChild;
            return reconcileChildFibersImpl(
              returnFiber,
              currentFirstChild,
              unwrapThenable(thenable),
              lanes,
              mergeDebugInfo(debugInfo, thenable._debugInfo)
            );
          }

          if (newChild.$$typeof === REACT_CONTEXT_TYPE) {
            var context = newChild;
            return reconcileChildFibersImpl(
              returnFiber,
              currentFirstChild,
              readContextDuringReconciliation(returnFiber, context, lanes),
              lanes,
              debugInfo
            );
          }

          throwOnInvalidObjectType(returnFiber, newChild);
        }

        if (
          (typeof newChild === "string" && newChild !== "") ||
          typeof newChild === "number" ||
          enableBigIntSupport
        ) {
          return placeSingleChild(
            reconcileSingleTextNode(
              returnFiber,
              currentFirstChild, // $FlowFixMe[unsafe-addition] Flow doesn't want us to use `+` operator with string and bigint
              "" + newChild,
              lanes
            )
          );
        }

        {
          if (typeof newChild === "function") {
            warnOnFunctionType(returnFiber, newChild);
          }

          if (typeof newChild === "symbol") {
            warnOnSymbolType(returnFiber, newChild);
          }
        } // Remaining cases are all treated as empty.

        return deleteRemainingChildren(returnFiber, currentFirstChild);
      }

      function reconcileChildFibers(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes
      ) {
        // This indirection only exists so we can reset `thenableState` at the end.
        // It should get inlined by Closure.
        thenableIndexCounter$1 = 0;
        var firstChildFiber = reconcileChildFibersImpl(
          returnFiber,
          currentFirstChild,
          newChild,
          lanes,
          null // debugInfo
        );
        thenableState$1 = null; // Don't bother to reset `thenableIndexCounter` to 0 because it always gets
        // set at the beginning.

        return firstChildFiber;
      }

      return reconcileChildFibers;
    }

    var reconcileChildFibers = createChildReconciler(true);
    var mountChildFibers = createChildReconciler(false);
    function resetChildReconcilerOnUnwind() {
      // On unwind, clear any pending thenables that were used.
      thenableState$1 = null;
      thenableIndexCounter$1 = 0;
    }
    function cloneChildFibers(current, workInProgress) {
      if (current !== null && workInProgress.child !== current.child) {
        throw new Error("Resuming work not yet implemented.");
      }

      if (workInProgress.child === null) {
        return;
      }

      var currentChild = workInProgress.child;
      var newChild = createWorkInProgress(
        currentChild,
        currentChild.pendingProps
      );
      workInProgress.child = newChild;
      newChild.return = workInProgress;

      while (currentChild.sibling !== null) {
        currentChild = currentChild.sibling;
        newChild = newChild.sibling = createWorkInProgress(
          currentChild,
          currentChild.pendingProps
        );
        newChild.return = workInProgress;
      }

      newChild.sibling = null;
    } // Reset a workInProgress child set to prepare it for a second pass.

    function resetChildFibers(workInProgress, lanes) {
      var child = workInProgress.child;

      while (child !== null) {
        resetWorkInProgress(child, lanes);
        child = child.sibling;
      }
    }

    // TODO: This isn't being used yet, but it's intended to replace the
    // InvisibleParentContext that is currently managed by SuspenseContext.

    var currentTreeHiddenStackCursor = createCursor(null);
    var prevEntangledRenderLanesCursor = createCursor(NoLanes);
    function pushHiddenContext(fiber, context) {
      var prevEntangledRenderLanes = getEntangledRenderLanes();
      push(prevEntangledRenderLanesCursor, prevEntangledRenderLanes, fiber);
      push(currentTreeHiddenStackCursor, context, fiber); // When rendering a subtree that's currently hidden, we must include all
      // lanes that would have rendered if the hidden subtree hadn't been deferred.
      // That is, in order to reveal content from hidden -> visible, we must commit
      // all the updates that we skipped when we originally hid the tree.

      setEntangledRenderLanes(
        mergeLanes(prevEntangledRenderLanes, context.baseLanes)
      );
    }
    function reuseHiddenContextOnStack(fiber) {
      // This subtree is not currently hidden, so we don't need to add any lanes
      // to the render lanes. But we still need to push something to avoid a
      // context mismatch. Reuse the existing context on the stack.
      push(prevEntangledRenderLanesCursor, getEntangledRenderLanes(), fiber);
      push(
        currentTreeHiddenStackCursor,
        currentTreeHiddenStackCursor.current,
        fiber
      );
    }
    function popHiddenContext(fiber) {
      // Restore the previous render lanes from the stack
      setEntangledRenderLanes(prevEntangledRenderLanesCursor.current);
      pop(currentTreeHiddenStackCursor, fiber);
      pop(prevEntangledRenderLanesCursor, fiber);
    }
    function isCurrentTreeHidden() {
      return currentTreeHiddenStackCursor.current !== null;
    }

    // suspends, i.e. it's the nearest `catch` block on the stack.

    var suspenseHandlerStackCursor = createCursor(null); // Represents the outermost boundary that is not visible in the current tree.
    // Everything above this is the "shell". When this is null, it means we're
    // rendering in the shell of the app. If it's non-null, it means we're rendering
    // deeper than the shell, inside a new tree that wasn't already visible.
    //
    // The main way we use this concept is to determine whether showing a fallback
    // would result in a desirable or undesirable loading state. Activing a fallback
    // in the shell is considered an undersirable loading state, because it would
    // mean hiding visible (albeit stale) content in the current tree — we prefer to
    // show the stale content, rather than switch to a fallback. But showing a
    // fallback in a new tree is fine, because there's no stale content to
    // prefer instead.

    var shellBoundary = null;
    function getShellBoundary() {
      return shellBoundary;
    }
    function pushPrimaryTreeSuspenseHandler(handler) {
      // TODO: Pass as argument
      var current = handler.alternate;
      // propagated a single level. For example, when ForceSuspenseFallback is set,
      // it should only force the nearest Suspense boundary into fallback mode.

      pushSuspenseListContext(
        handler,
        setDefaultShallowSuspenseListContext(suspenseStackCursor.current)
      ); // Experimental feature: Some Suspense boundaries are marked as having an
      // to push a nested Suspense handler, because it will get replaced by the
      // outer fallback, anyway. Consider this as a future optimization.

      push(suspenseHandlerStackCursor, handler, handler);

      if (shellBoundary === null) {
        if (current === null || isCurrentTreeHidden()) {
          // This boundary is not visible in the current UI.
          shellBoundary = handler;
        } else {
          var prevState = current.memoizedState;

          if (prevState !== null) {
            // This boundary is showing a fallback in the current UI.
            shellBoundary = handler;
          }
        }
      }
    }
    function pushFallbackTreeSuspenseHandler(fiber) {
      // We're about to render the fallback. If something in the fallback suspends,
      // it's akin to throwing inside of a `catch` block. This boundary should not
      // capture. Reuse the existing handler on the stack.
      reuseSuspenseHandlerOnStack(fiber);
    }
    function pushOffscreenSuspenseHandler(fiber) {
      if (fiber.tag === OffscreenComponent) {
        // A SuspenseList context is only pushed here to avoid a push/pop mismatch.
        // Reuse the current value on the stack.
        // TODO: We can avoid needing to push here by by forking popSuspenseHandler
        // into separate functions for Suspense and Offscreen.
        pushSuspenseListContext(fiber, suspenseStackCursor.current);
        push(suspenseHandlerStackCursor, fiber, fiber);

        if (shellBoundary !== null);
        else {
          var current = fiber.alternate;

          if (current !== null) {
            var prevState = current.memoizedState;

            if (prevState !== null) {
              // This is the first boundary in the stack that's already showing
              // a fallback. So everything outside is considered the shell.
              shellBoundary = fiber;
            }
          }
        }
      } else {
        // This is a LegacyHidden component.
        reuseSuspenseHandlerOnStack(fiber);
      }
    }
    function reuseSuspenseHandlerOnStack(fiber) {
      pushSuspenseListContext(fiber, suspenseStackCursor.current);
      push(suspenseHandlerStackCursor, getSuspenseHandler(), fiber);
    }
    function getSuspenseHandler() {
      return suspenseHandlerStackCursor.current;
    }
    function popSuspenseHandler(fiber) {
      pop(suspenseHandlerStackCursor, fiber);

      if (shellBoundary === fiber) {
        // Popping back into the shell.
        shellBoundary = null;
      }

      popSuspenseListContext(fiber);
    } // SuspenseList context
    // TODO: Move to a separate module? We may change the SuspenseList
    // implementation to hide/show in the commit phase, anyway.

    var DefaultSuspenseContext = 0;
    var SubtreeSuspenseContextMask = 1; // ForceSuspenseFallback can be used by SuspenseList to force newly added
    // items into their fallback state during one of the render passes.

    var ForceSuspenseFallback = 2;
    var suspenseStackCursor = createCursor(DefaultSuspenseContext);
    function hasSuspenseListContext(parentContext, flag) {
      return (parentContext & flag) !== 0;
    }
    function setDefaultShallowSuspenseListContext(parentContext) {
      return parentContext & SubtreeSuspenseContextMask;
    }
    function setShallowSuspenseListContext(parentContext, shallowContext) {
      return (parentContext & SubtreeSuspenseContextMask) | shallowContext;
    }
    function pushSuspenseListContext(fiber, newContext) {
      push(suspenseStackCursor, newContext, fiber);
    }
    function popSuspenseListContext(fiber) {
      pop(suspenseStackCursor, fiber);
    }

    // A non-null SuspenseState means that it is blocked for one reason or another.
    // - A non-null dehydrated field means it's blocked pending hydration.
    //   - A non-null dehydrated field can use isSuspenseInstancePending or
    //     isSuspenseInstanceFallback to query the reason for being dehydrated.
    // - A null dehydrated field means it's blocked by something suspending and
    //   we're currently showing a fallback instead.

    function findFirstSuspended(row) {
      var node = row;

      while (node !== null) {
        if (node.tag === SuspenseComponent) {
          var state = node.memoizedState;

          if (state !== null) {
            var dehydrated = state.dehydrated;

            if (
              dehydrated === null ||
              isSuspenseInstancePending() ||
              isSuspenseInstanceFallback()
            ) {
              return node;
            }
          }
        } else if (
          node.tag === SuspenseListComponent && // revealOrder undefined can't be trusted because it don't
          // keep track of whether it suspended or not.
          node.memoizedProps.revealOrder !== undefined
        ) {
          var didSuspend = (node.flags & DidCapture) !== NoFlags$1;

          if (didSuspend) {
            return node;
          }
        } else if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }

        if (node === row) {
          return null;
        }

        while (node.sibling === null) {
          if (node.return === null || node.return === row) {
            return null;
          }

          node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;
      }

      return null;
    }

    var NoFlags =
      /*   */
      0; // Represents whether effect should fire.

    var HasEffect =
      /* */
      1; // Represents the phase in which the effect (not the clean-up) fires.

    var Insertion =
      /* */
      2;
    var Layout =
      /*    */
      4;
    var Passive =
      /*   */
      8;

    var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
      ReactCurrentBatchConfig$2 = ReactSharedInternals.ReactCurrentBatchConfig;
    var didWarnAboutMismatchedHooksForComponent;
    var didWarnUncachedGetSnapshot;
    var didWarnAboutUseWrappedInTryCatch;
    var didWarnAboutAsyncClientComponent;

    {
      didWarnAboutMismatchedHooksForComponent = new Set();
      didWarnAboutUseWrappedInTryCatch = new Set();
      didWarnAboutAsyncClientComponent = new Set();
    } // The effect "instance" is a shared object that remains the same for the entire
    // lifetime of an effect. In Rust terms, a RefCell. We use it to store the
    // "destroy" function that is returned from an effect, because that is stateful.
    // The field is `undefined` if the effect is unmounted, or if the effect ran
    // but is not stateful. We don't explicitly track whether the effect is mounted
    // or unmounted because that can be inferred by the hiddenness of the fiber in
    // the tree, i.e. whether there is a hidden Offscreen fiber above it.
    //
    // It's unfortunate that this is stored on a separate object, because it adds
    // more memory per effect instance, but it's conceptually sound. I think there's
    // likely a better data structure we could use for effects; perhaps just one
    // array of effect instances per fiber. But I think this is OK for now despite
    // the additional memory and we can follow up with performance
    // optimizations later.
    // These are set right before calling the component.

    var renderLanes = NoLanes; // The work-in-progress fiber. I've named it differently to distinguish it from
    // the work-in-progress hook.

    var currentlyRenderingFiber$1 = null; // Hooks are stored as a linked list on the fiber's memoizedState field. The
    // current hook list is the list that belongs to the current fiber. The
    // work-in-progress hook list is a new list that will be added to the
    // work-in-progress fiber.

    var currentHook = null;
    var workInProgressHook = null; // Whether an update was scheduled at any point during the render phase. This
    // does not get reset if we do another render pass; only when we're completely
    // finished evaluating this component. This is an optimization so we know
    // whether we need to clear render phase updates after a throw.

    var didScheduleRenderPhaseUpdate = false; // Where an update was scheduled only during the current render pass. This
    // gets reset after each attempt.
    // TODO: Maybe there's some way to consolidate this with
    // `didScheduleRenderPhaseUpdate`. Or with `numberOfReRenders`.

    var didScheduleRenderPhaseUpdateDuringThisPass = false;
    var shouldDoubleInvokeUserFnsInHooksDEV = false; // Counts the number of useId hooks in this component.

    var thenableIndexCounter = 0;
    var thenableState = null; // Used for ids that are generated completely client-side (i.e. not during
    // hydration). This counter is global, so client ids are not stable across
    // render attempts.

    var globalClientIdCounter = 0;
    var RE_RENDER_LIMIT = 25; // In DEV, this is the name of the currently executing primitive hook

    var currentHookNameInDev = null; // In DEV, this list ensures that hooks are called in the same order between renders.
    // The list stores the order of hooks used during the initial render (mount).
    // Subsequent renders (updates) reference this list.

    var hookTypesDev = null;
    var hookTypesUpdateIndexDev = -1; // In DEV, this tracks whether currently rendering component needs to ignore
    // the dependencies for Hooks that need them (e.g. useEffect or useMemo).
    // When true, such Hooks will always be "remounted". Only used during hot reload.

    var ignorePreviousDependencies = false;

    function mountHookTypesDev() {
      {
        var hookName = currentHookNameInDev;

        if (hookTypesDev === null) {
          hookTypesDev = [hookName];
        } else {
          hookTypesDev.push(hookName);
        }
      }
    }

    function updateHookTypesDev() {
      {
        var hookName = currentHookNameInDev;

        if (hookTypesDev !== null) {
          hookTypesUpdateIndexDev++;

          if (hookTypesDev[hookTypesUpdateIndexDev] !== hookName) {
            warnOnHookMismatchInDev(hookName);
          }
        }
      }
    }

    function checkDepsAreArrayDev(deps) {
      {
        if (deps !== undefined && deps !== null && !isArray(deps)) {
          // Verify deps, but only on mount to avoid extra checks.
          // It's unlikely their type would change as usually you define them inline.
          error(
            "%s received a final argument that is not an array (instead, received `%s`). When " +
              "specified, the final argument must be an array.",
            currentHookNameInDev,
            typeof deps
          );
        }
      }
    }

    function warnOnHookMismatchInDev(currentHookName) {
      {
        var componentName = getComponentNameFromFiber(
          currentlyRenderingFiber$1
        );

        if (!didWarnAboutMismatchedHooksForComponent.has(componentName)) {
          didWarnAboutMismatchedHooksForComponent.add(componentName);

          if (hookTypesDev !== null) {
            var table = "";
            var secondColumnStart = 30;

            for (var i = 0; i <= hookTypesUpdateIndexDev; i++) {
              var oldHookName = hookTypesDev[i];
              var newHookName =
                i === hookTypesUpdateIndexDev ? currentHookName : oldHookName;
              var row = i + 1 + ". " + oldHookName; // Extra space so second column lines up
              // lol @ IE not supporting String#repeat

              while (row.length < secondColumnStart) {
                row += " ";
              }

              row += newHookName + "\n";
              table += row;
            }

            error(
              "React has detected a change in the order of Hooks called by %s. " +
                "This will lead to bugs and errors if not fixed. " +
                "For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks\n\n" +
                "   Previous render            Next render\n" +
                "   ------------------------------------------------------\n" +
                "%s" +
                "   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n",
              componentName,
              table
            );
          }
        }
      }
    }

    function warnIfAsyncClientComponent(Component) {
      {
        // This dev-only check only works for detecting native async functions,
        // not transpiled ones. There's also a prod check that we use to prevent
        // async client components from crashing the app; the prod one works even
        // for transpiled async functions. Neither mechanism is completely
        // bulletproof but together they cover the most common cases.
        var isAsyncFunction = // $FlowIgnore[method-unbinding]
          Object.prototype.toString.call(Component) ===
          "[object AsyncFunction]";

        if (isAsyncFunction) {
          // Encountered an async Client Component. This is not yet supported.
          var componentName = getComponentNameFromFiber(
            currentlyRenderingFiber$1
          );

          if (!didWarnAboutAsyncClientComponent.has(componentName)) {
            didWarnAboutAsyncClientComponent.add(componentName);

            error(
              "async/await is not yet supported in Client Components, only " +
                "Server Components. This error is often caused by accidentally " +
                "adding `'use client'` to a module that was originally written " +
                "for the server."
            );
          }
        }
      }
    }

    function throwInvalidHookError() {
      throw new Error(
        "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" +
          " one of the following reasons:\n" +
          "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" +
          "2. You might be breaking the Rules of Hooks\n" +
          "3. You might have more than one copy of React in the same app\n" +
          "See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
      );
    }

    function areHookInputsEqual(nextDeps, prevDeps) {
      {
        if (ignorePreviousDependencies) {
          // Only true when this component is being hot reloaded.
          return false;
        }
      }

      if (prevDeps === null) {
        {
          error(
            "%s received a final argument during this render, but not during " +
              "the previous render. Even though the final argument is optional, " +
              "its type cannot change between renders.",
            currentHookNameInDev
          );
        }

        return false;
      }

      {
        // Don't bother comparing lengths in prod because these arrays should be
        // passed inline.
        if (nextDeps.length !== prevDeps.length) {
          error(
            "The final argument passed to %s changed size between renders. The " +
              "order and size of this array must remain constant.\n\n" +
              "Previous: %s\n" +
              "Incoming: %s",
            currentHookNameInDev,
            "[" + prevDeps.join(", ") + "]",
            "[" + nextDeps.join(", ") + "]"
          );
        }
      } // $FlowFixMe[incompatible-use] found when upgrading Flow

      for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        if (objectIs(nextDeps[i], prevDeps[i])) {
          continue;
        }

        return false;
      }

      return true;
    }

    function renderWithHooks(
      current,
      workInProgress,
      Component,
      props,
      secondArg,
      nextRenderLanes
    ) {
      renderLanes = nextRenderLanes;
      currentlyRenderingFiber$1 = workInProgress;

      {
        hookTypesDev = current !== null ? current._debugHookTypes : null;
        hookTypesUpdateIndexDev = -1; // Used for hot reloading:

        ignorePreviousDependencies =
          current !== null && current.type !== workInProgress.type;
        warnIfAsyncClientComponent(Component);
      }

      workInProgress.memoizedState = null;
      workInProgress.updateQueue = null;
      workInProgress.lanes = NoLanes; // The following should have already been reset
      // currentHook = null;
      // workInProgressHook = null;
      // didScheduleRenderPhaseUpdate = false;
      // localIdCounter = 0;
      // thenableIndexCounter = 0;
      // thenableState = null;
      // TODO Warn if no hooks are used at all during mount, then some are used during update.
      // Currently we will identify the update render as a mount because memoizedState === null.
      // This is tricky because it's valid for certain types of components (e.g. React.lazy)
      // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
      // Non-stateful hooks (e.g. context) don't get added to memoizedState,
      // so memoizedState would be null during updates and mounts.

      {
        if (current !== null && current.memoizedState !== null) {
          ReactCurrentDispatcher$1.current = HooksDispatcherOnUpdateInDEV;
        } else if (hookTypesDev !== null) {
          // This dispatcher handles an edge case where a component is updating,
          // but no stateful hooks have been used.
          // We want to match the production code behavior (which will use HooksDispatcherOnMount),
          // but with the extra DEV validation to ensure hooks ordering hasn't changed.
          // This dispatcher does that.
          ReactCurrentDispatcher$1.current =
            HooksDispatcherOnMountWithHookTypesInDEV;
        } else {
          ReactCurrentDispatcher$1.current = HooksDispatcherOnMountInDEV;
        }
      } // In Strict Mode, during development, user functions are double invoked to
      // help detect side effects. The logic for how this is implemented for in
      // hook components is a bit complex so let's break it down.
      //
      // We will invoke the entire component function twice. However, during the
      // second invocation of the component, the hook state from the first
      // invocation will be reused. That means things like `useMemo` functions won't
      // run again, because the deps will match and the memoized result will
      // be reused.
      //
      // We want memoized functions to run twice, too, so account for this, user
      // functions are double invoked during the *first* invocation of the component
      // function, and are *not* double invoked during the second incovation:
      //
      // - First execution of component function: user functions are double invoked
      // - Second execution of component function (in Strict Mode, during
      //   development): user functions are not double invoked.
      //
      // This is intentional for a few reasons; most importantly, it's because of
      // how `use` works when something suspends: it reuses the promise that was
      // passed during the first attempt. This is itself a form of memoization.
      // We need to be able to memoize the reactive inputs to the `use` call using
      // a hook (i.e. `useMemo`), which means, the reactive inputs to `use` must
      // come from the same component invocation as the output.
      //
      // There are plenty of tests to ensure this behavior is correct.

      var shouldDoubleRenderDEV =
        (workInProgress.mode & StrictLegacyMode) !== NoMode;
      shouldDoubleInvokeUserFnsInHooksDEV = shouldDoubleRenderDEV;
      var children = Component(props, secondArg);
      shouldDoubleInvokeUserFnsInHooksDEV = false; // Check if there was a render phase update

      if (didScheduleRenderPhaseUpdateDuringThisPass) {
        // Keep rendering until the component stabilizes (there are no more render
        // phase updates).
        children = renderWithHooksAgain(
          workInProgress,
          Component,
          props,
          secondArg
        );
      }

      if (shouldDoubleRenderDEV) {
        // In development, components are invoked twice to help detect side effects.
        setIsStrictModeForDevtools(true);

        try {
          children = renderWithHooksAgain(
            workInProgress,
            Component,
            props,
            secondArg
          );
        } finally {
          setIsStrictModeForDevtools(false);
        }
      }

      finishRenderingHooks(current, workInProgress);
      return children;
    }

    function finishRenderingHooks(current, workInProgress, Component) {
      {
        workInProgress._debugHookTypes = hookTypesDev;
      } // We can assume the previous dispatcher is always this one, since we set it
      // at the beginning of the render phase and there's no re-entrance.

      ReactCurrentDispatcher$1.current = ContextOnlyDispatcher; // This check uses currentHook so that it works the same in DEV and prod bundles.
      // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.

      var didRenderTooFewHooks =
        currentHook !== null && currentHook.next !== null;
      renderLanes = NoLanes;
      currentlyRenderingFiber$1 = null;
      currentHook = null;
      workInProgressHook = null;

      {
        currentHookNameInDev = null;
        hookTypesDev = null;
        hookTypesUpdateIndexDev = -1; // Confirm that a static flag was not added or removed since the last
        // render. If this fires, it suggests that we incorrectly reset the static
        // flags in some other part of the codebase. This has happened before, for
        // example, in the SuspenseList implementation.

        if (
          current !== null &&
          (current.flags & StaticMask) !==
            (workInProgress.flags & StaticMask) && // Disable this warning in legacy mode, because legacy Suspense is weird
          // and creates false positives. To make this work in legacy mode, we'd
          // need to mark fibers that commit in an incomplete state, somehow. For
          // now I'll disable the warning that most of the bugs that would trigger
          // it are either exclusive to concurrent mode or exist in both.
          (current.mode & ConcurrentMode) !== NoMode
        ) {
          error(
            "Internal React error: Expected static flag was missing. Please " +
              "notify the React team."
          );
        }
      }

      didScheduleRenderPhaseUpdate = false; // This is reset by checkDidRenderIdHook
      // localIdCounter = 0;

      thenableIndexCounter = 0;
      thenableState = null;

      if (didRenderTooFewHooks) {
        throw new Error(
          "Rendered fewer hooks than expected. This may be caused by an accidental " +
            "early return statement."
        );
      }

      {
        if (checkIfUseWrappedInTryCatch()) {
          var componentName =
            getComponentNameFromFiber(workInProgress) || "Unknown";

          if (
            !didWarnAboutUseWrappedInTryCatch.has(componentName) && // This warning also fires if you suspend with `use` inside an
            // async component. Since we warn for that above, we'll silence this
            // second warning by checking here.
            !didWarnAboutAsyncClientComponent.has(componentName)
          ) {
            didWarnAboutUseWrappedInTryCatch.add(componentName);

            error(
              "`use` was called from inside a try/catch block. This is not allowed " +
                "and can lead to unexpected behavior. To handle errors triggered " +
                "by `use`, wrap your component in a error boundary."
            );
          }
        }
      }
    }

    function replaySuspendedComponentWithHooks(
      current,
      workInProgress,
      Component,
      props,
      secondArg
    ) {
      // This function is used to replay a component that previously suspended,
      // after its data resolves.
      //
      // It's a simplified version of renderWithHooks, but it doesn't need to do
      // most of the set up work because they weren't reset when we suspended; they
      // only get reset when the component either completes (finishRenderingHooks)
      // or unwinds (resetHooksOnUnwind).
      {
        hookTypesUpdateIndexDev = -1; // Used for hot reloading:

        ignorePreviousDependencies =
          current !== null && current.type !== workInProgress.type;
      }

      var children = renderWithHooksAgain(
        workInProgress,
        Component,
        props,
        secondArg
      );
      finishRenderingHooks(current, workInProgress);
      return children;
    }

    function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
      // This is used to perform another render pass. It's used when setState is
      // called during render, and for double invoking components in Strict Mode
      // during development.
      //
      // The state from the previous pass is reused whenever possible. So, state
      // updates that were already processed are not processed again, and memoized
      // functions (`useMemo`) are not invoked again.
      //
      // Keep rendering in a loop for as long as render phase updates continue to
      // be scheduled. Use a counter to prevent infinite loops.
      currentlyRenderingFiber$1 = workInProgress;
      var numberOfReRenders = 0;
      var children;

      do {
        if (didScheduleRenderPhaseUpdateDuringThisPass) {
          // It's possible that a use() value depended on a state that was updated in
          // this rerender, so we need to watch for different thenables this time.
          thenableState = null;
        }

        thenableIndexCounter = 0;
        didScheduleRenderPhaseUpdateDuringThisPass = false;

        if (numberOfReRenders >= RE_RENDER_LIMIT) {
          throw new Error(
            "Too many re-renders. React limits the number of renders to prevent " +
              "an infinite loop."
          );
        }

        numberOfReRenders += 1;

        {
          // Even when hot reloading, allow dependencies to stabilize
          // after first render to prevent infinite render phase updates.
          ignorePreviousDependencies = false;
        } // Start over from the beginning of the list

        currentHook = null;
        workInProgressHook = null;
        workInProgress.updateQueue = null;

        {
          // Also validate hook order for cascading updates.
          hookTypesUpdateIndexDev = -1;
        }

        ReactCurrentDispatcher$1.current = HooksDispatcherOnRerenderInDEV;
        children = Component(props, secondArg);
      } while (didScheduleRenderPhaseUpdateDuringThisPass);

      return children;
    }
    function bailoutHooks(current, workInProgress, lanes) {
      workInProgress.updateQueue = current.updateQueue; // TODO: Don't need to reset the flags here, because they're reset in the
      // complete phase (bubbleProperties).

      if ((workInProgress.mode & StrictEffectsMode) !== NoMode) {
        workInProgress.flags &= ~(
          MountPassiveDev |
          MountLayoutDev |
          Passive$1 |
          Update
        );
      } else {
        workInProgress.flags &= ~(Passive$1 | Update);
      }

      current.lanes = removeLanes(current.lanes, lanes);
    }
    function resetHooksAfterThrow() {
      // This is called immediaetly after a throw. It shouldn't reset the entire
      // module state, because the work loop might decide to replay the component
      // again without rewinding.
      //
      // It should only reset things like the current dispatcher, to prevent hooks
      // from being called outside of a component.
      currentlyRenderingFiber$1 = null; // We can assume the previous dispatcher is always this one, since we set it
      // at the beginning of the render phase and there's no re-entrance.

      ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
    }
    function resetHooksOnUnwind(workInProgress) {
      if (didScheduleRenderPhaseUpdate) {
        // There were render phase updates. These are only valid for this render
        // phase, which we are now aborting. Remove the updates from the queues so
        // they do not persist to the next render. Do not remove updates from hooks
        // that weren't processed.
        //
        // Only reset the updates from the queue if it has a clone. If it does
        // not have a clone, that means it wasn't processed, and the updates were
        // scheduled before we entered the render phase.
        var hook = workInProgress.memoizedState;

        while (hook !== null) {
          var queue = hook.queue;

          if (queue !== null) {
            queue.pending = null;
          }

          hook = hook.next;
        }

        didScheduleRenderPhaseUpdate = false;
      }

      renderLanes = NoLanes;
      currentlyRenderingFiber$1 = null;
      currentHook = null;
      workInProgressHook = null;

      {
        hookTypesDev = null;
        hookTypesUpdateIndexDev = -1;
        currentHookNameInDev = null;
      }

      didScheduleRenderPhaseUpdateDuringThisPass = false;
      thenableIndexCounter = 0;
      thenableState = null;
    }

    function mountWorkInProgressHook() {
      var hook = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
      };

      if (workInProgressHook === null) {
        // This is the first hook in the list
        currentlyRenderingFiber$1.memoizedState = workInProgressHook = hook;
      } else {
        // Append to the end of the list
        workInProgressHook = workInProgressHook.next = hook;
      }

      return workInProgressHook;
    }

    function updateWorkInProgressHook() {
      // This function is used both for updates and for re-renders triggered by a
      // render phase update. It assumes there is either a current hook we can
      // clone, or a work-in-progress hook from a previous render pass that we can
      // use as a base.
      var nextCurrentHook;

      if (currentHook === null) {
        var current = currentlyRenderingFiber$1.alternate;

        if (current !== null) {
          nextCurrentHook = current.memoizedState;
        } else {
          nextCurrentHook = null;
        }
      } else {
        nextCurrentHook = currentHook.next;
      }

      var nextWorkInProgressHook;

      if (workInProgressHook === null) {
        nextWorkInProgressHook = currentlyRenderingFiber$1.memoizedState;
      } else {
        nextWorkInProgressHook = workInProgressHook.next;
      }

      if (nextWorkInProgressHook !== null) {
        // There's already a work-in-progress. Reuse it.
        workInProgressHook = nextWorkInProgressHook;
        nextWorkInProgressHook = workInProgressHook.next;
        currentHook = nextCurrentHook;
      } else {
        // Clone from the current hook.
        if (nextCurrentHook === null) {
          var currentFiber = currentlyRenderingFiber$1.alternate;

          if (currentFiber === null) {
            // This is the initial render. This branch is reached when the component
            // suspends, resumes, then renders an additional hook.
            // Should never be reached because we should switch to the mount dispatcher first.
            throw new Error(
              "Update hook called on initial render. This is likely a bug in React. Please file an issue."
            );
          } else {
            // This is an update. We should always have a current hook.
            throw new Error(
              "Rendered more hooks than during the previous render."
            );
          }
        }

        currentHook = nextCurrentHook;
        var newHook = {
          memoizedState: currentHook.memoizedState,
          baseState: currentHook.baseState,
          baseQueue: currentHook.baseQueue,
          queue: currentHook.queue,
          next: null
        };

        if (workInProgressHook === null) {
          // This is the first hook in the list.
          currentlyRenderingFiber$1.memoizedState = workInProgressHook =
            newHook;
        } else {
          // Append to the end of the list.
          workInProgressHook = workInProgressHook.next = newHook;
        }
      }

      return workInProgressHook;
    } // NOTE: defining two versions of this function to avoid size impact when this feature is disabled.
    // Previously this function was inlined, the additional `memoCache` property makes it not inlined.

    var createFunctionComponentUpdateQueue;

    {
      createFunctionComponentUpdateQueue = function () {
        return {
          lastEffect: null,
          events: null,
          stores: null
        };
      };
    }

    function useThenable(thenable) {
      // Track the position of the thenable within this fiber.
      var index = thenableIndexCounter;
      thenableIndexCounter += 1;

      if (thenableState === null) {
        thenableState = createThenableState();
      }

      var result = trackUsedThenable(thenableState, thenable, index);

      if (
        currentlyRenderingFiber$1.alternate === null &&
        (workInProgressHook === null
          ? currentlyRenderingFiber$1.memoizedState === null
          : workInProgressHook.next === null)
      ) {
        // Initial render, and either this is the first time the component is
        // called, or there were no Hooks called after this use() the previous
        // time (perhaps because it threw). Subsequent Hook calls should use the
        // mount dispatcher.
        {
          ReactCurrentDispatcher$1.current = HooksDispatcherOnMountInDEV;
        }
      }

      return result;
    }

    function use(usable) {
      if (usable !== null && typeof usable === "object") {
        // $FlowFixMe[method-unbinding]
        if (typeof usable.then === "function") {
          // This is a thenable.
          var thenable = usable;
          return useThenable(thenable);
        } else if (usable.$$typeof === REACT_CONTEXT_TYPE) {
          var context = usable;
          return readContext(context);
        }
      } // eslint-disable-next-line react-internal/safe-string-coercion

      throw new Error(
        "An unsupported type was passed to use(): " + String(usable)
      );
    }

    function basicStateReducer(state, action) {
      // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
      return typeof action === "function" ? action(state) : action;
    }

    function mountReducer(reducer, initialArg, init) {
      var hook = mountWorkInProgressHook();
      var initialState;

      if (init !== undefined) {
        initialState = init(initialArg);

        if (shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(true);
          init(initialArg);
          setIsStrictModeForDevtools(false);
        }
      } else {
        initialState = initialArg;
      }

      hook.memoizedState = hook.baseState = initialState;
      var queue = {
        pending: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialState
      };
      hook.queue = queue;
      var dispatch = (queue.dispatch = dispatchReducerAction.bind(
        null,
        currentlyRenderingFiber$1,
        queue
      ));
      return [hook.memoizedState, dispatch];
    }

    function updateReducer(reducer, initialArg, init) {
      var hook = updateWorkInProgressHook();
      return updateReducerImpl(hook, currentHook, reducer);
    }

    function updateReducerImpl(hook, current, reducer) {
      var queue = hook.queue;

      if (queue === null) {
        throw new Error(
          "Should have a queue. This is likely a bug in React. Please file an issue."
        );
      }

      queue.lastRenderedReducer = reducer; // The last rebase update that is NOT part of the base state.

      var baseQueue = hook.baseQueue; // The last pending update that hasn't been processed yet.

      var pendingQueue = queue.pending;

      if (pendingQueue !== null) {
        // We have new updates that haven't been processed yet.
        // We'll add them to the base queue.
        if (baseQueue !== null) {
          // Merge the pending queue and the base queue.
          var baseFirst = baseQueue.next;
          var pendingFirst = pendingQueue.next;
          baseQueue.next = pendingFirst;
          pendingQueue.next = baseFirst;
        }

        {
          if (current.baseQueue !== baseQueue) {
            // Internal invariant that should never happen, but feasibly could in
            // the future if we implement resuming, or some form of that.
            error(
              "Internal error: Expected work-in-progress queue to be a clone. " +
                "This is a bug in React."
            );
          }
        }

        current.baseQueue = baseQueue = pendingQueue;
        queue.pending = null;
      }

      var baseState = hook.baseState;

      if (baseQueue === null) {
        // If there are no pending updates, then the memoized state should be the
        // same as the base state. Currently these only diverge in the case of
        // useOptimistic, because useOptimistic accepts a new baseState on
        // every render.
        hook.memoizedState = baseState; // We don't need to call markWorkInProgressReceivedUpdate because
        // baseState is derived from other reactive values.
      } else {
        // We have a queue to process.
        var first = baseQueue.next;
        var newState = baseState;
        var newBaseState = null;
        var newBaseQueueFirst = null;
        var newBaseQueueLast = null;
        var update = first;
        var didReadFromEntangledAsyncAction = false;

        do {
          // An extra OffscreenLane bit is added to updates that were made to
          // a hidden tree, so that we can distinguish them from updates that were
          // already there when the tree was hidden.
          var updateLane = removeLanes(update.lane, OffscreenLane);
          var isHiddenUpdate = updateLane !== update.lane; // Check if this update was made while the tree was hidden. If so, then
          // it's not a "base" update and we should disregard the extra base lanes
          // that were added to renderLanes when we entered the Offscreen tree.

          var shouldSkipUpdate = isHiddenUpdate
            ? !isSubsetOfLanes(getWorkInProgressRootRenderLanes(), updateLane)
            : !isSubsetOfLanes(renderLanes, updateLane);

          if (shouldSkipUpdate) {
            // Priority is insufficient. Skip this update. If this is the first
            // skipped update, the previous update/state is the new base
            // update/state.
            var clone = {
              lane: updateLane,
              revertLane: update.revertLane,
              action: update.action,
              hasEagerState: update.hasEagerState,
              eagerState: update.eagerState,
              next: null
            };

            if (newBaseQueueLast === null) {
              newBaseQueueFirst = newBaseQueueLast = clone;
              newBaseState = newState;
            } else {
              newBaseQueueLast = newBaseQueueLast.next = clone;
            } // Update the remaining priority in the queue.
            // TODO: Don't need to accumulate this. Instead, we can remove
            // renderLanes from the original lanes.

            currentlyRenderingFiber$1.lanes = mergeLanes(
              currentlyRenderingFiber$1.lanes,
              updateLane
            );
            markSkippedUpdateLanes(updateLane);
          } else {
            {
              // This is not an optimistic update, and we're going to apply it now.
              // But, if there were earlier updates that were skipped, we need to
              // leave this update in the queue so it can be rebased later.
              if (newBaseQueueLast !== null) {
                var _clone = {
                  // This update is going to be committed so we never want uncommit
                  // it. Using NoLane works because 0 is a subset of all bitmasks, so
                  // this will never be skipped by the check above.
                  lane: NoLane,
                  revertLane: NoLane,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                };
                newBaseQueueLast = newBaseQueueLast.next = _clone;
              } // Check if this update is part of a pending async action. If so,
              // we'll need to suspend until the action has finished, so that it's
              // batched together with future updates in the same action.

              if (updateLane === peekEntangledActionLane()) {
                didReadFromEntangledAsyncAction = true;
              }
            } // Process this update.

            var action = update.action;

            if (shouldDoubleInvokeUserFnsInHooksDEV) {
              reducer(newState, action);
            }

            if (update.hasEagerState) {
              // If this update is a state update (not a reducer) and was processed eagerly,
              // we can use the eagerly computed state
              newState = update.eagerState;
            } else {
              newState = reducer(newState, action);
            }
          }

          update = update.next;
        } while (update !== null && update !== first);

        if (newBaseQueueLast === null) {
          newBaseState = newState;
        } else {
          newBaseQueueLast.next = newBaseQueueFirst;
        } // Mark that the fiber performed work, but only if the new state is
        // different from the current state.

        if (!objectIs(newState, hook.memoizedState)) {
          markWorkInProgressReceivedUpdate(); // Check if this update is part of a pending async action. If so, we'll
          // need to suspend until the action has finished, so that it's batched
          // together with future updates in the same action.
          // TODO: Once we support hooks inside useMemo (or an equivalent
          // memoization boundary like Forget), hoist this logic so that it only
          // suspends if the memo boundary produces a new value.

          if (didReadFromEntangledAsyncAction) {
            var entangledActionThenable = peekEntangledActionThenable();

            if (entangledActionThenable !== null) {
              // TODO: Instead of the throwing the thenable directly, throw a
              // special object like `use` does so we can detect if it's captured
              // by userspace.
              throw entangledActionThenable;
            }
          }
        }

        hook.memoizedState = newState;
        hook.baseState = newBaseState;
        hook.baseQueue = newBaseQueueLast;
        queue.lastRenderedState = newState;
      }

      if (baseQueue === null) {
        // `queue.lanes` is used for entangling transitions. We can set it back to
        // zero once the queue is empty.
        queue.lanes = NoLanes;
      }

      var dispatch = queue.dispatch;
      return [hook.memoizedState, dispatch];
    }

    function rerenderReducer(reducer, initialArg, init) {
      var hook = updateWorkInProgressHook();
      var queue = hook.queue;

      if (queue === null) {
        throw new Error(
          "Should have a queue. This is likely a bug in React. Please file an issue."
        );
      }

      queue.lastRenderedReducer = reducer; // This is a re-render. Apply the new render phase updates to the previous
      // work-in-progress hook.

      var dispatch = queue.dispatch;
      var lastRenderPhaseUpdate = queue.pending;
      var newState = hook.memoizedState;

      if (lastRenderPhaseUpdate !== null) {
        // The queue doesn't persist past this render pass.
        queue.pending = null;
        var firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        var update = firstRenderPhaseUpdate;

        do {
          // Process this render phase update. We don't have to check the
          // priority because it will always be the same as the current
          // render's.
          var action = update.action;
          newState = reducer(newState, action);
          update = update.next;
        } while (update !== firstRenderPhaseUpdate); // Mark that the fiber performed work, but only if the new state is
        // different from the current state.

        if (!objectIs(newState, hook.memoizedState)) {
          markWorkInProgressReceivedUpdate();
        }

        hook.memoizedState = newState; // Don't persist the state accumulated from the render phase updates to
        // the base state unless the queue is empty.
        // TODO: Not sure if this is the desired semantics, but it's what we
        // do for gDSFP. I can't remember why.

        if (hook.baseQueue === null) {
          hook.baseState = newState;
        }

        queue.lastRenderedState = newState;
      }

      return [newState, dispatch];
    }

    function mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
      var fiber = currentlyRenderingFiber$1;
      var hook = mountWorkInProgressHook();
      var nextSnapshot;

      {
        nextSnapshot = getSnapshot();

        {
          if (!didWarnUncachedGetSnapshot) {
            var cachedSnapshot = getSnapshot();

            if (!objectIs(nextSnapshot, cachedSnapshot)) {
              error(
                "The result of getSnapshot should be cached to avoid an infinite loop"
              );

              didWarnUncachedGetSnapshot = true;
            }
          }
        } // Unless we're rendering a blocking lane, schedule a consistency check.
        // Right before committing, we will walk the tree and check if any of the
        // stores were mutated.
        //
        // We won't do this if we're hydrating server-rendered content, because if
        // the content is stale, it's already visible anyway. Instead we'll patch
        // it up in a passive effect.

        var root = getWorkInProgressRoot();

        if (root === null) {
          throw new Error(
            "Expected a work-in-progress root. This is a bug in React. Please file an issue."
          );
        }

        var rootRenderLanes = getWorkInProgressRootRenderLanes();

        if (!includesBlockingLane(root, rootRenderLanes)) {
          pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
        }
      } // Read the current snapshot from the store on every render. This breaks the
      // normal rules of React, and only works because store updates are
      // always synchronous.

      hook.memoizedState = nextSnapshot;
      var inst = {
        value: nextSnapshot,
        getSnapshot: getSnapshot
      };
      hook.queue = inst; // Schedule an effect to subscribe to the store.

      mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
        subscribe
      ]); // Schedule an effect to update the mutable instance fields. We will update
      // this whenever subscribe, getSnapshot, or value changes. Because there's no
      // clean-up function, and we track the deps correctly, we can call pushEffect
      // directly, without storing any additional state. For the same reason, we
      // don't need to set a static flag, either.

      fiber.flags |= Passive$1;
      pushEffect(
        HasEffect | Passive,
        updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot),
        createEffectInstance(),
        null
      );
      return nextSnapshot;
    }

    function updateSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot
    ) {
      var fiber = currentlyRenderingFiber$1;
      var hook = updateWorkInProgressHook(); // Read the current snapshot from the store on every render. This breaks the
      // normal rules of React, and only works because store updates are
      // always synchronous.

      var nextSnapshot;

      {
        nextSnapshot = getSnapshot();

        {
          if (!didWarnUncachedGetSnapshot) {
            var cachedSnapshot = getSnapshot();

            if (!objectIs(nextSnapshot, cachedSnapshot)) {
              error(
                "The result of getSnapshot should be cached to avoid an infinite loop"
              );

              didWarnUncachedGetSnapshot = true;
            }
          }
        }
      }

      var prevSnapshot = (currentHook || hook).memoizedState;
      var snapshotChanged = !objectIs(prevSnapshot, nextSnapshot);

      if (snapshotChanged) {
        hook.memoizedState = nextSnapshot;
        markWorkInProgressReceivedUpdate();
      }

      var inst = hook.queue;
      updateEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
        subscribe
      ]); // Whenever getSnapshot or subscribe changes, we need to check in the
      // commit phase if there was an interleaved mutation. In concurrent mode
      // this can happen all the time, but even in synchronous mode, an earlier
      // effect may have mutated the store.

      if (
        inst.getSnapshot !== getSnapshot ||
        snapshotChanged || // Check if the subscribe function changed. We can save some memory by
        // checking whether we scheduled a subscription effect above.
        (workInProgressHook !== null &&
          workInProgressHook.memoizedState.tag & HasEffect)
      ) {
        fiber.flags |= Passive$1;
        pushEffect(
          HasEffect | Passive,
          updateStoreInstance.bind(
            null,
            fiber,
            inst,
            nextSnapshot,
            getSnapshot
          ),
          createEffectInstance(),
          null
        ); // Unless we're rendering a blocking lane, schedule a consistency check.
        // Right before committing, we will walk the tree and check if any of the
        // stores were mutated.

        var root = getWorkInProgressRoot();

        if (root === null) {
          throw new Error(
            "Expected a work-in-progress root. This is a bug in React. Please file an issue."
          );
        }

        if (!includesBlockingLane(root, renderLanes)) {
          pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
        }
      }

      return nextSnapshot;
    }

    function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
      fiber.flags |= StoreConsistency;
      var check = {
        getSnapshot: getSnapshot,
        value: renderedSnapshot
      };
      var componentUpdateQueue = currentlyRenderingFiber$1.updateQueue;

      if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber$1.updateQueue = componentUpdateQueue;
        componentUpdateQueue.stores = [check];
      } else {
        var stores = componentUpdateQueue.stores;

        if (stores === null) {
          componentUpdateQueue.stores = [check];
        } else {
          stores.push(check);
        }
      }
    }

    function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
      // These are updated in the passive phase
      inst.value = nextSnapshot;
      inst.getSnapshot = getSnapshot; // Something may have been mutated in between render and commit. This could
      // have been in an event that fired before the passive effects, or it could
      // have been in a layout effect. In that case, we would have used the old
      // snapsho and getSnapshot values to bail out. We need to check one more time.

      if (checkIfSnapshotChanged(inst)) {
        // Force a re-render.
        forceStoreRerender(fiber);
      }
    }

    function subscribeToStore(fiber, inst, subscribe) {
      var handleStoreChange = function () {
        // The store changed. Check if the snapshot changed since the last time we
        // read from the store.
        if (checkIfSnapshotChanged(inst)) {
          // Force a re-render.
          forceStoreRerender(fiber);
        }
      }; // Subscribe to the store and return a clean-up function.

      return subscribe(handleStoreChange);
    }

    function checkIfSnapshotChanged(inst) {
      var latestGetSnapshot = inst.getSnapshot;
      var prevValue = inst.value;

      try {
        var nextValue = latestGetSnapshot();
        return !objectIs(prevValue, nextValue);
      } catch (error) {
        return true;
      }
    }

    function forceStoreRerender(fiber) {
      var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

      if (root !== null) {
        scheduleUpdateOnFiber(root, fiber, SyncLane);
      }
    }

    function mountStateImpl(initialState) {
      var hook = mountWorkInProgressHook();

      if (typeof initialState === "function") {
        var initialStateInitializer = initialState; // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types

        initialState = initialStateInitializer();

        if (shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(true); // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types

          initialStateInitializer();
          setIsStrictModeForDevtools(false);
        }
      }

      hook.memoizedState = hook.baseState = initialState;
      var queue = {
        pending: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: initialState
      };
      hook.queue = queue;
      return hook;
    }

    function mountState(initialState) {
      var hook = mountStateImpl(initialState);
      var queue = hook.queue;
      var dispatch = dispatchSetState.bind(
        null,
        currentlyRenderingFiber$1,
        queue
      );
      queue.dispatch = dispatch;
      return [hook.memoizedState, dispatch];
    }

    function updateState(initialState) {
      return updateReducer(basicStateReducer);
    }

    function rerenderState(initialState) {
      return rerenderReducer(basicStateReducer);
    }

    function pushEffect(tag, create, inst, deps) {
      var effect = {
        tag: tag,
        create: create,
        inst: inst,
        deps: deps,
        // Circular
        next: null
      };
      var componentUpdateQueue = currentlyRenderingFiber$1.updateQueue;

      if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber$1.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
      } else {
        var lastEffect = componentUpdateQueue.lastEffect;

        if (lastEffect === null) {
          componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
          var firstEffect = lastEffect.next;
          lastEffect.next = effect;
          effect.next = firstEffect;
          componentUpdateQueue.lastEffect = effect;
        }
      }

      return effect;
    }

    function createEffectInstance() {
      return {
        destroy: undefined
      };
    }

    function mountRef(initialValue) {
      var hook = mountWorkInProgressHook();

      {
        var _ref2 = {
          current: initialValue
        };
        hook.memoizedState = _ref2;
        return _ref2;
      }
    }

    function updateRef(initialValue) {
      var hook = updateWorkInProgressHook();
      return hook.memoizedState;
    }

    function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
      var hook = mountWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      currentlyRenderingFiber$1.flags |= fiberFlags;
      hook.memoizedState = pushEffect(
        HasEffect | hookFlags,
        create,
        createEffectInstance(),
        nextDeps
      );
    }

    function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
      var hook = updateWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      var effect = hook.memoizedState;
      var inst = effect.inst; // currentHook is null on initial mount when rerendering after a render phase
      // state update or for strict mode.

      if (currentHook !== null) {
        if (nextDeps !== null) {
          var prevEffect = currentHook.memoizedState;
          var prevDeps = prevEffect.deps;

          if (areHookInputsEqual(nextDeps, prevDeps)) {
            hook.memoizedState = pushEffect(hookFlags, create, inst, nextDeps);
            return;
          }
        }
      }

      currentlyRenderingFiber$1.flags |= fiberFlags;
      hook.memoizedState = pushEffect(
        HasEffect | hookFlags,
        create,
        inst,
        nextDeps
      );
    }

    function mountEffect(create, deps) {
      if (
        (currentlyRenderingFiber$1.mode & StrictEffectsMode) !== NoMode &&
        (currentlyRenderingFiber$1.mode & NoStrictPassiveEffectsMode) === NoMode
      ) {
        mountEffectImpl(
          MountPassiveDev | Passive$1 | PassiveStatic,
          Passive,
          create,
          deps
        );
      } else {
        mountEffectImpl(Passive$1 | PassiveStatic, Passive, create, deps);
      }
    }

    function updateEffect(create, deps) {
      updateEffectImpl(Passive$1, Passive, create, deps);
    }

    function mountInsertionEffect(create, deps) {
      mountEffectImpl(Update, Insertion, create, deps);
    }

    function updateInsertionEffect(create, deps) {
      return updateEffectImpl(Update, Insertion, create, deps);
    }

    function mountLayoutEffect(create, deps) {
      var fiberFlags = Update | LayoutStatic;

      if ((currentlyRenderingFiber$1.mode & StrictEffectsMode) !== NoMode) {
        fiberFlags |= MountLayoutDev;
      }

      return mountEffectImpl(fiberFlags, Layout, create, deps);
    }

    function updateLayoutEffect(create, deps) {
      return updateEffectImpl(Update, Layout, create, deps);
    }

    function imperativeHandleEffect(create, ref) {
      if (typeof ref === "function") {
        var refCallback = ref;
        var inst = create();
        refCallback(inst);
        return function () {
          refCallback(null);
        };
      } else if (ref !== null && ref !== undefined) {
        var refObject = ref;

        {
          if (!refObject.hasOwnProperty("current")) {
            error(
              "Expected useImperativeHandle() first argument to either be a " +
                "ref callback or React.createRef() object. Instead received: %s.",
              "an object with keys {" + Object.keys(refObject).join(", ") + "}"
            );
          }
        }

        var _inst = create();

        refObject.current = _inst;
        return function () {
          refObject.current = null;
        };
      }
    }

    function mountImperativeHandle(ref, create, deps) {
      {
        if (typeof create !== "function") {
          error(
            "Expected useImperativeHandle() second argument to be a function " +
              "that creates a handle. Instead received: %s.",
            create !== null ? typeof create : "null"
          );
        }
      } // TODO: If deps are provided, should we skip comparing the ref itself?

      var effectDeps =
        deps !== null && deps !== undefined ? deps.concat([ref]) : null;
      var fiberFlags = Update | LayoutStatic;

      if ((currentlyRenderingFiber$1.mode & StrictEffectsMode) !== NoMode) {
        fiberFlags |= MountLayoutDev;
      }

      mountEffectImpl(
        fiberFlags,
        Layout,
        imperativeHandleEffect.bind(null, create, ref),
        effectDeps
      );
    }

    function updateImperativeHandle(ref, create, deps) {
      {
        if (typeof create !== "function") {
          error(
            "Expected useImperativeHandle() second argument to be a function " +
              "that creates a handle. Instead received: %s.",
            create !== null ? typeof create : "null"
          );
        }
      } // TODO: If deps are provided, should we skip comparing the ref itself?

      var effectDeps =
        deps !== null && deps !== undefined ? deps.concat([ref]) : null;
      updateEffectImpl(
        Update,
        Layout,
        imperativeHandleEffect.bind(null, create, ref),
        effectDeps
      );
    }

    function mountDebugValue(value, formatterFn) {
      // This hook is normally a no-op.
      // The react-debug-hooks package injects its own implementation
      // so that e.g. DevTools can display custom hook values.
    }

    var updateDebugValue = mountDebugValue;

    function mountCallback(callback, deps) {
      var hook = mountWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      hook.memoizedState = [callback, nextDeps];
      return callback;
    }

    function updateCallback(callback, deps) {
      var hook = updateWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      var prevState = hook.memoizedState;

      if (nextDeps !== null) {
        var prevDeps = prevState[1];

        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0];
        }
      }

      hook.memoizedState = [callback, nextDeps];
      return callback;
    }

    function mountMemo(nextCreate, deps) {
      var hook = mountWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      var nextValue = nextCreate();

      if (shouldDoubleInvokeUserFnsInHooksDEV) {
        setIsStrictModeForDevtools(true);
        nextCreate();
        setIsStrictModeForDevtools(false);
      }

      hook.memoizedState = [nextValue, nextDeps];
      return nextValue;
    }

    function updateMemo(nextCreate, deps) {
      var hook = updateWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      var prevState = hook.memoizedState; // Assume these are defined. If they're not, areHookInputsEqual will warn.

      if (nextDeps !== null) {
        var prevDeps = prevState[1];

        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0];
        }
      }

      var nextValue = nextCreate();

      if (shouldDoubleInvokeUserFnsInHooksDEV) {
        setIsStrictModeForDevtools(true);
        nextCreate();
        setIsStrictModeForDevtools(false);
      }

      hook.memoizedState = [nextValue, nextDeps];
      return nextValue;
    }

    function mountDeferredValue(value, initialValue) {
      var hook = mountWorkInProgressHook();
      return mountDeferredValueImpl(hook, value, initialValue);
    }

    function updateDeferredValue(value, initialValue) {
      var hook = updateWorkInProgressHook();
      var resolvedCurrentHook = currentHook;
      var prevValue = resolvedCurrentHook.memoizedState;
      return updateDeferredValueImpl(hook, prevValue, value, initialValue);
    }

    function rerenderDeferredValue(value, initialValue) {
      var hook = updateWorkInProgressHook();

      if (currentHook === null) {
        // This is a rerender during a mount.
        return mountDeferredValueImpl(hook, value, initialValue);
      } else {
        // This is a rerender during an update.
        var prevValue = currentHook.memoizedState;
        return updateDeferredValueImpl(hook, prevValue, value, initialValue);
      }
    }

    function mountDeferredValueImpl(hook, value, initialValue) {
      if (
        // When `initialValue` is provided, we defer the initial render even if the
        // current render is not synchronous.
        initialValue !== undefined && // However, to avoid waterfalls, we do not defer if this render
        // was itself spawned by an earlier useDeferredValue. Check if DeferredLane
        // is part of the render lanes.
        !includesSomeLane(renderLanes, DeferredLane)
      ) {
        // Render with the initial value
        hook.memoizedState = initialValue; // Schedule a deferred render to switch to the final value.

        var deferredLane = requestDeferredLane();
        currentlyRenderingFiber$1.lanes = mergeLanes(
          currentlyRenderingFiber$1.lanes,
          deferredLane
        );
        markSkippedUpdateLanes(deferredLane);
        return initialValue;
      } else {
        hook.memoizedState = value;
        return value;
      }
    }

    function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
      if (objectIs(value, prevValue)) {
        // The incoming value is referentially identical to the currently rendered
        // value, so we can bail out quickly.
        return value;
      } else {
        // Received a new value that's different from the current value.
        // Check if we're inside a hidden tree
        if (isCurrentTreeHidden()) {
          // Revealing a prerendered tree is considered the same as mounting new
          // one, so we reuse the "mount" path in this case.
          var resultValue = mountDeferredValueImpl(hook, value, initialValue); // Unlike during an actual mount, we need to mark this as an update if
          // the value changed.

          if (!objectIs(resultValue, prevValue)) {
            markWorkInProgressReceivedUpdate();
          }

          return resultValue;
        }

        var shouldDeferValue = !includesOnlyNonUrgentLanes(renderLanes);

        if (shouldDeferValue) {
          // This is an urgent update. Since the value has changed, keep using the
          // previous value and spawn a deferred render to update it later.
          // Schedule a deferred render
          var deferredLane = requestDeferredLane();
          currentlyRenderingFiber$1.lanes = mergeLanes(
            currentlyRenderingFiber$1.lanes,
            deferredLane
          );
          markSkippedUpdateLanes(deferredLane); // Reuse the previous value. We do not need to mark this as an update,
          // because we did not render a new value.

          return prevValue;
        } else {
          // This is not an urgent update, so we can use the latest value regardless
          // of what it is. No need to defer it.
          // Mark this as an update to prevent the fiber from bailing out.
          markWorkInProgressReceivedUpdate();
          hook.memoizedState = value;
          return value;
        }
      }
    }

    function startTransition(
      fiber,
      queue,
      pendingState,
      finishedState,
      callback,
      options
    ) {
      var previousPriority = getCurrentUpdatePriority();
      setCurrentUpdatePriority(
        higherEventPriority(previousPriority, ContinuousEventPriority)
      );
      var prevTransition = ReactCurrentBatchConfig$2.transition;
      var currentTransition = {
        _callbacks: new Set()
      };

      {
        ReactCurrentBatchConfig$2.transition = null;
        dispatchSetState(fiber, queue, pendingState);
        ReactCurrentBatchConfig$2.transition = currentTransition;
      }

      {
        ReactCurrentBatchConfig$2.transition._updatedFibers = new Set();
      }

      try {
        var returnValue, thenable, thenableForFinishedState;
        if (enableAsyncActions);
        else {
          // Async actions are not enabled.
          dispatchSetState(fiber, queue, finishedState);
          callback();
        }
      } catch (error) {
        {
          // The error rethrowing behavior is only enabled when the async actions
          // feature is on, even for sync actions.
          throw error;
        }
      } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig$2.transition = prevTransition;

        {
          if (prevTransition === null && currentTransition._updatedFibers) {
            var updatedFibersCount = currentTransition._updatedFibers.size;

            currentTransition._updatedFibers.clear();

            if (updatedFibersCount > 10) {
              warn(
                "Detected a large number of updates inside startTransition. " +
                  "If this is due to a subscription please re-write it to use React provided hooks. " +
                  "Otherwise concurrent mode guarantees are off the table."
              );
            }
          }
        }
      }
    }

    function mountTransition() {
      var stateHook = mountStateImpl(false); // The `start` method never changes.

      var start = startTransition.bind(
        null,
        currentlyRenderingFiber$1,
        stateHook.queue,
        true,
        false
      );
      var hook = mountWorkInProgressHook();
      hook.memoizedState = start;
      return [false, start];
    }

    function updateTransition() {
      var _updateState2 = updateState(),
        booleanOrThenable = _updateState2[0];

      var hook = updateWorkInProgressHook();
      var start = hook.memoizedState;
      var isPending =
        typeof booleanOrThenable === "boolean"
          ? booleanOrThenable // This will suspend until the async action scope has finished.
          : useThenable(booleanOrThenable);
      return [isPending, start];
    }

    function rerenderTransition() {
      var _rerenderState = rerenderState(),
        booleanOrThenable = _rerenderState[0];

      var hook = updateWorkInProgressHook();
      var start = hook.memoizedState;
      var isPending =
        typeof booleanOrThenable === "boolean"
          ? booleanOrThenable // This will suspend until the async action scope has finished.
          : useThenable(booleanOrThenable);
      return [isPending, start];
    }

    function mountId() {
      var hook = mountWorkInProgressHook();
      var root = getWorkInProgressRoot(); // TODO: In Fizz, id generation is specific to each server config. Maybe we
      // should do this in Fiber, too? Deferring this decision for now because
      // there's no other place to store the prefix except for an internal field on
      // the public createRoot object, which the fiber tree does not currently have
      // a reference to.

      var identifierPrefix = root.identifierPrefix;
      var id;

      {
        // Use a lowercase r prefix for client-generated ids.
        var globalClientId = globalClientIdCounter++;
        id = ":" + identifierPrefix + "r" + globalClientId.toString(32) + ":";
      }

      hook.memoizedState = id;
      return id;
    }

    function updateId() {
      var hook = updateWorkInProgressHook();
      var id = hook.memoizedState;
      return id;
    }

    function dispatchReducerAction(fiber, queue, action) {
      {
        if (typeof arguments[3] === "function") {
          error(
            "State updates from the useState() and useReducer() Hooks don't support the " +
              "second callback argument. To execute a side effect after " +
              "rendering, declare it in the component body with useEffect()."
          );
        }
      }

      var lane = requestUpdateLane(fiber);
      var update = {
        lane: lane,
        revertLane: NoLane,
        action: action,
        hasEagerState: false,
        eagerState: null,
        next: null
      };

      if (isRenderPhaseUpdate(fiber)) {
        enqueueRenderPhaseUpdate(queue, update);
      } else {
        var root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, lane);
          entangleTransitionUpdate(root, queue, lane);
        }
      }
    }

    function dispatchSetState(fiber, queue, action) {
      {
        if (typeof arguments[3] === "function") {
          error(
            "State updates from the useState() and useReducer() Hooks don't support the " +
              "second callback argument. To execute a side effect after " +
              "rendering, declare it in the component body with useEffect()."
          );
        }
      }

      var lane = requestUpdateLane(fiber);
      var update = {
        lane: lane,
        revertLane: NoLane,
        action: action,
        hasEagerState: false,
        eagerState: null,
        next: null
      };

      if (isRenderPhaseUpdate(fiber)) {
        enqueueRenderPhaseUpdate(queue, update);
      } else {
        var alternate = fiber.alternate;

        if (
          fiber.lanes === NoLanes &&
          (alternate === null || alternate.lanes === NoLanes)
        ) {
          // The queue is currently empty, which means we can eagerly compute the
          // next state before entering the render phase. If the new state is the
          // same as the current state, we may be able to bail out entirely.
          var lastRenderedReducer = queue.lastRenderedReducer;

          if (lastRenderedReducer !== null) {
            var prevDispatcher;

            {
              prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current =
                InvalidNestedHooksDispatcherOnUpdateInDEV;
            }

            try {
              var currentState = queue.lastRenderedState;
              var eagerState = lastRenderedReducer(currentState, action); // Stash the eagerly computed state, and the reducer used to compute
              // it, on the update object. If the reducer hasn't changed by the
              // time we enter the render phase, then the eager state can be used
              // without calling the reducer again.

              update.hasEagerState = true;
              update.eagerState = eagerState;

              if (objectIs(eagerState, currentState)) {
                // Fast path. We can bail out without scheduling React to re-render.
                // It's still possible that we'll need to rebase this update later,
                // if the component re-renders for a different reason and by that
                // time the reducer has changed.
                // TODO: Do we still need to entangle transitions in this case?
                enqueueConcurrentHookUpdateAndEagerlyBailout(
                  fiber,
                  queue,
                  update
                );
                return;
              }
            } catch (error) {
              // Suppress the error. It will throw again in the render phase.
            } finally {
              {
                ReactCurrentDispatcher$1.current = prevDispatcher;
              }
            }
          }
        }

        var root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, lane);
          entangleTransitionUpdate(root, queue, lane);
        }
      }
    }

    function isRenderPhaseUpdate(fiber) {
      var alternate = fiber.alternate;
      return (
        fiber === currentlyRenderingFiber$1 ||
        (alternate !== null && alternate === currentlyRenderingFiber$1)
      );
    }

    function enqueueRenderPhaseUpdate(queue, update) {
      // This is a render phase update. Stash it in a lazily-created map of
      // queue -> linked list of updates. After this render pass, we'll restart
      // and apply the stashed updates on top of the work-in-progress hook.
      didScheduleRenderPhaseUpdateDuringThisPass =
        didScheduleRenderPhaseUpdate = true;
      var pending = queue.pending;

      if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }

      queue.pending = update;
    } // TODO: Move to ReactFiberConcurrentUpdates?

    function entangleTransitionUpdate(root, queue, lane) {
      if (isTransitionLane(lane)) {
        var queueLanes = queue.lanes; // If any entangled lanes are no longer pending on the root, then they
        // must have finished. We can remove them from the shared queue, which
        // represents a superset of the actually pending lanes. In some cases we
        // may entangle more than we need to, but that's OK. In fact it's worse if
        // we *don't* entangle when we should.

        queueLanes = intersectLanes(queueLanes, root.pendingLanes); // Entangle the new transition lane with the other transition lanes.

        var newQueueLanes = mergeLanes(queueLanes, lane);
        queue.lanes = newQueueLanes; // Even if queue.lanes already include lane, we don't know for certain if
        // the lane finished since the last time we entangled it. So we need to
        // entangle it again, just to be sure.

        markRootEntangled(root, newQueueLanes);
      }
    }

    var ContextOnlyDispatcher = {
      readContext: readContext,
      use: use,
      useCallback: throwInvalidHookError,
      useContext: throwInvalidHookError,
      useEffect: throwInvalidHookError,
      useImperativeHandle: throwInvalidHookError,
      useInsertionEffect: throwInvalidHookError,
      useLayoutEffect: throwInvalidHookError,
      useMemo: throwInvalidHookError,
      useReducer: throwInvalidHookError,
      useRef: throwInvalidHookError,
      useState: throwInvalidHookError,
      useDebugValue: throwInvalidHookError,
      useDeferredValue: throwInvalidHookError,
      useTransition: throwInvalidHookError,
      useSyncExternalStore: throwInvalidHookError,
      useId: throwInvalidHookError
    };

    var HooksDispatcherOnMountInDEV = null;
    var HooksDispatcherOnMountWithHookTypesInDEV = null;
    var HooksDispatcherOnUpdateInDEV = null;
    var HooksDispatcherOnRerenderInDEV = null;
    var InvalidNestedHooksDispatcherOnMountInDEV = null;
    var InvalidNestedHooksDispatcherOnUpdateInDEV = null;
    var InvalidNestedHooksDispatcherOnRerenderInDEV = null;

    {
      var warnInvalidContextAccess = function () {
        error(
          "Context can only be read while React is rendering. " +
            "In classes, you can read it in the render method or getDerivedStateFromProps. " +
            "In function components, you can read it directly in the function body, but not " +
            "inside Hooks like useReducer() or useMemo()."
        );
      };

      var warnInvalidHookAccess = function () {
        error(
          "Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. " +
            "You can only call Hooks at the top level of your React function. " +
            "For more information, see " +
            "https://react.dev/link/rules-of-hooks"
        );
      };

      HooksDispatcherOnMountInDEV = {
        readContext: function (context) {
          return readContext(context);
        },
        use: use,
        useCallback: function (callback, deps) {
          currentHookNameInDev = "useCallback";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountCallback(callback, deps);
        },
        useContext: function (context) {
          currentHookNameInDev = "useContext";
          mountHookTypesDev();
          return readContext(context);
        },
        useEffect: function (create, deps) {
          currentHookNameInDev = "useEffect";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountEffect(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountInsertionEffect(create, deps);
        },
        useLayoutEffect: function (create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountLayoutEffect(create, deps);
        },
        useMemo: function (create, deps) {
          currentHookNameInDev = "useMemo";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function (reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function (initialValue) {
          currentHookNameInDev = "useRef";
          mountHookTypesDev();
          return mountRef(initialValue);
        },
        useState: function (initialState) {
          currentHookNameInDev = "useState";
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function (value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          mountHookTypesDev();
          return mountDebugValue();
        },
        useDeferredValue: function (value, initialValue) {
          currentHookNameInDev = "useDeferredValue";
          mountHookTypesDev();
          return mountDeferredValue(value, initialValue);
        },
        useTransition: function () {
          currentHookNameInDev = "useTransition";
          mountHookTypesDev();
          return mountTransition();
        },
        useSyncExternalStore: function (
          subscribe,
          getSnapshot,
          getServerSnapshot
        ) {
          currentHookNameInDev = "useSyncExternalStore";
          mountHookTypesDev();
          return mountSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function () {
          currentHookNameInDev = "useId";
          mountHookTypesDev();
          return mountId();
        }
      };

      HooksDispatcherOnMountWithHookTypesInDEV = {
        readContext: function (context) {
          return readContext(context);
        },
        use: use,
        useCallback: function (callback, deps) {
          currentHookNameInDev = "useCallback";
          updateHookTypesDev();
          return mountCallback(callback, deps);
        },
        useContext: function (context) {
          currentHookNameInDev = "useContext";
          updateHookTypesDev();
          return readContext(context);
        },
        useEffect: function (create, deps) {
          currentHookNameInDev = "useEffect";
          updateHookTypesDev();
          return mountEffect(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          updateHookTypesDev();
          return mountImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          updateHookTypesDev();
          return mountInsertionEffect(create, deps);
        },
        useLayoutEffect: function (create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          updateHookTypesDev();
          return mountLayoutEffect(create, deps);
        },
        useMemo: function (create, deps) {
          currentHookNameInDev = "useMemo";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function (reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function (initialValue) {
          currentHookNameInDev = "useRef";
          updateHookTypesDev();
          return mountRef(initialValue);
        },
        useState: function (initialState) {
          currentHookNameInDev = "useState";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function (value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          updateHookTypesDev();
          return mountDebugValue();
        },
        useDeferredValue: function (value, initialValue) {
          currentHookNameInDev = "useDeferredValue";
          updateHookTypesDev();
          return mountDeferredValue(value, initialValue);
        },
        useTransition: function () {
          currentHookNameInDev = "useTransition";
          updateHookTypesDev();
          return mountTransition();
        },
        useSyncExternalStore: function (
          subscribe,
          getSnapshot,
          getServerSnapshot
        ) {
          currentHookNameInDev = "useSyncExternalStore";
          updateHookTypesDev();
          return mountSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function () {
          currentHookNameInDev = "useId";
          updateHookTypesDev();
          return mountId();
        }
      };

      HooksDispatcherOnUpdateInDEV = {
        readContext: function (context) {
          return readContext(context);
        },
        use: use,
        useCallback: function (callback, deps) {
          currentHookNameInDev = "useCallback";
          updateHookTypesDev();
          return updateCallback(callback, deps);
        },
        useContext: function (context) {
          currentHookNameInDev = "useContext";
          updateHookTypesDev();
          return readContext(context);
        },
        useEffect: function (create, deps) {
          currentHookNameInDev = "useEffect";
          updateHookTypesDev();
          return updateEffect(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          updateHookTypesDev();
          return updateImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          updateHookTypesDev();
          return updateInsertionEffect(create, deps);
        },
        useLayoutEffect: function (create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          updateHookTypesDev();
          return updateLayoutEffect(create, deps);
        },
        useMemo: function (create, deps) {
          currentHookNameInDev = "useMemo";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return updateMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function (reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return updateReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function (initialValue) {
          currentHookNameInDev = "useRef";
          updateHookTypesDev();
          return updateRef();
        },
        useState: function (initialState) {
          currentHookNameInDev = "useState";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return updateState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function (value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          updateHookTypesDev();
          return updateDebugValue();
        },
        useDeferredValue: function (value, initialValue) {
          currentHookNameInDev = "useDeferredValue";
          updateHookTypesDev();
          return updateDeferredValue(value, initialValue);
        },
        useTransition: function () {
          currentHookNameInDev = "useTransition";
          updateHookTypesDev();
          return updateTransition();
        },
        useSyncExternalStore: function (
          subscribe,
          getSnapshot,
          getServerSnapshot
        ) {
          currentHookNameInDev = "useSyncExternalStore";
          updateHookTypesDev();
          return updateSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function () {
          currentHookNameInDev = "useId";
          updateHookTypesDev();
          return updateId();
        }
      };

      HooksDispatcherOnRerenderInDEV = {
        readContext: function (context) {
          return readContext(context);
        },
        use: use,
        useCallback: function (callback, deps) {
          currentHookNameInDev = "useCallback";
          updateHookTypesDev();
          return updateCallback(callback, deps);
        },
        useContext: function (context) {
          currentHookNameInDev = "useContext";
          updateHookTypesDev();
          return readContext(context);
        },
        useEffect: function (create, deps) {
          currentHookNameInDev = "useEffect";
          updateHookTypesDev();
          return updateEffect(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          updateHookTypesDev();
          return updateImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          updateHookTypesDev();
          return updateInsertionEffect(create, deps);
        },
        useLayoutEffect: function (create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          updateHookTypesDev();
          return updateLayoutEffect(create, deps);
        },
        useMemo: function (create, deps) {
          currentHookNameInDev = "useMemo";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnRerenderInDEV;

          try {
            return updateMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function (reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnRerenderInDEV;

          try {
            return rerenderReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function (initialValue) {
          currentHookNameInDev = "useRef";
          updateHookTypesDev();
          return updateRef();
        },
        useState: function (initialState) {
          currentHookNameInDev = "useState";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnRerenderInDEV;

          try {
            return rerenderState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function (value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          updateHookTypesDev();
          return updateDebugValue();
        },
        useDeferredValue: function (value, initialValue) {
          currentHookNameInDev = "useDeferredValue";
          updateHookTypesDev();
          return rerenderDeferredValue(value, initialValue);
        },
        useTransition: function () {
          currentHookNameInDev = "useTransition";
          updateHookTypesDev();
          return rerenderTransition();
        },
        useSyncExternalStore: function (
          subscribe,
          getSnapshot,
          getServerSnapshot
        ) {
          currentHookNameInDev = "useSyncExternalStore";
          updateHookTypesDev();
          return updateSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function () {
          currentHookNameInDev = "useId";
          updateHookTypesDev();
          return updateId();
        }
      };

      InvalidNestedHooksDispatcherOnMountInDEV = {
        readContext: function (context) {
          warnInvalidContextAccess();
          return readContext(context);
        },
        use: function (usable) {
          warnInvalidHookAccess();
          return use(usable);
        },
        useCallback: function (callback, deps) {
          currentHookNameInDev = "useCallback";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountCallback(callback, deps);
        },
        useContext: function (context) {
          currentHookNameInDev = "useContext";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return readContext(context);
        },
        useEffect: function (create, deps) {
          currentHookNameInDev = "useEffect";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountEffect(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountInsertionEffect(create, deps);
        },
        useLayoutEffect: function (create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountLayoutEffect(create, deps);
        },
        useMemo: function (create, deps) {
          currentHookNameInDev = "useMemo";
          warnInvalidHookAccess();
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function (reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          warnInvalidHookAccess();
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function (initialValue) {
          currentHookNameInDev = "useRef";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountRef(initialValue);
        },
        useState: function (initialState) {
          currentHookNameInDev = "useState";
          warnInvalidHookAccess();
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnMountInDEV;

          try {
            return mountState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function (value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountDebugValue();
        },
        useDeferredValue: function (value, initialValue) {
          currentHookNameInDev = "useDeferredValue";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountDeferredValue(value, initialValue);
        },
        useTransition: function () {
          currentHookNameInDev = "useTransition";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountTransition();
        },
        useSyncExternalStore: function (
          subscribe,
          getSnapshot,
          getServerSnapshot
        ) {
          currentHookNameInDev = "useSyncExternalStore";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function () {
          currentHookNameInDev = "useId";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountId();
        }
      };

      InvalidNestedHooksDispatcherOnUpdateInDEV = {
        readContext: function (context) {
          warnInvalidContextAccess();
          return readContext(context);
        },
        use: function (usable) {
          warnInvalidHookAccess();
          return use(usable);
        },
        useCallback: function (callback, deps) {
          currentHookNameInDev = "useCallback";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateCallback(callback, deps);
        },
        useContext: function (context) {
          currentHookNameInDev = "useContext";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return readContext(context);
        },
        useEffect: function (create, deps) {
          currentHookNameInDev = "useEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateEffect(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateInsertionEffect(create, deps);
        },
        useLayoutEffect: function (create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateLayoutEffect(create, deps);
        },
        useMemo: function (create, deps) {
          currentHookNameInDev = "useMemo";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return updateMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function (reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return updateReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function (initialValue) {
          currentHookNameInDev = "useRef";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateRef();
        },
        useState: function (initialState) {
          currentHookNameInDev = "useState";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return updateState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function (value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateDebugValue();
        },
        useDeferredValue: function (value, initialValue) {
          currentHookNameInDev = "useDeferredValue";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateDeferredValue(value, initialValue);
        },
        useTransition: function () {
          currentHookNameInDev = "useTransition";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateTransition();
        },
        useSyncExternalStore: function (
          subscribe,
          getSnapshot,
          getServerSnapshot
        ) {
          currentHookNameInDev = "useSyncExternalStore";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function () {
          currentHookNameInDev = "useId";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateId();
        }
      };

      InvalidNestedHooksDispatcherOnRerenderInDEV = {
        readContext: function (context) {
          warnInvalidContextAccess();
          return readContext(context);
        },
        use: function (usable) {
          warnInvalidHookAccess();
          return use(usable);
        },
        useCallback: function (callback, deps) {
          currentHookNameInDev = "useCallback";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateCallback(callback, deps);
        },
        useContext: function (context) {
          currentHookNameInDev = "useContext";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return readContext(context);
        },
        useEffect: function (create, deps) {
          currentHookNameInDev = "useEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateEffect(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateInsertionEffect(create, deps);
        },
        useLayoutEffect: function (create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateLayoutEffect(create, deps);
        },
        useMemo: function (create, deps) {
          currentHookNameInDev = "useMemo";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return updateMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function (reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return rerenderReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function (initialValue) {
          currentHookNameInDev = "useRef";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateRef();
        },
        useState: function (initialState) {
          currentHookNameInDev = "useState";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current =
            InvalidNestedHooksDispatcherOnUpdateInDEV;

          try {
            return rerenderState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function (value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateDebugValue();
        },
        useDeferredValue: function (value, initialValue) {
          currentHookNameInDev = "useDeferredValue";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return rerenderDeferredValue(value, initialValue);
        },
        useTransition: function () {
          currentHookNameInDev = "useTransition";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return rerenderTransition();
        },
        useSyncExternalStore: function (
          subscribe,
          getSnapshot,
          getServerSnapshot
        ) {
          currentHookNameInDev = "useSyncExternalStore";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function () {
          currentHookNameInDev = "useId";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateId();
        }
      };
    }

    var now = Scheduler.unstable_now;
    var commitTime = 0;
    var layoutEffectStartTime = -1;
    var profilerStartTime = -1;
    var passiveEffectStartTime = -1;
    /**
     * Tracks whether the current update was a nested/cascading update (scheduled from a layout effect).
     *
     * The overall sequence is:
     *   1. render
     *   2. commit (and call `onRender`, `onCommit`)
     *   3. check for nested updates
     *   4. flush passive effects (and call `onPostCommit`)
     *
     * Nested updates are identified in step 3 above,
     * but step 4 still applies to the work that was just committed.
     * We use two flags to track nested updates then:
     * one tracks whether the upcoming update is a nested update,
     * and the other tracks whether the current update was a nested update.
     * The first value gets synced to the second at the start of the render phase.
     */

    var currentUpdateIsNested = false;
    var nestedUpdateScheduled = false;

    function isCurrentUpdateNested() {
      return currentUpdateIsNested;
    }

    function markNestedUpdateScheduled() {
      {
        nestedUpdateScheduled = true;
      }
    }

    function resetNestedUpdateFlag() {
      {
        currentUpdateIsNested = false;
        nestedUpdateScheduled = false;
      }
    }

    function syncNestedUpdateFlag() {
      {
        currentUpdateIsNested = nestedUpdateScheduled;
        nestedUpdateScheduled = false;
      }
    }

    function getCommitTime() {
      return commitTime;
    }

    function recordCommitTime() {
      commitTime = now();
    }

    function startProfilerTimer(fiber) {
      profilerStartTime = now();

      if (fiber.actualStartTime < 0) {
        fiber.actualStartTime = now();
      }
    }

    function stopProfilerTimerIfRunning(fiber) {
      profilerStartTime = -1;
    }

    function stopProfilerTimerIfRunningAndRecordDelta(fiber, overrideBaseTime) {
      if (profilerStartTime >= 0) {
        var elapsedTime = now() - profilerStartTime;
        fiber.actualDuration += elapsedTime;

        if (overrideBaseTime) {
          fiber.selfBaseDuration = elapsedTime;
        }

        profilerStartTime = -1;
      }
    }

    function recordLayoutEffectDuration(fiber) {
      if (layoutEffectStartTime >= 0) {
        var elapsedTime = now() - layoutEffectStartTime;
        layoutEffectStartTime = -1; // Store duration on the next nearest Profiler ancestor
        // Or the root (for the DevTools Profiler to read)

        var parentFiber = fiber.return;

        while (parentFiber !== null) {
          switch (parentFiber.tag) {
            case HostRoot:
              var root = parentFiber.stateNode;
              root.effectDuration += elapsedTime;
              return;

            case Profiler:
              var parentStateNode = parentFiber.stateNode;
              parentStateNode.effectDuration += elapsedTime;
              return;
          }

          parentFiber = parentFiber.return;
        }
      }
    }

    function recordPassiveEffectDuration(fiber) {
      if (passiveEffectStartTime >= 0) {
        var elapsedTime = now() - passiveEffectStartTime;
        passiveEffectStartTime = -1; // Store duration on the next nearest Profiler ancestor
        // Or the root (for the DevTools Profiler to read)

        var parentFiber = fiber.return;

        while (parentFiber !== null) {
          switch (parentFiber.tag) {
            case HostRoot:
              var root = parentFiber.stateNode;

              if (root !== null) {
                root.passiveEffectDuration += elapsedTime;
              }

              return;

            case Profiler:
              var parentStateNode = parentFiber.stateNode;

              if (parentStateNode !== null) {
                // Detached fibers have their state node cleared out.
                // In this case, the return pointer is also cleared out,
                // so we won't be able to report the time spent in this Profiler's subtree.
                parentStateNode.passiveEffectDuration += elapsedTime;
              }

              return;
          }

          parentFiber = parentFiber.return;
        }
      }
    }

    function startLayoutEffectTimer() {
      layoutEffectStartTime = now();
    }

    function startPassiveEffectTimer() {
      passiveEffectStartTime = now();
    }

    function transferActualDuration(fiber) {
      // Transfer time spent rendering these children so we don't lose it
      // after we rerender. This is used as a helper in special cases
      // where we should count the work of multiple passes.
      var child = fiber.child;

      while (child) {
        // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
        fiber.actualDuration += child.actualDuration;
        child = child.sibling;
      }
    }

    function resolveDefaultProps(Component, baseProps) {
      if (Component && Component.defaultProps) {
        // Resolve default props. Taken from ReactElement
        var props = assign({}, baseProps);
        var defaultProps = Component.defaultProps;

        for (var propName in defaultProps) {
          if (props[propName] === undefined) {
            props[propName] = defaultProps[propName];
          }
        }

        return props;
      }

      return baseProps;
    }

    var fakeInternalInstance = {};
    var didWarnAboutStateAssignmentForComponent;
    var didWarnAboutUninitializedState;
    var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
    var didWarnAboutLegacyLifecyclesAndDerivedState;
    var didWarnAboutUndefinedDerivedState;
    var didWarnAboutDirectlyAssigningPropsToState;
    var didWarnAboutInvalidateContextType;
    var didWarnOnInvalidCallback;

    {
      didWarnAboutStateAssignmentForComponent = new Set();
      didWarnAboutUninitializedState = new Set();
      didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
      didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
      didWarnAboutDirectlyAssigningPropsToState = new Set();
      didWarnAboutUndefinedDerivedState = new Set();
      didWarnAboutInvalidateContextType = new Set();
      didWarnOnInvalidCallback = new Set(); // This is so gross but it's at least non-critical and can be removed if
      // it causes problems. This is meant to give a nicer error message for
      // ReactDOM15.unstable_renderSubtreeIntoContainer(reactDOM16Component,
      // ...)) which otherwise throws a "_processChildContext is not a function"
      // exception.

      Object.defineProperty(fakeInternalInstance, "_processChildContext", {
        enumerable: false,
        value: function () {
          throw new Error(
            "_processChildContext is not available in React 16+. This likely " +
              "means you have multiple copies of React and are attempting to nest " +
              "a React 15 tree inside a React 16 tree using " +
              "unstable_renderSubtreeIntoContainer, which isn't supported. Try " +
              "to make sure you have only one copy of React (and ideally, switch " +
              "to ReactDOM.createPortal)."
          );
        }
      });
      Object.freeze(fakeInternalInstance);
    }

    function warnOnInvalidCallback(callback) {
      {
        if (callback === null || typeof callback === "function") {
          return;
        } // eslint-disable-next-line react-internal/safe-string-coercion

        var key = String(callback);

        if (!didWarnOnInvalidCallback.has(key)) {
          didWarnOnInvalidCallback.add(key);

          error(
            "Expected the last optional `callback` argument to be a " +
              "function. Instead received: %s.",
            callback
          );
        }
      }
    }

    function warnOnUndefinedDerivedState(type, partialState) {
      {
        if (partialState === undefined) {
          var componentName = getComponentNameFromType(type) || "Component";

          if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
            didWarnAboutUndefinedDerivedState.add(componentName);

            error(
              "%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. " +
                "You have returned undefined.",
              componentName
            );
          }
        }
      }
    }

    function applyDerivedStateFromProps(
      workInProgress,
      ctor,
      getDerivedStateFromProps,
      nextProps
    ) {
      var prevState = workInProgress.memoizedState;
      var partialState = getDerivedStateFromProps(nextProps, prevState);

      {
        if (workInProgress.mode & StrictLegacyMode) {
          setIsStrictModeForDevtools(true);

          try {
            // Invoke the function an extra time to help detect side-effects.
            partialState = getDerivedStateFromProps(nextProps, prevState);
          } finally {
            setIsStrictModeForDevtools(false);
          }
        }

        warnOnUndefinedDerivedState(ctor, partialState);
      } // Merge the partial state and the previous state.

      var memoizedState =
        partialState === null || partialState === undefined
          ? prevState
          : assign({}, prevState, partialState);
      workInProgress.memoizedState = memoizedState; // Once the update queue is empty, persist the derived state onto the
      // base state.

      if (workInProgress.lanes === NoLanes) {
        // Queue is always non-null for classes
        var updateQueue = workInProgress.updateQueue;
        updateQueue.baseState = memoizedState;
      }
    }

    var classComponentUpdater = {
      isMounted: isMounted,
      // $FlowFixMe[missing-local-annot]
      enqueueSetState: function (inst, payload, callback) {
        var fiber = get(inst);
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(lane);
        update.payload = payload;

        if (callback !== undefined && callback !== null) {
          {
            warnOnInvalidCallback(callback);
          }

          update.callback = callback;
        }

        var root = enqueueUpdate(fiber, update, lane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, lane);
          entangleTransitions(root, fiber, lane);
        }
      },
      enqueueReplaceState: function (inst, payload, callback) {
        var fiber = get(inst);
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(lane);
        update.tag = ReplaceState;
        update.payload = payload;

        if (callback !== undefined && callback !== null) {
          {
            warnOnInvalidCallback(callback);
          }

          update.callback = callback;
        }

        var root = enqueueUpdate(fiber, update, lane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, lane);
          entangleTransitions(root, fiber, lane);
        }
      },
      // $FlowFixMe[missing-local-annot]
      enqueueForceUpdate: function (inst, callback) {
        var fiber = get(inst);
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(lane);
        update.tag = ForceUpdate;

        if (callback !== undefined && callback !== null) {
          {
            warnOnInvalidCallback(callback);
          }

          update.callback = callback;
        }

        var root = enqueueUpdate(fiber, update, lane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, lane);
          entangleTransitions(root, fiber, lane);
        }
      }
    };

    function checkShouldComponentUpdate(
      workInProgress,
      ctor,
      oldProps,
      newProps,
      oldState,
      newState,
      nextContext
    ) {
      var instance = workInProgress.stateNode;

      if (typeof instance.shouldComponentUpdate === "function") {
        var shouldUpdate = instance.shouldComponentUpdate(
          newProps,
          newState,
          nextContext
        );

        {
          if (workInProgress.mode & StrictLegacyMode) {
            setIsStrictModeForDevtools(true);

            try {
              // Invoke the function an extra time to help detect side-effects.
              shouldUpdate = instance.shouldComponentUpdate(
                newProps,
                newState,
                nextContext
              );
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }

          if (shouldUpdate === undefined) {
            error(
              "%s.shouldComponentUpdate(): Returned undefined instead of a " +
                "boolean value. Make sure to return true or false.",
              getComponentNameFromType(ctor) || "Component"
            );
          }
        }

        return shouldUpdate;
      }

      if (ctor.prototype && ctor.prototype.isPureReactComponent) {
        return (
          !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
        );
      }

      return true;
    }

    function checkClassInstance(workInProgress, ctor, newProps) {
      var instance = workInProgress.stateNode;

      {
        var name = getComponentNameFromType(ctor) || "Component";
        var renderPresent = instance.render;

        if (!renderPresent) {
          if (ctor.prototype && typeof ctor.prototype.render === "function") {
            error(
              "No `render` method found on the %s " +
                "instance: did you accidentally return an object from the constructor?",
              name
            );
          } else {
            error(
              "No `render` method found on the %s " +
                "instance: you may have forgotten to define `render`.",
              name
            );
          }
        }

        if (
          instance.getInitialState &&
          !instance.getInitialState.isReactClassApproved &&
          !instance.state
        ) {
          error(
            "getInitialState was defined on %s, a plain JavaScript class. " +
              "This is only supported for classes created using React.createClass. " +
              "Did you mean to define a state property instead?",
            name
          );
        }

        if (
          instance.getDefaultProps &&
          !instance.getDefaultProps.isReactClassApproved
        ) {
          error(
            "getDefaultProps was defined on %s, a plain JavaScript class. " +
              "This is only supported for classes created using React.createClass. " +
              "Use a static property to define defaultProps instead.",
            name
          );
        }

        if (instance.propTypes) {
          error(
            "propTypes was defined as an instance property on %s. Use a static " +
              "property to define propTypes instead.",
            name
          );
        }

        if (instance.contextType) {
          error(
            "contextType was defined as an instance property on %s. Use a static " +
              "property to define contextType instead.",
            name
          );
        }

        {
          if (ctor.childContextTypes) {
            error(
              "%s uses the legacy childContextTypes API which is no longer supported. " +
                "Use React.createContext() instead.",
              name
            );
          }

          if (ctor.contextTypes) {
            error(
              "%s uses the legacy contextTypes API which is no longer supported. " +
                "Use React.createContext() with static contextType instead.",
              name
            );
          }
        }

        if (typeof instance.componentShouldUpdate === "function") {
          error(
            "%s has a method called " +
              "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " +
              "The name is phrased as a question because the function is " +
              "expected to return a value.",
            name
          );
        }

        if (
          ctor.prototype &&
          ctor.prototype.isPureReactComponent &&
          typeof instance.shouldComponentUpdate !== "undefined"
        ) {
          error(
            "%s has a method called shouldComponentUpdate(). " +
              "shouldComponentUpdate should not be used when extending React.PureComponent. " +
              "Please extend React.Component if shouldComponentUpdate is used.",
            getComponentNameFromType(ctor) || "A pure component"
          );
        }

        if (typeof instance.componentDidUnmount === "function") {
          error(
            "%s has a method called " +
              "componentDidUnmount(). But there is no such lifecycle method. " +
              "Did you mean componentWillUnmount()?",
            name
          );
        }

        if (typeof instance.componentDidReceiveProps === "function") {
          error(
            "%s has a method called " +
              "componentDidReceiveProps(). But there is no such lifecycle method. " +
              "If you meant to update the state in response to changing props, " +
              "use componentWillReceiveProps(). If you meant to fetch data or " +
              "run side-effects or mutations after React has updated the UI, use componentDidUpdate().",
            name
          );
        }

        if (typeof instance.componentWillRecieveProps === "function") {
          error(
            "%s has a method called " +
              "componentWillRecieveProps(). Did you mean componentWillReceiveProps()?",
            name
          );
        }

        if (typeof instance.UNSAFE_componentWillRecieveProps === "function") {
          error(
            "%s has a method called " +
              "UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?",
            name
          );
        }

        var hasMutatedProps = instance.props !== newProps;

        if (instance.props !== undefined && hasMutatedProps) {
          error(
            "When calling super() in `%s`, make sure to pass " +
              "up the same props that your component's constructor was passed.",
            name
          );
        }

        if (instance.defaultProps) {
          error(
            "Setting defaultProps as an instance property on %s is not supported and will be ignored." +
              " Instead, define defaultProps as a static property on %s.",
            name,
            name
          );
        }

        if (
          typeof instance.getSnapshotBeforeUpdate === "function" &&
          typeof instance.componentDidUpdate !== "function" &&
          !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)
        ) {
          didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);

          error(
            "%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). " +
              "This component defines getSnapshotBeforeUpdate() only.",
            getComponentNameFromType(ctor)
          );
        }

        if (typeof instance.getDerivedStateFromProps === "function") {
          error(
            "%s: getDerivedStateFromProps() is defined as an instance method " +
              "and will be ignored. Instead, declare it as a static method.",
            name
          );
        }

        if (typeof instance.getDerivedStateFromError === "function") {
          error(
            "%s: getDerivedStateFromError() is defined as an instance method " +
              "and will be ignored. Instead, declare it as a static method.",
            name
          );
        }

        if (typeof ctor.getSnapshotBeforeUpdate === "function") {
          error(
            "%s: getSnapshotBeforeUpdate() is defined as a static method " +
              "and will be ignored. Instead, declare it as an instance method.",
            name
          );
        }

        var state = instance.state;

        if (state && (typeof state !== "object" || isArray(state))) {
          error("%s.state: must be set to an object or null", name);
        }

        if (
          typeof instance.getChildContext === "function" &&
          typeof ctor.childContextTypes !== "object"
        ) {
          error(
            "%s.getChildContext(): childContextTypes must be defined in order to " +
              "use getChildContext().",
            name
          );
        }
      }
    }

    function adoptClassInstance(workInProgress, instance) {
      instance.updater = classComponentUpdater;
      workInProgress.stateNode = instance; // The instance needs access to the fiber so that it can schedule updates

      set(instance, workInProgress);

      {
        instance._reactInternalInstance = fakeInternalInstance;
      }
    }

    function constructClassInstance(workInProgress, ctor, props) {
      var context = emptyContextObject;
      var contextType = ctor.contextType;

      {
        if ("contextType" in ctor) {
          var isValid = // Allow null for conditional declaration
            contextType === null ||
            (contextType !== undefined &&
              contextType.$$typeof === REACT_CONTEXT_TYPE);

          if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
            didWarnAboutInvalidateContextType.add(ctor);
            var addendum = "";

            if (contextType === undefined) {
              addendum =
                " However, it is set to undefined. " +
                "This can be caused by a typo or by mixing up named and default imports. " +
                "This can also happen due to a circular dependency, so " +
                "try moving the createContext() call to a separate file.";
            } else if (typeof contextType !== "object") {
              addendum = " However, it is set to a " + typeof contextType + ".";
            } else if (contextType.$$typeof === REACT_CONSUMER_TYPE) {
              addendum =
                " Did you accidentally pass the Context.Consumer instead?";
            } else {
              addendum =
                " However, it is set to an object with keys {" +
                Object.keys(contextType).join(", ") +
                "}.";
            }

            error(
              "%s defines an invalid contextType. " +
                "contextType should point to the Context object returned by React.createContext().%s",
              getComponentNameFromType(ctor) || "Component",
              addendum
            );
          }
        }
      }

      if (typeof contextType === "object" && contextType !== null) {
        context = readContext(contextType);
      }

      var instance = new ctor(props, context); // Instantiate twice to help detect side-effects.

      {
        if (workInProgress.mode & StrictLegacyMode) {
          setIsStrictModeForDevtools(true);

          try {
            instance = new ctor(props, context); // eslint-disable-line no-new
          } finally {
            setIsStrictModeForDevtools(false);
          }
        }
      }

      var state = (workInProgress.memoizedState =
        instance.state !== null && instance.state !== undefined
          ? instance.state
          : null);
      adoptClassInstance(workInProgress, instance);

      {
        if (
          typeof ctor.getDerivedStateFromProps === "function" &&
          state === null
        ) {
          var componentName = getComponentNameFromType(ctor) || "Component";

          if (!didWarnAboutUninitializedState.has(componentName)) {
            didWarnAboutUninitializedState.add(componentName);

            error(
              "`%s` uses `getDerivedStateFromProps` but its initial state is " +
                "%s. This is not recommended. Instead, define the initial state by " +
                "assigning an object to `this.state` in the constructor of `%s`. " +
                "This ensures that `getDerivedStateFromProps` arguments have a consistent shape.",
              componentName,
              instance.state === null ? "null" : "undefined",
              componentName
            );
          }
        } // If new component APIs are defined, "unsafe" lifecycles won't be called.
        // Warn about these lifecycles if they are present.
        // Don't warn about react-lifecycles-compat polyfilled methods though.

        if (
          typeof ctor.getDerivedStateFromProps === "function" ||
          typeof instance.getSnapshotBeforeUpdate === "function"
        ) {
          var foundWillMountName = null;
          var foundWillReceivePropsName = null;
          var foundWillUpdateName = null;

          if (
            typeof instance.componentWillMount === "function" &&
            instance.componentWillMount.__suppressDeprecationWarning !== true
          ) {
            foundWillMountName = "componentWillMount";
          } else if (typeof instance.UNSAFE_componentWillMount === "function") {
            foundWillMountName = "UNSAFE_componentWillMount";
          }

          if (
            typeof instance.componentWillReceiveProps === "function" &&
            instance.componentWillReceiveProps.__suppressDeprecationWarning !==
              true
          ) {
            foundWillReceivePropsName = "componentWillReceiveProps";
          } else if (
            typeof instance.UNSAFE_componentWillReceiveProps === "function"
          ) {
            foundWillReceivePropsName = "UNSAFE_componentWillReceiveProps";
          }

          if (
            typeof instance.componentWillUpdate === "function" &&
            instance.componentWillUpdate.__suppressDeprecationWarning !== true
          ) {
            foundWillUpdateName = "componentWillUpdate";
          } else if (
            typeof instance.UNSAFE_componentWillUpdate === "function"
          ) {
            foundWillUpdateName = "UNSAFE_componentWillUpdate";
          }

          if (
            foundWillMountName !== null ||
            foundWillReceivePropsName !== null ||
            foundWillUpdateName !== null
          ) {
            var _componentName = getComponentNameFromType(ctor) || "Component";

            var newApiName =
              typeof ctor.getDerivedStateFromProps === "function"
                ? "getDerivedStateFromProps()"
                : "getSnapshotBeforeUpdate()";

            if (
              !didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)
            ) {
              didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);

              error(
                "Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n" +
                  "%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n" +
                  "The above lifecycles should be removed. Learn more about this warning here:\n" +
                  "https://react.dev/link/unsafe-component-lifecycles",
                _componentName,
                newApiName,
                foundWillMountName !== null ? "\n  " + foundWillMountName : "",
                foundWillReceivePropsName !== null
                  ? "\n  " + foundWillReceivePropsName
                  : "",
                foundWillUpdateName !== null ? "\n  " + foundWillUpdateName : ""
              );
            }
          }
        }
      } // Cache unmasked context so we can avoid recreating masked context unless necessary.

      return instance;
    }

    function callComponentWillMount(workInProgress, instance) {
      var oldState = instance.state;

      if (typeof instance.componentWillMount === "function") {
        instance.componentWillMount();
      }

      if (typeof instance.UNSAFE_componentWillMount === "function") {
        instance.UNSAFE_componentWillMount();
      }

      if (oldState !== instance.state) {
        {
          error(
            "%s.componentWillMount(): Assigning directly to this.state is " +
              "deprecated (except inside a component's " +
              "constructor). Use setState instead.",
            getComponentNameFromFiber(workInProgress) || "Component"
          );
        }

        classComponentUpdater.enqueueReplaceState(
          instance,
          instance.state,
          null
        );
      }
    }

    function callComponentWillReceiveProps(
      workInProgress,
      instance,
      newProps,
      nextContext
    ) {
      var oldState = instance.state;

      if (typeof instance.componentWillReceiveProps === "function") {
        instance.componentWillReceiveProps(newProps, nextContext);
      }

      if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
        instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
      }

      if (instance.state !== oldState) {
        {
          var componentName =
            getComponentNameFromFiber(workInProgress) || "Component";

          if (!didWarnAboutStateAssignmentForComponent.has(componentName)) {
            didWarnAboutStateAssignmentForComponent.add(componentName);

            error(
              "%s.componentWillReceiveProps(): Assigning directly to " +
                "this.state is deprecated (except inside a component's " +
                "constructor). Use setState instead.",
              componentName
            );
          }
        }

        classComponentUpdater.enqueueReplaceState(
          instance,
          instance.state,
          null
        );
      }
    } // Invokes the mount life-cycles on a previously never rendered instance.

    function mountClassInstance(workInProgress, ctor, newProps, renderLanes) {
      {
        checkClassInstance(workInProgress, ctor, newProps);
      }

      var instance = workInProgress.stateNode;
      instance.props = newProps;
      instance.state = workInProgress.memoizedState;
      instance.refs = {};
      initializeUpdateQueue(workInProgress);
      var contextType = ctor.contextType;

      if (typeof contextType === "object" && contextType !== null) {
        instance.context = readContext(contextType);
      } else {
        instance.context = emptyContextObject;
      }

      {
        if (instance.state === newProps) {
          var componentName = getComponentNameFromType(ctor) || "Component";

          if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
            didWarnAboutDirectlyAssigningPropsToState.add(componentName);

            error(
              "%s: It is not recommended to assign props directly to state " +
                "because updates to props won't be reflected in state. " +
                "In most cases, it is better to use props directly.",
              componentName
            );
          }
        }

        if (workInProgress.mode & StrictLegacyMode) {
          ReactStrictModeWarnings.recordLegacyContextWarning(
            workInProgress,
            instance
          );
        }

        ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(
          workInProgress,
          instance
        );
      }

      instance.state = workInProgress.memoizedState;
      var getDerivedStateFromProps = ctor.getDerivedStateFromProps;

      if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(
          workInProgress,
          ctor,
          getDerivedStateFromProps,
          newProps
        );
        instance.state = workInProgress.memoizedState;
      } // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.

      if (
        typeof ctor.getDerivedStateFromProps !== "function" &&
        typeof instance.getSnapshotBeforeUpdate !== "function" &&
        (typeof instance.UNSAFE_componentWillMount === "function" ||
          typeof instance.componentWillMount === "function")
      ) {
        callComponentWillMount(workInProgress, instance); // If we had additional state updates during this life-cycle, let's
        // process them now.

        processUpdateQueue(workInProgress, newProps, instance, renderLanes);
        suspendIfUpdateReadFromEntangledAsyncAction();
        instance.state = workInProgress.memoizedState;
      }

      if (typeof instance.componentDidMount === "function") {
        workInProgress.flags |= Update | LayoutStatic;
      }

      if ((workInProgress.mode & StrictEffectsMode) !== NoMode) {
        workInProgress.flags |= MountLayoutDev;
      }
    }

    function resumeMountClassInstance(
      workInProgress,
      ctor,
      newProps,
      renderLanes
    ) {
      var instance = workInProgress.stateNode;
      var oldProps = workInProgress.memoizedProps;
      instance.props = oldProps;
      var oldContext = instance.context;
      var contextType = ctor.contextType;
      var nextContext = emptyContextObject;

      if (typeof contextType === "object" && contextType !== null) {
        nextContext = readContext(contextType);
      }

      var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
      var hasNewLifecycles =
        typeof getDerivedStateFromProps === "function" ||
        typeof instance.getSnapshotBeforeUpdate === "function"; // Note: During these life-cycles, instance.props/instance.state are what
      // ever the previously attempted to render - not the "current". However,
      // during componentDidUpdate we pass the "current" props.
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.

      if (
        !hasNewLifecycles &&
        (typeof instance.UNSAFE_componentWillReceiveProps === "function" ||
          typeof instance.componentWillReceiveProps === "function")
      ) {
        if (oldProps !== newProps || oldContext !== nextContext) {
          callComponentWillReceiveProps(
            workInProgress,
            instance,
            newProps,
            nextContext
          );
        }
      }

      resetHasForceUpdateBeforeProcessing();
      var oldState = workInProgress.memoizedState;
      var newState = (instance.state = oldState);
      processUpdateQueue(workInProgress, newProps, instance, renderLanes);
      suspendIfUpdateReadFromEntangledAsyncAction();
      newState = workInProgress.memoizedState;

      if (
        oldProps === newProps &&
        oldState === newState &&
        !hasContextChanged() &&
        !checkHasForceUpdateAfterProcessing()
      ) {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidMount === "function") {
          workInProgress.flags |= Update | LayoutStatic;
        }

        if ((workInProgress.mode & StrictEffectsMode) !== NoMode) {
          workInProgress.flags |= MountLayoutDev;
        }

        return false;
      }

      if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(
          workInProgress,
          ctor,
          getDerivedStateFromProps,
          newProps
        );
        newState = workInProgress.memoizedState;
      }

      var shouldUpdate =
        checkHasForceUpdateAfterProcessing() ||
        checkShouldComponentUpdate(
          workInProgress,
          ctor,
          oldProps,
          newProps,
          oldState,
          newState,
          nextContext
        );

      if (shouldUpdate) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for components using the new APIs.
        if (
          !hasNewLifecycles &&
          (typeof instance.UNSAFE_componentWillMount === "function" ||
            typeof instance.componentWillMount === "function")
        ) {
          if (typeof instance.componentWillMount === "function") {
            instance.componentWillMount();
          }

          if (typeof instance.UNSAFE_componentWillMount === "function") {
            instance.UNSAFE_componentWillMount();
          }
        }

        if (typeof instance.componentDidMount === "function") {
          workInProgress.flags |= Update | LayoutStatic;
        }

        if ((workInProgress.mode & StrictEffectsMode) !== NoMode) {
          workInProgress.flags |= MountLayoutDev;
        }
      } else {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidMount === "function") {
          workInProgress.flags |= Update | LayoutStatic;
        }

        if ((workInProgress.mode & StrictEffectsMode) !== NoMode) {
          workInProgress.flags |= MountLayoutDev;
        } // If shouldComponentUpdate returned false, we should still update the
        // memoized state to indicate that this work can be reused.

        workInProgress.memoizedProps = newProps;
        workInProgress.memoizedState = newState;
      } // Update the existing instance's state, props, and context pointers even
      // if shouldComponentUpdate returns false.

      instance.props = newProps;
      instance.state = newState;
      instance.context = nextContext;
      return shouldUpdate;
    } // Invokes the update life-cycles and returns false if it shouldn't rerender.

    function updateClassInstance(
      current,
      workInProgress,
      ctor,
      newProps,
      renderLanes
    ) {
      var instance = workInProgress.stateNode;
      cloneUpdateQueue(current, workInProgress);
      var unresolvedOldProps = workInProgress.memoizedProps;
      var oldProps =
        workInProgress.type === workInProgress.elementType
          ? unresolvedOldProps
          : resolveDefaultProps(workInProgress.type, unresolvedOldProps);
      instance.props = oldProps;
      var unresolvedNewProps = workInProgress.pendingProps;
      var oldContext = instance.context;
      var contextType = ctor.contextType;
      var nextContext = emptyContextObject;

      if (typeof contextType === "object" && contextType !== null) {
        nextContext = readContext(contextType);
      }

      var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
      var hasNewLifecycles =
        typeof getDerivedStateFromProps === "function" ||
        typeof instance.getSnapshotBeforeUpdate === "function"; // Note: During these life-cycles, instance.props/instance.state are what
      // ever the previously attempted to render - not the "current". However,
      // during componentDidUpdate we pass the "current" props.
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.

      if (
        !hasNewLifecycles &&
        (typeof instance.UNSAFE_componentWillReceiveProps === "function" ||
          typeof instance.componentWillReceiveProps === "function")
      ) {
        if (
          unresolvedOldProps !== unresolvedNewProps ||
          oldContext !== nextContext
        ) {
          callComponentWillReceiveProps(
            workInProgress,
            instance,
            newProps,
            nextContext
          );
        }
      }

      resetHasForceUpdateBeforeProcessing();
      var oldState = workInProgress.memoizedState;
      var newState = (instance.state = oldState);
      processUpdateQueue(workInProgress, newProps, instance, renderLanes);
      suspendIfUpdateReadFromEntangledAsyncAction();
      newState = workInProgress.memoizedState;

      if (
        unresolvedOldProps === unresolvedNewProps &&
        oldState === newState &&
        !hasContextChanged() &&
        !checkHasForceUpdateAfterProcessing() &&
        !enableLazyContextPropagation
      ) {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidUpdate === "function") {
          if (
            unresolvedOldProps !== current.memoizedProps ||
            oldState !== current.memoizedState
          ) {
            workInProgress.flags |= Update;
          }
        }

        if (typeof instance.getSnapshotBeforeUpdate === "function") {
          if (
            unresolvedOldProps !== current.memoizedProps ||
            oldState !== current.memoizedState
          ) {
            workInProgress.flags |= Snapshot;
          }
        }

        return false;
      }

      if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(
          workInProgress,
          ctor,
          getDerivedStateFromProps,
          newProps
        );
        newState = workInProgress.memoizedState;
      }

      var shouldUpdate =
        checkHasForceUpdateAfterProcessing() ||
        checkShouldComponentUpdate(
          workInProgress,
          ctor,
          oldProps,
          newProps,
          oldState,
          newState,
          nextContext
        ) || // TODO: In some cases, we'll end up checking if context has changed twice,
        // both before and after `shouldComponentUpdate` has been called. Not ideal,
        // but I'm loath to refactor this function. This only happens for memoized
        // components so it's not that common.
        enableLazyContextPropagation;

      if (shouldUpdate) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for components using the new APIs.
        if (
          !hasNewLifecycles &&
          (typeof instance.UNSAFE_componentWillUpdate === "function" ||
            typeof instance.componentWillUpdate === "function")
        ) {
          if (typeof instance.componentWillUpdate === "function") {
            instance.componentWillUpdate(newProps, newState, nextContext);
          }

          if (typeof instance.UNSAFE_componentWillUpdate === "function") {
            instance.UNSAFE_componentWillUpdate(
              newProps,
              newState,
              nextContext
            );
          }
        }

        if (typeof instance.componentDidUpdate === "function") {
          workInProgress.flags |= Update;
        }

        if (typeof instance.getSnapshotBeforeUpdate === "function") {
          workInProgress.flags |= Snapshot;
        }
      } else {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidUpdate === "function") {
          if (
            unresolvedOldProps !== current.memoizedProps ||
            oldState !== current.memoizedState
          ) {
            workInProgress.flags |= Update;
          }
        }

        if (typeof instance.getSnapshotBeforeUpdate === "function") {
          if (
            unresolvedOldProps !== current.memoizedProps ||
            oldState !== current.memoizedState
          ) {
            workInProgress.flags |= Snapshot;
          }
        } // If shouldComponentUpdate returned false, we should still update the
        // memoized props/state to indicate that this work can be reused.

        workInProgress.memoizedProps = newProps;
        workInProgress.memoizedState = newState;
      } // Update the existing instance's state, props, and context pointers even
      // if shouldComponentUpdate returns false.

      instance.props = newProps;
      instance.state = newState;
      instance.context = nextContext;
      return shouldUpdate;
    }

    var CapturedStacks = new WeakMap();
    function createCapturedValueAtFiber(value, source) {
      // If the value is an error, call this function immediately after it is thrown
      // so the stack is accurate.
      var stack;

      if (typeof value === "object" && value !== null) {
        var capturedStack = CapturedStacks.get(value);

        if (typeof capturedStack === "string") {
          stack = capturedStack;
        } else {
          stack = getStackByFiberInDevAndProd(source);
          CapturedStacks.set(value, stack);
        }
      } else {
        stack = getStackByFiberInDevAndProd(source);
      }

      return {
        value: value,
        source: source,
        stack: stack,
        digest: null
      };
    }
    function createCapturedValueFromError(value, digest, stack) {
      if (typeof stack === "string") {
        CapturedStacks.set(value, stack);
      }

      return {
        value: value,
        source: null,
        stack: stack != null ? stack : null,
        digest: digest != null ? digest : null
      };
    }

    if (
      typeof ReactNativePrivateInterface.ReactFiberErrorDialog
        .showErrorDialog !== "function"
    ) {
      throw new Error(
        "Expected ReactFiberErrorDialog.showErrorDialog to be a function."
      );
    }

    function showErrorDialog(boundary, errorInfo) {
      var capturedError = {
        componentStack: errorInfo.stack !== null ? errorInfo.stack : "",
        error: errorInfo.value,
        errorBoundary:
          boundary !== null && boundary.tag === ClassComponent
            ? boundary.stateNode
            : null
      };
      return ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog(
        capturedError
      );
    }

    function logCapturedError(boundary, errorInfo) {
      try {
        var logError = showErrorDialog(boundary, errorInfo); // Allow injected showErrorDialog() to prevent default console.error logging.
        // This enables renderers like ReactNative to better manage redbox behavior.

        if (logError === false) {
          return;
        }

        var error = errorInfo.value;

        if (true) {
          var source = errorInfo.source;
          var stack = errorInfo.stack;
          var componentStack = stack !== null ? stack : ""; // TODO: There's no longer a way to silence these warnings e.g. for tests.
          // See https://github.com/facebook/react/pull/13384

          var componentName = source ? getComponentNameFromFiber(source) : null;
          var componentNameMessage = componentName
            ? "The above error occurred in the <" +
              componentName +
              "> component:"
            : "The above error occurred in one of your React components:";
          var errorBoundaryMessage;

          if (boundary.tag === HostRoot) {
            errorBoundaryMessage =
              "Consider adding an error boundary to your tree to customize error handling behavior.\n" +
              "Visit https://react.dev/link/error-boundaries to learn more about error boundaries.";
          } else {
            var errorBoundaryName =
              getComponentNameFromFiber(boundary) || "Anonymous";
            errorBoundaryMessage =
              "React will try to recreate this component tree from scratch " +
              ("using the error boundary you provided, " +
                errorBoundaryName +
                ".");
          } // In development, we provide our own message which includes the component stack
          // in addition to the error.

          console["error"](
            // Don't transform to our wrapper
            "%o\n\n%s\n%s\n\n%s",
            error,
            componentNameMessage,
            componentStack,
            errorBoundaryMessage
          );
        }
      } catch (e) {
        // This method must not throw, or React internal state will get messed up.
        // If console.error is overridden, or logCapturedError() shows a dialog that throws,
        // we want to report this error outside of the normal stack as a last resort.
        // https://github.com/facebook/react/issues/13188
        setTimeout(function () {
          throw e;
        });
      }
    }

    function createRootErrorUpdate(fiber, errorInfo, lane) {
      var update = createUpdate(lane); // Unmount the root by rendering null.

      update.tag = CaptureUpdate; // Caution: React DevTools currently depends on this property
      // being called "element".

      update.payload = {
        element: null
      };
      var error = errorInfo.value;

      update.callback = function () {
        onUncaughtError(error);
        logCapturedError(fiber, errorInfo);
      };

      return update;
    }

    function createClassErrorUpdate(fiber, errorInfo, lane) {
      var update = createUpdate(lane);
      update.tag = CaptureUpdate;
      var getDerivedStateFromError = fiber.type.getDerivedStateFromError;

      if (typeof getDerivedStateFromError === "function") {
        var error$1 = errorInfo.value;

        update.payload = function () {
          return getDerivedStateFromError(error$1);
        };

        update.callback = function () {
          {
            markFailedErrorBoundaryForHotReloading(fiber);
          }

          logCapturedError(fiber, errorInfo);
        };
      }

      var inst = fiber.stateNode;

      if (inst !== null && typeof inst.componentDidCatch === "function") {
        // $FlowFixMe[missing-this-annot]
        update.callback = function callback() {
          {
            markFailedErrorBoundaryForHotReloading(fiber);
          }

          logCapturedError(fiber, errorInfo);

          if (typeof getDerivedStateFromError !== "function") {
            // To preserve the preexisting retry behavior of error boundaries,
            // we keep track of which ones already failed during this batch.
            // This gets reset before we yield back to the browser.
            // TODO: Warn in strict mode if getDerivedStateFromError is
            // not defined.
            markLegacyErrorBoundaryAsFailed(this);
          }

          var error$1 = errorInfo.value;
          var stack = errorInfo.stack;
          this.componentDidCatch(error$1, {
            componentStack: stack !== null ? stack : ""
          });

          {
            if (typeof getDerivedStateFromError !== "function") {
              // If componentDidCatch is the only error boundary method defined,
              // then it needs to call setState to recover from errors.
              // If no state update is scheduled then the boundary will swallow the error.
              if (!includesSomeLane(fiber.lanes, SyncLane)) {
                error(
                  "%s: Error boundaries should implement getDerivedStateFromError(). " +
                    "In that method, return a state update to display an error message or fallback UI.",
                  getComponentNameFromFiber(fiber) || "Unknown"
                );
              }
            }
          }
        };
      }

      return update;
    }

    function resetSuspendedComponent(sourceFiber, rootRenderLanes) {
      // A legacy mode Suspense quirk, only relevant to hook components.

      var tag = sourceFiber.tag;

      if (
        (sourceFiber.mode & ConcurrentMode) === NoMode &&
        (tag === FunctionComponent ||
          tag === ForwardRef ||
          tag === SimpleMemoComponent)
      ) {
        var currentSource = sourceFiber.alternate;

        if (currentSource) {
          sourceFiber.updateQueue = currentSource.updateQueue;
          sourceFiber.memoizedState = currentSource.memoizedState;
          sourceFiber.lanes = currentSource.lanes;
        } else {
          sourceFiber.updateQueue = null;
          sourceFiber.memoizedState = null;
        }
      }
    }

    function markSuspenseBoundaryShouldCapture(
      suspenseBoundary,
      returnFiber,
      sourceFiber,
      root,
      rootRenderLanes
    ) {
      // This marks a Suspense boundary so that when we're unwinding the stack,
      // it captures the suspended "exception" and does a second (fallback) pass.
      if ((suspenseBoundary.mode & ConcurrentMode) === NoMode) {
        // Legacy Mode Suspense
        //
        // If the boundary is in legacy mode, we should *not*
        // suspend the commit. Pretend as if the suspended component rendered
        // null and keep rendering. When the Suspense boundary completes,
        // we'll do a second pass to render the fallback.
        if (suspenseBoundary === returnFiber) {
          // Special case where we suspended while reconciling the children of
          // a Suspense boundary's inner Offscreen wrapper fiber. This happens
          // when a React.lazy component is a direct child of a
          // Suspense boundary.
          //
          // Suspense boundaries are implemented as multiple fibers, but they
          // are a single conceptual unit. The legacy mode behavior where we
          // pretend the suspended fiber committed as `null` won't work,
          // because in this case the "suspended" fiber is the inner
          // Offscreen wrapper.
          //
          // Because the contents of the boundary haven't started rendering
          // yet (i.e. nothing in the tree has partially rendered) we can
          // switch to the regular, concurrent mode behavior: mark the
          // boundary with ShouldCapture and enter the unwind phase.
          suspenseBoundary.flags |= ShouldCapture;
        } else {
          suspenseBoundary.flags |= DidCapture;
          sourceFiber.flags |= ForceUpdateForLegacySuspense; // We're going to commit this fiber even though it didn't complete.
          // But we shouldn't call any lifecycle methods or callbacks. Remove
          // all lifecycle effect tags.

          sourceFiber.flags &= ~(LifecycleEffectMask | Incomplete);

          if (sourceFiber.tag === ClassComponent) {
            var currentSourceFiber = sourceFiber.alternate;

            if (currentSourceFiber === null) {
              // This is a new mount. Change the tag so it's not mistaken for a
              // completed class component. For example, we should not call
              // componentWillUnmount if it is deleted.
              sourceFiber.tag = IncompleteClassComponent;
            } else {
              // When we try rendering again, we should not reuse the current fiber,
              // since it's known to be in an inconsistent state. Use a force update to
              // prevent a bail out.
              var update = createUpdate(SyncLane);
              update.tag = ForceUpdate;
              enqueueUpdate(sourceFiber, update, SyncLane);
            }
          } // The source fiber did not complete. Mark it with Sync priority to
          // indicate that it still has pending work.

          sourceFiber.lanes = mergeLanes(sourceFiber.lanes, SyncLane);
        }

        return suspenseBoundary;
      } // Confirmed that the boundary is in a concurrent mode tree. Continue
      // with the normal suspend path.
      //
      // After this we'll use a set of heuristics to determine whether this
      // render pass will run to completion or restart or "suspend" the commit.
      // The actual logic for this is spread out in different places.
      //
      // This first principle is that if we're going to suspend when we complete
      // a root, then we should also restart if we get an update or ping that
      // might unsuspend it, and vice versa. The only reason to suspend is
      // because you think you might want to restart before committing. However,
      // it doesn't make sense to restart only while in the period we're suspended.
      //
      // Restarting too aggressively is also not good because it starves out any
      // intermediate loading state. So we use heuristics to determine when.
      // Suspense Heuristics
      //
      // If nothing threw a Promise or all the same fallbacks are already showing,
      // then don't suspend/restart.
      //
      // If this is an initial render of a new tree of Suspense boundaries and
      // those trigger a fallback, then don't suspend/restart. We want to ensure
      // that we can show the initial loading state as quickly as possible.
      //
      // If we hit a "Delayed" case, such as when we'd switch from content back into
      // a fallback, then we should always suspend/restart. Transitions apply
      // to this case. If none is defined, JND is used instead.
      //
      // If we're already showing a fallback and it gets "retried", allowing us to show
      // another level, but there's still an inner boundary that would show a fallback,
      // then we suspend/restart for 500ms since the last time we showed a fallback
      // anywhere in the tree. This effectively throttles progressive loading into a
      // consistent train of commits. This also gives us an opportunity to restart to
      // get to the completed state slightly earlier.
      //
      // If there's ambiguity due to batching it's resolved in preference of:
      // 1) "delayed", 2) "initial render", 3) "retry".
      //
      // We want to ensure that a "busy" state doesn't get force committed. We want to
      // ensure that new initial loading states can commit as soon as possible.

      suspenseBoundary.flags |= ShouldCapture; // TODO: I think we can remove this, since we now use `DidCapture` in
      // the begin phase to prevent an early bailout.

      suspenseBoundary.lanes = rootRenderLanes;
      return suspenseBoundary;
    }

    function throwException(
      root,
      returnFiber,
      sourceFiber,
      value,
      rootRenderLanes
    ) {
      // The source fiber did not complete.
      sourceFiber.flags |= Incomplete;

      {
        if (isDevToolsPresent) {
          // If we have pending work still, restore the original updaters
          restorePendingUpdaters(root, rootRenderLanes);
        }
      }

      if (value !== null && typeof value === "object") {
        if (typeof value.then === "function") {
          // This is a wakeable. The component suspended.
          var wakeable = value;
          resetSuspendedComponent(sourceFiber);

          var suspenseBoundary = getSuspenseHandler();

          if (suspenseBoundary !== null) {
            switch (suspenseBoundary.tag) {
              case SuspenseComponent: {
                // If this suspense boundary is not already showing a fallback, mark
                // the in-progress render as suspended. We try to perform this logic
                // as soon as soon as possible during the render phase, so the work
                // loop can know things like whether it's OK to switch to other tasks,
                // or whether it can wait for data to resolve before continuing.
                // TODO: Most of these checks are already performed when entering a
                // Suspense boundary. We should track the information on the stack so
                // we don't have to recompute it on demand. This would also allow us
                // to unify with `use` which needs to perform this logic even sooner,
                // before `throwException` is called.
                if (sourceFiber.mode & ConcurrentMode) {
                  if (getShellBoundary() === null) {
                    // Suspended in the "shell" of the app. This is an undesirable
                    // loading state. We should avoid committing this tree.
                    renderDidSuspendDelayIfPossible();
                  } else {
                    // If we suspended deeper than the shell, we don't need to delay
                    // the commmit. However, we still call renderDidSuspend if this is
                    // a new boundary, to tell the work loop that a new fallback has
                    // appeared during this render.
                    // TODO: Theoretically we should be able to delete this branch.
                    // It's currently used for two things: 1) to throttle the
                    // appearance of successive loading states, and 2) in
                    // SuspenseList, to determine whether the children include any
                    // pending fallbacks. For 1, we should apply throttling to all
                    // retries, not just ones that render an additional fallback. For
                    // 2, we should check subtreeFlags instead. Then we can delete
                    // this branch.
                    var current = suspenseBoundary.alternate;

                    if (current === null) {
                      renderDidSuspend();
                    }
                  }
                }

                suspenseBoundary.flags &= ~ForceClientRender;
                markSuspenseBoundaryShouldCapture(
                  suspenseBoundary,
                  returnFiber,
                  sourceFiber,
                  root,
                  rootRenderLanes
                ); // Retry listener
                //
                // If the fallback does commit, we need to attach a different type of
                // listener. This one schedules an update on the Suspense boundary to
                // turn the fallback state off.
                //
                // Stash the wakeable on the boundary fiber so we can access it in the
                // commit phase.
                //
                // When the wakeable resolves, we'll attempt to render the boundary
                // again ("retry").
                // Check if this is a Suspensey resource. We do not attach retry
                // listeners to these, because we don't actually need them for
                // rendering. Only for committing. Instead, if a fallback commits
                // and the only thing that suspended was a Suspensey resource, we
                // retry immediately.
                // TODO: Refactor throwException so that we don't have to do this type
                // check. The caller already knows what the cause was.

                var isSuspenseyResource =
                  wakeable === noopSuspenseyCommitThenable;

                if (isSuspenseyResource) {
                  suspenseBoundary.flags |= ScheduleRetry;
                } else {
                  var retryQueue = suspenseBoundary.updateQueue;

                  if (retryQueue === null) {
                    suspenseBoundary.updateQueue = new Set([wakeable]);
                  } else {
                    retryQueue.add(wakeable);
                  } // We only attach ping listeners in concurrent mode. Legacy
                  // Suspense always commits fallbacks synchronously, so there are
                  // no pings.

                  if (suspenseBoundary.mode & ConcurrentMode) {
                    attachPingListener(root, wakeable, rootRenderLanes);
                  }
                }

                return false;
              }

              case OffscreenComponent: {
                if (suspenseBoundary.mode & ConcurrentMode) {
                  suspenseBoundary.flags |= ShouldCapture;

                  var _isSuspenseyResource =
                    wakeable === noopSuspenseyCommitThenable;

                  if (_isSuspenseyResource) {
                    suspenseBoundary.flags |= ScheduleRetry;
                  } else {
                    var offscreenQueue = suspenseBoundary.updateQueue;

                    if (offscreenQueue === null) {
                      var newOffscreenQueue = {
                        transitions: null,
                        markerInstances: null,
                        retryQueue: new Set([wakeable])
                      };
                      suspenseBoundary.updateQueue = newOffscreenQueue;
                    } else {
                      var _retryQueue = offscreenQueue.retryQueue;

                      if (_retryQueue === null) {
                        offscreenQueue.retryQueue = new Set([wakeable]);
                      } else {
                        _retryQueue.add(wakeable);
                      }
                    }

                    attachPingListener(root, wakeable, rootRenderLanes);
                  }

                  return false;
                }
              }
            }

            throw new Error(
              "Unexpected Suspense handler tag (" +
                suspenseBoundary.tag +
                "). This " +
                "is a bug in React."
            );
          } else {
            // No boundary was found. Unless this is a sync update, this is OK.
            // We can suspend and wait for more data to arrive.
            if (root.tag === ConcurrentRoot) {
              // In a concurrent root, suspending without a Suspense boundary is
              // allowed. It will suspend indefinitely without committing.
              //
              // TODO: Should we have different behavior for discrete updates? What
              // about flushSync? Maybe it should put the tree into an inert state,
              // and potentially log a warning. Revisit this for a future release.
              attachPingListener(root, wakeable, rootRenderLanes);
              renderDidSuspendDelayIfPossible();
              return false;
            } else {
              // In a legacy root, suspending without a boundary is always an error.
              var uncaughtSuspenseError = new Error(
                "A component suspended while responding to synchronous input. This " +
                  "will cause the UI to be replaced with a loading indicator. To " +
                  "fix, updates that suspend should be wrapped " +
                  "with startTransition."
              );
              value = uncaughtSuspenseError;
            }
          }
        }
      } // This is a regular error, not a Suspense wakeable.

      value = createCapturedValueAtFiber(value, sourceFiber);
      renderDidError(value); // We didn't find a boundary that could handle this type of exception. Start
      // over and traverse parent path again, this time treating the exception
      // as an error.

      if (returnFiber === null) {
        // There's no return fiber, which means the root errored. This should never
        // happen. Return `true` to trigger a fatal error (panic).
        return true;
      }

      var workInProgress = returnFiber;

      do {
        switch (workInProgress.tag) {
          case HostRoot: {
            var _errorInfo = value;
            workInProgress.flags |= ShouldCapture;
            var lane = pickArbitraryLane(rootRenderLanes);
            workInProgress.lanes = mergeLanes(workInProgress.lanes, lane);
            var update = createRootErrorUpdate(
              workInProgress,
              _errorInfo,
              lane
            );
            enqueueCapturedUpdate(workInProgress, update);
            return false;
          }

          case ClassComponent:
            // Capture and retry
            var errorInfo = value;
            var ctor = workInProgress.type;
            var instance = workInProgress.stateNode;

            if (
              (workInProgress.flags & DidCapture) === NoFlags$1 &&
              (typeof ctor.getDerivedStateFromError === "function" ||
                (instance !== null &&
                  typeof instance.componentDidCatch === "function" &&
                  !isAlreadyFailedLegacyErrorBoundary(instance)))
            ) {
              workInProgress.flags |= ShouldCapture;

              var _lane = pickArbitraryLane(rootRenderLanes);

              workInProgress.lanes = mergeLanes(workInProgress.lanes, _lane); // Schedule the error boundary to re-render using updated state

              var _update = createClassErrorUpdate(
                workInProgress,
                errorInfo,
                _lane
              );

              enqueueCapturedUpdate(workInProgress, _update);
              return false;
            }

            break;
        } // $FlowFixMe[incompatible-type] we bail out when we get a null

        workInProgress = workInProgress.return;
      } while (workInProgress !== null);

      return false;
    }

    var ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner; // A special exception that's used to unwind the stack when an update flows
    // into a dehydrated boundary.

    var SelectiveHydrationException = new Error(
      "This is not a real error. It's an implementation detail of React's " +
        "selective hydration feature. If this leaks into userspace, it's a bug in " +
        "React. Please file an issue."
    );
    var didReceiveUpdate = false;
    var didWarnAboutBadClass;
    var didWarnAboutModulePatternComponent;
    var didWarnAboutContextTypeOnFunctionComponent;
    var didWarnAboutGetDerivedStateOnFunctionComponent;
    var didWarnAboutFunctionRefs;
    var didWarnAboutReassigningProps;
    var didWarnAboutRevealOrder;
    var didWarnAboutTailOptions;
    var didWarnAboutDefaultPropsOnFunctionComponent;

    {
      didWarnAboutBadClass = {};
      didWarnAboutModulePatternComponent = {};
      didWarnAboutContextTypeOnFunctionComponent = {};
      didWarnAboutGetDerivedStateOnFunctionComponent = {};
      didWarnAboutFunctionRefs = {};
      didWarnAboutReassigningProps = false;
      didWarnAboutRevealOrder = {};
      didWarnAboutTailOptions = {};
      didWarnAboutDefaultPropsOnFunctionComponent = {};
    }

    function reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderLanes
    ) {
      if (current === null) {
        // If this is a fresh new component that hasn't been rendered yet, we
        // won't update its child set by applying minimal side-effects. Instead,
        // we will add them all to the child before it gets rendered. That means
        // we can optimize this reconciliation pass by not tracking side-effects.
        workInProgress.child = mountChildFibers(
          workInProgress,
          null,
          nextChildren,
          renderLanes
        );
      } else {
        // If the current child is the same as the work in progress, it means that
        // we haven't yet started any work on these children. Therefore, we use
        // the clone algorithm to create a copy of all the current children.
        // If we had any progressed work already, that is invalid at this point so
        // let's throw it out.
        workInProgress.child = reconcileChildFibers(
          workInProgress,
          current.child,
          nextChildren,
          renderLanes
        );
      }
    }

    function forceUnmountCurrentAndReconcile(
      current,
      workInProgress,
      nextChildren,
      renderLanes
    ) {
      // This function is fork of reconcileChildren. It's used in cases where we
      // want to reconcile without matching against the existing set. This has the
      // effect of all current children being unmounted; even if the type and key
      // are the same, the old child is unmounted and a new child is created.
      //
      // To do this, we're going to go through the reconcile algorithm twice. In
      // the first pass, we schedule a deletion for all the current children by
      // passing null.
      workInProgress.child = reconcileChildFibers(
        workInProgress,
        current.child,
        null,
        renderLanes
      ); // In the second pass, we mount the new children. The trick here is that we
      // pass null in place of where we usually pass the current child set. This has
      // the effect of remounting all children regardless of whether their
      // identities match.

      workInProgress.child = reconcileChildFibers(
        workInProgress,
        null,
        nextChildren,
        renderLanes
      );
    }

    function updateForwardRef(
      current,
      workInProgress,
      Component,
      nextProps,
      renderLanes
    ) {
      // TODO: current can be non-null here even if the component
      // hasn't yet mounted. This happens after the first render suspends.
      // We'll need to figure out if this is fine or can cause issues.
      var render = Component.render;
      var ref = workInProgress.ref;
      var propsWithoutRef;

      {
        propsWithoutRef = nextProps;
      } // The rest is a fork of updateFunctionComponent

      var nextChildren;
      prepareToReadContext(workInProgress, renderLanes);

      {
        ReactCurrentOwner$2.current = workInProgress;
        setIsRendering(true);
        nextChildren = renderWithHooks(
          current,
          workInProgress,
          render,
          propsWithoutRef,
          ref,
          renderLanes
        );
        setIsRendering(false);
      }

      if (current !== null && !didReceiveUpdate) {
        bailoutHooks(current, workInProgress, renderLanes);
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes
        );
      }

      workInProgress.flags |= PerformedWork;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }

    function updateMemoComponent(
      current,
      workInProgress,
      Component,
      nextProps,
      renderLanes
    ) {
      if (current === null) {
        var type = Component.type;

        if (
          isSimpleFunctionComponent(type) &&
          Component.compare === null && // SimpleMemoComponent codepath doesn't resolve outer props either.
          Component.defaultProps === undefined
        ) {
          var resolvedType = type;

          {
            resolvedType = resolveFunctionForHotReloading(type);
          } // If this is a plain function component without default props,
          // and with only the default shallow comparison, we upgrade it
          // to a SimpleMemoComponent to allow fast path updates.

          workInProgress.tag = SimpleMemoComponent;
          workInProgress.type = resolvedType;

          {
            validateFunctionComponentInDev(workInProgress, type);
          }

          return updateSimpleMemoComponent(
            current,
            workInProgress,
            resolvedType,
            nextProps,
            renderLanes
          );
        }

        {
          if (Component.defaultProps !== undefined) {
            var componentName = getComponentNameFromType(type) || "Unknown";

            if (!didWarnAboutDefaultPropsOnFunctionComponent[componentName]) {
              error(
                "%s: Support for defaultProps will be removed from memo components " +
                  "in a future major release. Use JavaScript default parameters instead.",
                componentName
              );

              didWarnAboutDefaultPropsOnFunctionComponent[componentName] = true;
            }
          }
        }

        var child = createFiberFromTypeAndProps(
          Component.type,
          null,
          nextProps,
          workInProgress,
          workInProgress.mode,
          renderLanes
        );
        child.ref = workInProgress.ref;
        child.return = workInProgress;
        workInProgress.child = child;
        return child;
      }

      var currentChild = current.child; // This is always exactly one child

      var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes
      );

      if (!hasScheduledUpdateOrContext) {
        // This will be the props with resolved defaultProps,
        // unlike current.memoizedProps which will be the unresolved ones.
        var prevProps = currentChild.memoizedProps; // Default to shallow comparison

        var compare = Component.compare;
        compare = compare !== null ? compare : shallowEqual;

        if (
          compare(prevProps, nextProps) &&
          current.ref === workInProgress.ref
        ) {
          return bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes
          );
        }
      } // React DevTools reads this flag.

      workInProgress.flags |= PerformedWork;
      var newChild = createWorkInProgress(currentChild, nextProps);
      newChild.ref = workInProgress.ref;
      newChild.return = workInProgress;
      workInProgress.child = newChild;
      return newChild;
    }

    function updateSimpleMemoComponent(
      current,
      workInProgress,
      Component,
      nextProps,
      renderLanes
    ) {
      // TODO: current can be non-null here even if the component
      // hasn't yet mounted. This happens when the inner render suspends.
      // We'll need to figure out if this is fine or can cause issues.
      if (current !== null) {
        var prevProps = current.memoizedProps;

        if (
          shallowEqual(prevProps, nextProps) &&
          current.ref === workInProgress.ref && // Prevent bailout if the implementation changed due to hot reload.
          workInProgress.type === current.type
        ) {
          didReceiveUpdate = false; // The props are shallowly equal. Reuse the previous props object, like we
          // would during a normal fiber bailout.
          //
          // We don't have strong guarantees that the props object is referentially
          // equal during updates where we can't bail out anyway — like if the props
          // are shallowly equal, but there's a local state or context update in the
          // same batch.
          //
          // However, as a principle, we should aim to make the behavior consistent
          // across different ways of memoizing a component. For example, React.memo
          // has a different internal Fiber layout if you pass a normal function
          // component (SimpleMemoComponent) versus if you pass a different type
          // like forwardRef (MemoComponent). But this is an implementation detail.
          // Wrapping a component in forwardRef (or React.lazy, etc) shouldn't
          // affect whether the props object is reused during a bailout.

          workInProgress.pendingProps = nextProps = prevProps;

          if (!checkScheduledUpdateOrContext(current, renderLanes)) {
            // The pending lanes were cleared at the beginning of beginWork. We're
            // about to bail out, but there might be other lanes that weren't
            // included in the current render. Usually, the priority level of the
            // remaining updates is accumulated during the evaluation of the
            // component (i.e. when processing the update queue). But since since
            // we're bailing out early *without* evaluating the component, we need
            // to account for it here, too. Reset to the value of the current fiber.
            // NOTE: This only applies to SimpleMemoComponent, not MemoComponent,
            // because a MemoComponent fiber does not have hooks or an update queue;
            // rather, it wraps around an inner component, which may or may not
            // contains hooks.
            // TODO: Move the reset at in beginWork out of the common path so that
            // this is no longer necessary.
            workInProgress.lanes = current.lanes;
            return bailoutOnAlreadyFinishedWork(
              current,
              workInProgress,
              renderLanes
            );
          } else if (
            (current.flags & ForceUpdateForLegacySuspense) !==
            NoFlags$1
          ) {
            // This is a special case that only exists for legacy mode.
            // See https://github.com/facebook/react/pull/19216.
            didReceiveUpdate = true;
          }
        }
      }

      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        nextProps,
        renderLanes
      );
    }

    function updateOffscreenComponent(current, workInProgress, renderLanes) {
      var nextProps = workInProgress.pendingProps;
      var nextChildren = nextProps.children;
      var nextIsDetached =
        (workInProgress.stateNode._pendingVisibility & OffscreenDetached) !== 0;
      var prevState = current !== null ? current.memoizedState : null;
      markRef(current, workInProgress);

      if (nextProps.mode === "hidden" || enableLegacyHidden || nextIsDetached) {
        // Rendering a hidden tree.
        var didSuspend = (workInProgress.flags & DidCapture) !== NoFlags$1;

        if (didSuspend) {
          // Something suspended inside a hidden tree
          // Include the base lanes from the last render
          var nextBaseLanes =
            prevState !== null
              ? mergeLanes(prevState.baseLanes, renderLanes)
              : renderLanes;

          if (current !== null) {
            // Reset to the current children
            var currentChild = (workInProgress.child = current.child); // The current render suspended, but there may be other lanes with
            // pending work. We can't read `childLanes` from the current Offscreen
            // fiber because we reset it when it was deferred; however, we can read
            // the pending lanes from the child fibers.

            var currentChildLanes = NoLanes;

            while (currentChild !== null) {
              currentChildLanes = mergeLanes(
                mergeLanes(currentChildLanes, currentChild.lanes),
                currentChild.childLanes
              );
              currentChild = currentChild.sibling;
            }

            var lanesWeJustAttempted = nextBaseLanes;
            var remainingChildLanes = removeLanes(
              currentChildLanes,
              lanesWeJustAttempted
            );
            workInProgress.childLanes = remainingChildLanes;
          } else {
            workInProgress.childLanes = NoLanes;
            workInProgress.child = null;
          }

          return deferHiddenOffscreenComponent(
            current,
            workInProgress,
            nextBaseLanes
          );
        }

        if ((workInProgress.mode & ConcurrentMode) === NoMode) {
          // In legacy sync mode, don't defer the subtree. Render it now.
          // TODO: Consider how Offscreen should work with transitions in the future
          var nextState = {
            baseLanes: NoLanes,
            cachePool: null
          };
          workInProgress.memoizedState = nextState;

          reuseHiddenContextOnStack(workInProgress);
          pushOffscreenSuspenseHandler(workInProgress);
        } else if (!includesSomeLane(renderLanes, OffscreenLane)) {
          // We're hidden, and we're not rendering at Offscreen. We will bail out
          // and resume this tree later.
          // Schedule this fiber to re-render at Offscreen priority
          workInProgress.lanes = workInProgress.childLanes =
            laneToLanes(OffscreenLane); // Include the base lanes from the last render

          var _nextBaseLanes =
            prevState !== null
              ? mergeLanes(prevState.baseLanes, renderLanes)
              : renderLanes;

          return deferHiddenOffscreenComponent(
            current,
            workInProgress,
            _nextBaseLanes
          );
        } else {
          // This is the second render. The surrounding visible content has already
          // committed. Now we resume rendering the hidden tree.
          // Rendering at offscreen, so we can clear the base lanes.
          var _nextState = {
            baseLanes: NoLanes,
            cachePool: null
          };
          workInProgress.memoizedState = _nextState;

          if (prevState !== null) {
            pushHiddenContext(workInProgress, prevState);
          } else {
            reuseHiddenContextOnStack(workInProgress);
          }

          pushOffscreenSuspenseHandler(workInProgress);
        }
      } else {
        // Rendering a visible tree.
        if (prevState !== null) {
          pushHiddenContext(workInProgress, prevState);
          reuseSuspenseHandlerOnStack(workInProgress); // Since we're not hidden anymore, reset the state

          workInProgress.memoizedState = null;
        } else {
          // to avoid a push/pop misalignment.

          reuseHiddenContextOnStack(workInProgress);
          reuseSuspenseHandlerOnStack(workInProgress);
        }
      }

      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }

    function deferHiddenOffscreenComponent(
      current,
      workInProgress,
      nextBaseLanes,
      renderLanes
    ) {
      var nextState = {
        baseLanes: nextBaseLanes,
        // Save the cache pool so we can resume later.
        cachePool: null
      };
      workInProgress.memoizedState = nextState;
      // to avoid a push/pop misalignment.

      reuseHiddenContextOnStack(workInProgress);
      pushOffscreenSuspenseHandler(workInProgress);

      return null;
    } // Note: These happen to have identical begin phases, for now. We shouldn't hold

    function updateFragment(current, workInProgress, renderLanes) {
      var nextChildren = workInProgress.pendingProps;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }

    function updateMode(current, workInProgress, renderLanes) {
      var nextChildren = workInProgress.pendingProps.children;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }

    function updateProfiler(current, workInProgress, renderLanes) {
      {
        workInProgress.flags |= Update;

        {
          // Reset effect durations for the next eventual effect phase.
          // These are reset during render to allow the DevTools commit hook a chance to read them,
          var stateNode = workInProgress.stateNode;
          stateNode.effectDuration = 0;
          stateNode.passiveEffectDuration = 0;
        }
      }

      var nextProps = workInProgress.pendingProps;
      var nextChildren = nextProps.children;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }

    function markRef(current, workInProgress) {
      // TODO: Check props.ref instead of fiber.ref when enableRefAsProp is on.
      var ref = workInProgress.ref;

      if (ref === null) {
        if (current !== null && current.ref !== null) {
          // Schedule a Ref effect
          workInProgress.flags |= Ref | RefStatic;
        }
      } else {
        if (typeof ref !== "function" && typeof ref !== "object") {
          throw new Error(
            "Expected ref to be a function, an object returned by React.createRef(), or undefined/null."
          );
        }

        if (current === null || current.ref !== ref) {
          // Schedule a Ref effect
          workInProgress.flags |= Ref | RefStatic;
        }
      }
    }

    function updateFunctionComponent(
      current,
      workInProgress,
      Component,
      nextProps,
      renderLanes
    ) {
      var context;

      var nextChildren;
      prepareToReadContext(workInProgress, renderLanes);

      {
        ReactCurrentOwner$2.current = workInProgress;
        setIsRendering(true);
        nextChildren = renderWithHooks(
          current,
          workInProgress,
          Component,
          nextProps,
          context,
          renderLanes
        );
        setIsRendering(false);
      }

      if (current !== null && !didReceiveUpdate) {
        bailoutHooks(current, workInProgress, renderLanes);
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes
        );
      }

      workInProgress.flags |= PerformedWork;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }

    function replayFunctionComponent(
      current,
      workInProgress,
      nextProps,
      Component,
      secondArg,
      renderLanes
    ) {
      // This function is used to replay a component that previously suspended,
      // after its data resolves. It's a simplified version of
      // updateFunctionComponent that reuses the hooks from the previous attempt.
      prepareToReadContext(workInProgress, renderLanes);

      var nextChildren = replaySuspendedComponentWithHooks(
        current,
        workInProgress,
        Component,
        nextProps,
        secondArg
      );

      if (current !== null && !didReceiveUpdate) {
        bailoutHooks(current, workInProgress, renderLanes);
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes
        );
      }

      workInProgress.flags |= PerformedWork;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }

    function updateClassComponent(
      current,
      workInProgress,
      Component,
      nextProps,
      renderLanes
    ) {
      {
        // This is used by DevTools to force a boundary to error.
        switch (shouldError(workInProgress)) {
          case false: {
            var _instance = workInProgress.stateNode;
            var ctor = workInProgress.type; // TODO This way of resetting the error boundary state is a hack.
            // Is there a better way to do this?

            var tempInstance = new ctor(
              workInProgress.memoizedProps,
              _instance.context
            );
            var state = tempInstance.state;

            _instance.updater.enqueueSetState(_instance, state, null);

            break;
          }

          case true: {
            workInProgress.flags |= DidCapture;
            workInProgress.flags |= ShouldCapture; // eslint-disable-next-line react-internal/prod-error-codes

            var error$1 = new Error("Simulated error coming from DevTools");
            var lane = pickArbitraryLane(renderLanes);
            workInProgress.lanes = mergeLanes(workInProgress.lanes, lane); // Schedule the error boundary to re-render using updated state

            var update = createClassErrorUpdate(
              workInProgress,
              createCapturedValueAtFiber(error$1, workInProgress),
              lane
            );
            enqueueCapturedUpdate(workInProgress, update);
            break;
          }
        }
      } // Push context providers early to prevent context stack mismatches.
      // During mounting we don't know the child context yet as the instance doesn't exist.
      // We will invalidate the child context in finishClassComponent() right after rendering.

      var hasContext;

      if (isContextProvider()) {
        hasContext = true;
      } else {
        hasContext = false;
      }

      prepareToReadContext(workInProgress, renderLanes);
      var instance = workInProgress.stateNode;
      var shouldUpdate;

      if (instance === null) {
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress); // In the initial pass we might need to construct the instance.

        constructClassInstance(workInProgress, Component, nextProps);
        mountClassInstance(workInProgress, Component, nextProps, renderLanes);
        shouldUpdate = true;
      } else if (current === null) {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = resumeMountClassInstance(
          workInProgress,
          Component,
          nextProps,
          renderLanes
        );
      } else {
        shouldUpdate = updateClassInstance(
          current,
          workInProgress,
          Component,
          nextProps,
          renderLanes
        );
      }

      var nextUnitOfWork = finishClassComponent(
        current,
        workInProgress,
        Component,
        shouldUpdate,
        hasContext,
        renderLanes
      );

      {
        var inst = workInProgress.stateNode;

        if (shouldUpdate && inst.props !== nextProps) {
          if (!didWarnAboutReassigningProps) {
            error(
              "It looks like %s is reassigning its own `this.props` while rendering. " +
                "This is not supported and can lead to confusing bugs.",
              getComponentNameFromFiber(workInProgress) || "a component"
            );
          }

          didWarnAboutReassigningProps = true;
        }
      }

      return nextUnitOfWork;
    }

    function finishClassComponent(
      current,
      workInProgress,
      Component,
      shouldUpdate,
      hasContext,
      renderLanes
    ) {
      // Refs should update even if shouldComponentUpdate returns false
      markRef(current, workInProgress);
      var didCaptureError = (workInProgress.flags & DidCapture) !== NoFlags$1;

      if (!shouldUpdate && !didCaptureError) {
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes
        );
      }

      var instance = workInProgress.stateNode; // Rerender

      ReactCurrentOwner$2.current = workInProgress;
      var nextChildren;

      if (
        didCaptureError &&
        typeof Component.getDerivedStateFromError !== "function"
      ) {
        // If we captured an error, but getDerivedStateFromError is not defined,
        // unmount all the children. componentDidCatch will schedule an update to
        // re-render a fallback. This is temporary until we migrate everyone to
        // the new API.
        // TODO: Warn in a future release.
        nextChildren = null;

        {
          stopProfilerTimerIfRunning();
        }
      } else {
        {
          setIsRendering(true);
          nextChildren = instance.render();

          if (workInProgress.mode & StrictLegacyMode) {
            setIsStrictModeForDevtools(true);

            try {
              instance.render();
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }

          setIsRendering(false);
        }
      } // React DevTools reads this flag.

      workInProgress.flags |= PerformedWork;

      if (current !== null && didCaptureError) {
        // If we're recovering from an error, reconcile without reusing any of
        // the existing children. Conceptually, the normal children and the children
        // that are shown on error are two different sets, so we shouldn't reuse
        // normal children even if their identities match.
        forceUnmountCurrentAndReconcile(
          current,
          workInProgress,
          nextChildren,
          renderLanes
        );
      } else {
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      } // Memoize state using the values we just used to render.
      // TODO: Restructure so we never read values from the instance.

      workInProgress.memoizedState = instance.state; // The context might have changed so we need to recalculate it.

      return workInProgress.child;
    }

    function pushHostRootContext(workInProgress) {
      var root = workInProgress.stateNode;

      pushHostContainer(workInProgress, root.containerInfo);
    }

    function updateHostRoot(current, workInProgress, renderLanes) {
      pushHostRootContext(workInProgress);

      if (current === null) {
        throw new Error("Should have a current fiber. This is a bug in React.");
      }

      var nextProps = workInProgress.pendingProps;
      var prevState = workInProgress.memoizedState;
      var prevChildren = prevState.element;
      cloneUpdateQueue(current, workInProgress);
      processUpdateQueue(workInProgress, nextProps, null, renderLanes);
      var nextState = workInProgress.memoizedState;
      // it needs to happen after the `pushCacheProvider` call above to avoid a
      // context stack mismatch. A bit unfortunate.

      suspendIfUpdateReadFromEntangledAsyncAction(); // Caution: React DevTools currently depends on this property
      // being called "element".

      var nextChildren = nextState.element;

      {
        if (nextChildren === prevChildren) {
          return bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes
          );
        }

        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      }

      return workInProgress.child;
    }

    function updateHostComponent$1(current, workInProgress, renderLanes) {
      pushHostContext(workInProgress);
      var nextProps = workInProgress.pendingProps;
      var prevProps = current !== null ? current.memoizedProps : null;
      var nextChildren = nextProps.children;

      if (prevProps !== null && shouldSetTextContent()) {
        // If we're switching from a direct text child to a normal child, or to
        // empty, we need to schedule the text content to be reset.
        workInProgress.flags |= ContentReset;
      }

      markRef(current, workInProgress);
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }

    function updateHostText$1(current, workInProgress) {
      // immediately after.

      return null;
    }

    function mountLazyComponent(
      _current,
      workInProgress,
      elementType,
      renderLanes
    ) {
      resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
      var props = workInProgress.pendingProps;
      var lazyComponent = elementType;
      var payload = lazyComponent._payload;
      var init = lazyComponent._init;
      var Component = init(payload); // Store the unwrapped component in the type.

      workInProgress.type = Component;
      var resolvedTag = (workInProgress.tag =
        resolveLazyComponentTag(Component));
      var resolvedProps = resolveDefaultProps(Component, props);
      var child;

      switch (resolvedTag) {
        case FunctionComponent: {
          {
            validateFunctionComponentInDev(workInProgress, Component);
            workInProgress.type = Component =
              resolveFunctionForHotReloading(Component);
          }

          child = updateFunctionComponent(
            null,
            workInProgress,
            Component,
            resolvedProps,
            renderLanes
          );
          return child;
        }

        case ClassComponent: {
          {
            workInProgress.type = Component =
              resolveClassForHotReloading(Component);
          }

          child = updateClassComponent(
            null,
            workInProgress,
            Component,
            resolvedProps,
            renderLanes
          );
          return child;
        }

        case ForwardRef: {
          {
            workInProgress.type = Component =
              resolveForwardRefForHotReloading(Component);
          }

          child = updateForwardRef(
            null,
            workInProgress,
            Component,
            resolvedProps,
            renderLanes
          );
          return child;
        }

        case MemoComponent: {
          child = updateMemoComponent(
            null,
            workInProgress,
            Component,
            resolveDefaultProps(Component.type, resolvedProps), // The inner type can have defaults too
            renderLanes
          );
          return child;
        }
      }

      var hint = "";

      {
        if (
          Component !== null &&
          typeof Component === "object" &&
          Component.$$typeof === REACT_LAZY_TYPE
        ) {
          hint = " Did you wrap a component in React.lazy() more than once?";
        }
      } // This message intentionally doesn't mention ForwardRef or MemoComponent
      // because the fact that it's a separate type of work is an
      // implementation detail.

      throw new Error(
        "Element type is invalid. Received a promise that resolves to: " +
          Component +
          ". " +
          ("Lazy element type must resolve to a class or function." + hint)
      );
    }

    function mountIncompleteClassComponent(
      _current,
      workInProgress,
      Component,
      nextProps,
      renderLanes
    ) {
      resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress); // Promote the fiber to a class and try rendering again.

      workInProgress.tag = ClassComponent; // The rest of this function is a fork of `updateClassComponent`
      // Push context providers early to prevent context stack mismatches.
      // During mounting we don't know the child context yet as the instance doesn't exist.
      // We will invalidate the child context in finishClassComponent() right after rendering.

      var hasContext;

      if (isContextProvider()) {
        hasContext = true;
      } else {
        hasContext = false;
      }

      prepareToReadContext(workInProgress, renderLanes);
      constructClassInstance(workInProgress, Component, nextProps);
      mountClassInstance(workInProgress, Component, nextProps, renderLanes);
      return finishClassComponent(
        null,
        workInProgress,
        Component,
        true,
        hasContext,
        renderLanes
      );
    }

    function mountIndeterminateComponent(
      _current,
      workInProgress,
      Component,
      renderLanes
    ) {
      resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
      var props = workInProgress.pendingProps;
      var context;

      prepareToReadContext(workInProgress, renderLanes);
      var value;

      {
        if (
          Component.prototype &&
          typeof Component.prototype.render === "function"
        ) {
          var componentName = getComponentNameFromType(Component) || "Unknown";

          if (!didWarnAboutBadClass[componentName]) {
            error(
              "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
                "This is likely to cause errors. Change %s to extend React.Component instead.",
              componentName,
              componentName
            );

            didWarnAboutBadClass[componentName] = true;
          }
        }

        if (workInProgress.mode & StrictLegacyMode) {
          ReactStrictModeWarnings.recordLegacyContextWarning(
            workInProgress,
            null
          );
        }

        setIsRendering(true);
        ReactCurrentOwner$2.current = workInProgress;
        value = renderWithHooks(
          null,
          workInProgress,
          Component,
          props,
          context,
          renderLanes
        );
        setIsRendering(false);
      }

      workInProgress.flags |= PerformedWork;

      {
        // Support for module components is deprecated and is removed behind a flag.
        // Whether or not it would crash later, we want to show a good message in DEV first.
        if (
          typeof value === "object" &&
          value !== null &&
          typeof value.render === "function" &&
          value.$$typeof === undefined
        ) {
          var _componentName = getComponentNameFromType(Component) || "Unknown";

          if (!didWarnAboutModulePatternComponent[_componentName]) {
            error(
              "The <%s /> component appears to be a function component that returns a class instance. " +
                "Change %s to a class that extends React.Component instead. " +
                "If you can't use a class try assigning the prototype on the function as a workaround. " +
                "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
                "cannot be called with `new` by React.",
              _componentName,
              _componentName,
              _componentName
            );

            didWarnAboutModulePatternComponent[_componentName] = true;
          }
        }
      }

      if (
        // Run these checks in production only if the flag is off.
        // Eventually we'll delete this branch altogether.
        typeof value === "object" &&
        value !== null &&
        typeof value.render === "function" &&
        value.$$typeof === undefined
      ) {
        {
          var _componentName2 =
            getComponentNameFromType(Component) || "Unknown";

          if (!didWarnAboutModulePatternComponent[_componentName2]) {
            error(
              "The <%s /> component appears to be a function component that returns a class instance. " +
                "Change %s to a class that extends React.Component instead. " +
                "If you can't use a class try assigning the prototype on the function as a workaround. " +
                "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
                "cannot be called with `new` by React.",
              _componentName2,
              _componentName2,
              _componentName2
            );

            didWarnAboutModulePatternComponent[_componentName2] = true;
          }
        } // Proceed under the assumption that this is a class instance

        workInProgress.tag = ClassComponent; // Throw out any hooks that were used.

        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null; // Push context providers early to prevent context stack mismatches.
        // During mounting we don't know the child context yet as the instance doesn't exist.
        // We will invalidate the child context in finishClassComponent() right after rendering.

        var hasContext = false;

        if (isContextProvider()) {
          hasContext = true;
        } else {
          hasContext = false;
        }

        workInProgress.memoizedState =
          value.state !== null && value.state !== undefined
            ? value.state
            : null;
        initializeUpdateQueue(workInProgress);
        adoptClassInstance(workInProgress, value);
        mountClassInstance(workInProgress, Component, props, renderLanes);
        return finishClassComponent(
          null,
          workInProgress,
          Component,
          true,
          hasContext,
          renderLanes
        );
      } else {
        // Proceed under the assumption that this is a function component
        workInProgress.tag = FunctionComponent;

        {
          if (Component.contextTypes) {
            error(
              "%s uses the legacy contextTypes API which is no longer supported. " +
                "Use React.createContext() with React.useContext() instead.",
              getComponentNameFromType(Component) || "Unknown"
            );
          }
        }

        reconcileChildren(null, workInProgress, value, renderLanes);

        {
          validateFunctionComponentInDev(workInProgress, Component);
        }

        return workInProgress.child;
      }
    }

    function validateFunctionComponentInDev(workInProgress, Component) {
      {
        if (Component) {
          if (Component.childContextTypes) {
            error(
              "childContextTypes cannot be defined on a function component.\n" +
                "  %s.childContextTypes = ...",
              Component.displayName || Component.name || "Component"
            );
          }
        }

        if (workInProgress.ref !== null) {
          var info = "";
          var componentName = getComponentNameFromType(Component) || "Unknown";
          var ownerName = getCurrentFiberOwnerNameInDevOrNull();

          if (ownerName) {
            info += "\n\nCheck the render method of `" + ownerName + "`.";
          }

          var warningKey = componentName + "|" + (ownerName || "");

          if (!didWarnAboutFunctionRefs[warningKey]) {
            didWarnAboutFunctionRefs[warningKey] = true;

            error(
              "Function components cannot be given refs. " +
                "Attempts to access this ref will fail. " +
                "Did you mean to use React.forwardRef()?%s",
              info
            );
          }
        }

        if (Component.defaultProps !== undefined) {
          var _componentName3 =
            getComponentNameFromType(Component) || "Unknown";

          if (!didWarnAboutDefaultPropsOnFunctionComponent[_componentName3]) {
            error(
              "%s: Support for defaultProps will be removed from function components " +
                "in a future major release. Use JavaScript default parameters instead.",
              _componentName3
            );

            didWarnAboutDefaultPropsOnFunctionComponent[_componentName3] = true;
          }
        }

        if (typeof Component.getDerivedStateFromProps === "function") {
          var _componentName4 =
            getComponentNameFromType(Component) || "Unknown";

          if (
            !didWarnAboutGetDerivedStateOnFunctionComponent[_componentName4]
          ) {
            error(
              "%s: Function components do not support getDerivedStateFromProps.",
              _componentName4
            );

            didWarnAboutGetDerivedStateOnFunctionComponent[_componentName4] =
              true;
          }
        }

        if (
          typeof Component.contextType === "object" &&
          Component.contextType !== null
        ) {
          var _componentName5 =
            getComponentNameFromType(Component) || "Unknown";

          if (!didWarnAboutContextTypeOnFunctionComponent[_componentName5]) {
            error(
              "%s: Function components do not support contextType.",
              _componentName5
            );

            didWarnAboutContextTypeOnFunctionComponent[_componentName5] = true;
          }
        }
      }
    }

    var SUSPENDED_MARKER = {
      dehydrated: null,
      treeContext: null,
      retryLane: NoLane
    };

    function mountSuspenseOffscreenState(renderLanes) {
      return {
        baseLanes: renderLanes,
        cachePool: getSuspendedCache()
      };
    }

    function updateSuspenseOffscreenState(prevOffscreenState, renderLanes) {
      var cachePool = null;

      return {
        baseLanes: mergeLanes(prevOffscreenState.baseLanes, renderLanes),
        cachePool: cachePool
      };
    } // TODO: Probably should inline this back

    function shouldRemainOnFallback(current, workInProgress, renderLanes) {
      // If we're already showing a fallback, there are cases where we need to
      // remain on that fallback regardless of whether the content has resolved.
      // For example, SuspenseList coordinates when nested content appears.
      // TODO: For compatibility with offscreen prerendering, this should also check
      // whether the current fiber (if it exists) was visible in the previous tree.
      if (current !== null) {
        var suspenseState = current.memoizedState;

        if (suspenseState === null) {
          // Currently showing content. Don't hide it, even if ForceSuspenseFallback
          // is true. More precise name might be "ForceRemainSuspenseFallback".
          // Note: This is a factoring smell. Can't remain on a fallback if there's
          // no fallback to remain on.
          return false;
        }
      } // Not currently showing content. Consult the Suspense context.

      var suspenseContext = suspenseStackCursor.current;
      return hasSuspenseListContext(suspenseContext, ForceSuspenseFallback);
    }

    function getRemainingWorkInPrimaryTree(
      current,
      primaryTreeDidDefer,
      renderLanes
    ) {
      var remainingLanes =
        current !== null
          ? removeLanes(current.childLanes, renderLanes)
          : NoLanes;

      if (primaryTreeDidDefer) {
        // A useDeferredValue hook spawned a deferred task inside the primary tree.
        // Ensure that we retry this component at the deferred priority.
        // TODO: We could make this a per-subtree value instead of a global one.
        // Would need to track it on the context stack somehow, similar to what
        // we'd have to do for resumable contexts.
        remainingLanes = mergeLanes(remainingLanes, peekDeferredLane());
      }

      return remainingLanes;
    }

    function updateSuspenseComponent(current, workInProgress, renderLanes) {
      var nextProps = workInProgress.pendingProps; // This is used by DevTools to force a boundary to suspend.

      {
        if (shouldSuspend(workInProgress)) {
          workInProgress.flags |= DidCapture;
        }
      }

      var showFallback = false;
      var didSuspend = (workInProgress.flags & DidCapture) !== NoFlags$1;

      if (didSuspend || shouldRemainOnFallback(current)) {
        // Something in this boundary's subtree already suspended. Switch to
        // rendering the fallback children.
        showFallback = true;
        workInProgress.flags &= ~DidCapture;
      } // Check if the primary children spawned a deferred task (useDeferredValue)
      // during the first pass.

      var didPrimaryChildrenDefer =
        (workInProgress.flags & DidDefer) !== NoFlags$1;
      workInProgress.flags &= ~DidDefer; // OK, the next part is confusing. We're about to reconcile the Suspense
      // boundary's children. This involves some custom reconciliation logic. Two
      // main reasons this is so complicated.
      //
      // First, Legacy Mode has different semantics for backwards compatibility. The
      // primary tree will commit in an inconsistent state, so when we do the
      // second pass to render the fallback, we do some exceedingly, uh, clever
      // hacks to make that not totally break. Like transferring effects and
      // deletions from hidden tree. In Concurrent Mode, it's much simpler,
      // because we bailout on the primary tree completely and leave it in its old
      // state, no effects. Same as what we do for Offscreen (except that
      // Offscreen doesn't have the first render pass).
      //
      // Second is hydration. During hydration, the Suspense fiber has a slightly
      // different layout, where the child points to a dehydrated fragment, which
      // contains the DOM rendered by the server.
      //
      // Third, even if you set all that aside, Suspense is like error boundaries in
      // that we first we try to render one tree, and if that fails, we render again
      // and switch to a different tree. Like a try/catch block. So we have to track
      // which branch we're currently rendering. Ideally we would model this using
      // a stack.

      if (current === null) {
        var nextPrimaryChildren = nextProps.children;
        var nextFallbackChildren = nextProps.fallback;

        if (showFallback) {
          pushFallbackTreeSuspenseHandler(workInProgress);
          var fallbackFragment = mountSuspenseFallbackChildren(
            workInProgress,
            nextPrimaryChildren,
            nextFallbackChildren,
            renderLanes
          );
          var primaryChildFragment = workInProgress.child;
          primaryChildFragment.memoizedState =
            mountSuspenseOffscreenState(renderLanes);
          primaryChildFragment.childLanes = getRemainingWorkInPrimaryTree(
            current,
            didPrimaryChildrenDefer,
            renderLanes
          );
          workInProgress.memoizedState = SUSPENDED_MARKER;

          return fallbackFragment;
        } else {
          pushPrimaryTreeSuspenseHandler(workInProgress);
          return mountSuspensePrimaryChildren(
            workInProgress,
            nextPrimaryChildren
          );
        }
      } else {
        // This is an update.
        // Special path for hydration
        var prevState = current.memoizedState;

        if (prevState !== null) {
          var _dehydrated = prevState.dehydrated;

          if (_dehydrated !== null) {
            return updateDehydratedSuspenseComponent(
              current,
              workInProgress,
              didSuspend,
              didPrimaryChildrenDefer,
              nextProps,
              _dehydrated,
              prevState,
              renderLanes
            );
          }
        }

        if (showFallback) {
          pushFallbackTreeSuspenseHandler(workInProgress);
          var _nextFallbackChildren = nextProps.fallback;
          var _nextPrimaryChildren = nextProps.children;
          var fallbackChildFragment = updateSuspenseFallbackChildren(
            current,
            workInProgress,
            _nextPrimaryChildren,
            _nextFallbackChildren,
            renderLanes
          );
          var _primaryChildFragment2 = workInProgress.child;
          var prevOffscreenState = current.child.memoizedState;
          _primaryChildFragment2.memoizedState =
            prevOffscreenState === null
              ? mountSuspenseOffscreenState(renderLanes)
              : updateSuspenseOffscreenState(prevOffscreenState, renderLanes);

          _primaryChildFragment2.childLanes = getRemainingWorkInPrimaryTree(
            current,
            didPrimaryChildrenDefer,
            renderLanes
          );
          workInProgress.memoizedState = SUSPENDED_MARKER;
          return fallbackChildFragment;
        } else {
          pushPrimaryTreeSuspenseHandler(workInProgress);
          var _nextPrimaryChildren2 = nextProps.children;

          var _primaryChildFragment3 = updateSuspensePrimaryChildren(
            current,
            workInProgress,
            _nextPrimaryChildren2,
            renderLanes
          );

          workInProgress.memoizedState = null;
          return _primaryChildFragment3;
        }
      }
    }

    function mountSuspensePrimaryChildren(
      workInProgress,
      primaryChildren,
      renderLanes
    ) {
      var mode = workInProgress.mode;
      var primaryChildProps = {
        mode: "visible",
        children: primaryChildren
      };
      var primaryChildFragment = mountWorkInProgressOffscreenFiber(
        primaryChildProps,
        mode
      );
      primaryChildFragment.return = workInProgress;
      workInProgress.child = primaryChildFragment;
      return primaryChildFragment;
    }

    function mountSuspenseFallbackChildren(
      workInProgress,
      primaryChildren,
      fallbackChildren,
      renderLanes
    ) {
      var mode = workInProgress.mode;
      var progressedPrimaryFragment = workInProgress.child;
      var primaryChildProps = {
        mode: "hidden",
        children: primaryChildren
      };
      var primaryChildFragment;
      var fallbackChildFragment;

      if (
        (mode & ConcurrentMode) === NoMode &&
        progressedPrimaryFragment !== null
      ) {
        // In legacy mode, we commit the primary tree as if it successfully
        // completed, even though it's in an inconsistent state.
        primaryChildFragment = progressedPrimaryFragment;
        primaryChildFragment.childLanes = NoLanes;
        primaryChildFragment.pendingProps = primaryChildProps;

        if (workInProgress.mode & ProfileMode) {
          // Reset the durations from the first pass so they aren't included in the
          // final amounts. This seems counterintuitive, since we're intentionally
          // not measuring part of the render phase, but this makes it match what we
          // do in Concurrent Mode.
          primaryChildFragment.actualDuration = 0;
          primaryChildFragment.actualStartTime = -1;
          primaryChildFragment.selfBaseDuration = 0;
          primaryChildFragment.treeBaseDuration = 0;
        }

        fallbackChildFragment = createFiberFromFragment(
          fallbackChildren,
          mode,
          renderLanes,
          null
        );
      } else {
        primaryChildFragment = mountWorkInProgressOffscreenFiber(
          primaryChildProps,
          mode
        );
        fallbackChildFragment = createFiberFromFragment(
          fallbackChildren,
          mode,
          renderLanes,
          null
        );
      }

      primaryChildFragment.return = workInProgress;
      fallbackChildFragment.return = workInProgress;
      primaryChildFragment.sibling = fallbackChildFragment;
      workInProgress.child = primaryChildFragment;
      return fallbackChildFragment;
    }

    function mountWorkInProgressOffscreenFiber(
      offscreenProps,
      mode,
      renderLanes
    ) {
      // The props argument to `createFiberFromOffscreen` is `any` typed, so we use
      // this wrapper function to constrain it.
      return createFiberFromOffscreen(offscreenProps, mode, NoLanes, null);
    }

    function updateWorkInProgressOffscreenFiber(current, offscreenProps) {
      // The props argument to `createWorkInProgress` is `any` typed, so we use this
      // wrapper function to constrain it.
      return createWorkInProgress(current, offscreenProps);
    }

    function updateSuspensePrimaryChildren(
      current,
      workInProgress,
      primaryChildren,
      renderLanes
    ) {
      var currentPrimaryChildFragment = current.child;
      var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;
      var primaryChildFragment = updateWorkInProgressOffscreenFiber(
        currentPrimaryChildFragment,
        {
          mode: "visible",
          children: primaryChildren
        }
      );

      if ((workInProgress.mode & ConcurrentMode) === NoMode) {
        primaryChildFragment.lanes = renderLanes;
      }

      primaryChildFragment.return = workInProgress;
      primaryChildFragment.sibling = null;

      if (currentFallbackChildFragment !== null) {
        // Delete the fallback child fragment
        var deletions = workInProgress.deletions;

        if (deletions === null) {
          workInProgress.deletions = [currentFallbackChildFragment];
          workInProgress.flags |= ChildDeletion;
        } else {
          deletions.push(currentFallbackChildFragment);
        }
      }

      workInProgress.child = primaryChildFragment;
      return primaryChildFragment;
    }

    function updateSuspenseFallbackChildren(
      current,
      workInProgress,
      primaryChildren,
      fallbackChildren,
      renderLanes
    ) {
      var mode = workInProgress.mode;
      var currentPrimaryChildFragment = current.child;
      var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;
      var primaryChildProps = {
        mode: "hidden",
        children: primaryChildren
      };
      var primaryChildFragment;

      if (
        // In legacy mode, we commit the primary tree as if it successfully
        // completed, even though it's in an inconsistent state.
        (mode & ConcurrentMode) === NoMode && // Make sure we're on the second pass, i.e. the primary child fragment was
        // already cloned. In legacy mode, the only case where this isn't true is
        // when DevTools forces us to display a fallback; we skip the first render
        // pass entirely and go straight to rendering the fallback. (In Concurrent
        // Mode, SuspenseList can also trigger this scenario, but this is a legacy-
        // only codepath.)
        workInProgress.child !== currentPrimaryChildFragment
      ) {
        var progressedPrimaryFragment = workInProgress.child;
        primaryChildFragment = progressedPrimaryFragment;
        primaryChildFragment.childLanes = NoLanes;
        primaryChildFragment.pendingProps = primaryChildProps;

        if (workInProgress.mode & ProfileMode) {
          // Reset the durations from the first pass so they aren't included in the
          // final amounts. This seems counterintuitive, since we're intentionally
          // not measuring part of the render phase, but this makes it match what we
          // do in Concurrent Mode.
          primaryChildFragment.actualDuration = 0;
          primaryChildFragment.actualStartTime = -1;
          primaryChildFragment.selfBaseDuration =
            currentPrimaryChildFragment.selfBaseDuration;
          primaryChildFragment.treeBaseDuration =
            currentPrimaryChildFragment.treeBaseDuration;
        } // The fallback fiber was added as a deletion during the first pass.
        // However, since we're going to remain on the fallback, we no longer want
        // to delete it.

        workInProgress.deletions = null;
      } else {
        primaryChildFragment = updateWorkInProgressOffscreenFiber(
          currentPrimaryChildFragment,
          primaryChildProps
        ); // Since we're reusing a current tree, we need to reuse the flags, too.
        // (We don't do this in legacy mode, because in legacy mode we don't re-use
        // the current tree; see previous branch.)

        primaryChildFragment.subtreeFlags =
          currentPrimaryChildFragment.subtreeFlags & StaticMask;
      }

      var fallbackChildFragment;

      if (currentFallbackChildFragment !== null) {
        fallbackChildFragment = createWorkInProgress(
          currentFallbackChildFragment,
          fallbackChildren
        );
      } else {
        fallbackChildFragment = createFiberFromFragment(
          fallbackChildren,
          mode,
          renderLanes,
          null
        ); // Needs a placement effect because the parent (the Suspense boundary) already
        // mounted but this is a new fiber.

        fallbackChildFragment.flags |= Placement;
      }

      fallbackChildFragment.return = workInProgress;
      primaryChildFragment.return = workInProgress;
      primaryChildFragment.sibling = fallbackChildFragment;
      workInProgress.child = primaryChildFragment;
      return fallbackChildFragment;
    }

    function retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
      recoverableError
    ) {
      // Falling back to client rendering. Because this has performance
      // implications, it's considered a recoverable error, even though the user
      // likely won't observe anything wrong with the UI.
      //
      // The error is passed in as an argument to enforce that every caller provide
      // a custom message, or explicitly opt out (currently the only path that opts
      // out is legacy mode; every concurrent path provides an error).
      if (recoverableError !== null) {
        queueHydrationError(recoverableError);
      } // This will add the old fiber to the deletion list

      reconcileChildFibers(workInProgress, current.child, null, renderLanes); // We're now not suspended nor dehydrated.

      var nextProps = workInProgress.pendingProps;
      var primaryChildren = nextProps.children;
      var primaryChildFragment = mountSuspensePrimaryChildren(
        workInProgress,
        primaryChildren
      ); // Needs a placement effect because the parent (the Suspense boundary) already
      // mounted but this is a new fiber.

      primaryChildFragment.flags |= Placement;
      workInProgress.memoizedState = null;
      return primaryChildFragment;
    }

    function mountSuspenseFallbackAfterRetryWithoutHydrating(
      current,
      workInProgress,
      primaryChildren,
      fallbackChildren,
      renderLanes
    ) {
      var fiberMode = workInProgress.mode;
      var primaryChildProps = {
        mode: "visible",
        children: primaryChildren
      };
      var primaryChildFragment = mountWorkInProgressOffscreenFiber(
        primaryChildProps,
        fiberMode
      );
      var fallbackChildFragment = createFiberFromFragment(
        fallbackChildren,
        fiberMode,
        renderLanes,
        null
      ); // Needs a placement effect because the parent (the Suspense
      // boundary) already mounted but this is a new fiber.

      fallbackChildFragment.flags |= Placement;
      primaryChildFragment.return = workInProgress;
      fallbackChildFragment.return = workInProgress;
      primaryChildFragment.sibling = fallbackChildFragment;
      workInProgress.child = primaryChildFragment;

      if ((workInProgress.mode & ConcurrentMode) !== NoMode) {
        // We will have dropped the effect list which contains the
        // deletion. We need to reconcile to delete the current child.
        reconcileChildFibers(workInProgress, current.child, null, renderLanes);
      }

      return fallbackChildFragment;
    }

    function updateDehydratedSuspenseComponent(
      current,
      workInProgress,
      didSuspend,
      didPrimaryChildrenDefer,
      nextProps,
      suspenseInstance,
      suspenseState,
      renderLanes
    ) {
      if (!didSuspend) {
        // This is the first render pass. Attempt to hydrate.
        pushPrimaryTreeSuspenseHandler(workInProgress); // We should never be hydrating at this point because it is the first pass,

        if ((workInProgress.mode & ConcurrentMode) === NoMode) {
          return retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress,
            renderLanes,
            null
          );
        }

        if (isSuspenseInstanceFallback()) {
          // This boundary is in a permanent fallback state. In this case, we'll never
          // get an update and we'll never be able to hydrate the final content. Let's just try the
          // client side render instead.
          var digest;
          var message, stack;

          {
            var _getSuspenseInstanceF =
              getSuspenseInstanceFallbackErrorDetails();

            digest = _getSuspenseInstanceF.digest;
            message = _getSuspenseInstanceF.message;
            stack = _getSuspenseInstanceF.stack;
          }

          var capturedValue = null; // TODO: Figure out a better signal than encoding a magic digest value.

          {
            var error;

            if (message) {
              // eslint-disable-next-line react-internal/prod-error-codes
              error = new Error(message);
            } else {
              error = new Error(
                "The server could not finish this Suspense boundary, likely " +
                  "due to an error during server rendering. Switched to " +
                  "client rendering."
              );
            }

            error.digest = digest;
            capturedValue = createCapturedValueFromError(error, digest, stack);
          }

          return retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress,
            renderLanes,
            capturedValue
          );
        }
        // any context has changed, we need to treat is as if the input might have changed.

        var hasContextChanged = includesSomeLane(
          renderLanes,
          current.childLanes
        );

        if (didReceiveUpdate || hasContextChanged) {
          // This boundary has changed since the first render. This means that we are now unable to
          // hydrate it. We might still be able to hydrate it using a higher priority lane.
          var root = getWorkInProgressRoot();

          if (root !== null) {
            var attemptHydrationAtLane = getBumpedLaneForHydration(
              root,
              renderLanes
            );

            if (
              attemptHydrationAtLane !== NoLane &&
              attemptHydrationAtLane !== suspenseState.retryLane
            ) {
              // Intentionally mutating since this render will get interrupted. This
              // is one of the very rare times where we mutate the current tree
              // during the render phase.
              suspenseState.retryLane = attemptHydrationAtLane;
              enqueueConcurrentRenderForLane(current, attemptHydrationAtLane);
              scheduleUpdateOnFiber(root, current, attemptHydrationAtLane); // Throw a special object that signals to the work loop that it should
              // interrupt the current render.
              //
              // Because we're inside a React-only execution stack, we don't
              // strictly need to throw here — we could instead modify some internal
              // work loop state. But using an exception means we don't need to
              // check for this case on every iteration of the work loop. So doing
              // it this way moves the check out of the fast path.

              throw SelectiveHydrationException;
            }
          } // If we did not selectively hydrate, we'll continue rendering without
          // hydrating. Mark this tree as suspended to prevent it from committing
          // outside a transition.
          //
          // This path should only happen if the hydration lane already suspended.
          // Currently, it also happens during sync updates because there is no
          // hydration lane for sync updates.
          // TODO: We should ideally have a sync hydration lane that we can apply to do
          // a pass where we hydrate this subtree in place using the previous Context and then
          // reapply the update afterwards.

          if (isSuspenseInstancePending());
          else {
            renderDidSuspendDelayIfPossible();
          }

          return retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress,
            renderLanes,
            null
          );
        } else if (isSuspenseInstancePending()) {
          // This component is still pending more data from the server, so we can't hydrate its
          // content. We treat it as if this component suspended itself. It might seem as if
          // we could just try to render it client-side instead. However, this will perform a
          // lot of unnecessary work and is unlikely to complete since it often will suspend
          // on missing data anyway. Additionally, the server might be able to render more
          // than we can on the client yet. In that case we'd end up with more fallback states
          // on the client than if we just leave it alone. If the server times out or errors
          // these should update this boundary to the permanent Fallback state instead.
          // Mark it as having captured (i.e. suspended).
          workInProgress.flags |= DidCapture; // Leave the child in place. I.e. the dehydrated fragment.

          workInProgress.child = current.child; // Register a callback to retry this boundary once the server has sent the result.

          retryDehydratedSuspenseBoundary.bind(null, current);
          registerSuspenseInstanceRetry();
          return null;
        } else {
          var primaryChildren = nextProps.children;
          var primaryChildFragment = mountSuspensePrimaryChildren(
            workInProgress,
            primaryChildren
          ); // Mark the children as hydrating. This is a fast path to know whether this
          // tree is part of a hydrating tree. This is used to determine if a child
          // node has fully mounted yet, and for scheduling event replaying.
          // Conceptually this is similar to Placement in that a new subtree is
          // inserted into the React tree here. It just happens to not need DOM
          // mutations because it already exists.

          primaryChildFragment.flags |= Hydrating;
          return primaryChildFragment;
        }
      } else {
        // This is the second render pass. We already attempted to hydrated, but
        // something either suspended or errored.
        if (workInProgress.flags & ForceClientRender) {
          // Something errored during hydration. Try again without hydrating.
          pushPrimaryTreeSuspenseHandler(workInProgress);
          workInProgress.flags &= ~ForceClientRender;

          var _capturedValue = createCapturedValueFromError(
            new Error(
              "There was an error while hydrating this Suspense boundary. " +
                "Switched to client rendering."
            )
          );

          return retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress,
            renderLanes,
            _capturedValue
          );
        } else if (workInProgress.memoizedState !== null) {
          // Something suspended and we should still be in dehydrated mode.
          // Leave the existing child in place.
          // Push to avoid a mismatch
          pushFallbackTreeSuspenseHandler(workInProgress);
          workInProgress.child = current.child; // The dehydrated completion pass expects this flag to be there
          // but the normal suspense pass doesn't.

          workInProgress.flags |= DidCapture;
          return null;
        } else {
          // Suspended but we should no longer be in dehydrated mode.
          // Therefore we now have to render the fallback.
          pushFallbackTreeSuspenseHandler(workInProgress);
          var nextPrimaryChildren = nextProps.children;
          var nextFallbackChildren = nextProps.fallback;
          var fallbackChildFragment =
            mountSuspenseFallbackAfterRetryWithoutHydrating(
              current,
              workInProgress,
              nextPrimaryChildren,
              nextFallbackChildren,
              renderLanes
            );
          var _primaryChildFragment4 = workInProgress.child;
          _primaryChildFragment4.memoizedState =
            mountSuspenseOffscreenState(renderLanes);
          _primaryChildFragment4.childLanes = getRemainingWorkInPrimaryTree(
            current,
            didPrimaryChildrenDefer,
            renderLanes
          );
          workInProgress.memoizedState = SUSPENDED_MARKER;
          return fallbackChildFragment;
        }
      }
    }

    function scheduleSuspenseWorkOnFiber(fiber, renderLanes, propagationRoot) {
      fiber.lanes = mergeLanes(fiber.lanes, renderLanes);
      var alternate = fiber.alternate;

      if (alternate !== null) {
        alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
      }

      scheduleContextWorkOnParentPath(
        fiber.return,
        renderLanes,
        propagationRoot
      );
    }

    function propagateSuspenseContextChange(
      workInProgress,
      firstChild,
      renderLanes
    ) {
      // Mark any Suspense boundaries with fallbacks as having work to do.
      // If they were previously forced into fallbacks, they may now be able
      // to unblock.
      var node = firstChild;

      while (node !== null) {
        if (node.tag === SuspenseComponent) {
          var state = node.memoizedState;

          if (state !== null) {
            scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
          }
        } else if (node.tag === SuspenseListComponent) {
          // If the tail is hidden there might not be an Suspense boundaries
          // to schedule work on. In this case we have to schedule it on the
          // list itself.
          // We don't have to traverse to the children of the list since
          // the list will propagate the change when it rerenders.
          scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
        } else if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }

        if (node === workInProgress) {
          return;
        } // $FlowFixMe[incompatible-use] found when upgrading Flow

        while (node.sibling === null) {
          // $FlowFixMe[incompatible-use] found when upgrading Flow
          if (node.return === null || node.return === workInProgress) {
            return;
          }

          node = node.return;
        } // $FlowFixMe[incompatible-use] found when upgrading Flow

        node.sibling.return = node.return;
        node = node.sibling;
      }
    }

    function findLastContentRow(firstChild) {
      // This is going to find the last row among these children that is already
      // showing content on the screen, as opposed to being in fallback state or
      // new. If a row has multiple Suspense boundaries, any of them being in the
      // fallback state, counts as the whole row being in a fallback state.
      // Note that the "rows" will be workInProgress, but any nested children
      // will still be current since we haven't rendered them yet. The mounted
      // order may not be the same as the new order. We use the new order.
      var row = firstChild;
      var lastContentRow = null;

      while (row !== null) {
        var currentRow = row.alternate; // New rows can't be content rows.

        if (currentRow !== null && findFirstSuspended(currentRow) === null) {
          lastContentRow = row;
        }

        row = row.sibling;
      }

      return lastContentRow;
    }

    function validateRevealOrder(revealOrder) {
      {
        if (
          revealOrder !== undefined &&
          revealOrder !== "forwards" &&
          revealOrder !== "backwards" &&
          revealOrder !== "together" &&
          !didWarnAboutRevealOrder[revealOrder]
        ) {
          didWarnAboutRevealOrder[revealOrder] = true;

          if (typeof revealOrder === "string") {
            switch (revealOrder.toLowerCase()) {
              case "together":
              case "forwards":
              case "backwards": {
                error(
                  '"%s" is not a valid value for revealOrder on <SuspenseList />. ' +
                    'Use lowercase "%s" instead.',
                  revealOrder,
                  revealOrder.toLowerCase()
                );

                break;
              }

              case "forward":
              case "backward": {
                error(
                  '"%s" is not a valid value for revealOrder on <SuspenseList />. ' +
                    'React uses the -s suffix in the spelling. Use "%ss" instead.',
                  revealOrder,
                  revealOrder.toLowerCase()
                );

                break;
              }

              default:
                error(
                  '"%s" is not a supported revealOrder on <SuspenseList />. ' +
                    'Did you mean "together", "forwards" or "backwards"?',
                  revealOrder
                );

                break;
            }
          } else {
            error(
              "%s is not a supported value for revealOrder on <SuspenseList />. " +
                'Did you mean "together", "forwards" or "backwards"?',
              revealOrder
            );
          }
        }
      }
    }

    function validateTailOptions(tailMode, revealOrder) {
      {
        if (tailMode !== undefined && !didWarnAboutTailOptions[tailMode]) {
          if (tailMode !== "collapsed" && tailMode !== "hidden") {
            didWarnAboutTailOptions[tailMode] = true;

            error(
              '"%s" is not a supported value for tail on <SuspenseList />. ' +
                'Did you mean "collapsed" or "hidden"?',
              tailMode
            );
          } else if (
            revealOrder !== "forwards" &&
            revealOrder !== "backwards"
          ) {
            didWarnAboutTailOptions[tailMode] = true;

            error(
              '<SuspenseList tail="%s" /> is only valid if revealOrder is ' +
                '"forwards" or "backwards". ' +
                'Did you mean to specify revealOrder="forwards"?',
              tailMode
            );
          }
        }
      }
    }

    function validateSuspenseListNestedChild(childSlot, index) {
      {
        var isAnArray = isArray(childSlot);
        var isIterable =
          !isAnArray && typeof getIteratorFn(childSlot) === "function";

        if (isAnArray || isIterable) {
          var type = isAnArray ? "array" : "iterable";

          error(
            "A nested %s was passed to row #%s in <SuspenseList />. Wrap it in " +
              "an additional SuspenseList to configure its revealOrder: " +
              "<SuspenseList revealOrder=...> ... " +
              "<SuspenseList revealOrder=...>{%s}</SuspenseList> ... " +
              "</SuspenseList>",
            type,
            index,
            type
          );

          return false;
        }
      }

      return true;
    }

    function validateSuspenseListChildren(children, revealOrder) {
      {
        if (
          (revealOrder === "forwards" || revealOrder === "backwards") &&
          children !== undefined &&
          children !== null &&
          children !== false
        ) {
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              if (!validateSuspenseListNestedChild(children[i], i)) {
                return;
              }
            }
          } else {
            var iteratorFn = getIteratorFn(children);

            if (typeof iteratorFn === "function") {
              var childrenIterator = iteratorFn.call(children);

              if (childrenIterator) {
                var step = childrenIterator.next();
                var _i = 0;

                for (; !step.done; step = childrenIterator.next()) {
                  if (!validateSuspenseListNestedChild(step.value, _i)) {
                    return;
                  }

                  _i++;
                }
              }
            } else {
              error(
                'A single row was passed to a <SuspenseList revealOrder="%s" />. ' +
                  "This is not useful since it needs multiple rows. " +
                  "Did you mean to pass multiple children or an array?",
                revealOrder
              );
            }
          }
        }
      }
    }

    function initSuspenseListRenderState(
      workInProgress,
      isBackwards,
      tail,
      lastContentRow,
      tailMode
    ) {
      var renderState = workInProgress.memoizedState;

      if (renderState === null) {
        workInProgress.memoizedState = {
          isBackwards: isBackwards,
          rendering: null,
          renderingStartTime: 0,
          last: lastContentRow,
          tail: tail,
          tailMode: tailMode
        };
      } else {
        // We can reuse the existing object from previous renders.
        renderState.isBackwards = isBackwards;
        renderState.rendering = null;
        renderState.renderingStartTime = 0;
        renderState.last = lastContentRow;
        renderState.tail = tail;
        renderState.tailMode = tailMode;
      }
    } // This can end up rendering this component multiple passes.
    // The first pass splits the children fibers into two sets. A head and tail.
    // We first render the head. If anything is in fallback state, we do another
    // pass through beginWork to rerender all children (including the tail) with
    // the force suspend context. If the first render didn't have anything in
    // in fallback state. Then we render each row in the tail one-by-one.
    // That happens in the completeWork phase without going back to beginWork.

    function updateSuspenseListComponent(current, workInProgress, renderLanes) {
      var nextProps = workInProgress.pendingProps;
      var revealOrder = nextProps.revealOrder;
      var tailMode = nextProps.tail;
      var newChildren = nextProps.children;
      validateRevealOrder(revealOrder);
      validateTailOptions(tailMode, revealOrder);
      validateSuspenseListChildren(newChildren, revealOrder);
      reconcileChildren(current, workInProgress, newChildren, renderLanes);
      var suspenseContext = suspenseStackCursor.current;
      var shouldForceFallback = hasSuspenseListContext(
        suspenseContext,
        ForceSuspenseFallback
      );

      if (shouldForceFallback) {
        suspenseContext = setShallowSuspenseListContext(
          suspenseContext,
          ForceSuspenseFallback
        );
        workInProgress.flags |= DidCapture;
      } else {
        var didSuspendBefore =
          current !== null && (current.flags & DidCapture) !== NoFlags$1;

        if (didSuspendBefore) {
          // If we previously forced a fallback, we need to schedule work
          // on any nested boundaries to let them know to try to render
          // again. This is the same as context updating.
          propagateSuspenseContextChange(
            workInProgress,
            workInProgress.child,
            renderLanes
          );
        }

        suspenseContext = setDefaultShallowSuspenseListContext(suspenseContext);
      }

      pushSuspenseListContext(workInProgress, suspenseContext);

      if ((workInProgress.mode & ConcurrentMode) === NoMode) {
        // In legacy mode, SuspenseList doesn't work so we just
        // use make it a noop by treating it as the default revealOrder.
        workInProgress.memoizedState = null;
      } else {
        switch (revealOrder) {
          case "forwards": {
            var lastContentRow = findLastContentRow(workInProgress.child);
            var tail;

            if (lastContentRow === null) {
              // The whole list is part of the tail.
              // TODO: We could fast path by just rendering the tail now.
              tail = workInProgress.child;
              workInProgress.child = null;
            } else {
              // Disconnect the tail rows after the content row.
              // We're going to render them separately later.
              tail = lastContentRow.sibling;
              lastContentRow.sibling = null;
            }

            initSuspenseListRenderState(
              workInProgress,
              false, // isBackwards
              tail,
              lastContentRow,
              tailMode
            );
            break;
          }

          case "backwards": {
            // We're going to find the first row that has existing content.
            // At the same time we're going to reverse the list of everything
            // we pass in the meantime. That's going to be our tail in reverse
            // order.
            var _tail = null;
            var row = workInProgress.child;
            workInProgress.child = null;

            while (row !== null) {
              var currentRow = row.alternate; // New rows can't be content rows.

              if (
                currentRow !== null &&
                findFirstSuspended(currentRow) === null
              ) {
                // This is the beginning of the main content.
                workInProgress.child = row;
                break;
              }

              var nextRow = row.sibling;
              row.sibling = _tail;
              _tail = row;
              row = nextRow;
            } // TODO: If workInProgress.child is null, we can continue on the tail immediately.

            initSuspenseListRenderState(
              workInProgress,
              true, // isBackwards
              _tail,
              null, // last
              tailMode
            );
            break;
          }

          case "together": {
            initSuspenseListRenderState(
              workInProgress,
              false, // isBackwards
              null, // tail
              null, // last
              undefined
            );
            break;
          }

          default: {
            // The default reveal order is the same as not having
            // a boundary.
            workInProgress.memoizedState = null;
          }
        }
      }

      return workInProgress.child;
    }

    function updatePortalComponent(current, workInProgress, renderLanes) {
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      var nextChildren = workInProgress.pendingProps;

      if (current === null) {
        // Portals are special because we don't append the children during mount
        // but at commit. Therefore we need to track insertions which the normal
        // flow doesn't do during mount. This doesn't happen at the root because
        // the root always starts with a "current" with a null child.
        // TODO: Consider unifying this with how the root works.
        workInProgress.child = reconcileChildFibers(
          workInProgress,
          null,
          nextChildren,
          renderLanes
        );
      } else {
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      }

      return workInProgress.child;
    }

    var hasWarnedAboutUsingNoValuePropOnContextProvider = false;

    function updateContextProvider(current, workInProgress, renderLanes) {
      var context;

      {
        context = workInProgress.type._context;
      }

      var newProps = workInProgress.pendingProps;
      var oldProps = workInProgress.memoizedProps;
      var newValue = newProps.value;

      {
        if (!("value" in newProps)) {
          if (!hasWarnedAboutUsingNoValuePropOnContextProvider) {
            hasWarnedAboutUsingNoValuePropOnContextProvider = true;

            error(
              "The `value` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?"
            );
          }
        }
      }

      pushProvider(workInProgress, context, newValue);

      {
        if (oldProps !== null) {
          var oldValue = oldProps.value;

          if (objectIs(oldValue, newValue)) {
            // No change. Bailout early if children are the same.
            if (
              oldProps.children === newProps.children &&
              !hasContextChanged()
            ) {
              return bailoutOnAlreadyFinishedWork(
                current,
                workInProgress,
                renderLanes
              );
            }
          } else {
            // The context value changed. Search for matching consumers and schedule
            // them to update.
            propagateContextChange(workInProgress, context, renderLanes);
          }
        }
      }

      var newChildren = newProps.children;
      reconcileChildren(current, workInProgress, newChildren, renderLanes);
      return workInProgress.child;
    }

    function updateContextConsumer(current, workInProgress, renderLanes) {
      var context;

      {
        context = workInProgress.type;

        {
          if (context._context !== undefined) {
            context = context._context;
          }
        }
      }

      var newProps = workInProgress.pendingProps;
      var render = newProps.children;

      {
        if (typeof render !== "function") {
          error(
            "A context consumer was rendered with multiple children, or a child " +
              "that isn't a function. A context consumer expects a single child " +
              "that is a function. If you did pass a function, make sure there " +
              "is no trailing or leading whitespace around it."
          );
        }
      }

      prepareToReadContext(workInProgress, renderLanes);
      var newValue = readContext(context);

      var newChildren;

      {
        ReactCurrentOwner$2.current = workInProgress;
        setIsRendering(true);
        newChildren = render(newValue);
        setIsRendering(false);
      }

      workInProgress.flags |= PerformedWork;
      reconcileChildren(current, workInProgress, newChildren, renderLanes);
      return workInProgress.child;
    }

    function markWorkInProgressReceivedUpdate() {
      didReceiveUpdate = true;
    }

    function resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress) {
      if ((workInProgress.mode & ConcurrentMode) === NoMode) {
        if (current !== null) {
          // A lazy component only mounts if it suspended inside a non-
          // concurrent tree, in an inconsistent state. We want to treat it like
          // a new mount, even though an empty version of it already committed.
          // Disconnect the alternate pointers.
          current.alternate = null;
          workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

          workInProgress.flags |= Placement;
        }
      }
    }

    function bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderLanes
    ) {
      if (current !== null) {
        // Reuse previous dependencies
        workInProgress.dependencies = current.dependencies;
      }

      {
        // Don't update "base" render times for bailouts.
        stopProfilerTimerIfRunning();
      }

      markSkippedUpdateLanes(workInProgress.lanes); // Check if the children have any pending work.

      if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
        // The children don't have any work either. We can skip them.
        // TODO: Once we add back resuming, we should check if the children are
        // a work-in-progress set. If so, we need to transfer their effects.
        {
          return null;
        }
      } // This fiber doesn't have work, but its subtree does. Clone the child
      // fibers and continue.

      cloneChildFibers(current, workInProgress);
      return workInProgress.child;
    }

    function remountFiber(current, oldWorkInProgress, newWorkInProgress) {
      {
        var returnFiber = oldWorkInProgress.return;

        if (returnFiber === null) {
          // eslint-disable-next-line react-internal/prod-error-codes
          throw new Error("Cannot swap the root fiber.");
        } // Disconnect from the old current.
        // It will get deleted.

        current.alternate = null;
        oldWorkInProgress.alternate = null; // Connect to the new tree.

        newWorkInProgress.index = oldWorkInProgress.index;
        newWorkInProgress.sibling = oldWorkInProgress.sibling;
        newWorkInProgress.return = oldWorkInProgress.return;
        newWorkInProgress.ref = oldWorkInProgress.ref;

        {
          newWorkInProgress._debugInfo = oldWorkInProgress._debugInfo;
        } // Replace the child/sibling pointers above it.

        if (oldWorkInProgress === returnFiber.child) {
          returnFiber.child = newWorkInProgress;
        } else {
          var prevSibling = returnFiber.child;

          if (prevSibling === null) {
            // eslint-disable-next-line react-internal/prod-error-codes
            throw new Error("Expected parent to have a child.");
          } // $FlowFixMe[incompatible-use] found when upgrading Flow

          while (prevSibling.sibling !== oldWorkInProgress) {
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            prevSibling = prevSibling.sibling;

            if (prevSibling === null) {
              // eslint-disable-next-line react-internal/prod-error-codes
              throw new Error("Expected to find the previous sibling.");
            }
          } // $FlowFixMe[incompatible-use] found when upgrading Flow

          prevSibling.sibling = newWorkInProgress;
        } // Delete the old fiber and place the new one.
        // Since the old fiber is disconnected, we have to schedule it manually.

        var deletions = returnFiber.deletions;

        if (deletions === null) {
          returnFiber.deletions = [current];
          returnFiber.flags |= ChildDeletion;
        } else {
          deletions.push(current);
        }

        newWorkInProgress.flags |= Placement; // Restart work from the new fiber.

        return newWorkInProgress;
      }
    }

    function checkScheduledUpdateOrContext(current, renderLanes) {
      // Before performing an early bailout, we must check if there are pending
      // updates or context.
      var updateLanes = current.lanes;

      if (includesSomeLane(updateLanes, renderLanes)) {
        return true;
      } // No pending update, but because context is propagated lazily, we need

      return false;
    }

    function attemptEarlyBailoutIfNoScheduledUpdate(
      current,
      workInProgress,
      renderLanes
    ) {
      // This fiber does not have any pending work. Bailout without entering
      // the begin phase. There's still some bookkeeping we that needs to be done
      // in this optimized path, mostly pushing stuff onto the stack.
      switch (workInProgress.tag) {
        case HostRoot:
          pushHostRootContext(workInProgress);
          break;

        case HostSingleton:
        case HostComponent:
          pushHostContext(workInProgress);
          break;

        case ClassComponent: {
          break;
        }

        case HostPortal:
          pushHostContainer(
            workInProgress,
            workInProgress.stateNode.containerInfo
          );
          break;

        case ContextProvider: {
          var newValue = workInProgress.memoizedProps.value;
          var context;

          {
            context = workInProgress.type._context;
          }

          pushProvider(workInProgress, context, newValue);
          break;
        }

        case Profiler:
          {
            // Profiler should only call onRender when one of its descendants actually rendered.
            var hasChildWork = includesSomeLane(
              renderLanes,
              workInProgress.childLanes
            );

            if (hasChildWork) {
              workInProgress.flags |= Update;
            }

            {
              // Reset effect durations for the next eventual effect phase.
              // These are reset during render to allow the DevTools commit hook a chance to read them,
              var stateNode = workInProgress.stateNode;
              stateNode.effectDuration = 0;
              stateNode.passiveEffectDuration = 0;
            }
          }

          break;

        case SuspenseComponent: {
          var state = workInProgress.memoizedState;

          if (state !== null) {
            if (state.dehydrated !== null) {
              // We're not going to render the children, so this is just to maintain
              // push/pop symmetry
              pushPrimaryTreeSuspenseHandler(workInProgress); // We know that this component will suspend again because if it has
              // been unsuspended it has committed as a resolved Suspense component.
              // If it needs to be retried, it should have work scheduled on it.

              workInProgress.flags |= DidCapture; // We should never render the children of a dehydrated boundary until we
              // upgrade it. We return null instead of bailoutOnAlreadyFinishedWork.

              return null;
            } // If this boundary is currently timed out, we need to decide
            // whether to retry the primary children, or to skip over it and
            // go straight to the fallback. Check the priority of the primary
            // child fragment.

            var primaryChildFragment = workInProgress.child;
            var primaryChildLanes = primaryChildFragment.childLanes;

            if (includesSomeLane(renderLanes, primaryChildLanes)) {
              // The primary children have pending work. Use the normal path
              // to attempt to render the primary children again.
              return updateSuspenseComponent(
                current,
                workInProgress,
                renderLanes
              );
            } else {
              // The primary child fragment does not have pending work marked
              // on it
              pushPrimaryTreeSuspenseHandler(workInProgress); // The primary children do not have pending work with sufficient
              // priority. Bailout.

              var child = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress,
                renderLanes
              );

              if (child !== null) {
                // The fallback children have pending work. Skip over the
                // primary children and work on the fallback.
                return child.sibling;
              } else {
                // Note: We can return `null` here because we already checked
                // whether there were nested context consumers, via the call to
                // `bailoutOnAlreadyFinishedWork` above.
                return null;
              }
            }
          } else {
            pushPrimaryTreeSuspenseHandler(workInProgress);
          }

          break;
        }

        case SuspenseListComponent: {
          var didSuspendBefore = (current.flags & DidCapture) !== NoFlags$1;

          var _hasChildWork = includesSomeLane(
            renderLanes,
            workInProgress.childLanes
          );

          if (didSuspendBefore) {
            if (_hasChildWork) {
              // If something was in fallback state last time, and we have all the
              // same children then we're still in progressive loading state.
              // Something might get unblocked by state updates or retries in the
              // tree which will affect the tail. So we need to use the normal
              // path to compute the correct tail.
              return updateSuspenseListComponent(
                current,
                workInProgress,
                renderLanes
              );
            } // If none of the children had any work, that means that none of
            // them got retried so they'll still be blocked in the same way
            // as before. We can fast bail out.

            workInProgress.flags |= DidCapture;
          } // If nothing suspended before and we're rendering the same children,
          // then the tail doesn't matter. Anything new that suspends will work
          // in the "together" mode, so we can continue from the state we had.

          var renderState = workInProgress.memoizedState;

          if (renderState !== null) {
            // Reset to the "together" mode in case we've started a different
            // update in the past but didn't complete it.
            renderState.rendering = null;
            renderState.tail = null;
            renderState.lastEffect = null;
          }

          pushSuspenseListContext(workInProgress, suspenseStackCursor.current);

          if (_hasChildWork) {
            break;
          } else {
            // If none of the children had any work, that means that none of
            // them got retried so they'll still be blocked in the same way
            // as before. We can fast bail out.
            return null;
          }
        }

        case OffscreenComponent:
        case LegacyHiddenComponent: {
          // Need to check if the tree still needs to be deferred. This is
          // almost identical to the logic used in the normal update path,
          // so we'll just enter that. The only difference is we'll bail out
          // at the next level instead of this one, because the child props
          // have not changed. Which is fine.
          // TODO: Probably should refactor `beginWork` to split the bailout
          // path from the normal path. I'm tempted to do a labeled break here
          // but I won't :)
          workInProgress.lanes = NoLanes;
          return updateOffscreenComponent(current, workInProgress, renderLanes);
        }
      }

      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }

    function beginWork(current, workInProgress, renderLanes) {
      {
        if (workInProgress._debugNeedsRemount && current !== null) {
          // This will restart the begin phase with a new fiber.
          return remountFiber(
            current,
            workInProgress,
            createFiberFromTypeAndProps(
              workInProgress.type,
              workInProgress.key,
              workInProgress.pendingProps,
              workInProgress._debugOwner || null,
              workInProgress.mode,
              workInProgress.lanes
            )
          );
        }
      }

      if (current !== null) {
        var oldProps = current.memoizedProps;
        var newProps = workInProgress.pendingProps;

        if (
          oldProps !== newProps ||
          hasContextChanged() || // Force a re-render if the implementation changed due to hot reload:
          workInProgress.type !== current.type
        ) {
          // If props or context changed, mark the fiber as having performed work.
          // This may be unset if the props are determined to be equal later (memo).
          didReceiveUpdate = true;
        } else {
          // Neither props nor legacy context changes. Check if there's a pending
          // update or context change.
          var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
            current,
            renderLanes
          );

          if (
            !hasScheduledUpdateOrContext && // If this is the second pass of an error or suspense boundary, there
            // may not be work scheduled on `current`, so we check for this flag.
            (workInProgress.flags & DidCapture) === NoFlags$1
          ) {
            // No pending updates or context. Bail out now.
            didReceiveUpdate = false;
            return attemptEarlyBailoutIfNoScheduledUpdate(
              current,
              workInProgress,
              renderLanes
            );
          }

          if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags$1) {
            // This is a special case that only exists for legacy mode.
            // See https://github.com/facebook/react/pull/19216.
            didReceiveUpdate = true;
          } else {
            // An update was scheduled on this fiber, but there are no new props
            // nor legacy context. Set this to false. If an update queue or context
            // consumer produces a changed value, it will set this to true. Otherwise,
            // the component will assume the children have not changed and bail out.
            didReceiveUpdate = false;
          }
        }
      } else {
        didReceiveUpdate = false;
      } // Before entering the begin phase, clear pending update priority.
      // TODO: This assumes that we're about to evaluate the component and process
      // the update queue. However, there's an exception: SimpleMemoComponent
      // sometimes bails out later in the begin phase. This indicates that we should
      // move this assignment out of the common path and into each branch.

      workInProgress.lanes = NoLanes;

      switch (workInProgress.tag) {
        case IndeterminateComponent: {
          return mountIndeterminateComponent(
            current,
            workInProgress,
            workInProgress.type,
            renderLanes
          );
        }

        case LazyComponent: {
          var elementType = workInProgress.elementType;
          return mountLazyComponent(
            current,
            workInProgress,
            elementType,
            renderLanes
          );
        }

        case FunctionComponent: {
          var Component = workInProgress.type;
          var unresolvedProps = workInProgress.pendingProps;
          var resolvedProps =
            workInProgress.elementType === Component
              ? unresolvedProps
              : resolveDefaultProps(Component, unresolvedProps);
          return updateFunctionComponent(
            current,
            workInProgress,
            Component,
            resolvedProps,
            renderLanes
          );
        }

        case ClassComponent: {
          var _Component = workInProgress.type;
          var _unresolvedProps = workInProgress.pendingProps;

          var _resolvedProps =
            workInProgress.elementType === _Component
              ? _unresolvedProps
              : resolveDefaultProps(_Component, _unresolvedProps);

          return updateClassComponent(
            current,
            workInProgress,
            _Component,
            _resolvedProps,
            renderLanes
          );
        }

        case HostRoot:
          return updateHostRoot(current, workInProgress, renderLanes);

        case HostHoistable:

        // Fall through

        case HostSingleton:

        // Fall through

        case HostComponent:
          return updateHostComponent$1(current, workInProgress, renderLanes);

        case HostText:
          return updateHostText$1();

        case SuspenseComponent:
          return updateSuspenseComponent(current, workInProgress, renderLanes);

        case HostPortal:
          return updatePortalComponent(current, workInProgress, renderLanes);

        case ForwardRef: {
          var type = workInProgress.type;
          var _unresolvedProps2 = workInProgress.pendingProps;

          var _resolvedProps2 =
            workInProgress.elementType === type
              ? _unresolvedProps2
              : resolveDefaultProps(type, _unresolvedProps2);

          return updateForwardRef(
            current,
            workInProgress,
            type,
            _resolvedProps2,
            renderLanes
          );
        }

        case Fragment:
          return updateFragment(current, workInProgress, renderLanes);

        case Mode:
          return updateMode(current, workInProgress, renderLanes);

        case Profiler:
          return updateProfiler(current, workInProgress, renderLanes);

        case ContextProvider:
          return updateContextProvider(current, workInProgress, renderLanes);

        case ContextConsumer:
          return updateContextConsumer(current, workInProgress, renderLanes);

        case MemoComponent: {
          var _type = workInProgress.type;
          var _unresolvedProps3 = workInProgress.pendingProps; // Resolve outer props first, then resolve inner props.

          var _resolvedProps3 = resolveDefaultProps(_type, _unresolvedProps3);

          _resolvedProps3 = resolveDefaultProps(_type.type, _resolvedProps3);
          return updateMemoComponent(
            current,
            workInProgress,
            _type,
            _resolvedProps3,
            renderLanes
          );
        }

        case SimpleMemoComponent: {
          return updateSimpleMemoComponent(
            current,
            workInProgress,
            workInProgress.type,
            workInProgress.pendingProps,
            renderLanes
          );
        }

        case IncompleteClassComponent: {
          var _Component2 = workInProgress.type;
          var _unresolvedProps4 = workInProgress.pendingProps;

          var _resolvedProps4 =
            workInProgress.elementType === _Component2
              ? _unresolvedProps4
              : resolveDefaultProps(_Component2, _unresolvedProps4);

          return mountIncompleteClassComponent(
            current,
            workInProgress,
            _Component2,
            _resolvedProps4,
            renderLanes
          );
        }

        case SuspenseListComponent: {
          return updateSuspenseListComponent(
            current,
            workInProgress,
            renderLanes
          );
        }

        case ScopeComponent: {
          break;
        }

        case OffscreenComponent: {
          return updateOffscreenComponent(current, workInProgress, renderLanes);
        }
      }

      throw new Error(
        "Unknown unit of work tag (" +
          workInProgress.tag +
          "). This error is likely caused by a bug in " +
          "React. Please file an issue."
      );
    }

    var valueCursor = createCursor(null);
    var rendererCursorDEV;

    {
      rendererCursorDEV = createCursor(null);
    }

    var rendererSigil;

    {
      // Use this to detect multiple renderers using the same context
      rendererSigil = {};
    }

    var currentlyRenderingFiber = null;
    var lastContextDependency = null;
    var lastFullyObservedContext = null;
    var isDisallowedContextReadInDEV = false;
    function resetContextDependencies() {
      // This is called right before React yields execution, to ensure `readContext`
      // cannot be called outside the render phase.
      currentlyRenderingFiber = null;
      lastContextDependency = null;
      lastFullyObservedContext = null;

      {
        isDisallowedContextReadInDEV = false;
      }
    }
    function enterDisallowedContextReadInDEV() {
      {
        isDisallowedContextReadInDEV = true;
      }
    }
    function exitDisallowedContextReadInDEV() {
      {
        isDisallowedContextReadInDEV = false;
      }
    }
    function pushProvider(providerFiber, context, nextValue) {
      {
        push(valueCursor, context._currentValue, providerFiber);
        context._currentValue = nextValue;

        {
          push(rendererCursorDEV, context._currentRenderer, providerFiber);

          if (
            context._currentRenderer !== undefined &&
            context._currentRenderer !== null &&
            context._currentRenderer !== rendererSigil
          ) {
            error(
              "Detected multiple renderers concurrently rendering the " +
                "same context provider. This is currently unsupported."
            );
          }

          context._currentRenderer = rendererSigil;
        }
      }
    }
    function popProvider(context, providerFiber) {
      var currentValue = valueCursor.current;

      {
        context._currentValue = currentValue;

        {
          var currentRenderer = rendererCursorDEV.current;
          pop(rendererCursorDEV, providerFiber);
          context._currentRenderer = currentRenderer;
        }
      }

      pop(valueCursor, providerFiber);
    }
    function scheduleContextWorkOnParentPath(
      parent,
      renderLanes,
      propagationRoot
    ) {
      // Update the child lanes of all the ancestors, including the alternates.
      var node = parent;

      while (node !== null) {
        var alternate = node.alternate;

        if (!isSubsetOfLanes(node.childLanes, renderLanes)) {
          node.childLanes = mergeLanes(node.childLanes, renderLanes);

          if (alternate !== null) {
            alternate.childLanes = mergeLanes(
              alternate.childLanes,
              renderLanes
            );
          }
        } else if (
          alternate !== null &&
          !isSubsetOfLanes(alternate.childLanes, renderLanes)
        ) {
          alternate.childLanes = mergeLanes(alternate.childLanes, renderLanes);
        } else;

        if (node === propagationRoot) {
          break;
        }

        node = node.return;
      }

      {
        if (node !== propagationRoot) {
          error(
            "Expected to find the propagation root when scheduling context work. " +
              "This error is likely caused by a bug in React. Please file an issue."
          );
        }
      }
    }
    function propagateContextChange(workInProgress, context, renderLanes) {
      {
        propagateContextChange_eager(workInProgress, context, renderLanes);
      }
    }

    function propagateContextChange_eager(
      workInProgress,
      context,
      renderLanes
    ) {
      var fiber = workInProgress.child;

      if (fiber !== null) {
        // Set the return pointer of the child to the work-in-progress fiber.
        fiber.return = workInProgress;
      }

      while (fiber !== null) {
        var nextFiber = void 0; // Visit this fiber.

        var list = fiber.dependencies;

        if (list !== null) {
          nextFiber = fiber.child;
          var dependency = list.firstContext;

          while (dependency !== null) {
            // Check if the context matches.
            if (dependency.context === context) {
              // Match! Schedule an update on this fiber.
              if (fiber.tag === ClassComponent) {
                // Schedule a force update on the work-in-progress.
                var lane = pickArbitraryLane(renderLanes);
                var update = createUpdate(lane);
                update.tag = ForceUpdate; // TODO: Because we don't have a work-in-progress, this will add the
                // update to the current fiber, too, which means it will persist even if
                // this render is thrown away. Since it's a race condition, not sure it's
                // worth fixing.
                // Inlined `enqueueUpdate` to remove interleaved update check

                var updateQueue = fiber.updateQueue;

                if (updateQueue === null);
                else {
                  var sharedQueue = updateQueue.shared;
                  var pending = sharedQueue.pending;

                  if (pending === null) {
                    // This is the first update. Create a circular list.
                    update.next = update;
                  } else {
                    update.next = pending.next;
                    pending.next = update;
                  }

                  sharedQueue.pending = update;
                }
              }

              fiber.lanes = mergeLanes(fiber.lanes, renderLanes);
              var alternate = fiber.alternate;

              if (alternate !== null) {
                alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
              }

              scheduleContextWorkOnParentPath(
                fiber.return,
                renderLanes,
                workInProgress
              ); // Mark the updated lanes on the list, too.

              list.lanes = mergeLanes(list.lanes, renderLanes); // Since we already found a match, we can stop traversing the
              // dependency list.

              break;
            }

            dependency = dependency.next;
          }
        } else if (fiber.tag === ContextProvider) {
          // Don't scan deeper if this is a matching provider
          nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
        } else if (fiber.tag === DehydratedFragment) {
          // If a dehydrated suspense boundary is in this subtree, we don't know
          // if it will have any context consumers in it. The best we can do is
          // mark it as having updates.
          var parentSuspense = fiber.return;

          if (parentSuspense === null) {
            throw new Error(
              "We just came from a parent so we must have had a parent. This is a bug in React."
            );
          }

          parentSuspense.lanes = mergeLanes(parentSuspense.lanes, renderLanes);
          var _alternate = parentSuspense.alternate;

          if (_alternate !== null) {
            _alternate.lanes = mergeLanes(_alternate.lanes, renderLanes);
          } // This is intentionally passing this fiber as the parent
          // because we want to schedule this fiber as having work
          // on its children. We'll use the childLanes on
          // this fiber to indicate that a context has changed.

          scheduleContextWorkOnParentPath(
            parentSuspense,
            renderLanes,
            workInProgress
          );
          nextFiber = fiber.sibling;
        } else {
          // Traverse down.
          nextFiber = fiber.child;
        }

        if (nextFiber !== null) {
          // Set the return pointer of the child to the work-in-progress fiber.
          nextFiber.return = fiber;
        } else {
          // No child. Traverse to next sibling.
          nextFiber = fiber;

          while (nextFiber !== null) {
            if (nextFiber === workInProgress) {
              // We're back to the root of this subtree. Exit.
              nextFiber = null;
              break;
            }

            var sibling = nextFiber.sibling;

            if (sibling !== null) {
              // Set the return pointer of the sibling to the work-in-progress fiber.
              sibling.return = nextFiber.return;
              nextFiber = sibling;
              break;
            } // No more siblings. Traverse up.

            nextFiber = nextFiber.return;
          }
        }

        fiber = nextFiber;
      }
    }
    function prepareToReadContext(workInProgress, renderLanes) {
      currentlyRenderingFiber = workInProgress;
      lastContextDependency = null;
      lastFullyObservedContext = null;
      var dependencies = workInProgress.dependencies;

      if (dependencies !== null) {
        {
          var firstContext = dependencies.firstContext;

          if (firstContext !== null) {
            if (includesSomeLane(dependencies.lanes, renderLanes)) {
              // Context list has a pending update. Mark that this fiber performed work.
              markWorkInProgressReceivedUpdate();
            } // Reset the work-in-progress list

            dependencies.firstContext = null;
          }
        }
      }
    }
    function readContext(context) {
      {
        // This warning would fire if you read context inside a Hook like useMemo.
        // Unlike the class check below, it's not enforced in production for perf.
        if (isDisallowedContextReadInDEV) {
          error(
            "Context can only be read while React is rendering. " +
              "In classes, you can read it in the render method or getDerivedStateFromProps. " +
              "In function components, you can read it directly in the function body, but not " +
              "inside Hooks like useReducer() or useMemo()."
          );
        }
      }

      return readContextForConsumer(currentlyRenderingFiber, context);
    }
    function readContextDuringReconciliation(consumer, context, renderLanes) {
      if (currentlyRenderingFiber === null) {
        prepareToReadContext(consumer, renderLanes);
      }

      return readContextForConsumer(consumer, context);
    }

    function readContextForConsumer(consumer, context) {
      var value = context._currentValue;

      if (lastFullyObservedContext === context);
      else {
        var contextItem = {
          context: context,
          memoizedValue: value,
          next: null
        };

        if (lastContextDependency === null) {
          if (consumer === null) {
            throw new Error(
              "Context can only be read while React is rendering. " +
                "In classes, you can read it in the render method or getDerivedStateFromProps. " +
                "In function components, you can read it directly in the function body, but not " +
                "inside Hooks like useReducer() or useMemo()."
            );
          } // This is the first dependency for this component. Create a new list.

          lastContextDependency = contextItem;
          consumer.dependencies = {
            lanes: NoLanes,
            firstContext: contextItem
          };
        } else {
          // Append a new context item.
          lastContextDependency = lastContextDependency.next = contextItem;
        }
      }

      return value;
    }

    var ReactCurrentBatchConfig$1 =
      ReactSharedInternals.ReactCurrentBatchConfig;
    function requestCurrentTransition() {
      var transition = ReactCurrentBatchConfig$1.transition;

      if (transition !== null) {
        // Whenever a transition update is scheduled, register a callback on the
        // transition object so we can get the return value of the scope function.
        transition._callbacks.add(handleAsyncAction);
      }

      return transition;
    }

    function handleAsyncAction(transition, thenable) {}

    function notifyTransitionCallbacks(transition, returnValue) {
      var callbacks = transition._callbacks;
      callbacks.forEach(function (callback) {
        return callback(transition, returnValue);
      });
    } // When retrying a Suspense/Offscreen boundary, we restore the cache that was
    function getSuspendedCache() {
      {
        return null;
      } // This function is called when a Suspense boundary suspends. It returns the
    }

    /**
     * Tag the fiber with an update effect. This turns a Placement into
     * a PlacementAndUpdate.
     */

    function markUpdate(workInProgress) {
      workInProgress.flags |= Update;
    }

    function appendAllChildren(
      parent,
      workInProgress,
      needsVisibilityToggle,
      isHidden
    ) {
      {
        // We only have the top Fiber that was created but we need recurse down its
        // children to find all the terminal nodes.
        var node = workInProgress.child;

        while (node !== null) {
          if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode);
          } else if (node.tag === HostPortal || false);
          else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
          }

          if (node === workInProgress) {
            return;
          } // $FlowFixMe[incompatible-use] found when upgrading Flow

          while (node.sibling === null) {
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            if (node.return === null || node.return === workInProgress) {
              return;
            }

            node = node.return;
          } // $FlowFixMe[incompatible-use] found when upgrading Flow

          node.sibling.return = node.return;
          node = node.sibling;
        }
      }
    } // An unfortunate fork of appendAllChildren because we have two different parent types.

    function updateHostComponent(
      current,
      workInProgress,
      type,
      newProps,
      renderLanes
    ) {
      {
        // If we have an alternate, that means this is an update and we need to
        // schedule a side-effect to do the updates.
        var oldProps = current.memoizedProps;

        if (oldProps === newProps) {
          // In mutation mode, this is sufficient for a bailout because
          // we won't touch this node even if children changed.
          return;
        }

        markUpdate(workInProgress);
      }
    } // This function must be called at the very end of the complete phase, because
    // it might throw to suspend, and if the resource immediately loads, the work
    // loop will resume rendering as if the work-in-progress completed. So it must
    // fully complete.
    // TODO: This should ideally move to begin phase, but currently the instance is
    // not created until the complete phase. For our existing use cases, host nodes
    // that suspend don't have children, so it doesn't matter. But that might not
    // always be true in the future.

    function preloadInstanceAndSuspendIfNeeded(
      workInProgress,
      type,
      props,
      renderLanes
    ) {
      {
        // If this flag was set previously, we can remove it. The flag
        // represents whether this particular set of props might ever need to
        // suspend. The safest thing to do is for maySuspendCommit to always
        // return true, but if the renderer is reasonably confident that the
        // underlying resource won't be evicted, it can return false as a
        // performance optimization.
        workInProgress.flags &= ~MaySuspendCommit;
        return;
      } // Mark this fiber with a flag. This gets set on all host instances
    }

    function scheduleRetryEffect(workInProgress, retryQueue) {
      var wakeables = retryQueue;

      if (wakeables !== null) {
        // Schedule an effect to attach a retry listener to the promise.
        // TODO: Move to passive phase
        workInProgress.flags |= Update;
      } else {
        // This boundary suspended, but no wakeables were added to the retry
        // queue. Check if the renderer suspended commit. If so, this means
        // that once the fallback is committed, we can immediately retry
        // rendering again, because rendering wasn't actually blocked. Only
        // the commit phase.
        // TODO: Consider a model where we always schedule an immediate retry, even
        // for normal Suspense. That way the retry can partially render up to the
        // first thing that suspends.
        if (workInProgress.flags & ScheduleRetry) {
          var retryLane = // TODO: This check should probably be moved into claimNextRetryLane
            // I also suspect that we need some further consolidation of offscreen
            // and retry lanes.
            workInProgress.tag !== OffscreenComponent
              ? claimNextRetryLane()
              : OffscreenLane;
          workInProgress.lanes = mergeLanes(workInProgress.lanes, retryLane);
        }
      }
    }

    function updateHostText(current, workInProgress, oldText, newText) {
      {
        // If the text differs, mark it as an update. All the work in done in commitWork.
        if (oldText !== newText) {
          markUpdate(workInProgress);
        }
      }
    }

    function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
      switch (renderState.tailMode) {
        case "hidden": {
          // Any insertions at the end of the tail list after this point
          // should be invisible. If there are already mounted boundaries
          // anything before them are not considered for collapsing.
          // Therefore we need to go through the whole tail to find if
          // there are any.
          var tailNode = renderState.tail;
          var lastTailNode = null;

          while (tailNode !== null) {
            if (tailNode.alternate !== null) {
              lastTailNode = tailNode;
            }

            tailNode = tailNode.sibling;
          } // Next we're simply going to delete all insertions after the
          // last rendered item.

          if (lastTailNode === null) {
            // All remaining items in the tail are insertions.
            renderState.tail = null;
          } else {
            // Detach the insertion after the last node that was already
            // inserted.
            lastTailNode.sibling = null;
          }

          break;
        }

        case "collapsed": {
          // Any insertions at the end of the tail list after this point
          // should be invisible. If there are already mounted boundaries
          // anything before them are not considered for collapsing.
          // Therefore we need to go through the whole tail to find if
          // there are any.
          var _tailNode = renderState.tail;
          var _lastTailNode = null;

          while (_tailNode !== null) {
            if (_tailNode.alternate !== null) {
              _lastTailNode = _tailNode;
            }

            _tailNode = _tailNode.sibling;
          } // Next we're simply going to delete all insertions after the
          // last rendered item.

          if (_lastTailNode === null) {
            // All remaining items in the tail are insertions.
            if (!hasRenderedATailFallback && renderState.tail !== null) {
              // We suspended during the head. We want to show at least one
              // row at the tail. So we'll keep on and cut off the rest.
              renderState.tail.sibling = null;
            } else {
              renderState.tail = null;
            }
          } else {
            // Detach the insertion after the last node that was already
            // inserted.
            _lastTailNode.sibling = null;
          }

          break;
        }
      }
    }

    function bubbleProperties(completedWork) {
      var didBailout =
        completedWork.alternate !== null &&
        completedWork.alternate.child === completedWork.child;
      var newChildLanes = NoLanes;
      var subtreeFlags = NoFlags$1;

      if (!didBailout) {
        // Bubble up the earliest expiration time.
        if ((completedWork.mode & ProfileMode) !== NoMode) {
          // In profiling mode, resetChildExpirationTime is also used to reset
          // profiler durations.
          var actualDuration = completedWork.actualDuration;
          var treeBaseDuration = completedWork.selfBaseDuration;
          var child = completedWork.child;

          while (child !== null) {
            newChildLanes = mergeLanes(
              newChildLanes,
              mergeLanes(child.lanes, child.childLanes)
            );
            subtreeFlags |= child.subtreeFlags;
            subtreeFlags |= child.flags; // When a fiber is cloned, its actualDuration is reset to 0. This value will
            // only be updated if work is done on the fiber (i.e. it doesn't bailout).
            // When work is done, it should bubble to the parent's actualDuration. If
            // the fiber has not been cloned though, (meaning no work was done), then
            // this value will reflect the amount of time spent working on a previous
            // render. In that case it should not bubble. We determine whether it was
            // cloned by comparing the child pointer.
            // $FlowFixMe[unsafe-addition] addition with possible null/undefined value

            actualDuration += child.actualDuration; // $FlowFixMe[unsafe-addition] addition with possible null/undefined value

            treeBaseDuration += child.treeBaseDuration;
            child = child.sibling;
          }

          completedWork.actualDuration = actualDuration;
          completedWork.treeBaseDuration = treeBaseDuration;
        } else {
          var _child = completedWork.child;

          while (_child !== null) {
            newChildLanes = mergeLanes(
              newChildLanes,
              mergeLanes(_child.lanes, _child.childLanes)
            );
            subtreeFlags |= _child.subtreeFlags;
            subtreeFlags |= _child.flags; // Update the return pointer so the tree is consistent. This is a code
            // smell because it assumes the commit phase is never concurrent with
            // the render phase. Will address during refactor to alternate model.

            _child.return = completedWork;
            _child = _child.sibling;
          }
        }

        completedWork.subtreeFlags |= subtreeFlags;
      } else {
        // Bubble up the earliest expiration time.
        if ((completedWork.mode & ProfileMode) !== NoMode) {
          // In profiling mode, resetChildExpirationTime is also used to reset
          // profiler durations.
          var _treeBaseDuration = completedWork.selfBaseDuration;
          var _child2 = completedWork.child;

          while (_child2 !== null) {
            newChildLanes = mergeLanes(
              newChildLanes,
              mergeLanes(_child2.lanes, _child2.childLanes)
            ); // "Static" flags share the lifetime of the fiber/hook they belong to,
            // so we should bubble those up even during a bailout. All the other
            // flags have a lifetime only of a single render + commit, so we should
            // ignore them.

            subtreeFlags |= _child2.subtreeFlags & StaticMask;
            subtreeFlags |= _child2.flags & StaticMask; // $FlowFixMe[unsafe-addition] addition with possible null/undefined value

            _treeBaseDuration += _child2.treeBaseDuration;
            _child2 = _child2.sibling;
          }

          completedWork.treeBaseDuration = _treeBaseDuration;
        } else {
          var _child3 = completedWork.child;

          while (_child3 !== null) {
            newChildLanes = mergeLanes(
              newChildLanes,
              mergeLanes(_child3.lanes, _child3.childLanes)
            ); // "Static" flags share the lifetime of the fiber/hook they belong to,
            // so we should bubble those up even during a bailout. All the other
            // flags have a lifetime only of a single render + commit, so we should
            // ignore them.

            subtreeFlags |= _child3.subtreeFlags & StaticMask;
            subtreeFlags |= _child3.flags & StaticMask; // Update the return pointer so the tree is consistent. This is a code
            // smell because it assumes the commit phase is never concurrent with
            // the render phase. Will address during refactor to alternate model.

            _child3.return = completedWork;
            _child3 = _child3.sibling;
          }
        }

        completedWork.subtreeFlags |= subtreeFlags;
      }

      completedWork.childLanes = newChildLanes;
      return didBailout;
    }

    function completeDehydratedSuspenseBoundary(
      current,
      workInProgress,
      nextState
    ) {
      var wasHydrated = popHydrationState();

      if (nextState !== null && nextState.dehydrated !== null) {
        // We might be inside a hydration state the first time we're picking up this
        // Suspense boundary, and also after we've reentered it for further hydration.
        if (current === null) {
          if (!wasHydrated) {
            throw new Error(
              "A dehydrated suspense component was completed without a hydrated node. " +
                "This is probably a bug in React."
            );
          }

          prepareToHydrateHostSuspenseInstance();
          bubbleProperties(workInProgress);

          {
            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              var isTimedOutSuspense = nextState !== null;

              if (isTimedOutSuspense) {
                // Don't count time spent in a timed out Suspense subtree as part of the base duration.
                var primaryChildFragment = workInProgress.child;

                if (primaryChildFragment !== null) {
                  // $FlowFixMe[unsafe-arithmetic] Flow doesn't support type casting in combination with the -= operator
                  workInProgress.treeBaseDuration -=
                    primaryChildFragment.treeBaseDuration;
                }
              }
            }
          }

          return false;
        } else {
          if ((workInProgress.flags & DidCapture) === NoFlags$1) {
            // This boundary did not suspend so it's now hydrated and unsuspended.
            workInProgress.memoizedState = null;
          } // If nothing suspended, we need to schedule an effect to mark this boundary
          // as having hydrated so events know that they're free to be invoked.
          // It's also a signal to replay events and the suspense callback.
          // If something suspended, schedule an effect to attach retry listeners.
          // So we might as well always mark this.

          workInProgress.flags |= Update;
          bubbleProperties(workInProgress);

          {
            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              var _isTimedOutSuspense = nextState !== null;

              if (_isTimedOutSuspense) {
                // Don't count time spent in a timed out Suspense subtree as part of the base duration.
                var _primaryChildFragment = workInProgress.child;

                if (_primaryChildFragment !== null) {
                  // $FlowFixMe[unsafe-arithmetic] Flow doesn't support type casting in combination with the -= operator
                  workInProgress.treeBaseDuration -=
                    _primaryChildFragment.treeBaseDuration;
                }
              }
            }
          }

          return false;
        }
      } else {
        // Successfully completed this tree. If this was a forced client render,
        // there may have been recoverable errors during first hydration
        // attempt. If so, add them to a queue so we can log them in the
        // commit phase.
        upgradeHydrationErrorsToRecoverable(); // Fall through to normal Suspense path

        return true;
      }
    }

    function completeWork(current, workInProgress, renderLanes) {
      var newProps = workInProgress.pendingProps; // Note: This intentionally doesn't check if we're hydrating because comparing

      switch (workInProgress.tag) {
        case IndeterminateComponent:
        case LazyComponent:
        case SimpleMemoComponent:
        case FunctionComponent:
        case ForwardRef:
        case Fragment:
        case Mode:
        case Profiler:
        case ContextConsumer:
        case MemoComponent:
          bubbleProperties(workInProgress);
          return null;

        case ClassComponent: {
          bubbleProperties(workInProgress);
          return null;
        }

        case HostRoot: {
          var fiberRoot = workInProgress.stateNode;
          popHostContainer(workInProgress);

          if (fiberRoot.pendingContext) {
            fiberRoot.context = fiberRoot.pendingContext;
            fiberRoot.pendingContext = null;
          }

          if (current === null || current.child === null) {
            // If we hydrated, pop so that we can delete any remaining children
            // that weren't hydrated.
            var wasHydrated = popHydrationState();

            if (wasHydrated) {
              // If we hydrated, then we'll need to schedule an update for
              // the commit side-effects on the root.
              markUpdate(workInProgress);
            } else {
              if (current !== null) {
                var prevState = current.memoizedState;

                if (
                  // Check if this is a client root
                  !prevState.isDehydrated || // Check if we reverted to client rendering (e.g. due to an error)
                  (workInProgress.flags & ForceClientRender) !== NoFlags$1
                ) {
                  // Schedule an effect to clear this container at the start of the
                  // next commit. This handles the case of React rendering into a
                  // container with previous children. It's also safe to do for
                  // updates too, because current.child would only be null if the
                  // previous render was null (so the container would already
                  // be empty).
                  workInProgress.flags |= Snapshot; // If this was a forced client render, there may have been
                  // recoverable errors during first hydration attempt. If so, add
                  // them to a queue so we can log them in the commit phase.

                  upgradeHydrationErrorsToRecoverable();
                }
              }
            }
          }
          bubbleProperties(workInProgress);

          return null;
        }

        case HostHoistable:

        case HostSingleton:

        case HostComponent: {
          popHostContext(workInProgress);
          var _type2 = workInProgress.type;

          if (current !== null && workInProgress.stateNode != null) {
            updateHostComponent(current, workInProgress, _type2, newProps);
          } else {
            if (!newProps) {
              if (workInProgress.stateNode === null) {
                throw new Error(
                  "We must have new props for new mounts. This error is likely " +
                    "caused by a bug in React. Please file an issue."
                );
              } // This can happen when we abort work.

              bubbleProperties(workInProgress);
              return null;
            }

            var _currentHostContext = getHostContext(); // TODO: Move createInstance to beginWork and keep it on a context
            // "stack" as the parent. Then append children as we go in beginWork
            // or completeWork depending on whether we want to add them top->down or
            // bottom->up. Top->down is faster in IE11.

            var _wasHydrated2 = popHydrationState();

            if (_wasHydrated2) {
              // TODO: Move this and createInstance step into the beginPhase
              // to consolidate.
              prepareToHydrateHostInstance();
            } else {
              var _rootContainerInstance = getRootHostContainer();

              var _instance3 = createInstance(
                _type2,
                newProps,
                _rootContainerInstance,
                _currentHostContext,
                workInProgress
              ); // TODO: For persistent renderers, we should pass children as part
              // of the initial instance creation

              appendAllChildren(_instance3, workInProgress);
              workInProgress.stateNode = _instance3; // Certain renderers require commit-time effects for initial mount.
              // (eg DOM renderer supports auto-focus for certain elements).
              // Make sure such renderers get scheduled for later work.

              if (finalizeInitialChildren(_instance3)) {
                markUpdate(workInProgress);
              }
            }
          }

          bubbleProperties(workInProgress); // This must come at the very end of the complete phase, because it might
          // throw to suspend, and if the resource immediately loads, the work loop
          // will resume rendering as if the work-in-progress completed. So it must
          // fully complete.

          preloadInstanceAndSuspendIfNeeded(workInProgress);
          return null;
        }

        case HostText: {
          var newText = newProps;

          if (current && workInProgress.stateNode != null) {
            var oldText = current.memoizedProps; // If we have an alternate, that means this is an update and we need
            // to schedule a side-effect to do the updates.

            updateHostText(current, workInProgress, oldText, newText);
          } else {
            if (typeof newText !== "string") {
              if (workInProgress.stateNode === null) {
                throw new Error(
                  "We must have new props for new mounts. This error is likely " +
                    "caused by a bug in React. Please file an issue."
                );
              } // This can happen when we abort work.
            }

            var _rootContainerInstance2 = getRootHostContainer();

            var _currentHostContext2 = getHostContext();

            var _wasHydrated3 = popHydrationState();

            if (_wasHydrated3) {
              if (prepareToHydrateHostTextInstance()) {
                markUpdate(workInProgress);
              }
            } else {
              workInProgress.stateNode = createTextInstance(
                newText,
                _rootContainerInstance2,
                _currentHostContext2,
                workInProgress
              );
            }
          }

          bubbleProperties(workInProgress);
          return null;
        }

        case SuspenseComponent: {
          var nextState = workInProgress.memoizedState; // Special path for dehydrated boundaries. We may eventually move this
          // to its own fiber type so that we can add other kinds of hydration
          // boundaries that aren't associated with a Suspense tree. In anticipation
          // of such a refactor, all the hydration logic is contained in
          // this branch.

          if (
            current === null ||
            (current.memoizedState !== null &&
              current.memoizedState.dehydrated !== null)
          ) {
            var fallthroughToNormalSuspensePath =
              completeDehydratedSuspenseBoundary(
                current,
                workInProgress,
                nextState
              );

            if (!fallthroughToNormalSuspensePath) {
              if (workInProgress.flags & ForceClientRender) {
                popSuspenseHandler(workInProgress); // Special case. There were remaining unhydrated nodes. We treat
                // this as a mismatch. Revert to client rendering.

                return workInProgress;
              } else {
                popSuspenseHandler(workInProgress); // Did not finish hydrating, either because this is the initial
                // render or because something suspended.

                return null;
              }
            } // Continue with the normal Suspense path.
          }

          popSuspenseHandler(workInProgress);

          if ((workInProgress.flags & DidCapture) !== NoFlags$1) {
            // Something suspended. Re-render with the fallback children.
            workInProgress.lanes = renderLanes; // Do not reset the effect list.

            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              transferActualDuration(workInProgress);
            } // Don't bubble properties in this case.

            return workInProgress;
          }

          var nextDidTimeout = nextState !== null;
          var prevDidTimeout =
            current !== null && current.memoizedState !== null;
          // a passive effect, which is when we process the transitions

          if (nextDidTimeout !== prevDidTimeout) {
            // an effect to toggle the subtree's visibility. When we switch from
            // fallback -> primary, the inner Offscreen fiber schedules this effect
            // as part of its normal complete phase. But when we switch from
            // primary -> fallback, the inner Offscreen fiber does not have a complete
            // phase. So we need to schedule its effect here.
            //
            // We also use this flag to connect/disconnect the effects, but the same
            // logic applies: when re-connecting, the Offscreen fiber's complete
            // phase will handle scheduling the effect. It's only when the fallback
            // is active that we have to do anything special.

            if (nextDidTimeout) {
              var _offscreenFiber2 = workInProgress.child;
              _offscreenFiber2.flags |= Visibility;
            }
          }

          var retryQueue = workInProgress.updateQueue;
          scheduleRetryEffect(workInProgress, retryQueue);

          bubbleProperties(workInProgress);

          {
            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              if (nextDidTimeout) {
                // Don't count time spent in a timed out Suspense subtree as part of the base duration.
                var primaryChildFragment = workInProgress.child;

                if (primaryChildFragment !== null) {
                  // $FlowFixMe[unsafe-arithmetic] Flow doesn't support type casting in combination with the -= operator
                  workInProgress.treeBaseDuration -=
                    primaryChildFragment.treeBaseDuration;
                }
              }
            }
          }

          return null;
        }

        case HostPortal:
          popHostContainer(workInProgress);

          bubbleProperties(workInProgress);
          return null;

        case ContextProvider:
          // Pop provider fiber
          var context;

          {
            context = workInProgress.type._context;
          }

          popProvider(context, workInProgress);
          bubbleProperties(workInProgress);
          return null;

        case IncompleteClassComponent: {
          bubbleProperties(workInProgress);
          return null;
        }

        case SuspenseListComponent: {
          popSuspenseListContext(workInProgress);
          var renderState = workInProgress.memoizedState;

          if (renderState === null) {
            // We're running in the default, "independent" mode.
            // We don't do anything in this mode.
            bubbleProperties(workInProgress);
            return null;
          }

          var didSuspendAlready =
            (workInProgress.flags & DidCapture) !== NoFlags$1;
          var renderedTail = renderState.rendering;

          if (renderedTail === null) {
            // We just rendered the head.
            if (!didSuspendAlready) {
              // This is the first pass. We need to figure out if anything is still
              // suspended in the rendered set.
              // If new content unsuspended, but there's still some content that
              // didn't. Then we need to do a second pass that forces everything
              // to keep showing their fallbacks.
              // We might be suspended if something in this render pass suspended, or
              // something in the previous committed pass suspended. Otherwise,
              // there's no chance so we can skip the expensive call to
              // findFirstSuspended.
              var cannotBeSuspended =
                renderHasNotSuspendedYet() &&
                (current === null ||
                  (current.flags & DidCapture) === NoFlags$1);

              if (!cannotBeSuspended) {
                var row = workInProgress.child;

                while (row !== null) {
                  var suspended = findFirstSuspended(row);

                  if (suspended !== null) {
                    didSuspendAlready = true;
                    workInProgress.flags |= DidCapture;
                    cutOffTailIfNeeded(renderState, false); // If this is a newly suspended tree, it might not get committed as
                    // part of the second pass. In that case nothing will subscribe to
                    // its thenables. Instead, we'll transfer its thenables to the
                    // SuspenseList so that it can retry if they resolve.
                    // There might be multiple of these in the list but since we're
                    // going to wait for all of them anyway, it doesn't really matter
                    // which ones gets to ping. In theory we could get clever and keep
                    // track of how many dependencies remain but it gets tricky because
                    // in the meantime, we can add/remove/change items and dependencies.
                    // We might bail out of the loop before finding any but that
                    // doesn't matter since that means that the other boundaries that
                    // we did find already has their listeners attached.

                    var _retryQueue = suspended.updateQueue;
                    workInProgress.updateQueue = _retryQueue;
                    scheduleRetryEffect(workInProgress, _retryQueue); // Rerender the whole list, but this time, we'll force fallbacks
                    // to stay in place.
                    // Reset the effect flags before doing the second pass since that's now invalid.
                    // Reset the child fibers to their original state.

                    workInProgress.subtreeFlags = NoFlags$1;
                    resetChildFibers(workInProgress, renderLanes); // Set up the Suspense List Context to force suspense and
                    // immediately rerender the children.

                    pushSuspenseListContext(
                      workInProgress,
                      setShallowSuspenseListContext(
                        suspenseStackCursor.current,
                        ForceSuspenseFallback
                      )
                    ); // Don't bubble properties in this case.

                    return workInProgress.child;
                  }

                  row = row.sibling;
                }
              }

              if (
                renderState.tail !== null &&
                now$1() > getRenderTargetTime()
              ) {
                // We have already passed our CPU deadline but we still have rows
                // left in the tail. We'll just give up further attempts to render
                // the main content and only render fallbacks.
                workInProgress.flags |= DidCapture;
                didSuspendAlready = true;
                cutOffTailIfNeeded(renderState, false); // Since nothing actually suspended, there will nothing to ping this
                // to get it started back up to attempt the next item. While in terms
                // of priority this work has the same priority as this current render,
                // it's not part of the same transition once the transition has
                // committed. If it's sync, we still want to yield so that it can be
                // painted. Conceptually, this is really the same as pinging.
                // We can use any RetryLane even if it's the one currently rendering
                // since we're leaving it behind on this node.

                workInProgress.lanes = SomeRetryLane;
              }
            } else {
              cutOffTailIfNeeded(renderState, false);
            } // Next we're going to render the tail.
          } else {
            // Append the rendered row to the child list.
            if (!didSuspendAlready) {
              var _suspended = findFirstSuspended(renderedTail);

              if (_suspended !== null) {
                workInProgress.flags |= DidCapture;
                didSuspendAlready = true; // Ensure we transfer the update queue to the parent so that it doesn't
                // get lost if this row ends up dropped during a second pass.

                var _retryQueue2 = _suspended.updateQueue;
                workInProgress.updateQueue = _retryQueue2;
                scheduleRetryEffect(workInProgress, _retryQueue2);
                cutOffTailIfNeeded(renderState, true); // This might have been modified.

                if (
                  renderState.tail === null &&
                  renderState.tailMode === "hidden" &&
                  !renderedTail.alternate &&
                  !getIsHydrating() // We don't cut it if we're hydrating.
                ) {
                  // We're done.
                  bubbleProperties(workInProgress);
                  return null;
                }
              } else if (
                // The time it took to render last row is greater than the remaining
                // time we have to render. So rendering one more row would likely
                // exceed it.
                now$1() * 2 - renderState.renderingStartTime >
                  getRenderTargetTime() &&
                renderLanes !== OffscreenLane
              ) {
                // We have now passed our CPU deadline and we'll just give up further
                // attempts to render the main content and only render fallbacks.
                // The assumption is that this is usually faster.
                workInProgress.flags |= DidCapture;
                didSuspendAlready = true;
                cutOffTailIfNeeded(renderState, false); // Since nothing actually suspended, there will nothing to ping this
                // to get it started back up to attempt the next item. While in terms
                // of priority this work has the same priority as this current render,
                // it's not part of the same transition once the transition has
                // committed. If it's sync, we still want to yield so that it can be
                // painted. Conceptually, this is really the same as pinging.
                // We can use any RetryLane even if it's the one currently rendering
                // since we're leaving it behind on this node.

                workInProgress.lanes = SomeRetryLane;
              }
            }

            if (renderState.isBackwards) {
              // The effect list of the backwards tail will have been added
              // to the end. This breaks the guarantee that life-cycles fire in
              // sibling order but that isn't a strong guarantee promised by React.
              // Especially since these might also just pop in during future commits.
              // Append to the beginning of the list.
              renderedTail.sibling = workInProgress.child;
              workInProgress.child = renderedTail;
            } else {
              var previousSibling = renderState.last;

              if (previousSibling !== null) {
                previousSibling.sibling = renderedTail;
              } else {
                workInProgress.child = renderedTail;
              }

              renderState.last = renderedTail;
            }
          }

          if (renderState.tail !== null) {
            // We still have tail rows to render.
            // Pop a row.
            var next = renderState.tail;
            renderState.rendering = next;
            renderState.tail = next.sibling;
            renderState.renderingStartTime = now$1();
            next.sibling = null; // Restore the context.
            // TODO: We can probably just avoid popping it instead and only
            // setting it the first time we go from not suspended to suspended.

            var suspenseContext = suspenseStackCursor.current;

            if (didSuspendAlready) {
              suspenseContext = setShallowSuspenseListContext(
                suspenseContext,
                ForceSuspenseFallback
              );
            } else {
              suspenseContext =
                setDefaultShallowSuspenseListContext(suspenseContext);
            }

            pushSuspenseListContext(workInProgress, suspenseContext); // Do a pass over the next row.
            // Don't bubble properties in this case.

            return next;
          }

          bubbleProperties(workInProgress);
          return null;
        }

        case ScopeComponent: {
          break;
        }

        case OffscreenComponent:
        case LegacyHiddenComponent: {
          popSuspenseHandler(workInProgress);
          popHiddenContext(workInProgress);
          var _nextState = workInProgress.memoizedState;
          var nextIsHidden = _nextState !== null; // Schedule a Visibility effect if the visibility has changed

          {
            if (current !== null) {
              var _prevState = current.memoizedState;
              var prevIsHidden = _prevState !== null;

              if (prevIsHidden !== nextIsHidden) {
                workInProgress.flags |= Visibility;
              }
            } else {
              // On initial mount, we only need a Visibility effect if the tree
              // is hidden.
              if (nextIsHidden) {
                workInProgress.flags |= Visibility;
              }
            }
          }

          if (
            !nextIsHidden ||
            (workInProgress.mode & ConcurrentMode) === NoMode
          ) {
            bubbleProperties(workInProgress);
          } else {
            // Don't bubble properties for hidden children unless we're rendering
            // at offscreen priority.
            if (
              includesSomeLane(renderLanes, OffscreenLane) && // Also don't bubble if the tree suspended
              (workInProgress.flags & DidCapture) === NoLanes
            ) {
              bubbleProperties(workInProgress); // Check if there was an insertion or update in the hidden subtree.
              // If so, we need to hide those nodes in the commit phase, so
              // schedule a visibility effect.

              if (workInProgress.subtreeFlags & (Placement | Update)) {
                workInProgress.flags |= Visibility;
              }
            }
          }

          var offscreenQueue = workInProgress.updateQueue;

          if (offscreenQueue !== null) {
            var _retryQueue3 = offscreenQueue.retryQueue;
            scheduleRetryEffect(workInProgress, _retryQueue3);
          }
          return null;
        }

        case CacheComponent: {
          return null;
        }

        case TracingMarkerComponent: {
          return null;
        }
      }

      throw new Error(
        "Unknown unit of work tag (" +
          workInProgress.tag +
          "). This error is likely caused by a bug in " +
          "React. Please file an issue."
      );
    }

    function unwindWork(current, workInProgress, renderLanes) {
      switch (workInProgress.tag) {
        case ClassComponent: {
          var flags = workInProgress.flags;

          if (flags & ShouldCapture) {
            workInProgress.flags = (flags & ~ShouldCapture) | DidCapture;

            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              transferActualDuration(workInProgress);
            }

            return workInProgress;
          }

          return null;
        }

        case HostRoot: {
          popHostContainer(workInProgress);
          var _flags = workInProgress.flags;

          if (
            (_flags & ShouldCapture) !== NoFlags$1 &&
            (_flags & DidCapture) === NoFlags$1
          ) {
            // There was an error during render that wasn't captured by a suspense
            // boundary. Do a second pass on the root to unmount the children.
            workInProgress.flags = (_flags & ~ShouldCapture) | DidCapture;
            return workInProgress;
          } // We unwound to the root without completing it. Exit.

          return null;
        }

        case HostHoistable:
        case HostSingleton:
        case HostComponent: {
          // TODO: popHydrationState
          popHostContext(workInProgress);
          return null;
        }

        case SuspenseComponent: {
          popSuspenseHandler(workInProgress);
          var suspenseState = workInProgress.memoizedState;

          if (suspenseState !== null && suspenseState.dehydrated !== null) {
            if (workInProgress.alternate === null) {
              throw new Error(
                "Threw in newly mounted dehydrated component. This is likely a bug in " +
                  "React. Please file an issue."
              );
            }
          }

          var _flags2 = workInProgress.flags;

          if (_flags2 & ShouldCapture) {
            workInProgress.flags = (_flags2 & ~ShouldCapture) | DidCapture; // Captured a suspense effect. Re-render the boundary.

            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              transferActualDuration(workInProgress);
            }

            return workInProgress;
          }

          return null;
        }

        case SuspenseListComponent: {
          popSuspenseListContext(workInProgress); // SuspenseList doesn't actually catch anything. It should've been
          // caught by a nested boundary. If not, it should bubble through.

          return null;
        }

        case HostPortal:
          popHostContainer(workInProgress);
          return null;

        case ContextProvider:
          var context;

          {
            context = workInProgress.type._context;
          }

          popProvider(context, workInProgress);
          return null;

        case OffscreenComponent:
        case LegacyHiddenComponent: {
          popSuspenseHandler(workInProgress);
          popHiddenContext(workInProgress);
          var _flags3 = workInProgress.flags;

          if (_flags3 & ShouldCapture) {
            workInProgress.flags = (_flags3 & ~ShouldCapture) | DidCapture; // Captured a suspense effect. Re-render the boundary.

            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              transferActualDuration(workInProgress);
            }

            return workInProgress;
          }

          return null;
        }

        case CacheComponent:
          return null;

        case TracingMarkerComponent:
          return null;

        default:
          return null;
      }
    }

    function unwindInterruptedWork(current, interruptedWork, renderLanes) {
      switch (interruptedWork.tag) {
        case ClassComponent: {
          break;
        }

        case HostRoot: {
          popHostContainer(interruptedWork);
          break;
        }

        case HostHoistable:
        case HostSingleton:
        case HostComponent: {
          popHostContext(interruptedWork);
          break;
        }

        case HostPortal:
          popHostContainer(interruptedWork);
          break;

        case SuspenseComponent:
          popSuspenseHandler(interruptedWork);
          break;

        case SuspenseListComponent:
          popSuspenseListContext(interruptedWork);
          break;

        case ContextProvider:
          var context;

          {
            context = interruptedWork.type._context;
          }

          popProvider(context, interruptedWork);
          break;

        case OffscreenComponent:
        case LegacyHiddenComponent:
          popSuspenseHandler(interruptedWork);
          popHiddenContext(interruptedWork);
          break;
      }
    }

    var didWarnAboutUndefinedSnapshotBeforeUpdate = null;

    {
      didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
    } // Used during the commit phase to track the state of the Offscreen component stack.
    // Allows us to avoid traversing the return path to find the nearest Offscreen ancestor.

    var offscreenSubtreeIsHidden = false;
    var offscreenSubtreeWasHidden = false;
    var PossiblyWeakSet = typeof WeakSet === "function" ? WeakSet : Set;
    var nextEffect = null; // Used for Profiling builds to track updaters.

    var inProgressLanes = null;
    var inProgressRoot = null;

    function shouldProfile(current) {
      return (
        (current.mode & ProfileMode) !== NoMode &&
        (getExecutionContext() & CommitContext) !== NoContext
      );
    }

    function callComponentWillUnmountWithTimer(current, instance) {
      instance.props = current.memoizedProps;
      instance.state = current.memoizedState;

      if (shouldProfile(current)) {
        try {
          startLayoutEffectTimer();
          instance.componentWillUnmount();
        } finally {
          recordLayoutEffectDuration(current);
        }
      } else {
        instance.componentWillUnmount();
      }
    } // Capture errors so they don't interrupt unmounting.

    function safelyCallComponentWillUnmount(
      current,
      nearestMountedAncestor,
      instance
    ) {
      try {
        callComponentWillUnmountWithTimer(current, instance);
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    } // Capture errors so they don't interrupt mounting.

    function safelyAttachRef(current, nearestMountedAncestor) {
      try {
        commitAttachRef(current);
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    }

    function safelyDetachRef(current, nearestMountedAncestor) {
      var ref = current.ref;
      var refCleanup = current.refCleanup;

      if (ref !== null) {
        if (typeof refCleanup === "function") {
          try {
            if (shouldProfile(current)) {
              try {
                startLayoutEffectTimer();
                refCleanup();
              } finally {
                recordLayoutEffectDuration(current);
              }
            } else {
              refCleanup();
            }
          } catch (error) {
            captureCommitPhaseError(current, nearestMountedAncestor, error);
          } finally {
            // `refCleanup` has been called. Nullify all references to it to prevent double invocation.
            current.refCleanup = null;
            var finishedWork = current.alternate;

            if (finishedWork != null) {
              finishedWork.refCleanup = null;
            }
          }
        } else if (typeof ref === "function") {
          var retVal;

          try {
            if (shouldProfile(current)) {
              try {
                startLayoutEffectTimer();
                retVal = ref(null);
              } finally {
                recordLayoutEffectDuration(current);
              }
            } else {
              retVal = ref(null);
            }
          } catch (error) {
            captureCommitPhaseError(current, nearestMountedAncestor, error);
          }

          {
            if (typeof retVal === "function") {
              error(
                "Unexpected return value from a callback ref in %s. " +
                  "A callback ref should not return a function.",
                getComponentNameFromFiber(current)
              );
            }
          }
        } else {
          // $FlowFixMe[incompatible-use] unable to narrow type to RefObject
          ref.current = null;
        }
      }
    }

    function safelyCallDestroy(current, nearestMountedAncestor, destroy) {
      try {
        destroy();
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    }
    var shouldFireAfterActiveInstanceBlur = false;
    function commitBeforeMutationEffects(root, firstChild) {
      nextEffect = firstChild;
      commitBeforeMutationEffects_begin(); // We no longer need to track the active instance fiber

      var shouldFire = shouldFireAfterActiveInstanceBlur;
      shouldFireAfterActiveInstanceBlur = false;
      return shouldFire;
    }

    function commitBeforeMutationEffects_begin() {
      while (nextEffect !== null) {
        var fiber = nextEffect; // This phase is only used for beforeActiveInstanceBlur.

        var child = fiber.child;

        if (
          (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags$1 &&
          child !== null
        ) {
          child.return = fiber;
          nextEffect = child;
        } else {
          commitBeforeMutationEffects_complete();
        }
      }
    }

    function commitBeforeMutationEffects_complete() {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        setCurrentFiber(fiber);

        try {
          commitBeforeMutationEffectsOnFiber(fiber);
        } catch (error) {
          captureCommitPhaseError(fiber, fiber.return, error);
        }

        resetCurrentFiber();
        var sibling = fiber.sibling;

        if (sibling !== null) {
          sibling.return = fiber.return;
          nextEffect = sibling;
          return;
        }

        nextEffect = fiber.return;
      }
    }

    function commitBeforeMutationEffectsOnFiber(finishedWork) {
      var current = finishedWork.alternate;
      var flags = finishedWork.flags;

      if ((flags & Snapshot) !== NoFlags$1) {
        setCurrentFiber(finishedWork);
      }

      switch (finishedWork.tag) {
        case FunctionComponent: {
          break;
        }

        case ForwardRef:
        case SimpleMemoComponent: {
          break;
        }

        case ClassComponent: {
          if ((flags & Snapshot) !== NoFlags$1) {
            if (current !== null) {
              var prevProps = current.memoizedProps;
              var prevState = current.memoizedState;
              var instance = finishedWork.stateNode; // We could update instance props and state here,
              // but instead we rely on them being set during last render.
              // TODO: revisit this when we implement resuming.

              {
                if (
                  finishedWork.type === finishedWork.elementType &&
                  !didWarnAboutReassigningProps
                ) {
                  if (instance.props !== finishedWork.memoizedProps) {
                    error(
                      "Expected %s props to match memoized props before " +
                        "getSnapshotBeforeUpdate. " +
                        "This might either be because of a bug in React, or because " +
                        "a component reassigns its own `this.props`. " +
                        "Please file an issue.",
                      getComponentNameFromFiber(finishedWork) || "instance"
                    );
                  }

                  if (instance.state !== finishedWork.memoizedState) {
                    error(
                      "Expected %s state to match memoized state before " +
                        "getSnapshotBeforeUpdate. " +
                        "This might either be because of a bug in React, or because " +
                        "a component reassigns its own `this.state`. " +
                        "Please file an issue.",
                      getComponentNameFromFiber(finishedWork) || "instance"
                    );
                  }
                }
              }

              var snapshot = instance.getSnapshotBeforeUpdate(
                finishedWork.elementType === finishedWork.type
                  ? prevProps
                  : resolveDefaultProps(finishedWork.type, prevProps),
                prevState
              );

              {
                var didWarnSet = didWarnAboutUndefinedSnapshotBeforeUpdate;

                if (
                  snapshot === undefined &&
                  !didWarnSet.has(finishedWork.type)
                ) {
                  didWarnSet.add(finishedWork.type);

                  error(
                    "%s.getSnapshotBeforeUpdate(): A snapshot value (or null) " +
                      "must be returned. You have returned undefined.",
                    getComponentNameFromFiber(finishedWork)
                  );
                }
              }

              instance.__reactInternalSnapshotBeforeUpdate = snapshot;
            }
          }

          break;
        }

        case HostRoot: {
          break;
        }

        case HostComponent:
        case HostHoistable:
        case HostSingleton:
        case HostText:
        case HostPortal:
        case IncompleteClassComponent:
          // Nothing to do for these component types
          break;

        default: {
          if ((flags & Snapshot) !== NoFlags$1) {
            throw new Error(
              "This unit of work tag should not have side-effects. This error is " +
                "likely caused by a bug in React. Please file an issue."
            );
          }
        }
      }

      if ((flags & Snapshot) !== NoFlags$1) {
        resetCurrentFiber();
      }
    }

    function commitHookEffectListUnmount(
      flags,
      finishedWork,
      nearestMountedAncestor
    ) {
      var updateQueue = finishedWork.updateQueue;
      var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

      if (lastEffect !== null) {
        var firstEffect = lastEffect.next;
        var effect = firstEffect;

        do {
          if ((effect.tag & flags) === flags) {
            // Unmount
            var inst = effect.inst;
            var destroy = inst.destroy;

            if (destroy !== undefined) {
              inst.destroy = undefined;

              {
                if ((flags & Insertion) !== NoFlags) {
                  setIsRunningInsertionEffect(true);
                }
              }

              safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);

              {
                if ((flags & Insertion) !== NoFlags) {
                  setIsRunningInsertionEffect(false);
                }
              }
            }
          }

          effect = effect.next;
        } while (effect !== firstEffect);
      }
    }

    function commitHookEffectListMount(flags, finishedWork) {
      var updateQueue = finishedWork.updateQueue;
      var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

      if (lastEffect !== null) {
        var firstEffect = lastEffect.next;
        var effect = firstEffect;

        do {
          if ((effect.tag & flags) === flags) {
            var create = effect.create;

            {
              if ((flags & Insertion) !== NoFlags) {
                setIsRunningInsertionEffect(true);
              }
            }

            var inst = effect.inst;
            var destroy = create();
            inst.destroy = destroy;

            {
              if ((flags & Insertion) !== NoFlags) {
                setIsRunningInsertionEffect(false);
              }
            }

            {
              if (destroy !== undefined && typeof destroy !== "function") {
                var hookName = void 0;

                if ((effect.tag & Layout) !== NoFlags$1) {
                  hookName = "useLayoutEffect";
                } else if ((effect.tag & Insertion) !== NoFlags$1) {
                  hookName = "useInsertionEffect";
                } else {
                  hookName = "useEffect";
                }

                var addendum = void 0;

                if (destroy === null) {
                  addendum =
                    " You returned null. If your effect does not require clean " +
                    "up, return undefined (or nothing).";
                } else if (typeof destroy.then === "function") {
                  addendum =
                    "\n\nIt looks like you wrote " +
                    hookName +
                    "(async () => ...) or returned a Promise. " +
                    "Instead, write the async function inside your effect " +
                    "and call it immediately:\n\n" +
                    hookName +
                    "(() => {\n" +
                    "  async function fetchData() {\n" +
                    "    // You can await here\n" +
                    "    const response = await MyAPI.getData(someId);\n" +
                    "    // ...\n" +
                    "  }\n" +
                    "  fetchData();\n" +
                    "}, [someId]); // Or [] if effect doesn't need props or state\n\n" +
                    "Learn more about data fetching with Hooks: https://react.dev/link/hooks-data-fetching";
                } else {
                  addendum = " You returned: " + destroy;
                }

                error(
                  "%s must not return anything besides a function, " +
                    "which is used for clean-up.%s",
                  hookName,
                  addendum
                );
              }
            }
          }

          effect = effect.next;
        } while (effect !== firstEffect);
      }
    }

    function commitPassiveEffectDurations(finishedRoot, finishedWork) {
      if (getExecutionContext() & CommitContext) {
        // Only Profilers with work in their subtree will have an Update effect scheduled.
        if ((finishedWork.flags & Update) !== NoFlags$1) {
          switch (finishedWork.tag) {
            case Profiler: {
              var passiveEffectDuration =
                finishedWork.stateNode.passiveEffectDuration;
              var _finishedWork$memoize = finishedWork.memoizedProps,
                id = _finishedWork$memoize.id,
                onPostCommit = _finishedWork$memoize.onPostCommit; // This value will still reflect the previous commit phase.
              // It does not get reset until the start of the next commit phase.

              var commitTime = getCommitTime();
              var phase = finishedWork.alternate === null ? "mount" : "update";

              {
                if (isCurrentUpdateNested()) {
                  phase = "nested-update";
                }
              }

              if (typeof onPostCommit === "function") {
                onPostCommit(id, phase, passiveEffectDuration, commitTime);
              } // Bubble times to the next nearest ancestor Profiler.
              // After we process that Profiler, we'll bubble further up.

              var parentFiber = finishedWork.return;

              outer: while (parentFiber !== null) {
                switch (parentFiber.tag) {
                  case HostRoot:
                    var root = parentFiber.stateNode;
                    root.passiveEffectDuration += passiveEffectDuration;
                    break outer;

                  case Profiler:
                    var parentStateNode = parentFiber.stateNode;
                    parentStateNode.passiveEffectDuration +=
                      passiveEffectDuration;
                    break outer;
                }

                parentFiber = parentFiber.return;
              }

              break;
            }
          }
        }
      }
    }

    function commitHookLayoutEffects(finishedWork, hookFlags) {
      // At this point layout effects have already been destroyed (during mutation phase).
      // This is done to prevent sibling component effects from interfering with each other,
      // e.g. a destroy function in one component should never override a ref set
      // by a create function in another component during the same commit.
      if (shouldProfile(finishedWork)) {
        try {
          startLayoutEffectTimer();
          commitHookEffectListMount(hookFlags, finishedWork);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }

        recordLayoutEffectDuration(finishedWork);
      } else {
        try {
          commitHookEffectListMount(hookFlags, finishedWork);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }

    function commitClassLayoutLifecycles(finishedWork, current) {
      var instance = finishedWork.stateNode;

      if (current === null) {
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        {
          if (
            finishedWork.type === finishedWork.elementType &&
            !didWarnAboutReassigningProps
          ) {
            if (instance.props !== finishedWork.memoizedProps) {
              error(
                "Expected %s props to match memoized props before " +
                  "componentDidMount. " +
                  "This might either be because of a bug in React, or because " +
                  "a component reassigns its own `this.props`. " +
                  "Please file an issue.",
                getComponentNameFromFiber(finishedWork) || "instance"
              );
            }

            if (instance.state !== finishedWork.memoizedState) {
              error(
                "Expected %s state to match memoized state before " +
                  "componentDidMount. " +
                  "This might either be because of a bug in React, or because " +
                  "a component reassigns its own `this.state`. " +
                  "Please file an issue.",
                getComponentNameFromFiber(finishedWork) || "instance"
              );
            }
          }
        }

        if (shouldProfile(finishedWork)) {
          try {
            startLayoutEffectTimer();
            instance.componentDidMount();
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }

          recordLayoutEffectDuration(finishedWork);
        } else {
          try {
            instance.componentDidMount();
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      } else {
        var prevProps =
          finishedWork.elementType === finishedWork.type
            ? current.memoizedProps
            : resolveDefaultProps(finishedWork.type, current.memoizedProps);
        var prevState = current.memoizedState; // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.

        {
          if (
            finishedWork.type === finishedWork.elementType &&
            !didWarnAboutReassigningProps
          ) {
            if (instance.props !== finishedWork.memoizedProps) {
              error(
                "Expected %s props to match memoized props before " +
                  "componentDidUpdate. " +
                  "This might either be because of a bug in React, or because " +
                  "a component reassigns its own `this.props`. " +
                  "Please file an issue.",
                getComponentNameFromFiber(finishedWork) || "instance"
              );
            }

            if (instance.state !== finishedWork.memoizedState) {
              error(
                "Expected %s state to match memoized state before " +
                  "componentDidUpdate. " +
                  "This might either be because of a bug in React, or because " +
                  "a component reassigns its own `this.state`. " +
                  "Please file an issue.",
                getComponentNameFromFiber(finishedWork) || "instance"
              );
            }
          }
        }

        if (shouldProfile(finishedWork)) {
          try {
            startLayoutEffectTimer();
            instance.componentDidUpdate(
              prevProps,
              prevState,
              instance.__reactInternalSnapshotBeforeUpdate
            );
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }

          recordLayoutEffectDuration(finishedWork);
        } else {
          try {
            instance.componentDidUpdate(
              prevProps,
              prevState,
              instance.__reactInternalSnapshotBeforeUpdate
            );
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
    }

    function commitClassCallbacks(finishedWork) {
      // TODO: I think this is now always non-null by the time it reaches the
      // commit phase. Consider removing the type check.
      var updateQueue = finishedWork.updateQueue;

      if (updateQueue !== null) {
        var instance = finishedWork.stateNode;

        {
          if (
            finishedWork.type === finishedWork.elementType &&
            !didWarnAboutReassigningProps
          ) {
            if (instance.props !== finishedWork.memoizedProps) {
              error(
                "Expected %s props to match memoized props before " +
                  "processing the update queue. " +
                  "This might either be because of a bug in React, or because " +
                  "a component reassigns its own `this.props`. " +
                  "Please file an issue.",
                getComponentNameFromFiber(finishedWork) || "instance"
              );
            }

            if (instance.state !== finishedWork.memoizedState) {
              error(
                "Expected %s state to match memoized state before " +
                  "processing the update queue. " +
                  "This might either be because of a bug in React, or because " +
                  "a component reassigns its own `this.state`. " +
                  "Please file an issue.",
                getComponentNameFromFiber(finishedWork) || "instance"
              );
            }
          }
        } // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.

        try {
          commitCallbacks(updateQueue, instance);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }

    function commitHostComponentMount(finishedWork) {
      var type = finishedWork.type;
      var props = finishedWork.memoizedProps;
      var instance = finishedWork.stateNode;

      try {
        commitMount(instance, type, props, finishedWork);
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }

    function commitProfilerUpdate(finishedWork, current) {
      if (getExecutionContext() & CommitContext) {
        try {
          var _finishedWork$memoize2 = finishedWork.memoizedProps,
            onCommit = _finishedWork$memoize2.onCommit,
            onRender = _finishedWork$memoize2.onRender;
          var effectDuration = finishedWork.stateNode.effectDuration;
          var commitTime = getCommitTime();
          var phase = current === null ? "mount" : "update";

          if (enableProfilerNestedUpdatePhase) {
            if (isCurrentUpdateNested()) {
              phase = "nested-update";
            }
          }

          if (typeof onRender === "function") {
            onRender(
              finishedWork.memoizedProps.id,
              phase,
              finishedWork.actualDuration,
              finishedWork.treeBaseDuration,
              finishedWork.actualStartTime,
              commitTime
            );
          }

          if (enableProfilerCommitHooks) {
            if (typeof onCommit === "function") {
              onCommit(
                finishedWork.memoizedProps.id,
                phase,
                effectDuration,
                commitTime
              );
            } // Schedule a passive effect for this Profiler to call onPostCommit hooks.
            // This effect should be scheduled even if there is no onPostCommit callback for this Profiler,
            // because the effect is also where times bubble to parent Profilers.

            enqueuePendingPassiveProfilerEffect(finishedWork); // Propagate layout effect durations to the next nearest Profiler ancestor.
            // Do not reset these values until the next render so DevTools has a chance to read them first.

            var parentFiber = finishedWork.return;

            outer: while (parentFiber !== null) {
              switch (parentFiber.tag) {
                case HostRoot:
                  var root = parentFiber.stateNode;
                  root.effectDuration += effectDuration;
                  break outer;

                case Profiler:
                  var parentStateNode = parentFiber.stateNode;
                  parentStateNode.effectDuration += effectDuration;
                  break outer;
              }

              parentFiber = parentFiber.return;
            }
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }

    function commitLayoutEffectOnFiber(
      finishedRoot,
      current,
      finishedWork,
      committedLanes
    ) {
      // When updating this function, also update reappearLayoutEffects, which does
      // most of the same things when an offscreen tree goes from hidden -> visible.
      var flags = finishedWork.flags;

      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);

          if (flags & Update) {
            commitHookLayoutEffects(finishedWork, Layout | HasEffect);
          }

          break;
        }

        case ClassComponent: {
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);

          if (flags & Update) {
            commitClassLayoutLifecycles(finishedWork, current);
          }

          if (flags & Callback) {
            commitClassCallbacks(finishedWork);
          }

          if (flags & Ref) {
            safelyAttachRef(finishedWork, finishedWork.return);
          }

          break;
        }

        case HostRoot: {
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);

          if (flags & Callback) {
            // TODO: I think this is now always non-null by the time it reaches the
            // commit phase. Consider removing the type check.
            var updateQueue = finishedWork.updateQueue;

            if (updateQueue !== null) {
              var instance = null;

              if (finishedWork.child !== null) {
                switch (finishedWork.child.tag) {
                  case HostSingleton:
                  case HostComponent:
                    instance = getPublicInstance(finishedWork.child.stateNode);
                    break;

                  case ClassComponent:
                    instance = finishedWork.child.stateNode;
                    break;
                }
              }

              try {
                commitCallbacks(updateQueue, instance);
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          }

          break;
        }

        case HostHoistable:

        case HostSingleton:
        case HostComponent: {
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork); // Renderers may schedule work to be done after host components are mounted
          // (eg DOM renderer may schedule auto-focus for inputs and form controls).
          // These effects should only be committed when components are first mounted,
          // aka when there is no current/alternate.

          if (current === null && flags & Update) {
            commitHostComponentMount(finishedWork);
          }

          if (flags & Ref) {
            safelyAttachRef(finishedWork, finishedWork.return);
          }

          break;
        }

        case Profiler: {
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork); // TODO: Should this fire inside an offscreen tree? Or should it wait to
          // fire when the tree becomes visible again.

          if (flags & Update) {
            commitProfilerUpdate(finishedWork, current);
          }

          break;
        }

        case SuspenseComponent: {
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);

          break;
        }

        case OffscreenComponent: {
          var isModernRoot = (finishedWork.mode & ConcurrentMode) !== NoMode;

          if (isModernRoot) {
            var isHidden = finishedWork.memoizedState !== null;
            var newOffscreenSubtreeIsHidden =
              isHidden || offscreenSubtreeIsHidden;

            if (newOffscreenSubtreeIsHidden);
            else {
              // The Offscreen tree is visible.
              var wasHidden =
                current !== null && current.memoizedState !== null;
              var newOffscreenSubtreeWasHidden =
                wasHidden || offscreenSubtreeWasHidden;
              var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
              var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
              offscreenSubtreeIsHidden = newOffscreenSubtreeIsHidden;
              offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden;

              if (offscreenSubtreeWasHidden && !prevOffscreenSubtreeWasHidden) {
                // This is the root of a reappearing boundary. As we continue
                // traversing the layout effects, we must also re-mount layout
                // effects that were unmounted when the Offscreen subtree was
                // hidden. So this is a superset of the normal commitLayoutEffects.
                var includeWorkInProgressEffects =
                  (finishedWork.subtreeFlags & LayoutMask) !== NoFlags$1;
                recursivelyTraverseReappearLayoutEffects(
                  finishedRoot,
                  finishedWork,
                  includeWorkInProgressEffects
                );
              } else {
                recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              }

              offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
              offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            }
          } else {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          }

          if (flags & Ref) {
            var props = finishedWork.memoizedProps;

            if (props.mode === "manual") {
              safelyAttachRef(finishedWork, finishedWork.return);
            } else {
              safelyDetachRef(finishedWork, finishedWork.return);
            }
          }

          break;
        }

        default: {
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          break;
        }
      }
    }

    function hideOrUnhideAllChildren(finishedWork, isHidden) {
      // Only hide or unhide the top-most host nodes.
      var hostSubtreeRoot = null;

      {
        // We only have the top Fiber that was inserted but we need to recurse down its
        // children to find all the terminal nodes.
        var node = finishedWork;

        while (true) {
          if (node.tag === HostComponent || false || false) {
            if (hostSubtreeRoot === null) {
              hostSubtreeRoot = node;

              try {
                var instance = node.stateNode;

                if (isHidden) {
                  hideInstance(instance);
                } else {
                  unhideInstance(node.stateNode, node.memoizedProps);
                }
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          } else if (node.tag === HostText) {
            if (hostSubtreeRoot === null) {
              try {
                var _instance = node.stateNode;

                if (isHidden) {
                  hideTextInstance(_instance);
                } else {
                  unhideTextInstance(_instance, node.memoizedProps);
                }
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          } else if (
            (node.tag === OffscreenComponent ||
              node.tag === LegacyHiddenComponent) &&
            node.memoizedState !== null &&
            node !== finishedWork
          );
          else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
          }

          if (node === finishedWork) {
            return;
          }

          while (node.sibling === null) {
            if (node.return === null || node.return === finishedWork) {
              return;
            }

            if (hostSubtreeRoot === node) {
              hostSubtreeRoot = null;
            }

            node = node.return;
          }

          if (hostSubtreeRoot === node) {
            hostSubtreeRoot = null;
          }

          node.sibling.return = node.return;
          node = node.sibling;
        }
      }
    }

    function commitAttachRef(finishedWork) {
      var ref = finishedWork.ref;

      if (ref !== null) {
        var instance = finishedWork.stateNode;
        var instanceToUse;

        switch (finishedWork.tag) {
          case HostHoistable:
          case HostSingleton:
          case HostComponent:
            instanceToUse = getPublicInstance(instance);
            break;

          default:
            instanceToUse = instance;
        } // Moved outside to ensure DCE works with this flag

        if (typeof ref === "function") {
          if (shouldProfile(finishedWork)) {
            try {
              startLayoutEffectTimer();
              finishedWork.refCleanup = ref(instanceToUse);
            } finally {
              recordLayoutEffectDuration(finishedWork);
            }
          } else {
            finishedWork.refCleanup = ref(instanceToUse);
          }
        } else {
          {
            // TODO: We should move these warnings to happen during the render
            // phase (markRef).
            if (!ref.hasOwnProperty("current")) {
              error(
                "Unexpected ref object provided for %s. " +
                  "Use either a ref-setter function or React.createRef().",
                getComponentNameFromFiber(finishedWork)
              );
            }
          } // $FlowFixMe[incompatible-use] unable to narrow type to the non-function case

          ref.current = instanceToUse;
        }
      }
    }

    function detachFiberMutation(fiber) {
      // Cut off the return pointer to disconnect it from the tree.
      // This enables us to detect and warn against state updates on an unmounted component.
      // It also prevents events from bubbling from within disconnected components.
      //
      // Ideally, we should also clear the child pointer of the parent alternate to let this
      // get GC:ed but we don't know which for sure which parent is the current
      // one so we'll settle for GC:ing the subtree of this child.
      // This child itself will be GC:ed when the parent updates the next time.
      //
      // Note that we can't clear child or sibling pointers yet.
      // They're needed for passive effects and for findDOMNode.
      // We defer those fields, and all other cleanup, to the passive phase (see detachFiberAfterEffects).
      //
      // Don't reset the alternate yet, either. We need that so we can detach the
      // alternate's fields in the passive phase. Clearing the return pointer is
      // sufficient for findDOMNode semantics.
      var alternate = fiber.alternate;

      if (alternate !== null) {
        alternate.return = null;
      }

      fiber.return = null;
    }

    function detachFiberAfterEffects(fiber) {
      var alternate = fiber.alternate;

      if (alternate !== null) {
        fiber.alternate = null;
        detachFiberAfterEffects(alternate);
      } // Clear cyclical Fiber fields. This level alone is designed to roughly
      // approximate the planned Fiber refactor. In that world, `setState` will be
      // bound to a special "instance" object instead of a Fiber. The Instance
      // object will not have any of these fields. It will only be connected to
      // the fiber tree via a single link at the root. So if this level alone is
      // sufficient to fix memory issues, that bodes well for our plans.

      fiber.child = null;
      fiber.deletions = null;
      fiber.sibling = null; // The `stateNode` is cyclical because on host nodes it points to the host

      fiber.stateNode = null;

      {
        fiber._debugOwner = null;
      } // Theoretically, nothing in here should be necessary, because we already
      // disconnected the fiber from the tree. So even if something leaks this
      // particular fiber, it won't leak anything else.

      fiber.return = null;
      fiber.dependencies = null;
      fiber.memoizedProps = null;
      fiber.memoizedState = null;
      fiber.pendingProps = null;
      fiber.stateNode = null; // TODO: Move to `commitPassiveUnmountInsideDeletedTreeOnFiber` instead.

      fiber.updateQueue = null;
    }

    function getHostParentFiber(fiber) {
      var parent = fiber.return;

      while (parent !== null) {
        if (isHostParent(parent)) {
          return parent;
        }

        parent = parent.return;
      }

      throw new Error(
        "Expected to find a host parent. This error is likely caused by a bug " +
          "in React. Please file an issue."
      );
    }

    function isHostParent(fiber) {
      return (
        fiber.tag === HostComponent ||
        fiber.tag === HostRoot ||
        false ||
        false ||
        fiber.tag === HostPortal
      );
    }

    function getHostSibling(fiber) {
      // We're going to search forward into the tree until we find a sibling host
      // node. Unfortunately, if multiple insertions are done in a row we have to
      // search past them. This leads to exponential search for the next sibling.
      // TODO: Find a more efficient way to do this.
      var node = fiber;

      siblings: while (true) {
        // If we didn't find anything, let's try the next sibling.
        while (node.sibling === null) {
          if (node.return === null || isHostParent(node.return)) {
            // If we pop out of the root or hit the parent the fiber we are the
            // last sibling.
            return null;
          } // $FlowFixMe[incompatible-type] found when upgrading Flow

          node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;

        while (
          node.tag !== HostComponent &&
          node.tag !== HostText &&
          true &&
          node.tag !== DehydratedFragment
        ) {
          // If it is not host node and, we might have a host node inside it.
          // Try to search down until we find one.
          if (node.flags & Placement) {
            // If we don't have a child, try the siblings instead.
            continue siblings;
          } // If we don't have a child, try the siblings instead.
          // We also skip portals because they are not part of this host tree.

          if (node.child === null || node.tag === HostPortal) {
            continue siblings;
          } else {
            node.child.return = node;
            node = node.child;
          }
        } // Check if this host node is stable or about to be placed.

        if (!(node.flags & Placement)) {
          // Found it!
          return node.stateNode;
        }
      }
    }

    function commitPlacement(finishedWork) {
      var parentFiber = getHostParentFiber(finishedWork);

      switch (parentFiber.tag) {
        case HostSingleton:

        case HostComponent: {
          var _parent = parentFiber.stateNode;

          if (parentFiber.flags & ContentReset) {
            parentFiber.flags &= ~ContentReset;
          }

          var _before = getHostSibling(finishedWork); // We only have the top Fiber that was inserted but we need to recurse down its
          // children to find all the terminal nodes.

          insertOrAppendPlacementNode(finishedWork, _before, _parent);
          break;
        }

        case HostRoot:
        case HostPortal: {
          var _parent2 = parentFiber.stateNode.containerInfo;

          var _before2 = getHostSibling(finishedWork);

          insertOrAppendPlacementNodeIntoContainer(
            finishedWork,
            _before2,
            _parent2
          );
          break;
        }

        default:
          throw new Error(
            "Invalid host parent fiber. This error is likely caused by a bug " +
              "in React. Please file an issue."
          );
      }
    }

    function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
      var tag = node.tag;
      var isHost = tag === HostComponent || tag === HostText;

      if (isHost) {
        var stateNode = node.stateNode;

        if (before) {
          insertInContainerBefore(parent);
        } else {
          appendChildToContainer(parent, stateNode);
        }
      } else if (tag === HostPortal || false);
      else {
        var child = node.child;

        if (child !== null) {
          insertOrAppendPlacementNodeIntoContainer(child, before, parent);
          var sibling = child.sibling;

          while (sibling !== null) {
            insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
            sibling = sibling.sibling;
          }
        }
      }
    }

    function insertOrAppendPlacementNode(node, before, parent) {
      var tag = node.tag;
      var isHost = tag === HostComponent || tag === HostText;

      if (isHost) {
        var stateNode = node.stateNode;

        if (before) {
          insertBefore(parent, stateNode, before);
        } else {
          appendChild(parent, stateNode);
        }
      } else if (tag === HostPortal || false);
      else {
        var child = node.child;

        if (child !== null) {
          insertOrAppendPlacementNode(child, before, parent);
          var sibling = child.sibling;

          while (sibling !== null) {
            insertOrAppendPlacementNode(sibling, before, parent);
            sibling = sibling.sibling;
          }
        }
      }
    } // These are tracked on the stack as we recursively traverse a
    // deleted subtree.
    // TODO: Update these during the whole mutation phase, not just during
    // a deletion.

    var hostParent = null;
    var hostParentIsContainer = false;

    function commitDeletionEffects(root, returnFiber, deletedFiber) {
      {
        // We only have the top Fiber that was deleted but we need to recurse down its
        // children to find all the terminal nodes.
        // Recursively delete all host nodes from the parent, detach refs, clean
        // up mounted layout effects, and call componentWillUnmount.
        // We only need to remove the topmost host child in each branch. But then we
        // still need to keep traversing to unmount effects, refs, and cWU. TODO: We
        // could split this into two separate traversals functions, where the second
        // one doesn't include any removeChild logic. This is maybe the same
        // function as "disappearLayoutEffects" (or whatever that turns into after
        // the layout phase is refactored to use recursion).
        // Before starting, find the nearest host parent on the stack so we know
        // which instance/container to remove the children from.
        // TODO: Instead of searching up the fiber return path on every deletion, we
        // can track the nearest host component on the JS stack as we traverse the
        // tree during the commit phase. This would make insertions faster, too.
        var parent = returnFiber;

        findParent: while (parent !== null) {
          switch (parent.tag) {
            case HostSingleton:
            case HostComponent: {
              hostParent = parent.stateNode;
              hostParentIsContainer = false;
              break findParent;
            }

            case HostRoot: {
              hostParent = parent.stateNode.containerInfo;
              hostParentIsContainer = true;
              break findParent;
            }

            case HostPortal: {
              hostParent = parent.stateNode.containerInfo;
              hostParentIsContainer = true;
              break findParent;
            }
          }

          parent = parent.return;
        }

        if (hostParent === null) {
          throw new Error(
            "Expected to find a host parent. This error is likely caused by " +
              "a bug in React. Please file an issue."
          );
        }

        commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
        hostParent = null;
        hostParentIsContainer = false;
      }

      detachFiberMutation(deletedFiber);
    }

    function recursivelyTraverseDeletionEffects(
      finishedRoot,
      nearestMountedAncestor,
      parent
    ) {
      // TODO: Use a static flag to skip trees that don't have unmount effects
      var child = parent.child;

      while (child !== null) {
        commitDeletionEffectsOnFiber(
          finishedRoot,
          nearestMountedAncestor,
          child
        );
        child = child.sibling;
      }
    }

    function commitDeletionEffectsOnFiber(
      finishedRoot,
      nearestMountedAncestor,
      deletedFiber
    ) {
      onCommitUnmount(deletedFiber); // The cases in this outer switch modify the stack before they traverse
      // into their subtree. There are simpler cases in the inner switch
      // that don't modify the stack.

      switch (deletedFiber.tag) {
        case HostHoistable:

        case HostSingleton:

        case HostComponent: {
          if (!offscreenSubtreeWasHidden) {
            safelyDetachRef(deletedFiber, nearestMountedAncestor);
          } // Intentional fallthrough to next branch
        }

        case HostText: {
          // We only need to remove the nearest host child. Set the host parent
          // to `null` on the stack to indicate that nested children don't
          // need to be removed.
          {
            var _prevHostParent = hostParent;
            var _prevHostParentIsContainer = hostParentIsContainer;
            hostParent = null;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            hostParent = _prevHostParent;
            hostParentIsContainer = _prevHostParentIsContainer;

            if (hostParent !== null) {
              // Now that all the child effects have unmounted, we can remove the
              // node from the tree.
              if (hostParentIsContainer) {
                removeChildFromContainer(hostParent, deletedFiber.stateNode);
              } else {
                removeChild(hostParent, deletedFiber.stateNode);
              }
            }
          }

          return;
        }

        case DehydratedFragment: {
          // Delete the dehydrated suspense boundary and all of its content.

          {
            if (hostParent !== null) {
              if (hostParentIsContainer) {
                clearSuspenseBoundaryFromContainer();
              } else {
                clearSuspenseBoundary();
              }
            }
          }

          return;
        }

        case HostPortal: {
          {
            // When we go into a portal, it becomes the parent to remove from.
            var _prevHostParent2 = hostParent;
            var _prevHostParentIsContainer2 = hostParentIsContainer;
            hostParent = deletedFiber.stateNode.containerInfo;
            hostParentIsContainer = true;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            hostParent = _prevHostParent2;
            hostParentIsContainer = _prevHostParentIsContainer2;
          }

          return;
        }

        case FunctionComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent: {
          if (!offscreenSubtreeWasHidden) {
            var updateQueue = deletedFiber.updateQueue;

            if (updateQueue !== null) {
              var lastEffect = updateQueue.lastEffect;

              if (lastEffect !== null) {
                var firstEffect = lastEffect.next;
                var effect = firstEffect;

                do {
                  var tag = effect.tag;
                  var inst = effect.inst;
                  var destroy = inst.destroy;

                  if (destroy !== undefined) {
                    if ((tag & Insertion) !== NoFlags) {
                      inst.destroy = undefined;
                      safelyCallDestroy(
                        deletedFiber,
                        nearestMountedAncestor,
                        destroy
                      );
                    } else if ((tag & Layout) !== NoFlags) {
                      if (shouldProfile(deletedFiber)) {
                        startLayoutEffectTimer();
                        inst.destroy = undefined;
                        safelyCallDestroy(
                          deletedFiber,
                          nearestMountedAncestor,
                          destroy
                        );
                        recordLayoutEffectDuration(deletedFiber);
                      } else {
                        inst.destroy = undefined;
                        safelyCallDestroy(
                          deletedFiber,
                          nearestMountedAncestor,
                          destroy
                        );
                      }
                    }
                  }

                  effect = effect.next;
                } while (effect !== firstEffect);
              }
            }
          }

          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
          return;
        }

        case ClassComponent: {
          if (!offscreenSubtreeWasHidden) {
            safelyDetachRef(deletedFiber, nearestMountedAncestor);
            var instance = deletedFiber.stateNode;

            if (typeof instance.componentWillUnmount === "function") {
              safelyCallComponentWillUnmount(
                deletedFiber,
                nearestMountedAncestor,
                instance
              );
            }
          }

          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
          return;
        }

        case ScopeComponent: {
          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
          return;
        }

        case OffscreenComponent: {
          safelyDetachRef(deletedFiber, nearestMountedAncestor);

          if (deletedFiber.mode & ConcurrentMode) {
            // If this offscreen component is hidden, we already unmounted it. Before
            // deleting the children, track that it's already unmounted so that we
            // don't attempt to unmount the effects again.
            // TODO: If the tree is hidden, in most cases we should be able to skip
            // over the nested children entirely. An exception is we haven't yet found
            // the topmost host node to delete, which we already track on the stack.
            // But the other case is portals, which need to be detached no matter how
            // deeply they are nested. We should use a subtree flag to track whether a
            // subtree includes a nested portal.
            var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
            offscreenSubtreeWasHidden =
              prevOffscreenSubtreeWasHidden ||
              deletedFiber.memoizedState !== null;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
          } else {
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
          }

          break;
        }

        default: {
          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
          return;
        }
      }
    }

    function commitSuspenseCallback(finishedWork) {}

    function getRetryCache(finishedWork) {
      // TODO: Unify the interface for the retry cache so we don't have to switch
      // on the tag like this.
      switch (finishedWork.tag) {
        case SuspenseComponent:
        case SuspenseListComponent: {
          var retryCache = finishedWork.stateNode;

          if (retryCache === null) {
            retryCache = finishedWork.stateNode = new PossiblyWeakSet();
          }

          return retryCache;
        }

        case OffscreenComponent: {
          var instance = finishedWork.stateNode;
          var _retryCache = instance._retryCache;

          if (_retryCache === null) {
            _retryCache = instance._retryCache = new PossiblyWeakSet();
          }

          return _retryCache;
        }

        default: {
          throw new Error(
            "Unexpected Suspense handler tag (" +
              finishedWork.tag +
              "). This is a " +
              "bug in React."
          );
        }
      }
    }

    function detachOffscreenInstance(instance) {
      var fiber = instance._current;

      if (fiber === null) {
        throw new Error(
          "Calling Offscreen.detach before instance handle has been set."
        );
      }

      if ((instance._pendingVisibility & OffscreenDetached) !== NoFlags$1) {
        // The instance is already detached, this is a noop.
        return;
      } // TODO: There is an opportunity to optimise this by not entering commit phase
      // and unmounting effects directly.

      var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

      if (root !== null) {
        instance._pendingVisibility |= OffscreenDetached;
        scheduleUpdateOnFiber(root, fiber, SyncLane);
      }
    }
    function attachOffscreenInstance(instance) {
      var fiber = instance._current;

      if (fiber === null) {
        throw new Error(
          "Calling Offscreen.detach before instance handle has been set."
        );
      }

      if ((instance._pendingVisibility & OffscreenDetached) === NoFlags$1) {
        // The instance is already attached, this is a noop.
        return;
      }

      var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

      if (root !== null) {
        instance._pendingVisibility &= ~OffscreenDetached;
        scheduleUpdateOnFiber(root, fiber, SyncLane);
      }
    }

    function attachSuspenseRetryListeners(finishedWork, wakeables) {
      // If this boundary just timed out, then it will have a set of wakeables.
      // For each wakeable, attach a listener so that when it resolves, React
      // attempts to re-render the boundary in the primary (pre-timeout) state.
      var retryCache = getRetryCache(finishedWork);
      wakeables.forEach(function (wakeable) {
        // Memoize using the boundary fiber to prevent redundant listeners.
        var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);

        if (!retryCache.has(wakeable)) {
          retryCache.add(wakeable);

          {
            if (isDevToolsPresent) {
              if (inProgressLanes !== null && inProgressRoot !== null) {
                // If we have pending work still, associate the original updaters with it.
                restorePendingUpdaters(inProgressRoot, inProgressLanes);
              } else {
                throw Error(
                  "Expected finished root and lanes to be set. This is a bug in React."
                );
              }
            }
          }

          wakeable.then(retry, retry);
        }
      });
    } // This function detects when a Suspense boundary goes from visible to hidden.
    function commitMutationEffects(root, finishedWork, committedLanes) {
      inProgressLanes = committedLanes;
      inProgressRoot = root;
      setCurrentFiber(finishedWork);
      commitMutationEffectsOnFiber(finishedWork, root);
      setCurrentFiber(finishedWork);
      inProgressLanes = null;
      inProgressRoot = null;
    }

    function recursivelyTraverseMutationEffects(root, parentFiber, lanes) {
      // Deletions effects can be scheduled on any fiber type. They need to happen
      // before the children effects hae fired.
      var deletions = parentFiber.deletions;

      if (deletions !== null) {
        for (var i = 0; i < deletions.length; i++) {
          var childToDelete = deletions[i];

          try {
            commitDeletionEffects(root, parentFiber, childToDelete);
          } catch (error) {
            captureCommitPhaseError(childToDelete, parentFiber, error);
          }
        }
      }

      var prevDebugFiber = getCurrentFiber();

      if (parentFiber.subtreeFlags & MutationMask) {
        var child = parentFiber.child;

        while (child !== null) {
          setCurrentFiber(child);
          commitMutationEffectsOnFiber(child, root);
          child = child.sibling;
        }
      }

      setCurrentFiber(prevDebugFiber);
    }

    function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
      var current = finishedWork.alternate;
      var flags = finishedWork.flags; // The effect flag should be checked *after* we refine the type of fiber,
      // because the fiber tag is more specific. An exception is any flag related
      // to reconciliation, because those can be set on all fiber types.

      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent: {
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);

          if (flags & Update) {
            try {
              commitHookEffectListUnmount(
                Insertion | HasEffect,
                finishedWork,
                finishedWork.return
              );
              commitHookEffectListMount(Insertion | HasEffect, finishedWork);
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            } // Layout effects are destroyed during the mutation phase so that all
            // destroy functions for all fibers are called before any create functions.
            // This prevents sibling component effects from interfering with each other,
            // e.g. a destroy function in one component should never override a ref set
            // by a create function in another component during the same commit.

            if (shouldProfile(finishedWork)) {
              try {
                startLayoutEffectTimer();
                commitHookEffectListUnmount(
                  Layout | HasEffect,
                  finishedWork,
                  finishedWork.return
                );
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }

              recordLayoutEffectDuration(finishedWork);
            } else {
              try {
                commitHookEffectListUnmount(
                  Layout | HasEffect,
                  finishedWork,
                  finishedWork.return
                );
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          }

          return;
        }

        case ClassComponent: {
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);

          if (flags & Ref) {
            if (current !== null) {
              safelyDetachRef(current, current.return);
            }
          }

          if (flags & Callback && offscreenSubtreeIsHidden) {
            var updateQueue = finishedWork.updateQueue;

            if (updateQueue !== null) {
              deferHiddenCallbacks(updateQueue);
            }
          }

          return;
        }

        case HostHoistable:

        case HostSingleton:

        case HostComponent: {
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);

          if (flags & Ref) {
            if (current !== null) {
              safelyDetachRef(current, current.return);
            }
          }

          {
            // TODO: ContentReset gets cleared by the children during the commit
            // phase. This is a refactor hazard because it means we must read
            // flags the flags after `commitReconciliationEffects` has already run;
            // the order matters. We should refactor so that ContentReset does not
            // rely on mutating the flag during commit. Like by setting a flag
            // during the render phase instead.
            if (finishedWork.flags & ContentReset) {
              var instance = finishedWork.stateNode;

              try {
                resetTextContent(instance);
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }

            if (flags & Update) {
              var _instance2 = finishedWork.stateNode;

              if (_instance2 != null) {
                // Commit the work prepared earlier.
                var newProps = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
                // as the newProps. The updatePayload will contain the real change in
                // this case.

                var oldProps =
                  current !== null ? current.memoizedProps : newProps;
                var type = finishedWork.type; // TODO: Type the updateQueue to be specific to host components.

                var _updatePayload = finishedWork.updateQueue;
                finishedWork.updateQueue = null;

                try {
                  commitUpdate(
                    _instance2,
                    _updatePayload,
                    type,
                    oldProps,
                    newProps,
                    finishedWork
                  );
                } catch (error) {
                  captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error
                  );
                }
              }
            }
          }

          return;
        }

        case HostText: {
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);

          if (flags & Update) {
            {
              if (finishedWork.stateNode === null) {
                throw new Error(
                  "This should have a text node initialized. This error is likely " +
                    "caused by a bug in React. Please file an issue."
                );
              }

              var textInstance = finishedWork.stateNode;
              var newText = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
              // as the newProps. The updatePayload will contain the real change in
              // this case.

              var oldText = current !== null ? current.memoizedProps : newText;

              try {
                commitTextUpdate(textInstance, oldText, newText);
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          }

          return;
        }

        case HostRoot: {
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
          }

          return;
        }

        case HostPortal: {
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
          }

          return;
        }

        case SuspenseComponent: {
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork); // TODO: We should mark a flag on the Suspense fiber itself, rather than
          // relying on the Offscreen fiber having a flag also being marked. The
          // reason is that this offscreen fiber might not be part of the work-in-
          // progress tree! It could have been reused from a previous render. This
          // doesn't lead to incorrect behavior because we don't rely on the flag
          // check alone; we also compare the states explicitly below. But for
          // modeling purposes, we _should_ be able to rely on the flag check alone.
          // So this is a bit fragile.
          //
          // Also, all this logic could/should move to the passive phase so it
          // doesn't block paint.

          var offscreenFiber = finishedWork.child;

          if (offscreenFiber.flags & Visibility) {
            // Throttle the appearance and disappearance of Suspense fallbacks.
            var isShowingFallback = finishedWork.memoizedState !== null;
            var wasShowingFallback =
              current !== null && current.memoizedState !== null;

            {
              if (isShowingFallback && !wasShowingFallback) {
                // Old behavior. Only mark when a fallback appears, not when
                // it disappears.
                markCommitTimeOfFallback();
              }
            }
          }

          if (flags & Update) {
            try {
              commitSuspenseCallback(finishedWork);
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }

            var retryQueue = finishedWork.updateQueue;

            if (retryQueue !== null) {
              finishedWork.updateQueue = null;
              attachSuspenseRetryListeners(finishedWork, retryQueue);
            }
          }

          return;
        }

        case OffscreenComponent: {
          if (flags & Ref) {
            if (current !== null) {
              safelyDetachRef(current, current.return);
            }
          }

          var newState = finishedWork.memoizedState;
          var isHidden = newState !== null;
          var wasHidden = current !== null && current.memoizedState !== null;

          if (finishedWork.mode & ConcurrentMode) {
            // Before committing the children, track on the stack whether this
            // offscreen subtree was already hidden, so that we don't unmount the
            // effects again.
            var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
            var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || isHidden;
            offscreenSubtreeWasHidden =
              prevOffscreenSubtreeWasHidden || wasHidden;
            recursivelyTraverseMutationEffects(root, finishedWork);
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
          } else {
            recursivelyTraverseMutationEffects(root, finishedWork);
          }

          commitReconciliationEffects(finishedWork);
          var offscreenInstance = finishedWork.stateNode; // TODO: Add explicit effect flag to set _current.

          offscreenInstance._current = finishedWork; // Offscreen stores pending changes to visibility in `_pendingVisibility`. This is
          // to support batching of `attach` and `detach` calls.

          offscreenInstance._visibility &= ~OffscreenDetached;
          offscreenInstance._visibility |=
            offscreenInstance._pendingVisibility & OffscreenDetached;

          if (flags & Visibility) {
            // Track the current state on the Offscreen instance so we can
            // read it during an event
            if (isHidden) {
              offscreenInstance._visibility &= ~OffscreenVisible;
            } else {
              offscreenInstance._visibility |= OffscreenVisible;
            }

            if (isHidden) {
              var isUpdate = current !== null;
              var wasHiddenByAncestorOffscreen =
                offscreenSubtreeIsHidden || offscreenSubtreeWasHidden; // Only trigger disapper layout effects if:
              //   - This is an update, not first mount.
              //   - This Offscreen was not hidden before.
              //   - Ancestor Offscreen was not hidden in previous commit.

              if (isUpdate && !wasHidden && !wasHiddenByAncestorOffscreen) {
                if ((finishedWork.mode & ConcurrentMode) !== NoMode) {
                  // Disappear the layout effects of all the children
                  recursivelyTraverseDisappearLayoutEffects(finishedWork);
                }
              }
            } // Offscreen with manual mode manages visibility manually.

            if (!isOffscreenManual(finishedWork)) {
              // TODO: This needs to run whenever there's an insertion or update
              // inside a hidden Offscreen tree.
              hideOrUnhideAllChildren(finishedWork, isHidden);
            }
          } // TODO: Move to passive phase

          if (flags & Update) {
            var offscreenQueue = finishedWork.updateQueue;

            if (offscreenQueue !== null) {
              var _retryQueue = offscreenQueue.retryQueue;

              if (_retryQueue !== null) {
                offscreenQueue.retryQueue = null;
                attachSuspenseRetryListeners(finishedWork, _retryQueue);
              }
            }
          }

          return;
        }

        case SuspenseListComponent: {
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);

          if (flags & Update) {
            var _retryQueue2 = finishedWork.updateQueue;

            if (_retryQueue2 !== null) {
              finishedWork.updateQueue = null;
              attachSuspenseRetryListeners(finishedWork, _retryQueue2);
            }
          }

          return;
        }

        case ScopeComponent: {
          return;
        }

        default: {
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          return;
        }
      }
    }

    function commitReconciliationEffects(finishedWork) {
      // Placement effects (insertions, reorders) can be scheduled on any fiber
      // type. They needs to happen after the children effects have fired, but
      // before the effects on this fiber have fired.
      var flags = finishedWork.flags;

      if (flags & Placement) {
        try {
          commitPlacement(finishedWork);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        } // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted does
        // and isMounted is deprecated anyway so we should be able to kill this.

        finishedWork.flags &= ~Placement;
      }

      if (flags & Hydrating) {
        finishedWork.flags &= ~Hydrating;
      }
    }

    function commitLayoutEffects(finishedWork, root, committedLanes) {
      inProgressLanes = committedLanes;
      inProgressRoot = root;
      var current = finishedWork.alternate;
      commitLayoutEffectOnFiber(root, current, finishedWork);
      inProgressLanes = null;
      inProgressRoot = null;
    }

    function recursivelyTraverseLayoutEffects(root, parentFiber, lanes) {
      var prevDebugFiber = getCurrentFiber();

      if (parentFiber.subtreeFlags & LayoutMask) {
        var child = parentFiber.child;

        while (child !== null) {
          setCurrentFiber(child);
          var current = child.alternate;
          commitLayoutEffectOnFiber(root, current, child);
          child = child.sibling;
        }
      }

      setCurrentFiber(prevDebugFiber);
    }

    function disappearLayoutEffects(finishedWork) {
      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent: {
          // TODO (Offscreen) Check: flags & LayoutStatic
          if (shouldProfile(finishedWork)) {
            try {
              startLayoutEffectTimer();
              commitHookEffectListUnmount(
                Layout,
                finishedWork,
                finishedWork.return
              );
            } finally {
              recordLayoutEffectDuration(finishedWork);
            }
          } else {
            commitHookEffectListUnmount(
              Layout,
              finishedWork,
              finishedWork.return
            );
          }

          recursivelyTraverseDisappearLayoutEffects(finishedWork);
          break;
        }

        case ClassComponent: {
          // TODO (Offscreen) Check: flags & RefStatic
          safelyDetachRef(finishedWork, finishedWork.return);
          var instance = finishedWork.stateNode;

          if (typeof instance.componentWillUnmount === "function") {
            safelyCallComponentWillUnmount(
              finishedWork,
              finishedWork.return,
              instance
            );
          }

          recursivelyTraverseDisappearLayoutEffects(finishedWork);
          break;
        }

        case HostHoistable:
        case HostSingleton:
        case HostComponent: {
          // TODO (Offscreen) Check: flags & RefStatic
          safelyDetachRef(finishedWork, finishedWork.return);
          recursivelyTraverseDisappearLayoutEffects(finishedWork);
          break;
        }

        case OffscreenComponent: {
          // TODO (Offscreen) Check: flags & RefStatic
          safelyDetachRef(finishedWork, finishedWork.return);
          var isHidden = finishedWork.memoizedState !== null;

          if (isHidden);
          else {
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
          }

          break;
        }

        default: {
          recursivelyTraverseDisappearLayoutEffects(finishedWork);
          break;
        }
      }
    }

    function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
      // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)
      var child = parentFiber.child;

      while (child !== null) {
        disappearLayoutEffects(child);
        child = child.sibling;
      }
    }

    function reappearLayoutEffects(
      finishedRoot,
      current,
      finishedWork, // This function visits both newly finished work and nodes that were re-used
      // from a previously committed tree. We cannot check non-static flags if the
      // node was reused.
      includeWorkInProgressEffects
    ) {
      // Turn on layout effects in a tree that previously disappeared.
      var flags = finishedWork.flags;

      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          ); // TODO: Check flags & LayoutStatic

          commitHookLayoutEffects(finishedWork, Layout);
          break;
        }

        case ClassComponent: {
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          ); // TODO: Check for LayoutStatic flag

          var instance = finishedWork.stateNode;

          if (typeof instance.componentDidMount === "function") {
            try {
              instance.componentDidMount();
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          } // Commit any callbacks that would have fired while the component
          // was hidden.

          var updateQueue = finishedWork.updateQueue;

          if (updateQueue !== null) {
            commitHiddenCallbacks(updateQueue, instance);
          } // If this is newly finished work, check for setState callbacks

          if (includeWorkInProgressEffects && flags & Callback) {
            commitClassCallbacks(finishedWork);
          } // TODO: Check flags & RefStatic

          safelyAttachRef(finishedWork, finishedWork.return);
          break;
        }
        // Unlike commitLayoutEffectsOnFiber, we don't need to handle HostRoot
        // because this function only visits nodes that are inside an
        // Offscreen fiber.
        // case HostRoot: {
        //  ...
        // }

        case HostHoistable:
        case HostSingleton:
        case HostComponent: {
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          ); // Renderers may schedule work to be done after host components are mounted
          // (eg DOM renderer may schedule auto-focus for inputs and form controls).
          // These effects should only be committed when components are first mounted,
          // aka when there is no current/alternate.

          if (
            includeWorkInProgressEffects &&
            current === null &&
            flags & Update
          ) {
            commitHostComponentMount(finishedWork);
          } // TODO: Check flags & Ref

          safelyAttachRef(finishedWork, finishedWork.return);
          break;
        }

        case Profiler: {
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          ); // TODO: Figure out how Profiler updates should work with Offscreen

          if (includeWorkInProgressEffects && flags & Update) {
            commitProfilerUpdate(finishedWork, current);
          }

          break;
        }

        case SuspenseComponent: {
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          ); // TODO: Figure out how Suspense hydration callbacks should work

          break;
        }

        case OffscreenComponent: {
          var offscreenState = finishedWork.memoizedState;
          var isHidden = offscreenState !== null;

          if (isHidden);
          else {
            recursivelyTraverseReappearLayoutEffects(
              finishedRoot,
              finishedWork,
              includeWorkInProgressEffects
            );
          } // TODO: Check flags & Ref

          safelyAttachRef(finishedWork, finishedWork.return);
          break;
        }

        default: {
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          );
          break;
        }
      }
    }

    function recursivelyTraverseReappearLayoutEffects(
      finishedRoot,
      parentFiber,
      includeWorkInProgressEffects
    ) {
      // This function visits both newly finished work and nodes that were re-used
      // from a previously committed tree. We cannot check non-static flags if the
      // node was reused.
      var childShouldIncludeWorkInProgressEffects =
        includeWorkInProgressEffects &&
        (parentFiber.subtreeFlags & LayoutMask) !== NoFlags$1; // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)

      var prevDebugFiber = getCurrentFiber();
      var child = parentFiber.child;

      while (child !== null) {
        var current = child.alternate;
        reappearLayoutEffects(
          finishedRoot,
          current,
          child,
          childShouldIncludeWorkInProgressEffects
        );
        child = child.sibling;
      }

      setCurrentFiber(prevDebugFiber);
    }

    function commitHookPassiveMountEffects(finishedWork, hookFlags) {
      if (shouldProfile(finishedWork)) {
        startPassiveEffectTimer();

        try {
          commitHookEffectListMount(hookFlags, finishedWork);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }

        recordPassiveEffectDuration(finishedWork);
      } else {
        try {
          commitHookEffectListMount(hookFlags, finishedWork);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }

    function commitPassiveMountEffects(
      root,
      finishedWork,
      committedLanes,
      committedTransitions
    ) {
      setCurrentFiber(finishedWork);
      commitPassiveMountOnFiber(root, finishedWork);
      resetCurrentFiber();
    }

    function recursivelyTraversePassiveMountEffects(
      root,
      parentFiber,
      committedLanes,
      committedTransitions
    ) {
      var prevDebugFiber = getCurrentFiber();

      if (parentFiber.subtreeFlags & PassiveMask) {
        var child = parentFiber.child;

        while (child !== null) {
          setCurrentFiber(child);
          commitPassiveMountOnFiber(root, child);
          child = child.sibling;
        }
      }

      setCurrentFiber(prevDebugFiber);
    }

    function commitPassiveMountOnFiber(
      finishedRoot,
      finishedWork,
      committedLanes,
      committedTransitions
    ) {
      // When updating this function, also update reconnectPassiveEffects, which does
      // most of the same things when an offscreen tree goes from hidden -> visible,
      // or when toggling effects inside a hidden tree.
      var flags = finishedWork.flags;

      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);

          if (flags & Passive$1) {
            commitHookPassiveMountEffects(finishedWork, Passive | HasEffect);
          }

          break;
        }

        case HostRoot: {
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);

          break;
        }

        case LegacyHiddenComponent: {
          break;
        }

        case OffscreenComponent: {
          // TODO: Pass `current` as argument to this function
          var _instance3 = finishedWork.stateNode;
          var nextState = finishedWork.memoizedState;
          var isHidden = nextState !== null;

          if (isHidden) {
            if (_instance3._visibility & OffscreenPassiveEffectsConnected) {
              // The effects are currently connected. Update them.
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork
              );
            } else {
              if (finishedWork.mode & ConcurrentMode);
              else {
                // Legacy Mode: Fire the effects even if the tree is hidden.
                _instance3._visibility |= OffscreenPassiveEffectsConnected;
                recursivelyTraversePassiveMountEffects(
                  finishedRoot,
                  finishedWork
                );
              }
            }
          } else {
            // Tree is visible
            if (_instance3._visibility & OffscreenPassiveEffectsConnected) {
              // The effects are currently connected. Update them.
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork
              );
            } else {
              // The effects are currently disconnected. Reconnect them, while also
              // firing effects inside newly mounted trees. This also applies to
              // the initial render.
              _instance3._visibility |= OffscreenPassiveEffectsConnected;
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork
              );
            }
          }

          break;
        }

        case CacheComponent: {
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);

          break;
        }

        case TracingMarkerComponent:

        default: {
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
          break;
        }
      }
    }

    function recursivelyTraverseReconnectPassiveEffects(
      finishedRoot,
      parentFiber,
      committedLanes,
      committedTransitions,
      includeWorkInProgressEffects
    ) {
      var prevDebugFiber = getCurrentFiber();
      var child = parentFiber.child;

      while (child !== null) {
        reconnectPassiveEffects(finishedRoot, child);
        child = child.sibling;
      }

      setCurrentFiber(prevDebugFiber);
    }

    function reconnectPassiveEffects(
      finishedRoot,
      finishedWork,
      committedLanes,
      committedTransitions, // This function visits both newly finished work and nodes that were re-used
      // from a previously committed tree. We cannot check non-static flags if the
      // node was reused.
      includeWorkInProgressEffects
    ) {
      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          recursivelyTraverseReconnectPassiveEffects(
            finishedRoot,
            finishedWork
          ); // TODO: Check for PassiveStatic flag

          commitHookPassiveMountEffects(finishedWork, Passive);
          break;
        }
        // Unlike commitPassiveMountOnFiber, we don't need to handle HostRoot
        // because this function only visits nodes that are inside an
        // Offscreen fiber.
        // case HostRoot: {
        //  ...
        // }

        case LegacyHiddenComponent: {
          break;
        }

        case OffscreenComponent: {
          var _instance4 = finishedWork.stateNode;
          var nextState = finishedWork.memoizedState;
          var isHidden = nextState !== null;

          if (isHidden) {
            if (_instance4._visibility & OffscreenPassiveEffectsConnected) {
              // The effects are currently connected. Update them.
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork
              );
            } else {
              if (finishedWork.mode & ConcurrentMode);
              else {
                // Legacy Mode: Fire the effects even if the tree is hidden.
                _instance4._visibility |= OffscreenPassiveEffectsConnected;
                recursivelyTraverseReconnectPassiveEffects(
                  finishedRoot,
                  finishedWork
                );
              }
            }
          } else {
            // Tree is visible
            // Since we're already inside a reconnecting tree, it doesn't matter
            // whether the effects are currently connected. In either case, we'll
            // continue traversing the tree and firing all the effects.
            //
            // We do need to set the "connected" flag on the instance, though.
            _instance4._visibility |= OffscreenPassiveEffectsConnected;
            recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork
            );
          }

          break;
        }

        case CacheComponent: {
          recursivelyTraverseReconnectPassiveEffects(
            finishedRoot,
            finishedWork
          );

          break;
        }

        case TracingMarkerComponent:

        default: {
          recursivelyTraverseReconnectPassiveEffects(
            finishedRoot,
            finishedWork
          );
          break;
        }
      }
    }

    function commitPassiveUnmountEffects(finishedWork) {
      setCurrentFiber(finishedWork);
      commitPassiveUnmountOnFiber(finishedWork);
      resetCurrentFiber();
    } // If we're inside a brand new tree, or a tree that was already visible, then we
    // should only suspend host components that have a ShouldSuspendCommit flag.
    // Components without it haven't changed since the last commit, so we can skip
    // over those.
    //
    // When we enter a tree that is being revealed (going from hidden -> visible),
    // we need to suspend _any_ component that _may_ suspend. Even if they're
    // already in the "current" tree. Because their visibility has changed, the
    // browser may not have prerendered them yet. So we check the MaySuspendCommit
    // flag instead.

    var suspenseyCommitFlag = ShouldSuspendCommit;
    function accumulateSuspenseyCommit(finishedWork) {
      accumulateSuspenseyCommitOnFiber(finishedWork);
    }

    function recursivelyAccumulateSuspenseyCommit(parentFiber) {
      if (parentFiber.subtreeFlags & suspenseyCommitFlag) {
        var child = parentFiber.child;

        while (child !== null) {
          accumulateSuspenseyCommitOnFiber(child);
          child = child.sibling;
        }
      }
    }

    function accumulateSuspenseyCommitOnFiber(fiber) {
      switch (fiber.tag) {
        case HostHoistable: {
          recursivelyAccumulateSuspenseyCommit(fiber);

          if (fiber.flags & suspenseyCommitFlag) {
            if (fiber.memoizedState !== null) {
              suspendResource();
            }
          }

          break;
        }

        case HostComponent: {
          recursivelyAccumulateSuspenseyCommit(fiber);

          break;
        }

        case HostRoot:
        case HostPortal: {
          {
            recursivelyAccumulateSuspenseyCommit(fiber);
          }

          break;
        }

        case OffscreenComponent: {
          var isHidden = fiber.memoizedState !== null;

          if (isHidden);
          else {
            var current = fiber.alternate;
            var wasHidden = current !== null && current.memoizedState !== null;

            if (wasHidden) {
              // This tree is being revealed. Visit all newly visible suspensey
              // instances, even if they're in the current tree.
              var prevFlags = suspenseyCommitFlag;
              suspenseyCommitFlag = MaySuspendCommit;
              recursivelyAccumulateSuspenseyCommit(fiber);
              suspenseyCommitFlag = prevFlags;
            } else {
              recursivelyAccumulateSuspenseyCommit(fiber);
            }
          }

          break;
        }

        default: {
          recursivelyAccumulateSuspenseyCommit(fiber);
        }
      }
    }

    function detachAlternateSiblings(parentFiber) {
      // A fiber was deleted from this parent fiber, but it's still part of the
      // previous (alternate) parent fiber's list of children. Because children
      // are a linked list, an earlier sibling that's still alive will be
      // connected to the deleted fiber via its `alternate`:
      //
      //   live fiber --alternate--> previous live fiber --sibling--> deleted
      //   fiber
      //
      // We can't disconnect `alternate` on nodes that haven't been deleted yet,
      // but we can disconnect the `sibling` and `child` pointers.
      var previousFiber = parentFiber.alternate;

      if (previousFiber !== null) {
        var detachedChild = previousFiber.child;

        if (detachedChild !== null) {
          previousFiber.child = null;

          do {
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            var detachedSibling = detachedChild.sibling; // $FlowFixMe[incompatible-use] found when upgrading Flow

            detachedChild.sibling = null;
            detachedChild = detachedSibling;
          } while (detachedChild !== null);
        }
      }
    }

    function commitHookPassiveUnmountEffects(
      finishedWork,
      nearestMountedAncestor,
      hookFlags
    ) {
      if (shouldProfile(finishedWork)) {
        startPassiveEffectTimer();
        commitHookEffectListUnmount(
          hookFlags,
          finishedWork,
          nearestMountedAncestor
        );
        recordPassiveEffectDuration(finishedWork);
      } else {
        commitHookEffectListUnmount(
          hookFlags,
          finishedWork,
          nearestMountedAncestor
        );
      }
    }

    function recursivelyTraversePassiveUnmountEffects(parentFiber) {
      // Deletions effects can be scheduled on any fiber type. They need to happen
      // before the children effects have fired.
      var deletions = parentFiber.deletions;

      if ((parentFiber.flags & ChildDeletion) !== NoFlags$1) {
        if (deletions !== null) {
          for (var i = 0; i < deletions.length; i++) {
            var childToDelete = deletions[i]; // TODO: Convert this to use recursion

            nextEffect = childToDelete;
            commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
              childToDelete,
              parentFiber
            );
          }
        }

        detachAlternateSiblings(parentFiber);
      }

      var prevDebugFiber = getCurrentFiber(); // TODO: Split PassiveMask into separate masks for mount and unmount?

      if (parentFiber.subtreeFlags & PassiveMask) {
        var child = parentFiber.child;

        while (child !== null) {
          setCurrentFiber(child);
          commitPassiveUnmountOnFiber(child);
          child = child.sibling;
        }
      }

      setCurrentFiber(prevDebugFiber);
    }

    function commitPassiveUnmountOnFiber(finishedWork) {
      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          recursivelyTraversePassiveUnmountEffects(finishedWork);

          if (finishedWork.flags & Passive$1) {
            commitHookPassiveUnmountEffects(
              finishedWork,
              finishedWork.return,
              Passive | HasEffect
            );
          }

          break;
        }

        case OffscreenComponent: {
          var instance = finishedWork.stateNode;
          var nextState = finishedWork.memoizedState;
          var isHidden = nextState !== null;

          if (
            isHidden &&
            instance._visibility & OffscreenPassiveEffectsConnected && // For backwards compatibility, don't unmount when a tree suspends. In
            // the future we may change this to unmount after a delay.
            (finishedWork.return === null ||
              finishedWork.return.tag !== SuspenseComponent)
          ) {
            // The effects are currently connected. Disconnect them.
            // TODO: Add option or heuristic to delay before disconnecting the
            // effects. Then if the tree reappears before the delay has elapsed, we
            // can skip toggling the effects entirely.
            instance._visibility &= ~OffscreenPassiveEffectsConnected;
            recursivelyTraverseDisconnectPassiveEffects(finishedWork);
          } else {
            recursivelyTraversePassiveUnmountEffects(finishedWork);
          }

          break;
        }

        default: {
          recursivelyTraversePassiveUnmountEffects(finishedWork);
          break;
        }
      }
    }

    function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
      // Deletions effects can be scheduled on any fiber type. They need to happen
      // before the children effects have fired.
      var deletions = parentFiber.deletions;

      if ((parentFiber.flags & ChildDeletion) !== NoFlags$1) {
        if (deletions !== null) {
          for (var i = 0; i < deletions.length; i++) {
            var childToDelete = deletions[i]; // TODO: Convert this to use recursion

            nextEffect = childToDelete;
            commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
              childToDelete,
              parentFiber
            );
          }
        }

        detachAlternateSiblings(parentFiber);
      }

      var prevDebugFiber = getCurrentFiber(); // TODO: Check PassiveStatic flag

      var child = parentFiber.child;

      while (child !== null) {
        setCurrentFiber(child);
        disconnectPassiveEffect(child);
        child = child.sibling;
      }

      setCurrentFiber(prevDebugFiber);
    }

    function disconnectPassiveEffect(finishedWork) {
      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          // TODO: Check PassiveStatic flag
          commitHookPassiveUnmountEffects(
            finishedWork,
            finishedWork.return,
            Passive
          ); // When disconnecting passive effects, we fire the effects in the same
          // order as during a deletiong: parent before child

          recursivelyTraverseDisconnectPassiveEffects(finishedWork);
          break;
        }

        case OffscreenComponent: {
          var instance = finishedWork.stateNode;

          if (instance._visibility & OffscreenPassiveEffectsConnected) {
            instance._visibility &= ~OffscreenPassiveEffectsConnected;
            recursivelyTraverseDisconnectPassiveEffects(finishedWork);
          }

          break;
        }

        default: {
          recursivelyTraverseDisconnectPassiveEffects(finishedWork);
          break;
        }
      }
    }

    function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
      deletedSubtreeRoot,
      nearestMountedAncestor
    ) {
      while (nextEffect !== null) {
        var fiber = nextEffect; // Deletion effects fire in parent -> child order
        // TODO: Check if fiber has a PassiveStatic flag

        setCurrentFiber(fiber);
        commitPassiveUnmountInsideDeletedTreeOnFiber(
          fiber,
          nearestMountedAncestor
        );
        resetCurrentFiber();
        var child = fiber.child; // TODO: Only traverse subtree if it has a PassiveStatic flag.

        if (child !== null) {
          child.return = fiber;
          nextEffect = child;
        } else {
          commitPassiveUnmountEffectsInsideOfDeletedTree_complete(
            deletedSubtreeRoot
          );
        }
      }
    }

    function commitPassiveUnmountEffectsInsideOfDeletedTree_complete(
      deletedSubtreeRoot
    ) {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        var sibling = fiber.sibling;
        var returnFiber = fiber.return; // Recursively traverse the entire deleted tree and clean up fiber fields.
        // This is more aggressive than ideal, and the long term goal is to only
        // have to detach the deleted tree at the root.

        detachFiberAfterEffects(fiber);

        if (fiber === deletedSubtreeRoot) {
          nextEffect = null;
          return;
        }

        if (sibling !== null) {
          sibling.return = returnFiber;
          nextEffect = sibling;
          return;
        }

        nextEffect = returnFiber;
      }
    }

    function commitPassiveUnmountInsideDeletedTreeOnFiber(
      current,
      nearestMountedAncestor
    ) {
      switch (current.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          commitHookPassiveUnmountEffects(
            current,
            nearestMountedAncestor,
            Passive
          );
          break;
        }
      }
    }

    function invokeLayoutEffectMountInDEV(fiber) {
      {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch (fiber.tag) {
          case FunctionComponent:
          case ForwardRef:
          case SimpleMemoComponent: {
            try {
              commitHookEffectListMount(Layout | HasEffect, fiber);
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }

            break;
          }

          case ClassComponent: {
            var instance = fiber.stateNode;

            if (typeof instance.componentDidMount === "function") {
              try {
                instance.componentDidMount();
              } catch (error) {
                captureCommitPhaseError(fiber, fiber.return, error);
              }
            }

            break;
          }
        }
      }
    }

    function invokePassiveEffectMountInDEV(fiber) {
      {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch (fiber.tag) {
          case FunctionComponent:
          case ForwardRef:
          case SimpleMemoComponent: {
            try {
              commitHookEffectListMount(Passive | HasEffect, fiber);
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }

            break;
          }
        }
      }
    }

    function invokeLayoutEffectUnmountInDEV(fiber) {
      {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch (fiber.tag) {
          case FunctionComponent:
          case ForwardRef:
          case SimpleMemoComponent: {
            try {
              commitHookEffectListUnmount(
                Layout | HasEffect,
                fiber,
                fiber.return
              );
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }

            break;
          }

          case ClassComponent: {
            var instance = fiber.stateNode;

            if (typeof instance.componentWillUnmount === "function") {
              safelyCallComponentWillUnmount(fiber, fiber.return, instance);
            }

            break;
          }
        }
      }
    }

    function invokePassiveEffectUnmountInDEV(fiber) {
      {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch (fiber.tag) {
          case FunctionComponent:
          case ForwardRef:
          case SimpleMemoComponent: {
            try {
              commitHookEffectListUnmount(
                Passive | HasEffect,
                fiber,
                fiber.return
              );
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
          }
        }
      }
    }

    if (typeof Symbol === "function" && Symbol.for) {
      var symbolFor = Symbol.for;
      symbolFor("selector.component");
      symbolFor("selector.has_pseudo_class");
      symbolFor("selector.role");
      symbolFor("selector.test_id");
      symbolFor("selector.text");
    }

    var ReactCurrentActQueue$1 = ReactSharedInternals.ReactCurrentActQueue;
    function isLegacyActEnvironment(fiber) {
      {
        // Legacy mode. We preserve the behavior of React 17's act. It assumes an
        // act environment whenever `jest` is defined, but you can still turn off
        // spurious warnings by setting IS_REACT_ACT_ENVIRONMENT explicitly
        // to false.
        var isReactActEnvironmentGlobal = // $FlowFixMe[cannot-resolve-name] Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
          typeof IS_REACT_ACT_ENVIRONMENT !== "undefined" // $FlowFixMe[cannot-resolve-name]
            ? IS_REACT_ACT_ENVIRONMENT
            : undefined; // $FlowFixMe[cannot-resolve-name] - Flow doesn't know about jest

        var jestIsDefined = typeof jest !== "undefined";
        return jestIsDefined && isReactActEnvironmentGlobal !== false;
      }
    }
    function isConcurrentActEnvironment() {
      {
        var isReactActEnvironmentGlobal = // $FlowFixMe[cannot-resolve-name] Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
          typeof IS_REACT_ACT_ENVIRONMENT !== "undefined" // $FlowFixMe[cannot-resolve-name]
            ? IS_REACT_ACT_ENVIRONMENT
            : undefined;

        if (
          !isReactActEnvironmentGlobal &&
          ReactCurrentActQueue$1.current !== null
        ) {
          // TODO: Include link to relevant documentation page.
          error(
            "The current testing environment is not configured to support " +
              "act(...)"
          );
        }

        return isReactActEnvironmentGlobal;
      }
    }

    var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
    var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
      ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner,
      ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig,
      ReactCurrentActQueue = ReactSharedInternals.ReactCurrentActQueue;
    var NoContext =
      /*             */
      0;
    var BatchedContext =
      /*               */
      1;
    var RenderContext =
      /*         */
      2;
    var CommitContext =
      /*         */
      4;
    var RootInProgress = 0;
    var RootFatalErrored = 1;
    var RootErrored = 2;
    var RootSuspended = 3;
    var RootSuspendedWithDelay = 4;
    var RootCompleted = 5;
    var RootDidNotComplete = 6; // Describes where we are in the React execution stack

    var executionContext = NoContext; // The root we're working on

    var workInProgressRoot = null; // The fiber we're working on

    var workInProgress = null; // The lanes we're rendering

    var workInProgressRootRenderLanes = NoLanes;
    var NotSuspended = 0;
    var SuspendedOnError = 1;
    var SuspendedOnData = 2;
    var SuspendedOnImmediate = 3;
    var SuspendedOnInstance = 4;
    var SuspendedOnInstanceAndReadyToContinue = 5;
    var SuspendedOnDeprecatedThrowPromise = 6;
    var SuspendedAndReadyToContinue = 7;
    var SuspendedOnHydration = 8; // When this is true, the work-in-progress fiber just suspended (or errored) and
    // we've yet to unwind the stack. In some cases, we may yield to the main thread
    // after this happens. If the fiber is pinged before we resume, we can retry
    // immediately instead of unwinding the stack.

    var workInProgressSuspendedReason = NotSuspended;
    var workInProgressThrownValue = null; // Whether a ping listener was attached during this render. This is slightly
    // different that whether something suspended, because we don't add multiple
    // listeners to a promise we've already seen (per root and lane).

    var workInProgressRootDidAttachPingListener = false; // A contextual version of workInProgressRootRenderLanes. It is a superset of
    // the lanes that we started working on at the root. When we enter a subtree
    // that is currently hidden, we add the lanes that would have committed if
    // the hidden tree hadn't been deferred. This is modified by the
    // HiddenContext module.
    //
    // Most things in the work loop should deal with workInProgressRootRenderLanes.
    // Most things in begin/complete phases should deal with entangledRenderLanes.

    var entangledRenderLanes = NoLanes; // Whether to root completed, errored, suspended, etc.

    var workInProgressRootExitStatus = RootInProgress; // A fatal error, if one is thrown

    var workInProgressRootFatalError = null; // The work left over by components that were visited during this render. Only
    // includes unprocessed updates, not work in bailed out children.

    var workInProgressRootSkippedLanes = NoLanes; // Lanes that were updated (in an interleaved event) during this render.

    var workInProgressRootInterleavedUpdatedLanes = NoLanes; // Lanes that were updated during the render phase (*not* an interleaved event).

    var workInProgressRootPingedLanes = NoLanes; // If this lane scheduled deferred work, this is the lane of the deferred task.

    var workInProgressDeferredLane = NoLane; // Errors that are thrown during the render phase.

    var workInProgressRootConcurrentErrors = null; // These are errors that we recovered from without surfacing them to the UI.
    // We will log them once the tree commits.

    var workInProgressRootRecoverableErrors = null; // Tracks when an update occurs during the render phase.

    var workInProgressRootDidIncludeRecursiveRenderUpdate = false; // Thacks when an update occurs during the commit phase. It's a separate
    // filled in with the resolved UI. This lets us throttle the appearance of new
    // content as it streams in, to minimize jank.
    // TODO: Think of a better name for this variable?

    var globalMostRecentFallbackTime = 0;
    var FALLBACK_THROTTLE_MS = 300; // The absolute time for when we should start giving up on rendering
    // more and prefer CPU suspense heuristics instead.

    var workInProgressRootRenderTargetTime = Infinity; // How long a render is supposed to take before we start following CPU
    // suspense heuristics and opt out of rendering more content.

    var RENDER_TIMEOUT_MS = 500;
    var workInProgressTransitions = null;

    function resetRenderTimer() {
      workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS;
    }

    function getRenderTargetTime() {
      return workInProgressRootRenderTargetTime;
    }
    var hasUncaughtError = false;
    var firstUncaughtError = null;
    var legacyErrorBoundariesThatAlreadyFailed = null;
    var rootDoesHavePassiveEffects = false;
    var rootWithPendingPassiveEffects = null;
    var pendingPassiveEffectsLanes = NoLanes;
    var pendingPassiveProfilerEffects = [];

    var NESTED_UPDATE_LIMIT = 50;
    var nestedUpdateCount = 0;
    var rootWithNestedUpdates = null;
    var isFlushingPassiveEffects = false;
    var didScheduleUpdateDuringPassiveEffects = false;
    var NESTED_PASSIVE_UPDATE_LIMIT = 50;
    var nestedPassiveUpdateCount = 0;
    var rootWithPassiveNestedUpdates = null;
    var isRunningInsertionEffect = false;
    function getWorkInProgressRoot() {
      return workInProgressRoot;
    }
    function getWorkInProgressRootRenderLanes() {
      return workInProgressRootRenderLanes;
    }
    function isWorkLoopSuspendedOnData() {
      return workInProgressSuspendedReason === SuspendedOnData;
    }
    function requestUpdateLane(fiber) {
      // Special cases
      var mode = fiber.mode;

      if ((mode & ConcurrentMode) === NoMode) {
        return SyncLane;
      } else if (
        (executionContext & RenderContext) !== NoContext &&
        workInProgressRootRenderLanes !== NoLanes
      ) {
        // This is a render phase update. These are not officially supported. The
        // old behavior is to give this the same "thread" (lanes) as
        // whatever is currently rendering. So if you call `setState` on a component
        // that happens later in the same render, it will flush. Ideally, we want to
        // remove the special case and treat them as if they came from an
        // interleaved event. Regardless, this pattern is not officially supported.
        // This behavior is only a fallback. The flag only exists until we can roll
        // out the setState warning, since existing code might accidentally rely on
        // the current behavior.
        return pickArbitraryLane(workInProgressRootRenderLanes);
      }

      var transition = requestCurrentTransition();

      if (transition !== null) {
        {
          var batchConfigTransition = ReactCurrentBatchConfig.transition;

          if (!batchConfigTransition._updatedFibers) {
            batchConfigTransition._updatedFibers = new Set();
          }

          batchConfigTransition._updatedFibers.add(fiber);
        }

        var actionScopeLane = peekEntangledActionLane();
        return actionScopeLane !== NoLane // We're inside an async action scope. Reuse the same lane.
          ? actionScopeLane // We may or may not be inside an async action scope. If we are, this
          : // is the first update in that scope. Either way, we need to get a
            // fresh transition lane.
            requestTransitionLane();
      } // Updates originating inside certain React methods, like flushSync, have
      // their priority set by tracking it with a context variable.
      //
      // The opaque type returned by the host config is internally a lane, so we can
      // use that directly.
      // TODO: Move this type conversion to the event priority module.

      var updateLane = getCurrentUpdatePriority();

      if (updateLane !== NoLane) {
        return updateLane;
      } // This update originated outside React. Ask the host environment for an
      // appropriate priority, based on the type of event.
      //
      // The opaque type returned by the host config is internally a lane, so we can
      // use that directly.
      // TODO: Move this type conversion to the event priority module.

      var eventLane = getCurrentEventPriority();
      return eventLane;
    }

    function requestRetryLane(fiber) {
      // This is a fork of `requestUpdateLane` designed specifically for Suspense
      // "retries" — a special update that attempts to flip a Suspense boundary
      // from its placeholder state to its primary/resolved state.
      // Special cases
      var mode = fiber.mode;

      if ((mode & ConcurrentMode) === NoMode) {
        return SyncLane;
      }

      return claimNextRetryLane();
    }

    function requestDeferredLane() {
      if (workInProgressDeferredLane === NoLane) {
        // If there are multiple useDeferredValue hooks in the same render, the
        // tasks that they spawn should all be batched together, so they should all
        // receive the same lane.
        // Check the priority of the current render to decide the priority of the
        // deferred task.
        // OffscreenLane is used for prerendering, but we also use OffscreenLane
        // for incremental hydration. It's given the lowest priority because the
        // initial HTML is the same as the final UI. But useDeferredValue during
        // hydration is an exception — we need to upgrade the UI to the final
        // value. So if we're currently hydrating, we treat it like a transition.
        var isPrerendering =
          includesSomeLane(workInProgressRootRenderLanes, OffscreenLane) &&
          !getIsHydrating();

        if (isPrerendering) {
          // There's only one OffscreenLane, so if it contains deferred work, we
          // should just reschedule using the same lane.
          workInProgressDeferredLane = OffscreenLane;
        } else {
          // Everything else is spawned as a transition.
          workInProgressDeferredLane = claimNextTransitionLane();
        }
      } // Mark the parent Suspense boundary so it knows to spawn the deferred lane.

      var suspenseHandler = getSuspenseHandler();

      if (suspenseHandler !== null) {
        // TODO: As an optimization, we shouldn't entangle the lanes at the root; we
        // can entangle them using the baseLanes of the Suspense boundary instead.
        // We only need to do something special if there's no Suspense boundary.
        suspenseHandler.flags |= DidDefer;
      }

      return workInProgressDeferredLane;
    }
    function peekDeferredLane() {
      return workInProgressDeferredLane;
    }
    function scheduleUpdateOnFiber(root, fiber, lane) {
      {
        if (isRunningInsertionEffect) {
          error("useInsertionEffect must not schedule updates.");
        }
      }

      {
        if (isFlushingPassiveEffects) {
          didScheduleUpdateDuringPassiveEffects = true;
        }
      } // Check if the work loop is currently suspended and waiting for data to
      // finish loading.

      if (
        // Suspended render phase
        (root === workInProgressRoot &&
          workInProgressSuspendedReason === SuspendedOnData) || // Suspended commit phase
        root.cancelPendingCommit !== null
      ) {
        // The incoming update might unblock the current render. Interrupt the
        // current attempt and restart from the top.
        prepareFreshStack(root, NoLanes);
        markRootSuspended(
          root,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane
        );
      } // Mark that the root has a pending update.

      markRootUpdated(root, lane);

      if (
        (executionContext & RenderContext) !== NoLanes &&
        root === workInProgressRoot
      ) {
        // This update was dispatched during the render phase. This is a mistake
        // if the update originates from user space (with the exception of local
        // hook updates, which are handled differently and don't reach this
        // function), but there are some internal React features that use this as
        // an implementation detail, like selective hydration.
        warnAboutRenderPhaseUpdatesInDEV(fiber); // Track lanes that were updated during the render phase
      } else {
        // This is a normal update, scheduled from outside the render phase. For
        // example, during an input event.
        {
          if (isDevToolsPresent) {
            addFiberToLanesMap(root, fiber, lane);
          }
        }

        warnIfUpdatesNotWrappedWithActDEV(fiber);

        if (root === workInProgressRoot) {
          // Received an update to a tree that's in the middle of rendering. Mark
          // that there was an interleaved update work on this root.
          if ((executionContext & RenderContext) === NoContext) {
            workInProgressRootInterleavedUpdatedLanes = mergeLanes(
              workInProgressRootInterleavedUpdatedLanes,
              lane
            );
          }

          if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
            // The root already suspended with a delay, which means this render
            // definitely won't finish. Since we have a new update, let's mark it as
            // suspended now, right before marking the incoming update. This has the
            // effect of interrupting the current render and switching to the update.
            // TODO: Make sure this doesn't override pings that happen while we've
            // already started rendering.
            markRootSuspended(
              root,
              workInProgressRootRenderLanes,
              workInProgressDeferredLane
            );
          }
        }

        ensureRootIsScheduled(root);

        if (
          lane === SyncLane &&
          executionContext === NoContext &&
          (fiber.mode & ConcurrentMode) === NoMode
        ) {
          if (ReactCurrentActQueue.isBatchingLegacy);
          else {
            // Flush the synchronous work now, unless we're already working or inside
            // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
            // scheduleCallbackForFiber to preserve the ability to schedule a callback
            // without immediately flushing it. We only do this for user-initiated
            // updates, to preserve historical behavior of legacy mode.
            resetRenderTimer();
            flushSyncWorkOnLegacyRootsOnly();
          }
        }
      }
    }
    function isUnsafeClassRenderPhaseUpdate(fiber) {
      // Check if this is a render phase update. Only called by class components,
      // which special (deprecated) behavior for UNSAFE_componentWillReceive props.
      return (executionContext & RenderContext) !== NoContext;
    } // This is the entry point for every concurrent task, i.e. anything that
    // goes through Scheduler.

    function performConcurrentWorkOnRoot(root, didTimeout) {
      {
        resetNestedUpdateFlag();
      }

      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error("Should not already be working.");
      } // Flush any pending passive effects before deciding which lanes to work on,
      // in case they schedule additional work.

      var originalCallbackNode = root.callbackNode;
      var didFlushPassiveEffects = flushPassiveEffects();

      if (didFlushPassiveEffects) {
        // Something in the passive effect phase may have canceled the current task.
        // Check if the task node for this root was changed.
        if (root.callbackNode !== originalCallbackNode) {
          // The current task was canceled. Exit. We don't need to call
          // `ensureRootIsScheduled` because the check above implies either that
          // there's a new task, or that there's no remaining work on this root.
          return null;
        }
      } // Determine the next lanes to work on, using the fields stored
      // on the root.
      // TODO: This was already computed in the caller. Pass it as an argument.

      var lanes = getNextLanes(
        root,
        root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
      );

      if (lanes === NoLanes) {
        // Defensive coding. This is never expected to happen.
        return null;
      } // We disable time-slicing in some cases: if the work has been CPU-bound
      // for too long ("expired" work, to prevent starvation), or we're in
      // sync-updates-by-default mode.
      // TODO: We only check `didTimeout` defensively, to account for a Scheduler
      // bug we're still investigating. Once the bug in Scheduler is fixed,
      // we can remove this, since we track expiration ourselves.

      var shouldTimeSlice =
        !includesBlockingLane(root, lanes) &&
        !includesExpiredLane(root, lanes) &&
        !didTimeout;
      var exitStatus = shouldTimeSlice
        ? renderRootConcurrent(root, lanes)
        : renderRootSync(root, lanes);

      if (exitStatus !== RootInProgress) {
        var renderWasConcurrent = shouldTimeSlice;

        do {
          if (exitStatus === RootDidNotComplete) {
            // The render unwound without completing the tree. This happens in special
            // cases where need to exit the current render without producing a
            // consistent tree or committing.
            markRootSuspended(root, lanes, NoLane);
          } else {
            // The render completed.
            // Check if this render may have yielded to a concurrent event, and if so,
            // confirm that any newly rendered stores are consistent.
            // TODO: It's possible that even a concurrent render may never have yielded
            // to the main thread, if it was fast enough, or if it expired. We could
            // skip the consistency check in that case, too.
            var finishedWork = root.current.alternate;

            if (
              renderWasConcurrent &&
              !isRenderConsistentWithExternalStores(finishedWork)
            ) {
              // A store was mutated in an interleaved event. Render again,
              // synchronously, to block further mutations.
              exitStatus = renderRootSync(root, lanes); // We assume the tree is now consistent because we didn't yield to any
              // concurrent events.

              renderWasConcurrent = false; // Need to check the exit status again.

              continue;
            } // Check if something threw

            if (exitStatus === RootErrored) {
              var originallyAttemptedLanes = lanes;
              var errorRetryLanes = getLanesToRetrySynchronouslyOnError(
                root,
                originallyAttemptedLanes
              );

              if (errorRetryLanes !== NoLanes) {
                lanes = errorRetryLanes;
                exitStatus = recoverFromConcurrentError(
                  root,
                  originallyAttemptedLanes,
                  errorRetryLanes
                );
                renderWasConcurrent = false;
              }
            }

            if (exitStatus === RootFatalErrored) {
              var fatalError = workInProgressRootFatalError;
              prepareFreshStack(root, NoLanes);
              markRootSuspended(root, lanes, NoLane);
              ensureRootIsScheduled(root);
              throw fatalError;
            } // We now have a consistent tree. The next step is either to commit it,
            // or, if something suspended, wait to commit it after a timeout.

            root.finishedWork = finishedWork;
            root.finishedLanes = lanes;
            finishConcurrentRender(root, exitStatus, finishedWork, lanes);
          }

          break;
        } while (true);
      }

      ensureRootIsScheduled(root);
      return getContinuationForRoot(root, originalCallbackNode);
    }

    function recoverFromConcurrentError(
      root,
      originallyAttemptedLanes,
      errorRetryLanes
    ) {
      // If an error occurred during hydration, discard server response and fall
      // back to client side render.
      // Before rendering again, save the errors from the previous attempt.
      var errorsFromFirstAttempt = workInProgressRootConcurrentErrors;
      var wasRootDehydrated = isRootDehydrated(root);

      if (wasRootDehydrated) {
        // The shell failed to hydrate. Set a flag to force a client rendering
        // during the next attempt. To do this, we call prepareFreshStack now
        // to create the root work-in-progress fiber. This is a bit weird in terms
        // of factoring, because it relies on renderRootSync not calling
        // prepareFreshStack again in the call below, which happens because the
        // root and lanes haven't changed.
        //
        // TODO: I think what we should do is set ForceClientRender inside
        // throwException, like we do for nested Suspense boundaries. The reason
        // it's here instead is so we can switch to the synchronous work loop, too.
        // Something to consider for a future refactor.
        var rootWorkInProgress = prepareFreshStack(root, errorRetryLanes);
        rootWorkInProgress.flags |= ForceClientRender;

        {
          errorHydratingContainer();
        }
      }

      var exitStatus = renderRootSync(root, errorRetryLanes);

      if (exitStatus !== RootErrored) {
        // Successfully finished rendering on retry
        if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
          // During the synchronous render, we attached additional ping listeners.
          // This is highly suggestive of an uncached promise (though it's not the
          // only reason this would happen). If it was an uncached promise, then
          // it may have masked a downstream error from ocurring without actually
          // fixing it. Example:
          //
          //    use(Promise.resolve('uncached'))
          //    throw new Error('Oops!')
          //
          // When this happens, there's a conflict between blocking potential
          // concurrent data races and unwrapping uncached promise values. We
          // have to choose one or the other. Because the data race recovery is
          // a last ditch effort, we'll disable it.
          root.errorRecoveryDisabledLanes = mergeLanes(
            root.errorRecoveryDisabledLanes,
            originallyAttemptedLanes
          ); // Mark the current render as suspended and force it to restart. Once
          // these lanes finish successfully, we'll re-enable the error recovery
          // mechanism for subsequent updates.

          workInProgressRootInterleavedUpdatedLanes |= originallyAttemptedLanes;
          return RootSuspendedWithDelay;
        } // The errors from the failed first attempt have been recovered. Add
        // them to the collection of recoverable errors. We'll log them in the
        // commit phase.

        var errorsFromSecondAttempt = workInProgressRootRecoverableErrors;
        workInProgressRootRecoverableErrors = errorsFromFirstAttempt; // The errors from the second attempt should be queued after the errors
        // from the first attempt, to preserve the causal sequence.

        if (errorsFromSecondAttempt !== null) {
          queueRecoverableErrors(errorsFromSecondAttempt);
        }
      }

      return exitStatus;
    }

    function queueRecoverableErrors(errors) {
      if (workInProgressRootRecoverableErrors === null) {
        workInProgressRootRecoverableErrors = errors;
      } else {
        // $FlowFixMe[method-unbinding]
        workInProgressRootRecoverableErrors.push.apply(
          workInProgressRootRecoverableErrors,
          errors
        );
      }
    }

    function finishConcurrentRender(root, exitStatus, finishedWork, lanes) {
      // TODO: The fact that most of these branches are identical suggests that some
      // of the exit statuses are not best modeled as exit statuses and should be
      // tracked orthogonally.
      switch (exitStatus) {
        case RootInProgress:
        case RootFatalErrored: {
          throw new Error("Root did not complete. This is a bug in React.");
        }

        case RootSuspendedWithDelay: {
          if (includesOnlyTransitions(lanes)) {
            // This is a transition, so we should exit without committing a
            // placeholder and without scheduling a timeout. Delay indefinitely
            // until we receive more data.
            markRootSuspended(root, lanes, workInProgressDeferredLane);
            return;
          } // Commit the placeholder.

          break;
        }

        case RootErrored:
        case RootSuspended:
        case RootCompleted: {
          break;
        }

        default: {
          throw new Error("Unknown root exit status.");
        }
      }

      if (shouldForceFlushFallbacksInDEV()) {
        // We're inside an `act` scope. Commit immediately.
        commitRoot(
          root,
          workInProgressRootRecoverableErrors,
          workInProgressTransitions,
          workInProgressRootDidIncludeRecursiveRenderUpdate,
          workInProgressDeferredLane
        );
      } else {
        if (includesOnlyRetries(lanes) && exitStatus === RootSuspended) {
          // This render only included retries, no updates. Throttle committing
          // retries so that we don't show too many loading states too quickly.
          var msUntilTimeout =
            globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now$1(); // Don't bother with a very short suspense time.

          if (msUntilTimeout > 10) {
            markRootSuspended(root, lanes, workInProgressDeferredLane);
            var nextLanes = getNextLanes(root, NoLanes);

            if (nextLanes !== NoLanes) {
              // There's additional work we can do on this root. We might as well
              // attempt to work on that while we're suspended.
              return;
            } // The render is suspended, it hasn't timed out, and there's no
            // lower priority work to do. Instead of committing the fallback
            // immediately, wait for more data to arrive.
            // TODO: Combine retry throttling with Suspensey commits. Right now they
            // run one after the other.

            root.timeoutHandle = scheduleTimeout(
              commitRootWhenReady.bind(
                null,
                root,
                finishedWork,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions,
                workInProgressRootDidIncludeRecursiveRenderUpdate,
                lanes,
                workInProgressDeferredLane
              ),
              msUntilTimeout
            );
            return;
          }
        }

        commitRootWhenReady(
          root,
          finishedWork,
          workInProgressRootRecoverableErrors,
          workInProgressTransitions,
          workInProgressRootDidIncludeRecursiveRenderUpdate,
          lanes,
          workInProgressDeferredLane
        );
      }
    }

    function commitRootWhenReady(
      root,
      finishedWork,
      recoverableErrors,
      transitions,
      didIncludeRenderPhaseUpdate,
      lanes,
      spawnedLane
    ) {
      // TODO: Combine retry throttling with Suspensey commits. Right now they run
      // one after the other.
      if (includesOnlyNonUrgentLanes(lanes)) {
        // the suspensey resources. The renderer is responsible for accumulating
        // all the load events. This all happens in a single synchronous
        // transaction, so it track state in its own module scope.

        accumulateSuspenseyCommit(finishedWork); // At the end, ask the renderer if it's ready to commit, or if we should
        // suspend. If it's not ready, it will return a callback to subscribe to
        // a ready event.

        var schedulePendingCommit = waitForCommitToBeReady();

        if (schedulePendingCommit !== null) {
          // NOTE: waitForCommitToBeReady returns a subscribe function so that we
          // only allocate a function if the commit isn't ready yet. The other
          // pattern would be to always pass a callback to waitForCommitToBeReady.
          // Not yet ready to commit. Delay the commit until the renderer notifies
          // us that it's ready. This will be canceled if we start work on the
          // root again.
          root.cancelPendingCommit = schedulePendingCommit(
            commitRoot.bind(
              null,
              root,
              recoverableErrors,
              transitions,
              didIncludeRenderPhaseUpdate
            )
          );
          markRootSuspended(root, lanes, spawnedLane);
          return;
        }
      } // Otherwise, commit immediately.

      commitRoot(
        root,
        recoverableErrors,
        transitions,
        didIncludeRenderPhaseUpdate,
        spawnedLane
      );
    }

    function isRenderConsistentWithExternalStores(finishedWork) {
      // Search the rendered tree for external store reads, and check whether the
      // stores were mutated in a concurrent event. Intentionally using an iterative
      // loop instead of recursion so we can exit early.
      var node = finishedWork;

      while (true) {
        if (node.flags & StoreConsistency) {
          var updateQueue = node.updateQueue;

          if (updateQueue !== null) {
            var checks = updateQueue.stores;

            if (checks !== null) {
              for (var i = 0; i < checks.length; i++) {
                var check = checks[i];
                var getSnapshot = check.getSnapshot;
                var renderedValue = check.value;

                try {
                  if (!objectIs(getSnapshot(), renderedValue)) {
                    // Found an inconsistent store.
                    return false;
                  }
                } catch (error) {
                  // If `getSnapshot` throws, return `false`. This will schedule
                  // a re-render, and the error will be rethrown during render.
                  return false;
                }
              }
            }
          }
        }

        var child = node.child;

        if (node.subtreeFlags & StoreConsistency && child !== null) {
          child.return = node;
          node = child;
          continue;
        }

        if (node === finishedWork) {
          return true;
        }

        while (node.sibling === null) {
          if (node.return === null || node.return === finishedWork) {
            return true;
          }

          node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;
      } // Flow doesn't know this is unreachable, but eslint does
      // eslint-disable-next-line no-unreachable

      return true;
    } // The extra indirections around markRootUpdated and markRootSuspended is
    // needed to avoid a circular dependency between this module and
    // ReactFiberLane. There's probably a better way to split up these modules and
    // avoid this problem. Perhaps all the root-marking functions should move into
    // the work loop.

    function markRootUpdated(root, updatedLanes) {
      markRootUpdated$1(root, updatedLanes);
    }

    function markRootPinged(root, pingedLanes) {
      markRootPinged$1(root, pingedLanes);
    }

    function markRootSuspended(root, suspendedLanes, spawnedLane) {
      // When suspending, we should always exclude lanes that were pinged or (more
      // rarely, since we try to avoid it) updated during the render phase.
      suspendedLanes = removeLanes(
        suspendedLanes,
        workInProgressRootPingedLanes
      );
      suspendedLanes = removeLanes(
        suspendedLanes,
        workInProgressRootInterleavedUpdatedLanes
      );

      markRootSuspended$1(root, suspendedLanes, spawnedLane);
    } // This is the entry point for synchronous tasks that don't go
    // through Scheduler

    function performSyncWorkOnRoot(root, lanes) {
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error("Should not already be working.");
      }

      var didFlushPassiveEffects = flushPassiveEffects();

      if (didFlushPassiveEffects) {
        // If passive effects were flushed, exit to the outer work loop in the root
        // scheduler, so we can recompute the priority.
        // TODO: We don't actually need this `ensureRootIsScheduled` call because
        // this path is only reachable if the root is already part of the schedule.
        // I'm including it only for consistency with the other exit points from
        // this function. Can address in a subsequent refactor.
        ensureRootIsScheduled(root);
        return null;
      }

      {
        syncNestedUpdateFlag();
      }

      var exitStatus = renderRootSync(root, lanes);

      if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
        // If something threw an error, try rendering one more time. We'll render
        // synchronously to block concurrent data mutations, and we'll includes
        // all pending updates are included. If it still fails after the second
        // attempt, we'll give up and commit the resulting tree.
        var originallyAttemptedLanes = lanes;
        var errorRetryLanes = getLanesToRetrySynchronouslyOnError(
          root,
          originallyAttemptedLanes
        );

        if (errorRetryLanes !== NoLanes) {
          lanes = errorRetryLanes;
          exitStatus = recoverFromConcurrentError(
            root,
            originallyAttemptedLanes,
            errorRetryLanes
          );
        }
      }

      if (exitStatus === RootFatalErrored) {
        var fatalError = workInProgressRootFatalError;
        prepareFreshStack(root, NoLanes);
        markRootSuspended(root, lanes, NoLane);
        ensureRootIsScheduled(root);
        throw fatalError;
      }

      if (exitStatus === RootDidNotComplete) {
        // The render unwound without completing the tree. This happens in special
        // cases where need to exit the current render without producing a
        // consistent tree or committing.
        markRootSuspended(root, lanes, workInProgressDeferredLane);
        ensureRootIsScheduled(root);
        return null;
      } // We now have a consistent tree. Because this is a sync render, we
      // will commit it even if something suspended.

      var finishedWork = root.current.alternate;
      root.finishedWork = finishedWork;
      root.finishedLanes = lanes;
      commitRoot(
        root,
        workInProgressRootRecoverableErrors,
        workInProgressTransitions,
        workInProgressRootDidIncludeRecursiveRenderUpdate,
        workInProgressDeferredLane
      ); // Before exiting, make sure there's a callback scheduled for the next
      // pending level.

      ensureRootIsScheduled(root);
      return null;
    }
    function getExecutionContext() {
      return executionContext;
    }
    function batchedUpdates(fn, a) {
      var prevExecutionContext = executionContext;
      executionContext |= BatchedContext;

      try {
        return fn(a);
      } finally {
        executionContext = prevExecutionContext; // If there were legacy sync updates, flush them at the end of the outer
        // most batchedUpdates-like method.

        if (
          executionContext === NoContext && // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
          !ReactCurrentActQueue.isBatchingLegacy
        ) {
          resetRenderTimer();
          flushSyncWorkOnLegacyRootsOnly();
        }
      }
    }
    // Warning, this opts-out of checking the function body.
    // eslint-disable-next-line no-unused-vars
    // eslint-disable-next-line no-redeclare
    // eslint-disable-next-line no-redeclare

    function flushSync(fn) {
      // In legacy mode, we flush pending passive effects at the beginning of the
      // next event, not at the end of the previous one.
      if (
        rootWithPendingPassiveEffects !== null &&
        rootWithPendingPassiveEffects.tag === LegacyRoot &&
        (executionContext & (RenderContext | CommitContext)) === NoContext
      ) {
        flushPassiveEffects();
      }

      var prevExecutionContext = executionContext;
      executionContext |= BatchedContext;
      var prevTransition = ReactCurrentBatchConfig.transition;
      var previousPriority = getCurrentUpdatePriority();

      try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority(DiscreteEventPriority);

        if (fn) {
          return fn();
        } else {
          return undefined;
        }
      } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
        executionContext = prevExecutionContext; // Flush the immediate callbacks that were scheduled during this batch.
        // Note that this will happen even if batchedUpdates is higher up
        // the stack.

        if (
          (executionContext & (RenderContext | CommitContext)) ===
          NoContext
        ) {
          flushSyncWorkOnAllRoots();
        }
      }
    }
    // hidden subtree. The stack logic is managed there because that's the only
    // place that ever modifies it. Which module it lives in doesn't matter for
    // performance because this function will get inlined regardless

    function setEntangledRenderLanes(newEntangledRenderLanes) {
      entangledRenderLanes = newEntangledRenderLanes;
    }
    function getEntangledRenderLanes() {
      return entangledRenderLanes;
    }

    function resetWorkInProgressStack() {
      if (workInProgress === null) return;
      var interruptedWork;

      if (workInProgressSuspendedReason === NotSuspended) {
        // Normal case. Work-in-progress hasn't started yet. Unwind all
        // its parents.
        interruptedWork = workInProgress.return;
      } else {
        // Work-in-progress is in suspended state. Reset the work loop and unwind
        // both the suspended fiber and all its parents.
        resetSuspendedWorkLoopOnUnwind(workInProgress);
        interruptedWork = workInProgress;
      }

      while (interruptedWork !== null) {
        var current = interruptedWork.alternate;
        unwindInterruptedWork(current, interruptedWork);
        interruptedWork = interruptedWork.return;
      }

      workInProgress = null;
    }

    function prepareFreshStack(root, lanes) {
      root.finishedWork = null;
      root.finishedLanes = NoLanes;
      var timeoutHandle = root.timeoutHandle;

      if (timeoutHandle !== noTimeout) {
        // The root previous suspended and scheduled a timeout to commit a fallback
        // state. Now that we have additional work, cancel the timeout.
        root.timeoutHandle = noTimeout; // $FlowFixMe[incompatible-call] Complains noTimeout is not a TimeoutID, despite the check above

        cancelTimeout(timeoutHandle);
      }

      var cancelPendingCommit = root.cancelPendingCommit;

      if (cancelPendingCommit !== null) {
        root.cancelPendingCommit = null;
        cancelPendingCommit();
      }

      resetWorkInProgressStack();
      workInProgressRoot = root;
      var rootWorkInProgress = createWorkInProgress(root.current, null);
      workInProgress = rootWorkInProgress;
      workInProgressRootRenderLanes = lanes;
      workInProgressSuspendedReason = NotSuspended;
      workInProgressThrownValue = null;
      workInProgressRootDidAttachPingListener = false;
      workInProgressRootExitStatus = RootInProgress;
      workInProgressRootFatalError = null;
      workInProgressRootSkippedLanes = NoLanes;
      workInProgressRootInterleavedUpdatedLanes = NoLanes;
      workInProgressRootPingedLanes = NoLanes;
      workInProgressDeferredLane = NoLane;
      workInProgressRootConcurrentErrors = null;
      workInProgressRootRecoverableErrors = null;
      workInProgressRootDidIncludeRecursiveRenderUpdate = false; // Get the lanes that are entangled with whatever we're about to render. We
      // track these separately so we can distinguish the priority of the render
      // task from the priority of the lanes it is entangled with. For example, a
      // transition may not be allowed to finish unless it includes the Sync lane,
      // which is currently suspended. We should be able to render the Transition
      // and Sync lane in the same batch, but at Transition priority, because the
      // Sync lane already suspended.

      entangledRenderLanes = getEntangledLanes(root, lanes);
      finishQueueingConcurrentUpdates();

      {
        ReactStrictModeWarnings.discardPendingWarnings();
      }

      return rootWorkInProgress;
    }

    function resetSuspendedWorkLoopOnUnwind(fiber) {
      // Reset module-level state that was set during the render phase.
      resetContextDependencies();
      resetHooksOnUnwind(fiber);
      resetChildReconcilerOnUnwind();
    }

    function handleThrow(root, thrownValue) {
      // A component threw an exception. Usually this is because it suspended, but
      // it also includes regular program errors.
      //
      // We're either going to unwind the stack to show a Suspense or error
      // boundary, or we're going to replay the component again. Like after a
      // promise resolves.
      //
      // Until we decide whether we're going to unwind or replay, we should preserve
      // the current state of the work loop without resetting anything.
      //
      // If we do decide to unwind the stack, module-level variables will be reset
      // in resetSuspendedWorkLoopOnUnwind.
      // These should be reset immediately because they're only supposed to be set
      // when React is executing user code.
      resetHooksAfterThrow();
      resetCurrentFiber();
      ReactCurrentOwner$1.current = null;

      if (thrownValue === SuspenseException) {
        // This is a special type of exception used for Suspense. For historical
        // reasons, the rest of the Suspense implementation expects the thrown value
        // to be a thenable, because before `use` existed that was the (unstable)
        // API for suspending. This implementation detail can change later, once we
        // deprecate the old API in favor of `use`.
        thrownValue = getSuspendedThenable();
        workInProgressSuspendedReason =
          shouldRemainOnPreviousScreen() && // Check if there are other pending updates that might possibly unblock this
          // component from suspending. This mirrors the check in
          // renderDidSuspendDelayIfPossible. We should attempt to unify them somehow.
          // TODO: Consider unwinding immediately, using the
          // SuspendedOnHydration mechanism.
          !includesNonIdleWork(workInProgressRootSkippedLanes) &&
          !includesNonIdleWork(workInProgressRootInterleavedUpdatedLanes) // Suspend work loop until data resolves
            ? SuspendedOnData // Don't suspend work loop, except to check if the data has
            : // immediately resolved (i.e. in a microtask). Otherwise, trigger the
              // nearest Suspense fallback.
              SuspendedOnImmediate;
      } else if (thrownValue === SuspenseyCommitException) {
        thrownValue = getSuspendedThenable();
        workInProgressSuspendedReason = SuspendedOnInstance;
      } else if (thrownValue === SelectiveHydrationException) {
        // An update flowed into a dehydrated boundary. Before we can apply the
        // update, we need to finish hydrating. Interrupt the work-in-progress
        // render so we can restart at the hydration lane.
        //
        // The ideal implementation would be able to switch contexts without
        // unwinding the current stack.
        //
        // We could name this something more general but as of now it's the only
        // case where we think this should happen.
        workInProgressSuspendedReason = SuspendedOnHydration;
      } else {
        // This is a regular error.
        var isWakeable =
          thrownValue !== null &&
          typeof thrownValue === "object" &&
          typeof thrownValue.then === "function";
        workInProgressSuspendedReason = isWakeable // A wakeable object was thrown by a legacy Suspense implementation.
          ? // This has slightly different behavior than suspending with `use`.
            SuspendedOnDeprecatedThrowPromise // This is a regular error. If something earlier in the component already
          : // suspended, we must clear the thenable state to unblock the work loop.
            SuspendedOnError;
      }

      workInProgressThrownValue = thrownValue;
      var erroredWork = workInProgress;

      if (erroredWork === null) {
        // This is a fatal error
        workInProgressRootExitStatus = RootFatalErrored;
        workInProgressRootFatalError = thrownValue;
        return;
      }

      if (erroredWork.mode & ProfileMode) {
        // Record the time spent rendering before an error was thrown. This
        // avoids inaccurate Profiler durations in the case of a
        // suspended render.
        stopProfilerTimerIfRunningAndRecordDelta(erroredWork, true);
      }
    }

    function shouldRemainOnPreviousScreen() {
      // This is asking whether it's better to suspend the transition and remain
      // on the previous screen, versus showing a fallback as soon as possible. It
      // takes into account both the priority of render and also whether showing a
      // fallback would produce a desirable user experience.
      var handler = getSuspenseHandler();

      if (handler === null) {
        // There's no Suspense boundary that can provide a fallback. We have no
        // choice but to remain on the previous screen.
        // NOTE: We do this even for sync updates, for lack of any better option. In
        // the future, we may change how we handle this, like by putting the whole
        // root into a "detached" mode.
        return true;
      } // TODO: Once `use` has fully replaced the `throw promise` pattern, we should
      // be able to remove the equivalent check in finishConcurrentRender, and rely
      // just on this one.

      if (includesOnlyTransitions(workInProgressRootRenderLanes)) {
        if (getShellBoundary() === null) {
          // We're rendering inside the "shell" of the app. Activating the nearest
          // fallback would cause visible content to disappear. It's better to
          // suspend the transition and remain on the previous screen.
          return true;
        } else {
          // We're rendering content that wasn't part of the previous screen.
          // Rather than block the transition, it's better to show a fallback as
          // soon as possible. The appearance of any nested fallbacks will be
          // throttled to avoid jank.
          return false;
        }
      }

      if (
        includesOnlyRetries(workInProgressRootRenderLanes) || // In this context, an OffscreenLane counts as a Retry
        // TODO: It's become increasingly clear that Retries and Offscreen are
        // deeply connected. They probably can be unified further.
        includesSomeLane(workInProgressRootRenderLanes, OffscreenLane)
      ) {
        // During a retry, we can suspend rendering if the nearest Suspense boundary
        // is the boundary of the "shell", because we're guaranteed not to block
        // any new content from appearing.
        //
        // The reason we must check if this is a retry is because it guarantees
        // that suspending the work loop won't block an actual update, because
        // retries don't "update" anything; they fill in fallbacks that were left
        // behind by a previous transition.
        return handler === getShellBoundary();
      } // For all other Lanes besides Transitions and Retries, we should not wait
      // for the data to load.

      return false;
    }

    function pushDispatcher(container) {
      var prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = ContextOnlyDispatcher;

      if (prevDispatcher === null) {
        // The React isomorphic package does not include a default dispatcher.
        // Instead the first renderer will lazily attach one, in order to give
        // nicer error messages.
        return ContextOnlyDispatcher;
      } else {
        return prevDispatcher;
      }
    }

    function popDispatcher(prevDispatcher) {
      ReactCurrentDispatcher.current = prevDispatcher;
    }

    function markCommitTimeOfFallback() {
      globalMostRecentFallbackTime = now$1();
    }
    function markSkippedUpdateLanes(lane) {
      workInProgressRootSkippedLanes = mergeLanes(
        lane,
        workInProgressRootSkippedLanes
      );
    }
    function renderDidSuspend() {
      if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootSuspended;
      }
    }
    function renderDidSuspendDelayIfPossible() {
      workInProgressRootExitStatus = RootSuspendedWithDelay; // Check if there are updates that we skipped tree that might have unblocked
      // this render.

      if (
        (includesNonIdleWork(workInProgressRootSkippedLanes) ||
          includesNonIdleWork(workInProgressRootInterleavedUpdatedLanes)) &&
        workInProgressRoot !== null
      ) {
        // Mark the current render as suspended so that we switch to working on
        // the updates that were skipped. Usually we only suspend at the end of
        // the render phase.
        // TODO: We should probably always mark the root as suspended immediately
        // (inside this function), since by suspending at the end of the render
        // phase introduces a potential mistake where we suspend lanes that were
        // pinged or updated while we were rendering.
        // TODO: Consider unwinding immediately, using the
        // SuspendedOnHydration mechanism.
        markRootSuspended(
          workInProgressRoot,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane
        );
      }
    }
    function renderDidError(error) {
      if (workInProgressRootExitStatus !== RootSuspendedWithDelay) {
        workInProgressRootExitStatus = RootErrored;
      }

      if (workInProgressRootConcurrentErrors === null) {
        workInProgressRootConcurrentErrors = [error];
      } else {
        workInProgressRootConcurrentErrors.push(error);
      }
    } // Called during render to determine if anything has suspended.
    // Returns false if we're not sure.

    function renderHasNotSuspendedYet() {
      // If something errored or completed, we can't really be sure,
      // so those are false.
      return workInProgressRootExitStatus === RootInProgress;
    } // TODO: Over time, this function and renderRootConcurrent have become more
    // and more similar. Not sure it makes sense to maintain forked paths. Consider
    // unifying them again.

    function renderRootSync(root, lanes) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher();
      // and prepare a fresh one. Otherwise we'll continue where we left off.

      if (
        workInProgressRoot !== root ||
        workInProgressRootRenderLanes !== lanes
      ) {
        {
          if (isDevToolsPresent) {
            var memoizedUpdaters = root.memoizedUpdaters;

            if (memoizedUpdaters.size > 0) {
              restorePendingUpdaters(root, workInProgressRootRenderLanes);
              memoizedUpdaters.clear();
            } // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
            // If we bailout on this work, we'll move them back (like above).
            // It's important to move them now in case the work spawns more work at the same priority with different updaters.
            // That way we can keep the current update and future updates separate.

            movePendingFibersToMemoized(root, lanes);
          }
        }

        workInProgressTransitions = getTransitionsForLanes();
        prepareFreshStack(root, lanes);
      }

      var didSuspendInShell = false;

      outer: do {
        try {
          if (
            workInProgressSuspendedReason !== NotSuspended &&
            workInProgress !== null
          ) {
            // The work loop is suspended. During a synchronous render, we don't
            // yield to the main thread. Immediately unwind the stack. This will
            // trigger either a fallback or an error boundary.
            // TODO: For discrete and "default" updates (anything that's not
            // flushSync), we want to wait for the microtasks the flush before
            // unwinding. Will probably implement this using renderRootConcurrent,
            // or merge renderRootSync and renderRootConcurrent into the same
            // function and fork the behavior some other way.
            var unitOfWork = workInProgress;
            var thrownValue = workInProgressThrownValue;

            switch (workInProgressSuspendedReason) {
              case SuspendedOnHydration: {
                // Selective hydration. An update flowed into a dehydrated tree.
                // Interrupt the current render so the work loop can switch to the
                // hydration lane.
                resetWorkInProgressStack();
                workInProgressRootExitStatus = RootDidNotComplete;
                break outer;
              }

              case SuspendedOnImmediate:
              case SuspendedOnData: {
                if (!didSuspendInShell && getSuspenseHandler() === null) {
                  didSuspendInShell = true;
                } // Intentional fallthrough
              }

              default: {
                // Unwind then continue with the normal work loop.
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
                break;
              }
            }
          }

          workLoopSync();
          break;
        } catch (thrownValue) {
          handleThrow(root, thrownValue);
        }
      } while (true); // Check if something suspended in the shell. We use this to detect an
      // infinite ping loop caused by an uncached promise.
      //
      // Only increment this counter once per synchronous render attempt across the
      // whole tree. Even if there are many sibling components that suspend, this
      // counter only gets incremented once.

      if (didSuspendInShell) {
        root.shellSuspendCounter++;
      }

      resetContextDependencies();
      executionContext = prevExecutionContext;
      popDispatcher(prevDispatcher);

      if (workInProgress !== null) {
        // This is a sync render, so we should have finished the whole tree.
        throw new Error(
          "Cannot commit an incomplete root. This error is likely caused by a " +
            "bug in React. Please file an issue."
        );
      }

      workInProgressRoot = null;
      workInProgressRootRenderLanes = NoLanes; // It's safe to process the queue now that the render phase is complete.

      finishQueueingConcurrentUpdates();
      return workInProgressRootExitStatus;
    } // The work loop is an extremely hot path. Tell Closure not to inline it.

    /** @noinline */

    function workLoopSync() {
      // Perform work without checking if we need to yield between fiber.
      while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
      }
    }

    function renderRootConcurrent(root, lanes) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher();
      // and prepare a fresh one. Otherwise we'll continue where we left off.

      if (
        workInProgressRoot !== root ||
        workInProgressRootRenderLanes !== lanes
      ) {
        {
          if (isDevToolsPresent) {
            var memoizedUpdaters = root.memoizedUpdaters;

            if (memoizedUpdaters.size > 0) {
              restorePendingUpdaters(root, workInProgressRootRenderLanes);
              memoizedUpdaters.clear();
            } // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
            // If we bailout on this work, we'll move them back (like above).
            // It's important to move them now in case the work spawns more work at the same priority with different updaters.
            // That way we can keep the current update and future updates separate.

            movePendingFibersToMemoized(root, lanes);
          }
        }

        workInProgressTransitions = getTransitionsForLanes();
        resetRenderTimer();
        prepareFreshStack(root, lanes);
      }

      outer: do {
        try {
          if (
            workInProgressSuspendedReason !== NotSuspended &&
            workInProgress !== null
          ) {
            // The work loop is suspended. We need to either unwind the stack or
            // replay the suspended component.
            var unitOfWork = workInProgress;
            var thrownValue = workInProgressThrownValue;

            resumeOrUnwind: switch (workInProgressSuspendedReason) {
              case SuspendedOnError: {
                // Unwind then continue with the normal work loop.
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
                break;
              }

              case SuspendedOnData: {
                var thenable = thrownValue;

                if (isThenableResolved(thenable)) {
                  // The data resolved. Try rendering the component again.
                  workInProgressSuspendedReason = NotSuspended;
                  workInProgressThrownValue = null;
                  replaySuspendedUnitOfWork(unitOfWork);
                  break;
                } // The work loop is suspended on data. We should wait for it to
                // resolve before continuing to render.
                // TODO: Handle the case where the promise resolves synchronously.
                // Usually this is handled when we instrument the promise to add a
                // `status` field, but if the promise already has a status, we won't
                // have added a listener until right here.

                var onResolution = function () {
                  // Check if the root is still suspended on this promise.
                  if (
                    workInProgressSuspendedReason === SuspendedOnData &&
                    workInProgressRoot === root
                  ) {
                    // Mark the root as ready to continue rendering.
                    workInProgressSuspendedReason = SuspendedAndReadyToContinue;
                  } // Ensure the root is scheduled. We should do this even if we're
                  // currently working on a different root, so that we resume
                  // rendering later.

                  ensureRootIsScheduled(root);
                };

                thenable.then(onResolution, onResolution);
                break outer;
              }

              case SuspendedOnImmediate: {
                // If this fiber just suspended, it's possible the data is already
                // cached. Yield to the main thread to give it a chance to ping. If
                // it does, we can retry immediately without unwinding the stack.
                workInProgressSuspendedReason = SuspendedAndReadyToContinue;
                break outer;
              }

              case SuspendedOnInstance: {
                workInProgressSuspendedReason =
                  SuspendedOnInstanceAndReadyToContinue;
                break outer;
              }

              case SuspendedAndReadyToContinue: {
                var _thenable = thrownValue;

                if (isThenableResolved(_thenable)) {
                  // The data resolved. Try rendering the component again.
                  workInProgressSuspendedReason = NotSuspended;
                  workInProgressThrownValue = null;
                  replaySuspendedUnitOfWork(unitOfWork);
                } else {
                  // Otherwise, unwind then continue with the normal work loop.
                  workInProgressSuspendedReason = NotSuspended;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
                }

                break;
              }

              case SuspendedOnInstanceAndReadyToContinue: {
                switch (workInProgress.tag) {
                  case HostComponent:
                  case HostHoistable:
                  case HostSingleton: {
                    // Before unwinding the stack, check one more time if the
                    // instance is ready. It may have loaded when React yielded to
                    // the main thread.
                    // Assigning this to a constant so Flow knows the binding won't
                    // be mutated by `preloadInstance`.
                    var hostFiber = workInProgress;
                    var type = hostFiber.type;
                    var props = hostFiber.pendingProps;
                    var isReady = preloadInstance(type, props);

                    if (isReady) {
                      // The data resolved. Resume the work loop as if nothing
                      // suspended. Unlike when a user component suspends, we don't
                      // have to replay anything because the host fiber
                      // already completed.
                      workInProgressSuspendedReason = NotSuspended;
                      workInProgressThrownValue = null;
                      var sibling = hostFiber.sibling;

                      if (sibling !== null) {
                        workInProgress = sibling;
                      } else {
                        var returnFiber = hostFiber.return;

                        if (returnFiber !== null) {
                          workInProgress = returnFiber;
                          completeUnitOfWork(returnFiber);
                        } else {
                          workInProgress = null;
                        }
                      }

                      break resumeOrUnwind;
                    }

                    break;
                  }

                  default: {
                    // This will fail gracefully but it's not correct, so log a
                    // warning in dev.
                    if (true) {
                      error(
                        "Unexpected type of fiber triggered a suspensey commit. " +
                          "This is a bug in React."
                      );
                    }

                    break;
                  }
                } // Otherwise, unwind then continue with the normal work loop.

                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
                break;
              }

              case SuspendedOnDeprecatedThrowPromise: {
                // Suspended by an old implementation that uses the `throw promise`
                // pattern. The newer replaying behavior can cause subtle issues
                // like infinite ping loops. So we maintain the old behavior and
                // always unwind.
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
                break;
              }

              case SuspendedOnHydration: {
                // Selective hydration. An update flowed into a dehydrated tree.
                // Interrupt the current render so the work loop can switch to the
                // hydration lane.
                resetWorkInProgressStack();
                workInProgressRootExitStatus = RootDidNotComplete;
                break outer;
              }

              default: {
                throw new Error(
                  "Unexpected SuspendedReason. This is a bug in React."
                );
              }
            }
          }

          if (true && ReactCurrentActQueue.current !== null) {
            // `act` special case: If we're inside an `act` scope, don't consult
            // `shouldYield`. Always keep working until the render is complete.
            // This is not just an optimization: in a unit test environment, we
            // can't trust the result of `shouldYield`, because the host I/O is
            // likely mocked.
            workLoopSync();
          } else {
            workLoopConcurrent();
          }

          break;
        } catch (thrownValue) {
          handleThrow(root, thrownValue);
        }
      } while (true);

      resetContextDependencies();
      popDispatcher(prevDispatcher);
      executionContext = prevExecutionContext;

      if (workInProgress !== null) {
        return RootInProgress;
      } else {
        workInProgressRoot = null;
        workInProgressRootRenderLanes = NoLanes; // It's safe to process the queue now that the render phase is complete.

        finishQueueingConcurrentUpdates(); // Return the final exit status.

        return workInProgressRootExitStatus;
      }
    }
    /** @noinline */

    function workLoopConcurrent() {
      // Perform work until Scheduler asks us to yield
      while (workInProgress !== null && !shouldYield()) {
        // $FlowFixMe[incompatible-call] found when upgrading Flow
        performUnitOfWork(workInProgress);
      }
    }

    function performUnitOfWork(unitOfWork) {
      // The current, flushed, state of this fiber is the alternate. Ideally
      // nothing should rely on this, but relying on it here means that we don't
      // need an additional field on the work in progress.
      var current = unitOfWork.alternate;
      setCurrentFiber(unitOfWork);
      var next;

      if ((unitOfWork.mode & ProfileMode) !== NoMode) {
        startProfilerTimer(unitOfWork);
        next = beginWork(current, unitOfWork, entangledRenderLanes);
        stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
      } else {
        next = beginWork(current, unitOfWork, entangledRenderLanes);
      }

      resetCurrentFiber();
      unitOfWork.memoizedProps = unitOfWork.pendingProps;

      if (next === null) {
        // If this doesn't spawn new work, complete the current work.
        completeUnitOfWork(unitOfWork);
      } else {
        workInProgress = next;
      }

      ReactCurrentOwner$1.current = null;
    }

    function replaySuspendedUnitOfWork(unitOfWork) {
      // This is a fork of performUnitOfWork specifcally for replaying a fiber that
      // just suspended.
      //
      var current = unitOfWork.alternate;
      setCurrentFiber(unitOfWork);
      var next;
      setCurrentFiber(unitOfWork);
      var isProfilingMode = (unitOfWork.mode & ProfileMode) !== NoMode;

      if (isProfilingMode) {
        startProfilerTimer(unitOfWork);
      }

      switch (unitOfWork.tag) {
        case IndeterminateComponent: {
          // Because it suspended with `use`, we can assume it's a
          // function component.
          unitOfWork.tag = FunctionComponent; // Fallthrough to the next branch.
        }

        case SimpleMemoComponent:
        case FunctionComponent: {
          // Resolve `defaultProps`. This logic is copied from `beginWork`.
          // TODO: Consider moving this switch statement into that module. Also,
          // could maybe use this as an opportunity to say `use` doesn't work with
          // `defaultProps` :)
          var Component = unitOfWork.type;
          var unresolvedProps = unitOfWork.pendingProps;
          var resolvedProps =
            unitOfWork.elementType === Component
              ? unresolvedProps
              : resolveDefaultProps(Component, unresolvedProps);
          var context;

          next = replayFunctionComponent(
            current,
            unitOfWork,
            resolvedProps,
            Component,
            context,
            workInProgressRootRenderLanes
          );
          break;
        }

        case ForwardRef: {
          // Resolve `defaultProps`. This logic is copied from `beginWork`.
          // TODO: Consider moving this switch statement into that module. Also,
          // could maybe use this as an opportunity to say `use` doesn't work with
          // `defaultProps` :)
          var _Component = unitOfWork.type.render;
          var _unresolvedProps = unitOfWork.pendingProps;

          var _resolvedProps =
            unitOfWork.elementType === _Component
              ? _unresolvedProps
              : resolveDefaultProps(_Component, _unresolvedProps);

          next = replayFunctionComponent(
            current,
            unitOfWork,
            _resolvedProps,
            _Component,
            unitOfWork.ref,
            workInProgressRootRenderLanes
          );
          break;
        }

        case HostComponent: {
          // Some host components are stateful (that's how we implement form
          // actions) but we don't bother to reuse the memoized state because it's
          // not worth the extra code. The main reason to reuse the previous hooks
          // is to reuse uncached promises, but we happen to know that the only
          // promises that a host component might suspend on are definitely cached
          // because they are controlled by us. So don't bother.
          resetHooksOnUnwind(unitOfWork); // Fallthrough to the next branch.
        }

        default: {
          // Other types besides function components are reset completely before
          // being replayed. Currently this only happens when a Usable type is
          // reconciled — the reconciler will suspend.
          //
          // We reset the fiber back to its original state; however, this isn't
          // a full "unwind" because we're going to reuse the promises that were
          // reconciled previously. So it's intentional that we don't call
          // resetSuspendedWorkLoopOnUnwind here.
          unwindInterruptedWork(current, unitOfWork);
          unitOfWork = workInProgress = resetWorkInProgress(
            unitOfWork,
            entangledRenderLanes
          );
          next = beginWork(current, unitOfWork, entangledRenderLanes);
          break;
        }
      }

      if (isProfilingMode) {
        stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
      } // The begin phase finished successfully without suspending. Return to the
      // normal work loop.

      resetCurrentFiber();
      unitOfWork.memoizedProps = unitOfWork.pendingProps;

      if (next === null) {
        // If this doesn't spawn new work, complete the current work.
        completeUnitOfWork(unitOfWork);
      } else {
        workInProgress = next;
      }

      ReactCurrentOwner$1.current = null;
    }

    function throwAndUnwindWorkLoop(root, unitOfWork, thrownValue) {
      // This is a fork of performUnitOfWork specifcally for unwinding a fiber
      // that threw an exception.
      //
      // Return to the normal work loop. This will unwind the stack, and potentially
      // result in showing a fallback.
      resetSuspendedWorkLoopOnUnwind(unitOfWork);
      var returnFiber = unitOfWork.return;

      try {
        // Find and mark the nearest Suspense or error boundary that can handle
        // this "exception".
        var didFatal = throwException(
          root,
          returnFiber,
          unitOfWork,
          thrownValue,
          workInProgressRootRenderLanes
        );

        if (didFatal) {
          panicOnRootError(thrownValue);
          return;
        }
      } catch (error) {
        // We had trouble processing the error. An example of this happening is
        // when accessing the `componentDidCatch` property of an error boundary
        // throws an error. A weird edge case. There's a regression test for this.
        // To prevent an infinite loop, bubble the error up to the next parent.
        if (returnFiber !== null) {
          workInProgress = returnFiber;
          throw error;
        } else {
          panicOnRootError(thrownValue);
          return;
        }
      }

      if (unitOfWork.flags & Incomplete) {
        // Unwind the stack until we reach the nearest boundary.
        unwindUnitOfWork(unitOfWork);
      } else {
        // Although the fiber suspended, we're intentionally going to commit it in
        // an inconsistent state. We can do this safely in cases where we know the
        // inconsistent tree will be hidden.
        //
        // This currently only applies to Legacy Suspense implementation, but we may
        // port a version of this to concurrent roots, too, when performing a
        // synchronous render. Because that will allow us to mutate the tree as we
        // go instead of buffering mutations until the end. Though it's unclear if
        // this particular path is how that would be implemented.
        completeUnitOfWork(unitOfWork);
      }
    }

    function panicOnRootError(error) {
      // There's no ancestor that can handle this exception. This should never
      // happen because the root is supposed to capture all errors that weren't
      // caught by an error boundary. This is a fatal error, or panic condition,
      // because we've run out of ways to recover.
      workInProgressRootExitStatus = RootFatalErrored;
      workInProgressRootFatalError = error; // Set `workInProgress` to null. This represents advancing to the next
      // sibling, or the parent if there are no siblings. But since the root
      // has no siblings nor a parent, we set it to null. Usually this is
      // handled by `completeUnitOfWork` or `unwindWork`, but since we're
      // intentionally not calling those, we need set it here.
      // TODO: Consider calling `unwindWork` to pop the contexts.

      workInProgress = null;
    }

    function completeUnitOfWork(unitOfWork) {
      // Attempt to complete the current unit of work, then move to the next
      // sibling. If there are no more siblings, return to the parent fiber.
      var completedWork = unitOfWork;

      do {
        {
          if ((completedWork.flags & Incomplete) !== NoFlags$1) {
            // NOTE: If we re-enable sibling prerendering in some cases, this branch
            // is where we would switch to the unwinding path.
            error(
              "Internal React error: Expected this fiber to be complete, but " +
                "it isn't. It should have been unwound. This is a bug in React."
            );
          }
        } // The current, flushed, state of this fiber is the alternate. Ideally
        // nothing should rely on this, but relying on it here means that we don't
        // need an additional field on the work in progress.

        var current = completedWork.alternate;
        var returnFiber = completedWork.return;
        setCurrentFiber(completedWork);
        var next = void 0;

        if ((completedWork.mode & ProfileMode) === NoMode) {
          next = completeWork(current, completedWork, entangledRenderLanes);
        } else {
          startProfilerTimer(completedWork);
          next = completeWork(current, completedWork, entangledRenderLanes); // Update render duration assuming we didn't error.

          stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
        }

        resetCurrentFiber();

        if (next !== null) {
          // Completing this fiber spawned new work. Work on that next.
          workInProgress = next;
          return;
        }

        var siblingFiber = completedWork.sibling;

        if (siblingFiber !== null) {
          // If there is more work to do in this returnFiber, do that next.
          workInProgress = siblingFiber;
          return;
        } // Otherwise, return to the parent
        // $FlowFixMe[incompatible-type] we bail out when we get a null

        completedWork = returnFiber; // Update the next thing we're working on in case something throws.

        workInProgress = completedWork;
      } while (completedWork !== null); // We've reached the root.

      if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootCompleted;
      }
    }

    function unwindUnitOfWork(unitOfWork) {
      var incompleteWork = unitOfWork;

      do {
        // The current, flushed, state of this fiber is the alternate. Ideally
        // nothing should rely on this, but relying on it here means that we don't
        // need an additional field on the work in progress.
        var current = incompleteWork.alternate; // This fiber did not complete because something threw. Pop values off
        // the stack without entering the complete phase. If this is a boundary,
        // capture values if possible.

        var next = unwindWork(current, incompleteWork); // Because this fiber did not complete, don't reset its lanes.

        if (next !== null) {
          // Found a boundary that can handle this exception. Re-renter the
          // begin phase. This branch will return us to the normal work loop.
          //
          // Since we're restarting, remove anything that is not a host effect
          // from the effect tag.
          next.flags &= HostEffectMask;
          workInProgress = next;
          return;
        } // Keep unwinding until we reach either a boundary or the root.

        if ((incompleteWork.mode & ProfileMode) !== NoMode) {
          // Record the render duration for the fiber that errored.
          stopProfilerTimerIfRunningAndRecordDelta(incompleteWork, false); // Include the time spent working on failed children before continuing.

          var actualDuration = incompleteWork.actualDuration;
          var child = incompleteWork.child;

          while (child !== null) {
            // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
            actualDuration += child.actualDuration;
            child = child.sibling;
          }

          incompleteWork.actualDuration = actualDuration;
        } // TODO: Once we stop prerendering siblings, instead of resetting the parent
        // of the node being unwound, we should be able to reset node itself as we
        // unwind the stack. Saves an additional null check.

        var returnFiber = incompleteWork.return;

        if (returnFiber !== null) {
          // Mark the parent fiber as incomplete and clear its subtree flags.
          // TODO: Once we stop prerendering siblings, we may be able to get rid of
          // the Incomplete flag because unwinding to the nearest boundary will
          // happen synchronously.
          returnFiber.flags |= Incomplete;
          returnFiber.subtreeFlags = NoFlags$1;
          returnFiber.deletions = null;
        } // NOTE: If we re-enable sibling prerendering in some cases, here we
        // would switch to the normal completion path: check if a sibling
        // exists, and if so, begin work on it.
        // Otherwise, return to the parent
        // $FlowFixMe[incompatible-type] we bail out when we get a null

        incompleteWork = returnFiber; // Update the next thing we're working on in case something throws.

        workInProgress = incompleteWork;
      } while (incompleteWork !== null); // We've unwound all the way to the root.

      workInProgressRootExitStatus = RootDidNotComplete;
      workInProgress = null;
    }

    function commitRoot(
      root,
      recoverableErrors,
      transitions,
      didIncludeRenderPhaseUpdate,
      spawnedLane
    ) {
      // TODO: This no longer makes any sense. We already wrap the mutation and
      // layout phases. Should be able to remove.
      var previousUpdateLanePriority = getCurrentUpdatePriority();
      var prevTransition = ReactCurrentBatchConfig.transition;

      try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority(DiscreteEventPriority);
        commitRootImpl(
          root,
          recoverableErrors,
          transitions,
          didIncludeRenderPhaseUpdate,
          previousUpdateLanePriority,
          spawnedLane
        );
      } finally {
        ReactCurrentBatchConfig.transition = prevTransition;
        setCurrentUpdatePriority(previousUpdateLanePriority);
      }

      return null;
    }

    function commitRootImpl(
      root,
      recoverableErrors,
      transitions,
      didIncludeRenderPhaseUpdate,
      renderPriorityLevel,
      spawnedLane
    ) {
      do {
        // `flushPassiveEffects` will call `flushSyncUpdateQueue` at the end, which
        // means `flushPassiveEffects` will sometimes result in additional
        // passive effects. So we need to keep flushing in a loop until there are
        // no more pending effects.
        // TODO: Might be better if `flushPassiveEffects` did not automatically
        // flush synchronous work at the end, to avoid factoring hazards like this.
        flushPassiveEffects();
      } while (rootWithPendingPassiveEffects !== null);

      flushRenderPhaseStrictModeWarningsInDEV();

      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error("Should not already be working.");
      }

      var finishedWork = root.finishedWork;
      var lanes = root.finishedLanes;

      if (finishedWork === null) {
        return null;
      } else {
        {
          if (lanes === NoLanes) {
            error(
              "root.finishedLanes should not be empty during a commit. This is a " +
                "bug in React."
            );
          }
        }
      }

      root.finishedWork = null;
      root.finishedLanes = NoLanes;

      if (finishedWork === root.current) {
        throw new Error(
          "Cannot commit the same tree as before. This error is likely caused by " +
            "a bug in React. Please file an issue."
        );
      } // commitRoot never returns a continuation; it always finishes synchronously.
      // So we can clear these now to allow a new callback to be scheduled.

      root.callbackNode = null;
      root.callbackPriority = NoLane;
      root.cancelPendingCommit = null; // Check which lanes no longer have any work scheduled on them, and mark
      // those as finished.

      var remainingLanes = mergeLanes(
        finishedWork.lanes,
        finishedWork.childLanes
      ); // Make sure to account for lanes that were updated by a concurrent event
      // during the render phase; don't mark them as finished.

      var concurrentlyUpdatedLanes = getConcurrentlyUpdatedLanes();
      remainingLanes = mergeLanes(remainingLanes, concurrentlyUpdatedLanes);
      markRootFinished(root, remainingLanes, spawnedLane); // Reset this before firing side effects so we can detect recursive updates.

      if (root === workInProgressRoot) {
        // We can reset these now that they are finished.
        workInProgressRoot = null;
        workInProgress = null;
        workInProgressRootRenderLanes = NoLanes;
      } // If there are pending passive effects, schedule a callback to process them.
      // Do this as early as possible, so it is queued before anything else that
      // might get scheduled in the commit phase. (See #16714.)
      // TODO: Delete all other places that schedule the passive effect callback
      // They're redundant.

      if (
        (finishedWork.subtreeFlags & PassiveMask) !== NoFlags$1 ||
        (finishedWork.flags & PassiveMask) !== NoFlags$1
      ) {
        if (!rootDoesHavePassiveEffects) {
          rootDoesHavePassiveEffects = true;
          scheduleCallback(NormalPriority, function () {
            flushPassiveEffects(); // This render triggered passive effects: release the root cache pool
            // *after* passive effects fire to avoid freeing a cache pool that may
            // be referenced by a node in the tree (HostRoot, Cache boundary etc)

            return null;
          });
        }
      } // Check if there are any effects in the whole tree.
      // TODO: This is left over from the effect list implementation, where we had
      // to check for the existence of `firstEffect` to satisfy Flow. I think the
      // only other reason this optimization exists is because it affects profiling.
      // Reconsider whether this is necessary.

      var subtreeHasEffects =
        (finishedWork.subtreeFlags &
          (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
        NoFlags$1;
      var rootHasEffect =
        (finishedWork.flags &
          (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
        NoFlags$1;

      if (subtreeHasEffects || rootHasEffect) {
        var prevTransition = ReactCurrentBatchConfig.transition;
        ReactCurrentBatchConfig.transition = null;
        var previousPriority = getCurrentUpdatePriority();
        setCurrentUpdatePriority(DiscreteEventPriority);
        var prevExecutionContext = executionContext;
        executionContext |= CommitContext; // Reset this to null before calling lifecycles

        ReactCurrentOwner$1.current = null; // The commit phase is broken into several sub-phases. We do a separate pass
        // of the effect list for each phase: all mutation effects come before all
        // layout effects, and so on.
        // The first phase a "before mutation" phase. We use this phase to read the
        // state of the host tree right before we mutate it. This is where
        // getSnapshotBeforeUpdate is called.

        commitBeforeMutationEffects(root, finishedWork);

        {
          // Mark the current commit time to be shared by all Profilers in this
          // batch. This enables them to be grouped later.
          recordCommitTime();
        } // The next phase is the mutation phase, where we mutate the host tree.

        commitMutationEffects(root, finishedWork, lanes);
        // the mutation phase, so that the previous tree is still current during
        // componentWillUnmount, but before the layout phase, so that the finished
        // work is current during componentDidMount/Update.

        root.current = finishedWork; // The next phase is the layout phase, where we call effects that read

        commitLayoutEffects(finishedWork, root, lanes);
        // opportunity to paint.

        requestPaint();
        executionContext = prevExecutionContext; // Reset the priority to the previous non-sync value.

        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
      } else {
        // No effects.
        root.current = finishedWork; // Measure these anyway so the flamegraph explicitly shows that there were
        // no effects.
        // TODO: Maybe there's a better way to report this.

        {
          recordCommitTime();
        }
      }

      var rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

      if (rootDoesHavePassiveEffects) {
        // This commit has passive effects. Stash a reference to them. But don't
        // schedule a callback until after flushing layout work.
        rootDoesHavePassiveEffects = false;
        rootWithPendingPassiveEffects = root;
        pendingPassiveEffectsLanes = lanes;
      } else {
        {
          nestedPassiveUpdateCount = 0;
          rootWithPassiveNestedUpdates = null;
        }
      } // Read this again, since an effect might have updated it

      remainingLanes = root.pendingLanes; // Check if there's remaining work on this root
      // TODO: This is part of the `componentDidCatch` implementation. Its purpose
      // is to detect whether something might have called setState inside
      // `componentDidCatch`. The mechanism is known to be flawed because `setState`
      // inside `componentDidCatch` is itself flawed — that's why we recommend
      // `getDerivedStateFromError` instead. However, it could be improved by
      // checking if remainingLanes includes Sync work, instead of whether there's
      // any work remaining at all (which would also include stuff like Suspense
      // retries or transitions). It's been like this for a while, though, so fixing
      // it probably isn't that urgent.

      if (remainingLanes === NoLanes) {
        // If there's no remaining work, we can clear the set of already failed
        // error boundaries.
        legacyErrorBoundariesThatAlreadyFailed = null;
      }

      {
        if (!rootDidHavePassiveEffects) {
          commitDoubleInvokeEffectsInDEV(root, false);
        }
      }

      onCommitRoot(finishedWork.stateNode, renderPriorityLevel);

      {
        if (isDevToolsPresent) {
          root.memoizedUpdaters.clear();
        }
      }
      // additional work on this root is scheduled.

      ensureRootIsScheduled(root);

      if (recoverableErrors !== null) {
        // There were errors during this render, but recovered from them without
        // needing to surface it to the UI. We log them here.
        var onRecoverableError = root.onRecoverableError;

        for (var i = 0; i < recoverableErrors.length; i++) {
          var recoverableError = recoverableErrors[i];
          var errorInfo = makeErrorInfo(
            recoverableError.digest,
            recoverableError.stack
          );
          onRecoverableError(recoverableError.value, errorInfo);
        }
      }

      if (hasUncaughtError) {
        hasUncaughtError = false;
        var error$1 = firstUncaughtError;
        firstUncaughtError = null;
        throw error$1;
      } // If the passive effects are the result of a discrete render, flush them
      // synchronously at the end of the current task so that the result is
      // immediately observable. Otherwise, we assume that they are not
      // order-dependent and do not need to be observed by external systems, so we
      // can wait until after paint.
      // TODO: We can optimize this by not scheduling the callback earlier. Since we
      // currently schedule the callback in multiple places, will wait until those
      // are consolidated.

      if (
        includesSyncLane(pendingPassiveEffectsLanes) &&
        root.tag !== LegacyRoot
      ) {
        flushPassiveEffects();
      } // Read this again, since a passive effect might have updated it

      remainingLanes = root.pendingLanes; // Check if this render scheduled a cascading synchronous update. This is a
      // heurstic to detect infinite update loops. We are intentionally excluding
      // hydration lanes in this check, because render triggered by selective
      // hydration is conceptually not an update.

      if (
        // Check if there was a recursive update spawned by this render, in either
        // the render phase or the commit phase. We track these explicitly because
        // we can't infer from the remaining lanes alone.
        // Was the finished render the result of an update (not hydration)?
        includesSomeLane(lanes, UpdateLanes) && // Did it schedule a sync update?
        includesSomeLane(remainingLanes, SyncUpdateLanes)
      ) {
        {
          markNestedUpdateScheduled();
        } // Count the number of times the root synchronously re-renders without
        // finishing. If there are too many, it indicates an infinite update loop.

        if (root === rootWithNestedUpdates) {
          nestedUpdateCount++;
        } else {
          nestedUpdateCount = 0;
          rootWithNestedUpdates = root;
        }
      } else {
        nestedUpdateCount = 0;
      } // If layout work was scheduled, flush it now.

      flushSyncWorkOnAllRoots();

      return null;
    }

    function makeErrorInfo(digest, componentStack) {
      {
        var errorInfo = {
          componentStack: componentStack,
          digest: digest
        };
        Object.defineProperty(errorInfo, "digest", {
          configurable: false,
          enumerable: true,
          get: function () {
            error(
              'You are accessing "digest" from the errorInfo object passed to onRecoverableError.' +
                " This property is deprecated and will be removed in a future version of React." +
                " To access the digest of an Error look for this property on the Error instance itself."
            );

            return digest;
          }
        });
        return errorInfo;
      }
    }

    function flushPassiveEffects() {
      // Returns whether passive effects were flushed.
      // TODO: Combine this check with the one in flushPassiveEFfectsImpl. We should
      // probably just combine the two functions. I believe they were only separate
      // in the first place because we used to wrap it with
      // `Scheduler.runWithPriority`, which accepts a function. But now we track the
      // priority within React itself, so we can mutate the variable directly.
      if (rootWithPendingPassiveEffects !== null) {
        var renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes);
        var priority = lowerEventPriority(DefaultEventPriority, renderPriority);
        var prevTransition = ReactCurrentBatchConfig.transition;
        var previousPriority = getCurrentUpdatePriority();

        try {
          ReactCurrentBatchConfig.transition = null;
          setCurrentUpdatePriority(priority);
          return flushPassiveEffectsImpl();
        } finally {
          setCurrentUpdatePriority(previousPriority);
          ReactCurrentBatchConfig.transition = prevTransition; // Once passive effects have run for the tree - giving components a
        }
      }

      return false;
    }
    function enqueuePendingPassiveProfilerEffect(fiber) {
      {
        pendingPassiveProfilerEffects.push(fiber);

        if (!rootDoesHavePassiveEffects) {
          rootDoesHavePassiveEffects = true;
          scheduleCallback(NormalPriority, function () {
            flushPassiveEffects();
            return null;
          });
        }
      }
    }

    function flushPassiveEffectsImpl() {
      if (rootWithPendingPassiveEffects === null) {
        return false;
      } // Cache and clear the transitions flag
      var root = rootWithPendingPassiveEffects;
      rootWithPendingPassiveEffects = null; // TODO: This is sometimes out of sync with rootWithPendingPassiveEffects.
      // Figure out why and fix it. It's not causing any known issues (probably
      // because it's only used for profiling), but it's a refactor hazard.

      pendingPassiveEffectsLanes = NoLanes;

      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error(
          "Cannot flush passive effects while already rendering."
        );
      }

      {
        isFlushingPassiveEffects = true;
        didScheduleUpdateDuringPassiveEffects = false;
      }

      var prevExecutionContext = executionContext;
      executionContext |= CommitContext;
      commitPassiveUnmountEffects(root.current);
      commitPassiveMountEffects(root, root.current); // TODO: Move to commitPassiveMountEffects

      {
        var profilerEffects = pendingPassiveProfilerEffects;
        pendingPassiveProfilerEffects = [];

        for (var i = 0; i < profilerEffects.length; i++) {
          var fiber = profilerEffects[i];
          commitPassiveEffectDurations(root, fiber);
        }
      }

      {
        commitDoubleInvokeEffectsInDEV(root, true);
      }

      executionContext = prevExecutionContext;
      flushSyncWorkOnAllRoots();

      {
        // If additional passive effects were scheduled, increment a counter. If this
        // exceeds the limit, we'll fire a warning.
        if (didScheduleUpdateDuringPassiveEffects) {
          if (root === rootWithPassiveNestedUpdates) {
            nestedPassiveUpdateCount++;
          } else {
            nestedPassiveUpdateCount = 0;
            rootWithPassiveNestedUpdates = root;
          }
        } else {
          nestedPassiveUpdateCount = 0;
        }

        isFlushingPassiveEffects = false;
        didScheduleUpdateDuringPassiveEffects = false;
      } // TODO: Move to commitPassiveMountEffects

      onPostCommitRoot(root);

      {
        var stateNode = root.current.stateNode;
        stateNode.effectDuration = 0;
        stateNode.passiveEffectDuration = 0;
      }

      return true;
    }

    function isAlreadyFailedLegacyErrorBoundary(instance) {
      return (
        legacyErrorBoundariesThatAlreadyFailed !== null &&
        legacyErrorBoundariesThatAlreadyFailed.has(instance)
      );
    }
    function markLegacyErrorBoundaryAsFailed(instance) {
      if (legacyErrorBoundariesThatAlreadyFailed === null) {
        legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
      } else {
        legacyErrorBoundariesThatAlreadyFailed.add(instance);
      }
    }

    function prepareToThrowUncaughtError(error) {
      if (!hasUncaughtError) {
        hasUncaughtError = true;
        firstUncaughtError = error;
      }
    }

    var onUncaughtError = prepareToThrowUncaughtError;

    function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
      var errorInfo = createCapturedValueAtFiber(error, sourceFiber);
      var update = createRootErrorUpdate(rootFiber, errorInfo, SyncLane);
      var root = enqueueUpdate(rootFiber, update, SyncLane);

      if (root !== null) {
        markRootUpdated(root, SyncLane);
        ensureRootIsScheduled(root);
      }
    }

    function captureCommitPhaseError(
      sourceFiber,
      nearestMountedAncestor,
      error$1
    ) {
      {
        setIsRunningInsertionEffect(false);
      }

      if (sourceFiber.tag === HostRoot) {
        // Error was thrown at the root. There is no parent, so the root
        // itself should capture it.
        captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error$1);
        return;
      }

      var fiber = nearestMountedAncestor;

      while (fiber !== null) {
        if (fiber.tag === HostRoot) {
          captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error$1);
          return;
        } else if (fiber.tag === ClassComponent) {
          var ctor = fiber.type;
          var instance = fiber.stateNode;

          if (
            typeof ctor.getDerivedStateFromError === "function" ||
            (typeof instance.componentDidCatch === "function" &&
              !isAlreadyFailedLegacyErrorBoundary(instance))
          ) {
            var errorInfo = createCapturedValueAtFiber(error$1, sourceFiber);
            var update = createClassErrorUpdate(fiber, errorInfo, SyncLane);
            var root = enqueueUpdate(fiber, update, SyncLane);

            if (root !== null) {
              markRootUpdated(root, SyncLane);
              ensureRootIsScheduled(root);
            }

            return;
          }
        }

        fiber = fiber.return;
      }

      {
        error(
          "Internal React error: Attempted to capture a commit phase error " +
            "inside a detached tree. This indicates a bug in React. Potential " +
            "causes include deleting the same fiber more than once, committing an " +
            "already-finished tree, or an inconsistent return pointer.\n\n" +
            "Error message:\n\n%s",
          error$1
        );
      }
    }
    function attachPingListener(root, wakeable, lanes) {
      // Attach a ping listener
      //
      // The data might resolve before we have a chance to commit the fallback. Or,
      // in the case of a refresh, we'll never commit a fallback. So we need to
      // attach a listener now. When it resolves ("pings"), we can decide whether to
      // try rendering the tree again.
      //
      // Only attach a listener if one does not already exist for the lanes
      // we're currently rendering (which acts like a "thread ID" here).
      //
      // We only need to do this in concurrent mode. Legacy Suspense always
      // commits fallbacks synchronously, so there are no pings.
      var pingCache = root.pingCache;
      var threadIDs;

      if (pingCache === null) {
        pingCache = root.pingCache = new PossiblyWeakMap();
        threadIDs = new Set();
        pingCache.set(wakeable, threadIDs);
      } else {
        threadIDs = pingCache.get(wakeable);

        if (threadIDs === undefined) {
          threadIDs = new Set();
          pingCache.set(wakeable, threadIDs);
        }
      }

      if (!threadIDs.has(lanes)) {
        workInProgressRootDidAttachPingListener = true; // Memoize using the thread ID to prevent redundant listeners.

        threadIDs.add(lanes);
        var ping = pingSuspendedRoot.bind(null, root, wakeable, lanes);

        {
          if (isDevToolsPresent) {
            // If we have pending work still, restore the original updaters
            restorePendingUpdaters(root, lanes);
          }
        }

        wakeable.then(ping, ping);
      }
    }

    function pingSuspendedRoot(root, wakeable, pingedLanes) {
      var pingCache = root.pingCache;

      if (pingCache !== null) {
        // The wakeable resolved, so we no longer need to memoize, because it will
        // never be thrown again.
        pingCache.delete(wakeable);
      }

      markRootPinged(root, pingedLanes);
      warnIfSuspenseResolutionNotWrappedWithActDEV(root);

      if (
        workInProgressRoot === root &&
        isSubsetOfLanes(workInProgressRootRenderLanes, pingedLanes)
      ) {
        // Received a ping at the same priority level at which we're currently
        // rendering. We might want to restart this render. This should mirror
        // the logic of whether or not a root suspends once it completes.
        // TODO: If we're rendering sync either due to Sync, Batched or expired,
        // we should probably never restart.
        // If we're suspended with delay, or if it's a retry, we'll always suspend
        // so we can always restart.
        if (
          workInProgressRootExitStatus === RootSuspendedWithDelay ||
          (workInProgressRootExitStatus === RootSuspended &&
            includesOnlyRetries(workInProgressRootRenderLanes) &&
            now$1() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS)
        ) {
          // Force a restart from the root by unwinding the stack. Unless this is
          // being called from the render phase, because that would cause a crash.
          if ((executionContext & RenderContext) === NoContext) {
            prepareFreshStack(root, NoLanes);
          }
        } else {
          // Even though we can't restart right now, we might get an
          // opportunity later. So we mark this render as having a ping.
          workInProgressRootPingedLanes = mergeLanes(
            workInProgressRootPingedLanes,
            pingedLanes
          );
        }
      }

      ensureRootIsScheduled(root);
    }

    function retryTimedOutBoundary(boundaryFiber, retryLane) {
      // The boundary fiber (a Suspense component or SuspenseList component)
      // previously was rendered in its fallback state. One of the promises that
      // suspended it has resolved, which means at least part of the tree was
      // likely unblocked. Try rendering again, at a new lanes.
      if (retryLane === NoLane) {
        // TODO: Assign this to `suspenseState.retryLane`? to avoid
        // unnecessary entanglement?
        retryLane = requestRetryLane(boundaryFiber);
      } // TODO: Special case idle priority?

      var root = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);

      if (root !== null) {
        markRootUpdated(root, retryLane);
        ensureRootIsScheduled(root);
      }
    }

    function retryDehydratedSuspenseBoundary(boundaryFiber) {
      var suspenseState = boundaryFiber.memoizedState;
      var retryLane = NoLane;

      if (suspenseState !== null) {
        retryLane = suspenseState.retryLane;
      }

      retryTimedOutBoundary(boundaryFiber, retryLane);
    }
    function resolveRetryWakeable(boundaryFiber, wakeable) {
      var retryLane = NoLane; // Default

      var retryCache;

      switch (boundaryFiber.tag) {
        case SuspenseComponent:
          retryCache = boundaryFiber.stateNode;
          var suspenseState = boundaryFiber.memoizedState;

          if (suspenseState !== null) {
            retryLane = suspenseState.retryLane;
          }

          break;

        case SuspenseListComponent:
          retryCache = boundaryFiber.stateNode;
          break;

        case OffscreenComponent: {
          var instance = boundaryFiber.stateNode;
          retryCache = instance._retryCache;
          break;
        }

        default:
          throw new Error(
            "Pinged unknown suspense boundary type. " +
              "This is probably a bug in React."
          );
      }

      if (retryCache !== null) {
        // The wakeable resolved, so we no longer need to memoize, because it will
        // never be thrown again.
        retryCache.delete(wakeable);
      }

      retryTimedOutBoundary(boundaryFiber, retryLane);
    }
    function throwIfInfiniteUpdateLoopDetected() {
      if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
        nestedUpdateCount = 0;
        nestedPassiveUpdateCount = 0;
        rootWithNestedUpdates = null;
        rootWithPassiveNestedUpdates = null;

        throw new Error(
          "Maximum update depth exceeded. This can happen when a component " +
            "repeatedly calls setState inside componentWillUpdate or " +
            "componentDidUpdate. React limits the number of nested updates to " +
            "prevent infinite loops."
        );
      }

      {
        if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
          nestedPassiveUpdateCount = 0;
          rootWithPassiveNestedUpdates = null;

          error(
            "Maximum update depth exceeded. This can happen when a component " +
              "calls setState inside useEffect, but useEffect either doesn't " +
              "have a dependency array, or one of the dependencies changes on " +
              "every render."
          );
        }
      }
    }

    function flushRenderPhaseStrictModeWarningsInDEV() {
      {
        ReactStrictModeWarnings.flushLegacyContextWarning();
        ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
      }
    }

    function commitDoubleInvokeEffectsInDEV(root, hasPassiveEffects) {
      {
        {
          legacyCommitDoubleInvokeEffectsInDEV(root.current, hasPassiveEffects);
        }
      }
    }

    function legacyCommitDoubleInvokeEffectsInDEV(fiber, hasPassiveEffects) {
      // TODO (StrictEffects) Should we set a marker on the root if it contains strict effects
      // so we don't traverse unnecessarily? similar to subtreeFlags but just at the root level.
      // Maybe not a big deal since this is DEV only behavior.
      setCurrentFiber(fiber);
      invokeEffectsInDev(fiber, MountLayoutDev, invokeLayoutEffectUnmountInDEV);

      if (hasPassiveEffects) {
        invokeEffectsInDev(
          fiber,
          MountPassiveDev,
          invokePassiveEffectUnmountInDEV
        );
      }

      invokeEffectsInDev(fiber, MountLayoutDev, invokeLayoutEffectMountInDEV);

      if (hasPassiveEffects) {
        invokeEffectsInDev(
          fiber,
          MountPassiveDev,
          invokePassiveEffectMountInDEV
        );
      }

      resetCurrentFiber();
    }

    function invokeEffectsInDev(firstChild, fiberFlags, invokeEffectFn) {
      var current = firstChild;
      var subtreeRoot = null;

      while (current != null) {
        var primarySubtreeFlag = current.subtreeFlags & fiberFlags;

        if (
          current !== subtreeRoot &&
          current.child != null &&
          primarySubtreeFlag !== NoFlags$1
        ) {
          current = current.child;
        } else {
          if ((current.flags & fiberFlags) !== NoFlags$1) {
            invokeEffectFn(current);
          }

          if (current.sibling !== null) {
            current = current.sibling;
          } else {
            current = subtreeRoot = current.return;
          }
        }
      }
    }

    var didWarnStateUpdateForNotYetMountedComponent = null;
    function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber) {
      {
        if ((executionContext & RenderContext) !== NoContext) {
          // We let the other warning about render phase updates deal with this one.
          return;
        }

        if (!(fiber.mode & ConcurrentMode)) {
          return;
        }

        var tag = fiber.tag;

        if (
          tag !== IndeterminateComponent &&
          tag !== HostRoot &&
          tag !== ClassComponent &&
          tag !== FunctionComponent &&
          tag !== ForwardRef &&
          tag !== MemoComponent &&
          tag !== SimpleMemoComponent
        ) {
          // Only warn for user-defined components, not internal ones like Suspense.
          return;
        } // We show the whole stack but dedupe on the top component's name because
        // the problematic code almost always lies inside that component.

        var componentName =
          getComponentNameFromFiber(fiber) || "ReactComponent";

        if (didWarnStateUpdateForNotYetMountedComponent !== null) {
          if (didWarnStateUpdateForNotYetMountedComponent.has(componentName)) {
            return;
          } // $FlowFixMe[incompatible-use] found when upgrading Flow

          didWarnStateUpdateForNotYetMountedComponent.add(componentName);
        } else {
          didWarnStateUpdateForNotYetMountedComponent = new Set([
            componentName
          ]);
        }

        var previousFiber = current;

        try {
          setCurrentFiber(fiber);

          error(
            "Can't perform a React state update on a component that hasn't mounted yet. " +
              "This indicates that you have a side-effect in your render function that " +
              "asynchronously later calls tries to update the component. Move this work to " +
              "useEffect instead."
          );
        } finally {
          if (previousFiber) {
            setCurrentFiber(fiber);
          } else {
            resetCurrentFiber();
          }
        }
      }
    }
    var didWarnAboutUpdateInRender = false;
    var didWarnAboutUpdateInRenderForAnotherComponent;

    {
      didWarnAboutUpdateInRenderForAnotherComponent = new Set();
    }

    function warnAboutRenderPhaseUpdatesInDEV(fiber) {
      {
        if (isRendering) {
          switch (fiber.tag) {
            case FunctionComponent:
            case ForwardRef:
            case SimpleMemoComponent: {
              var renderingComponentName =
                (workInProgress && getComponentNameFromFiber(workInProgress)) ||
                "Unknown"; // Dedupe by the rendering component because it's the one that needs to be fixed.

              var dedupeKey = renderingComponentName;

              if (
                !didWarnAboutUpdateInRenderForAnotherComponent.has(dedupeKey)
              ) {
                didWarnAboutUpdateInRenderForAnotherComponent.add(dedupeKey);
                var setStateComponentName =
                  getComponentNameFromFiber(fiber) || "Unknown";

                error(
                  "Cannot update a component (`%s`) while rendering a " +
                    "different component (`%s`). To locate the bad setState() call inside `%s`, " +
                    "follow the stack trace as described in https://react.dev/link/setstate-in-render",
                  setStateComponentName,
                  renderingComponentName,
                  renderingComponentName
                );
              }

              break;
            }

            case ClassComponent: {
              if (!didWarnAboutUpdateInRender) {
                error(
                  "Cannot update during an existing state transition (such as " +
                    "within `render`). Render methods should be a pure " +
                    "function of props and state."
                );

                didWarnAboutUpdateInRender = true;
              }

              break;
            }
          }
        }
      }
    }

    function restorePendingUpdaters(root, lanes) {
      {
        if (isDevToolsPresent) {
          var memoizedUpdaters = root.memoizedUpdaters;
          memoizedUpdaters.forEach(function (schedulingFiber) {
            addFiberToLanesMap(root, schedulingFiber, lanes);
          }); // This function intentionally does not clear memoized updaters.
          // Those may still be relevant to the current commit
          // and a future one (e.g. Suspense).
        }
      }
    }
    var fakeActCallbackNode = {}; // $FlowFixMe[missing-local-annot]

    function scheduleCallback(priorityLevel, callback) {
      {
        // If we're currently inside an `act` scope, bypass Scheduler and push to
        // the `act` queue instead.
        var actQueue = ReactCurrentActQueue.current;

        if (actQueue !== null) {
          actQueue.push(callback);
          return fakeActCallbackNode;
        } else {
          return scheduleCallback$2(priorityLevel, callback);
        }
      }
    }

    function shouldForceFlushFallbacksInDEV() {
      // Never force flush in production. This function should get stripped out.
      return ReactCurrentActQueue.current !== null;
    }

    function warnIfUpdatesNotWrappedWithActDEV(fiber) {
      {
        if (fiber.mode & ConcurrentMode) {
          if (!isConcurrentActEnvironment()) {
            // Not in an act environment. No need to warn.
            return;
          }
        } else {
          // Legacy mode has additional cases where we suppress a warning.
          if (!isLegacyActEnvironment()) {
            // Not in an act environment. No need to warn.
            return;
          }

          if (executionContext !== NoContext) {
            // Legacy mode doesn't warn if the update is batched, i.e.
            // batchedUpdates or flushSync.
            return;
          }

          if (
            fiber.tag !== FunctionComponent &&
            fiber.tag !== ForwardRef &&
            fiber.tag !== SimpleMemoComponent
          ) {
            // For backwards compatibility with pre-hooks code, legacy mode only
            // warns for updates that originate from a hook.
            return;
          }
        }

        if (ReactCurrentActQueue.current === null) {
          var previousFiber = current;

          try {
            setCurrentFiber(fiber);

            error(
              "An update to %s inside a test was not wrapped in act(...).\n\n" +
                "When testing, code that causes React state updates should be " +
                "wrapped into act(...):\n\n" +
                "act(() => {\n" +
                "  /* fire events that update state */\n" +
                "});\n" +
                "/* assert on the output */\n\n" +
                "This ensures that you're testing the behavior the user would see " +
                "in the browser." +
                " Learn more at https://react.dev/link/wrap-tests-with-act",
              getComponentNameFromFiber(fiber)
            );
          } finally {
            if (previousFiber) {
              setCurrentFiber(fiber);
            } else {
              resetCurrentFiber();
            }
          }
        }
      }
    }

    function warnIfSuspenseResolutionNotWrappedWithActDEV(root) {
      {
        if (
          root.tag !== LegacyRoot &&
          isConcurrentActEnvironment() &&
          ReactCurrentActQueue.current === null
        ) {
          error(
            "A suspended resource finished loading inside a test, but the event " +
              "was not wrapped in act(...).\n\n" +
              "When testing, code that resolves suspended data should be wrapped " +
              "into act(...):\n\n" +
              "act(() => {\n" +
              "  /* finish loading suspended data */\n" +
              "});\n" +
              "/* assert on the output */\n\n" +
              "This ensures that you're testing the behavior the user would see " +
              "in the browser." +
              " Learn more at https://react.dev/link/wrap-tests-with-act"
          );
        }
      }
    }

    function setIsRunningInsertionEffect(isRunning) {
      {
        isRunningInsertionEffect = isRunning;
      }
    }

    /* eslint-disable react-internal/prod-error-codes */
    // Used by React Refresh runtime through DevTools Global Hook.

    var resolveFamily = null;
    var failedBoundaries = null;
    var setRefreshHandler = function (handler) {
      {
        resolveFamily = handler;
      }
    };
    function resolveFunctionForHotReloading(type) {
      {
        if (resolveFamily === null) {
          // Hot reloading is disabled.
          return type;
        }

        var family = resolveFamily(type);

        if (family === undefined) {
          return type;
        } // Use the latest known implementation.

        return family.current;
      }
    }
    function resolveClassForHotReloading(type) {
      // No implementation differences.
      return resolveFunctionForHotReloading(type);
    }
    function resolveForwardRefForHotReloading(type) {
      {
        if (resolveFamily === null) {
          // Hot reloading is disabled.
          return type;
        }

        var family = resolveFamily(type);

        if (family === undefined) {
          // Check if we're dealing with a real forwardRef. Don't want to crash early.
          if (
            type !== null &&
            type !== undefined &&
            typeof type.render === "function"
          ) {
            // ForwardRef is special because its resolved .type is an object,
            // but it's possible that we only have its inner render function in the map.
            // If that inner render function is different, we'll build a new forwardRef type.
            var currentRender = resolveFunctionForHotReloading(type.render);

            if (type.render !== currentRender) {
              var syntheticType = {
                $$typeof: REACT_FORWARD_REF_TYPE,
                render: currentRender
              };

              if (type.displayName !== undefined) {
                syntheticType.displayName = type.displayName;
              }

              return syntheticType;
            }
          }

          return type;
        } // Use the latest known implementation.

        return family.current;
      }
    }
    function isCompatibleFamilyForHotReloading(fiber, element) {
      {
        if (resolveFamily === null) {
          // Hot reloading is disabled.
          return false;
        }

        var prevType = fiber.elementType;
        var nextType = element.type; // If we got here, we know types aren't === equal.

        var needsCompareFamilies = false;
        var $$typeofNextType =
          typeof nextType === "object" && nextType !== null
            ? nextType.$$typeof
            : null;

        switch (fiber.tag) {
          case ClassComponent: {
            if (typeof nextType === "function") {
              needsCompareFamilies = true;
            }

            break;
          }

          case FunctionComponent: {
            if (typeof nextType === "function") {
              needsCompareFamilies = true;
            } else if ($$typeofNextType === REACT_LAZY_TYPE) {
              // We don't know the inner type yet.
              // We're going to assume that the lazy inner type is stable,
              // and so it is sufficient to avoid reconciling it away.
              // We're not going to unwrap or actually use the new lazy type.
              needsCompareFamilies = true;
            }

            break;
          }

          case ForwardRef: {
            if ($$typeofNextType === REACT_FORWARD_REF_TYPE) {
              needsCompareFamilies = true;
            } else if ($$typeofNextType === REACT_LAZY_TYPE) {
              needsCompareFamilies = true;
            }

            break;
          }

          case MemoComponent:
          case SimpleMemoComponent: {
            if ($$typeofNextType === REACT_MEMO_TYPE) {
              // TODO: if it was but can no longer be simple,
              // we shouldn't set this.
              needsCompareFamilies = true;
            } else if ($$typeofNextType === REACT_LAZY_TYPE) {
              needsCompareFamilies = true;
            }

            break;
          }

          default:
            return false;
        } // Check if both types have a family and it's the same one.

        if (needsCompareFamilies) {
          // Note: memo() and forwardRef() we'll compare outer rather than inner type.
          // This means both of them need to be registered to preserve state.
          // If we unwrapped and compared the inner types for wrappers instead,
          // then we would risk falsely saying two separate memo(Foo)
          // calls are equivalent because they wrap the same Foo function.
          var prevFamily = resolveFamily(prevType); // $FlowFixMe[not-a-function] found when upgrading Flow

          if (
            prevFamily !== undefined &&
            prevFamily === resolveFamily(nextType)
          ) {
            return true;
          }
        }

        return false;
      }
    }
    function markFailedErrorBoundaryForHotReloading(fiber) {
      {
        if (resolveFamily === null) {
          // Hot reloading is disabled.
          return;
        }

        if (typeof WeakSet !== "function") {
          return;
        }

        if (failedBoundaries === null) {
          failedBoundaries = new WeakSet();
        }

        failedBoundaries.add(fiber);
      }
    }
    var scheduleRefresh = function (root, update) {
      {
        if (resolveFamily === null) {
          // Hot reloading is disabled.
          return;
        }

        var staleFamilies = update.staleFamilies,
          updatedFamilies = update.updatedFamilies;
        flushPassiveEffects();
        flushSync(function () {
          scheduleFibersWithFamiliesRecursively(
            root.current,
            updatedFamilies,
            staleFamilies
          );
        });
      }
    };
    var scheduleRoot = function (root, element) {
      {
        if (root.context !== emptyContextObject) {
          // Super edge case: root has a legacy _renderSubtree context
          // but we don't know the parentComponent so we can't pass it.
          // Just ignore. We'll delete this with _renderSubtree code path later.
          return;
        }

        flushPassiveEffects();
        flushSync(function () {
          updateContainer(element, root, null, null);
        });
      }
    };

    function scheduleFibersWithFamiliesRecursively(
      fiber,
      updatedFamilies,
      staleFamilies
    ) {
      {
        var alternate = fiber.alternate,
          child = fiber.child,
          sibling = fiber.sibling,
          tag = fiber.tag,
          type = fiber.type;
        var candidateType = null;

        switch (tag) {
          case FunctionComponent:
          case SimpleMemoComponent:
          case ClassComponent:
            candidateType = type;
            break;

          case ForwardRef:
            candidateType = type.render;
            break;
        }

        if (resolveFamily === null) {
          throw new Error(
            "Expected resolveFamily to be set during hot reload."
          );
        }

        var needsRender = false;
        var needsRemount = false;

        if (candidateType !== null) {
          var family = resolveFamily(candidateType);

          if (family !== undefined) {
            if (staleFamilies.has(family)) {
              needsRemount = true;
            } else if (updatedFamilies.has(family)) {
              if (tag === ClassComponent) {
                needsRemount = true;
              } else {
                needsRender = true;
              }
            }
          }
        }

        if (failedBoundaries !== null) {
          if (
            failedBoundaries.has(fiber) || // $FlowFixMe[incompatible-use] found when upgrading Flow
            (alternate !== null && failedBoundaries.has(alternate))
          ) {
            needsRemount = true;
          }
        }

        if (needsRemount) {
          fiber._debugNeedsRemount = true;
        }

        if (needsRemount || needsRender) {
          var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

          if (root !== null) {
            scheduleUpdateOnFiber(root, fiber, SyncLane);
          }
        }

        if (child !== null && !needsRemount) {
          scheduleFibersWithFamiliesRecursively(
            child,
            updatedFamilies,
            staleFamilies
          );
        }

        if (sibling !== null) {
          scheduleFibersWithFamiliesRecursively(
            sibling,
            updatedFamilies,
            staleFamilies
          );
        }
      }
    }

    var findHostInstancesForRefresh = function (root, families) {
      {
        var hostInstances = new Set();
        var types = new Set(
          families.map(function (family) {
            return family.current;
          })
        );
        findHostInstancesForMatchingFibersRecursively(
          root.current,
          types,
          hostInstances
        );
        return hostInstances;
      }
    };

    function findHostInstancesForMatchingFibersRecursively(
      fiber,
      types,
      hostInstances
    ) {
      {
        var child = fiber.child,
          sibling = fiber.sibling,
          tag = fiber.tag,
          type = fiber.type;
        var candidateType = null;

        switch (tag) {
          case FunctionComponent:
          case SimpleMemoComponent:
          case ClassComponent:
            candidateType = type;
            break;

          case ForwardRef:
            candidateType = type.render;
            break;
        }

        var didMatch = false;

        if (candidateType !== null) {
          if (types.has(candidateType)) {
            didMatch = true;
          }
        }

        if (didMatch) {
          // We have a match. This only drills down to the closest host components.
          // There's no need to search deeper because for the purpose of giving
          // visual feedback, "flashing" outermost parent rectangles is sufficient.
          findHostInstancesForFiberShallowly(fiber, hostInstances);
        } else {
          // If there's no match, maybe there will be one further down in the child tree.
          if (child !== null) {
            findHostInstancesForMatchingFibersRecursively(
              child,
              types,
              hostInstances
            );
          }
        }

        if (sibling !== null) {
          findHostInstancesForMatchingFibersRecursively(
            sibling,
            types,
            hostInstances
          );
        }
      }
    }

    function findHostInstancesForFiberShallowly(fiber, hostInstances) {
      {
        var foundHostInstances = findChildHostInstancesForFiberShallowly(
          fiber,
          hostInstances
        );

        if (foundHostInstances) {
          return;
        } // If we didn't find any host children, fallback to closest host parent.

        var node = fiber;

        while (true) {
          switch (node.tag) {
            case HostSingleton:
            case HostComponent:
              hostInstances.add(node.stateNode);
              return;

            case HostPortal:
              hostInstances.add(node.stateNode.containerInfo);
              return;

            case HostRoot:
              hostInstances.add(node.stateNode.containerInfo);
              return;
          }

          if (node.return === null) {
            throw new Error("Expected to reach root first.");
          }

          node = node.return;
        }
      }
    }

    function findChildHostInstancesForFiberShallowly(fiber, hostInstances) {
      {
        var node = fiber;
        var foundHostInstances = false;

        while (true) {
          if (
            node.tag === HostComponent ||
            node.tag === HostHoistable ||
            false
          ) {
            // We got a match.
            foundHostInstances = true;
            hostInstances.add(node.stateNode); // There may still be more, so keep searching.
          } else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
          }

          if (node === fiber) {
            return foundHostInstances;
          }

          while (node.sibling === null) {
            if (node.return === null || node.return === fiber) {
              return foundHostInstances;
            }

            node = node.return;
          }

          node.sibling.return = node.return;
          node = node.sibling;
        }
      }

      return false;
    }

    var hasBadMapPolyfill;

    {
      hasBadMapPolyfill = false;

      try {
        var nonExtensibleObject = Object.preventExtensions({});
        /* eslint-disable no-new */

        new Map([[nonExtensibleObject, null]]);
        new Set([nonExtensibleObject]);
        /* eslint-enable no-new */
      } catch (e) {
        // TODO: Consider warning about bad polyfills
        hasBadMapPolyfill = true;
      }
    }

    function FiberNode(tag, pendingProps, key, mode) {
      // Instance
      this.tag = tag;
      this.key = key;
      this.elementType = null;
      this.type = null;
      this.stateNode = null; // Fiber

      this.return = null;
      this.child = null;
      this.sibling = null;
      this.index = 0;
      this.ref = null;
      this.refCleanup = null;
      this.pendingProps = pendingProps;
      this.memoizedProps = null;
      this.updateQueue = null;
      this.memoizedState = null;
      this.dependencies = null;
      this.mode = mode; // Effects

      this.flags = NoFlags$1;
      this.subtreeFlags = NoFlags$1;
      this.deletions = null;
      this.lanes = NoLanes;
      this.childLanes = NoLanes;
      this.alternate = null;

      {
        // Note: The following is done to avoid a v8 performance cliff.
        //
        // Initializing the fields below to smis and later updating them with
        // double values will cause Fibers to end up having separate shapes.
        // This behavior/bug has something to do with Object.preventExtension().
        // Fortunately this only impacts DEV builds.
        // Unfortunately it makes React unusably slow for some applications.
        // To work around this, initialize the fields below with doubles.
        //
        // Learn more about this here:
        // https://github.com/facebook/react/issues/14365
        // https://bugs.chromium.org/p/v8/issues/detail?id=8538
        this.actualDuration = Number.NaN;
        this.actualStartTime = Number.NaN;
        this.selfBaseDuration = Number.NaN;
        this.treeBaseDuration = Number.NaN; // It's okay to replace the initial doubles with smis after initialization.
        // This won't trigger the performance cliff mentioned above,
        // and it simplifies other profiler code (including DevTools).

        this.actualDuration = 0;
        this.actualStartTime = -1;
        this.selfBaseDuration = 0;
        this.treeBaseDuration = 0;
      }

      {
        // This isn't directly used but is handy for debugging internals:
        this._debugInfo = null;
        this._debugOwner = null;
        this._debugNeedsRemount = false;
        this._debugHookTypes = null;

        if (
          !hasBadMapPolyfill &&
          typeof Object.preventExtensions === "function"
        ) {
          Object.preventExtensions(this);
        }
      }
    } // This is a constructor function, rather than a POJO constructor, still
    // please ensure we do the following:
    // 1) Nobody should add any instance methods on this. Instance methods can be
    //    more difficult to predict when they get optimized and they are almost
    //    never inlined properly in static compilers.
    // 2) Nobody should rely on `instanceof Fiber` for type testing. We should
    //    always know when it is a fiber.
    // 3) We might want to experiment with using numeric keys since they are easier
    //    to optimize in a non-JIT environment.
    // 4) We can easily go from a constructor to a createFiber object literal if that
    //    is faster.
    // 5) It should be easy to port this to a C struct and keep a C implementation
    //    compatible.

    function createFiber(tag, pendingProps, key, mode) {
      // $FlowFixMe[invalid-constructor]: the shapes are exact here but Flow doesn't like constructors
      return new FiberNode(tag, pendingProps, key, mode);
    }

    function shouldConstruct(Component) {
      var prototype = Component.prototype;
      return !!(prototype && prototype.isReactComponent);
    }

    function isSimpleFunctionComponent(type) {
      return (
        typeof type === "function" &&
        !shouldConstruct(type) &&
        type.defaultProps === undefined
      );
    }
    function resolveLazyComponentTag(Component) {
      if (typeof Component === "function") {
        return shouldConstruct(Component) ? ClassComponent : FunctionComponent;
      } else if (Component !== undefined && Component !== null) {
        var $$typeof = Component.$$typeof;

        if ($$typeof === REACT_FORWARD_REF_TYPE) {
          return ForwardRef;
        }

        if ($$typeof === REACT_MEMO_TYPE) {
          return MemoComponent;
        }
      }

      return IndeterminateComponent;
    } // This is used to create an alternate fiber to do work on.

    function createWorkInProgress(current, pendingProps) {
      var workInProgress = current.alternate;

      if (workInProgress === null) {
        // We use a double buffering pooling technique because we know that we'll
        // only ever need at most two versions of a tree. We pool the "other" unused
        // node that we're free to reuse. This is lazily created to avoid allocating
        // extra objects for things that are never updated. It also allow us to
        // reclaim the extra memory if needed.
        workInProgress = createFiber(
          current.tag,
          pendingProps,
          current.key,
          current.mode
        );
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;

        {
          // DEV-only fields
          workInProgress._debugOwner = current._debugOwner;
          workInProgress._debugHookTypes = current._debugHookTypes;
        }

        workInProgress.alternate = current;
        current.alternate = workInProgress;
      } else {
        workInProgress.pendingProps = pendingProps; // Needed because Blocks store data on type.

        workInProgress.type = current.type; // We already have an alternate.
        // Reset the effect tag.

        workInProgress.flags = NoFlags$1; // The effects are no longer valid.

        workInProgress.subtreeFlags = NoFlags$1;
        workInProgress.deletions = null;

        {
          // We intentionally reset, rather than copy, actualDuration & actualStartTime.
          // This prevents time from endlessly accumulating in new commits.
          // This has the downside of resetting values for different priority renders,
          // But works for yielding (the common case) and should support resuming.
          workInProgress.actualDuration = 0;
          workInProgress.actualStartTime = -1;
        }
      } // Reset all effects except static ones.
      // Static effects are not specific to a render.

      workInProgress.flags = current.flags & StaticMask;
      workInProgress.childLanes = current.childLanes;
      workInProgress.lanes = current.lanes;
      workInProgress.child = current.child;
      workInProgress.memoizedProps = current.memoizedProps;
      workInProgress.memoizedState = current.memoizedState;
      workInProgress.updateQueue = current.updateQueue; // Clone the dependencies object. This is mutated during the render phase, so
      // it cannot be shared with the current fiber.

      var currentDependencies = current.dependencies;
      workInProgress.dependencies =
        currentDependencies === null
          ? null
          : {
              lanes: currentDependencies.lanes,
              firstContext: currentDependencies.firstContext
            }; // These will be overridden during the parent's reconciliation

      workInProgress.sibling = current.sibling;
      workInProgress.index = current.index;
      workInProgress.ref = current.ref;
      workInProgress.refCleanup = current.refCleanup;

      {
        workInProgress.selfBaseDuration = current.selfBaseDuration;
        workInProgress.treeBaseDuration = current.treeBaseDuration;
      }

      {
        workInProgress._debugInfo = current._debugInfo;
        workInProgress._debugNeedsRemount = current._debugNeedsRemount;

        switch (workInProgress.tag) {
          case IndeterminateComponent:
          case FunctionComponent:
          case SimpleMemoComponent:
            workInProgress.type = resolveFunctionForHotReloading(current.type);
            break;

          case ClassComponent:
            workInProgress.type = resolveClassForHotReloading(current.type);
            break;

          case ForwardRef:
            workInProgress.type = resolveForwardRefForHotReloading(
              current.type
            );
            break;
        }
      }

      return workInProgress;
    } // Used to reuse a Fiber for a second pass.

    function resetWorkInProgress(workInProgress, renderLanes) {
      // This resets the Fiber to what createFiber or createWorkInProgress would
      // have set the values to before during the first pass. Ideally this wouldn't
      // be necessary but unfortunately many code paths reads from the workInProgress
      // when they should be reading from current and writing to workInProgress.
      // We assume pendingProps, index, key, ref, return are still untouched to
      // avoid doing another reconciliation.
      // Reset the effect flags but keep any Placement tags, since that's something
      // that child fiber is setting, not the reconciliation.
      workInProgress.flags &= StaticMask | Placement; // The effects are no longer valid.

      var current = workInProgress.alternate;

      if (current === null) {
        // Reset to createFiber's initial values.
        workInProgress.childLanes = NoLanes;
        workInProgress.lanes = renderLanes;
        workInProgress.child = null;
        workInProgress.subtreeFlags = NoFlags$1;
        workInProgress.memoizedProps = null;
        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null;
        workInProgress.dependencies = null;
        workInProgress.stateNode = null;

        {
          // Note: We don't reset the actualTime counts. It's useful to accumulate
          // actual time across multiple render passes.
          workInProgress.selfBaseDuration = 0;
          workInProgress.treeBaseDuration = 0;
        }
      } else {
        // Reset to the cloned values that createWorkInProgress would've.
        workInProgress.childLanes = current.childLanes;
        workInProgress.lanes = current.lanes;
        workInProgress.child = current.child;
        workInProgress.subtreeFlags = NoFlags$1;
        workInProgress.deletions = null;
        workInProgress.memoizedProps = current.memoizedProps;
        workInProgress.memoizedState = current.memoizedState;
        workInProgress.updateQueue = current.updateQueue; // Needed because Blocks store data on type.

        workInProgress.type = current.type; // Clone the dependencies object. This is mutated during the render phase, so
        // it cannot be shared with the current fiber.

        var currentDependencies = current.dependencies;
        workInProgress.dependencies =
          currentDependencies === null
            ? null
            : {
                lanes: currentDependencies.lanes,
                firstContext: currentDependencies.firstContext
              };

        {
          // Note: We don't reset the actualTime counts. It's useful to accumulate
          // actual time across multiple render passes.
          workInProgress.selfBaseDuration = current.selfBaseDuration;
          workInProgress.treeBaseDuration = current.treeBaseDuration;
        }
      }

      return workInProgress;
    }
    function createHostRootFiber(
      tag,
      isStrictMode,
      concurrentUpdatesByDefaultOverride
    ) {
      var mode;

      if (tag === ConcurrentRoot) {
        mode = ConcurrentMode;

        if (isStrictMode === true) {
          mode |= StrictLegacyMode | StrictEffectsMode;
        }
      } else {
        mode = NoMode;
      }

      if (isDevToolsPresent) {
        // Always collect profile timings when DevTools are present.
        // This enables DevTools to start capturing timing at any point–
        // Without some nodes in the tree having empty base times.
        mode |= ProfileMode;
      }

      return createFiber(HostRoot, null, null, mode);
    }
    function createFiberFromTypeAndProps(
      type, // React$ElementType
      key,
      pendingProps,
      owner,
      mode,
      lanes
    ) {
      var fiberTag = IndeterminateComponent; // The resolved type is set if we know what the final type will be. I.e. it's not lazy.

      var resolvedType = type;

      if (typeof type === "function") {
        if (shouldConstruct(type)) {
          fiberTag = ClassComponent;

          {
            resolvedType = resolveClassForHotReloading(resolvedType);
          }
        } else {
          {
            resolvedType = resolveFunctionForHotReloading(resolvedType);
          }
        }
      } else if (typeof type === "string") {
        {
          fiberTag = HostComponent;
        }
      } else {
        getTag: switch (type) {
          case REACT_FRAGMENT_TYPE:
            return createFiberFromFragment(
              pendingProps.children,
              mode,
              lanes,
              key
            );

          case REACT_STRICT_MODE_TYPE:
            fiberTag = Mode;
            mode |= StrictLegacyMode;

            if ((mode & ConcurrentMode) !== NoMode) {
              // Strict effects should never run on legacy roots
              mode |= StrictEffectsMode;
            }

            break;

          case REACT_PROFILER_TYPE:
            return createFiberFromProfiler(pendingProps, mode, lanes, key);

          case REACT_SUSPENSE_TYPE:
            return createFiberFromSuspense(pendingProps, mode, lanes, key);

          case REACT_SUSPENSE_LIST_TYPE:
            return createFiberFromSuspenseList(pendingProps, mode, lanes, key);

          case REACT_OFFSCREEN_TYPE:
            return createFiberFromOffscreen(pendingProps, mode, lanes, key);

          case REACT_LEGACY_HIDDEN_TYPE:

          // Fall through

          case REACT_SCOPE_TYPE:

          // Fall through

          case REACT_CACHE_TYPE:

          // Fall through

          case REACT_TRACING_MARKER_TYPE:

          // Fall through

          case REACT_DEBUG_TRACING_MODE_TYPE:

          // Fall through

          default: {
            if (typeof type === "object" && type !== null) {
              switch (type.$$typeof) {
                case REACT_PROVIDER_TYPE: {
                  fiberTag = ContextProvider;
                  break getTag;
                }

                // Fall through

                case REACT_CONTEXT_TYPE: {
                  fiberTag = ContextConsumer;
                  break getTag;
                }

                case REACT_CONSUMER_TYPE:

                // Fall through

                case REACT_FORWARD_REF_TYPE:
                  fiberTag = ForwardRef;

                  {
                    resolvedType =
                      resolveForwardRefForHotReloading(resolvedType);
                  }

                  break getTag;

                case REACT_MEMO_TYPE:
                  fiberTag = MemoComponent;
                  break getTag;

                case REACT_LAZY_TYPE:
                  fiberTag = LazyComponent;
                  resolvedType = null;
                  break getTag;
              }
            }

            var info = "";

            {
              if (
                type === undefined ||
                (typeof type === "object" &&
                  type !== null &&
                  Object.keys(type).length === 0)
              ) {
                info +=
                  " You likely forgot to export your component from the file " +
                  "it's defined in, or you might have mixed up default and " +
                  "named imports.";
              }

              var ownerName = owner ? getComponentNameFromFiber(owner) : null;

              if (ownerName) {
                info += "\n\nCheck the render method of `" + ownerName + "`.";
              }
            }

            throw new Error(
              "Element type is invalid: expected a string (for built-in " +
                "components) or a class/function (for composite components) " +
                ("but got: " + (type == null ? type : typeof type) + "." + info)
            );
          }
        }
      }

      var fiber = createFiber(fiberTag, pendingProps, key, mode);
      fiber.elementType = type;
      fiber.type = resolvedType;
      fiber.lanes = lanes;

      {
        fiber._debugOwner = owner;
      }

      return fiber;
    }
    function createFiberFromElement(element, mode, lanes) {
      var owner = null;

      {
        owner = element._owner;
      }

      var type = element.type;
      var key = element.key;
      var pendingProps = element.props;
      var fiber = createFiberFromTypeAndProps(
        type,
        key,
        pendingProps,
        owner,
        mode,
        lanes
      );

      {
        fiber._debugOwner = element._owner;
      }

      return fiber;
    }
    function createFiberFromFragment(elements, mode, lanes, key) {
      var fiber = createFiber(Fragment, elements, key, mode);
      fiber.lanes = lanes;
      return fiber;
    }

    function createFiberFromProfiler(pendingProps, mode, lanes, key) {
      {
        if (typeof pendingProps.id !== "string") {
          error(
            'Profiler must specify an "id" of type `string` as a prop. Received the type `%s` instead.',
            typeof pendingProps.id
          );
        }
      }

      var fiber = createFiber(Profiler, pendingProps, key, mode | ProfileMode);
      fiber.elementType = REACT_PROFILER_TYPE;
      fiber.lanes = lanes;

      {
        fiber.stateNode = {
          effectDuration: 0,
          passiveEffectDuration: 0
        };
      }

      return fiber;
    }

    function createFiberFromSuspense(pendingProps, mode, lanes, key) {
      var fiber = createFiber(SuspenseComponent, pendingProps, key, mode);
      fiber.elementType = REACT_SUSPENSE_TYPE;
      fiber.lanes = lanes;
      return fiber;
    }
    function createFiberFromSuspenseList(pendingProps, mode, lanes, key) {
      var fiber = createFiber(SuspenseListComponent, pendingProps, key, mode);
      fiber.elementType = REACT_SUSPENSE_LIST_TYPE;
      fiber.lanes = lanes;
      return fiber;
    }
    function createFiberFromOffscreen(pendingProps, mode, lanes, key) {
      var fiber = createFiber(OffscreenComponent, pendingProps, key, mode);
      fiber.elementType = REACT_OFFSCREEN_TYPE;
      fiber.lanes = lanes;
      var primaryChildInstance = {
        _visibility: OffscreenVisible,
        _pendingVisibility: OffscreenVisible,
        _pendingMarkers: null,
        _retryCache: null,
        _transitions: null,
        _current: null,
        detach: function () {
          return detachOffscreenInstance(primaryChildInstance);
        },
        attach: function () {
          return attachOffscreenInstance(primaryChildInstance);
        }
      };
      fiber.stateNode = primaryChildInstance;
      return fiber;
    }
    function createFiberFromText(content, mode, lanes) {
      var fiber = createFiber(HostText, content, null, mode);
      fiber.lanes = lanes;
      return fiber;
    }
    function createFiberFromPortal(portal, mode, lanes) {
      var pendingProps = portal.children !== null ? portal.children : [];
      var fiber = createFiber(HostPortal, pendingProps, portal.key, mode);
      fiber.lanes = lanes;
      fiber.stateNode = {
        containerInfo: portal.containerInfo,
        pendingChildren: null,
        // Used by persistent updates
        implementation: portal.implementation
      };
      return fiber;
    }

    function FiberRootNode(
      containerInfo, // $FlowFixMe[missing-local-annot]
      tag,
      hydrate,
      identifierPrefix,
      onRecoverableError,
      formState
    ) {
      this.tag = tag;
      this.containerInfo = containerInfo;
      this.pendingChildren = null;
      this.current = null;
      this.pingCache = null;
      this.finishedWork = null;
      this.timeoutHandle = noTimeout;
      this.cancelPendingCommit = null;
      this.context = null;
      this.pendingContext = null;
      this.next = null;
      this.callbackNode = null;
      this.callbackPriority = NoLane;
      this.expirationTimes = createLaneMap(NoTimestamp);
      this.pendingLanes = NoLanes;
      this.suspendedLanes = NoLanes;
      this.pingedLanes = NoLanes;
      this.expiredLanes = NoLanes;
      this.finishedLanes = NoLanes;
      this.errorRecoveryDisabledLanes = NoLanes;
      this.shellSuspendCounter = 0;
      this.entangledLanes = NoLanes;
      this.entanglements = createLaneMap(NoLanes);
      this.hiddenUpdates = createLaneMap(null);
      this.identifierPrefix = identifierPrefix;
      this.onRecoverableError = onRecoverableError;

      this.formState = formState;
      this.incompleteTransitions = new Map();

      {
        this.effectDuration = 0;
        this.passiveEffectDuration = 0;
      }

      {
        this.memoizedUpdaters = new Set();
        var pendingUpdatersLaneMap = (this.pendingUpdatersLaneMap = []);

        for (var _i = 0; _i < TotalLanes; _i++) {
          pendingUpdatersLaneMap.push(new Set());
        }
      }

      {
        switch (tag) {
          case ConcurrentRoot:
            this._debugRootType = hydrate ? "hydrateRoot()" : "createRoot()";
            break;

          case LegacyRoot:
            this._debugRootType = hydrate ? "hydrate()" : "render()";
            break;
        }
      }
    }

    function createFiberRoot(
      containerInfo,
      tag,
      hydrate,
      initialChildren,
      hydrationCallbacks,
      isStrictMode,
      concurrentUpdatesByDefaultOverride, // TODO: We have several of these arguments that are conceptually part of the
      // host config, but because they are passed in at runtime, we have to thread
      // them through the root constructor. Perhaps we should put them all into a
      // single type, like a DynamicHostConfig that is defined by the renderer.
      identifierPrefix,
      onRecoverableError,
      transitionCallbacks,
      formState
    ) {
      // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
      var root = new FiberRootNode(
        containerInfo,
        tag,
        hydrate,
        identifierPrefix,
        onRecoverableError,
        formState
      );
      // stateNode is any.

      var uninitializedFiber = createHostRootFiber(tag, isStrictMode);
      root.current = uninitializedFiber;
      uninitializedFiber.stateNode = root;

      {
        var _initialState = {
          element: initialChildren,
          isDehydrated: hydrate,
          cache: null // not enabled yet
        };
        uninitializedFiber.memoizedState = _initialState;
      }

      initializeUpdateQueue(uninitializedFiber);
      return root;
    }

    var ReactVersion = "18.3.0-canary-9372c6311-20240315";

    function createPortal$1(
      children,
      containerInfo, // TODO: figure out the API for cross-renderer implementation.
      implementation
    ) {
      var key =
        arguments.length > 3 && arguments[3] !== undefined
          ? arguments[3]
          : null;

      {
        checkKeyStringCoercion(key);
      }

      return {
        // This tag allow us to uniquely identify this as a React Portal
        $$typeof: REACT_PORTAL_TYPE,
        key: key == null ? null : "" + key,
        children: children,
        containerInfo: containerInfo,
        implementation: implementation
      };
    }

    // Might add PROFILE later.

    var didWarnAboutNestedUpdates;
    var didWarnAboutFindNodeInStrictMode;

    {
      didWarnAboutNestedUpdates = false;
      didWarnAboutFindNodeInStrictMode = {};
    }

    function getContextForSubtree(parentComponent) {
      if (!parentComponent) {
        return emptyContextObject;
      }

      var fiber = get(parentComponent);
      var parentContext = findCurrentUnmaskedContext();

      if (fiber.tag === ClassComponent) {
        var Component = fiber.type;

        if (isContextProvider()) {
          return processChildContext(fiber, Component, parentContext);
        }
      }

      return parentContext;
    }

    function findHostInstanceWithWarning(component, methodName) {
      {
        var fiber = get(component);

        if (fiber === undefined) {
          if (typeof component.render === "function") {
            throw new Error("Unable to find node on an unmounted component.");
          } else {
            var keys = Object.keys(component).join(",");
            throw new Error(
              "Argument appears to not be a ReactComponent. Keys: " + keys
            );
          }
        }

        var hostFiber = findCurrentHostFiber(fiber);

        if (hostFiber === null) {
          return null;
        }

        if (hostFiber.mode & StrictLegacyMode) {
          var componentName = getComponentNameFromFiber(fiber) || "Component";

          if (!didWarnAboutFindNodeInStrictMode[componentName]) {
            didWarnAboutFindNodeInStrictMode[componentName] = true;
            var previousFiber = current;

            try {
              setCurrentFiber(hostFiber);

              if (fiber.mode & StrictLegacyMode) {
                error(
                  "%s is deprecated in StrictMode. " +
                    "%s was passed an instance of %s which is inside StrictMode. " +
                    "Instead, add a ref directly to the element you want to reference. " +
                    "Learn more about using refs safely here: " +
                    "https://react.dev/link/strict-mode-find-node",
                  methodName,
                  methodName,
                  componentName
                );
              } else {
                error(
                  "%s is deprecated in StrictMode. " +
                    "%s was passed an instance of %s which renders StrictMode children. " +
                    "Instead, add a ref directly to the element you want to reference. " +
                    "Learn more about using refs safely here: " +
                    "https://react.dev/link/strict-mode-find-node",
                  methodName,
                  methodName,
                  componentName
                );
              }
            } finally {
              // Ideally this should reset to previous but this shouldn't be called in
              // render and there's another warning for that anyway.
              if (previousFiber) {
                setCurrentFiber(previousFiber);
              } else {
                resetCurrentFiber();
              }
            }
          }
        }

        return getPublicInstance(hostFiber.stateNode);
      }
    }

    function createContainer(
      containerInfo,
      tag,
      hydrationCallbacks,
      isStrictMode,
      concurrentUpdatesByDefaultOverride,
      identifierPrefix,
      onRecoverableError,
      transitionCallbacks
    ) {
      var hydrate = false;
      var initialChildren = null;
      return createFiberRoot(
        containerInfo,
        tag,
        hydrate,
        initialChildren,
        hydrationCallbacks,
        isStrictMode,
        concurrentUpdatesByDefaultOverride,
        identifierPrefix,
        onRecoverableError,
        transitionCallbacks,
        null
      );
    }
    function updateContainer(element, container, parentComponent, callback) {
      {
        onScheduleRoot(container, element);
      }

      var current$1 = container.current;
      var lane = requestUpdateLane(current$1);

      var context = getContextForSubtree(parentComponent);

      if (container.context === null) {
        container.context = context;
      } else {
        container.pendingContext = context;
      }

      {
        if (isRendering && current !== null && !didWarnAboutNestedUpdates) {
          didWarnAboutNestedUpdates = true;

          error(
            "Render methods should be a pure function of props and state; " +
              "triggering nested component updates from render is not allowed. " +
              "If necessary, trigger nested updates in componentDidUpdate.\n\n" +
              "Check the render method of %s.",
            getComponentNameFromFiber(current) || "Unknown"
          );
        }
      }

      var update = createUpdate(lane); // Caution: React DevTools currently depends on this property
      // being called "element".

      update.payload = {
        element: element
      };
      callback = callback === undefined ? null : callback;

      if (callback !== null) {
        {
          if (typeof callback !== "function") {
            error(
              "Expected the last optional `callback` argument to be a " +
                "function. Instead received: %s.",
              callback
            );
          }
        }

        update.callback = callback;
      }

      var root = enqueueUpdate(current$1, update, lane);

      if (root !== null) {
        scheduleUpdateOnFiber(root, current$1, lane);
        entangleTransitions(root, current$1, lane);
      }

      return lane;
    }
    function getPublicRootInstance(container) {
      var containerFiber = container.current;

      if (!containerFiber.child) {
        return null;
      }

      switch (containerFiber.child.tag) {
        case HostSingleton:
        case HostComponent:
          return getPublicInstance(containerFiber.child.stateNode);

        default:
          return containerFiber.child.stateNode;
      }
    }

    var shouldErrorImpl = function (fiber) {
      return null;
    };

    function shouldError(fiber) {
      return shouldErrorImpl(fiber);
    }

    var shouldSuspendImpl = function (fiber) {
      return false;
    };

    function shouldSuspend(fiber) {
      return shouldSuspendImpl(fiber);
    }
    var overrideHookState = null;
    var overrideHookStateDeletePath = null;
    var overrideHookStateRenamePath = null;
    var overrideProps = null;
    var overridePropsDeletePath = null;
    var overridePropsRenamePath = null;
    var scheduleUpdate = null;
    var setErrorHandler = null;
    var setSuspenseHandler = null;

    {
      var copyWithDeleteImpl = function (obj, path, index) {
        var key = path[index];
        var updated = isArray(obj) ? obj.slice() : assign({}, obj);

        if (index + 1 === path.length) {
          if (isArray(updated)) {
            updated.splice(key, 1);
          } else {
            delete updated[key];
          }

          return updated;
        } // $FlowFixMe[incompatible-use] number or string is fine here

        updated[key] = copyWithDeleteImpl(obj[key], path, index + 1);
        return updated;
      };

      var copyWithDelete = function (obj, path) {
        return copyWithDeleteImpl(obj, path, 0);
      };

      var copyWithRenameImpl = function (obj, oldPath, newPath, index) {
        var oldKey = oldPath[index];
        var updated = isArray(obj) ? obj.slice() : assign({}, obj);

        if (index + 1 === oldPath.length) {
          var newKey = newPath[index]; // $FlowFixMe[incompatible-use] number or string is fine here

          updated[newKey] = updated[oldKey];

          if (isArray(updated)) {
            updated.splice(oldKey, 1);
          } else {
            delete updated[oldKey];
          }
        } else {
          // $FlowFixMe[incompatible-use] number or string is fine here
          updated[oldKey] = copyWithRenameImpl(
            // $FlowFixMe[incompatible-use] number or string is fine here
            obj[oldKey],
            oldPath,
            newPath,
            index + 1
          );
        }

        return updated;
      };

      var copyWithRename = function (obj, oldPath, newPath) {
        if (oldPath.length !== newPath.length) {
          warn("copyWithRename() expects paths of the same length");

          return;
        } else {
          for (var i = 0; i < newPath.length - 1; i++) {
            if (oldPath[i] !== newPath[i]) {
              warn(
                "copyWithRename() expects paths to be the same except for the deepest key"
              );

              return;
            }
          }
        }

        return copyWithRenameImpl(obj, oldPath, newPath, 0);
      };

      var copyWithSetImpl = function (obj, path, index, value) {
        if (index >= path.length) {
          return value;
        }

        var key = path[index];
        var updated = isArray(obj) ? obj.slice() : assign({}, obj); // $FlowFixMe[incompatible-use] number or string is fine here

        updated[key] = copyWithSetImpl(obj[key], path, index + 1, value);
        return updated;
      };

      var copyWithSet = function (obj, path, value) {
        return copyWithSetImpl(obj, path, 0, value);
      };

      var findHook = function (fiber, id) {
        // For now, the "id" of stateful hooks is just the stateful hook index.
        // This may change in the future with e.g. nested hooks.
        var currentHook = fiber.memoizedState;

        while (currentHook !== null && id > 0) {
          currentHook = currentHook.next;
          id--;
        }

        return currentHook;
      }; // Support DevTools editable values for useState and useReducer.

      overrideHookState = function (fiber, id, path, value) {
        var hook = findHook(fiber, id);

        if (hook !== null) {
          var newState = copyWithSet(hook.memoizedState, path, value);
          hook.memoizedState = newState;
          hook.baseState = newState; // We aren't actually adding an update to the queue,
          // because there is no update we can add for useReducer hooks that won't trigger an error.
          // (There's no appropriate action type for DevTools overrides.)
          // As a result though, React will see the scheduled update as a noop and bailout.
          // Shallow cloning props works as a workaround for now to bypass the bailout check.

          fiber.memoizedProps = assign({}, fiber.memoizedProps);
          var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

          if (root !== null) {
            scheduleUpdateOnFiber(root, fiber, SyncLane);
          }
        }
      };

      overrideHookStateDeletePath = function (fiber, id, path) {
        var hook = findHook(fiber, id);

        if (hook !== null) {
          var newState = copyWithDelete(hook.memoizedState, path);
          hook.memoizedState = newState;
          hook.baseState = newState; // We aren't actually adding an update to the queue,
          // because there is no update we can add for useReducer hooks that won't trigger an error.
          // (There's no appropriate action type for DevTools overrides.)
          // As a result though, React will see the scheduled update as a noop and bailout.
          // Shallow cloning props works as a workaround for now to bypass the bailout check.

          fiber.memoizedProps = assign({}, fiber.memoizedProps);
          var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

          if (root !== null) {
            scheduleUpdateOnFiber(root, fiber, SyncLane);
          }
        }
      };

      overrideHookStateRenamePath = function (fiber, id, oldPath, newPath) {
        var hook = findHook(fiber, id);

        if (hook !== null) {
          var newState = copyWithRename(hook.memoizedState, oldPath, newPath);
          hook.memoizedState = newState;
          hook.baseState = newState; // We aren't actually adding an update to the queue,
          // because there is no update we can add for useReducer hooks that won't trigger an error.
          // (There's no appropriate action type for DevTools overrides.)
          // As a result though, React will see the scheduled update as a noop and bailout.
          // Shallow cloning props works as a workaround for now to bypass the bailout check.

          fiber.memoizedProps = assign({}, fiber.memoizedProps);
          var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

          if (root !== null) {
            scheduleUpdateOnFiber(root, fiber, SyncLane);
          }
        }
      }; // Support DevTools props for function components, forwardRef, memo, host components, etc.

      overrideProps = function (fiber, path, value) {
        fiber.pendingProps = copyWithSet(fiber.memoizedProps, path, value);

        if (fiber.alternate) {
          fiber.alternate.pendingProps = fiber.pendingProps;
        }

        var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, SyncLane);
        }
      };

      overridePropsDeletePath = function (fiber, path) {
        fiber.pendingProps = copyWithDelete(fiber.memoizedProps, path);

        if (fiber.alternate) {
          fiber.alternate.pendingProps = fiber.pendingProps;
        }

        var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, SyncLane);
        }
      };

      overridePropsRenamePath = function (fiber, oldPath, newPath) {
        fiber.pendingProps = copyWithRename(
          fiber.memoizedProps,
          oldPath,
          newPath
        );

        if (fiber.alternate) {
          fiber.alternate.pendingProps = fiber.pendingProps;
        }

        var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, SyncLane);
        }
      };

      scheduleUpdate = function (fiber) {
        var root = enqueueConcurrentRenderForLane(fiber, SyncLane);

        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, SyncLane);
        }
      };

      setErrorHandler = function (newShouldErrorImpl) {
        shouldErrorImpl = newShouldErrorImpl;
      };

      setSuspenseHandler = function (newShouldSuspendImpl) {
        shouldSuspendImpl = newShouldSuspendImpl;
      };
    }

    function findHostInstanceByFiber(fiber) {
      var hostFiber = findCurrentHostFiber(fiber);

      if (hostFiber === null) {
        return null;
      }

      return hostFiber.stateNode;
    }

    function emptyFindFiberByHostInstance(instance) {
      return null;
    }

    function getCurrentFiberForDevTools() {
      return current;
    }

    function injectIntoDevTools(devToolsConfig) {
      var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
      var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
      return injectInternals({
        bundleType: devToolsConfig.bundleType,
        version: devToolsConfig.version,
        rendererPackageName: devToolsConfig.rendererPackageName,
        rendererConfig: devToolsConfig.rendererConfig,
        overrideHookState: overrideHookState,
        overrideHookStateDeletePath: overrideHookStateDeletePath,
        overrideHookStateRenamePath: overrideHookStateRenamePath,
        overrideProps: overrideProps,
        overridePropsDeletePath: overridePropsDeletePath,
        overridePropsRenamePath: overridePropsRenamePath,
        setErrorHandler: setErrorHandler,
        setSuspenseHandler: setSuspenseHandler,
        scheduleUpdate: scheduleUpdate,
        currentDispatcherRef: ReactCurrentDispatcher,
        findHostInstanceByFiber: findHostInstanceByFiber,
        findFiberByHostInstance:
          findFiberByHostInstance || emptyFindFiberByHostInstance,
        // React Refresh
        findHostInstancesForRefresh: findHostInstancesForRefresh,
        scheduleRefresh: scheduleRefresh,
        scheduleRoot: scheduleRoot,
        setRefreshHandler: setRefreshHandler,
        // Enables DevTools to append owner stacks to error messages in DEV mode.
        getCurrentFiber: getCurrentFiberForDevTools,
        // Enables DevTools to detect reconciler version rather than renderer version
        // which may not match for third party renderers.
        reconcilerVersion: ReactVersion
      });
    }

    var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
    function findHostInstance_DEPRECATED(componentOrHandle) {
      {
        var owner = ReactCurrentOwner.current;

        if (owner !== null && owner.stateNode !== null) {
          if (!owner.stateNode._warnedAboutRefsInRender) {
            error(
              "%s is accessing findNodeHandle inside its render(). " +
                "render() should be a pure function of props and state. It should " +
                "never access something that requires stale data from the previous " +
                "render, such as refs. Move this logic to componentDidMount and " +
                "componentDidUpdate instead.",
              getComponentNameFromType(owner.type) || "A component"
            );
          }

          owner.stateNode._warnedAboutRefsInRender = true;
        }
      }

      if (componentOrHandle == null) {
        return null;
      } // For compatibility with Fabric instances

      if (
        componentOrHandle.canonical &&
        componentOrHandle.canonical.publicInstance
      ) {
        // $FlowExpectedError[incompatible-return] Can't refine componentOrHandle as a Fabric instance
        return componentOrHandle.canonical.publicInstance;
      } // For compatibility with legacy renderer instances

      if (componentOrHandle._nativeTag) {
        // $FlowFixMe[incompatible-exact] Necessary when running Flow on Fabric
        // $FlowFixMe[incompatible-return]
        return componentOrHandle;
      }

      var hostInstance;

      {
        hostInstance = findHostInstanceWithWarning(
          componentOrHandle,
          "findHostInstance_DEPRECATED"
        );
      } // findHostInstance handles legacy vs. Fabric differences correctly
      // $FlowFixMe[incompatible-exact] we need to fix the definition of `HostComponent` to use NativeMethods as an interface, not as a type.
      // $FlowFixMe[incompatible-return]

      return hostInstance;
    }
    function findNodeHandle(componentOrHandle) {
      {
        var owner = ReactCurrentOwner.current;

        if (owner !== null && owner.stateNode !== null) {
          if (!owner.stateNode._warnedAboutRefsInRender) {
            error(
              "%s is accessing findNodeHandle inside its render(). " +
                "render() should be a pure function of props and state. It should " +
                "never access something that requires stale data from the previous " +
                "render, such as refs. Move this logic to componentDidMount and " +
                "componentDidUpdate instead.",
              getComponentNameFromType(owner.type) || "A component"
            );
          }

          owner.stateNode._warnedAboutRefsInRender = true;
        }
      }

      if (componentOrHandle == null) {
        return null;
      }

      if (typeof componentOrHandle === "number") {
        // Already a node handle
        return componentOrHandle;
      } // For compatibility with legacy renderer instances

      if (componentOrHandle._nativeTag) {
        return componentOrHandle._nativeTag;
      } // For compatibility with Fabric instances

      if (
        componentOrHandle.canonical != null &&
        componentOrHandle.canonical.nativeTag != null
      ) {
        return componentOrHandle.canonical.nativeTag;
      } // For compatibility with Fabric public instances

      var nativeTag =
        ReactNativePrivateInterface.getNativeTagFromPublicInstance(
          componentOrHandle
        );

      if (nativeTag) {
        return nativeTag;
      }

      var hostInstance;

      {
        hostInstance = findHostInstanceWithWarning(
          componentOrHandle,
          "findNodeHandle"
        );
      }

      if (hostInstance == null) {
        // $FlowFixMe[incompatible-return] Flow limitation in refining an opaque type
        return hostInstance;
      }

      if (hostInstance._nativeTag != null) {
        // $FlowFixMe[incompatible-return] For compatibility with legacy renderer instances
        return hostInstance._nativeTag;
      } // $FlowFixMe[incompatible-call] Necessary when running Flow on the legacy renderer

      return ReactNativePrivateInterface.getNativeTagFromPublicInstance(
        hostInstance
      );
    }
    function dispatchCommand(handle, command, args) {
      var nativeTag =
        handle._nativeTag != null
          ? handle._nativeTag
          : ReactNativePrivateInterface.getNativeTagFromPublicInstance(handle);

      if (nativeTag == null) {
        {
          error(
            "dispatchCommand was called with a ref that isn't a " +
              "native component. Use React.forwardRef to get access to the underlying native component"
          );
        }

        return;
      }

      var node = ReactNativePrivateInterface.getNodeFromPublicInstance(handle);

      if (node != null) {
        nativeFabricUIManager.dispatchCommand(node, command, args);
      } else {
        ReactNativePrivateInterface.UIManager.dispatchViewManagerCommand(
          nativeTag,
          command,
          args
        );
      }
    }
    function sendAccessibilityEvent(handle, eventType) {
      var nativeTag =
        handle._nativeTag != null
          ? handle._nativeTag
          : ReactNativePrivateInterface.getNativeTagFromPublicInstance(handle);

      if (nativeTag == null) {
        {
          error(
            "sendAccessibilityEvent was called with a ref that isn't a " +
              "native component. Use React.forwardRef to get access to the underlying native component"
          );
        }

        return;
      }

      var node = ReactNativePrivateInterface.getNodeFromPublicInstance(handle);

      if (node != null) {
        nativeFabricUIManager.sendAccessibilityEvent(node, eventType);
      } else {
        ReactNativePrivateInterface.legacySendAccessibilityEvent(
          nativeTag,
          eventType
        );
      }
    }
    function getNodeFromInternalInstanceHandle(internalInstanceHandle) {
      return (
        // $FlowExpectedError[incompatible-return] internalInstanceHandle is opaque but we need to make an exception here.
        internalInstanceHandle && // $FlowExpectedError[incompatible-return]
        internalInstanceHandle.stateNode && // $FlowExpectedError[incompatible-use]
        internalInstanceHandle.stateNode.node
      );
    } // Should have been PublicInstance from ReactFiberConfigFabric
    // Should have been PublicInstance from ReactFiberConfigNative
    // Remove this once Paper is no longer supported and DOM Node API are enabled by default in RN.

    function isChildPublicInstance(parentInstance, childInstance) {
      {
        // Paper
        if (
          // $FlowExpectedError[incompatible-type]
          // $FlowExpectedError[prop-missing] Don't check via `instanceof ReactNativeFiberHostComponent`, so it won't be leaked to Fabric.
          parentInstance._internalFiberInstanceHandleDEV && // $FlowExpectedError[incompatible-type]
          // $FlowExpectedError[prop-missing] Don't check via `instanceof ReactNativeFiberHostComponent`, so it won't be leaked to Fabric.
          childInstance._internalFiberInstanceHandleDEV
        ) {
          return doesFiberContain(
            // $FlowExpectedError[incompatible-call]
            parentInstance._internalFiberInstanceHandleDEV, // $FlowExpectedError[incompatible-call]
            childInstance._internalFiberInstanceHandleDEV
          );
        }

        var parentInternalInstanceHandle = // $FlowExpectedError[incompatible-call] Type for parentInstance should have been PublicInstance from ReactFiberConfigFabric.
          ReactNativePrivateInterface.getInternalInstanceHandleFromPublicInstance(
            parentInstance
          );
        var childInternalInstanceHandle = // $FlowExpectedError[incompatible-call] Type for childInstance should have been PublicInstance from ReactFiberConfigFabric.
          ReactNativePrivateInterface.getInternalInstanceHandleFromPublicInstance(
            childInstance
          ); // Fabric

        if (
          parentInternalInstanceHandle != null &&
          childInternalInstanceHandle != null
        ) {
          return doesFiberContain(
            parentInternalInstanceHandle,
            childInternalInstanceHandle
          );
        } // Means that one instance is from Fabric and other is from Paper.

        return false;
      }
    }

    var emptyObject = {};

    {
      Object.freeze(emptyObject);
    } // $FlowFixMe[missing-local-annot]

    function createHierarchy(fiberHierarchy) {
      return fiberHierarchy.map(function (fiber) {
        return {
          name: getComponentNameFromType(fiber.type),
          getInspectorData: function (findNodeHandle) {
            return {
              props: getHostProps(fiber),
              measure: function (callback) {
                // If this is Fabric, we'll find a shadow node and use that to measure.
                var hostFiber = findCurrentHostFiber(fiber);
                var node =
                  hostFiber != null &&
                  hostFiber.stateNode !== null &&
                  hostFiber.stateNode.node;

                if (node) {
                  nativeFabricUIManager.measure(node, callback);
                } else {
                  return ReactNativePrivateInterface.UIManager.measure(
                    getHostNode(fiber, findNodeHandle),
                    callback
                  );
                }
              }
            };
          }
        };
      });
    } // $FlowFixMe[missing-local-annot]

    function getHostNode(fiber, findNodeHandle) {
      {
        var hostNode; // look for children first for the hostNode
        // as composite fibers do not have a hostNode

        while (fiber) {
          if (fiber.stateNode !== null && fiber.tag === HostComponent) {
            hostNode = findNodeHandle(fiber.stateNode);
          }

          if (hostNode) {
            return hostNode;
          }

          fiber = fiber.child;
        }

        return null;
      }
    } // $FlowFixMe[missing-local-annot]

    function getHostProps(fiber) {
      var host = findCurrentHostFiber(fiber);

      if (host) {
        return host.memoizedProps || emptyObject;
      }

      return emptyObject;
    }

    function getInspectorDataForInstance(closestInstance) {
      {
        // Handle case where user clicks outside of ReactNative
        if (!closestInstance) {
          return {
            hierarchy: [],
            props: emptyObject,
            selectedIndex: null,
            componentStack: ""
          };
        }

        var fiber = findCurrentFiberUsingSlowPath(closestInstance);
        var fiberHierarchy = getOwnerHierarchy(fiber);
        var instance = lastNonHostInstance(fiberHierarchy);
        var hierarchy = createHierarchy(fiberHierarchy);
        var props = getHostProps(instance);
        var selectedIndex = fiberHierarchy.indexOf(instance);
        var componentStack =
          fiber !== null ? getStackByFiberInDevAndProd(fiber) : "";
        return {
          closestInstance: instance,
          hierarchy: hierarchy,
          props: props,
          selectedIndex: selectedIndex,
          componentStack: componentStack
        };
      }
    }

    function getOwnerHierarchy(instance) {
      var hierarchy = [];
      traverseOwnerTreeUp(hierarchy, instance);
      return hierarchy;
    } // $FlowFixMe[missing-local-annot]

    function lastNonHostInstance(hierarchy) {
      for (var i = hierarchy.length - 1; i > 1; i--) {
        var instance = hierarchy[i];

        if (instance.tag !== HostComponent) {
          return instance;
        }
      }

      return hierarchy[0];
    } // $FlowFixMe[missing-local-annot]

    function traverseOwnerTreeUp(hierarchy, instance) {
      {
        if (instance) {
          hierarchy.unshift(instance);
          traverseOwnerTreeUp(hierarchy, instance._debugOwner);
        }
      }
    }

    function getInspectorDataForViewTag(viewTag) {
      {
        var closestInstance = getInstanceFromTag(viewTag);
        return getInspectorDataForInstance(closestInstance);
      }
    }

    function getInspectorDataForViewAtPoint(
      findNodeHandle,
      inspectedView,
      locationX,
      locationY,
      callback
    ) {
      {
        var closestInstance = null;
        var fabricNode =
          ReactNativePrivateInterface.getNodeFromPublicInstance(inspectedView);

        if (fabricNode) {
          // For Fabric we can look up the instance handle directly and measure it.
          nativeFabricUIManager.findNodeAtPoint(
            fabricNode,
            locationX,
            locationY,
            function (internalInstanceHandle) {
              var node =
                internalInstanceHandle != null
                  ? getNodeFromInternalInstanceHandle(internalInstanceHandle)
                  : null;

              if (internalInstanceHandle == null || node == null) {
                callback(
                  assign(
                    {
                      pointerY: locationY,
                      frame: {
                        left: 0,
                        top: 0,
                        width: 0,
                        height: 0
                      }
                    },
                    getInspectorDataForInstance(closestInstance)
                  )
                );
                return;
              }

              closestInstance =
                internalInstanceHandle.stateNode.canonical
                  .internalInstanceHandle; // Note: this is deprecated and we want to remove it ASAP. Keeping it here for React DevTools compatibility for now.

              var nativeViewTag =
                internalInstanceHandle.stateNode.canonical.nativeTag;
              nativeFabricUIManager.measure(
                node,
                function (x, y, width, height, pageX, pageY) {
                  var inspectorData =
                    getInspectorDataForInstance(closestInstance);
                  callback(
                    assign({}, inspectorData, {
                      pointerY: locationY,
                      frame: {
                        left: pageX,
                        top: pageY,
                        width: width,
                        height: height
                      },
                      touchedViewTag: nativeViewTag
                    })
                  );
                }
              );
            }
          );
        } else if (inspectedView._internalFiberInstanceHandleDEV != null) {
          // For Paper we fall back to the old strategy using the React tag.
          ReactNativePrivateInterface.UIManager.findSubviewIn(
            findNodeHandle(inspectedView),
            [locationX, locationY],
            function (nativeViewTag, left, top, width, height) {
              var inspectorData = getInspectorDataForInstance(
                getInstanceFromTag(nativeViewTag)
              );
              callback(
                assign({}, inspectorData, {
                  pointerY: locationY,
                  frame: {
                    left: left,
                    top: top,
                    width: width,
                    height: height
                  },
                  touchedViewTag: nativeViewTag
                })
              );
            }
          );
        } else {
          error(
            "getInspectorDataForViewAtPoint expects to receive a host component"
          );

          return;
        }
      }
    }

    function onRecoverableError(error$1) {
      // TODO: Expose onRecoverableError option to userspace
      // eslint-disable-next-line react-internal/no-production-logging, react-internal/warning-args
      error(error$1);
    }

    function render(element, containerTag, callback) {
      var root = roots.get(containerTag);

      if (!root) {
        // TODO (bvaughn): If we decide to keep the wrapper component,
        // We could create a wrapper for containerTag as well to reduce special casing.
        root = createContainer(
          containerTag,
          LegacyRoot,
          null,
          false,
          null,
          "",
          onRecoverableError,
          null
        );
        roots.set(containerTag, root);
      }

      updateContainer(element, root, null, callback);
      return getPublicRootInstance(root);
    }

    function unmountComponentAtNode(containerTag) {
      var root = roots.get(containerTag);

      if (root) {
        // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
        updateContainer(null, root, null, function () {
          roots.delete(containerTag);
        });
      }
    }

    function unmountComponentAtNodeAndRemoveContainer(containerTag) {
      unmountComponentAtNode(containerTag); // Call back into native to remove all of the subviews from this container

      ReactNativePrivateInterface.UIManager.removeRootView(containerTag);
    }

    function createPortal(children, containerTag) {
      var key =
        arguments.length > 2 && arguments[2] !== undefined
          ? arguments[2]
          : null;
      return createPortal$1(children, containerTag, null, key);
    }

    setBatchingImplementation(batchedUpdates);

    function computeComponentStackForErrorReporting(reactTag) {
      var fiber = getInstanceFromTag(reactTag);

      if (!fiber) {
        return "";
      }

      return getStackByFiberInDevAndProd(fiber);
    }

    var roots = new Map();
    var Internals = {
      computeComponentStackForErrorReporting:
        computeComponentStackForErrorReporting
    };
    injectIntoDevTools({
      findFiberByHostInstance: getInstanceFromTag,
      bundleType: 1,
      version: ReactVersion,
      rendererPackageName: "react-native-renderer",
      rendererConfig: {
        getInspectorDataForInstance: getInspectorDataForInstance,
        getInspectorDataForViewTag: getInspectorDataForViewTag,
        getInspectorDataForViewAtPoint: getInspectorDataForViewAtPoint.bind(
          null,
          findNodeHandle
        )
      }
    });

    exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Internals;
    exports.createPortal = createPortal;
    exports.dispatchCommand = dispatchCommand;
    exports.findHostInstance_DEPRECATED = findHostInstance_DEPRECATED;
    exports.findNodeHandle = findNodeHandle;
    exports.getInspectorDataForInstance = getInspectorDataForInstance;
    exports.isChildPublicInstance = isChildPublicInstance;
    exports.render = render;
    exports.sendAccessibilityEvent = sendAccessibilityEvent;
    exports.unmountComponentAtNode = unmountComponentAtNode;
    exports.unmountComponentAtNodeAndRemoveContainer =
      unmountComponentAtNodeAndRemoveContainer;
    exports.unstable_batchedUpdates = batchedUpdates$1;
    /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
    if (
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop ===
        "function"
    ) {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
    }
  })();
}
