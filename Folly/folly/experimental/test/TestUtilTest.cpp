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

#include <system_error>

#include <boost/algorithm/string.hpp>
#include <glog/logging.h>

#include <folly/Memory.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Stdlib.h>

using namespace folly;
using namespace folly::test;

TEST(TemporaryFile, Simple) {
  int fd = -1;
  char c = 'x';
  {
    TemporaryFile f;
    EXPECT_FALSE(f.path().empty());
    EXPECT_TRUE(f.path().is_absolute());
    fd = f.fd();
    EXPECT_LE(0, fd);
    ssize_t r = write(fd, &c, 1);
    EXPECT_EQ(1, r);
  }

  msvcSuppressAbortOnInvalidParams([&] {
    // The file must have been closed.  This assumes that no other thread
    // has opened another file in the meanwhile, which is a sane assumption
    // to make in this test.
    ssize_t r = write(fd, &c, 1);
    int savedErrno = errno;
    EXPECT_EQ(-1, r);
    EXPECT_EQ(EBADF, savedErrno);
  });
}

TEST(TemporaryFile, EarlyClose) {
  fs::path p;
  {
    TemporaryFile f;
    p = f.path();
    EXPECT_TRUE(fs::exists(p));
    f.close();
    EXPECT_EQ(-1, f.fd());
    EXPECT_TRUE(fs::exists(p));
  }
  EXPECT_FALSE(fs::exists(p));
}

TEST(TemporaryFile, Prefix) {
  TemporaryFile f("Foo");
  EXPECT_TRUE(f.path().is_absolute());
  EXPECT_TRUE(
      boost::algorithm::starts_with(f.path().filename().native(), "Foo"));
}

TEST(TemporaryFile, PathPrefix) {
  TemporaryFile f("Foo", ".");
  EXPECT_EQ(fs::path("."), f.path().parent_path());
  EXPECT_TRUE(
      boost::algorithm::starts_with(f.path().filename().native(), "Foo"));
}

TEST(TemporaryFile, NoSuchPath) {
  EXPECT_THROW({ TemporaryFile f("", "/no/such/path"); }, std::system_error);
}

TEST(TemporaryFile, moveAssignment) {
  TemporaryFile f;
  int fd;

  EXPECT_TRUE(f.path().is_absolute());
  {
    TemporaryFile g("Foo", ".");
    EXPECT_NE(g.fd(), -1);
    fd = g.fd();
    f = std::move(g);
  }
  EXPECT_EQ(fs::path("."), f.path().parent_path());
  EXPECT_EQ(f.fd(), fd);

  TemporaryFile h = TemporaryFile("FooBar", ".");
  EXPECT_NE(h.fd(), -1);
}

TEST(TemporaryFile, moveCtor) {
  struct FooBar {
    TemporaryFile f_;
    explicit FooBar(TemporaryFile&& f) : f_(std::move(f)) {}
  };
  TemporaryFile g("Foo");
  FooBar fb(std::move(g));
  EXPECT_EQ(g.fd(), -1);
  EXPECT_NE(fb.f_.fd(), -1);
}

void testTemporaryDirectory(TemporaryDirectory::Scope scope) {
  fs::path path;
  {
    TemporaryDirectory d("", "", scope);
    path = d.path();
    EXPECT_FALSE(path.empty());
    EXPECT_TRUE(path.is_absolute());
    EXPECT_TRUE(fs::exists(path));
    EXPECT_TRUE(fs::is_directory(path));

    fs::path fp = path / "bar";
    int fd = open(fp.string().c_str(), O_RDWR | O_CREAT | O_TRUNC, 0666);
    EXPECT_NE(fd, -1);
    close(fd);

    TemporaryFile f("Foo", d.path());
    EXPECT_EQ(d.path(), f.path().parent_path());
  }
  bool exists = (scope == TemporaryDirectory::Scope::PERMANENT);
  EXPECT_EQ(exists, fs::exists(path));
}

TEST(TemporaryDirectory, Permanent) {
  testTemporaryDirectory(TemporaryDirectory::Scope::PERMANENT);
}

TEST(TemporaryDirectory, DeleteOnDestruction) {
  testTemporaryDirectory(TemporaryDirectory::Scope::DELETE_ON_DESTRUCTION);
}

void expectTempdirExists(const TemporaryDirectory& d) {
  EXPECT_FALSE(d.path().empty());
  EXPECT_TRUE(fs::exists(d.path()));
  EXPECT_TRUE(fs::is_directory(d.path()));
}

TEST(TemporaryDirectory, SafelyMove) {
  std::unique_ptr<TemporaryDirectory> dir;
  TemporaryDirectory dir2;
  {
    auto scope = TemporaryDirectory::Scope::DELETE_ON_DESTRUCTION;
    TemporaryDirectory d("", "", scope);
    TemporaryDirectory d2("", "", scope);
    expectTempdirExists(d);
    expectTempdirExists(d2);

    dir = std::make_unique<TemporaryDirectory>(std::move(d));
    dir2 = std::move(d2);
  }

  expectTempdirExists(*dir);
  expectTempdirExists(dir2);
}

TEST(ChangeToTempDir, ChangeDir) {
  auto pwd1 = fs::current_path();
  {
    ChangeToTempDir d;
    EXPECT_NE(pwd1, fs::current_path());
  }
  EXPECT_EQ(pwd1, fs::current_path());
}

TEST(PCREPatternMatch, Simple) {
  EXPECT_PCRE_MATCH(".*a.c.*", "gabca");
  EXPECT_NO_PCRE_MATCH("a.c", "gabca");
  EXPECT_NO_PCRE_MATCH(".*ac.*", "gabca");
}

TEST(CaptureFD, GlogPatterns) {
  CaptureFD err(fileno(stderr));
  LOG(INFO) << "All is well";
  EXPECT_NO_PCRE_MATCH(glogErrOrWarnPattern(), err.readIncremental());
  {
    LOG(ERROR) << "Uh-oh";
    auto s = err.readIncremental();
    EXPECT_PCRE_MATCH(glogErrorPattern(), s);
    EXPECT_NO_PCRE_MATCH(glogWarningPattern(), s);
    EXPECT_PCRE_MATCH(glogErrOrWarnPattern(), s);
  }
  {
    LOG(WARNING) << "Oops";
    auto s = err.readIncremental();
    EXPECT_NO_PCRE_MATCH(glogErrorPattern(), s);
    EXPECT_PCRE_MATCH(glogWarningPattern(), s);
    EXPECT_PCRE_MATCH(glogErrOrWarnPattern(), s);
  }
}

TEST(CaptureFD, ChunkCob) {
  std::vector<std::string> chunks;
  {
    CaptureFD err(fileno(stderr), [&](StringPiece p) {
      chunks.emplace_back(p.str());
      switch (chunks.size()) {
        case 1:
          EXPECT_PCRE_MATCH(".*foo.*bar.*", p);
          break;
        case 2:
          EXPECT_PCRE_MATCH("[^\n]*baz.*", p);
          break;
        default:
          FAIL() << "Got too many chunks: " << chunks.size();
      }
    });
    LOG(INFO) << "foo";
    LOG(INFO) << "bar";
    EXPECT_PCRE_MATCH(".*foo.*bar.*", err.read());
    auto chunk = err.readIncremental();
    EXPECT_EQ(chunks.at(0), chunk);
    LOG(INFO) << "baz";
    EXPECT_PCRE_MATCH(".*foo.*bar.*baz.*", err.read());
  }
  EXPECT_EQ(2, chunks.size());
}
