/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeAnimatedModuleSpec;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UIManagerListener;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.GuardedFrameCallback;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

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
    implements LifecycleEventListener, UIManagerListener {

  public static final String NAME = "NativeAnimatedModule";
  public static final boolean ANIMATED_MODULE_DEBUG = false;

  private interface UIThreadOperation {
    void execute(NativeAnimatedNodesManager animatedNodesManager);
  }

  @NonNull private final GuardedFrameCallback mAnimatedFrameCallback;
  private final ReactChoreographer mReactChoreographer;

  @NonNull
  private ConcurrentLinkedQueue<UIThreadOperation> mOperations = new ConcurrentLinkedQueue<>();

  @NonNull
  private ConcurrentLinkedQueue<UIThreadOperation> mPreOperations = new ConcurrentLinkedQueue<>();

  private @Nullable NativeAnimatedNodesManager mNodesManager;

  private volatile boolean mFabricBatchCompleted = false;
  private boolean mInitializedForFabric = false;
  private @UIManagerType int mUIManagerType = UIManagerType.DEFAULT;
  private int mNumFabricAnimations = 0;
  private int mNumNonFabricAnimations = 0;

  public NativeAnimatedModule(ReactApplicationContext reactContext) {
    super(reactContext);

    mReactChoreographer = ReactChoreographer.getInstance();
    mAnimatedFrameCallback =
        new GuardedFrameCallback(reactContext) {
          @Override
          protected void doFrameGuarded(final long frameTimeNanos) {
            try {
              NativeAnimatedNodesManager nodesManager = getNodesManager();
              if (nodesManager != null && nodesManager.hasActiveAnimations()) {
                nodesManager.runUpdates(frameTimeNanos);
              }
              // This is very unlikely to ever be hit.
              if (nodesManager == null && mReactChoreographer == null) {
                return;
              }

              // TODO: Would be great to avoid adding this callback in case there are no active
              // animations and no outstanding tasks on the operations queue. Apparently frame
              // callbacks can only be posted from the UI thread and therefore we cannot schedule
              // them directly from other threads.
              Assertions.assertNotNull(mReactChoreographer)
                  .postFrameCallback(
                      ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
                      mAnimatedFrameCallback);
            } catch (Exception ex) {
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
      UIManagerModule uiManager =
          Assertions.assertNotNull(reactApplicationContext.getNativeModule(UIManagerModule.class));
      uiManager.addUIManagerEventListener(this);
    }
  }

  @Override
  public void onHostResume() {
    enqueueFrameCallback();
  }

  // For FabricUIManager only
  @Override
  public void didScheduleMountItems(UIManager uiManager) {
    if (mUIManagerType != UIManagerType.FABRIC) {
      return;
    }

    mFabricBatchCompleted = true;
  }

  // For FabricUIManager only
  @Override
  @UiThread
  public void didDispatchMountItems(UIManager uiManager) {
    if (mUIManagerType != UIManagerType.FABRIC) {
      return;
    }

    if (mFabricBatchCompleted) {
      // This will execute all operations and preOperations queued
      // since the last time this was run, and will race with anything
      // being queued from the JS thread. That is, if the JS thread
      // is still queuing operations, we might execute some of them
      // at the very end until we exhaust the queue faster than the
      // JS thread can queue up new items.
      executeAllOperations(mPreOperations);
      executeAllOperations(mOperations);
      mFabricBatchCompleted = false;
    }
  }

  private void executeAllOperations(Queue<UIThreadOperation> operationQueue) {
    NativeAnimatedNodesManager nodesManager = getNodesManager();
    while (!operationQueue.isEmpty()) {
      operationQueue.poll().execute(nodesManager);
    }
  }

  // For non-FabricUIManager only
  @Override
  @UiThread
  public void willDispatchViewUpdates(final UIManager uiManager) {
    if (mOperations.isEmpty() && mPreOperations.isEmpty()) {
      return;
    }
    if (mUIManagerType == UIManagerType.FABRIC) {
      return;
    }

    final Queue<UIThreadOperation> preOperations = new LinkedList<>();
    final Queue<UIThreadOperation> operations = new LinkedList<>();
    while (!mPreOperations.isEmpty()) {
      preOperations.add(mPreOperations.poll());
    }
    while (!mOperations.isEmpty()) {
      operations.add(mOperations.poll());
    }

    UIBlock preOperationsUIBlock =
        new UIBlock() {
          @Override
          public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
            executeAllOperations(preOperations);
          }
        };

    UIBlock operationsUIBlock =
        new UIBlock() {
          @Override
          public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
            NativeAnimatedNodesManager nodesManager = getNodesManager();
            executeAllOperations(operations);
          }
        };

    assert (uiManager instanceof UIManagerModule);
    UIManagerModule uiManagerModule = (UIManagerModule) uiManager;
    uiManagerModule.prependUIBlock(preOperationsUIBlock);
    uiManagerModule.addUIBlock(operationsUIBlock);
  }

  @Override
  public void onHostPause() {
    clearFrameCallback();
  }

  @Override
  public void onHostDestroy() {
    // Is it possible for onHostDestroy to be called without a corresponding onHostPause?
    clearFrameCallback();
  }

  @Override
  public String getName() {
    return NAME;
  }

  /**
   * Returns a {@link NativeAnimatedNodesManager}, either the existing instance or a new one. Will
   * return null if and only if the {@link ReactApplicationContext} is also null.
   *
   * @return {@link NativeAnimatedNodesManager}
   */
  @Nullable
  private NativeAnimatedNodesManager getNodesManager() {
    if (mNodesManager == null) {
      ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

      if (reactApplicationContext != null) {
        mNodesManager = new NativeAnimatedNodesManager(reactApplicationContext);
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
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME, "queue createAnimatedNode: " + tag + " config: " + config.toHashMap().toString());
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute createAnimatedNode: "
                      + tag
                      + " config: "
                      + config.toHashMap().toString());
            }
            animatedNodesManager.createAnimatedNode(tag, config);
          }
        });
  }

  @Override
  public void startListeningToAnimatedNodeValue(final double tagDouble) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue startListeningToAnimatedNodeValue: " + tag);
    }

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
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute startListeningToAnimatedNodeValue: " + tag);
            }
            animatedNodesManager.startListeningToAnimatedNodeValue(tag, listener);
          }
        });
  }

  @Override
  public void stopListeningToAnimatedNodeValue(final double tagDouble) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue stopListeningToAnimatedNodeValue: " + tag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute stopListeningToAnimatedNodeValue: " + tag);
            }
            animatedNodesManager.stopListeningToAnimatedNodeValue(tag);
          }
        });
  }

  @Override
  public void dropAnimatedNode(final double tagDouble) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue dropAnimatedNode: " + tag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute dropAnimatedNode: " + tag);
            }
            animatedNodesManager.dropAnimatedNode(tag);
          }
        });
  }

  @Override
  public void setAnimatedNodeValue(final double tagDouble, final double value) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue setAnimatedNodeValue: " + tag + " value: " + value);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute setAnimatedNodeValue: " + tag + " value: " + value);
            }
            animatedNodesManager.setAnimatedNodeValue(tag, value);
          }
        });
  }

  @Override
  public void setAnimatedNodeOffset(final double tagDouble, final double value) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue setAnimatedNodeOffset: " + tag + " offset: " + value);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute setAnimatedNodeOffset: " + tag + " offset: " + value);
            }
            animatedNodesManager.setAnimatedNodeOffset(tag, value);
          }
        });
  }

  @Override
  public void flattenAnimatedNodeOffset(final double tagDouble) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue flattenAnimatedNodeOffset: " + tag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute flattenAnimatedNodeOffset: " + tag);
            }
            animatedNodesManager.flattenAnimatedNodeOffset(tag);
          }
        });
  }

  @Override
  public void extractAnimatedNodeOffset(final double tagDouble) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue extractAnimatedNodeOffset: " + tag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute extractAnimatedNodeOffset: " + tag);
            }
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
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue startAnimatingNode: ID: " + animationId + " tag: " + animatedNodeTag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute startAnimatingNode: ID: " + animationId + " tag: " + animatedNodeTag);
            }
            animatedNodesManager.startAnimatingNode(
                animationId, animatedNodeTag, animationConfig, endCallback);
          }
        });
  }

  @Override
  public void stopAnimation(final double animationIdDouble) {
    final int animationId = (int) animationIdDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue stopAnimation: ID: " + animationId);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute stopAnimation: ID: " + animationId);
            }
            animatedNodesManager.stopAnimation(animationId);
          }
        });
  }

  @Override
  public void connectAnimatedNodes(
      final double parentNodeTagDouble, final double childNodeTagDouble) {
    final int parentNodeTag = (int) parentNodeTagDouble;
    final int childNodeTag = (int) childNodeTagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME, "queue connectAnimatedNodes: parent: " + parentNodeTag + " child: " + childNodeTag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute connectAnimatedNodes: parent: "
                      + parentNodeTag
                      + " child: "
                      + childNodeTag);
            }
            animatedNodesManager.connectAnimatedNodes(parentNodeTag, childNodeTag);
          }
        });
  }

  @Override
  public void disconnectAnimatedNodes(
      final double parentNodeTagDouble, final double childNodeTagDouble) {
    final int parentNodeTag = (int) parentNodeTagDouble;
    final int childNodeTag = (int) childNodeTagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          "queue disconnectAnimatedNodes: parent: " + parentNodeTag + " child: " + childNodeTag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute disconnectAnimatedNodes: parent: "
                      + parentNodeTag
                      + " child: "
                      + childNodeTag);
            }
            animatedNodesManager.disconnectAnimatedNodes(parentNodeTag, childNodeTag);
          }
        });
  }

  @Override
  public void connectAnimatedNodeToView(
      final double animatedNodeTagDouble, final double viewTagDouble) {
    final int animatedNodeTag = (int) animatedNodeTagDouble;
    final int viewTag = (int) viewTagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          "queue connectAnimatedNodeToView: animatedNodeTag: "
              + animatedNodeTag
              + " viewTag: "
              + viewTag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute connectAnimatedNodeToView: animatedNodeTag: "
                      + animatedNodeTag
                      + " viewTag: "
                      + viewTag);
            }
            animatedNodesManager.connectAnimatedNodeToView(animatedNodeTag, viewTag);
          }
        });
  }

  @Override
  public void disconnectAnimatedNodeFromView(
      final double animatedNodeTagDouble, final double viewTagDouble) {
    final int animatedNodeTag = (int) animatedNodeTagDouble;
    final int viewTag = (int) viewTagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          "queue connectAnimatedNodeToView: disconnectAnimatedNodeFromView: "
              + animatedNodeTag
              + " viewTag: "
              + viewTag);
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute connectAnimatedNodeToView: disconnectAnimatedNodeFromView: "
                      + animatedNodeTag
                      + " viewTag: "
                      + viewTag);
            }
            animatedNodesManager.disconnectAnimatedNodeFromView(animatedNodeTag, viewTag);
          }
        });
  }

  @Override
  public void restoreDefaultValues(final double animatedNodeTagDouble) {
    final int animatedNodeTag = (int) animatedNodeTagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME, "queue restoreDefaultValues: disconnectAnimatedNodeFromView: " + animatedNodeTag);
    }

    mPreOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute restoreDefaultValues: disconnectAnimatedNodeFromView: "
                      + animatedNodeTag);
            }
            animatedNodesManager.restoreDefaultValues(animatedNodeTag);
          }
        });
  }

  @Override
  public void addAnimatedEventToView(
      final double viewTagDouble, final String eventName, final ReadableMap eventMapping) {
    final int viewTag = (int) viewTagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          "queue addAnimatedEventToView: "
              + viewTag
              + " eventName: "
              + eventName
              + " eventMapping: "
              + eventMapping.toHashMap().toString());
    }

    mUIManagerType = ViewUtil.getUIManagerType(viewTag);
    if (mUIManagerType == UIManagerType.FABRIC) {
      mNumFabricAnimations++;
    } else {
      mNumNonFabricAnimations++;
    }

    // Subscribe to FabricUIManager lifecycle events if we haven't yet
    if (!mInitializedForFabric && mUIManagerType == UIManagerType.FABRIC) {
      ReactApplicationContext reactApplicationContext = getReactApplicationContext();
      if (reactApplicationContext != null) {
        @Nullable
        UIManager uiManager =
            UIManagerHelper.getUIManager(reactApplicationContext, UIManagerType.FABRIC);
        if (uiManager != null) {
          uiManager.addUIManagerEventListener(this);
          mInitializedForFabric = true;
        }
      }
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute addAnimatedEventToView: "
                      + viewTag
                      + " eventName: "
                      + eventName
                      + " eventMapping: "
                      + eventMapping.toHashMap().toString());
            }
            animatedNodesManager.addAnimatedEventToView(viewTag, eventName, eventMapping);
          }
        });
  }

  @Override
  public void removeAnimatedEventFromView(
      final double viewTagDouble, final String eventName, final double animatedValueTagDouble) {
    final int viewTag = (int) viewTagDouble;
    final int animatedValueTag = (int) animatedValueTagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          "queue addAnimatedEventToView: removeAnimatedEventFromView: "
              + viewTag
              + " eventName: "
              + eventName
              + " animatedValueTag: "
              + animatedValueTag);
    }

    @UIManagerType int animationManagerType = ViewUtil.getUIManagerType(viewTag);
    if (animationManagerType == UIManagerType.FABRIC) {
      mNumFabricAnimations--;
    } else {
      mNumNonFabricAnimations--;
    }

    // Should we switch to a different animation mode?
    // This can be useful when navigating between Fabric and non-Fabric screens:
    // If there are ongoing Fabric animations from a previous screen,
    // and we tear down the current non-Fabric screen, we should expect
    // the animation mode to switch back - and vice-versa.
    if (mNumNonFabricAnimations == 0
        && mNumFabricAnimations > 0
        && mUIManagerType != UIManagerType.FABRIC) {
      mUIManagerType = UIManagerType.FABRIC;
    } else if (mNumFabricAnimations == 0
        && mNumNonFabricAnimations > 0
        && mUIManagerType != UIManagerType.DEFAULT) {
      mUIManagerType = UIManagerType.DEFAULT;
    }

    mOperations.add(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute addAnimatedEventToView: removeAnimatedEventFromView: "
                      + viewTag
                      + " eventName: "
                      + eventName
                      + " animatedValueTag: "
                      + animatedValueTag);
            }
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
