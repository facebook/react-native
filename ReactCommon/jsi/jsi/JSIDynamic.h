/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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

folly::dynamic dynamicFromValue(
    facebook::jsi::Runtime& runtime,
    const facebook::jsi::Value& value);

} // namespace jsi
} // namespace facebook
