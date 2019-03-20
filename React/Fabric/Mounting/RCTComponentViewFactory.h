/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of supported component view classes that can instantiate
 * view component instances by given component handle.
 */
@interface RCTComponentViewFactory : NSObject

/**
 * Constructs and returns an instance of the class with a bunch of already registered standard components.
 */
+ (RCTComponentViewFactory *)standardComponentViewFactory;

/**
 * Registers a component view class in the factory.
 */
- (void)registerComponentViewClass:(Class<RCTComponentViewProtocol>)componentViewClass;

/**
 * Creates a component view with given component handle.
 */
- (UIView<RCTComponentViewProtocol> *)createComponentViewWithComponentHandle:
    (facebook::react::ComponentHandle)componentHandle;

@end

NS_ASSUME_NONNULL_END
