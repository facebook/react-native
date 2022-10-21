/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.AnyThread;
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
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicReference;

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

  // For `queueAndExecuteBatchedOperations`
  private enum BatchExecutionOpCodes {
    OP_CODE_CREATE_ANIMATED_NODE(1),
    OP_CODE_UPDATE_ANIMATED_NODE_CONFIG(2),
    OP_CODE_GET_VALUE(3),
    OP_START_LISTENING_TO_ANIMATED_NODE_VALUE(4),
    OP_STOP_LISTENING_TO_ANIMATED_NODE_VALUE(5),
    OP_CODE_CONNECT_ANIMATED_NODES(6),
    OP_CODE_DISCONNECT_ANIMATED_NODES(7),
    OP_CODE_START_ANIMATING_NODE(8),
    OP_CODE_STOP_ANIMATION(9),
    OP_CODE_SET_ANIMATED_NODE_VALUE(10),
    OP_CODE_SET_ANIMATED_NODE_OFFSET(11),
    OP_CODE_FLATTEN_ANIMATED_NODE_OFFSET(12),
    OP_CODE_EXTRACT_ANIMATED_NODE_OFFSET(13),
    OP_CODE_CONNECT_ANIMATED_NODE_TO_VIEW(14),
    OP_CODE_DISCONNECT_ANIMATED_NODE_FROM_VIEW(15),
    OP_CODE_RESTORE_DEFAULT_VALUES(16),
    OP_CODE_DROP_ANIMATED_NODE(17),
    OP_CODE_ADD_ANIMATED_EVENT_TO_VIEW(18),
    OP_CODE_REMOVE_ANIMATED_EVENT_FROM_VIEW(19),
    OP_CODE_ADD_LISTENER(20), // ios only
    OP_CODE_REMOVE_LISTENERS(21); // ios only

    private static BatchExecutionOpCodes[] valueMap = null;
    private final int value;

    private BatchExecutionOpCodes(int value) {
      this.value = value;
    }

    public int getValue() {
      return this.value;
    }

    public static BatchExecutionOpCodes fromId(int id) {
      if (BatchExecutionOpCodes.valueMap == null) {
        BatchExecutionOpCodes.valueMap = BatchExecutionOpCodes.values();
      }
      // Enum values are 1-indexed, but the value array is 0-indexed
      return BatchExecutionOpCodes.valueMap[id - 1];
    }
  }

  private abstract class UIThreadOperation {
    abstract void execute(NativeAnimatedNodesManager animatedNodesManager);

    long mBatchNumber = -1;

    public void setBatchNumber(long batchNumber) {
      mBatchNumber = batchNumber;
    }

    public long getBatchNumber() {
      return mBatchNumber;
    }
  }

  private class ConcurrentOperationQueue {
    private final Queue<UIThreadOperation> mQueue = new ConcurrentLinkedQueue<>();
    @Nullable private UIThreadOperation mPeekedOperation = null;

    @AnyThread
    boolean isEmpty() {
      return mQueue.isEmpty() && mPeekedOperation == null;
    }

    @AnyThread
    void add(UIThreadOperation operation) {
      mQueue.add(operation);
    }

    @UiThread
    void executeBatch(long maxBatchNumber, NativeAnimatedNodesManager nodesManager) {
      List<UIThreadOperation> operations;
      operations = drainQueueIntoList(maxBatchNumber);
      if (operations != null) {
        for (UIThreadOperation operation : operations) {
          operation.execute(nodesManager);
        }
      }
    }

    @UiThread
    private @Nullable List<UIThreadOperation> drainQueueIntoList(long maxBatchNumber) {
      if (isEmpty()) {
        return null;
      }

      List<UIThreadOperation> operations = new ArrayList<>();
      while (true) {
        // Due to a race condition, we manually "carry-over" a polled item from previous batch
        // instead of peeking the queue itself for consistency.
        // TODO(T112522554): Clean up the queue access
        if (mPeekedOperation != null) {
          if (mPeekedOperation.getBatchNumber() > maxBatchNumber) {
            break;
          }
          operations.add(mPeekedOperation);
          mPeekedOperation = null;
        }

        UIThreadOperation polledOperation = mQueue.poll();
        if (polledOperation == null) {
          // This is the same as mQueue.isEmpty()
          break;
        }

        if (polledOperation.getBatchNumber() > maxBatchNumber) {
          // Because the operation is already retrieved from the queue, there's no way of placing it
          // back as the head element, so we remember it manually here
          mPeekedOperation = polledOperation;
          break;
        }
        operations.add(polledOperation);
      }

      return operations;
    }
  }

  @NonNull private final GuardedFrameCallback mAnimatedFrameCallback;
  private final ReactChoreographer mReactChoreographer;

  @NonNull private final ConcurrentOperationQueue mOperations = new ConcurrentOperationQueue();
  @NonNull private final ConcurrentOperationQueue mPreOperations = new ConcurrentOperationQueue();

  private final AtomicReference<NativeAnimatedNodesManager> mNodesManager = new AtomicReference<>();

  private boolean mBatchingControlledByJS = false; // TODO T71377544: delete
  private volatile long mCurrentFrameNumber; // TODO T71377544: delete
  private volatile long mCurrentBatchNumber;

  private boolean mInitializedForFabric = false;
  private boolean mInitializedForNonFabric = false;
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

    if (reactApplicationContext != null) {
      reactApplicationContext.addLifecycleEventListener(this);
    }
  }

  @Override
  public void onHostResume() {
    enqueueFrameCallback();
  }

  private void addOperation(UIThreadOperation operation) {
    operation.setBatchNumber(mCurrentBatchNumber);
    mOperations.add(operation);
  }

  private void addUnbatchedOperation(UIThreadOperation operation) {
    operation.setBatchNumber(-1);
    mOperations.add(operation);
  }

  private void addPreOperation(UIThreadOperation operation) {
    operation.setBatchNumber(mCurrentBatchNumber);
    mPreOperations.add(operation);
  }

  // For FabricUIManager only
  @Override
  public void didScheduleMountItems(UIManager uiManager) {
    mCurrentFrameNumber++;
  }

  // For FabricUIManager only
  @Override
  @UiThread
  public void didDispatchMountItems(UIManager uiManager) {
    if (mUIManagerType != UIManagerType.FABRIC) {
      return;
    }

    long batchNumber = mCurrentBatchNumber - 1;

    // TODO T71377544: delete this when the JS method is confirmed safe
    if (!mBatchingControlledByJS) {
      // The problem we're trying to solve here: we could be in the middle of queueing
      // a batch of related animation operations when Fabric flushes a batch of MountItems.
      // It's visually bad if we execute half of the animation ops and then wait another frame
      // (or more) to execute the rest.
      // See mFrameNumber. If the dispatchedFrameNumber drifts too far - that
      // is, if no MountItems are scheduled for a while, which can happen if a tree
      // is committed but there are no changes - bring these counts back in sync and
      // execute any queued operations. This number is arbitrary, but we want it low
      // enough that the user shouldn't be able to see this delay in most cases.
      mCurrentFrameNumber++;
      if ((mCurrentFrameNumber - mCurrentBatchNumber) > 2) {
        mCurrentBatchNumber = mCurrentFrameNumber;
        batchNumber = mCurrentBatchNumber;
      }
    }

    mPreOperations.executeBatch(batchNumber, getNodesManager());
    mOperations.executeBatch(batchNumber, getNodesManager());
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

    final long frameNo = mCurrentBatchNumber++;

    UIBlock preOperationsUIBlock =
        new UIBlock() {
          @Override
          public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
            mPreOperations.executeBatch(frameNo, getNodesManager());
          }
        };

    UIBlock operationsUIBlock =
        new UIBlock() {
          @Override
          public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
            mOperations.executeBatch(frameNo, getNodesManager());
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
  public NativeAnimatedNodesManager getNodesManager() {
    if (mNodesManager.get() == null) {
      ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

      if (reactApplicationContext != null) {
        mNodesManager.compareAndSet(null, new NativeAnimatedNodesManager(reactApplicationContext));
      }
    }

    return mNodesManager.get();
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
    mNodesManager.set(nodesManager);
  }

  /**
   * Given a viewTag, detect if we're running in Fabric or non-Fabric and attach an event listener
   * to the correct UIManager, if necessary. This is expected to only be called from the native
   * module thread, and not concurrently.
   *
   * @param viewTag
   */
  private void initializeLifecycleEventListenersForViewTag(final int viewTag) {
    mUIManagerType = ViewUtil.getUIManagerType(viewTag);
    if (mUIManagerType == UIManagerType.FABRIC) {
      mNumFabricAnimations++;
    } else {
      mNumNonFabricAnimations++;
    }

    NativeAnimatedNodesManager nodesManager = getNodesManager();
    if (nodesManager != null) {
      nodesManager.initializeEventListenerForUIManagerType(mUIManagerType);
    } else {
      ReactSoftExceptionLogger.logSoftException(
          NAME,
          new RuntimeException(
              "initializeLifecycleEventListenersForViewTag could not get NativeAnimatedNodesManager"));
    }

    // Subscribe to UIManager (Fabric or non-Fabric) lifecycle events if we haven't yet
    if (mUIManagerType == UIManagerType.FABRIC ? mInitializedForFabric : mInitializedForNonFabric) {
      return;
    }

    ReactApplicationContext reactApplicationContext = getReactApplicationContext();
    if (reactApplicationContext != null) {
      @Nullable
      UIManager uiManager = UIManagerHelper.getUIManager(reactApplicationContext, mUIManagerType);
      if (uiManager != null) {
        uiManager.addUIManagerEventListener(this);
        if (mUIManagerType == UIManagerType.FABRIC) {
          mInitializedForFabric = true;
        } else {
          mInitializedForNonFabric = true;
        }
      }
    }
  }

  /**
   * Given a viewTag and the knowledge that a "disconnect" or "stop"-type imperative command is
   * being executed, decrement the number of inflight animations and possibly switch UIManager
   * modes.
   *
   * @param viewTag
   */
  private void decrementInFlightAnimationsForViewTag(final int viewTag) {
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
  }

  @Override
  public void startOperationBatch() {
    mBatchingControlledByJS = true;
    mCurrentBatchNumber++;
  }

  @Override
  public void finishOperationBatch() {
    mBatchingControlledByJS = true;
    mCurrentBatchNumber++;
  }

  @Override
  public void createAnimatedNode(final double tagDouble, final ReadableMap config) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME, "queue createAnimatedNode: " + tag + " config: " + config.toHashMap().toString());
    }

    addOperation(
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
  public void updateAnimatedNodeConfig(final double tagDouble, final ReadableMap config) {
    final int tag = (int) tagDouble;
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          "queue updateAnimatedNodeConfig: " + tag + " config: " + config.toHashMap().toString());
    }

    addOperation(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute updateAnimatedNodeConfig: "
                      + tag
                      + " config: "
                      + config.toHashMap().toString());
            }
            animatedNodesManager.updateAnimatedNodeConfig(tag, config);
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

    addOperation(
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

    addOperation(
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

    addOperation(
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

    addOperation(
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

    addOperation(
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

    addOperation(
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

    addOperation(
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

    addUnbatchedOperation(
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

    addOperation(
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

    addOperation(
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

    addOperation(
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

    initializeLifecycleEventListenersForViewTag(viewTag);

    addOperation(
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
          "queue disconnectAnimatedNodeFromView: " + animatedNodeTag + " viewTag: " + viewTag);
    }

    decrementInFlightAnimationsForViewTag(viewTag);

    addOperation(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute disconnectAnimatedNodeFromView: "
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
      FLog.d(NAME, "queue restoreDefaultValues: " + animatedNodeTag);
    }

    addPreOperation(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute restoreDefaultValues: " + animatedNodeTag);
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

    initializeLifecycleEventListenersForViewTag(viewTag);

    addOperation(
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
          "queue removeAnimatedEventFromView: viewTag: "
              + viewTag
              + " eventName: "
              + eventName
              + " animatedValueTag: "
              + animatedValueTag);
    }

    decrementInFlightAnimationsForViewTag(viewTag);

    addOperation(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  "execute removeAnimatedEventFromView: viewTag: "
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

  @Override
  public void getValue(final double animatedValueNodeTagDouble, final Callback callback) {
    final int animatedValueNodeTag = (int) animatedValueNodeTagDouble;
    addOperation(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            animatedNodesManager.getValue(animatedValueNodeTag, callback);
          }
        });
  }

  @Override
  public void invalidate() {
    ReactApplicationContext context = getReactApplicationContextIfActiveOrWarn();
    if (context != null) {
      context.removeLifecycleEventListener(this);
    }
  }

  /**
   * This is a currently-experimental method that allows JS to queue and immediately execute many
   * instructions at once. Since we make 1 JNI/JSI call instead of N, this should significantly
   * improve performance.
   *
   * <p>The arguments operate as a byte buffer. All integer command IDs and any args are packed into
   * opsAndArgs.
   *
   * <p>For the getValue callback: since this is batched, we accumulate a list of all requested
   * values, in order, and call the callback once at the end (if present) with the list of requested
   * values.
   */
  @Override
  public void queueAndExecuteBatchedOperations(final ReadableArray opsAndArgs) {
    final int opBufferSize = opsAndArgs.size();

    if (ANIMATED_MODULE_DEBUG) {
      FLog.e(NAME, "queueAndExecuteBatchedOperations: opBufferSize: " + opBufferSize);
    }

    // This block of code is unfortunate and should be refactored - we just want to
    // extract the ViewTags in the ReadableArray to mark animations on views as being enabled.
    // We only do this for initializing animations on views - disabling animations on views
    // happens later, when the disconnect/stop operations are actually executed.
    for (int i = 0; i < opBufferSize; ) {
      BatchExecutionOpCodes command = BatchExecutionOpCodes.fromId(opsAndArgs.getInt(i++));
      switch (command) {
        case OP_CODE_GET_VALUE:
        case OP_START_LISTENING_TO_ANIMATED_NODE_VALUE:
        case OP_STOP_LISTENING_TO_ANIMATED_NODE_VALUE:
        case OP_CODE_STOP_ANIMATION:
        case OP_CODE_FLATTEN_ANIMATED_NODE_OFFSET:
        case OP_CODE_EXTRACT_ANIMATED_NODE_OFFSET:
        case OP_CODE_RESTORE_DEFAULT_VALUES:
        case OP_CODE_DROP_ANIMATED_NODE:
        case OP_CODE_ADD_LISTENER:
        case OP_CODE_REMOVE_LISTENERS:
          i++;
          break;
        case OP_CODE_CREATE_ANIMATED_NODE:
        case OP_CODE_UPDATE_ANIMATED_NODE_CONFIG:
        case OP_CODE_CONNECT_ANIMATED_NODES:
        case OP_CODE_DISCONNECT_ANIMATED_NODES:
        case OP_CODE_SET_ANIMATED_NODE_VALUE:
        case OP_CODE_SET_ANIMATED_NODE_OFFSET:
        case OP_CODE_DISCONNECT_ANIMATED_NODE_FROM_VIEW:
          i += 2;
          break;
        case OP_CODE_START_ANIMATING_NODE:
        case OP_CODE_REMOVE_ANIMATED_EVENT_FROM_VIEW:
          i += 3;
          break;
        case OP_CODE_CONNECT_ANIMATED_NODE_TO_VIEW:
          i++; // tag
          initializeLifecycleEventListenersForViewTag(opsAndArgs.getInt(i++)); // viewTag
          break;
        case OP_CODE_ADD_ANIMATED_EVENT_TO_VIEW:
          initializeLifecycleEventListenersForViewTag(opsAndArgs.getInt(i++)); // viewTag
          i++; // eventName
          i++; // eventMapping
          break;
        default:
          throw new IllegalArgumentException(
              "Batch animation execution op: fetching viewTag: unknown op code");
      }
    }

    // Batching happens inside this operation - so signal to the thread loop that
    // this operation should be executed as soon as possible, "unbatched" with other
    // UIThreadOperations
    startOperationBatch();
    addUnbatchedOperation(
        new UIThreadOperation() {
          @Override
          public void execute(NativeAnimatedNodesManager animatedNodesManager) {
            ReactApplicationContext reactApplicationContext =
                getReactApplicationContextIfActiveOrWarn();

            int viewTag = -1;
            for (int i = 0; i < opBufferSize; ) {
              BatchExecutionOpCodes command = BatchExecutionOpCodes.fromId(opsAndArgs.getInt(i++));

              switch (command) {
                case OP_CODE_CREATE_ANIMATED_NODE:
                  animatedNodesManager.createAnimatedNode(
                      opsAndArgs.getInt(i++), opsAndArgs.getMap(i++));
                  break;
                case OP_CODE_UPDATE_ANIMATED_NODE_CONFIG:
                  animatedNodesManager.updateAnimatedNodeConfig(
                      opsAndArgs.getInt(i++), opsAndArgs.getMap(i++));
                  break;
                case OP_CODE_GET_VALUE:
                  animatedNodesManager.getValue(opsAndArgs.getInt(i++), null);
                  break;
                case OP_START_LISTENING_TO_ANIMATED_NODE_VALUE:
                  final int tag = opsAndArgs.getInt(i++);
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
                  animatedNodesManager.startListeningToAnimatedNodeValue(tag, listener);
                  break;
                case OP_STOP_LISTENING_TO_ANIMATED_NODE_VALUE:
                  animatedNodesManager.stopListeningToAnimatedNodeValue(opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_CONNECT_ANIMATED_NODES:
                  animatedNodesManager.connectAnimatedNodes(
                      opsAndArgs.getInt(i++), opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_DISCONNECT_ANIMATED_NODES:
                  animatedNodesManager.disconnectAnimatedNodes(
                      opsAndArgs.getInt(i++), opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_START_ANIMATING_NODE:
                  animatedNodesManager.startAnimatingNode(
                      opsAndArgs.getInt(i++), opsAndArgs.getInt(i++), opsAndArgs.getMap(i++), null);
                  break;
                case OP_CODE_STOP_ANIMATION:
                  animatedNodesManager.stopAnimation(opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_SET_ANIMATED_NODE_VALUE:
                  animatedNodesManager.setAnimatedNodeValue(
                      opsAndArgs.getInt(i++), opsAndArgs.getDouble(i++));
                  break;
                case OP_CODE_SET_ANIMATED_NODE_OFFSET:
                  animatedNodesManager.setAnimatedNodeValue(
                      opsAndArgs.getInt(i++), opsAndArgs.getDouble(i++));
                  break;
                case OP_CODE_FLATTEN_ANIMATED_NODE_OFFSET:
                  animatedNodesManager.flattenAnimatedNodeOffset(opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_EXTRACT_ANIMATED_NODE_OFFSET:
                  animatedNodesManager.extractAnimatedNodeOffset(opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_CONNECT_ANIMATED_NODE_TO_VIEW:
                  animatedNodesManager.connectAnimatedNodeToView(
                      opsAndArgs.getInt(i++), opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_DISCONNECT_ANIMATED_NODE_FROM_VIEW:
                  int animatedNodeTag = opsAndArgs.getInt(i++);
                  viewTag = opsAndArgs.getInt(i++);
                  decrementInFlightAnimationsForViewTag(viewTag);
                  animatedNodesManager.disconnectAnimatedNodeFromView(animatedNodeTag, viewTag);
                  break;
                case OP_CODE_RESTORE_DEFAULT_VALUES:
                  animatedNodesManager.restoreDefaultValues(opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_DROP_ANIMATED_NODE:
                  animatedNodesManager.dropAnimatedNode(opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_ADD_ANIMATED_EVENT_TO_VIEW:
                  animatedNodesManager.addAnimatedEventToView(
                      opsAndArgs.getInt(i++), opsAndArgs.getString(i++), opsAndArgs.getMap(i++));
                  break;
                case OP_CODE_REMOVE_ANIMATED_EVENT_FROM_VIEW:
                  viewTag = opsAndArgs.getInt(i++);
                  decrementInFlightAnimationsForViewTag(viewTag);
                  animatedNodesManager.removeAnimatedEventFromView(
                      viewTag, opsAndArgs.getString(i++), opsAndArgs.getInt(i++));
                  break;
                case OP_CODE_ADD_LISTENER:
                case OP_CODE_REMOVE_LISTENERS:
                  i++;
                  // ios only, do nothing on android besides incrementing the arg counter
                  break;
                default:
                  throw new IllegalArgumentException(
                      "Batch animation execution op: unknown op code");
              }
            }
          }
        });
    finishOperationBatch();
  }
}
