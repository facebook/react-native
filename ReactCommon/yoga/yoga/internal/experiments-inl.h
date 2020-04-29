/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
<<<<<<< HEAD
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
=======
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

>>>>>>> fb/0.62-stable
#pragma once

#include "experiments.h"

#include <bitset>

namespace facebook {
namespace yoga {
namespace internal {

namespace detail {
extern std::bitset<sizeof(int)> enabledExperiments;
} // namespace detail

inline bool isEnabled(Experiment experiment) {
  return detail::enabledExperiments.test(static_cast<size_t>(experiment));
}

inline void disableAllExperiments() {
  detail::enabledExperiments = 0;
}

} // namespace internal
} // namespace yoga
} // namespace facebook
