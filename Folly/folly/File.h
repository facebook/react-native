/*
 * Copyright 2013-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>

#include <string>
#include <system_error>

#include <folly/ExceptionWrapper.h>
#include <folly/Expected.h>
#include <folly/Portability.h>
#include <folly/Range.h>
#include <folly/portability/Unistd.h>

namespace folly {

/**
 * A File represents an open file.
 */
class File {
 public:
  /**
   * Creates an empty File object, for late initialization.
   */
  File() noexcept;

  /**
   * Create a File object from an existing file descriptor.
   * Takes ownership of the file descriptor if ownsFd is true.
   */
  explicit File(int fd, bool ownsFd = false) noexcept;

  /**
   * Open and create a file object.  Throws on error.
   * Owns the file descriptor implicitly.
   */
  explicit File(const char* name, int flags = O_RDONLY, mode_t mode = 0666);
  explicit File(
      const std::string& name,
      int flags = O_RDONLY,
      mode_t mode = 0666);
  explicit File(StringPiece name, int flags = O_RDONLY, mode_t mode = 0666);

  /**
   * All the constructors that are not noexcept can throw std::system_error.
   * This is a helper method to use folly::Expected to chain a file open event
   * to something else you want to do with the open fd.
   */
  template <typename... Args>
  static Expected<File, exception_wrapper> makeFile(Args&&... args) noexcept {
    try {
      return File(std::forward<Args>(args)...);
    } catch (const std::system_error& se) {
      return makeUnexpected(exception_wrapper(std::current_exception(), se));
    }
  }

  ~File();

  /**
   * Create and return a temporary, owned file (uses tmpfile()).
   */
  static File temporary();

  /**
   * Return the file descriptor, or -1 if the file was closed.
   */
  int fd() const {
    return fd_;
  }

  /**
   * Returns 'true' iff the file was successfully opened.
   */
  explicit operator bool() const {
    return fd_ != -1;
  }

  /**
   * Duplicate file descriptor and return File that owns it.
   */
  File dup() const;

  /**
   * If we own the file descriptor, close the file and throw on error.
   * Otherwise, do nothing.
   */
  void close();

  /**
   * Closes the file (if owned).  Returns true on success, false (and sets
   * errno) on error.
   */
  bool closeNoThrow();

  /**
   * Returns and releases the file descriptor; no longer owned by this File.
   * Returns -1 if the File object didn't wrap a file.
   */
  int release() noexcept;

  /**
   * Swap this File with another.
   */
  void swap(File& other) noexcept;

  // movable
  File(File&&) noexcept;
  File& operator=(File&&);

  // FLOCK (INTERPROCESS) LOCKS
  //
  // NOTE THAT THESE LOCKS ARE flock() LOCKS.  That is, they may only be used
  // for inter-process synchronization -- an attempt to acquire a second lock
  // on the same file descriptor from the same process may succeed.  Attempting
  // to acquire a second lock on a different file descriptor for the same file
  // should fail, but some systems might implement flock() using fcntl() locks,
  // in which case it will succeed.
  void lock();
  bool try_lock();
  void unlock();

  void lock_shared();
  bool try_lock_shared();
  void unlock_shared();

 private:
  void doLock(int op);
  bool doTryLock(int op);

  // unique
  File(const File&) = delete;
  File& operator=(const File&) = delete;

  int fd_;
  bool ownsFd_;
};

void swap(File& a, File& b) noexcept;

} // namespace folly
