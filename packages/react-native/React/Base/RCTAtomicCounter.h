/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>

typedef NSUInteger (^NSUIntegerCounter)(void);
typedef uint64_t (^UInt64Counter)(void);

/// Creates an Objective-C block that acts as an auto incrementing counter, wherein the backing
/// storage of the value is atomic. Thus, both this function and its return value are thread safe.
RCT_EXTERN NSUIntegerCounter RCTCreateAtomicNSUIntegerCounter(void);
/// Creates an Objective-C block that acts as an auto incrementing counter, wherein the backing
/// storage of the value is atomic. Thus, both this function and its return value are thread safe.
RCT_EXTERN UInt64Counter RCTCreateAtomicUInt64Counter(void);

// NB! Code below is only to be used for testing and debugging
typedef void (^CounterLifeCycleSpy)(void*);
/// Creates an atomic counter. The provided closure exposes an opaque value that can be passed to `RCTAssertAtomicNSUIntegerCounterIsDeallocated` to assert whether the underlying storage has been deallocated.
RCT_EXTERN inline NSUIntegerCounter RCTCreateAtomicNSUIntegerCounterWithSpy(CounterLifeCycleSpy);
/// Creates an atomic counter. The provided closure exposes an opaque value that can be passed to `RCTAssertAtomicUInt64CounterIsDeallocated` to assert whether the underlying storage has been deallocated.
RCT_EXTERN inline UInt64Counter RCTCreateAtomicUInt64CounterWithSpy(CounterLifeCycleSpy);
RCT_EXTERN BOOL RCTAssertAtomicNSUIntegerCounterIsDeallocated(void*);
RCT_EXTERN BOOL RCTAssertAtomicUInt64CounterIsDeallocated(void*);
