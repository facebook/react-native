/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHost.h"
#import "RCTHost+Internal.h"

#import <PikaOptimizationsMacros/PikaOptimizationsMacros.h>
#import <React/RCTAssert.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTJSThread.h>
#import <React/RCTLog.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTReloadCommand.h>

using namespace facebook::react;

@interface RCTHost () <RCTReloadListener, RCTInstanceDelegate>
@end

@implementation RCTHost {
  RCTInstance *_instance;
  __weak id<RCTHostDelegate> _hostDelegate;
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
  NSURL *_oldDelegateBundleURL;
  NSURL *_bundleURL;
  RCTBundleManager *_bundleManager;
  facebook::react::ReactInstance::BindingsInstallFunc _bindingsInstallFunc;
  RCTHostJSEngineProvider _jsEngineProvider;

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
          turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                 bindingsInstallFunc:(facebook::react::ReactInstance::BindingsInstallFunc)bindingsInstallFunc
                    jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider
{
  if (self = [super init]) {
    _hostDelegate = hostDelegate;
    _turboModuleManagerDelegate = turboModuleManagerDelegate;
    _surfaceStartBuffer = [NSMutableArray new];
    _bundleManager = [RCTBundleManager new];
    _bindingsInstallFunc = bindingsInstallFunc;
    _moduleRegistry = [RCTModuleRegistry new];
    _jsEngineProvider = [jsEngineProvider copy];

    __weak RCTHost *weakSelf = self;

    auto bundleURLGetter = ^NSURL *()
    {
      RCTHost *strongSelf = weakSelf;
      if (!strongSelf) {
        return nil;
      }

      return strongSelf->_bundleURL;
    };

    auto bundleURLSetter = ^(NSURL *bundleURL) {
      RCTHost *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      strongSelf->_bundleURL = bundleURL;
    };

    auto defaultBundleURLGetter = ^NSURL *()
    {
      RCTHost *strongSelf = weakSelf;
      if (!strongSelf) {
        return nil;
      }

      return [strongSelf->_hostDelegate getBundleURL];
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
      RCTHost *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      NSArray<RCTFabricSurface *> *unstartedSurfaces = @[];

      {
        std::lock_guard<std::mutex> guard{strongSelf->_surfaceStartBufferMutex};
        unstartedSurfaces = [NSArray arrayWithArray:strongSelf->_surfaceStartBuffer];
        strongSelf->_surfaceStartBuffer = nil;
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

#pragma mark - Public

- (void)start
{
  if (_instance) {
    RCTLogWarn(
        @"RCTHost should not be creating a new instance if one already exists. This implies there is a bug with how/when this method is being called.");
    [_instance invalidate];
  }
  [self _refreshBundleURL];
  RCTReloadCommandSetBundleURL(_bundleURL);
  _instance = [[RCTInstance alloc] initWithDelegate:self
                                   jsEngineInstance:[self _provideJSEngine]
                                      bundleManager:_bundleManager
                         turboModuleManagerDelegate:_turboModuleManagerDelegate
                                onInitialBundleLoad:_onInitialBundleLoad
                                bindingsInstallFunc:_bindingsInstallFunc
                                     moduleRegistry:_moduleRegistry];
  [_hostDelegate hostDidStart:self];
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

- (RCTModuleRegistry *)getModuleRegistry
{
  return _moduleRegistry;
}

- (RCTSurfacePresenter *)getSurfacePresenter
{
  return [_instance surfacePresenter];
}

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args
{
  [_instance callFunctionOnJSModule:moduleName method:method args:args];
}

#pragma mark - RCTReloadListener

- (void)didReceiveReloadCommand
{
  [_instance invalidate];
  _instance = nil;
  [self _refreshBundleURL];
  RCTReloadCommandSetBundleURL(_bundleURL);

  // Ensure all attached surfaces are restarted after reload
  {
    std::lock_guard<std::mutex> guard{_surfaceStartBufferMutex};
    _surfaceStartBuffer = [NSMutableArray arrayWithArray:[self _getAttachedSurfaces]];
  }

  _instance = [[RCTInstance alloc] initWithDelegate:self
                                   jsEngineInstance:[self _provideJSEngine]
                                      bundleManager:_bundleManager
                         turboModuleManagerDelegate:_turboModuleManagerDelegate
                                onInitialBundleLoad:_onInitialBundleLoad
                                bindingsInstallFunc:_bindingsInstallFunc
                                     moduleRegistry:_moduleRegistry];
  [_hostDelegate hostDidStart:self];

  for (RCTFabricSurface *surface in [self _getAttachedSurfaces]) {
    [surface resetWithSurfacePresenter:[self getSurfacePresenter]];
  }
}

- (void)dealloc
{
  [_instance invalidate];
}

#pragma mark - RCTInstanceDelegate

- (std::shared_ptr<facebook::react::ContextContainer>)createContextContainer
{
  return [_hostDelegate createContextContainer];
}

- (void)instance:(RCTInstance *)instance didReceiveErrorMap:(facebook::react::MapBuffer)errorMap
{
  NSString *message = [NSString stringWithCString:errorMap.getString(JSErrorHandlerKey::kErrorMessage).c_str()
                                         encoding:[NSString defaultCStringEncoding]];
  std::vector<facebook::react::MapBuffer> frames = errorMap.getMapBufferList(JSErrorHandlerKey::kAllStackFrames);
  NSMutableArray<NSDictionary<NSString *, id> *> *stack = [NSMutableArray new];
  for (facebook::react::MapBuffer const &mapBuffer : frames) {
    NSDictionary *frame = @{
      @"file" : [NSString stringWithCString:mapBuffer.getString(JSErrorHandlerKey::kFrameFileName).c_str()
                                   encoding:[NSString defaultCStringEncoding]],
      @"methodName" : [NSString stringWithCString:mapBuffer.getString(JSErrorHandlerKey::kFrameMethodName).c_str()
                                         encoding:[NSString defaultCStringEncoding]],
      @"lineNumber" : [NSNumber numberWithInt:mapBuffer.getInt(JSErrorHandlerKey::kFrameLineNumber)],
      @"column" : [NSNumber numberWithInt:mapBuffer.getInt(JSErrorHandlerKey::kFrameColumnNumber)],
    };
    [stack addObject:frame];
  }
  [_hostDelegate host:self
      didReceiveJSErrorStack:stack
                     message:message
                 exceptionId:errorMap.getInt(JSErrorHandlerKey::kExceptionId)
                     isFatal:errorMap.getBool(JSErrorHandlerKey::kIsFatal)];
}

#pragma mark - Internal

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path
{
  [_instance registerSegmentWithId:segmentId path:path];
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

- (std::shared_ptr<facebook::react::JSEngineInstance>)_provideJSEngine
{
  RCTAssert(_jsEngineProvider, @"_jsEngineProvider must be non-nil");
  std::shared_ptr<facebook::react::JSEngineInstance> jsEngine = _jsEngineProvider();
  RCTAssert(jsEngine != nullptr, @"_jsEngineProvider must return a nonnull pointer");

  return jsEngine;
}

@end
