/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ResourceLoader.h"
#include <glog/logging.h>
#include <fstream>
#include <sstream>

namespace facebook::react {
/* static */ bool ResourceLoader::isAbsolutePath(const std::string& path) {
  return std::filesystem::path(path).is_absolute();
}

/* static */ bool ResourceLoader::isDirectory(const std::string& path) {
  if (isAbsolutePath(path) && std::filesystem::is_directory(path)) {
    return true;
  }

  return isResourceDirectory(path);
}

/* static */ bool ResourceLoader::isFile(const std::string& path) {
  if (isAbsolutePath(path) && std::filesystem::exists(path) &&
      !std::filesystem::is_directory(path)) {
    return true;
  }

  return isResourceFile(path);
}

/* static */ std::string ResourceLoader::getFileContents(
    const std::string& path) {
  if (isAbsolutePath(path)) {
    std::ifstream file(path, std::ios::binary);
    if (!file.good()) {
      return getResourceFileContents(path);
    }
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
  }

  return getResourceFileContents(path);
}

/* static */ std::filesystem::path ResourceLoader::getCacheDirectory(
    const std::string& path) {
  auto root = getCacheRootPath() / CACHE_DIR;
  if (!std::filesystem::exists(root)) {
    try {
      std::filesystem::create_directory(root);
    } catch (...) {
      LOG(ERROR) << "Failed to create root cache directory: " << root;
      throw;
    }
  }

  if (path.empty()) {
    return root;
  }

  auto dir = root / path;
  try {
    std::filesystem::create_directories(dir);
    return dir;
  } catch (...) {
    LOG(ERROR) << "Failed to create cache directory: " << dir;
    throw;
  }
}

} // namespace facebook::react
