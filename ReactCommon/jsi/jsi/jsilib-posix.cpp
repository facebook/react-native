/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#ifndef _WINDOWS

#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <cerrno>
#include <stdexcept>

#include <jsi/jsilib.h>

#if __APPLE__
#include <mach/vm_statistics.h>
#define MAP_TAG VM_MAKE_TAG(VM_MEMORY_APPLICATION_SPECIFIC_16)
#endif // __APPLE__

#ifndef MAP_TAG
#define MAP_TAG 0
#endif

namespace facebook {
namespace jsi {

namespace {

constexpr size_t kErrorBufferSize = 512;

__attribute__((format(printf, 1, 2))) void throwFormattedError(
    const char* fmt,
    ...) {
  char logBuffer[kErrorBufferSize];

  va_list va_args;
  va_start(va_args, fmt);
  int result = vsnprintf(logBuffer, sizeof(logBuffer), fmt, va_args);
  va_end(va_args);

  if (result < 0) {
    throw JSINativeException(
        std::string("Failed to format error message: ") + fmt);
  }

  throw JSINativeException(logBuffer);
}

class ScopedFile {
 public:
  ScopedFile(const std::string& path)
      : path_(path), fd_(::open(path.c_str(), O_RDONLY)) {
    if (fd_ == -1) {
      throwFormattedError(
          "Could not open %s: %s", path.c_str(), strerror(errno));
    }
  }

  ~ScopedFile() {
    ::close(fd_);
  }

  size_t size() {
    struct stat fileInfo;
    if (::fstat(fd_, &fileInfo) == -1) {
      throwFormattedError(
          "Could not stat %s: %s", path_.c_str(), strerror(errno));
    }
    return fileInfo.st_size;
  }

  uint8_t* mmap(size_t size) {
    void* result =
        ::mmap(nullptr, size, PROT_READ, MAP_PRIVATE | MAP_TAG, fd_, 0);
    if (result == MAP_FAILED) {
      throwFormattedError(
          "Could not mmap %s: %s", path_.c_str(), strerror(errno));
    }
    return reinterpret_cast<uint8_t*>(result);
  }

  const std::string& path_;
  const int fd_;
};

} // namespace

FileBuffer::FileBuffer(const std::string& path) {
  ScopedFile file(path);
  size_ = file.size();
  data_ = file.mmap(size_);
}

FileBuffer::~FileBuffer() {
  if (::munmap(data_, size_)) {
    // terminate the program with pending exception
    try {
      throwFormattedError(
          "Could not unmap memory (%p, %zu bytes): %s",
          data_,
          size_,
          strerror(errno));
    } catch (...) {
      std::terminate();
    }
  }
}

} // namespace jsi
} // namespace facebook

#endif // !defined(_WINDOWS)
