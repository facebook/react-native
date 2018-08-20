// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "JSBigString.h"

#include <fcntl.h>
#include <sys/stat.h>

#include <folly/Memory.h>
#include <folly/ScopeGuard.h>

namespace facebook {
namespace react {

std::unique_ptr<const JSBigFileString> JSBigFileString::fromPath(const std::string& sourceURL) {
  int fd = ::open(sourceURL.c_str(), O_RDONLY);
  folly::checkUnixError(fd, "Could not open file", sourceURL);
  SCOPE_EXIT { CHECK(::close(fd) == 0); };

  struct stat fileInfo;
  folly::checkUnixError(::fstat(fd, &fileInfo), "fstat on bundle failed.");

  return folly::make_unique<const JSBigFileString>(fd, fileInfo.st_size);
}

}  // namespace react
}  // namespace facebook
