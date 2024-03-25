/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutConstraints.h"

#include <algorithm>

namespace facebook::react {

Size LayoutConstraints::clamp(const Size& size) const {
  return {
      std::max(minimumSize.width, std::min(maximumSize.width, size.width)),
      std::max(minimumSize.height, std::min(maximumSize.height, size.height))};
}

} // namespace facebook::react
