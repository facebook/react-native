/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cinttypes>
#include <optional>
#include <string>

namespace facebook::react::jsinspector_modern {

struct ExecutionContextDescription {
  int32_t id{};
  std::string origin{""};
  std::string name{"<anonymous>"};
  std::optional<std::string> uniqueId;
};

} // namespace facebook::react::jsinspector_modern
