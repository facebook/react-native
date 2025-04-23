/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/YGEnums.h>
#include <yoga/YGValue.h>
#include <iostream>

int main() {
  std::cout << "Hello, I am fantom_tester using Yoga!" << std::endl;

  std::cout << "[Yoga] undefined == zero: " << (YGValueZero == YGValueUndefined)
            << std::endl;

  return 0;
}
