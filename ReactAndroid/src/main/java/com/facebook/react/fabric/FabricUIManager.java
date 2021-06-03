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
import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UIManagerListener;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.common.mapbuffer.ReadableMapBuffer;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.fabric.mounting.MountItemDispatcher;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.SurfaceMountingManager;
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
import com.facebook.react.uimanager.events.LockFreeEventDispatcherImpl;
import com.facebook.react.views.text.TextLayoutManager;
import com.facebook.react.views.text.TextLayoutManagerMapBuffer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * We instruct ProGuard not to strip out any fields or methods, because many of these methods are
 * only called through the JNI from Cxx so it appears that most of this class is "unused".
 */
@SuppressLint("MissingNativeLoadLibrary")
@DoNotStripAny
public class FabricUIManager implements UIManager, LifecycleEventListener {
  public static final String TAG = FabricUIManager.class.getSimpleName();

  // The IS_DEVELOPMENT_ENVIRONMENT variable is used to log extra data when running fabric in a
  // development environment. DO NOT ENABLE THIS ON PRODUCTION OR YOU WILL BE FIRED!
  public static final boolean IS_DEVELOPMENT_ENVIRONMENT = false && ReactBuildConfig.DEBUG;
  public static final boolean ENABLE_FABRIC_LOGS =
      ReactFeatureFlags.enableFabricLogs
          || PrinterHolder.getPrinter()
              .shouldDisplayLogMessage(ReactDebugOverlayTags.FABRIC_UI_MANAGER);

  static {
    FabricSoLoader.staticInit();
  }

  @Nullable private Binding mBinding;
  @NonNull private final ReactApplicationContext mReactApplicationContext;
  @NonNull private final MountingManager mMountingManager;
  @NonNull private final EventDispatcher mEventDispatcher;
  @NonNull private final MountItemDispatcher mMountItemDispatcher;

  @NonNull private final EventBeatManager mEventBeatManager;

  @NonNull
  private final CopyOnWriteArrayList<UIManagerListener> mListeners = new CopyOnWriteArrayList<>();

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
    mMountItemDispatcher =
        new MountItemDispatcher(mMountingManager, new MountItemDispatchListener());
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
    mMountItemDispatcher =
        new MountItemDispatcher(mMountingManager, new MountItemDispatchListener());
    mEventDispatcher =
        ReactFeatureFlags.enableLockFreeEventDispatcher
            ? new LockFreeEventDispatcherImpl(reactContext)
            : new EventDispatcherImpl(reactContext);
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

  public void startSurface(final SurfaceHandler surfaceHandler) {
    int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    mMountingManager.startSurface(rootTag);

    startSurfaceWithId(surfaceHandler, rootTag, false);
  }

  public void attachRootView(final View rootView, final SurfaceHandler surfaceHandler) {
    ThemedReactContext reactContext =
        new ThemedReactContext(
            mReactApplicationContext,
            rootView.getContext(),
            surfaceHandler.getModuleName(),
            surfaceHandler.getSurfaceId());
    mMountingManager.attachRootView(surfaceHandler.getSurfaceId(), rootView, reactContext);

    surfaceHandler.setMountable(true);
  }

  public void startSurfaceWithView(final View rootView, final SurfaceHandler surfaceHandler) {
    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();

    Context context = rootView.getContext();
    ThemedReactContext reactContext =
        new ThemedReactContext(
            mReactApplicationContext, context, surfaceHandler.getModuleName(), rootTag);
    mMountingManager.startSurface(rootTag, rootView, reactContext);

    startSurfaceWithId(surfaceHandler, rootTag, true);
  }

  private void startSurfaceWithId(SurfaceHandler surfaceHandler, int rootTag, boolean isMountable) {
    surfaceHandler.setSurfaceId(rootTag);
    if (surfaceHandler instanceof SurfaceHandlerBinding) {
      mBinding.registerSurface((SurfaceHandlerBinding) surfaceHandler);
    }
    surfaceHandler.setMountable(isMountable);
    surfaceHandler.start();
  }

  public void stopSurface(final SurfaceHandler surfaceHandler) {
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

  @SuppressWarnings("unused")
  private NativeArray measureLinesMapBuffer(
      ReadableMapBuffer attributedString,
      ReadableMapBuffer paragraphAttributes,
      float width,
      float height) {
    return (NativeArray)
        TextLayoutManagerMapBuffer.measureLines(
            mReactApplicationContext,
            attributedString,
            paragraphAttributes,
            PixelUtil.toPixelFromDIP(width));
  }

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

  @SuppressWarnings("unused")
  private long measureMapBuffer(
      int surfaceId,
      String componentName,
      ReadableMapBuffer attributedString,
      ReadableMapBuffer paragraphAttributes,
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

    // TODO: replace ReadableNativeMap -> ReadableMapBuffer
    return mMountingManager.measureTextMapBuffer(
        context,
        componentName,
        attributedString,
        paragraphAttributes,
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

  public void addUIManagerEventListener(UIManagerListener listener) {
    mListeners.add(listener);
  }

  public void removeUIManagerEventListener(UIManagerListener listener) {
    mListeners.remove(listener);
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
              // TODO T42943890: Fix animations in Fabric and remove this try/catch?
              // There might always be race conditions between surface teardown and
              // animations/other operations, so it may not be feasible to remove this.
              // Practically 100% of reported errors from this point are because the
              // surface has stopped by this point, but the MountItem was queued before
              // the surface was stopped. It's likely not feasible to prevent all such races.
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
      mMountItemDispatcher.addMountItem(synchronousMountItem);
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

  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private void preallocateView(
      int rootTag,
      int reactTag,
      final String componentName,
      @Nullable ReadableMap props,
      @Nullable Object stateWrapper,
      @Nullable Object eventEmitterWrapper,
      boolean isLayoutable) {

    mMountItemDispatcher.addPreAllocateMountItem(
        new PreAllocateViewMountItem(
            rootTag,
            reactTag,
            getFabricComponentName(componentName),
            props,
            (StateWrapper) stateWrapper,
            (EventEmitterWrapper) eventEmitterWrapper,
            isLayoutable));
  }

  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem createIntBufferBatchMountItem(
      int rootTag, int[] intBuffer, Object[] objBuffer, int commitNumber) {
    return new IntBufferBatchMountItem(rootTag, intBuffer, objBuffer, commitNumber);
  }

  /**
   * This method enqueues UI operations directly to the UI thread. This might change in the future
   * to enforce execution order using {@link ReactChoreographer.CallbackType}. This method should
   * only be called as the result of a new tree being committed.
   */
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
      mMountItemDispatcher.addMountItem(mountItem);
      if (UiThreadUtil.isOnUiThread()) {
        // We only read these flags on the UI thread.
        mMountItemDispatcher.tryDispatchMountItems();
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
    receiveEvent(surfaceId, reactTag, eventName, false, 0, params);
  }

  /**
   * receiveEvent API that emits an event to C++. If `canCoalesceEvent` is true, that signals that
   * C++ may coalesce the event optionally. Otherwise, coalescing can happen in Java before
   * emitting.
   *
   * <p>`customCoalesceKey` is currently unused.
   *
   * @param surfaceId
   * @param reactTag
   * @param eventName
   * @param canCoalesceEvent
   * @param customCoalesceKey
   * @param params
   */
  public void receiveEvent(
      int surfaceId,
      int reactTag,
      String eventName,
      boolean canCoalesceEvent,
      int customCoalesceKey,
      @Nullable WritableMap params) {
    if (ReactBuildConfig.DEBUG && surfaceId == View.NO_ID) {
      FLog.d(TAG, "Emitted event without surfaceId: [%d] %s", reactTag, eventName);
    }

    EventEmitterWrapper eventEmitter = mMountingManager.getEventEmitter(surfaceId, reactTag);

    if (eventEmitter == null) {
      // This can happen if the view has disappeared from the screen (because of async events)
      FLog.d(TAG, "Unable to invoke event: " + eventName + " for reactTag: " + reactTag);
      return;
    }

    if (canCoalesceEvent) {
      eventEmitter.invoke(eventName, params);
    } else {
      eventEmitter.invokeUnique(eventName, params, customCoalesceKey);
    }
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
    mMountItemDispatcher.dispatchCommandMountItem(
        new DispatchIntCommandMountItem(surfaceId, reactTag, commandId, commandArgs));
  }

  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int surfaceId,
      final int reactTag,
      final String commandId,
      @Nullable final ReadableArray commandArgs) {
    mMountItemDispatcher.dispatchCommandMountItem(
        new DispatchStringCommandMountItem(surfaceId, reactTag, commandId, commandArgs));
  }

  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public void sendAccessibilityEvent(int reactTag, int eventType) {
    // Can be called from native, not just JS - we need to migrate the native callsites
    // before removing this entirely.
    mMountItemDispatcher.addMountItem(new SendAccessibilityEvent(View.NO_ID, reactTag, eventType));
  }

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
    mMountItemDispatcher.addMountItem(new SendAccessibilityEvent(surfaceId, reactTag, eventType));
  }

  /**
   * Set the JS responder for the view associated with the tags received as a parameter.
   *
   * @param reactTag React tag of the first parent of the view that is NOT virtual
   * @param initialReactTag React tag of the JS view that initiated the touch operation
   * @param blockNativeResponder If native responder should be blocked or not
   */
  public void setJSResponder(
      final int surfaceId,
      final int reactTag,
      final int initialReactTag,
      final boolean blockNativeResponder) {
    if (ReactFeatureFlags.enableJSResponder) {
      mMountItemDispatcher.addMountItem(
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
   * Clears the JS Responder specified by {@link #setJSResponder}. After this method is called, all
   * the touch events are going to be handled by JS.
   */
  public void clearJSResponder() {
    if (ReactFeatureFlags.enableJSResponder) {
      mMountItemDispatcher.addMountItem(
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
    if (eventName.startsWith("top")) {
      return "on" + eventName.substring(3);
    }
    return eventName;
  }

  // Called from Binding.cpp
  @AnyThread
  public void onAnimationStarted() {
    mDriveCxxAnimations = true;
  }

  // Called from Binding.cpp
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
    performanceCounters.put("RunStartTime", mMountItemDispatcher.getRunStartTime());
    performanceCounters.put("BatchedExecutionTime", mMountItemDispatcher.getBatchedExecutionTime());
    performanceCounters.put("FinishFabricTransactionTime", mFinishTransactionTime);
    performanceCounters.put("FinishFabricTransactionCPPTime", mFinishTransactionCPPTime);
    return performanceCounters;
  }

  private class MountItemDispatchListener implements MountItemDispatcher.ItemDispatchListener {
    @Override
    public void didDispatchMountItems() {
      for (UIManagerListener listener : mListeners) {
        listener.didDispatchMountItems(FabricUIManager.this);
      }
    }
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
        mMountItemDispatcher.dispatchPreMountItems(frameTimeNanos);
        mMountItemDispatcher.tryDispatchMountItems();
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
