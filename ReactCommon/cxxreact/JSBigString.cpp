/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSBigString.h"

#include <glog/logging.h>

#include <folly/Memory.h>
#include <folly/ScopeGuard.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/SysMman.h>
#include <folly/portability/SysStat.h>
#include <folly/portability/Unistd.h>

#include <memory>

namespace facebook {
namespace react {

JSBigFileString::JSBigFileString(int fd, size_t size, off_t offset /*= 0*/)
    : m_fd{-1}, m_data{nullptr} {
  folly::checkUnixError(m_fd = dup(fd), "Could not duplicate file descriptor");

  // Offsets given to mmap must be page aligned. We abstract away that
  // restriction by sending a page aligned offset to mmap, and keeping track
  // of the offset within the page that we must alter the mmap pointer by to
  // get the final desired offset.
  if (offset != 0) {
    const static auto ps = sysconf(_SC_PAGESIZE);
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

#ifdef WITH_FBREMAP
// Read and advance the pointer.
static uint16_t read16(char *&data) {
  uint16_t result;
  ::memcpy(&result, data, sizeof(result));
  data += sizeof(result);
  return result;
}

// If the given file has a remapping table header, remap its pages accordingly
// and return the byte offset from the beginning to the unwrapped payload.
static off_t maybeRemap(char *data, size_t size, int fd) {
  // A remapped file's size must be a multiple of its page size, so quickly
  // filter out files with incorrect size, without touching any pages.
  static const size_t kMinPageSize = 4096;
  if (size < kMinPageSize || size % kMinPageSize != 0) {
    return 0;
  }
  const auto begin = data;
  static const uint8_t kRemapMagic[] = {
      0xc6, 0x1f, 0xbc, 0x03, 0xc1, 0x03, 0x19, 0x1f, 0xa1, 0xd0, 0xeb, 0x73};
  if (::memcmp(data, kRemapMagic, sizeof(kRemapMagic)) != 0) {
    return 0;
  }
  data += sizeof(kRemapMagic);
  const size_t filePS = static_cast<size_t>(1) << read16(data);
  if (size & (filePS - 1)) {
    return 0;
  }
  {
    // System page size must be at least as granular as the remapping.
    // TODO: Consider fallback that reads entire file into memory.
    const size_t systemPS = sysconf(_SC_PAGESIZE);
    CHECK(filePS >= systemPS)
        << "filePS: " << filePS << "systemPS: " << systemPS;
  }
  const off_t headerPages = read16(data);
  uint16_t numMappings = read16(data);
  size_t curFilePage = headerPages;
  while (numMappings--) {
    auto memPage = read16(data) + headerPages;
    auto numPages = read16(data);
    if (mmap(
            begin + memPage * filePS,
            numPages * filePS,
            PROT_READ,
            MAP_FILE | MAP_PRIVATE | MAP_FIXED,
            fd,
            curFilePage * filePS) == MAP_FAILED) {
      CHECK(false) << " memPage: " << memPage << " numPages: " << numPages
                   << " curFilePage: " << curFilePage << " size: " << size
                   << " error: " << std::strerror(errno);
    }
    curFilePage += numPages;
  }
  return headerPages * filePS;
}
#endif // WITH_FBREMAP

const char *JSBigFileString::c_str() const {
  if (m_size == 0) {
    return "";
  }
  if (!m_data) {
    m_data =
        (const char *)mmap(0, m_size, PROT_READ, MAP_PRIVATE, m_fd, m_mapOff);
    CHECK(m_data != MAP_FAILED)
        << " fd: " << m_fd << " size: " << m_size << " offset: " << m_mapOff
        << " error: " << std::strerror(errno);
#ifdef WITH_FBREMAP
    // Remapping is only attempted when the entire file was requested.
    if (m_mapOff == 0 && m_pageOff == 0) {
      m_pageOff = maybeRemap(const_cast<char *>(m_data), m_size, m_fd);
    }
#endif // WITH_FBREMAP
  }
  static const size_t kMinPageSize = 4096;
  CHECK(!(reinterpret_cast<uintptr_t>(m_data) & (kMinPageSize - 1)))
      << "mmap address misaligned, likely corrupted"
      << " m_data: " << (const void *)m_data;
  CHECK(m_pageOff <= m_size)
      << "offset impossibly large, likely corrupted"
      << " m_pageOff: " << m_pageOff << " m_size: " << m_size;
  return m_data + m_pageOff;
}

size_t JSBigFileString::size() const {
  // Ensure mapping has been initialized.
  c_str();
  return m_size - m_pageOff;
}

int JSBigFileString::fd() const {
  return m_fd;
}

std::unique_ptr<const JSBigFileString> JSBigFileString::fromPath(
    const std::string &sourceURL) {
  int fd = ::open(sourceURL.c_str(), O_RDONLY);
  folly::checkUnixError(fd, "Could not open file", sourceURL);
  SCOPE_EXIT {
    CHECK(::close(fd) == 0);
  };

  struct stat fileInfo;
  folly::checkUnixError(::fstat(fd, &fileInfo), "fstat on bundle failed.");

  return std::make_unique<const JSBigFileString>(fd, fileInfo.st_size);
}

} // namespace react
} // namespace facebook
