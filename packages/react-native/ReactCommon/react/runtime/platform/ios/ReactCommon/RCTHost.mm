/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHost.h"
#import "RCTHost+Internal.h"

#import <React/RCTAssert.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTInspectorDevServerHelper.h>
#import <React/RCTInspectorNetworkHelper.h>
#import <React/RCTInspectorUtils.h>
#import <React/RCTJSThread.h>
#import <React/RCTLog.h>
#import <React/RCTMockDef.h>
#import <React/RCTPausedInDebuggerOverlayController.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTReloadCommand.h>
#import <jsinspector-modern/InspectorFlags.h>
#import <jsinspector-modern/InspectorInterfaces.h>
#import <jsinspector-modern/ReactCdp.h>
#import <optional>

RCT_MOCK_DEF(RCTHost, _RCTLogNativeInternal);
#define _RCTLogNativeInternal RCT_MOCK_USE(RCTHost, _RCTLogNativeInternal)

using namespace facebook::react;

@interface RCTHost () <RCTReloadListener, RCTInstanceDelegate>
@property (nonatomic, readonly) jsinspector_modern::HostTarget *inspectorTarget;
@end

class RCTHostHostTargetDelegate : public facebook::react::jsinspector_modern::HostTargetDelegate {
 public:
  RCTHostHostTargetDelegate(RCTHost *host)
      : host_(host),
        pauseOverlayController_([[RCTPausedInDebuggerOverlayController alloc] init]),
        networkHelper_([[RCTInspectorNetworkHelper alloc] init])
  {
  }

  jsinspector_modern::HostTargetMetadata getMetadata() override
  {
    auto metadata = [RCTInspectorUtils getHostMetadata];

    return {
        .appDisplayName = [metadata.appDisplayName UTF8String],
        .appIdentifier = [metadata.appIdentifier UTF8String],
        .deviceName = [metadata.deviceName UTF8String],
        .integrationName = "iOS Bridgeless (RCTHost)",
        .platform = [metadata.platform UTF8String],
        .reactNativeVersion = [metadata.reactNativeVersion UTF8String],
    };
  }

  void onReload(const PageReloadRequest &request) override
  {
    RCTAssertMainQueue();
    [static_cast<id<RCTReloadListener>>(host_) didReceiveReloadCommand];
  }

  void onSetPausedInDebuggerMessage(const OverlaySetPausedInDebuggerMessageRequest &request) override
  {
    RCTAssertMainQueue();
    if (!request.message.has_value()) {
      [pauseOverlayController_ hide];
    } else {
      __weak RCTHost *hostWeak = host_;
      [pauseOverlayController_
          showWithMessage:@(request.message.value().c_str())
                 onResume:^{
                   RCTAssertMainQueue();
                   RCTHost *hostStrong = hostWeak;
                   if (!hostStrong) {
                     return;
                   }
                   if (!hostStrong.inspectorTarget) {
                     return;
                   }
                   hostStrong.inspectorTarget->sendCommand(jsinspector_modern::HostCommand::DebuggerResume);
                 }];
    }
  }

  void loadNetworkResource(const RCTInspectorLoadNetworkResourceRequest &params, RCTInspectorNetworkExecutor executor)
      override
  {
    [networkHelper_ loadNetworkResourceWithParams:params executor:executor];
  }

 private:
  __weak RCTHost *host_;
  RCTPausedInDebuggerOverlayController *pauseOverlayController_;
  RCTInspectorNetworkHelper *networkHelper_;
};

@implementation RCTHost {
  RCTInstance *_instance;

  __weak id<RCTHostDelegate> _hostDelegate;
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
  __weak id<RCTContextContainerHandling> _contextContainerHandler;

  NSURL *_oldDelegateBundleURL;
  NSURL *_bundleURL;
  RCTBundleManager *_bundleManager;
  RCTHostBundleURLProvider _bundleURLProvider;
  RCTHostJSEngineProvider _jsEngineProvider;

  NSDictionary *_launchOptions;

  std::vector<__weak RCTFabricSurface *> _attachedSurfaces;

  RCTModuleRegistry *_moduleRegistry;

  std::unique_ptr<RCTHostHostTargetDelegate> _inspectorHostDelegate;
  std::shared_ptr<jsinspector_modern::HostTarget> _inspectorTarget;
  std::optional<int> _inspectorPageId;
}

+ (void)initialize
{
  _RCTInitializeJSThreadConstantInternal();
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                     hostDelegate:(id<RCTHostDelegate>)hostDelegate
       turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                 jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider
                    launchOptions:(nullable NSDictionary *)launchOptions
{
  return [self
       initWithBundleURLProvider:^{
         return bundleURL;
       }
                    hostDelegate:hostDelegate
      turboModuleManagerDelegate:turboModuleManagerDelegate
                jsEngineProvider:jsEngineProvider
                   launchOptions:launchOptions];
}

/**
 Host initialization should not be resource intensive. A host may be created before any intention of using React Native
 has been expressed.
 */
- (instancetype)initWithBundleURLProvider:(RCTHostBundleURLProvider)provider
                             hostDelegate:(id<RCTHostDelegate>)hostDelegate
               turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                         jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider
                            launchOptions:(nullable NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _hostDelegate = hostDelegate;
    _turboModuleManagerDelegate = turboModuleManagerDelegate;
    _bundleManager = [RCTBundleManager new];
    _moduleRegistry = [RCTModuleRegistry new];
    _jsEngineProvider = [jsEngineProvider copy];
    _launchOptions = [launchOptions copy];

    __weak RCTHost *weakSelf = self;
    auto bundleURLGetter = ^NSURL *() {
      RCTHost *strongSelf = weakSelf;
      if (!strongSelf) {
        return nil;
      }

      return strongSelf->_bundleURL;
    };

    auto bundleURLSetter = ^(NSURL *bundleURL_) {
      [weakSelf _setBundleURL:bundleURL_];
    };

    auto defaultBundleURLGetter = ^NSURL *() {
      RCTHost *strongSelf = weakSelf;
      if (!strongSelf || !strongSelf->_bundleURLProvider) {
        return nil;
      }

      return strongSelf->_bundleURLProvider();
    };

    [_bundleManager setBridgelessBundleURLGetter:bundleURLGetter
                                       andSetter:bundleURLSetter
                                andDefaultGetter:defaultBundleURLGetter];

    // Listen to reload commands
    dispatch_async(dispatch_get_main_queue(), ^{
      RCTRegisterReloadCommandListener(self);
    });

    _inspectorHostDelegate = std::make_unique<RCTHostHostTargetDelegate>(self);
  }
  return self;
}

#pragma mark - Public

- (void)start
{
  if (_bundleURLProvider) {
    [self _setBundleURL:_bundleURLProvider()];
  }
  auto &inspectorFlags = jsinspector_modern::InspectorFlags::getInstance();
  if (inspectorFlags.getFuseboxEnabled() && !_inspectorPageId.has_value()) {
    _inspectorTarget =
        facebook::react::jsinspector_modern::HostTarget::create(*_inspectorHostDelegate, [](auto callback) {
          RCTExecuteOnMainQueue(^{
            callback();
          });
        });
    __weak RCTHost *weakSelf = self;
    _inspectorPageId = facebook::react::jsinspector_modern::getInspectorInstance().addPage(
        "React Native Bridgeless",
        /* vm */ "",
        [weakSelf](std::unique_ptr<facebook::react::jsinspector_modern::IRemoteConnection> remote)
            -> std::unique_ptr<facebook::react::jsinspector_modern::ILocalConnection> {
          RCTHost *strongSelf = weakSelf;
          if (!strongSelf) {
            // This can happen if we're about to be dealloc'd. Reject the connection.
            return nullptr;
          }
          return strongSelf->_inspectorTarget->connect(std::move(remote));
        },
        {.nativePageReloads = true, .prefersFuseboxFrontend = true});
  }
  if (_instance) {
    RCTLogWarn(
        @"RCTHost should not be creating a new instance if one already exists. This implies there is a bug with how/when this method is being called.");
    [_instance invalidate];
  }
  _instance = [[RCTInstance alloc] initWithDelegate:self
                                   jsRuntimeFactory:[self _provideJSEngine]
                                      bundleManager:_bundleManager
                         turboModuleManagerDelegate:_turboModuleManagerDelegate
                                     moduleRegistry:_moduleRegistry
                              parentInspectorTarget:_inspectorTarget.get()
                                      launchOptions:_launchOptions];
  [_hostDelegate hostDidStart:self];
}

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                             mode:(DisplayMode)displayMode
                                initialProperties:(NSDictionary *)properties
{
  RCTFabricSurface *surface = [[RCTFabricSurface alloc] initWithSurfacePresenter:self.surfacePresenter
                                                                      moduleName:moduleName
                                                               initialProperties:properties];
  surface.surfaceHandler.setDisplayMode(displayMode);
  [self _attachSurface:surface];

  [_instance callFunctionOnBufferedRuntimeExecutor:[surface](facebook::jsi::Runtime &_) { [surface start]; }];
  return surface;
}

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName initialProperties:(NSDictionary *)properties
{
  return [self createSurfaceWithModuleName:moduleName mode:DisplayMode::Visible initialProperties:properties];
}

- (RCTModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

- (RCTSurfacePresenter *)surfacePresenter
{
  return [_instance surfacePresenter];
}

- (RCTBundleManager *)bundleManager
{
  return _bundleManager;
}

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args
{
  [_instance callFunctionOnJSModule:moduleName method:method args:args];
}

#pragma mark - RCTReloadListener

- (void)didReceiveReloadCommand
{
  [self _reloadWithShouldRestartSurfaces:YES];
}

- (void)dealloc
{
  [_instance invalidate];
  if (_inspectorPageId.has_value()) {
    facebook::react::jsinspector_modern::getInspectorInstance().removePage(*_inspectorPageId);
    _inspectorPageId.reset();
    _inspectorTarget.reset();
  }
}

#pragma mark - RCTInstanceDelegate

- (BOOL)instance:(RCTInstance *)instance
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
           originalMessage:(NSString *_Nullable)originalMessage
                      name:(NSString *_Nullable)name
            componentStack:(NSString *_Nullable)componentStack
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal
                 extraData:(NSDictionary<NSString *, id> *)extraData
{
  if (![_hostDelegate respondsToSelector:@selector(host:
                                             didReceiveJSErrorStack:message:originalMessage:name:componentStack
                                                                   :exceptionId:isFatal:extraData:)]) {
    return NO;
  }

  [_hostDelegate host:self
      didReceiveJSErrorStack:stack
                     message:message
             originalMessage:originalMessage
                        name:name
              componentStack:componentStack
                 exceptionId:exceptionId
                     isFatal:isFatal
                   extraData:extraData];
  return YES;
}

- (void)instance:(RCTInstance *)instance didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  [self.runtimeDelegate host:self didInitializeRuntime:runtime];
}

- (void)loadBundleAtURL:(NSURL *)sourceURL
             onProgress:(RCTSourceLoadProgressBlock)onProgress
             onComplete:(RCTSourceLoadBlock)loadCallback
{
  if ([_hostDelegate respondsToSelector:@selector(loadBundleAtURL:onProgress:onComplete:)]) {
    [_hostDelegate loadBundleAtURL:sourceURL onProgress:onProgress onComplete:loadCallback];
  } else {
    [RCTJavaScriptLoader loadBundleAtURL:sourceURL onProgress:onProgress onComplete:loadCallback];
  }
}

#pragma mark - RCTContextContainerHandling

- (void)didCreateContextContainer:(std::shared_ptr<facebook::react::ContextContainer>)contextContainer
{
  [_contextContainerHandler didCreateContextContainer:contextContainer];
}

#pragma mark - Internal

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path
{
  [_instance registerSegmentWithId:segmentId path:path];
}

- (void)setBundleURLProvider:(RCTHostBundleURLProvider)bundleURLProvider
{
  _bundleURLProvider = [bundleURLProvider copy];
}

- (void)setContextContainerHandler:(id<RCTContextContainerHandling>)contextContainerHandler
{
  _contextContainerHandler = contextContainerHandler;
}

- (void)reload
{
  [self _reloadWithShouldRestartSurfaces:NO];
}

#pragma mark - Private

- (void)_attachSurface:(RCTFabricSurface *)surface
{
  _attachedSurfaces.push_back(surface);
}

- (NSArray<RCTFabricSurface *> *)_getAttachedSurfaces
{
  NSMutableArray<RCTFabricSurface *> *surfaces = [NSMutableArray new];
  for (RCTFabricSurface *surface : _attachedSurfaces) {
    if (surface) {
      [surfaces addObject:surface];
    }
  }

  return surfaces;
}

- (std::shared_ptr<facebook::react::JSRuntimeFactory>)_provideJSEngine
{
  RCTAssert(_jsEngineProvider, @"_jsEngineProvider must be non-nil");
  std::shared_ptr<facebook::react::JSRuntimeFactory> jsEngine = _jsEngineProvider();
  RCTAssert(jsEngine != nullptr, @"_jsEngineProvider must return a nonnull pointer");

  return jsEngine;
}

- (void)_setBundleURL:(NSURL *)bundleURL
{
  // Reset the _bundleURL ivar if the RCTHost delegate presents a new bundleURL
  NSURL *newDelegateBundleURL = bundleURL;
  if (newDelegateBundleURL && ![newDelegateBundleURL isEqual:_oldDelegateBundleURL]) {
    _oldDelegateBundleURL = newDelegateBundleURL;
    _bundleURL = newDelegateBundleURL;
  }

  // Sanitize the bundle URL
  _bundleURL = [RCTConvert NSURL:_bundleURL.absoluteString];

  // Update the global bundle URLq
  RCTReloadCommandSetBundleURL(_bundleURL);
}

- (void)_reloadWithShouldRestartSurfaces:(BOOL)shouldRestartSurfaces
{
  [_instance invalidate];
  _instance = nil;
  if (_bundleURLProvider) {
    [self _setBundleURL:_bundleURLProvider()];
  }

  _instance = [[RCTInstance alloc] initWithDelegate:self
                                   jsRuntimeFactory:[self _provideJSEngine]
                                      bundleManager:_bundleManager
                         turboModuleManagerDelegate:_turboModuleManagerDelegate
                                     moduleRegistry:_moduleRegistry
                              parentInspectorTarget:_inspectorTarget.get()
                                      launchOptions:_launchOptions];
  [_hostDelegate hostDidStart:self];

  for (RCTFabricSurface *surface in [self _getAttachedSurfaces]) {
    [surface resetWithSurfacePresenter:self.surfacePresenter];
    if (shouldRestartSurfaces) {
      [_instance callFunctionOnBufferedRuntimeExecutor:[surface](facebook::jsi::Runtime &_) { [surface start]; }];
    }
  }
}

#pragma mark - jsinspector_modern

- (jsinspector_modern::HostTarget *)inspectorTarget
{
  return _inspectorTarget.get();
}

@end
