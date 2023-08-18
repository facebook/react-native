/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRuntimeExecutorFromBridge.h"
#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <cxxreact/MessageQueueThread.h>
#import <react/utils/ManagedObjectWrapper.h>

using namespace facebook::react;

@interface RCTBridge ()
- (std::shared_ptr<MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

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
