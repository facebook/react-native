/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @noflow
 * @providesModule ReactNativeStack-dev
 */
"use strict";

var invariant = require("fbjs/lib/invariant");

require("InitializeCore");

var warning = require("fbjs/lib/warning"), RCTEventEmitter = require("RCTEventEmitter"), emptyFunction = require("fbjs/lib/emptyFunction"), UIManager = require("UIManager"), React = require("react"), ExecutionEnvironment = require("fbjs/lib/ExecutionEnvironment"), performanceNow = require("fbjs/lib/performanceNow"), emptyObject = require("fbjs/lib/emptyObject"), checkPropTypes = require("prop-types/checkPropTypes"), shallowEqual = require("fbjs/lib/shallowEqual"), deepDiffer = require("deepDiffer"), flattenStyle = require("flattenStyle"), TextInputState = require("TextInputState"), deepFreezeAndThrowOnMutationInDev = require("deepFreezeAndThrowOnMutationInDev"), instanceCache = {}, instanceProps = {};

function getRenderedHostOrTextFromComponent(component) {
    for (var rendered; rendered = component._renderedComponent; ) component = rendered;
    return component;
}

function precacheNode(inst, tag) {
    var nativeInst = getRenderedHostOrTextFromComponent(inst);
    instanceCache[tag] = nativeInst;
}

function precacheFiberNode(hostInst, tag) {
    instanceCache[tag] = hostInst;
}

function uncacheNode(inst) {
    var tag = inst._rootNodeID;
    tag && delete instanceCache[tag];
}

function uncacheFiberNode(tag) {
    delete instanceCache[tag], delete instanceProps[tag];
}

function getInstanceFromTag(tag) {
    return instanceCache[tag] || null;
}

function getTagFromInstance(inst) {
    var tag = "number" != typeof inst.tag ? inst._rootNodeID : inst.stateNode._nativeTag;
    return invariant(tag, "All native instances should have a tag."), tag;
}

function getFiberCurrentPropsFromNode(stateNode) {
    return instanceProps[stateNode._nativeTag] || null;
}

function updateFiberProps(tag, props) {
    instanceProps[tag] = props;
}

var ReactNativeComponentTree = {
    getClosestInstanceFromNode: getInstanceFromTag,
    getInstanceFromNode: getInstanceFromTag,
    getNodeFromInstance: getTagFromInstance,
    precacheFiberNode: precacheFiberNode,
    precacheNode: precacheNode,
    uncacheFiberNode: uncacheFiberNode,
    uncacheNode: uncacheNode,
    getFiberCurrentPropsFromNode: getFiberCurrentPropsFromNode,
    updateFiberProps: updateFiberProps
}, ReactNativeComponentTree_1 = ReactNativeComponentTree, eventPluginOrder = null, namesToPlugins = {};

function recomputePluginOrdering() {
    if (eventPluginOrder) for (var pluginName in namesToPlugins) {
        var pluginModule = namesToPlugins[pluginName], pluginIndex = eventPluginOrder.indexOf(pluginName);
        if (invariant(pluginIndex > -1, "EventPluginRegistry: Cannot inject event plugins that do not exist in " + "the plugin ordering, `%s`.", pluginName), 
        !EventPluginRegistry.plugins[pluginIndex]) {
            invariant(pluginModule.extractEvents, "EventPluginRegistry: Event plugins must implement an `extractEvents` " + "method, but `%s` does not.", pluginName), 
            EventPluginRegistry.plugins[pluginIndex] = pluginModule;
            var publishedEvents = pluginModule.eventTypes;
            for (var eventName in publishedEvents) invariant(publishEventForPlugin(publishedEvents[eventName], pluginModule, eventName), "EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.", eventName, pluginName);
        }
    }
}

function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
    invariant(!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName), "EventPluginHub: More than one plugin attempted to publish the same " + "event name, `%s`.", eventName), 
    EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;
    var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
    if (phasedRegistrationNames) {
        for (var phaseName in phasedRegistrationNames) if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
            var phasedRegistrationName = phasedRegistrationNames[phaseName];
            publishRegistrationName(phasedRegistrationName, pluginModule, eventName);
        }
        return !0;
    }
    return !!dispatchConfig.registrationName && (publishRegistrationName(dispatchConfig.registrationName, pluginModule, eventName), 
    !0);
}

function publishRegistrationName(registrationName, pluginModule, eventName) {
    invariant(!EventPluginRegistry.registrationNameModules[registrationName], "EventPluginHub: More than one plugin attempted to publish the same " + "registration name, `%s`.", registrationName), 
    EventPluginRegistry.registrationNameModules[registrationName] = pluginModule, EventPluginRegistry.registrationNameDependencies[registrationName] = pluginModule.eventTypes[eventName].dependencies;
    var lowerCasedName = registrationName.toLowerCase();
    EventPluginRegistry.possibleRegistrationNames[lowerCasedName] = registrationName, 
    "onDoubleClick" === registrationName && (EventPluginRegistry.possibleRegistrationNames.ondblclick = registrationName);
}

var EventPluginRegistry = {
    plugins: [],
    eventNameDispatchConfigs: {},
    registrationNameModules: {},
    registrationNameDependencies: {},
    possibleRegistrationNames: {},
    injectEventPluginOrder: function(injectedEventPluginOrder) {
        invariant(!eventPluginOrder, "EventPluginRegistry: Cannot inject event plugin ordering more than " + "once. You are likely trying to load more than one copy of React."), 
        eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder), recomputePluginOrdering();
    },
    injectEventPluginsByName: function(injectedNamesToPlugins) {
        var isOrderingDirty = !1;
        for (var pluginName in injectedNamesToPlugins) if (injectedNamesToPlugins.hasOwnProperty(pluginName)) {
            var pluginModule = injectedNamesToPlugins[pluginName];
            namesToPlugins.hasOwnProperty(pluginName) && namesToPlugins[pluginName] === pluginModule || (invariant(!namesToPlugins[pluginName], "EventPluginRegistry: Cannot inject two different event plugins " + "using the same name, `%s`.", pluginName), 
            namesToPlugins[pluginName] = pluginModule, isOrderingDirty = !0);
        }
        isOrderingDirty && recomputePluginOrdering();
    }
}, EventPluginRegistry_1 = EventPluginRegistry, caughtError = null, invokeGuardedCallback = function(name, func, context, a, b, c, d, e, f) {
    var funcArgs = Array.prototype.slice.call(arguments, 3);
    try {
        func.apply(context, funcArgs);
    } catch (error) {
        return error;
    }
    return null;
};

if ("undefined" != typeof window && "function" == typeof window.dispatchEvent && "undefined" != typeof document && "function" == typeof document.createEvent) {
    var fakeNode = document.createElement("react"), depth = 0;
    invokeGuardedCallback = function(name, func, context, a, b, c, d, e, f) {
        depth++;
        var thisDepth = depth, funcArgs = Array.prototype.slice.call(arguments, 3), boundFunc = function() {
            func.apply(context, funcArgs);
        }, fakeEventError = null, onFakeEventError = function(event) {
            depth === thisDepth && (fakeEventError = event.error);
        }, evtType = "react-" + (name || "invokeguardedcallback") + "-" + depth;
        window.addEventListener("error", onFakeEventError), fakeNode.addEventListener(evtType, boundFunc, !1);
        var evt = document.createEvent("Event");
        return evt.initEvent(evtType, !1, !1), fakeNode.dispatchEvent(evt), fakeNode.removeEventListener(evtType, boundFunc, !1), 
        window.removeEventListener("error", onFakeEventError), depth--, fakeEventError;
    };
}

var rethrowCaughtError = function() {
    if (caughtError) {
        var error = caughtError;
        throw caughtError = null, error;
    }
}, ReactErrorUtils = {
    injection: {
        injectErrorUtils: function(injectedErrorUtils) {
            invariant("function" == typeof injectedErrorUtils.invokeGuardedCallback, "Injected invokeGuardedCallback() must be a function."), 
            invokeGuardedCallback = injectedErrorUtils.invokeGuardedCallback;
        }
    },
    invokeGuardedCallback: function(name, func, context, a, b, c, d, e, f) {
        return invokeGuardedCallback.apply(this, arguments);
    },
    invokeGuardedCallbackAndCatchFirstError: function(name, func, context, a, b, c, d, e, f) {
        var error = ReactErrorUtils.invokeGuardedCallback.apply(this, arguments);
        null !== error && null === caughtError && (caughtError = error);
    },
    rethrowCaughtError: function() {
        return rethrowCaughtError.apply(this, arguments);
    }
}, ReactErrorUtils_1 = ReactErrorUtils, ComponentTree, injection = {
    injectComponentTree: function(Injected) {
        ComponentTree = Injected, warning(Injected && Injected.getNodeFromInstance && Injected.getInstanceFromNode, "EventPluginUtils.injection.injectComponentTree(...): Injected " + "module is missing getNodeFromInstance or getInstanceFromNode.");
    }
};

function isEndish(topLevelType) {
    return "topMouseUp" === topLevelType || "topTouchEnd" === topLevelType || "topTouchCancel" === topLevelType;
}

function isMoveish(topLevelType) {
    return "topMouseMove" === topLevelType || "topTouchMove" === topLevelType;
}

function isStartish(topLevelType) {
    return "topMouseDown" === topLevelType || "topTouchStart" === topLevelType;
}

var validateEventDispatches;

validateEventDispatches = function(event) {
    var dispatchListeners = event._dispatchListeners, dispatchInstances = event._dispatchInstances, listenersIsArr = Array.isArray(dispatchListeners), listenersLen = listenersIsArr ? dispatchListeners.length : dispatchListeners ? 1 : 0, instancesIsArr = Array.isArray(dispatchInstances), instancesLen = instancesIsArr ? dispatchInstances.length : dispatchInstances ? 1 : 0;
    warning(instancesIsArr === listenersIsArr && instancesLen === listenersLen, "EventPluginUtils: Invalid `event`.");
};

function executeDispatch(event, simulated, listener, inst) {
    var type = event.type || "unknown-event";
    event.currentTarget = EventPluginUtils.getNodeFromInstance(inst), ReactErrorUtils_1.invokeGuardedCallbackAndCatchFirstError(type, listener, void 0, event), 
    event.currentTarget = null;
}

function executeDispatchesInOrder(event, simulated) {
    var dispatchListeners = event._dispatchListeners, dispatchInstances = event._dispatchInstances;
    if (validateEventDispatches(event), Array.isArray(dispatchListeners)) for (var i = 0; i < dispatchListeners.length && !event.isPropagationStopped(); i++) executeDispatch(event, simulated, dispatchListeners[i], dispatchInstances[i]); else dispatchListeners && executeDispatch(event, simulated, dispatchListeners, dispatchInstances);
    event._dispatchListeners = null, event._dispatchInstances = null;
}

function executeDispatchesInOrderStopAtTrueImpl(event) {
    var dispatchListeners = event._dispatchListeners, dispatchInstances = event._dispatchInstances;
    if (validateEventDispatches(event), Array.isArray(dispatchListeners)) {
        for (var i = 0; i < dispatchListeners.length && !event.isPropagationStopped(); i++) if (dispatchListeners[i](event, dispatchInstances[i])) return dispatchInstances[i];
    } else if (dispatchListeners && dispatchListeners(event, dispatchInstances)) return dispatchInstances;
    return null;
}

function executeDispatchesInOrderStopAtTrue(event) {
    var ret = executeDispatchesInOrderStopAtTrueImpl(event);
    return event._dispatchInstances = null, event._dispatchListeners = null, ret;
}

function executeDirectDispatch(event) {
    validateEventDispatches(event);
    var dispatchListener = event._dispatchListeners, dispatchInstance = event._dispatchInstances;
    invariant(!Array.isArray(dispatchListener), "executeDirectDispatch(...): Invalid `event`."), 
    event.currentTarget = dispatchListener ? EventPluginUtils.getNodeFromInstance(dispatchInstance) : null;
    var res = dispatchListener ? dispatchListener(event) : null;
    return event.currentTarget = null, event._dispatchListeners = null, event._dispatchInstances = null, 
    res;
}

function hasDispatches(event) {
    return !!event._dispatchListeners;
}

var EventPluginUtils = {
    isEndish: isEndish,
    isMoveish: isMoveish,
    isStartish: isStartish,
    executeDirectDispatch: executeDirectDispatch,
    executeDispatchesInOrder: executeDispatchesInOrder,
    executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
    hasDispatches: hasDispatches,
    getFiberCurrentPropsFromNode: function(node) {
        return ComponentTree.getFiberCurrentPropsFromNode(node);
    },
    getInstanceFromNode: function(node) {
        return ComponentTree.getInstanceFromNode(node);
    },
    getNodeFromInstance: function(node) {
        return ComponentTree.getNodeFromInstance(node);
    },
    injection: injection
}, EventPluginUtils_1 = EventPluginUtils;

function accumulateInto(current, next) {
    return invariant(null != next, "accumulateInto(...): Accumulated items must not be null or undefined."), 
    null == current ? next : Array.isArray(current) ? Array.isArray(next) ? (current.push.apply(current, next), 
    current) : (current.push(next), current) : Array.isArray(next) ? [ current ].concat(next) : [ current, next ];
}

var accumulateInto_1 = accumulateInto;

function forEachAccumulated(arr, cb, scope) {
    Array.isArray(arr) ? arr.forEach(cb, scope) : arr && cb.call(scope, arr);
}

var forEachAccumulated_1 = forEachAccumulated, eventQueue = null, executeDispatchesAndRelease = function(event, simulated) {
    event && (EventPluginUtils_1.executeDispatchesInOrder(event, simulated), event.isPersistent() || event.constructor.release(event));
}, executeDispatchesAndReleaseSimulated = function(e) {
    return executeDispatchesAndRelease(e, !0);
}, executeDispatchesAndReleaseTopLevel = function(e) {
    return executeDispatchesAndRelease(e, !1);
};

function isInteractive(tag) {
    return "button" === tag || "input" === tag || "select" === tag || "textarea" === tag;
}

function shouldPreventMouseEvent(name, type, props) {
    switch (name) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
        return !(!props.disabled || !isInteractive(type));

      default:
        return !1;
    }
}

var EventPluginHub = {
    injection: {
        injectEventPluginOrder: EventPluginRegistry_1.injectEventPluginOrder,
        injectEventPluginsByName: EventPluginRegistry_1.injectEventPluginsByName
    },
    getListener: function(inst, registrationName) {
        var listener;
        if ("number" == typeof inst.tag) {
            var stateNode = inst.stateNode;
            if (!stateNode) return null;
            var props = EventPluginUtils_1.getFiberCurrentPropsFromNode(stateNode);
            if (!props) return null;
            if (listener = props[registrationName], shouldPreventMouseEvent(registrationName, inst.type, props)) return null;
        } else {
            var currentElement = inst._currentElement;
            if ("string" == typeof currentElement || "number" == typeof currentElement) return null;
            if (!inst._rootNodeID) return null;
            var _props = currentElement.props;
            if (listener = _props[registrationName], shouldPreventMouseEvent(registrationName, currentElement.type, _props)) return null;
        }
        return invariant(!listener || "function" == typeof listener, "Expected %s listener to be a function, instead got type %s", registrationName, typeof listener), 
        listener;
    },
    extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        for (var events, plugins = EventPluginRegistry_1.plugins, i = 0; i < plugins.length; i++) {
            var possiblePlugin = plugins[i];
            if (possiblePlugin) {
                var extractedEvents = possiblePlugin.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
                extractedEvents && (events = accumulateInto_1(events, extractedEvents));
            }
        }
        return events;
    },
    enqueueEvents: function(events) {
        events && (eventQueue = accumulateInto_1(eventQueue, events));
    },
    processEventQueue: function(simulated) {
        var processingEventQueue = eventQueue;
        eventQueue = null, simulated ? forEachAccumulated_1(processingEventQueue, executeDispatchesAndReleaseSimulated) : forEachAccumulated_1(processingEventQueue, executeDispatchesAndReleaseTopLevel), 
        invariant(!eventQueue, "processEventQueue(): Additional events were enqueued while processing " + "an event queue. Support for this has not yet been implemented."), 
        ReactErrorUtils_1.rethrowCaughtError();
    }
}, EventPluginHub_1 = EventPluginHub, ReactTypeOfWork = {
    IndeterminateComponent: 0,
    FunctionalComponent: 1,
    ClassComponent: 2,
    HostRoot: 3,
    HostPortal: 4,
    HostComponent: 5,
    HostText: 6,
    CoroutineComponent: 7,
    CoroutineHandlerPhase: 8,
    YieldComponent: 9,
    Fragment: 10
}, HostComponent = ReactTypeOfWork.HostComponent;

function getParent(inst) {
    if (void 0 !== inst._hostParent) return inst._hostParent;
    if ("number" == typeof inst.tag) {
        do {
            inst = inst.return;
        } while (inst && inst.tag !== HostComponent);
        if (inst) return inst;
    }
    return null;
}

function getLowestCommonAncestor(instA, instB) {
    for (var depthA = 0, tempA = instA; tempA; tempA = getParent(tempA)) depthA++;
    for (var depthB = 0, tempB = instB; tempB; tempB = getParent(tempB)) depthB++;
    for (;depthA - depthB > 0; ) instA = getParent(instA), depthA--;
    for (;depthB - depthA > 0; ) instB = getParent(instB), depthB--;
    for (var depth = depthA; depth--; ) {
        if (instA === instB || instA === instB.alternate) return instA;
        instA = getParent(instA), instB = getParent(instB);
    }
    return null;
}

function isAncestor(instA, instB) {
    for (;instB; ) {
        if (instA === instB || instA === instB.alternate) return !0;
        instB = getParent(instB);
    }
    return !1;
}

function getParentInstance(inst) {
    return getParent(inst);
}

function traverseTwoPhase(inst, fn, arg) {
    for (var path = []; inst; ) path.push(inst), inst = getParent(inst);
    var i;
    for (i = path.length; i-- > 0; ) fn(path[i], "captured", arg);
    for (i = 0; i < path.length; i++) fn(path[i], "bubbled", arg);
}

function traverseEnterLeave(from, to, fn, argFrom, argTo) {
    for (var common = from && to ? getLowestCommonAncestor(from, to) : null, pathFrom = []; from && from !== common; ) pathFrom.push(from), 
    from = getParent(from);
    for (var pathTo = []; to && to !== common; ) pathTo.push(to), to = getParent(to);
    var i;
    for (i = 0; i < pathFrom.length; i++) fn(pathFrom[i], "bubbled", argFrom);
    for (i = pathTo.length; i-- > 0; ) fn(pathTo[i], "captured", argTo);
}

var ReactTreeTraversal = {
    isAncestor: isAncestor,
    getLowestCommonAncestor: getLowestCommonAncestor,
    getParentInstance: getParentInstance,
    traverseTwoPhase: traverseTwoPhase,
    traverseEnterLeave: traverseEnterLeave
}, getListener = EventPluginHub_1.getListener;

function listenerAtPhase(inst, event, propagationPhase) {
    var registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase];
    return getListener(inst, registrationName);
}

function accumulateDirectionalDispatches(inst, phase, event) {
    warning(inst, "Dispatching inst must not be null");
    var listener = listenerAtPhase(inst, event, phase);
    listener && (event._dispatchListeners = accumulateInto_1(event._dispatchListeners, listener), 
    event._dispatchInstances = accumulateInto_1(event._dispatchInstances, inst));
}

function accumulateTwoPhaseDispatchesSingle(event) {
    event && event.dispatchConfig.phasedRegistrationNames && ReactTreeTraversal.traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
}

function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
    if (event && event.dispatchConfig.phasedRegistrationNames) {
        var targetInst = event._targetInst, parentInst = targetInst ? ReactTreeTraversal.getParentInstance(targetInst) : null;
        ReactTreeTraversal.traverseTwoPhase(parentInst, accumulateDirectionalDispatches, event);
    }
}

function accumulateDispatches(inst, ignoredDirection, event) {
    if (inst && event && event.dispatchConfig.registrationName) {
        var registrationName = event.dispatchConfig.registrationName, listener = getListener(inst, registrationName);
        listener && (event._dispatchListeners = accumulateInto_1(event._dispatchListeners, listener), 
        event._dispatchInstances = accumulateInto_1(event._dispatchInstances, inst));
    }
}

function accumulateDirectDispatchesSingle(event) {
    event && event.dispatchConfig.registrationName && accumulateDispatches(event._targetInst, null, event);
}

function accumulateTwoPhaseDispatches(events) {
    forEachAccumulated_1(events, accumulateTwoPhaseDispatchesSingle);
}

function accumulateTwoPhaseDispatchesSkipTarget(events) {
    forEachAccumulated_1(events, accumulateTwoPhaseDispatchesSingleSkipTarget);
}

function accumulateEnterLeaveDispatches(leave, enter, from, to) {
    ReactTreeTraversal.traverseEnterLeave(from, to, accumulateDispatches, leave, enter);
}

function accumulateDirectDispatches(events) {
    forEachAccumulated_1(events, accumulateDirectDispatchesSingle);
}

var EventPropagators = {
    accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
    accumulateTwoPhaseDispatchesSkipTarget: accumulateTwoPhaseDispatchesSkipTarget,
    accumulateDirectDispatches: accumulateDirectDispatches,
    accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches
}, EventPropagators_1 = EventPropagators, oneArgumentPooler = function(copyFieldsFrom) {
    var Klass = this;
    if (Klass.instancePool.length) {
        var instance = Klass.instancePool.pop();
        return Klass.call(instance, copyFieldsFrom), instance;
    }
    return new Klass(copyFieldsFrom);
}, twoArgumentPooler = function(a1, a2) {
    var Klass = this;
    if (Klass.instancePool.length) {
        var instance = Klass.instancePool.pop();
        return Klass.call(instance, a1, a2), instance;
    }
    return new Klass(a1, a2);
}, threeArgumentPooler = function(a1, a2, a3) {
    var Klass = this;
    if (Klass.instancePool.length) {
        var instance = Klass.instancePool.pop();
        return Klass.call(instance, a1, a2, a3), instance;
    }
    return new Klass(a1, a2, a3);
}, fourArgumentPooler = function(a1, a2, a3, a4) {
    var Klass = this;
    if (Klass.instancePool.length) {
        var instance = Klass.instancePool.pop();
        return Klass.call(instance, a1, a2, a3, a4), instance;
    }
    return new Klass(a1, a2, a3, a4);
}, standardReleaser = function(instance) {
    var Klass = this;
    invariant(instance instanceof Klass, "Trying to release an instance into a pool of a different type."), 
    instance.destructor(), Klass.instancePool.length < Klass.poolSize && Klass.instancePool.push(instance);
}, DEFAULT_POOL_SIZE = 10, DEFAULT_POOLER = oneArgumentPooler, addPoolingTo = function(CopyConstructor, pooler) {
    var NewKlass = CopyConstructor;
    return NewKlass.instancePool = [], NewKlass.getPooled = pooler || DEFAULT_POOLER, 
    NewKlass.poolSize || (NewKlass.poolSize = DEFAULT_POOL_SIZE), NewKlass.release = standardReleaser, 
    NewKlass;
}, PooledClass = {
    addPoolingTo: addPoolingTo,
    oneArgumentPooler: oneArgumentPooler,
    twoArgumentPooler: twoArgumentPooler,
    threeArgumentPooler: threeArgumentPooler,
    fourArgumentPooler: fourArgumentPooler
}, PooledClass_1 = PooledClass, didWarnForAddedNewProperty = !1, isProxySupported = "function" == typeof Proxy, shouldBeReleasedProperties = [ "dispatchConfig", "_targetInst", "nativeEvent", "isDefaultPrevented", "isPropagationStopped", "_dispatchListeners", "_dispatchInstances" ], EventInterface = {
    type: null,
    target: null,
    currentTarget: emptyFunction.thatReturnsNull,
    eventPhase: null,
    bubbles: null,
    cancelable: null,
    timeStamp: function(event) {
        return event.timeStamp || Date.now();
    },
    defaultPrevented: null,
    isTrusted: null
};

function SyntheticEvent(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
    delete this.nativeEvent, delete this.preventDefault, delete this.stopPropagation, 
    this.dispatchConfig = dispatchConfig, this._targetInst = targetInst, this.nativeEvent = nativeEvent;
    var Interface = this.constructor.Interface;
    for (var propName in Interface) if (Interface.hasOwnProperty(propName)) {
        delete this[propName];
        var normalize = Interface[propName];
        normalize ? this[propName] = normalize(nativeEvent) : "target" === propName ? this.target = nativeEventTarget : this[propName] = nativeEvent[propName];
    }
    var defaultPrevented = null != nativeEvent.defaultPrevented ? nativeEvent.defaultPrevented : !1 === nativeEvent.returnValue;
    return this.isDefaultPrevented = defaultPrevented ? emptyFunction.thatReturnsTrue : emptyFunction.thatReturnsFalse, 
    this.isPropagationStopped = emptyFunction.thatReturnsFalse, this;
}

Object.assign(SyntheticEvent.prototype, {
    preventDefault: function() {
        this.defaultPrevented = !0;
        var event = this.nativeEvent;
        event && (event.preventDefault ? event.preventDefault() : "unknown" != typeof event.returnValue && (event.returnValue = !1), 
        this.isDefaultPrevented = emptyFunction.thatReturnsTrue);
    },
    stopPropagation: function() {
        var event = this.nativeEvent;
        event && (event.stopPropagation ? event.stopPropagation() : "unknown" != typeof event.cancelBubble && (event.cancelBubble = !0), 
        this.isPropagationStopped = emptyFunction.thatReturnsTrue);
    },
    persist: function() {
        this.isPersistent = emptyFunction.thatReturnsTrue;
    },
    isPersistent: emptyFunction.thatReturnsFalse,
    destructor: function() {
        var Interface = this.constructor.Interface;
        for (var propName in Interface) Object.defineProperty(this, propName, getPooledWarningPropertyDefinition(propName, Interface[propName]));
        for (var i = 0; i < shouldBeReleasedProperties.length; i++) this[shouldBeReleasedProperties[i]] = null;
        Object.defineProperty(this, "nativeEvent", getPooledWarningPropertyDefinition("nativeEvent", null)), 
        Object.defineProperty(this, "preventDefault", getPooledWarningPropertyDefinition("preventDefault", emptyFunction)), 
        Object.defineProperty(this, "stopPropagation", getPooledWarningPropertyDefinition("stopPropagation", emptyFunction));
    }
}), SyntheticEvent.Interface = EventInterface, SyntheticEvent.augmentClass = function(Class, Interface) {
    var Super = this, E = function() {};
    E.prototype = Super.prototype;
    var prototype = new E();
    Object.assign(prototype, Class.prototype), Class.prototype = prototype, Class.prototype.constructor = Class, 
    Class.Interface = Object.assign({}, Super.Interface, Interface), Class.augmentClass = Super.augmentClass, 
    PooledClass_1.addPoolingTo(Class, PooledClass_1.fourArgumentPooler);
}, isProxySupported && (SyntheticEvent = new Proxy(SyntheticEvent, {
    construct: function(target, args) {
        return this.apply(target, Object.create(target.prototype), args);
    },
    apply: function(constructor, that, args) {
        return new Proxy(constructor.apply(that, args), {
            set: function(target, prop, value) {
                return "isPersistent" === prop || target.constructor.Interface.hasOwnProperty(prop) || -1 !== shouldBeReleasedProperties.indexOf(prop) || (warning(didWarnForAddedNewProperty || target.isPersistent(), "This synthetic event is reused for performance reasons. If you're " + "seeing this, you're adding a new property in the synthetic event object. " + "The property is never released. See " + "https://fb.me/react-event-pooling for more information."), 
                didWarnForAddedNewProperty = !0), target[prop] = value, !0;
            }
        });
    }
})), PooledClass_1.addPoolingTo(SyntheticEvent, PooledClass_1.fourArgumentPooler);

var SyntheticEvent_1 = SyntheticEvent;

function getPooledWarningPropertyDefinition(propName, getVal) {
    var isFunction = "function" == typeof getVal;
    return {
        configurable: !0,
        set: set,
        get: get
    };
    function set(val) {
        return warn(isFunction ? "setting the method" : "setting the property", "This is effectively a no-op"), 
        val;
    }
    function get() {
        return warn(isFunction ? "accessing the method" : "accessing the property", isFunction ? "This is a no-op function" : "This is set to null"), 
        getVal;
    }
    function warn(action, result) {
        warning(!1, "This synthetic event is reused for performance reasons. If you're seeing this, " + "you're %s `%s` on a released/nullified synthetic event. %s. " + "If you must keep the original synthetic event around, use event.persist(). " + "See https://fb.me/react-event-pooling for more information.", action, propName, result);
    }
}

var _extends = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
    }
    return target;
}, customBubblingEventTypes = UIManager.customBubblingEventTypes, customDirectEventTypes = UIManager.customDirectEventTypes, allTypesByEventName = {};

for (var bubblingTypeName in customBubblingEventTypes) allTypesByEventName[bubblingTypeName] = customBubblingEventTypes[bubblingTypeName];

for (var directTypeName in customDirectEventTypes) warning(!customBubblingEventTypes[directTypeName], "Event cannot be both direct and bubbling: %s", directTypeName), 
allTypesByEventName[directTypeName] = customDirectEventTypes[directTypeName];

var ReactNativeBridgeEventPlugin = {
    eventTypes: _extends({}, customBubblingEventTypes, customDirectEventTypes),
    extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        var bubbleDispatchConfig = customBubblingEventTypes[topLevelType], directDispatchConfig = customDirectEventTypes[topLevelType], event = SyntheticEvent_1.getPooled(bubbleDispatchConfig || directDispatchConfig, targetInst, nativeEvent, nativeEventTarget);
        if (bubbleDispatchConfig) EventPropagators_1.accumulateTwoPhaseDispatches(event); else {
            if (!directDispatchConfig) return null;
            EventPropagators_1.accumulateDirectDispatches(event);
        }
        return event;
    }
}, ReactNativeBridgeEventPlugin_1 = ReactNativeBridgeEventPlugin;

function runEventQueueInBatch(events) {
    EventPluginHub_1.enqueueEvents(events), EventPluginHub_1.processEventQueue(!1);
}

var ReactEventEmitterMixin = {
    handleTopLevel: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        runEventQueueInBatch(EventPluginHub_1.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget));
    }
}, ReactEventEmitterMixin_1 = ReactEventEmitterMixin, INITIAL_TAG_COUNT = 1, ReactNativeTagHandles = {
    tagsStartAt: INITIAL_TAG_COUNT,
    tagCount: INITIAL_TAG_COUNT,
    allocateTag: function() {
        for (;this.reactTagIsNativeTopRootID(ReactNativeTagHandles.tagCount); ) ReactNativeTagHandles.tagCount++;
        var tag = ReactNativeTagHandles.tagCount;
        return ReactNativeTagHandles.tagCount++, tag;
    },
    assertRootTag: function(tag) {
        invariant(this.reactTagIsNativeTopRootID(tag), "Expect a native root tag, instead got %s", tag);
    },
    reactTagIsNativeTopRootID: function(reactTag) {
        return reactTag % 10 == 1;
    }
}, ReactNativeTagHandles_1 = ReactNativeTagHandles, fiberHostComponent = null, ReactControlledComponentInjection = {
    injectFiberControlledHostComponent: function(hostComponentImpl) {
        fiberHostComponent = hostComponentImpl;
    }
}, restoreTarget = null, restoreQueue = null;

function restoreStateOfTarget(target) {
    var internalInstance = EventPluginUtils_1.getInstanceFromNode(target);
    if (internalInstance) {
        if ("number" == typeof internalInstance.tag) {
            invariant(fiberHostComponent && "function" == typeof fiberHostComponent.restoreControlledState, "Fiber needs to be injected to handle a fiber target for controlled " + "events.");
            var props = EventPluginUtils_1.getFiberCurrentPropsFromNode(internalInstance.stateNode);
            return void fiberHostComponent.restoreControlledState(internalInstance.stateNode, internalInstance.type, props);
        }
        invariant("function" == typeof internalInstance.restoreControlledState, "The internal instance must be a React host component."), 
        internalInstance.restoreControlledState();
    }
}

var ReactControlledComponent = {
    injection: ReactControlledComponentInjection,
    enqueueStateRestore: function(target) {
        restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [ target ] : restoreTarget = target;
    },
    restoreStateIfNeeded: function() {
        if (restoreTarget) {
            var target = restoreTarget, queuedTargets = restoreQueue;
            if (restoreTarget = null, restoreQueue = null, restoreStateOfTarget(target), queuedTargets) for (var i = 0; i < queuedTargets.length; i++) restoreStateOfTarget(queuedTargets[i]);
        }
    }
}, ReactControlledComponent_1 = ReactControlledComponent, stackBatchedUpdates = function(fn, a, b, c, d, e) {
    return fn(a, b, c, d, e);
}, fiberBatchedUpdates = function(fn, bookkeeping) {
    return fn(bookkeeping);
};

function performFiberBatchedUpdates(fn, bookkeeping) {
    return fiberBatchedUpdates(fn, bookkeeping);
}

function batchedUpdates(fn, bookkeeping) {
    return stackBatchedUpdates(performFiberBatchedUpdates, fn, bookkeeping);
}

var isNestingBatched = !1;

function batchedUpdatesWithControlledComponents(fn, bookkeeping) {
    if (isNestingBatched) return batchedUpdates(fn, bookkeeping);
    isNestingBatched = !0;
    try {
        return batchedUpdates(fn, bookkeeping);
    } finally {
        isNestingBatched = !1, ReactControlledComponent_1.restoreStateIfNeeded();
    }
}

var ReactGenericBatchingInjection = {
    injectStackBatchedUpdates: function(_batchedUpdates) {
        stackBatchedUpdates = _batchedUpdates;
    },
    injectFiberBatchedUpdates: function(_batchedUpdates) {
        fiberBatchedUpdates = _batchedUpdates;
    }
}, ReactGenericBatching = {
    batchedUpdates: batchedUpdatesWithControlledComponents,
    injection: ReactGenericBatchingInjection
}, ReactGenericBatching_1 = ReactGenericBatching, _extends$1 = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
    }
    return target;
}, EMPTY_NATIVE_EVENT = {}, touchSubsequence = function(touches, indices) {
    for (var ret = [], i = 0; i < indices.length; i++) ret.push(touches[indices[i]]);
    return ret;
}, removeTouchesAtIndices = function(touches, indices) {
    for (var rippedOut = [], temp = touches, i = 0; i < indices.length; i++) {
        var index = indices[i];
        rippedOut.push(touches[index]), temp[index] = null;
    }
    for (var fillAt = 0, j = 0; j < temp.length; j++) {
        var cur = temp[j];
        null !== cur && (temp[fillAt++] = cur);
    }
    return temp.length = fillAt, rippedOut;
}, ReactNativeEventEmitter = _extends$1({}, ReactEventEmitterMixin_1, {
    registrationNames: EventPluginRegistry_1.registrationNameModules,
    getListener: EventPluginHub_1.getListener,
    _receiveRootNodeIDEvent: function(rootNodeID, topLevelType, nativeEventParam) {
        var nativeEvent = nativeEventParam || EMPTY_NATIVE_EVENT, inst = ReactNativeComponentTree_1.getInstanceFromNode(rootNodeID);
        ReactGenericBatching_1.batchedUpdates(function() {
            ReactNativeEventEmitter.handleTopLevel(topLevelType, inst, nativeEvent, nativeEvent.target);
        });
    },
    receiveEvent: function(tag, topLevelType, nativeEventParam) {
        var rootNodeID = tag;
        ReactNativeEventEmitter._receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam);
    },
    receiveTouches: function(eventTopLevelType, touches, changedIndices) {
        for (var changedTouches = "topTouchEnd" === eventTopLevelType || "topTouchCancel" === eventTopLevelType ? removeTouchesAtIndices(touches, changedIndices) : touchSubsequence(touches, changedIndices), jj = 0; jj < changedTouches.length; jj++) {
            var touch = changedTouches[jj];
            touch.changedTouches = changedTouches, touch.touches = touches;
            var nativeEvent = touch, rootNodeID = null, target = nativeEvent.target;
            null !== target && void 0 !== target && (target < ReactNativeTagHandles_1.tagsStartAt ? warning(!1, "A view is reporting that a touch occurred on tag zero.") : rootNodeID = target), 
            ReactNativeEventEmitter._receiveRootNodeIDEvent(rootNodeID, eventTopLevelType, nativeEvent);
        }
    }
}), ReactNativeEventEmitter_1 = ReactNativeEventEmitter, ReactNativeEventPluginOrder = [ "ResponderEventPlugin", "ReactNativeBridgeEventPlugin" ], ReactNativeEventPluginOrder_1 = ReactNativeEventPluginOrder, ReactNativeGlobalResponderHandler = {
    onChange: function(from, to, blockNativeResponder) {
        if (null !== to) {
            var tag = "number" != typeof to.tag ? to._rootNodeID : to.stateNode._nativeTag;
            UIManager.setJSResponder(tag, blockNativeResponder);
        } else UIManager.clearJSResponder();
    }
}, ReactNativeGlobalResponderHandler_1 = ReactNativeGlobalResponderHandler, ResponderEventInterface = {
    touchHistory: function(nativeEvent) {
        return null;
    }
};

function ResponderSyntheticEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
    return SyntheticEvent_1.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticEvent_1.augmentClass(ResponderSyntheticEvent, ResponderEventInterface);

var ResponderSyntheticEvent_1 = ResponderSyntheticEvent, isEndish$2 = EventPluginUtils_1.isEndish, isMoveish$2 = EventPluginUtils_1.isMoveish, isStartish$2 = EventPluginUtils_1.isStartish, MAX_TOUCH_BANK = 20, touchBank = [], touchHistory = {
    touchBank: touchBank,
    numberActiveTouches: 0,
    indexOfSingleActiveTouch: -1,
    mostRecentTimeStamp: 0
};

function timestampForTouch(touch) {
    return touch.timeStamp || touch.timestamp;
}

function createTouchRecord(touch) {
    return {
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
    };
}

function resetTouchRecord(touchRecord, touch) {
    touchRecord.touchActive = !0, touchRecord.startPageX = touch.pageX, touchRecord.startPageY = touch.pageY, 
    touchRecord.startTimeStamp = timestampForTouch(touch), touchRecord.currentPageX = touch.pageX, 
    touchRecord.currentPageY = touch.pageY, touchRecord.currentTimeStamp = timestampForTouch(touch), 
    touchRecord.previousPageX = touch.pageX, touchRecord.previousPageY = touch.pageY, 
    touchRecord.previousTimeStamp = timestampForTouch(touch);
}

function getTouchIdentifier(_ref) {
    var identifier = _ref.identifier;
    return invariant(null != identifier, "Touch object is missing identifier."), warning(identifier <= MAX_TOUCH_BANK, "Touch identifier %s is greater than maximum supported %s which causes " + "performance issues backfilling array locations for all of the indices.", identifier, MAX_TOUCH_BANK), 
    identifier;
}

function recordTouchStart(touch) {
    var identifier = getTouchIdentifier(touch), touchRecord = touchBank[identifier];
    touchRecord ? resetTouchRecord(touchRecord, touch) : touchBank[identifier] = createTouchRecord(touch), 
    touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
}

function recordTouchMove(touch) {
    var touchRecord = touchBank[getTouchIdentifier(touch)];
    touchRecord ? (touchRecord.touchActive = !0, touchRecord.previousPageX = touchRecord.currentPageX, 
    touchRecord.previousPageY = touchRecord.currentPageY, touchRecord.previousTimeStamp = touchRecord.currentTimeStamp, 
    touchRecord.currentPageX = touch.pageX, touchRecord.currentPageY = touch.pageY, 
    touchRecord.currentTimeStamp = timestampForTouch(touch), touchHistory.mostRecentTimeStamp = timestampForTouch(touch)) : console.error("Cannot record touch move without a touch start.\n" + "Touch Move: %s\n", "Touch Bank: %s", printTouch(touch), printTouchBank());
}

function recordTouchEnd(touch) {
    var touchRecord = touchBank[getTouchIdentifier(touch)];
    touchRecord ? (touchRecord.touchActive = !1, touchRecord.previousPageX = touchRecord.currentPageX, 
    touchRecord.previousPageY = touchRecord.currentPageY, touchRecord.previousTimeStamp = touchRecord.currentTimeStamp, 
    touchRecord.currentPageX = touch.pageX, touchRecord.currentPageY = touch.pageY, 
    touchRecord.currentTimeStamp = timestampForTouch(touch), touchHistory.mostRecentTimeStamp = timestampForTouch(touch)) : console.error("Cannot record touch end without a touch start.\n" + "Touch End: %s\n", "Touch Bank: %s", printTouch(touch), printTouchBank());
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
    return touchBank.length > MAX_TOUCH_BANK && (printed += " (original size: " + touchBank.length + ")"), 
    printed;
}

var ResponderTouchHistoryStore = {
    recordTouchTrack: function(topLevelType, nativeEvent) {
        if (isMoveish$2(topLevelType)) nativeEvent.changedTouches.forEach(recordTouchMove); else if (isStartish$2(topLevelType)) nativeEvent.changedTouches.forEach(recordTouchStart), 
        touchHistory.numberActiveTouches = nativeEvent.touches.length, 1 === touchHistory.numberActiveTouches && (touchHistory.indexOfSingleActiveTouch = nativeEvent.touches[0].identifier); else if (isEndish$2(topLevelType) && (nativeEvent.changedTouches.forEach(recordTouchEnd), 
        touchHistory.numberActiveTouches = nativeEvent.touches.length, 1 === touchHistory.numberActiveTouches)) {
            for (var i = 0; i < touchBank.length; i++) {
                var touchTrackToCheck = touchBank[i];
                if (null != touchTrackToCheck && touchTrackToCheck.touchActive) {
                    touchHistory.indexOfSingleActiveTouch = i;
                    break;
                }
            }
            var activeRecord = touchBank[touchHistory.indexOfSingleActiveTouch];
            warning(null != activeRecord && activeRecord.touchActive, "Cannot find single active touch.");
        }
    },
    touchHistory: touchHistory
}, ResponderTouchHistoryStore_1 = ResponderTouchHistoryStore;

function accumulate(current, next) {
    return invariant(null != next, "accumulate(...): Accumulated items must be not be null or undefined."), 
    null == current ? next : Array.isArray(current) ? current.concat(next) : Array.isArray(next) ? [ current ].concat(next) : [ current, next ];
}

var accumulate_1 = accumulate, isStartish$1 = EventPluginUtils_1.isStartish, isMoveish$1 = EventPluginUtils_1.isMoveish, isEndish$1 = EventPluginUtils_1.isEndish, executeDirectDispatch$1 = EventPluginUtils_1.executeDirectDispatch, hasDispatches$1 = EventPluginUtils_1.hasDispatches, executeDispatchesInOrderStopAtTrue$1 = EventPluginUtils_1.executeDispatchesInOrderStopAtTrue, responderInst = null, trackedTouchCount = 0, previousActiveTouches = 0, changeResponder = function(nextResponderInst, blockHostResponder) {
    var oldResponderInst = responderInst;
    responderInst = nextResponderInst, null !== ResponderEventPlugin.GlobalResponderHandler && ResponderEventPlugin.GlobalResponderHandler.onChange(oldResponderInst, nextResponderInst, blockHostResponder);
}, eventTypes = {
    startShouldSetResponder: {
        phasedRegistrationNames: {
            bubbled: "onStartShouldSetResponder",
            captured: "onStartShouldSetResponderCapture"
        }
    },
    scrollShouldSetResponder: {
        phasedRegistrationNames: {
            bubbled: "onScrollShouldSetResponder",
            captured: "onScrollShouldSetResponderCapture"
        }
    },
    selectionChangeShouldSetResponder: {
        phasedRegistrationNames: {
            bubbled: "onSelectionChangeShouldSetResponder",
            captured: "onSelectionChangeShouldSetResponderCapture"
        }
    },
    moveShouldSetResponder: {
        phasedRegistrationNames: {
            bubbled: "onMoveShouldSetResponder",
            captured: "onMoveShouldSetResponderCapture"
        }
    },
    responderStart: {
        registrationName: "onResponderStart"
    },
    responderMove: {
        registrationName: "onResponderMove"
    },
    responderEnd: {
        registrationName: "onResponderEnd"
    },
    responderRelease: {
        registrationName: "onResponderRelease"
    },
    responderTerminationRequest: {
        registrationName: "onResponderTerminationRequest"
    },
    responderGrant: {
        registrationName: "onResponderGrant"
    },
    responderReject: {
        registrationName: "onResponderReject"
    },
    responderTerminate: {
        registrationName: "onResponderTerminate"
    }
};

function setResponderAndExtractTransfer(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var shouldSetEventType = isStartish$1(topLevelType) ? eventTypes.startShouldSetResponder : isMoveish$1(topLevelType) ? eventTypes.moveShouldSetResponder : "topSelectionChange" === topLevelType ? eventTypes.selectionChangeShouldSetResponder : eventTypes.scrollShouldSetResponder, bubbleShouldSetFrom = responderInst ? ReactTreeTraversal.getLowestCommonAncestor(responderInst, targetInst) : targetInst, skipOverBubbleShouldSetFrom = bubbleShouldSetFrom === responderInst, shouldSetEvent = ResponderSyntheticEvent_1.getPooled(shouldSetEventType, bubbleShouldSetFrom, nativeEvent, nativeEventTarget);
    shouldSetEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, skipOverBubbleShouldSetFrom ? EventPropagators_1.accumulateTwoPhaseDispatchesSkipTarget(shouldSetEvent) : EventPropagators_1.accumulateTwoPhaseDispatches(shouldSetEvent);
    var wantsResponderInst = executeDispatchesInOrderStopAtTrue$1(shouldSetEvent);
    if (shouldSetEvent.isPersistent() || shouldSetEvent.constructor.release(shouldSetEvent), 
    !wantsResponderInst || wantsResponderInst === responderInst) return null;
    var extracted, grantEvent = ResponderSyntheticEvent_1.getPooled(eventTypes.responderGrant, wantsResponderInst, nativeEvent, nativeEventTarget);
    grantEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(grantEvent);
    var blockHostResponder = !0 === executeDirectDispatch$1(grantEvent);
    if (responderInst) {
        var terminationRequestEvent = ResponderSyntheticEvent_1.getPooled(eventTypes.responderTerminationRequest, responderInst, nativeEvent, nativeEventTarget);
        terminationRequestEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, 
        EventPropagators_1.accumulateDirectDispatches(terminationRequestEvent);
        var shouldSwitch = !hasDispatches$1(terminationRequestEvent) || executeDirectDispatch$1(terminationRequestEvent);
        if (terminationRequestEvent.isPersistent() || terminationRequestEvent.constructor.release(terminationRequestEvent), 
        shouldSwitch) {
            var terminateEvent = ResponderSyntheticEvent_1.getPooled(eventTypes.responderTerminate, responderInst, nativeEvent, nativeEventTarget);
            terminateEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(terminateEvent), 
            extracted = accumulate_1(extracted, [ grantEvent, terminateEvent ]), changeResponder(wantsResponderInst, blockHostResponder);
        } else {
            var rejectEvent = ResponderSyntheticEvent_1.getPooled(eventTypes.responderReject, wantsResponderInst, nativeEvent, nativeEventTarget);
            rejectEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(rejectEvent), 
            extracted = accumulate_1(extracted, rejectEvent);
        }
    } else extracted = accumulate_1(extracted, grantEvent), changeResponder(wantsResponderInst, blockHostResponder);
    return extracted;
}

function canTriggerTransfer(topLevelType, topLevelInst, nativeEvent) {
    return topLevelInst && ("topScroll" === topLevelType && !nativeEvent.responderIgnoreScroll || trackedTouchCount > 0 && "topSelectionChange" === topLevelType || isStartish$1(topLevelType) || isMoveish$1(topLevelType));
}

function noResponderTouches(nativeEvent) {
    var touches = nativeEvent.touches;
    if (!touches || 0 === touches.length) return !0;
    for (var i = 0; i < touches.length; i++) {
        var activeTouch = touches[i], target = activeTouch.target;
        if (null !== target && void 0 !== target && 0 !== target) {
            var targetInst = EventPluginUtils_1.getInstanceFromNode(target);
            if (ReactTreeTraversal.isAncestor(responderInst, targetInst)) return !1;
        }
    }
    return !0;
}

var ResponderEventPlugin = {
    _getResponder: function() {
        return responderInst;
    },
    eventTypes: eventTypes,
    extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        if (isStartish$1(topLevelType)) trackedTouchCount += 1; else if (isEndish$1(topLevelType)) {
            if (!(trackedTouchCount >= 0)) return console.error("Ended a touch event which was not counted in `trackedTouchCount`."), 
            null;
            trackedTouchCount -= 1;
        }
        ResponderTouchHistoryStore_1.recordTouchTrack(topLevelType, nativeEvent);
        var extracted = canTriggerTransfer(topLevelType, targetInst, nativeEvent) ? setResponderAndExtractTransfer(topLevelType, targetInst, nativeEvent, nativeEventTarget) : null, isResponderTouchStart = responderInst && isStartish$1(topLevelType), isResponderTouchMove = responderInst && isMoveish$1(topLevelType), isResponderTouchEnd = responderInst && isEndish$1(topLevelType), incrementalTouch = isResponderTouchStart ? eventTypes.responderStart : isResponderTouchMove ? eventTypes.responderMove : isResponderTouchEnd ? eventTypes.responderEnd : null;
        if (incrementalTouch) {
            var gesture = ResponderSyntheticEvent_1.getPooled(incrementalTouch, responderInst, nativeEvent, nativeEventTarget);
            gesture.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(gesture), 
            extracted = accumulate_1(extracted, gesture);
        }
        var isResponderTerminate = responderInst && "topTouchCancel" === topLevelType, isResponderRelease = responderInst && !isResponderTerminate && isEndish$1(topLevelType) && noResponderTouches(nativeEvent), finalTouch = isResponderTerminate ? eventTypes.responderTerminate : isResponderRelease ? eventTypes.responderRelease : null;
        if (finalTouch) {
            var finalEvent = ResponderSyntheticEvent_1.getPooled(finalTouch, responderInst, nativeEvent, nativeEventTarget);
            finalEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(finalEvent), 
            extracted = accumulate_1(extracted, finalEvent), changeResponder(null);
        }
        var numberActiveTouches = ResponderTouchHistoryStore_1.touchHistory.numberActiveTouches;
        return ResponderEventPlugin.GlobalInteractionHandler && numberActiveTouches !== previousActiveTouches && ResponderEventPlugin.GlobalInteractionHandler.onChange(numberActiveTouches), 
        previousActiveTouches = numberActiveTouches, extracted;
    },
    GlobalResponderHandler: null,
    GlobalInteractionHandler: null,
    injection: {
        injectGlobalResponderHandler: function(GlobalResponderHandler) {
            ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
        },
        injectGlobalInteractionHandler: function(GlobalInteractionHandler) {
            ResponderEventPlugin.GlobalInteractionHandler = GlobalInteractionHandler;
        }
    }
}, ResponderEventPlugin_1 = ResponderEventPlugin;

function inject() {
    RCTEventEmitter.register(ReactNativeEventEmitter_1), EventPluginHub_1.injection.injectEventPluginOrder(ReactNativeEventPluginOrder_1), 
    EventPluginUtils_1.injection.injectComponentTree(ReactNativeComponentTree_1), ResponderEventPlugin_1.injection.injectGlobalResponderHandler(ReactNativeGlobalResponderHandler_1), 
    EventPluginHub_1.injection.injectEventPluginsByName({
        ResponderEventPlugin: ResponderEventPlugin_1,
        ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin_1
    });
}

var ReactNativeInjection = {
    inject: inject
}, ReactInvalidSetStateWarningHook = {}, processingChildContext = !1, warnInvalidSetState = function() {
    warning(!processingChildContext, "setState(...): Cannot call setState() inside getChildContext()");
};

ReactInvalidSetStateWarningHook = {
    onBeginProcessingChildContext: function() {
        processingChildContext = !0;
    },
    onEndProcessingChildContext: function() {
        processingChildContext = !1;
    },
    onSetState: function() {
        warnInvalidSetState();
    }
};

var ReactInvalidSetStateWarningHook_1 = ReactInvalidSetStateWarningHook, ReactHostOperationHistoryHook = null, history = [];

ReactHostOperationHistoryHook = {
    onHostOperation: function(operation) {
        history.push(operation);
    },
    clearHistory: function() {
        ReactHostOperationHistoryHook._preventClearing || (history = []);
    },
    getHistory: function() {
        return history;
    }
};

var ReactHostOperationHistoryHook_1 = ReactHostOperationHistoryHook, ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, ReactGlobalSharedState = {
    ReactCurrentOwner: ReactInternals.ReactCurrentOwner
};

Object.assign(ReactGlobalSharedState, {
    ReactComponentTreeHook: ReactInternals.ReactComponentTreeHook,
    ReactDebugCurrentFrame: ReactInternals.ReactDebugCurrentFrame
});

var ReactGlobalSharedState_1 = ReactGlobalSharedState, ReactComponentTreeHook = ReactGlobalSharedState_1.ReactComponentTreeHook, ReactDebugTool$1 = null, hooks = [], didHookThrowForEvent = {}, callHook = function(event, fn, context, arg1, arg2, arg3, arg4, arg5) {
    try {
        fn.call(context, arg1, arg2, arg3, arg4, arg5);
    } catch (e) {
        warning(didHookThrowForEvent[event], "Exception thrown by hook while handling %s: %s", event, e + "\n" + e.stack), 
        didHookThrowForEvent[event] = !0;
    }
}, emitEvent = function(event, arg1, arg2, arg3, arg4, arg5) {
    for (var i = 0; i < hooks.length; i++) {
        var hook = hooks[i], fn = hook[event];
        fn && callHook(event, fn, hook, arg1, arg2, arg3, arg4, arg5);
    }
}, isProfiling = !1, flushHistory = [], lifeCycleTimerStack = [], currentFlushNesting = 0, currentFlushMeasurements = [], currentFlushStartTime = 0, currentTimerDebugID = null, currentTimerStartTime = 0, currentTimerNestedFlushDuration = 0, currentTimerType = null, lifeCycleTimerHasWarned = !1, clearHistory = function() {
    ReactComponentTreeHook.purgeUnmountedComponents(), ReactHostOperationHistoryHook_1.clearHistory();
}, getTreeSnapshot = function(registeredIDs) {
    return registeredIDs.reduce(function(tree, id) {
        var ownerID = ReactComponentTreeHook.getOwnerID(id), parentID = ReactComponentTreeHook.getParentID(id);
        return tree[id] = {
            displayName: ReactComponentTreeHook.getDisplayName(id),
            text: ReactComponentTreeHook.getText(id),
            updateCount: ReactComponentTreeHook.getUpdateCount(id),
            childIDs: ReactComponentTreeHook.getChildIDs(id),
            ownerID: ownerID || parentID && ReactComponentTreeHook.getOwnerID(parentID) || 0,
            parentID: parentID
        }, tree;
    }, {});
}, resetMeasurements = function() {
    var previousStartTime = currentFlushStartTime, previousMeasurements = currentFlushMeasurements, previousOperations = ReactHostOperationHistoryHook_1.getHistory();
    if (0 === currentFlushNesting) return currentFlushStartTime = 0, currentFlushMeasurements = [], 
    void clearHistory();
    if (previousMeasurements.length || previousOperations.length) {
        var registeredIDs = ReactComponentTreeHook.getRegisteredIDs();
        flushHistory.push({
            duration: performanceNow() - previousStartTime,
            measurements: previousMeasurements || [],
            operations: previousOperations || [],
            treeSnapshot: getTreeSnapshot(registeredIDs)
        });
    }
    clearHistory(), currentFlushStartTime = performanceNow(), currentFlushMeasurements = [];
}, checkDebugID = function(debugID) {
    arguments.length > 1 && void 0 !== arguments[1] && arguments[1] && 0 === debugID || debugID || warning(!1, "ReactDebugTool: debugID may not be empty.");
}, beginLifeCycleTimer = function(debugID, timerType) {
    0 !== currentFlushNesting && (currentTimerType && !lifeCycleTimerHasWarned && (warning(!1, "There is an internal error in the React performance measurement code." + "\n\nDid not expect %s timer to start while %s timer is still in " + "progress for %s instance.", timerType, currentTimerType || "no", debugID === currentTimerDebugID ? "the same" : "another"), 
    lifeCycleTimerHasWarned = !0), currentTimerStartTime = performanceNow(), currentTimerNestedFlushDuration = 0, 
    currentTimerDebugID = debugID, currentTimerType = timerType);
}, endLifeCycleTimer = function(debugID, timerType) {
    0 !== currentFlushNesting && (currentTimerType === timerType || lifeCycleTimerHasWarned || (warning(!1, "There is an internal error in the React performance measurement code. " + "We did not expect %s timer to stop while %s timer is still in " + "progress for %s instance. Please report this as a bug in React.", timerType, currentTimerType || "no", debugID === currentTimerDebugID ? "the same" : "another"), 
    lifeCycleTimerHasWarned = !0), isProfiling && currentFlushMeasurements.push({
        timerType: timerType,
        instanceID: debugID,
        duration: performanceNow() - currentTimerStartTime - currentTimerNestedFlushDuration
    }), currentTimerStartTime = 0, currentTimerNestedFlushDuration = 0, currentTimerDebugID = null, 
    currentTimerType = null);
}, pauseCurrentLifeCycleTimer = function() {
    var currentTimer = {
        startTime: currentTimerStartTime,
        nestedFlushStartTime: performanceNow(),
        debugID: currentTimerDebugID,
        timerType: currentTimerType
    };
    lifeCycleTimerStack.push(currentTimer), currentTimerStartTime = 0, currentTimerNestedFlushDuration = 0, 
    currentTimerDebugID = null, currentTimerType = null;
}, resumeCurrentLifeCycleTimer = function() {
    var _lifeCycleTimerStack$ = lifeCycleTimerStack.pop(), startTime = _lifeCycleTimerStack$.startTime, nestedFlushStartTime = _lifeCycleTimerStack$.nestedFlushStartTime, debugID = _lifeCycleTimerStack$.debugID, timerType = _lifeCycleTimerStack$.timerType, nestedFlushDuration = performanceNow() - nestedFlushStartTime;
    currentTimerStartTime = startTime, currentTimerNestedFlushDuration += nestedFlushDuration, 
    currentTimerDebugID = debugID, currentTimerType = timerType;
}, lastMarkTimeStamp = 0, canUsePerformanceMeasure = "undefined" != typeof performance && "function" == typeof performance.mark && "function" == typeof performance.clearMarks && "function" == typeof performance.measure && "function" == typeof performance.clearMeasures, shouldMark = function(debugID) {
    if (!isProfiling || !canUsePerformanceMeasure) return !1;
    var element = ReactComponentTreeHook.getElement(debugID);
    return null != element && "object" == typeof element && !("string" == typeof element.type);
}, markBegin = function(debugID, markType) {
    if (shouldMark(debugID)) {
        var markName = debugID + "::" + markType;
        lastMarkTimeStamp = performanceNow(), performance.mark(markName);
    }
}, markEnd = function(debugID, markType) {
    if (shouldMark(debugID)) {
        var markName = debugID + "::" + markType, displayName = ReactComponentTreeHook.getDisplayName(debugID) || "Unknown";
        if (performanceNow() - lastMarkTimeStamp > .1) {
            var measurementName = displayName + " [" + markType + "]";
            performance.measure(measurementName, markName);
        }
        performance.clearMarks(markName), measurementName && performance.clearMeasures(measurementName);
    }
};

ReactDebugTool$1 = {
    addHook: function(hook) {
        hooks.push(hook);
    },
    removeHook: function(hook) {
        for (var i = 0; i < hooks.length; i++) hooks[i] === hook && (hooks.splice(i, 1), 
        i--);
    },
    isProfiling: function() {
        return isProfiling;
    },
    beginProfiling: function() {
        isProfiling || (isProfiling = !0, flushHistory.length = 0, resetMeasurements(), 
        ReactDebugTool$1.addHook(ReactHostOperationHistoryHook_1));
    },
    endProfiling: function() {
        isProfiling && (isProfiling = !1, resetMeasurements(), ReactDebugTool$1.removeHook(ReactHostOperationHistoryHook_1));
    },
    getFlushHistory: function() {
        return flushHistory;
    },
    onBeginFlush: function() {
        currentFlushNesting++, resetMeasurements(), pauseCurrentLifeCycleTimer(), emitEvent("onBeginFlush");
    },
    onEndFlush: function() {
        resetMeasurements(), currentFlushNesting--, resumeCurrentLifeCycleTimer(), emitEvent("onEndFlush");
    },
    onBeginLifeCycleTimer: function(debugID, timerType) {
        checkDebugID(debugID), emitEvent("onBeginLifeCycleTimer", debugID, timerType), markBegin(debugID, timerType), 
        beginLifeCycleTimer(debugID, timerType);
    },
    onEndLifeCycleTimer: function(debugID, timerType) {
        checkDebugID(debugID), endLifeCycleTimer(debugID, timerType), markEnd(debugID, timerType), 
        emitEvent("onEndLifeCycleTimer", debugID, timerType);
    },
    onBeginProcessingChildContext: function() {
        emitEvent("onBeginProcessingChildContext");
    },
    onEndProcessingChildContext: function() {
        emitEvent("onEndProcessingChildContext");
    },
    onHostOperation: function(operation) {
        checkDebugID(operation.instanceID), emitEvent("onHostOperation", operation);
    },
    onSetState: function() {
        emitEvent("onSetState");
    },
    onSetChildren: function(debugID, childDebugIDs) {
        checkDebugID(debugID), childDebugIDs.forEach(checkDebugID), emitEvent("onSetChildren", debugID, childDebugIDs);
    },
    onBeforeMountComponent: function(debugID, element, parentDebugID) {
        checkDebugID(debugID), checkDebugID(parentDebugID, !0), emitEvent("onBeforeMountComponent", debugID, element, parentDebugID), 
        markBegin(debugID, "mount");
    },
    onMountComponent: function(debugID) {
        checkDebugID(debugID), markEnd(debugID, "mount"), emitEvent("onMountComponent", debugID);
    },
    onBeforeUpdateComponent: function(debugID, element) {
        checkDebugID(debugID), emitEvent("onBeforeUpdateComponent", debugID, element), markBegin(debugID, "update");
    },
    onUpdateComponent: function(debugID) {
        checkDebugID(debugID), markEnd(debugID, "update"), emitEvent("onUpdateComponent", debugID);
    },
    onBeforeUnmountComponent: function(debugID) {
        checkDebugID(debugID), emitEvent("onBeforeUnmountComponent", debugID), markBegin(debugID, "unmount");
    },
    onUnmountComponent: function(debugID) {
        checkDebugID(debugID), markEnd(debugID, "unmount"), emitEvent("onUnmountComponent", debugID);
    },
    onTestEvent: function() {
        emitEvent("onTestEvent");
    }
}, ReactDebugTool$1.addHook(ReactInvalidSetStateWarningHook_1), ReactDebugTool$1.addHook(ReactComponentTreeHook);

var url = ExecutionEnvironment.canUseDOM && window.location.href || "";

/[?&]react_perf\b/.test(url) && ReactDebugTool$1.beginProfiling();

var ReactDebugTool_1 = ReactDebugTool$1, debugTool = null, ReactDebugTool = ReactDebugTool_1;

debugTool = ReactDebugTool;

var ReactInstrumentation = {
    debugTool: debugTool
};

function ReactNativeContainerInfo(tag) {
    return {
        _tag: tag
    };
}

var ReactNativeContainerInfo_1 = ReactNativeContainerInfo, ClassComponent = ReactTypeOfWork.ClassComponent;

function isValidOwner(object) {
    return !(!object || "function" != typeof object.attachRef || "function" != typeof object.detachRef);
}

var ReactOwner = {
    addComponentAsRefTo: function(component, ref, owner) {
        if (owner && owner.tag === ClassComponent) {
            var inst = owner.stateNode;
            (inst.refs === emptyObject ? inst.refs = {} : inst.refs)[ref] = component.getPublicInstance();
        } else invariant(isValidOwner(owner), "addComponentAsRefTo(...): Only a ReactOwner can have refs. You might " + "be adding a ref to a component that was not created inside a component's " + "`render` method, or you have multiple copies of React loaded " + "(details: https://fb.me/react-refs-must-have-owner)."), 
        owner.attachRef(ref, component);
    },
    removeComponentAsRefFrom: function(component, ref, owner) {
        if (owner && owner.tag === ClassComponent) {
            var inst = owner.stateNode;
            inst && inst.refs[ref] === component.getPublicInstance() && delete inst.refs[ref];
        } else {
            invariant(isValidOwner(owner), "removeComponentAsRefFrom(...): Only a ReactOwner can have refs. You might " + "be removing a ref to a component that was not created inside a component's " + "`render` method, or you have multiple copies of React loaded " + "(details: https://fb.me/react-refs-must-have-owner).");
            var ownerPublicInstance = owner.getPublicInstance();
            ownerPublicInstance && ownerPublicInstance.refs[ref] === component.getPublicInstance() && owner.detachRef(ref);
        }
    }
}, ReactOwner_1 = ReactOwner, ReactCompositeComponentTypes$1 = {
    ImpureClass: 0,
    PureClass: 1,
    StatelessFunctional: 2
}, ReactRef = {}, ReactCompositeComponentTypes = ReactCompositeComponentTypes$1, _require$1 = ReactGlobalSharedState_1, ReactComponentTreeHook$1 = _require$1.ReactComponentTreeHook, warning$2 = warning, warnedAboutStatelessRefs = {};

function attachRef(ref, component, owner) {
    if (component._compositeType === ReactCompositeComponentTypes.StatelessFunctional) {
        var info = "", ownerName = void 0;
        owner && ("function" == typeof owner.getName && (ownerName = owner.getName()), ownerName && (info += "\n\nCheck the render method of `" + ownerName + "`."));
        var warningKey = ownerName || component._debugID, element = component._currentElement;
        element && element._source && (warningKey = element._source.fileName + ":" + element._source.lineNumber), 
        warnedAboutStatelessRefs[warningKey] || (warnedAboutStatelessRefs[warningKey] = !0, 
        warning$2(!1, "Stateless function components cannot be given refs. " + "Attempts to access this ref will fail.%s%s", info, ReactComponentTreeHook$1.getStackAddendumByID(component._debugID)));
    }
    "function" == typeof ref ? ref(component.getPublicInstance()) : ReactOwner_1.addComponentAsRefTo(component, ref, owner);
}

function detachRef(ref, component, owner) {
    "function" == typeof ref ? ref(null) : ReactOwner_1.removeComponentAsRefFrom(component, ref, owner);
}

ReactRef.attachRefs = function(instance, element) {
    if (null !== element && "object" == typeof element) {
        var ref = element.ref;
        null != ref && attachRef(ref, instance, element._owner);
    }
}, ReactRef.shouldUpdateRefs = function(prevElement, nextElement) {
    var prevRef = null, prevOwner = null;
    null !== prevElement && "object" == typeof prevElement && (prevRef = prevElement.ref, 
    prevOwner = prevElement._owner);
    var nextRef = null, nextOwner = null;
    return null !== nextElement && "object" == typeof nextElement && (nextRef = nextElement.ref, 
    nextOwner = nextElement._owner), prevRef !== nextRef || "string" == typeof nextRef && nextOwner !== prevOwner;
}, ReactRef.detachRefs = function(instance, element) {
    if (null !== element && "object" == typeof element) {
        var ref = element.ref;
        null != ref && detachRef(ref, instance, element._owner);
    }
};

var ReactRef_1 = ReactRef;

function attachRefs() {
    ReactRef_1.attachRefs(this, this._currentElement);
}

var ReactReconciler = {
    mountComponent: function(internalInstance, transaction, hostParent, hostContainerInfo, context, parentDebugID) {
        0 !== internalInstance._debugID && ReactInstrumentation.debugTool.onBeforeMountComponent(internalInstance._debugID, internalInstance._currentElement, parentDebugID);
        var markup = internalInstance.mountComponent(transaction, hostParent, hostContainerInfo, context, parentDebugID);
        return internalInstance._currentElement && null != internalInstance._currentElement.ref && transaction.getReactMountReady().enqueue(attachRefs, internalInstance), 
        0 !== internalInstance._debugID && ReactInstrumentation.debugTool.onMountComponent(internalInstance._debugID), 
        markup;
    },
    getHostNode: function(internalInstance) {
        return internalInstance.getHostNode();
    },
    unmountComponent: function(internalInstance, safely, skipLifecycle) {
        0 !== internalInstance._debugID && ReactInstrumentation.debugTool.onBeforeUnmountComponent(internalInstance._debugID), 
        ReactRef_1.detachRefs(internalInstance, internalInstance._currentElement), internalInstance.unmountComponent(safely, skipLifecycle), 
        0 !== internalInstance._debugID && ReactInstrumentation.debugTool.onUnmountComponent(internalInstance._debugID);
    },
    receiveComponent: function(internalInstance, nextElement, transaction, context) {
        var prevElement = internalInstance._currentElement;
        if (nextElement !== prevElement || context !== internalInstance._context) {
            0 !== internalInstance._debugID && ReactInstrumentation.debugTool.onBeforeUpdateComponent(internalInstance._debugID, nextElement);
            var refsChanged = ReactRef_1.shouldUpdateRefs(prevElement, nextElement);
            refsChanged && ReactRef_1.detachRefs(internalInstance, prevElement), internalInstance.receiveComponent(nextElement, transaction, context), 
            refsChanged && internalInstance._currentElement && null != internalInstance._currentElement.ref && transaction.getReactMountReady().enqueue(attachRefs, internalInstance), 
            0 !== internalInstance._debugID && ReactInstrumentation.debugTool.onUpdateComponent(internalInstance._debugID);
        }
    },
    performUpdateIfNecessary: function(internalInstance, transaction, updateBatchNumber) {
        if (internalInstance._updateBatchNumber !== updateBatchNumber) return void warning(null == internalInstance._updateBatchNumber || internalInstance._updateBatchNumber === updateBatchNumber + 1, "performUpdateIfNecessary: Unexpected batch number (current %s, " + "pending %s)", updateBatchNumber, internalInstance._updateBatchNumber);
        0 !== internalInstance._debugID && ReactInstrumentation.debugTool.onBeforeUpdateComponent(internalInstance._debugID, internalInstance._currentElement), 
        internalInstance.performUpdateIfNecessary(transaction), 0 !== internalInstance._debugID && ReactInstrumentation.debugTool.onUpdateComponent(internalInstance._debugID);
    }
}, ReactReconciler_1 = ReactReconciler, ReactInstanceMap = {
    remove: function(key) {
        key._reactInternalInstance = void 0;
    },
    get: function(key) {
        return key._reactInternalInstance;
    },
    has: function(key) {
        return void 0 !== key._reactInternalInstance;
    },
    set: function(key, value) {
        key._reactInternalInstance = value;
    }
}, ReactInstanceMap_1 = ReactInstanceMap, OBSERVED_ERROR = {}, TransactionImpl = {
    reinitializeTransaction: function() {
        this.transactionWrappers = this.getTransactionWrappers(), this.wrapperInitData ? this.wrapperInitData.length = 0 : this.wrapperInitData = [], 
        this._isInTransaction = !1;
    },
    _isInTransaction: !1,
    getTransactionWrappers: null,
    isInTransaction: function() {
        return !!this._isInTransaction;
    },
    perform: function(method, scope, a, b, c, d, e, f) {
        invariant(!this.isInTransaction(), "Transaction.perform(...): Cannot initialize a transaction when there " + "is already an outstanding transaction.");
        var errorThrown, ret;
        try {
            this._isInTransaction = !0, errorThrown = !0, this.initializeAll(0), ret = method.call(scope, a, b, c, d, e, f), 
            errorThrown = !1;
        } finally {
            try {
                if (errorThrown) try {
                    this.closeAll(0);
                } catch (err) {} else this.closeAll(0);
            } finally {
                this._isInTransaction = !1;
            }
        }
        return ret;
    },
    initializeAll: function(startIndex) {
        for (var transactionWrappers = this.transactionWrappers, i = startIndex; i < transactionWrappers.length; i++) {
            var wrapper = transactionWrappers[i];
            try {
                this.wrapperInitData[i] = OBSERVED_ERROR, this.wrapperInitData[i] = wrapper.initialize ? wrapper.initialize.call(this) : null;
            } finally {
                if (this.wrapperInitData[i] === OBSERVED_ERROR) try {
                    this.initializeAll(i + 1);
                } catch (err) {}
            }
        }
    },
    closeAll: function(startIndex) {
        invariant(this.isInTransaction(), "Transaction.closeAll(): Cannot close transaction when none are open.");
        for (var transactionWrappers = this.transactionWrappers, i = startIndex; i < transactionWrappers.length; i++) {
            var errorThrown, wrapper = transactionWrappers[i], initData = this.wrapperInitData[i];
            try {
                errorThrown = !0, initData !== OBSERVED_ERROR && wrapper.close && wrapper.close.call(this, initData), 
                errorThrown = !1;
            } finally {
                if (errorThrown) try {
                    this.closeAll(i + 1);
                } catch (e) {}
            }
        }
        this.wrapperInitData.length = 0;
    }
}, Transaction = TransactionImpl, dirtyComponents = [], updateBatchNumber = 0, batchingStrategy = null;

function ensureInjected() {
    invariant(ReactUpdates.ReactReconcileTransaction && batchingStrategy, "ReactUpdates: must inject a reconcile transaction class and batching " + "strategy");
}

var NESTED_UPDATES = {
    initialize: function() {
        this.dirtyComponentsLength = dirtyComponents.length;
    },
    close: function() {
        this.dirtyComponentsLength !== dirtyComponents.length ? (dirtyComponents.splice(0, this.dirtyComponentsLength), 
        flushBatchedUpdates()) : dirtyComponents.length = 0;
    }
}, TRANSACTION_WRAPPERS = [ NESTED_UPDATES ];

function ReactUpdatesFlushTransaction() {
    this.reinitializeTransaction(), this.dirtyComponentsLength = null, this.reconcileTransaction = ReactUpdates.ReactReconcileTransaction.getPooled(!0);
}

Object.assign(ReactUpdatesFlushTransaction.prototype, Transaction, {
    getTransactionWrappers: function() {
        return TRANSACTION_WRAPPERS;
    },
    destructor: function() {
        this.dirtyComponentsLength = null, ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction), 
        this.reconcileTransaction = null;
    },
    perform: function(method, scope, a) {
        return Transaction.perform.call(this, this.reconcileTransaction.perform, this.reconcileTransaction, method, scope, a);
    }
}), PooledClass_1.addPoolingTo(ReactUpdatesFlushTransaction);

function batchedUpdates$1(callback, a, b, c, d, e) {
    return ensureInjected(), batchingStrategy.batchedUpdates(callback, a, b, c, d, e);
}

function mountOrderComparator(c1, c2) {
    return c1._mountOrder - c2._mountOrder;
}

function runBatchedUpdates(transaction) {
    var len = transaction.dirtyComponentsLength;
    invariant(len === dirtyComponents.length, "Expected flush transaction's stored dirty-components length (%s) to " + "match dirty-components array length (%s).", len, dirtyComponents.length), 
    dirtyComponents.sort(mountOrderComparator), updateBatchNumber++;
    for (var i = 0; i < len; i++) {
        var component = dirtyComponents[i];
        ReactReconciler_1.performUpdateIfNecessary(component, transaction.reconcileTransaction, updateBatchNumber);
    }
}

var flushBatchedUpdates = function() {
    for (;dirtyComponents.length; ) {
        var transaction = ReactUpdatesFlushTransaction.getPooled();
        transaction.perform(runBatchedUpdates, null, transaction), ReactUpdatesFlushTransaction.release(transaction);
    }
};

function enqueueUpdate$1(component) {
    if (ensureInjected(), !batchingStrategy.isBatchingUpdates) return void batchingStrategy.batchedUpdates(enqueueUpdate$1, component);
    dirtyComponents.push(component), null == component._updateBatchNumber && (component._updateBatchNumber = updateBatchNumber + 1);
}

var ReactUpdatesInjection = {
    injectReconcileTransaction: function(ReconcileTransaction) {
        invariant(ReconcileTransaction, "ReactUpdates: must provide a reconcile transaction class"), 
        ReactUpdates.ReactReconcileTransaction = ReconcileTransaction;
    },
    injectBatchingStrategy: function(_batchingStrategy) {
        invariant(_batchingStrategy, "ReactUpdates: must provide a batching strategy"), 
        invariant("function" == typeof _batchingStrategy.batchedUpdates, "ReactUpdates: must provide a batchedUpdates() function"), 
        invariant("boolean" == typeof _batchingStrategy.isBatchingUpdates, "ReactUpdates: must provide an isBatchingUpdates boolean attribute"), 
        batchingStrategy = _batchingStrategy;
    },
    getBatchingStrategy: function() {
        return batchingStrategy;
    }
}, ReactUpdates = {
    ReactReconcileTransaction: null,
    batchedUpdates: batchedUpdates$1,
    enqueueUpdate: enqueueUpdate$1,
    flushBatchedUpdates: flushBatchedUpdates,
    injection: ReactUpdatesInjection
}, ReactUpdates_1 = ReactUpdates, ReactCurrentOwner = ReactGlobalSharedState_1.ReactCurrentOwner, warning$3 = warning, warnOnInvalidCallback = function(callback, callerName) {
    warning$3(null === callback || "function" == typeof callback, "%s(...): Expected the last optional `callback` argument to be a " + "function. Instead received: %s.", callerName, "" + callback);
};

function enqueueUpdate(internalInstance) {
    ReactUpdates_1.enqueueUpdate(internalInstance);
}

function getInternalInstanceReadyForUpdate(publicInstance, callerName) {
    var internalInstance = ReactInstanceMap_1.get(publicInstance);
    if (!internalInstance) {
        var ctor = publicInstance.constructor;
        return warning$3(!1, "Can only update a mounted or mounting component. This usually means " + "you called setState, replaceState, or forceUpdate on an unmounted " + "component. This is a no-op.\n\nPlease check the code for the " + "%s component.", ctor && (ctor.displayName || ctor.name) || "ReactClass"), 
        null;
    }
    return warning$3(null == ReactCurrentOwner.current, "Cannot update during an existing state transition (such as within " + "`render` or another component's constructor). Render methods should " + "be a pure function of props and state; constructor side-effects are " + "an anti-pattern, but can be moved to `componentWillMount`."), 
    internalInstance;
}

var ReactUpdateQueue = {
    isMounted: function(publicInstance) {
        var owner = ReactCurrentOwner.current;
        null !== owner && (warning$3(owner._warnedAboutRefsInRender, "%s is accessing isMounted inside its render() function. " + "render() should be a pure function of props and state. It should " + "never access something that requires stale data from the previous " + "render, such as refs. Move this logic to componentDidMount and " + "componentDidUpdate instead.", owner.getName() || "A component"), 
        owner._warnedAboutRefsInRender = !0);
        var internalInstance = ReactInstanceMap_1.get(publicInstance);
        return !!internalInstance && !!internalInstance._renderedComponent;
    },
    enqueueCallbackInternal: function(internalInstance, callback) {
        internalInstance._pendingCallbacks ? internalInstance._pendingCallbacks.push(callback) : internalInstance._pendingCallbacks = [ callback ], 
        enqueueUpdate(internalInstance);
    },
    enqueueForceUpdate: function(publicInstance, callback, callerName) {
        var internalInstance = getInternalInstanceReadyForUpdate(publicInstance);
        internalInstance && (callback = void 0 === callback ? null : callback, null !== callback && (warnOnInvalidCallback(callback, callerName), 
        internalInstance._pendingCallbacks ? internalInstance._pendingCallbacks.push(callback) : internalInstance._pendingCallbacks = [ callback ]), 
        internalInstance._pendingForceUpdate = !0, enqueueUpdate(internalInstance));
    },
    enqueueReplaceState: function(publicInstance, completeState, callback, callerName) {
        var internalInstance = getInternalInstanceReadyForUpdate(publicInstance);
        internalInstance && (internalInstance._pendingStateQueue = [ completeState ], internalInstance._pendingReplaceState = !0, 
        callback = void 0 === callback ? null : callback, null !== callback && (warnOnInvalidCallback(callback, callerName), 
        internalInstance._pendingCallbacks ? internalInstance._pendingCallbacks.push(callback) : internalInstance._pendingCallbacks = [ callback ]), 
        enqueueUpdate(internalInstance));
    },
    enqueueSetState: function(publicInstance, partialState, callback, callerName) {
        ReactInstrumentation.debugTool.onSetState(), warning$3(null != partialState, "setState(...): You passed an undefined or null state object; " + "instead, use forceUpdate().");
        var internalInstance = getInternalInstanceReadyForUpdate(publicInstance);
        if (internalInstance) {
            (internalInstance._pendingStateQueue || (internalInstance._pendingStateQueue = [])).push(partialState), 
            callback = void 0 === callback ? null : callback, null !== callback && (warnOnInvalidCallback(callback, callerName), 
            internalInstance._pendingCallbacks ? internalInstance._pendingCallbacks.push(callback) : internalInstance._pendingCallbacks = [ callback ]), 
            enqueueUpdate(internalInstance);
        }
    },
    enqueueElementInternal: function(internalInstance, nextElement, nextContext) {
        internalInstance._pendingElement = nextElement, internalInstance._context = nextContext, 
        enqueueUpdate(internalInstance);
    }
}, ReactUpdateQueue_1 = ReactUpdateQueue, injected = !1, ReactComponentEnvironment = {
    replaceNodeWithMarkup: null,
    processChildrenUpdates: null,
    injection: {
        injectEnvironment: function(environment) {
            invariant(!injected, "ReactCompositeComponent: injectEnvironment() can only be called once."), 
            ReactComponentEnvironment.replaceNodeWithMarkup = environment.replaceNodeWithMarkup, 
            ReactComponentEnvironment.processChildrenUpdates = environment.processChildrenUpdates, 
            injected = !0;
        }
    }
}, ReactComponentEnvironment_1 = ReactComponentEnvironment, ReactNodeTypes = {
    HOST: 0,
    COMPOSITE: 1,
    EMPTY: 2,
    getType: function(node) {
        return null === node || !1 === node ? ReactNodeTypes.EMPTY : React.isValidElement(node) ? "function" == typeof node.type ? ReactNodeTypes.COMPOSITE : ReactNodeTypes.HOST : void invariant(!1, "Unexpected node: %s", node);
    }
}, ReactNodeTypes_1 = ReactNodeTypes;

function shouldUpdateReactComponent(prevElement, nextElement) {
    var prevEmpty = null === prevElement || !1 === prevElement, nextEmpty = null === nextElement || !1 === nextElement;
    if (prevEmpty || nextEmpty) return prevEmpty === nextEmpty;
    var prevType = typeof prevElement, nextType = typeof nextElement;
    return "string" === prevType || "number" === prevType ? "string" === nextType || "number" === nextType : "object" === nextType && prevElement.type === nextElement.type && prevElement.key === nextElement.key;
}

var shouldUpdateReactComponent_1 = shouldUpdateReactComponent, ReactCurrentOwner$1 = ReactGlobalSharedState_1.ReactCurrentOwner, _require2 = ReactGlobalSharedState_1, ReactDebugCurrentFrame = _require2.ReactDebugCurrentFrame, warningAboutMissingGetChildContext = {};

function StatelessComponent(Component) {}

StatelessComponent.prototype.render = function() {
    return (0, ReactInstanceMap_1.get(this)._currentElement.type)(this.props, this.context, this.updater);
};

function shouldConstruct(Component) {
    return !(!Component.prototype || !Component.prototype.isReactComponent);
}

function isPureComponent(Component) {
    return !(!Component.prototype || !Component.prototype.isPureReactComponent);
}

function measureLifeCyclePerf(fn, debugID, timerType) {
    if (0 === debugID) return fn();
    ReactInstrumentation.debugTool.onBeginLifeCycleTimer(debugID, timerType);
    try {
        return fn();
    } finally {
        ReactInstrumentation.debugTool.onEndLifeCycleTimer(debugID, timerType);
    }
}

var nextMountID = 1, ReactCompositeComponent = {
    construct: function(element) {
        this._currentElement = element, this._rootNodeID = 0, this._compositeType = null, 
        this._instance = null, this._hostParent = null, this._hostContainerInfo = null, 
        this._updateBatchNumber = null, this._pendingElement = null, this._pendingStateQueue = null, 
        this._pendingReplaceState = !1, this._pendingForceUpdate = !1, this._renderedNodeType = null, 
        this._renderedComponent = null, this._context = null, this._mountOrder = 0, this._topLevelWrapper = null, 
        this._pendingCallbacks = null, this._calledComponentWillUnmount = !1, this._warnedAboutRefsInRender = !1;
    },
    mountComponent: function(transaction, hostParent, hostContainerInfo, context) {
        var _this = this;
        this._context = context, this._mountOrder = nextMountID++, this._hostParent = hostParent, 
        this._hostContainerInfo = hostContainerInfo;
        var renderedElement, publicProps = this._currentElement.props, publicContext = this._processContext(context), Component = this._currentElement.type, updateQueue = transaction.getUpdateQueue(), doConstruct = shouldConstruct(Component), inst = this._constructComponent(doConstruct, publicProps, publicContext, updateQueue);
        doConstruct || null != inst && null != inst.render ? isPureComponent(Component) ? this._compositeType = ReactCompositeComponentTypes$1.PureClass : this._compositeType = ReactCompositeComponentTypes$1.ImpureClass : (renderedElement = inst, 
        warning(!Component.childContextTypes, "%s(...): childContextTypes cannot be defined on a functional component.", Component.displayName || Component.name || "Component"), 
        invariant(null === inst || !1 === inst || React.isValidElement(inst), "%s(...): A valid React element (or null) must be returned. You may have " + "returned undefined, an array or some other invalid object.", Component.displayName || Component.name || "Component"), 
        inst = new StatelessComponent(Component), this._compositeType = ReactCompositeComponentTypes$1.StatelessFunctional), 
        null == inst.render && warning(!1, "%s(...): No `render` method found on the returned component " + "instance: you may have forgotten to define `render`.", Component.displayName || Component.name || "Component");
        var propsMutated = inst.props !== publicProps, componentName = Component.displayName || Component.name || "Component";
        warning(void 0 === inst.props || !propsMutated, "%s(...): When calling super() in `%s`, make sure to pass " + "up the same props that your component's constructor was passed.", componentName, componentName), 
        inst.props = publicProps, inst.context = publicContext, inst.refs = emptyObject, 
        inst.updater = updateQueue, this._instance = inst, ReactInstanceMap_1.set(inst, this), 
        warning(!inst.getInitialState || inst.getInitialState.isReactClassApproved || inst.state, "getInitialState was defined on %s, a plain JavaScript class. " + "This is only supported for classes created using React.createClass. " + "Did you mean to define a state property instead?", this.getName() || "a component"), 
        warning(!inst.getDefaultProps || inst.getDefaultProps.isReactClassApproved, "getDefaultProps was defined on %s, a plain JavaScript class. " + "This is only supported for classes created using React.createClass. " + "Use a static property to define defaultProps instead.", this.getName() || "a component"), 
        warning(!inst.propTypes, "propTypes was defined as an instance property on %s. Use a static " + "property to define propTypes instead.", this.getName() || "a component"), 
        warning(!inst.contextTypes, "contextTypes was defined as an instance property on %s. Use a " + "static property to define contextTypes instead.", this.getName() || "a component"), 
        warning("function" != typeof inst.componentShouldUpdate, "%s has a method called " + "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " + "The name is phrased as a question because the function is " + "expected to return a value.", this.getName() || "A component"), 
        warning("function" != typeof inst.componentDidUnmount, "%s has a method called " + "componentDidUnmount(). But there is no such lifecycle method. " + "Did you mean componentWillUnmount()?", this.getName() || "A component"), 
        warning("function" != typeof inst.componentWillRecieveProps, "%s has a method called " + "componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", this.getName() || "A component"), 
        isPureComponent(Component) && void 0 !== inst.shouldComponentUpdate && warning(!1, "%s has a method called shouldComponentUpdate(). " + "shouldComponentUpdate should not be used when extending React.PureComponent. " + "Please extend React.Component if shouldComponentUpdate is used.", this.getName() || "A pure component"), 
        warning(!inst.defaultProps, "Setting defaultProps as an instance property on %s is not supported and will be ignored." + " Instead, define defaultProps as a static property on %s.", this.getName() || "a component", this.getName() || "a component");
        var initialState = inst.state;
        void 0 === initialState && (inst.state = initialState = null), invariant("object" == typeof initialState && !Array.isArray(initialState), "%s.state: must be set to an object or null", this.getName() || "ReactCompositeComponent"), 
        this._pendingStateQueue = null, this._pendingReplaceState = !1, this._pendingForceUpdate = !1, 
        inst.componentWillMount && (measureLifeCyclePerf(function() {
            return inst.componentWillMount();
        }, this._debugID, "componentWillMount"), this._pendingStateQueue && (inst.state = this._processPendingState(inst.props, inst.context)));
        var markup;
        markup = inst.unstable_handleError ? this.performInitialMountWithErrorHandling(renderedElement, hostParent, hostContainerInfo, transaction, context) : this.performInitialMount(renderedElement, hostParent, hostContainerInfo, transaction, context), 
        inst.componentDidMount && transaction.getReactMountReady().enqueue(function() {
            measureLifeCyclePerf(function() {
                return inst.componentDidMount();
            }, _this._debugID, "componentDidMount");
        });
        var callbacks = this._pendingCallbacks;
        if (callbacks) {
            this._pendingCallbacks = null;
            for (var i = 0; i < callbacks.length; i++) transaction.getReactMountReady().enqueue(callbacks[i], inst);
        }
        return markup;
    },
    _constructComponent: function(doConstruct, publicProps, publicContext, updateQueue) {
        ReactCurrentOwner$1.current = this;
        try {
            return this._constructComponentWithoutOwner(doConstruct, publicProps, publicContext, updateQueue);
        } finally {
            ReactCurrentOwner$1.current = null;
        }
    },
    _constructComponentWithoutOwner: function(doConstruct, publicProps, publicContext, updateQueue) {
        var Component = this._currentElement.type;
        return doConstruct ? measureLifeCyclePerf(function() {
            return new Component(publicProps, publicContext, updateQueue);
        }, this._debugID, "ctor") : measureLifeCyclePerf(function() {
            return Component(publicProps, publicContext, updateQueue);
        }, this._debugID, "render");
    },
    performInitialMountWithErrorHandling: function(renderedElement, hostParent, hostContainerInfo, transaction, context) {
        var markup, checkpoint = transaction.checkpoint();
        try {
            markup = this.performInitialMount(renderedElement, hostParent, hostContainerInfo, transaction, context);
        } catch (e) {
            transaction.rollback(checkpoint), this._instance.unstable_handleError(e), this._pendingStateQueue && (this._instance.state = this._processPendingState(this._instance.props, this._instance.context)), 
            checkpoint = transaction.checkpoint(), this._renderedComponent.unmountComponent(!0, !0), 
            transaction.rollback(checkpoint), markup = this.performInitialMount(renderedElement, hostParent, hostContainerInfo, transaction, context);
        }
        return markup;
    },
    performInitialMount: function(renderedElement, hostParent, hostContainerInfo, transaction, context) {
        void 0 === renderedElement && (renderedElement = this._renderValidatedComponent());
        var nodeType = ReactNodeTypes_1.getType(renderedElement);
        this._renderedNodeType = nodeType;
        var child = this._instantiateReactComponent(renderedElement, nodeType !== ReactNodeTypes_1.EMPTY);
        this._renderedComponent = child;
        var debugID = 0;
        debugID = this._debugID;
        var markup = ReactReconciler_1.mountComponent(child, transaction, hostParent, hostContainerInfo, this._processChildContext(context), debugID);
        if (0 !== debugID) {
            var childDebugIDs = 0 !== child._debugID ? [ child._debugID ] : [];
            ReactInstrumentation.debugTool.onSetChildren(debugID, childDebugIDs);
        }
        return markup;
    },
    getHostNode: function() {
        return ReactReconciler_1.getHostNode(this._renderedComponent);
    },
    unmountComponent: function(safely, skipLifecycle) {
        if (this._renderedComponent) {
            var inst = this._instance;
            if (inst.componentWillUnmount && !inst._calledComponentWillUnmount) if (inst._calledComponentWillUnmount = !0, 
            safely) {
                if (!skipLifecycle) {
                    var name = this.getName() + ".componentWillUnmount()";
                    ReactErrorUtils_1.invokeGuardedCallbackAndCatchFirstError(name, inst.componentWillUnmount, inst);
                }
            } else measureLifeCyclePerf(function() {
                return inst.componentWillUnmount();
            }, this._debugID, "componentWillUnmount");
            this._renderedComponent && (ReactReconciler_1.unmountComponent(this._renderedComponent, safely, skipLifecycle), 
            this._renderedNodeType = null, this._renderedComponent = null, this._instance = null), 
            this._pendingStateQueue = null, this._pendingReplaceState = !1, this._pendingForceUpdate = !1, 
            this._pendingCallbacks = null, this._pendingElement = null, this._context = null, 
            this._rootNodeID = 0, this._topLevelWrapper = null, ReactInstanceMap_1.remove(inst);
        }
    },
    _maskContext: function(context) {
        var Component = this._currentElement.type, contextTypes = Component.contextTypes;
        if (!contextTypes) return emptyObject;
        var maskedContext = {};
        for (var contextName in contextTypes) maskedContext[contextName] = context[contextName];
        return maskedContext;
    },
    _processContext: function(context) {
        var maskedContext = this._maskContext(context), Component = this._currentElement.type;
        return Component.contextTypes && this._checkContextTypes(Component.contextTypes, maskedContext, "context"), 
        maskedContext;
    },
    _processChildContext: function(currentContext) {
        var childContext, Component = this._currentElement.type, inst = this._instance;
        if ("function" == typeof inst.getChildContext) {
            ReactInstrumentation.debugTool.onBeginProcessingChildContext();
            try {
                childContext = inst.getChildContext();
            } finally {
                ReactInstrumentation.debugTool.onEndProcessingChildContext();
            }
            invariant("object" == typeof Component.childContextTypes, "%s.getChildContext(): childContextTypes must be defined in order to " + "use getChildContext().", this.getName() || "ReactCompositeComponent"), 
            this._checkContextTypes(Component.childContextTypes, childContext, "child context");
            for (var name in childContext) invariant(name in Component.childContextTypes, '%s.getChildContext(): key "%s" is not defined in childContextTypes.', this.getName() || "ReactCompositeComponent", name);
            return Object.assign({}, currentContext, childContext);
        }
        var componentName = this.getName();
        return warningAboutMissingGetChildContext[componentName] || (warningAboutMissingGetChildContext[componentName] = !0, 
        warning(!Component.childContextTypes, "%s.childContextTypes is specified but there is no getChildContext() method " + "on the instance. You can either define getChildContext() on %s or remove " + "childContextTypes from it.", componentName, componentName)), 
        currentContext;
    },
    _checkContextTypes: function(typeSpecs, values, location) {
        ReactDebugCurrentFrame.current = this._debugID, checkPropTypes(typeSpecs, values, location, this.getName(), ReactDebugCurrentFrame.getStackAddendum), 
        ReactDebugCurrentFrame.current = null;
    },
    receiveComponent: function(nextElement, transaction, nextContext) {
        var prevElement = this._currentElement, prevContext = this._context;
        this._pendingElement = null, this.updateComponent(transaction, prevElement, nextElement, prevContext, nextContext);
    },
    performUpdateIfNecessary: function(transaction) {
        if (null != this._pendingElement) ReactReconciler_1.receiveComponent(this, this._pendingElement, transaction, this._context); else if (null !== this._pendingStateQueue || this._pendingForceUpdate) this.updateComponent(transaction, this._currentElement, this._currentElement, this._context, this._context); else {
            var callbacks = this._pendingCallbacks;
            if (this._pendingCallbacks = null, callbacks) for (var j = 0; j < callbacks.length; j++) transaction.getReactMountReady().enqueue(callbacks[j], this.getPublicInstance());
            this._updateBatchNumber = null;
        }
    },
    updateComponent: function(transaction, prevParentElement, nextParentElement, prevUnmaskedContext, nextUnmaskedContext) {
        var inst = this._instance;
        invariant(null != inst, "Attempted to update component `%s` that has already been unmounted " + "(or failed to mount).", this.getName() || "ReactCompositeComponent");
        var nextContext, willReceive = !1;
        this._context === nextUnmaskedContext ? nextContext = inst.context : (nextContext = this._processContext(nextUnmaskedContext), 
        willReceive = !0);
        var prevProps = prevParentElement.props, nextProps = nextParentElement.props;
        if (prevParentElement !== nextParentElement && (willReceive = !0), willReceive && inst.componentWillReceiveProps) {
            var beforeState = inst.state;
            measureLifeCyclePerf(function() {
                return inst.componentWillReceiveProps(nextProps, nextContext);
            }, this._debugID, "componentWillReceiveProps");
            var afterState = inst.state;
            beforeState !== afterState && (inst.state = beforeState, inst.updater.enqueueReplaceState(inst, afterState), 
            warning(!1, "%s.componentWillReceiveProps(): Assigning directly to " + "this.state is deprecated (except inside a component's " + "constructor). Use setState instead.", this.getName() || "ReactCompositeComponent"));
        }
        var callbacks = this._pendingCallbacks;
        this._pendingCallbacks = null;
        var nextState = this._processPendingState(nextProps, nextContext), shouldUpdate = !0;
        if (!this._pendingForceUpdate) {
            var prevState = inst.state;
            shouldUpdate = willReceive || nextState !== prevState, inst.shouldComponentUpdate ? shouldUpdate = measureLifeCyclePerf(function() {
                return inst.shouldComponentUpdate(nextProps, nextState, nextContext);
            }, this._debugID, "shouldComponentUpdate") : this._compositeType === ReactCompositeComponentTypes$1.PureClass && (shouldUpdate = !shallowEqual(prevProps, nextProps) || !shallowEqual(inst.state, nextState));
        }
        if (warning(void 0 !== shouldUpdate, "%s.shouldComponentUpdate(): Returned undefined instead of a " + "boolean value. Make sure to return true or false.", this.getName() || "ReactCompositeComponent"), 
        this._updateBatchNumber = null, shouldUpdate ? (this._pendingForceUpdate = !1, this._performComponentUpdate(nextParentElement, nextProps, nextState, nextContext, transaction, nextUnmaskedContext)) : (this._currentElement = nextParentElement, 
        this._context = nextUnmaskedContext, inst.props = nextProps, inst.state = nextState, 
        inst.context = nextContext), callbacks) for (var j = 0; j < callbacks.length; j++) transaction.getReactMountReady().enqueue(callbacks[j], this.getPublicInstance());
    },
    _processPendingState: function(props, context) {
        var inst = this._instance, queue = this._pendingStateQueue, replace = this._pendingReplaceState;
        if (this._pendingReplaceState = !1, this._pendingStateQueue = null, !queue) return inst.state;
        if (replace && 1 === queue.length) return queue[0];
        for (var nextState = replace ? queue[0] : inst.state, dontMutate = !0, i = replace ? 1 : 0; i < queue.length; i++) {
            var partial = queue[i], partialState = "function" == typeof partial ? partial.call(inst, nextState, props, context) : partial;
            partialState && (dontMutate ? (dontMutate = !1, nextState = Object.assign({}, nextState, partialState)) : Object.assign(nextState, partialState));
        }
        return nextState;
    },
    _performComponentUpdate: function(nextElement, nextProps, nextState, nextContext, transaction, unmaskedContext) {
        var prevProps, prevState, _this2 = this, inst = this._instance, hasComponentDidUpdate = !!inst.componentDidUpdate;
        hasComponentDidUpdate && (prevProps = inst.props, prevState = inst.state), inst.componentWillUpdate && measureLifeCyclePerf(function() {
            return inst.componentWillUpdate(nextProps, nextState, nextContext);
        }, this._debugID, "componentWillUpdate"), this._currentElement = nextElement, this._context = unmaskedContext, 
        inst.props = nextProps, inst.state = nextState, inst.context = nextContext, inst.unstable_handleError ? this._updateRenderedComponentWithErrorHandling(transaction, unmaskedContext) : this._updateRenderedComponent(transaction, unmaskedContext), 
        hasComponentDidUpdate && transaction.getReactMountReady().enqueue(function() {
            measureLifeCyclePerf(inst.componentDidUpdate.bind(inst, prevProps, prevState), _this2._debugID, "componentDidUpdate");
        });
    },
    _updateRenderedComponentWithErrorHandling: function(transaction, context) {
        var checkpoint = transaction.checkpoint();
        try {
            this._updateRenderedComponent(transaction, context);
        } catch (e) {
            transaction.rollback(checkpoint), this._instance.unstable_handleError(e), this._pendingStateQueue && (this._instance.state = this._processPendingState(this._instance.props, this._instance.context)), 
            checkpoint = transaction.checkpoint(), this._updateRenderedComponentWithNextElement(transaction, context, null, !0), 
            this._updateRenderedComponent(transaction, context);
        }
    },
    _updateRenderedComponent: function(transaction, context) {
        var nextRenderedElement = this._renderValidatedComponent();
        this._updateRenderedComponentWithNextElement(transaction, context, nextRenderedElement, !1);
    },
    _updateRenderedComponentWithNextElement: function(transaction, context, nextRenderedElement, safely) {
        var prevComponentInstance = this._renderedComponent, prevRenderedElement = prevComponentInstance._currentElement, debugID = 0;
        if (debugID = this._debugID, shouldUpdateReactComponent_1(prevRenderedElement, nextRenderedElement)) ReactReconciler_1.receiveComponent(prevComponentInstance, nextRenderedElement, transaction, this._processChildContext(context)); else {
            var oldHostNode = ReactReconciler_1.getHostNode(prevComponentInstance), nodeType = ReactNodeTypes_1.getType(nextRenderedElement);
            this._renderedNodeType = nodeType;
            var child = this._instantiateReactComponent(nextRenderedElement, nodeType !== ReactNodeTypes_1.EMPTY);
            this._renderedComponent = child;
            var nextMarkup = ReactReconciler_1.mountComponent(child, transaction, this._hostParent, this._hostContainerInfo, this._processChildContext(context), debugID);
            if (ReactReconciler_1.unmountComponent(prevComponentInstance, safely, !1), 0 !== debugID) {
                var childDebugIDs = 0 !== child._debugID ? [ child._debugID ] : [];
                ReactInstrumentation.debugTool.onSetChildren(debugID, childDebugIDs);
            }
            this._replaceNodeWithMarkup(oldHostNode, nextMarkup, prevComponentInstance);
        }
    },
    _replaceNodeWithMarkup: function(oldHostNode, nextMarkup, prevInstance) {
        ReactComponentEnvironment_1.replaceNodeWithMarkup(oldHostNode, nextMarkup, prevInstance);
    },
    _renderValidatedComponentWithoutOwnerOrContext: function() {
        var renderedElement, inst = this._instance;
        return renderedElement = measureLifeCyclePerf(function() {
            return inst.render();
        }, this._debugID, "render"), void 0 === renderedElement && inst.render._isMockFunction && (renderedElement = null), 
        renderedElement;
    },
    _renderValidatedComponent: function() {
        var renderedElement;
        if (0 && this._compositeType === ReactCompositeComponentTypes$1.StatelessFunctional) renderedElement = this._renderValidatedComponentWithoutOwnerOrContext(); else {
            ReactCurrentOwner$1.current = this;
            try {
                renderedElement = this._renderValidatedComponentWithoutOwnerOrContext();
            } finally {
                ReactCurrentOwner$1.current = null;
            }
        }
        return invariant(null === renderedElement || !1 === renderedElement || React.isValidElement(renderedElement), "%s.render(): A valid React element (or null) must be returned. You may have " + "returned undefined, an array or some other invalid object.", this.getName() || "ReactCompositeComponent"), 
        renderedElement;
    },
    attachRef: function(ref, component) {
        var inst = this.getPublicInstance();
        invariant(null != inst, "Stateless function components cannot have refs.");
        var publicComponentInstance = component.getPublicInstance();
        (inst.refs === emptyObject ? inst.refs = {} : inst.refs)[ref] = publicComponentInstance;
    },
    detachRef: function(ref) {
        delete this.getPublicInstance().refs[ref];
    },
    getName: function() {
        var type = this._currentElement.type, constructor = this._instance && this._instance.constructor;
        return type.displayName || constructor && constructor.displayName || type.name || constructor && constructor.name || null;
    },
    getPublicInstance: function() {
        var inst = this._instance;
        return this._compositeType === ReactCompositeComponentTypes$1.StatelessFunctional ? null : inst;
    },
    _instantiateReactComponent: null
}, ReactCompositeComponent_1 = ReactCompositeComponent, emptyComponentFactory, ReactEmptyComponentInjection = {
    injectEmptyComponentFactory: function(factory) {
        emptyComponentFactory = factory;
    }
}, ReactEmptyComponent = {
    create: function(instantiate) {
        return emptyComponentFactory(instantiate);
    }
};

ReactEmptyComponent.injection = ReactEmptyComponentInjection;

var ReactEmptyComponent_1 = ReactEmptyComponent, genericComponentClass = null, textComponentClass = null, ReactHostComponentInjection = {
    injectGenericComponentClass: function(componentClass) {
        genericComponentClass = componentClass;
    },
    injectTextComponentClass: function(componentClass) {
        textComponentClass = componentClass;
    }
};

function createInternalComponent(element) {
    return invariant(genericComponentClass, "There is no registered component for the tag %s", element.type), 
    new genericComponentClass(element);
}

function createInstanceForText(text) {
    return new textComponentClass(text);
}

function isTextComponent(component) {
    return component instanceof textComponentClass;
}

var ReactHostComponent = {
    createInternalComponent: createInternalComponent,
    createInstanceForText: createInstanceForText,
    isTextComponent: isTextComponent,
    injection: ReactHostComponentInjection
}, ReactHostComponent_1 = ReactHostComponent, nextDebugID = 1, ReactCompositeComponentWrapper = function(element) {
    this.construct(element);
};

function getDeclarationErrorAddendum(owner) {
    if (owner) {
        var name = owner.getName();
        if (name) return "\n\nCheck the render method of `" + name + "`.";
    }
    return "";
}

function isInternalComponentType(type) {
    return "function" == typeof type && void 0 !== type.prototype && "function" == typeof type.prototype.mountComponent && "function" == typeof type.prototype.receiveComponent;
}

function instantiateReactComponent(node, shouldHaveDebugID) {
    var instance;
    if (null === node || !1 === node) instance = ReactEmptyComponent_1.create(instantiateReactComponent); else if ("object" == typeof node) {
        var element = node, type = element.type;
        if ("function" != typeof type && "string" != typeof type) {
            var info = "";
            (void 0 === type || "object" == typeof type && null !== type && 0 === Object.keys(type).length) && (info += " You likely forgot to export your component from the file " + "it's defined in."), 
            info += getDeclarationErrorAddendum(element._owner), invariant(!1, "Element type is invalid: expected a string (for built-in components) " + "or a class/function (for composite components) but got: %s.%s", null == type ? type : typeof type, info);
        }
        "string" == typeof element.type ? instance = ReactHostComponent_1.createInternalComponent(element) : isInternalComponentType(element.type) ? (instance = new element.type(element), 
        instance.getHostNode || (instance.getHostNode = instance.getNativeNode)) : instance = new ReactCompositeComponentWrapper(element);
    } else "string" == typeof node || "number" == typeof node ? instance = ReactHostComponent_1.createInstanceForText(node) : invariant(!1, "Encountered invalid React node of type %s", typeof node);
    return warning("function" == typeof instance.mountComponent && "function" == typeof instance.receiveComponent && "function" == typeof instance.getHostNode && "function" == typeof instance.unmountComponent, "Only React Components can be mounted."), 
    instance._mountIndex = 0, instance._mountImage = null, instance._debugID = shouldHaveDebugID ? nextDebugID++ : 0, 
    Object.preventExtensions && Object.preventExtensions(instance), instance;
}

Object.assign(ReactCompositeComponentWrapper.prototype, ReactCompositeComponent_1, {
    _instantiateReactComponent: instantiateReactComponent
});

var instantiateReactComponent_1 = instantiateReactComponent, DevOnlyStubShim = null, ReactNativeFeatureFlags = require("ReactNativeFeatureFlags"), ReactCurrentOwner$2 = ReactGlobalSharedState_1.ReactCurrentOwner, injectedFindNode = ReactNativeFeatureFlags.useFiber ? function(fiber) {
    return DevOnlyStubShim.findHostInstance(fiber);
} : function(instance) {
    return instance;
};

function findNodeHandle(componentOrHandle) {
    var owner = ReactCurrentOwner$2.current;
    if (null !== owner && (warning(owner._warnedAboutRefsInRender, "%s is accessing findNodeHandle inside its render(). " + "render() should be a pure function of props and state. It should " + "never access something that requires stale data from the previous " + "render, such as refs. Move this logic to componentDidMount and " + "componentDidUpdate instead.", owner.getName() || "A component"), 
    owner._warnedAboutRefsInRender = !0), null == componentOrHandle) return null;
    if ("number" == typeof componentOrHandle) return componentOrHandle;
    var component = componentOrHandle, internalInstance = ReactInstanceMap_1.get(component);
    return internalInstance ? injectedFindNode(internalInstance) : component || (invariant("object" == typeof component && ("_rootNodeID" in component || "_nativeTag" in component) || null != component.render && "function" == typeof component.render, "findNodeHandle(...): Argument is not a component " + "(type: %s, keys: %s)", typeof component, Object.keys(component)), 
    void invariant(!1, "findNodeHandle(...): Unable to find node handle for unmounted " + "component."));
}

var findNodeHandle_1 = findNodeHandle, TopLevelWrapper = function() {};

TopLevelWrapper.prototype.isReactComponent = {}, TopLevelWrapper.displayName = "TopLevelWrapper", 
TopLevelWrapper.prototype.render = function() {
    return this.props.child;
}, TopLevelWrapper.isReactTopLevelWrapper = !0;

function mountComponentIntoNode(componentInstance, containerTag, transaction) {
    var markup = ReactReconciler_1.mountComponent(componentInstance, transaction, null, ReactNativeContainerInfo_1(containerTag), emptyObject, 0);
    componentInstance._renderedComponent._topLevelWrapper = componentInstance, ReactNativeMount._mountImageIntoNode(markup, containerTag);
}

function batchedMountComponentIntoNode(componentInstance, containerTag) {
    var transaction = ReactUpdates_1.ReactReconcileTransaction.getPooled();
    transaction.perform(mountComponentIntoNode, null, componentInstance, containerTag, transaction), 
    ReactUpdates_1.ReactReconcileTransaction.release(transaction);
}

var ReactNativeMount = {
    _instancesByContainerID: {},
    findNodeHandle: findNodeHandle_1,
    renderComponent: function(nextElement, containerTag, callback) {
        var nextWrappedElement = React.createElement(TopLevelWrapper, {
            child: nextElement
        }), topRootNodeID = containerTag, prevComponent = ReactNativeMount._instancesByContainerID[topRootNodeID];
        if (prevComponent) {
            var prevWrappedElement = prevComponent._currentElement, prevElement = prevWrappedElement.props.child;
            if (shouldUpdateReactComponent_1(prevElement, nextElement)) return ReactUpdateQueue_1.enqueueElementInternal(prevComponent, nextWrappedElement, emptyObject), 
            callback && ReactUpdateQueue_1.enqueueCallbackInternal(prevComponent, callback), 
            prevComponent;
            ReactNativeMount.unmountComponentAtNode(containerTag);
        }
        if (!ReactNativeTagHandles_1.reactTagIsNativeTopRootID(containerTag)) return console.error("You cannot render into anything but a top root"), 
        null;
        ReactNativeTagHandles_1.assertRootTag(containerTag);
        var instance = instantiateReactComponent_1(nextWrappedElement, !1);
        if (ReactNativeMount._instancesByContainerID[containerTag] = instance, callback) {
            var nonNullCallback = callback;
            instance._pendingCallbacks = [ function() {
                nonNullCallback.call(instance._renderedComponent.getPublicInstance());
            } ];
        }
        return ReactUpdates_1.batchedUpdates(batchedMountComponentIntoNode, instance, containerTag), 
        instance._renderedComponent.getPublicInstance();
    },
    _mountImageIntoNode: function(mountImage, containerID) {
        var childTag = mountImage;
        UIManager.setChildren(containerID, [ childTag ]);
    },
    unmountComponentAtNodeAndRemoveContainer: function(containerTag) {
        ReactNativeMount.unmountComponentAtNode(containerTag), UIManager.removeRootView(containerTag);
    },
    unmountComponentAtNode: function(containerTag) {
        if (!ReactNativeTagHandles_1.reactTagIsNativeTopRootID(containerTag)) return console.error("You cannot render into anything but a top root"), 
        !1;
        var instance = ReactNativeMount._instancesByContainerID[containerTag];
        return !!instance && (ReactInstrumentation.debugTool.onBeginFlush(), ReactNativeMount.unmountComponentFromNode(instance, containerTag), 
        delete ReactNativeMount._instancesByContainerID[containerTag], ReactInstrumentation.debugTool.onEndFlush(), 
        !0);
    },
    unmountComponentFromNode: function(instance, containerID) {
        ReactReconciler_1.unmountComponent(instance), UIManager.removeSubviewsFromContainerWithID(containerID);
    }
}, ReactNativeMount_1 = ReactNativeMount, RESET_BATCHED_UPDATES = {
    initialize: emptyFunction,
    close: function() {
        ReactDefaultBatchingStrategy.isBatchingUpdates = !1;
    }
}, FLUSH_BATCHED_UPDATES = {
    initialize: emptyFunction,
    close: ReactUpdates_1.flushBatchedUpdates.bind(ReactUpdates_1)
}, TRANSACTION_WRAPPERS$1 = [ FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES ];

function ReactDefaultBatchingStrategyTransaction() {
    this.reinitializeTransaction();
}

Object.assign(ReactDefaultBatchingStrategyTransaction.prototype, Transaction, {
    getTransactionWrappers: function() {
        return TRANSACTION_WRAPPERS$1;
    }
});

var transaction = new ReactDefaultBatchingStrategyTransaction(), ReactDefaultBatchingStrategy = {
    isBatchingUpdates: !1,
    batchedUpdates: function(callback, a, b, c, d, e) {
        var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;
        return ReactDefaultBatchingStrategy.isBatchingUpdates = !0, alreadyBatchingUpdates ? callback(a, b, c, d, e) : transaction.perform(callback, null, a, b, c, d, e);
    }
}, ReactDefaultBatchingStrategy_1 = ReactDefaultBatchingStrategy, dangerouslyProcessChildrenUpdates = function(inst, childrenUpdates) {
    if (childrenUpdates.length) {
        for (var moveFromIndices, moveToIndices, addChildTags, addAtIndices, removeAtIndices, containerTag = ReactNativeComponentTree_1.getNodeFromInstance(inst), i = 0; i < childrenUpdates.length; i++) {
            var update = childrenUpdates[i];
            if ("MOVE_EXISTING" === update.type) (moveFromIndices || (moveFromIndices = [])).push(update.fromIndex), 
            (moveToIndices || (moveToIndices = [])).push(update.toIndex); else if ("REMOVE_NODE" === update.type) (removeAtIndices || (removeAtIndices = [])).push(update.fromIndex); else if ("INSERT_MARKUP" === update.type) {
                var mountImage = update.content, tag = mountImage;
                (addAtIndices || (addAtIndices = [])).push(update.toIndex), (addChildTags || (addChildTags = [])).push(tag);
            }
        }
        UIManager.manageChildren(containerTag, moveFromIndices, moveToIndices, addChildTags, addAtIndices, removeAtIndices);
    }
}, ReactNativeDOMIDOperations = {
    dangerouslyProcessChildrenUpdates: dangerouslyProcessChildrenUpdates,
    dangerouslyReplaceNodeWithMarkupByID: function(id, mountImage) {
        var oldTag = id;
        UIManager.replaceExistingNonRootView(oldTag, mountImage);
    }
}, ReactNativeDOMIDOperations_1 = ReactNativeDOMIDOperations;

function validateCallback(callback) {
    invariant(!callback || "function" == typeof callback, "Invalid argument passed as callback. Expected a function. Instead " + "received: %s", callback);
}

var validateCallback_1 = validateCallback;

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
}

var CallbackQueue = function() {
    function CallbackQueue() {
        _classCallCheck(this, CallbackQueue), this._callbacks = null, this._contexts = null;
    }
    return CallbackQueue.prototype.enqueue = function(callback, context) {
        this._callbacks = this._callbacks || [], this._callbacks.push(callback), this._contexts = this._contexts || [], 
        this._contexts.push(context);
    }, CallbackQueue.prototype.notifyAll = function() {
        var callbacks = this._callbacks, contexts = this._contexts;
        if (callbacks && contexts) {
            invariant(callbacks.length === contexts.length, "Mismatched list of contexts in callback queue"), 
            this._callbacks = null, this._contexts = null;
            for (var i = 0; i < callbacks.length; i++) validateCallback_1(callbacks[i]), callbacks[i].call(contexts[i]);
            callbacks.length = 0, contexts.length = 0;
        }
    }, CallbackQueue.prototype.checkpoint = function() {
        return this._callbacks ? this._callbacks.length : 0;
    }, CallbackQueue.prototype.rollback = function(len) {
        this._callbacks && this._contexts && (this._callbacks.length = len, this._contexts.length = len);
    }, CallbackQueue.prototype.reset = function() {
        this._callbacks = null, this._contexts = null;
    }, CallbackQueue.prototype.destructor = function() {
        this.reset();
    }, CallbackQueue;
}(), CallbackQueue_1 = PooledClass_1.addPoolingTo(CallbackQueue), ON_DOM_READY_QUEUEING = {
    initialize: function() {
        this.reactMountReady.reset();
    },
    close: function() {
        this.reactMountReady.notifyAll();
    }
}, TRANSACTION_WRAPPERS$2 = [ ON_DOM_READY_QUEUEING ];

TRANSACTION_WRAPPERS$2.push({
    initialize: ReactInstrumentation.debugTool.onBeginFlush,
    close: ReactInstrumentation.debugTool.onEndFlush
});

function ReactNativeReconcileTransaction() {
    this.reinitializeTransaction(), this.reactMountReady = CallbackQueue_1.getPooled();
}

var Mixin = {
    getTransactionWrappers: function() {
        return TRANSACTION_WRAPPERS$2;
    },
    getReactMountReady: function() {
        return this.reactMountReady;
    },
    getUpdateQueue: function() {
        return ReactUpdateQueue_1;
    },
    checkpoint: function() {
        return this.reactMountReady.checkpoint();
    },
    rollback: function(checkpoint) {
        this.reactMountReady.rollback(checkpoint);
    },
    destructor: function() {
        CallbackQueue_1.release(this.reactMountReady), this.reactMountReady = null;
    }
};

Object.assign(ReactNativeReconcileTransaction.prototype, Transaction, ReactNativeReconcileTransaction, Mixin), 
PooledClass_1.addPoolingTo(ReactNativeReconcileTransaction);

var ReactNativeReconcileTransaction_1 = ReactNativeReconcileTransaction, ReactNativeComponentEnvironment = {
    processChildrenUpdates: ReactNativeDOMIDOperations_1.dangerouslyProcessChildrenUpdates,
    replaceNodeWithMarkup: ReactNativeDOMIDOperations_1.dangerouslyReplaceNodeWithMarkupByID,
    clearNode: function() {},
    ReactReconcileTransaction: ReactNativeReconcileTransaction_1
}, ReactNativeComponentEnvironment_1 = ReactNativeComponentEnvironment, ReactNativeTextComponent = function(text) {
    this._currentElement = text, this._stringText = "" + text, this._hostParent = null, 
    this._rootNodeID = 0;
};

Object.assign(ReactNativeTextComponent.prototype, {
    mountComponent: function(transaction, hostParent, hostContainerInfo, context) {
        invariant(context.isInAParentText, 'RawText "%s" must be wrapped in an explicit <Text> component.', this._stringText), 
        this._hostParent = hostParent;
        var tag = ReactNativeTagHandles_1.allocateTag();
        this._rootNodeID = tag;
        var nativeTopRootTag = hostContainerInfo._tag;
        return UIManager.createView(tag, "RCTRawText", nativeTopRootTag, {
            text: this._stringText
        }), ReactNativeComponentTree_1.precacheNode(this, tag), tag;
    },
    getHostNode: function() {
        return this._rootNodeID;
    },
    receiveComponent: function(nextText, transaction, context) {
        if (nextText !== this._currentElement) {
            this._currentElement = nextText;
            var nextStringText = "" + nextText;
            nextStringText !== this._stringText && (this._stringText = nextStringText, UIManager.updateView(this._rootNodeID, "RCTRawText", {
                text: this._stringText
            }));
        }
    },
    unmountComponent: function() {
        ReactNativeComponentTree_1.uncacheNode(this), this._currentElement = null, this._stringText = null, 
        this._rootNodeID = 0;
    }
});

var ReactNativeTextComponent_1 = ReactNativeTextComponent, ReactSimpleEmptyComponent = function(placeholderElement, instantiate) {
    this._currentElement = null, this._renderedComponent = instantiate(placeholderElement);
};

Object.assign(ReactSimpleEmptyComponent.prototype, {
    mountComponent: function(transaction, hostParent, hostContainerInfo, context, parentDebugID) {
        return ReactReconciler_1.mountComponent(this._renderedComponent, transaction, hostParent, hostContainerInfo, context, parentDebugID);
    },
    receiveComponent: function() {},
    getHostNode: function() {
        return ReactReconciler_1.getHostNode(this._renderedComponent);
    },
    unmountComponent: function(safely, skipLifecycle) {
        ReactReconciler_1.unmountComponent(this._renderedComponent, safely, skipLifecycle), 
        this._renderedComponent = null;
    }
});

var ReactSimpleEmptyComponent_1 = ReactSimpleEmptyComponent;

function inject$1() {
    ReactGenericBatching_1.injection.injectStackBatchedUpdates(ReactUpdates_1.batchedUpdates), 
    ReactUpdates_1.injection.injectReconcileTransaction(ReactNativeComponentEnvironment_1.ReactReconcileTransaction), 
    ReactUpdates_1.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy_1), 
    ReactComponentEnvironment_1.injection.injectEnvironment(ReactNativeComponentEnvironment_1);
    var EmptyComponent = function(instantiate) {
        var View = require("View");
        return new ReactSimpleEmptyComponent_1(React.createElement(View, {
            collapsable: !0,
            style: {
                position: "absolute"
            }
        }), instantiate);
    };
    ReactEmptyComponent_1.injection.injectEmptyComponentFactory(EmptyComponent), ReactHostComponent_1.injection.injectTextComponentClass(ReactNativeTextComponent_1), 
    ReactHostComponent_1.injection.injectGenericComponentClass(function(tag) {
        var info = "";
        "string" == typeof tag && /^[a-z]/.test(tag) && (info += " Each component name should start with an uppercase letter."), 
        invariant(!1, "Expected a component class, got %s.%s", tag, info);
    });
}

var ReactNativeStackInjection = {
    inject: inject$1
};

function getComponentName(instanceOrFiber) {
    if ("function" == typeof instanceOrFiber.getName) {
        return instanceOrFiber.getName();
    }
    if ("number" == typeof instanceOrFiber.tag) {
        var fiber = instanceOrFiber, type = fiber.type;
        if ("string" == typeof type) return type;
        if ("function" == typeof type) return type.displayName || type.name;
    }
    return null;
}

var getComponentName_1 = getComponentName, getInspectorDataForViewTag = void 0, traverseOwnerTreeUp = function(hierarchy, instance) {
    instance && (hierarchy.unshift(instance), traverseOwnerTreeUp(hierarchy, instance._currentElement._owner));
}, getOwnerHierarchy = function(instance) {
    var hierarchy = [];
    return traverseOwnerTreeUp(hierarchy, instance), hierarchy;
}, lastNotNativeInstance = function(hierarchy) {
    for (var i = hierarchy.length - 1; i > 1; i--) {
        var instance = hierarchy[i];
        if (!instance.viewConfig) return instance;
    }
    return hierarchy[0];
}, getHostProps = function(component) {
    var instance = component._instance;
    return instance ? instance.props || emptyObject : emptyObject;
}, createHierarchy = function(componentHierarchy) {
    return componentHierarchy.map(function(component) {
        return {
            name: getComponentName_1(component),
            getInspectorData: function() {
                return {
                    measure: function(callback) {
                        return UIManager.measure(component.getHostNode(), callback);
                    },
                    props: getHostProps(component),
                    source: component._currentElement && component._currentElement._source
                };
            }
        };
    });
};

getInspectorDataForViewTag = function(viewTag) {
    var component = ReactNativeComponentTree_1.getClosestInstanceFromNode(viewTag);
    if (!component) return {
        hierarchy: [],
        props: emptyObject,
        selection: null,
        source: null
    };
    var componentHierarchy = getOwnerHierarchy(component), instance = lastNotNativeInstance(componentHierarchy), hierarchy = createHierarchy(componentHierarchy), props = getHostProps(instance), source = instance._currentElement && instance._currentElement._source;
    return {
        hierarchy: hierarchy,
        props: props,
        selection: componentHierarchy.indexOf(instance),
        source: source
    };
};

var ReactNativeStackInspector = {
    getInspectorDataForViewTag: getInspectorDataForViewTag
}, findNumericNodeHandleStack = function(componentOrHandle) {
    var nodeHandle = findNodeHandle_1(componentOrHandle);
    return null == nodeHandle || "number" == typeof nodeHandle ? nodeHandle : nodeHandle.getHostNode();
};

function _classCallCheck$2(instance, Constructor) {
    if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
}

var objects = {}, uniqueID = 1, emptyObject$3 = {}, ReactNativePropRegistry = function() {
    function ReactNativePropRegistry() {
        _classCallCheck$2(this, ReactNativePropRegistry);
    }
    return ReactNativePropRegistry.register = function(object) {
        var id = ++uniqueID;
        return Object.freeze(object), objects[id] = object, id;
    }, ReactNativePropRegistry.getByID = function(id) {
        if (!id) return emptyObject$3;
        var object = objects[id];
        return object || (console.warn("Invalid style with id `" + id + "`. Skipping ..."), 
        emptyObject$3);
    }, ReactNativePropRegistry;
}(), ReactNativePropRegistry_1 = ReactNativePropRegistry, emptyObject$2 = {}, removedKeys = null, removedKeyCount = 0;

function defaultDiffer(prevProp, nextProp) {
    return "object" != typeof nextProp || null === nextProp || deepDiffer(prevProp, nextProp);
}

function resolveObject(idOrObject) {
    return "number" == typeof idOrObject ? ReactNativePropRegistry_1.getByID(idOrObject) : idOrObject;
}

function restoreDeletedValuesInNestedArray(updatePayload, node, validAttributes) {
    if (Array.isArray(node)) for (var i = node.length; i-- && removedKeyCount > 0; ) restoreDeletedValuesInNestedArray(updatePayload, node[i], validAttributes); else if (node && removedKeyCount > 0) {
        var obj = resolveObject(node);
        for (var propKey in removedKeys) if (removedKeys[propKey]) {
            var nextProp = obj[propKey];
            if (void 0 !== nextProp) {
                var attributeConfig = validAttributes[propKey];
                if (attributeConfig) {
                    if ("function" == typeof nextProp && (nextProp = !0), void 0 === nextProp && (nextProp = null), 
                    "object" != typeof attributeConfig) updatePayload[propKey] = nextProp; else if ("function" == typeof attributeConfig.diff || "function" == typeof attributeConfig.process) {
                        var nextValue = "function" == typeof attributeConfig.process ? attributeConfig.process(nextProp) : nextProp;
                        updatePayload[propKey] = nextValue;
                    }
                    removedKeys[propKey] = !1, removedKeyCount--;
                }
            }
        }
    }
}

function diffNestedArrayProperty(updatePayload, prevArray, nextArray, validAttributes) {
    var i, minLength = prevArray.length < nextArray.length ? prevArray.length : nextArray.length;
    for (i = 0; i < minLength; i++) updatePayload = diffNestedProperty(updatePayload, prevArray[i], nextArray[i], validAttributes);
    for (;i < prevArray.length; i++) updatePayload = clearNestedProperty(updatePayload, prevArray[i], validAttributes);
    for (;i < nextArray.length; i++) updatePayload = addNestedProperty(updatePayload, nextArray[i], validAttributes);
    return updatePayload;
}

function diffNestedProperty(updatePayload, prevProp, nextProp, validAttributes) {
    return updatePayload || prevProp !== nextProp ? prevProp && nextProp ? Array.isArray(prevProp) || Array.isArray(nextProp) ? Array.isArray(prevProp) && Array.isArray(nextProp) ? diffNestedArrayProperty(updatePayload, prevProp, nextProp, validAttributes) : Array.isArray(prevProp) ? diffProperties(updatePayload, flattenStyle(prevProp), resolveObject(nextProp), validAttributes) : diffProperties(updatePayload, resolveObject(prevProp), flattenStyle(nextProp), validAttributes) : diffProperties(updatePayload, resolveObject(prevProp), resolveObject(nextProp), validAttributes) : nextProp ? addNestedProperty(updatePayload, nextProp, validAttributes) : prevProp ? clearNestedProperty(updatePayload, prevProp, validAttributes) : updatePayload : updatePayload;
}

function addNestedProperty(updatePayload, nextProp, validAttributes) {
    if (!nextProp) return updatePayload;
    if (!Array.isArray(nextProp)) return addProperties(updatePayload, resolveObject(nextProp), validAttributes);
    for (var i = 0; i < nextProp.length; i++) updatePayload = addNestedProperty(updatePayload, nextProp[i], validAttributes);
    return updatePayload;
}

function clearNestedProperty(updatePayload, prevProp, validAttributes) {
    if (!prevProp) return updatePayload;
    if (!Array.isArray(prevProp)) return clearProperties(updatePayload, resolveObject(prevProp), validAttributes);
    for (var i = 0; i < prevProp.length; i++) updatePayload = clearNestedProperty(updatePayload, prevProp[i], validAttributes);
    return updatePayload;
}

function diffProperties(updatePayload, prevProps, nextProps, validAttributes) {
    var attributeConfig, nextProp, prevProp;
    for (var propKey in nextProps) if (attributeConfig = validAttributes[propKey]) if (prevProp = prevProps[propKey], 
    nextProp = nextProps[propKey], "function" == typeof nextProp && (nextProp = !0, 
    "function" == typeof prevProp && (prevProp = !0)), void 0 === nextProp && (nextProp = null, 
    void 0 === prevProp && (prevProp = null)), removedKeys && (removedKeys[propKey] = !1), 
    updatePayload && void 0 !== updatePayload[propKey]) {
        if ("object" != typeof attributeConfig) updatePayload[propKey] = nextProp; else if ("function" == typeof attributeConfig.diff || "function" == typeof attributeConfig.process) {
            var nextValue = "function" == typeof attributeConfig.process ? attributeConfig.process(nextProp) : nextProp;
            updatePayload[propKey] = nextValue;
        }
    } else if (prevProp !== nextProp) if ("object" != typeof attributeConfig) defaultDiffer(prevProp, nextProp) && ((updatePayload || (updatePayload = {}))[propKey] = nextProp); else if ("function" == typeof attributeConfig.diff || "function" == typeof attributeConfig.process) {
        var shouldUpdate = void 0 === prevProp || ("function" == typeof attributeConfig.diff ? attributeConfig.diff(prevProp, nextProp) : defaultDiffer(prevProp, nextProp));
        shouldUpdate && (nextValue = "function" == typeof attributeConfig.process ? attributeConfig.process(nextProp) : nextProp, 
        (updatePayload || (updatePayload = {}))[propKey] = nextValue);
    } else removedKeys = null, removedKeyCount = 0, updatePayload = diffNestedProperty(updatePayload, prevProp, nextProp, attributeConfig), 
    removedKeyCount > 0 && updatePayload && (restoreDeletedValuesInNestedArray(updatePayload, nextProp, attributeConfig), 
    removedKeys = null);
    for (propKey in prevProps) void 0 === nextProps[propKey] && (attributeConfig = validAttributes[propKey]) && (updatePayload && void 0 !== updatePayload[propKey] || void 0 !== (prevProp = prevProps[propKey]) && ("object" != typeof attributeConfig || "function" == typeof attributeConfig.diff || "function" == typeof attributeConfig.process ? ((updatePayload || (updatePayload = {}))[propKey] = null, 
    removedKeys || (removedKeys = {}), removedKeys[propKey] || (removedKeys[propKey] = !0, 
    removedKeyCount++)) : updatePayload = clearNestedProperty(updatePayload, prevProp, attributeConfig)));
    return updatePayload;
}

function addProperties(updatePayload, props, validAttributes) {
    return diffProperties(updatePayload, emptyObject$2, props, validAttributes);
}

function clearProperties(updatePayload, prevProps, validAttributes) {
    return diffProperties(updatePayload, prevProps, emptyObject$2, validAttributes);
}

var ReactNativeAttributePayload = {
    create: function(props, validAttributes) {
        return addProperties(null, props, validAttributes);
    },
    diff: function(prevProps, nextProps, validAttributes) {
        return diffProperties(null, prevProps, nextProps, validAttributes);
    }
}, ReactNativeAttributePayload_1 = ReactNativeAttributePayload;

function mountSafeCallback$1(context, callback) {
    return function() {
        if (callback) {
            if ("boolean" == typeof context.__isMounted) {
                if (!context.__isMounted) return;
            } else if ("function" == typeof context.isMounted && !context.isMounted()) return;
            return callback.apply(context, arguments);
        }
    };
}

function throwOnStylesProp(component, props) {
    if (void 0 !== props.styles) {
        var owner = component._owner || null, name = component.constructor.displayName, msg = "`styles` is not a supported property of `" + name + "`, did " + "you mean `style` (singular)?";
        throw owner && owner.constructor && owner.constructor.displayName && (msg += "\n\nCheck the `" + owner.constructor.displayName + "` parent " + " component."), 
        new Error(msg);
    }
}

function warnForStyleProps(props, validAttributes) {
    for (var key in validAttributes.style) validAttributes[key] || void 0 === props[key] || console.error("You are setting the style `{ " + key + ": ... }` as a prop. You " + "should nest it in a style object. " + "E.g. `{ style: { " + key + ": ... } }`");
}

var NativeMethodsMixinUtils = {
    mountSafeCallback: mountSafeCallback$1,
    throwOnStylesProp: throwOnStylesProp,
    warnForStyleProps: warnForStyleProps
};

function _classCallCheck$1(instance, Constructor) {
    if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
}

function _possibleConstructorReturn(self, call) {
    if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return !call || "object" != typeof call && "function" != typeof call ? self : call;
}

function _inherits(subClass, superClass) {
    if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            enumerable: !1,
            writable: !0,
            configurable: !0
        }
    }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass);
}

var ReactNativeFeatureFlags$1 = require("ReactNativeFeatureFlags"), mountSafeCallback = NativeMethodsMixinUtils.mountSafeCallback, findNumericNodeHandle = ReactNativeFeatureFlags$1.useFiber ? DevOnlyStubShim : findNumericNodeHandleStack, ReactNativeComponent = function(_React$Component) {
    _inherits(ReactNativeComponent, _React$Component);
    function ReactNativeComponent() {
        return _classCallCheck$1(this, ReactNativeComponent), _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
    }
    return ReactNativeComponent.prototype.blur = function() {
        TextInputState.blurTextInput(findNumericNodeHandle(this));
    }, ReactNativeComponent.prototype.focus = function() {
        TextInputState.focusTextInput(findNumericNodeHandle(this));
    }, ReactNativeComponent.prototype.measure = function(callback) {
        UIManager.measure(findNumericNodeHandle(this), mountSafeCallback(this, callback));
    }, ReactNativeComponent.prototype.measureInWindow = function(callback) {
        UIManager.measureInWindow(findNumericNodeHandle(this), mountSafeCallback(this, callback));
    }, ReactNativeComponent.prototype.measureLayout = function(relativeToNativeNode, onSuccess, onFail) {
        UIManager.measureLayout(findNumericNodeHandle(this), relativeToNativeNode, mountSafeCallback(this, onFail), mountSafeCallback(this, onSuccess));
    }, ReactNativeComponent.prototype.setNativeProps = function(nativeProps) {
        injectedSetNativeProps(this, nativeProps);
    }, ReactNativeComponent;
}(React.Component);

function setNativePropsFiber(componentOrHandle, nativeProps) {
    var maybeInstance = void 0;
    try {
        maybeInstance = findNodeHandle_1(componentOrHandle);
    } catch (error) {}
    if (null != maybeInstance) {
        var viewConfig = maybeInstance.viewConfig, updatePayload = ReactNativeAttributePayload_1.create(nativeProps, viewConfig.validAttributes);
        UIManager.updateView(maybeInstance._nativeTag, viewConfig.uiViewClassName, updatePayload);
    }
}

function setNativePropsStack(componentOrHandle, nativeProps) {
    var maybeInstance = findNodeHandle_1(componentOrHandle);
    if (null != maybeInstance) {
        var viewConfig = void 0;
        if (void 0 !== maybeInstance.viewConfig) viewConfig = maybeInstance.viewConfig; else if (void 0 !== maybeInstance._instance && void 0 !== maybeInstance._instance.viewConfig) viewConfig = maybeInstance._instance.viewConfig; else {
            for (;void 0 !== maybeInstance._renderedComponent; ) maybeInstance = maybeInstance._renderedComponent;
            viewConfig = maybeInstance.viewConfig;
        }
        var tag = "function" == typeof maybeInstance.getHostNode ? maybeInstance.getHostNode() : maybeInstance._rootNodeID, updatePayload = ReactNativeAttributePayload_1.create(nativeProps, viewConfig.validAttributes);
        UIManager.updateView(tag, viewConfig.uiViewClassName, updatePayload);
    }
}

var injectedSetNativeProps = void 0;

injectedSetNativeProps = ReactNativeFeatureFlags$1.useFiber ? setNativePropsFiber : setNativePropsStack;

var ReactNativeComponent_1 = ReactNativeComponent, ReactNativeFeatureFlags$2 = require("ReactNativeFeatureFlags"), mountSafeCallback$2 = NativeMethodsMixinUtils.mountSafeCallback, throwOnStylesProp$1 = NativeMethodsMixinUtils.throwOnStylesProp, warnForStyleProps$1 = NativeMethodsMixinUtils.warnForStyleProps, findNumericNodeHandle$1 = ReactNativeFeatureFlags$2.useFiber ? DevOnlyStubShim : findNumericNodeHandleStack, NativeMethodsMixin = {
    measure: function(callback) {
        UIManager.measure(findNumericNodeHandle$1(this), mountSafeCallback$2(this, callback));
    },
    measureInWindow: function(callback) {
        UIManager.measureInWindow(findNumericNodeHandle$1(this), mountSafeCallback$2(this, callback));
    },
    measureLayout: function(relativeToNativeNode, onSuccess, onFail) {
        UIManager.measureLayout(findNumericNodeHandle$1(this), relativeToNativeNode, mountSafeCallback$2(this, onFail), mountSafeCallback$2(this, onSuccess));
    },
    setNativeProps: function(nativeProps) {
        injectedSetNativeProps$1(this, nativeProps);
    },
    focus: function() {
        TextInputState.focusTextInput(findNumericNodeHandle$1(this));
    },
    blur: function() {
        TextInputState.blurTextInput(findNumericNodeHandle$1(this));
    }
};

function setNativePropsFiber$1(componentOrHandle, nativeProps) {
    var maybeInstance = void 0;
    try {
        maybeInstance = findNodeHandle_1(componentOrHandle);
    } catch (error) {}
    if (null != maybeInstance) {
        var viewConfig = maybeInstance.viewConfig;
        warnForStyleProps$1(nativeProps, viewConfig.validAttributes);
        var updatePayload = ReactNativeAttributePayload_1.create(nativeProps, viewConfig.validAttributes);
        UIManager.updateView(maybeInstance._nativeTag, viewConfig.uiViewClassName, updatePayload);
    }
}

function setNativePropsStack$1(componentOrHandle, nativeProps) {
    var maybeInstance = findNodeHandle_1(componentOrHandle);
    if (null != maybeInstance) {
        var viewConfig = void 0;
        if (void 0 !== maybeInstance.viewConfig) viewConfig = maybeInstance.viewConfig; else if (void 0 !== maybeInstance._instance && void 0 !== maybeInstance._instance.viewConfig) viewConfig = maybeInstance._instance.viewConfig; else {
            for (;void 0 !== maybeInstance._renderedComponent; ) maybeInstance = maybeInstance._renderedComponent;
            viewConfig = maybeInstance.viewConfig;
        }
        var tag = "function" == typeof maybeInstance.getHostNode ? maybeInstance.getHostNode() : maybeInstance._rootNodeID;
        warnForStyleProps$1(nativeProps, viewConfig.validAttributes);
        var updatePayload = ReactNativeAttributePayload_1.create(nativeProps, viewConfig.validAttributes);
        UIManager.updateView(tag, viewConfig.uiViewClassName, updatePayload);
    }
}

var injectedSetNativeProps$1 = void 0;

injectedSetNativeProps$1 = ReactNativeFeatureFlags$2.useFiber ? setNativePropsFiber$1 : setNativePropsStack$1;

var NativeMethodsMixin_DEV = NativeMethodsMixin;

invariant(!NativeMethodsMixin_DEV.componentWillMount && !NativeMethodsMixin_DEV.componentWillReceiveProps, "Do not override existing functions."), 
NativeMethodsMixin_DEV.componentWillMount = function() {
    throwOnStylesProp$1(this, this.props);
}, NativeMethodsMixin_DEV.componentWillReceiveProps = function(newProps) {
    throwOnStylesProp$1(this, newProps);
};

var NativeMethodsMixin_1 = NativeMethodsMixin, TouchHistoryMath = {
    centroidDimension: function(touchHistory, touchesChangedAfter, isXAxis, ofCurrent) {
        var touchBank = touchHistory.touchBank, total = 0, count = 0, oneTouchData = 1 === touchHistory.numberActiveTouches ? touchHistory.touchBank[touchHistory.indexOfSingleActiveTouch] : null;
        if (null !== oneTouchData) oneTouchData.touchActive && oneTouchData.currentTimeStamp > touchesChangedAfter && (total += ofCurrent && isXAxis ? oneTouchData.currentPageX : ofCurrent && !isXAxis ? oneTouchData.currentPageY : !ofCurrent && isXAxis ? oneTouchData.previousPageX : oneTouchData.previousPageY, 
        count = 1); else for (var i = 0; i < touchBank.length; i++) {
            var touchTrack = touchBank[i];
            if (null !== touchTrack && void 0 !== touchTrack && touchTrack.touchActive && touchTrack.currentTimeStamp >= touchesChangedAfter) {
                var toAdd;
                toAdd = ofCurrent && isXAxis ? touchTrack.currentPageX : ofCurrent && !isXAxis ? touchTrack.currentPageY : !ofCurrent && isXAxis ? touchTrack.previousPageX : touchTrack.previousPageY, 
                total += toAdd, count++;
            }
        }
        return count > 0 ? total / count : TouchHistoryMath.noCentroid;
    },
    currentCentroidXOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, !0, !0);
    },
    currentCentroidYOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, !1, !0);
    },
    previousCentroidXOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, !0, !1);
    },
    previousCentroidYOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, !1, !1);
    },
    currentCentroidX: function(touchHistory) {
        return TouchHistoryMath.centroidDimension(touchHistory, 0, !0, !0);
    },
    currentCentroidY: function(touchHistory) {
        return TouchHistoryMath.centroidDimension(touchHistory, 0, !1, !0);
    },
    noCentroid: -1
}, TouchHistoryMath_1 = TouchHistoryMath;

function escape(key) {
    var escaperLookup = {
        "=": "=0",
        ":": "=2"
    };
    return "$" + ("" + key).replace(/[=:]/g, function(match) {
        return escaperLookup[match];
    });
}

var unescapeInDev = emptyFunction;

unescapeInDev = function(key) {
    var unescapeRegex = /(=0|=2)/g, unescaperLookup = {
        "=0": "=",
        "=2": ":"
    };
    return ("" + ("." === key[0] && "$" === key[1] ? key.substring(2) : key.substring(1))).replace(unescapeRegex, function(match) {
        return unescaperLookup[match];
    });
};

var KeyEscapeUtils = {
    escape: escape,
    unescapeInDev: unescapeInDev
}, KeyEscapeUtils_1 = KeyEscapeUtils, ITERATOR_SYMBOL = "function" == typeof Symbol && Symbol.iterator, FAUX_ITERATOR_SYMBOL = "@@iterator", REACT_ELEMENT_TYPE = "function" == typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103, getCurrentStackAddendum = ReactGlobalSharedState_1.ReactComponentTreeHook.getCurrentStackAddendum, SEPARATOR = ".", SUBSEPARATOR = ":", didWarnAboutMaps = !1;

function getComponentKey(component, index) {
    return component && "object" == typeof component && null != component.key ? KeyEscapeUtils_1.escape(component.key) : index.toString(36);
}

function traverseStackChildrenImpl(children, nameSoFar, callback, traverseContext) {
    var type = typeof children;
    if ("undefined" !== type && "boolean" !== type || (children = null), null === children || "string" === type || "number" === type || "object" === type && children.$$typeof === REACT_ELEMENT_TYPE) return callback(traverseContext, children, "" === nameSoFar ? SEPARATOR + getComponentKey(children, 0) : nameSoFar), 
    1;
    var child, nextName, subtreeCount = 0, nextNamePrefix = "" === nameSoFar ? SEPARATOR : nameSoFar + SUBSEPARATOR;
    if (Array.isArray(children)) for (var i = 0; i < children.length; i++) child = children[i], 
    nextName = nextNamePrefix + getComponentKey(child, i), subtreeCount += traverseStackChildrenImpl(child, nextName, callback, traverseContext); else {
        var iteratorFn = ITERATOR_SYMBOL && children[ITERATOR_SYMBOL] || children[FAUX_ITERATOR_SYMBOL];
        if ("function" == typeof iteratorFn) {
            iteratorFn === children.entries && (warning(didWarnAboutMaps, "Using Maps as children is unsupported and will likely yield " + "unexpected results. Convert it to a sequence/iterable of keyed " + "ReactElements instead.%s", getCurrentStackAddendum()), 
            didWarnAboutMaps = !0);
            for (var step, iterator = iteratorFn.call(children), ii = 0; !(step = iterator.next()).done; ) child = step.value, 
            nextName = nextNamePrefix + getComponentKey(child, ii++), subtreeCount += traverseStackChildrenImpl(child, nextName, callback, traverseContext);
        } else if ("object" === type) {
            var addendum = "";
            addendum = " If you meant to render a collection of children, use an array " + "instead." + getCurrentStackAddendum();
            var childrenString = "" + children;
            invariant(!1, "Objects are not valid as a React child (found: %s).%s", "[object Object]" === childrenString ? "object with keys {" + Object.keys(children).join(", ") + "}" : childrenString, addendum);
        }
    }
    return subtreeCount;
}

function traverseStackChildren(children, callback, traverseContext) {
    return null == children ? 0 : traverseStackChildrenImpl(children, "", callback, traverseContext);
}

var traverseStackChildren_1 = traverseStackChildren, ReactComponentTreeHook$2;

"undefined" != typeof process && process.env && "development" == "test" && (ReactComponentTreeHook$2 = ReactGlobalSharedState_1.ReactComponentTreeHook);

function instantiateChild(childInstances, child, name, selfDebugID) {
    var keyUnique = void 0 === childInstances[name];
    ReactComponentTreeHook$2 || (ReactComponentTreeHook$2 = ReactGlobalSharedState_1.ReactComponentTreeHook), 
    keyUnique || warning(!1, "flattenChildren(...):" + "Encountered two children with the same key, `%s`. " + "Keys should be unique so that components maintain their identity " + "across updates. Non-unique keys may cause children to be " + "duplicated and/or omitted — the behavior is unsupported and " + "could change in a future version.%s", KeyEscapeUtils_1.unescapeInDev(name), ReactComponentTreeHook$2.getStackAddendumByID(selfDebugID)), 
    null != child && keyUnique && (childInstances[name] = instantiateReactComponent_1(child, !0));
}

var ReactChildReconciler = {
    instantiateChildren: function(nestedChildNodes, transaction, context, selfDebugID) {
        if (null == nestedChildNodes) return null;
        var childInstances = {};
        return traverseStackChildren_1(nestedChildNodes, function(childInsts, child, name) {
            return instantiateChild(childInsts, child, name, selfDebugID);
        }, childInstances), childInstances;
    },
    updateChildren: function(prevChildren, nextChildren, mountImages, removedNodes, transaction, hostParent, hostContainerInfo, context, selfDebugID) {
        if (nextChildren || prevChildren) {
            var name, prevChild;
            for (name in nextChildren) if (nextChildren.hasOwnProperty(name)) {
                prevChild = prevChildren && prevChildren[name];
                var prevElement = prevChild && prevChild._currentElement, nextElement = nextChildren[name];
                if (null != prevChild && shouldUpdateReactComponent_1(prevElement, nextElement)) ReactReconciler_1.receiveComponent(prevChild, nextElement, transaction, context), 
                nextChildren[name] = prevChild; else {
                    var nextChildInstance = instantiateReactComponent_1(nextElement, !0);
                    nextChildren[name] = nextChildInstance;
                    var nextChildMountImage = ReactReconciler_1.mountComponent(nextChildInstance, transaction, hostParent, hostContainerInfo, context, selfDebugID);
                    mountImages.push(nextChildMountImage), prevChild && (removedNodes[name] = ReactReconciler_1.getHostNode(prevChild), 
                    ReactReconciler_1.unmountComponent(prevChild, !1, !1));
                }
            }
            for (name in prevChildren) !prevChildren.hasOwnProperty(name) || nextChildren && nextChildren.hasOwnProperty(name) || (prevChild = prevChildren[name], 
            removedNodes[name] = ReactReconciler_1.getHostNode(prevChild), ReactReconciler_1.unmountComponent(prevChild, !1, !1));
        }
    },
    unmountChildren: function(renderedChildren, safely, skipLifecycle) {
        for (var name in renderedChildren) if (renderedChildren.hasOwnProperty(name)) {
            var renderedChild = renderedChildren[name];
            ReactReconciler_1.unmountComponent(renderedChild, safely, skipLifecycle);
        }
    }
}, ReactChildReconciler_1 = ReactChildReconciler, ReactComponentTreeHook$3;

"undefined" != typeof process && process.env && "development" == "test" && (ReactComponentTreeHook$3 = ReactGlobalSharedState_1.ReactComponentTreeHook);

function flattenSingleChildIntoContext(traverseContext, child, name, selfDebugID) {
    if (traverseContext && "object" == typeof traverseContext) {
        var result = traverseContext, keyUnique = void 0 === result[name];
        ReactComponentTreeHook$3 || (ReactComponentTreeHook$3 = ReactGlobalSharedState_1.ReactComponentTreeHook), 
        keyUnique || warning(!1, "flattenChildren(...): Encountered two children with the same key, " + "`%s`. " + "Keys should be unique so that components maintain their identity " + "across updates. Non-unique keys may cause children to be " + "duplicated and/or omitted — the behavior is unsupported and " + "could change in a future version.%s", KeyEscapeUtils_1.unescapeInDev(name), ReactComponentTreeHook$3.getStackAddendumByID(selfDebugID)), 
        keyUnique && null != child && (result[name] = child);
    }
}

function flattenStackChildren(children, selfDebugID) {
    if (null == children) return children;
    var result = {};
    return traverseStackChildren_1(children, function(traverseContext, child, name) {
        return flattenSingleChildIntoContext(traverseContext, child, name, selfDebugID);
    }, result), result;
}

var flattenStackChildren_1 = flattenStackChildren, ReactCurrentOwner$3 = ReactGlobalSharedState_1.ReactCurrentOwner;

function makeInsertMarkup(markup, afterNode, toIndex) {
    return {
        type: "INSERT_MARKUP",
        content: markup,
        fromIndex: null,
        fromNode: null,
        toIndex: toIndex,
        afterNode: afterNode
    };
}

function makeMove(child, afterNode, toIndex) {
    return {
        type: "MOVE_EXISTING",
        content: null,
        fromIndex: child._mountIndex,
        fromNode: ReactReconciler_1.getHostNode(child),
        toIndex: toIndex,
        afterNode: afterNode
    };
}

function makeRemove(child, node) {
    return {
        type: "REMOVE_NODE",
        content: null,
        fromIndex: child._mountIndex,
        fromNode: node,
        toIndex: null,
        afterNode: null
    };
}

function makeSetMarkup(markup) {
    return {
        type: "SET_MARKUP",
        content: markup,
        fromIndex: null,
        fromNode: null,
        toIndex: null,
        afterNode: null
    };
}

function makeTextContent(textContent) {
    return {
        type: "TEXT_CONTENT",
        content: textContent,
        fromIndex: null,
        fromNode: null,
        toIndex: null,
        afterNode: null
    };
}

function enqueue(queue, update) {
    return update && (queue = queue || [], queue.push(update)), queue;
}

function processQueue(inst, updateQueue) {
    ReactComponentEnvironment_1.processChildrenUpdates(inst, updateQueue);
}

var setChildrenForInstrumentation = emptyFunction, getDebugID = function(inst) {
    if (!inst._debugID) {
        var internal;
        (internal = ReactInstanceMap_1.get(inst)) && (inst = internal);
    }
    return inst._debugID;
};

setChildrenForInstrumentation = function(children) {
    var debugID = getDebugID(this);
    0 !== debugID && ReactInstrumentation.debugTool.onSetChildren(debugID, children ? Object.keys(children).map(function(key) {
        return children[key]._debugID;
    }) : []);
};

var ReactMultiChild = {
    _reconcilerInstantiateChildren: function(nestedChildren, transaction, context) {
        var selfDebugID = getDebugID(this);
        if (this._currentElement) try {
            return ReactCurrentOwner$3.current = this._currentElement._owner, ReactChildReconciler_1.instantiateChildren(nestedChildren, transaction, context, selfDebugID);
        } finally {
            ReactCurrentOwner$3.current = null;
        }
        return ReactChildReconciler_1.instantiateChildren(nestedChildren, transaction, context);
    },
    _reconcilerUpdateChildren: function(prevChildren, nextNestedChildrenElements, mountImages, removedNodes, transaction, context) {
        var nextChildren, selfDebugID = 0;
        if (selfDebugID = getDebugID(this), this._currentElement) {
            try {
                ReactCurrentOwner$3.current = this._currentElement._owner, nextChildren = flattenStackChildren_1(nextNestedChildrenElements, selfDebugID);
            } finally {
                ReactCurrentOwner$3.current = null;
            }
            return ReactChildReconciler_1.updateChildren(prevChildren, nextChildren, mountImages, removedNodes, transaction, this, this._hostContainerInfo, context, selfDebugID), 
            nextChildren;
        }
        return nextChildren = flattenStackChildren_1(nextNestedChildrenElements, selfDebugID), 
        ReactChildReconciler_1.updateChildren(prevChildren, nextChildren, mountImages, removedNodes, transaction, this, this._hostContainerInfo, context, selfDebugID), 
        nextChildren;
    },
    mountChildren: function(nestedChildren, transaction, context) {
        var children = this._reconcilerInstantiateChildren(nestedChildren, transaction, context);
        this._renderedChildren = children;
        var mountImages = [], index = 0;
        for (var name in children) if (children.hasOwnProperty(name)) {
            var child = children[name], selfDebugID = 0;
            selfDebugID = getDebugID(this);
            var mountImage = ReactReconciler_1.mountComponent(child, transaction, this, this._hostContainerInfo, context, selfDebugID);
            child._mountIndex = index++, mountImages.push(mountImage);
        }
        return setChildrenForInstrumentation.call(this, children), mountImages;
    },
    updateTextContent: function(nextContent) {
        var prevChildren = this._renderedChildren;
        ReactChildReconciler_1.unmountChildren(prevChildren, !1, !1);
        for (var name in prevChildren) prevChildren.hasOwnProperty(name) && invariant(!1, "updateTextContent called on non-empty component.");
        processQueue(this, [ makeTextContent(nextContent) ]);
    },
    updateMarkup: function(nextMarkup) {
        var prevChildren = this._renderedChildren;
        ReactChildReconciler_1.unmountChildren(prevChildren, !1, !1);
        for (var name in prevChildren) prevChildren.hasOwnProperty(name) && invariant(!1, "updateTextContent called on non-empty component.");
        processQueue(this, [ makeSetMarkup(nextMarkup) ]);
    },
    updateChildren: function(nextNestedChildrenElements, transaction, context) {
        this._updateChildren(nextNestedChildrenElements, transaction, context);
    },
    _updateChildren: function(nextNestedChildrenElements, transaction, context) {
        var prevChildren = this._renderedChildren, removedNodes = {}, mountImages = [], nextChildren = this._reconcilerUpdateChildren(prevChildren, nextNestedChildrenElements, mountImages, removedNodes, transaction, context);
        if (nextChildren || prevChildren) {
            var name, updates = null, nextIndex = 0, lastIndex = 0, nextMountIndex = 0, lastPlacedNode = null;
            for (name in nextChildren) if (nextChildren.hasOwnProperty(name)) {
                var prevChild = prevChildren && prevChildren[name], nextChild = nextChildren[name];
                prevChild === nextChild ? (updates = enqueue(updates, this.moveChild(prevChild, lastPlacedNode, nextIndex, lastIndex)), 
                lastIndex = Math.max(prevChild._mountIndex, lastIndex), prevChild._mountIndex = nextIndex) : (prevChild && (lastIndex = Math.max(prevChild._mountIndex, lastIndex)), 
                updates = enqueue(updates, this._mountChildAtIndex(nextChild, mountImages[nextMountIndex], lastPlacedNode, nextIndex, transaction, context)), 
                nextMountIndex++), nextIndex++, lastPlacedNode = ReactReconciler_1.getHostNode(nextChild);
            }
            for (name in removedNodes) removedNodes.hasOwnProperty(name) && (updates = enqueue(updates, this._unmountChild(prevChildren[name], removedNodes[name])));
            updates && processQueue(this, updates), this._renderedChildren = nextChildren, setChildrenForInstrumentation.call(this, nextChildren);
        }
    },
    unmountChildren: function(safely, skipLifecycle) {
        var renderedChildren = this._renderedChildren;
        ReactChildReconciler_1.unmountChildren(renderedChildren, safely, skipLifecycle), 
        this._renderedChildren = null;
    },
    moveChild: function(child, afterNode, toIndex, lastIndex) {
        if (child._mountIndex < lastIndex) return makeMove(child, afterNode, toIndex);
    },
    createChild: function(child, afterNode, mountImage) {
        return makeInsertMarkup(mountImage, afterNode, child._mountIndex);
    },
    removeChild: function(child, node) {
        return makeRemove(child, node);
    },
    _mountChildAtIndex: function(child, mountImage, afterNode, index, transaction, context) {
        return child._mountIndex = index, this.createChild(child, afterNode, mountImage);
    },
    _unmountChild: function(child, node) {
        var update = this.removeChild(child, node);
        return child._mountIndex = null, update;
    }
}, ReactMultiChild_1 = ReactMultiChild, ReactNativeBaseComponent = function(viewConfig) {
    this.viewConfig = viewConfig;
};

ReactNativeBaseComponent.Mixin = {
    getPublicInstance: function() {
        return this;
    },
    unmountComponent: function(safely, skipLifecycle) {
        ReactNativeComponentTree_1.uncacheNode(this), this.unmountChildren(safely, skipLifecycle), 
        this._rootNodeID = 0;
    },
    initializeChildren: function(children, containerTag, transaction, context) {
        var mountImages = this.mountChildren(children, transaction, context);
        if (mountImages.length) {
            for (var createdTags = [], i = 0, l = mountImages.length; i < l; i++) {
                var mountImage = mountImages[i], childTag = mountImage;
                createdTags[i] = childTag;
            }
            UIManager.setChildren(containerTag, createdTags);
        }
    },
    receiveComponent: function(nextElement, transaction, context) {
        var prevElement = this._currentElement;
        this._currentElement = nextElement;
        for (var key in this.viewConfig.validAttributes) nextElement.props.hasOwnProperty(key) && deepFreezeAndThrowOnMutationInDev(nextElement.props[key]);
        var updatePayload = ReactNativeAttributePayload_1.diff(prevElement.props, nextElement.props, this.viewConfig.validAttributes);
        updatePayload && UIManager.updateView(this._rootNodeID, this.viewConfig.uiViewClassName, updatePayload), 
        this.updateChildren(nextElement.props.children, transaction, context);
    },
    getName: function() {
        return this.constructor.displayName || this.constructor.name || "Unknown";
    },
    getHostNode: function() {
        return this._rootNodeID;
    },
    mountComponent: function(transaction, hostParent, hostContainerInfo, context) {
        var tag = ReactNativeTagHandles_1.allocateTag();
        this._rootNodeID = tag, this._hostParent = hostParent, this._hostContainerInfo = hostContainerInfo;
        for (var key in this.viewConfig.validAttributes) this._currentElement.props.hasOwnProperty(key) && deepFreezeAndThrowOnMutationInDev(this._currentElement.props[key]);
        var updatePayload = ReactNativeAttributePayload_1.create(this._currentElement.props, this.viewConfig.validAttributes), nativeTopRootTag = hostContainerInfo._tag;
        return UIManager.createView(tag, this.viewConfig.uiViewClassName, nativeTopRootTag, updatePayload), 
        ReactNativeComponentTree_1.precacheNode(this, tag), this.initializeChildren(this._currentElement.props.children, tag, transaction, context), 
        tag;
    }
}, Object.assign(ReactNativeBaseComponent.prototype, ReactMultiChild_1, ReactNativeBaseComponent.Mixin, NativeMethodsMixin_1);

var ReactNativeBaseComponent_1 = ReactNativeBaseComponent, createReactNativeComponentClassStack = function(viewConfig) {
    var Constructor = function(element) {
        this._currentElement = element, this._topLevelWrapper = null, this._hostParent = null, 
        this._hostContainerInfo = null, this._rootNodeID = 0, this._renderedChildren = null;
    };
    return Constructor.displayName = viewConfig.uiViewClassName, Constructor.viewConfig = viewConfig, 
    Constructor.propTypes = viewConfig.propTypes, Constructor.prototype = new ReactNativeBaseComponent_1(viewConfig), 
    Constructor.prototype.constructor = Constructor, Constructor;
}, createReactNativeComponentClassStack_1 = createReactNativeComponentClassStack, ReactNativeFeatureFlags$3 = require("ReactNativeFeatureFlags"), createReactNativeComponentClass = ReactNativeFeatureFlags$3.useFiber ? DevOnlyStubShim : createReactNativeComponentClassStack_1, ReactNativeFeatureFlags$4 = require("ReactNativeFeatureFlags"), findNumericNodeHandle$2 = ReactNativeFeatureFlags$4.useFiber ? DevOnlyStubShim : findNumericNodeHandleStack;

function takeSnapshot(view, options) {
    return "number" != typeof view && "window" !== view && (view = findNumericNodeHandle$2(view) || "window"), 
    UIManager.__takeSnapshot(view, options);
}

var takeSnapshot_1 = takeSnapshot, lowPriorityWarning = function() {}, printWarning = function(format) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
    var argIndex = 0, message = "Warning: " + format.replace(/%s/g, function() {
        return args[argIndex++];
    });
    "undefined" != typeof console && console.warn(message);
    try {
        throw new Error(message);
    } catch (x) {}
};

lowPriorityWarning = function(condition, format) {
    if (void 0 === format) throw new Error("`warning(condition, format, ...args)` requires a warning " + "message argument");
    if (!condition) {
        for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) args[_key2 - 2] = arguments[_key2];
        printWarning.apply(void 0, [ format ].concat(args));
    }
};

var lowPriorityWarning_1 = lowPriorityWarning, _extends$2 = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
    }
    return target;
};

function roundFloat(val) {
    var base = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 2, n = Math.pow(10, base);
    return Math.floor(val * n) / n;
}

function consoleTable(table) {
    console.table(table);
}

function getLastMeasurements() {
    return ReactDebugTool_1.getFlushHistory();
}

function getExclusive() {
    var flushHistory = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : getLastMeasurements(), aggregatedStats = {}, affectedIDs = {};
    function updateAggregatedStats(treeSnapshot, instanceID, timerType, applyUpdate) {
        var displayName = treeSnapshot[instanceID].displayName, key = displayName, stats = aggregatedStats[key];
        stats || (affectedIDs[key] = {}, stats = aggregatedStats[key] = {
            key: key,
            instanceCount: 0,
            counts: {},
            durations: {},
            totalDuration: 0
        }), stats.durations[timerType] || (stats.durations[timerType] = 0), stats.counts[timerType] || (stats.counts[timerType] = 0), 
        affectedIDs[key][instanceID] = !0, applyUpdate(stats);
    }
    return flushHistory.forEach(function(flush) {
        var measurements = flush.measurements, treeSnapshot = flush.treeSnapshot;
        measurements.forEach(function(measurement) {
            var duration = measurement.duration, instanceID = measurement.instanceID, timerType = measurement.timerType;
            updateAggregatedStats(treeSnapshot, instanceID, timerType, function(stats) {
                stats.totalDuration += duration, stats.durations[timerType] += duration, stats.counts[timerType]++;
            });
        });
    }), Object.keys(aggregatedStats).map(function(key) {
        return _extends$2({}, aggregatedStats[key], {
            instanceCount: Object.keys(affectedIDs[key]).length
        });
    }).sort(function(a, b) {
        return b.totalDuration - a.totalDuration;
    });
}

function getInclusive() {
    var flushHistory = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : getLastMeasurements(), aggregatedStats = {}, affectedIDs = {};
    function updateAggregatedStats(treeSnapshot, instanceID, applyUpdate) {
        var _treeSnapshot$instanc = treeSnapshot[instanceID], displayName = _treeSnapshot$instanc.displayName, ownerID = _treeSnapshot$instanc.ownerID, owner = treeSnapshot[ownerID], key = (owner ? owner.displayName + " > " : "") + displayName, stats = aggregatedStats[key];
        stats || (affectedIDs[key] = {}, stats = aggregatedStats[key] = {
            key: key,
            instanceCount: 0,
            inclusiveRenderDuration: 0,
            renderCount: 0
        }), affectedIDs[key][instanceID] = !0, applyUpdate(stats);
    }
    var isCompositeByID = {};
    return flushHistory.forEach(function(flush) {
        flush.measurements.forEach(function(measurement) {
            var instanceID = measurement.instanceID;
            "render" === measurement.timerType && (isCompositeByID[instanceID] = !0);
        });
    }), flushHistory.forEach(function(flush) {
        var measurements = flush.measurements, treeSnapshot = flush.treeSnapshot;
        measurements.forEach(function(measurement) {
            var duration = measurement.duration, instanceID = measurement.instanceID;
            if ("render" === measurement.timerType) {
                updateAggregatedStats(treeSnapshot, instanceID, function(stats) {
                    stats.renderCount++;
                });
                for (var nextParentID = instanceID; nextParentID; ) isCompositeByID[nextParentID] && updateAggregatedStats(treeSnapshot, nextParentID, function(stats) {
                    stats.inclusiveRenderDuration += duration;
                }), nextParentID = treeSnapshot[nextParentID].parentID;
            }
        });
    }), Object.keys(aggregatedStats).map(function(key) {
        return _extends$2({}, aggregatedStats[key], {
            instanceCount: Object.keys(affectedIDs[key]).length
        });
    }).sort(function(a, b) {
        return b.inclusiveRenderDuration - a.inclusiveRenderDuration;
    });
}

function getWasted() {
    var flushHistory = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : getLastMeasurements(), aggregatedStats = {}, affectedIDs = {};
    function updateAggregatedStats(treeSnapshot, instanceID, applyUpdate) {
        var _treeSnapshot$instanc2 = treeSnapshot[instanceID], displayName = _treeSnapshot$instanc2.displayName, ownerID = _treeSnapshot$instanc2.ownerID, owner = treeSnapshot[ownerID], key = (owner ? owner.displayName + " > " : "") + displayName, stats = aggregatedStats[key];
        stats || (affectedIDs[key] = {}, stats = aggregatedStats[key] = {
            key: key,
            instanceCount: 0,
            inclusiveRenderDuration: 0,
            renderCount: 0
        }), affectedIDs[key][instanceID] = !0, applyUpdate(stats);
    }
    return flushHistory.forEach(function(flush) {
        var measurements = flush.measurements, treeSnapshot = flush.treeSnapshot, operations = flush.operations, isDefinitelyNotWastedByID = {};
        operations.forEach(function(operation) {
            for (var instanceID = operation.instanceID, nextParentID = instanceID; nextParentID; ) isDefinitelyNotWastedByID[nextParentID] = !0, 
            nextParentID = treeSnapshot[nextParentID].parentID;
        });
        var renderedCompositeIDs = {};
        measurements.forEach(function(measurement) {
            var instanceID = measurement.instanceID;
            "render" === measurement.timerType && (renderedCompositeIDs[instanceID] = !0);
        }), measurements.forEach(function(measurement) {
            var duration = measurement.duration, instanceID = measurement.instanceID;
            if ("render" === measurement.timerType) {
                var updateCount = treeSnapshot[instanceID].updateCount;
                if (!isDefinitelyNotWastedByID[instanceID] && 0 !== updateCount) {
                    updateAggregatedStats(treeSnapshot, instanceID, function(stats) {
                        stats.renderCount++;
                    });
                    for (var nextParentID = instanceID; nextParentID; ) renderedCompositeIDs[nextParentID] && !isDefinitelyNotWastedByID[nextParentID] && updateAggregatedStats(treeSnapshot, nextParentID, function(stats) {
                        stats.inclusiveRenderDuration += duration;
                    }), nextParentID = treeSnapshot[nextParentID].parentID;
                }
            }
        });
    }), Object.keys(aggregatedStats).map(function(key) {
        return _extends$2({}, aggregatedStats[key], {
            instanceCount: Object.keys(affectedIDs[key]).length
        });
    }).sort(function(a, b) {
        return b.inclusiveRenderDuration - a.inclusiveRenderDuration;
    });
}

function getOperations() {
    var flushHistory = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : getLastMeasurements(), stats = [];
    return flushHistory.forEach(function(flush, flushIndex) {
        var operations = flush.operations, treeSnapshot = flush.treeSnapshot;
        operations.forEach(function(operation) {
            var instanceID = operation.instanceID, type = operation.type, payload = operation.payload, _treeSnapshot$instanc3 = treeSnapshot[instanceID], displayName = _treeSnapshot$instanc3.displayName, ownerID = _treeSnapshot$instanc3.ownerID, owner = treeSnapshot[ownerID], key = (owner ? owner.displayName + " > " : "") + displayName;
            stats.push({
                flushIndex: flushIndex,
                instanceID: instanceID,
                key: key,
                type: type,
                ownerID: ownerID,
                payload: payload
            });
        });
    }), stats;
}

function printExclusive(flushHistory) {
    consoleTable(getExclusive(flushHistory).map(function(item) {
        var key = item.key, instanceCount = item.instanceCount, totalDuration = item.totalDuration, renderCount = item.counts.render || 0, renderDuration = item.durations.render || 0;
        return {
            Component: key,
            "Total time (ms)": roundFloat(totalDuration),
            "Instance count": instanceCount,
            "Total render time (ms)": roundFloat(renderDuration),
            "Average render time (ms)": renderCount ? roundFloat(renderDuration / renderCount) : void 0,
            "Render count": renderCount,
            "Total lifecycle time (ms)": roundFloat(totalDuration - renderDuration)
        };
    }));
}

function printInclusive(flushHistory) {
    consoleTable(getInclusive(flushHistory).map(function(item) {
        var key = item.key, instanceCount = item.instanceCount, inclusiveRenderDuration = item.inclusiveRenderDuration, renderCount = item.renderCount;
        return {
            "Owner > Component": key,
            "Inclusive render time (ms)": roundFloat(inclusiveRenderDuration),
            "Instance count": instanceCount,
            "Render count": renderCount
        };
    }));
}

function printWasted(flushHistory) {
    consoleTable(getWasted(flushHistory).map(function(item) {
        var key = item.key, instanceCount = item.instanceCount, inclusiveRenderDuration = item.inclusiveRenderDuration, renderCount = item.renderCount;
        return {
            "Owner > Component": key,
            "Inclusive wasted time (ms)": roundFloat(inclusiveRenderDuration),
            "Instance count": instanceCount,
            "Render count": renderCount
        };
    }));
}

function printOperations(flushHistory) {
    consoleTable(getOperations(flushHistory).map(function(stat) {
        return {
            "Owner > Node": stat.key,
            Operation: stat.type,
            Payload: "object" == typeof stat.payload ? JSON.stringify(stat.payload) : stat.payload,
            "Flush index": stat.flushIndex,
            "Owner Component ID": stat.ownerID,
            "DOM Component ID": stat.instanceID
        };
    }));
}

var warnedAboutPrintDOM = !1;

function printDOM(measurements) {
    return lowPriorityWarning_1(warnedAboutPrintDOM, "`ReactPerf.printDOM(...)` is deprecated. Use " + "`ReactPerf.printOperations(...)` instead."), 
    warnedAboutPrintDOM = !0, printOperations(measurements);
}

var warnedAboutGetMeasurementsSummaryMap = !1;

function getMeasurementsSummaryMap(measurements) {
    return lowPriorityWarning_1(warnedAboutGetMeasurementsSummaryMap, "`ReactPerf.getMeasurementsSummaryMap(...)` is deprecated. Use " + "`ReactPerf.getWasted(...)` instead."), 
    warnedAboutGetMeasurementsSummaryMap = !0, getWasted(measurements);
}

function start() {
    ReactDebugTool_1.beginProfiling();
}

function stop() {
    ReactDebugTool_1.endProfiling();
}

function isRunning() {
    return ReactDebugTool_1.isProfiling();
}

var ReactPerfAnalysis = {
    getLastMeasurements: getLastMeasurements,
    getExclusive: getExclusive,
    getInclusive: getInclusive,
    getWasted: getWasted,
    getOperations: getOperations,
    printExclusive: printExclusive,
    printInclusive: printInclusive,
    printWasted: printWasted,
    printOperations: printOperations,
    start: start,
    stop: stop,
    isRunning: isRunning,
    printDOM: printDOM,
    getMeasurementsSummaryMap: getMeasurementsSummaryMap
}, ReactPerf = ReactPerfAnalysis;

ReactNativeInjection.inject(), ReactNativeStackInjection.inject();

var render = function(element, mountInto, callback) {
    return ReactNativeMount_1.renderComponent(element, mountInto, callback);
}, ReactNativeStack = {
    NativeComponent: ReactNativeComponent_1,
    hasReactNativeInitialized: !1,
    findNodeHandle: findNumericNodeHandleStack,
    render: render,
    unmountComponentAtNode: ReactNativeMount_1.unmountComponentAtNode,
    unstable_batchedUpdates: ReactUpdates_1.batchedUpdates,
    unmountComponentAtNodeAndRemoveContainer: ReactNativeMount_1.unmountComponentAtNodeAndRemoveContainer,
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
        NativeMethodsMixin: NativeMethodsMixin_1,
        ReactGlobalSharedState: ReactGlobalSharedState_1,
        ReactNativeComponentTree: ReactNativeComponentTree_1,
        ReactNativePropRegistry: ReactNativePropRegistry_1,
        TouchHistoryMath: TouchHistoryMath_1,
        createReactNativeComponentClass: createReactNativeComponentClass,
        takeSnapshot: takeSnapshot_1
    }
};

Object.assign(ReactNativeStack.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
    ReactDebugTool: ReactDebugTool_1,
    ReactPerf: ReactPerf
}), "undefined" != typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" == typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject && __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
    ComponentTree: {
        getClosestInstanceFromNode: function(node) {
            return ReactNativeComponentTree_1.getClosestInstanceFromNode(node);
        },
        getNodeFromInstance: function(inst) {
            for (;inst._renderedComponent; ) inst = inst._renderedComponent;
            return inst ? ReactNativeComponentTree_1.getNodeFromInstance(inst) : null;
        }
    },
    Mount: ReactNativeMount_1,
    Reconciler: ReactReconciler_1,
    getInspectorDataForViewTag: ReactNativeStackInspector.getInspectorDataForViewTag
});

var ReactNativeStackEntry = ReactNativeStack;

module.exports = ReactNativeStackEntry;
