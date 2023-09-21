/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting;

import static com.facebook.infer.annotation.ThreadConfined.ANY;
import static com.facebook.infer.annotation.ThreadConfined.UI;
import static com.facebook.react.fabric.FabricUIManager.ENABLE_FABRIC_LOGS;
import static com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT;

import android.os.SystemClock;
import android.view.View;
import androidx.annotation.AnyThread;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.ReactIgnorableMountingException;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

public class MountItemDispatcher {

  private static final String TAG = "MountItemDispatcher";
  private static final int FRAME_TIME_MS = 16;
  private static final int MAX_TIME_IN_FRAME_FOR_NON_BATCHED_OPERATIONS_MS = 8;

  private final MountingManager mMountingManager;
  private final ItemDispatchListener mItemDispatchListener;

  @NonNull
  private final ConcurrentLinkedQueue<DispatchCommandMountItem> mViewCommandMountItems =
      new ConcurrentLinkedQueue<>();

  @NonNull
  private final ConcurrentLinkedQueue<MountItem> mMountItems = new ConcurrentLinkedQueue<>();

  @NonNull
  private final ConcurrentLinkedQueue<MountItem> mPreMountItems = new ConcurrentLinkedQueue<>();

  private boolean mInDispatch = false;
  private int mReDispatchCounter = 0;
  private long mBatchedExecutionTime = 0L;
  private long mRunStartTime = 0L;

  public MountItemDispatcher(MountingManager mountingManager, ItemDispatchListener listener) {
    mMountingManager = mountingManager;
    mItemDispatchListener = listener;
  }

  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommandMountItem(DispatchCommandMountItem command) {
    addViewCommandMountItem(command);
  }

  public void addMountItem(MountItem mountItem) {
    mMountItems.add(mountItem);
  }

  public void addPreAllocateMountItem(MountItem mountItem) {
    // We do this check only for PreAllocateViewMountItem - and not DispatchMountItem or regular
    // MountItem - because PreAllocateViewMountItems are not batched, and is relatively more
    // expensive
    // both to queue, to drain, and to execute.
    if (!mMountingManager.surfaceIsStopped(mountItem.getSurfaceId())) {
      mPreMountItems.add(mountItem);
    } else if (IS_DEVELOPMENT_ENVIRONMENT) {
      FLog.e(
          TAG,
          "Not queueing PreAllocateMountItem: surfaceId stopped: [%d] - %s",
          mountItem.getSurfaceId(),
          mountItem.toString());
    }
  }

  public void addViewCommandMountItem(DispatchCommandMountItem mountItem) {
    mViewCommandMountItems.add(mountItem);
  }

  /**
   * Try to dispatch MountItems. Returns true if any items were dispatched, false otherwise. A
   * `false` return value doesn't indicate errors, it may just indicate there was no work to be
   * done.
   *
   * @return
   */
  @UiThread
  @ThreadConfined(UI)
  public boolean tryDispatchMountItems() {
    // If we're already dispatching, don't reenter.
    // Reentrance can potentially happen a lot on Android in Fabric because
    // `updateState` from the
    // mounting layer causes mount items to be dispatched synchronously. We want to 1) make sure
    // we don't reenter in those cases, but 2) still execute those queued instructions
    // synchronously.
    // This is a pretty blunt tool, but we might not have better options since we really don't want
    // to execute anything out-of-order.
    if (mInDispatch) {
      return false;
    }

    final boolean didDispatchItems;
    try {
      didDispatchItems = dispatchMountItems();
    } catch (Throwable e) {
      mReDispatchCounter = 0;
      throw e;
    } finally {
      // Clean up after running dispatchMountItems - even if an exception was thrown
      mInDispatch = false;
    }

    // We call didDispatchMountItems regardless of whether we actually dispatched anything, since
    // NativeAnimatedModule relies on this for executing any animations that may have been scheduled
    mItemDispatchListener.didDispatchMountItems();

    // Decide if we want to try reentering
    if (mReDispatchCounter < 10 && didDispatchItems) {
      // Executing twice in a row is normal. Only log after that point.
      if (mReDispatchCounter > 2) {
        ReactSoftExceptionLogger.logSoftException(
            TAG,
            new ReactNoCrashSoftException(
                "Re-dispatched "
                    + mReDispatchCounter
                    + " times. This indicates setState (?) is likely being called too many times during mounting."));
      }

      mReDispatchCounter++;
      tryDispatchMountItems();
    }
    mReDispatchCounter = 0;
    return didDispatchItems;
  }

  @UiThread
  @ThreadConfined(UI)
  public void dispatchMountItems(Queue<MountItem> mountItems) {
    while (!mountItems.isEmpty()) {
      MountItem item = mountItems.poll();
      try {
        item.execute(mMountingManager);
      } catch (RetryableMountingLayerException e) {
        if (item instanceof DispatchCommandMountItem) {
          // Only DispatchCommandMountItem supports retries
          DispatchCommandMountItem mountItem = (DispatchCommandMountItem) item;
          // Retrying exactly once
          if (mountItem.getRetries() == 0) {
            mountItem.incrementRetries();
            // In case we haven't retried executing this item yet, execute in the next batch of
            // items
            dispatchCommandMountItem(mountItem);
          }
        } else {
          printMountItem(
              item, "dispatchExternalMountItems: mounting failed with " + e.getMessage());
        }
      }
    }
  }

  @UiThread
  @ThreadConfined(UI)
  /** Nothing should call this directly except for `tryDispatchMountItems`. */
  private boolean dispatchMountItems() {
    if (mReDispatchCounter == 0) {
      mBatchedExecutionTime = 0;
    }

    mRunStartTime = SystemClock.uptimeMillis();

    List<DispatchCommandMountItem> viewCommandMountItemsToDispatch =
        getAndResetViewCommandMountItems();
    List<MountItem> mountItemsToDispatch = getAndResetMountItems();

    if (mountItemsToDispatch == null && viewCommandMountItemsToDispatch == null) {
      return false;
    }

    mItemDispatchListener.willMountItems(mountItemsToDispatch);

    // As an optimization, execute all ViewCommands first
    // This should be:
    // 1) Performant: ViewCommands are often a replacement for SetNativeProps, which we've always
    // wanted to be as "synchronous" as possible.
    // 2) Safer: ViewCommands are inherently disconnected from the tree commit/diff/mount process.
    // JS imperatively queues these commands.
    //    If JS has queued a command, it's reasonable to assume that the more time passes, the more
    // likely it is that the view disappears.
    //    Thus, by executing ViewCommands early, we should actually avoid a category of
    // errors/glitches.
    if (viewCommandMountItemsToDispatch != null) {
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "FabricUIManager::mountViews viewCommandMountItems");
      for (DispatchCommandMountItem command : viewCommandMountItemsToDispatch) {
        if (ENABLE_FABRIC_LOGS) {
          printMountItem(command, "dispatchMountItems: Executing viewCommandMountItem");
        }
        try {
          executeOrEnqueue(command);
        } catch (RetryableMountingLayerException e) {
          // If the exception is marked as Retryable, we retry the viewcommand exactly once, after
          // the current batch of mount items has finished executing.
          if (command.getRetries() == 0) {
            command.incrementRetries();
            dispatchCommandMountItem(command);
          } else {
            // It's very common for commands to be executed on views that no longer exist - for
            // example, a blur event on TextInput being fired because of a navigation event away
            // from the current screen. If the exception is marked as Retryable, we log a soft
            // exception but never crash in debug.
            // It's not clear that logging this is even useful, because these events are very
            // common, mundane, and there's not much we can do about them currently.
            ReactSoftExceptionLogger.logSoftException(
                TAG,
                new ReactNoCrashSoftException(
                    "Caught exception executing ViewCommand: " + command.toString(), e));
          }
        } catch (Throwable e) {
          // Non-Retryable exceptions are logged as soft exceptions in prod, but crash in Debug.
          ReactSoftExceptionLogger.logSoftException(
              TAG,
              new RuntimeException(
                  "Caught exception executing ViewCommand: " + command.toString(), e));
        }
      }

      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }

    // If there are MountItems to dispatch, we make sure all the "pre mount items" are executed
    // first
    Collection<MountItem> preMountItemsToDispatch = getAndResetPreMountItems();

    if (preMountItemsToDispatch != null) {
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManager::mountViews preMountItems");

      for (MountItem preMountItem : preMountItemsToDispatch) {
        executeOrEnqueue(preMountItem);
      }

      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }

    if (mountItemsToDispatch != null) {
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "FabricUIManager::mountViews mountItems to execute");

      long batchedExecutionStartTime = SystemClock.uptimeMillis();

      for (MountItem mountItem : mountItemsToDispatch) {
        if (ENABLE_FABRIC_LOGS) {
          printMountItem(mountItem, "dispatchMountItems: Executing mountItem");
        }

        try {
          executeOrEnqueue(mountItem);
        } catch (Throwable e) {
          // If there's an exception, we want to log diagnostics in prod and rethrow.
          FLog.e(TAG, "dispatchMountItems: caught exception, displaying mount state", e);
          for (MountItem m : mountItemsToDispatch) {
            if (m == mountItem) {
              // We want to mark the mount item that caused exception
              FLog.e(TAG, "dispatchMountItems: mountItem: next mountItem triggered exception!");
            }
            printMountItem(m, "dispatchMountItems: mountItem");
          }
          if (mountItem.getSurfaceId() != View.NO_ID) {
            SurfaceMountingManager surfaceManager =
                mMountingManager.getSurfaceManager(mountItem.getSurfaceId());
            if (surfaceManager != null) {
              surfaceManager.printSurfaceState();
            }
          }

          if (ReactIgnorableMountingException.isIgnorable(e)) {
            ReactSoftExceptionLogger.logSoftException(TAG, e);
          } else {
            throw e;
          }
        }
      }
      mBatchedExecutionTime += SystemClock.uptimeMillis() - batchedExecutionStartTime;
    }

    mItemDispatchListener.didMountItems(mountItemsToDispatch);

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    return true;
  }

  @UiThread
  @ThreadConfined(UI)
  public void dispatchPreMountItems(long frameTimeNanos) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManager::premountViews");

    // dispatchPreMountItems cannot be reentrant, but we want to prevent dispatchMountItems from
    // reentering during dispatchPreMountItems
    mInDispatch = true;

    try {
      while (true) {
        if (haveExceededNonBatchedFrameTime(frameTimeNanos)) {
          break;
        }

        MountItem preMountItemToDispatch = mPreMountItems.poll();
        // If list is empty, `poll` will return null, or var will never be set
        if (preMountItemToDispatch == null) {
          break;
        }

        if (ENABLE_FABRIC_LOGS) {
          printMountItem(
              preMountItemToDispatch,
              "dispatchPreMountItems: Dispatching PreAllocateViewMountItem");
        }

        executeOrEnqueue(preMountItemToDispatch);
      }
    } finally {
      mInDispatch = false;
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  private void executeOrEnqueue(MountItem item) {
    if (mMountingManager.isWaitingForViewAttach(item.getSurfaceId())) {
      if (ENABLE_FABRIC_LOGS) {
        FLog.e(
            TAG,
            "executeOrEnqueue: Item execution delayed, surface %s is not ready yet",
            item.getSurfaceId());
      }
      SurfaceMountingManager surfaceMountingManager =
          mMountingManager.getSurfaceManager(item.getSurfaceId());
      surfaceMountingManager.executeOnViewAttach(item);
    } else {
      item.execute(mMountingManager);
    }
  }

  @Nullable
  private static <E extends MountItem> List<E> drainConcurrentItemQueue(
      ConcurrentLinkedQueue<E> queue) {
    if (queue.isEmpty()) {
      return null;
    }
    List<E> result = new ArrayList<>();
    do {
      E item = queue.poll();
      if (item != null) {
        result.add(item);
      }
    } while (!queue.isEmpty());
    if (result.size() == 0) {
      return null;
    }
    return result;
  }

  /** Detect if we still have processing time left in this frame. */
  private static boolean haveExceededNonBatchedFrameTime(long frameTimeNanos) {
    long timeLeftInFrame = FRAME_TIME_MS - ((System.nanoTime() - frameTimeNanos) / 1000000);
    return timeLeftInFrame < MAX_TIME_IN_FRAME_FOR_NON_BATCHED_OPERATIONS_MS;
  }

  @UiThread
  @ThreadConfined(UI)
  private List<DispatchCommandMountItem> getAndResetViewCommandMountItems() {
    return drainConcurrentItemQueue(mViewCommandMountItems);
  }

  @UiThread
  @ThreadConfined(UI)
  private List<MountItem> getAndResetMountItems() {
    return drainConcurrentItemQueue(mMountItems);
  }

  private Collection<MountItem> getAndResetPreMountItems() {
    return drainConcurrentItemQueue(mPreMountItems);
  }

  public long getBatchedExecutionTime() {
    return mBatchedExecutionTime;
  }

  public long getRunStartTime() {
    return mRunStartTime;
  }

  private static void printMountItem(MountItem mountItem, String prefix) {
    // If a MountItem description is split across multiple lines, it's because it's a
    // compound MountItem. Log each line separately.
    String[] mountItemLines = mountItem.toString().split("\n");
    for (String m : mountItemLines) {
      FLog.e(TAG, prefix + ": " + m);
    }
  }

  public interface ItemDispatchListener {
    void willMountItems(List<MountItem> mountItems);

    void didMountItems(List<MountItem> mountItems);

    void didDispatchMountItems();
  }
}
