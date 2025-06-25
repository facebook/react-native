/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactHost.h"

#include <ReactCommon/TurboModuleBinding.h>
#include <cxxreact/JSBigString.h>
#include <glog/logging.h>
#include <jserrorhandler/JsErrorHandler.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/coremodules/AppStateModule.h>
#include <react/coremodules/DeviceInfoModule.h>
#include <react/coremodules/PlatformConstantsModule.h>
#include <react/debug/react_native_assert.h>
#include <react/devsupport/DevLoadingViewModule.h>
#include <react/devsupport/DevServerHelper.h>
#include <react/devsupport/DevSettingsModule.h>
#include <react/devsupport/IDevUIDelegate.h>
#include <react/devsupport/LogBoxModule.h>
#include <react/devsupport/PackagerConnection.h>
#include <react/devsupport/SourceCodeModule.h>
#include <react/devsupport/inspector/Inspector.h>
#include <react/http/IHttpClient.h>
#include <react/http/IWebSocketClient.h>
#include <react/io/ImageLoaderModule.h>
#include <react/io/NetworkingModule.h>
#include <react/io/ResourceLoader.h>
#include <react/io/WebSocketModule.h>
#include <react/logging/LogOnce.h>
#include <react/logging/NativeExceptionsManager.h>
#include <react/nativemodule/defaults/DefaultTurboModules.h>
#include <react/nativemodule/intersectionobserver/NativeIntersectionObserver.h>
#include <react/nativemodule/mutationobserver/NativeMutationObserver.h>
#include <react/nativemodule/webperformance/NativePerformance.h>
#include <react/renderer/animated/AnimatedModule.h>
#include <react/renderer/animated/AnimatedMountingOverrideDelegate.h>
#include <react/renderer/componentregistry/native/NativeComponentRegistryBinding.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerDelegateImpl.h>
#include <react/renderer/scheduler/SurfaceDelegate.h>
#include <react/renderer/scheduler/SurfaceManager.h>
#include <react/renderer/uimanager/IMountingManager.h>
#include <react/runtime/PlatformTimerRegistryImpl.h>
#include <react/runtime/hermes/HermesInstance.h>
#include <react/threading/MessageQueueThreadImpl.h>

namespace facebook::react {

struct ReactInstanceData {
  std::shared_ptr<IMountingManager> mountingManager;
  std::shared_ptr<MessageQueueThread> messageQueueThread;
  std::shared_ptr<RunLoopObserverManager> runLoopObserverManager;
  std::shared_ptr<const ContextContainer> contextContainer;
  ComponentRegistryFactory componentRegistryFactory;
  JsErrorHandler::OnJsError onJsError;
  Logger logger;
  std::shared_ptr<IDevUIDelegate> devUIDelegate;
  TurboModuleManagerDelegates turboModuleManagerDelegates;
  std::shared_ptr<SurfaceDelegate> logBoxSurfaceDelegate;
  std::shared_ptr<NativeAnimatedNodesManagerProvider>
      animatedNodesManagerProvider;
  ReactInstance::BindingsInstallFunc bindingsInstallFunc;
};

ReactHost::ReactHost(
    ReactInstanceConfig reactInstanceConfig,
    std::shared_ptr<IMountingManager> mountingManager,
    std::shared_ptr<RunLoopObserverManager> runLoopObserverManager,
    std::shared_ptr<const ContextContainer> contextContainer,
    JsErrorHandler::OnJsError onJsError,
    Logger logger,
    std::shared_ptr<IDevUIDelegate> devUIDelegate,
    TurboModuleManagerDelegates turboModuleManagerDelegates,
    std::shared_ptr<SurfaceDelegate> logBoxSurfaceDelegate,
    std::shared_ptr<NativeAnimatedNodesManagerProvider>
        animatedNodesManagerProvider,
    ReactInstance::BindingsInstallFunc bindingsInstallFunc) noexcept
    : reactInstanceConfig_(std::move(reactInstanceConfig)) {
  auto componentRegistryFactory =
      mountingManager->getComponentRegistryFactory();
  reactInstanceData_ = std::make_unique<ReactInstanceData>(ReactInstanceData{
      .mountingManager = mountingManager,
      .messageQueueThread = nullptr,
      .runLoopObserverManager = runLoopObserverManager,
      .contextContainer = std::move(contextContainer),
      .componentRegistryFactory = std::move(componentRegistryFactory),
      .onJsError = std::move(onJsError),
      .logger = std::move(logger),
      .devUIDelegate = devUIDelegate,
      .turboModuleManagerDelegates = std::move(turboModuleManagerDelegates),
      .logBoxSurfaceDelegate = logBoxSurfaceDelegate,
      .animatedNodesManagerProvider = animatedNodesManagerProvider,
      .bindingsInstallFunc = std::move(bindingsInstallFunc)});
  if (!reactInstanceData_->contextContainer
           ->find<MessageQueueThreadFactory>(MessageQueueThreadFactoryKey)
           .has_value()) {
    reactInstanceData_->contextContainer->insert(
        MessageQueueThreadFactoryKey, MessageQueueThreadFactory([]() {
          return std::make_shared<MessageQueueThreadImpl>();
        }));
  }
  if (!reactInstanceData_->contextContainer
           ->find<HttpClientFactory>(HttpClientFactoryKey)
           .has_value()) {
    reactInstanceData_->contextContainer->insert(
        HttpClientFactoryKey, getHttpClientFactory());
  }
  if (!reactInstanceData_->contextContainer
           ->find<WebSocketClientFactory>(WebSocketClientFactoryKey)
           .has_value()) {
    reactInstanceData_->contextContainer->insert(
        WebSocketClientFactoryKey, getWebSocketClientFactory());
  }
  createReactInstance();
}

ReactHost::~ReactHost() noexcept {
  destroyReactInstance();
}

void ReactHost::createReactInstance() {
  // Set up timers
  auto platformTimers = std::make_unique<PlatformTimerRegistryImpl>();
  auto* platformTimersPtr = platformTimers.get();
  auto timerManager = std::make_shared<TimerManager>(std::move(platformTimers));
  platformTimersPtr->setTimerManager(timerManager);

  auto httpClientFactory =
      reactInstanceData_->contextContainer->at<HttpClientFactory>(
          HttpClientFactoryKey);

  auto webSocketClientFactory =
      reactInstanceData_->contextContainer->at<WebSocketClientFactory>(
          WebSocketClientFactoryKey);

  // Create devServerHelper
  if (reactInstanceConfig_.enableDebugging) {
    if (!devServerHelper_) {
      devServerHelper_ = std::make_shared<DevServerHelper>(
          reactInstanceConfig_.appId,
          reactInstanceConfig_.deviceName,
          reactInstanceConfig_.devServerHost,
          reactInstanceConfig_.devServerPort,
          httpClientFactory,
          [this](
              const std::string& moduleName,
              const std::string& methodName,
              folly::dynamic&& args) {
            reactInstance_->callFunctionOnModule(
                moduleName, methodName, std::move(args));
          });
    }
    if (!inspector_) {
      inspector_ = std::make_shared<Inspector>(
          reactInstanceConfig_.appId,
          reactInstanceConfig_.deviceName,
          webSocketClientFactory,
          httpClientFactory);
      inspector_->ensureHostTarget(
          [this]() { reloadReactInstance(); },
          [weakDevUIDelegate = std::weak_ptr<IDevUIDelegate>(
               reactInstanceData_->devUIDelegate)](
              bool showDebuggerOverlay,
              std::function<void()>&& resumeDebuggerFn) {
            if (auto debugUIDelegate = weakDevUIDelegate.lock()) {
              if (showDebuggerOverlay) {
                debugUIDelegate->showDebuggerOverlay(
                    std::move(resumeDebuggerFn));
              } else {
                debugUIDelegate->hideDebuggerOverlay();
              }
            }
          });
    }
    if (!packagerConnection_) {
      packagerConnection_ = std::make_unique<PackagerConnection>(
          webSocketClientFactory,
          devServerHelper_->getPackagerConnectionUrl(),
          [this]() { reloadReactInstance(); },
          []() {});
    }
  }

  // Create the React Instance
  auto messageQueueThreadFactory =
      reactInstanceData_->contextContainer->at<MessageQueueThreadFactory>(
          MessageQueueThreadFactoryKey);
  reactInstanceData_->messageQueueThread = messageQueueThreadFactory();
  std::unique_ptr<JSRuntime> runtime = HermesInstance::createJSRuntime(
      nullptr,
      reactInstanceData_->messageQueueThread,
      /* allocInOldGenBeforeTTI */ false);

  if (reactInstanceConfig_.enableDebugging) {
    react_native_assert(
        inspector_ != nullptr && "Inspector is not initialized");
  }
  reactInstance_ = std::make_unique<ReactInstance>(
      std::move(runtime),
      reactInstanceData_->messageQueueThread,
      timerManager,
      reactInstanceData_->onJsError,
      inspector_ != nullptr ? inspector_->inspectorTarget().get() : nullptr);
  timerManager->setRuntimeExecutor(
      reactInstance_->getBufferedRuntimeExecutor());
  reactInstanceData_->contextContainer->insert(
      RuntimeSchedulerKey,
      std::weak_ptr<RuntimeScheduler>(reactInstance_->getRuntimeScheduler()));

  // Create scheduler
  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = reactInstanceData_->contextContainer;
  toolbox.runtimeExecutor = reactInstance_->getBufferedRuntimeExecutor();
  toolbox.bridgelessBindingsExecutor =
      reactInstance_->getUnbufferedRuntimeExecutor();
  toolbox.componentRegistryFactory =
      reactInstanceData_->componentRegistryFactory;
  toolbox.eventBeatFactory =
      [runLoopObserverManager = reactInstanceData_->runLoopObserverManager,
       runtimeScheduler = reactInstance_->getRuntimeScheduler()](
          std::shared_ptr<EventBeat::OwnerBox> ownerBox) {
        return runLoopObserverManager->createEventBeat(
            ownerBox, *runtimeScheduler);
      };

  schedulerDelegate_ = std::make_unique<SchedulerDelegateImpl>(
      reactInstanceData_->mountingManager);
  scheduler_ =
      std::make_unique<Scheduler>(toolbox, nullptr, schedulerDelegate_.get());
  surfaceManager_ = std::make_unique<SurfaceManager>(*scheduler_);

  reactInstanceData_->mountingManager->setSchedulerTaskExecutor(
      [this](SchedulerTask&& task) { runOnScheduler(std::move(task)); });

  reactInstanceData_->mountingManager->setUIManager(scheduler_->getUIManager());

  auto jsInvoker = std::make_shared<RuntimeSchedulerCallInvoker>(
      reactInstance_->getRuntimeScheduler());

  auto liveReloadCallback = [this]() { reloadReactInstance(); };
  reactInstance_->initializeRuntime(
      {
#if defined(WITH_PERFETTO) || defined(RNCXX_WITH_PROFILING_PROVIDER)
          .isProfiling = true
#else
          .isProfiling = false
#endif
          ,
          .runtimeDiagnosticFlags = ""},
      [weakMountingManager =
           std::weak_ptr<IMountingManager>(reactInstanceData_->mountingManager),
       logger = reactInstanceData_->logger,
       devUIDelegate = reactInstanceData_->devUIDelegate,
       turboModuleManagerDelegates =
           reactInstanceData_->turboModuleManagerDelegates,
       jsInvoker = std::move(jsInvoker),
       logBoxSurfaceDelegate = reactInstanceData_->logBoxSurfaceDelegate,
       devServerHelper = devServerHelper_,
       animatedNodesManagerProvider =
           reactInstanceData_->animatedNodesManagerProvider,
       onJsError = reactInstanceData_->onJsError,
       bindingsInstallFunc = reactInstanceData_->bindingsInstallFunc,
       httpClientFactory = std::move(httpClientFactory),
       webSocketClientFactory = std::move(webSocketClientFactory),
       liveReloadCallback =
           std::move(liveReloadCallback)](jsi::Runtime& runtime) {
        if (logger) {
          bindNativeLogger(runtime, logger);
        }

        // Set up component provider
        bindHasComponentProvider(
            runtime, [weakMountingManager](const std::string& name) -> bool {
              if (auto strongMountingManager = weakMountingManager.lock()) {
                return strongMountingManager->hasComponent(name);
              }
              return false;
            });

        auto turboModuleProvider =
            [turboModuleManagerDelegates,
             jsInvoker,
             logBoxSurfaceDelegate,
             devServerHelper,
             devUIDelegate,
             animatedNodesManagerProvider,
             onJsError,
             httpClientFactory = httpClientFactory,
             webSocketClientFactory = webSocketClientFactory,
             liveReloadCallback = liveReloadCallback](
                const std::string& name) -> std::shared_ptr<TurboModule> {
          react_native_assert(
              !name.empty() && "TurboModule name must not be empty");

          for (const auto& turboModuleManagerDelegate :
               turboModuleManagerDelegates) {
            if (turboModuleManagerDelegate) {
              if (auto turboModule =
                      turboModuleManagerDelegate(name, jsInvoker)) {
                return turboModule;
              }
            }
          }

          if (auto turboModule =
                  DefaultTurboModules::getTurboModule(name, jsInvoker)) {
            return turboModule;
          }

          if (name == AnimatedModule::kModuleName) {
            return std::make_shared<AnimatedModule>(
                jsInvoker, animatedNodesManagerProvider);
          } else if (name == AppStateModule::kModuleName) {
            return std::make_shared<AppStateModule>(jsInvoker);
          } else if (name == DeviceInfoModule::kModuleName) {
            return std::make_shared<DeviceInfoModule>(jsInvoker);
          } else if (
              devUIDelegate != nullptr &&
              name == DevLoadingViewModule::kModuleName) {
            return std::make_shared<DevLoadingViewModule>(
                jsInvoker, devUIDelegate);
          } else if (
              devServerHelper && name == DevSettingsModule::kModuleName) {
            return std::make_shared<DevSettingsModule>(
                jsInvoker, devServerHelper, liveReloadCallback);
          } else if (name == PlatformConstantsModule::kModuleName) {
            return std::make_shared<PlatformConstantsModule>(jsInvoker);
          } else if (name == ImageLoaderModule::kModuleName) {
            return std::make_shared<ImageLoaderModule>(jsInvoker);
          } else if (name == SourceCodeModule::kModuleName) {
            return std::make_shared<SourceCodeModule>(
                jsInvoker, devServerHelper);
          } else if (name == WebSocketModule::kModuleName) {
            return std::make_shared<WebSocketModule>(
                jsInvoker, webSocketClientFactory);
          } else if (name == NativeExceptionsManager::kModuleName) {
            return std::make_shared<NativeExceptionsManager>(
                onJsError, jsInvoker);
          } else if (name == NativePerformance::kModuleName) {
            return std::make_shared<NativePerformance>(jsInvoker);
          } else if (name == NativeIntersectionObserver::kModuleName) {
            return std::make_shared<NativeIntersectionObserver>(jsInvoker);
          } else if (name == NativeMutationObserver::kModuleName) {
            return std::make_shared<NativeMutationObserver>(jsInvoker);
          } else if (name == NetworkingModule::kModuleName) {
            return std::make_shared<NetworkingModule>(
                jsInvoker, httpClientFactory);
          } else if (name == LogBoxModule::kModuleName) {
            if (logBoxSurfaceDelegate) {
              return std::make_shared<LogBoxModule>(
                  jsInvoker, logBoxSurfaceDelegate);
            }
          }

          LOG_WARNING_ONCE << "Failed to load TurboModule: " << name;
          return nullptr;
        };

        // Set up TurboModules
        TurboModuleBinding::install(runtime, turboModuleProvider);
        if (bindingsInstallFunc) {
          bindingsInstallFunc(runtime);
        }
      });
}

void ReactHost::destroyReactInstance() {
  if (inspector_ != nullptr) {
    reactInstance_->unregisterFromInspector();
  }
  if (surfaceManager_) {
    surfaceManager_->stopAllSurfaces();
  }
  reactInstanceData_->messageQueueThread->quitSynchronous();
  surfaceManager_ = nullptr;
  scheduler_ = nullptr;
  schedulerDelegate_ = nullptr;

  reactInstanceData_->contextContainer->erase(RuntimeSchedulerKey);
  reactInstanceData_->mountingManager->setSchedulerTaskExecutor(nullptr);
  reactInstance_ = nullptr;
  reactInstanceData_->messageQueueThread = nullptr;
}

void ReactHost::reloadReactInstance() {
  if (isReloadingReactInstance_) {
    return;
  }
  isReloadingReactInstance_ = true;
  std::thread([this]() {
    std::vector<SurfaceManager::SurfaceProps> surfaceProps;
    for (auto& surfaceId : surfaceManager_->getRunningSurfaces()) {
      if (auto surfaceProp = surfaceManager_->getSurfaceProps(surfaceId);
          surfaceProp.has_value()) {
        surfaceProps.emplace_back(*surfaceProp);
      }
    }
    destroyReactInstance();
    createReactInstance();
    loadScriptFromDevServer();
    for (auto& surfaceProp : surfaceProps) {
      startSurface(
          surfaceProp.surfaceId,
          surfaceProp.moduleName,
          surfaceProp.props,
          surfaceProp.layoutConstraints,
          surfaceProp.layoutContext);
    }
    isReloadingReactInstance_ = false;
  }).detach();
}

bool ReactHost::loadScript(
    const std::string& bundlePath,
    const std::string& sourcePath) {
  bool isLoaded = false;
  if (devServerHelper_) {
    devServerHelper_->setSourcePath(sourcePath);
    isLoaded = loadScriptFromDevServer();
  }
  if (!isLoaded) {
    LOG(INFO) << "Devserver is not provided.";
    isLoaded = loadScriptFromBundlePath(bundlePath);
  }
  return isLoaded;
}

bool ReactHost::loadScriptFromDevServer() {
  try {
    auto bundleUrl = devServerHelper_->getBundleUrl();
    auto response =
        devServerHelper_
            ->downloadBundleResourceSync(
                bundleUrl,
                [weakDevUIDelegate = std::weak_ptr<IDevUIDelegate>(
                     reactInstanceData_->devUIDelegate)](
                    DevServerHelper::DownloadProgressStatus status) {
                  if (auto devUIDelegate = weakDevUIDelegate.lock()) {
                    if (status ==
                        DevServerHelper::DownloadProgressStatus::STARTED) {
                      devUIDelegate->showDownloadBundleProgress();
                    } else {
                      devUIDelegate->hideDownloadBundleProgress();
                    }
                  }
                })
            .get();
    auto script = std::make_unique<JSBigStdString>(response);
    reactInstance_->loadScript(
        std::move(script), devServerHelper_->getBundleUrl());
    if (inspector_ != nullptr) {
      inspector_->connectDebugger(devServerHelper_->getInspectorUrl());
    }
    devServerHelper_->setupHMRClient();
    return true;
  } catch (const std::exception& /*e*/) {
    devServerHelper_->setSourcePath("");
    LOG(WARNING)
        << "Unable to download JS bundle from Metro, falling back to prebuilt JS bundle. "
        << "To start Metro, run in command line: 'cd ~/fbsource/xplat/js && js1 run'";
    return false;
  }
}

bool ReactHost::loadScriptFromBundlePath(const std::string& bundlePath) {
  try {
    LOG(INFO) << "Loading JS bundle from bundle path: " << bundlePath;
    auto script = std::make_unique<JSBigStdString>(
        ResourceLoader::getFileContents(bundlePath));
    reactInstance_->loadScript(std::move(script), bundlePath);
    LOG(INFO) << "Loaded JS bundle from bundle path: " << bundlePath;
    return true;
  } catch (const std::exception& /*e*/) {
    LOG(WARNING) << "Unable to read bundle from bundle path" << bundlePath;
    return false;
  }
}

void ReactHost::startSurface(
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& initialProps,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) {
  surfaceManager_->startSurface(
      surfaceId, moduleName, initialProps, layoutConstraints, layoutContext);
}

void ReactHost::setSurfaceConstraints(
    SurfaceId surfaceId,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) {
  surfaceManager_->constraintSurfaceLayout(
      surfaceId, layoutConstraints, layoutContext);
}

void ReactHost::stopSurface(SurfaceId surfaceId) {
  surfaceManager_->stopSurface(surfaceId);
}

void ReactHost::stopAllSurfaces() {
  surfaceManager_->stopAllSurfaces();
}

bool ReactHost::isSurfaceRunning(SurfaceId surfaceId) const noexcept {
  return surfaceManager_->isSurfaceRunning(surfaceId);
}

std::unordered_set<SurfaceId> ReactHost::getRunningSurfaces() const noexcept {
  return surfaceManager_->getRunningSurfaces();
}

void ReactHost::runOnScheduler(
    std::function<void(Scheduler& scheduler)>&& task) const {
  task(*scheduler_);
}

void ReactHost::runOnRuntimeScheduler(
    std::function<void(jsi::Runtime& runtime)>&& task,
    SchedulerPriority priority) const {
  if (!isReloadingReactInstance_) {
    reactInstance_->getRuntimeScheduler()->scheduleTask(
        priority, std::move(task));
  }
}

void ReactHost::emitDeviceEvent(folly::dynamic&& args) {
  if (!isReloadingReactInstance_) {
    reactInstance_->callFunctionOnModule(
        "RCTDeviceEventEmitter", "emit", std::move(args));
  }
}

} // namespace facebook::react
