/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

import type {Version} from '../utils/version-utils';

module.exports = ({version}: {version: Version}): string => `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated by scripts/releases/set-version.js
 */

#pragma once

#include <cstdint>
#include <string_view>

#define REACT_NATIVE_VERSION_MAJOR ${version.major}
#define REACT_NATIVE_VERSION_MINOR ${version.minor}
#define REACT_NATIVE_VERSION_PATCH ${version.patch}

namespace facebook::react {

constexpr struct {
  int32_t Major = ${version.major};
  int32_t Minor = ${version.minor};
  int32_t Patch = ${version.patch};
  std::string_view Prerelease = ${
    version.prerelease != null ? `"${version.prerelease}"` : '""'
  };
} ReactNativeVersion;

} // namespace facebook::react
`;
