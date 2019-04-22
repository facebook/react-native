/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric;

import static com.facebook.infer.annotation.ThreadConfined.UI;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getMaxSize;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getMinSize;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getYogaMeasureMode;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getYogaSize;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;

import android.annotation.SuppressLint;
import android.os.SystemClock;
import android.support.annotation.GuardedBy;
import android.support.annotation.Nullable;
import android.support.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.GuardedRunnable;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.fabric.jsi.Binding;
import com.facebook.react.fabric.jsi.EventBeatManager;
import com.facebook.react.fabric.jsi.EventEmitterWrapper;
import com.facebook.react.fabric.jsi.FabricSoLoader;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.mountitems.BatchMountItem;
import com.facebook.react.fabric.mounting.mountitems.CreateMountItem;
import com.facebook.react.fabric.mounting.mountitems.DeleteMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.InsertMountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.fabric.mounting.mountitems.PreAllocateViewMountItem;
import com.facebook.react.fabric.mounting.mountitems.RemoveMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateEventEmitterMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateLayoutMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdateLocalDataMountItem;
import com.facebook.react.fabric.mounting.mountitems.UpdatePropsMountItem;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.ReactRootViewTagGenerator;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerPropertyUpdater;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.common.MeasureSpecProvider;
import com.facebook.react.uimanager.common.SizeMonitoringFrameLayout;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@SuppressLint("MissingNativeLoadLibrary")
public class FabricUIManager implements UIManager, LifecycleEventListener {

  private static final String TAG = FabricUIManager.class.getSimpleName();

  private static final Map<String, String> sComponentNames = new HashMap<>();

  static {
    FabricSoLoader.staticInit();

    // TODO T31905686: unify component names between JS - Android - iOS - C++
    sComponentNames.put("View", "RCTView");
    sComponentNames.put("Image", "RCTImageView");
    sComponentNames.put("ScrollView", "RCTScrollView");
    sComponentNames.put("ReactPerformanceLoggerFlag", "ReactPerformanceLoggerFlag");
    sComponentNames.put("Paragraph", "RCTText");
    sComponentNames.put("Text", "RCText");
    sComponentNames.put("RawText", "RCTRawText");
    sComponentNames.put("ActivityIndicatorView", "AndroidProgressBar");
    sComponentNames.put("ShimmeringView", "RKShimmeringView");
    sComponentNames.put("TemplateView", "RCTTemplateView");
  }

  private Binding mBinding;
  private final ReactApplicationContext mReactApplicationContext;
  private final MountingManager mMountingManager;
  private final EventDispatcher mEventDispatcher;
  private final ConcurrentHashMap<Integer, ThemedReactContext> mReactContextForRootTag =
      new ConcurrentHashMap<>();
  private final EventBeatManager mEventBeatManager;
  private final Object mMountItemsLock = new Object();
  private final Object mPreMountItemsLock = new Object();

  @GuardedBy("mMountItemsLock")
  private List<MountItem> mMountItems = new ArrayList<>();

  @GuardedBy("mPreMountItemsLock")
  private List<MountItem> mPreMountItems = new ArrayList<>();

  @ThreadConfined(UI)
  private final DispatchUIFrameCallback mDispatchUIFrameCallback;

  @ThreadConfined(UI)
  private boolean mIsMountingEnabled = true;
  private long mRunStartTime = 0l;
  private long mBatchedExecutionTime = 0l;
  private long mNonBatchedExecutionTime = 0l;
  private long mDispatchViewUpdatesTime = 0l;
  private long mCommitStartTime = 0l;
  private long mLayoutTime = 0l;
  private long mFinishTransactionTime = 0l;

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

  @Override
  public <T extends SizeMonitoringFrameLayout & MeasureSpecProvider> int addRootView(
      final T rootView, final WritableMap initialProps, final @Nullable String initialUITemplate) {
    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    ThemedReactContext reactContext =
        new ThemedReactContext(mReactApplicationContext, rootView.getContext());
    mMountingManager.addRootView(rootTag, rootView);
    mReactContextForRootTag.put(rootTag, reactContext);
    mBinding.startSurface(rootTag, (NativeMap) initialProps);
    updateRootLayoutSpecs(rootTag, rootView.getWidthMeasureSpec(), rootView.getHeightMeasureSpec());
    if (initialUITemplate != null) {
      mBinding.renderTemplateToSurface(rootTag, initialUITemplate);
    }
    return rootTag;
  }

  /** Method called when an event has been dispatched on the C++ side. */
  @DoNotStrip
  public void onRequestEventBeat() {
    mEventDispatcher.dispatchAllEvents();
  }

  @Override
  public void removeRootView(int reactRootTag) {
    // TODO T31905686: integrate with the unmounting of Fabric React Renderer.
    mMountingManager.removeRootView(reactRootTag);
    mReactContextForRootTag.remove(reactRootTag);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem createMountItem(
      String componentName, int reactRootTag, int reactTag, boolean isVirtual) {
    String component = sComponentNames.get(componentName);
    if (component == null) {
      throw new IllegalArgumentException("Unable to find component with name " + componentName);
    }
    ThemedReactContext reactContext = mReactContextForRootTag.get(reactRootTag);
    if (reactContext == null) {
      throw new IllegalArgumentException("Unable to find ReactContext for root: " + reactRootTag);
    }
    return new CreateMountItem(reactContext, component, reactTag, isVirtual);
  }

  @Override
  public void initialize() {
    mEventDispatcher.registerEventEmitter(FABRIC, new FabricEventEmitter(this));
    mEventDispatcher.addBatchEventDispatchedListener(mEventBeatManager);
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mEventDispatcher.removeBatchEventDispatchedListener(mEventBeatManager);
    mEventDispatcher.unregisterEventEmitter(FABRIC);
    mBinding.unregister();
    ViewManagerPropertyUpdater.clear();
  }

  @DoNotStrip
  private void preallocateView(final int rootTag, final String componentName) {
    if (UiThreadUtil.isOnUiThread()) {
      // There is no reason to allocate views ahead of time on the main thread.
      return;
    }
    synchronized (mPreMountItemsLock) {
      ThemedReactContext context =
        Assertions.assertNotNull(mReactContextForRootTag.get(rootTag));
      String component = sComponentNames.get(componentName);
      Assertions.assertNotNull(component);
      mPreMountItems.add(new PreAllocateViewMountItem(context, rootTag, component));
    }
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem removeMountItem(int reactTag, int parentReactTag, int index) {
    return new RemoveMountItem(reactTag, parentReactTag, index);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem insertMountItem(int reactTag, int parentReactTag, int index) {
    return new InsertMountItem(reactTag, parentReactTag, index);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem deleteMountItem(int reactTag) {
    return new DeleteMountItem(reactTag);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem updateLayoutMountItem(int reactTag, int x, int y, int width, int height) {
    return new UpdateLayoutMountItem(reactTag, x, y, width, height);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem updatePropsMountItem(int reactTag, ReadableNativeMap map) {
    return new UpdatePropsMountItem(reactTag, map);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem updateLocalDataMountItem(int reactTag, ReadableNativeMap newLocalData) {
    return new UpdateLocalDataMountItem(reactTag, newLocalData);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem updateEventEmitterMountItem(int reactTag, Object eventEmitter) {
    return new UpdateEventEmitterMountItem(reactTag, (EventEmitterWrapper) eventEmitter);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private MountItem createBatchMountItem(MountItem[] items, int size) {
    return new BatchMountItem(items, size);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private long measure(
      String componentName,
      ReadableNativeMap localData,
      ReadableNativeMap props,
      int minWidth,
      int maxWidth,
      int minHeight,
      int maxHeight) {

    return mMountingManager.measure(
        mReactApplicationContext,
        componentName,
        localData,
        props,
        getYogaSize(minWidth, maxWidth),
        getYogaMeasureMode(minWidth, maxWidth),
        getYogaSize(minHeight, maxHeight),
        getYogaMeasureMode(minHeight, maxHeight));
  }

  /**
   * This method enqueues UI operations directly to the UI thread. This might change in the future
   * to enforce execution order using {@link ReactChoreographer#CallbackType}.
   */
  @DoNotStrip
  @SuppressWarnings("unused")
  private void scheduleMountItems(
      final MountItem mountItems,
      long commitStartTime,
      long layoutTime,
      long finishTransactionStartTime) {

    // TODO T31905686: support multithreading
    mCommitStartTime = commitStartTime;
    mLayoutTime = layoutTime;
    mFinishTransactionTime = SystemClock.uptimeMillis() - finishTransactionStartTime;
    mDispatchViewUpdatesTime = SystemClock.uptimeMillis();
    synchronized (mMountItemsLock) {
      mMountItems.add(mountItems);
    }

    if (UiThreadUtil.isOnUiThread()) {
      flushMountItems();
    }
  }

  @UiThread
  private void flushMountItems() {
    if (!mIsMountingEnabled) {
      FLog.w(
          ReactConstants.TAG,
          "Not flushing pending UI operations because of previously thrown Exception");
      return;
    }

    try {
      List<MountItem> preMountItemsToDispatch;
      synchronized (mPreMountItemsLock) {
        preMountItemsToDispatch = mPreMountItems;
        mPreMountItems = new ArrayList<>();
      }

      mRunStartTime = SystemClock.uptimeMillis();
      List<MountItem> mountItemsToDispatch;
      synchronized (mMountItemsLock) {
        mountItemsToDispatch = mMountItems;
        mMountItems = new ArrayList<>();
      }

      long nonBatchedExecutionStartTime = SystemClock.uptimeMillis();
      Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "FabricUIManager::premountViews (" + preMountItemsToDispatch.size() + " batches)");
      for (MountItem mountItem : preMountItemsToDispatch) {
        mountItem.execute(mMountingManager);
      }
      mNonBatchedExecutionTime = SystemClock.uptimeMillis() - nonBatchedExecutionStartTime;
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "FabricUIManager::mountViews (" + mountItemsToDispatch.size() + " batches)");

      long batchedExecutionStartTime = SystemClock.uptimeMillis();
      for (MountItem mountItem : mountItemsToDispatch) {
        mountItem.execute(mMountingManager);
      }
      mBatchedExecutionTime = SystemClock.uptimeMillis() - batchedExecutionStartTime;
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    } catch (Exception ex) {
      FLog.e(ReactConstants.TAG, "Exception thrown when executing UIFrameGuarded", ex);
      mIsMountingEnabled = false;
      throw ex;
    }
  }

  public void setBinding(Binding binding) {
    mBinding = binding;
  }

  /**
   * Updates the layout metrics of the root view based on the Measure specs received by parameters.
   */
  @Override
  public void updateRootLayoutSpecs(
      final int rootTag, final int widthMeasureSpec, final int heightMeasureSpec) {

    // TODO T31905686: this should not run in a different thread.
    // This is a workaround because a race condition that happens in core of RN.
    // We are analyzing this and fixing it as part of another diff.
    mReactApplicationContext.runOnJSQueueThread(
        new GuardedRunnable(mReactApplicationContext) {
          @Override
          public void runGuarded() {
            mBinding.setConstraints(
                rootTag,
                getMinSize(widthMeasureSpec),
                getMaxSize(widthMeasureSpec),
                getMinSize(heightMeasureSpec),
                getMaxSize(heightMeasureSpec));
          }
        });
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
  public void onHostPause() {
    ReactChoreographer.getInstance()
        .removeFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
  }

  @Override
  public void onHostDestroy() {}

  @Override
  public void dispatchCommand(
      final int reactTag, final int commandId, final ReadableArray commandArgs) {
    synchronized (mMountItemsLock) {
      mMountItems.add(new DispatchCommandMountItem(reactTag, commandId, commandArgs));
    }
  }

  @Override
  public void setJSResponder(int reactTag, boolean blockNativeResponder) {
    // do nothing for now.
  }

  @Override
  public void clearJSResponder() {
    // do nothing for now.
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
    performanceCounters.put("NonBatchedExecutionTime", mNonBatchedExecutionTime);
    performanceCounters.put("FinishFabricTransactionTime", mFinishTransactionTime);
    return performanceCounters;
  }

  private class DispatchUIFrameCallback extends GuardedFrameCallback {

    private DispatchUIFrameCallback(ReactContext reactContext) {
      super(reactContext);
    }

    @Override
    public void doFrameGuarded(long frameTimeNanos) {
      if (!mIsMountingEnabled) {
        FLog.w(
            ReactConstants.TAG,
            "Not flushing pending UI operations because of previously thrown Exception");
        return;
      }

      try {
        flushMountItems();
      } catch (Exception ex) {
        FLog.i(ReactConstants.TAG, "Exception thrown when executing UIFrameGuarded", ex);
        mIsMountingEnabled = false;
        throw ex;
      } finally {
        ReactChoreographer.getInstance()
            .postFrameCallback(
                ReactChoreographer.CallbackType.DISPATCH_UI, mDispatchUIFrameCallback);
      }
    }
  }
}
