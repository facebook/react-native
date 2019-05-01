/*
 * Copyright 2012-present Facebook, Inc.
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

#include <map>
#include <string>

#include <folly/Range.h>
#include <folly/ScopeGuard.h>
#include <folly/experimental/io/FsUtil.h>

namespace folly {
namespace test {

/**
 * Temporary file.
 *
 * By default, the file is created in a system-specific location (the value
 * of the TMPDIR environment variable, or /tmp), but you can override that
 * with a different (non-empty) directory passed to the constructor.
 *
 * By default, the file is closed and deleted when the TemporaryFile object
 * is destroyed, but both these behaviors can be overridden with arguments
 * to the constructor.
 */
class TemporaryFile {
 public:
  enum class Scope {
    PERMANENT,
    UNLINK_IMMEDIATELY,
    UNLINK_ON_DESTRUCTION,
  };
  explicit TemporaryFile(
      StringPiece namePrefix = StringPiece(),
      fs::path dir = fs::path(),
      Scope scope = Scope::UNLINK_ON_DESTRUCTION,
      bool closeOnDestruction = true);
  ~TemporaryFile();

  // Movable, but not copyable
  TemporaryFile(TemporaryFile&& other) noexcept {
    assign(other);
  }

  TemporaryFile& operator=(TemporaryFile&& other) {
    if (this != &other) {
      reset();
      assign(other);
    }
    return *this;
  }

  void close();
  int fd() const {
    return fd_;
  }
  const fs::path& path() const;
  void reset();

 private:
  Scope scope_;
  bool closeOnDestruction_;
  int fd_;
  fs::path path_;

  void assign(TemporaryFile& other) {
    scope_ = other.scope_;
    closeOnDestruction_ = other.closeOnDestruction_;
    fd_ = std::exchange(other.fd_, -1);
    path_ = other.path_;
  }
};

/**
 * Temporary directory.
 *
 * By default, the temporary directory is created in a system-specific
 * location (the value of the TMPDIR environment variable, or /tmp), but you
 * can override that with a non-empty directory passed to the constructor.
 *
 * By default, the directory is recursively deleted when the TemporaryDirectory
 * object is destroyed, but that can be overridden with an argument
 * to the constructor.
 */

class TemporaryDirectory {
 public:
  enum class Scope {
    PERMANENT,
    DELETE_ON_DESTRUCTION,
  };
  explicit TemporaryDirectory(
      StringPiece namePrefix = StringPiece(),
      fs::path dir = fs::path(),
      Scope scope = Scope::DELETE_ON_DESTRUCTION);
  ~TemporaryDirectory();

  // Movable, but not copiable
  TemporaryDirectory(TemporaryDirectory&&) = default;
  TemporaryDirectory& operator=(TemporaryDirectory&&) = default;

  const fs::path& path() const {
    return *path_;
  }

 private:
  Scope scope_;
  std::unique_ptr<fs::path> path_;
};

/**
 * Changes into a temporary directory, and deletes it with all its contents
 * upon destruction, also changing back to the original working directory.
 */
class ChangeToTempDir {
 public:
  ChangeToTempDir();
  ~ChangeToTempDir();

  // Movable, but not copiable
  ChangeToTempDir(ChangeToTempDir&&) = default;
  ChangeToTempDir& operator=(ChangeToTempDir&&) = default;

  const fs::path& path() const {
    return dir_.path();
  }

 private:
  TemporaryDirectory dir_;
  fs::path orig_;
};

namespace detail {
struct SavedState {
  void* previousThreadLocalHandler;
  int previousCrtReportMode;
};
SavedState disableInvalidParameters();
void enableInvalidParameters(SavedState state);
} // namespace detail

// Ok, so fun fact: The CRT on windows will actually abort
// on certain failed parameter validation checks in debug
// mode rather than simply returning -1 as it does in release
// mode. We can however, ensure consistent behavior by
// registering our own thread-local invalid parameter handler
// for the duration of the call, and just have that handler
// immediately return. We also have to disable CRT asertion
// alerts for the duration of the call, otherwise we get
// the abort-retry-ignore window.
template <typename Func>
auto msvcSuppressAbortOnInvalidParams(Func func) -> decltype(func()) {
  auto savedState = detail::disableInvalidParameters();
  SCOPE_EXIT {
    detail::enableInvalidParameters(savedState);
  };
  return func();
}

/**
 * Easy PCRE regex matching. Note that pattern must match the ENTIRE target,
 * so use .* at the start and end of the pattern, as appropriate.  See
 * http://regex101.com/ for a PCRE simulator.
 */
#define EXPECT_PCRE_MATCH(pattern_stringpiece, target_stringpiece) \
  EXPECT_PRED2(                                                    \
      ::folly::test::detail::hasPCREPatternMatch,                  \
      pattern_stringpiece,                                         \
      target_stringpiece)
#define EXPECT_NO_PCRE_MATCH(pattern_stringpiece, target_stringpiece) \
  EXPECT_PRED2(                                                       \
      ::folly::test::detail::hasNoPCREPatternMatch,                   \
      pattern_stringpiece,                                            \
      target_stringpiece)

namespace detail {
bool hasPCREPatternMatch(StringPiece pattern, StringPiece target);
bool hasNoPCREPatternMatch(StringPiece pattern, StringPiece target);
} // namespace detail

/**
 * Use these patterns together with CaptureFD and EXPECT_PCRE_MATCH() to
 * test for the presence (or absence) of log lines at a particular level:
 *
 *   CaptureFD stderr(2);
 *   LOG(INFO) << "All is well";
 *   EXPECT_NO_PCRE_MATCH(glogErrOrWarnPattern(), stderr.readIncremental());
 *   LOG(ERROR) << "Uh-oh";
 *   EXPECT_PCRE_MATCH(glogErrorPattern(), stderr.readIncremental());
 */
inline std::string glogErrorPattern() {
  return ".*(^|\n)E[0-9].*";
}
inline std::string glogWarningPattern() {
  return ".*(^|\n)W[0-9].*";
}
// Error OR warning
inline std::string glogErrOrWarnPattern() {
  return ".*(^|\n)[EW][0-9].*";
}

/**
 * Temporarily capture a file descriptor by redirecting it into a file.
 * You can consume its entire output thus far via read(), incrementally
 * via readIncremental(), or via callback using chunk_cob.
 * Great for testing logging (see also glog*Pattern()).
 */
class CaptureFD {
 private:
  struct NoOpChunkCob {
    void operator()(StringPiece) {}
  };

 public:
  using ChunkCob = std::function<void(folly::StringPiece)>;

  /**
   * chunk_cob is is guaranteed to consume all the captured output. It is
   * invoked on each readIncremental(), and also on FD release to capture
   * as-yet unread lines.  Chunks can be empty.
   */
  explicit CaptureFD(int fd, ChunkCob chunk_cob = NoOpChunkCob());
  ~CaptureFD();

  /**
   * Restore the captured FD to its original state. It can be useful to do
   * this before the destructor so that you can read() the captured data and
   * log about it to the formerly captured stderr or stdout.
   */
  void release();

  /**
   * Reads the whole file into a string, but does not remove the redirect.
   */
  std::string read() const;

  /**
   * Read any bytes that were appended to the file since the last
   * readIncremental.  Great for testing line-by-line output.
   */
  std::string readIncremental();

 private:
  ChunkCob chunkCob_;
  TemporaryFile file_;

  int fd_;
  int oldFDCopy_; // equal to fd_ after restore()

  off_t readOffset_; // for incremental reading
};

} // namespace test
} // namespace folly
