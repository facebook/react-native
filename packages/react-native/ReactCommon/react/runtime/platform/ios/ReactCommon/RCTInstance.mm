/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInstance.h"

#import <memory>

#import <React/NSDataBigString.h>
#import <React/RCTAssert.h>
#import <React/RCTBridge+Inspector.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeModuleDecorator.h>
#import <React/RCTBridgeProxy+Cxx.h>
#import <React/RCTBridgeProxy.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTConstants.h>
#import <React/RCTCxxUtils.h>
#import <React/RCTDevSettings.h>
#import <React/RCTDisplayLink.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTJavaScriptLoader.h>
#import <React/RCTLog.h>
#import <React/RCTLogBox.h>
#import <React/RCTModuleData.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTRedBox.h>
#import <React/RCTSurfacePresenter.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/RuntimeExecutor.h>
#import <cxxreact/ReactMarker.h>
#import <jsinspector-modern/ReactCdp.h>
#import <jsireact/JSIExecutor.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "ObjCTimerRegistry.h"
#import "RCTJSThreadManager.h"
#import "RCTLegacyUIManagerConstantsProvider.h"
#import "RCTPerformanceLoggerUtils.h"

#if RCT_DEV_MENU && __has_include(<React/RCTDevLoadingViewProtocol.h>)
#import <React/RCTDevLoadingViewProtocol.h>
#endif

using namespace facebook;
using namespace facebook::react;

static NSString *sRuntimeDiagnosticFlags = nil;
NSString *RCTInstanceRuntimeDiagnosticFlags(void)
{
  return sRuntimeDiagnosticFlags ? [sRuntimeDiagnosticFlags copy] : [NSString new];
}

void RCTInstanceSetRuntimeDiagnosticFlags(NSString *flags)
{
  if (!flags) {
    return;
  }
  sRuntimeDiagnosticFlags = [flags copy];
}

@interface RCTInstance () <RCTTurboModuleManagerDelegate, RCTTurboModuleManagerRuntimeHandler>
@end

@implementation RCTInstance {
  std::unique_ptr<ReactInstance> _reactInstance;
  std::shared_ptr<JSRuntimeFactory> _jsRuntimeFactory;
  __weak id<RCTTurboModuleManagerDelegate> _appTMMDelegate;
  __weak id<RCTInstanceDelegate> _delegate;
  RCTSurfacePresenter *_surfacePresenter;
  RCTPerformanceLogger *_performanceLogger;
  RCTDisplayLink *_displayLink;
  RCTInstanceInitialBundleLoadCompletionBlock _onInitialBundleLoad;
  RCTTurboModuleManager *_turboModuleManager;
  std::mutex _invalidationMutex;
  std::atomic<bool> _valid;
  RCTJSThreadManager *_jsThreadManager;
  NSDictionary *_launchOptions;

  // APIs supporting interop with native modules and view managers
  RCTBridgeModuleDecorator *_bridgeModuleDecorator;

  jsinspector_modern::HostTarget *_parentInspectorTarget;
}

#pragma mark - Public

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsRuntimeFactory:(std::shared_ptr<facebook::react::JSRuntimeFactory>)jsRuntimeFactory
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)tmmDelegate
             onInitialBundleLoad:(RCTInstanceInitialBundleLoadCompletionBlock)onInitialBundleLoad
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry
           parentInspectorTarget:(jsinspector_modern::HostTarget *)parentInspectorTarget
                   launchOptions:(nullable NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _performanceLogger = [RCTPerformanceLogger new];
    registerPerformanceLoggerHooks(_performanceLogger);
    [_performanceLogger markStartForTag:RCTPLReactInstanceInit];

    _delegate = delegate;
    _jsRuntimeFactory = jsRuntimeFactory;
    _appTMMDelegate = tmmDelegate;
    _jsThreadManager = [RCTJSThreadManager new];
    _onInitialBundleLoad = onInitialBundleLoad;
    _bridgeModuleDecorator = [[RCTBridgeModuleDecorator alloc] initWithViewRegistry:[RCTViewRegistry new]
                                                                     moduleRegistry:moduleRegistry
                                                                      bundleManager:bundleManager
                                                                  callableJSModules:[RCTCallableJSModules new]];
    _parentInspectorTarget = parentInspectorTarget;
    {
      __weak __typeof(self) weakSelf = self;
      [_bridgeModuleDecorator.callableJSModules
          setBridgelessJSModuleMethodInvoker:^(
              NSString *moduleName, NSString *methodName, NSArray *args, dispatch_block_t onComplete) {
            // TODO: Make RCTInstance call onComplete
            [weakSelf callFunctionOnJSModule:moduleName method:methodName args:args];
          }];
    }
    _launchOptions = launchOptions;

    [self _start];
  }
  return self;
}

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args
{
  if (_valid) {
    _reactInstance->callFunctionOnModule(
        [moduleName UTF8String], [method UTF8String], convertIdToFollyDynamic(args ?: @[]));
  }
}

- (void)invalidate
{
  std::lock_guard<std::mutex> lock(_invalidationMutex);
  _valid = false;
  if (self->_reactInstance) {
    self->_reactInstance->unregisterFromInspector();
  }
  [_surfacePresenter suspend];
  [_jsThreadManager dispatchToJSThread:^{
    /**
     * Every TurboModule is invalidated on its own method queue.
     * TurboModuleManager invalidate blocks the calling thread until all TurboModules are invalidated.
     */
    [self->_turboModuleManager invalidate];

    // Clean up all the Resources
    self->_reactInstance = nullptr;
    self->_jsRuntimeFactory = nullptr;
    self->_appTMMDelegate = nil;
    self->_delegate = nil;
    [self->_displayLink invalidate];
    self->_displayLink = nil;

    self->_turboModuleManager = nil;
    self->_performanceLogger = nil;

    // Terminate the JavaScript thread, so that no other work executes after this block.
    self->_jsThreadManager = nil;
  }];
}

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path
{
  if (_valid) {
    _reactInstance->registerSegment(static_cast<uint32_t>([segmentId unsignedIntValue]), path.UTF8String);
  }
}

#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  if ([_appTMMDelegate respondsToSelector:@selector(getModuleClassFromName:)]) {
    return [_appTMMDelegate getModuleClassFromName:name];
  }

  return nil;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  if ([_appTMMDelegate respondsToSelector:@selector(getModuleInstanceFromClass:)]) {
    id<RCTTurboModule> module = [_appTMMDelegate getModuleInstanceFromClass:moduleClass];
    [self _attachBridgelessAPIsToModule:module];
    return module;
  }

  return nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if ([_appTMMDelegate respondsToSelector:@selector(getTurboModule:jsInvoker:)]) {
    return [_appTMMDelegate getTurboModule:name jsInvoker:jsInvoker];
  }

  return nullptr;
}

#pragma mark - RCTTurboModuleManagerRuntimeHandler

- (RuntimeExecutor)runtimeExecutorForTurboModuleManager:(RCTTurboModuleManager *)turboModuleManager
{
  if (_valid) {
    return _reactInstance->getBufferedRuntimeExecutor();
  }

  return nullptr;
}

#pragma mark - Private

- (void)_start
{
  // Set up timers
  auto objCTimerRegistry = std::make_unique<ObjCTimerRegistry>();
  auto timing = objCTimerRegistry->timing;
  auto *objCTimerRegistryRawPtr = objCTimerRegistry.get();

  auto timerManager = std::make_shared<TimerManager>(std::move(objCTimerRegistry));
  objCTimerRegistryRawPtr->setTimerManager(timerManager);

  __weak __typeof(self) weakSelf = self;
  auto onJsError = [=](const JsErrorHandler::ParsedError &error) { [weakSelf _handleJSError:error]; };

  // Create the React Instance
  _reactInstance = std::make_unique<ReactInstance>(
      _jsRuntimeFactory->createJSRuntime(_jsThreadManager.jsMessageThread),
      _jsThreadManager.jsMessageThread,
      timerManager,
      onJsError,
      _parentInspectorTarget);
  _valid = true;

  RuntimeExecutor bufferedRuntimeExecutor = _reactInstance->getBufferedRuntimeExecutor();
  timerManager->setRuntimeExecutor(bufferedRuntimeExecutor);

  auto jsCallInvoker = make_shared<RuntimeSchedulerCallInvoker>(_reactInstance->getRuntimeScheduler());
  RCTBridgeProxy *bridgeProxy =
      [[RCTBridgeProxy alloc] initWithViewRegistry:_bridgeModuleDecorator.viewRegistry_DEPRECATED
          moduleRegistry:_bridgeModuleDecorator.moduleRegistry
          bundleManager:_bridgeModuleDecorator.bundleManager
          callableJSModules:_bridgeModuleDecorator.callableJSModules
          dispatchToJSThread:^(dispatch_block_t block) {
            __strong __typeof(self) strongSelf = weakSelf;
            if (strongSelf && strongSelf->_valid) {
              strongSelf->_reactInstance->getBufferedRuntimeExecutor()([=](jsi::Runtime &runtime) { block(); });
            }
          }
          registerSegmentWithId:^(NSNumber *segmentId, NSString *path) {
            __strong __typeof(self) strongSelf = weakSelf;
            if (strongSelf && strongSelf->_valid) {
              [strongSelf registerSegmentWithId:segmentId path:path];
            }
          }
          runtime:_reactInstance->getJavaScriptContext()
          launchOptions:_launchOptions];
  bridgeProxy.jsCallInvoker = jsCallInvoker;
  [RCTBridge setCurrentBridge:(RCTBridge *)bridgeProxy];

  // Set up TurboModules
  _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridgeProxy:bridgeProxy
                                                     bridgeModuleDecorator:_bridgeModuleDecorator
                                                                  delegate:self
                                                                 jsInvoker:jsCallInvoker];
  _turboModuleManager.runtimeHandler = self;

#if RCT_DEV
  /**
   * Instantiating DevMenu has the side-effect of registering
   * shortcuts for CMD + d, CMD + i,  and CMD + n via RCTDevMenu.
   * Therefore, when TurboModules are enabled, we must manually create this
   * NativeModule.
   */
  [_turboModuleManager moduleForName:"RCTDevMenu"];
#endif // end RCT_DEV

  // Initialize RCTModuleRegistry so that TurboModules can require other TurboModules.
  [_bridgeModuleDecorator.moduleRegistry setTurboModuleRegistry:_turboModuleManager];

  RCTLogSetBridgelessModuleRegistry(_bridgeModuleDecorator.moduleRegistry);
  RCTLogSetBridgelessCallableJSModules(_bridgeModuleDecorator.callableJSModules);

  auto contextContainer = std::make_shared<ContextContainer>();
  [_delegate didCreateContextContainer:contextContainer];

  contextContainer->insert(
      "RCTImageLoader", facebook::react::wrapManagedObject([_turboModuleManager moduleForName:"RCTImageLoader"]));
  contextContainer->insert(
      "RCTEventDispatcher",
      facebook::react::wrapManagedObject([_turboModuleManager moduleForName:"RCTEventDispatcher"]));
  contextContainer->insert("RCTBridgeModuleDecorator", facebook::react::wrapManagedObject(_bridgeModuleDecorator));
  contextContainer->insert("RuntimeScheduler", std::weak_ptr<RuntimeScheduler>(_reactInstance->getRuntimeScheduler()));
  contextContainer->insert("RCTBridgeProxy", facebook::react::wrapManagedObject(bridgeProxy));

  _surfacePresenter = [[RCTSurfacePresenter alloc]
        initWithContextContainer:contextContainer
                 runtimeExecutor:bufferedRuntimeExecutor
      bridgelessBindingsExecutor:std::optional(_reactInstance->getUnbufferedRuntimeExecutor())];

  // This enables RCTViewRegistry in modules to return UIViews from its viewForReactTag method
  __weak RCTSurfacePresenter *weakSurfacePresenter = _surfacePresenter;
  [_bridgeModuleDecorator.viewRegistry_DEPRECATED setBridgelessComponentViewProvider:^UIView *(NSNumber *reactTag) {
    RCTSurfacePresenter *strongSurfacePresenter = weakSurfacePresenter;
    if (strongSurfacePresenter == nil) {
      return nil;
    }

    return [strongSurfacePresenter findComponentViewWithTag_DO_NOT_USE_DEPRECATED:reactTag.integerValue];
  }];

  // DisplayLink is used to call timer callbacks.
  _displayLink = [RCTDisplayLink new];

  ReactInstance::JSRuntimeFlags options = {
      .isProfiling = false, .runtimeDiagnosticFlags = [RCTInstanceRuntimeDiagnosticFlags() UTF8String]};
  _reactInstance->initializeRuntime(options, [=](jsi::Runtime &runtime) {
    __strong __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    [strongSelf->_turboModuleManager installJSBindings:runtime];
    facebook::react::bindNativeLogger(runtime, [](const std::string &message, unsigned int logLevel) {
      _RCTLogJavaScriptInternal(static_cast<RCTLogLevel>(logLevel), [NSString stringWithUTF8String:message.c_str()]);
    });
    RCTInstallNativeComponentRegistryBinding(runtime);

    if (RCTGetUseNativeViewConfigsInBridgelessMode()) {
      installLegacyUIManagerConstantsProviderBinding(runtime);
    }

    [strongSelf->_delegate instance:strongSelf didInitializeRuntime:runtime];

    // Set up Display Link
    RCTModuleData *timingModuleData = [[RCTModuleData alloc] initWithModuleInstance:timing
                                                                             bridge:nil
                                                                     moduleRegistry:nil
                                                            viewRegistry_DEPRECATED:nil
                                                                      bundleManager:nil
                                                                  callableJSModules:nil];
    [strongSelf->_displayLink registerModuleForFrameUpdates:timing withModuleData:timingModuleData];
    [strongSelf->_displayLink addToRunLoop:[NSRunLoop currentRunLoop]];

    // Attempt to load bundle synchronously, fallback to asynchronously.
    [strongSelf->_performanceLogger markStartForTag:RCTPLScriptDownload];
    [strongSelf _loadJSBundle:[strongSelf->_bridgeModuleDecorator.bundleManager bundleURL]];
  });

  [_performanceLogger markStopForTag:RCTPLReactInstanceInit];
}

- (void)_attachBridgelessAPIsToModule:(id<RCTTurboModule>)module
{
  __weak RCTInstance *weakSelf = self;
  if ([module respondsToSelector:@selector(setDispatchToJSThread:)]) {
    ((id<RCTJSDispatcherModule>)module).dispatchToJSThread = ^(dispatch_block_t block) {
      __strong __typeof(self) strongSelf = weakSelf;

      if (strongSelf && strongSelf->_valid) {
        strongSelf->_reactInstance->getBufferedRuntimeExecutor()([=](jsi::Runtime &runtime) { block(); });
      }
    };
  }

  if ([module respondsToSelector:@selector(setSurfacePresenter:)]) {
    [module performSelector:@selector(setSurfacePresenter:) withObject:_surfacePresenter];
  }

  // Replaces bridge.isInspectable
  if ([module respondsToSelector:@selector(setIsInspectable:)]) {
#if RCT_DEV_MENU
    if (_valid) {
      _reactInstance->getBufferedRuntimeExecutor()([module](jsi::Runtime &runtime) {
        ((id<RCTDevSettingsInspectable>)module).isInspectable = runtime.isInspectable();
      });
    }
#endif
  }
}

- (void)handleBundleLoadingError:(NSError *)error
{
  if (!_valid) {
    return;
  }

  RCTRedBox *redBox = [_turboModuleManager moduleForName:"RedBox"];

  RCTExecuteOnMainQueue(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidFailToLoadNotification
                                                        object:self
                                                      userInfo:@{@"error" : error}];
    [redBox showErrorMessage:[error localizedDescription]];

    RCTFatal(error);
  });
}

- (void)_loadJSBundle:(NSURL *)sourceURL
{
#if RCT_DEV_MENU && __has_include(<React/RCTDevLoadingViewProtocol.h>)
  {
    id<RCTDevLoadingViewProtocol> loadingView =
        (id<RCTDevLoadingViewProtocol>)[_turboModuleManager moduleForName:"DevLoadingView"];
    [loadingView showWithURL:sourceURL];
  }
#endif

  __weak __typeof(self) weakSelf = self;
  [RCTJavaScriptLoader loadBundleAtURL:sourceURL
      onProgress:^(RCTLoadingProgress *progressData) {
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf) {
          return;
        }

#if RCT_DEV_MENU && __has_include(<React/RCTDevLoadingViewProtocol.h>)
        id<RCTDevLoadingViewProtocol> loadingView =
            (id<RCTDevLoadingViewProtocol>)[strongSelf->_turboModuleManager moduleForName:"DevLoadingView"];
        [loadingView updateProgress:progressData];
#endif
      }
      onComplete:^(NSError *error, RCTSource *source) {
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf) {
          return;
        }

        if (error) {
          [strongSelf handleBundleLoadingError:error];
          [strongSelf invalidate];
          return;
        }
        // DevSettings module is needed by _loadScriptFromSource's callback so prior initialization is required
        RCTDevSettings *const devSettings =
            (RCTDevSettings *)[strongSelf->_turboModuleManager moduleForName:"DevSettings"];
        [strongSelf _loadScriptFromSource:source];
        // Set up hot module reloading in Dev only.
        [strongSelf->_performanceLogger markStopForTag:RCTPLScriptDownload];
        [devSettings setupHMRClientWithBundleURL:sourceURL];
      }];
}

- (void)_loadScriptFromSource:(RCTSource *)source
{
  std::lock_guard<std::mutex> lock(_invalidationMutex);
  if (!_valid) {
    return;
  }

  auto script = std::make_unique<NSDataBigString>(source.data);
  const auto *url = deriveSourceURL(source.url).UTF8String;
  _reactInstance->loadScript(std::move(script), url);
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTInstanceDidLoadBundle" object:nil];

  if (_onInitialBundleLoad) {
    _onInitialBundleLoad();
    _onInitialBundleLoad = nil;
  }
}

- (void)_handleJSError:(const JsErrorHandler::ParsedError &)error
{
  NSString *message = [NSString stringWithCString:error.message.c_str() encoding:[NSString defaultCStringEncoding]];
  NSMutableArray<NSDictionary<NSString *, id> *> *stack = [NSMutableArray new];
  for (const JsErrorHandler::ParsedError::StackFrame &frame : error.frames) {
    [stack addObject:@{
      @"file" : [NSString stringWithCString:frame.fileName.c_str() encoding:[NSString defaultCStringEncoding]],
      @"methodName" : [NSString stringWithCString:frame.methodName.c_str() encoding:[NSString defaultCStringEncoding]],
      @"lineNumber" : [NSNumber numberWithInt:frame.lineNumber],
      @"column" : [NSNumber numberWithInt:frame.columnNumber],
    }];
  }
  [_delegate instance:self
      didReceiveJSErrorStack:stack
                     message:message
                 exceptionId:error.exceptionId
                     isFatal:error.isFatal];
}

@end
