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
import static com.facebook.react.uimanager.UIManagerHelper.PADDING_BOTTOM_INDEX;
import static com.facebook.react.uimanager.UIManagerHelper.PADDING_END_INDEX;
import static com.facebook.react.uimanager.UIManagerHelper.PADDING_START_INDEX;
import static com.facebook.react.uimanager.UIManagerHelper.PADDING_TOP_INDEX;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Point;
import android.os.SystemClock;
import android.view.View;
import android.view.accessibility.AccessibilityEvent;
import androidx.annotation.AnyThread;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactIgnorableMountingException;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UIManagerListener;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.SurfaceMountingManager;
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchIntCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchStringCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.fabric.mounting.mountitems.PreAllocateViewMountItem;
import com.facebook.react.fabric.mounting.mountitems.SendAccessibilityEvent;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactRoot;
import com.facebook.react.uimanager.ReactRootViewTagGenerator;
import com.facebook.react.uimanager.RootViewUtil;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.ViewManagerPropertyUpdater;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcherImpl;
import com.facebook.react.views.text.TextLayoutManager;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CopyOnWriteArrayList;

@SuppressLint("MissingNativeLoadLibrary")
public class FabricUIManager implements UIManager, LifecycleEventListener {
  public static final String TAG = FabricUIManager.class.getSimpleName();

  // The IS_DEVELOPMENT_ENVIRONMENT variable is used to log extra data when running fabric in a
  // development environment. DO NOT ENABLE THIS ON PRODUCTION OR YOU WILL BE FIRED!
  public static final boolean IS_DEVELOPMENT_ENVIRONMENT = false && ReactBuildConfig.DEBUG;
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

  @NonNull private final EventBeatManager mEventBeatManager;

  private boolean mInDispatch = false;
  private int mReDispatchCounter = 0;

  @NonNull
  private final CopyOnWriteArrayList<UIManagerListener> mListeners = new CopyOnWriteArrayList<>();

  @NonNull
  private final ConcurrentLinkedQueue<DispatchCommandMountItem> mViewCommandMountItemsConcurrent =
      new ConcurrentLinkedQueue<>();

  @NonNull
  private final ConcurrentLinkedQueue<MountItem> mMountItemsConcurrent =
      new ConcurrentLinkedQueue<>();

  @NonNull
  private final ConcurrentLinkedQueue<PreAllocateViewMountItem> mPreMountItemsConcurrent =
      new ConcurrentLinkedQueue<>();

  @ThreadConfined(UI)
  @NonNull
  private final DispatchUIFrameCallback mDispatchUIFrameCallback;

  /**
   * This is used to keep track of whether or not the FabricUIManager has been destroyed. Once the
   * Catalyst instance is being destroyed, we should cease all operation here.
   */
  private volatile boolean mDestroyed = false;

  // TODO T83943316: Delete this variable once StaticViewConfigs are enabled by default
  private volatile boolean mShouldDeallocateEventDispatcher = false;

  private boolean mDriveCxxAnimations = false;

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

  // TODO T83943316: Deprecate and delete this constructor once StaticViewConfigs are enabled by
  // default
  public FabricUIManager(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagerRegistry,
      EventDispatcher eventDispatcher,
      EventBeatManager eventBeatManager) {
    mDispatchUIFrameCallback = new DispatchUIFrameCallback(reactContext);
    mReactApplicationContext = reactContext;
    mMountingManager = new MountingManager(viewManagerRegistry);
    mEventDispatcher = eventDispatcher;
    mShouldDeallocateEventDispatcher = false;
    mEventBeatManager = eventBeatManager;
    mReactApplicationContext.addLifecycleEventListener(this);
  }

  public FabricUIManager(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagerRegistry,
      EventBeatManager eventBeatManager) {
    mDispatchUIFrameCallback = new DispatchUIFrameCallback(reactContext);
    mReactApplicationContext = reactContext;
    mMountingManager = new MountingManager(viewManagerRegistry);
    mEventDispatcher = new EventDispatcherImpl(reactContext);
    mShouldDeallocateEventDispatcher = true;
    mEventBeatManager = eventBeatManager;
    mReactApplicationContext.addLifecycleEventListener(this);
  }

  // TODO (T47819352): Rename this to startSurface for consistency with xplat/iOS
  @Override
  @UiThread
  @ThreadConfined(UI)
  @Deprecated
  public <T extends View> int addRootView(
      final T rootView, final WritableMap initialProps, final @Nullable String initialUITemplate) {
    ReactSoftException.logSoftException(
        TAG,
        new IllegalViewOperationException(
            "Do not call addRootView in Fabric; it is unsupported. Call startSurface instead."));

    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    ReactRoot reactRootView = (ReactRoot) rootView;

    ThemedReactContext reactContext =
        new ThemedReactContext(
            mReactApplicationContext, rootView.getContext(), reactRootView.getSurfaceID(), rootTag);
    mMountingManager.startSurface(rootTag, rootView, reactContext);
    String moduleName = reactRootView.getJSModuleName();
    if (ENABLE_FABRIC_LOGS) {
      FLog.d(TAG, "Starting surface for module: %s and reactTag: %d", moduleName, rootTag);
    }
    mBinding.startSurface(rootTag, moduleName, (NativeMap) initialProps);
    if (initialUITemplate != null) {
      mBinding.renderTemplateToSurface(rootTag, initialUITemplate);
    }
    return rootTag;
  }

  @Override
  public void preInitializeViewManagers(List<String> viewManagerNames) {
    for (String viewManagerName : viewManagerNames) {
      mMountingManager.initializeViewManager(viewManagerName);
    }
  }

  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public <T extends View> int startSurface(
      final T rootView,
      final String moduleName,
      final WritableMap initialProps,
      int widthMeasureSpec,
      int heightMeasureSpec) {
    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    Context context = rootView.getContext();
    ThemedReactContext reactContext =
        new ThemedReactContext(mReactApplicationContext, context, moduleName, rootTag);
    if (ENABLE_FABRIC_LOGS) {
      FLog.d(TAG, "Starting surface for module: %s and reactTag: %d", moduleName, rootTag);
    }
    mMountingManager.startSurface(rootTag, rootView, reactContext);

    // If startSurface is executed in the UIThread then, it uses the ViewportOffset from the View,
    // Otherwise Fabric relies on calling {@link Binding#setConstraints} method to update the
    // ViewportOffset during measurement or onLayout.
    @SuppressLint("WrongThread")
    Point viewportOffset =
        UiThreadUtil.isOnUiThread() ? RootViewUtil.getViewportOffset(rootView) : new Point(0, 0);

    mBinding.startSurfaceWithConstraints(
        rootTag,
        moduleName,
        (NativeMap) initialProps,
        getMinSize(widthMeasureSpec),
        getMaxSize(widthMeasureSpec),
        getMinSize(heightMeasureSpec),
        getMaxSize(heightMeasureSpec),
        viewportOffset.x,
        viewportOffset.y,
        I18nUtil.getInstance().isRTL(context),
        I18nUtil.getInstance().doLeftAndRightSwapInRTL(context));
    return rootTag;
  }

  public void startSurface(final View rootView, SurfaceHandler surfaceHandler) {
    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();

    Context context = rootView.getContext();
    ThemedReactContext reactContext =
        new ThemedReactContext(
            mReactApplicationContext, context, surfaceHandler.getModuleName(), rootTag);
    mMountingManager.startSurface(rootTag, rootView, reactContext);

    surfaceHandler.setSurfaceId(rootTag);
    if (surfaceHandler instanceof SurfaceHandlerBinding) {
      mBinding.registerSurface((SurfaceHandlerBinding) surfaceHandler);
    }
    surfaceHandler.start();
  }

  public void stopSurface(SurfaceHandler surfaceHandler) {
    if (!surfaceHandler.isRunning()) {
      ReactSoftException.logSoftException(
          FabricUIManager.TAG,
          new IllegalStateException("Trying to stop surface that hasn't started yet"));
      return;
    }

    mMountingManager.stopSurface(surfaceHandler.getSurfaceId());

    surfaceHandler.stop();

    if (surfaceHandler instanceof SurfaceHandlerBinding) {
      mBinding.unregisterSurface((SurfaceHandlerBinding) surfaceHandler);
    }
  }

  /** Method called when an event has been dispatched on the C++ side. */
  @DoNotStrip
  @SuppressWarnings("unused")
  public void onRequestEventBeat() {
    mEventDispatcher.dispatchAllEvents();
  }

  @AnyThread
  @ThreadConfined(ANY)
  @Override
  public void stopSurface(final int surfaceID) {
    // Mark surfaceId as dead, stop executing mounting instructions
    mMountingManager.stopSurface(surfaceID);

    // Communicate stopSurface to Cxx - causes an empty ShadowTree to be committed,
    // but all mounting instructions will be ignored because stopSurface was called
    // on the MountingManager
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

    // When using ReactFeatureFlags.enableExperimentalStaticViewConfigs enabled, FabriUIManager is
    // responsible for initializing and deallocating EventDispatcher.
    // TODO T83943316: Remove this IF once StaticViewConfigs are enabled by default
    if (mShouldDeallocateEventDispatcher) {
      mEventDispatcher.onCatalystInstanceDestroyed();
    }
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

    addPreAllocateMountItem(
        new PreAllocateViewMountItem(
            rootTag,
            reactTag,
            getFabricComponentName(componentName),
            props,
            (StateWrapper) stateWrapper,
            isLayoutable));
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem createIntBufferBatchMountItem(
      int rootTag, int[] intBuffer, Object[] objBuffer, int commitNumber) {
    return new IntBufferBatchMountItem(rootTag, intBuffer, objBuffer, commitNumber);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private NativeArray measureLines(
      ReadableMap attributedString, ReadableMap paragraphAttributes, float width, float height) {
    return (NativeArray)
        TextLayoutManager.measureLines(
            mReactApplicationContext,
            attributedString,
            paragraphAttributes,
            PixelUtil.toPixelFromDIP(width));
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
      int surfaceId,
      String componentName,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float minWidth,
      float maxWidth,
      float minHeight,
      float maxHeight,
      @Nullable float[] attachmentsPositions) {

    ReactContext context;
    if (surfaceId > 0) {
      SurfaceMountingManager surfaceMountingManager =
          mMountingManager.getSurfaceManagerEnforced(surfaceId, "measure");
      if (surfaceMountingManager.isStopped()) {
        return 0;
      }
      context = surfaceMountingManager.getContext();
    } else {
      context = mReactApplicationContext;
    }

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

  /**
   * @param surfaceId {@link int} surface ID
   * @param defaultTextInputPadding {@link float[]} output parameter will contain the default theme
   *     padding used by RN Android TextInput.
   * @return if theme data is available in the output parameters.
   */
  @DoNotStrip
  public boolean getThemeData(int surfaceId, float[] defaultTextInputPadding) {
    SurfaceMountingManager surfaceMountingManager =
        mMountingManager.getSurfaceManagerEnforced(surfaceId, "getThemeData");
    ThemedReactContext themedReactContext = surfaceMountingManager.getContext();
    float[] defaultTextInputPaddingForTheme =
        UIManagerHelper.getDefaultTextInputPadding(themedReactContext);
    defaultTextInputPadding[0] = defaultTextInputPaddingForTheme[PADDING_START_INDEX];
    defaultTextInputPadding[1] = defaultTextInputPaddingForTheme[PADDING_END_INDEX];
    defaultTextInputPadding[2] = defaultTextInputPaddingForTheme[PADDING_TOP_INDEX];
    defaultTextInputPadding[3] = defaultTextInputPaddingForTheme[PADDING_BOTTOM_INDEX];
    return true;
  }

  @Override
  @UiThread
  @ThreadConfined(UI)
  public void synchronouslyUpdateViewOnUIThread(
      final int reactTag, @NonNull final ReadableMap props) {
    UiThreadUtil.assertOnUiThread();

    int commitNumber = mCurrentSynchronousCommitNumber++;

    // We are on the UI thread so it would otherwise be safe to call `tryDispatchMountItems` here to
    // flush previously-queued mountitems, *BUT* we don't know where we are on the callstack.
    // Why isn't it safe, and why do we have additional safeguards here?
    //
    // A tangible example where it would cause a crash, and did in the past:
    // 1. There are queued "delete" mutations
    // 2. We're called by this stack trace:
    //    FabricUIManager.synchronouslyUpdateViewOnUIThread(FabricUIManager.java:574)
    //    PropsAnimatedNode.updateView(PropsAnimatedNode.java:114)
    //    NativeAnimatedNodesManager.updateNodes(NativeAnimatedNodesManager.java:655)
    //    NativeAnimatedNodesManager.handleEvent(NativeAnimatedNodesManager.java:521)
    //    NativeAnimatedNodesManager.onEventDispatch(NativeAnimatedNodesManager.java:483)
    //    EventDispatcherImpl.dispatchEvent(EventDispatcherImpl.java:116)
    //    ReactScrollViewHelper.emitScrollEvent(ReactScrollViewHelper.java:85)
    //    ReactScrollViewHelper.emitScrollEvent(ReactScrollViewHelper.java:46)
    //    ReactScrollView.onScrollChanged(ReactScrollView.java:285)
    //    ReactScrollView.onOverScrolled(ReactScrollView.java:808)
    //    android.view.View.overScrollBy(View.java:26052)
    //    android.widget.ScrollView.overScrollBy(ScrollView.java:2040)
    //    android.widget.ScrollView.computeScroll(ScrollView.java:1481)
    //    android.view.View.updateDisplayListIfDirty(View.java:20466)
    // 3. A view is deleted while its parent is being drawn, causing a crash.

    MountItem synchronousMountItem =
        new MountItem() {
          @Override
          public void execute(@NonNull MountingManager mountingManager) {
            try {
              mountingManager.updateProps(reactTag, props);
            } catch (Exception ex) {
              // TODO T42943890: Fix animations in Fabric and remove this try/catch
              ReactSoftException.logSoftException(
                  TAG,
                  new ReactNoCrashSoftException(
                      "Caught exception in synchronouslyUpdateViewOnUIThread", ex));
            }
          }

          @Override
          public int getSurfaceId() {
            return View.NO_ID;
          }
        };

    // If the reactTag exists, we assume that it might at the end of the next
    // batch of MountItems. Otherwise, we try to execute immediately.
    if (!mMountingManager.getViewExists(reactTag)) {
      addMountItem(synchronousMountItem);
      return;
    }

    ReactMarker.logFabricMarker(
        ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_START, null, commitNumber);

    if (ENABLE_FABRIC_LOGS) {
      FLog.d(
          TAG,
          "SynchronouslyUpdateViewOnUIThread for tag %d: %s",
          reactTag,
          (IS_DEVELOPMENT_ENVIRONMENT ? props.toHashMap().toString() : "<hidden>"));
    }

    synchronousMountItem.execute(mMountingManager);

    ReactMarker.logFabricMarker(
        ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_END, null, commitNumber);
  }

  public void addUIManagerEventListener(UIManagerListener listener) {
    mListeners.add(listener);
  }

  public void removeUIManagerEventListener(UIManagerListener listener) {
    mListeners.remove(listener);
  }

  /**
   * This method enqueues UI operations directly to the UI thread. This might change in the future
   * to enforce execution order using {@link ReactChoreographer#CallbackType}. This method should
   * only be called as the result of a new tree being committed.
   */
  @DoNotStrip
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private void scheduleMountItem(
      @Nullable final MountItem mountItem,
      int commitNumber,
      long commitStartTime,
      long diffStartTime,
      long diffEndTime,
      long layoutStartTime,
      long layoutEndTime,
      long finishTransactionStartTime,
      long finishTransactionEndTime) {
    // When Binding.cpp calls scheduleMountItems during a commit phase, it always calls with
    // a BatchMountItem. No other sites call into this with a BatchMountItem, and Binding.cpp only
    // calls scheduleMountItems with a BatchMountItem.
    boolean isBatchMountItem = mountItem instanceof IntBufferBatchMountItem;
    boolean shouldSchedule =
        (isBatchMountItem && ((IntBufferBatchMountItem) mountItem).shouldSchedule())
            || (!isBatchMountItem && mountItem != null);

    // In case of sync rendering, this could be called on the UI thread. Otherwise,
    // it should ~always be called on the JS thread.
    for (UIManagerListener listener : mListeners) {
      listener.didScheduleMountItems(this);
    }

    if (isBatchMountItem) {
      mCommitStartTime = commitStartTime;
      mLayoutTime = layoutEndTime - layoutStartTime;
      mFinishTransactionCPPTime = finishTransactionEndTime - finishTransactionStartTime;
      mFinishTransactionTime = SystemClock.uptimeMillis() - finishTransactionStartTime;
      mDispatchViewUpdatesTime = SystemClock.uptimeMillis();
    }

    if (shouldSchedule) {
      addMountItem(mountItem);
      if (UiThreadUtil.isOnUiThread()) {
        // We only read these flags on the UI thread.
        tryDispatchMountItems();
      }
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

  /**
   * Try to dispatch MountItems. Returns true if any items were dispatched, false otherwise. A
   * `false` return value doesn't indicate errors, it may just indicate there was no work to be
   * done.
   *
   * @return
   */
  @UiThread
  @ThreadConfined(UI)
  private boolean tryDispatchMountItems() {
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

    for (UIManagerListener listener : mListeners) {
      listener.didDispatchMountItems(this);
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
    return didDispatchItems;
  }

  @Nullable
  private <E extends MountItem> List<E> drainConcurrentItemQueue(ConcurrentLinkedQueue<E> queue) {
    List<E> result = new ArrayList<>();
    while (!queue.isEmpty()) {
      E item = queue.poll();
      if (item != null) {
        result.add(item);
      }
    }
    if (result.size() == 0) {
      return null;
    }
    return result;
  }

  @UiThread
  @ThreadConfined(UI)
  private List<DispatchCommandMountItem> getAndResetViewCommandMountItems() {
    return drainConcurrentItemQueue(mViewCommandMountItemsConcurrent);
  }

  @UiThread
  @ThreadConfined(UI)
  private List<MountItem> getAndResetMountItems() {
    return drainConcurrentItemQueue(mMountItemsConcurrent);
  }

  private Collection<PreAllocateViewMountItem> getAndResetPreMountItems() {
    return drainConcurrentItemQueue(mPreMountItemsConcurrent);
  }

  private static void printMountItem(MountItem mountItem, String prefix) {
    // If a MountItem description is split across multiple lines, it's because it's a
    // compound MountItem. Log each line separately.
    String[] mountItemLines = mountItem.toString().split("\n");
    for (String m : mountItemLines) {
      FLog.e(TAG, prefix + ": " + m);
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
          printMountItem(command, "dispatchMountItems: Executing viewCommandMountItem");
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
    Collection<PreAllocateViewMountItem> preMountItemsToDispatch = getAndResetPreMountItems();

    if (preMountItemsToDispatch != null) {
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
          "FabricUIManager::mountViews preMountItems to execute: "
              + preMountItemsToDispatch.size());

      for (PreAllocateViewMountItem preMountItem : preMountItemsToDispatch) {
        preMountItem.execute(mMountingManager);
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
          printMountItem(mountItem, "dispatchMountItems: Executing mountItem");
        }

        try {
          mountItem.execute(mMountingManager);
        } catch (Throwable e) {
          // If there's an exception, we want to log diagnostics in prod and rethrow.
          FLog.e(TAG, "dispatchMountItems: caught exception, displaying all MountItems", e);
          for (MountItem m : mountItemsToDispatch) {
            printMountItem(m, "dispatchMountItems: mountItem");
          }

          if (ReactIgnorableMountingException.isIgnorable(e)) {
            ReactSoftException.logSoftException(TAG, e);
          } else {
            throw e;
          }
        }
      }
      mBatchedExecutionTime += SystemClock.uptimeMillis() - batchedExecutionStartTime;
    }
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    return true;
  }

  /**
   * Detect if we still have processing time left in this frame.
   *
   * @param frameTimeNanos
   * @return
   */
  private boolean haveExceededNonBatchedFrameTime(long frameTimeNanos) {
    long timeLeftInFrame = FRAME_TIME_MS - ((System.nanoTime() - frameTimeNanos) / 1000000);
    return timeLeftInFrame < MAX_TIME_IN_FRAME_FOR_NON_BATCHED_OPERATIONS_MS;
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
        if (haveExceededNonBatchedFrameTime(frameTimeNanos)) {
          break;
        }

        PreAllocateViewMountItem preMountItemToDispatch = mPreMountItemsConcurrent.poll();

        // If list is empty, `poll` will return null, or var will never be set
        if (preMountItemToDispatch == null) {
          break;
        }

        preMountItemToDispatch.execute(mMountingManager);
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
      final int surfaceId,
      final int widthMeasureSpec,
      final int heightMeasureSpec,
      final int offsetX,
      final int offsetY) {

    if (ENABLE_FABRIC_LOGS) {
      FLog.d(TAG, "Updating Root Layout Specs for [%d]", surfaceId);
    }

    SurfaceMountingManager surfaceMountingManager = mMountingManager.getSurfaceManager(surfaceId);

    // TODO T83615646: make this a hard-crash in the future.
    if (surfaceMountingManager == null) {
      ReactSoftException.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "Cannot updateRootLayoutSpecs on surfaceId that does not exist: " + surfaceId));
      return;
    }

    ThemedReactContext reactContext = surfaceMountingManager.getContext();
    boolean isRTL = false;
    boolean doLeftAndRightSwapInRTL = false;
    if (reactContext != null) {
      isRTL = I18nUtil.getInstance().isRTL(reactContext);
      doLeftAndRightSwapInRTL = I18nUtil.getInstance().doLeftAndRightSwapInRTL(reactContext);
    }

    mBinding.setConstraints(
        surfaceId,
        getMinSize(widthMeasureSpec),
        getMaxSize(widthMeasureSpec),
        getMinSize(heightMeasureSpec),
        getMaxSize(heightMeasureSpec),
        offsetX,
        offsetY,
        isRTL,
        doLeftAndRightSwapInRTL);
  }

  @Override
  public void receiveEvent(int reactTag, String eventName, @Nullable WritableMap params) {
    receiveEvent(View.NO_ID, reactTag, eventName, params);
  }

  @Override
  public void receiveEvent(
      int surfaceId, int reactTag, String eventName, @Nullable WritableMap params) {
    if (ReactBuildConfig.DEBUG && surfaceId == View.NO_ID) {
      FLog.d(TAG, "Emitted event without surfaceId: [%d] %s", reactTag, eventName);
    }

    EventEmitterWrapper eventEmitter = mMountingManager.getEventEmitter(surfaceId, reactTag);

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

  @Override
  @Deprecated
  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int reactTag, final int commandId, @Nullable final ReadableArray commandArgs) {
    throw new UnsupportedOperationException(
        "dispatchCommand called without surfaceId - Fabric dispatchCommand must be called through Fabric JSI API");
  }

  @Override
  @Deprecated
  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int reactTag, final String commandId, @Nullable final ReadableArray commandArgs) {
    throw new UnsupportedOperationException(
        "dispatchCommand called without surfaceId - Fabric dispatchCommand must be called through Fabric JSI API");
  }

  @Deprecated
  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int surfaceId,
      final int reactTag,
      final int commandId,
      @Nullable final ReadableArray commandArgs) {
    dispatchCommandMountItem(
        new DispatchIntCommandMountItem(surfaceId, reactTag, commandId, commandArgs));
  }

  @DoNotStrip
  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int surfaceId,
      final int reactTag,
      final String commandId,
      @Nullable final ReadableArray commandArgs) {
    dispatchCommandMountItem(
        new DispatchStringCommandMountItem(surfaceId, reactTag, commandId, commandArgs));
  }

  @AnyThread
  @ThreadConfined(ANY)
  private void dispatchCommandMountItem(DispatchCommandMountItem command) {
    addViewCommandMountItem(command);
  }

  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public void sendAccessibilityEvent(int reactTag, int eventType) {
    // Can be called from native, not just JS - we need to migrate the native callsites
    // before removing this entirely.
    addMountItem(new SendAccessibilityEvent(View.NO_ID, reactTag, eventType));
  }

  @DoNotStrip
  @AnyThread
  @ThreadConfined(ANY)
  public void sendAccessibilityEventFromJS(int surfaceId, int reactTag, String eventTypeJS) {
    int eventType;
    if ("focus".equals(eventTypeJS)) {
      eventType = AccessibilityEvent.TYPE_VIEW_FOCUSED;
    } else if ("windowStateChange".equals(eventTypeJS)) {
      eventType = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
    } else if ("click".equals(eventTypeJS)) {
      eventType = AccessibilityEvent.TYPE_VIEW_CLICKED;
    } else {
      throw new IllegalArgumentException(
          "sendAccessibilityEventFromJS: invalid eventType " + eventTypeJS);
    }
    addMountItem(new SendAccessibilityEvent(surfaceId, reactTag, eventType));
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
      final int surfaceId,
      final int reactTag,
      final int initialReactTag,
      final boolean blockNativeResponder) {
    if (ReactFeatureFlags.enableJSResponder) {
      addMountItem(
          new MountItem() {
            @Override
            public void execute(MountingManager mountingManager) {
              SurfaceMountingManager surfaceMountingManager =
                  mountingManager.getSurfaceManager(surfaceId);
              if (surfaceMountingManager != null) {
                surfaceMountingManager.setJSResponder(
                    reactTag, initialReactTag, blockNativeResponder);
              } else {
                FLog.e(
                    TAG, "setJSResponder skipped, surface no longer available [" + surfaceId + "]");
              }
            }

            @Override
            public int getSurfaceId() {
              return surfaceId;
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
    if (ReactFeatureFlags.enableJSResponder) {
      addMountItem(
          new MountItem() {
            @Override
            public void execute(MountingManager mountingManager) {
              mountingManager.clearJSResponder();
            }

            @Override
            public int getSurfaceId() {
              return View.NO_ID;
            }
          });
    }
  }

  @Override
  public void profileNextBatch() {
    // TODO T31905686: Remove this method and add support for multi-threading performance counters
  }

  @Override
  @Deprecated
  @Nullable
  public String resolveCustomDirectEventName(@Nullable String eventName) {
    if (eventName == null) {
      return null;
    }
    if (eventName.substring(0, 3).equals("top")) {
      return "on" + eventName.substring(3);
    }
    return eventName;
  }

  // Called from Binding.cpp
  @DoNotStrip
  @AnyThread
  public void onAnimationStarted() {
    mDriveCxxAnimations = true;
  }

  // Called from Binding.cpp
  @DoNotStrip
  @AnyThread
  public void onAllAnimationsComplete() {
    mDriveCxxAnimations = false;
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

  private void addMountItem(MountItem mountItem) {
    mMountItemsConcurrent.add(mountItem);
  }

  private void addPreAllocateMountItem(PreAllocateViewMountItem mountItem) {
    // We do this check only for PreAllocateViewMountItem - and not DispatchMountItem or regular
    // MountItem - because PreAllocateViewMountItem is not batched, and is relatively more expensive
    // both to queue, to drain, and to execute.
    if (!mMountingManager.surfaceIsStopped(mountItem.getSurfaceId())) {
      mPreMountItemsConcurrent.add(mountItem);
    } else if (IS_DEVELOPMENT_ENVIRONMENT) {
      FLog.e(
          TAG,
          "Not queueing PreAllocateMountItem: surfaceId stopped: [%d] - %s",
          mountItem.getSurfaceId(),
          mountItem.toString());
    }
  }

  private void addViewCommandMountItem(DispatchCommandMountItem mountItem) {
    mViewCommandMountItemsConcurrent.add(mountItem);
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

      // Drive any animations from C++.
      // There is a race condition here between getting/setting
      // `mDriveCxxAnimations` which shouldn't matter; it's safe to call
      // the mBinding method, unless mBinding has gone away.
      if (mDriveCxxAnimations && mBinding != null) {
        mBinding.driveCxxAnimations();
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
