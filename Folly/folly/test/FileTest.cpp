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

#include <folly/File.h>

#include <folly/String.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/GTest.h>

using namespace folly;

namespace {
void expectWouldBlock(ssize_t r) {
  int savedErrno = errno;
  EXPECT_EQ(-1, r);
  EXPECT_EQ(EAGAIN, savedErrno) << errnoStr(savedErrno);
}
void expectOK(ssize_t r) {
  int savedErrno = errno;
  EXPECT_LE(0, r) << ": errno=" << errnoStr(savedErrno);
}
}  // namespace

TEST(File, Simple) {
  // Open a file, ensure it's indeed open for reading
  char buf = 'x';
  {
    File f("/etc/hosts");
    EXPECT_NE(-1, f.fd());
    EXPECT_EQ(1, ::read(f.fd(), &buf, 1));
    f.close();
    EXPECT_EQ(-1, f.fd());
  }
}

TEST(File, SimpleStringPiece) {
  char buf = 'x';
  File f(StringPiece("/etc/hosts"));
  EXPECT_NE(-1, f.fd());
  EXPECT_EQ(1, ::read(f.fd(), &buf, 1));
  f.close();
  EXPECT_EQ(-1, f.fd());
}

TEST(File, OwnsFd) {
  // Wrap a file descriptor, make sure that ownsFd works
  // We'll test that the file descriptor is closed by closing the writing
  // end of a pipe and making sure that a non-blocking read from the reading
  // end returns 0.

  char buf = 'x';
  int p[2];
  expectOK(::pipe(p));
  int flags = ::fcntl(p[0], F_GETFL);
  expectOK(flags);
  expectOK(::fcntl(p[0], F_SETFL, flags | O_NONBLOCK));
  expectWouldBlock(::read(p[0], &buf, 1));
  {
    File f(p[1]);
    EXPECT_EQ(p[1], f.fd());
  }
  // Ensure that moving the file doesn't close it
  {
    File f(p[1]);
    EXPECT_EQ(p[1], f.fd());
    File f1(std::move(f));
    EXPECT_EQ(-1, f.fd());
    EXPECT_EQ(p[1], f1.fd());
  }
  expectWouldBlock(::read(p[0], &buf, 1));  // not closed
  {
    File f(p[1], true);
    EXPECT_EQ(p[1], f.fd());
  }
  ssize_t r = ::read(p[0], &buf, 1);  // eof
  expectOK(r);
  EXPECT_EQ(0, r);
  ::close(p[0]);
}

TEST(File, Release) {
  File in(STDOUT_FILENO, false);
  CHECK_EQ(STDOUT_FILENO, in.release());
  CHECK_EQ(-1, in.release());
}

#define EXPECT_CONTAINS(haystack, needle) \
  EXPECT_NE(::std::string::npos, ::folly::StringPiece(haystack).find(needle)) \
    << "Haystack: '" << haystack << "'\nNeedle: '" << needle << "'";

TEST(File, UsefulError) {
  try {
    File("does_not_exist.txt", 0, 0666);
  } catch (const std::runtime_error& e) {
    EXPECT_CONTAINS(e.what(), "does_not_exist.txt");
    EXPECT_CONTAINS(e.what(), "0666");
  }
}

TEST(File, Truthy) {
  File temp = File::temporary();

  EXPECT_TRUE(bool(temp));

  if (temp) {
    ;
  } else {
    EXPECT_FALSE(true);
  }

  if (File file = File::temporary()) {
    ;
  } else {
    EXPECT_FALSE(true);
  }

  EXPECT_FALSE(bool(File()));
  if (File()) {
    EXPECT_TRUE(false);
  }
  if (File notOpened = File()) {
    EXPECT_TRUE(false);
  }
}
