/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @providesModule ReactFabric-prod
 * @preventMunge
 * @generated
 */

"use strict";
require("react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore");
var ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface"),
  React = require("react"),
  Scheduler = require("scheduler");
function invokeGuardedCallbackImpl(name, func, context, a, b, c, d, e, f) {
  var funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    this.onError(error);
  }
}
var hasError = !1,
  caughtError = null,
  hasRethrowError = !1,
  rethrowError = null,
  reporter = {
    onError: function(error) {
      hasError = !0;
      caughtError = error;
    }
  };
function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
  hasError = !1;
  caughtError = null;
  invokeGuardedCallbackImpl.apply(reporter, arguments);
}
function invokeGuardedCallbackAndCatchFirstError(
  name,
  func,
  context,
  a,
  b,
  c,
  d,
  e,
  f
) {
  invokeGuardedCallback.apply(this, arguments);
  if (hasError) {
    if (hasError) {
      var error = caughtError;
      hasError = !1;
      caughtError = null;
    } else
      throw Error(
        "clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue."
      );
    hasRethrowError || ((hasRethrowError = !0), (rethrowError = error));
  }
}
var getFiberCurrentPropsFromNode = null,
  getInstanceFromNode = null,
  getNodeFromInstance = null;
function executeDispatch(event, listener, inst) {
  var type = event.type || "unknown-event";
  event.currentTarget = getNodeFromInstance(inst);
  invokeGuardedCallbackAndCatchFirstError(type, listener, void 0, event);
  event.currentTarget = null;
}
function executeDirectDispatch(event) {
  var dispatchListener = event._dispatchListeners,
    dispatchInstance = event._dispatchInstances;
  if (Array.isArray(dispatchListener))
    throw Error("executeDirectDispatch(...): Invalid `event`.");
  event.currentTarget = dispatchListener
    ? getNodeFromInstance(dispatchInstance)
    : null;
  dispatchListener = dispatchListener ? dispatchListener(event) : null;
  event.currentTarget = null;
  event._dispatchListeners = null;
  event._dispatchInstances = null;
  return dispatchListener;
}
function functionThatReturnsTrue() {
  return !0;
}
function functionThatReturnsFalse() {
  return !1;
}
function SyntheticEvent(
  dispatchConfig,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  this.dispatchConfig = dispatchConfig;
  this._targetInst = targetInst;
  this.nativeEvent = nativeEvent;
  this._dispatchInstances = this._dispatchListeners = null;
  dispatchConfig = this.constructor.Interface;
  for (var propName in dispatchConfig)
    dispatchConfig.hasOwnProperty(propName) &&
      ((targetInst = dispatchConfig[propName])
        ? (this[propName] = targetInst(nativeEvent))
        : "target" === propName
        ? (this.target = nativeEventTarget)
        : (this[propName] = nativeEvent[propName]));
  this.isDefaultPrevented = (null != nativeEvent.defaultPrevented
  ? nativeEvent.defaultPrevented
  : !1 === nativeEvent.returnValue)
    ? functionThatReturnsTrue
    : functionThatReturnsFalse;
  this.isPropagationStopped = functionThatReturnsFalse;
  return this;
}
Object.assign(SyntheticEvent.prototype, {
  preventDefault: function() {
    this.defaultPrevented = !0;
    var event = this.nativeEvent;
    event &&
      (event.preventDefault
        ? event.preventDefault()
        : "unknown" !== typeof event.returnValue && (event.returnValue = !1),
      (this.isDefaultPrevented = functionThatReturnsTrue));
  },
  stopPropagation: function() {
    var event = this.nativeEvent;
    event &&
      (event.stopPropagation
        ? event.stopPropagation()
        : "unknown" !== typeof event.cancelBubble && (event.cancelBubble = !0),
      (this.isPropagationStopped = functionThatReturnsTrue));
  },
  persist: function() {
    this.isPersistent = functionThatReturnsTrue;
  },
  isPersistent: functionThatReturnsFalse,
  destructor: function() {
    var Interface = this.constructor.Interface,
      propName;
    for (propName in Interface) this[propName] = null;
    this.nativeEvent = this._targetInst = this.dispatchConfig = null;
    this.isPropagationStopped = this.isDefaultPrevented = functionThatReturnsFalse;
    this._dispatchInstances = this._dispatchListeners = null;
  }
});
SyntheticEvent.Interface = {
  type: null,
  target: null,
  currentTarget: function() {
    return null;
  },
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function(event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null
};
SyntheticEvent.extend = function(Interface) {
  function E() {}
  function Class() {
    return Super.apply(this, arguments);
  }
  var Super = this;
  E.prototype = Super.prototype;
  var prototype = new E();
  Object.assign(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;
  Class.Interface = Object.assign({}, Super.Interface, Interface);
  Class.extend = Super.extend;
  addEventPoolingTo(Class);
  return Class;
};
addEventPoolingTo(SyntheticEvent);
function createOrGetPooledEvent(
  dispatchConfig,
  targetInst,
  nativeEvent,
  nativeInst
) {
  if (this.eventPool.length) {
    var instance = this.eventPool.pop();
    this.call(instance, dispatchConfig, targetInst, nativeEvent, nativeInst);
    return instance;
  }
  return new this(dispatchConfig, targetInst, nativeEvent, nativeInst);
}
function releasePooledEvent(event) {
  if (!(event instanceof this))
    throw Error(
      "Trying to release an event instance into a pool of a different type."
    );
  event.destructor();
  10 > this.eventPool.length && this.eventPool.push(event);
}
function addEventPoolingTo(EventConstructor) {
  EventConstructor.getPooled = createOrGetPooledEvent;
  EventConstructor.eventPool = [];
  EventConstructor.release = releasePooledEvent;
}
var ResponderSyntheticEvent = SyntheticEvent.extend({
  touchHistory: function() {
    return null;
  }
});
function isStartish(topLevelType) {
  return "topTouchStart" === topLevelType;
}
function isMoveish(topLevelType) {
  return "topTouchMove" === topLevelType;
}
var startDependencies = ["topTouchStart"],
  moveDependencies = ["topTouchMove"],
  endDependencies = ["topTouchCancel", "topTouchEnd"],
  touchBank = [],
  touchHistory = {
    touchBank: touchBank,
    numberActiveTouches: 0,
    indexOfSingleActiveTouch: -1,
    mostRecentTimeStamp: 0
  };
function timestampForTouch(touch) {
  return touch.timeStamp || touch.timestamp;
}
function getTouchIdentifier(_ref) {
  _ref = _ref.identifier;
  if (null == _ref) throw Error("Touch object is missing identifier.");
  return _ref;
}
function recordTouchStart(touch) {
  var identifier = getTouchIdentifier(touch),
    touchRecord = touchBank[identifier];
  touchRecord
    ? ((touchRecord.touchActive = !0),
      (touchRecord.startPageX = touch.pageX),
      (touchRecord.startPageY = touch.pageY),
      (touchRecord.startTimeStamp = timestampForTouch(touch)),
      (touchRecord.currentPageX = touch.pageX),
      (touchRecord.currentPageY = touch.pageY),
      (touchRecord.currentTimeStamp = timestampForTouch(touch)),
      (touchRecord.previousPageX = touch.pageX),
      (touchRecord.previousPageY = touch.pageY),
      (touchRecord.previousTimeStamp = timestampForTouch(touch)))
    : ((touchRecord = {
        touchActive: !0,
        startPageX: touch.pageX,
        startPageY: touch.pageY,
        startTimeStamp: timestampForTouch(touch),
        currentPageX: touch.pageX,
        currentPageY: touch.pageY,
        currentTimeStamp: timestampForTouch(touch),
        previousPageX: touch.pageX,
        previousPageY: touch.pageY,
        previousTimeStamp: timestampForTouch(touch)
      }),
      (touchBank[identifier] = touchRecord));
  touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
}
function recordTouchMove(touch) {
  var touchRecord = touchBank[getTouchIdentifier(touch)];
  touchRecord &&
    ((touchRecord.touchActive = !0),
    (touchRecord.previousPageX = touchRecord.currentPageX),
    (touchRecord.previousPageY = touchRecord.currentPageY),
    (touchRecord.previousTimeStamp = touchRecord.currentTimeStamp),
    (touchRecord.currentPageX = touch.pageX),
    (touchRecord.currentPageY = touch.pageY),
    (touchRecord.currentTimeStamp = timestampForTouch(touch)),
    (touchHistory.mostRecentTimeStamp = timestampForTouch(touch)));
}
function recordTouchEnd(touch) {
  var touchRecord = touchBank[getTouchIdentifier(touch)];
  touchRecord &&
    ((touchRecord.touchActive = !1),
    (touchRecord.previousPageX = touchRecord.currentPageX),
    (touchRecord.previousPageY = touchRecord.currentPageY),
    (touchRecord.previousTimeStamp = touchRecord.currentTimeStamp),
    (touchRecord.currentPageX = touch.pageX),
    (touchRecord.currentPageY = touch.pageY),
    (touchRecord.currentTimeStamp = timestampForTouch(touch)),
    (touchHistory.mostRecentTimeStamp = timestampForTouch(touch)));
}
var ResponderTouchHistoryStore = {
  recordTouchTrack: function(topLevelType, nativeEvent) {
    if (isMoveish(topLevelType))
      nativeEvent.changedTouches.forEach(recordTouchMove);
    else if (isStartish(topLevelType))
      nativeEvent.changedTouches.forEach(recordTouchStart),
        (touchHistory.numberActiveTouches = nativeEvent.touches.length),
        1 === touchHistory.numberActiveTouches &&
          (touchHistory.indexOfSingleActiveTouch =
            nativeEvent.touches[0].identifier);
    else if (
      "topTouchEnd" === topLevelType ||
      "topTouchCancel" === topLevelType
    )
      if (
        (nativeEvent.changedTouches.forEach(recordTouchEnd),
        (touchHistory.numberActiveTouches = nativeEvent.touches.length),
        1 === touchHistory.numberActiveTouches)
      )
        for (topLevelType = 0; topLevelType < touchBank.length; topLevelType++)
          if (
            ((nativeEvent = touchBank[topLevelType]),
            null != nativeEvent && nativeEvent.touchActive)
          ) {
            touchHistory.indexOfSingleActiveTouch = topLevelType;
            break;
          }
  },
  touchHistory: touchHistory
};
function accumulate(current, next) {
  if (null == next)
    throw Error(
      "accumulate(...): Accumulated items must not be null or undefined."
    );
  return null == current
    ? next
    : Array.isArray(current)
    ? current.concat(next)
    : Array.isArray(next)
    ? [current].concat(next)
    : [current, next];
}
function accumulateInto(current, next) {
  if (null == next)
    throw Error(
      "accumulateInto(...): Accumulated items must not be null or undefined."
    );
  if (null == current) return next;
  if (Array.isArray(current)) {
    if (Array.isArray(next)) return current.push.apply(current, next), current;
    current.push(next);
    return current;
  }
  return Array.isArray(next) ? [current].concat(next) : [current, next];
}
function forEachAccumulated(arr, cb, scope) {
  Array.isArray(arr) ? arr.forEach(cb, scope) : arr && cb.call(scope, arr);
}
var responderInst = null,
  trackedTouchCount = 0;
function changeResponder(nextResponderInst, blockHostResponder) {
  var oldResponderInst = responderInst;
  responderInst = nextResponderInst;
  if (null !== ResponderEventPlugin.GlobalResponderHandler)
    ResponderEventPlugin.GlobalResponderHandler.onChange(
      oldResponderInst,
      nextResponderInst,
      blockHostResponder
    );
}
var eventTypes = {
  startShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onStartShouldSetResponder",
      captured: "onStartShouldSetResponderCapture"
    },
    dependencies: startDependencies
  },
  scrollShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onScrollShouldSetResponder",
      captured: "onScrollShouldSetResponderCapture"
    },
    dependencies: ["topScroll"]
  },
  selectionChangeShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onSelectionChangeShouldSetResponder",
      captured: "onSelectionChangeShouldSetResponderCapture"
    },
    dependencies: ["topSelectionChange"]
  },
  moveShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: "onMoveShouldSetResponder",
      captured: "onMoveShouldSetResponderCapture"
    },
    dependencies: moveDependencies
  },
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
  responderGrant: { registrationName: "onResponderGrant", dependencies: [] },
  responderReject: { registrationName: "onResponderReject", dependencies: [] },
  responderTerminate: {
    registrationName: "onResponderTerminate",
    dependencies: []
  }
};
function getParent(inst) {
  do inst = inst.return;
  while (inst && 5 !== inst.tag);
  return inst ? inst : null;
}
function traverseTwoPhase(inst, fn, arg) {
  for (var path = []; inst; ) path.push(inst), (inst = getParent(inst));
  for (inst = path.length; 0 < inst--; ) fn(path[inst], "captured", arg);
  for (inst = 0; inst < path.length; inst++) fn(path[inst], "bubbled", arg);
}
function getListener(inst, registrationName) {
  inst = inst.stateNode;
  if (null === inst) return null;
  inst = getFiberCurrentPropsFromNode(inst);
  if (null === inst) return null;
  if ((inst = inst[registrationName]) && "function" !== typeof inst)
    throw Error(
      "Expected `" +
        registrationName +
        "` listener to be a function, instead got a value of `" +
        typeof inst +
        "` type."
    );
  return inst;
}
function accumulateDirectionalDispatches(inst, phase, event) {
  if (
    (phase = getListener(
      inst,
      event.dispatchConfig.phasedRegistrationNames[phase]
    ))
  )
    (event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      phase
    )),
      (event._dispatchInstances = accumulateInto(
        event._dispatchInstances,
        inst
      ));
}
function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    var inst = event._targetInst;
    if (inst && event && event.dispatchConfig.registrationName) {
      var listener = getListener(inst, event.dispatchConfig.registrationName);
      listener &&
        ((event._dispatchListeners = accumulateInto(
          event._dispatchListeners,
          listener
        )),
        (event._dispatchInstances = accumulateInto(
          event._dispatchInstances,
          inst
        )));
    }
  }
}
function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    var targetInst = event._targetInst;
    targetInst = targetInst ? getParent(targetInst) : null;
    traverseTwoPhase(targetInst, accumulateDirectionalDispatches, event);
  }
}
function accumulateTwoPhaseDispatchesSingle(event) {
  event &&
    event.dispatchConfig.phasedRegistrationNames &&
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
}
var ResponderEventPlugin = {
    _getResponder: function() {
      return responderInst;
    },
    eventTypes: eventTypes,
    extractEvents: function(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    ) {
      if (isStartish(topLevelType)) trackedTouchCount += 1;
      else if (
        "topTouchEnd" === topLevelType ||
        "topTouchCancel" === topLevelType
      )
        if (0 <= trackedTouchCount) --trackedTouchCount;
        else return null;
      ResponderTouchHistoryStore.recordTouchTrack(topLevelType, nativeEvent);
      if (
        targetInst &&
        (("topScroll" === topLevelType && !nativeEvent.responderIgnoreScroll) ||
          (0 < trackedTouchCount && "topSelectionChange" === topLevelType) ||
          isStartish(topLevelType) ||
          isMoveish(topLevelType))
      ) {
        var shouldSetEventType = isStartish(topLevelType)
          ? eventTypes.startShouldSetResponder
          : isMoveish(topLevelType)
          ? eventTypes.moveShouldSetResponder
          : "topSelectionChange" === topLevelType
          ? eventTypes.selectionChangeShouldSetResponder
          : eventTypes.scrollShouldSetResponder;
        if (responderInst)
          b: {
            var JSCompiler_temp = responderInst;
            for (
              var depthA = 0, tempA = JSCompiler_temp;
              tempA;
              tempA = getParent(tempA)
            )
              depthA++;
            tempA = 0;
            for (var tempB = targetInst; tempB; tempB = getParent(tempB))
              tempA++;
            for (; 0 < depthA - tempA; )
              (JSCompiler_temp = getParent(JSCompiler_temp)), depthA--;
            for (; 0 < tempA - depthA; )
              (targetInst = getParent(targetInst)), tempA--;
            for (; depthA--; ) {
              if (
                JSCompiler_temp === targetInst ||
                JSCompiler_temp === targetInst.alternate
              )
                break b;
              JSCompiler_temp = getParent(JSCompiler_temp);
              targetInst = getParent(targetInst);
            }
            JSCompiler_temp = null;
          }
        else JSCompiler_temp = targetInst;
        targetInst = JSCompiler_temp;
        JSCompiler_temp = targetInst === responderInst;
        shouldSetEventType = ResponderSyntheticEvent.getPooled(
          shouldSetEventType,
          targetInst,
          nativeEvent,
          nativeEventTarget
        );
        shouldSetEventType.touchHistory =
          ResponderTouchHistoryStore.touchHistory;
        JSCompiler_temp
          ? forEachAccumulated(
              shouldSetEventType,
              accumulateTwoPhaseDispatchesSingleSkipTarget
            )
          : forEachAccumulated(
              shouldSetEventType,
              accumulateTwoPhaseDispatchesSingle
            );
        b: {
          JSCompiler_temp = shouldSetEventType._dispatchListeners;
          targetInst = shouldSetEventType._dispatchInstances;
          if (Array.isArray(JSCompiler_temp))
            for (
              depthA = 0;
              depthA < JSCompiler_temp.length &&
              !shouldSetEventType.isPropagationStopped();
              depthA++
            ) {
              if (
                JSCompiler_temp[depthA](shouldSetEventType, targetInst[depthA])
              ) {
                JSCompiler_temp = targetInst[depthA];
                break b;
              }
            }
          else if (
            JSCompiler_temp &&
            JSCompiler_temp(shouldSetEventType, targetInst)
          ) {
            JSCompiler_temp = targetInst;
            break b;
          }
          JSCompiler_temp = null;
        }
        shouldSetEventType._dispatchInstances = null;
        shouldSetEventType._dispatchListeners = null;
        shouldSetEventType.isPersistent() ||
          shouldSetEventType.constructor.release(shouldSetEventType);
        if (JSCompiler_temp && JSCompiler_temp !== responderInst)
          if (
            ((shouldSetEventType = ResponderSyntheticEvent.getPooled(
              eventTypes.responderGrant,
              JSCompiler_temp,
              nativeEvent,
              nativeEventTarget
            )),
            (shouldSetEventType.touchHistory =
              ResponderTouchHistoryStore.touchHistory),
            forEachAccumulated(
              shouldSetEventType,
              accumulateDirectDispatchesSingle
            ),
            (targetInst = !0 === executeDirectDispatch(shouldSetEventType)),
            responderInst)
          )
            if (
              ((depthA = ResponderSyntheticEvent.getPooled(
                eventTypes.responderTerminationRequest,
                responderInst,
                nativeEvent,
                nativeEventTarget
              )),
              (depthA.touchHistory = ResponderTouchHistoryStore.touchHistory),
              forEachAccumulated(depthA, accumulateDirectDispatchesSingle),
              (tempA =
                !depthA._dispatchListeners || executeDirectDispatch(depthA)),
              depthA.isPersistent() || depthA.constructor.release(depthA),
              tempA)
            ) {
              depthA = ResponderSyntheticEvent.getPooled(
                eventTypes.responderTerminate,
                responderInst,
                nativeEvent,
                nativeEventTarget
              );
              depthA.touchHistory = ResponderTouchHistoryStore.touchHistory;
              forEachAccumulated(depthA, accumulateDirectDispatchesSingle);
              var JSCompiler_temp$jscomp$0 = accumulate(
                JSCompiler_temp$jscomp$0,
                [shouldSetEventType, depthA]
              );
              changeResponder(JSCompiler_temp, targetInst);
            } else
              (shouldSetEventType = ResponderSyntheticEvent.getPooled(
                eventTypes.responderReject,
                JSCompiler_temp,
                nativeEvent,
                nativeEventTarget
              )),
                (shouldSetEventType.touchHistory =
                  ResponderTouchHistoryStore.touchHistory),
                forEachAccumulated(
                  shouldSetEventType,
                  accumulateDirectDispatchesSingle
                ),
                (JSCompiler_temp$jscomp$0 = accumulate(
                  JSCompiler_temp$jscomp$0,
                  shouldSetEventType
                ));
          else
            (JSCompiler_temp$jscomp$0 = accumulate(
              JSCompiler_temp$jscomp$0,
              shouldSetEventType
            )),
              changeResponder(JSCompiler_temp, targetInst);
        else JSCompiler_temp$jscomp$0 = null;
      } else JSCompiler_temp$jscomp$0 = null;
      shouldSetEventType = responderInst && isStartish(topLevelType);
      JSCompiler_temp = responderInst && isMoveish(topLevelType);
      targetInst =
        responderInst &&
        ("topTouchEnd" === topLevelType || "topTouchCancel" === topLevelType);
      if (
        (shouldSetEventType = shouldSetEventType
          ? eventTypes.responderStart
          : JSCompiler_temp
          ? eventTypes.responderMove
          : targetInst
          ? eventTypes.responderEnd
          : null)
      )
        (shouldSetEventType = ResponderSyntheticEvent.getPooled(
          shouldSetEventType,
          responderInst,
          nativeEvent,
          nativeEventTarget
        )),
          (shouldSetEventType.touchHistory =
            ResponderTouchHistoryStore.touchHistory),
          forEachAccumulated(
            shouldSetEventType,
            accumulateDirectDispatchesSingle
          ),
          (JSCompiler_temp$jscomp$0 = accumulate(
            JSCompiler_temp$jscomp$0,
            shouldSetEventType
          ));
      shouldSetEventType = responderInst && "topTouchCancel" === topLevelType;
      if (
        (topLevelType =
          responderInst &&
          !shouldSetEventType &&
          ("topTouchEnd" === topLevelType || "topTouchCancel" === topLevelType))
      )
        a: {
          if ((topLevelType = nativeEvent.touches) && 0 !== topLevelType.length)
            for (
              JSCompiler_temp = 0;
              JSCompiler_temp < topLevelType.length;
              JSCompiler_temp++
            )
              if (
                ((targetInst = topLevelType[JSCompiler_temp].target),
                null !== targetInst &&
                  void 0 !== targetInst &&
                  0 !== targetInst)
              ) {
                depthA = getInstanceFromNode(targetInst);
                b: {
                  for (targetInst = responderInst; depthA; ) {
                    if (
                      targetInst === depthA ||
                      targetInst === depthA.alternate
                    ) {
                      targetInst = !0;
                      break b;
                    }
                    depthA = getParent(depthA);
                  }
                  targetInst = !1;
                }
                if (targetInst) {
                  topLevelType = !1;
                  break a;
                }
              }
          topLevelType = !0;
        }
      if (
        (topLevelType = shouldSetEventType
          ? eventTypes.responderTerminate
          : topLevelType
          ? eventTypes.responderRelease
          : null)
      )
        (nativeEvent = ResponderSyntheticEvent.getPooled(
          topLevelType,
          responderInst,
          nativeEvent,
          nativeEventTarget
        )),
          (nativeEvent.touchHistory = ResponderTouchHistoryStore.touchHistory),
          forEachAccumulated(nativeEvent, accumulateDirectDispatchesSingle),
          (JSCompiler_temp$jscomp$0 = accumulate(
            JSCompiler_temp$jscomp$0,
            nativeEvent
          )),
          changeResponder(null);
      return JSCompiler_temp$jscomp$0;
    },
    GlobalResponderHandler: null,
    injection: {
      injectGlobalResponderHandler: function(GlobalResponderHandler) {
        ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
      }
    }
  },
  eventPluginOrder = null,
  namesToPlugins = {};
function recomputePluginOrdering() {
  if (eventPluginOrder)
    for (var pluginName in namesToPlugins) {
      var pluginModule = namesToPlugins[pluginName],
        pluginIndex = eventPluginOrder.indexOf(pluginName);
      if (!(-1 < pluginIndex))
        throw Error(
          "EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" +
            pluginName +
            "`."
        );
      if (!plugins[pluginIndex]) {
        if (!pluginModule.extractEvents)
          throw Error(
            "EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" +
              pluginName +
              "` does not."
          );
        plugins[pluginIndex] = pluginModule;
        pluginIndex = pluginModule.eventTypes;
        for (var eventName in pluginIndex) {
          var JSCompiler_inline_result = void 0;
          var dispatchConfig = pluginIndex[eventName],
            eventName$jscomp$0 = eventName;
          if (eventNameDispatchConfigs.hasOwnProperty(eventName$jscomp$0))
            throw Error(
              "EventPluginRegistry: More than one plugin attempted to publish the same event name, `" +
                eventName$jscomp$0 +
                "`."
            );
          eventNameDispatchConfigs[eventName$jscomp$0] = dispatchConfig;
          var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
          if (phasedRegistrationNames) {
            for (JSCompiler_inline_result in phasedRegistrationNames)
              phasedRegistrationNames.hasOwnProperty(
                JSCompiler_inline_result
              ) &&
                publishRegistrationName(
                  phasedRegistrationNames[JSCompiler_inline_result],
                  pluginModule,
                  eventName$jscomp$0
                );
            JSCompiler_inline_result = !0;
          } else
            dispatchConfig.registrationName
              ? (publishRegistrationName(
                  dispatchConfig.registrationName,
                  pluginModule,
                  eventName$jscomp$0
                ),
                (JSCompiler_inline_result = !0))
              : (JSCompiler_inline_result = !1);
          if (!JSCompiler_inline_result)
            throw Error(
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
function publishRegistrationName(registrationName, pluginModule) {
  if (registrationNameModules[registrationName])
    throw Error(
      "EventPluginRegistry: More than one plugin attempted to publish the same registration name, `" +
        registrationName +
        "`."
    );
  registrationNameModules[registrationName] = pluginModule;
}
var plugins = [],
  eventNameDispatchConfigs = {},
  registrationNameModules = {};
function getListener$1(inst, registrationName) {
  inst = inst.stateNode;
  if (null === inst) return null;
  inst = getFiberCurrentPropsFromNode(inst);
  if (null === inst) return null;
  if ((inst = inst[registrationName]) && "function" !== typeof inst)
    throw Error(
      "Expected `" +
        registrationName +
        "` listener to be a function, instead got a value of `" +
        typeof inst +
        "` type."
    );
  return inst;
}
var customBubblingEventTypes =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry
      .customBubblingEventTypes,
  customDirectEventTypes =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry
      .customDirectEventTypes;
function accumulateDirectionalDispatches$1(inst, phase, event) {
  if (
    (phase = getListener$1(
      inst,
      event.dispatchConfig.phasedRegistrationNames[phase]
    ))
  )
    (event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      phase
    )),
      (event._dispatchInstances = accumulateInto(
        event._dispatchInstances,
        inst
      ));
}
function accumulateTwoPhaseDispatchesSingle$1(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    for (var inst = event._targetInst, path = []; inst; ) {
      path.push(inst);
      do inst = inst.return;
      while (inst && 5 !== inst.tag);
      inst = inst ? inst : null;
    }
    for (inst = path.length; 0 < inst--; )
      accumulateDirectionalDispatches$1(path[inst], "captured", event);
    for (inst = 0; inst < path.length; inst++)
      accumulateDirectionalDispatches$1(path[inst], "bubbled", event);
  }
}
function accumulateDirectDispatchesSingle$1(event) {
  if (event && event.dispatchConfig.registrationName) {
    var inst = event._targetInst;
    if (inst && event && event.dispatchConfig.registrationName) {
      var listener = getListener$1(inst, event.dispatchConfig.registrationName);
      listener &&
        ((event._dispatchListeners = accumulateInto(
          event._dispatchListeners,
          listener
        )),
        (event._dispatchInstances = accumulateInto(
          event._dispatchInstances,
          inst
        )));
    }
  }
}
if (eventPluginOrder)
  throw Error(
    "EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React."
  );
eventPluginOrder = Array.prototype.slice.call([
  "ResponderEventPlugin",
  "ReactNativeBridgeEventPlugin"
]);
recomputePluginOrdering();
var injectedNamesToPlugins$jscomp$inline_219 = {
    ResponderEventPlugin: ResponderEventPlugin,
    ReactNativeBridgeEventPlugin: {
      eventTypes: {},
      extractEvents: function(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget
      ) {
        if (null == targetInst) return null;
        var bubbleDispatchConfig = customBubblingEventTypes[topLevelType],
          directDispatchConfig = customDirectEventTypes[topLevelType];
        if (!bubbleDispatchConfig && !directDispatchConfig)
          throw Error(
            'Unsupported top level event type "' + topLevelType + '" dispatched'
          );
        topLevelType = SyntheticEvent.getPooled(
          bubbleDispatchConfig || directDispatchConfig,
          targetInst,
          nativeEvent,
          nativeEventTarget
        );
        if (bubbleDispatchConfig)
          forEachAccumulated(
            topLevelType,
            accumulateTwoPhaseDispatchesSingle$1
          );
        else if (directDispatchConfig)
          forEachAccumulated(topLevelType, accumulateDirectDispatchesSingle$1);
        else return null;
        return topLevelType;
      }
    }
  },
  isOrderingDirty$jscomp$inline_220 = !1,
  pluginName$jscomp$inline_221;
for (pluginName$jscomp$inline_221 in injectedNamesToPlugins$jscomp$inline_219)
  if (
    injectedNamesToPlugins$jscomp$inline_219.hasOwnProperty(
      pluginName$jscomp$inline_221
    )
  ) {
    var pluginModule$jscomp$inline_222 =
      injectedNamesToPlugins$jscomp$inline_219[pluginName$jscomp$inline_221];
    if (
      !namesToPlugins.hasOwnProperty(pluginName$jscomp$inline_221) ||
      namesToPlugins[pluginName$jscomp$inline_221] !==
        pluginModule$jscomp$inline_222
    ) {
      if (namesToPlugins[pluginName$jscomp$inline_221])
        throw Error(
          "EventPluginRegistry: Cannot inject two different event plugins using the same name, `" +
            pluginName$jscomp$inline_221 +
            "`."
        );
      namesToPlugins[
        pluginName$jscomp$inline_221
      ] = pluginModule$jscomp$inline_222;
      isOrderingDirty$jscomp$inline_220 = !0;
    }
  }
isOrderingDirty$jscomp$inline_220 && recomputePluginOrdering();
function getInstanceFromInstance(instanceHandle) {
  return instanceHandle;
}
getFiberCurrentPropsFromNode = function(inst) {
  return inst.canonical.currentProps;
};
getInstanceFromNode = getInstanceFromInstance;
getNodeFromInstance = function(inst) {
  inst = inst.stateNode.canonical;
  if (!inst._nativeTag) throw Error("All native instances should have a tag.");
  return inst;
};
ResponderEventPlugin.injection.injectGlobalResponderHandler({
  onChange: function(from, to, blockNativeResponder) {
    null !== to
      ? ReactNativePrivateInterface.UIManager.setJSResponder(
          to.stateNode.canonical._nativeTag,
          blockNativeResponder
        )
      : ReactNativePrivateInterface.UIManager.clearJSResponder();
  }
});
var ReactSharedInternals =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  REACT_ELEMENT_TYPE = 60103,
  REACT_PORTAL_TYPE = 60106,
  REACT_FRAGMENT_TYPE = 60107,
  REACT_STRICT_MODE_TYPE = 60108,
  REACT_PROFILER_TYPE = 60114,
  REACT_PROVIDER_TYPE = 60109,
  REACT_CONTEXT_TYPE = 60110,
  REACT_FORWARD_REF_TYPE = 60112,
  REACT_SUSPENSE_TYPE = 60113,
  REACT_SUSPENSE_LIST_TYPE = 60120,
  REACT_MEMO_TYPE = 60115,
  REACT_LAZY_TYPE = 60116,
  REACT_DEBUG_TRACING_MODE_TYPE = 60129,
  REACT_OFFSCREEN_TYPE = 60130,
  REACT_LEGACY_HIDDEN_TYPE = 60131;
if ("function" === typeof Symbol && Symbol.for) {
  var symbolFor = Symbol.for;
  REACT_ELEMENT_TYPE = symbolFor("react.element");
  REACT_PORTAL_TYPE = symbolFor("react.portal");
  REACT_FRAGMENT_TYPE = symbolFor("react.fragment");
  REACT_STRICT_MODE_TYPE = symbolFor("react.strict_mode");
  REACT_PROFILER_TYPE = symbolFor("react.profiler");
  REACT_PROVIDER_TYPE = symbolFor("react.provider");
  REACT_CONTEXT_TYPE = symbolFor("react.context");
  REACT_FORWARD_REF_TYPE = symbolFor("react.forward_ref");
  REACT_SUSPENSE_TYPE = symbolFor("react.suspense");
  REACT_SUSPENSE_LIST_TYPE = symbolFor("react.suspense_list");
  REACT_MEMO_TYPE = symbolFor("react.memo");
  REACT_LAZY_TYPE = symbolFor("react.lazy");
  symbolFor("react.scope");
  REACT_DEBUG_TRACING_MODE_TYPE = symbolFor("react.debug_trace_mode");
  REACT_OFFSCREEN_TYPE = symbolFor("react.offscreen");
  REACT_LEGACY_HIDDEN_TYPE = symbolFor("react.legacy_hidden");
}
var MAYBE_ITERATOR_SYMBOL = "function" === typeof Symbol && Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
function getComponentName(type) {
  if (null == type) return null;
  if ("function" === typeof type) return type.displayName || type.name || null;
  if ("string" === typeof type) return type;
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
  if ("object" === typeof type)
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return (type.displayName || "Context") + ".Consumer";
      case REACT_PROVIDER_TYPE:
        return (type._context.displayName || "Context") + ".Provider";
      case REACT_FORWARD_REF_TYPE:
        var innerType = type.render;
        innerType = innerType.displayName || innerType.name || "";
        return (
          type.displayName ||
          ("" !== innerType ? "ForwardRef(" + innerType + ")" : "ForwardRef")
        );
      case REACT_MEMO_TYPE:
        return getComponentName(type.type);
      case REACT_LAZY_TYPE:
        innerType = type._payload;
        type = type._init;
        try {
          return getComponentName(type(innerType));
        } catch (x) {}
    }
  return null;
}
function getNearestMountedFiber(fiber) {
  var node = fiber,
    nearestMounted = fiber;
  if (fiber.alternate) for (; node.return; ) node = node.return;
  else {
    fiber = node;
    do
      (node = fiber),
        0 !== (node.flags & 1026) && (nearestMounted = node.return),
        (fiber = node.return);
    while (fiber);
  }
  return 3 === node.tag ? nearestMounted : null;
}
function assertIsMounted(fiber) {
  if (getNearestMountedFiber(fiber) !== fiber)
    throw Error("Unable to find node on an unmounted component.");
}
function findCurrentFiberUsingSlowPath(fiber) {
  var alternate = fiber.alternate;
  if (!alternate) {
    alternate = getNearestMountedFiber(fiber);
    if (null === alternate)
      throw Error("Unable to find node on an unmounted component.");
    return alternate !== fiber ? null : fiber;
  }
  for (var a = fiber, b = alternate; ; ) {
    var parentA = a.return;
    if (null === parentA) break;
    var parentB = parentA.alternate;
    if (null === parentB) {
      b = parentA.return;
      if (null !== b) {
        a = b;
        continue;
      }
      break;
    }
    if (parentA.child === parentB.child) {
      for (parentB = parentA.child; parentB; ) {
        if (parentB === a) return assertIsMounted(parentA), fiber;
        if (parentB === b) return assertIsMounted(parentA), alternate;
        parentB = parentB.sibling;
      }
      throw Error("Unable to find node on an unmounted component.");
    }
    if (a.return !== b.return) (a = parentA), (b = parentB);
    else {
      for (var didFindChild = !1, child$0 = parentA.child; child$0; ) {
        if (child$0 === a) {
          didFindChild = !0;
          a = parentA;
          b = parentB;
          break;
        }
        if (child$0 === b) {
          didFindChild = !0;
          b = parentA;
          a = parentB;
          break;
        }
        child$0 = child$0.sibling;
      }
      if (!didFindChild) {
        for (child$0 = parentB.child; child$0; ) {
          if (child$0 === a) {
            didFindChild = !0;
            a = parentB;
            b = parentA;
            break;
          }
          if (child$0 === b) {
            didFindChild = !0;
            b = parentB;
            a = parentA;
            break;
          }
          child$0 = child$0.sibling;
        }
        if (!didFindChild)
          throw Error(
            "Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue."
          );
      }
    }
    if (a.alternate !== b)
      throw Error(
        "Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue."
      );
  }
  if (3 !== a.tag)
    throw Error("Unable to find node on an unmounted component.");
  return a.stateNode.current === a ? fiber : alternate;
}
function findCurrentHostFiber(parent) {
  parent = findCurrentFiberUsingSlowPath(parent);
  if (!parent) return null;
  for (var node = parent; ; ) {
    if (5 === node.tag || 6 === node.tag) return node;
    if (node.child) (node.child.return = node), (node = node.child);
    else {
      if (node === parent) break;
      for (; !node.sibling; ) {
        if (!node.return || node.return === parent) return null;
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
  return null;
}
function doesFiberContain(parentFiber, childFiber) {
  for (
    var parentFiberAlternate = parentFiber.alternate;
    null !== childFiber;

  ) {
    if (childFiber === parentFiber || childFiber === parentFiberAlternate)
      return !0;
    childFiber = childFiber.return;
  }
  return !1;
}
function mountSafeCallback_NOT_REALLY_SAFE(context, callback) {
  return function() {
    if (
      callback &&
      ("boolean" !== typeof context.__isMounted || context.__isMounted)
    )
      return callback.apply(context, arguments);
  };
}
var emptyObject = {},
  removedKeys = null,
  removedKeyCount = 0,
  deepDifferOptions = { unsafelyIgnoreFunctions: !0 };
function defaultDiffer(prevProp, nextProp) {
  return "object" !== typeof nextProp || null === nextProp
    ? !0
    : ReactNativePrivateInterface.deepDiffer(
        prevProp,
        nextProp,
        deepDifferOptions
      );
}
function restoreDeletedValuesInNestedArray(
  updatePayload,
  node,
  validAttributes
) {
  if (Array.isArray(node))
    for (var i = node.length; i-- && 0 < removedKeyCount; )
      restoreDeletedValuesInNestedArray(
        updatePayload,
        node[i],
        validAttributes
      );
  else if (node && 0 < removedKeyCount)
    for (i in removedKeys)
      if (removedKeys[i]) {
        var nextProp = node[i];
        if (void 0 !== nextProp) {
          var attributeConfig = validAttributes[i];
          if (attributeConfig) {
            "function" === typeof nextProp && (nextProp = !0);
            "undefined" === typeof nextProp && (nextProp = null);
            if ("object" !== typeof attributeConfig)
              updatePayload[i] = nextProp;
            else if (
              "function" === typeof attributeConfig.diff ||
              "function" === typeof attributeConfig.process
            )
              (nextProp =
                "function" === typeof attributeConfig.process
                  ? attributeConfig.process(nextProp)
                  : nextProp),
                (updatePayload[i] = nextProp);
            removedKeys[i] = !1;
            removedKeyCount--;
          }
        }
      }
}
function diffNestedProperty(
  updatePayload,
  prevProp,
  nextProp,
  validAttributes
) {
  if (!updatePayload && prevProp === nextProp) return updatePayload;
  if (!prevProp || !nextProp)
    return nextProp
      ? addNestedProperty(updatePayload, nextProp, validAttributes)
      : prevProp
      ? clearNestedProperty(updatePayload, prevProp, validAttributes)
      : updatePayload;
  if (!Array.isArray(prevProp) && !Array.isArray(nextProp))
    return diffProperties(updatePayload, prevProp, nextProp, validAttributes);
  if (Array.isArray(prevProp) && Array.isArray(nextProp)) {
    var minLength =
        prevProp.length < nextProp.length ? prevProp.length : nextProp.length,
      i;
    for (i = 0; i < minLength; i++)
      updatePayload = diffNestedProperty(
        updatePayload,
        prevProp[i],
        nextProp[i],
        validAttributes
      );
    for (; i < prevProp.length; i++)
      updatePayload = clearNestedProperty(
        updatePayload,
        prevProp[i],
        validAttributes
      );
    for (; i < nextProp.length; i++)
      updatePayload = addNestedProperty(
        updatePayload,
        nextProp[i],
        validAttributes
      );
    return updatePayload;
  }
  return Array.isArray(prevProp)
    ? diffProperties(
        updatePayload,
        ReactNativePrivateInterface.flattenStyle(prevProp),
        nextProp,
        validAttributes
      )
    : diffProperties(
        updatePayload,
        prevProp,
        ReactNativePrivateInterface.flattenStyle(nextProp),
        validAttributes
      );
}
function addNestedProperty(updatePayload, nextProp, validAttributes) {
  if (!nextProp) return updatePayload;
  if (!Array.isArray(nextProp))
    return diffProperties(
      updatePayload,
      emptyObject,
      nextProp,
      validAttributes
    );
  for (var i = 0; i < nextProp.length; i++)
    updatePayload = addNestedProperty(
      updatePayload,
      nextProp[i],
      validAttributes
    );
  return updatePayload;
}
function clearNestedProperty(updatePayload, prevProp, validAttributes) {
  if (!prevProp) return updatePayload;
  if (!Array.isArray(prevProp))
    return diffProperties(
      updatePayload,
      prevProp,
      emptyObject,
      validAttributes
    );
  for (var i = 0; i < prevProp.length; i++)
    updatePayload = clearNestedProperty(
      updatePayload,
      prevProp[i],
      validAttributes
    );
  return updatePayload;
}
function diffProperties(updatePayload, prevProps, nextProps, validAttributes) {
  var attributeConfig, propKey;
  for (propKey in nextProps)
    if ((attributeConfig = validAttributes[propKey])) {
      var prevProp = prevProps[propKey];
      var nextProp = nextProps[propKey];
      "function" === typeof nextProp &&
        ((nextProp = !0), "function" === typeof prevProp && (prevProp = !0));
      "undefined" === typeof nextProp &&
        ((nextProp = null),
        "undefined" === typeof prevProp && (prevProp = null));
      removedKeys && (removedKeys[propKey] = !1);
      if (updatePayload && void 0 !== updatePayload[propKey])
        if ("object" !== typeof attributeConfig)
          updatePayload[propKey] = nextProp;
        else {
          if (
            "function" === typeof attributeConfig.diff ||
            "function" === typeof attributeConfig.process
          )
            (attributeConfig =
              "function" === typeof attributeConfig.process
                ? attributeConfig.process(nextProp)
                : nextProp),
              (updatePayload[propKey] = attributeConfig);
        }
      else if (prevProp !== nextProp)
        if ("object" !== typeof attributeConfig)
          defaultDiffer(prevProp, nextProp) &&
            ((updatePayload || (updatePayload = {}))[propKey] = nextProp);
        else if (
          "function" === typeof attributeConfig.diff ||
          "function" === typeof attributeConfig.process
        ) {
          if (
            void 0 === prevProp ||
            ("function" === typeof attributeConfig.diff
              ? attributeConfig.diff(prevProp, nextProp)
              : defaultDiffer(prevProp, nextProp))
          )
            (attributeConfig =
              "function" === typeof attributeConfig.process
                ? attributeConfig.process(nextProp)
                : nextProp),
              ((updatePayload || (updatePayload = {}))[
                propKey
              ] = attributeConfig);
        } else
          (removedKeys = null),
            (removedKeyCount = 0),
            (updatePayload = diffNestedProperty(
              updatePayload,
              prevProp,
              nextProp,
              attributeConfig
            )),
            0 < removedKeyCount &&
              updatePayload &&
              (restoreDeletedValuesInNestedArray(
                updatePayload,
                nextProp,
                attributeConfig
              ),
              (removedKeys = null));
    }
  for (var propKey$2 in prevProps)
    void 0 === nextProps[propKey$2] &&
      (!(attributeConfig = validAttributes[propKey$2]) ||
        (updatePayload && void 0 !== updatePayload[propKey$2]) ||
        ((prevProp = prevProps[propKey$2]),
        void 0 !== prevProp &&
          ("object" !== typeof attributeConfig ||
          "function" === typeof attributeConfig.diff ||
          "function" === typeof attributeConfig.process
            ? (((updatePayload || (updatePayload = {}))[propKey$2] = null),
              removedKeys || (removedKeys = {}),
              removedKeys[propKey$2] ||
                ((removedKeys[propKey$2] = !0), removedKeyCount++))
            : (updatePayload = clearNestedProperty(
                updatePayload,
                prevProp,
                attributeConfig
              )))));
  return updatePayload;
}
function batchedUpdatesImpl(fn, bookkeeping) {
  return fn(bookkeeping);
}
var isInsideEventHandler = !1;
function batchedUpdates(fn, bookkeeping) {
  if (isInsideEventHandler) return fn(bookkeeping);
  isInsideEventHandler = !0;
  try {
    return batchedUpdatesImpl(fn, bookkeeping);
  } finally {
    isInsideEventHandler = !1;
  }
}
var eventQueue = null;
function executeDispatchesAndReleaseTopLevel(e) {
  if (e) {
    var dispatchListeners = e._dispatchListeners,
      dispatchInstances = e._dispatchInstances;
    if (Array.isArray(dispatchListeners))
      for (
        var i = 0;
        i < dispatchListeners.length && !e.isPropagationStopped();
        i++
      )
        executeDispatch(e, dispatchListeners[i], dispatchInstances[i]);
    else
      dispatchListeners &&
        executeDispatch(e, dispatchListeners, dispatchInstances);
    e._dispatchListeners = null;
    e._dispatchInstances = null;
    e.isPersistent() || e.constructor.release(e);
  }
}
function dispatchEvent(target, topLevelType, nativeEvent) {
  var eventTarget = null;
  if (null != target) {
    var stateNode = target.stateNode;
    null != stateNode && (eventTarget = stateNode.canonical);
  }
  batchedUpdates(function() {
    var JSCompiler_inline_result = eventTarget;
    for (
      var events = null, legacyPlugins = plugins, i = 0;
      i < legacyPlugins.length;
      i++
    ) {
      var possiblePlugin = legacyPlugins[i];
      possiblePlugin &&
        (possiblePlugin = possiblePlugin.extractEvents(
          topLevelType,
          target,
          nativeEvent,
          JSCompiler_inline_result
        )) &&
        (events = accumulateInto(events, possiblePlugin));
    }
    JSCompiler_inline_result = events;
    null !== JSCompiler_inline_result &&
      (eventQueue = accumulateInto(eventQueue, JSCompiler_inline_result));
    JSCompiler_inline_result = eventQueue;
    eventQueue = null;
    if (JSCompiler_inline_result) {
      forEachAccumulated(
        JSCompiler_inline_result,
        executeDispatchesAndReleaseTopLevel
      );
      if (eventQueue)
        throw Error(
          "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented."
        );
      if (hasRethrowError)
        throw ((JSCompiler_inline_result = rethrowError),
        (hasRethrowError = !1),
        (rethrowError = null),
        JSCompiler_inline_result);
    }
  });
}
function shim() {
  throw Error(
    "The current renderer does not support mutation. This error is likely caused by a bug in React. Please file an issue."
  );
}
function shim$1() {
  throw Error(
    "The current renderer does not support hydration. This error is likely caused by a bug in React. Please file an issue."
  );
}
var _nativeFabricUIManage = nativeFabricUIManager,
  createNode = _nativeFabricUIManage.createNode,
  cloneNode = _nativeFabricUIManage.cloneNode,
  cloneNodeWithNewChildren = _nativeFabricUIManage.cloneNodeWithNewChildren,
  cloneNodeWithNewChildrenAndProps =
    _nativeFabricUIManage.cloneNodeWithNewChildrenAndProps,
  cloneNodeWithNewProps = _nativeFabricUIManage.cloneNodeWithNewProps,
  createChildNodeSet = _nativeFabricUIManage.createChildSet,
  appendChildNode = _nativeFabricUIManage.appendChild,
  appendChildNodeToSet = _nativeFabricUIManage.appendChildToSet,
  completeRoot = _nativeFabricUIManage.completeRoot,
  registerEventHandler = _nativeFabricUIManage.registerEventHandler,
  fabricMeasure = _nativeFabricUIManage.measure,
  fabricMeasureInWindow = _nativeFabricUIManage.measureInWindow,
  fabricMeasureLayout = _nativeFabricUIManage.measureLayout,
  getViewConfigForType =
    ReactNativePrivateInterface.ReactNativeViewConfigRegistry.get,
  nextReactTag = 2;
registerEventHandler && registerEventHandler(dispatchEvent);
var ReactFabricHostComponent = (function() {
  function ReactFabricHostComponent(
    tag,
    viewConfig,
    props,
    internalInstanceHandle
  ) {
    this._nativeTag = tag;
    this.viewConfig = viewConfig;
    this.currentProps = props;
    this._internalInstanceHandle = internalInstanceHandle;
  }
  var _proto = ReactFabricHostComponent.prototype;
  _proto.blur = function() {
    ReactNativePrivateInterface.TextInputState.blurTextInput(this);
  };
  _proto.focus = function() {
    ReactNativePrivateInterface.TextInputState.focusTextInput(this);
  };
  _proto.measure = function(callback) {
    fabricMeasure(
      this._internalInstanceHandle.stateNode.node,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback)
    );
  };
  _proto.measureInWindow = function(callback) {
    fabricMeasureInWindow(
      this._internalInstanceHandle.stateNode.node,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback)
    );
  };
  _proto.measureLayout = function(relativeToNativeNode, onSuccess, onFail) {
    "number" !== typeof relativeToNativeNode &&
      relativeToNativeNode instanceof ReactFabricHostComponent &&
      fabricMeasureLayout(
        this._internalInstanceHandle.stateNode.node,
        relativeToNativeNode._internalInstanceHandle.stateNode.node,
        mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
        mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess)
      );
  };
  _proto.setNativeProps = function() {};
  return ReactFabricHostComponent;
})();
function createTextInstance(
  text,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) {
  if (!hostContext.isInAParentText)
    throw Error("Text strings must be rendered within a <Text> component.");
  hostContext = nextReactTag;
  nextReactTag += 2;
  return {
    node: createNode(
      hostContext,
      "RCTRawText",
      rootContainerInstance,
      { text: text },
      internalInstanceHandle
    )
  };
}
var scheduleTimeout = setTimeout,
  cancelTimeout = clearTimeout;
function cloneHiddenInstance(instance) {
  var node = instance.node;
  var JSCompiler_inline_result = diffProperties(
    null,
    emptyObject,
    { style: { display: "none" } },
    instance.canonical.viewConfig.validAttributes
  );
  return {
    node: cloneNodeWithNewProps(node, JSCompiler_inline_result),
    canonical: instance.canonical
  };
}
function describeComponentFrame(name, source, ownerName) {
  source = "";
  ownerName && (source = " (created by " + ownerName + ")");
  return "\n    in " + (name || "Unknown") + source;
}
function describeFunctionComponentFrame(fn, source) {
  return fn
    ? describeComponentFrame(fn.displayName || fn.name || null, source, null)
    : "";
}
var valueStack = [],
  index = -1;
function createCursor(defaultValue) {
  return { current: defaultValue };
}
function pop(cursor) {
  0 > index ||
    ((cursor.current = valueStack[index]), (valueStack[index] = null), index--);
}
function push(cursor, value) {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
}
var emptyContextObject = {},
  contextStackCursor = createCursor(emptyContextObject),
  didPerformWorkStackCursor = createCursor(!1),
  previousContext = emptyContextObject;
function getMaskedContext(workInProgress, unmaskedContext) {
  var contextTypes = workInProgress.type.contextTypes;
  if (!contextTypes) return emptyContextObject;
  var instance = workInProgress.stateNode;
  if (
    instance &&
    instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext
  )
    return instance.__reactInternalMemoizedMaskedChildContext;
  var context = {},
    key;
  for (key in contextTypes) context[key] = unmaskedContext[key];
  instance &&
    ((workInProgress = workInProgress.stateNode),
    (workInProgress.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext),
    (workInProgress.__reactInternalMemoizedMaskedChildContext = context));
  return context;
}
function isContextProvider(type) {
  type = type.childContextTypes;
  return null !== type && void 0 !== type;
}
function popContext() {
  pop(didPerformWorkStackCursor);
  pop(contextStackCursor);
}
function pushTopLevelContextObject(fiber, context, didChange) {
  if (contextStackCursor.current !== emptyContextObject)
    throw Error(
      "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue."
    );
  push(contextStackCursor, context);
  push(didPerformWorkStackCursor, didChange);
}
function processChildContext(fiber, type, parentContext) {
  var instance = fiber.stateNode;
  fiber = type.childContextTypes;
  if ("function" !== typeof instance.getChildContext) return parentContext;
  instance = instance.getChildContext();
  for (var contextKey in instance)
    if (!(contextKey in fiber))
      throw Error(
        (getComponentName(type) || "Unknown") +
          '.getChildContext(): key "' +
          contextKey +
          '" is not defined in childContextTypes.'
      );
  return Object.assign({}, parentContext, instance);
}
function pushContextProvider(workInProgress) {
  workInProgress =
    ((workInProgress = workInProgress.stateNode) &&
      workInProgress.__reactInternalMemoizedMergedChildContext) ||
    emptyContextObject;
  previousContext = contextStackCursor.current;
  push(contextStackCursor, workInProgress);
  push(didPerformWorkStackCursor, didPerformWorkStackCursor.current);
  return !0;
}
function invalidateContextProvider(workInProgress, type, didChange) {
  var instance = workInProgress.stateNode;
  if (!instance)
    throw Error(
      "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue."
    );
  didChange
    ? ((workInProgress = processChildContext(
        workInProgress,
        type,
        previousContext
      )),
      (instance.__reactInternalMemoizedMergedChildContext = workInProgress),
      pop(didPerformWorkStackCursor),
      pop(contextStackCursor),
      push(contextStackCursor, workInProgress))
    : pop(didPerformWorkStackCursor);
  push(didPerformWorkStackCursor, didChange);
}
var rendererID = null,
  injectedHook = null,
  Scheduler_now = Scheduler.unstable_now;
Scheduler_now();
var return_highestLanePriority = 8;
function getHighestPriorityLanes(lanes) {
  if (0 !== (1 & lanes)) return (return_highestLanePriority = 15), 1;
  if (0 !== (2 & lanes)) return (return_highestLanePriority = 14), 2;
  if (0 !== (4 & lanes)) return (return_highestLanePriority = 13), 4;
  var inputDiscreteLanes = 24 & lanes;
  if (0 !== inputDiscreteLanes)
    return (return_highestLanePriority = 12), inputDiscreteLanes;
  if (0 !== (lanes & 32)) return (return_highestLanePriority = 11), 32;
  inputDiscreteLanes = 192 & lanes;
  if (0 !== inputDiscreteLanes)
    return (return_highestLanePriority = 10), inputDiscreteLanes;
  if (0 !== (lanes & 256)) return (return_highestLanePriority = 9), 256;
  inputDiscreteLanes = 3584 & lanes;
  if (0 !== inputDiscreteLanes)
    return (return_highestLanePriority = 8), inputDiscreteLanes;
  if (0 !== (lanes & 4096)) return (return_highestLanePriority = 7), 4096;
  inputDiscreteLanes = 4186112 & lanes;
  if (0 !== inputDiscreteLanes)
    return (return_highestLanePriority = 6), inputDiscreteLanes;
  inputDiscreteLanes = 62914560 & lanes;
  if (0 !== inputDiscreteLanes)
    return (return_highestLanePriority = 5), inputDiscreteLanes;
  if (lanes & 67108864) return (return_highestLanePriority = 4), 67108864;
  if (0 !== (lanes & 134217728))
    return (return_highestLanePriority = 3), 134217728;
  inputDiscreteLanes = 805306368 & lanes;
  if (0 !== inputDiscreteLanes)
    return (return_highestLanePriority = 2), inputDiscreteLanes;
  if (0 !== (1073741824 & lanes))
    return (return_highestLanePriority = 1), 1073741824;
  return_highestLanePriority = 8;
  return lanes;
}
function schedulerPriorityToLanePriority(schedulerPriorityLevel) {
  switch (schedulerPriorityLevel) {
    case 99:
      return 15;
    case 98:
      return 10;
    case 97:
    case 96:
      return 8;
    case 95:
      return 2;
    default:
      return 0;
  }
}
function lanePriorityToSchedulerPriority(lanePriority) {
  switch (lanePriority) {
    case 15:
    case 14:
      return 99;
    case 13:
    case 12:
    case 11:
    case 10:
      return 98;
    case 9:
    case 8:
    case 7:
    case 6:
    case 4:
    case 5:
      return 97;
    case 3:
    case 2:
    case 1:
      return 95;
    case 0:
      return 90;
    default:
      throw Error(
        "Invalid update priority: " + lanePriority + ". This is a bug in React."
      );
  }
}
function getNextLanes(root, wipLanes) {
  var pendingLanes = root.pendingLanes;
  if (0 === pendingLanes) return (return_highestLanePriority = 0);
  var nextLanes = 0,
    nextLanePriority = 0,
    expiredLanes = root.expiredLanes,
    suspendedLanes = root.suspendedLanes,
    pingedLanes = root.pingedLanes;
  if (0 !== expiredLanes)
    (nextLanes = expiredLanes),
      (nextLanePriority = return_highestLanePriority = 15);
  else if (((expiredLanes = pendingLanes & 134217727), 0 !== expiredLanes)) {
    var nonIdleUnblockedLanes = expiredLanes & ~suspendedLanes;
    0 !== nonIdleUnblockedLanes
      ? ((nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes)),
        (nextLanePriority = return_highestLanePriority))
      : ((pingedLanes &= expiredLanes),
        0 !== pingedLanes &&
          ((nextLanes = getHighestPriorityLanes(pingedLanes)),
          (nextLanePriority = return_highestLanePriority)));
  } else
    (expiredLanes = pendingLanes & ~suspendedLanes),
      0 !== expiredLanes
        ? ((nextLanes = getHighestPriorityLanes(expiredLanes)),
          (nextLanePriority = return_highestLanePriority))
        : 0 !== pingedLanes &&
          ((nextLanes = getHighestPriorityLanes(pingedLanes)),
          (nextLanePriority = return_highestLanePriority));
  if (0 === nextLanes) return 0;
  nextLanes = 31 - clz32(nextLanes);
  nextLanes = pendingLanes & (((0 > nextLanes ? 0 : 1 << nextLanes) << 1) - 1);
  if (
    0 !== wipLanes &&
    wipLanes !== nextLanes &&
    0 === (wipLanes & suspendedLanes)
  ) {
    getHighestPriorityLanes(wipLanes);
    if (nextLanePriority <= return_highestLanePriority) return wipLanes;
    return_highestLanePriority = nextLanePriority;
  }
  wipLanes = root.entangledLanes;
  if (0 !== wipLanes)
    for (root = root.entanglements, wipLanes &= nextLanes; 0 < wipLanes; )
      (pendingLanes = 31 - clz32(wipLanes)),
        (nextLanePriority = 1 << pendingLanes),
        (nextLanes |= root[pendingLanes]),
        (wipLanes &= ~nextLanePriority);
  return nextLanes;
}
function getLanesToRetrySynchronouslyOnError(root) {
  root = root.pendingLanes & -1073741825;
  return 0 !== root ? root : root & 1073741824 ? 1073741824 : 0;
}
function findUpdateLane(lanePriority, wipLanes) {
  switch (lanePriority) {
    case 15:
      return 1;
    case 14:
      return 2;
    case 12:
      return (
        (lanePriority = getHighestPriorityLane(24 & ~wipLanes)),
        0 === lanePriority ? findUpdateLane(10, wipLanes) : lanePriority
      );
    case 10:
      return (
        (lanePriority = getHighestPriorityLane(192 & ~wipLanes)),
        0 === lanePriority ? findUpdateLane(8, wipLanes) : lanePriority
      );
    case 8:
      return (
        (lanePriority = getHighestPriorityLane(3584 & ~wipLanes)),
        0 === lanePriority &&
          ((lanePriority = getHighestPriorityLane(4186112 & ~wipLanes)),
          0 === lanePriority && (lanePriority = 512)),
        lanePriority
      );
    case 2:
      return (
        (wipLanes = getHighestPriorityLane(805306368 & ~wipLanes)),
        0 === wipLanes && (wipLanes = 268435456),
        wipLanes
      );
  }
  throw Error(
    "Invalid update priority: " + lanePriority + ". This is a bug in React."
  );
}
function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}
function createLaneMap(initial) {
  for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
  return laneMap;
}
function markRootUpdated(root, updateLane, eventTime) {
  root.pendingLanes |= updateLane;
  var higherPriorityLanes = updateLane - 1;
  root.suspendedLanes &= higherPriorityLanes;
  root.pingedLanes &= higherPriorityLanes;
  root = root.eventTimes;
  updateLane = 31 - clz32(updateLane);
  root[updateLane] = eventTime;
}
var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback,
  log = Math.log,
  LN2 = Math.LN2;
function clz32Fallback(lanes) {
  return 0 === lanes ? 32 : (31 - ((log(lanes) / LN2) | 0)) | 0;
}
var Scheduler_runWithPriority = Scheduler.unstable_runWithPriority,
  Scheduler_scheduleCallback = Scheduler.unstable_scheduleCallback,
  Scheduler_cancelCallback = Scheduler.unstable_cancelCallback,
  Scheduler_shouldYield = Scheduler.unstable_shouldYield,
  Scheduler_requestPaint = Scheduler.unstable_requestPaint,
  Scheduler_now$1 = Scheduler.unstable_now,
  Scheduler_getCurrentPriorityLevel =
    Scheduler.unstable_getCurrentPriorityLevel,
  Scheduler_ImmediatePriority = Scheduler.unstable_ImmediatePriority,
  Scheduler_UserBlockingPriority = Scheduler.unstable_UserBlockingPriority,
  Scheduler_NormalPriority = Scheduler.unstable_NormalPriority,
  Scheduler_LowPriority = Scheduler.unstable_LowPriority,
  Scheduler_IdlePriority = Scheduler.unstable_IdlePriority,
  fakeCallbackNode = {},
  requestPaint =
    void 0 !== Scheduler_requestPaint ? Scheduler_requestPaint : function() {},
  syncQueue = null,
  immediateQueueCallbackNode = null,
  isFlushingSyncQueue = !1,
  initialTimeMs$1 = Scheduler_now$1(),
  now =
    1e4 > initialTimeMs$1
      ? Scheduler_now$1
      : function() {
          return Scheduler_now$1() - initialTimeMs$1;
        };
function getCurrentPriorityLevel() {
  switch (Scheduler_getCurrentPriorityLevel()) {
    case Scheduler_ImmediatePriority:
      return 99;
    case Scheduler_UserBlockingPriority:
      return 98;
    case Scheduler_NormalPriority:
      return 97;
    case Scheduler_LowPriority:
      return 96;
    case Scheduler_IdlePriority:
      return 95;
    default:
      throw Error("Unknown priority level.");
  }
}
function reactPriorityToSchedulerPriority(reactPriorityLevel) {
  switch (reactPriorityLevel) {
    case 99:
      return Scheduler_ImmediatePriority;
    case 98:
      return Scheduler_UserBlockingPriority;
    case 97:
      return Scheduler_NormalPriority;
    case 96:
      return Scheduler_LowPriority;
    case 95:
      return Scheduler_IdlePriority;
    default:
      throw Error("Unknown priority level.");
  }
}
function runWithPriority(reactPriorityLevel, fn) {
  reactPriorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_runWithPriority(reactPriorityLevel, fn);
}
function scheduleCallback(reactPriorityLevel, callback, options) {
  reactPriorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_scheduleCallback(reactPriorityLevel, callback, options);
}
function flushSyncCallbackQueue() {
  if (null !== immediateQueueCallbackNode) {
    var node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler_cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
}
function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && null !== syncQueue) {
    isFlushingSyncQueue = !0;
    var i = 0;
    try {
      var queue = syncQueue;
      runWithPriority(99, function() {
        for (; i < queue.length; i++) {
          var callback = queue[i];
          do callback = callback(!0);
          while (null !== callback);
        }
      });
      syncQueue = null;
    } catch (error) {
      throw (null !== syncQueue && (syncQueue = syncQueue.slice(i + 1)),
      Scheduler_scheduleCallback(
        Scheduler_ImmediatePriority,
        flushSyncCallbackQueue
      ),
      error);
    } finally {
      isFlushingSyncQueue = !1;
    }
  }
}
var ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig;
function is(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var objectIs = "function" === typeof Object.is ? Object.is : is,
  hasOwnProperty = Object.prototype.hasOwnProperty;
function shallowEqual(objA, objB) {
  if (objectIs(objA, objB)) return !0;
  if (
    "object" !== typeof objA ||
    null === objA ||
    "object" !== typeof objB ||
    null === objB
  )
    return !1;
  var keysA = Object.keys(objA),
    keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return !1;
  for (keysB = 0; keysB < keysA.length; keysB++)
    if (
      !hasOwnProperty.call(objB, keysA[keysB]) ||
      !objectIs(objA[keysA[keysB]], objB[keysA[keysB]])
    )
      return !1;
  return !0;
}
function describeFiber(fiber) {
  switch (fiber.tag) {
    case 5:
      return describeComponentFrame(fiber.type, null, null);
    case 16:
      return describeComponentFrame("Lazy", null, null);
    case 13:
      return describeComponentFrame("Suspense", null, null);
    case 19:
      return describeComponentFrame("SuspenseList", null, null);
    case 0:
    case 2:
    case 15:
      return describeFunctionComponentFrame(fiber.type, null);
    case 11:
      return describeFunctionComponentFrame(fiber.type.render, null);
    case 1:
      return (fiber = describeFunctionComponentFrame(fiber.type, null)), fiber;
    default:
      return "";
  }
}
function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    baseProps = Object.assign({}, baseProps);
    Component = Component.defaultProps;
    for (var propName in Component)
      void 0 === baseProps[propName] &&
        (baseProps[propName] = Component[propName]);
    return baseProps;
  }
  return baseProps;
}
var valueCursor = createCursor(null),
  currentlyRenderingFiber = null,
  lastContextDependency = null,
  lastContextWithAllBitsObserved = null;
function resetContextDependencies() {
  lastContextWithAllBitsObserved = lastContextDependency = currentlyRenderingFiber = null;
}
function popProvider(providerFiber) {
  var currentValue = valueCursor.current;
  pop(valueCursor);
  providerFiber.type._context._currentValue2 = currentValue;
}
function scheduleWorkOnParentPath(parent, renderLanes) {
  for (; null !== parent; ) {
    var alternate = parent.alternate;
    if ((parent.childLanes & renderLanes) === renderLanes)
      if (
        null === alternate ||
        (alternate.childLanes & renderLanes) === renderLanes
      )
        break;
      else alternate.childLanes |= renderLanes;
    else
      (parent.childLanes |= renderLanes),
        null !== alternate && (alternate.childLanes |= renderLanes);
    parent = parent.return;
  }
}
function prepareToReadContext(workInProgress, renderLanes) {
  currentlyRenderingFiber = workInProgress;
  lastContextWithAllBitsObserved = lastContextDependency = null;
  workInProgress = workInProgress.dependencies;
  null !== workInProgress &&
    null !== workInProgress.firstContext &&
    (0 !== (workInProgress.lanes & renderLanes) && (didReceiveUpdate = !0),
    (workInProgress.firstContext = null));
}
function readContext(context, observedBits) {
  if (
    lastContextWithAllBitsObserved !== context &&
    !1 !== observedBits &&
    0 !== observedBits
  ) {
    if ("number" !== typeof observedBits || 1073741823 === observedBits)
      (lastContextWithAllBitsObserved = context), (observedBits = 1073741823);
    observedBits = { context: context, observedBits: observedBits, next: null };
    if (null === lastContextDependency) {
      if (null === currentlyRenderingFiber)
        throw Error(
          "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
        );
      lastContextDependency = observedBits;
      currentlyRenderingFiber.dependencies = {
        lanes: 0,
        firstContext: observedBits,
        responders: null
      };
    } else lastContextDependency = lastContextDependency.next = observedBits;
  }
  return context._currentValue2;
}
var hasForceUpdate = !1;
function initializeUpdateQueue(fiber) {
  fiber.updateQueue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null },
    effects: null
  };
}
function cloneUpdateQueue(current, workInProgress) {
  current = current.updateQueue;
  workInProgress.updateQueue === current &&
    (workInProgress.updateQueue = {
      baseState: current.baseState,
      firstBaseUpdate: current.firstBaseUpdate,
      lastBaseUpdate: current.lastBaseUpdate,
      shared: current.shared,
      effects: current.effects
    });
}
function createUpdate(eventTime, lane) {
  return {
    eventTime: eventTime,
    lane: lane,
    tag: 0,
    payload: null,
    callback: null,
    next: null
  };
}
function enqueueUpdate(fiber, update) {
  fiber = fiber.updateQueue;
  if (null !== fiber) {
    fiber = fiber.shared;
    var pending = fiber.pending;
    null === pending
      ? (update.next = update)
      : ((update.next = pending.next), (pending.next = update));
    fiber.pending = update;
  }
}
function enqueueCapturedUpdate(workInProgress, capturedUpdate) {
  var queue = workInProgress.updateQueue,
    current = workInProgress.alternate;
  if (
    null !== current &&
    ((current = current.updateQueue), queue === current)
  ) {
    var newFirst = null,
      newLast = null;
    queue = queue.firstBaseUpdate;
    if (null !== queue) {
      do {
        var clone = {
          eventTime: queue.eventTime,
          lane: queue.lane,
          tag: queue.tag,
          payload: queue.payload,
          callback: queue.callback,
          next: null
        };
        null === newLast
          ? (newFirst = newLast = clone)
          : (newLast = newLast.next = clone);
        queue = queue.next;
      } while (null !== queue);
      null === newLast
        ? (newFirst = newLast = capturedUpdate)
        : (newLast = newLast.next = capturedUpdate);
    } else newFirst = newLast = capturedUpdate;
    queue = {
      baseState: current.baseState,
      firstBaseUpdate: newFirst,
      lastBaseUpdate: newLast,
      shared: current.shared,
      effects: current.effects
    };
    workInProgress.updateQueue = queue;
    return;
  }
  workInProgress = queue.lastBaseUpdate;
  null === workInProgress
    ? (queue.firstBaseUpdate = capturedUpdate)
    : (workInProgress.next = capturedUpdate);
  queue.lastBaseUpdate = capturedUpdate;
}
function processUpdateQueue(
  workInProgress$jscomp$0,
  props,
  instance,
  renderLanes
) {
  var queue = workInProgress$jscomp$0.updateQueue;
  hasForceUpdate = !1;
  var firstBaseUpdate = queue.firstBaseUpdate,
    lastBaseUpdate = queue.lastBaseUpdate,
    pendingQueue = queue.shared.pending;
  if (null !== pendingQueue) {
    queue.shared.pending = null;
    var lastPendingUpdate = pendingQueue,
      firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;
    null === lastBaseUpdate
      ? (firstBaseUpdate = firstPendingUpdate)
      : (lastBaseUpdate.next = firstPendingUpdate);
    lastBaseUpdate = lastPendingUpdate;
    var current = workInProgress$jscomp$0.alternate;
    if (null !== current) {
      current = current.updateQueue;
      var currentLastBaseUpdate = current.lastBaseUpdate;
      currentLastBaseUpdate !== lastBaseUpdate &&
        (null === currentLastBaseUpdate
          ? (current.firstBaseUpdate = firstPendingUpdate)
          : (currentLastBaseUpdate.next = firstPendingUpdate),
        (current.lastBaseUpdate = lastPendingUpdate));
    }
  }
  if (null !== firstBaseUpdate) {
    currentLastBaseUpdate = queue.baseState;
    lastBaseUpdate = 0;
    current = firstPendingUpdate = lastPendingUpdate = null;
    do {
      pendingQueue = firstBaseUpdate.lane;
      var updateEventTime = firstBaseUpdate.eventTime;
      if ((renderLanes & pendingQueue) === pendingQueue) {
        null !== current &&
          (current = current.next = {
            eventTime: updateEventTime,
            lane: 0,
            tag: firstBaseUpdate.tag,
            payload: firstBaseUpdate.payload,
            callback: firstBaseUpdate.callback,
            next: null
          });
        a: {
          var workInProgress = workInProgress$jscomp$0,
            update = firstBaseUpdate;
          pendingQueue = props;
          updateEventTime = instance;
          switch (update.tag) {
            case 1:
              workInProgress = update.payload;
              if ("function" === typeof workInProgress) {
                currentLastBaseUpdate = workInProgress.call(
                  updateEventTime,
                  currentLastBaseUpdate,
                  pendingQueue
                );
                break a;
              }
              currentLastBaseUpdate = workInProgress;
              break a;
            case 3:
              workInProgress.flags = (workInProgress.flags & -8193) | 64;
            case 0:
              workInProgress = update.payload;
              pendingQueue =
                "function" === typeof workInProgress
                  ? workInProgress.call(
                      updateEventTime,
                      currentLastBaseUpdate,
                      pendingQueue
                    )
                  : workInProgress;
              if (null === pendingQueue || void 0 === pendingQueue) break a;
              currentLastBaseUpdate = Object.assign(
                {},
                currentLastBaseUpdate,
                pendingQueue
              );
              break a;
            case 2:
              hasForceUpdate = !0;
          }
        }
        null !== firstBaseUpdate.callback &&
          ((workInProgress$jscomp$0.flags |= 32),
          (pendingQueue = queue.effects),
          null === pendingQueue
            ? (queue.effects = [firstBaseUpdate])
            : pendingQueue.push(firstBaseUpdate));
      } else
        (updateEventTime = {
          eventTime: updateEventTime,
          lane: pendingQueue,
          tag: firstBaseUpdate.tag,
          payload: firstBaseUpdate.payload,
          callback: firstBaseUpdate.callback,
          next: null
        }),
          null === current
            ? ((firstPendingUpdate = current = updateEventTime),
              (lastPendingUpdate = currentLastBaseUpdate))
            : (current = current.next = updateEventTime),
          (lastBaseUpdate |= pendingQueue);
      firstBaseUpdate = firstBaseUpdate.next;
      if (null === firstBaseUpdate)
        if (((pendingQueue = queue.shared.pending), null === pendingQueue))
          break;
        else
          (firstBaseUpdate = pendingQueue.next),
            (pendingQueue.next = null),
            (queue.lastBaseUpdate = pendingQueue),
            (queue.shared.pending = null);
    } while (1);
    null === current && (lastPendingUpdate = currentLastBaseUpdate);
    queue.baseState = lastPendingUpdate;
    queue.firstBaseUpdate = firstPendingUpdate;
    queue.lastBaseUpdate = current;
    workInProgressRootSkippedLanes |= lastBaseUpdate;
    workInProgress$jscomp$0.lanes = lastBaseUpdate;
    workInProgress$jscomp$0.memoizedState = currentLastBaseUpdate;
  }
}
function commitUpdateQueue(finishedWork, finishedQueue, instance) {
  finishedWork = finishedQueue.effects;
  finishedQueue.effects = null;
  if (null !== finishedWork)
    for (
      finishedQueue = 0;
      finishedQueue < finishedWork.length;
      finishedQueue++
    ) {
      var effect = finishedWork[finishedQueue],
        callback = effect.callback;
      if (null !== callback) {
        effect.callback = null;
        if ("function" !== typeof callback)
          throw Error(
            "Invalid argument passed as callback. Expected a function. Instead received: " +
              callback
          );
        callback.call(instance);
      }
    }
}
var emptyRefsObject = new React.Component().refs;
function applyDerivedStateFromProps(
  workInProgress,
  ctor,
  getDerivedStateFromProps,
  nextProps
) {
  ctor = workInProgress.memoizedState;
  getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
  getDerivedStateFromProps =
    null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps
      ? ctor
      : Object.assign({}, ctor, getDerivedStateFromProps);
  workInProgress.memoizedState = getDerivedStateFromProps;
  0 === workInProgress.lanes &&
    (workInProgress.updateQueue.baseState = getDerivedStateFromProps);
}
var classComponentUpdater = {
  isMounted: function(component) {
    return (component = component._reactInternals)
      ? getNearestMountedFiber(component) === component
      : !1;
  },
  enqueueSetState: function(inst, payload, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    enqueueUpdate(inst, update);
    scheduleUpdateOnFiber(inst, lane, eventTime);
  },
  enqueueReplaceState: function(inst, payload, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.tag = 1;
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    enqueueUpdate(inst, update);
    scheduleUpdateOnFiber(inst, lane, eventTime);
  },
  enqueueForceUpdate: function(inst, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.tag = 2;
    void 0 !== callback && null !== callback && (update.callback = callback);
    enqueueUpdate(inst, update);
    scheduleUpdateOnFiber(inst, lane, eventTime);
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
  workInProgress = workInProgress.stateNode;
  return "function" === typeof workInProgress.shouldComponentUpdate
    ? workInProgress.shouldComponentUpdate(newProps, newState, nextContext)
    : ctor.prototype && ctor.prototype.isPureReactComponent
    ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
    : !0;
}
function constructClassInstance(workInProgress, ctor, props) {
  var isLegacyContextConsumer = !1,
    unmaskedContext = emptyContextObject;
  var context = ctor.contextType;
  "object" === typeof context && null !== context
    ? (context = readContext(context))
    : ((unmaskedContext = isContextProvider(ctor)
        ? previousContext
        : contextStackCursor.current),
      (isLegacyContextConsumer = ctor.contextTypes),
      (context = (isLegacyContextConsumer =
        null !== isLegacyContextConsumer && void 0 !== isLegacyContextConsumer)
        ? getMaskedContext(workInProgress, unmaskedContext)
        : emptyContextObject));
  ctor = new ctor(props, context);
  workInProgress.memoizedState =
    null !== ctor.state && void 0 !== ctor.state ? ctor.state : null;
  ctor.updater = classComponentUpdater;
  workInProgress.stateNode = ctor;
  ctor._reactInternals = workInProgress;
  isLegacyContextConsumer &&
    ((workInProgress = workInProgress.stateNode),
    (workInProgress.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext),
    (workInProgress.__reactInternalMemoizedMaskedChildContext = context));
  return ctor;
}
function callComponentWillReceiveProps(
  workInProgress,
  instance,
  newProps,
  nextContext
) {
  workInProgress = instance.state;
  "function" === typeof instance.componentWillReceiveProps &&
    instance.componentWillReceiveProps(newProps, nextContext);
  "function" === typeof instance.UNSAFE_componentWillReceiveProps &&
    instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
  instance.state !== workInProgress &&
    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
}
function mountClassInstance(workInProgress, ctor, newProps, renderLanes) {
  var instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = emptyRefsObject;
  initializeUpdateQueue(workInProgress);
  var contextType = ctor.contextType;
  "object" === typeof contextType && null !== contextType
    ? (instance.context = readContext(contextType))
    : ((contextType = isContextProvider(ctor)
        ? previousContext
        : contextStackCursor.current),
      (instance.context = getMaskedContext(workInProgress, contextType)));
  processUpdateQueue(workInProgress, newProps, instance, renderLanes);
  instance.state = workInProgress.memoizedState;
  contextType = ctor.getDerivedStateFromProps;
  "function" === typeof contextType &&
    (applyDerivedStateFromProps(workInProgress, ctor, contextType, newProps),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof ctor.getDerivedStateFromProps ||
    "function" === typeof instance.getSnapshotBeforeUpdate ||
    ("function" !== typeof instance.UNSAFE_componentWillMount &&
      "function" !== typeof instance.componentWillMount) ||
    ((ctor = instance.state),
    "function" === typeof instance.componentWillMount &&
      instance.componentWillMount(),
    "function" === typeof instance.UNSAFE_componentWillMount &&
      instance.UNSAFE_componentWillMount(),
    ctor !== instance.state &&
      classComponentUpdater.enqueueReplaceState(instance, instance.state, null),
    processUpdateQueue(workInProgress, newProps, instance, renderLanes),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof instance.componentDidMount &&
    (workInProgress.flags |= 4);
}
var isArray = Array.isArray;
function coerceRef(returnFiber, current, element) {
  returnFiber = element.ref;
  if (
    null !== returnFiber &&
    "function" !== typeof returnFiber &&
    "object" !== typeof returnFiber
  ) {
    if (element._owner) {
      element = element._owner;
      if (element) {
        if (1 !== element.tag)
          throw Error(
            "Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref"
          );
        var inst = element.stateNode;
      }
      if (!inst)
        throw Error(
          "Missing owner for string ref " +
            returnFiber +
            ". This error is likely caused by a bug in React. Please file an issue."
        );
      var stringRef = "" + returnFiber;
      if (
        null !== current &&
        null !== current.ref &&
        "function" === typeof current.ref &&
        current.ref._stringRef === stringRef
      )
        return current.ref;
      current = function(value) {
        var refs = inst.refs;
        refs === emptyRefsObject && (refs = inst.refs = {});
        null === value ? delete refs[stringRef] : (refs[stringRef] = value);
      };
      current._stringRef = stringRef;
      return current;
    }
    if ("string" !== typeof returnFiber)
      throw Error(
        "Expected ref to be a function, a string, an object returned by React.createRef(), or null."
      );
    if (!element._owner)
      throw Error(
        "Element ref was specified as a string (" +
          returnFiber +
          ") but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a function component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://reactjs.org/link/refs-must-have-owner for more information."
      );
  }
  return returnFiber;
}
function throwOnInvalidObjectType(returnFiber, newChild) {
  if ("textarea" !== returnFiber.type)
    throw Error(
      "Objects are not valid as a React child (found: " +
        ("[object Object]" === Object.prototype.toString.call(newChild)
          ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
          : newChild) +
        "). If you meant to render a collection of children, use an array instead."
    );
}
function ChildReconciler(shouldTrackSideEffects) {
  function deleteChild(returnFiber, childToDelete) {
    if (shouldTrackSideEffects) {
      var last = returnFiber.lastEffect;
      null !== last
        ? ((last.nextEffect = childToDelete),
          (returnFiber.lastEffect = childToDelete))
        : (returnFiber.firstEffect = returnFiber.lastEffect = childToDelete);
      childToDelete.nextEffect = null;
      childToDelete.flags = 8;
    }
  }
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return null;
    for (; null !== currentFirstChild; )
      deleteChild(returnFiber, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return null;
  }
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    for (returnFiber = new Map(); null !== currentFirstChild; )
      null !== currentFirstChild.key
        ? returnFiber.set(currentFirstChild.key, currentFirstChild)
        : returnFiber.set(currentFirstChild.index, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return returnFiber;
  }
  function useFiber(fiber, pendingProps) {
    fiber = createWorkInProgress(fiber, pendingProps);
    fiber.index = 0;
    fiber.sibling = null;
    return fiber;
  }
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) return lastPlacedIndex;
    newIndex = newFiber.alternate;
    if (null !== newIndex)
      return (
        (newIndex = newIndex.index),
        newIndex < lastPlacedIndex
          ? ((newFiber.flags = 2), lastPlacedIndex)
          : newIndex
      );
    newFiber.flags = 2;
    return lastPlacedIndex;
  }
  function placeSingleChild(newFiber) {
    shouldTrackSideEffects &&
      null === newFiber.alternate &&
      (newFiber.flags = 2);
    return newFiber;
  }
  function updateTextNode(returnFiber, current, textContent, lanes) {
    if (null === current || 6 !== current.tag)
      return (
        (current = createFiberFromText(textContent, returnFiber.mode, lanes)),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, textContent);
    current.return = returnFiber;
    return current;
  }
  function updateElement(returnFiber, current, element, lanes) {
    if (null !== current && current.elementType === element.type)
      return (
        (lanes = useFiber(current, element.props)),
        (lanes.ref = coerceRef(returnFiber, current, element)),
        (lanes.return = returnFiber),
        lanes
      );
    lanes = createFiberFromTypeAndProps(
      element.type,
      element.key,
      element.props,
      null,
      returnFiber.mode,
      lanes
    );
    lanes.ref = coerceRef(returnFiber, current, element);
    lanes.return = returnFiber;
    return lanes;
  }
  function updatePortal(returnFiber, current, portal, lanes) {
    if (
      null === current ||
      4 !== current.tag ||
      current.stateNode.containerInfo !== portal.containerInfo ||
      current.stateNode.implementation !== portal.implementation
    )
      return (
        (current = createFiberFromPortal(portal, returnFiber.mode, lanes)),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, portal.children || []);
    current.return = returnFiber;
    return current;
  }
  function updateFragment(returnFiber, current, fragment, lanes, key) {
    if (null === current || 7 !== current.tag)
      return (
        (current = createFiberFromFragment(
          fragment,
          returnFiber.mode,
          lanes,
          key
        )),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, fragment);
    current.return = returnFiber;
    return current;
  }
  function createChild(returnFiber, newChild, lanes) {
    if ("string" === typeof newChild || "number" === typeof newChild)
      return (
        (newChild = createFiberFromText(
          "" + newChild,
          returnFiber.mode,
          lanes
        )),
        (newChild.return = returnFiber),
        newChild
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return (
            (lanes = createFiberFromTypeAndProps(
              newChild.type,
              newChild.key,
              newChild.props,
              null,
              returnFiber.mode,
              lanes
            )),
            (lanes.ref = coerceRef(returnFiber, null, newChild)),
            (lanes.return = returnFiber),
            lanes
          );
        case REACT_PORTAL_TYPE:
          return (
            (newChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
              lanes
            )),
            (newChild.return = returnFiber),
            newChild
          );
      }
      if (isArray(newChild) || getIteratorFn(newChild))
        return (
          (newChild = createFiberFromFragment(
            newChild,
            returnFiber.mode,
            lanes,
            null
          )),
          (newChild.return = returnFiber),
          newChild
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function updateSlot(returnFiber, oldFiber, newChild, lanes) {
    var key = null !== oldFiber ? oldFiber.key : null;
    if ("string" === typeof newChild || "number" === typeof newChild)
      return null !== key
        ? null
        : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return newChild.key === key
            ? newChild.type === REACT_FRAGMENT_TYPE
              ? updateFragment(
                  returnFiber,
                  oldFiber,
                  newChild.props.children,
                  lanes,
                  key
                )
              : updateElement(returnFiber, oldFiber, newChild, lanes)
            : null;
        case REACT_PORTAL_TYPE:
          return newChild.key === key
            ? updatePortal(returnFiber, oldFiber, newChild, lanes)
            : null;
      }
      if (isArray(newChild) || getIteratorFn(newChild))
        return null !== key
          ? null
          : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function updateFromMap(
    existingChildren,
    returnFiber,
    newIdx,
    newChild,
    lanes
  ) {
    if ("string" === typeof newChild || "number" === typeof newChild)
      return (
        (existingChildren = existingChildren.get(newIdx) || null),
        updateTextNode(returnFiber, existingChildren, "" + newChild, lanes)
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            newChild.type === REACT_FRAGMENT_TYPE
              ? updateFragment(
                  returnFiber,
                  existingChildren,
                  newChild.props.children,
                  lanes,
                  newChild.key
                )
              : updateElement(returnFiber, existingChildren, newChild, lanes)
          );
        case REACT_PORTAL_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            updatePortal(returnFiber, existingChildren, newChild, lanes)
          );
      }
      if (isArray(newChild) || getIteratorFn(newChild))
        return (
          (existingChildren = existingChildren.get(newIdx) || null),
          updateFragment(returnFiber, existingChildren, newChild, lanes, null)
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function reconcileChildrenArray(
    returnFiber,
    currentFirstChild,
    newChildren,
    lanes
  ) {
    for (
      var resultingFirstChild = null,
        previousNewFiber = null,
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null;
      null !== oldFiber && newIdx < newChildren.length;
      newIdx++
    ) {
      oldFiber.index > newIdx
        ? ((nextOldFiber = oldFiber), (oldFiber = null))
        : (nextOldFiber = oldFiber.sibling);
      var newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        lanes
      );
      if (null === newFiber) {
        null === oldFiber && (oldFiber = nextOldFiber);
        break;
      }
      shouldTrackSideEffects &&
        oldFiber &&
        null === newFiber.alternate &&
        deleteChild(returnFiber, oldFiber);
      currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
      null === previousNewFiber
        ? (resultingFirstChild = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (newIdx === newChildren.length)
      return (
        deleteRemainingChildren(returnFiber, oldFiber), resultingFirstChild
      );
    if (null === oldFiber) {
      for (; newIdx < newChildren.length; newIdx++)
        (oldFiber = createChild(returnFiber, newChildren[newIdx], lanes)),
          null !== oldFiber &&
            ((currentFirstChild = placeChild(
              oldFiber,
              currentFirstChild,
              newIdx
            )),
            null === previousNewFiber
              ? (resultingFirstChild = oldFiber)
              : (previousNewFiber.sibling = oldFiber),
            (previousNewFiber = oldFiber));
      return resultingFirstChild;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      newIdx < newChildren.length;
      newIdx++
    )
      (nextOldFiber = updateFromMap(
        oldFiber,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes
      )),
        null !== nextOldFiber &&
          (shouldTrackSideEffects &&
            null !== nextOldFiber.alternate &&
            oldFiber.delete(
              null === nextOldFiber.key ? newIdx : nextOldFiber.key
            ),
          (currentFirstChild = placeChild(
            nextOldFiber,
            currentFirstChild,
            newIdx
          )),
          null === previousNewFiber
            ? (resultingFirstChild = nextOldFiber)
            : (previousNewFiber.sibling = nextOldFiber),
          (previousNewFiber = nextOldFiber));
    shouldTrackSideEffects &&
      oldFiber.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    return resultingFirstChild;
  }
  function reconcileChildrenIterator(
    returnFiber,
    currentFirstChild,
    newChildrenIterable,
    lanes
  ) {
    var iteratorFn = getIteratorFn(newChildrenIterable);
    if ("function" !== typeof iteratorFn)
      throw Error(
        "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."
      );
    newChildrenIterable = iteratorFn.call(newChildrenIterable);
    if (null == newChildrenIterable)
      throw Error("An iterable object provided no iterator.");
    for (
      var previousNewFiber = (iteratorFn = null),
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null,
        step = newChildrenIterable.next();
      null !== oldFiber && !step.done;
      newIdx++, step = newChildrenIterable.next()
    ) {
      oldFiber.index > newIdx
        ? ((nextOldFiber = oldFiber), (oldFiber = null))
        : (nextOldFiber = oldFiber.sibling);
      var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
      if (null === newFiber) {
        null === oldFiber && (oldFiber = nextOldFiber);
        break;
      }
      shouldTrackSideEffects &&
        oldFiber &&
        null === newFiber.alternate &&
        deleteChild(returnFiber, oldFiber);
      currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
      null === previousNewFiber
        ? (iteratorFn = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (step.done)
      return deleteRemainingChildren(returnFiber, oldFiber), iteratorFn;
    if (null === oldFiber) {
      for (; !step.done; newIdx++, step = newChildrenIterable.next())
        (step = createChild(returnFiber, step.value, lanes)),
          null !== step &&
            ((currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
            null === previousNewFiber
              ? (iteratorFn = step)
              : (previousNewFiber.sibling = step),
            (previousNewFiber = step));
      return iteratorFn;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      !step.done;
      newIdx++, step = newChildrenIterable.next()
    )
      (step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes)),
        null !== step &&
          (shouldTrackSideEffects &&
            null !== step.alternate &&
            oldFiber.delete(null === step.key ? newIdx : step.key),
          (currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
          null === previousNewFiber
            ? (iteratorFn = step)
            : (previousNewFiber.sibling = step),
          (previousNewFiber = step));
    shouldTrackSideEffects &&
      oldFiber.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    return iteratorFn;
  }
  return function(returnFiber, currentFirstChild, newChild, lanes) {
    var isUnkeyedTopLevelFragment =
      "object" === typeof newChild &&
      null !== newChild &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      null === newChild.key;
    isUnkeyedTopLevelFragment && (newChild = newChild.props.children);
    var isObject = "object" === typeof newChild && null !== newChild;
    if (isObject)
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          a: {
            isObject = newChild.key;
            for (
              isUnkeyedTopLevelFragment = currentFirstChild;
              null !== isUnkeyedTopLevelFragment;

            ) {
              if (isUnkeyedTopLevelFragment.key === isObject) {
                switch (isUnkeyedTopLevelFragment.tag) {
                  case 7:
                    if (newChild.type === REACT_FRAGMENT_TYPE) {
                      deleteRemainingChildren(
                        returnFiber,
                        isUnkeyedTopLevelFragment.sibling
                      );
                      currentFirstChild = useFiber(
                        isUnkeyedTopLevelFragment,
                        newChild.props.children
                      );
                      currentFirstChild.return = returnFiber;
                      returnFiber = currentFirstChild;
                      break a;
                    }
                    break;
                  default:
                    if (
                      isUnkeyedTopLevelFragment.elementType === newChild.type
                    ) {
                      deleteRemainingChildren(
                        returnFiber,
                        isUnkeyedTopLevelFragment.sibling
                      );
                      currentFirstChild = useFiber(
                        isUnkeyedTopLevelFragment,
                        newChild.props
                      );
                      currentFirstChild.ref = coerceRef(
                        returnFiber,
                        isUnkeyedTopLevelFragment,
                        newChild
                      );
                      currentFirstChild.return = returnFiber;
                      returnFiber = currentFirstChild;
                      break a;
                    }
                }
                deleteRemainingChildren(returnFiber, isUnkeyedTopLevelFragment);
                break;
              } else deleteChild(returnFiber, isUnkeyedTopLevelFragment);
              isUnkeyedTopLevelFragment = isUnkeyedTopLevelFragment.sibling;
            }
            newChild.type === REACT_FRAGMENT_TYPE
              ? ((currentFirstChild = createFiberFromFragment(
                  newChild.props.children,
                  returnFiber.mode,
                  lanes,
                  newChild.key
                )),
                (currentFirstChild.return = returnFiber),
                (returnFiber = currentFirstChild))
              : ((lanes = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
                  returnFiber.mode,
                  lanes
                )),
                (lanes.ref = coerceRef(
                  returnFiber,
                  currentFirstChild,
                  newChild
                )),
                (lanes.return = returnFiber),
                (returnFiber = lanes));
          }
          return placeSingleChild(returnFiber);
        case REACT_PORTAL_TYPE:
          a: {
            for (
              isUnkeyedTopLevelFragment = newChild.key;
              null !== currentFirstChild;

            ) {
              if (currentFirstChild.key === isUnkeyedTopLevelFragment)
                if (
                  4 === currentFirstChild.tag &&
                  currentFirstChild.stateNode.containerInfo ===
                    newChild.containerInfo &&
                  currentFirstChild.stateNode.implementation ===
                    newChild.implementation
                ) {
                  deleteRemainingChildren(
                    returnFiber,
                    currentFirstChild.sibling
                  );
                  currentFirstChild = useFiber(
                    currentFirstChild,
                    newChild.children || []
                  );
                  currentFirstChild.return = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                } else {
                  deleteRemainingChildren(returnFiber, currentFirstChild);
                  break;
                }
              else deleteChild(returnFiber, currentFirstChild);
              currentFirstChild = currentFirstChild.sibling;
            }
            currentFirstChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
              lanes
            );
            currentFirstChild.return = returnFiber;
            returnFiber = currentFirstChild;
          }
          return placeSingleChild(returnFiber);
      }
    if ("string" === typeof newChild || "number" === typeof newChild)
      return (
        (newChild = "" + newChild),
        null !== currentFirstChild && 6 === currentFirstChild.tag
          ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling),
            (currentFirstChild = useFiber(currentFirstChild, newChild)),
            (currentFirstChild.return = returnFiber),
            (returnFiber = currentFirstChild))
          : (deleteRemainingChildren(returnFiber, currentFirstChild),
            (currentFirstChild = createFiberFromText(
              newChild,
              returnFiber.mode,
              lanes
            )),
            (currentFirstChild.return = returnFiber),
            (returnFiber = currentFirstChild)),
        placeSingleChild(returnFiber)
      );
    if (isArray(newChild))
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes
      );
    if (getIteratorFn(newChild))
      return reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes
      );
    isObject && throwOnInvalidObjectType(returnFiber, newChild);
    if ("undefined" === typeof newChild && !isUnkeyedTopLevelFragment)
      switch (returnFiber.tag) {
        case 1:
        case 0:
        case 11:
        case 15:
          throw Error(
            (getComponentName(returnFiber.type) || "Component") +
              "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null."
          );
      }
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  };
}
var reconcileChildFibers = ChildReconciler(!0),
  mountChildFibers = ChildReconciler(!1),
  NO_CONTEXT = {},
  contextStackCursor$1 = createCursor(NO_CONTEXT),
  contextFiberStackCursor = createCursor(NO_CONTEXT),
  rootInstanceStackCursor = createCursor(NO_CONTEXT);
function requiredContext(c) {
  if (c === NO_CONTEXT)
    throw Error(
      "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
    );
  return c;
}
function pushHostContainer(fiber, nextRootInstance) {
  push(rootInstanceStackCursor, nextRootInstance);
  push(contextFiberStackCursor, fiber);
  push(contextStackCursor$1, NO_CONTEXT);
  pop(contextStackCursor$1);
  push(contextStackCursor$1, { isInAParentText: !1 });
}
function popHostContainer() {
  pop(contextStackCursor$1);
  pop(contextFiberStackCursor);
  pop(rootInstanceStackCursor);
}
function pushHostContext(fiber) {
  requiredContext(rootInstanceStackCursor.current);
  var context = requiredContext(contextStackCursor$1.current);
  var JSCompiler_inline_result = fiber.type;
  JSCompiler_inline_result =
    "AndroidTextInput" === JSCompiler_inline_result ||
    "RCTMultilineTextInputView" === JSCompiler_inline_result ||
    "RCTSinglelineTextInputView" === JSCompiler_inline_result ||
    "RCTText" === JSCompiler_inline_result ||
    "RCTVirtualText" === JSCompiler_inline_result;
  JSCompiler_inline_result =
    context.isInAParentText !== JSCompiler_inline_result
      ? { isInAParentText: JSCompiler_inline_result }
      : context;
  context !== JSCompiler_inline_result &&
    (push(contextFiberStackCursor, fiber),
    push(contextStackCursor$1, JSCompiler_inline_result));
}
function popHostContext(fiber) {
  contextFiberStackCursor.current === fiber &&
    (pop(contextStackCursor$1), pop(contextFiberStackCursor));
}
var suspenseStackCursor = createCursor(0);
function findFirstSuspended(row) {
  for (var node = row; null !== node; ) {
    if (13 === node.tag) {
      var state = node.memoizedState;
      if (null !== state && (null === state.dehydrated || shim$1() || shim$1()))
        return node;
    } else if (19 === node.tag && void 0 !== node.memoizedProps.revealOrder) {
      if (0 !== (node.flags & 64)) return node;
    } else if (null !== node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === row) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === row) return null;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
  return null;
}
var workInProgressSources = [];
function resetWorkInProgressVersions() {
  for (var i = 0; i < workInProgressSources.length; i++)
    workInProgressSources[i]._workInProgressVersionSecondary = null;
  workInProgressSources.length = 0;
}
var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentBatchConfig$1 = ReactSharedInternals.ReactCurrentBatchConfig,
  renderLanes = 0,
  currentlyRenderingFiber$1 = null,
  currentHook = null,
  workInProgressHook = null,
  didScheduleRenderPhaseUpdate = !1,
  didScheduleRenderPhaseUpdateDuringThisPass = !1;
function throwInvalidHookError() {
  throw Error(
    "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem."
  );
}
function areHookInputsEqual(nextDeps, prevDeps) {
  if (null === prevDeps) return !1;
  for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
    if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
  return !0;
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
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = 0;
  ReactCurrentDispatcher$1.current =
    null === current || null === current.memoizedState
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;
  current = Component(props, secondArg);
  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    nextRenderLanes = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = !1;
      if (!(25 > nextRenderLanes))
        throw Error(
          "Too many re-renders. React limits the number of renders to prevent an infinite loop."
        );
      nextRenderLanes += 1;
      workInProgressHook = currentHook = null;
      workInProgress.updateQueue = null;
      ReactCurrentDispatcher$1.current = HooksDispatcherOnRerender;
      current = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  workInProgress = null !== currentHook && null !== currentHook.next;
  renderLanes = 0;
  workInProgressHook = currentHook = currentlyRenderingFiber$1 = null;
  didScheduleRenderPhaseUpdate = !1;
  if (workInProgress)
    throw Error(
      "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
    );
  return current;
}
function mountWorkInProgressHook() {
  var hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null
  };
  null === workInProgressHook
    ? (currentlyRenderingFiber$1.memoizedState = workInProgressHook = hook)
    : (workInProgressHook = workInProgressHook.next = hook);
  return workInProgressHook;
}
function updateWorkInProgressHook() {
  if (null === currentHook) {
    var nextCurrentHook = currentlyRenderingFiber$1.alternate;
    nextCurrentHook =
      null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
  } else nextCurrentHook = currentHook.next;
  var nextWorkInProgressHook =
    null === workInProgressHook
      ? currentlyRenderingFiber$1.memoizedState
      : workInProgressHook.next;
  if (null !== nextWorkInProgressHook)
    (workInProgressHook = nextWorkInProgressHook),
      (currentHook = nextCurrentHook);
  else {
    if (null === nextCurrentHook)
      throw Error("Rendered more hooks than during the previous render.");
    currentHook = nextCurrentHook;
    nextCurrentHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null
    };
    null === workInProgressHook
      ? (currentlyRenderingFiber$1.memoizedState = workInProgressHook = nextCurrentHook)
      : (workInProgressHook = workInProgressHook.next = nextCurrentHook);
  }
  return workInProgressHook;
}
function basicStateReducer(state, action) {
  return "function" === typeof action ? action(state) : action;
}
function updateReducer(reducer) {
  var hook = updateWorkInProgressHook(),
    queue = hook.queue;
  if (null === queue)
    throw Error(
      "Should have a queue. This is likely a bug in React. Please file an issue."
    );
  queue.lastRenderedReducer = reducer;
  var current = currentHook,
    baseQueue = current.baseQueue,
    pendingQueue = queue.pending;
  if (null !== pendingQueue) {
    if (null !== baseQueue) {
      var baseFirst = baseQueue.next;
      baseQueue.next = pendingQueue.next;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }
  if (null !== baseQueue) {
    baseQueue = baseQueue.next;
    current = current.baseState;
    var newBaseQueueLast = (baseFirst = pendingQueue = null),
      update = baseQueue;
    do {
      var updateLane = update.lane;
      if ((renderLanes & updateLane) === updateLane)
        null !== newBaseQueueLast &&
          (newBaseQueueLast = newBaseQueueLast.next = {
            lane: 0,
            action: update.action,
            eagerReducer: update.eagerReducer,
            eagerState: update.eagerState,
            next: null
          }),
          (current =
            update.eagerReducer === reducer
              ? update.eagerState
              : reducer(current, update.action));
      else {
        var clone = {
          lane: updateLane,
          action: update.action,
          eagerReducer: update.eagerReducer,
          eagerState: update.eagerState,
          next: null
        };
        null === newBaseQueueLast
          ? ((baseFirst = newBaseQueueLast = clone), (pendingQueue = current))
          : (newBaseQueueLast = newBaseQueueLast.next = clone);
        currentlyRenderingFiber$1.lanes |= updateLane;
        workInProgressRootSkippedLanes |= updateLane;
      }
      update = update.next;
    } while (null !== update && update !== baseQueue);
    null === newBaseQueueLast
      ? (pendingQueue = current)
      : (newBaseQueueLast.next = baseFirst);
    objectIs(current, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = current;
    hook.baseState = pendingQueue;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = current;
  }
  return [hook.memoizedState, queue.dispatch];
}
function rerenderReducer(reducer) {
  var hook = updateWorkInProgressHook(),
    queue = hook.queue;
  if (null === queue)
    throw Error(
      "Should have a queue. This is likely a bug in React. Please file an issue."
    );
  queue.lastRenderedReducer = reducer;
  var dispatch = queue.dispatch,
    lastRenderPhaseUpdate = queue.pending,
    newState = hook.memoizedState;
  if (null !== lastRenderPhaseUpdate) {
    queue.pending = null;
    var update = (lastRenderPhaseUpdate = lastRenderPhaseUpdate.next);
    do (newState = reducer(newState, update.action)), (update = update.next);
    while (update !== lastRenderPhaseUpdate);
    objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = newState;
    null === hook.baseQueue && (hook.baseState = newState);
    queue.lastRenderedState = newState;
  }
  return [newState, dispatch];
}
function readFromUnsubcribedMutableSource(root, source, getSnapshot) {
  var getVersion = source._getVersion;
  getVersion = getVersion(source._source);
  var JSCompiler_inline_result = source._workInProgressVersionSecondary;
  if (null !== JSCompiler_inline_result)
    root = JSCompiler_inline_result === getVersion;
  else if (
    ((root = root.mutableReadLanes), (root = (renderLanes & root) === root))
  )
    (source._workInProgressVersionSecondary = getVersion),
      workInProgressSources.push(source);
  if (root) return getSnapshot(source._source);
  workInProgressSources.push(source);
  throw Error(
    "Cannot read from mutable source during the current render without tearing. This is a bug in React. Please file an issue."
  );
}
function useMutableSource(hook, source, getSnapshot, subscribe) {
  var root = workInProgressRoot;
  if (null === root)
    throw Error(
      "Expected a work-in-progress root. This is a bug in React. Please file an issue."
    );
  var getVersion = source._getVersion,
    version = getVersion(source._source),
    dispatcher = ReactCurrentDispatcher$1.current,
    _dispatcher$useState = dispatcher.useState(function() {
      return readFromUnsubcribedMutableSource(root, source, getSnapshot);
    }),
    setSnapshot = _dispatcher$useState[1],
    snapshot = _dispatcher$useState[0];
  _dispatcher$useState = workInProgressHook;
  var memoizedState = hook.memoizedState,
    refs = memoizedState.refs,
    prevGetSnapshot = refs.getSnapshot,
    prevSource = memoizedState.source;
  memoizedState = memoizedState.subscribe;
  var fiber = currentlyRenderingFiber$1;
  hook.memoizedState = { refs: refs, source: source, subscribe: subscribe };
  dispatcher.useEffect(
    function() {
      refs.getSnapshot = getSnapshot;
      refs.setSnapshot = setSnapshot;
      var maybeNewVersion = getVersion(source._source);
      if (!objectIs(version, maybeNewVersion)) {
        maybeNewVersion = getSnapshot(source._source);
        objectIs(snapshot, maybeNewVersion) ||
          (setSnapshot(maybeNewVersion),
          (maybeNewVersion = requestUpdateLane(fiber)),
          (root.mutableReadLanes |= maybeNewVersion & root.pendingLanes));
        maybeNewVersion = root.mutableReadLanes;
        root.entangledLanes |= maybeNewVersion;
        for (
          var entanglements = root.entanglements, lanes = maybeNewVersion;
          0 < lanes;

        ) {
          var index$11 = 31 - clz32(lanes),
            lane = 1 << index$11;
          entanglements[index$11] |= maybeNewVersion;
          lanes &= ~lane;
        }
      }
    },
    [getSnapshot, source, subscribe]
  );
  dispatcher.useEffect(
    function() {
      return subscribe(source._source, function() {
        var latestGetSnapshot = refs.getSnapshot,
          latestSetSnapshot = refs.setSnapshot;
        try {
          latestSetSnapshot(latestGetSnapshot(source._source));
          var lane = requestUpdateLane(fiber);
          root.mutableReadLanes |= lane & root.pendingLanes;
        } catch (error) {
          latestSetSnapshot(function() {
            throw error;
          });
        }
      });
    },
    [source, subscribe]
  );
  (objectIs(prevGetSnapshot, getSnapshot) &&
    objectIs(prevSource, source) &&
    objectIs(memoizedState, subscribe)) ||
    ((hook = {
      pending: null,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: snapshot
    }),
    (hook.dispatch = setSnapshot = dispatchAction.bind(
      null,
      currentlyRenderingFiber$1,
      hook
    )),
    (_dispatcher$useState.queue = hook),
    (_dispatcher$useState.baseQueue = null),
    (snapshot = readFromUnsubcribedMutableSource(root, source, getSnapshot)),
    (_dispatcher$useState.memoizedState = _dispatcher$useState.baseState = snapshot));
  return snapshot;
}
function updateMutableSource(source, getSnapshot, subscribe) {
  var hook = updateWorkInProgressHook();
  return useMutableSource(hook, source, getSnapshot, subscribe);
}
function mountState(initialState) {
  var hook = mountWorkInProgressHook();
  "function" === typeof initialState && (initialState = initialState());
  hook.memoizedState = hook.baseState = initialState;
  initialState = hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState
  };
  initialState = initialState.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber$1,
    initialState
  );
  return [hook.memoizedState, initialState];
}
function pushEffect(tag, create, destroy, deps) {
  tag = { tag: tag, create: create, destroy: destroy, deps: deps, next: null };
  create = currentlyRenderingFiber$1.updateQueue;
  null === create
    ? ((create = { lastEffect: null }),
      (currentlyRenderingFiber$1.updateQueue = create),
      (create.lastEffect = tag.next = tag))
    : ((destroy = create.lastEffect),
      null === destroy
        ? (create.lastEffect = tag.next = tag)
        : ((deps = destroy.next),
          (destroy.next = tag),
          (tag.next = deps),
          (create.lastEffect = tag)));
  return tag;
}
function updateRef() {
  return updateWorkInProgressHook().memoizedState;
}
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  var hook = mountWorkInProgressHook();
  currentlyRenderingFiber$1.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    1 | hookFlags,
    create,
    void 0,
    void 0 === deps ? null : deps
  );
}
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var destroy = void 0;
  if (null !== currentHook) {
    var prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (null !== deps && areHookInputsEqual(deps, prevEffect.deps)) {
      pushEffect(hookFlags, create, destroy, deps);
      return;
    }
  }
  currentlyRenderingFiber$1.flags |= fiberFlags;
  hook.memoizedState = pushEffect(1 | hookFlags, create, destroy, deps);
}
function mountEffect(create, deps) {
  return mountEffectImpl(516, 4, create, deps);
}
function updateEffect(create, deps) {
  return updateEffectImpl(516, 4, create, deps);
}
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(4, 2, create, deps);
}
function imperativeHandleEffect(create, ref) {
  if ("function" === typeof ref)
    return (
      (create = create()),
      ref(create),
      function() {
        ref(null);
      }
    );
  if (null !== ref && void 0 !== ref)
    return (
      (create = create()),
      (ref.current = create),
      function() {
        ref.current = null;
      }
    );
}
function updateImperativeHandle(ref, create, deps) {
  deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
  return updateEffectImpl(
    4,
    2,
    imperativeHandleEffect.bind(null, create, ref),
    deps
  );
}
function mountDebugValue() {}
function updateCallback(callback, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var prevState = hook.memoizedState;
  if (
    null !== prevState &&
    null !== deps &&
    areHookInputsEqual(deps, prevState[1])
  )
    return prevState[0];
  hook.memoizedState = [callback, deps];
  return callback;
}
function updateMemo(nextCreate, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var prevState = hook.memoizedState;
  if (
    null !== prevState &&
    null !== deps &&
    areHookInputsEqual(deps, prevState[1])
  )
    return prevState[0];
  nextCreate = nextCreate();
  hook.memoizedState = [nextCreate, deps];
  return nextCreate;
}
function startTransition(setPending, callback) {
  var priorityLevel = getCurrentPriorityLevel();
  runWithPriority(98 > priorityLevel ? 98 : priorityLevel, function() {
    setPending(!0);
  });
  runWithPriority(97 < priorityLevel ? 97 : priorityLevel, function() {
    var prevTransition = ReactCurrentBatchConfig$1.transition;
    ReactCurrentBatchConfig$1.transition = 1;
    try {
      setPending(!1), callback();
    } finally {
      ReactCurrentBatchConfig$1.transition = prevTransition;
    }
  });
}
function dispatchAction(fiber, queue, action) {
  var eventTime = requestEventTime(),
    lane = requestUpdateLane(fiber),
    update = {
      lane: lane,
      action: action,
      eagerReducer: null,
      eagerState: null,
      next: null
    },
    pending = queue.pending;
  null === pending
    ? (update.next = update)
    : ((update.next = pending.next), (pending.next = update));
  queue.pending = update;
  pending = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber$1 ||
    (null !== pending && pending === currentlyRenderingFiber$1)
  )
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = !0;
  else {
    if (
      0 === fiber.lanes &&
      (null === pending || 0 === pending.lanes) &&
      ((pending = queue.lastRenderedReducer), null !== pending)
    )
      try {
        var currentState = queue.lastRenderedState,
          eagerState = pending(currentState, action);
        update.eagerReducer = pending;
        update.eagerState = eagerState;
        if (objectIs(eagerState, currentState)) return;
      } catch (error) {
      } finally {
      }
    scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
var ContextOnlyDispatcher = {
    readContext: readContext,
    useCallback: throwInvalidHookError,
    useContext: throwInvalidHookError,
    useEffect: throwInvalidHookError,
    useImperativeHandle: throwInvalidHookError,
    useLayoutEffect: throwInvalidHookError,
    useMemo: throwInvalidHookError,
    useReducer: throwInvalidHookError,
    useRef: throwInvalidHookError,
    useState: throwInvalidHookError,
    useDebugValue: throwInvalidHookError,
    useDeferredValue: throwInvalidHookError,
    useTransition: throwInvalidHookError,
    useMutableSource: throwInvalidHookError,
    useOpaqueIdentifier: throwInvalidHookError,
    unstable_isNewReconciler: !1
  },
  HooksDispatcherOnMount = {
    readContext: readContext,
    useCallback: function(callback, deps) {
      mountWorkInProgressHook().memoizedState = [
        callback,
        void 0 === deps ? null : deps
      ];
      return callback;
    },
    useContext: readContext,
    useEffect: mountEffect,
    useImperativeHandle: function(ref, create, deps) {
      deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
      return mountEffectImpl(
        4,
        2,
        imperativeHandleEffect.bind(null, create, ref),
        deps
      );
    },
    useLayoutEffect: function(create, deps) {
      return mountEffectImpl(4, 2, create, deps);
    },
    useMemo: function(nextCreate, deps) {
      var hook = mountWorkInProgressHook();
      deps = void 0 === deps ? null : deps;
      nextCreate = nextCreate();
      hook.memoizedState = [nextCreate, deps];
      return nextCreate;
    },
    useReducer: function(reducer, initialArg, init) {
      var hook = mountWorkInProgressHook();
      initialArg = void 0 !== init ? init(initialArg) : initialArg;
      hook.memoizedState = hook.baseState = initialArg;
      reducer = hook.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialArg
      };
      reducer = reducer.dispatch = dispatchAction.bind(
        null,
        currentlyRenderingFiber$1,
        reducer
      );
      return [hook.memoizedState, reducer];
    },
    useRef: function(initialValue) {
      var hook = mountWorkInProgressHook();
      initialValue = { current: initialValue };
      return (hook.memoizedState = initialValue);
    },
    useState: mountState,
    useDebugValue: mountDebugValue,
    useDeferredValue: function(value) {
      var _mountState = mountState(value),
        prevValue = _mountState[0],
        setValue = _mountState[1];
      mountEffect(
        function() {
          var prevTransition = ReactCurrentBatchConfig$1.transition;
          ReactCurrentBatchConfig$1.transition = 1;
          try {
            setValue(value);
          } finally {
            ReactCurrentBatchConfig$1.transition = prevTransition;
          }
        },
        [value]
      );
      return prevValue;
    },
    useTransition: function() {
      var _mountState2 = mountState(!1),
        isPending = _mountState2[0];
      _mountState2 = startTransition.bind(null, _mountState2[1]);
      mountWorkInProgressHook().memoizedState = _mountState2;
      return [_mountState2, isPending];
    },
    useMutableSource: function(source, getSnapshot, subscribe) {
      var hook = mountWorkInProgressHook();
      hook.memoizedState = {
        refs: { getSnapshot: getSnapshot, setSnapshot: null },
        source: source,
        subscribe: subscribe
      };
      return useMutableSource(hook, source, getSnapshot, subscribe);
    },
    useOpaqueIdentifier: function() {
      throw Error("Not yet implemented");
    },
    unstable_isNewReconciler: !1
  },
  HooksDispatcherOnUpdate = {
    readContext: readContext,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: updateReducer,
    useRef: updateRef,
    useState: function() {
      return updateReducer(basicStateReducer);
    },
    useDebugValue: mountDebugValue,
    useDeferredValue: function(value) {
      var _updateState = updateReducer(basicStateReducer),
        prevValue = _updateState[0],
        setValue = _updateState[1];
      updateEffect(
        function() {
          var prevTransition = ReactCurrentBatchConfig$1.transition;
          ReactCurrentBatchConfig$1.transition = 1;
          try {
            setValue(value);
          } finally {
            ReactCurrentBatchConfig$1.transition = prevTransition;
          }
        },
        [value]
      );
      return prevValue;
    },
    useTransition: function() {
      var isPending = updateReducer(basicStateReducer)[0];
      return [updateWorkInProgressHook().memoizedState, isPending];
    },
    useMutableSource: updateMutableSource,
    useOpaqueIdentifier: function() {
      return updateReducer(basicStateReducer)[0];
    },
    unstable_isNewReconciler: !1
  },
  HooksDispatcherOnRerender = {
    readContext: readContext,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: rerenderReducer,
    useRef: updateRef,
    useState: function() {
      return rerenderReducer(basicStateReducer);
    },
    useDebugValue: mountDebugValue,
    useDeferredValue: function(value) {
      var _rerenderState = rerenderReducer(basicStateReducer),
        prevValue = _rerenderState[0],
        setValue = _rerenderState[1];
      updateEffect(
        function() {
          var prevTransition = ReactCurrentBatchConfig$1.transition;
          ReactCurrentBatchConfig$1.transition = 1;
          try {
            setValue(value);
          } finally {
            ReactCurrentBatchConfig$1.transition = prevTransition;
          }
        },
        [value]
      );
      return prevValue;
    },
    useTransition: function() {
      var isPending = rerenderReducer(basicStateReducer)[0];
      return [updateWorkInProgressHook().memoizedState, isPending];
    },
    useMutableSource: updateMutableSource,
    useOpaqueIdentifier: function() {
      return rerenderReducer(basicStateReducer)[0];
    },
    unstable_isNewReconciler: !1
  },
  ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner,
  didReceiveUpdate = !1;
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  workInProgress.child =
    null === current
      ? mountChildFibers(workInProgress, null, nextChildren, renderLanes)
      : reconcileChildFibers(
          workInProgress,
          current.child,
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
  Component = Component.render;
  var ref = workInProgress.ref;
  prepareToReadContext(workInProgress, renderLanes);
  nextProps = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    ref,
    renderLanes
  );
  if (null !== current && !didReceiveUpdate)
    return (
      (workInProgress.updateQueue = current.updateQueue),
      (workInProgress.flags &= -517),
      (current.lanes &= ~renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, nextProps, renderLanes);
  return workInProgress.child;
}
function updateMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  updateLanes,
  renderLanes
) {
  if (null === current) {
    var type = Component.type;
    if (
      "function" === typeof type &&
      !shouldConstruct(type) &&
      void 0 === type.defaultProps &&
      null === Component.compare &&
      void 0 === Component.defaultProps
    )
      return (
        (workInProgress.tag = 15),
        (workInProgress.type = type),
        updateSimpleMemoComponent(
          current,
          workInProgress,
          type,
          nextProps,
          updateLanes,
          renderLanes
        )
      );
    current = createFiberFromTypeAndProps(
      Component.type,
      null,
      nextProps,
      workInProgress,
      workInProgress.mode,
      renderLanes
    );
    current.ref = workInProgress.ref;
    current.return = workInProgress;
    return (workInProgress.child = current);
  }
  type = current.child;
  if (
    0 === (updateLanes & renderLanes) &&
    ((updateLanes = type.memoizedProps),
    (Component = Component.compare),
    (Component = null !== Component ? Component : shallowEqual),
    Component(updateLanes, nextProps) && current.ref === workInProgress.ref)
  )
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  workInProgress.flags |= 1;
  current = createWorkInProgress(type, nextProps);
  current.ref = workInProgress.ref;
  current.return = workInProgress;
  return (workInProgress.child = current);
}
function updateSimpleMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  updateLanes,
  renderLanes
) {
  if (
    null !== current &&
    shallowEqual(current.memoizedProps, nextProps) &&
    current.ref === workInProgress.ref
  )
    if (((didReceiveUpdate = !1), 0 !== (renderLanes & updateLanes)))
      0 !== (current.flags & 32768) && (didReceiveUpdate = !0);
    else
      return (
        (workInProgress.lanes = current.lanes),
        bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
      );
  return updateFunctionComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    renderLanes
  );
}
function updateOffscreenComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    nextChildren = nextProps.children,
    prevState = null !== current ? current.memoizedState : null;
  if (
    "hidden" === nextProps.mode ||
    "unstable-defer-without-hiding" === nextProps.mode
  )
    if (0 === (workInProgress.mode & 4))
      (workInProgress.memoizedState = { baseLanes: 0 }),
        pushRenderLanes(workInProgress, renderLanes);
    else if (0 !== (renderLanes & 1073741824))
      (workInProgress.memoizedState = { baseLanes: 0 }),
        pushRenderLanes(
          workInProgress,
          null !== prevState ? prevState.baseLanes : renderLanes
        );
    else
      return (
        (current =
          null !== prevState ? prevState.baseLanes | renderLanes : renderLanes),
        (workInProgress.lanes = workInProgress.childLanes = 1073741824),
        (workInProgress.memoizedState = { baseLanes: current }),
        pushRenderLanes(workInProgress, current),
        null
      );
  else
    null !== prevState
      ? ((nextProps = prevState.baseLanes | renderLanes),
        (workInProgress.memoizedState = null))
      : (nextProps = renderLanes),
      pushRenderLanes(workInProgress, nextProps);
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function markRef(current, workInProgress) {
  var ref = workInProgress.ref;
  if (
    (null === current && null !== ref) ||
    (null !== current && current.ref !== ref)
  )
    workInProgress.flags |= 128;
}
function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  var context = isContextProvider(Component)
    ? previousContext
    : contextStackCursor.current;
  context = getMaskedContext(workInProgress, context);
  prepareToReadContext(workInProgress, renderLanes);
  Component = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    context,
    renderLanes
  );
  if (null !== current && !didReceiveUpdate)
    return (
      (workInProgress.updateQueue = current.updateQueue),
      (workInProgress.flags &= -517),
      (current.lanes &= ~renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, Component, renderLanes);
  return workInProgress.child;
}
function updateClassComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  if (isContextProvider(Component)) {
    var hasContext = !0;
    pushContextProvider(workInProgress);
  } else hasContext = !1;
  prepareToReadContext(workInProgress, renderLanes);
  if (null === workInProgress.stateNode)
    null !== current &&
      ((current.alternate = null),
      (workInProgress.alternate = null),
      (workInProgress.flags |= 2)),
      constructClassInstance(workInProgress, Component, nextProps),
      mountClassInstance(workInProgress, Component, nextProps, renderLanes),
      (nextProps = !0);
  else if (null === current) {
    var instance = workInProgress.stateNode,
      oldProps = workInProgress.memoizedProps;
    instance.props = oldProps;
    var oldContext = instance.context,
      contextType = Component.contextType;
    "object" === typeof contextType && null !== contextType
      ? (contextType = readContext(contextType))
      : ((contextType = isContextProvider(Component)
          ? previousContext
          : contextStackCursor.current),
        (contextType = getMaskedContext(workInProgress, contextType)));
    var getDerivedStateFromProps = Component.getDerivedStateFromProps,
      hasNewLifecycles =
        "function" === typeof getDerivedStateFromProps ||
        "function" === typeof instance.getSnapshotBeforeUpdate;
    hasNewLifecycles ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((oldProps !== nextProps || oldContext !== contextType) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          contextType
        ));
    hasForceUpdate = !1;
    var oldState = workInProgress.memoizedState;
    instance.state = oldState;
    processUpdateQueue(workInProgress, nextProps, instance, renderLanes);
    oldContext = workInProgress.memoizedState;
    oldProps !== nextProps ||
    oldState !== oldContext ||
    didPerformWorkStackCursor.current ||
    hasForceUpdate
      ? ("function" === typeof getDerivedStateFromProps &&
          (applyDerivedStateFromProps(
            workInProgress,
            Component,
            getDerivedStateFromProps,
            nextProps
          ),
          (oldContext = workInProgress.memoizedState)),
        (oldProps =
          hasForceUpdate ||
          checkShouldComponentUpdate(
            workInProgress,
            Component,
            oldProps,
            nextProps,
            oldState,
            oldContext,
            contextType
          ))
          ? (hasNewLifecycles ||
              ("function" !== typeof instance.UNSAFE_componentWillMount &&
                "function" !== typeof instance.componentWillMount) ||
              ("function" === typeof instance.componentWillMount &&
                instance.componentWillMount(),
              "function" === typeof instance.UNSAFE_componentWillMount &&
                instance.UNSAFE_componentWillMount()),
            "function" === typeof instance.componentDidMount &&
              (workInProgress.flags |= 4))
          : ("function" === typeof instance.componentDidMount &&
              (workInProgress.flags |= 4),
            (workInProgress.memoizedProps = nextProps),
            (workInProgress.memoizedState = oldContext)),
        (instance.props = nextProps),
        (instance.state = oldContext),
        (instance.context = contextType),
        (nextProps = oldProps))
      : ("function" === typeof instance.componentDidMount &&
          (workInProgress.flags |= 4),
        (nextProps = !1));
  } else {
    instance = workInProgress.stateNode;
    cloneUpdateQueue(current, workInProgress);
    oldProps = workInProgress.memoizedProps;
    contextType =
      workInProgress.type === workInProgress.elementType
        ? oldProps
        : resolveDefaultProps(workInProgress.type, oldProps);
    instance.props = contextType;
    hasNewLifecycles = workInProgress.pendingProps;
    oldState = instance.context;
    oldContext = Component.contextType;
    "object" === typeof oldContext && null !== oldContext
      ? (oldContext = readContext(oldContext))
      : ((oldContext = isContextProvider(Component)
          ? previousContext
          : contextStackCursor.current),
        (oldContext = getMaskedContext(workInProgress, oldContext)));
    var getDerivedStateFromProps$jscomp$0 = Component.getDerivedStateFromProps;
    (getDerivedStateFromProps =
      "function" === typeof getDerivedStateFromProps$jscomp$0 ||
      "function" === typeof instance.getSnapshotBeforeUpdate) ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((oldProps !== hasNewLifecycles || oldState !== oldContext) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          oldContext
        ));
    hasForceUpdate = !1;
    oldState = workInProgress.memoizedState;
    instance.state = oldState;
    processUpdateQueue(workInProgress, nextProps, instance, renderLanes);
    var newState = workInProgress.memoizedState;
    oldProps !== hasNewLifecycles ||
    oldState !== newState ||
    didPerformWorkStackCursor.current ||
    hasForceUpdate
      ? ("function" === typeof getDerivedStateFromProps$jscomp$0 &&
          (applyDerivedStateFromProps(
            workInProgress,
            Component,
            getDerivedStateFromProps$jscomp$0,
            nextProps
          ),
          (newState = workInProgress.memoizedState)),
        (contextType =
          hasForceUpdate ||
          checkShouldComponentUpdate(
            workInProgress,
            Component,
            contextType,
            nextProps,
            oldState,
            newState,
            oldContext
          ))
          ? (getDerivedStateFromProps ||
              ("function" !== typeof instance.UNSAFE_componentWillUpdate &&
                "function" !== typeof instance.componentWillUpdate) ||
              ("function" === typeof instance.componentWillUpdate &&
                instance.componentWillUpdate(nextProps, newState, oldContext),
              "function" === typeof instance.UNSAFE_componentWillUpdate &&
                instance.UNSAFE_componentWillUpdate(
                  nextProps,
                  newState,
                  oldContext
                )),
            "function" === typeof instance.componentDidUpdate &&
              (workInProgress.flags |= 4),
            "function" === typeof instance.getSnapshotBeforeUpdate &&
              (workInProgress.flags |= 256))
          : ("function" !== typeof instance.componentDidUpdate ||
              (oldProps === current.memoizedProps &&
                oldState === current.memoizedState) ||
              (workInProgress.flags |= 4),
            "function" !== typeof instance.getSnapshotBeforeUpdate ||
              (oldProps === current.memoizedProps &&
                oldState === current.memoizedState) ||
              (workInProgress.flags |= 256),
            (workInProgress.memoizedProps = nextProps),
            (workInProgress.memoizedState = newState)),
        (instance.props = nextProps),
        (instance.state = newState),
        (instance.context = oldContext),
        (nextProps = contextType))
      : ("function" !== typeof instance.componentDidUpdate ||
          (oldProps === current.memoizedProps &&
            oldState === current.memoizedState) ||
          (workInProgress.flags |= 4),
        "function" !== typeof instance.getSnapshotBeforeUpdate ||
          (oldProps === current.memoizedProps &&
            oldState === current.memoizedState) ||
          (workInProgress.flags |= 256),
        (nextProps = !1));
  }
  return finishClassComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    hasContext,
    renderLanes
  );
}
function finishClassComponent(
  current,
  workInProgress,
  Component,
  shouldUpdate,
  hasContext,
  renderLanes
) {
  markRef(current, workInProgress);
  var didCaptureError = 0 !== (workInProgress.flags & 64);
  if (!shouldUpdate && !didCaptureError)
    return (
      hasContext && invalidateContextProvider(workInProgress, Component, !1),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  shouldUpdate = workInProgress.stateNode;
  ReactCurrentOwner$1.current = workInProgress;
  var nextChildren =
    didCaptureError && "function" !== typeof Component.getDerivedStateFromError
      ? null
      : shouldUpdate.render();
  workInProgress.flags |= 1;
  null !== current && didCaptureError
    ? ((workInProgress.child = reconcileChildFibers(
        workInProgress,
        current.child,
        null,
        renderLanes
      )),
      (workInProgress.child = reconcileChildFibers(
        workInProgress,
        null,
        nextChildren,
        renderLanes
      )))
    : reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  workInProgress.memoizedState = shouldUpdate.state;
  hasContext && invalidateContextProvider(workInProgress, Component, !0);
  return workInProgress.child;
}
function pushHostRootContext(workInProgress) {
  var root = workInProgress.stateNode;
  root.pendingContext
    ? pushTopLevelContextObject(
        workInProgress,
        root.pendingContext,
        root.pendingContext !== root.context
      )
    : root.context &&
      pushTopLevelContextObject(workInProgress, root.context, !1);
  pushHostContainer(workInProgress, root.containerInfo);
}
var SUSPENDED_MARKER = { dehydrated: null, retryLane: 0 };
function updateSuspenseComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    suspenseContext = suspenseStackCursor.current,
    showFallback = !1,
    JSCompiler_temp;
  (JSCompiler_temp = 0 !== (workInProgress.flags & 64)) ||
    (JSCompiler_temp =
      null !== current && null === current.memoizedState
        ? !1
        : 0 !== (suspenseContext & 2));
  JSCompiler_temp
    ? ((showFallback = !0), (workInProgress.flags &= -65))
    : (null !== current && null === current.memoizedState) ||
      void 0 === nextProps.fallback ||
      !0 === nextProps.unstable_avoidThisFallback ||
      (suspenseContext |= 1);
  push(suspenseStackCursor, suspenseContext & 1);
  if (null === current) {
    current = nextProps.children;
    suspenseContext = nextProps.fallback;
    if (showFallback)
      return (
        (current = mountSuspenseFallbackChildren(
          workInProgress,
          current,
          suspenseContext,
          renderLanes
        )),
        (workInProgress.child.memoizedState = { baseLanes: renderLanes }),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        current
      );
    if ("number" === typeof nextProps.unstable_expectedLoadTime)
      return (
        (current = mountSuspenseFallbackChildren(
          workInProgress,
          current,
          suspenseContext,
          renderLanes
        )),
        (workInProgress.child.memoizedState = { baseLanes: renderLanes }),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        (workInProgress.lanes = 33554432),
        current
      );
    renderLanes = createFiberFromOffscreen(
      { mode: "visible", children: current },
      workInProgress.mode,
      renderLanes,
      null
    );
    renderLanes.return = workInProgress;
    return (workInProgress.child = renderLanes);
  }
  if (null !== current.memoizedState) {
    if (showFallback)
      return (
        (nextProps = updateSuspenseFallbackChildren(
          current,
          workInProgress,
          nextProps.children,
          nextProps.fallback,
          renderLanes
        )),
        (showFallback = workInProgress.child),
        (suspenseContext = current.child.memoizedState),
        (showFallback.memoizedState =
          null === suspenseContext
            ? { baseLanes: renderLanes }
            : { baseLanes: suspenseContext.baseLanes | renderLanes }),
        (showFallback.childLanes = current.childLanes & ~renderLanes),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        nextProps
      );
    renderLanes = updateSuspensePrimaryChildren(
      current,
      workInProgress,
      nextProps.children,
      renderLanes
    );
    workInProgress.memoizedState = null;
    return renderLanes;
  }
  if (showFallback)
    return (
      (nextProps = updateSuspenseFallbackChildren(
        current,
        workInProgress,
        nextProps.children,
        nextProps.fallback,
        renderLanes
      )),
      (showFallback = workInProgress.child),
      (suspenseContext = current.child.memoizedState),
      (showFallback.memoizedState =
        null === suspenseContext
          ? { baseLanes: renderLanes }
          : { baseLanes: suspenseContext.baseLanes | renderLanes }),
      (showFallback.childLanes = current.childLanes & ~renderLanes),
      (workInProgress.memoizedState = SUSPENDED_MARKER),
      nextProps
    );
  renderLanes = updateSuspensePrimaryChildren(
    current,
    workInProgress,
    nextProps.children,
    renderLanes
  );
  workInProgress.memoizedState = null;
  return renderLanes;
}
function mountSuspenseFallbackChildren(
  workInProgress,
  primaryChildren,
  fallbackChildren,
  renderLanes
) {
  var mode = workInProgress.mode,
    progressedPrimaryFragment = workInProgress.child;
  primaryChildren = { mode: "hidden", children: primaryChildren };
  0 === (mode & 2) && null !== progressedPrimaryFragment
    ? ((progressedPrimaryFragment.childLanes = 0),
      (progressedPrimaryFragment.pendingProps = primaryChildren))
    : (progressedPrimaryFragment = createFiberFromOffscreen(
        primaryChildren,
        mode,
        0,
        null
      ));
  fallbackChildren = createFiberFromFragment(
    fallbackChildren,
    mode,
    renderLanes,
    null
  );
  progressedPrimaryFragment.return = workInProgress;
  fallbackChildren.return = workInProgress;
  progressedPrimaryFragment.sibling = fallbackChildren;
  workInProgress.child = progressedPrimaryFragment;
  return fallbackChildren;
}
function updateSuspensePrimaryChildren(
  current,
  workInProgress,
  primaryChildren,
  renderLanes
) {
  var currentPrimaryChildFragment = current.child;
  current = currentPrimaryChildFragment.sibling;
  primaryChildren = createWorkInProgress(currentPrimaryChildFragment, {
    mode: "visible",
    children: primaryChildren
  });
  0 === (workInProgress.mode & 2) && (primaryChildren.lanes = renderLanes);
  primaryChildren.return = workInProgress;
  primaryChildren.sibling = null;
  null !== current &&
    ((current.nextEffect = null),
    (current.flags = 8),
    (workInProgress.firstEffect = workInProgress.lastEffect = current));
  return (workInProgress.child = primaryChildren);
}
function updateSuspenseFallbackChildren(
  current,
  workInProgress,
  primaryChildren,
  fallbackChildren,
  renderLanes
) {
  var mode = workInProgress.mode,
    currentPrimaryChildFragment = current.child;
  current = currentPrimaryChildFragment.sibling;
  var primaryChildProps = { mode: "hidden", children: primaryChildren };
  0 === (mode & 2) && workInProgress.child !== currentPrimaryChildFragment
    ? ((primaryChildren = workInProgress.child),
      (primaryChildren.childLanes = 0),
      (primaryChildren.pendingProps = primaryChildProps),
      (currentPrimaryChildFragment = primaryChildren.lastEffect),
      null !== currentPrimaryChildFragment
        ? ((workInProgress.firstEffect = primaryChildren.firstEffect),
          (workInProgress.lastEffect = currentPrimaryChildFragment),
          (currentPrimaryChildFragment.nextEffect = null))
        : (workInProgress.firstEffect = workInProgress.lastEffect = null))
    : (primaryChildren = createWorkInProgress(
        currentPrimaryChildFragment,
        primaryChildProps
      ));
  null !== current
    ? (fallbackChildren = createWorkInProgress(current, fallbackChildren))
    : ((fallbackChildren = createFiberFromFragment(
        fallbackChildren,
        mode,
        renderLanes,
        null
      )),
      (fallbackChildren.flags |= 2));
  fallbackChildren.return = workInProgress;
  primaryChildren.return = workInProgress;
  primaryChildren.sibling = fallbackChildren;
  workInProgress.child = primaryChildren;
  return fallbackChildren;
}
function scheduleWorkOnFiber(fiber, renderLanes) {
  fiber.lanes |= renderLanes;
  var alternate = fiber.alternate;
  null !== alternate && (alternate.lanes |= renderLanes);
  scheduleWorkOnParentPath(fiber.return, renderLanes);
}
function initSuspenseListRenderState(
  workInProgress,
  isBackwards,
  tail,
  lastContentRow,
  tailMode,
  lastEffectBeforeRendering
) {
  var renderState = workInProgress.memoizedState;
  null === renderState
    ? (workInProgress.memoizedState = {
        isBackwards: isBackwards,
        rendering: null,
        renderingStartTime: 0,
        last: lastContentRow,
        tail: tail,
        tailMode: tailMode,
        lastEffect: lastEffectBeforeRendering
      })
    : ((renderState.isBackwards = isBackwards),
      (renderState.rendering = null),
      (renderState.renderingStartTime = 0),
      (renderState.last = lastContentRow),
      (renderState.tail = tail),
      (renderState.tailMode = tailMode),
      (renderState.lastEffect = lastEffectBeforeRendering));
}
function updateSuspenseListComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    revealOrder = nextProps.revealOrder,
    tailMode = nextProps.tail;
  reconcileChildren(current, workInProgress, nextProps.children, renderLanes);
  nextProps = suspenseStackCursor.current;
  if (0 !== (nextProps & 2))
    (nextProps = (nextProps & 1) | 2), (workInProgress.flags |= 64);
  else {
    if (null !== current && 0 !== (current.flags & 64))
      a: for (current = workInProgress.child; null !== current; ) {
        if (13 === current.tag)
          null !== current.memoizedState &&
            scheduleWorkOnFiber(current, renderLanes);
        else if (19 === current.tag) scheduleWorkOnFiber(current, renderLanes);
        else if (null !== current.child) {
          current.child.return = current;
          current = current.child;
          continue;
        }
        if (current === workInProgress) break a;
        for (; null === current.sibling; ) {
          if (null === current.return || current.return === workInProgress)
            break a;
          current = current.return;
        }
        current.sibling.return = current.return;
        current = current.sibling;
      }
    nextProps &= 1;
  }
  push(suspenseStackCursor, nextProps);
  if (0 === (workInProgress.mode & 2)) workInProgress.memoizedState = null;
  else
    switch (revealOrder) {
      case "forwards":
        renderLanes = workInProgress.child;
        for (revealOrder = null; null !== renderLanes; )
          (current = renderLanes.alternate),
            null !== current &&
              null === findFirstSuspended(current) &&
              (revealOrder = renderLanes),
            (renderLanes = renderLanes.sibling);
        renderLanes = revealOrder;
        null === renderLanes
          ? ((revealOrder = workInProgress.child),
            (workInProgress.child = null))
          : ((revealOrder = renderLanes.sibling), (renderLanes.sibling = null));
        initSuspenseListRenderState(
          workInProgress,
          !1,
          revealOrder,
          renderLanes,
          tailMode,
          workInProgress.lastEffect
        );
        break;
      case "backwards":
        renderLanes = null;
        revealOrder = workInProgress.child;
        for (workInProgress.child = null; null !== revealOrder; ) {
          current = revealOrder.alternate;
          if (null !== current && null === findFirstSuspended(current)) {
            workInProgress.child = revealOrder;
            break;
          }
          current = revealOrder.sibling;
          revealOrder.sibling = renderLanes;
          renderLanes = revealOrder;
          revealOrder = current;
        }
        initSuspenseListRenderState(
          workInProgress,
          !0,
          renderLanes,
          null,
          tailMode,
          workInProgress.lastEffect
        );
        break;
      case "together":
        initSuspenseListRenderState(
          workInProgress,
          !1,
          null,
          null,
          void 0,
          workInProgress.lastEffect
        );
        break;
      default:
        workInProgress.memoizedState = null;
    }
  return workInProgress.child;
}
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
  null !== current && (workInProgress.dependencies = current.dependencies);
  workInProgressRootSkippedLanes |= workInProgress.lanes;
  if (0 !== (renderLanes & workInProgress.childLanes)) {
    if (null !== current && workInProgress.child !== current.child)
      throw Error("Resuming work not yet implemented.");
    if (null !== workInProgress.child) {
      current = workInProgress.child;
      renderLanes = createWorkInProgress(current, current.pendingProps);
      workInProgress.child = renderLanes;
      for (renderLanes.return = workInProgress; null !== current.sibling; )
        (current = current.sibling),
          (renderLanes = renderLanes.sibling = createWorkInProgress(
            current,
            current.pendingProps
          )),
          (renderLanes.return = workInProgress);
      renderLanes.sibling = null;
    }
    return workInProgress.child;
  }
  return null;
}
var appendAllChildren,
  updateHostContainer,
  updateHostComponent$1,
  updateHostText$1;
appendAllChildren = function(
  parent,
  workInProgress,
  needsVisibilityToggle,
  isHidden
) {
  for (var node = workInProgress.child; null !== node; ) {
    if (5 === node.tag) {
      var instance = node.stateNode;
      needsVisibilityToggle &&
        isHidden &&
        (instance = cloneHiddenInstance(instance));
      appendChildNode(parent.node, instance.node);
    } else if (6 === node.tag) {
      instance = node.stateNode;
      if (needsVisibilityToggle && isHidden)
        throw Error("Not yet implemented.");
      appendChildNode(parent.node, instance.node);
    } else if (4 !== node.tag) {
      if (
        13 === node.tag &&
        0 !== (node.flags & 4) &&
        (instance = null !== node.memoizedState)
      ) {
        var primaryChildParent = node.child;
        if (
          null !== primaryChildParent &&
          (null !== primaryChildParent.child &&
            ((primaryChildParent.child.return = primaryChildParent),
            appendAllChildren(parent, primaryChildParent, !0, instance)),
          (instance = primaryChildParent.sibling),
          null !== instance)
        ) {
          instance.return = node;
          node = instance;
          continue;
        }
      }
      if (null !== node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
    }
    if (node === workInProgress) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === workInProgress) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
};
function appendAllChildrenToContainer(
  containerChildSet,
  workInProgress,
  needsVisibilityToggle,
  isHidden
) {
  for (var node = workInProgress.child; null !== node; ) {
    if (5 === node.tag) {
      var instance = node.stateNode;
      needsVisibilityToggle &&
        isHidden &&
        (instance = cloneHiddenInstance(instance));
      appendChildNodeToSet(containerChildSet, instance.node);
    } else if (6 === node.tag) {
      instance = node.stateNode;
      if (needsVisibilityToggle && isHidden)
        throw Error("Not yet implemented.");
      appendChildNodeToSet(containerChildSet, instance.node);
    } else if (4 !== node.tag) {
      if (
        13 === node.tag &&
        0 !== (node.flags & 4) &&
        (instance = null !== node.memoizedState)
      ) {
        var primaryChildParent = node.child;
        if (
          null !== primaryChildParent &&
          (null !== primaryChildParent.child &&
            ((primaryChildParent.child.return = primaryChildParent),
            appendAllChildrenToContainer(
              containerChildSet,
              primaryChildParent,
              !0,
              instance
            )),
          (instance = primaryChildParent.sibling),
          null !== instance)
        ) {
          instance.return = node;
          node = instance;
          continue;
        }
      }
      if (null !== node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
    }
    if (node === workInProgress) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === workInProgress) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
updateHostContainer = function(workInProgress) {
  var portalOrRoot = workInProgress.stateNode;
  if (null !== workInProgress.firstEffect) {
    var container = portalOrRoot.containerInfo,
      newChildSet = createChildNodeSet(container);
    appendAllChildrenToContainer(newChildSet, workInProgress, !1, !1);
    portalOrRoot.pendingChildren = newChildSet;
    workInProgress.flags |= 4;
    completeRoot(container, newChildSet);
  }
};
updateHostComponent$1 = function(current, workInProgress, type, newProps) {
  type = current.stateNode;
  var oldProps = current.memoizedProps;
  if ((current = null === workInProgress.firstEffect) && oldProps === newProps)
    workInProgress.stateNode = type;
  else {
    var recyclableInstance = workInProgress.stateNode;
    requiredContext(contextStackCursor$1.current);
    var updatePayload = null;
    oldProps !== newProps &&
      ((oldProps = diffProperties(
        null,
        oldProps,
        newProps,
        recyclableInstance.canonical.viewConfig.validAttributes
      )),
      (recyclableInstance.canonical.currentProps = newProps),
      (updatePayload = oldProps));
    current && null === updatePayload
      ? (workInProgress.stateNode = type)
      : ((newProps = updatePayload),
        (recyclableInstance = type.node),
        (type = {
          node: current
            ? null !== newProps
              ? cloneNodeWithNewProps(recyclableInstance, newProps)
              : cloneNode(recyclableInstance)
            : null !== newProps
            ? cloneNodeWithNewChildrenAndProps(recyclableInstance, newProps)
            : cloneNodeWithNewChildren(recyclableInstance),
          canonical: type.canonical
        }),
        (workInProgress.stateNode = type),
        current
          ? (workInProgress.flags |= 4)
          : appendAllChildren(type, workInProgress, !1, !1));
  }
};
updateHostText$1 = function(current, workInProgress, oldText, newText) {
  oldText !== newText
    ? ((current = requiredContext(rootInstanceStackCursor.current)),
      (oldText = requiredContext(contextStackCursor$1.current)),
      (workInProgress.stateNode = createTextInstance(
        newText,
        current,
        oldText,
        workInProgress
      )),
      (workInProgress.flags |= 4))
    : (workInProgress.stateNode = current.stateNode);
};
function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
  switch (renderState.tailMode) {
    case "hidden":
      hasRenderedATailFallback = renderState.tail;
      for (var lastTailNode = null; null !== hasRenderedATailFallback; )
        null !== hasRenderedATailFallback.alternate &&
          (lastTailNode = hasRenderedATailFallback),
          (hasRenderedATailFallback = hasRenderedATailFallback.sibling);
      null === lastTailNode
        ? (renderState.tail = null)
        : (lastTailNode.sibling = null);
      break;
    case "collapsed":
      lastTailNode = renderState.tail;
      for (var lastTailNode$64 = null; null !== lastTailNode; )
        null !== lastTailNode.alternate && (lastTailNode$64 = lastTailNode),
          (lastTailNode = lastTailNode.sibling);
      null === lastTailNode$64
        ? hasRenderedATailFallback || null === renderState.tail
          ? (renderState.tail = null)
          : (renderState.tail.sibling = null)
        : (lastTailNode$64.sibling = null);
  }
}
function completeWork(current, workInProgress, renderLanes) {
  var newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return null;
    case 1:
      return isContextProvider(workInProgress.type) && popContext(), null;
    case 3:
      return (
        popHostContainer(),
        pop(didPerformWorkStackCursor),
        pop(contextStackCursor),
        resetWorkInProgressVersions(),
        (newProps = workInProgress.stateNode),
        newProps.pendingContext &&
          ((newProps.context = newProps.pendingContext),
          (newProps.pendingContext = null)),
        (null !== current && null !== current.child) ||
          newProps.hydrate ||
          (workInProgress.flags |= 256),
        updateHostContainer(workInProgress),
        null
      );
    case 5:
      popHostContext(workInProgress);
      var rootContainerInstance = requiredContext(
        rootInstanceStackCursor.current
      );
      renderLanes = workInProgress.type;
      if (null !== current && null != workInProgress.stateNode)
        updateHostComponent$1(
          current,
          workInProgress,
          renderLanes,
          newProps,
          rootContainerInstance
        ),
          current.ref !== workInProgress.ref && (workInProgress.flags |= 128);
      else {
        if (!newProps) {
          if (null === workInProgress.stateNode)
            throw Error(
              "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
            );
          return null;
        }
        requiredContext(contextStackCursor$1.current);
        current = nextReactTag;
        nextReactTag += 2;
        renderLanes = getViewConfigForType(renderLanes);
        var updatePayload = diffProperties(
          null,
          emptyObject,
          newProps,
          renderLanes.validAttributes
        );
        rootContainerInstance = createNode(
          current,
          renderLanes.uiViewClassName,
          rootContainerInstance,
          updatePayload,
          workInProgress
        );
        current = new ReactFabricHostComponent(
          current,
          renderLanes,
          newProps,
          workInProgress
        );
        current = { node: rootContainerInstance, canonical: current };
        appendAllChildren(current, workInProgress, !1, !1);
        workInProgress.stateNode = current;
        null !== workInProgress.ref && (workInProgress.flags |= 128);
      }
      return null;
    case 6:
      if (current && null != workInProgress.stateNode)
        updateHostText$1(
          current,
          workInProgress,
          current.memoizedProps,
          newProps
        );
      else {
        if ("string" !== typeof newProps && null === workInProgress.stateNode)
          throw Error(
            "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
          );
        current = requiredContext(rootInstanceStackCursor.current);
        rootContainerInstance = requiredContext(contextStackCursor$1.current);
        workInProgress.stateNode = createTextInstance(
          newProps,
          current,
          rootContainerInstance,
          workInProgress
        );
      }
      return null;
    case 13:
      pop(suspenseStackCursor);
      newProps = workInProgress.memoizedState;
      if (0 !== (workInProgress.flags & 64))
        return (workInProgress.lanes = renderLanes), workInProgress;
      newProps = null !== newProps;
      rootContainerInstance = !1;
      null !== current &&
        (rootContainerInstance = null !== current.memoizedState);
      if (newProps && !rootContainerInstance && 0 !== (workInProgress.mode & 2))
        if (
          (null === current &&
            !0 !== workInProgress.memoizedProps.unstable_avoidThisFallback) ||
          0 !== (suspenseStackCursor.current & 1)
        )
          0 === workInProgressRootExitStatus &&
            (workInProgressRootExitStatus = 3);
        else {
          if (
            0 === workInProgressRootExitStatus ||
            3 === workInProgressRootExitStatus
          )
            workInProgressRootExitStatus = 4;
          null === workInProgressRoot ||
            (0 === (workInProgressRootSkippedLanes & 134217727) &&
              0 === (workInProgressRootUpdatedLanes & 134217727)) ||
            markRootSuspended$1(
              workInProgressRoot,
              workInProgressRootRenderLanes
            );
        }
      newProps && (workInProgress.flags |= 4);
      return null;
    case 4:
      return popHostContainer(), updateHostContainer(workInProgress), null;
    case 10:
      return popProvider(workInProgress), null;
    case 17:
      return isContextProvider(workInProgress.type) && popContext(), null;
    case 19:
      pop(suspenseStackCursor);
      newProps = workInProgress.memoizedState;
      if (null === newProps) return null;
      rootContainerInstance = 0 !== (workInProgress.flags & 64);
      updatePayload = newProps.rendering;
      if (null === updatePayload)
        if (rootContainerInstance) cutOffTailIfNeeded(newProps, !1);
        else {
          if (
            0 !== workInProgressRootExitStatus ||
            (null !== current && 0 !== (current.flags & 64))
          )
            for (current = workInProgress.child; null !== current; ) {
              updatePayload = findFirstSuspended(current);
              if (null !== updatePayload) {
                workInProgress.flags |= 64;
                cutOffTailIfNeeded(newProps, !1);
                current = updatePayload.updateQueue;
                null !== current &&
                  ((workInProgress.updateQueue = current),
                  (workInProgress.flags |= 4));
                null === newProps.lastEffect &&
                  (workInProgress.firstEffect = null);
                workInProgress.lastEffect = newProps.lastEffect;
                current = renderLanes;
                for (newProps = workInProgress.child; null !== newProps; )
                  (rootContainerInstance = newProps),
                    (renderLanes = current),
                    (rootContainerInstance.flags &= 2),
                    (rootContainerInstance.nextEffect = null),
                    (rootContainerInstance.firstEffect = null),
                    (rootContainerInstance.lastEffect = null),
                    (updatePayload = rootContainerInstance.alternate),
                    null === updatePayload
                      ? ((rootContainerInstance.childLanes = 0),
                        (rootContainerInstance.lanes = renderLanes),
                        (rootContainerInstance.child = null),
                        (rootContainerInstance.memoizedProps = null),
                        (rootContainerInstance.memoizedState = null),
                        (rootContainerInstance.updateQueue = null),
                        (rootContainerInstance.dependencies = null),
                        (rootContainerInstance.stateNode = null))
                      : ((rootContainerInstance.childLanes =
                          updatePayload.childLanes),
                        (rootContainerInstance.lanes = updatePayload.lanes),
                        (rootContainerInstance.child = updatePayload.child),
                        (rootContainerInstance.memoizedProps =
                          updatePayload.memoizedProps),
                        (rootContainerInstance.memoizedState =
                          updatePayload.memoizedState),
                        (rootContainerInstance.updateQueue =
                          updatePayload.updateQueue),
                        (rootContainerInstance.type = updatePayload.type),
                        (renderLanes = updatePayload.dependencies),
                        (rootContainerInstance.dependencies =
                          null === renderLanes
                            ? null
                            : {
                                lanes: renderLanes.lanes,
                                firstContext: renderLanes.firstContext
                              })),
                    (newProps = newProps.sibling);
                push(
                  suspenseStackCursor,
                  (suspenseStackCursor.current & 1) | 2
                );
                return workInProgress.child;
              }
              current = current.sibling;
            }
          null !== newProps.tail &&
            now() > workInProgressRootRenderTargetTime &&
            ((workInProgress.flags |= 64),
            (rootContainerInstance = !0),
            cutOffTailIfNeeded(newProps, !1),
            (workInProgress.lanes = 33554432));
        }
      else {
        if (!rootContainerInstance)
          if (
            ((current = findFirstSuspended(updatePayload)), null !== current)
          ) {
            if (
              ((workInProgress.flags |= 64),
              (rootContainerInstance = !0),
              (current = current.updateQueue),
              null !== current &&
                ((workInProgress.updateQueue = current),
                (workInProgress.flags |= 4)),
              cutOffTailIfNeeded(newProps, !0),
              null === newProps.tail &&
                "hidden" === newProps.tailMode &&
                !updatePayload.alternate)
            )
              return (
                (workInProgress = workInProgress.lastEffect =
                  newProps.lastEffect),
                null !== workInProgress && (workInProgress.nextEffect = null),
                null
              );
          } else
            2 * now() - newProps.renderingStartTime >
              workInProgressRootRenderTargetTime &&
              1073741824 !== renderLanes &&
              ((workInProgress.flags |= 64),
              (rootContainerInstance = !0),
              cutOffTailIfNeeded(newProps, !1),
              (workInProgress.lanes = 33554432));
        newProps.isBackwards
          ? ((updatePayload.sibling = workInProgress.child),
            (workInProgress.child = updatePayload))
          : ((current = newProps.last),
            null !== current
              ? (current.sibling = updatePayload)
              : (workInProgress.child = updatePayload),
            (newProps.last = updatePayload));
      }
      return null !== newProps.tail
        ? ((current = newProps.tail),
          (newProps.rendering = current),
          (newProps.tail = current.sibling),
          (newProps.lastEffect = workInProgress.lastEffect),
          (newProps.renderingStartTime = now()),
          (current.sibling = null),
          (workInProgress = suspenseStackCursor.current),
          push(
            suspenseStackCursor,
            rootContainerInstance
              ? (workInProgress & 1) | 2
              : workInProgress & 1
          ),
          current)
        : null;
    case 22:
    case 23:
      return (
        popRenderLanes(),
        null !== current &&
          (null !== current.memoizedState) !==
            (null !== workInProgress.memoizedState) &&
          "unstable-defer-without-hiding" !== newProps.mode &&
          (workInProgress.flags |= 4),
        null
      );
  }
  throw Error(
    "Unknown unit of work tag (" +
      workInProgress.tag +
      "). This error is likely caused by a bug in React. Please file an issue."
  );
}
function unwindWork(workInProgress) {
  switch (workInProgress.tag) {
    case 1:
      isContextProvider(workInProgress.type) && popContext();
      var flags = workInProgress.flags;
      return flags & 8192
        ? ((workInProgress.flags = (flags & -8193) | 64), workInProgress)
        : null;
    case 3:
      popHostContainer();
      pop(didPerformWorkStackCursor);
      pop(contextStackCursor);
      resetWorkInProgressVersions();
      flags = workInProgress.flags;
      if (0 !== (flags & 64))
        throw Error(
          "The root failed to unmount after an error. This is likely a bug in React. Please file an issue."
        );
      workInProgress.flags = (flags & -8193) | 64;
      return workInProgress;
    case 5:
      return popHostContext(workInProgress), null;
    case 13:
      return (
        pop(suspenseStackCursor),
        (flags = workInProgress.flags),
        flags & 8192
          ? ((workInProgress.flags = (flags & -8193) | 64), workInProgress)
          : null
      );
    case 19:
      return pop(suspenseStackCursor), null;
    case 4:
      return popHostContainer(), null;
    case 10:
      return popProvider(workInProgress), null;
    case 22:
    case 23:
      return popRenderLanes(), null;
    default:
      return null;
  }
}
function createCapturedValue(value, source) {
  try {
    var info = "",
      node = source;
    do (info += describeFiber(node)), (node = node.return);
    while (node);
    var JSCompiler_inline_result = info;
  } catch (x) {
    JSCompiler_inline_result =
      "\nError generating stack: " + x.message + "\n" + x.stack;
  }
  return { value: value, source: source, stack: JSCompiler_inline_result };
}
if (
  "function" !==
  typeof ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog
)
  throw Error(
    "Expected ReactFiberErrorDialog.showErrorDialog to be a function."
  );
function logCapturedError(boundary, errorInfo) {
  try {
    !1 !==
      ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog({
        componentStack: null !== errorInfo.stack ? errorInfo.stack : "",
        error: errorInfo.value,
        errorBoundary:
          null !== boundary && 1 === boundary.tag ? boundary.stateNode : null
      }) && console.error(errorInfo.value);
  } catch (e) {
    setTimeout(function() {
      throw e;
    });
  }
}
var PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map;
function createRootErrorUpdate(fiber, errorInfo, lane) {
  lane = createUpdate(-1, lane);
  lane.tag = 3;
  lane.payload = { element: null };
  var error = errorInfo.value;
  lane.callback = function() {
    hasUncaughtError || ((hasUncaughtError = !0), (firstUncaughtError = error));
    logCapturedError(fiber, errorInfo);
  };
  return lane;
}
function createClassErrorUpdate(fiber, errorInfo, lane) {
  lane = createUpdate(-1, lane);
  lane.tag = 3;
  var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
  if ("function" === typeof getDerivedStateFromError) {
    var error = errorInfo.value;
    lane.payload = function() {
      logCapturedError(fiber, errorInfo);
      return getDerivedStateFromError(error);
    };
  }
  var inst = fiber.stateNode;
  null !== inst &&
    "function" === typeof inst.componentDidCatch &&
    (lane.callback = function() {
      "function" !== typeof getDerivedStateFromError &&
        (null === legacyErrorBoundariesThatAlreadyFailed
          ? (legacyErrorBoundariesThatAlreadyFailed = new Set([this]))
          : legacyErrorBoundariesThatAlreadyFailed.add(this),
        logCapturedError(fiber, errorInfo));
      var stack = errorInfo.stack;
      this.componentDidCatch(errorInfo.value, {
        componentStack: null !== stack ? stack : ""
      });
    });
  return lane;
}
var PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set;
function safelyDetachRef(current) {
  var ref = current.ref;
  if (null !== ref)
    if ("function" === typeof ref)
      try {
        ref(null);
      } catch (refError) {
        captureCommitPhaseError(current, refError);
      }
    else ref.current = null;
}
function commitBeforeMutationLifeCycles(current, finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      return;
    case 1:
      if (finishedWork.flags & 256 && null !== current) {
        var prevProps = current.memoizedProps,
          prevState = current.memoizedState;
        current = finishedWork.stateNode;
        finishedWork = current.getSnapshotBeforeUpdate(
          finishedWork.elementType === finishedWork.type
            ? prevProps
            : resolveDefaultProps(finishedWork.type, prevProps),
          prevState
        );
        current.__reactInternalSnapshotBeforeUpdate = finishedWork;
      }
      return;
    case 3:
      return;
    case 5:
    case 6:
    case 4:
    case 17:
      return;
  }
  throw Error(
    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
  );
}
function commitLifeCycles(finishedRoot, current, finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      current = finishedWork.updateQueue;
      current = null !== current ? current.lastEffect : null;
      if (null !== current) {
        finishedRoot = current = current.next;
        do {
          if (3 === (finishedRoot.tag & 3)) {
            var create$81 = finishedRoot.create;
            finishedRoot.destroy = create$81();
          }
          finishedRoot = finishedRoot.next;
        } while (finishedRoot !== current);
      }
      current = finishedWork.updateQueue;
      current = null !== current ? current.lastEffect : null;
      if (null !== current) {
        finishedRoot = current = current.next;
        do {
          var _effect = finishedRoot;
          create$81 = _effect.next;
          _effect = _effect.tag;
          0 !== (_effect & 4) &&
            0 !== (_effect & 1) &&
            (enqueuePendingPassiveHookEffectUnmount(finishedWork, finishedRoot),
            enqueuePendingPassiveHookEffectMount(finishedWork, finishedRoot));
          finishedRoot = create$81;
        } while (finishedRoot !== current);
      }
      return;
    case 1:
      finishedRoot = finishedWork.stateNode;
      finishedWork.flags & 4 &&
        (null === current
          ? finishedRoot.componentDidMount()
          : ((create$81 =
              finishedWork.elementType === finishedWork.type
                ? current.memoizedProps
                : resolveDefaultProps(
                    finishedWork.type,
                    current.memoizedProps
                  )),
            finishedRoot.componentDidUpdate(
              create$81,
              current.memoizedState,
              finishedRoot.__reactInternalSnapshotBeforeUpdate
            )));
      current = finishedWork.updateQueue;
      null !== current &&
        commitUpdateQueue(finishedWork, current, finishedRoot);
      return;
    case 3:
      current = finishedWork.updateQueue;
      if (null !== current) {
        finishedRoot = null;
        if (null !== finishedWork.child)
          switch (finishedWork.child.tag) {
            case 5:
              finishedRoot = finishedWork.child.stateNode.canonical;
              break;
            case 1:
              finishedRoot = finishedWork.child.stateNode;
          }
        commitUpdateQueue(finishedWork, current, finishedRoot);
      }
      return;
    case 5:
      null === current && finishedWork.flags & 4 && shim();
      return;
    case 6:
      return;
    case 4:
      return;
    case 12:
      return;
    case 13:
      return;
    case 19:
    case 17:
    case 20:
    case 21:
    case 22:
    case 23:
      return;
  }
  throw Error(
    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
  );
}
function detachFiberMutation(fiber) {
  fiber.alternate = null;
  fiber.child = null;
  fiber.dependencies = null;
  fiber.firstEffect = null;
  fiber.lastEffect = null;
  fiber.memoizedProps = null;
  fiber.memoizedState = null;
  fiber.pendingProps = null;
  fiber.return = null;
  fiber.updateQueue = null;
}
function commitWork(current, finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      current = finishedWork.updateQueue;
      current = null !== current ? current.lastEffect : null;
      if (null !== current) {
        finishedWork = current = current.next;
        do {
          if (3 === (finishedWork.tag & 3)) {
            var destroy = finishedWork.destroy;
            finishedWork.destroy = void 0;
            void 0 !== destroy && destroy();
          }
          finishedWork = finishedWork.next;
        } while (finishedWork !== current);
      }
      return;
    case 12:
      return;
    case 13:
      null !== finishedWork.memoizedState &&
        (globalMostRecentFallbackTime = now());
      attachSuspenseRetryListeners(finishedWork);
      return;
    case 19:
      attachSuspenseRetryListeners(finishedWork);
      return;
    case 22:
    case 23:
      return;
  }
  a: {
    switch (finishedWork.tag) {
      case 1:
      case 5:
      case 6:
      case 20:
        break a;
      case 3:
      case 4:
        break a;
    }
    throw Error(
      "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
    );
  }
}
function attachSuspenseRetryListeners(finishedWork) {
  var wakeables = finishedWork.updateQueue;
  if (null !== wakeables) {
    finishedWork.updateQueue = null;
    var retryCache = finishedWork.stateNode;
    null === retryCache &&
      (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
    wakeables.forEach(function(wakeable) {
      var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
      retryCache.has(wakeable) ||
        (retryCache.add(wakeable), wakeable.then(retry, retry));
    });
  }
}
function isSuspenseBoundaryBeingHidden(current, finishedWork) {
  return null !== current &&
    ((current = current.memoizedState),
    null === current || null !== current.dehydrated)
    ? ((finishedWork = finishedWork.memoizedState),
      null !== finishedWork && null === finishedWork.dehydrated)
    : !1;
}
var ceil = Math.ceil,
  ReactCurrentDispatcher$2 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner,
  executionContext = 0,
  workInProgressRoot = null,
  workInProgress = null,
  workInProgressRootRenderLanes = 0,
  subtreeRenderLanes = 0,
  subtreeRenderLanesCursor = createCursor(0),
  workInProgressRootExitStatus = 0,
  workInProgressRootFatalError = null,
  workInProgressRootIncludedLanes = 0,
  workInProgressRootSkippedLanes = 0,
  workInProgressRootUpdatedLanes = 0,
  workInProgressRootPingedLanes = 0,
  mostRecentlyUpdatedRoot = null,
  globalMostRecentFallbackTime = 0,
  workInProgressRootRenderTargetTime = Infinity,
  nextEffect = null,
  hasUncaughtError = !1,
  firstUncaughtError = null,
  legacyErrorBoundariesThatAlreadyFailed = null,
  rootDoesHavePassiveEffects = !1,
  rootWithPendingPassiveEffects = null,
  pendingPassiveEffectsRenderPriority = 90,
  pendingPassiveHookEffectsMount = [],
  pendingPassiveHookEffectsUnmount = [],
  rootsWithPendingDiscreteUpdates = null,
  nestedUpdateCount = 0,
  rootWithNestedUpdates = null,
  currentEventTime = -1,
  currentEventWipLanes = 0,
  currentEventPendingLanes = 0,
  focusedInstanceHandle = null,
  shouldFireAfterActiveInstanceBlur = !1;
function requestEventTime() {
  return 0 !== (executionContext & 48)
    ? now()
    : -1 !== currentEventTime
    ? currentEventTime
    : (currentEventTime = now());
}
function requestUpdateLane(fiber) {
  fiber = fiber.mode;
  if (0 === (fiber & 2)) return 1;
  if (0 === (fiber & 4)) return 99 === getCurrentPriorityLevel() ? 1 : 2;
  0 === currentEventWipLanes &&
    (currentEventWipLanes = workInProgressRootIncludedLanes);
  if (0 !== ReactCurrentBatchConfig.transition) {
    0 !== currentEventPendingLanes &&
      (currentEventPendingLanes =
        null !== mostRecentlyUpdatedRoot
          ? mostRecentlyUpdatedRoot.pendingLanes
          : 0);
    fiber = currentEventWipLanes;
    var lane = 4186112 & ~currentEventPendingLanes;
    lane &= -lane;
    0 === lane &&
      ((fiber = 4186112 & ~fiber),
      (lane = fiber & -fiber),
      0 === lane && (lane = 8192));
    return lane;
  }
  fiber = getCurrentPriorityLevel();
  0 !== (executionContext & 4) && 98 === fiber
    ? (fiber = findUpdateLane(12, currentEventWipLanes))
    : ((fiber = schedulerPriorityToLanePriority(fiber)),
      (fiber = findUpdateLane(fiber, currentEventWipLanes)));
  return fiber;
}
function scheduleUpdateOnFiber(fiber, lane, eventTime) {
  if (50 < nestedUpdateCount)
    throw ((nestedUpdateCount = 0),
    (rootWithNestedUpdates = null),
    Error(
      "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
    ));
  fiber = markUpdateLaneFromFiberToRoot(fiber, lane);
  if (null === fiber) return null;
  markRootUpdated(fiber, lane, eventTime);
  fiber === workInProgressRoot &&
    ((workInProgressRootUpdatedLanes |= lane),
    4 === workInProgressRootExitStatus &&
      markRootSuspended$1(fiber, workInProgressRootRenderLanes));
  var priorityLevel = getCurrentPriorityLevel();
  1 === lane
    ? 0 !== (executionContext & 8) && 0 === (executionContext & 48)
      ? performSyncWorkOnRoot(fiber)
      : (ensureRootIsScheduled(fiber, eventTime),
        0 === executionContext &&
          ((workInProgressRootRenderTargetTime = now() + 500),
          flushSyncCallbackQueue()))
    : (0 === (executionContext & 4) ||
        (98 !== priorityLevel && 99 !== priorityLevel) ||
        (null === rootsWithPendingDiscreteUpdates
          ? (rootsWithPendingDiscreteUpdates = new Set([fiber]))
          : rootsWithPendingDiscreteUpdates.add(fiber)),
      ensureRootIsScheduled(fiber, eventTime));
  mostRecentlyUpdatedRoot = fiber;
}
function markUpdateLaneFromFiberToRoot(sourceFiber, lane) {
  sourceFiber.lanes |= lane;
  var alternate = sourceFiber.alternate;
  null !== alternate && (alternate.lanes |= lane);
  alternate = sourceFiber;
  for (sourceFiber = sourceFiber.return; null !== sourceFiber; )
    (sourceFiber.childLanes |= lane),
      (alternate = sourceFiber.alternate),
      null !== alternate && (alternate.childLanes |= lane),
      (alternate = sourceFiber),
      (sourceFiber = sourceFiber.return);
  return 3 === alternate.tag ? alternate.stateNode : null;
}
function ensureRootIsScheduled(root, currentTime) {
  for (
    var existingCallbackNode = root.callbackNode,
      suspendedLanes = root.suspendedLanes,
      pingedLanes = root.pingedLanes,
      expirationTimes = root.expirationTimes,
      lanes = root.pendingLanes;
    0 < lanes;

  ) {
    var index$5 = 31 - clz32(lanes),
      lane = 1 << index$5,
      expirationTime = expirationTimes[index$5];
    if (-1 === expirationTime) {
      if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes)) {
        expirationTime = currentTime;
        getHighestPriorityLanes(lane);
        var priority = return_highestLanePriority;
        expirationTimes[index$5] =
          10 <= priority
            ? expirationTime + 250
            : 6 <= priority
            ? expirationTime + 5e3
            : -1;
      }
    } else expirationTime <= currentTime && (root.expiredLanes |= lane);
    lanes &= ~lane;
  }
  suspendedLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : 0
  );
  currentTime = return_highestLanePriority;
  if (0 === suspendedLanes)
    null !== existingCallbackNode &&
      (existingCallbackNode !== fakeCallbackNode &&
        Scheduler_cancelCallback(existingCallbackNode),
      (root.callbackNode = null),
      (root.callbackPriority = 0));
  else {
    if (null !== existingCallbackNode) {
      if (root.callbackPriority === currentTime) return;
      existingCallbackNode !== fakeCallbackNode &&
        Scheduler_cancelCallback(existingCallbackNode);
    }
    15 === currentTime
      ? ((existingCallbackNode = performSyncWorkOnRoot.bind(null, root)),
        null === syncQueue
          ? ((syncQueue = [existingCallbackNode]),
            (immediateQueueCallbackNode = Scheduler_scheduleCallback(
              Scheduler_ImmediatePriority,
              flushSyncCallbackQueueImpl
            )))
          : syncQueue.push(existingCallbackNode),
        (existingCallbackNode = fakeCallbackNode))
      : 14 === currentTime
      ? (existingCallbackNode = scheduleCallback(
          99,
          performSyncWorkOnRoot.bind(null, root)
        ))
      : ((existingCallbackNode = lanePriorityToSchedulerPriority(currentTime)),
        (existingCallbackNode = scheduleCallback(
          existingCallbackNode,
          performConcurrentWorkOnRoot.bind(null, root)
        )));
    root.callbackPriority = currentTime;
    root.callbackNode = existingCallbackNode;
  }
}
function performConcurrentWorkOnRoot(root) {
  currentEventTime = -1;
  currentEventPendingLanes = currentEventWipLanes = 0;
  if (0 !== (executionContext & 48))
    throw Error("Should not already be working.");
  var originalCallbackNode = root.callbackNode;
  if (flushPassiveEffects() && root.callbackNode !== originalCallbackNode)
    return null;
  var lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : 0
  );
  if (0 === lanes) return null;
  var exitStatus = lanes;
  var prevExecutionContext = executionContext;
  executionContext |= 16;
  var prevDispatcher = pushDispatcher();
  if (
    workInProgressRoot !== root ||
    workInProgressRootRenderLanes !== exitStatus
  )
    (workInProgressRootRenderTargetTime = now() + 500),
      prepareFreshStack(root, exitStatus);
  do
    try {
      workLoopConcurrent();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  while (1);
  resetContextDependencies();
  ReactCurrentDispatcher$2.current = prevDispatcher;
  executionContext = prevExecutionContext;
  null !== workInProgress
    ? (exitStatus = 0)
    : ((workInProgressRoot = null),
      (workInProgressRootRenderLanes = 0),
      (exitStatus = workInProgressRootExitStatus));
  if (0 !== (workInProgressRootIncludedLanes & workInProgressRootUpdatedLanes))
    prepareFreshStack(root, 0);
  else if (0 !== exitStatus) {
    2 === exitStatus &&
      ((executionContext |= 64),
      root.hydrate && ((root.hydrate = !1), shim(root.containerInfo)),
      (lanes = getLanesToRetrySynchronouslyOnError(root)),
      0 !== lanes && (exitStatus = renderRootSync(root, lanes)));
    if (1 === exitStatus)
      throw ((originalCallbackNode = workInProgressRootFatalError),
      prepareFreshStack(root, 0),
      markRootSuspended$1(root, lanes),
      ensureRootIsScheduled(root, now()),
      originalCallbackNode);
    root.finishedWork = root.current.alternate;
    root.finishedLanes = lanes;
    switch (exitStatus) {
      case 0:
      case 1:
        throw Error("Root did not complete. This is a bug in React.");
      case 2:
        commitRoot(root);
        break;
      case 3:
        markRootSuspended$1(root, lanes);
        if (
          (lanes & 62914560) === lanes &&
          ((exitStatus = globalMostRecentFallbackTime + 500 - now()),
          10 < exitStatus)
        ) {
          if (0 !== getNextLanes(root, 0)) break;
          prevExecutionContext = root.suspendedLanes;
          if ((prevExecutionContext & lanes) !== lanes) {
            requestEventTime();
            root.pingedLanes |= root.suspendedLanes & prevExecutionContext;
            break;
          }
          root.timeoutHandle = scheduleTimeout(
            commitRoot.bind(null, root),
            exitStatus
          );
          break;
        }
        commitRoot(root);
        break;
      case 4:
        markRootSuspended$1(root, lanes);
        if ((lanes & 4186112) === lanes) break;
        exitStatus = root.eventTimes;
        for (prevExecutionContext = -1; 0 < lanes; ) {
          var index$4 = 31 - clz32(lanes);
          prevDispatcher = 1 << index$4;
          index$4 = exitStatus[index$4];
          index$4 > prevExecutionContext && (prevExecutionContext = index$4);
          lanes &= ~prevDispatcher;
        }
        lanes = prevExecutionContext;
        lanes = now() - lanes;
        lanes =
          (120 > lanes
            ? 120
            : 480 > lanes
            ? 480
            : 1080 > lanes
            ? 1080
            : 1920 > lanes
            ? 1920
            : 3e3 > lanes
            ? 3e3
            : 4320 > lanes
            ? 4320
            : 1960 * ceil(lanes / 1960)) - lanes;
        if (10 < lanes) {
          root.timeoutHandle = scheduleTimeout(
            commitRoot.bind(null, root),
            lanes
          );
          break;
        }
        commitRoot(root);
        break;
      case 5:
        commitRoot(root);
        break;
      default:
        throw Error("Unknown root exit status.");
    }
  }
  ensureRootIsScheduled(root, now());
  return root.callbackNode === originalCallbackNode
    ? performConcurrentWorkOnRoot.bind(null, root)
    : null;
}
function markRootSuspended$1(root, suspendedLanes) {
  suspendedLanes &= ~workInProgressRootPingedLanes;
  suspendedLanes &= ~workInProgressRootUpdatedLanes;
  root.suspendedLanes |= suspendedLanes;
  root.pingedLanes &= ~suspendedLanes;
  for (root = root.expirationTimes; 0 < suspendedLanes; ) {
    var index$9 = 31 - clz32(suspendedLanes),
      lane = 1 << index$9;
    root[index$9] = -1;
    suspendedLanes &= ~lane;
  }
}
function performSyncWorkOnRoot(root) {
  if (0 !== (executionContext & 48))
    throw Error("Should not already be working.");
  flushPassiveEffects();
  if (
    root === workInProgressRoot &&
    0 !== (root.expiredLanes & workInProgressRootRenderLanes)
  ) {
    var lanes = workInProgressRootRenderLanes;
    var exitStatus = renderRootSync(root, lanes);
    0 !== (workInProgressRootIncludedLanes & workInProgressRootUpdatedLanes) &&
      ((lanes = getNextLanes(root, lanes)),
      (exitStatus = renderRootSync(root, lanes)));
  } else
    (lanes = getNextLanes(root, 0)), (exitStatus = renderRootSync(root, lanes));
  0 !== root.tag &&
    2 === exitStatus &&
    ((executionContext |= 64),
    root.hydrate && ((root.hydrate = !1), shim(root.containerInfo)),
    (lanes = getLanesToRetrySynchronouslyOnError(root)),
    0 !== lanes && (exitStatus = renderRootSync(root, lanes)));
  if (1 === exitStatus)
    throw ((exitStatus = workInProgressRootFatalError),
    prepareFreshStack(root, 0),
    markRootSuspended$1(root, lanes),
    ensureRootIsScheduled(root, now()),
    exitStatus);
  root.finishedWork = root.current.alternate;
  root.finishedLanes = lanes;
  commitRoot(root);
  ensureRootIsScheduled(root, now());
  return null;
}
function pushRenderLanes(fiber, lanes) {
  push(subtreeRenderLanesCursor, subtreeRenderLanes);
  subtreeRenderLanes |= lanes;
  workInProgressRootIncludedLanes |= lanes;
}
function popRenderLanes() {
  subtreeRenderLanes = subtreeRenderLanesCursor.current;
  pop(subtreeRenderLanesCursor);
}
function prepareFreshStack(root, lanes) {
  root.finishedWork = null;
  root.finishedLanes = 0;
  var timeoutHandle = root.timeoutHandle;
  -1 !== timeoutHandle &&
    ((root.timeoutHandle = -1), cancelTimeout(timeoutHandle));
  if (null !== workInProgress)
    for (timeoutHandle = workInProgress.return; null !== timeoutHandle; ) {
      var interruptedWork = timeoutHandle;
      switch (interruptedWork.tag) {
        case 1:
          interruptedWork = interruptedWork.type.childContextTypes;
          null !== interruptedWork &&
            void 0 !== interruptedWork &&
            popContext();
          break;
        case 3:
          popHostContainer();
          pop(didPerformWorkStackCursor);
          pop(contextStackCursor);
          resetWorkInProgressVersions();
          break;
        case 5:
          popHostContext(interruptedWork);
          break;
        case 4:
          popHostContainer();
          break;
        case 13:
          pop(suspenseStackCursor);
          break;
        case 19:
          pop(suspenseStackCursor);
          break;
        case 10:
          popProvider(interruptedWork);
          break;
        case 22:
        case 23:
          popRenderLanes();
      }
      timeoutHandle = timeoutHandle.return;
    }
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = subtreeRenderLanes = workInProgressRootIncludedLanes = lanes;
  workInProgressRootExitStatus = 0;
  workInProgressRootFatalError = null;
  workInProgressRootPingedLanes = workInProgressRootUpdatedLanes = workInProgressRootSkippedLanes = 0;
}
function handleError(root$jscomp$0, thrownValue) {
  do {
    var erroredWork = workInProgress;
    try {
      resetContextDependencies();
      ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
      if (didScheduleRenderPhaseUpdate) {
        for (
          var hook = currentlyRenderingFiber$1.memoizedState;
          null !== hook;

        ) {
          var queue = hook.queue;
          null !== queue && (queue.pending = null);
          hook = hook.next;
        }
        didScheduleRenderPhaseUpdate = !1;
      }
      renderLanes = 0;
      workInProgressHook = currentHook = currentlyRenderingFiber$1 = null;
      didScheduleRenderPhaseUpdateDuringThisPass = !1;
      ReactCurrentOwner$2.current = null;
      if (null === erroredWork || null === erroredWork.return) {
        workInProgressRootExitStatus = 1;
        workInProgressRootFatalError = thrownValue;
        workInProgress = null;
        break;
      }
      a: {
        var root = root$jscomp$0,
          returnFiber = erroredWork.return,
          sourceFiber = erroredWork,
          value = thrownValue;
        thrownValue = workInProgressRootRenderLanes;
        sourceFiber.flags |= 4096;
        sourceFiber.firstEffect = sourceFiber.lastEffect = null;
        if (
          null !== value &&
          "object" === typeof value &&
          "function" === typeof value.then
        ) {
          var wakeable = value;
          if (0 === (sourceFiber.mode & 2)) {
            var currentSource = sourceFiber.alternate;
            currentSource
              ? ((sourceFiber.updateQueue = currentSource.updateQueue),
                (sourceFiber.memoizedState = currentSource.memoizedState),
                (sourceFiber.lanes = currentSource.lanes))
              : ((sourceFiber.updateQueue = null),
                (sourceFiber.memoizedState = null));
          }
          var hasInvisibleParentBoundary =
              0 !== (suspenseStackCursor.current & 1),
            workInProgress$76 = returnFiber;
          do {
            var JSCompiler_temp;
            if ((JSCompiler_temp = 13 === workInProgress$76.tag)) {
              var nextState = workInProgress$76.memoizedState;
              if (null !== nextState)
                JSCompiler_temp = null !== nextState.dehydrated ? !0 : !1;
              else {
                var props = workInProgress$76.memoizedProps;
                JSCompiler_temp =
                  void 0 === props.fallback
                    ? !1
                    : !0 !== props.unstable_avoidThisFallback
                    ? !0
                    : hasInvisibleParentBoundary
                    ? !1
                    : !0;
              }
            }
            if (JSCompiler_temp) {
              var wakeables = workInProgress$76.updateQueue;
              if (null === wakeables) {
                var updateQueue = new Set();
                updateQueue.add(wakeable);
                workInProgress$76.updateQueue = updateQueue;
              } else wakeables.add(wakeable);
              if (0 === (workInProgress$76.mode & 2)) {
                workInProgress$76.flags |= 64;
                sourceFiber.flags |= 32768;
                sourceFiber.flags &= -5029;
                if (1 === sourceFiber.tag)
                  if (null === sourceFiber.alternate) sourceFiber.tag = 17;
                  else {
                    var update = createUpdate(-1, 1);
                    update.tag = 2;
                    enqueueUpdate(sourceFiber, update);
                  }
                sourceFiber.lanes |= 1;
                break a;
              }
              value = void 0;
              sourceFiber = thrownValue;
              var pingCache = root.pingCache;
              null === pingCache
                ? ((pingCache = root.pingCache = new PossiblyWeakMap()),
                  (value = new Set()),
                  pingCache.set(wakeable, value))
                : ((value = pingCache.get(wakeable)),
                  void 0 === value &&
                    ((value = new Set()), pingCache.set(wakeable, value)));
              if (!value.has(sourceFiber)) {
                value.add(sourceFiber);
                var ping = pingSuspendedRoot.bind(
                  null,
                  root,
                  wakeable,
                  sourceFiber
                );
                wakeable.then(ping, ping);
              }
              workInProgress$76.flags |= 8192;
              workInProgress$76.lanes = thrownValue;
              break a;
            }
            workInProgress$76 = workInProgress$76.return;
          } while (null !== workInProgress$76);
          value = Error(
            (getComponentName(sourceFiber.type) || "A React component") +
              " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display."
          );
        }
        5 !== workInProgressRootExitStatus &&
          (workInProgressRootExitStatus = 2);
        value = createCapturedValue(value, sourceFiber);
        workInProgress$76 = returnFiber;
        do {
          switch (workInProgress$76.tag) {
            case 3:
              root = value;
              workInProgress$76.flags |= 8192;
              thrownValue &= -thrownValue;
              workInProgress$76.lanes |= thrownValue;
              var update$77 = createRootErrorUpdate(
                workInProgress$76,
                root,
                thrownValue
              );
              enqueueCapturedUpdate(workInProgress$76, update$77);
              break a;
            case 1:
              root = value;
              var ctor = workInProgress$76.type,
                instance = workInProgress$76.stateNode;
              if (
                0 === (workInProgress$76.flags & 64) &&
                ("function" === typeof ctor.getDerivedStateFromError ||
                  (null !== instance &&
                    "function" === typeof instance.componentDidCatch &&
                    (null === legacyErrorBoundariesThatAlreadyFailed ||
                      !legacyErrorBoundariesThatAlreadyFailed.has(instance))))
              ) {
                workInProgress$76.flags |= 8192;
                thrownValue &= -thrownValue;
                workInProgress$76.lanes |= thrownValue;
                var update$80 = createClassErrorUpdate(
                  workInProgress$76,
                  root,
                  thrownValue
                );
                enqueueCapturedUpdate(workInProgress$76, update$80);
                break a;
              }
          }
          workInProgress$76 = workInProgress$76.return;
        } while (null !== workInProgress$76);
      }
      completeUnitOfWork(erroredWork);
    } catch (yetAnotherThrownValue) {
      thrownValue = yetAnotherThrownValue;
      workInProgress === erroredWork &&
        null !== erroredWork &&
        (workInProgress = erroredWork = erroredWork.return);
      continue;
    }
    break;
  } while (1);
}
function pushDispatcher() {
  var prevDispatcher = ReactCurrentDispatcher$2.current;
  ReactCurrentDispatcher$2.current = ContextOnlyDispatcher;
  return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
}
function renderRootSync(root, lanes) {
  var prevExecutionContext = executionContext;
  executionContext |= 16;
  var prevDispatcher = pushDispatcher();
  (workInProgressRoot === root && workInProgressRootRenderLanes === lanes) ||
    prepareFreshStack(root, lanes);
  do
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  while (1);
  resetContextDependencies();
  executionContext = prevExecutionContext;
  ReactCurrentDispatcher$2.current = prevDispatcher;
  if (null !== workInProgress)
    throw Error(
      "Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue."
    );
  workInProgressRoot = null;
  workInProgressRootRenderLanes = 0;
  return workInProgressRootExitStatus;
}
function workLoopSync() {
  for (; null !== workInProgress; ) performUnitOfWork(workInProgress);
}
function workLoopConcurrent() {
  for (; null !== workInProgress && !Scheduler_shouldYield(); )
    performUnitOfWork(workInProgress);
}
function performUnitOfWork(unitOfWork) {
  var next = beginWork$1(unitOfWork.alternate, unitOfWork, subtreeRenderLanes);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === next ? completeUnitOfWork(unitOfWork) : (workInProgress = next);
  ReactCurrentOwner$2.current = null;
}
function completeUnitOfWork(unitOfWork) {
  var completedWork = unitOfWork;
  do {
    var current = completedWork.alternate;
    unitOfWork = completedWork.return;
    if (0 === (completedWork.flags & 4096)) {
      current = completeWork(current, completedWork, subtreeRenderLanes);
      if (null !== current) {
        workInProgress = current;
        return;
      }
      current = completedWork;
      if (
        (23 !== current.tag && 22 !== current.tag) ||
        null === current.memoizedState ||
        0 !== (subtreeRenderLanes & 1073741824) ||
        0 === (current.mode & 4)
      ) {
        for (var newChildLanes = 0, child = current.child; null !== child; )
          (newChildLanes |= child.lanes | child.childLanes),
            (child = child.sibling);
        current.childLanes = newChildLanes;
      }
      null !== unitOfWork &&
        0 === (unitOfWork.flags & 4096) &&
        (null === unitOfWork.firstEffect &&
          (unitOfWork.firstEffect = completedWork.firstEffect),
        null !== completedWork.lastEffect &&
          (null !== unitOfWork.lastEffect &&
            (unitOfWork.lastEffect.nextEffect = completedWork.firstEffect),
          (unitOfWork.lastEffect = completedWork.lastEffect)),
        1 < completedWork.flags &&
          (null !== unitOfWork.lastEffect
            ? (unitOfWork.lastEffect.nextEffect = completedWork)
            : (unitOfWork.firstEffect = completedWork),
          (unitOfWork.lastEffect = completedWork)));
    } else {
      current = unwindWork(completedWork);
      if (null !== current) {
        current.flags &= 4095;
        workInProgress = current;
        return;
      }
      null !== unitOfWork &&
        ((unitOfWork.firstEffect = unitOfWork.lastEffect = null),
        (unitOfWork.flags |= 4096));
    }
    completedWork = completedWork.sibling;
    if (null !== completedWork) {
      workInProgress = completedWork;
      return;
    }
    workInProgress = completedWork = unitOfWork;
  } while (null !== completedWork);
  0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 5);
}
function commitRoot(root) {
  var renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(99, commitRootImpl.bind(null, root, renderPriorityLevel));
  return null;
}
function commitRootImpl(root, renderPriorityLevel) {
  do flushPassiveEffects();
  while (null !== rootWithPendingPassiveEffects);
  if (0 !== (executionContext & 48))
    throw Error("Should not already be working.");
  var finishedWork = root.finishedWork;
  if (null === finishedWork) return null;
  root.finishedWork = null;
  root.finishedLanes = 0;
  if (finishedWork === root.current)
    throw Error(
      "Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue."
    );
  root.callbackNode = null;
  var remainingLanes = finishedWork.lanes | finishedWork.childLanes,
    remainingLanes$jscomp$0 = remainingLanes,
    noLongerPendingLanes = root.pendingLanes & ~remainingLanes$jscomp$0;
  root.pendingLanes = remainingLanes$jscomp$0;
  root.suspendedLanes = 0;
  root.pingedLanes = 0;
  root.expiredLanes &= remainingLanes$jscomp$0;
  root.mutableReadLanes &= remainingLanes$jscomp$0;
  root.entangledLanes &= remainingLanes$jscomp$0;
  remainingLanes$jscomp$0 = root.entanglements;
  for (
    var eventTimes = root.eventTimes, expirationTimes = root.expirationTimes;
    0 < noLongerPendingLanes;

  ) {
    var index$10 = 31 - clz32(noLongerPendingLanes),
      lane = 1 << index$10;
    remainingLanes$jscomp$0[index$10] = 0;
    eventTimes[index$10] = -1;
    expirationTimes[index$10] = -1;
    noLongerPendingLanes &= ~lane;
  }
  null !== rootsWithPendingDiscreteUpdates &&
    0 === (remainingLanes & 24) &&
    rootsWithPendingDiscreteUpdates.has(root) &&
    rootsWithPendingDiscreteUpdates.delete(root);
  root === workInProgressRoot &&
    ((workInProgress = workInProgressRoot = null),
    (workInProgressRootRenderLanes = 0));
  1 < finishedWork.flags
    ? null !== finishedWork.lastEffect
      ? ((finishedWork.lastEffect.nextEffect = finishedWork),
        (remainingLanes = finishedWork.firstEffect))
      : (remainingLanes = finishedWork)
    : (remainingLanes = finishedWork.firstEffect);
  if (null !== remainingLanes) {
    remainingLanes$jscomp$0 = executionContext;
    executionContext |= 32;
    focusedInstanceHandle = ReactCurrentOwner$2.current = null;
    shouldFireAfterActiveInstanceBlur = !1;
    nextEffect = remainingLanes;
    do
      try {
        commitBeforeMutationEffects();
      } catch (error) {
        if (null === nextEffect) throw Error("Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    focusedInstanceHandle = null;
    nextEffect = remainingLanes;
    do
      try {
        for (; null !== nextEffect; ) {
          var flags = nextEffect.flags;
          if (flags & 128) {
            var current = nextEffect.alternate;
            if (null !== current) {
              var currentRef = current.ref;
              null !== currentRef &&
                ("function" === typeof currentRef
                  ? currentRef(null)
                  : (currentRef.current = null));
            }
          }
          switch (flags & 1038) {
            case 2:
              nextEffect.flags &= -3;
              break;
            case 6:
              nextEffect.flags &= -3;
              commitWork(nextEffect.alternate, nextEffect);
              break;
            case 1024:
              nextEffect.flags &= -1025;
              break;
            case 1028:
              nextEffect.flags &= -1025;
              commitWork(nextEffect.alternate, nextEffect);
              break;
            case 4:
              commitWork(nextEffect.alternate, nextEffect);
              break;
            case 8:
              eventTimes = nextEffect;
              a: for (noLongerPendingLanes = expirationTimes = eventTimes; ; ) {
                index$10 = noLongerPendingLanes;
                if (
                  injectedHook &&
                  "function" === typeof injectedHook.onCommitFiberUnmount
                )
                  try {
                    injectedHook.onCommitFiberUnmount(rendererID, index$10);
                  } catch (err) {}
                switch (index$10.tag) {
                  case 0:
                  case 11:
                  case 14:
                  case 15:
                    var updateQueue = index$10.updateQueue;
                    if (null !== updateQueue) {
                      var lastEffect = updateQueue.lastEffect;
                      if (null !== lastEffect) {
                        var firstEffect = lastEffect.next;
                        lane = firstEffect;
                        do {
                          var _effect2 = lane,
                            destroy = _effect2.destroy,
                            tag = _effect2.tag;
                          if (void 0 !== destroy)
                            if (0 !== (tag & 4))
                              enqueuePendingPassiveHookEffectUnmount(
                                index$10,
                                lane
                              );
                            else {
                              _effect2 = index$10;
                              try {
                                destroy();
                              } catch (error) {
                                captureCommitPhaseError(_effect2, error);
                              }
                            }
                          lane = lane.next;
                        } while (lane !== firstEffect);
                      }
                    }
                    break;
                  case 1:
                    safelyDetachRef(index$10);
                    var instance = index$10.stateNode;
                    if ("function" === typeof instance.componentWillUnmount)
                      try {
                        (lane = index$10),
                          (_effect2 = instance),
                          (_effect2.props = lane.memoizedProps),
                          (_effect2.state = lane.memoizedState),
                          _effect2.componentWillUnmount();
                      } catch (unmountError) {
                        captureCommitPhaseError(index$10, unmountError);
                      }
                    break;
                  case 5:
                    safelyDetachRef(index$10);
                    break;
                  case 4:
                    createChildNodeSet(index$10.stateNode.containerInfo);
                }
                if (null !== noLongerPendingLanes.child)
                  (noLongerPendingLanes.child.return = noLongerPendingLanes),
                    (noLongerPendingLanes = noLongerPendingLanes.child);
                else {
                  if (noLongerPendingLanes === expirationTimes) break;
                  for (; null === noLongerPendingLanes.sibling; ) {
                    if (
                      null === noLongerPendingLanes.return ||
                      noLongerPendingLanes.return === expirationTimes
                    )
                      break a;
                    noLongerPendingLanes = noLongerPendingLanes.return;
                  }
                  noLongerPendingLanes.sibling.return =
                    noLongerPendingLanes.return;
                  noLongerPendingLanes = noLongerPendingLanes.sibling;
                }
              }
              var alternate = eventTimes.alternate;
              detachFiberMutation(eventTimes);
              null !== alternate && detachFiberMutation(alternate);
          }
          nextEffect = nextEffect.nextEffect;
        }
      } catch (error$87) {
        if (null === nextEffect) throw Error("Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error$87);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    root.current = finishedWork;
    nextEffect = remainingLanes;
    do
      try {
        for (flags = root; null !== nextEffect; ) {
          var flags$jscomp$0 = nextEffect.flags;
          flags$jscomp$0 & 36 &&
            commitLifeCycles(flags, nextEffect.alternate, nextEffect);
          if (flags$jscomp$0 & 128) {
            current = void 0;
            var ref = nextEffect.ref;
            if (null !== ref) {
              var instance$jscomp$0 = nextEffect.stateNode;
              switch (nextEffect.tag) {
                case 5:
                  current = instance$jscomp$0.canonical;
                  break;
                default:
                  current = instance$jscomp$0;
              }
              "function" === typeof ref
                ? ref(current)
                : (ref.current = current);
            }
          }
          nextEffect = nextEffect.nextEffect;
        }
      } catch (error$88) {
        if (null === nextEffect) throw Error("Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error$88);
        nextEffect = nextEffect.nextEffect;
      }
    while (null !== nextEffect);
    nextEffect = null;
    requestPaint();
    executionContext = remainingLanes$jscomp$0;
  } else root.current = finishedWork;
  if (rootDoesHavePassiveEffects)
    (rootDoesHavePassiveEffects = !1),
      (rootWithPendingPassiveEffects = root),
      (pendingPassiveEffectsRenderPriority = renderPriorityLevel);
  else
    for (nextEffect = remainingLanes; null !== nextEffect; )
      (renderPriorityLevel = nextEffect.nextEffect),
        (nextEffect.nextEffect = null),
        nextEffect.flags & 8 &&
          ((flags$jscomp$0 = nextEffect),
          (flags$jscomp$0.sibling = null),
          (flags$jscomp$0.stateNode = null)),
        (nextEffect = renderPriorityLevel);
  remainingLanes = root.pendingLanes;
  0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
  1 === remainingLanes
    ? root === rootWithNestedUpdates
      ? nestedUpdateCount++
      : ((nestedUpdateCount = 0), (rootWithNestedUpdates = root))
    : (nestedUpdateCount = 0);
  finishedWork = finishedWork.stateNode;
  if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
    try {
      injectedHook.onCommitFiberRoot(
        rendererID,
        finishedWork,
        void 0,
        64 === (finishedWork.current.flags & 64)
      );
    } catch (err) {}
  ensureRootIsScheduled(root, now());
  if (hasUncaughtError)
    throw ((hasUncaughtError = !1),
    (root = firstUncaughtError),
    (firstUncaughtError = null),
    root);
  if (0 !== (executionContext & 8)) return null;
  flushSyncCallbackQueue();
  return null;
}
function commitBeforeMutationEffects() {
  for (; null !== nextEffect; ) {
    var current = nextEffect.alternate;
    shouldFireAfterActiveInstanceBlur ||
      null === focusedInstanceHandle ||
      (0 !== (nextEffect.flags & 8)
        ? doesFiberContain(nextEffect, focusedInstanceHandle) &&
          (shouldFireAfterActiveInstanceBlur = !0)
        : 13 === nextEffect.tag &&
          isSuspenseBoundaryBeingHidden(current, nextEffect) &&
          doesFiberContain(nextEffect, focusedInstanceHandle) &&
          (shouldFireAfterActiveInstanceBlur = !0));
    var flags = nextEffect.flags;
    0 !== (flags & 256) && commitBeforeMutationLifeCycles(current, nextEffect);
    0 === (flags & 512) ||
      rootDoesHavePassiveEffects ||
      ((rootDoesHavePassiveEffects = !0),
      scheduleCallback(97, function() {
        flushPassiveEffects();
        return null;
      }));
    nextEffect = nextEffect.nextEffect;
  }
}
function flushPassiveEffects() {
  if (90 !== pendingPassiveEffectsRenderPriority) {
    var priorityLevel =
      97 < pendingPassiveEffectsRenderPriority
        ? 97
        : pendingPassiveEffectsRenderPriority;
    pendingPassiveEffectsRenderPriority = 90;
    return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
  }
  return !1;
}
function enqueuePendingPassiveHookEffectMount(fiber, effect) {
  pendingPassiveHookEffectsMount.push(effect, fiber);
  rootDoesHavePassiveEffects ||
    ((rootDoesHavePassiveEffects = !0),
    scheduleCallback(97, function() {
      flushPassiveEffects();
      return null;
    }));
}
function enqueuePendingPassiveHookEffectUnmount(fiber, effect) {
  pendingPassiveHookEffectsUnmount.push(effect, fiber);
  rootDoesHavePassiveEffects ||
    ((rootDoesHavePassiveEffects = !0),
    scheduleCallback(97, function() {
      flushPassiveEffects();
      return null;
    }));
}
function flushPassiveEffectsImpl() {
  if (null === rootWithPendingPassiveEffects) return !1;
  var root = rootWithPendingPassiveEffects;
  rootWithPendingPassiveEffects = null;
  if (0 !== (executionContext & 48))
    throw Error("Cannot flush passive effects while already rendering.");
  var prevExecutionContext = executionContext;
  executionContext |= 32;
  var unmountEffects = pendingPassiveHookEffectsUnmount;
  pendingPassiveHookEffectsUnmount = [];
  for (var i = 0; i < unmountEffects.length; i += 2) {
    var effect$93 = unmountEffects[i],
      fiber = unmountEffects[i + 1],
      destroy = effect$93.destroy;
    effect$93.destroy = void 0;
    if ("function" === typeof destroy)
      try {
        destroy();
      } catch (error) {
        if (null === fiber) throw Error("Should be working on an effect.");
        captureCommitPhaseError(fiber, error);
      }
  }
  unmountEffects = pendingPassiveHookEffectsMount;
  pendingPassiveHookEffectsMount = [];
  for (i = 0; i < unmountEffects.length; i += 2) {
    effect$93 = unmountEffects[i];
    fiber = unmountEffects[i + 1];
    try {
      var create$97 = effect$93.create;
      effect$93.destroy = create$97();
    } catch (error$98) {
      if (null === fiber) throw Error("Should be working on an effect.");
      captureCommitPhaseError(fiber, error$98);
    }
  }
  for (create$97 = root.current.firstEffect; null !== create$97; )
    (root = create$97.nextEffect),
      (create$97.nextEffect = null),
      create$97.flags & 8 &&
        ((create$97.sibling = null), (create$97.stateNode = null)),
      (create$97 = root);
  executionContext = prevExecutionContext;
  flushSyncCallbackQueue();
  return !0;
}
function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
  sourceFiber = createCapturedValue(error, sourceFiber);
  sourceFiber = createRootErrorUpdate(rootFiber, sourceFiber, 1);
  enqueueUpdate(rootFiber, sourceFiber);
  sourceFiber = requestEventTime();
  rootFiber = markUpdateLaneFromFiberToRoot(rootFiber, 1);
  null !== rootFiber &&
    (markRootUpdated(rootFiber, 1, sourceFiber),
    ensureRootIsScheduled(rootFiber, sourceFiber));
}
function captureCommitPhaseError(sourceFiber, error) {
  if (3 === sourceFiber.tag)
    captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
  else
    for (var fiber = sourceFiber.return; null !== fiber; ) {
      if (3 === fiber.tag) {
        captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error);
        break;
      } else if (1 === fiber.tag) {
        var instance = fiber.stateNode;
        if (
          "function" === typeof fiber.type.getDerivedStateFromError ||
          ("function" === typeof instance.componentDidCatch &&
            (null === legacyErrorBoundariesThatAlreadyFailed ||
              !legacyErrorBoundariesThatAlreadyFailed.has(instance)))
        ) {
          sourceFiber = createCapturedValue(error, sourceFiber);
          var update = createClassErrorUpdate(fiber, sourceFiber, 1);
          enqueueUpdate(fiber, update);
          update = requestEventTime();
          fiber = markUpdateLaneFromFiberToRoot(fiber, 1);
          if (null !== fiber)
            markRootUpdated(fiber, 1, update),
              ensureRootIsScheduled(fiber, update);
          else if (
            "function" === typeof instance.componentDidCatch &&
            (null === legacyErrorBoundariesThatAlreadyFailed ||
              !legacyErrorBoundariesThatAlreadyFailed.has(instance))
          )
            try {
              instance.componentDidCatch(error, sourceFiber);
            } catch (errorToIgnore) {}
          break;
        }
      }
      fiber = fiber.return;
    }
}
function pingSuspendedRoot(root, wakeable, pingedLanes) {
  var pingCache = root.pingCache;
  null !== pingCache && pingCache.delete(wakeable);
  wakeable = requestEventTime();
  root.pingedLanes |= root.suspendedLanes & pingedLanes;
  workInProgressRoot === root &&
    (workInProgressRootRenderLanes & pingedLanes) === pingedLanes &&
    (4 === workInProgressRootExitStatus ||
    (3 === workInProgressRootExitStatus &&
      (workInProgressRootRenderLanes & 62914560) ===
        workInProgressRootRenderLanes &&
      500 > now() - globalMostRecentFallbackTime)
      ? prepareFreshStack(root, 0)
      : (workInProgressRootPingedLanes |= pingedLanes));
  ensureRootIsScheduled(root, wakeable);
}
function resolveRetryWakeable(boundaryFiber, wakeable) {
  var retryCache = boundaryFiber.stateNode;
  null !== retryCache && retryCache.delete(wakeable);
  wakeable = 0;
  0 === wakeable &&
    ((wakeable = boundaryFiber.mode),
    0 === (wakeable & 2)
      ? (wakeable = 1)
      : 0 === (wakeable & 4)
      ? (wakeable = 99 === getCurrentPriorityLevel() ? 1 : 2)
      : (0 === currentEventWipLanes &&
          (currentEventWipLanes = workInProgressRootIncludedLanes),
        (wakeable = getHighestPriorityLane(62914560 & ~currentEventWipLanes)),
        0 === wakeable && (wakeable = 4194304)));
  retryCache = requestEventTime();
  boundaryFiber = markUpdateLaneFromFiberToRoot(boundaryFiber, wakeable);
  null !== boundaryFiber &&
    (markRootUpdated(boundaryFiber, wakeable, retryCache),
    ensureRootIsScheduled(boundaryFiber, retryCache));
}
var beginWork$1;
beginWork$1 = function(current, workInProgress, renderLanes) {
  var updateLanes = workInProgress.lanes;
  if (null !== current)
    if (
      current.memoizedProps !== workInProgress.pendingProps ||
      didPerformWorkStackCursor.current
    )
      didReceiveUpdate = !0;
    else if (0 !== (renderLanes & updateLanes))
      didReceiveUpdate = 0 !== (current.flags & 32768) ? !0 : !1;
    else {
      didReceiveUpdate = !1;
      switch (workInProgress.tag) {
        case 3:
          pushHostRootContext(workInProgress);
          break;
        case 5:
          pushHostContext(workInProgress);
          break;
        case 1:
          isContextProvider(workInProgress.type) &&
            pushContextProvider(workInProgress);
          break;
        case 4:
          pushHostContainer(
            workInProgress,
            workInProgress.stateNode.containerInfo
          );
          break;
        case 10:
          updateLanes = workInProgress.memoizedProps.value;
          var context = workInProgress.type._context;
          push(valueCursor, context._currentValue2);
          context._currentValue2 = updateLanes;
          break;
        case 13:
          if (null !== workInProgress.memoizedState) {
            if (0 !== (renderLanes & workInProgress.child.childLanes))
              return updateSuspenseComponent(
                current,
                workInProgress,
                renderLanes
              );
            push(suspenseStackCursor, suspenseStackCursor.current & 1);
            workInProgress = bailoutOnAlreadyFinishedWork(
              current,
              workInProgress,
              renderLanes
            );
            return null !== workInProgress ? workInProgress.sibling : null;
          }
          push(suspenseStackCursor, suspenseStackCursor.current & 1);
          break;
        case 19:
          updateLanes = 0 !== (renderLanes & workInProgress.childLanes);
          if (0 !== (current.flags & 64)) {
            if (updateLanes)
              return updateSuspenseListComponent(
                current,
                workInProgress,
                renderLanes
              );
            workInProgress.flags |= 64;
          }
          context = workInProgress.memoizedState;
          null !== context &&
            ((context.rendering = null),
            (context.tail = null),
            (context.lastEffect = null));
          push(suspenseStackCursor, suspenseStackCursor.current);
          if (updateLanes) break;
          else return null;
        case 22:
        case 23:
          return (
            (workInProgress.lanes = 0),
            updateOffscreenComponent(current, workInProgress, renderLanes)
          );
      }
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
  else didReceiveUpdate = !1;
  workInProgress.lanes = 0;
  switch (workInProgress.tag) {
    case 2:
      updateLanes = workInProgress.type;
      null !== current &&
        ((current.alternate = null),
        (workInProgress.alternate = null),
        (workInProgress.flags |= 2));
      current = workInProgress.pendingProps;
      context = getMaskedContext(workInProgress, contextStackCursor.current);
      prepareToReadContext(workInProgress, renderLanes);
      context = renderWithHooks(
        null,
        workInProgress,
        updateLanes,
        current,
        context,
        renderLanes
      );
      workInProgress.flags |= 1;
      if (
        "object" === typeof context &&
        null !== context &&
        "function" === typeof context.render &&
        void 0 === context.$$typeof
      ) {
        workInProgress.tag = 1;
        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null;
        if (isContextProvider(updateLanes)) {
          var hasContext = !0;
          pushContextProvider(workInProgress);
        } else hasContext = !1;
        workInProgress.memoizedState =
          null !== context.state && void 0 !== context.state
            ? context.state
            : null;
        initializeUpdateQueue(workInProgress);
        var getDerivedStateFromProps = updateLanes.getDerivedStateFromProps;
        "function" === typeof getDerivedStateFromProps &&
          applyDerivedStateFromProps(
            workInProgress,
            updateLanes,
            getDerivedStateFromProps,
            current
          );
        context.updater = classComponentUpdater;
        workInProgress.stateNode = context;
        context._reactInternals = workInProgress;
        mountClassInstance(workInProgress, updateLanes, current, renderLanes);
        workInProgress = finishClassComponent(
          null,
          workInProgress,
          updateLanes,
          !0,
          hasContext,
          renderLanes
        );
      } else
        (workInProgress.tag = 0),
          reconcileChildren(null, workInProgress, context, renderLanes),
          (workInProgress = workInProgress.child);
      return workInProgress;
    case 16:
      context = workInProgress.elementType;
      a: {
        null !== current &&
          ((current.alternate = null),
          (workInProgress.alternate = null),
          (workInProgress.flags |= 2));
        current = workInProgress.pendingProps;
        hasContext = context._init;
        context = hasContext(context._payload);
        workInProgress.type = context;
        hasContext = workInProgress.tag = resolveLazyComponentTag(context);
        current = resolveDefaultProps(context, current);
        switch (hasContext) {
          case 0:
            workInProgress = updateFunctionComponent(
              null,
              workInProgress,
              context,
              current,
              renderLanes
            );
            break a;
          case 1:
            workInProgress = updateClassComponent(
              null,
              workInProgress,
              context,
              current,
              renderLanes
            );
            break a;
          case 11:
            workInProgress = updateForwardRef(
              null,
              workInProgress,
              context,
              current,
              renderLanes
            );
            break a;
          case 14:
            workInProgress = updateMemoComponent(
              null,
              workInProgress,
              context,
              resolveDefaultProps(context.type, current),
              updateLanes,
              renderLanes
            );
            break a;
        }
        throw Error(
          "Element type is invalid. Received a promise that resolves to: " +
            context +
            ". Lazy element type must resolve to a class or function."
        );
      }
      return workInProgress;
    case 0:
      return (
        (updateLanes = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateLanes
            ? context
            : resolveDefaultProps(updateLanes, context)),
        updateFunctionComponent(
          current,
          workInProgress,
          updateLanes,
          context,
          renderLanes
        )
      );
    case 1:
      return (
        (updateLanes = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateLanes
            ? context
            : resolveDefaultProps(updateLanes, context)),
        updateClassComponent(
          current,
          workInProgress,
          updateLanes,
          context,
          renderLanes
        )
      );
    case 3:
      pushHostRootContext(workInProgress);
      updateLanes = workInProgress.updateQueue;
      if (null === current || null === updateLanes)
        throw Error(
          "If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue."
        );
      updateLanes = workInProgress.pendingProps;
      context = workInProgress.memoizedState;
      context = null !== context ? context.element : null;
      cloneUpdateQueue(current, workInProgress);
      processUpdateQueue(workInProgress, updateLanes, null, renderLanes);
      updateLanes = workInProgress.memoizedState.element;
      updateLanes === context
        ? (workInProgress = bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes
          ))
        : (reconcileChildren(current, workInProgress, updateLanes, renderLanes),
          (workInProgress = workInProgress.child));
      return workInProgress;
    case 5:
      return (
        pushHostContext(workInProgress),
        (updateLanes = workInProgress.pendingProps.children),
        markRef(current, workInProgress),
        reconcileChildren(current, workInProgress, updateLanes, renderLanes),
        workInProgress.child
      );
    case 6:
      return null;
    case 13:
      return updateSuspenseComponent(current, workInProgress, renderLanes);
    case 4:
      return (
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        ),
        (updateLanes = workInProgress.pendingProps),
        null === current
          ? (workInProgress.child = reconcileChildFibers(
              workInProgress,
              null,
              updateLanes,
              renderLanes
            ))
          : reconcileChildren(
              current,
              workInProgress,
              updateLanes,
              renderLanes
            ),
        workInProgress.child
      );
    case 11:
      return (
        (updateLanes = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateLanes
            ? context
            : resolveDefaultProps(updateLanes, context)),
        updateForwardRef(
          current,
          workInProgress,
          updateLanes,
          context,
          renderLanes
        )
      );
    case 7:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps,
          renderLanes
        ),
        workInProgress.child
      );
    case 8:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 12:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 10:
      a: {
        updateLanes = workInProgress.type._context;
        context = workInProgress.pendingProps;
        getDerivedStateFromProps = workInProgress.memoizedProps;
        hasContext = context.value;
        var context$jscomp$0 = workInProgress.type._context;
        push(valueCursor, context$jscomp$0._currentValue2);
        context$jscomp$0._currentValue2 = hasContext;
        if (null !== getDerivedStateFromProps)
          if (
            ((context$jscomp$0 = getDerivedStateFromProps.value),
            (hasContext = objectIs(context$jscomp$0, hasContext)
              ? 0
              : ("function" === typeof updateLanes._calculateChangedBits
                  ? updateLanes._calculateChangedBits(
                      context$jscomp$0,
                      hasContext
                    )
                  : 1073741823) | 0),
            0 === hasContext)
          ) {
            if (
              getDerivedStateFromProps.children === context.children &&
              !didPerformWorkStackCursor.current
            ) {
              workInProgress = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress,
                renderLanes
              );
              break a;
            }
          } else
            for (
              context$jscomp$0 = workInProgress.child,
                null !== context$jscomp$0 &&
                  (context$jscomp$0.return = workInProgress);
              null !== context$jscomp$0;

            ) {
              var list = context$jscomp$0.dependencies;
              if (null !== list) {
                getDerivedStateFromProps = context$jscomp$0.child;
                for (
                  var dependency = list.firstContext;
                  null !== dependency;

                ) {
                  if (
                    dependency.context === updateLanes &&
                    0 !== (dependency.observedBits & hasContext)
                  ) {
                    1 === context$jscomp$0.tag &&
                      ((dependency = createUpdate(
                        -1,
                        renderLanes & -renderLanes
                      )),
                      (dependency.tag = 2),
                      enqueueUpdate(context$jscomp$0, dependency));
                    context$jscomp$0.lanes |= renderLanes;
                    dependency = context$jscomp$0.alternate;
                    null !== dependency && (dependency.lanes |= renderLanes);
                    scheduleWorkOnParentPath(
                      context$jscomp$0.return,
                      renderLanes
                    );
                    list.lanes |= renderLanes;
                    break;
                  }
                  dependency = dependency.next;
                }
              } else
                getDerivedStateFromProps =
                  10 === context$jscomp$0.tag
                    ? context$jscomp$0.type === workInProgress.type
                      ? null
                      : context$jscomp$0.child
                    : context$jscomp$0.child;
              if (null !== getDerivedStateFromProps)
                getDerivedStateFromProps.return = context$jscomp$0;
              else
                for (
                  getDerivedStateFromProps = context$jscomp$0;
                  null !== getDerivedStateFromProps;

                ) {
                  if (getDerivedStateFromProps === workInProgress) {
                    getDerivedStateFromProps = null;
                    break;
                  }
                  context$jscomp$0 = getDerivedStateFromProps.sibling;
                  if (null !== context$jscomp$0) {
                    context$jscomp$0.return = getDerivedStateFromProps.return;
                    getDerivedStateFromProps = context$jscomp$0;
                    break;
                  }
                  getDerivedStateFromProps = getDerivedStateFromProps.return;
                }
              context$jscomp$0 = getDerivedStateFromProps;
            }
        reconcileChildren(
          current,
          workInProgress,
          context.children,
          renderLanes
        );
        workInProgress = workInProgress.child;
      }
      return workInProgress;
    case 9:
      return (
        (context = workInProgress.type),
        (hasContext = workInProgress.pendingProps),
        (updateLanes = hasContext.children),
        prepareToReadContext(workInProgress, renderLanes),
        (context = readContext(context, hasContext.unstable_observedBits)),
        (updateLanes = updateLanes(context)),
        (workInProgress.flags |= 1),
        reconcileChildren(current, workInProgress, updateLanes, renderLanes),
        workInProgress.child
      );
    case 14:
      return (
        (context = workInProgress.type),
        (hasContext = resolveDefaultProps(
          context,
          workInProgress.pendingProps
        )),
        (hasContext = resolveDefaultProps(context.type, hasContext)),
        updateMemoComponent(
          current,
          workInProgress,
          context,
          hasContext,
          updateLanes,
          renderLanes
        )
      );
    case 15:
      return updateSimpleMemoComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        updateLanes,
        renderLanes
      );
    case 17:
      return (
        (updateLanes = workInProgress.type),
        (context = workInProgress.pendingProps),
        (context =
          workInProgress.elementType === updateLanes
            ? context
            : resolveDefaultProps(updateLanes, context)),
        null !== current &&
          ((current.alternate = null),
          (workInProgress.alternate = null),
          (workInProgress.flags |= 2)),
        (workInProgress.tag = 1),
        isContextProvider(updateLanes)
          ? ((current = !0), pushContextProvider(workInProgress))
          : (current = !1),
        prepareToReadContext(workInProgress, renderLanes),
        constructClassInstance(workInProgress, updateLanes, context),
        mountClassInstance(workInProgress, updateLanes, context, renderLanes),
        finishClassComponent(
          null,
          workInProgress,
          updateLanes,
          !0,
          current,
          renderLanes
        )
      );
    case 19:
      return updateSuspenseListComponent(current, workInProgress, renderLanes);
    case 22:
      return updateOffscreenComponent(current, workInProgress, renderLanes);
    case 23:
      return updateOffscreenComponent(current, workInProgress, renderLanes);
  }
  throw Error(
    "Unknown unit of work tag (" +
      workInProgress.tag +
      "). This error is likely caused by a bug in React. Please file an issue."
  );
};
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;
  this.key = key;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = pendingProps;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = mode;
  this.flags = 0;
  this.lastEffect = this.firstEffect = this.nextEffect = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function createFiber(tag, pendingProps, key, mode) {
  return new FiberNode(tag, pendingProps, key, mode);
}
function shouldConstruct(Component) {
  Component = Component.prototype;
  return !(!Component || !Component.isReactComponent);
}
function resolveLazyComponentTag(Component) {
  if ("function" === typeof Component)
    return shouldConstruct(Component) ? 1 : 0;
  if (void 0 !== Component && null !== Component) {
    Component = Component.$$typeof;
    if (Component === REACT_FORWARD_REF_TYPE) return 11;
    if (Component === REACT_MEMO_TYPE) return 14;
  }
  return 2;
}
function createWorkInProgress(current, pendingProps) {
  var workInProgress = current.alternate;
  null === workInProgress
    ? ((workInProgress = createFiber(
        current.tag,
        pendingProps,
        current.key,
        current.mode
      )),
      (workInProgress.elementType = current.elementType),
      (workInProgress.type = current.type),
      (workInProgress.stateNode = current.stateNode),
      (workInProgress.alternate = current),
      (current.alternate = workInProgress))
    : ((workInProgress.pendingProps = pendingProps),
      (workInProgress.type = current.type),
      (workInProgress.flags = 0),
      (workInProgress.nextEffect = null),
      (workInProgress.firstEffect = null),
      (workInProgress.lastEffect = null));
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  pendingProps = current.dependencies;
  workInProgress.dependencies =
    null === pendingProps
      ? null
      : { lanes: pendingProps.lanes, firstContext: pendingProps.firstContext };
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  return workInProgress;
}
function createFiberFromTypeAndProps(
  type,
  key,
  pendingProps,
  owner,
  mode,
  lanes
) {
  var fiberTag = 2;
  owner = type;
  if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1);
  else if ("string" === typeof type) fiberTag = 5;
  else
    a: switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(pendingProps.children, mode, lanes, key);
      case REACT_DEBUG_TRACING_MODE_TYPE:
        fiberTag = 8;
        mode |= 16;
        break;
      case REACT_STRICT_MODE_TYPE:
        fiberTag = 8;
        mode |= 1;
        break;
      case REACT_PROFILER_TYPE:
        return (
          (type = createFiber(12, pendingProps, key, mode | 8)),
          (type.elementType = REACT_PROFILER_TYPE),
          (type.type = REACT_PROFILER_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_SUSPENSE_TYPE:
        return (
          (type = createFiber(13, pendingProps, key, mode)),
          (type.type = REACT_SUSPENSE_TYPE),
          (type.elementType = REACT_SUSPENSE_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_SUSPENSE_LIST_TYPE:
        return (
          (type = createFiber(19, pendingProps, key, mode)),
          (type.elementType = REACT_SUSPENSE_LIST_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_OFFSCREEN_TYPE:
        return createFiberFromOffscreen(pendingProps, mode, lanes, key);
      case REACT_LEGACY_HIDDEN_TYPE:
        return (
          (type = createFiber(23, pendingProps, key, mode)),
          (type.elementType = REACT_LEGACY_HIDDEN_TYPE),
          (type.lanes = lanes),
          type
        );
      default:
        if ("object" === typeof type && null !== type)
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = 10;
              break a;
            case REACT_CONTEXT_TYPE:
              fiberTag = 9;
              break a;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = 11;
              break a;
            case REACT_MEMO_TYPE:
              fiberTag = 14;
              break a;
            case REACT_LAZY_TYPE:
              fiberTag = 16;
              owner = null;
              break a;
          }
        throw Error(
          "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " +
            (null == type ? type : typeof type) +
            "."
        );
    }
  key = createFiber(fiberTag, pendingProps, key, mode);
  key.elementType = type;
  key.type = owner;
  key.lanes = lanes;
  return key;
}
function createFiberFromFragment(elements, mode, lanes, key) {
  elements = createFiber(7, elements, key, mode);
  elements.lanes = lanes;
  return elements;
}
function createFiberFromOffscreen(pendingProps, mode, lanes, key) {
  pendingProps = createFiber(22, pendingProps, key, mode);
  pendingProps.elementType = REACT_OFFSCREEN_TYPE;
  pendingProps.lanes = lanes;
  return pendingProps;
}
function createFiberFromText(content, mode, lanes) {
  content = createFiber(6, content, null, mode);
  content.lanes = lanes;
  return content;
}
function createFiberFromPortal(portal, mode, lanes) {
  mode = createFiber(
    4,
    null !== portal.children ? portal.children : [],
    portal.key,
    mode
  );
  mode.lanes = lanes;
  mode.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null,
    implementation: portal.implementation
  };
  return mode;
}
function FiberRootNode(containerInfo, tag, hydrate) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.pendingContext = this.context = null;
  this.hydrate = hydrate;
  this.callbackNode = null;
  this.callbackPriority = 0;
  this.eventTimes = createLaneMap(0);
  this.expirationTimes = createLaneMap(-1);
  this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = createLaneMap(0);
}
function createPortal(children, containerInfo, implementation) {
  var key =
    3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return {
    $$typeof: REACT_PORTAL_TYPE,
    key: null == key ? null : "" + key,
    children: children,
    containerInfo: containerInfo,
    implementation: implementation
  };
}
function findHostInstance(component) {
  var fiber = component._reactInternals;
  if (void 0 === fiber) {
    if ("function" === typeof component.render)
      throw Error("Unable to find node on an unmounted component.");
    throw Error(
      "Argument appears to not be a ReactComponent. Keys: " +
        Object.keys(component)
    );
  }
  component = findCurrentHostFiber(fiber);
  return null === component ? null : component.stateNode;
}
function updateContainer(element, container, parentComponent, callback) {
  var current = container.current,
    eventTime = requestEventTime(),
    lane = requestUpdateLane(current);
  a: if (parentComponent) {
    parentComponent = parentComponent._reactInternals;
    b: {
      if (
        getNearestMountedFiber(parentComponent) !== parentComponent ||
        1 !== parentComponent.tag
      )
        throw Error(
          "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue."
        );
      var JSCompiler_inline_result = parentComponent;
      do {
        switch (JSCompiler_inline_result.tag) {
          case 3:
            JSCompiler_inline_result =
              JSCompiler_inline_result.stateNode.context;
            break b;
          case 1:
            if (isContextProvider(JSCompiler_inline_result.type)) {
              JSCompiler_inline_result =
                JSCompiler_inline_result.stateNode
                  .__reactInternalMemoizedMergedChildContext;
              break b;
            }
        }
        JSCompiler_inline_result = JSCompiler_inline_result.return;
      } while (null !== JSCompiler_inline_result);
      throw Error(
        "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
      );
    }
    if (1 === parentComponent.tag) {
      var Component = parentComponent.type;
      if (isContextProvider(Component)) {
        parentComponent = processChildContext(
          parentComponent,
          Component,
          JSCompiler_inline_result
        );
        break a;
      }
    }
    parentComponent = JSCompiler_inline_result;
  } else parentComponent = emptyContextObject;
  null === container.context
    ? (container.context = parentComponent)
    : (container.pendingContext = parentComponent);
  container = createUpdate(eventTime, lane);
  container.payload = { element: element };
  callback = void 0 === callback ? null : callback;
  null !== callback && (container.callback = callback);
  enqueueUpdate(current, container);
  scheduleUpdateOnFiber(current, lane, eventTime);
  return lane;
}
function emptyFindFiberByHostInstance() {
  return null;
}
function findNodeHandle(componentOrHandle) {
  if (null == componentOrHandle) return null;
  if ("number" === typeof componentOrHandle) return componentOrHandle;
  if (componentOrHandle._nativeTag) return componentOrHandle._nativeTag;
  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag)
    return componentOrHandle.canonical._nativeTag;
  componentOrHandle = findHostInstance(componentOrHandle);
  return null == componentOrHandle
    ? componentOrHandle
    : componentOrHandle.canonical
    ? componentOrHandle.canonical._nativeTag
    : componentOrHandle._nativeTag;
}
batchedUpdatesImpl = function(fn, a) {
  var prevExecutionContext = executionContext;
  executionContext |= 1;
  try {
    return fn(a);
  } finally {
    (executionContext = prevExecutionContext),
      0 === executionContext &&
        ((workInProgressRootRenderTargetTime = now() + 500),
        flushSyncCallbackQueue());
  }
};
var roots = new Map(),
  devToolsConfig$jscomp$inline_865 = {
    findFiberByHostInstance: getInstanceFromInstance,
    bundleType: 0,
    version: "17.0.1-454c2211c",
    rendererPackageName: "react-native-renderer",
    rendererConfig: {
      getInspectorDataForViewTag: function() {
        throw Error(
          "getInspectorDataForViewTag() is not available in production"
        );
      },
      getInspectorDataForViewAtPoint: function() {
        throw Error(
          "getInspectorDataForViewAtPoint() is not available in production."
        );
      }.bind(null, findNodeHandle)
    }
  };
var internals$jscomp$inline_1054 = {
  bundleType: devToolsConfig$jscomp$inline_865.bundleType,
  version: devToolsConfig$jscomp$inline_865.version,
  rendererPackageName: devToolsConfig$jscomp$inline_865.rendererPackageName,
  rendererConfig: devToolsConfig$jscomp$inline_865.rendererConfig,
  overrideHookState: null,
  overrideHookStateDeletePath: null,
  overrideHookStateRenamePath: null,
  overrideProps: null,
  overridePropsDeletePath: null,
  overridePropsRenamePath: null,
  setSuspenseHandler: null,
  scheduleUpdate: null,
  currentDispatcherRef: ReactSharedInternals.ReactCurrentDispatcher,
  findHostInstanceByFiber: function(fiber) {
    fiber = findCurrentHostFiber(fiber);
    return null === fiber ? null : fiber.stateNode;
  },
  findFiberByHostInstance:
    devToolsConfig$jscomp$inline_865.findFiberByHostInstance ||
    emptyFindFiberByHostInstance,
  findHostInstancesForRefresh: null,
  scheduleRefresh: null,
  scheduleRoot: null,
  setRefreshHandler: null,
  getCurrentFiber: null
};
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var hook$jscomp$inline_1055 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (
    !hook$jscomp$inline_1055.isDisabled &&
    hook$jscomp$inline_1055.supportsFiber
  )
    try {
      (rendererID = hook$jscomp$inline_1055.inject(
        internals$jscomp$inline_1054
      )),
        (injectedHook = hook$jscomp$inline_1055);
    } catch (err) {}
}
exports.createPortal = function(children, containerTag) {
  return createPortal(
    children,
    containerTag,
    null,
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null
  );
};
exports.dispatchCommand = function(handle, command, args) {
  null != handle._nativeTag &&
    (handle._internalInstanceHandle
      ? nativeFabricUIManager.dispatchCommand(
          handle._internalInstanceHandle.stateNode.node,
          command,
          args
        )
      : ReactNativePrivateInterface.UIManager.dispatchViewManagerCommand(
          handle._nativeTag,
          command,
          args
        ));
};
exports.findHostInstance_DEPRECATED = function(componentOrHandle) {
  if (null == componentOrHandle) return null;
  if (componentOrHandle._nativeTag) return componentOrHandle;
  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag)
    return componentOrHandle.canonical;
  componentOrHandle = findHostInstance(componentOrHandle);
  return null == componentOrHandle
    ? componentOrHandle
    : componentOrHandle.canonical
    ? componentOrHandle.canonical
    : componentOrHandle;
};
exports.findNodeHandle = findNodeHandle;
exports.render = function(element, containerTag, callback) {
  var root = roots.get(containerTag);
  if (!root) {
    root = new FiberRootNode(containerTag, 0, !1);
    var uninitializedFiber = createFiber(3, null, null, 0);
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    initializeUpdateQueue(uninitializedFiber);
    roots.set(containerTag, root);
  }
  updateContainer(element, root, null, callback);
  a: if (((element = root.current), element.child))
    switch (element.child.tag) {
      case 5:
        element = element.child.stateNode.canonical;
        break a;
      default:
        element = element.child.stateNode;
    }
  else element = null;
  return element;
};
exports.stopSurface = function(containerTag) {
  var root = roots.get(containerTag);
  root &&
    updateContainer(null, root, null, function() {
      roots.delete(containerTag);
    });
};
exports.unmountComponentAtNode = function(containerTag) {
  this.stopSurface(containerTag);
};
