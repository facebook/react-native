/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHost.h"

#import <PikaOptimizationsMacros/PikaOptimizationsMacros.h>
#import <React/RCTAssert.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTJSThread.h>
#import <React/RCTLog.h>
#import <React/RCTReloadCommand.h>

using namespace facebook::react;

NSString *const RCTHostWillReloadNotification = @"RCTHostWillReloadNotification";
NSString *const RCTHostDidReloadNotification = @"RCTHostDidReloadNotification";

@interface RCTHost () <RCTReloadListener>
@end

@implementation RCTHost {
  RCTInstance *_instance;
  __weak id<RCTInstanceDelegate> _instanceDelegate;
  __weak id<RCTHostDelegate> _hostDelegate;
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
  NSURL *_oldDelegateBundleURL;
  NSURL *_bundleURL;
  RCTBundleManager *_bundleManager;
  facebook::react::ReactInstance::BindingsInstallFunc _bindingsInstallFunc;
  JsErrorHandler::JsErrorHandlingFunc _jsErrorHandlingFunc;

  // All the surfaces that need to be started after main bundle execution
  NSMutableArray<RCTFabricSurface *> *_surfaceStartBuffer;
  std::mutex _surfaceStartBufferMutex;

  RCTInstanceInitialBundleLoadCompletionBlock _onInitialBundleLoad;
  std::vector<__weak RCTFabricSurface *> _attachedSurfaces;

  RCTModuleRegistry *_moduleRegistry;
}

+ (void)initialize
{
  _RCTInitializeJSThreadConstantInternal();
}

/**
 Host initialization should not be resource intensive. A host may be created before any intention of using React Native
 has been expressed.
 */
- (instancetype)initWithHostDelegate:(id<RCTHostDelegate>)hostDelegate
                    instanceDelegate:(id<RCTInstanceDelegate>)instanceDelegate
          turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                 bindingsInstallFunc:(facebook::react::ReactInstance::BindingsInstallFunc)bindingsInstallFunc
                 jsErrorHandlingFunc:(JsErrorHandler::JsErrorHandlingFunc)jsErrorHandlingFunc;
{
  RCTAssert(
      hostDelegate && instanceDelegate && turboModuleManagerDelegate,
      @"RCTHost cannot be instantiated with any nil init params.");

  if (self = [super init]) {
    _hostDelegate = hostDelegate;
    _instanceDelegate = instanceDelegate;
    _turboModuleManagerDelegate = turboModuleManagerDelegate;
    _surfaceStartBuffer = [NSMutableArray new];
    _bundleManager = [RCTBundleManager new];
    _bindingsInstallFunc = bindingsInstallFunc;
    _moduleRegistry = [RCTModuleRegistry new];
    _jsErrorHandlingFunc = jsErrorHandlingFunc;

    __weak RCTHost *weakHost = self;

    auto bundleURLGetter = ^NSURL *()
    {
      RCTHost *strongHost = weakHost;
      if (!strongHost) {
        return nil;
      }

      return strongHost->_bundleURL;
    };

    auto bundleURLSetter = ^(NSURL *bundleURL) {
      RCTHost *strongHost = weakHost;
      if (!strongHost) {
        return;
      }
      strongHost->_bundleURL = bundleURL;
    };

    auto defaultBundleURLGetter = ^NSURL *()
    {
      RCTHost *strongHost = weakHost;
      if (!strongHost) {
        return nil;
      }

      return [strongHost->_hostDelegate getBundleURL];
    };

    [_bundleManager setBridgelessBundleURLGetter:bundleURLGetter
                                       andSetter:bundleURLSetter
                                andDefaultGetter:defaultBundleURLGetter];

    /**
     * TODO (T108401473) Remove _onInitialBundleLoad, because it was initially
     * introduced to start surfaces after the main JSBundle was fully executed.
     * It is no longer needed because Fabric now dispatches all native-to-JS calls
     * onto the JS thread, including JS calls to start Fabric surfaces.
     * JS calls should be dispatched using the BufferedRuntimeExecutor, which can buffer
     * JS calls before the main JSBundle finishes execution, and execute them after.
     */
    _onInitialBundleLoad = ^{
      RCTHost *strongHost = weakHost;
      if (!strongHost) {
        return;
      }

      NSArray<RCTFabricSurface *> *unstartedSurfaces = @[];

      {
        std::lock_guard<std::mutex> guard{strongHost->_surfaceStartBufferMutex};
        unstartedSurfaces = [NSArray arrayWithArray:strongHost->_surfaceStartBuffer];
        strongHost->_surfaceStartBuffer = nil;
      }

      for (RCTFabricSurface *surface in unstartedSurfaces) {
        [surface start];
      }
    };

    // Listen to reload commands
    dispatch_async(dispatch_get_main_queue(), ^{
      RCTRegisterReloadCommandListener(self);
    });
  }
  return self;
}

#pragma mark - Public API

- (void)preload
{
  if (_instance) {
    RCTLogWarn(
        @"RCTHost should not be creating a new instance if one already exists. This implies there is a bug with how/when this method is being called.");
    [_instance invalidate];
  }
  [self _refreshBundleURL];
  RCTReloadCommandSetBundleURL(_bundleURL);
  _instance = [[RCTInstance alloc] initWithDelegate:_instanceDelegate
                                   jsEngineInstance:[_hostDelegate getJSEngine]
                                      bundleManager:_bundleManager
                         turboModuleManagerDelegate:_turboModuleManagerDelegate
                                onInitialBundleLoad:_onInitialBundleLoad
                                bindingsInstallFunc:_bindingsInstallFunc
                                     moduleRegistry:_moduleRegistry
                                jsErrorHandlingFunc:_jsErrorHandlingFunc];
}

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                             mode:(DisplayMode)displayMode
                                initialProperties:(NSDictionary *)properties
{
  RCTFabricSurface *surface = [[RCTFabricSurface alloc] initWithSurfacePresenter:[self getSurfacePresenter]
                                                                      moduleName:moduleName
                                                               initialProperties:properties];
  surface.surfaceHandler.setDisplayMode(displayMode);
  [self _attachSurface:surface];

  {
    std::lock_guard<std::mutex> guard{_surfaceStartBufferMutex};
    if (_surfaceStartBuffer) {
      [_surfaceStartBuffer addObject:surface];
      return surface;
    }
  }

  [surface start];
  return surface;
}

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName initialProperties:(NSDictionary *)properties
{
  return [self createSurfaceWithModuleName:moduleName mode:DisplayMode::Visible initialProperties:properties];
}

- (RCTJSThreadManager *)getJSThreadManager
{
  return [_instance jsThreadManager];
}

- (RCTModuleRegistry *)getModuleRegistry
{
  return _moduleRegistry;
}

- (RCTPerformanceLogger *)getPerformanceLogger
{
  return [_instance performanceLogger];
}

- (RCTSurfacePresenter *)getSurfacePresenter
{
  return [_instance surfacePresenter];
}

#pragma mark - RCTReloadListener

- (void)didReceiveReloadCommand
{
  [[NSNotificationCenter defaultCenter]
      postNotification:[NSNotification notificationWithName:RCTHostWillReloadNotification object:nil]];
  [_instance invalidate];
  _instance = nil;
  [self _refreshBundleURL];
  RCTReloadCommandSetBundleURL(_bundleURL);

  // Ensure all attached surfaces are restarted after reload
  {
    std::lock_guard<std::mutex> guard{_surfaceStartBufferMutex};
    _surfaceStartBuffer = [NSMutableArray arrayWithArray:[self _getAttachedSurfaces]];
  }

  _instance = [[RCTInstance alloc] initWithDelegate:_instanceDelegate
                                   jsEngineInstance:[_hostDelegate getJSEngine]
                                      bundleManager:_bundleManager
                         turboModuleManagerDelegate:_turboModuleManagerDelegate
                                onInitialBundleLoad:_onInitialBundleLoad
                                bindingsInstallFunc:_bindingsInstallFunc
                                     moduleRegistry:_moduleRegistry
                                jsErrorHandlingFunc:_jsErrorHandlingFunc];
  [[NSNotificationCenter defaultCenter]
      postNotification:[NSNotification notificationWithName:RCTHostDidReloadNotification object:nil]];

  for (RCTFabricSurface *surface in [self _getAttachedSurfaces]) {
    [surface resetWithSurfacePresenter:[self getSurfacePresenter]];
  }
}

// TODO (T74233481) - Should raw instance be accessed in this class like this? These functions shouldn't be called very
// early in startup, but could add some intelligent guards here.
#pragma mark - ReactInstanceForwarding

- (void)callFunctionOnModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args
{
  [_instance callFunctionOnModule:moduleName method:method args:args];
}

- (void)loadScript:(RCTSource *)source
{
  [_instance loadScript:source];
}

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path
{
  [_instance registerSegmentWithId:segmentId path:path];
}

- (void)dealloc
{
  [_instance invalidate];
}

#pragma mark - Private
- (void)_refreshBundleURL FB_OBJC_DIRECT
{
  // Reset the _bundleURL ivar if the RCTHost delegate presents a new bundleURL
  NSURL *newDelegateBundleURL = [_hostDelegate getBundleURL];
  if (newDelegateBundleURL && ![newDelegateBundleURL isEqual:_oldDelegateBundleURL]) {
    _oldDelegateBundleURL = newDelegateBundleURL;
    _bundleURL = newDelegateBundleURL;
  }

  // Sanitize the bundle URL
  _bundleURL = [RCTConvert NSURL:_bundleURL.absoluteString];
}

- (void)_attachSurface:(RCTFabricSurface *)surface FB_OBJC_DIRECT
{
  _attachedSurfaces.push_back(surface);
}

- (NSArray<RCTFabricSurface *> *)_getAttachedSurfaces FB_OBJC_DIRECT
{
  NSMutableArray<RCTFabricSurface *> *surfaces = [NSMutableArray new];
  for (RCTFabricSurface *surface : _attachedSurfaces) {
    if (surface) {
      [surfaces addObject:surface];
    }
  }

  return surfaces;
}

@end
