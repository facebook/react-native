/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import <ReactCommon/TurboModule.h>
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * This class is a holder for a RCTTurboModule to get the facebook::react::TurboModule::BindingsInstaller.
 */
@interface RCTTurboModuleBindingsInstaller : NSObject

- (instancetype)init NS_UNAVAILABLE;

#ifdef __cplusplus
- (instancetype)initWithBindingsInstaller:(facebook::react::TurboModule::BindingsInstaller)bindingsInstaller
    NS_DESIGNATED_INITIALIZER;

- (facebook::react::TurboModule::BindingsInstaller)get;
#endif

@end

NS_ASSUME_NONNULL_END
