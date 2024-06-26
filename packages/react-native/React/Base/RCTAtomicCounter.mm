/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RCTAtomicCounter.h"
#import <atomic>
#include <memory>

#ifdef DEBUG
struct NSUIntegerCounterLifeCycleInfo {
  std::weak_ptr<std::atomic<NSUInteger>> weakPointer;
};

struct UInt64CounterLifeCycleInfo {
  std::weak_ptr<std::atomic<uint64_t>> weakPointer;
};
#endif

NSUIntegerCounter RCTCreateAtomicNSUIntegerCounter(void) {
  return RCTCreateAtomicNSUIntegerCounterWithSpy(nil);
}

UInt64Counter RCTCreateAtomicUInt64Counter(void) {
  return RCTCreateAtomicUInt64CounterWithSpy(nil);
}

NSUIntegerCounter inline RCTCreateAtomicNSUIntegerCounterWithSpy(CounterLifeCycleSpy spy) {
  auto count = std::make_shared<std::atomic<NSUInteger>>(0);
#ifdef DEBUG
  if (spy) {
    NSUIntegerCounterLifeCycleInfo *privateInfo = new NSUIntegerCounterLifeCycleInfo;
    privateInfo->weakPointer = std::weak_ptr<std::atomic<NSUInteger>>(count);
    spy(privateInfo);
  }
#else
  if (spy) {
    [NSException raise:@"Illegal use of counter spy"
                format:@"Spy should not be provided for %s in production", __FUNCTION__];
    spy(NULL);
  }
#endif
  return ^NSUInteger() {
    return (*count)++;
  };
}

UInt64Counter inline RCTCreateAtomicUInt64CounterWithSpy(CounterLifeCycleSpy spy) {
  auto count = std::make_shared<std::atomic<uint64_t>>(0);
#ifdef DEBUG
  if (spy) {
    UInt64CounterLifeCycleInfo *privateInfo = new UInt64CounterLifeCycleInfo;
    privateInfo->weakPointer = std::weak_ptr<std::atomic<uint64_t>>(count);
    spy(privateInfo);
  }
#else
  if (spy) {
    [NSException raise:@"Illegal use of counter spy"
                format:@"Spy should not be provided for %s in production", __FUNCTION__];
    spy(NULL);
  }
#endif
  return ^uint64_t() {
    return (*count)++;
  };
}

BOOL RCTAssertAtomicNSUIntegerCounterIsDeallocated(void *ptr) {
#ifdef DEBUG
  NSUIntegerCounterLifeCycleInfo* info = static_cast<NSUIntegerCounterLifeCycleInfo *>(ptr);
  if (info) {
    return info->weakPointer.expired();
  }
#else
  [NSException raise:@"Illegal use of counter deallocation observation"
              format:@"%s should not be called in production code", __FUNCTION__];
#endif
  return NO;
}

BOOL RCTAssertAtomicUInt64CounterIsDeallocated(void *ptr) {
#ifdef DEBUG
  UInt64CounterLifeCycleInfo* info = static_cast<UInt64CounterLifeCycleInfo *>(ptr);
  if (info) {
    return info->weakPointer.expired();
  }
#else
  [NSException raise:@"Illegal use of counter deallocation observation"
              format:@"%s should not be called in production code", __FUNCTION__];
#endif
  return NO;
}
