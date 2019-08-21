// Copyright 2004-present Facebook. All Rights Reserved.

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
