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

#include <sys/stat.h>
#include <sys/types.h>
#include <cstddef>
#include <string>
#include <utility>
#include <vector>

#include <boost/operators.hpp>

#include <folly/Range.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/portability/Unistd.h>

namespace folly {

struct HugePageSize : private boost::totally_ordered<HugePageSize> {
  explicit HugePageSize(size_t s) : size(s) {}

  fs::path filePath(const fs::path& relpath) const {
    return mountPoint / relpath;
  }

  size_t size = 0;
  fs::path mountPoint;
  dev_t device = 0;
};

inline bool operator<(const HugePageSize& a, const HugePageSize& b) {
  return a.size < b.size;
}

inline bool operator==(const HugePageSize& a, const HugePageSize& b) {
  return a.size == b.size;
}

/**
 * Vector of (huge_page_size, mount_point), sorted by huge_page_size.
 * mount_point might be empty if no hugetlbfs file system is mounted for
 * that size.
 */
typedef std::vector<HugePageSize> HugePageSizeVec;

/**
 * Get list of supported huge page sizes and their mount points, if
 * hugetlbfs file systems are mounted for those sizes.
 */
const HugePageSizeVec& getHugePageSizes();

/**
 * Return the mount point for the requested huge page size.
 * 0 = use smallest available.
 * Returns nullptr if the requested huge page size is not available.
 */
const HugePageSize* getHugePageSize(size_t size = 0);

/**
 * Return the huge page size for a device.
 * returns nullptr if device does not refer to a huge page filesystem.
 */
const HugePageSize* getHugePageSizeForDevice(dev_t device);

} // namespace folly
