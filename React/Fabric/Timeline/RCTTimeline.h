/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>
#import <react/renderer/uimanager/UIManagerCommitHook.h>
#import <react/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTTimeline : NSObject

+ (instancetype)currentInstance;

- (void)initializeWithContextContainer:(facebook::react::ContextContainer::Shared)contextContainer;

- (std::shared_ptr<facebook::react::UIManagerCommitHook const>)commitHook;

@end

NS_ASSUME_NONNULL_END
