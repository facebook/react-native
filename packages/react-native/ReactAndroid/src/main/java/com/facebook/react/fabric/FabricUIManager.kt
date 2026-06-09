/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")

package com.facebook.react.fabric

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Point
import android.os.SystemClock
import android.view.View
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.AnyThread
import androidx.annotation.UiThread
import androidx.core.view.ViewCompat.FocusDirection
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.NativeArray
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.fabric.events.FabricEventEmitter
import com.facebook.react.fabric.internal.interop.InteropUIBlockListener
import com.facebook.react.fabric.interop.UIBlock
import com.facebook.react.fabric.interop.UIBlockViewResolver
import com.facebook.react.fabric.mounting.LayoutMetricsConversions
import com.facebook.react.fabric.mounting.MountItemDispatcher
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.fabric.mounting.mountitems.BatchMountItem
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.fabric.mounting.mountitems.MountItemFactory
import com.facebook.react.fabric.mounting.mountitems.PrefetchResourcesMountItem
import com.facebook.react.fabric.mounting.mountitems.SynchronousMountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.internal.interop.InteropEventEmitter
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.GuardedFrameCallback
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactRoot
import com.facebook.react.uimanager.ReactRootViewTagGenerator
import com.facebook.react.uimanager.RootViewUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.UIManagerHelper.PADDING_BOTTOM_INDEX
import com.facebook.react.uimanager.UIManagerHelper.PADDING_END_INDEX
import com.facebook.react.uimanager.UIManagerHelper.PADDING_START_INDEX
import com.facebook.react.uimanager.UIManagerHelper.PADDING_TOP_INDEX
import com.facebook.react.uimanager.ViewManagerPropertyUpdater
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.events.BatchEventDispatchedListener
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.FabricEventDispatcher
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.uimanager.events.SynchronousEventReceiver
import com.facebook.react.views.text.PreparedLayout
import com.facebook.react.views.text.ReactTextViewManager
import com.facebook.react.views.text.ReactTextViewManagerCallback
import com.facebook.react.views.text.TextEffectRegistry
import com.facebook.react.views.text.TextLayoutManager
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.CopyOnWriteArrayList

/**
 * We instruct ProGuard not to strip out any fields or methods, because many of these methods are
 * only called through the JNI from Cxx so it appears that most of this class is "unused".
 */
@SuppressLint("MissingNativeLoadLibrary")
@DoNotStripAny
@OptIn(UnstableReactNativeAPI::class)
public open class FabricUIManager(
    private val reactApplicationContext: ReactApplicationContext,
    private val viewManagerRegistry: ViewManagerRegistry,
    batchEventDispatchedListener: BatchEventDispatchedListener,
) : UIManager, LifecycleEventListener, UIBlockViewResolver, SynchronousEventReceiver {

  @JvmField public var devToolsReactPerfLogger: DevToolsReactPerfLogger? = null

  private var uiManagerBinding: FabricUIManagerBinding? = null
  private val mountingManager: MountingManager
  private val _eventDispatcher: FabricEventDispatcher
  private val mountItemDispatcher: MountItemDispatcher

  private val _textEffectRegistry: TextEffectRegistry = TextEffectRegistry()

  private val batchEventDispatchedListener: BatchEventDispatchedListener

  private val listeners: MutableList<UIManagerListener> = CopyOnWriteArrayList()

  private var mountNotificationScheduled: Boolean = false
  private var surfaceIdsWithPendingMountNotification: MutableList<Int> = ArrayList()

  @ThreadConfined(ThreadConfined.UI) private val dispatchUIFrameCallback: DispatchUIFrameCallback

  @ThreadConfined(ThreadConfined.UI)
  private val synchronousEvents: MutableSet<SynchronousEvent> = HashSet()

  private val pendingReactRevisionMerges: ConcurrentLinkedQueue<Int> = ConcurrentLinkedQueue()

  @Volatile private var destroyed: Boolean = false

  private var driveCxxAnimations: Boolean = false

  private var viewTransitionSnapshotManager: ViewTransitionSnapshotManager? = null

  private var dispatchViewUpdatesTime: Long = 0L
  private var commitStartTime: Long = 0L
  private var layoutTime: Long = 0L
  private var finishTransactionTime: Long = 0L
  private var finishTransactionCPPTime: Long = 0L

  private var currentSynchronousCommitNumber: Int = 10000

  @Suppress("UNCHECKED_CAST")
  private val mountItemExecutor: MountingManager.MountItemExecutor =
      MountingManager.MountItemExecutor { items ->
        mountItemDispatcher.dispatchMountItems(items as java.util.Queue<MountItem?>)
      }

  private var interopUIBlockListener: InteropUIBlockListener? = null

  init {
    dispatchUIFrameCallback = DispatchUIFrameCallback(reactApplicationContext)
    mountingManager = MountingManager(viewManagerRegistry, mountItemExecutor)
    mountItemDispatcher = MountItemDispatcher(mountingManager, MountItemDispatchListener())
    _eventDispatcher = FabricEventDispatcher(reactApplicationContext, FabricEventEmitter(this))
    this.batchEventDispatchedListener = batchEventDispatchedListener
    reactApplicationContext.addLifecycleEventListener(this)
    reactApplicationContext.registerComponentCallbacks(viewManagerRegistry)
  }

  @UiThread
  @ThreadConfined(ThreadConfined.UI)
  @Deprecated("Do not call addRootView in Fabric; it is unsupported. Call startSurface instead.")
  override fun <T : View> addRootView(rootView: T, initialProps: WritableMap?): Int {
    ReactSoftExceptionLogger.logSoftException(
        TAG,
        IllegalViewOperationException(
            "Do not call addRootView in Fabric; it is unsupported. Call startSurface instead."
        ),
    )

    val reactRootView = rootView as ReactRoot
    val rootTag = reactRootView.getRootViewTag()

    val reactContext =
        ThemedReactContext(
            reactApplicationContext,
            rootView.context,
            reactRootView.getSurfaceID(),
            rootTag,
        )
    mountingManager.startSurface(rootTag, reactContext, rootView)
    val moduleName = reactRootView.getJSModuleName()
    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      FLog.d(TAG, "Starting surface for module: %s and reactTag: %d", moduleName, rootTag)
    }
    val binding = checkNotNull(uiManagerBinding) { "Binding in FabricUIManager is null" }
    binding.startSurface(rootTag, moduleName, initialProps as NativeMap?)
    return rootTag
  }

  /**
   * Find the next focusable element's id and position relative to the parent from the shadow tree
   * based on the current focusable element and the direction.
   *
   * @return A NextFocusableNode object where the 'id' is the reactId/Tag of the next focusable
   *   view, returns null if no view could be found
   */
  public fun findNextFocusableElement(
      parentTag: Int,
      focusedTag: Int,
      @FocusDirection direction: Int,
  ): Int? {
    val binding = uiManagerBinding ?: return null

    val generalizedDirection: Int =
        when (direction) {
          View.FOCUS_DOWN -> 0
          View.FOCUS_UP -> 1
          View.FOCUS_RIGHT -> 2
          View.FOCUS_LEFT -> 3
          View.FOCUS_FORWARD -> 4
          View.FOCUS_BACKWARD -> 5
          else -> return null
        }

    val serializedNextFocusableNodeMetrics =
        binding.findNextFocusableElement(parentTag, focusedTag, generalizedDirection)

    if (serializedNextFocusableNodeMetrics == -1) {
      return null
    }

    return serializedNextFocusableNodeMetrics
  }

  public fun getRelativeAncestorList(rootTag: Int, childTag: Int): IntArray? {
    return uiManagerBinding?.getRelativeAncestorList(rootTag, childTag)
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  override fun <T : View?> startSurface(
      rootView: T,
      moduleName: String,
      initialProps: WritableMap?,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
  ): Int {
    val rootTag = (rootView as ReactRoot).getRootViewTag()
    val context: Context = (rootView as View).context
    val reactContext = ThemedReactContext(reactApplicationContext, context, moduleName, rootTag)
    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      FLog.d(TAG, "Starting surface for module: %s and reactTag: %d", moduleName, rootTag)
    }
    mountingManager.startSurface(rootTag, reactContext, rootView as View)

    @SuppressLint("WrongThread")
    val viewportOffset =
        if (UiThreadUtil.isOnUiThread()) RootViewUtil.getViewportOffset(rootView as View)
        else Point(0, 0)

    val binding = checkNotNull(uiManagerBinding) { "Binding in FabricUIManager is null" }
    binding.startSurfaceWithConstraints(
        rootTag,
        moduleName,
        initialProps as NativeMap?,
        LayoutMetricsConversions.getMinSize(widthMeasureSpec),
        LayoutMetricsConversions.getMaxSize(widthMeasureSpec),
        LayoutMetricsConversions.getMinSize(heightMeasureSpec),
        LayoutMetricsConversions.getMaxSize(heightMeasureSpec),
        viewportOffset.x.toFloat(),
        viewportOffset.y.toFloat(),
        I18nUtil.getInstance().isRTL(context),
        I18nUtil.getInstance().doLeftAndRightSwapInRTL(context),
    )
    return rootTag
  }

  internal fun startSurface(
      surfaceHandler: SurfaceHandlerBinding,
      context: Context,
      rootView: View?,
  ) {
    val rootTag =
        if (rootView is ReactRoot) (rootView as ReactRoot).getRootViewTag()
        else ReactRootViewTagGenerator.getNextRootViewTag()

    val reactContext =
        ThemedReactContext(
            reactApplicationContext,
            context,
            surfaceHandler.moduleName,
            rootTag,
        )
    mountingManager.startSurface(rootTag, reactContext, rootView)
    val binding = checkNotNull(uiManagerBinding) { "Binding in FabricUIManager is null" }
    binding.startSurfaceWithSurfaceHandler(rootTag, surfaceHandler, rootView != null)
  }

  internal fun attachRootView(surfaceHandler: SurfaceHandlerBinding, rootView: View) {
    val reactContext =
        ThemedReactContext(
            reactApplicationContext,
            rootView.context,
            surfaceHandler.moduleName,
            surfaceHandler.surfaceId,
        )
    mountingManager.attachRootView(surfaceHandler.surfaceId, rootView, reactContext)

    surfaceHandler.setMountable(true)
  }

  internal fun stopSurface(surfaceHandler: SurfaceHandlerBinding) {
    if (!surfaceHandler.isRunning) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException("Trying to stop surface that hasn't started yet"),
      )
      return
    }

    mountingManager.stopSurface(surfaceHandler.surfaceId)
    val binding = checkNotNull(uiManagerBinding) { "Binding in FabricUIManager is null" }
    binding.stopSurfaceWithSurfaceHandler(surfaceHandler)
  }

  @Suppress("unused")
  public fun onRequestEventBeat() {
    _eventDispatcher.dispatchAllEvents()
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  override fun stopSurface(surfaceId: Int) {
    mountingManager.stopSurface(surfaceId)

    val binding = checkNotNull(uiManagerBinding) { "Binding in FabricUIManager is null" }
    binding.stopSurface(surfaceId)
  }

  override fun initialize() {
    _eventDispatcher.addBatchEventDispatchedListener(batchEventDispatchedListener)
    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      val perfLogger = DevToolsReactPerfLogger()
      devToolsReactPerfLogger = perfLogger
      perfLogger.addDevToolsReactPerfLoggerListener(FABRIC_PERF_LOGGER)

      ReactMarker.addFabricListener(perfLogger)
    }
    if (
        !ReactBuildConfig.UNSTABLE_REMOVE_LEGACY_COMPONENT_INTEROP &&
            ReactNativeNewArchitectureFeatureFlags.useFabricInterop()
    ) {
      val interopEventEmitter = InteropEventEmitter(reactApplicationContext)
      reactApplicationContext.internal_registerInteropModule(
          RCTEventEmitter::class.java,
          interopEventEmitter,
      )
    }
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  override fun invalidate() {
    FLog.i(TAG, "FabricUIManager.invalidate")

    val perfLogger = devToolsReactPerfLogger
    if (perfLogger != null) {
      perfLogger.removeDevToolsReactPerfLoggerListener(FABRIC_PERF_LOGGER)
      ReactMarker.removeFabricListener(perfLogger)
    }

    if (destroyed) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException("Cannot double-destroy FabricUIManager"),
      )
      return
    }

    destroyed = true

    _eventDispatcher.removeBatchEventDispatchedListener(batchEventDispatchedListener)
    _eventDispatcher.invalidate()

    reactApplicationContext.unregisterComponentCallbacks(viewManagerRegistry)
    viewManagerRegistry.invalidate()

    reactApplicationContext.removeLifecycleEventListener(this)
    onHostPause()

    uiManagerBinding?.unregister()
    uiManagerBinding = null

    ViewManagerPropertyUpdater.clear()
  }

  override fun markActiveTouchForTag(surfaceId: Int, reactTag: Int) {
    val surfaceMountingManager: SurfaceMountingManager? =
        mountingManager.getSurfaceManager(surfaceId)
    surfaceMountingManager?.markActiveTouchForTag(reactTag)
  }

  override fun sweepActiveTouchForTag(surfaceId: Int, reactTag: Int) {
    val surfaceMountingManager: SurfaceMountingManager? =
        mountingManager.getSurfaceManager(surfaceId)
    surfaceMountingManager?.sweepActiveTouchForTag(reactTag)
  }

  public fun addUIBlock(block: UIBlock) {
    if (
        !ReactBuildConfig.UNSTABLE_REMOVE_LEGACY_COMPONENT_INTEROP &&
            ReactNativeNewArchitectureFeatureFlags.useFabricInterop()
    ) {
      val listener = getInteropUIBlockListener()
      listener.addUIBlock(block)
    }
  }

  public fun prependUIBlock(block: UIBlock) {
    if (
        !ReactBuildConfig.UNSTABLE_REMOVE_LEGACY_COMPONENT_INTEROP &&
            ReactNativeNewArchitectureFeatureFlags.useFabricInterop()
    ) {
      val listener = getInteropUIBlockListener()
      listener.prependUIBlock(block)
    }
  }

  private fun getInteropUIBlockListener(): InteropUIBlockListener {
    var listener = interopUIBlockListener
    if (listener == null) {
      listener = InteropUIBlockListener()
      interopUIBlockListener = listener
      addUIManagerEventListener(listener)
    }
    return listener
  }

  @Suppress("unused")
  private fun measureLines(
      attributedString: ReadableMapBuffer,
      paragraphAttributes: ReadableMapBuffer,
      width: Float,
      height: Float,
  ): NativeArray {
    val textViewManager = viewManagerRegistry.get(ReactTextViewManager.REACT_CLASS)

    return TextLayoutManager.measureLines(
        reactApplicationContext.assets,
        attributedString,
        paragraphAttributes,
        PixelUtil.toPixelFromDIP(width),
        PixelUtil.toPixelFromDIP(height),
        if (textViewManager is ReactTextViewManagerCallback)
            textViewManager as ReactTextViewManagerCallback
        else null,
        textEffectRegistry,
    ) as NativeArray
  }

  public fun getColor(surfaceId: Int, resourcePaths: Array<String>): Int {
    val context: ThemedReactContext? =
        mountingManager.getSurfaceManagerEnforced(surfaceId, "getColor").context
    if (context == null) {
      return 0
    }

    for (resourcePath in resourcePaths) {
      val color = ColorPropConverter.resolveResourcePath(context, resourcePath)
      if (color != null) {
        return color
      }
    }
    return 0
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  public fun measure(
      surfaceId: Int,
      componentName: String,
      localData: ReadableMap,
      props: ReadableMap,
      state: ReadableMap,
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
  ): Long {
    val context: ReactContext?
    if (surfaceId > 0) {
      val surfaceMountingManager = mountingManager.getSurfaceManagerEnforced(surfaceId, "measure")
      if (surfaceMountingManager.isStopped) {
        return 0
      }
      context = surfaceMountingManager.context
      checkNotNull(context) {
        "Context in SurfaceMountingManager is null. surfaceId: $surfaceId"
      }
    } else {
      context = reactApplicationContext
    }

    return mountingManager.measure(
        context,
        componentName,
        localData,
        props,
        state,
        LayoutMetricsConversions.getYogaSize(minWidth, maxWidth),
        LayoutMetricsConversions.getYogaMeasureMode(minWidth, maxWidth),
        LayoutMetricsConversions.getYogaSize(minHeight, maxHeight),
        LayoutMetricsConversions.getYogaMeasureMode(minHeight, maxHeight),
        null,
    )
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  @UnstableReactNativeAPI
  public fun measureText(
      attributedString: ReadableMapBuffer,
      paragraphAttributes: ReadableMapBuffer,
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
      attachmentsPositions: FloatArray?,
  ): Long {
    val textViewManager = viewManagerRegistry.get(ReactTextViewManager.REACT_CLASS)

    return TextLayoutManager.measureText(
        reactApplicationContext.assets,
        attributedString,
        paragraphAttributes,
        LayoutMetricsConversions.getYogaSize(minWidth, maxWidth),
        LayoutMetricsConversions.getYogaMeasureMode(minWidth, maxWidth),
        LayoutMetricsConversions.getYogaSize(minHeight, maxHeight),
        LayoutMetricsConversions.getYogaMeasureMode(minHeight, maxHeight),
        if (textViewManager is ReactTextViewManagerCallback)
            textViewManager as ReactTextViewManagerCallback
        else null,
        attachmentsPositions,
        textEffectRegistry,
    )
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  @UnstableReactNativeAPI
  @PublishedApi
  internal fun prepareTextLayout(
      attributedString: ReadableMapBuffer,
      paragraphAttributes: ReadableMapBuffer,
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
  ): PreparedLayout {
    val textViewManager = viewManagerRegistry.get(ReactTextViewManager.REACT_CLASS)

    return TextLayoutManager.createPreparedLayout(
        reactApplicationContext.assets,
        attributedString,
        paragraphAttributes,
        LayoutMetricsConversions.getYogaSize(minWidth, maxWidth),
        LayoutMetricsConversions.getYogaMeasureMode(minWidth, maxWidth),
        LayoutMetricsConversions.getYogaSize(minHeight, maxHeight),
        LayoutMetricsConversions.getYogaMeasureMode(minHeight, maxHeight),
        if (textViewManager is ReactTextViewManagerCallback)
            textViewManager as ReactTextViewManagerCallback
        else null,
        textEffectRegistry,
    )
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  @UnstableReactNativeAPI
  @PublishedApi
  internal fun reusePreparedLayoutWithNewReactTags(
      preparedLayout: PreparedLayout,
      reactTags: IntArray,
  ): PreparedLayout {
    return PreparedLayout(
        preparedLayout.layout,
        preparedLayout.maximumNumberOfLines,
        preparedLayout.verticalOffset,
        reactTags,
        preparedLayout.textBreakStrategy,
        preparedLayout.justificationMode,
    )
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  @UnstableReactNativeAPI
  @PublishedApi
  internal fun measurePreparedLayout(
      preparedLayout: PreparedLayout,
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
  ): FloatArray {
    return TextLayoutManager.measurePreparedLayout(
        preparedLayout,
        LayoutMetricsConversions.getYogaSize(minWidth, maxWidth),
        LayoutMetricsConversions.getYogaMeasureMode(minWidth, maxWidth),
        LayoutMetricsConversions.getYogaSize(minHeight, maxHeight),
        LayoutMetricsConversions.getYogaMeasureMode(minHeight, maxHeight),
    )
  }

  @UnstableReactNativeAPI
  @get:JvmName("getTextEffectRegistry")
  public val textEffectRegistry: TextEffectRegistry
    get() = _textEffectRegistry

  @Suppress("unused")
  public fun getThemeData(surfaceId: Int, defaultTextInputPadding: FloatArray): Boolean {
    val surfaceMountingManager: SurfaceMountingManager? =
        mountingManager.getSurfaceManager(surfaceId)
    val context: Context? = surfaceMountingManager?.context
    if (context == null) {
      FLog.w(TAG, "Couldn't get context for surfaceId %d in getThemeData", surfaceId)
      return false
    }

    val defaultTextInputPaddingForTheme = UIManagerHelper.getDefaultTextInputPadding(context)
    defaultTextInputPadding[0] = defaultTextInputPaddingForTheme[PADDING_START_INDEX]
    defaultTextInputPadding[1] = defaultTextInputPaddingForTheme[PADDING_END_INDEX]
    defaultTextInputPadding[2] = defaultTextInputPaddingForTheme[PADDING_TOP_INDEX]
    defaultTextInputPadding[3] = defaultTextInputPaddingForTheme[PADDING_BOTTOM_INDEX]
    return true
  }

  private fun getEncodedScreenSizeWithoutVerticalInsets(surfaceId: Int): Long {
    val context: ThemedReactContext? =
        mountingManager
            .getSurfaceManagerEnforced(surfaceId, "getEncodedScreenSizeWithoutVerticalInsets")
            .context
    if (context == null) {
      FLog.w(TAG, "Couldn't get context from SurfaceMountingManager for surfaceId %d", surfaceId)
      return 0
    } else {
      return DisplayMetricsHolder.getEncodedScreenSizeWithoutVerticalInsets(context.currentActivity)
    }
  }

  override fun addUIManagerEventListener(listener: UIManagerListener) {
    listeners.add(listener)
  }

  override fun removeUIManagerEventListener(listener: UIManagerListener) {
    listeners.remove(listener)
  }

  @UiThread
  @ThreadConfined(ThreadConfined.UI)
  override fun synchronouslyUpdateViewOnUIThread(reactTag: Int, props: ReadableMap) {
    UiThreadUtil.assertOnUiThread()

    val commitNumber = currentSynchronousCommitNumber++

    if (!mountingManager.getViewExists(reactTag)) {
      mountItemDispatcher.addMountItem(SynchronousMountItem(reactTag, props))
      return
    }

    ReactMarker.logFabricMarker(
        ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_START,
        null,
        commitNumber,
    )

    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      FLog.d(
          TAG,
          "SynchronouslyUpdateViewOnUIThread for tag %d: %s",
          reactTag,
          if (IS_DEVELOPMENT_ENVIRONMENT) props.toHashMap().toString() else "<hidden>",
      )
    }

    SynchronousMountItem(reactTag, props).execute(mountingManager)

    ReactMarker.logFabricMarker(
        ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_END,
        null,
        commitNumber,
    )
  }

  @SuppressLint("NotInvokedPrivateMethod")
  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun captureViewSnapshot(reactTag: Int, surfaceId: Int) {
    getViewTransitionSnapshotManager().captureViewSnapshot(reactTag, surfaceId)
  }

  @SuppressLint("NotInvokedPrivateMethod")
  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun setViewSnapshot(sourceTag: Int, targetTag: Int, surfaceId: Int) {
    getViewTransitionSnapshotManager().setViewSnapshot(sourceTag, targetTag)
  }

  @SuppressLint("NotInvokedPrivateMethod")
  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun clearPendingSnapshots() {
    getViewTransitionSnapshotManager().clearPendingSnapshots()
  }

  @Synchronized
  private fun getViewTransitionSnapshotManager(): ViewTransitionSnapshotManager {
    var manager = viewTransitionSnapshotManager
    if (manager == null) {
      manager = ViewTransitionSnapshotManager(this, mountingManager)
      viewTransitionSnapshotManager = manager
    }
    return manager
  }

  @SuppressLint("NotInvokedPrivateMethod")
  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun preallocateView(
      rootTag: Int,
      reactTag: Int,
      componentName: String,
      props: Any?,
      stateWrapper: Any?,
      isLayoutable: Boolean,
  ) {
    mountItemDispatcher.addPreAllocateMountItem(
        MountItemFactory.createPreAllocateViewMountItem(
            rootTag,
            reactTag,
            componentName,
            props as ReadableMap,
            stateWrapper as StateWrapper?,
            isLayoutable,
        )
    )
  }

  @SuppressLint("NotInvokedPrivateMethod")
  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun destroyUnmountedView(surfaceId: Int, reactTag: Int) {
    mountItemDispatcher.addMountItem(
        MountItemFactory.createDestroyViewMountItem(surfaceId, reactTag)
    )
  }

  @SuppressLint("NotInvokedPrivateMethod")
  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun isOnMainThread(): Boolean {
    return UiThreadUtil.isOnUiThread()
  }

  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun createIntBufferBatchMountItem(
      rootTag: Int,
      intBuffer: IntArray?,
      objBuffer: Array<Any?>?,
      commitNumber: Int,
  ): MountItem {
    return MountItemFactory.createIntBufferBatchMountItem(
        rootTag,
        intBuffer ?: IntArray(0),
        objBuffer ?: emptyArray(),
        commitNumber,
    )
  }

  @SuppressLint("NotInvokedPrivateMethod")
  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun scheduleMountItem(
      mountItem: MountItem?,
      commitNumber: Int,
      commitStartTime: Long,
      diffStartTime: Long,
      diffEndTime: Long,
      layoutStartTime: Long,
      layoutEndTime: Long,
      finishTransactionStartTime: Long,
      finishTransactionEndTime: Long,
      affectedLayoutNodesCount: Int,
  ) {
    val scheduleMountItemStartTime = SystemClock.uptimeMillis()
    val isBatchMountItem = mountItem is BatchMountItem
    val shouldSchedule: Boolean
    if (isBatchMountItem) {
      val batchMountItem = mountItem as BatchMountItem
      shouldSchedule = !batchMountItem.isBatchEmpty()
    } else {
      shouldSchedule = mountItem != null
    }
    for (listener in listeners) {
      listener.didScheduleMountItems(this)
    }

    if (isBatchMountItem) {
      this.commitStartTime = commitStartTime
      this.layoutTime = layoutEndTime - layoutStartTime
      this.finishTransactionCPPTime = finishTransactionEndTime - finishTransactionStartTime
      this.finishTransactionTime = scheduleMountItemStartTime - finishTransactionStartTime
      this.dispatchViewUpdatesTime = SystemClock.uptimeMillis()
    }

    if (shouldSchedule) {
      val item = checkNotNull(mountItem) { "MountItem is null" }
      mountItemDispatcher.addMountItem(item)
      if (UiThreadUtil.isOnUiThread()) {
        val runnable =
            object : GuardedRunnable(reactApplicationContext) {
              override fun runGuarded() {
                mountItemDispatcher.tryDispatchMountItems()
              }
            }
        runnable.run()
      }
    }

    if (isBatchMountItem) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_COMMIT_START,
          null,
          commitNumber,
          commitStartTime,
      )
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_START,
          null,
          commitNumber,
          finishTransactionStartTime,
      )
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_END,
          null,
          commitNumber,
          finishTransactionEndTime,
      )
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_DIFF_START,
          null,
          commitNumber,
          diffStartTime,
      )
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_DIFF_END,
          null,
          commitNumber,
          diffEndTime,
      )
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_LAYOUT_START,
          null,
          commitNumber,
          layoutStartTime,
      )
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_LAYOUT_END,
          null,
          commitNumber,
          layoutEndTime,
      )
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_LAYOUT_AFFECTED_NODES,
          null,
          commitNumber,
          layoutEndTime,
          affectedLayoutNodesCount,
      )
      ReactMarker.logFabricMarker(ReactMarkerConstants.FABRIC_COMMIT_END, null, commitNumber)
    }
  }

  @Suppress("unused")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  private fun scheduleReactRevisionMerge(surfaceId: Int) {
    if (UiThreadUtil.isOnUiThread()) {
      uiManagerBinding?.mergeReactRevision(surfaceId)
    } else {
      pendingReactRevisionMerges.add(surfaceId)
    }
  }

  @UnstableReactNativeAPI
  public fun experimental_prefetchResources(
      surfaceId: Int,
      componentName: String,
      params: ReadableMapBuffer,
  ) {
    mountItemDispatcher.addMountItem(PrefetchResourcesMountItem(surfaceId, componentName, params))
  }

  internal fun setBinding(binding: FabricUIManagerBinding) {
    uiManagerBinding = binding
  }

  @UiThread
  @ThreadConfined(ThreadConfined.UI)
  override fun updateRootLayoutSpecs(
      rootTag: Int,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
      offsetX: Int,
      offsetY: Int,
  ) {
    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      FLog.d(TAG, "Updating Root Layout Specs for [%d]", rootTag)
    }

    val surfaceMountingManager: SurfaceMountingManager? = mountingManager.getSurfaceManager(rootTag)

    if (surfaceMountingManager == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalViewOperationException(
              "Cannot updateRootLayoutSpecs on surfaceId that does not exist: $rootTag"
          ),
      )
      return
    }

    val context: Context? = surfaceMountingManager.context
    var isRTL = false
    var doLeftAndRightSwapInRTL = false
    if (context != null) {
      isRTL = I18nUtil.getInstance().isRTL(context)
      doLeftAndRightSwapInRTL = I18nUtil.getInstance().doLeftAndRightSwapInRTL(context)
    }

    val binding = checkNotNull(uiManagerBinding) { "Binding in FabricUIManager is null" }
    binding.setConstraints(
        rootTag,
        LayoutMetricsConversions.getMinSize(widthMeasureSpec),
        LayoutMetricsConversions.getMaxSize(widthMeasureSpec),
        LayoutMetricsConversions.getMinSize(heightMeasureSpec),
        LayoutMetricsConversions.getMaxSize(heightMeasureSpec),
        offsetX.toFloat(),
        offsetY.toFloat(),
        isRTL,
        doLeftAndRightSwapInRTL,
    )
  }

  override fun resolveView(reactTag: Int): View? {
    UiThreadUtil.assertOnUiThread()

    val surfaceManager: SurfaceMountingManager? = mountingManager.getSurfaceManagerForView(reactTag)
    if (surfaceManager == null || surfaceManager.isStopped) {
      return null
    }
    return surfaceManager.getView(reactTag)
  }

  @Deprecated("Use the overload with surfaceId parameter instead")
  override fun receiveEvent(reactTag: Int, eventName: String, event: WritableMap?) {
    receiveEvent(View.NO_ID, reactTag, eventName, false, event, EventCategoryDef.UNSPECIFIED)
  }

  @Deprecated("Use the overload with canCoalesceEvent parameter instead")
  override fun receiveEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String,
      event: WritableMap?,
  ) {
    receiveEvent(surfaceId, reactTag, eventName, false, event, EventCategoryDef.UNSPECIFIED)
  }

  @Deprecated("Use the overload with eventTimestamp parameter instead.")
  public fun receiveEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
  ) {
    receiveEvent(
        surfaceId,
        reactTag,
        eventName,
        canCoalesceEvent,
        params,
        eventCategory,
        false,
        SystemClock.uptimeMillis(),
    )
  }

  @Deprecated("Use the overload with eventTimestamp parameter instead.")
  override fun receiveEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
      experimentalIsSynchronous: Boolean,
  ) {
    receiveEvent(
        surfaceId,
        reactTag,
        eventName,
        canCoalesceEvent,
        params,
        eventCategory,
        experimentalIsSynchronous,
        SystemClock.uptimeMillis(),
    )
  }

  override fun receiveEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
      experimentalIsSynchronous: Boolean,
      eventTimestamp: Long,
  ) {
    if (ReactBuildConfig.DEBUG && surfaceId == View.NO_ID) {
      FLog.d(TAG, "Emitted event without surfaceId: [%d] %s", reactTag, eventName)
    }

    if (destroyed) {
      FLog.e(TAG, "Attempted to receiveEvent after destruction")
      return
    }

    if (experimentalIsSynchronous) {
      UiThreadUtil.assertOnUiThread()
      val eventEmitter: EventEmitterWrapper? = mountingManager.getEventEmitter(surfaceId, reactTag)
      if (eventEmitter != null) {
        val firstEventForFrame =
            synchronousEvents.add(SynchronousEvent(surfaceId, reactTag, eventName))
        if (firstEventForFrame) {
          eventEmitter.dispatchEventSynchronously(eventName, params, eventTimestamp)
        }
        return
      }
    }

    mountingManager.dispatchEvent(
        surfaceId,
        reactTag,
        eventName,
        canCoalesceEvent,
        params,
        eventCategory,
        eventTimestamp,
    )
  }

  override fun onHostResume() {
    dispatchUIFrameCallback.resume()
  }

  override val eventDispatcher: EventDispatcher
    get() = _eventDispatcher

  override fun onHostPause() {
    dispatchUIFrameCallback.pause()
  }

  override fun onHostDestroy() {}

  @Deprecated("Fabric dispatchCommand must be called through Fabric JSI API")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  override fun dispatchCommand(reactTag: Int, commandId: Int, commandArgs: ReadableArray?) {
    throw UnsupportedOperationException(
        "dispatchCommand called without surfaceId - Fabric dispatchCommand must be called through" +
            " Fabric JSI API"
    )
  }

  @Deprecated("Fabric dispatchCommand must be called through Fabric JSI API")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  override fun dispatchCommand(reactTag: Int, commandId: String, commandArgs: ReadableArray?) {
    throw UnsupportedOperationException(
        "dispatchCommand called without surfaceId - Fabric dispatchCommand must be called through" +
            " Fabric JSI API"
    )
  }

  @Deprecated("Use the String overload instead")
  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  public fun dispatchCommand(
      surfaceId: Int,
      reactTag: Int,
      commandId: Int,
      commandArgs: ReadableArray?,
  ) {
    mountItemDispatcher.addViewCommandMountItem(
        MountItemFactory.createDispatchCommandMountItem(
            surfaceId,
            reactTag,
            commandId,
            commandArgs ?: JavaOnlyArray(),
        )
    )
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  public fun dispatchCommand(
      surfaceId: Int,
      reactTag: Int,
      commandId: String,
      commandArgs: ReadableArray?,
  ) {
    val args = commandArgs ?: JavaOnlyArray()
    if (ReactNativeNewArchitectureFeatureFlags.useFabricInterop()) {
      mountItemDispatcher.addViewCommandMountItem(
          createDispatchCommandMountItemForInterop(surfaceId, reactTag, commandId, args)
      )
    } else {
      mountItemDispatcher.addViewCommandMountItem(
          MountItemFactory.createDispatchCommandMountItem(
              surfaceId,
              reactTag,
              commandId,
              args,
          )
      )
    }
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  override fun sendAccessibilityEvent(reactTag: Int, eventType: Int) {
    mountItemDispatcher.addMountItem(
        MountItemFactory.createSendAccessibilityEventMountItem(View.NO_ID, reactTag, eventType)
    )
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  public fun sendAccessibilityEventFromJS(surfaceId: Int, reactTag: Int, eventTypeJS: String) {
    val eventType: Int =
        when (eventTypeJS) {
          "focus" -> AccessibilityEvent.TYPE_VIEW_FOCUSED
          "windowStateChange" -> AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
          "click" -> AccessibilityEvent.TYPE_VIEW_CLICKED
          "viewHoverEnter" -> AccessibilityEvent.TYPE_VIEW_HOVER_ENTER
          else ->
              throw IllegalArgumentException(
                  "sendAccessibilityEventFromJS: invalid eventType $eventTypeJS"
              )
        }
    mountItemDispatcher.addMountItem(
        MountItemFactory.createSendAccessibilityEventMountItem(surfaceId, reactTag, eventType)
    )
  }

  public fun setJSResponder(
      surfaceId: Int,
      reactTag: Int,
      initialReactTag: Int,
      blockNativeResponder: Boolean,
  ) {
    mountItemDispatcher.addMountItem(
        object : MountItem {
          override fun execute(mountingManager: MountingManager) {
            val surfaceMountingManager: SurfaceMountingManager? =
                mountingManager.getSurfaceManager(surfaceId)
            if (surfaceMountingManager != null) {
              surfaceMountingManager.setJSResponder(
                  reactTag,
                  initialReactTag,
                  blockNativeResponder,
              )
            } else {
              FLog.e(
                  TAG,
                  "setJSResponder skipped, surface no longer available [$surfaceId]",
              )
            }
          }

          override fun getSurfaceId(): Int = surfaceId

          override fun toString(): String = "SET_JS_RESPONDER [$reactTag] [surface:$surfaceId]"
        }
    )
  }

  public fun clearJSResponder() {
    mountItemDispatcher.addMountItem(
        object : MountItem {
          override fun execute(mountingManager: MountingManager) {
            mountingManager.clearJSResponder()
          }

          override fun getSurfaceId(): Int = View.NO_ID

          override fun toString(): String = "CLEAR_JS_RESPONDER"
        }
    )
  }

  override fun profileNextBatch() {
    // TODO T31905686: Remove this method and add support for multi-threading performance counters
  }

  @Deprecated("Use resolveCustomDirectEventName instead")
  override fun resolveCustomDirectEventName(eventName: String): String? {
    if (eventName.startsWith("top")) {
      return "on" + eventName.substring(3)
    }
    return eventName
  }

  @AnyThread
  public fun onAnimationStarted() {
    driveCxxAnimations = true
  }

  @AnyThread
  public fun onAllAnimationsComplete() {
    driveCxxAnimations = false
  }

  override val performanceCounters: Map<String, Long>
    get() =
        mapOf(
            "CommitStartTime" to commitStartTime,
            "LayoutTime" to layoutTime,
            "DispatchViewUpdatesTime" to dispatchViewUpdatesTime,
            "RunStartTime" to mountItemDispatcher.runStartTime,
            "BatchedExecutionTime" to mountItemDispatcher.batchedExecutionTime,
            "FinishFabricTransactionTime" to finishTransactionTime,
            "FinishFabricTransactionCPPTime" to finishTransactionCPPTime,
        )

  private inner class MountItemDispatchListener : MountItemDispatcher.ItemDispatchListener {
    @UiThread
    @ThreadConfined(ThreadConfined.UI)
    override fun willMountItems(mountItems: List<MountItem>?) {
      for (listener in listeners) {
        listener.willMountItems(this@FabricUIManager)
      }
    }

    @UiThread
    @ThreadConfined(ThreadConfined.UI)
    override fun didMountItems(mountItems: List<MountItem>?) {
      for (listener in listeners) {
        listener.didMountItems(this@FabricUIManager)
      }

      if (mountItems == null || mountItems.isEmpty()) {
        return
      }

      for (mountItem in mountItems) {
        val sid = mountItem.getSurfaceId()
        if (sid != View.NO_ID && !surfaceIdsWithPendingMountNotification.contains(sid)) {
          surfaceIdsWithPendingMountNotification.add(sid)
        }
      }

      if (!mountNotificationScheduled && surfaceIdsWithPendingMountNotification.isNotEmpty()) {
        mountNotificationScheduled = true

        UiThreadUtil.getUiThreadHandler().postAtFrontOfQueue {
          mountNotificationScheduled = false

          val surfaceIdsToReportMount = surfaceIdsWithPendingMountNotification
          surfaceIdsWithPendingMountNotification = ArrayList()

          val binding: FabricUIManagerBinding? = uiManagerBinding
          if (binding == null || destroyed) {
            return@postAtFrontOfQueue
          }

          for (surfaceId in surfaceIdsToReportMount) {
            binding.reportMount(surfaceId)
          }
        }
      }
    }

    override fun didDispatchMountItems() {
      for (listener in listeners) {
        listener.didDispatchMountItems(this@FabricUIManager)
      }
    }
  }

  internal fun createDispatchCommandMountItemForInterop(
      surfaceId: Int,
      reactTag: Int,
      commandId: String,
      commandArgs: ReadableArray,
  ): DispatchCommandMountItem {
    return try {
      val commandIdInteger = commandId.toInt()
      MountItemFactory.createDispatchCommandMountItem(
          surfaceId,
          reactTag,
          commandIdInteger,
          commandArgs,
      )
    } catch (e: NumberFormatException) {
      MountItemFactory.createDispatchCommandMountItem(surfaceId, reactTag, commandId, commandArgs)
    }
  }

  private inner class DispatchUIFrameCallback(reactContext: ReactContext) :
      GuardedFrameCallback(reactContext) {

    @Volatile private var isMountingEnabled: Boolean = true

    @ThreadConfined(ThreadConfined.UI) private var shouldSchedule: Boolean = false

    @ThreadConfined(ThreadConfined.UI) private var isScheduled: Boolean = false

    @UiThread
    @ThreadConfined(ThreadConfined.UI)
    private fun schedule() {
      if (!isScheduled && shouldSchedule) {
        isScheduled = true
        ReactChoreographer.getInstance()
            .postFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, this)
      }
    }

    @UiThread
    @ThreadConfined(ThreadConfined.UI)
    fun resume() {
      shouldSchedule = true
      schedule()
    }

    @UiThread
    @ThreadConfined(ThreadConfined.UI)
    fun pause() {
      ReactChoreographer.getInstance()
          .removeFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, this)
      shouldSchedule = false
      isScheduled = false
    }

    @UiThread
    @ThreadConfined(ThreadConfined.UI)
    override fun doFrameGuarded(frameTimeNanos: Long) {
      isScheduled = false

      if (!isMountingEnabled) {
        FLog.w(TAG, "Not flushing pending UI operations: exception was previously thrown")
        return
      }

      if (destroyed) {
        FLog.w(TAG, "Not flushing pending UI operations: FabricUIManager is destroyed")
        return
      }

      if (ReactNativeFeatureFlags.enableFabricCommitBranching()) {
        val binding = uiManagerBinding
        if (binding != null) {
          var mergeSurfaceId: Int? = pendingReactRevisionMerges.poll()
          while (mergeSurfaceId != null) {
            binding.mergeReactRevision(mergeSurfaceId)
            mergeSurfaceId = pendingReactRevisionMerges.poll()
          }
        }
      }

      if (
          (driveCxxAnimations || ReactNativeFeatureFlags.cxxNativeAnimatedEnabled()) &&
              uiManagerBinding != null
      ) {
        uiManagerBinding?.driveCxxAnimations()
      }

      if (!ReactNativeFeatureFlags.disableViewPreallocationAndroid() && uiManagerBinding != null) {
        uiManagerBinding?.drainPreallocateViewsQueue()
      }

      try {
        mountItemDispatcher.dispatchPreMountItems(frameTimeNanos)
        mountItemDispatcher.tryDispatchMountItems()
      } catch (ex: Exception) {
        FLog.e(TAG, "Exception thrown when executing UIFrameGuarded", ex)
        isMountingEnabled = false
        throw ex
      } finally {
        schedule()
      }

      synchronousEvents.clear()
    }
  }

  public companion object {
    @JvmField public val TAG: String = FabricUIManager::class.java.simpleName

    @SuppressLint("ClownyBooleanExpression")
    @JvmField
    public val IS_DEVELOPMENT_ENVIRONMENT: Boolean = false && ReactBuildConfig.DEBUG

    private val FABRIC_PERF_LOGGER: DevToolsReactPerfLogger.DevToolsReactPerfLoggerListener =
        DevToolsReactPerfLogger.DevToolsReactPerfLoggerListener { commitPoint ->
          val commitDuration = commitPoint.commitDuration
          val layoutDuration = commitPoint.layoutDuration
          val diffDuration = commitPoint.diffDuration
          val transactionEndDuration = commitPoint.transactionEndDuration
          val batchExecutionDuration = commitPoint.batchExecutionDuration

          DevToolsReactPerfLogger.streamingCommitStats.add(commitDuration)
          DevToolsReactPerfLogger.streamingLayoutStats.add(layoutDuration)
          DevToolsReactPerfLogger.streamingDiffStats.add(diffDuration)
          DevToolsReactPerfLogger.streamingTransactionEndStats.add(transactionEndDuration)
          DevToolsReactPerfLogger.streamingBatchExecutionStats.add(batchExecutionDuration)

          FLog.i(
              TAG,
              "Statistics of Fabric commit #%d:\n" +
                  " - Total commit time: %d ms. Avg: %.2f. Median: %.2f ms. Max: %d ms.\n" +
                  " - Layout time: %d ms. Avg: %.2f. Median: %.2f ms. Max: %d ms.\n" +
                  " - Diffing time: %d ms. Avg: %.2f. Median: %.2f ms. Max: %d ms.\n" +
                  " - FinishTransaction (Diffing + JNI serialization): %d ms. Avg: %.2f. Median:" +
                  " %.2f ms. Max: %d ms.\n" +
                  " - Mounting: %d ms. Avg: %.2f. Median: %.2f ms. Max: %d ms.\n",
              commitPoint.commitNumber,
              commitDuration,
              DevToolsReactPerfLogger.streamingCommitStats.average,
              DevToolsReactPerfLogger.streamingCommitStats.median,
              DevToolsReactPerfLogger.streamingCommitStats.max,
              layoutDuration,
              DevToolsReactPerfLogger.streamingLayoutStats.average,
              DevToolsReactPerfLogger.streamingLayoutStats.median,
              DevToolsReactPerfLogger.streamingLayoutStats.max,
              diffDuration,
              DevToolsReactPerfLogger.streamingDiffStats.average,
              DevToolsReactPerfLogger.streamingDiffStats.median,
              DevToolsReactPerfLogger.streamingDiffStats.max,
              transactionEndDuration,
              DevToolsReactPerfLogger.streamingTransactionEndStats.average,
              DevToolsReactPerfLogger.streamingTransactionEndStats.median,
              DevToolsReactPerfLogger.streamingTransactionEndStats.max,
              batchExecutionDuration,
              DevToolsReactPerfLogger.streamingBatchExecutionStats.average,
              DevToolsReactPerfLogger.streamingBatchExecutionStats.median,
              DevToolsReactPerfLogger.streamingBatchExecutionStats.max,
          )
        }

    init {
      FabricSoLoader.staticInit()
    }
  }
}
