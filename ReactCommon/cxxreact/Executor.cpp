// Copyright 2004-present Facebook. All Rights Reserved.

#include "Executor.h"

#include <errno.h>
#include <fcntl.h>
#include <fstream>
#include <stdio.h>
#include <sys/stat.h>

#include <folly/Memory.h>

namespace facebook {
namespace react {

void JSExecutor::loadApplicationScript(std::string bundlePath, std::string sourceURL, int flags) {
  if ((flags & UNPACKED_JS_SOURCE) == 0) {
    throw std::runtime_error("No unpacked js source file");
  }
  return loadApplicationScript(
      JSBigMmapString::fromOptimizedBundle(bundlePath),
      std::move(sourceURL));
}

static JSBigMmapString::Encoding encodingFromByte(uint8_t byte) {
  switch (byte) {
  case 0:
    return JSBigMmapString::Encoding::Unknown;
  case 1:
    return JSBigMmapString::Encoding::Ascii;
  case 2:
    return JSBigMmapString::Encoding::Utf8;
  case 3:
    return JSBigMmapString::Encoding::Utf16;
  default:
    throw std::invalid_argument("Unknown bundle encoding");
  }
}

std::unique_ptr<const JSBigMmapString> JSBigMmapString::fromOptimizedBundle(
    const std::string& bundlePath) {
  uint8_t sha1[20];
  uint8_t encoding;
  struct stat fileInfo;
  int fd = -1;
  SCOPE_FAIL { CHECK(fd == -1 || ::close(fd) == 0); };

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
    if (fd == -1) {
      throw std::runtime_error(std::string("could not open js bundle file: ") + ::strerror(errno));
    }
  }

  if (::fstat(fd, &fileInfo)) {
    throw std::runtime_error(std::string("fstat on js bundle failed: ") + strerror(errno));
  }

  return folly::make_unique<const JSBigMmapString>(
      fd,
      fileInfo.st_size,
      sha1,
      encodingFromByte(encoding));
}

}  // namespace react
}  // namespace facebook
