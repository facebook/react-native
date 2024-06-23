/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RCTSharedCounter.h"
#import <atomic>
#include <memory>

NSUIntegerCounter RCTCreateAtomicNSUIntegerCounter(void) {
  auto count = std::make_shared<std::atomic<NSUInteger>>(0);
  return ^NSUInteger() {
    return (*count)++;
  };
}

UInt64Counter RCTCreateAtomicUInt64Counter(void) {
  auto count = std::make_shared<std::atomic<uint64_t>>(0);
  return ^uint64_t() {
    return (*count)++;
  };
}
