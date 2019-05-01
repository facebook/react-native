/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/test/JsonTestUtil.h>

#include <algorithm>
#include <cmath>

#include <folly/Conv.h>
#include <folly/json.h>
#include <folly/lang/Assume.h>

namespace folly {

bool compareJson(StringPiece json1, StringPiece json2) {
  auto obj1 = parseJson(json1);
  auto obj2 = parseJson(json2);
  return obj1 == obj2;
}

namespace {

bool isClose(double x, double y, double tolerance) {
  return std::abs(x - y) <= tolerance;
}

} // namespace

bool compareDynamicWithTolerance(
    const dynamic& obj1,
    const dynamic& obj2,
    double tolerance) {
  if (obj1.type() != obj2.type()) {
    if (obj1.isNumber() && obj2.isNumber()) {
      const auto& integ = obj1.isInt() ? obj1 : obj2;
      const auto& doubl = obj1.isInt() ? obj2 : obj1;
      // Use to<double> to fail on precision loss for very large
      // integers (in which case the comparison does not make sense).
      return isClose(to<double>(integ.asInt()), doubl.asDouble(), tolerance);
    }
    return false;
  }

  switch (obj1.type()) {
    case dynamic::Type::NULLT:
      return true;
    case dynamic::Type::ARRAY:
      if (obj1.size() != obj2.size()) {
        return false;
      }
      for (auto i1 = obj1.begin(), i2 = obj2.begin(); i1 != obj1.end();
           ++i1, ++i2) {
        if (!compareDynamicWithTolerance(*i1, *i2, tolerance)) {
          return false;
        }
      }
      return true;
    case dynamic::Type::BOOL:
      return obj1.asBool() == obj2.asBool();
    case dynamic::Type::DOUBLE:
      return isClose(obj1.asDouble(), obj2.asDouble(), tolerance);
    case dynamic::Type::INT64:
      return obj1.asInt() == obj2.asInt();
    case dynamic::Type::OBJECT:
      if (obj1.size() != obj2.size()) {
        return false;
      }

      return std::all_of(
          obj1.items().begin(), obj1.items().end(), [&](const auto& item) {
            const auto& value1 = item.second;
            const auto value2 = obj2.get_ptr(item.first);
            return value2 &&
                compareDynamicWithTolerance(value1, *value2, tolerance);
          });
    case dynamic::Type::STRING:
      return obj1.asString() == obj2.asString();
  }

  assume_unreachable();
}

bool compareJsonWithTolerance(
    StringPiece json1,
    StringPiece json2,
    double tolerance) {
  auto obj1 = parseJson(json1);
  auto obj2 = parseJson(json2);
  return compareDynamicWithTolerance(obj1, obj2, tolerance);
}

} // namespace folly
