/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTPrimitives.h>
#import <react/core/ComponentDescriptor.h>
#import <react/core/ReactPrimitives.h>
#import <react/mounting/ShadowView.h>
#import <react/mounting/ShadowViewMutation.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface RCTMountingManager : NSObject

@property (nonatomic, weak) id<RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) RCTComponentViewRegistry *componentViewRegistry;

/**
 * Schedule mutations to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)scheduleMutations:(facebook::react::ShadowViewMutationList const &)mutations rootTag:(ReactTag)rootTag;

/**
 * Suggests preliminary creation of a component view of given type.
 * The receiver is free to ignore the request.
 * Can be called from any thread.
 */
- (void)optimisticallyCreateComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle;

- (void)synchronouslyUpdateViewOnUIThread:(ReactTag)reactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const facebook::react::ComponentDescriptor &)componentDescriptor;

@end

NS_ASSUME_NONNULL_END
