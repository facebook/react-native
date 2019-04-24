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

#include <glog/logging.h>

#include <folly/File.h>
#include <folly/portability/GFlags.h>

DEFINE_bool(s, false, "get shared lock");
DEFINE_bool(x, false, "get exclusive lock");

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  google::InitGoogleLogging(argv[0]);
  CHECK_EQ(FLAGS_s + FLAGS_x, 1)
      << "exactly one of -s and -x must be specified";
  CHECK_EQ(argc, 2);
  folly::File f(argv[1], O_RDWR);
  bool r;
  if (FLAGS_s) {
    r = f.try_lock_shared();
  } else {
    r = f.try_lock();
  }
  return r ? 0 : 42;
}
