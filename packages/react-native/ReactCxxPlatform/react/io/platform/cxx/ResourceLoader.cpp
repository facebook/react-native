/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cxxreact/JSBigString.h>
#include <react/io/ResourceLoader.h>

#include <cassert>

namespace facebook::react {

bool ResourceLoader::isResourceDirectory(const std::string& path) {
  return std::filesystem::is_directory(path);
}

bool ResourceLoader::isResourceFile(const std::string& path) {
  return std::filesystem::exists(path) && !std::filesystem::is_directory(path);
}

/* static */ std::unique_ptr<const JSBigString>
ResourceLoader::getResourceFileContents(const std::string& path) {
  return JSBigFileString::fromPath(path);
}

/* static */ std::filesystem::path ResourceLoader::getCacheRootPath() {
  return std::filesystem::temp_directory_path();
}
} // namespace facebook::react
