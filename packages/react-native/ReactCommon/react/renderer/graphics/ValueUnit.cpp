/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ValueUnit.h"

#ifdef RN_SERIALIZABLE_STATE
// #include <format>
#endif

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic ValueUnit::toDynamic() const {
  switch (unit) {
    case UnitType::Undefined:
      return nullptr;
    case UnitType::Point:
      return value;
    case UnitType::Percent:
      return std::to_string(value) + "%";
  }
}
#endif

} // namespace facebook::react
