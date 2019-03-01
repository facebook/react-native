/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/FileUtil.h>
#include <folly/detail/FileUtilDetail.h>
#include <folly/experimental/TestUtil.h>

#include <deque>
#if defined(__linux__)
#include <dlfcn.h>
#endif

#include <glog/logging.h>

#include <folly/Exception.h>
#include <folly/File.h>
#include <folly/Range.h>
#include <folly/String.h>
#include <folly/portability/GTest.h>

namespace folly { namespace test {

using namespace fileutil_detail;
using namespace std;

namespace {

class Reader {
 public:
  Reader(off_t offset, StringPiece data, std::deque<ssize_t> spec);

  // write-like
  ssize_t operator()(int fd, void* buf, size_t count);

  // pwrite-like
  ssize_t operator()(int fd, void* buf, size_t count, off_t offset);

  // writev-like
  ssize_t operator()(int fd, const iovec* iov, int count);

  // pwritev-like
  ssize_t operator()(int fd, const iovec* iov, int count, off_t offset);

  const std::deque<ssize_t> spec() const { return spec_; }

 private:
  ssize_t nextSize();

  off_t offset_;
  StringPiece data_;
  std::deque<ssize_t> spec_;
};

Reader::Reader(off_t offset, StringPiece data, std::deque<ssize_t> spec)
  : offset_(offset),
    data_(data),
    spec_(std::move(spec)) {
}

ssize_t Reader::nextSize() {
  if (spec_.empty()) {
    throw std::runtime_error("spec empty");
  }
  ssize_t n = spec_.front();
  spec_.pop_front();
  if (n <= 0) {
    if (n == -1) {
      errno = EIO;
    }
    spec_.clear();  // so we fail if called again
  } else {
    offset_ += n;
  }
  return n;
}

ssize_t Reader::operator()(int /* fd */, void* buf, size_t count) {
  ssize_t n = nextSize();
  if (n <= 0) {
    return n;
  }
  if (size_t(n) > count) {
    throw std::runtime_error("requested count too small");
  }
  memcpy(buf, data_.data(), n);
  data_.advance(n);
  return n;
}

ssize_t Reader::operator()(int fd, void* buf, size_t count, off_t offset) {
  EXPECT_EQ(offset_, offset);
  return operator()(fd, buf, count);
}

ssize_t Reader::operator()(int /* fd */, const iovec* iov, int count) {
  ssize_t n = nextSize();
  if (n <= 0) {
    return n;
  }
  ssize_t remaining = n;
  for (; count != 0 && remaining != 0; ++iov, --count) {
    ssize_t len = std::min(remaining, ssize_t(iov->iov_len));
    memcpy(iov->iov_base, data_.data(), len);
    data_.advance(len);
    remaining -= len;
  }
  if (remaining != 0) {
    throw std::runtime_error("requested total size too small");
  }
  return n;
}

ssize_t Reader::operator()(int fd, const iovec* iov, int count, off_t offset) {
  EXPECT_EQ(offset_, offset);
  return operator()(fd, iov, count);
}

}  // namespace

class FileUtilTest : public ::testing::Test {
 protected:
  FileUtilTest();

  Reader reader(std::deque<ssize_t> spec);

  std::string in_;
  std::vector<std::pair<size_t, Reader>> readers_;
};

FileUtilTest::FileUtilTest()
  : in_("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") {
  CHECK_EQ(62, in_.size());

  readers_.emplace_back(0, reader({0}));
  readers_.emplace_back(62, reader({62}));
  readers_.emplace_back(62, reader({62, -1}));  // error after end (not called)
  readers_.emplace_back(61, reader({61, 0}));
  readers_.emplace_back(-1, reader({61, -1}));  // error before end
  readers_.emplace_back(62, reader({31, 31}));
  readers_.emplace_back(62, reader({1, 10, 20, 10, 1, 20}));
  readers_.emplace_back(61, reader({1, 10, 20, 10, 20, 0}));
  readers_.emplace_back(41, reader({1, 10, 20, 10, 0}));
  readers_.emplace_back(-1, reader({1, 10, 20, 10, 20, -1}));
}

Reader FileUtilTest::reader(std::deque<ssize_t> spec) {
  return Reader(42, in_, std::move(spec));
}

TEST_F(FileUtilTest, read) {
  for (auto& p : readers_) {
    std::string out(in_.size(), '\0');
    EXPECT_EQ(p.first, wrapFull(p.second, 0, &out[0], out.size()));
    if (p.first != (decltype(p.first))(-1)) {
      EXPECT_EQ(in_.substr(0, p.first), out.substr(0, p.first));
    }
  }
}

TEST_F(FileUtilTest, pread) {
  for (auto& p : readers_) {
    std::string out(in_.size(), '\0');
    EXPECT_EQ(p.first, wrapFull(p.second, 0, &out[0], out.size(), off_t(42)));
    if (p.first != (decltype(p.first))(-1)) {
      EXPECT_EQ(in_.substr(0, p.first), out.substr(0, p.first));
    }
  }
}

class IovecBuffers {
 public:
  explicit IovecBuffers(std::initializer_list<size_t> sizes);
  explicit IovecBuffers(std::vector<size_t> sizes);

  std::vector<iovec> iov() const { return iov_; }  // yes, make a copy
  std::string join() const { return folly::join("", buffers_); }
  size_t size() const;

 private:
  std::vector<std::string> buffers_;
  std::vector<iovec> iov_;
};

IovecBuffers::IovecBuffers(std::initializer_list<size_t> sizes) {
  iov_.reserve(sizes.size());
  for (auto& s : sizes) {
    buffers_.push_back(std::string(s, '\0'));
  }
  for (auto& b : buffers_) {
    iovec iov;
    iov.iov_base = &b[0];
    iov.iov_len = b.size();
    iov_.push_back(iov);
  }
}

IovecBuffers::IovecBuffers(std::vector<size_t> sizes) {
  iov_.reserve(sizes.size());
  for (auto s : sizes) {
    buffers_.push_back(std::string(s, '\0'));
  }
  for (auto& b : buffers_) {
    iovec iov;
    iov.iov_base = &b[0];
    iov.iov_len = b.size();
    iov_.push_back(iov);
  }
}

size_t IovecBuffers::size() const {
  size_t s = 0;
  for (auto& b : buffers_) {
    s += b.size();
  }
  return s;
}

TEST_F(FileUtilTest, readv) {
  for (auto& p : readers_) {
    IovecBuffers buf({12, 19, 31});
    ASSERT_EQ(62, buf.size());

    auto iov = buf.iov();
    EXPECT_EQ(p.first, wrapvFull(p.second, 0, iov.data(), iov.size()));
    if (p.first != (decltype(p.first))(-1)) {
      EXPECT_EQ(in_.substr(0, p.first), buf.join().substr(0, p.first));
    }
  }
}

TEST(FileUtilTest2, wrapv) {
  TemporaryFile tempFile("file-util-test");
  std::vector<size_t> sizes;
  size_t sum = 0;
  for (int32_t i = 0; i < 1500; ++i) {
    sizes.push_back(i % 3 + 1);
    sum += sizes.back();
  }
  IovecBuffers buf(sizes);
  ASSERT_EQ(sum, buf.size());
  auto iov = buf.iov();
  EXPECT_EQ(sum, wrapvFull(writev, tempFile.fd(), iov.data(), iov.size()));
}

TEST_F(FileUtilTest, preadv) {
  for (auto& p : readers_) {
    IovecBuffers buf({12, 19, 31});
    ASSERT_EQ(62, buf.size());

    auto iov = buf.iov();
    EXPECT_EQ(p.first,
              wrapvFull(p.second, 0, iov.data(), iov.size(), off_t(42)));
    if (p.first != (decltype(p.first))(-1)) {
      EXPECT_EQ(in_.substr(0, p.first), buf.join().substr(0, p.first));
    }
  }
}

TEST(String, readFile) {
  const TemporaryFile afileTemp, emptyFileTemp;
  auto afile = afileTemp.path().string();
  auto emptyFile = emptyFileTemp.path().string();

  EXPECT_TRUE(writeFile(string(), emptyFile.c_str()));
  EXPECT_TRUE(writeFile(StringPiece("bar"), afile.c_str()));

  {
    string contents;
    EXPECT_TRUE(readFile(emptyFile.c_str(), contents));
    EXPECT_EQ(contents, "");
    EXPECT_TRUE(readFile(afile.c_str(), contents, 0));
    EXPECT_EQ("", contents);
    EXPECT_TRUE(readFile(afile.c_str(), contents, 2));
    EXPECT_EQ("ba", contents);
    EXPECT_TRUE(readFile(afile.c_str(), contents));
    EXPECT_EQ("bar", contents);
  }
  {
    vector<unsigned char> contents;
    EXPECT_TRUE(readFile(emptyFile.c_str(), contents));
    EXPECT_EQ(vector<unsigned char>(), contents);
    EXPECT_TRUE(readFile(afile.c_str(), contents, 0));
    EXPECT_EQ(vector<unsigned char>(), contents);
    EXPECT_TRUE(readFile(afile.c_str(), contents, 2));
    EXPECT_EQ(vector<unsigned char>({'b', 'a'}), contents);
    EXPECT_TRUE(readFile(afile.c_str(), contents));
    EXPECT_EQ(vector<unsigned char>({'b', 'a', 'r'}), contents);
  }
}

class ReadFileFd : public ::testing::Test {
 protected:
  void SetUp() override {
    ASSERT_TRUE(writeFile(StringPiece("bar"), aFile.path().string().c_str()));
  }

  TemporaryFile aFile;
};

TEST_F(ReadFileFd, ReadZeroBytes) {
  std::string contents;
  EXPECT_TRUE(readFile(aFile.fd(), contents, 0));
  EXPECT_EQ("", contents);
}

TEST_F(ReadFileFd, ReadPartial) {
  std::string contents;
  EXPECT_TRUE(readFile(aFile.fd(), contents, 2));
  EXPECT_EQ("ba", contents);
}

TEST_F(ReadFileFd, ReadFull) {
  std::string contents;
  EXPECT_TRUE(readFile(aFile.fd(), contents));
  EXPECT_EQ("bar", contents);
}

TEST_F(ReadFileFd, WriteOnlyFd) {
  File f(aFile.path().string(), O_WRONLY);
  std::string contents;
  EXPECT_FALSE(readFile(f.fd(), contents));
  PLOG(INFO);
}

TEST_F(ReadFileFd, InvalidFd) {
  File f(aFile.path().string());
  f.close();
  std::string contents;
  msvcSuppressAbortOnInvalidParams([&] {
    EXPECT_FALSE(readFile(f.fd(), contents));
  });
  PLOG(INFO);
}

class WriteFileAtomic : public ::testing::Test {
 protected:
  WriteFileAtomic() {}

  std::set<std::string> listTmpDir() const {
    std::set<std::string> entries;
    for (auto& entry : fs::directory_iterator(tmpDir_.path())) {
      entries.insert(entry.path().filename().string());
    }
    return entries;
  }

  std::string readData(const string& path) const {
    string data;
    if (!readFile(path.c_str(), data)) {
      throwSystemError("failed to read ", path);
    }
    return data;
  }

  struct stat statFile(const string& path) const {
    struct stat s;
    auto rc = stat(path.c_str(), &s);
    checkUnixError(rc, "failed to stat() ", path);
    return s;
  }

  mode_t getPerms(const string& path) {
    return (statFile(path).st_mode & 0777);
  }

  string tmpPath(StringPiece name) {
    return tmpDir_.path().string() + "/" + name.str();
  }

  void setDirPerms(mode_t mode) {
    auto rc = chmod(tmpDir_.path().string().c_str(), mode);
    checkUnixError(rc, "failed to set permissions on tmp dir");
  }

  TemporaryDirectory tmpDir_{"folly_file_test"};
};

TEST_F(WriteFileAtomic, writeNew) {
  // Call writeFileAtomic() to create a new file
  auto path = tmpPath("foo");
  auto contents = StringPiece{"contents\n"};
  writeFileAtomic(path, contents);

  // The directory should contain exactly 1 file now, with the correct contents
  EXPECT_EQ(set<string>{"foo"}, listTmpDir());
  EXPECT_EQ(contents, readData(path));
  EXPECT_EQ(0644, getPerms(path));
}

TEST_F(WriteFileAtomic, overwrite) {
  // Call writeFileAtomic() to create a new file
  auto path = tmpPath("foo");
  auto contents1 = StringPiece{"contents\n"};
  writeFileAtomic(path, contents1);

  EXPECT_EQ(set<string>{"foo"}, listTmpDir());
  EXPECT_EQ(contents1, readData(path));
  EXPECT_EQ(0644, getPerms(path));

  // Now overwrite the file with different contents
  auto contents2 = StringPiece{"testing"};
  writeFileAtomic(path, contents2);
  EXPECT_EQ(set<string>{"foo"}, listTmpDir());
  EXPECT_EQ(contents2, readData(path));
  EXPECT_EQ(0644, getPerms(path));

  // Test overwriting with relatively large contents, and different permissions
  auto contents3 =
      "asdf" + string(10240, '\n') + "foobar\n" + string(10240, 'b') + "\n";
  writeFileAtomic(path, contents3, 0444);
  EXPECT_EQ(set<string>{"foo"}, listTmpDir());
  EXPECT_EQ(contents3, readData(path));
  EXPECT_EQ(0444, getPerms(path));

  // Test overwriting with empty contents
  //
  // Note that the file's permissions are 0444 at this point (read-only),
  // but we writeFileAtomic() should still replace it successfully.  Since we
  // update it with a rename we need write permissions on the parent directory,
  // but not the destination file.
  auto contents4 = StringPiece("");
  writeFileAtomic(path, contents4, 0400);
  EXPECT_EQ(set<string>{"foo"}, listTmpDir());
  EXPECT_EQ(contents4, readData(path));
  EXPECT_EQ(0400, getPerms(path));
}

TEST_F(WriteFileAtomic, directoryPermissions) {
  // Test writeFileAtomic() when we do not have write permission in the target
  // directory.
  //
  // Make the test directory read-only
  setDirPerms(0555);
  SCOPE_EXIT {
    // Restore directory permissions before we exit, just to ensure the code
    // will be able to clean up the directory.
    try {
      setDirPerms(0755);
    } catch (const std::exception&) {
      // Intentionally ignore errors here, in case an exception is already
      // being thrown.
    }
  };

  // writeFileAtomic() should fail, and the directory should still be empty
  auto path1 = tmpPath("foo");
  auto contents = StringPiece("testing");
  EXPECT_THROW(writeFileAtomic(path1, contents), std::system_error);
  EXPECT_EQ(set<string>{}, listTmpDir());

  // Make the directory writable again, then create the file
  setDirPerms(0755);
  writeFileAtomic(path1, contents, 0400);
  EXPECT_EQ(contents, readData(path1));
  EXPECT_EQ(set<string>{"foo"}, listTmpDir());

  // Make the directory read-only again
  // Creating another file now should fail and we should still have only the
  // first file.
  setDirPerms(0555);
  EXPECT_THROW(
      writeFileAtomic(tmpPath("another_file.txt"), "x\n"), std::system_error);
  EXPECT_EQ(set<string>{"foo"}, listTmpDir());
}

TEST_F(WriteFileAtomic, multipleFiles) {
  // Test creating multiple files in the same directory
  writeFileAtomic(tmpPath("foo.txt"), "foo");
  writeFileAtomic(tmpPath("bar.txt"), "bar", 0400);
  writeFileAtomic(tmpPath("foo_txt"), "underscore", 0440);
  writeFileAtomic(tmpPath("foo.txt2"), "foo2", 0444);

  auto expectedPaths = set<string>{"foo.txt", "bar.txt", "foo_txt", "foo.txt2"};
  EXPECT_EQ(expectedPaths, listTmpDir());
  EXPECT_EQ("foo", readData(tmpPath("foo.txt")));
  EXPECT_EQ("bar", readData(tmpPath("bar.txt")));
  EXPECT_EQ("underscore", readData(tmpPath("foo_txt")));
  EXPECT_EQ("foo2", readData(tmpPath("foo.txt2")));
  EXPECT_EQ(0644, getPerms(tmpPath("foo.txt")));
  EXPECT_EQ(0400, getPerms(tmpPath("bar.txt")));
  EXPECT_EQ(0440, getPerms(tmpPath("foo_txt")));
  EXPECT_EQ(0444, getPerms(tmpPath("foo.txt2")));
}
}}  // namespaces

#if defined(__linux__)
namespace {
/**
 * A helper class that forces our fchmod() wrapper to fail when
 * an FChmodFailure object exists.
 */
class FChmodFailure {
 public:
  FChmodFailure() {
    ++forceFailure_;
  }
  ~FChmodFailure() {
    --forceFailure_;
  }

  static bool shouldFail() {
    return forceFailure_.load() > 0;
  }

 private:
  static std::atomic<int> forceFailure_;
};

std::atomic<int> FChmodFailure::forceFailure_{0};
}

// Replace the system fchmod() function with our own stub, so we can
// trigger failures in the writeFileAtomic() tests.
int fchmod(int fd, mode_t mode) {
  static const auto realFunction =
      reinterpret_cast<int (*)(int, mode_t)>(dlsym(RTLD_NEXT, "fchmod"));
  // For sanity, make sure we didn't find ourself,
  // since that would cause infinite recursion.
  CHECK_NE(realFunction, fchmod);

  if (FChmodFailure::shouldFail()) {
    errno = EINVAL;
    return -1;
  }
  return realFunction(fd, mode);
}

namespace folly {
namespace test {
TEST_F(WriteFileAtomic, chmodFailure) {
  auto path = tmpPath("foo");

  // Use our stubbed out fchmod() function to force a failure when setting up
  // the temporary file.
  //
  // First try when creating the file for the first time.
  {
    FChmodFailure fail;
    EXPECT_THROW(writeFileAtomic(path, "foobar"), std::system_error);
  }
  EXPECT_EQ(set<string>{}, listTmpDir());

  // Now create a file normally so we can overwrite it
  auto contents = StringPiece("regular perms");
  writeFileAtomic(path, contents, 0600);
  EXPECT_EQ(contents, readData(path));
  EXPECT_EQ(0600, getPerms(path));
  EXPECT_EQ(set<string>{"foo"}, listTmpDir());

  // Now try overwriting the file when forcing fchmod to fail
  {
    FChmodFailure fail;
    EXPECT_THROW(writeFileAtomic(path, "overwrite"), std::system_error);
  }
  // The file should be unchanged
  EXPECT_EQ(contents, readData(path));
  EXPECT_EQ(0600, getPerms(path));
  EXPECT_EQ(set<string>{"foo"}, listTmpDir());
}
}
}
#endif
