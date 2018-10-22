//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#include "JSIDynamic.h"

#include <folly/dynamic.h>
#include <jsi/jsi.h>

using namespace facebook::jsi;

namespace facebook {
namespace jsi {

Value valueFromDynamic(Runtime& runtime, const folly::dynamic& dyn) {
  switch (dyn.type()) {
  case folly::dynamic::NULLT:
    return Value::null();
  case folly::dynamic::ARRAY: {
    Array ret = Array(runtime, dyn.size());
    for (size_t i = 0; i < dyn.size(); ++i) {
      ret.setValueAtIndex(runtime, i, valueFromDynamic(runtime, dyn[i]));
    }
    return std::move(ret);
  }
  case folly::dynamic::BOOL:
    return dyn.getBool();
  case folly::dynamic::DOUBLE:
    return dyn.getDouble();
  case folly::dynamic::INT64:
    // Can't use asDouble() here.  If the int64 value is too bit to be
    // represented precisely as a double, folly will throw an
    // exception.
    return (double)dyn.getInt();
  case folly::dynamic::OBJECT: {
    Object ret(runtime);
    for (const auto& element : dyn.items()) {
      Value value = valueFromDynamic(runtime, element.second);
      if (element.first.isNumber() || element.first.isString()) {
        ret.setProperty(runtime, element.first.asString().c_str(), value);
      }
    }
    return std::move(ret);
  }
  case folly::dynamic::STRING:
    return String::createFromUtf8(runtime, dyn.getString());
  }
  CHECK(false);
}

folly::dynamic dynamicFromValue(Runtime& runtime, const Value& value) {
  if (value.isUndefined() || value.isNull()) {
    return nullptr;
  } else if (value.isBool()) {
    return value.getBool();
  } else if (value.isNumber()) {
    return value.getNumber();
  } else if (value.isString()) {
    return value.getString(runtime).utf8(runtime);
  } else {
    Object obj = value.getObject(runtime);
    if (obj.isArray(runtime)) {
      Array array = obj.getArray(runtime);
      folly::dynamic ret = folly::dynamic::array();
      for (size_t i = 0; i < array.size(runtime); ++i) {
        ret.push_back(dynamicFromValue(runtime, array.getValueAtIndex(runtime, i)));
      }
      return ret;
    } else if (obj.isFunction(runtime)) {
      throw JSError(runtime, "JS Functions are not convertible to dynamic");
    } else {
      folly::dynamic ret = folly::dynamic::object();
      Array names = obj.getPropertyNames(runtime);
      for (size_t i = 0; i < names.size(runtime); ++i) {
        String name = names.getValueAtIndex(runtime, i).getString(runtime);
        Value prop = obj.getProperty(runtime, name);
        if (prop.isUndefined()) {
          continue;
        }
        // The JSC conversion uses JSON.stringify, which substitutes
        // null for a function, so we do the same here.  Just dropping
        // the pair might also work, but would require more testing.
        if (prop.isObject() && prop.getObject(runtime).isFunction(runtime)) {
          prop = Value::null();
        }
        ret.insert(
            name.utf8(runtime), dynamicFromValue(runtime, std::move(prop)));
      }
      return ret;
    }
  }
}

}
}
