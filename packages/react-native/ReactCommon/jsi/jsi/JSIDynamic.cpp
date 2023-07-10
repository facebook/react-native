/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSIDynamic.h"

#include <glog/logging.h>

#include <folly/dynamic.h>
#include <jsi/jsi.h>

using namespace facebook::jsi;

namespace facebook {
namespace jsi {

namespace {

struct FromDynamic {
  FromDynamic(const folly::dynamic* dynArg, Object objArg)
      : dyn(dynArg), obj(std::move(objArg)) {}

  const folly::dynamic* dyn;
  Object obj;
};

// This converts one element.  If it's a collection, it gets pushed onto
// the stack for later processing.
Value valueFromDynamicShallow(
    Runtime& runtime,
    std::vector<FromDynamic>& stack,
    const folly::dynamic& dyn) {
  switch (dyn.type()) {
    case folly::dynamic::NULLT:
      return Value::null();
    case folly::dynamic::ARRAY: {
      Object arr = Array(runtime, dyn.size());
      Value ret = Value(runtime, arr);
      stack.emplace_back(&dyn, std::move(arr));
      return ret;
    }
    case folly::dynamic::BOOL:
      return Value(dyn.getBool());
    case folly::dynamic::DOUBLE:
      return dyn.getDouble();
    case folly::dynamic::INT64:
      return Value((double)dyn.getInt());
    case folly::dynamic::OBJECT: {
      auto obj = Object(runtime);
      Value ret = Value(runtime, obj);
      stack.emplace_back(&dyn, std::move(obj));
      return ret;
    }
    case folly::dynamic::STRING:
      return Value(String::createFromUtf8(runtime, dyn.getString()));
  }
  CHECK(false);
}

} // namespace

Value valueFromDynamic(Runtime& runtime, const folly::dynamic& dynInput) {
  std::vector<FromDynamic> stack;

  Value ret = valueFromDynamicShallow(runtime, stack, dynInput);

  while (!stack.empty()) {
    auto top = std::move(stack.back());
    stack.pop_back();

    switch (top.dyn->type()) {
      case folly::dynamic::ARRAY: {
        Array arr = std::move(top.obj).getArray(runtime);
        for (size_t i = 0; i < top.dyn->size(); ++i) {
          arr.setValueAtIndex(
              runtime,
              i,
              valueFromDynamicShallow(runtime, stack, (*top.dyn)[i]));
        }
        break;
      }
      case folly::dynamic::OBJECT: {
        Object obj = std::move(top.obj);
        for (const auto& element : top.dyn->items()) {
          if (element.first.isNumber() || element.first.isString()) {
            obj.setProperty(
                runtime,
                PropNameID::forUtf8(runtime, element.first.asString()),
                valueFromDynamicShallow(runtime, stack, element.second));
          }
        }
        break;
      }
      default:
        CHECK(false);
    }
  }

  return ret;
}

namespace {
struct SerializingType {
  explicit SerializingType(Array names) : propNames(std::move(names)) {}
  Array propNames;
  SerializingType* pNext = nullptr;

  bool sameTypeAs(Runtime& runtime, const SerializingType& other) {
    // This just compares the property names on an object to determine if two
    // objects are the same type. It does not check the type of the property or
    // the property values.
    if (other.propNames.size(runtime) != propNames.size(runtime)) {
      return false;
    }
    auto length = propNames.size(runtime);
    for (size_t i = 0; i < length; ++i) {
      if (!String::strictEquals(
              runtime,
              other.propNames.getValueAtIndex(runtime, i).asString(runtime),
              propNames.getValueAtIndex(runtime, i).asString(runtime))) {
        return false;
      }
    }

    return true;
  }

  bool sameTypeFoundIn(Runtime& runtime, const SerializingType* ptr) {
    while (ptr) {
      if (this->sameTypeAs(runtime, *ptr)) {
        return true;
      }
      ptr = ptr->pNext;
    }
    return false;
  }
};

folly::dynamic dfvRecursive(
    Runtime& runtime,
    const Value& value,
    SerializingType* serializingType,
    bool skipFunctions,
    int depth,
    int maxDepth) {
  const bool enableMaxDepth = maxDepth >= 0;
  // If maxDepth is enabled, serialize to the max depth and disable testing for
  // cyclical recursion. This is useful if the cyclical recursion check gives a
  // false positive and caller wishes to override it.
  if (enableMaxDepth && (depth > maxDepth)) {
    return {};
  }
  if (value.isUndefined() || value.isNull()) {
    return nullptr;
  } else if (value.isBool()) {
    return value.getBool();
  } else if (value.isNumber()) {
    return value.getNumber();
  } else if (value.isString()) {
    return value.getString(runtime).utf8(runtime);
  } else if (value.isObject()) {
    Object obj = value.getObject(runtime);
    if (obj.isArray(runtime)) {
      Array array = obj.getArray(runtime);
      size_t arraySize = array.size(runtime);
      folly::dynamic dest = folly::dynamic::array();
      dest.reserve(arraySize);
      for (size_t i = 0; i < arraySize; ++i) {
        dest.push_back(dfvRecursive(
            runtime,
            array.getValueAtIndex(runtime, i),
            serializingType,
            skipFunctions,
            depth + 1,
            maxDepth));
      }
      return dest;
    } else if (obj.isFunction(runtime)) {
      throw JSError(runtime, "JS Functions are not convertible to dynamic");
    } else {
      SerializingType type(obj.getPropertyNames(runtime));
      type.pNext = serializingType;
      if (!enableMaxDepth && type.sameTypeFoundIn(runtime, serializingType)) {
        // This is different behavior from the previous implementation.
        // Previously this would continue and could lead to infinite recursion
        // due to types creating cyclical references, such as Vec3::xyz0 ->
        // Vec4, then Vec4::yxz -> Vec3 creating infinite recursion.
        return {};
      }
      const auto numNames = type.propNames.size(runtime);
      folly::dynamic dest = folly::dynamic::object();
      for (size_t i = 0; i < numNames; ++i) {
        String name =
            type.propNames.getValueAtIndex(runtime, i).getString(runtime);
        Value prop = obj.getProperty(runtime, name);
        if (prop.isUndefined()) {
          continue;
        }
        if (prop.isObject() && prop.getObject(runtime).isFunction(runtime)) {
          if (!skipFunctions) {
            dest[name.utf8(runtime)] = {};
          }
          continue;
        }
        auto stringName = name.utf8(runtime);
        dest[stringName] = dfvRecursive(
            runtime, prop, &type, skipFunctions, depth + 1, maxDepth);
      }
      return dest;
    }
  } else if (value.isBigInt()) {
    throw JSError(runtime, "JS BigInts are not convertible to dynamic");
  } else if (value.isSymbol()) {
    throw JSError(runtime, "JS Symbols are not convertible to dynamic");
  } else {
    throw JSError(runtime, "Value is not convertible to dynamic");
  }
}

} // namespace

folly::dynamic dynamicFromValue(
    Runtime& runtime,
    const Value& valueInput,
    bool skipFunctions,
    int maxDepth) {
  SerializingType type(Array(runtime, 0));
  return dfvRecursive(runtime, valueInput, &type, skipFunctions, 0, maxDepth);
}

} // namespace jsi
} // namespace facebook
