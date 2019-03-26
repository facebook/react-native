/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountItemProtocol.h>
#import <React/RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Removes a component view from another component view.
 */
@interface RCTRemoveMountItem : NSObject <RCTMountItemProtocol>

- (instancetype)initWithChildTag:(ReactTag)childTag
                       parentTag:(ReactTag)parentTag
                           index:(NSInteger)index;

@end

NS_ASSUME_NONNULL_END
