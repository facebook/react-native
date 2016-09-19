/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import javax.annotation.Nullable;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.OnBatchCompleteListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.GuardedChoreographerFrameCallback;
import com.facebook.react.uimanager.ReactChoreographer;
import com.facebook.react.uimanager.UIManagerModule;

import java.util.ArrayList;

/**
 * Module that exposes interface for creating and managing animated nodes on the "native" side.
 *
 * Animated.js library is based on a concept of a graph where nodes are values or transform
 * operations (such as interpolation, addition, etc) and connection are used to describe how change
 * of the value in one node can affect other nodes.
 *
 * Few examples of the nodes that can be created on the JS side:
 *  - Animated.Value is a simplest type of node with a numeric value which can be driven by an
 *    animation engine (spring, decay, etc) or by calling setValue on it directly from JS
 *  - Animated.add is a type of node that may have two or more input nodes. It outputs the sum of
 *    all the input node values
 *  - interpolate - is actually a method you can call on any node and it creates a new node that
 *    takes the parent node as an input and outputs its interpolated value (e.g. if you have value
 *    that can animate from 0 to 1 you can create interpolated node and set output range to be 0 to
 *    100 and when the input node changes the output of interpolated node will multiply the values
 *    by 100)
 *
 * You can mix and chain nodes however you like and this way create nodes graph with connections
 * between them.
 *
 * To map animated node values to view properties there is a special type of a node: AnimatedProps.
 * It is created by AnimatedImplementation whenever you render Animated.View and stores a mapping
 * from the view properties to the corresponding animated values (so it's actually also a node with
 * connections to the value nodes).
 *
 * Last "special" elements of the the graph are "animation drivers". Those are objects (represented
 * as a graph nodes too) that based on some criteria updates attached values every frame (we have
 * few types of those, e.g., spring, timing, decay). Animation objects can be "started" and
 * "stopped". Those are like "pulse generators" for the rest of the nodes graph. Those pulses then
 * propagate along the graph to the children nodes up to the special node type: AnimatedProps which
 * then can be used to calculate property update map for a view.
 *
 * This class acts as a proxy between the "native" API that can be called from JS and the main class
 * that coordinates all the action: {@link NativeAnimatedNodesManager}. Since all the methods from
 * {@link NativeAnimatedNodesManager} need to be called from the UI thread, we we create a queue of
 * animated graph operations that is then enqueued to be executed in the UI Thread at the end of the
 * batch of JS->native calls (similarily to how it's handled in {@link UIManagerModule}). This
 * isolates us from the problems that may be caused by concurrent updates of animated graph while UI
 * thread is "executing" the animation loop.
 */
@ReactModule(name = "NativeAnimatedModule")
public class NativeAnimatedModule extends ReactContextBaseJavaModule implements
    OnBatchCompleteListener, LifecycleEventListener {

  private interface UIThreadOperation {
    void execute(NativeAnimatedNodesManager animatedNodesManager);
  }

  private final Object mOperationsCopyLock = new Object();
  private @Nullable GuardedChoreographerFrameCallback mAnimatedFrameCallback;
  private @Nullable ReactChoreographer mReactChoreographer;
  private ArrayList<UIThreadOperation> mOperations = new ArrayList<>();
  private volatile @Nullable ArrayList<UIThreadOperation> mReadyOperations = null;

  public NativeAnimatedModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public void initialize() {
    // Safe to acquire choreographer here, as initialize() is invoked from UI thread.
    mReactChoreographer = ReactChoreographer.getInstance();

    ReactApplicationContext reactCtx = getReactApplicationContext();
    UIManagerModule uiManager = reactCtx.getNativeModule(UIManagerModule.class);

    final NativeAnimatedNodesManager nodesManager = new NativeAnimatedNodesManager(uiManager);
    mAnimatedFrameCallback = new GuardedChoreographerFrameCallback(reactCtx) {
      @Override
      protected void doFrameGuarded(final long frameTimeNanos) {

        ArrayList<UIThreadOperation> operations;
        synchronized (mOperationsCopyLock) {
          operations = mReadyOperations;
          mReadyOperations = null;
        }

        if (operations != null) {
          for (int i = 0, size = operations.size(); i < size; i++) {
            operations.get(i).execute(nodesManager);
          }
        }

        if (nodesManager.hasActiveAnimations()) {
          nodesManager.runUpdates(frameTimeNanos);
        }

        // TODO: Would be great to avoid adding this callback in case there are no active animations
        // and no outstanding tasks on the operations queue. Apparently frame callbacks can only
        // be posted from the UI thread and therefore we cannot schedule them directly from
        // @ReactMethod methods
        Assertions.assertNotNull(mReactChoreographer).postFrameCallback(
          ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
          mAnimatedFrameCallback);
      }
    };
    reactCtx.addLifecycleEventListener(this);
  }

  @Override
  public void onBatchComplete() {
    // Note: The order of executing onBatchComplete handler (especially in terms of onBatchComplete
    // from the UIManagerModule) doesn't matter as we only enqueue operations for the UI thread to
    // be executed from here. Thanks to ReactChoreographer all the operations from here are going
    // to be executed *after* all the operations enqueued by UIManager as the callback type that we
    // use for ReactChoreographer (CallbackType.NATIVE_ANIMATED_MODULE) is run after callbacks that
    // UIManager uses.
    ArrayList<UIThreadOperation> operations = mOperations.isEmpty() ? null : mOperations;
    if (operations != null) {
      mOperations = new ArrayList<>();
      synchronized (mOperationsCopyLock) {
        if (mReadyOperations == null) {
          mReadyOperations = operations;
        } else {
          mReadyOperations.addAll(operations);
        }
      }
    }
  }

  @Override
  public void onHostResume() {
    enqueueFrameCallback();
  }

  @Override
  public void onHostPause() {
    clearFrameCallback();
  }

  @Override
  public void onHostDestroy() {
    // do nothing
  }

  @Override
  public String getName() {
    return "NativeAnimatedModule";
  }

  private void clearFrameCallback() {
    Assertions.assertNotNull(mReactChoreographer).removeFrameCallback(
      ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
      mAnimatedFrameCallback);
  }

  private void enqueueFrameCallback() {
    Assertions.assertNotNull(mReactChoreographer).postFrameCallback(
      ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
      mAnimatedFrameCallback);
  }

  @ReactMethod
  public void createAnimatedNode(final int tag, final ReadableMap config) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.createAnimatedNode(tag, config);
      }
    });
  }

  @ReactMethod
  public void startListeningToAnimatedNodeValue(final int tag) {
    final AnimatedNodeValueListener listener = new AnimatedNodeValueListener() {
      public void onValueUpdate(double value) {
        WritableMap onAnimatedValueData = Arguments.createMap();
        onAnimatedValueData.putInt("tag", tag);
        onAnimatedValueData.putDouble("value", value);
        getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("onAnimatedValueUpdate", onAnimatedValueData);
      }
    };

    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.startListeningToAnimatedNodeValue(tag, listener);
      }
    });
  }

  @ReactMethod
  public void stopListeningToAnimatedNodeValue(final int tag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.stopListeningToAnimatedNodeValue(tag);
      }
    });
  }

  @ReactMethod
  public void dropAnimatedNode(final int tag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.dropAnimatedNode(tag);
      }
    });
  }

  @ReactMethod
  public void setAnimatedNodeValue(final int tag, final double value) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.setAnimatedNodeValue(tag, value);
      }
    });
  }

  @ReactMethod
  public void startAnimatingNode(
      final int animationId,
      final int animatedNodeTag,
      final ReadableMap animationConfig,
      final Callback endCallback) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.startAnimatingNode(
          animationId,
          animatedNodeTag,
          animationConfig,
          endCallback);
      }
    });
  }

  @ReactMethod
  public void stopAnimation(final int animationId) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.stopAnimation(animationId);
      }
    });
  }

  @ReactMethod
  public void connectAnimatedNodes(final int parentNodeTag, final int childNodeTag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.connectAnimatedNodes(parentNodeTag, childNodeTag);
      }
    });
  }

  @ReactMethod
  public void disconnectAnimatedNodes(final int parentNodeTag, final int childNodeTag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.disconnectAnimatedNodes(parentNodeTag, childNodeTag);
      }
    });
  }

  @ReactMethod
  public void connectAnimatedNodeToView(final int animatedNodeTag, final int viewTag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.connectAnimatedNodeToView(animatedNodeTag, viewTag);
      }
    });
  }

  @ReactMethod
  public void disconnectAnimatedNodeFromView(final int animatedNodeTag, final int viewTag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.disconnectAnimatedNodeFromView(animatedNodeTag, viewTag);
      }
    });
  }

  @ReactMethod
  public void addAnimatedEventToView(final int viewTag, final String eventName, final ReadableMap eventMapping) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.addAnimatedEventToView(viewTag, eventName, eventMapping);
      }
    });
  }

  @ReactMethod
  public void removeAnimatedEventFromView(final int viewTag, final String eventName) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NativeAnimatedNodesManager animatedNodesManager) {
        animatedNodesManager.removeAnimatedEventFromView(viewTag, eventName);
      }
    });
  }
}
