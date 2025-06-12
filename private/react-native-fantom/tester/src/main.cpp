/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fmt/format.h>
#include <glog/logging.h>
#include <yoga/YGEnums.h>
#include <yoga/YGValue.h>
#include <iostream>

int main() {
  google::InitGoogleLogging("fantom_tester");
  FLAGS_logtostderr = true;

  LOG(INFO) << "Hello, I am fantom_tester using glog!";

  LOG(INFO) << fmt::format(
      "[Yoga] undefined == zero: {}", YGValueZero == YGValueUndefined);

  return 0;
}
