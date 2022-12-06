/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/RawProps.h>

namespace facebook::react {

folly::dynamic mergeDynamicProps(
    folly::dynamic const &source,
    folly::dynamic const &patch);

RawProps mergeRawProps(folly::dynamic const &source, RawProps const &patch);

} // namespace facebook::react
