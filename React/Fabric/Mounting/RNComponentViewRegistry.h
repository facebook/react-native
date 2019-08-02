/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RNComponentViewFactory.h>
#import <React/RNComponentViewProtocol.h>
#import <react/core/ReactPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface RNComponentViewRegistry : NSObject

@property (nonatomic, strong, readonly) RNComponentViewFactory *componentViewFactory;

/**
 * Returns a native view instance from the recycle pool (or create)
 * for given `componentHandle` and with given `tag`.
 * #RefuseSingleUse
 */
- (UIView<RNComponentViewProtocol> *)dequeueComponentViewWithComponentHandle:
                                         (facebook::react::ComponentHandle)componentHandle
                                                                         tag:(ReactTag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle
                                            tag:(ReactTag)tag
                                  componentView:(UIView<RNComponentViewProtocol> *)componentView;

/**
 * Returns a native component view by given `tag`.
 */
- (UIView<RNComponentViewProtocol> *)componentViewByTag:(ReactTag)tag;

/**
 * Returns `tag` associated with given `componentView`.
 */
- (ReactTag)tagByComponentView:(UIView<RNComponentViewProtocol> *)componentView;

/**
 * Creates a component view with a given type and puts it to the recycle pool.
 */
- (void)optimisticallyCreateComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle;

@end

NS_ASSUME_NONNULL_END
