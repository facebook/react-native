/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * General purpose implementation of Delegate Splitter (or Multicast) pattern which allows subscribing multiple
 * `receiving` objects to single `sending` object (which normally does not support that feature by itself).
 *
 * In the case where only one receiving object is registered, using Splitter has zero performance overhead because the
 * receiver is being subscribed directly. In the case where more than one receiving objects are registered, using
 * Splitter introduces some performance overhead.
 */
@interface RCTGenericDelegateSplitter<DelegateT> : NSObject

@property (nonatomic, copy, nullable) void (^delegateUpdateBlock)(DelegateT _Nullable delegate);

/*
 * Creates an object with a given block that will be used to connect a `sending` object with a given `receiving` object.
 * The class calls the block every time after each delegate adding or removing procedure, and it calls it twice: the
 * first time with `nil` and the second time with actual delegate. This is required to establish a proper connection
 * between sending and receiving objects (to reset caches storing information about supported (or not) optional
 * methods).
 */
- (instancetype)initWithDelegateUpdateBlock:(void (^)(DelegateT _Nullable delegate))block;

/*
 * Adds and removes a delegate.
 * The delegates will be called in order of registration.
 * If a delegate returns a value, the value from the last call will be passed to the `sending` object.
 */
- (void)addDelegate:(DelegateT)delegate;
- (void)removeDelegate:(DelegateT)delegate;
- (void)removeAllDelegates;

@end

NS_ASSUME_NONNULL_END
