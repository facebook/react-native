/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting;

import static com.facebook.infer.annotation.ThreadConfined.UI;
import static com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT;

import android.os.SystemClock;
import android.view.View;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.ReactIgnorableMountingException;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class MountItemDispatcher {

  private static final String TAG = "MountItemDispatcher";

  private static final long FRAME_TIME_NS = 1_000_000_000 / 60;

  private final MountingManager mMountingManager;
  private final ItemDispatchListener mItemDispatchListener;

  private final ConcurrentLinkedQueue<DispatchCommandMountItem> mViewCommandMountItems =
      new ConcurrentLinkedQueue<>();

  private final ConcurrentLinkedQueue<MountItem> mMountItems = new ConcurrentLinkedQueue<>();

  private final ConcurrentLinkedQueue<MountItem> mPreMountItems = new ConcurrentLinkedQueue<>();

  private boolean mInDispatch = false;
  private long mBatchedExecutionTime = 0L;
  private long mRunStartTime = 0L;

  private long mLastFrameTimeNanos = 0L;

  public MountItemDispatcher(MountingManager mountingManager, ItemDispatchListener listener) {
    mMountingManager = mountingManager;
    mItemDispatchListener = listener;
  }

  public void addViewCommandMountItem(DispatchCommandMountItem mountItem) {
    mViewCommandMountItems.add(mountItem);
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

  /**
   * Try to dispatch MountItems. In case of the exception, we will retry 10 times before giving up.
   */
  @UiThread
  @ThreadConfined(UI)
  public void tryDispatchMountItems() {
    // If we're already dispatching, don't reenter.
    // Reentrance can potentially happen a lot on Android in Fabric because
    // `updateState` from the
    // mounting layer causes mount items to be dispatched synchronously. We want to 1) make sure
    // we don't reenter in those cases, but 2) still execute those queued instructions
    // synchronously.
    // This is a pretty blunt tool, but we might not have better options since we really don't want
    // to execute anything out-of-order.
    if (mInDispatch) {
      return;
    }

    mInDispatch = true;

    try {
      dispatchMountItems();
    } finally {
      // Clean up after running dispatchMountItems - even if an exception was thrown
      mInDispatch = false;
    }

    // We call didDispatchMountItems regardless of whether we actually dispatched anything, since
    // NativeAnimatedModule relies on this for executing any animations that may have been
    // scheduled
    mItemDispatchListener.didDispatchMountItems();
  }

  @UiThread
  @ThreadConfined(UI)
  public void dispatchMountItems(Queue<MountItem> mountItems) {
    while (!mountItems.isEmpty()) {
      MountItem item = mountItems.poll();
      Assertions.assertNotNull(item);
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
            addViewCommandMountItem(mountItem);
          }
        } else {
          printMountItem(
              item, "dispatchExternalMountItems: mounting failed with " + e.getMessage());
        }
      }
    }
  }

  /*
   * Executes view commands, pre mount items and mount items in the respective order:
   * 1. View commands.
   * 2. Pre mount items.
   * 3. Regular mount items.
   *
   * Does nothing if `viewCommandMountItemsToDispatch` and `mountItemsToDispatch` are empty.
   * Nothing should call this directly except for `tryDispatchMountItems`.
   */
  @UiThread
  @ThreadConfined(UI)
  private void dispatchMountItems() {
    mBatchedExecutionTime = 0;

    mRunStartTime = SystemClock.uptimeMillis();

    List<DispatchCommandMountItem> viewCommandMountItemsToDispatch =
        getAndResetViewCommandMountItems();
    List<MountItem> mountItemsToDispatch = getAndResetMountItems();

    if (mountItemsToDispatch == null && viewCommandMountItemsToDispatch == null) {
      return;
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
          Systrace.TRACE_TAG_REACT, "MountItemDispatcher::mountViews viewCommandMountItems");
      for (DispatchCommandMountItem command : viewCommandMountItemsToDispatch) {
        if (ReactNativeFeatureFlags.enableFabricLogs()) {
          printMountItem(command, "dispatchMountItems: Executing viewCommandMountItem");
        }
        try {
          executeOrEnqueue(command);
        } catch (RetryableMountingLayerException e) {
          // If the exception is marked as Retryable, we retry the viewcommand exactly once, after
          // the current batch of mount items has finished executing.
          if (command.getRetries() == 0) {
            command.incrementRetries();
            addViewCommandMountItem(command);
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

      Systrace.endSection(Systrace.TRACE_TAG_REACT);
    }

    // If there are MountItems to dispatch, we make sure all the "pre mount items" are executed
    // first
    List<MountItem> preMountItemsToDispatch = getAndResetPreMountItems();
    if (preMountItemsToDispatch != null) {
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT, "MountItemDispatcher::mountViews preMountItems");
      for (MountItem preMountItem : preMountItemsToDispatch) {
        if (ReactNativeFeatureFlags.enableFabricLogs()) {
          printMountItem(preMountItem, "dispatchMountItems: Executing preMountItem");
        }
        executeOrEnqueue(preMountItem);
      }

      Systrace.endSection(Systrace.TRACE_TAG_REACT);
    }

    if (mountItemsToDispatch != null) {
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT, "MountItemDispatcher::mountViews mountItems to execute");

      long batchedExecutionStartTime = SystemClock.uptimeMillis();

      for (MountItem mountItem : mountItemsToDispatch) {
        if (ReactNativeFeatureFlags.enableFabricLogs()) {
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

      Systrace.endSection(Systrace.TRACE_TAG_REACT);
    }

    mItemDispatchListener.didMountItems(mountItemsToDispatch);
  }

  /*
   * Executes pre mount items. Pre mount items are operations that can be executed before the mount items come. For example view preallocation.
   * This is a performance optimisation to do as much work ahead of time as possible.
   *
   * `tryDispatchMountItems` will also execute pre mount items, but only if there are mount items to be executed.
   */
  @UiThread
  @ThreadConfined(UI)
  public void dispatchPreMountItems(long frameTimeNanos) {
    mLastFrameTimeNanos = frameTimeNanos;

    if (mPreMountItems.isEmpty()) {
      // Avoid starting systrace if there are no pre mount items.
      return;
    }

    long deadline = mLastFrameTimeNanos + FRAME_TIME_NS / 2;
    dispatchPreMountItemsImpl(deadline);
  }

  private void dispatchPreMountItemsImpl(long deadline) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "MountItemDispatcher::premountViews");

    // dispatchPreMountItems cannot be reentrant, but we want to prevent dispatchMountItems from
    // reentering during dispatchPreMountItems
    mInDispatch = true;

    try {
      while (true) {
        if (System.nanoTime() > deadline) {
          break;
        }

        MountItem preMountItemToDispatch = mPreMountItems.poll();
        // If list is empty, `poll` will return null, or var will never be set
        if (preMountItemToDispatch == null) {
          break;
        }

        if (ReactNativeFeatureFlags.enableFabricLogs()) {
          printMountItem(preMountItemToDispatch, "dispatchPreMountItems");
        }
        executeOrEnqueue(preMountItemToDispatch);
      }
    } finally {
      mInDispatch = false;
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT);
  }

  private void executeOrEnqueue(MountItem item) {
    if (mMountingManager.isWaitingForViewAttach(item.getSurfaceId())) {
      if (ReactNativeFeatureFlags.enableFabricLogs()) {
        FLog.e(
            TAG,
            "executeOrEnqueue: Item execution delayed, surface %s is not ready yet",
            item.getSurfaceId());
      }
      SurfaceMountingManager surfaceMountingManager =
          mMountingManager.getSurfaceManagerEnforced(
              item.getSurfaceId(), "MountItemDispatcher::executeOrEnqueue");
      surfaceMountingManager.scheduleMountItemOnViewAttach(item);
    } else {
      item.execute(mMountingManager);
    }
  }

  private static <E> @Nullable List<E> drainConcurrentItemQueue(ConcurrentLinkedQueue<E> queue) {
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

  @UiThread
  @ThreadConfined(UI)
  private @Nullable List<DispatchCommandMountItem> getAndResetViewCommandMountItems() {
    return drainConcurrentItemQueue(mViewCommandMountItems);
  }

  @UiThread
  @ThreadConfined(UI)
  private @Nullable List<MountItem> getAndResetMountItems() {
    return drainConcurrentItemQueue(mMountItems);
  }

  @UiThread
  @ThreadConfined(UI)
  private @Nullable List<MountItem> getAndResetPreMountItems() {
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
    void willMountItems(@Nullable List<MountItem> mountItems);

    void didMountItems(@Nullable List<MountItem> mountItems);

    void didDispatchMountItems();
  }
}
