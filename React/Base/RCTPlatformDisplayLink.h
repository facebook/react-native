/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#include <TargetConditionals.h>

#if !TARGET_OS_OSX
#import <QuartzCore/CADisplayLink.h>
#define RCTPlatformDisplayLink CADisplayLink
#else

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Class representing a timer bound to the display vsync. **/
@interface RCTPlatformDisplayLink : NSObject

+ (RCTPlatformDisplayLink *)displayLinkWithTarget:(id)target selector:(SEL)sel;

- (void)addToRunLoop:(NSRunLoop *)runloop forMode:(NSRunLoopMode)mode;

- (void)removeFromRunLoop:(NSRunLoop *)runloop forMode:(NSRunLoopMode)mode;

- (void)invalidate;

@property (readonly, nonatomic) CFTimeInterval timestamp;
@property (readonly, nonatomic) CFTimeInterval duration;

@property (getter=isPaused, nonatomic) BOOL paused;

@end

NS_ASSUME_NONNULL_END

#endif
