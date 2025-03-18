/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static com.facebook.infer.annotation.ThreadConfined.ANY;
import static com.facebook.infer.annotation.ThreadConfined.UI;
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
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.react.bridge.ColorPropConverter;
import com.facebook.react.bridge.GuardedRunnable;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UIManagerListener;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.common.mapbuffer.ReadableMapBuffer;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.fabric.internal.interop.InteropUIBlockListener;
import com.facebook.react.fabric.interop.UIBlock;
import com.facebook.react.fabric.interop.UIBlockViewResolver;
import com.facebook.react.fabric.mounting.MountItemDispatcher;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.SurfaceMountingManager;
import com.facebook.react.fabric.mounting.mountitems.BatchMountItem;
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItemFactory;
import com.facebook.react.interfaces.fabric.SurfaceHandler;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.internal.interop.InteropEventEmitter;
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
import com.facebook.react.uimanager.events.BatchEventDispatchedListener;
import com.facebook.react.uimanager.events.EventCategoryDef;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.FabricEventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.uimanager.events.SynchronousEventReceiver;
import com.facebook.react.views.text.TextLayoutManager;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * We instruct ProGuard not to strip out any fields or methods, because many of these methods are
 * only called through the JNI from Cxx so it appears that most of this class is "unused".
 */
@SuppressLint("MissingNativeLoadLibrary")
@DoNotStripAny
public class FabricUIManager
    implements UIManager, LifecycleEventListener, UIBlockViewResolver, SynchronousEventReceiver {
  public static final String TAG = FabricUIManager.class.getSimpleName();

  // The IS_DEVELOPMENT_ENVIRONMENT variable is used to log extra data when running fabric in a
  // development environment. DO NOT ENABLE THIS ON PRODUCTION OR YOU WILL BE FIRED!
  public static final boolean IS_DEVELOPMENT_ENVIRONMENT = false && ReactBuildConfig.DEBUG;
  public DevToolsReactPerfLogger mDevToolsReactPerfLogger;

  private static final DevToolsReactPerfLogger.DevToolsReactPerfLoggerListener FABRIC_PERF_LOGGER =
      commitPoint -> {
        long commitDuration = commitPoint.getCommitDuration();
        long layoutDuration = commitPoint.getLayoutDuration();
        long diffDuration = commitPoint.getDiffDuration();
        long transactionEndDuration = commitPoint.getTransactionEndDuration();
        long batchExecutionDuration = commitPoint.getBatchExecutionDuration();

        DevToolsReactPerfLogger.mStreamingCommitStats.add(commitDuration);
        DevToolsReactPerfLogger.mStreamingLayoutStats.add(layoutDuration);
        DevToolsReactPerfLogger.mStreamingDiffStats.add(diffDuration);
        DevToolsReactPerfLogger.mStreamingTransactionEndStats.add(transactionEndDuration);
        DevToolsReactPerfLogger.mStreamingBatchExecutionStats.add(batchExecutionDuration);

        FLog.i(
            TAG,
            "Statistics of Fabric commit #%d:\n"
                + " - Total commit time: %d ms. Avg: %.2f. Median: %.2f ms. Max: %d ms.\n"
                + " - Layout time: %d ms. Avg: %.2f. Median: %.2f ms. Max: %d ms.\n"
                + " - Diffing time: %d ms. Avg: %.2f. Median: %.2f ms. Max: %d ms.\n"
                + " - FinishTransaction (Diffing + JNI serialization): %d ms. Avg: %.2f. Median:"
                + " %.2f ms. Max: %d ms.\n"
                + " - Mounting: %d ms. Avg: %.2f. Median: %.2f ms. Max: %d ms.\n",
            commitPoint.getCommitNumber(),
            commitDuration,
            DevToolsReactPerfLogger.mStreamingCommitStats.getAverage(),
            DevToolsReactPerfLogger.mStreamingCommitStats.getMedian(),
            DevToolsReactPerfLogger.mStreamingCommitStats.getMax(),
            layoutDuration,
            DevToolsReactPerfLogger.mStreamingLayoutStats.getAverage(),
            DevToolsReactPerfLogger.mStreamingLayoutStats.getMedian(),
            DevToolsReactPerfLogger.mStreamingLayoutStats.getMax(),
            diffDuration,
            DevToolsReactPerfLogger.mStreamingDiffStats.getAverage(),
            DevToolsReactPerfLogger.mStreamingDiffStats.getMedian(),
            DevToolsReactPerfLogger.mStreamingDiffStats.getMax(),
            transactionEndDuration,
            DevToolsReactPerfLogger.mStreamingTransactionEndStats.getAverage(),
            DevToolsReactPerfLogger.mStreamingTransactionEndStats.getMedian(),
            DevToolsReactPerfLogger.mStreamingTransactionEndStats.getMax(),
            batchExecutionDuration,
            DevToolsReactPerfLogger.mStreamingBatchExecutionStats.getAverage(),
            DevToolsReactPerfLogger.mStreamingBatchExecutionStats.getMedian(),
            DevToolsReactPerfLogger.mStreamingBatchExecutionStats.getMax());
      };

  static {
    FabricSoLoader.staticInit();
  }

  @Nullable private Binding mBinding;
  @NonNull private final ReactApplicationContext mReactApplicationContext;
  @NonNull private final MountingManager mMountingManager;
  @NonNull private final EventDispatcher mEventDispatcher;
  @NonNull private final MountItemDispatcher mMountItemDispatcher;
  @NonNull private final ViewManagerRegistry mViewManagerRegistry;

  @NonNull private final BatchEventDispatchedListener mBatchEventDispatchedListener;

  @NonNull
  private final CopyOnWriteArrayList<UIManagerListener> mListeners = new CopyOnWriteArrayList<>();

  private boolean mMountNotificationScheduled = false;
  private List<Integer> mSurfaceIdsWithPendingMountNotification = new ArrayList<>();

  @ThreadConfined(UI)
  @NonNull
  private final DispatchUIFrameCallback mDispatchUIFrameCallback;

  /** Set of events sent synchronously during the current frame render. Cleared after each frame. */
  private final Set<SynchronousEvent> mSynchronousEvents = new HashSet<>();

  /**
   * This is used to keep track of whether or not the FabricUIManager has been destroyed. Once the
   * Catalyst instance is being destroyed, we should cease all operation here.
   */
  private volatile boolean mDestroyed = false;

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

  private final MountingManager.MountItemExecutor mMountItemExecutor =
      new MountingManager.MountItemExecutor() {
        @Override
        public void executeItems(Queue<MountItem> items) {
          // This executor can be technically accessed before the dispatcher is created,
          // but if that happens, something is terribly wrong
          mMountItemDispatcher.dispatchMountItems(items);
        }
      };

  // Interop UIManagerListener used to support addUIBlock and prependUIBlock.
  // It's initialized only when addUIBlock or prependUIBlock is called the first time.
  @Nullable private InteropUIBlockListener mInteropUIBlockListener;

  public FabricUIManager(
      @NonNull ReactApplicationContext reactContext,
      @NonNull ViewManagerRegistry viewManagerRegistry,
      @NonNull BatchEventDispatchedListener batchEventDispatchedListener) {
    mDispatchUIFrameCallback = new DispatchUIFrameCallback(reactContext);
    mReactApplicationContext = reactContext;
    mMountingManager = new MountingManager(viewManagerRegistry, mMountItemExecutor);
    mMountItemDispatcher =
        new MountItemDispatcher(mMountingManager, new MountItemDispatchListener());
    mEventDispatcher = new FabricEventDispatcher(reactContext);
    mBatchEventDispatchedListener = batchEventDispatchedListener;
    mReactApplicationContext.addLifecycleEventListener(this);

    mViewManagerRegistry = viewManagerRegistry;
    mReactApplicationContext.registerComponentCallbacks(viewManagerRegistry);
  }

  @Override
  @UiThread
  @ThreadConfined(UI)
  @Deprecated
  public <T extends View> int addRootView(final T rootView, final WritableMap initialProps) {
    ReactSoftExceptionLogger.logSoftException(
        TAG,
        new IllegalViewOperationException(
            "Do not call addRootView in Fabric; it is unsupported. Call startSurface instead."));

    ReactRoot reactRootView = (ReactRoot) rootView;
    final int rootTag = reactRootView.getRootViewTag();

    ThemedReactContext reactContext =
        new ThemedReactContext(
            mReactApplicationContext, rootView.getContext(), reactRootView.getSurfaceID(), rootTag);
    mMountingManager.startSurface(rootTag, reactContext, rootView);
    String moduleName = reactRootView.getJSModuleName();
    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      FLog.d(TAG, "Starting surface for module: %s and reactTag: %d", moduleName, rootTag);
    }
    mBinding.startSurface(rootTag, moduleName, (NativeMap) initialProps);
    return rootTag;
  }

  /**
   * This API returns metadata associated to the React Component that rendered the Android View
   * received as a parameter.
   *
   * @param surfaceId {@link int} that represents the surfaceId for the View received as a
   *     parameter. In practice surfaceId can be retrieved calling the {@link View#getId()} method
   *     on the {@link ReactRoot} that holds the View received as a second parameter.
   * @param view {@link View} view that will be used to retrieve the React view hierarchy metadata.
   * @return a {@link ReadableMap} that contains metadata associated to the React Component that
   *     rendered the Android View received as a parameter. For more details about the keys stored
   *     in the {@link ReadableMap} refer to the "getInspectorDataForInstance" method from
   *     jni/react/fabric/Binding.cpp file.
   */
  @UiThread
  @ThreadConfined(UI)
  public ReadableMap getInspectorDataForInstance(final int surfaceId, final View view) {
    UiThreadUtil.assertOnUiThread();
    int reactTag = view.getId();

    EventEmitterWrapper eventEmitter = mMountingManager.getEventEmitter(surfaceId, reactTag);
    return mBinding.getInspectorDataForInstance(eventEmitter);
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
    final int rootTag = ((ReactRoot) rootView).getRootViewTag();
    Context context = rootView.getContext();
    ThemedReactContext reactContext =
        new ThemedReactContext(mReactApplicationContext, context, moduleName, rootTag);
    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      FLog.d(TAG, "Starting surface for module: %s and reactTag: %d", moduleName, rootTag);
    }
    mMountingManager.startSurface(rootTag, reactContext, rootView);

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

  public void startSurface(
      final SurfaceHandler surfaceHandler, final Context context, final @Nullable View rootView) {
    final int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();

    ThemedReactContext reactContext =
        new ThemedReactContext(
            mReactApplicationContext, context, surfaceHandler.getModuleName(), rootTag);
    mMountingManager.startSurface(rootTag, reactContext, rootView);

    surfaceHandler.setSurfaceId(rootTag);
    if (surfaceHandler instanceof SurfaceHandlerBinding) {
      mBinding.registerSurface((SurfaceHandlerBinding) surfaceHandler);
    }
    surfaceHandler.setMountable(rootView != null);
    surfaceHandler.start();
  }

  public void attachRootView(final SurfaceHandler surfaceHandler, final View rootView) {
    ThemedReactContext reactContext =
        new ThemedReactContext(
            mReactApplicationContext,
            rootView.getContext(),
            surfaceHandler.getModuleName(),
            surfaceHandler.getSurfaceId());
    mMountingManager.attachRootView(surfaceHandler.getSurfaceId(), rootView, reactContext);

    surfaceHandler.setMountable(true);
  }

  public void stopSurface(final SurfaceHandler surfaceHandler) {
    if (!surfaceHandler.isRunning()) {
      ReactSoftExceptionLogger.logSoftException(
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
    mEventDispatcher.addBatchEventDispatchedListener(mBatchEventDispatchedListener);
    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      mDevToolsReactPerfLogger = new DevToolsReactPerfLogger();
      mDevToolsReactPerfLogger.addDevToolsReactPerfLoggerListener(FABRIC_PERF_LOGGER);

      ReactMarker.addFabricListener(mDevToolsReactPerfLogger);
    }
    if (ReactNativeFeatureFlags.useFabricInterop()) {
      InteropEventEmitter interopEventEmitter = new InteropEventEmitter(mReactApplicationContext);
      mReactApplicationContext.internal_registerInteropModule(
          RCTEventEmitter.class, interopEventEmitter);
    }
  }

  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public void invalidate() {
    FLog.i(TAG, "FabricUIManager.invalidate");

    if (mDevToolsReactPerfLogger != null) {
      mDevToolsReactPerfLogger.removeDevToolsReactPerfLoggerListener(FABRIC_PERF_LOGGER);
      ReactMarker.removeFabricListener(mDevToolsReactPerfLogger);
    }

    if (mDestroyed) {
      ReactSoftExceptionLogger.logSoftException(
          FabricUIManager.TAG, new IllegalStateException("Cannot double-destroy FabricUIManager"));
      return;
    }

    mDestroyed = true;

    mEventDispatcher.removeBatchEventDispatchedListener(mBatchEventDispatchedListener);
    mEventDispatcher.unregisterEventEmitter(FABRIC);

    mReactApplicationContext.unregisterComponentCallbacks(mViewManagerRegistry);
    mViewManagerRegistry.invalidate();

    // Remove lifecycle listeners (onHostResume, onHostPause) since the FabricUIManager is going
    // away. Then stop the mDispatchUIFrameCallback false will cause the choreographer
    // callbacks to stop firing.
    mReactApplicationContext.removeLifecycleEventListener(this);
    onHostPause();

    mBinding.unregister();
    mBinding = null;

    ViewManagerPropertyUpdater.clear();

    // When StaticViewConfigs is enabled, FabriUIManager is
    // responsible for initializing and deallocating EventDispatcher. StaticViewConfigs is enabled
    // only in Bridgeless for now.
    // TODO T83943316: Remove this IF once StaticViewConfigs are enabled by default
    if (!ReactFeatureFlags.enableBridgelessArchitecture) {
      mEventDispatcher.onCatalystInstanceDestroyed();
    }
  }

  @Override
  public void markActiveTouchForTag(int surfaceId, int reactTag) {
    SurfaceMountingManager surfaceMountingManager = mMountingManager.getSurfaceManager(surfaceId);
    if (surfaceMountingManager != null) {
      surfaceMountingManager.markActiveTouchForTag(reactTag);
    }
  }

  @Override
  public void sweepActiveTouchForTag(int surfaceId, int reactTag) {
    SurfaceMountingManager surfaceMountingManager = mMountingManager.getSurfaceManager(surfaceId);
    if (surfaceMountingManager != null) {
      surfaceMountingManager.sweepActiveTouchForTag(reactTag);
    }
  }

  /**
   * Method added to Fabric for backward compatibility reasons, as users on Paper could call
   * [addUiBlock] and [prependUiBlock] on UIManagerModule.
   */
  public void addUIBlock(UIBlock block) {
    if (ReactNativeFeatureFlags.useFabricInterop()) {
      InteropUIBlockListener listener = getInteropUIBlockListener();
      listener.addUIBlock(block);
    }
  }

  /**
   * Method added to Fabric for backward compatibility reasons, as users on Paper could call
   * [addUiBlock] and [prependUiBlock] on UIManagerModule.
   */
  public void prependUIBlock(UIBlock block) {
    if (ReactNativeFeatureFlags.useFabricInterop()) {
      InteropUIBlockListener listener = getInteropUIBlockListener();
      listener.prependUIBlock(block);
    }
  }

  @NonNull
  private InteropUIBlockListener getInteropUIBlockListener() {
    if (mInteropUIBlockListener == null) {
      mInteropUIBlockListener = new InteropUIBlockListener();
      addUIManagerEventListener(mInteropUIBlockListener);
    }
    return mInteropUIBlockListener;
  }

  @SuppressWarnings("unused")
  private NativeArray measureLines(
      ReadableMapBuffer attributedString,
      ReadableMapBuffer paragraphAttributes,
      float width,
      float height) {
    return (NativeArray)
        TextLayoutManager.measureLines(
            mReactApplicationContext,
            attributedString,
            paragraphAttributes,
            PixelUtil.toPixelFromDIP(width),
            PixelUtil.toPixelFromDIP(height));
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
  public int getColor(int surfaceId, String[] resourcePaths) {
    ThemedReactContext context =
        mMountingManager.getSurfaceManagerEnforced(surfaceId, "getColor").getContext();
    // Surface may have been stopped
    if (context == null) {
      return 0;
    }

    for (String resourcePath : resourcePaths) {
      Integer color = ColorPropConverter.resolveResourcePath(context, resourcePath);
      if (color != null) {
        return color;
      }
    }
    return 0;
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
      ReadableMapBuffer localData,
      ReadableMapBuffer props,
      @Nullable ReadableMapBuffer state,
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
    return mMountingManager.measureMapBuffer(
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
  public boolean getThemeData(int surfaceId, float[] defaultTextInputPadding) {
    Context context =
        mMountingManager.getSurfaceManagerEnforced(surfaceId, "getThemeData").getContext();
    if (context == null) {
      FLog.w(TAG, "\"themedReactContext\" is null when call \"getThemeData\"");
      return false;
    }

    float[] defaultTextInputPaddingForTheme = UIManagerHelper.getDefaultTextInputPadding(context);
    defaultTextInputPadding[0] = defaultTextInputPaddingForTheme[PADDING_START_INDEX];
    defaultTextInputPadding[1] = defaultTextInputPaddingForTheme[PADDING_END_INDEX];
    defaultTextInputPadding[2] = defaultTextInputPaddingForTheme[PADDING_TOP_INDEX];
    defaultTextInputPadding[3] = defaultTextInputPaddingForTheme[PADDING_BOTTOM_INDEX];
    return true;
  }

  @Override
  public void addUIManagerEventListener(UIManagerListener listener) {
    mListeners.add(listener);
  }

  @Override
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

          @NonNull
          @Override
          public String toString() {
            String propsString =
                IS_DEVELOPMENT_ENVIRONMENT ? props.toHashMap().toString() : "<hidden>";
            return String.format("SYNC UPDATE PROPS [%d]: %s", reactTag, propsString);
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

    if (ReactNativeFeatureFlags.enableFabricLogs()) {
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
      @Nullable Object props,
      @Nullable Object stateWrapper,
      boolean isLayoutable) {
    mMountItemDispatcher.addPreAllocateMountItem(
        MountItemFactory.createPreAllocateViewMountItem(
            rootTag,
            reactTag,
            componentName,
            (ReadableMap) props,
            (StateWrapper) stateWrapper,
            isLayoutable));
  }

  @SuppressLint("NotInvokedPrivateMethod")
  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private boolean isOnMainThread() {
    return UiThreadUtil.isOnUiThread();
  }

  @SuppressWarnings("unused")
  @AnyThread
  @ThreadConfined(ANY)
  private MountItem createIntBufferBatchMountItem(
      int rootTag, @Nullable int[] intBuffer, @Nullable Object[] objBuffer, int commitNumber) {
    return MountItemFactory.createIntBufferBatchMountItem(
        rootTag,
        intBuffer == null ? new int[0] : intBuffer,
        objBuffer == null ? new Object[0] : objBuffer,
        commitNumber);
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
      long finishTransactionEndTime,
      int affectedLayoutNodesCount) {
    // When Binding.cpp calls scheduleMountItems during a commit phase, it always calls with
    // a BatchMountItem. No other sites call into this with a BatchMountItem, and Binding.cpp only
    // calls scheduleMountItems with a BatchMountItem.
    long scheduleMountItemStartTime = SystemClock.uptimeMillis();
    boolean isBatchMountItem = mountItem instanceof BatchMountItem;
    boolean shouldSchedule =
        (isBatchMountItem && !((BatchMountItem) mountItem).isBatchEmpty())
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
      mFinishTransactionTime = scheduleMountItemStartTime - finishTransactionStartTime;
      mDispatchViewUpdatesTime = SystemClock.uptimeMillis();
    }

    if (shouldSchedule) {
      mMountItemDispatcher.addMountItem(mountItem);
      Runnable runnable =
          new GuardedRunnable(mReactApplicationContext) {
            @Override
            public void runGuarded() {
              mMountItemDispatcher.tryDispatchMountItems();
            }
          };
      if (UiThreadUtil.isOnUiThread()) {
        runnable.run();
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
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_LAYOUT_AFFECTED_NODES,
          null,
          commitNumber,
          layoutEndTime,
          affectedLayoutNodesCount);
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

    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      FLog.d(TAG, "Updating Root Layout Specs for [%d]", surfaceId);
    }

    SurfaceMountingManager surfaceMountingManager = mMountingManager.getSurfaceManager(surfaceId);

    // TODO T83615646: make this a hard-crash in the future.
    if (surfaceMountingManager == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "Cannot updateRootLayoutSpecs on surfaceId that does not exist: " + surfaceId));
      return;
    }

    Context context = surfaceMountingManager.getContext();
    boolean isRTL = false;
    boolean doLeftAndRightSwapInRTL = false;
    if (context != null) {
      isRTL = I18nUtil.getInstance().isRTL(context);
      doLeftAndRightSwapInRTL = I18nUtil.getInstance().doLeftAndRightSwapInRTL(context);
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
  public View resolveView(int reactTag) {
    UiThreadUtil.assertOnUiThread();

    SurfaceMountingManager surfaceManager = mMountingManager.getSurfaceManagerForView(reactTag);
    return surfaceManager == null ? null : surfaceManager.getView(reactTag);
  }

  @Override
  public void receiveEvent(int reactTag, String eventName, @Nullable WritableMap params) {
    receiveEvent(View.NO_ID, reactTag, eventName, false, params, EventCategoryDef.UNSPECIFIED);
  }

  @Override
  public void receiveEvent(
      int surfaceId, int reactTag, String eventName, @Nullable WritableMap params) {
    receiveEvent(surfaceId, reactTag, eventName, false, params, EventCategoryDef.UNSPECIFIED);
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
   * @param eventCategory
   */
  public void receiveEvent(
      int surfaceId,
      int reactTag,
      String eventName,
      boolean canCoalesceEvent,
      @Nullable WritableMap params,
      @EventCategoryDef int eventCategory) {
    receiveEvent(surfaceId, reactTag, eventName, canCoalesceEvent, params, eventCategory, false);
  }

  @Override
  public void receiveEvent(
      int surfaceId,
      int reactTag,
      String eventName,
      boolean canCoalesceEvent,
      @Nullable WritableMap params,
      @EventCategoryDef int eventCategory,
      boolean experimental_isSynchronous) {

    if (ReactBuildConfig.DEBUG && surfaceId == View.NO_ID) {
      FLog.d(TAG, "Emitted event without surfaceId: [%d] %s", reactTag, eventName);
    }

    if (mDestroyed) {
      FLog.e(TAG, "Attempted to receiveEvent after destruction");
      return;
    }

    EventEmitterWrapper eventEmitter = mMountingManager.getEventEmitter(surfaceId, reactTag);
    if (eventEmitter == null) {
      if (mMountingManager.getViewExists(reactTag)) {
        // The view is preallocated and created. However, it hasn't been mounted yet. We will have
        // access to the event emitter later when the view is mounted. For now just save the event
        // in the view state and trigger it later.
        mMountingManager.enqueuePendingEvent(
            surfaceId, reactTag, eventName, canCoalesceEvent, params, eventCategory);
      } else {
        // This can happen if the view has disappeared from the screen (because of async events)
        FLog.d(TAG, "Unable to invoke event: " + eventName + " for reactTag: " + reactTag);
      }
      return;
    }

    if (experimental_isSynchronous) {
      // add() returns true only if there are no equivalent events already in the set
      boolean firstEventForFrame =
          mSynchronousEvents.add(new SynchronousEvent(surfaceId, reactTag, eventName));
      if (firstEventForFrame) {
        eventEmitter.dispatchEventSynchronously(eventName, params);
      }
    } else {
      if (canCoalesceEvent) {
        eventEmitter.dispatchUnique(eventName, params);
      } else {
        eventEmitter.dispatch(eventName, params, eventCategory);
      }
    }
  }

  @Override
  public void onHostResume() {
    mDispatchUIFrameCallback.resume();
  }

  @Override
  @NonNull
  public EventDispatcher getEventDispatcher() {
    return mEventDispatcher;
  }

  @Override
  public void onHostPause() {
    mDispatchUIFrameCallback.pause();
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
        "dispatchCommand called without surfaceId - Fabric dispatchCommand must be called through"
            + " Fabric JSI API");
  }

  @Override
  @Deprecated
  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int reactTag, final String commandId, @Nullable final ReadableArray commandArgs) {
    throw new UnsupportedOperationException(
        "dispatchCommand called without surfaceId - Fabric dispatchCommand must be called through"
            + " Fabric JSI API");
  }

  @Deprecated
  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int surfaceId,
      final int reactTag,
      final int commandId,
      @Nullable final ReadableArray commandArgs) {
    mMountItemDispatcher.addViewCommandMountItem(
        MountItemFactory.createDispatchCommandMountItem(
            surfaceId, reactTag, commandId, commandArgs));
  }

  @AnyThread
  @ThreadConfined(ANY)
  public void dispatchCommand(
      final int surfaceId,
      final int reactTag,
      final String commandId,
      @Nullable final ReadableArray commandArgs) {
    if (ReactNativeFeatureFlags.useFabricInterop()) {
      // For Fabric Interop, we check if the commandId is an integer. If it is, we use the integer
      // overload of dispatchCommand. Otherwise, we use the string overload.
      // and the events won't be correctly dispatched.
      mMountItemDispatcher.addViewCommandMountItem(
          createDispatchCommandMountItemForInterop(surfaceId, reactTag, commandId, commandArgs));
    } else {
      mMountItemDispatcher.addViewCommandMountItem(
          MountItemFactory.createDispatchCommandMountItem(
              surfaceId, reactTag, commandId, commandArgs));
    }
  }

  @Override
  @AnyThread
  @ThreadConfined(ANY)
  public void sendAccessibilityEvent(int reactTag, int eventType) {
    // Can be called from native, not just JS - we need to migrate the native callsites
    // before removing this entirely.
    mMountItemDispatcher.addMountItem(
        MountItemFactory.createSendAccessibilityEventMountItem(View.NO_ID, reactTag, eventType));
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
    } else if ("viewHoverEnter".equals(eventTypeJS)) {
      eventType = AccessibilityEvent.TYPE_VIEW_HOVER_ENTER;
    } else {
      throw new IllegalArgumentException(
          "sendAccessibilityEventFromJS: invalid eventType " + eventTypeJS);
    }
    mMountItemDispatcher.addMountItem(
        MountItemFactory.createSendAccessibilityEventMountItem(surfaceId, reactTag, eventType));
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
    mMountItemDispatcher.addMountItem(
        new MountItem() {
          @Override
          public void execute(@NonNull MountingManager mountingManager) {
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

          @NonNull
          @SuppressLint("DefaultLocale")
          @Override
          public String toString() {
            return String.format("SET_JS_RESPONDER [%d] [surface:%d]", reactTag, surfaceId);
          }
        });
  }

  /**
   * Clears the JS Responder specified by {@link #setJSResponder}. After this method is called, all
   * the touch events are going to be handled by JS.
   */
  public void clearJSResponder() {
    mMountItemDispatcher.addMountItem(
        new MountItem() {
          @Override
          public void execute(@NonNull MountingManager mountingManager) {
            mountingManager.clearJSResponder();
          }

          @Override
          public int getSurfaceId() {
            return View.NO_ID;
          }

          @NonNull
          @Override
          public String toString() {
            return "CLEAR_JS_RESPONDER";
          }
        });
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
    @UiThread
    @ThreadConfined(UI)
    @Override
    public void willMountItems(@Nullable List<MountItem> mountItems) {
      for (UIManagerListener listener : mListeners) {
        listener.willMountItems(FabricUIManager.this);
      }
    }

    @UiThread
    @ThreadConfined(UI)
    @Override
    public void didMountItems(@Nullable List<MountItem> mountItems) {
      for (UIManagerListener listener : mListeners) {
        listener.didMountItems(FabricUIManager.this);
      }

      if (mountItems == null || mountItems.isEmpty()) {
        return;
      }

      // Collect surface IDs for all the mount items
      for (MountItem mountItem : mountItems) {
        if (mountItem != null
            && !mSurfaceIdsWithPendingMountNotification.contains(mountItem.getSurfaceId())) {
          mSurfaceIdsWithPendingMountNotification.add(mountItem.getSurfaceId());
        }
      }

      if (!mMountNotificationScheduled && !mSurfaceIdsWithPendingMountNotification.isEmpty()) {
        mMountNotificationScheduled = true;

        // Notify mount when the effects are visible and prevent mount hooks to
        // delay paint.
        UiThreadUtil.getUiThreadHandler()
            .postAtFrontOfQueue(
                new Runnable() {
                  @Override
                  public void run() {
                    mMountNotificationScheduled = false;

                    // Create a copy in case mount hooks trigger more mutations
                    final List<Integer> surfaceIdsToReportMount =
                        mSurfaceIdsWithPendingMountNotification;
                    mSurfaceIdsWithPendingMountNotification = new ArrayList<>();

                    final @Nullable Binding binding = mBinding;
                    if (binding == null || mDestroyed) {
                      return;
                    }

                    for (int surfaceId : surfaceIdsToReportMount) {
                      binding.reportMount(surfaceId);
                    }
                  }
                });
      }
    }

    @Override
    public void didDispatchMountItems() {
      for (UIManagerListener listener : mListeners) {
        listener.didDispatchMountItems(FabricUIManager.this);
      }
    }
  }

  /**
   * Util function that takes care of handling commands for Fabric Interop. If the command is a
   * string that represents a number (say "42"), it will be parsed as an integer and the
   * corresponding dispatch command mount item will be created.
   */
  /* package */ DispatchCommandMountItem createDispatchCommandMountItemForInterop(
      final int surfaceId,
      final int reactTag,
      final String commandId,
      @Nullable final ReadableArray commandArgs) {
    try {
      int commandIdInteger = Integer.parseInt(commandId);
      return MountItemFactory.createDispatchCommandMountItem(
          surfaceId, reactTag, commandIdInteger, commandArgs);
    } catch (NumberFormatException e) {
      return MountItemFactory.createDispatchCommandMountItem(
          surfaceId, reactTag, commandId, commandArgs);
    }
  }

  private class DispatchUIFrameCallback extends GuardedFrameCallback {

    private volatile boolean mIsMountingEnabled = true;

    @ThreadConfined(UI)
    private boolean mShouldSchedule = false;

    @ThreadConfined(UI)
    private boolean mIsScheduled = false;

    private DispatchUIFrameCallback(@NonNull ReactContext reactContext) {
      super(reactContext);
    }

    @UiThread
    @ThreadConfined(UI)
    private void schedule() {
      if (!mIsScheduled && mShouldSchedule) {
        mIsScheduled = true;
        ReactChoreographer.getInstance()
            .postFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, this);
      }
    }

    @UiThread
    @ThreadConfined(UI)
    void resume() {
      mShouldSchedule = true;
      schedule();
    }

    @UiThread
    @ThreadConfined(UI)
    void pause() {
      ReactChoreographer.getInstance()
          .removeFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, this);
      mShouldSchedule = false;
      mIsScheduled = false;
    }

    @Override
    @UiThread
    @ThreadConfined(UI)
    public void doFrameGuarded(long frameTimeNanos) {
      mIsScheduled = false;

      if (!mIsMountingEnabled) {
        FLog.w(TAG, "Not flushing pending UI operations: exception was previously thrown");
        return;
      }

      if (mDestroyed) {
        FLog.w(TAG, "Not flushing pending UI operations: FabricUIManager is destroyed");
        return;
      }

      // Drive any animations from C++.
      // There is a race condition here between getting/setting
      // `mDriveCxxAnimations` which shouldn't matter; it's safe to call
      // the mBinding method, unless mBinding has gone away.
      if (mDriveCxxAnimations && mBinding != null) {
        mBinding.driveCxxAnimations();
      }

      if (ReactNativeFeatureFlags.useOptimisedViewPreallocationOnAndroid() && mBinding != null) {
        mBinding.drainPreallocateViewsQueue();
      }

      try {
        // First, execute as many pre mount items as we can within frameTimeNanos time.
        // If not all pre mount items were executed, following may happen:
        //   1. In case there are view commands or mount items in MountItemDispatcher: execute
        //   remaining pre mount items.
        //   2. In case there are no view commands or mount items, wait until next frame.
        mMountItemDispatcher.dispatchPreMountItems(frameTimeNanos);
        mMountItemDispatcher.tryDispatchMountItems();
      } catch (Exception ex) {
        FLog.e(TAG, "Exception thrown when executing UIFrameGuarded", ex);
        mIsMountingEnabled = false;
        throw ex;
      } finally {
        schedule();
      }

      mSynchronousEvents.clear();
    }
  }
}
