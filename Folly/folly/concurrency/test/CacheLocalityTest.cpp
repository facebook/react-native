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

#include <folly/concurrency/CacheLocality.h>

#include <folly/portability/GTest.h>

#include <glog/logging.h>
#include <memory>
#include <thread>
#include <unordered_map>

using namespace folly;

/// This is the relevant nodes from a production box's sysfs tree.  If you
/// think this map is ugly you should see the version of this test that
/// used a real directory tree.  To reduce the chance of testing error
/// I haven't tried to remove the common prefix
static std::unordered_map<std::string, std::string> fakeSysfsTree = {
    {"/sys/devices/system/cpu/cpu0/cache/index0/shared_cpu_list", "0,17"},
    {"/sys/devices/system/cpu/cpu0/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu0/cache/index1/shared_cpu_list", "0,17"},
    {"/sys/devices/system/cpu/cpu0/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu0/cache/index2/shared_cpu_list", "0,17"},
    {"/sys/devices/system/cpu/cpu0/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu0/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu0/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu1/cache/index0/shared_cpu_list", "1,18"},
    {"/sys/devices/system/cpu/cpu1/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu1/cache/index1/shared_cpu_list", "1,18"},
    {"/sys/devices/system/cpu/cpu1/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu1/cache/index2/shared_cpu_list", "1,18"},
    {"/sys/devices/system/cpu/cpu1/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu1/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu1/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu2/cache/index0/shared_cpu_list", "2,19"},
    {"/sys/devices/system/cpu/cpu2/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu2/cache/index1/shared_cpu_list", "2,19"},
    {"/sys/devices/system/cpu/cpu2/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu2/cache/index2/shared_cpu_list", "2,19"},
    {"/sys/devices/system/cpu/cpu2/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu2/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu2/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu3/cache/index0/shared_cpu_list", "3,20"},
    {"/sys/devices/system/cpu/cpu3/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu3/cache/index1/shared_cpu_list", "3,20"},
    {"/sys/devices/system/cpu/cpu3/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu3/cache/index2/shared_cpu_list", "3,20"},
    {"/sys/devices/system/cpu/cpu3/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu3/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu3/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu4/cache/index0/shared_cpu_list", "4,21"},
    {"/sys/devices/system/cpu/cpu4/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu4/cache/index1/shared_cpu_list", "4,21"},
    {"/sys/devices/system/cpu/cpu4/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu4/cache/index2/shared_cpu_list", "4,21"},
    {"/sys/devices/system/cpu/cpu4/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu4/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu4/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu5/cache/index0/shared_cpu_list", "5-6"},
    {"/sys/devices/system/cpu/cpu5/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu5/cache/index1/shared_cpu_list", "5-6"},
    {"/sys/devices/system/cpu/cpu5/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu5/cache/index2/shared_cpu_list", "5-6"},
    {"/sys/devices/system/cpu/cpu5/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu5/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu5/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu6/cache/index0/shared_cpu_list", "5-6"},
    {"/sys/devices/system/cpu/cpu6/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu6/cache/index1/shared_cpu_list", "5-6"},
    {"/sys/devices/system/cpu/cpu6/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu6/cache/index2/shared_cpu_list", "5-6"},
    {"/sys/devices/system/cpu/cpu6/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu6/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu6/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu7/cache/index0/shared_cpu_list", "7,22"},
    {"/sys/devices/system/cpu/cpu7/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu7/cache/index1/shared_cpu_list", "7,22"},
    {"/sys/devices/system/cpu/cpu7/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu7/cache/index2/shared_cpu_list", "7,22"},
    {"/sys/devices/system/cpu/cpu7/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu7/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu7/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu8/cache/index0/shared_cpu_list", "8,23"},
    {"/sys/devices/system/cpu/cpu8/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu8/cache/index1/shared_cpu_list", "8,23"},
    {"/sys/devices/system/cpu/cpu8/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu8/cache/index2/shared_cpu_list", "8,23"},
    {"/sys/devices/system/cpu/cpu8/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu8/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu8/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu9/cache/index0/shared_cpu_list", "9,24"},
    {"/sys/devices/system/cpu/cpu9/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu9/cache/index1/shared_cpu_list", "9,24"},
    {"/sys/devices/system/cpu/cpu9/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu9/cache/index2/shared_cpu_list", "9,24"},
    {"/sys/devices/system/cpu/cpu9/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu9/cache/index3/shared_cpu_list", "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu9/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu10/cache/index0/shared_cpu_list", "10,25"},
    {"/sys/devices/system/cpu/cpu10/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu10/cache/index1/shared_cpu_list", "10,25"},
    {"/sys/devices/system/cpu/cpu10/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu10/cache/index2/shared_cpu_list", "10,25"},
    {"/sys/devices/system/cpu/cpu10/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu10/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu10/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu11/cache/index0/shared_cpu_list", "11,26"},
    {"/sys/devices/system/cpu/cpu11/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu11/cache/index1/shared_cpu_list", "11,26"},
    {"/sys/devices/system/cpu/cpu11/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu11/cache/index2/shared_cpu_list", "11,26"},
    {"/sys/devices/system/cpu/cpu11/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu11/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu11/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu12/cache/index0/shared_cpu_list", "12,27"},
    {"/sys/devices/system/cpu/cpu12/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu12/cache/index1/shared_cpu_list", "12,27"},
    {"/sys/devices/system/cpu/cpu12/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu12/cache/index2/shared_cpu_list", "12,27"},
    {"/sys/devices/system/cpu/cpu12/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu12/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu12/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu13/cache/index0/shared_cpu_list", "13,28"},
    {"/sys/devices/system/cpu/cpu13/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu13/cache/index1/shared_cpu_list", "13,28"},
    {"/sys/devices/system/cpu/cpu13/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu13/cache/index2/shared_cpu_list", "13,28"},
    {"/sys/devices/system/cpu/cpu13/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu13/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu13/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu14/cache/index0/shared_cpu_list", "14,29"},
    {"/sys/devices/system/cpu/cpu14/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu14/cache/index1/shared_cpu_list", "14,29"},
    {"/sys/devices/system/cpu/cpu14/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu14/cache/index2/shared_cpu_list", "14,29"},
    {"/sys/devices/system/cpu/cpu14/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu14/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu14/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu15/cache/index0/shared_cpu_list", "15,30"},
    {"/sys/devices/system/cpu/cpu15/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu15/cache/index1/shared_cpu_list", "15,30"},
    {"/sys/devices/system/cpu/cpu15/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu15/cache/index2/shared_cpu_list", "15,30"},
    {"/sys/devices/system/cpu/cpu15/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu15/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu15/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu16/cache/index0/shared_cpu_list", "16,31"},
    {"/sys/devices/system/cpu/cpu16/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu16/cache/index1/shared_cpu_list", "16,31"},
    {"/sys/devices/system/cpu/cpu16/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu16/cache/index2/shared_cpu_list", "16,31"},
    {"/sys/devices/system/cpu/cpu16/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu16/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu16/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu17/cache/index0/shared_cpu_list", "0,17"},
    {"/sys/devices/system/cpu/cpu17/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu17/cache/index1/shared_cpu_list", "0,17"},
    {"/sys/devices/system/cpu/cpu17/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu17/cache/index2/shared_cpu_list", "0,17"},
    {"/sys/devices/system/cpu/cpu17/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu17/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu17/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu18/cache/index0/shared_cpu_list", "1,18"},
    {"/sys/devices/system/cpu/cpu18/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu18/cache/index1/shared_cpu_list", "1,18"},
    {"/sys/devices/system/cpu/cpu18/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu18/cache/index2/shared_cpu_list", "1,18"},
    {"/sys/devices/system/cpu/cpu18/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu18/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu18/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu19/cache/index0/shared_cpu_list", "2,19"},
    {"/sys/devices/system/cpu/cpu19/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu19/cache/index1/shared_cpu_list", "2,19"},
    {"/sys/devices/system/cpu/cpu19/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu19/cache/index2/shared_cpu_list", "2,19"},
    {"/sys/devices/system/cpu/cpu19/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu19/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu19/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu20/cache/index0/shared_cpu_list", "3,20"},
    {"/sys/devices/system/cpu/cpu20/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu20/cache/index1/shared_cpu_list", "3,20"},
    {"/sys/devices/system/cpu/cpu20/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu20/cache/index2/shared_cpu_list", "3,20"},
    {"/sys/devices/system/cpu/cpu20/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu20/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu20/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu21/cache/index0/shared_cpu_list", "4,21"},
    {"/sys/devices/system/cpu/cpu21/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu21/cache/index1/shared_cpu_list", "4,21"},
    {"/sys/devices/system/cpu/cpu21/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu21/cache/index2/shared_cpu_list", "4,21"},
    {"/sys/devices/system/cpu/cpu21/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu21/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu21/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu22/cache/index0/shared_cpu_list", "7,22"},
    {"/sys/devices/system/cpu/cpu22/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu22/cache/index1/shared_cpu_list", "7,22"},
    {"/sys/devices/system/cpu/cpu22/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu22/cache/index2/shared_cpu_list", "7,22"},
    {"/sys/devices/system/cpu/cpu22/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu22/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu22/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu23/cache/index0/shared_cpu_list", "8,23"},
    {"/sys/devices/system/cpu/cpu23/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu23/cache/index1/shared_cpu_list", "8,23"},
    {"/sys/devices/system/cpu/cpu23/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu23/cache/index2/shared_cpu_list", "8,23"},
    {"/sys/devices/system/cpu/cpu23/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu23/cache/index3/shared_cpu_list", "0-8,17-23"},
    {"/sys/devices/system/cpu/cpu23/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu24/cache/index0/shared_cpu_list", "9,24"},
    {"/sys/devices/system/cpu/cpu24/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu24/cache/index1/shared_cpu_list", "9,24"},
    {"/sys/devices/system/cpu/cpu24/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu24/cache/index2/shared_cpu_list", "9,24"},
    {"/sys/devices/system/cpu/cpu24/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu24/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu24/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu25/cache/index0/shared_cpu_list", "10,25"},
    {"/sys/devices/system/cpu/cpu25/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu25/cache/index1/shared_cpu_list", "10,25"},
    {"/sys/devices/system/cpu/cpu25/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu25/cache/index2/shared_cpu_list", "10,25"},
    {"/sys/devices/system/cpu/cpu25/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu25/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu25/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu26/cache/index0/shared_cpu_list", "11,26"},
    {"/sys/devices/system/cpu/cpu26/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu26/cache/index1/shared_cpu_list", "11,26"},
    {"/sys/devices/system/cpu/cpu26/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu26/cache/index2/shared_cpu_list", "11,26"},
    {"/sys/devices/system/cpu/cpu26/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu26/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu26/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu27/cache/index0/shared_cpu_list", "12,27"},
    {"/sys/devices/system/cpu/cpu27/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu27/cache/index1/shared_cpu_list", "12,27"},
    {"/sys/devices/system/cpu/cpu27/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu27/cache/index2/shared_cpu_list", "12,27"},
    {"/sys/devices/system/cpu/cpu27/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu27/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu27/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu28/cache/index0/shared_cpu_list", "13,28"},
    {"/sys/devices/system/cpu/cpu28/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu28/cache/index1/shared_cpu_list", "13,28"},
    {"/sys/devices/system/cpu/cpu28/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu28/cache/index2/shared_cpu_list", "13,28"},
    {"/sys/devices/system/cpu/cpu28/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu28/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu28/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu29/cache/index0/shared_cpu_list", "14,29"},
    {"/sys/devices/system/cpu/cpu29/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu29/cache/index1/shared_cpu_list", "14,29"},
    {"/sys/devices/system/cpu/cpu29/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu29/cache/index2/shared_cpu_list", "14,29"},
    {"/sys/devices/system/cpu/cpu29/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu29/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu29/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu30/cache/index0/shared_cpu_list", "15,30"},
    {"/sys/devices/system/cpu/cpu30/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu30/cache/index1/shared_cpu_list", "15,30"},
    {"/sys/devices/system/cpu/cpu30/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu30/cache/index2/shared_cpu_list", "15,30"},
    {"/sys/devices/system/cpu/cpu30/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu30/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu30/cache/index3/type", "Unified"},
    {"/sys/devices/system/cpu/cpu31/cache/index0/shared_cpu_list", "16,31"},
    {"/sys/devices/system/cpu/cpu31/cache/index0/type", "Data"},
    {"/sys/devices/system/cpu/cpu31/cache/index1/shared_cpu_list", "16,31"},
    {"/sys/devices/system/cpu/cpu31/cache/index1/type", "Instruction"},
    {"/sys/devices/system/cpu/cpu31/cache/index2/shared_cpu_list", "16,31"},
    {"/sys/devices/system/cpu/cpu31/cache/index2/type", "Unified"},
    {"/sys/devices/system/cpu/cpu31/cache/index3/shared_cpu_list",
     "9-16,24-31"},
    {"/sys/devices/system/cpu/cpu31/cache/index3/type", "Unified"}};

/// This is the expected CacheLocality structure for fakeSysfsTree
static const CacheLocality nonUniformExampleLocality = {
    32,
    {16, 16, 2},
    {0,  2, 4, 6, 8, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28,
     30, 1, 3, 5, 7, 9,  13, 15, 17, 19, 21, 23, 25, 27, 29, 31}};

TEST(CacheLocality, FakeSysfs) {
  auto parsed = CacheLocality::readFromSysfsTree([](std::string name) {
    auto iter = fakeSysfsTree.find(name);
    return iter == fakeSysfsTree.end() ? std::string() : iter->second;
  });

  auto& expected = nonUniformExampleLocality;
  EXPECT_EQ(expected.numCpus, parsed.numCpus);
  EXPECT_EQ(expected.numCachesByLevel, parsed.numCachesByLevel);
  EXPECT_EQ(expected.localityIndexByCpu, parsed.localityIndexByCpu);
}

#if FOLLY_HAVE_LINUX_VDSO
TEST(Getcpu, VdsoGetcpu) {
  unsigned cpu;
  Getcpu::resolveVdsoFunc()(&cpu, nullptr, nullptr);

  EXPECT_TRUE(cpu < CPU_SETSIZE);
}
#endif

#ifdef FOLLY_TLS
TEST(ThreadId, SimpleTls) {
  unsigned cpu = 0;
  auto rv = folly::FallbackGetcpu<SequentialThreadId<std::atomic>>::getcpu(
      &cpu, nullptr, nullptr);
  EXPECT_EQ(rv, 0);
  EXPECT_TRUE(cpu > 0);
  unsigned again;
  folly::FallbackGetcpu<SequentialThreadId<std::atomic>>::getcpu(
      &again, nullptr, nullptr);
  EXPECT_EQ(cpu, again);
}
#endif

TEST(ThreadId, SimplePthread) {
  unsigned cpu = 0;
  auto rv =
      folly::FallbackGetcpu<HashingThreadId>::getcpu(&cpu, nullptr, nullptr);
  EXPECT_EQ(rv, 0);
  EXPECT_TRUE(cpu > 0);
  unsigned again;
  folly::FallbackGetcpu<HashingThreadId>::getcpu(&again, nullptr, nullptr);
  EXPECT_EQ(cpu, again);
}

#ifdef FOLLY_TLS
static FOLLY_TLS unsigned testingCpu = 0;

static int testingGetcpu(unsigned* cpu, unsigned* node, void* /* unused */) {
  if (cpu != nullptr) {
    *cpu = testingCpu;
  }
  if (node != nullptr) {
    *node = testingCpu;
  }
  return 0;
}
#endif

TEST(AccessSpreader, Simple) {
  for (size_t s = 1; s < 200; ++s) {
    EXPECT_LT(AccessSpreader<>::current(s), s);
  }
}

TEST(AccessSpreader, SimpleCached) {
  for (size_t s = 1; s < 200; ++s) {
    EXPECT_LT(AccessSpreader<>::cachedCurrent(s), s);
  }
}

TEST(AccessSpreader, ConcurrentAccessCached) {
  std::vector<std::thread> threads;
  for (size_t i = 0; i < 4; ++i) {
    threads.emplace_back([]() {
      for (size_t s : {16, 32, 64}) {
        for (size_t j = 1; j < 200; ++j) {
          EXPECT_LT(AccessSpreader<>::cachedCurrent(s), s);
          EXPECT_LT(AccessSpreader<>::cachedCurrent(s), s);
        }
        std::this_thread::yield();
      }
    });
  }
  for (auto& thread : threads) {
    thread.join();
  }
}

#ifdef FOLLY_TLS
#define DECLARE_SPREADER_TAG(tag, locality, func)      \
  namespace {                                          \
  template <typename dummy>                            \
  struct tag {};                                       \
  }                                                    \
  namespace folly {                                    \
  template <>                                          \
  const CacheLocality& CacheLocality::system<tag>() {  \
    static auto* inst = new CacheLocality(locality);   \
    return *inst;                                      \
  }                                                    \
  template <>                                          \
  Getcpu::Func AccessSpreader<tag>::pickGetcpuFunc() { \
    return func;                                       \
  }                                                    \
  template struct AccessSpreader<tag>;                 \
  }

DECLARE_SPREADER_TAG(ManualTag, CacheLocality::uniform(16), testingGetcpu)

TEST(AccessSpreader, Wrapping) {
  // this test won't pass unless locality.numCpus divides kMaxCpus
  auto numCpus = CacheLocality::system<ManualTag>().numCpus;
  EXPECT_EQ(0, 128 % numCpus);
  for (size_t s = 1; s < 200; ++s) {
    for (size_t c = 0; c < 400; ++c) {
      testingCpu = c;
      auto observed = AccessSpreader<ManualTag>::current(s);
      testingCpu = c % numCpus;
      auto expected = AccessSpreader<ManualTag>::current(s);
      EXPECT_EQ(expected, observed)
          << "numCpus=" << numCpus << ", s=" << s << ", c=" << c;
    }
  }
}

TEST(CoreRawAllocator, Basic) {
  CoreRawAllocator<32> alloc;
  auto a = alloc.get(0);
  auto res = a->allocate(8);
  memset(res, 0, 8);
  a->deallocate(res);
  res = a->allocate(8);
  EXPECT_TRUE((intptr_t)res % 8 == 0); // check alignment
  memset(res, 0, 8);
  a->deallocate(res);
  res = a->allocate(12);
  EXPECT_TRUE((intptr_t)res % 16 == 0); // check alignment
  memset(res, 0, 12);
  a->deallocate(res);
  res = a->allocate(257);
  memset(res, 0, 257);
  a->deallocate(res);

  std::vector<void*> mems;
  for (int i = 0; i < 10000; i++) {
    mems.push_back(a->allocate(1));
  }
  for (auto& mem : mems) {
    a->deallocate(mem);
  }
  mems.clear();
}

#endif
