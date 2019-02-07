// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "JSBigString.h"

#include <fcntl.h>
#include <sys/stat.h>

#include <folly/Memory.h>
#include <folly/portability/SysMman.h>
#include <folly/ScopeGuard.h>

namespace facebook {
namespace react {

JSBigFileString::JSBigFileString(int fd, size_t size, off_t offset /*= 0*/)
  : m_fd { -1 }
  , m_data { nullptr } {
  folly::checkUnixError(m_fd = dup(fd),
    "Could not duplicate file descriptor");

  // Offsets given to mmap must be page aligend. We abstract away that
  // restriction by sending a page aligned offset to mmap, and keeping track
  // of the offset within the page that we must alter the mmap pointer by to
  // get the final desired offset.
  if (offset != 0) {
    const static auto ps = getpagesize();
    auto d = lldiv(offset, ps);

    m_mapOff = d.quot;
    m_pageOff = d.rem;
    m_size = size + m_pageOff;
  } else {
    m_mapOff = 0;
    m_pageOff = 0;
    m_size = size;
  }
}

JSBigFileString::~JSBigFileString() {
  if (m_data) {
    munmap((void *)m_data, m_size);
  }
  close(m_fd);
}


const char *JSBigFileString::c_str() const {
  if (!m_data) {
    m_data =
      (const char *) mmap(0, m_size, PROT_READ, MAP_SHARED, m_fd, m_mapOff);
    CHECK(m_data != MAP_FAILED)
      << " fd: " << m_fd
      << " size: " << m_size
      << " offset: " << m_mapOff
      << " error: " << std::strerror(errno);
  }
  return m_data + m_pageOff;
}

size_t JSBigFileString::size() const {
  return m_size - m_pageOff;
}

int JSBigFileString::fd() const {
  return m_fd;
}

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
