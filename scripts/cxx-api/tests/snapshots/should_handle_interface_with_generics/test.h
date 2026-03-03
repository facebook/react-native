/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Test case for Objective-C interface with generic type parameters.
 *
 * Doxygen 1.11.0 misparses Objective-C lightweight generics, placing
 * <DelegateT> in the base class list and corrupting subsequent declarations.
 *
 * This interface is SKIPPED in the parser output due to malformed Doxygen XML.
 * See SKIP_INTERFACES in builders.py.
 */
@interface RCTGenericDelegateSplitter<DelegateT> : NSObject

@property (nonatomic, copy, nullable) void (^delegateUpdateBlock)(DelegateT _Nullable delegate);

- (instancetype)initWithDelegateUpdateBlock:(void (^)(DelegateT _Nullable delegate))block;
- (void)addDelegate:(DelegateT)delegate;
- (void)removeDelegate:(DelegateT)delegate;
- (void)removeAllDelegates;

@end
