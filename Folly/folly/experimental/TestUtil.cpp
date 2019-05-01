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

#include <folly/experimental/TestUtil.h>

#include <sys/stat.h>
#include <sys/types.h>

#include <boost/regex.hpp>

#include <folly/Exception.h>
#include <folly/File.h>
#include <folly/FileUtil.h>
#include <folly/Memory.h>
#include <folly/String.h>
#include <folly/portability/Fcntl.h>

#ifdef _WIN32
#include <crtdbg.h> // @manual
#endif

namespace folly {
namespace test {

namespace {

fs::path generateUniquePath(fs::path path, StringPiece namePrefix) {
  if (path.empty()) {
    path = fs::temp_directory_path();
  }
  if (namePrefix.empty()) {
    path /= fs::unique_path();
  } else {
    path /=
        fs::unique_path(to<std::string>(namePrefix, ".%%%%-%%%%-%%%%-%%%%"));
  }
  return path;
}

} // namespace

TemporaryFile::TemporaryFile(
    StringPiece namePrefix,
    fs::path dir,
    Scope scope,
    bool closeOnDestruction)
    : scope_(scope),
      closeOnDestruction_(closeOnDestruction),
      fd_(-1),
      path_(generateUniquePath(std::move(dir), namePrefix)) {
  fd_ = open(path_.string().c_str(), O_RDWR | O_CREAT | O_EXCL, 0666);
  checkUnixError(fd_, "open failed");

  if (scope_ == Scope::UNLINK_IMMEDIATELY) {
    boost::system::error_code ec;
    fs::remove(path_, ec);
    if (ec) {
      LOG(WARNING) << "unlink on construction failed: " << ec;
    } else {
      path_.clear();
    }
  }
}

void TemporaryFile::close() {
  if (::close(fd_) == -1) {
    PLOG(ERROR) << "close failed";
  }
  fd_ = -1;
}

const fs::path& TemporaryFile::path() const {
  CHECK(scope_ != Scope::UNLINK_IMMEDIATELY);
  DCHECK(!path_.empty());
  return path_;
}

void TemporaryFile::reset() {
  if (fd_ != -1 && closeOnDestruction_) {
    if (::close(fd_) == -1) {
      PLOG(ERROR) << "close failed (fd = " << fd_ << "): ";
    }
  }

  // If we previously failed to unlink() (UNLINK_IMMEDIATELY), we'll
  // try again here.
  if (scope_ != Scope::PERMANENT && !path_.empty()) {
    boost::system::error_code ec;
    fs::remove(path_, ec);
    if (ec) {
      LOG(WARNING) << "unlink on destruction failed: " << ec;
    }
  }
}

TemporaryFile::~TemporaryFile() {
  reset();
}

TemporaryDirectory::TemporaryDirectory(
    StringPiece namePrefix,
    fs::path dir,
    Scope scope)
    : scope_(scope),
      path_(std::make_unique<fs::path>(
          generateUniquePath(std::move(dir), namePrefix))) {
  fs::create_directory(path());
}

TemporaryDirectory::~TemporaryDirectory() {
  if (scope_ == Scope::DELETE_ON_DESTRUCTION && path_ != nullptr) {
    boost::system::error_code ec;
    fs::remove_all(path(), ec);
    if (ec) {
      LOG(WARNING) << "recursive delete on destruction failed: " << ec;
    }
  }
}

ChangeToTempDir::ChangeToTempDir() {
  orig_ = fs::current_path();
  fs::current_path(path());
}

ChangeToTempDir::~ChangeToTempDir() {
  if (!orig_.empty()) {
    fs::current_path(orig_);
  }
}

namespace detail {

SavedState disableInvalidParameters() {
#ifdef _WIN32
  SavedState ret;
  ret.previousThreadLocalHandler =
      _set_thread_local_invalid_parameter_handler([](const wchar_t*,
                                                     const wchar_t*,
                                                     const wchar_t*,
                                                     unsigned int,
                                                     uintptr_t) {});
  ret.previousCrtReportMode = _CrtSetReportMode(_CRT_ASSERT, 0);
  return ret;
#else
  return SavedState();
#endif
}

#ifdef _WIN32
void enableInvalidParameters(SavedState state) {
  _set_thread_local_invalid_parameter_handler(
      (_invalid_parameter_handler)state.previousThreadLocalHandler);
  _CrtSetReportMode(_CRT_ASSERT, state.previousCrtReportMode);
}
#else
void enableInvalidParameters(SavedState) {}
#endif

bool hasPCREPatternMatch(StringPiece pattern, StringPiece target) {
  return boost::regex_match(
      target.begin(),
      target.end(),
      boost::regex(pattern.begin(), pattern.end()));
}

bool hasNoPCREPatternMatch(StringPiece pattern, StringPiece target) {
  return !hasPCREPatternMatch(pattern, target);
}

} // namespace detail

CaptureFD::CaptureFD(int fd, ChunkCob chunk_cob)
    : chunkCob_(std::move(chunk_cob)), fd_(fd), readOffset_(0) {
  oldFDCopy_ = dup(fd_);
  PCHECK(oldFDCopy_ != -1) << "Could not copy FD " << fd_;

  int file_fd = open(file_.path().string().c_str(), O_WRONLY | O_CREAT, 0600);
  PCHECK(dup2(file_fd, fd_) != -1)
      << "Could not replace FD " << fd_ << " with " << file_fd;
  PCHECK(close(file_fd) != -1) << "Could not close " << file_fd;
}

void CaptureFD::release() {
  if (oldFDCopy_ != fd_) {
    readIncremental(); // Feed chunkCob_
    PCHECK(dup2(oldFDCopy_, fd_) != -1)
        << "Could not restore old FD " << oldFDCopy_ << " into " << fd_;
    PCHECK(close(oldFDCopy_) != -1) << "Could not close " << oldFDCopy_;
    oldFDCopy_ = fd_; // Make this call idempotent
  }
}

CaptureFD::~CaptureFD() {
  release();
}

std::string CaptureFD::read() const {
  std::string contents;
  std::string filename = file_.path().string();
  PCHECK(folly::readFile(filename.c_str(), contents));
  return contents;
}

std::string CaptureFD::readIncremental() {
  std::string filename = file_.path().string();
  // Yes, I know that I could just keep the file open instead. So sue me.
  folly::File f(openNoInt(filename.c_str(), O_RDONLY), true);
  auto size = size_t(lseek(f.fd(), 0, SEEK_END) - readOffset_);
  std::unique_ptr<char[]> buf(new char[size]);
  auto bytes_read = folly::preadFull(f.fd(), buf.get(), size, readOffset_);
  PCHECK(ssize_t(size) == bytes_read);
  readOffset_ += off_t(size);
  chunkCob_(StringPiece(buf.get(), buf.get() + size));
  return std::string(buf.get(), size);
}

} // namespace test
} // namespace folly
