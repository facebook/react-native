/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <jsi/jsi.h>

namespace facebook {
namespace jsi {

facebook::jsi::Value valueFromDynamic(
    facebook::jsi::Runtime& runtime,
    const folly::dynamic& dyn);

// Not all legal Value's can be represented by a folly::dynamic. This function
// attempts to detect cylical recursion and terminate it; however, if a maximum
// depth is provided the cyclical recursion check is disabled and the maximum
// recursion depth is used instead. Functions by default are exported as null
// objects, but they may be skipped completely increasing performance by setting
// 'skipFunctions' to true.

folly::dynamic dynamicFromValue(
    facebook::jsi::Runtime& runtime,
    const facebook::jsi::Value& value,
    bool skipFunctions = false,
    int maxDepth = -1);

} // namespace jsi
} // namespace facebook
