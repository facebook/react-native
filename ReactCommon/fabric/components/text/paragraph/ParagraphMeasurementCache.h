/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/attributedstring/AttributedString.h>
#include <react/attributedstring/ParagraphAttributes.h>
#include <react/core/LayoutConstraints.h>
#include <react/utils/SimpleThreadSafeCache.h>

namespace facebook {
namespace react {

using ParagraphMeasurementCacheKey =
    std::tuple<AttributedString, ParagraphAttributes, LayoutConstraints>;
using ParagraphMeasurementCacheValue = Size;
using ParagraphMeasurementCache = SimpleThreadSafeCache<
    ParagraphMeasurementCacheKey,
    ParagraphMeasurementCacheValue,
    256>;

} // namespace react
} // namespace facebook
