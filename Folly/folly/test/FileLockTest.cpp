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

#include <mutex>

#include <glog/logging.h>
#include <boost/thread/locks.hpp>

#include <folly/String.h>
#include <folly/Subprocess.h>
#include <folly/experimental/TestUtil.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::test;

DEFINE_bool(s, false, "get shared lock");
DEFINE_bool(x, false, "get exclusive lock");

TEST(File, Locks) {
  typedef std::unique_lock<File> Lock;
  typedef boost::shared_lock<File> SharedLock;

  // Find out where we are.
  static constexpr size_t pathLength = 2048;
  char buf[pathLength + 1];
  int r = readlink("/proc/self/exe", buf, pathLength);
  CHECK(r != -1);
  buf[r] = '\0';

  fs::path me(buf);
  auto helper_basename = "file_test_lock_helper";
  fs::path helper;
  if (fs::exists(me.parent_path() / helper_basename)) {
    helper = me.parent_path() / helper_basename;
  } else {
    throw std::runtime_error(
        folly::to<std::string>("cannot find helper ", helper_basename));
  }

  TemporaryFile tempFile;
  File f(tempFile.fd());

  enum LockMode { EXCLUSIVE, SHARED };
  auto testLock = [&](LockMode mode, bool expectedSuccess) {
    auto ret = Subprocess({helper.string(),
                           mode == SHARED ? "-s" : "-x",
                           tempFile.path().string()}).wait();
    EXPECT_TRUE(ret.exited());
    if (ret.exited()) {
      EXPECT_EQ(expectedSuccess ? 0 : 42, ret.exitStatus());
    }
  };

  // Make sure nothing breaks and things compile.
  { Lock lock(f); }

  { SharedLock lock(f); }

  {
    Lock lock(f, std::defer_lock);
    EXPECT_TRUE(lock.try_lock());
  }

  {
    SharedLock lock(f, boost::defer_lock);
    EXPECT_TRUE(lock.try_lock());
  }

  // X blocks X
  {
    Lock lock(f);
    testLock(EXCLUSIVE, false);
  }

  // X blocks S
  {
    Lock lock(f);
    testLock(SHARED, false);
  }

  // S blocks X
  {
    SharedLock lock(f);
    testLock(EXCLUSIVE, false);
  }

  // S does not block S
  {
    SharedLock lock(f);
    testLock(SHARED, true);
  }
}
