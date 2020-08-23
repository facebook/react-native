/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

bool isNetworkInspected(
    const std::string &owner,
    const std::string &app,
    const std::string &device);
}
} // namespace inspector
} // namespace hermes
} // namespace facebook
