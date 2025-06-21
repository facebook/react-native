/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/NSBigStringBuffer.h>

/**
 * Provides the interface needed to register a Bundle Consumer module.
 */
@protocol RCTBundleConsumer <NSObject>

@property (nonatomic, strong, readwrite) NSBigStringBuffer *scriptBuffer;

@property (nonatomic, strong, readwrite) NSString *sourceURL;

@end
