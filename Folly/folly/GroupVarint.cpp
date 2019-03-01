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

#include <folly/GroupVarint.h>

#if HAVE_GROUP_VARINT
namespace folly {

const uint32_t GroupVarint32::kMask[] = {
  0xff, 0xffff, 0xffffff, 0xffffffff
};

const uint64_t GroupVarint64::kMask[] = {
  0xff, 0xffff, 0xffffff, 0xffffffff,
  0xffffffffffULL, 0xffffffffffffULL, 0xffffffffffffffULL,
  0xffffffffffffffffULL
};

}  // namespace folly
#endif
