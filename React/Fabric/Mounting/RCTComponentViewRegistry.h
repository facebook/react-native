/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#import <react/core/ReactPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface RCTComponentViewRegistry : NSObject

@property (nonatomic, strong, readonly) RCTComponentViewFactory *componentViewFactory;

/**
 * Returns a native view instance from the recycle pool (or create)
 * for given `componentHandle` and with given `tag`.
 * #RefuseSingleUse
 */
- (UIView<RCTComponentViewProtocol> *)dequeueComponentViewWithComponentHandle:
                                          (facebook::react::ComponentHandle)componentHandle
                                                                          tag:(ReactTag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle
                                            tag:(ReactTag)tag
                                  componentView:(UIView<RCTComponentViewProtocol> *)componentView;

/**
 * Returns a native component view by given `tag`.
 */
- (UIView<RCTComponentViewProtocol> *)componentViewByTag:(ReactTag)tag;

/**
 * Returns `tag` assosiated with given `componentView`.
 */
- (ReactTag)tagByComponentView:(UIView<RCTComponentViewProtocol> *)componentView;

/**
 * Creates a component view with a given type and puts it to the recycle pool.
 */
- (void)optimisticallyCreateComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle;

@end

NS_ASSUME_NONNULL_END
