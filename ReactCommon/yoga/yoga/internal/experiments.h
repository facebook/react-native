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

#include <cstddef>

namespace facebook {
namespace yoga {
namespace internal {

enum struct Experiment : size_t {
  kDoubleMeasureCallbacks,
};

void enable(Experiment);
void disable(Experiment);
bool toggle(Experiment);

} // namespace internal
} // namespace yoga
} // namespace facebook
