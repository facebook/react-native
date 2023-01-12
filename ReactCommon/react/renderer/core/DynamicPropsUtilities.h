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

/*
 * Accepts two `folly::dynamic` objects as arguments. Both arguments need to
 * represent a dictionary. It updates `source` with key/value pairs from
 * `patch`, overriding existing keys.
 */
folly::dynamic mergeDynamicProps(
    folly::dynamic const &source,
    folly::dynamic const &patch);

} // namespace facebook::react
