// Copyright 2004-present Facebook. All Rights Reserved.

#include "Executor.h"

#include <errno.h>
#include <fcntl.h>
#include <fstream>
#include <stdio.h>
#include <sys/stat.h>

#include <folly/Memory.h>
#include <folly/ScopeGuard.h>

namespace facebook {
namespace react {

void JSExecutor::loadApplicationScript(std::string bundlePath, std::string sourceURL, int flags) {
  if ((flags & UNPACKED_JS_SOURCE) == 0) {
    throw std::runtime_error("No unpacked js source file");
  }
  return loadApplicationScript(
      JSBigOptimizedBundleString::fromOptimizedBundle(bundlePath),
      std::move(sourceURL));
}

void JSExecutor::loadApplicationScript(int fd, std::string sourceURL) {
  struct stat fileInfo;
  folly::checkUnixError(::fstat(fd, &fileInfo), "fstat on bundle failed.");

  auto bundle = folly::make_unique<JSBigFileString>(fd, fileInfo.st_size);
  return loadApplicationScript(std::move(bundle), std::move(sourceURL));
}

static JSBigOptimizedBundleString::Encoding encodingFromByte(uint8_t byte) {
  switch (byte) {
  case 0:
    return JSBigOptimizedBundleString::Encoding::Unknown;
  case 1:
    return JSBigOptimizedBundleString::Encoding::Ascii;
  case 2:
    return JSBigOptimizedBundleString::Encoding::Utf8;
  case 3:
    return JSBigOptimizedBundleString::Encoding::Utf16;
  default:
    throw std::invalid_argument("Unknown bundle encoding");
  }
}

std::unique_ptr<const JSBigOptimizedBundleString> JSBigOptimizedBundleString::fromOptimizedBundle(
    const std::string& bundlePath) {
  uint8_t sha1[20];
  uint8_t encoding;
  struct stat fileInfo;
  int fd = -1;
  SCOPE_EXIT { CHECK(fd == -1 || ::close(fd) == 0); };

  {
    auto metaPath = bundlePath + UNPACKED_META_PATH_SUFFIX;
    std::ifstream metaFile;
    metaFile.exceptions(std::ifstream::eofbit | std::ifstream::failbit | std::ifstream::badbit);
    metaFile.open(metaPath, std::ifstream::in | std::ifstream::binary);
    metaFile.read(reinterpret_cast<char*>(sha1), sizeof(sha1));
    metaFile.read(reinterpret_cast<char*>(&encoding), sizeof(encoding));
  }

  {
    auto sourcePath = bundlePath + UNPACKED_JS_SOURCE_PATH_SUFFIX;
    fd = ::open(sourcePath.c_str(), O_RDONLY);
    folly::checkUnixError(fd, "could not open js bundle file.");
  }

  folly::checkUnixError(::fstat(fd, &fileInfo), "fstat on js bundle failed.");

  return folly::make_unique<const JSBigOptimizedBundleString>(
      fd,
      fileInfo.st_size,
      sha1,
      encodingFromByte(encoding));
}

}  // namespace react
}  // namespace facebook
