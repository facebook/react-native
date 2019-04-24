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

#include <folly/experimental/test/CodingTestUtils.h>

#include <folly/portability/GFlags.h>
#include <glog/logging.h>

DEFINE_string(
    coding_test_utils_instructions,
    "",
    "If non empty, forces the instruction set. Choices: Default, Nehalem, Haswell");

namespace folly {
namespace compression {

folly::Optional<instructions::Type> instructionsOverride() {
  if (FLAGS_coding_test_utils_instructions.empty()) {
    return folly::none;
  }

  instructions::Type type;
  if (FLAGS_coding_test_utils_instructions == "Default") {
    type = instructions::Type::DEFAULT;
  } else if (FLAGS_coding_test_utils_instructions == "Nehalem") {
    type = instructions::Type::NEHALEM;
  } else if (FLAGS_coding_test_utils_instructions == "Haswell") {
    type = instructions::Type::HASWELL;
  } else {
    LOG(FATAL) << "Insupported instructions type "
               << FLAGS_coding_test_utils_instructions;
  }

  instructions::dispatch(
      type, [](auto instructions) { CHECK(instructions.supported()); });

  return type;
}

} // namespace compression
} // namespace folly
