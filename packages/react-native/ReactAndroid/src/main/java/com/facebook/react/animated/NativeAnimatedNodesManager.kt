/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import android.util.SparseArray
import androidx.annotation.UiThread
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.JSApplicationCausedNativeException
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableArray
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil.getUIManagerType
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherListener
import java.util.ArrayDeque
import java.util.LinkedList
import java.util.Queue

/**
 * This is the main class that coordinates how native animated JS implementation drives UI changes.
 *
 * It implements a management interface for animated nodes graph as well as implements a graph
 * traversal algorithm that is run for each animation frame.
 *
 * For each animation frame we visit animated nodes that might've been updated as well as their
 * children that may use parent's values to update themselves. At the end of the traversal algorithm
 * we expect to reach a special type of the node: PropsAnimatedNode that is then responsible for
 * calculating property map which can be sent to native view hierarchy to update the view.
 *
 * IMPORTANT: This class should be accessed only from the UI Thread
 */
public class NativeAnimatedNodesManager(
    private val reactApplicationContext: ReactApplicationContext?
) : EventDispatcherListener {
  private val animatedNodes = SparseArray<AnimatedNode?>()
  private val activeAnimations = SparseArray<AnimationDriver>()
  private val updatedNodes = SparseArray<AnimatedNode>()
  // List of event animation drivers for an event on view.
  // There may be multiple drivers for the same event and view.
  private val eventDrivers: MutableList<EventAnimationDriver> = ArrayList()
  private var animatedGraphBFSColor = 0
  // Used to avoid allocating a new array on every frame in `runUpdates` and `onEventDispatch`.
  private val runUpdateNodeList: MutableList<AnimatedNode> = LinkedList()
  private var eventListenerInitializedForFabric = false
  private var eventListenerInitializedForNonFabric = false
  private var warnedAboutGraphTraversal = false

  /**
   * Initialize event listeners for Fabric UIManager or non-Fabric UIManager, exactly once. Once
   * Fabric is the only UIManager, this logic can be simplified. This is expected to only be called
   * from the native module thread.
   *
   * @param uiManagerType
   */
  public fun initializeEventListenerForUIManagerType(@UIManagerType uiManagerType: Int) {
    if (if (uiManagerType == UIManagerType.FABRIC) eventListenerInitializedForFabric
    else eventListenerInitializedForNonFabric) {
      return
    }
    val uiManager = UIManagerHelper.getUIManager(reactApplicationContext!!, uiManagerType)
    if (uiManager != null) {
      uiManager.getEventDispatcher<EventDispatcher>().addListener(this)
      if (uiManagerType == UIManagerType.FABRIC) {
        eventListenerInitializedForFabric = true
      } else {
        eventListenerInitializedForNonFabric = true
      }
    }
  }

  public fun getNodeById(id: Int): AnimatedNode? = animatedNodes[id]

  public fun hasActiveAnimations(): Boolean = activeAnimations.size() > 0 || updatedNodes.size() > 0

  @UiThread
  public fun createAnimatedNode(tag: Int, config: ReadableMap) {
    if (animatedNodes[tag] != null) {
      throw JSApplicationIllegalArgumentException(
          "createAnimatedNode: Animated node [$tag] already exists")
    }
    val type = config.getString("type")
    val node: AnimatedNode
    node =
        if ("style" == type) {
          StyleAnimatedNode(config, this)
        } else if ("value" == type) {
          ValueAnimatedNode(config)
        } else if ("color" == type) {
          ColorAnimatedNode(config, this, reactApplicationContext!!)
        } else if ("props" == type) {
          PropsAnimatedNode(config, this)
        } else if ("interpolation" == type) {
          InterpolationAnimatedNode(config)
        } else if ("addition" == type) {
          AdditionAnimatedNode(config, this)
        } else if ("subtraction" == type) {
          SubtractionAnimatedNode(config, this)
        } else if ("division" == type) {
          DivisionAnimatedNode(config, this)
        } else if ("multiplication" == type) {
          MultiplicationAnimatedNode(config, this)
        } else if ("modulus" == type) {
          ModulusAnimatedNode(config, this)
        } else if ("diffclamp" == type) {
          DiffClampAnimatedNode(config, this)
        } else if ("transform" == type) {
          TransformAnimatedNode(config, this)
        } else if ("tracking" == type) {
          TrackingAnimatedNode(config, this)
        } else if ("object" == type) {
          ObjectAnimatedNode(config, this)
        } else {
          throw JSApplicationIllegalArgumentException("Unsupported node type: $type")
        }
    node.tag = tag
    animatedNodes.put(tag, node)
    updatedNodes.put(tag, node)
  }

  @UiThread
  public fun updateAnimatedNodeConfig(tag: Int, config: ReadableMap?) {
    val node =
        animatedNodes[tag]
            ?: throw JSApplicationIllegalArgumentException(
                "updateAnimatedNode: Animated node [$tag] does not exist")
    if (node is AnimatedNodeWithUpdateableConfig) {
      stopAnimationsForNode(node)
      (node as AnimatedNodeWithUpdateableConfig).onUpdateConfig(config)
      updatedNodes.put(tag, node)
    }
  }

  @UiThread
  public fun dropAnimatedNode(tag: Int) {
    animatedNodes.remove(tag)
    updatedNodes.remove(tag)
  }

  @UiThread
  public fun startListeningToAnimatedNodeValue(tag: Int, listener: AnimatedNodeValueListener?) {
    val node = animatedNodes[tag]
    if (node == null || node !is ValueAnimatedNode) {
      throw JSApplicationIllegalArgumentException(
          "startListeningToAnimatedNodeValue: Animated node [" +
              tag +
              "] does not exist, or is not a 'value' node")
    }
    node.setValueListener(listener)
  }

  @UiThread
  public fun stopListeningToAnimatedNodeValue(tag: Int) {
    val node = animatedNodes[tag]
    if (node == null || node !is ValueAnimatedNode) {
      throw JSApplicationIllegalArgumentException(
          "startListeningToAnimatedNodeValue: Animated node [" +
              tag +
              "] does not exist, or is not a 'value' node")
    }
    node.setValueListener(null)
  }

  @UiThread
  public fun setAnimatedNodeValue(tag: Int, value: Double) {
    val node = animatedNodes[tag]
    if (node == null || node !is ValueAnimatedNode) {
      throw JSApplicationIllegalArgumentException(
          "setAnimatedNodeValue: Animated node [" +
              tag +
              "] does not exist, or is not a 'value' node")
    }
    stopAnimationsForNode(node)
    node.nodeValue = value
    updatedNodes.put(tag, node)
  }

  @UiThread
  public fun setAnimatedNodeOffset(tag: Int, offset: Double) {
    val node = animatedNodes[tag]
    if (node == null || node !is ValueAnimatedNode) {
      throw JSApplicationIllegalArgumentException(
          "setAnimatedNodeOffset: Animated node [" +
              tag +
              "] does not exist, or is not a 'value' node")
    }
    node.offset = offset
    updatedNodes.put(tag, node)
  }

  @UiThread
  public fun flattenAnimatedNodeOffset(tag: Int) {
    val node = animatedNodes[tag]
    if (node == null || node !is ValueAnimatedNode) {
      throw JSApplicationIllegalArgumentException(
          "flattenAnimatedNodeOffset: Animated node [" +
              tag +
              "] does not exist, or is not a 'value' node")
    }
    node.flattenOffset()
  }

  @UiThread
  public fun extractAnimatedNodeOffset(tag: Int) {
    val node = animatedNodes[tag]
    if (node == null || node !is ValueAnimatedNode) {
      throw JSApplicationIllegalArgumentException(
          "extractAnimatedNodeOffset: Animated node [" +
              tag +
              "] does not exist, or is not a 'value' node")
    }
    node.extractOffset()
  }

  @UiThread
  public fun startAnimatingNode(
      animationId: Int,
      animatedNodeTag: Int,
      animationConfig: ReadableMap,
      endCallback: Callback?
  ) {
    val node =
        (animatedNodes[animatedNodeTag]
            ?: throw JSApplicationIllegalArgumentException(
                "startAnimatingNode: Animated node [$animatedNodeTag] does not exist"))
            as? ValueAnimatedNode
            ?: throw JSApplicationIllegalArgumentException(
                "startAnimatingNode: Animated node [" +
                    animatedNodeTag +
                    "] should be of type " +
                    ValueAnimatedNode::class.java.name)
    val existingDriver = activeAnimations[animationId]
    if (existingDriver != null) {
      // animation with the given ID is already running, we need to update its configuration instead
      // of spawning a new one
      existingDriver.resetConfig(animationConfig)
      return
    }
    val type = animationConfig.getString("type")
    val animation =
        if ("frames" == type) {
          FrameBasedAnimationDriver(animationConfig)
        } else if ("spring" == type) {
          SpringAnimation(animationConfig)
        } else if ("decay" == type) {
          DecayAnimation(animationConfig)
        } else {
          throw JSApplicationIllegalArgumentException(
              "startAnimatingNode: Unsupported animation type [$animatedNodeTag]: $type")
        }
    animation.mId = animationId
    animation.mEndCallback = endCallback
    animation.mAnimatedValue = node
    activeAnimations.put(animationId, animation)
  }

  @UiThread
  private fun stopAnimationsForNode(animatedNode: AnimatedNode) {
    // in most of the cases there should never be more than a few active animations running at the
    // same time. Therefore it does not make much sense to create an animationId -> animation
    // object map that would require additional memory just to support the use-case of stopping
    // an animation
    var events: WritableArray? = null
    var i = 0
    while (i < activeAnimations.size()) {
      val animation = activeAnimations.valueAt(i)
      if (animatedNode == animation.mAnimatedValue) {
        if (animation.mEndCallback != null) {
          // Invoke animation end callback with {finished: false}
          val endCallbackResponse = Arguments.createMap()
          endCallbackResponse.putBoolean("finished", false)
          endCallbackResponse.putDouble("value", animation.mAnimatedValue.nodeValue)
          animation.mEndCallback.invoke(endCallbackResponse)
        } else if (reactApplicationContext != null) {
          // If no callback is passed in, this /may/ be an animation set up by the single-op
          // instruction from JS, meaning that no jsi::functions are passed into native and
          // we communicate via RCTDeviceEventEmitter instead of callbacks.
          val params = Arguments.createMap()
          params.putInt("animationId", animation.mId)
          params.putBoolean("finished", false)
          params.putDouble("value", animation.mAnimatedValue.nodeValue)
          if (events == null) {
            events = Arguments.createArray()
          }
          events!!.pushMap(params)
        }
        activeAnimations.removeAt(i)
        i--
      }
      i++
    }
    if (events != null) {
      reactApplicationContext!!.emitDeviceEvent("onNativeAnimatedModuleAnimationFinished", events)
    }
  }

  @UiThread
  public fun stopAnimation(animationId: Int) {
    // in most of the cases there should never be more than a few active animations running at the
    // same time. Therefore it does not make much sense to create an animationId -> animation
    // object map that would require additional memory just to support the use-case of stopping
    // an animation
    var events: WritableArray? = null
    for (i in 0 until activeAnimations.size()) {
      val animation = activeAnimations.valueAt(i)
      if (animation.mId == animationId) {
        if (animation.mEndCallback != null) {
          // Invoke animation end callback with {finished: false}
          val endCallbackResponse = Arguments.createMap()
          endCallbackResponse.putBoolean("finished", false)
          endCallbackResponse.putDouble("value", animation.mAnimatedValue.nodeValue)
          animation.mEndCallback.invoke(endCallbackResponse)
        } else if (reactApplicationContext != null) {
          // If no callback is passed in, this /may/ be an animation set up by the single-op
          // instruction from JS, meaning that no jsi::functions are passed into native and
          // we communicate via RCTDeviceEventEmitter instead of callbacks.
          val params = Arguments.createMap()
          params.putInt("animationId", animation.mId)
          params.putBoolean("finished", false)
          params.putDouble("value", animation.mAnimatedValue.nodeValue)
          if (events == null) {
            events = Arguments.createArray()
          }
          events!!.pushMap(params)
        }
        activeAnimations.removeAt(i)
        break
      }
    }
    if (events != null) {
      reactApplicationContext!!.emitDeviceEvent("onNativeAnimatedModuleAnimationFinished", events)
    }
    // Do not throw an error in the case animation could not be found. We only keep "active"
    // animations in the registry and there is a chance that Animated.js will enqueue a
    // stopAnimation call after the animation has ended or the call will reach native thread only
    // when the animation is already over.
  }

  @UiThread
  public fun connectAnimatedNodes(parentNodeTag: Int, childNodeTag: Int) {
    val parentNode =
        animatedNodes[parentNodeTag]
            ?: throw JSApplicationIllegalArgumentException(
                "connectAnimatedNodes: Animated node with tag (parent) [" +
                    parentNodeTag +
                    "] does not exist")
    val childNode =
        animatedNodes[childNodeTag]
            ?: throw JSApplicationIllegalArgumentException(
                "connectAnimatedNodes: Animated node with tag (child) [" +
                    childNodeTag +
                    "] does not exist")
    parentNode.addChild(childNode)
    updatedNodes.put(childNodeTag, childNode)
  }

  public fun disconnectAnimatedNodes(parentNodeTag: Int, childNodeTag: Int) {
    val parentNode =
        animatedNodes[parentNodeTag]
            ?: throw JSApplicationIllegalArgumentException(
                "disconnectAnimatedNodes: Animated node with tag (parent) [" +
                    parentNodeTag +
                    "] does not exist")
    val childNode =
        animatedNodes[childNodeTag]
            ?: throw JSApplicationIllegalArgumentException(
                "disconnectAnimatedNodes: Animated node with tag (child) [" +
                    childNodeTag +
                    "] does not exist")
    parentNode.removeChild(childNode)
    updatedNodes.put(childNodeTag, childNode)
  }

  @UiThread
  public fun connectAnimatedNodeToView(animatedNodeTag: Int, viewTag: Int) {
    val node =
        (animatedNodes[animatedNodeTag]
            ?: throw JSApplicationIllegalArgumentException(
                "connectAnimatedNodeToView: Animated node with tag [" +
                    animatedNodeTag +
                    "] does not exist"))
            as? PropsAnimatedNode
            ?: throw JSApplicationIllegalArgumentException(
                "connectAnimatedNodeToView: Animated node connected to view [" +
                    viewTag +
                    "] should be of type " +
                    PropsAnimatedNode::class.java.name)
    checkNotNull(reactApplicationContext) {
      ("connectAnimatedNodeToView: Animated node could not be connected, no" +
          " ReactApplicationContext: " +
          viewTag)
    }
    val uiManager = UIManagerHelper.getUIManagerForReactTag(reactApplicationContext, viewTag)
    if (uiManager == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          ReactNoCrashSoftException(
              "connectAnimatedNodeToView: Animated node could not be connected to UIManager -" +
                  " uiManager disappeared for tag: " +
                  viewTag))
      return
    }
    node.connectToView(viewTag, uiManager)
    updatedNodes.put(animatedNodeTag, node)
  }

  @UiThread
  public fun disconnectAnimatedNodeFromView(animatedNodeTag: Int, viewTag: Int) {
    val node =
        (animatedNodes[animatedNodeTag]
            ?: throw JSApplicationIllegalArgumentException(
                "disconnectAnimatedNodeFromView: Animated node with tag [" +
                    animatedNodeTag +
                    "] does not exist"))
            as? PropsAnimatedNode
            ?: throw JSApplicationIllegalArgumentException(
                "disconnectAnimatedNodeFromView: Animated node connected to view [" +
                    viewTag +
                    "] should be of type " +
                    PropsAnimatedNode::class.java.name)
    node.disconnectFromView(viewTag)
  }

  @UiThread
  public fun getValue(tag: Int, callback: Callback?) {
    val node = animatedNodes[tag]
    if (node == null || node !is ValueAnimatedNode) {
      throw JSApplicationIllegalArgumentException(
          "getValue: Animated node with tag [$tag] does not exist or is not a 'value' node")
    }
    val value = node.getValue()
    if (callback != null) {
      callback.invoke(value)
      return
    }

    // If there's no callback, that means that JS is using the single-operation mode, and not
    // passing any callbacks into Java.
    // See NativeAnimatedHelper.js for details.
    // Instead, we use RCTDeviceEventEmitter to pass data back to JS and emulate callbacks.
    if (reactApplicationContext == null) {
      return
    }
    val params = Arguments.createMap()
    params.putInt("tag", tag)
    params.putDouble("value", value)
    reactApplicationContext.emitDeviceEvent("onNativeAnimatedModuleGetValue", params)
  }

  @UiThread
  public fun restoreDefaultValues(animatedNodeTag: Int) {
    val node =
        (animatedNodes[animatedNodeTag] ?: return) as? PropsAnimatedNode
            ?: throw JSApplicationIllegalArgumentException(
                "Animated node connected to view [?] should be of type " +
                    PropsAnimatedNode::class.java.name)
    // Restoring default values needs to happen before UIManager operations so it is
    // possible the node hasn't been created yet if it is being connected and
    // disconnected in the same batch. In that case we don't need to restore
    // default values since it will never actually update the view.
    node.restoreDefaultValues()
  }

  @UiThread
  public fun addAnimatedEventToView(
      viewTag: Int,
      eventHandlerName: String,
      eventMapping: ReadableMap
  ) {
    val nodeTag = eventMapping.getInt("animatedValueTag")
    val node =
        (animatedNodes[nodeTag]
            ?: throw JSApplicationIllegalArgumentException(
                "addAnimatedEventToView: Animated node with tag [$nodeTag] does not exist"))
            as? ValueAnimatedNode
            ?: throw JSApplicationIllegalArgumentException(
                "addAnimatedEventToView: Animated node on view [" +
                    viewTag +
                    "] connected to event handler (" +
                    eventHandlerName +
                    ") should be of type " +
                    ValueAnimatedNode::class.java.name)
    val path = eventMapping.getArray("nativeEventPath")
    val pathList: MutableList<String> = ArrayList(path!!.size())
    for (i in 0 until path.size()) {
      pathList.add(path.getString(i))
    }
    val eventName = normalizeEventName(eventHandlerName)
    val eventDriver = EventAnimationDriver(eventName, viewTag, pathList, node)
    eventDrivers.add(eventDriver)
    if (eventName == "topScroll") {
      // Handle the custom topScrollEnded event sent by the ScrollViews when the user stops dragging
      addAnimatedEventToView(viewTag, "topScrollEnded", eventMapping)
    }
  }

  @UiThread
  public fun removeAnimatedEventFromView(
      viewTag: Int,
      eventHandlerName: String,
      animatedValueTag: Int
  ) {
    val eventName = normalizeEventName(eventHandlerName)
    val it = eventDrivers.listIterator()
    while (it.hasNext()) {
      val driver = it.next()
      if (eventName == driver.eventName &&
          viewTag == driver.viewTag &&
          animatedValueTag == driver.valueNode.tag) {
        it.remove()
        break
      }
    }
  }

  override fun onEventDispatch(event: Event<*>) {
    // Events can be dispatched from any thread so we have to make sure handleEvent is run from the
    // UI thread.
    if (UiThreadUtil.isOnUiThread()) {
      handleEvent(event)
    } else {
      UiThreadUtil.runOnUiThread { handleEvent(event) }
    }
  }

  @UiThread
  private fun handleEvent(event: Event<*>) {
    if (!eventDrivers.isEmpty()) {
      // If the event has a different name in native convert it to it's JS name.
      // TODO T64216139 Remove dependency of UIManagerModule when the Constants are not in Native
      // anymore
      if (reactApplicationContext == null) {
        return
      }
      UIManagerHelper.getUIManager(
          reactApplicationContext, getUIManagerType(event.viewTag, event.surfaceId)) ?: return
      var foundAtLeastOneDriver = false
      val matchSpec = event.eventAnimationDriverMatchSpec
      for (driver in eventDrivers) {
        if (matchSpec.match(driver.viewTag, driver.eventName)) {
          foundAtLeastOneDriver = true
          stopAnimationsForNode(driver.valueNode)
          event.dispatchModern(driver)
          runUpdateNodeList.add(driver.valueNode)
        }
      }
      if (foundAtLeastOneDriver) {
        updateNodes(runUpdateNodeList)
        runUpdateNodeList.clear()
      }
    }
  }

  /**
   * Animation loop performs two BFSes over the graph of animated nodes. We use incremented
   * `mAnimatedGraphBFSColor` to mark nodes as visited in each of the BFSes which saves additional
   * loops for clearing "visited" states.
   *
   * First BFS starts with nodes that are in `mUpdatedNodes` (that is, their value have been
   * modified from JS in the last batch of JS operations) or directly attached to an active
   * animation (hence linked to objects from `mActiveAnimations`). In that step we calculate an
   * attribute `activeIncomingNodes`. The second BFS runs in topological order over the sub-graph of
   * *active* nodes. This is done by adding node to the BFS queue only if all its "predecessors"
   * have already been visited.
   */
  @UiThread
  public fun runUpdates(frameTimeNanos: Long) {
    UiThreadUtil.assertOnUiThread()
    var hasFinishedAnimations = false
    for (i in 0 until updatedNodes.size()) {
      val node = updatedNodes.valueAt(i)
      runUpdateNodeList.add(node)
    }

    // Clean mUpdatedNodes queue
    updatedNodes.clear()
    for (i in 0 until activeAnimations.size()) {
      val animation = activeAnimations.valueAt(i)
      animation.runAnimationStep(frameTimeNanos)
      val valueNode: AnimatedNode = animation.mAnimatedValue
      runUpdateNodeList.add(valueNode)
      if (animation.mHasFinished) {
        hasFinishedAnimations = true
      }
    }
    updateNodes(runUpdateNodeList)
    runUpdateNodeList.clear()

    // Cleanup finished animations. Iterate over the array of animations and override ones that has
    // finished, then resize `mActiveAnimations`.
    if (hasFinishedAnimations) {
      var events: WritableArray? = null
      for (i in activeAnimations.size() - 1 downTo 0) {
        val animation = activeAnimations.valueAt(i)
        if (animation.mHasFinished) {
          if (animation.mEndCallback != null) {
            val endCallbackResponse = Arguments.createMap()
            endCallbackResponse.putBoolean("finished", true)
            endCallbackResponse.putDouble("value", animation.mAnimatedValue.nodeValue)
            animation.mEndCallback.invoke(endCallbackResponse)
          } else if (reactApplicationContext != null) {
            // If no callback is passed in, this /may/ be an animation set up by the single-op
            // instruction from JS, meaning that no jsi::functions are passed into native and
            // we communicate via RCTDeviceEventEmitter instead of callbacks.
            val params = Arguments.createMap()
            params.putInt("animationId", animation.mId)
            params.putBoolean("finished", true)
            params.putDouble("value", animation.mAnimatedValue.nodeValue)
            if (events == null) {
              events = Arguments.createArray()
            }
            events!!.pushMap(params)
          }
          activeAnimations.removeAt(i)
        }
      }
      if (events != null) {
        reactApplicationContext!!.emitDeviceEvent("onNativeAnimatedModuleAnimationFinished", events)
      }
    }
  }

  public fun getTagsOfConnectedNodes(tag: Int, eventName: String): Set<Int> {
    val tags: MutableSet<Int> = HashSet()

    // Filter only relevant animation drivers
    val it: ListIterator<EventAnimationDriver> = eventDrivers.listIterator()
    while (it.hasNext()) {
      val driver = it.next()
      if (eventName == driver.eventName && tag == driver.viewTag) {
        tags.add(driver.viewTag)
        if (driver.valueNode.children != null) {
          for (node in driver.valueNode.children!!) {
            tags.add(node.tag)
          }
        }
      }
    }
    return tags
  }

  @UiThread
  private fun updateNodes(nodes: List<AnimatedNode>) {
    var activeNodesCount = 0
    var updatedNodesCount = 0

    // STEP 1.
    // BFS over graph of nodes. Update `mIncomingNodes` attribute for each node during that BFS.
    // Store number of visited nodes in `activeNodesCount`. We "execute" active animations as a part
    // of this step.
    animatedGraphBFSColor++ /* use new color */
    if (animatedGraphBFSColor == AnimatedNode.INITIAL_BFS_COLOR) {
      // value "0" is used as an initial color for a new node, using it in BFS may cause some nodes
      // to be skipped.
      animatedGraphBFSColor++
    }
    val nodesQueue: Queue<AnimatedNode> = ArrayDeque()
    for (node in nodes) {
      if (node.BFSColor != animatedGraphBFSColor) {
        node.BFSColor = animatedGraphBFSColor
        activeNodesCount++
        nodesQueue.add(node)
      }
    }
    while (!nodesQueue.isEmpty()) {
      val nextNode = nodesQueue.poll()
      if (nextNode?.children != null) {
        for (i in nextNode.children!!.indices) {
          val child = nextNode.children!![i]
          child.activeIncomingNodes++
          if (child.BFSColor != animatedGraphBFSColor) {
            child.BFSColor = animatedGraphBFSColor
            activeNodesCount++
            nodesQueue.add(child)
          }
        }
      }
    }

    // STEP 2
    // BFS over the graph of active nodes in topological order -> visit node only when all its
    // "predecessors" in the graph have already been visited. It is important to visit nodes in that
    // order as they may often use values of their predecessors in order to calculate "next state"
    // of their own. We start by determining the starting set of nodes by looking for nodes with
    // `activeIncomingNodes = 0` (those can only be the ones that we start BFS in the previous
    // step). We store number of visited nodes in this step in `updatedNodesCount`
    animatedGraphBFSColor++
    if (animatedGraphBFSColor == AnimatedNode.INITIAL_BFS_COLOR) {
      // see reasoning for this check a few lines above
      animatedGraphBFSColor++
    }

    // find nodes with zero "incoming nodes", those can be either nodes from `mUpdatedNodes` or
    // ones connected to active animations
    for (node in nodes) {
      if (node.activeIncomingNodes == 0 && node.BFSColor != animatedGraphBFSColor) {
        node.BFSColor = animatedGraphBFSColor
        updatedNodesCount++
        nodesQueue.add(node)
      }
    }

    // Run main "update" loop
    var cyclesDetected = 0
    while (!nodesQueue.isEmpty()) {
      val nextNode = nodesQueue.poll()
      try {
        nextNode?.update()
        if (nextNode is PropsAnimatedNode) {
          // Send property updates to native view manager
          nextNode.updateView()
        }
      } catch (e: JSApplicationCausedNativeException) {
        // An exception is thrown if the view hasn't been created yet. This can happen because
        // views are created in batches. If this particular view didn't make it into a batch yet,
        // the view won't exist and an exception will be thrown when attempting to start an
        // animation on it.
        //
        // Eat the exception rather than crashing. The impact is that we may drop one or more
        // frames of the animation.
        FLog.e(TAG, "Native animation workaround, frame lost as result of race condition", e)
      }
      if (nextNode is ValueAnimatedNode) {
        // Potentially send events to JS when the node's value is updated
        nextNode.onValueUpdate()
      }
      if (nextNode?.children != null) {
        for (i in nextNode.children!!.indices) {
          val child = nextNode.children!![i]
          child.activeIncomingNodes--
          if (child.BFSColor != animatedGraphBFSColor && child.activeIncomingNodes == 0) {
            child.BFSColor = animatedGraphBFSColor
            updatedNodesCount++
            nodesQueue.add(child)
          } else if (child.BFSColor == animatedGraphBFSColor) {
            cyclesDetected++
          }
        }
      }
    }

    // Verify that we've visited *all* active nodes. Throw otherwise as this could mean there is a
    // cycle in animated node graph, or that the graph is only partially set up. We also take
    // advantage of the fact that all active nodes are visited in the step above so that all the
    // nodes properties `activeIncomingNodes` are set to zero.
    // In Fabric there can be race conditions between the JS thread setting up or tearing down
    // animated nodes, and Fabric executing them on the UI thread, leading to temporary inconsistent
    // states.
    if (activeNodesCount != updatedNodesCount) {
      if (warnedAboutGraphTraversal) {
        return
      }
      warnedAboutGraphTraversal = true

      // Before crashing or logging soft exception, log details about current graph setup
      FLog.e(TAG, "Detected animation cycle or disconnected graph. ")
      for (node in nodes) {
        FLog.e(TAG, node.prettyPrintWithChildren())
      }

      // If we're running only in non-Fabric, we still throw an exception.
      // In Fabric, it seems that animations enter an inconsistent state fairly often.
      // We detect if the inconsistency is due to a cycle (a fatal error for which we must crash)
      // or disconnected regions, indicating a partially-set-up animation graph, which is not
      // fatal and can stay a warning.
      val reason = if (cyclesDetected > 0) "cycles ($cyclesDetected)" else "disconnected regions"
      val ex =
          IllegalStateException(
              "Looks like animated nodes graph has " +
                  reason +
                  ", there are " +
                  activeNodesCount +
                  " but toposort visited only " +
                  updatedNodesCount)
      if (eventListenerInitializedForFabric && cyclesDetected == 0) {
        // TODO T71377544: investigate these SoftExceptions and see if we can remove entirely
        // or fix the root cause
        ReactSoftExceptionLogger.logSoftException(TAG, ReactNoCrashSoftException(ex))
      } else if (eventListenerInitializedForFabric) {
        // TODO T71377544: investigate these SoftExceptions and see if we can remove entirely
        // or fix the root cause
        ReactSoftExceptionLogger.logSoftException(TAG, ReactNoCrashSoftException(ex))
      } else {
        throw ex
      }
    } else {
      warnedAboutGraphTraversal = false
    }
  }

  private fun normalizeEventName(eventHandlerName: String): String {
    // Fabric UIManager also makes this assumption
    var eventName = eventHandlerName
    if (eventHandlerName.startsWith("on")) {
      eventName = "top" + eventHandlerName.substring(2)
    }
    return eventName
  }

  private companion object {
    private const val TAG = "NativeAnimatedNodesManager"
  }
}
