/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static com.facebook.infer.annotation.ThreadConfined.ANY;
import static com.facebook.infer.annotation.ThreadConfined.UI;
import static com.facebook.react.fabric.FabricComponents.getFabricComponentName;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getMaxSize;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getMinSize;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getYogaMeasureMode;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getYogaSize;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;

import android.annotation.SuppressLint;
import android.os.SystemClock;
import android.view.View;
import androidx.annotation.AnyThread;
import androidx.annotation.GuardedBy;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.mountitems.BatchMountItem;
import com.facebook.react.fabric.mounting.mountitems.CreateMountItem;
import com.facebook.react.fabric.mounting.mountitems.DeleteMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchIntCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchStringCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.InsertMountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.fabric.mounting.mountitems.PreAllocateViewMountItem;
import com.facebook.react.fabric.mounting.mountitems.RemoveDeleteMultiMountItem;
import com.facebook.react.fabric.mounting.mountitems.RemoveMountItem;
import com.facebook.react.fabric.mounting.mountitems.SendAccessibilityEvent;
import com.facebook.react.fabric.mounting.mountitems.UpdateEventEmitterMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateLayoutMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateLocalDataMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdatePaddingMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdatePropsMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateStateMountItem;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.ReactRoot;
import com.facebook.react.uimanager.ReactRootViewTagGenerator;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerPropertyUpdater;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@SuppressLint("MissingNativeLoadLibrary")
public class FabricUIManager implements UIManager, LifecycleEventListener {

  public static final String TAG = "FabricUIManager";
  // The IS_DEVELOPMENT_ENVIRONMENT variable is used to log extra data when running fabric in a
  // development environment. DO NOT ENABLE THIS ON PRODUCTION OR YOU WILL BE FIRED!
  public static final boolean IS_DEVELOPMENT_ENVIRONMENT = false;
  public static final boolean ENABLE_FABRIC_LOGS =
      ReactFeatureFlags.enableFabricLogs
          || PrinterHolder.getPrinter()
              .shouldDisplayLogMessage(ReactDebugOverlayTags.FABRIC_UI_MANAGER);
  private static final int FRAME_TIME_MS = 16;
  private static final int MAX_TIME_IN_FRAME_FOR_NON_BATCHED_OPERATIONS_MS = 8;
  private static final int PRE_MOUNT_ITEMS_INITIAL_SIZE_ARRAY = 250;

  static {
    FabricSoLoader.staticInit();
  }

  @Nullable private Binding mBinding;
  @NonNull private final ReactApplicationContext mReactApplicationContext;
  @NonNull private final MountingManager mMountingManager;
  @NonNull private final EventDispatcher mEventDispatcher;

  @NonNull
  private final ConcurrentHashMap<Integer, ThemedReactContext> mReactContextForRootTag =
      new ConcurrentHashMap<>();

  @NonNull private final EventBeatManager mEventBeatManager;
  @NonNull private final Object mViewCommandMountItemsLock = new Object();
  @NonNull private final Object mMountItemsLock = new Object();
  @NonNull private final Object mPreMountItemsLock = new Object();

  private boolean mInDispatch = false;
  private int mReDispatchCounter = 0;

  @GuardedBy("mViewCommandMountItemsLock")
  @NonNull
  private List<DispatchCommandMountItem> mViewCommandMountItems = new ArrayList<>();

  @GuardedBy("mMountItemsLock")
  @NonNull
  private List<MountItem> mMountItems = new ArrayList<>();

  @GuardedBy("mPreMountItemsLock")
  @NonNull
  private ArrayDeque<MountItem> mPreMountItems =
      new ArrayDeque<>(PRE_MOUNT_ITEMS_INITIAL_SIZE_ARRAY);

  @ThreadConfined(UI)
  @NonNull
  private final DispatchUIFrameCallback mDispatchUIFrameCallback;

  /**
   * This is used to keep track of whether or not the FabricUIManager has been destroyed. Once the
   * Catalyst instance is being destroyed, we should cease all operation here.
   */
  private volatile boolean mDestroyed = false;

  private long mRunStartTime = 0l;
  private long mBatchedExecutionTime = 0l;
  private long mDispatchViewUpdatesTime = 0l;
  private long mCommitStartTime = 0l;
  private long mLayoutTime = 0l;
  private long mFinishTransactionTime = 0l;
  private long mFinishTransactionCPPTime = 0l;

  // C++ keeps track of commit numbers for telemetry purposes. We don't want to incur a JNI
  // round-trip cost just for this, so commits from C++ are numbered 0+ and synchronous commits
  // are 10k+. Since these are only used for perf tracking, it's unlikely for the number of commits
  // from C++ to exceed 9,999 and it should be obvious what's going on when analyzing performance.
  private int mCurrentSynchronousCommitNumber = 10000;

  public FabricUIManager(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagerRegistry,
      EventDispatcher eventDispatcher,
      EventBeatManager eventBeatManager) {
    mDispatchUIFrameCallback = new DispatchUIFrameCallback(reactContext);
    mReactApplicationContext = reactContext;
    mMountingManager = new MountingManager(viewManagerRegistry);
    mEventDispatcher = eventDispatcher;
    mEventBeatManager = eventBeatManager;
    mReactApplicationContext.addLifecycleEventListener(this);
  }

  // TODO (T47819352): Rename this to startSurface for consistency with xplat/iOS
  @Override
  @UiThread
  @ThreadConfined(UI)
  public <T extends View> int addRootView(
      final T rootView, final WritableMap initialProps, final @Nullable String initialUITemplate) {
    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    ReactRoot reactRootView = (ReactRoot) rootView;

    // TODO T31905686: Combine with startSurface below
    ThemedReactContext reactContext =
        new ThemedReactContext(
            mReactApplicationContext, rootView.getContext(), reactRootView.getSurfaceID());
    mMountingManager.addRootView(rootTag, rootView);
    String moduleName = reactRootView.getJSModuleName();
    mReactContextForRootTag.put(rootTag, reactContext);
    if (ENABLE_FABRIC_LOGS) {
      FLog.d(TAG, "Starting surface for module: %s and reactTag: %d", moduleName, rootTag);
    }
    mBinding.startSurface(rootTag, moduleName, (NativeMap) initialProps);
    if (initialUITemplate != null) {
      mBinding.renderTemplateToSurface(rootTag, initialUITemplate);
    }
    return rootTag;
  }

  @AnyThread
  @ThreadConfined(ANY)
  public <T extends View> int startSurface(
      final T rootView,
      final String moduleName,
      final WritableMap initialProps,
      int widthMeasureSpec,
      int heightMeasureSpec) {
    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    ThemedReactContext reactContext =
        new ThemedReactContext(mReactApplicationContext, rootView.getContext(), moduleName);
    if (ENABLE_FABRIC_LOGS) {
      FLog.d(TAG, "Starting surface for module: %s and reactTag: %d", moduleName, rootTag);
    }
    mMountingManager.addRootView(rootTag, rootView);
    mReactContextForRootTag.put(rootTag, reactContext);
    mBinding.startSurfaceWithConstraints(
        rootTag,
        moduleName,
        (NativeMap) initialProps,
        getMinSize(widthMeasureSpec),
        getMaxSize(widthMeasureSpec),
        getMinSize(heightMeasureSpec),
        getMaxSize(heightMeasureSpec),
        I18nUtil.getInstance().isRTL(rootView.getContext()),
        I18nUtil.getInstance().doLeftAndRightSwapInRTL(rootView.getContext()));
    return rootTag;
  }

  /** Method called when an event has been dispatched on the C++ side. */
  @DoNotStrip
  @SuppressWarnings("unused")
  public void onRequestEventBeat() {
    mEventDispatcher.dispatchAllEvents();
  }

  @AnyThread
  @ThreadConfined(ANY)
  public void stopSurface(int surfaceID) {
    mBinding.stopSurface(surfaceID);
  }

  @Override
  public void initialize() {
    mEventDispatcher.registerEventEmitter(FABRIC, new FabricEventEmitter(this));
    mEventDispatcher.addBatchEventDispatchedListener(mEventBeatManager);
  }

  // This is called on the JS thread (see CatalystInstanceImpl).
  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public void onCatalystInstanceDestroy() {
    FLog.i(TAG, "FabricUIManager.onCatalystInstanceDestroy");

    if (mDestroyed) {
      ReactSoftException.logSoftException(
          FabricUIManager.TAG, new IllegalStateException("Cannot double-destroy FabricUIManager"));
      return;
    }

    mDestroyed = true;

    // This is not technically thread-safe, since it's read on the UI thread and written
    // here on the JS thread. We've marked it as volatile so that this writes to UI-thread
    // memory immediately.
    mDispatchUIFrameCallback.stop();

    mEventDispatcher.removeBatchEventDispatchedListener(mEventBeatManager);
    mEventDispatcher.unregisterEventEmitter(FABRIC);

    // Remove lifecycle listeners (onHostResume, onHostPause) since the FabricUIManager is going
    // away. Then stop the mDispatchUIFrameCallback false will cause the choreographer
    // callbacks to stop firing.
    mReactApplicationContext.removeLifecycleEventListener(this);
    onHostPause();

    // This is not technically thread-safe, since it's read on the UI thread and written
    // here on the JS thread. We've marked it as volatile so that this writes to UI-thread
    // memory immediately.
    mDispatchUIFrameCallback.stop();

    mBinding.unregister();
    mBinding = null;

    ViewManagerPropertyUpdater.clear();
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private void preallocateView(
      int rootTag,
      int reactTag,
      final String componentName,
      @Nullable ReadableMap props,
      @Nullable Object stateWrapper,
      boolean isLayoutable) {
    ThemedReactContext context = mReactContextForRootTag.get(rootTag);
    String component = getFabricComponentName(componentName);
    synchronized (mPreMountItemsLock) {
      mPreMountItems.add(
          new PreAllocateViewMountItem(
              context,
              rootTag,
              reactTag,
              component,
              props,
              (StateWrapper) stateWrapper,
              isLayoutable));
    }
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem createMountItem(
      String componentName,
      @Nullable ReadableMap props,
      @Nullable Object stateWrapper,
      int reactRootTag,
      int reactTag,
      boolean isLayoutable) {
    String component = getFabricComponentName(componentName);
    ThemedReactContext reactContext = mReactContextForRootTag.get(reactRootTag);
    if (reactContext == null) {
      throw new IllegalArgumentException("Unable to find ReactContext for root: " + reactRootTag);
    }
    return new CreateMountItem(
        reactContext,
        reactRootTag,
        reactTag,
        component,
        props,
        (StateWrapper) stateWrapper,
        isLayoutable);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem removeMountItem(int reactTag, int parentReactTag, int index) {
    return new RemoveMountItem(reactTag, parentReactTag, index);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem insertMountItem(int reactTag, int parentReactTag, int index) {
    return new InsertMountItem(reactTag, parentReactTag, index);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem deleteMountItem(int reactTag) {
    return new DeleteMountItem(reactTag);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem removeDeleteMultiMountItem(int[] metadata) {
    return new RemoveDeleteMultiMountItem(metadata);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem updateLayoutMountItem(
      int reactTag, int x, int y, int width, int height, int layoutDirection) {
    return new UpdateLayoutMountItem(reactTag, x, y, width, height, layoutDirection);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem updatePaddingMountItem(int reactTag, int left, int top, int right, int bottom) {
    return new UpdatePaddingMountItem(reactTag, left, top, right, bottom);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem updatePropsMountItem(int reactTag, ReadableMap map) {
    return new UpdatePropsMountItem(reactTag, map);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem updateLocalDataMountItem(int reactTag, ReadableMap newLocalData) {
    return new UpdateLocalDataMountItem(reactTag, newLocalData);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem updateStateMountItem(int reactTag, @Nullable Object stateWrapper) {
    return new UpdateStateMountItem(reactTag, (StateWrapper) stateWrapper);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem updateEventEmitterMountItem(int reactTag, Object eventEmitter) {
    return new UpdateEventEmitterMountItem(reactTag, (EventEmitterWrapper) eventEmitter);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem createBatchMountItem(MountItem[] items, int size, int commitNumber) {
    return new BatchMountItem(items, size, commitNumber);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private long measure(
      int rootTag,
      String componentName,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float minWidth,
      float maxWidth,
      float minHeight,
      float maxHeight) {
    return measure(
        rootTag,
        componentName,
        localData,
        props,
        state,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
        null);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private long measure(
      int rootTag,
      String componentName,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float minWidth,
      float maxWidth,
      float minHeight,
      float maxHeight,
      @Nullable int[] attachmentsPositions) {
    ReactContext context =
        rootTag < 0 ? mReactApplicationContext : mReactContextForRootTag.get(rootTag);
    return mMountingManager.measure(
        context,
        componentName,
        localData,
        props,
        state,
        getYogaSize(minWidth, maxWidth),
        getYogaMeasureMode(minWidth, maxWidth),
        getYogaSize(minHeight, maxHeight),
        getYogaMeasureMode(minHeight, maxHeight),
        attachmentsPositions);
  }

  @Override
  @UiThread
  @ThreadConfined(UI)
  public void synchronouslyUpdateViewOnUIThread(int reactTag, @NonNull ReadableMap props) {
    UiThreadUtil.assertOnUiThread();
    long time = SystemClock.uptimeMillis();
    int commitNumber = mCurrentSynchronousCommitNumber++;
    try {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_START, null, commitNumber);
      if (ENABLE_FABRIC_LOGS) {
        FLog.d(TAG, "SynchronouslyUpdateViewOnUIThread for tag %d", reactTag);
      }
      scheduleMountItem(
          updatePropsMountItem(reactTag, props), commitNumber, time, 0, 0, 0, 0, 0, 0);
    } catch (Exception ex) {
      // TODO T42943890: Fix animations in Fabric and remove this try/catch
      ReactSoftException.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "Caught exception in synchronouslyUpdateViewOnUIThread", ex));
    } finally {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_END, null, commitNumber);
    }
  }

  /**
   * This method enqueues UI operations directly to the UI thread. This might change in the future
   * to enforce execution order using {@link ReactChoreographer#CallbackType}.
   */
  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private void scheduleMountItem(
      @NonNull final MountItem mountItem,
      int commitNumber,
      long commitStartTime,
      long diffStartTime,
      long diffEndTime,
      long layoutStartTime,
      long layoutEndTime,
      long finishTransactionStartTime,
      long finishTransactionEndTime) {
    // TODO T31905686: support multithreading
    // When Binding.cpp calls scheduleMountItems during a commit phase, it always calls with
    // a BatchMountItem. No other sites call into this with a BatchMountItem, and Binding.cpp only
    // calls scheduleMountItems with a BatchMountItem.
    boolean isBatchMountItem = mountItem instanceof BatchMountItem;

    if (isBatchMountItem) {
      mCommitStartTime = commitStartTime;
      mLayoutTime = layoutEndTime - layoutStartTime;
      mFinishTransactionCPPTime = finishTransactionEndTime - finishTransactionStartTime;
      mFinishTransactionTime = SystemClock.uptimeMillis() - finishTransactionStartTime;
      mDispatchViewUpdatesTime = SystemClock.uptimeMillis();
    }

    synchronized (mMountItemsLock) {
      mMountItems.add(mountItem);
    }

    if (UiThreadUtil.isOnUiThread()) {
      // We only read these flags on the UI thread.
      tryDispatchMountItems();
    }

    // Post markers outside of lock and after sync mounting finishes its execution
    if (isBatchMountItem) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_COMMIT_START, null, commitNumber, commitStartTime);
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_START,
          null,
          commitNumber,
          finishTransactionStartTime);
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_END,
          null,
          commitNumber,
          finishTransactionEndTime);
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_DIFF_START, null, commitNumber, diffStartTime);
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_DIFF_END, null, commitNumber, diffEndTime);
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_LAYOUT_START, null, commitNumber, layoutStartTime);
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_LAYOUT_END, null, commitNumber, layoutEndTime);
      ReactMarker.logFabricMarker(ReactMarkerConstants.FABRIC_COMMIT_END, null, commitNumber);
    }
  }

  @UiThread
  @ThreadConfined(UI)
  private void tryDispatchMountItems() {
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

    // Decide if we want to try reentering
    if (mReDispatchCounter < 10 && didDispatchItems) {
      // Executing twice in a row is normal. Only log after that point.
      if (mReDispatchCounter > 2) {
        ReactSoftException.logSoftException(
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
  }

  @UiThread
  @ThreadConfined(UI)
  private List<DispatchCommandMountItem> getAndResetViewCommandMountItems() {
    if (!ReactFeatureFlags.allowEarlyViewCommandExecution) {
      return null;
    }

    synchronized (mViewCommandMountItemsLock) {
      List<DispatchCommandMountItem> result = mViewCommandMountItems;
      if (result.isEmpty()) {
        return null;
      }
      mViewCommandMountItems = new ArrayList<>();
      return result;
    }
  }

  @UiThread
  @ThreadConfined(UI)
  private List<MountItem> getAndResetMountItems() {
    synchronized (mMountItemsLock) {
      List<MountItem> result = mMountItems;
      if (result.isEmpty()) {
        return null;
      }
      mMountItems = new ArrayList<>();
      return result;
    }
  }

  private ArrayDeque<MountItem> getAndResetPreMountItems() {
    synchronized (mPreMountItemsLock) {
      ArrayDeque<MountItem> result = mPreMountItems;
      if (result.isEmpty()) {
        return null;
      }
      mPreMountItems = new ArrayDeque<>(PRE_MOUNT_ITEMS_INITIAL_SIZE_ARRAY);
      return result;
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
          "FabricUIManager::mountViews viewCommandMountItems to execute: "
              + viewCommandMountItemsToDispatch.size());
      for (DispatchCommandMountItem command : viewCommandMountItemsToDispatch) {
        if (ENABLE_FABRIC_LOGS) {
          FLog.d(TAG, "dispatchMountItems: Executing viewCommandMountItem: " + command.toString());
        }
        try {
          command.execute(mMountingManager);
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
            ReactSoftException.logSoftException(
                TAG,
                new ReactNoCrashSoftException(
                    "Caught exception executing ViewCommand: " + command.toString(), e));
          }
        } catch (Throwable e) {
          // Non-Retryable exceptions are logged as soft exceptions in prod, but crash in Debug.
          ReactSoftException.logSoftException(
              TAG,
              new RuntimeException(
                  "Caught exception executing ViewCommand: " + command.toString(), e));
        }
      }

      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }

    // If there are MountItems to dispatch, we make sure all the "pre mount items" are executed
    // first
    ArrayDeque<MountItem> mPreMountItemsToDispatch = getAndResetPreMountItems();

    if (mPreMountItemsToDispatch != null) {
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "FabricUIManager::mountViews preMountItems to execute: "
              + mPreMountItemsToDispatch.size());

      while (!mPreMountItemsToDispatch.isEmpty()) {
        mPreMountItemsToDispatch.pollFirst().execute(mMountingManager);
      }

      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }

    if (mountItemsToDispatch != null) {
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "FabricUIManager::mountViews mountItems to execute: " + mountItemsToDispatch.size());

      long batchedExecutionStartTime = SystemClock.uptimeMillis();

      for (MountItem mountItem : mountItemsToDispatch) {
        if (ENABLE_FABRIC_LOGS) {
          // If a MountItem description is split across multiple lines, it's because it's a compound
          // MountItem. Log each line separately.
          String[] mountItemLines = mountItem.toString().split("\n");
          for (String m : mountItemLines) {
            FLog.d(TAG, "dispatchMountItems: Executing mountItem: " + m);
          }
        }
        mountItem.execute(mMountingManager);
      }
      mBatchedExecutionTime += SystemClock.uptimeMillis() - batchedExecutionStartTime;
    }
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    return true;
  }

  @UiThread
  @ThreadConfined(UI)
  private void dispatchPreMountItems(long frameTimeNanos) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManager::premountViews");

    // dispatchPreMountItems cannot be reentrant, but we want to prevent dispatchMountItems from
    // reentering during dispatchPreMountItems
    mInDispatch = true;

    try {
      while (true) {
        long timeLeftInFrame = FRAME_TIME_MS - ((System.nanoTime() - frameTimeNanos) / 1000000);
        if (timeLeftInFrame < MAX_TIME_IN_FRAME_FOR_NON_BATCHED_OPERATIONS_MS) {
          break;
        }

        MountItem preMountItemsToDispatch;
        synchronized (mPreMountItemsLock) {
          if (mPreMountItems.isEmpty()) {
            break;
          }
          preMountItemsToDispatch = mPreMountItems.pollFirst();
        }

        preMountItemsToDispatch.execute(mMountingManager);
      }
    } finally {
      mInDispatch = false;
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  public void setBinding(Binding binding) {
    mBinding = binding;
  }

  /**
   * Updates the layout metrics of the root view based on the Measure specs received by parameters.
   */
  @Override
  @UiThread
  @ThreadConfined(UI)
  public void updateRootLayoutSpecs(
      final int rootTag, final int widthMeasureSpec, final int heightMeasureSpec) {

    if (ENABLE_FABRIC_LOGS) {
      FLog.d(TAG, "Updating Root Layout Specs");
    }

    ThemedReactContext reactContext = mReactContextForRootTag.get(rootTag);
    boolean isRTL = false;
    boolean doLeftAndRightSwapInRTL = false;
    if (reactContext != null) {
      isRTL = I18nUtil.getInstance().isRTL(reactContext);
      doLeftAndRightSwapInRTL = I18nUtil.getInstance().doLeftAndRightSwapInRTL(reactContext);
    } else {
      // TODO T65116569: analyze why this happens
      ReactSoftException.logSoftException(
          TAG,
          new IllegalStateException(
              "updateRootLayoutSpecs called before ReactContext set for tag: " + rootTag));
    }

    mBinding.setConstraints(
        rootTag,
        getMinSize(widthMeasureSpec),
        getMaxSize(widthMeasureSpec),
        getMinSize(heightMeasureSpec),
        getMaxSize(heightMeasureSpec),
        isRTL,
        doLeftAndRightSwapInRTL);
  }

  public void receiveEvent(int reactTag, String eventName, @Nullable WritableMap params) {
    EventEmitterWrapper eventEmitter = mMountingManager.getEventEmitter(reactTag);
    if (eventEmitter == null) {
      // This can happen if the view has disappeared from the screen (because of async events)
      FLog.d(TAG, "Unable to invoke event: " + eventName + " for reactTag: " + reactTag);
      return;
    }

    eventEmitter.invoke(eventName, params);
  }

  @Override
  public void onHostResume() {
    ReactChoreographer.getInstance()
        .postFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
  }

  @Override
  @NonNull
  @SuppressWarnings("unchecked")
  public EventDispatcher getEventDispatcher() {
    return mEventDispatcher;
  }

  @Override
  public void onHostPause() {
    ReactChoreographer.getInstance()
        .removeFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
  }

  @Override
  public void onHostDestroy() {}

  @Deprecated
  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int reactTag, final int commandId, @Nullable final ReadableArray commandArgs) {
    dispatchCommandMountItem(new DispatchIntCommandMountItem(reactTag, commandId, commandArgs));
  }

  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int reactTag, final String commandId, @Nullable final ReadableArray commandArgs) {
    dispatchCommandMountItem(new DispatchStringCommandMountItem(reactTag, commandId, commandArgs));
  }

  @AnyThread
  @ThreadConfined(ANY)
  private void dispatchCommandMountItem(DispatchCommandMountItem command) {
    if (ReactFeatureFlags.allowEarlyViewCommandExecution) {
      synchronized (mViewCommandMountItemsLock) {
        mViewCommandMountItems.add(command);
      }
    } else {
      synchronized (mMountItemsLock) {
        mMountItems.add(command);
      }
    }
  }

  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public void sendAccessibilityEvent(int reactTag, int eventType) {
    synchronized (mMountItemsLock) {
      mMountItems.add(new SendAccessibilityEvent(reactTag, eventType));
    }
  }

  /**
   * Set the JS responder for the view associated with the tags received as a parameter.
   *
   * @param reactTag React tag of the first parent of the view that is NOT virtual
   * @param initialReactTag React tag of the JS view that initiated the touch operation
   * @param blockNativeResponder If native responder should be blocked or not
   */
  @DoNotStrip
  public void setJSResponder(
      final int reactTag, final int initialReactTag, final boolean blockNativeResponder) {
    synchronized (mMountItemsLock) {
      mMountItems.add(
          new MountItem() {
            @Override
            public void execute(MountingManager mountingManager) {
              mountingManager.setJSResponder(reactTag, initialReactTag, blockNativeResponder);
            }
          });
    }
  }

  /**
   * Clears the JS Responder specified by {@link #setJSResponder(int, int, boolean)}. After this
   * method is called, all the touch events are going to be handled by JS.
   */
  @DoNotStrip
  public void clearJSResponder() {
    synchronized (mMountItemsLock) {
      mMountItems.add(
          new MountItem() {
            @Override
            public void execute(MountingManager mountingManager) {
              mountingManager.clearJSResponder();
            }
          });
    }
  }

  @Override
  public void profileNextBatch() {
    // TODO T31905686: Remove this method and add support for multi-threading performance counters
  }

  @Override
  public Map<String, Long> getPerformanceCounters() {
    HashMap<String, Long> performanceCounters = new HashMap<>();
    performanceCounters.put("CommitStartTime", mCommitStartTime);
    performanceCounters.put("LayoutTime", mLayoutTime);
    performanceCounters.put("DispatchViewUpdatesTime", mDispatchViewUpdatesTime);
    performanceCounters.put("RunStartTime", mRunStartTime);
    performanceCounters.put("BatchedExecutionTime", mBatchedExecutionTime);
    performanceCounters.put("FinishFabricTransactionTime", mFinishTransactionTime);
    performanceCounters.put("FinishFabricTransactionCPPTime", mFinishTransactionCPPTime);
    return performanceCounters;
  }

  private class DispatchUIFrameCallback extends GuardedFrameCallback {

    private volatile boolean mIsMountingEnabled = true;

    private DispatchUIFrameCallback(@NonNull ReactContext reactContext) {
      super(reactContext);
    }

    @AnyThread
    void stop() {
      mIsMountingEnabled = false;
    }

    @Override
    @UiThread
    @ThreadConfined(UI)
    public void doFrameGuarded(long frameTimeNanos) {
      if (!mIsMountingEnabled || mDestroyed) {
        FLog.w(TAG, "Not flushing pending UI operations because of previously thrown Exception");
        return;
      }

      try {
        dispatchPreMountItems(frameTimeNanos);

        tryDispatchMountItems();

      } catch (Exception ex) {
        FLog.e(TAG, "Exception thrown when executing UIFrameGuarded", ex);
        stop();
        throw ex;
      } finally {
        ReactChoreographer.getInstance()
            .postFrameCallback(
                ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
      }
    }
  }
}
