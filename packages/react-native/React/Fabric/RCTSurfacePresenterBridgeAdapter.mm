/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenterBridgeAdapter.h"

#import <cxxreact/MessageQueueThread.h>
#import <jsi/jsi.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTConstants.h>
#import <React/RCTImageLoader.h>
#import <React/RCTImageLoaderWithAttributionProtocol.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterStub.h>

#import <ReactCommon/RuntimeExecutor.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/ManagedObjectWrapper.h>

using namespace facebook::react;

@interface RCTBridge ()
- (std::shared_ptr<facebook::react::MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

static std::shared_ptr<const ContextContainer> RCTContextContainerFromBridge(RCTBridge *bridge)
{
  auto contextContainer = std::make_shared<const ContextContainer>();

  RCTImageLoader *imageLoader = RCTTurboModuleEnabled()
      ? [bridge moduleForName:@"RCTImageLoader" lazilyLoadIfNecessary:YES]
      : [bridge moduleForClass:[RCTImageLoader class]];

  contextContainer->insert("Bridge", wrapManagedObjectWeakly(bridge));
  contextContainer->insert("RCTImageLoader", wrapManagedObject((id<RCTImageLoaderWithAttributionProtocol>)imageLoader));
  return contextContainer;
}

RuntimeExecutor RCTRuntimeExecutorFromBridge(RCTBridge *bridge)
{
  RCTAssert(bridge, @"RCTRuntimeExecutorFromBridge: Bridge must not be nil.");

  auto bridgeWeakWrapper = wrapManagedObjectWeakly([bridge batchedBridge] ?: bridge);

  RuntimeExecutor runtimeExecutor = [bridgeWeakWrapper](
                                        std::function<void(facebook::jsi::Runtime & runtime)> &&callback) {
    RCTBridge *bridge = unwrapManagedObjectWeakly(bridgeWeakWrapper);

    RCTAssert(bridge, @"RCTRuntimeExecutorFromBridge: Bridge must not be nil at the moment of scheduling a call.");

    [bridge invokeAsync:[bridgeWeakWrapper, callback = std::move(callback)]() {
      RCTCxxBridge *batchedBridge = (RCTCxxBridge *)unwrapManagedObjectWeakly(bridgeWeakWrapper);

      RCTAssert(batchedBridge, @"RCTRuntimeExecutorFromBridge: Bridge must not be nil at the moment of invocation.");

      if (!batchedBridge) {
        return;
      }

      auto runtime = (facebook::jsi::Runtime *)(batchedBridge.runtime);

      RCTAssert(
          runtime, @"RCTRuntimeExecutorFromBridge: Bridge must have a valid jsi::Runtime at the moment of invocation.");

      if (!runtime) {
        return;
      }

      callback(*runtime);
    }];
  };

  return runtimeExecutor;
}

@implementation RCTSurfacePresenterBridgeAdapter {
  RCTSurfacePresenter *_Nullable _surfacePresenter;
  __weak RCTBridge *_bridge;
  __weak RCTBridge *_batchedBridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
              contextContainer:(std::shared_ptr<const ContextContainer>)contextContainer
{
  if (self = [super init]) {
    contextContainer->update(*RCTContextContainerFromBridge(bridge));
    _surfacePresenter = [[RCTSurfacePresenter alloc] initWithContextContainer:contextContainer
                                                              runtimeExecutor:RCTRuntimeExecutorFromBridge(bridge)
                                                   bridgelessBindingsExecutor:std::nullopt];

    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;

    [self _updateSurfacePresenter];
    [self _addBridgeObservers:_bridge];
  }

  return self;
}

- (void)dealloc
{
  [_surfacePresenter suspend];
}

- (RCTBridge *)bridge
{
  return _bridge;
}

- (void)setBridge:(RCTBridge *)bridge
{
  if (bridge == _bridge) {
    return;
  }

  [self _removeBridgeObservers:_bridge];

  [_surfacePresenter suspend];

  _bridge = bridge;
  _batchedBridge = [_bridge batchedBridge] ?: _bridge;

  [self _updateSurfacePresenter];

  [self _addBridgeObservers:_bridge];

  [_surfacePresenter resume];
}

- (void)_updateSurfacePresenter
{
  _surfacePresenter.runtimeExecutor = RCTRuntimeExecutorFromBridge(_bridge);
  _surfacePresenter.contextContainer->update(*RCTContextContainerFromBridge(_bridge));

  [_bridge setSurfacePresenter:_surfacePresenter];
  [_batchedBridge setSurfacePresenter:_surfacePresenter];
}

- (void)_addBridgeObservers:(RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillReloadNotification:)
                                               name:RCTBridgeWillReloadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleJavaScriptDidLoadNotification:)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillBeInvalidatedNotification:)
                                               name:RCTBridgeWillBeInvalidatedNotification
                                             object:bridge];
}

- (void)_removeBridgeObservers:(RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTBridgeWillReloadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTJavaScriptDidLoadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTBridgeWillBeInvalidatedNotification object:bridge];
}

#pragma mark - Bridge events

- (void)handleBridgeWillReloadNotification:(NSNotification *)notification
{
  [_surfacePresenter suspend];
}

- (void)handleBridgeWillBeInvalidatedNotification:(NSNotification *)notification
{
  [_surfacePresenter suspend];
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge == _batchedBridge) {
    // Nothing really changed.
    return;
  }

  _batchedBridge = bridge;
  _batchedBridge.surfacePresenter = _surfacePresenter;

  [self _updateSurfacePresenter];

  [_surfacePresenter resume];
}

@end
