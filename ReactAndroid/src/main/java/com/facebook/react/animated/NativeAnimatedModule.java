/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeAnimatedModuleSpec;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.GuardedFrameCallback;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIManagerModuleListener;
import java.util.ArrayList;

/**
 * Module that exposes interface for creating and managing animated nodes on the "native" side.
 *
 * <p>Animated.js library is based on a concept of a graph where nodes are values or transform
 * operations (such as interpolation, addition, etc) and connection are used to describe how change
 * of the value in one node can affect other nodes.
 *
 * <p>Few examples of the nodes that can be created on the JS side:
 *
 * <ul>
 *   <li>Animated.Value is a simplest type of node with a numeric value which can be driven by an
 *       animation engine (spring, decay, etc) or by calling setValue on it directly from JS
 *   <li>Animated.add is a type of node that may have two or more input nodes. It outputs the sum of
 *       all the input node values
 *   <li>interpolate - is actually a method you can call on any node and it creates a new node that
 *       takes the parent node as an input and outputs its interpolated value (e.g. if you have
 *       value that can animate from 0 to 1 you can create interpolated node and set output range to
 *       be 0 to 100 and when the input node changes the output of interpolated node will multiply
 *       the values by 100)
 * </ul>
 *
 * <p>You can mix and chain nodes however you like and this way create nodes graph with connections
 * between them.
 *
 * <p>To map animated node values to view properties there is a special type of a node:
 * AnimatedProps. It is created by AnimatedImplementation whenever you render Animated.View and
 * stores a mapping from the view properties to the corresponding animated values (so it's actually
 * also a node with connections to the value nodes).
 *
 * <p>Last "special" elements of the graph are "animation drivers". Those are objects (represented
 * as a graph nodes too) that based on some criteria updates attached values every frame (we have
 * few types of those, e.g., spring, timing, decay). Animation objects can be "started" and
 * "stopped". Those are like "pulse generators" for the rest of the nodes graph. Those pulses then
 * propagate along the graph to the children nodes up to the special node type: AnimatedProps which
 * then can be used to calculate property update map for a view.
 *
 * <p>This class acts as a proxy between the "native" API that can be called from JS and the main
 * class that coordinates all the action: {@link NativeAnimatedNodesManager}. Since all the methods
 * from {@link NativeAnimatedNodesManager} need to be called from the UI thread, we we create a
 * queue of animated graph operations that is then enqueued to be executed in the UI Thread at the
 * end of the batch of JS->native calls (similarly to how it's handled in {@link UIManagerModule}).
 * This isolates us from the problems that may be caused by concurrent updates of animated graph
 * while UI thread is "executing" the animation loop.
 */
@ReactModule(name = NativeAnimatedModule.NAME)
public class NativeAnimatedModule extends NativeAnimatedModuleSpec
    implements LifecycleEventListener, UIManagerModuleListener {

  public static final String NAME = "NativeAnimatedModule";

  private interface UIThreadOperation {
    void execute(NativeAnimatedNodesManager animatedNodesManager);
  }

  private final GuardedFrameCallback mAnimatedFrameCallback;
  private final ReactChoreographer mReactChoreographer;
  private ArrayList<UIThreadOperation> mOperations = new ArrayList<>();
  private ArrayList<UIThreadOperation> mPreOperations = new ArrayList<>();

  private @Nullable NativeAnimatedNodesManager mNodesManager;

  public NativeAnimatedModule(ReactApplicationContext reactContext) {
    super(reactContext);

    mReactChoreographer = ReactChoreographer.getInstance();
    mAnimatedFrameCallback =
        new GuardedFrameCallback(reactContext) {
          @Override
          protected void doFrameGuarded(final long frameTimeNanos) {
            try {
              NativeAnimatedNodesManager nodesManager = getNodesManager();
              if (nodesManager.hasActiveAnimations()) {
                nodesManager.runUpdates(frameTimeNanos);
              }

              // TODO: Would be great to avoid adding this callback in case there are no active
              // animations
              // and no outstanding tasks on the operations queue. Apparently frame callbacks can
              // only
              // be posted from the UI thread and therefore we cannot schedule them directly from
              // @Override
              Assertions.assertNotNull(mReactChoreographer)
                  .postFrameCallback(
                      ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
                      mAnimatedFrameCallback);
            } catch (Exception ex) {
              // TODO T57341690 remove this when T57341690 is resolved
              FLog.e(ReactConstants.TAG, "Exception while executing animated frame callback.", ex);
              throw new RuntimeException(ex);
            }
          }
        };
  }

  @Override
  public void initialize() {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    // TODO T59412313 Implement this API on FabricUIManager to use in bridgeless mode
    if (reactApplicationContext != null && !reactApplicationContext.isBridgeless()) {
      reactApplicationContext.addLifecycleEventListener(this);
      UIManagerModule uiManager = reactApplicationContext.getNativeModule(UIManagerModule.class);
      uiManager.addUIManagerListener(this);
    }
  }

  @Override
  public void onHostResume() {
    enqueueFrameCallback();
  }

  @Override
  public void willDispatchViewUpdates(final UIManagerModule uiManager) {
    if (mOperations.isEmpty() && mPreOperations.isEmpty()) {
      return;
    }
    final ArrayList<UIThreadOperation> preOperations = mPreOperations;
    final ArrayList<UIThreadOperation> operations = mOperations;
    mPreOperations = new ArrayList<>();
    mOperations = new ArrayList<>();
    uiManager.prependUIBlock(
        new UIBlock() {
          @Override
          public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
            NativeAnimatedNodesManager nodesManager = getNodesManager();
            for (UIThreadOperation operation : preOperations) {
              operation.execute(nodesManager);
            }
          }
        });
    uiManager.addUIBlock(
        new UIBlock() {
          @Override
          public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
            NativeAnimatedNodesManager nodesManager = getNodesManager();
            for (UIThreadOperation operation : operations) {
              operation.execute(nodesManager);
            }
          }
        });
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
    return NAME;
  }

  private NativeAnimatedNodesManager getNodesManager() {
    if (mNodesManager == null) {
      ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

      if (reactApplicationContext != null) {
        UIManagerModule uiManager = reactApplicationContext.getNativeModule(UIManagerModule.class);
        mNodesManager = new NativeAnimatedNodesManager(uiManager);
      }
    }

    return mNodesManager;
  }

  private void clearFrameCallback() {
    Assertions.assertNotNull(mReactChoreographer)
        .removeFrameCallback(
            ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE, mAnimatedFrameCallback);
  }

  private void enqueueFrameCallback() {
    Assertions.assertNotNull(mReactChoreographer)
        .postFrameCallback(
            ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE, mAnimatedFrameCallback);
  }

  @VisibleForTesting
  public void setNodesManager(NativeAnimatedNodesManager nodesManager) {
    mNodesManager = nodesManager;
  }

  @Override
  public void createAnimatedNode(final double tagDouble, final ReadableMap config) {
    final int tag = (int) tagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.createAnimatedNode(tag, config);
          }
        });
  }

  @Override
  public void startListeningToAnimatedNodeValue(final double tagDouble) {
    final int tag = (int) tagDouble;

    final AnimatedNodeValueListener listener =
        new AnimatedNodeValueListener() {
          public void onValueUpdate(double value) {
            WritableMap onAnimatedValueData = Arguments.createMap();
            onAnimatedValueData.putInt("tag", tag);
            onAnimatedValueData.putDouble("value", value);

            ReactApplicationContext reactApplicationContext =
                getReactApplicationContextIfActiveOrWarn();
            if (reactApplicationContext != null) {
              reactApplicationContext
                  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                  .emit("onAnimatedValueUpdate", onAnimatedValueData);
            }
          }
        };

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.startListeningToAnimatedNodeValue(tag, listener);
          }
        });
  }

  @Override
  public void stopListeningToAnimatedNodeValue(final double tagDouble) {
    final int tag = (int) tagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.stopListeningToAnimatedNodeValue(tag);
          }
        });
  }

  @Override
  public void dropAnimatedNode(final double tagDouble) {
    final int tag = (int) tagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.dropAnimatedNode(tag);
          }
        });
  }

  @Override
  public void setAnimatedNodeValue(final double tagDouble, final double value) {
    final int tag = (int) tagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.setAnimatedNodeValue(tag, value);
          }
        });
  }

  @Override
  public void setAnimatedNodeOffset(final double tagDouble, final double value) {
    final int tag = (int) tagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.setAnimatedNodeOffset(tag, value);
          }
        });
  }

  @Override
  public void flattenAnimatedNodeOffset(final double tagDouble) {
    final int tag = (int) tagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.flattenAnimatedNodeOffset(tag);
          }
        });
  }

  @Override
  public void extractAnimatedNodeOffset(final double tagDouble) {
    final int tag = (int) tagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.extractAnimatedNodeOffset(tag);
          }
        });
  }

  @Override
  public void startAnimatingNode(
      final double animationIdDouble,
      final double animatedNodeTagDouble,
      final ReadableMap animationConfig,
      final Callback endCallback) {
    final int animationId = (int) animationIdDouble;
    final int animatedNodeTag = (int) animatedNodeTagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.startAnimatingNode(
                animationId, animatedNodeTag, animationConfig, endCallback);
          }
        });
  }

  @Override
  public void stopAnimation(final double animationIdDouble) {
    final int animationId = (int) animationIdDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.stopAnimation(animationId);
          }
        });
  }

  @Override
  public void connectAnimatedNodes(
      final double parentNodeTagDouble, final double childNodeTagDouble) {
    final int parentNodeTag = (int) parentNodeTagDouble;
    final int childNodeTag = (int) childNodeTagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.connectAnimatedNodes(parentNodeTag, childNodeTag);
          }
        });
  }

  @Override
  public void disconnectAnimatedNodes(
      final double parentNodeTagDouble, final double childNodeTagDouble) {
    final int parentNodeTag = (int) parentNodeTagDouble;
    final int childNodeTag = (int) childNodeTagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.disconnectAnimatedNodes(parentNodeTag, childNodeTag);
          }
        });
  }

  @Override
  public void connectAnimatedNodeToView(
      final double animatedNodeTagDouble, final double viewTagDouble) {
    final int animatedNodeTag = (int) animatedNodeTagDouble;
    final int viewTag = (int) viewTagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.connectAnimatedNodeToView(animatedNodeTag, viewTag);
          }
        });
  }

  @Override
  public void disconnectAnimatedNodeFromView(
      final double animatedNodeTagDouble, final double viewTagDouble) {
    final int animatedNodeTag = (int) animatedNodeTagDouble;
    final int viewTag = (int) viewTagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.disconnectAnimatedNodeFromView(animatedNodeTag, viewTag);
          }
        });
  }

  @Override
  public void restoreDefaultValues(final double animatedNodeTagDouble) {
    final int animatedNodeTag = (int) animatedNodeTagDouble;

    mPreOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.restoreDefaultValues(animatedNodeTag);
          }
        });
  }

  @Override
  public void addAnimatedEventToView(
      final double viewTagDouble, final String eventName, final ReadableMap eventMapping) {
    final int viewTag = (int) viewTagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.addAnimatedEventToView(viewTag, eventName, eventMapping);
          }
        });
  }

  @Override
  public void removeAnimatedEventFromView(
      final double viewTagDouble, final String eventName, final double animatedValueTagDouble) {
    final int viewTag = (int) viewTagDouble;
    final int animatedValueTag = (int) animatedValueTagDouble;

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.removeAnimatedEventFromView(viewTag, eventName, animatedValueTag);
          }
        });
  }

  @Override
  public void addListener(String eventName) {
    // iOS only
  }

  @Override
  public void removeListeners(double count) {
    // iOS only
  }
}
