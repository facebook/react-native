/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * RCTBlockGuard is designed to be used with obj-c blocks to assist with manual deallocation of C++ resources
 * tied to lifetime of a block. If C++ resources needs to be manually released at the end of block or when the block
 * is deallocated, place the clean up code inside constructor and make sure the instance of the class is references in
 * the block.
 */
@interface RCTBlockGuard : NSObject

- (instancetype)initWithCleanup:(void (^)(void))cleanup;

@end

NS_ASSUME_NONNULL_END
