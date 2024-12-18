/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import android.util.SparseArray;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcherListener;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;
import java.util.Queue;
import java.util.Set;

/**
 * This is the main class that coordinates how native animated JS implementation drives UI changes.
 *
 * <p>It implements a management interface for animated nodes graph as well as implements a graph
 * traversal algorithm that is run for each animation frame.
 *
 * <p>For each animation frame we visit animated nodes that might've been updated as well as their
 * children that may use parent's values to update themselves. At the end of the traversal algorithm
 * we expect to reach a special type of the node: PropsAnimatedNode that is then responsible for
 * calculating property map which can be sent to native view hierarchy to update the view.
 *
 * <p>IMPORTANT: This class should be accessed only from the UI Thread
 */
public class NativeAnimatedNodesManager implements EventDispatcherListener {

  private static final String TAG = "NativeAnimatedNodesManager";

  private final SparseArray<AnimatedNode> mAnimatedNodes = new SparseArray<>();
  private final SparseArray<AnimationDriver> mActiveAnimations = new SparseArray<>();
  private final SparseArray<AnimatedNode> mUpdatedNodes = new SparseArray<>();
  // List of event animation drivers for an event on view.
  // There may be multiple drivers for the same event and view.
  private final List<EventAnimationDriver> mEventDrivers = new ArrayList<>();
  private final ReactApplicationContext mReactApplicationContext;
  private int mAnimatedGraphBFSColor = 0;
  // Used to avoid allocating a new array on every frame in `runUpdates` and `onEventDispatch`.
  private final List<AnimatedNode> mRunUpdateNodeList = new LinkedList<>();

  private boolean mEventListenerInitializedForFabric = false;
  private boolean mEventListenerInitializedForNonFabric = false;

  private boolean mWarnedAboutGraphTraversal = false;

  public NativeAnimatedNodesManager(ReactApplicationContext reactApplicationContext) {
    mReactApplicationContext = reactApplicationContext;
  }

  /**
   * Initialize event listeners for Fabric UIManager or non-Fabric UIManager, exactly once. Once
   * Fabric is the only UIManager, this logic can be simplified. This is expected to only be called
   * from the native module thread.
   *
   * @param uiManagerType
   */
  public void initializeEventListenerForUIManagerType(@UIManagerType final int uiManagerType) {
    if (uiManagerType == UIManagerType.FABRIC
        ? mEventListenerInitializedForFabric
        : mEventListenerInitializedForNonFabric) {
      return;
    }

    UIManager uiManager = UIManagerHelper.getUIManager(mReactApplicationContext, uiManagerType);
    if (uiManager != null) {
      EventDispatcher eventDispatcher = (EventDispatcher) uiManager.getEventDispatcher();
      eventDispatcher.addListener(this);
      if (uiManagerType == UIManagerType.FABRIC) {
        mEventListenerInitializedForFabric = true;
      } else {
        mEventListenerInitializedForNonFabric = true;
      }
    }
  }

  @Nullable
  public AnimatedNode getNodeById(int id) {
    return mAnimatedNodes.get(id);
  }

  public boolean hasActiveAnimations() {
    return mActiveAnimations.size() > 0 || mUpdatedNodes.size() > 0;
  }

  @UiThread
  public void createAnimatedNode(int tag, ReadableMap config) {
    if (mAnimatedNodes.get(tag) != null) {
      throw new JSApplicationIllegalArgumentException(
          "createAnimatedNode: Animated node [" + tag + "] already exists");
    }
    String type = config.getString("type");
    final AnimatedNode node;
    if ("style".equals(type)) {
      node = new StyleAnimatedNode(config, this);
    } else if ("value".equals(type)) {
      node = new ValueAnimatedNode(config);
    } else if ("color".equals(type)) {
      node = new ColorAnimatedNode(config, this, mReactApplicationContext);
    } else if ("props".equals(type)) {
      node = new PropsAnimatedNode(config, this);
    } else if ("interpolation".equals(type)) {
      node = new InterpolationAnimatedNode(config);
    } else if ("addition".equals(type)) {
      node = new AdditionAnimatedNode(config, this);
    } else if ("subtraction".equals(type)) {
      node = new SubtractionAnimatedNode(config, this);
    } else if ("division".equals(type)) {
      node = new DivisionAnimatedNode(config, this);
    } else if ("multiplication".equals(type)) {
      node = new MultiplicationAnimatedNode(config, this);
    } else if ("modulus".equals(type)) {
      node = new ModulusAnimatedNode(config, this);
    } else if ("diffclamp".equals(type)) {
      node = new DiffClampAnimatedNode(config, this);
    } else if ("transform".equals(type)) {
      node = new TransformAnimatedNode(config, this);
    } else if ("tracking".equals(type)) {
      node = new TrackingAnimatedNode(config, this);
    } else if ("object".equals(type)) {
      node = new ObjectAnimatedNode(config, this);
    } else {
      throw new JSApplicationIllegalArgumentException("Unsupported node type: " + type);
    }
    node.tag = tag;
    mAnimatedNodes.put(tag, node);
    mUpdatedNodes.put(tag, node);
  }

  @UiThread
  public void updateAnimatedNodeConfig(int tag, ReadableMap config) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException(
          "updateAnimatedNode: Animated node [" + tag + "] does not exist");
    }

    if (node instanceof AnimatedNodeWithUpdateableConfig) {
      stopAnimationsForNode(node);
      ((AnimatedNodeWithUpdateableConfig) node).onUpdateConfig(config);
      mUpdatedNodes.put(tag, node);
    }
  }

  @UiThread
  public void dropAnimatedNode(int tag) {
    mAnimatedNodes.remove(tag);
    mUpdatedNodes.remove(tag);
  }

  @UiThread
  public void startListeningToAnimatedNodeValue(int tag, AnimatedNodeValueListener listener) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null || !(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "startListeningToAnimatedNodeValue: Animated node ["
              + tag
              + "] does not exist, or is not a 'value' node");
    }
    ((ValueAnimatedNode) node).setValueListener(listener);
  }

  @UiThread
  public void stopListeningToAnimatedNodeValue(int tag) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null || !(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "startListeningToAnimatedNodeValue: Animated node ["
              + tag
              + "] does not exist, or is not a 'value' node");
    }
    ((ValueAnimatedNode) node).setValueListener(null);
  }

  @UiThread
  public void setAnimatedNodeValue(int tag, double value) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null || !(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "setAnimatedNodeValue: Animated node ["
              + tag
              + "] does not exist, or is not a 'value' node");
    }
    stopAnimationsForNode(node);
    ((ValueAnimatedNode) node).nodeValue = value;
    mUpdatedNodes.put(tag, node);
  }

  @UiThread
  public void setAnimatedNodeOffset(int tag, double offset) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null || !(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "setAnimatedNodeOffset: Animated node ["
              + tag
              + "] does not exist, or is not a 'value' node");
    }
    ((ValueAnimatedNode) node).offset = offset;
    mUpdatedNodes.put(tag, node);
  }

  @UiThread
  public void flattenAnimatedNodeOffset(int tag) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null || !(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "flattenAnimatedNodeOffset: Animated node ["
              + tag
              + "] does not exist, or is not a 'value' node");
    }
    ((ValueAnimatedNode) node).flattenOffset();
  }

  @UiThread
  public void extractAnimatedNodeOffset(int tag) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null || !(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "extractAnimatedNodeOffset: Animated node ["
              + tag
              + "] does not exist, or is not a 'value' node");
    }
    ((ValueAnimatedNode) node).extractOffset();
  }

  @UiThread
  public void startAnimatingNode(
      int animationId, int animatedNodeTag, ReadableMap animationConfig, Callback endCallback) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException(
          "startAnimatingNode: Animated node [" + animatedNodeTag + "] does not exist");
    }
    if (!(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "startAnimatingNode: Animated node ["
              + animatedNodeTag
              + "] should be of type "
              + ValueAnimatedNode.class.getName());
    }

    final AnimationDriver existingDriver = mActiveAnimations.get(animationId);
    if (existingDriver != null) {
      // animation with the given ID is already running, we need to update its configuration instead
      // of spawning a new one
      existingDriver.resetConfig(animationConfig);
      return;
    }

    String type = animationConfig.getString("type");
    final AnimationDriver animation;
    if ("frames".equals(type)) {
      animation = new FrameBasedAnimationDriver(animationConfig);
    } else if ("spring".equals(type)) {
      animation = new SpringAnimation(animationConfig);
    } else if ("decay".equals(type)) {
      animation = new DecayAnimation(animationConfig);
    } else {
      throw new JSApplicationIllegalArgumentException(
          "startAnimatingNode: Unsupported animation type [" + animatedNodeTag + "]: " + type);
    }
    animation.id = animationId;
    animation.endCallback = endCallback;
    animation.animatedValue = (ValueAnimatedNode) node;
    mActiveAnimations.put(animationId, animation);
  }

  @UiThread
  private void stopAnimationsForNode(AnimatedNode animatedNode) {
    // in most of the cases there should never be more than a few active animations running at the
    // same time. Therefore it does not make much sense to create an animationId -> animation
    // object map that would require additional memory just to support the use-case of stopping
    // an animation
    WritableArray events = null;
    for (int i = 0; i < mActiveAnimations.size(); i++) {
      AnimationDriver animation = mActiveAnimations.valueAt(i);
      if (animatedNode.equals(animation.animatedValue)) {
        if (animation.endCallback != null) {
          // Invoke animation end callback with {finished: false}
          WritableMap endCallbackResponse = Arguments.createMap();
          endCallbackResponse.putBoolean("finished", false);
          endCallbackResponse.putDouble("value", animation.animatedValue.nodeValue);
          animation.endCallback.invoke(endCallbackResponse);
        } else if (mReactApplicationContext != null) {
          // If no callback is passed in, this /may/ be an animation set up by the single-op
          // instruction from JS, meaning that no jsi::functions are passed into native and
          // we communicate via RCTDeviceEventEmitter instead of callbacks.
          WritableMap params = Arguments.createMap();
          params.putInt("animationId", animation.id);
          params.putBoolean("finished", false);
          params.putDouble("value", animation.animatedValue.nodeValue);
          if (events == null) {
            events = Arguments.createArray();
          }
          events.pushMap(params);
        }
        mActiveAnimations.removeAt(i);
        i--;
      }
    }
    if (events != null) {
      mReactApplicationContext.emitDeviceEvent("onNativeAnimatedModuleAnimationFinished", events);
    }
  }

  @UiThread
  public void stopAnimation(int animationId) {
    // in most of the cases there should never be more than a few active animations running at the
    // same time. Therefore it does not make much sense to create an animationId -> animation
    // object map that would require additional memory just to support the use-case of stopping
    // an animation
    WritableArray events = null;
    for (int i = 0; i < mActiveAnimations.size(); i++) {
      AnimationDriver animation = mActiveAnimations.valueAt(i);
      if (animation.id == animationId) {
        if (animation.endCallback != null) {
          // Invoke animation end callback with {finished: false}
          WritableMap endCallbackResponse = Arguments.createMap();
          endCallbackResponse.putBoolean("finished", false);
          endCallbackResponse.putDouble("value", animation.animatedValue.nodeValue);
          animation.endCallback.invoke(endCallbackResponse);
        } else if (mReactApplicationContext != null) {
          // If no callback is passed in, this /may/ be an animation set up by the single-op
          // instruction from JS, meaning that no jsi::functions are passed into native and
          // we communicate via RCTDeviceEventEmitter instead of callbacks.
          WritableMap params = Arguments.createMap();
          params.putInt("animationId", animation.id);
          params.putBoolean("finished", false);
          params.putDouble("value", animation.animatedValue.nodeValue);
          if (events == null) {
            events = Arguments.createArray();
          }
          events.pushMap(params);
        }
        mActiveAnimations.removeAt(i);
        break;
      }
    }
    if (events != null) {
      mReactApplicationContext.emitDeviceEvent("onNativeAnimatedModuleAnimationFinished", events);
    }
    // Do not throw an error in the case animation could not be found. We only keep "active"
    // animations in the registry and there is a chance that Animated.js will enqueue a
    // stopAnimation call after the animation has ended or the call will reach native thread only
    // when the animation is already over.
  }

  @UiThread
  public void connectAnimatedNodes(int parentNodeTag, int childNodeTag) {
    AnimatedNode parentNode = mAnimatedNodes.get(parentNodeTag);
    if (parentNode == null) {
      throw new JSApplicationIllegalArgumentException(
          "connectAnimatedNodes: Animated node with tag (parent) ["
              + parentNodeTag
              + "] does not exist");
    }
    AnimatedNode childNode = mAnimatedNodes.get(childNodeTag);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException(
          "connectAnimatedNodes: Animated node with tag (child) ["
              + childNodeTag
              + "] does not exist");
    }
    parentNode.addChild(childNode);
    mUpdatedNodes.put(childNodeTag, childNode);
  }

  public void disconnectAnimatedNodes(int parentNodeTag, int childNodeTag) {
    AnimatedNode parentNode = mAnimatedNodes.get(parentNodeTag);
    if (parentNode == null) {
      throw new JSApplicationIllegalArgumentException(
          "disconnectAnimatedNodes: Animated node with tag (parent) ["
              + parentNodeTag
              + "] does not exist");
    }
    AnimatedNode childNode = mAnimatedNodes.get(childNodeTag);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException(
          "disconnectAnimatedNodes: Animated node with tag (child) ["
              + childNodeTag
              + "] does not exist");
    }
    parentNode.removeChild(childNode);
    mUpdatedNodes.put(childNodeTag, childNode);
  }

  @UiThread
  public void connectAnimatedNodeToView(int animatedNodeTag, int viewTag) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException(
          "connectAnimatedNodeToView: Animated node with tag ["
              + animatedNodeTag
              + "] does not exist");
    }
    if (!(node instanceof PropsAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "connectAnimatedNodeToView: Animated node connected to view ["
              + viewTag
              + "] should be of type "
              + PropsAnimatedNode.class.getName());
    }
    if (mReactApplicationContext == null) {
      throw new IllegalStateException(
          "connectAnimatedNodeToView: Animated node could not be connected, no"
              + " ReactApplicationContext: "
              + viewTag);
    }

    @Nullable
    UIManager uiManager =
        UIManagerHelper.getUIManagerForReactTag(mReactApplicationContext, viewTag);
    if (uiManager == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "connectAnimatedNodeToView: Animated node could not be connected to UIManager -"
                  + " uiManager disappeared for tag: "
                  + viewTag));
      return;
    }

    PropsAnimatedNode propsAnimatedNode = (PropsAnimatedNode) node;
    propsAnimatedNode.connectToView(viewTag, uiManager);
    mUpdatedNodes.put(animatedNodeTag, node);
  }

  @UiThread
  public void disconnectAnimatedNodeFromView(int animatedNodeTag, int viewTag) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException(
          "disconnectAnimatedNodeFromView: Animated node with tag ["
              + animatedNodeTag
              + "] does not exist");
    }
    if (!(node instanceof PropsAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "disconnectAnimatedNodeFromView: Animated node connected to view ["
              + viewTag
              + "] should be of type "
              + PropsAnimatedNode.class.getName());
    }
    PropsAnimatedNode propsAnimatedNode = (PropsAnimatedNode) node;
    propsAnimatedNode.disconnectFromView(viewTag);
  }

  @UiThread
  public void getValue(int tag, Callback callback) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null || !(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "getValue: Animated node with tag [" + tag + "] does not exist or is not a 'value' node");
    }
    double value = ((ValueAnimatedNode) node).getValue();
    if (callback != null) {
      callback.invoke(value);
      return;
    }

    // If there's no callback, that means that JS is using the single-operation mode, and not
    // passing any callbacks into Java.
    // See NativeAnimatedHelper.js for details.
    // Instead, we use RCTDeviceEventEmitter to pass data back to JS and emulate callbacks.
    if (mReactApplicationContext == null) {
      return;
    }
    WritableMap params = Arguments.createMap();
    params.putInt("tag", tag);
    params.putDouble("value", value);
    mReactApplicationContext.emitDeviceEvent("onNativeAnimatedModuleGetValue", params);
  }

  @UiThread
  public void restoreDefaultValues(int animatedNodeTag) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    // Restoring default values needs to happen before UIManager operations so it is
    // possible the node hasn't been created yet if it is being connected and
    // disconnected in the same batch. In that case we don't need to restore
    // default values since it will never actually update the view.
    if (node == null) {
      return;
    }
    if (!(node instanceof PropsAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "Animated node connected to view [?] should be of type "
              + PropsAnimatedNode.class.getName());
    }
    PropsAnimatedNode propsAnimatedNode = (PropsAnimatedNode) node;
    propsAnimatedNode.restoreDefaultValues();
  }

  @UiThread
  public void addAnimatedEventToView(
      int viewTag, String eventHandlerName, ReadableMap eventMapping) {
    int nodeTag = eventMapping.getInt("animatedValueTag");
    AnimatedNode node = mAnimatedNodes.get(nodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException(
          "addAnimatedEventToView: Animated node with tag [" + nodeTag + "] does not exist");
    }
    if (!(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException(
          "addAnimatedEventToView: Animated node on view ["
              + viewTag
              + "] connected to event handler ("
              + eventHandlerName
              + ") should be of type "
              + ValueAnimatedNode.class.getName());
    }

    ReadableArray path = eventMapping.getArray("nativeEventPath");
    List<String> pathList = new ArrayList<>(path.size());
    for (int i = 0; i < path.size(); i++) {
      pathList.add(path.getString(i));
    }

    String eventName = normalizeEventName(eventHandlerName);

    EventAnimationDriver eventDriver =
        new EventAnimationDriver(eventName, viewTag, pathList, (ValueAnimatedNode) node);
    mEventDrivers.add(eventDriver);

    if (eventName.equals("topScroll")) {
      // Handle the custom topScrollEnded event sent by the ScrollViews when the user stops dragging
      addAnimatedEventToView(viewTag, "topScrollEnded", eventMapping);
    }
  }

  @UiThread
  public void removeAnimatedEventFromView(
      int viewTag, String eventHandlerName, int animatedValueTag) {
    String eventName = normalizeEventName(eventHandlerName);

    ListIterator<EventAnimationDriver> it = mEventDrivers.listIterator();
    while (it.hasNext()) {
      EventAnimationDriver driver = it.next();
      if (eventName.equals(driver.eventName)
          && viewTag == driver.viewTag
          && animatedValueTag == driver.valueNode.tag) {
        it.remove();
        break;
      }
    }

    if (eventName.equals("topScroll")) {
      // Handle the custom topScrollEnded event sent by the ScrollViews when the user stops dragging
      removeAnimatedEventFromView(viewTag, "topScrollEnded", animatedValueTag);
    }
  }

  @Override
  public void onEventDispatch(final Event event) {
    // Events can be dispatched from any thread so we have to make sure handleEvent is run from the
    // UI thread.
    if (UiThreadUtil.isOnUiThread()) {
      handleEvent(event);
    } else {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              handleEvent(event);
            }
          });
    }
  }

  @UiThread
  private void handleEvent(Event event) {
    if (mEventDrivers.isEmpty()) {
      return;
    }

    boolean foundAtLeastOneDriver = false;
    Event.EventAnimationDriverMatchSpec matchSpec = event.getEventAnimationDriverMatchSpec();
    for (EventAnimationDriver driver : mEventDrivers) {
      if (matchSpec.match(driver.viewTag, driver.eventName)) {
        foundAtLeastOneDriver = true;
        stopAnimationsForNode(driver.valueNode);
        event.dispatchModern(driver);
        mRunUpdateNodeList.add(driver.valueNode);
      }
    }

    if (foundAtLeastOneDriver) {
      updateNodes(mRunUpdateNodeList);
      mRunUpdateNodeList.clear();
    }
  }

  /**
   * Animation loop performs two BFSes over the graph of animated nodes. We use incremented {@code
   * mAnimatedGraphBFSColor} to mark nodes as visited in each of the BFSes which saves additional
   * loops for clearing "visited" states.
   *
   * <p>First BFS starts with nodes that are in {@code mUpdatedNodes} (that is, their value have
   * been modified from JS in the last batch of JS operations) or directly attached to an active
   * animation (hence linked to objects from {@code mActiveAnimations}). In that step we calculate
   * an attribute {@code activeIncomingNodes}. The second BFS runs in topological order over the
   * sub-graph of *active* nodes. This is done by adding node to the BFS queue only if all its
   * "predecessors" have already been visited.
   */
  @UiThread
  public void runUpdates(long frameTimeNanos) {
    UiThreadUtil.assertOnUiThread();
    boolean hasFinishedAnimations = false;

    for (int i = 0; i < mUpdatedNodes.size(); i++) {
      AnimatedNode node = mUpdatedNodes.valueAt(i);
      mRunUpdateNodeList.add(node);
    }

    // Clean mUpdatedNodes queue
    mUpdatedNodes.clear();

    for (int i = 0; i < mActiveAnimations.size(); i++) {
      AnimationDriver animation = mActiveAnimations.valueAt(i);
      animation.runAnimationStep(frameTimeNanos);
      AnimatedNode valueNode = animation.animatedValue;
      mRunUpdateNodeList.add(valueNode);
      if (animation.hasFinished) {
        hasFinishedAnimations = true;
      }
    }

    updateNodes(mRunUpdateNodeList);
    mRunUpdateNodeList.clear();

    // Cleanup finished animations. Iterate over the array of animations and override ones that has
    // finished, then resize `mActiveAnimations`.
    if (hasFinishedAnimations) {
      WritableArray events = null;
      for (int i = mActiveAnimations.size() - 1; i >= 0; i--) {
        AnimationDriver animation = mActiveAnimations.valueAt(i);
        if (animation.hasFinished) {
          if (animation.endCallback != null) {
            WritableMap endCallbackResponse = Arguments.createMap();
            endCallbackResponse.putBoolean("finished", true);
            endCallbackResponse.putDouble("value", animation.animatedValue.nodeValue);
            animation.endCallback.invoke(endCallbackResponse);
          } else if (mReactApplicationContext != null) {
            // If no callback is passed in, this /may/ be an animation set up by the single-op
            // instruction from JS, meaning that no jsi::functions are passed into native and
            // we communicate via RCTDeviceEventEmitter instead of callbacks.
            WritableMap params = Arguments.createMap();
            params.putInt("animationId", animation.id);
            params.putBoolean("finished", true);
            params.putDouble("value", animation.animatedValue.nodeValue);
            if (events == null) {
              events = Arguments.createArray();
            }
            events.pushMap(params);
          }
          mActiveAnimations.removeAt(i);
        }
      }
      if (events != null) {
        mReactApplicationContext.emitDeviceEvent("onNativeAnimatedModuleAnimationFinished", events);
      }
    }
  }

  Set<Integer> getTagsOfConnectedNodes(int tag, String eventName) {
    Set<Integer> tags = new HashSet<>();

    // Filter only relevant animation drivers
    ListIterator<EventAnimationDriver> it = mEventDrivers.listIterator();
    while (it.hasNext()) {
      EventAnimationDriver driver = it.next();
      if (driver != null) {
        if (eventName.equals(driver.eventName) && tag == driver.viewTag) {
          tags.add(driver.viewTag);
          if (driver.valueNode != null && driver.valueNode.children != null) {
            for (AnimatedNode node : driver.valueNode.children) {
              tags.add(node.tag);
            }
          }
        }
      }
    }

    return tags;
  }

  @UiThread
  private void updateNodes(List<AnimatedNode> nodes) {
    int activeNodesCount = 0;
    int updatedNodesCount = 0;

    // STEP 1.
    // BFS over graph of nodes. Update `mIncomingNodes` attribute for each node during that BFS.
    // Store number of visited nodes in `activeNodesCount`. We "execute" active animations as a part
    // of this step.

    mAnimatedGraphBFSColor++; /* use new color */
    if (mAnimatedGraphBFSColor == AnimatedNode.INITIAL_BFS_COLOR) {
      // value "0" is used as an initial color for a new node, using it in BFS may cause some nodes
      // to be skipped.
      mAnimatedGraphBFSColor++;
    }

    Queue<AnimatedNode> nodesQueue = new ArrayDeque<>();
    for (AnimatedNode node : nodes) {
      if (node.BFSColor != mAnimatedGraphBFSColor) {
        node.BFSColor = mAnimatedGraphBFSColor;
        activeNodesCount++;
        nodesQueue.add(node);
      }
    }

    while (!nodesQueue.isEmpty()) {
      AnimatedNode nextNode = nodesQueue.poll();
      if (nextNode.children != null) {
        for (int i = 0; i < nextNode.children.size(); i++) {
          AnimatedNode child = nextNode.children.get(i);
          child.activeIncomingNodes++;
          if (child.BFSColor != mAnimatedGraphBFSColor) {
            child.BFSColor = mAnimatedGraphBFSColor;
            activeNodesCount++;
            nodesQueue.add(child);
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

    mAnimatedGraphBFSColor++;
    if (mAnimatedGraphBFSColor == AnimatedNode.INITIAL_BFS_COLOR) {
      // see reasoning for this check a few lines above
      mAnimatedGraphBFSColor++;
    }

    // find nodes with zero "incoming nodes", those can be either nodes from `mUpdatedNodes` or
    // ones connected to active animations
    for (AnimatedNode node : nodes) {
      if (node.activeIncomingNodes == 0 && node.BFSColor != mAnimatedGraphBFSColor) {
        node.BFSColor = mAnimatedGraphBFSColor;
        updatedNodesCount++;
        nodesQueue.add(node);
      }
    }

    // Run main "update" loop
    int cyclesDetected = 0;
    while (!nodesQueue.isEmpty()) {
      AnimatedNode nextNode = nodesQueue.poll();
      try {
        nextNode.update();
        if (nextNode instanceof PropsAnimatedNode) {
          // Send property updates to native view manager
          ((PropsAnimatedNode) nextNode).updateView();
        }
      } catch (JSApplicationCausedNativeException e) {
        // An exception is thrown if the view hasn't been created yet. This can happen because
        // views are created in batches. If this particular view didn't make it into a batch yet,
        // the view won't exist and an exception will be thrown when attempting to start an
        // animation on it.
        //
        // Eat the exception rather than crashing. The impact is that we may drop one or more
        // frames of the animation.
        FLog.e(TAG, "Native animation workaround, frame lost as result of race condition", e);
      }
      if (nextNode instanceof ValueAnimatedNode) {
        // Potentially send events to JS when the node's value is updated
        ((ValueAnimatedNode) nextNode).onValueUpdate();
      }
      if (nextNode.children != null) {
        for (int i = 0; i < nextNode.children.size(); i++) {
          AnimatedNode child = nextNode.children.get(i);
          child.activeIncomingNodes--;
          if (child.BFSColor != mAnimatedGraphBFSColor && child.activeIncomingNodes == 0) {
            child.BFSColor = mAnimatedGraphBFSColor;
            updatedNodesCount++;
            nodesQueue.add(child);
          } else if (child.BFSColor == mAnimatedGraphBFSColor) {
            cyclesDetected++;
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
      if (mWarnedAboutGraphTraversal) {
        return;
      }
      mWarnedAboutGraphTraversal = true;

      // Before crashing or logging soft exception, log details about current graph setup
      FLog.e(TAG, "Detected animation cycle or disconnected graph. ");
      for (AnimatedNode node : nodes) {
        FLog.e(TAG, node.prettyPrintWithChildren());
      }

      // If we're running only in non-Fabric, we still throw an exception.
      // In Fabric, it seems that animations enter an inconsistent state fairly often.
      // We detect if the inconsistency is due to a cycle (a fatal error for which we must crash)
      // or disconnected regions, indicating a partially-set-up animation graph, which is not
      // fatal and can stay a warning.
      String reason =
          cyclesDetected > 0 ? "cycles (" + cyclesDetected + ")" : "disconnected regions";
      IllegalStateException ex =
          new IllegalStateException(
              "Looks like animated nodes graph has "
                  + reason
                  + ", there are "
                  + activeNodesCount
                  + " but toposort visited only "
                  + updatedNodesCount);
      if (mEventListenerInitializedForFabric && cyclesDetected == 0) {
        // TODO T71377544: investigate these SoftExceptions and see if we can remove entirely
        // or fix the root cause
        ReactSoftExceptionLogger.logSoftException(TAG, new ReactNoCrashSoftException(ex));
      } else if (mEventListenerInitializedForFabric) {
        // TODO T71377544: investigate these SoftExceptions and see if we can remove entirely
        // or fix the root cause
        ReactSoftExceptionLogger.logSoftException(TAG, new ReactNoCrashSoftException(ex));
      } else {
        throw ex;
      }
    } else {
      mWarnedAboutGraphTraversal = false;
    }
  }

  private String normalizeEventName(String eventHandlerName) {
    // Fabric UIManager also makes this assumption
    String eventName = eventHandlerName;
    if (eventHandlerName.startsWith("on")) {
      eventName = "top" + eventHandlerName.substring(2);
    }

    return eventName;
  }
}
