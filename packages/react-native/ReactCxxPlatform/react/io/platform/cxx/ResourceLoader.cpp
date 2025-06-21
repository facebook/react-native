/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/io/ResourceLoader.h>

#include <cassert>
#include <fstream>
#include <sstream>

namespace facebook::react {

bool ResourceLoader::isResourceDirectory(const std::string& path) {
  return std::filesystem::is_directory(path);
}

bool ResourceLoader::isResourceFile(const std::string& path) {
  return std::filesystem::exists(path) && !std::filesystem::is_directory(path);
}

std::string ResourceLoader::getResourceFileContents(const std::string& path) {
  std::ifstream file(path, std::ios::binary);
  if (!file.good()) {
    throw std::runtime_error("File not found " + path);
  }
  std::stringstream buffer;
  buffer << file.rdbuf();
  return buffer.str();
}

std::filesystem::path ResourceLoader::getCacheRootPath() {
  return std::filesystem::temp_directory_path();
}
} // namespace facebook::react
