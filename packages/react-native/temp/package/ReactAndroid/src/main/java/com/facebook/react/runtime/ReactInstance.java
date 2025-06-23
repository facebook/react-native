/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import android.content.res.AssetManager;
import android.view.View;
import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeExceptionsManagerSpec;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.infer.annotation.ThreadSafe;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.DebugCorePackage;
import com.facebook.react.ReactPackage;
import com.facebook.react.ViewManagerOnDemandReactPackage;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JSBundleLoaderDelegate;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.bridge.RuntimeScheduler;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.MessageQueueThreadSpec;
import com.facebook.react.bridge.queue.QueueThreadExceptionHandler;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.bridge.queue.ReactQueueConfigurationImpl;
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec;
import com.facebook.react.devsupport.StackTraceHelper;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.fabric.Binding;
import com.facebook.react.fabric.BindingImpl;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler;
import com.facebook.react.internal.AndroidChoreographerProvider;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.internal.turbomodule.core.TurboModuleManager;
import com.facebook.react.internal.turbomodule.core.TurboModuleManagerDelegate;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.JavaTimerManager;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.turbomodule.core.NativeMethodCallInvokerHolderImpl;
import com.facebook.react.uimanager.ComponentNameResolver;
import com.facebook.react.uimanager.ComponentNameResolverBinding;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.UIConstantsProviderBinding;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIManagerModuleConstantsHelper;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.ViewManagerResolver;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.soloader.SoLoader;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;

/**
 * An experimental replacement for {@link com.facebook.react.ReactInstanceManager} responsible for
 * creating and managing a React Native instance
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@ThreadSafe
final class ReactInstance {

  private static final String TAG = ReactInstance.class.getSimpleName();

  @DoNotStrip private final HybridData mHybridData;

  private final BridgelessReactContext mBridgelessReactContext;
  private final ReactQueueConfiguration mQueueConfiguration;
  private final TurboModuleManager mTurboModuleManager;
  private final FabricUIManager mFabricUIManager;
  private final JavaTimerManager mJavaTimerManager;
  private final BridgelessViewManagerResolver mViewManagerResolver;
  private final JavaScriptContextHolder mJavaScriptContextHolder;

  static {
    loadLibraryIfNeeded();
  }

  private static volatile boolean sIsLibraryLoaded;

  /* package */ ReactInstance(
      BridgelessReactContext bridgelessReactContext,
      ReactHostDelegate delegate,
      ComponentFactory componentFactory,
      DevSupportManager devSupportManager,
      QueueThreadExceptionHandler exceptionHandler,
      boolean useDevSupport,
      @Nullable ReactHostInspectorTarget reactHostInspectorTarget) {
    mBridgelessReactContext = bridgelessReactContext;

    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.initialize");

    /**
     * Prepare the ReactInstance by installing JSI bindings, initializing Fabric + TurboModules, and
     * loading the JS bundle.
     */
    ReactQueueConfigurationSpec spec =
        new ReactQueueConfigurationSpec(
            MessageQueueThreadSpec.newBackgroundThreadSpec("v_native"),
            MessageQueueThreadSpec.newBackgroundThreadSpec("v_js"));
    mQueueConfiguration = ReactQueueConfigurationImpl.create(spec, exceptionHandler);
    FLog.d(TAG, "Calling initializeMessageQueueThreads()");
    mBridgelessReactContext.initializeMessageQueueThreads(mQueueConfiguration);
    MessageQueueThread jsMessageQueueThread = mQueueConfiguration.getJSQueueThread();
    MessageQueueThread nativeModulesMessageQueueThread =
        mQueueConfiguration.getNativeModulesQueueThread();

    ReactChoreographer.initialize(AndroidChoreographerProvider.getInstance());
    if (useDevSupport) {
      devSupportManager.startInspector();
    }

    JSTimerExecutor jsTimerExecutor = createJSTimerExecutor();
    mJavaTimerManager =
        new JavaTimerManager(
            mBridgelessReactContext,
            jsTimerExecutor,
            ReactChoreographer.getInstance(),
            devSupportManager);

    JSRuntimeFactory jsRuntimeFactory = delegate.getJsRuntimeFactory();
    BindingsInstaller bindingsInstaller = delegate.getBindingsInstaller();
    // Notify JS if profiling is enabled
    boolean isProfiling =
        Systrace.isTracing(Systrace.TRACE_TAG_REACT_APPS | Systrace.TRACE_TAG_REACT_JS_VM_CALLS);

    mHybridData =
        initHybrid(
            jsRuntimeFactory,
            jsMessageQueueThread,
            nativeModulesMessageQueueThread,
            mJavaTimerManager,
            jsTimerExecutor,
            new ReactJsExceptionHandlerImpl(exceptionHandler),
            bindingsInstaller,
            isProfiling,
            reactHostInspectorTarget);

    mJavaScriptContextHolder = new JavaScriptContextHolder(getJavaScriptContext());

    // Set up TurboModules
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.initialize#initTurboModules");

    List<ReactPackage> reactPackages = new ArrayList<>();
    reactPackages.add(
        new CoreReactPackage(
            bridgelessReactContext.getDevSupportManager(),
            bridgelessReactContext.getDefaultHardwareBackBtnHandler()));
    if (useDevSupport) {
      reactPackages.add(new DebugCorePackage());
    }
    reactPackages.addAll(delegate.getReactPackages());

    TurboModuleManagerDelegate turboModuleManagerDelegate =
        delegate
            .getTurboModuleManagerDelegateBuilder()
            .setPackages(reactPackages)
            .setReactApplicationContext(mBridgelessReactContext)
            .build();

    RuntimeExecutor unbufferedRuntimeExecutor = getUnbufferedRuntimeExecutor();
    mTurboModuleManager =
        new TurboModuleManager(
            // Use unbuffered RuntimeExecutor to install binding
            unbufferedRuntimeExecutor,
            turboModuleManagerDelegate,
            getJSCallInvokerHolder(),
            getNativeMethodCallInvokerHolder());

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    // Set up Fabric
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.initialize#initFabric");

    mViewManagerResolver =
        new BridgelessViewManagerResolver(reactPackages, mBridgelessReactContext);

    // Initialize function for JS's UIManager.hasViewManagerConfig()
    ComponentNameResolverBinding.install(
        // Use unbuffered RuntimeExecutor to install binding
        unbufferedRuntimeExecutor,
        (ComponentNameResolver)
            () -> {
              Collection<String> viewManagerNames = mViewManagerResolver.getViewManagerNames();
              if (viewManagerNames.size() < 1) {
                FLog.e(TAG, "No ViewManager names found");
                return new String[0];
              }
              return viewManagerNames.toArray(new String[0]);
            });

    // Initialize function for JS's UIManager.getViewManagerConfig()
    // It should come after getTurboModuleManagerDelegate as it relies on react packages being
    // initialized.
    // This happens inside getTurboModuleManagerDelegate getter.
    if (ReactNativeFeatureFlags.useNativeViewConfigsInBridgelessMode()) {
      Map<String, Object> customDirectEvents = new HashMap<>();

      UIConstantsProviderBinding.install(
          // Use unbuffered RuntimeExecutor to install binding
          unbufferedRuntimeExecutor,
          // Here we are construncting the return value for UIManager.getConstants call.
          // The old architectre relied on the constatnts struct to contain:
          // 1. Eagerly loaded view configs for all native components.
          // 2. genericBubblingEventTypes.
          // 3. genericDirectEventTypes.
          // We want to match this beahavior.
          () -> {
            return (NativeMap)
                Arguments.makeNativeMap(
                    UIManagerModuleConstantsHelper.getDefaultExportableEventTypes());
          },
          (String viewManagerName) -> {
            ViewManager viewManager = mViewManagerResolver.getViewManager(viewManagerName);
            if (viewManager == null) {
              return null;
            }
            return (NativeMap)
                UIManagerModule.getConstantsForViewManager(viewManager, customDirectEvents);
          },
          () -> {
            List<ViewManager> viewManagers =
                new ArrayList<>(mViewManagerResolver.getEagerViewManagerMap().values());

            Map<String, Object> constants =
                UIManagerModule.createConstants(viewManagers, null, customDirectEvents);

            Collection<String> lazyViewManagers = mViewManagerResolver.getLazyViewManagerNames();
            if (lazyViewManagers.size() > 0) {
              constants.put("ViewManagerNames", new ArrayList<>(lazyViewManagers));
              constants.put("LazyViewManagersEnabled", true);
            }

            return Arguments.makeNativeMap(constants);
          });
    }

    EventBeatManager eventBeatManager = new EventBeatManager();
    mFabricUIManager =
        new FabricUIManager(
            mBridgelessReactContext,
            new ViewManagerRegistry(mViewManagerResolver),
            eventBeatManager);

    // Misc initialization that needs to be done before Fabric init
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(mBridgelessReactContext);

    Binding binding = new BindingImpl();
    binding.register(
        getBufferedRuntimeExecutor(),
        getRuntimeScheduler(),
        mFabricUIManager,
        eventBeatManager,
        componentFactory,
        delegate.getReactNativeConfig());

    // Initialize the FabricUIManager
    mFabricUIManager.initialize();

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  void initializeEagerTurboModules() {
    Runnable task =
        () -> {
          Systrace.beginSection(
              Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "initializeEagerTurboModules");
          // Eagerly initialize TurboModules
          for (String moduleName : mTurboModuleManager.getEagerInitModuleNames()) {
            mTurboModuleManager.getModule(moduleName);
          }
          Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
        };
    if (ReactNativeFeatureFlags.initEagerTurboModulesOnNativeModulesQueueAndroid()) {
      mQueueConfiguration.getNativeModulesQueueThread().runOnQueue(task);
    } else {
      task.run();
    }
  }

  private static synchronized void loadLibraryIfNeeded() {
    if (!sIsLibraryLoaded) {
      SoLoader.loadLibrary("rninstance");
      sIsLibraryLoaded = true;
    }
  }

  public ReactQueueConfiguration getReactQueueConfiguration() {
    return mQueueConfiguration;
  }

  private class ReactJsExceptionHandlerImpl implements ReactJsExceptionHandler {
    private final QueueThreadExceptionHandler mQueueThreadExceptionHandler;

    ReactJsExceptionHandlerImpl(QueueThreadExceptionHandler queueThreadExceptionHandler) {
      mQueueThreadExceptionHandler = queueThreadExceptionHandler;
    }

    @Override
    public void reportJsException(ParsedError error) {
      JavaOnlyMap data = StackTraceHelper.convertParsedError(error);

      try {
        NativeExceptionsManagerSpec exceptionsManager =
            (NativeExceptionsManagerSpec)
                Assertions.assertNotNull(
                    mTurboModuleManager.getModule(NativeExceptionsManagerSpec.NAME));
        exceptionsManager.reportException(data);
      } catch (Exception e) {
        // Sometimes (e.g: always with the default exception manager) the native module exceptions
        // manager can throw. In those cases, call into the lower-level queue thread exceptions
        // handler.
        mQueueThreadExceptionHandler.handleException(e);
      }
    }
  }

  public void loadJSBundle(JSBundleLoader bundleLoader) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.loadJSBundle");
    bundleLoader.loadScript(
        new JSBundleLoaderDelegate() {
          @Override
          public void loadScriptFromFile(
              String fileName, String sourceURL, boolean loadSynchronously) {
            mBridgelessReactContext.setSourceURL(sourceURL);
            loadJSBundleFromFile(fileName, sourceURL);
          }

          @Override
          public void loadSplitBundleFromFile(String fileName, String sourceURL) {
            loadJSBundleFromFile(fileName, sourceURL);
          }

          @Override
          public void loadScriptFromAssets(
              AssetManager assetManager, String assetURL, boolean loadSynchronously) {
            mBridgelessReactContext.setSourceURL(assetURL);
            loadJSBundleFromAssets(assetManager, assetURL);
          }

          @Override
          public void setSourceURLs(String deviceURL, String remoteURL) {
            mBridgelessReactContext.setSourceURL(deviceURL);
          }
        });
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    ReactModule annotation = nativeModuleInterface.getAnnotation(ReactModule.class);
    if (annotation != null) {
      return mTurboModuleManager.hasModule(annotation.name());
    }
    return false;
  }

  public Collection<NativeModule> getNativeModules() {
    return new ArrayList<>(mTurboModuleManager.getModules());
  }

  public @Nullable <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    ReactModule annotation = nativeModuleInterface.getAnnotation(ReactModule.class);
    if (annotation != null) {
      return (T) getNativeModule(annotation.name());
    }
    return null;
  }

  public @Nullable NativeModule getNativeModule(String nativeModuleName) {
    synchronized (mTurboModuleManager) {
      return mTurboModuleManager.getModule(nativeModuleName);
    }
  }

  @ThreadConfined("ReactHost")
  /* package */ void prerenderSurface(ReactSurfaceImpl surface) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.prerenderSurface");
    FLog.d(TAG, "call prerenderSurface with surface: " + surface.getModuleName());
    mFabricUIManager.startSurface(surface.getSurfaceHandler(), surface.getContext(), null);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  /**
   * Renders a React Native surface.
   *
   * @param surface The {@link ReactSurface} to render.
   */
  @ThreadConfined("ReactHost")
  /* package */ void startSurface(ReactSurfaceImpl surface) {
    FLog.d(TAG, "startSurface() is called with surface: " + surface.getSurfaceID());
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.startSurface");

    View view = surface.getView();
    if (view == null) {
      throw new IllegalStateException(
          "Starting surface without a view is not supported, use prerenderSurface instead.");
    }

    /*
     This is a temporary mitigation for 646912b2590a6d5e760316cc064d1e27,
     <p>TODO T83828172 investigate why surface.getView() has id NOT equal to View.NO_ID
    */
    if (view.getId() != View.NO_ID) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "surfaceView's is NOT equal to View.NO_ID before calling startSurface."));
      view.setId(View.NO_ID);
    }
    if (surface.isRunning()) {
      // surface was initialized beforehand, only attaching view
      mFabricUIManager.attachRootView(surface.getSurfaceHandler(), view);
    } else {
      mFabricUIManager.startSurface(surface.getSurfaceHandler(), surface.getContext(), view);
    }
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  @ThreadConfined("ReactHost")
  /* package */ void stopSurface(ReactSurfaceImpl surface) {
    FLog.d(TAG, "stopSurface() is called with surface: " + surface.getSurfaceID());
    mFabricUIManager.stopSurface(surface.getSurfaceHandler());
  }

  /* package */ JavaScriptContextHolder getJavaScriptContextHolder() {
    return mJavaScriptContextHolder;
  }

  /* --- Lifecycle methods --- */
  @ThreadConfined("ReactHost")
  /* package */ void destroy() {
    FLog.d(TAG, "ReactInstance.destroy() is called.");
    mQueueConfiguration.destroy();
    mTurboModuleManager.invalidate();
    mFabricUIManager.invalidate();
    mJavaTimerManager.onInstanceDestroy();
    mHybridData.resetNative();
    mJavaScriptContextHolder.clear();
  }

  /* --- Native methods --- */

  @DoNotStrip
  private native HybridData initHybrid(
      JSRuntimeFactory jsRuntimeFactory,
      MessageQueueThread jsMessageQueueThread,
      MessageQueueThread nativeModulesMessageQueueThread,
      JavaTimerManager timerManager,
      JSTimerExecutor jsTimerExecutor,
      ReactJsExceptionHandler jReactExceptionsManager,
      @Nullable BindingsInstaller jBindingsInstaller,
      boolean isProfiling,
      @Nullable ReactHostInspectorTarget reactHostInspectorTarget);

  @DoNotStrip
  private static native JSTimerExecutor createJSTimerExecutor();

  @DoNotStrip
  private native void installGlobals(boolean isProfiling);

  private native void loadJSBundleFromFile(String fileName, String sourceURL);

  private native void loadJSBundleFromAssets(AssetManager assetManager, String assetURL);

  /* package */ native CallInvokerHolderImpl getJSCallInvokerHolder();

  private native NativeMethodCallInvokerHolderImpl getNativeMethodCallInvokerHolder();

  private native RuntimeExecutor getUnbufferedRuntimeExecutor();

  /* package */ native RuntimeExecutor getBufferedRuntimeExecutor();

  private native RuntimeScheduler getRuntimeScheduler();

  private native long getJavaScriptContext();

  /* package */ native void callFunctionOnModule(
      String moduleName, String methodName, NativeArray args);

  private native void registerSegmentNative(int segmentId, String segmentPath);

  private native void handleMemoryPressureJs(int pressureLevel);

  @ThreadConfined(ThreadConfined.UI)
  /* package */ native void unregisterFromInspector();

  public void handleMemoryPressure(int level) {
    try {
      handleMemoryPressureJs(level);
    } catch (NullPointerException e) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "Native method handleMemoryPressureJs is called earlier than librninstance.so got"
                  + " ready."));
    }
  }

  /**
   * @return The {@link EventDispatcher} used by {@link FabricUIManager} to emit UI events to JS.
   */
  /* package */ EventDispatcher getEventDispatcher() {
    return mFabricUIManager.getEventDispatcher();
  }

  /**
   * @return The {@link FabricUIManager} if it's been initialized.
   */
  /* package */ FabricUIManager getUIManager() {
    return mFabricUIManager;
  }

  public void registerSegment(int segmentId, String path) {
    registerSegmentNative(segmentId, path);
  }

  private static class BridgelessViewManagerResolver implements ViewManagerResolver {
    private final List<ReactPackage> mReactPackages;
    private final BridgelessReactContext mBridgelessReactContext;
    private final Map<String, ViewManager> mLazyViewManagerMap = new HashMap<>();
    private @Nullable Map<String, ViewManager> mEagerViewManagerMap = null;

    public BridgelessViewManagerResolver(
        List<ReactPackage> reactPackages, BridgelessReactContext context) {
      mReactPackages = reactPackages;
      mBridgelessReactContext = context;
    }

    @Override
    public synchronized @Nullable ViewManager getViewManager(String viewManagerName) {
      ViewManager viewManager = getLazyViewManager(viewManagerName);
      if (viewManager != null) {
        return viewManager;
      }

      // Once a view manager is not found in all react packages via lazy loading, fall back to
      // default implementation: eagerly initialize all view managers
      return getEagerViewManagerMap().get(viewManagerName);
    }

    @Override
    public synchronized Collection<String> getViewManagerNames() {
      Set<String> allViewManagerNames = new HashSet<>();
      allViewManagerNames.addAll(getLazyViewManagerNames());
      allViewManagerNames.addAll(getEagerViewManagerMap().keySet());
      return allViewManagerNames;
    }

    public synchronized Map<String, ViewManager> getEagerViewManagerMap() {
      if (mEagerViewManagerMap != null) {
        return mEagerViewManagerMap;
      }

      Map<String, ViewManager> viewManagerMap = new HashMap<>();
      for (ReactPackage reactPackage : mReactPackages) {
        if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
          continue;
        }

        List<ViewManager> viewManagersInPackage =
            reactPackage.createViewManagers(mBridgelessReactContext);
        for (ViewManager viewManager : viewManagersInPackage) {
          // TODO(T173624687): Should we throw/warn when the same view manager name is registered
          // twice?
          viewManagerMap.put(viewManager.getName(), viewManager);
        }
      }

      mEagerViewManagerMap = viewManagerMap;
      return mEagerViewManagerMap;
    }

    private @Nullable ViewManager getLazyViewManager(String viewManagerName) {
      if (mLazyViewManagerMap.containsKey(viewManagerName)) {
        return mLazyViewManagerMap.get(viewManagerName);
      }

      for (ReactPackage reactPackage : mReactPackages) {
        if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
          ViewManager viewManager =
              ((ViewManagerOnDemandReactPackage) reactPackage)
                  .createViewManager(mBridgelessReactContext, viewManagerName);
          if (viewManager != null) {
            // TODO(T173624687): Should we throw/warn when the same view manager name is registered
            // twice?
            mLazyViewManagerMap.put(viewManagerName, viewManager);
            return viewManager;
          }
        }
      }

      return null;
    }

    public synchronized Collection<String> getLazyViewManagerNames() {
      Set<String> uniqueNames = new HashSet<>();
      for (ReactPackage reactPackage : mReactPackages) {
        if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
          Collection<String> names =
              ((ViewManagerOnDemandReactPackage) reactPackage)
                  .getViewManagerNames(mBridgelessReactContext);
          if (names != null) {
            uniqueNames.addAll(names);
          }
        }
      }
      return uniqueNames;
    }
  }
}
