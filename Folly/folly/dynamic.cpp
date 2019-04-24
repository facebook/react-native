/*
 * Copyright 2011-present Facebook, Inc.
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

#include <numeric>

#include <folly/dynamic.h>

#include <folly/Format.h>
#include <folly/hash/Hash.h>
#include <folly/lang/Assume.h>
#include <folly/lang/Exception.h>

namespace folly {

//////////////////////////////////////////////////////////////////////

#define FOLLY_DYNAMIC_DEF_TYPEINFO(T)                 \
  constexpr const char* dynamic::TypeInfo<T>::name;   \
  constexpr dynamic::Type dynamic::TypeInfo<T>::type; \
  //

FOLLY_DYNAMIC_DEF_TYPEINFO(std::nullptr_t)
FOLLY_DYNAMIC_DEF_TYPEINFO(bool)
FOLLY_DYNAMIC_DEF_TYPEINFO(std::string)
FOLLY_DYNAMIC_DEF_TYPEINFO(dynamic::Array)
FOLLY_DYNAMIC_DEF_TYPEINFO(double)
FOLLY_DYNAMIC_DEF_TYPEINFO(int64_t)
FOLLY_DYNAMIC_DEF_TYPEINFO(dynamic::ObjectImpl)

#undef FOLLY_DYNAMIC_DEF_TYPEINFO

const char* dynamic::typeName() const {
  return typeName(type_);
}

TypeError::TypeError(const std::string& expected, dynamic::Type actual)
    : std::runtime_error(sformat(
          "TypeError: expected dynamic type `{}', but had type `{}'",
          expected,
          dynamic::typeName(actual))) {}

TypeError::TypeError(
    const std::string& expected,
    dynamic::Type actual1,
    dynamic::Type actual2)
    : std::runtime_error(sformat(
          "TypeError: expected dynamic types `{}, but had types `{}' and `{}'",
          expected,
          dynamic::typeName(actual1),
          dynamic::typeName(actual2))) {}

TypeError::TypeError(const TypeError&) noexcept(
    std::is_nothrow_copy_constructible<std::runtime_error>::value) = default;
TypeError& TypeError::operator=(const TypeError&) noexcept(
    std::is_nothrow_copy_assignable<std::runtime_error>::value) = default;
TypeError::TypeError(TypeError&&) noexcept(
    std::is_nothrow_move_constructible<std::runtime_error>::value) = default;
TypeError& TypeError::operator=(TypeError&&) noexcept(
    std::is_nothrow_move_assignable<std::runtime_error>::value) = default;
TypeError::~TypeError() = default;

// This is a higher-order preprocessor macro to aid going from runtime
// types to the compile time type system.
#define FB_DYNAMIC_APPLY(type, apply) \
  do {                                \
    switch ((type)) {                 \
      case NULLT:                     \
        apply(std::nullptr_t);        \
        break;                        \
      case ARRAY:                     \
        apply(Array);                 \
        break;                        \
      case BOOL:                      \
        apply(bool);                  \
        break;                        \
      case DOUBLE:                    \
        apply(double);                \
        break;                        \
      case INT64:                     \
        apply(int64_t);               \
        break;                        \
      case OBJECT:                    \
        apply(ObjectImpl);            \
        break;                        \
      case STRING:                    \
        apply(std::string);           \
        break;                        \
      default:                        \
        CHECK(0);                     \
        abort();                      \
    }                                 \
  } while (0)

bool dynamic::operator<(dynamic const& o) const {
  if (UNLIKELY(type_ == OBJECT || o.type_ == OBJECT)) {
    throw_exception<TypeError>("object", type_);
  }
  if (type_ != o.type_) {
    return type_ < o.type_;
  }

#define FB_X(T) return CompareOp<T>::comp(*getAddress<T>(), *o.getAddress<T>())
  FB_DYNAMIC_APPLY(type_, FB_X);
#undef FB_X
}

bool dynamic::operator==(dynamic const& o) const {
  if (type() != o.type()) {
    if (isNumber() && o.isNumber()) {
      auto& integ = isInt() ? *this : o;
      auto& doubl = isInt() ? o : *this;
      return integ.asInt() == doubl.asDouble();
    }
    return false;
  }

#define FB_X(T) return *getAddress<T>() == *o.getAddress<T>();
  FB_DYNAMIC_APPLY(type_, FB_X);
#undef FB_X
}

dynamic& dynamic::operator=(dynamic const& o) {
  if (&o != this) {
    if (type_ == o.type_) {
#define FB_X(T) *getAddress<T>() = *o.getAddress<T>()
      FB_DYNAMIC_APPLY(type_, FB_X);
#undef FB_X
    } else {
      destroy();
#define FB_X(T) new (getAddress<T>()) T(*o.getAddress<T>())
      FB_DYNAMIC_APPLY(o.type_, FB_X);
#undef FB_X
      type_ = o.type_;
    }
  }
  return *this;
}

dynamic& dynamic::operator=(dynamic&& o) noexcept {
  if (&o != this) {
    if (type_ == o.type_) {
#define FB_X(T) *getAddress<T>() = std::move(*o.getAddress<T>())
      FB_DYNAMIC_APPLY(type_, FB_X);
#undef FB_X
    } else {
      destroy();
#define FB_X(T) new (getAddress<T>()) T(std::move(*o.getAddress<T>()))
      FB_DYNAMIC_APPLY(o.type_, FB_X);
#undef FB_X
      type_ = o.type_;
    }
  }
  return *this;
}

dynamic const& dynamic::atImpl(dynamic const& idx) const& {
  if (auto* parray = get_nothrow<Array>()) {
    if (!idx.isInt()) {
      throw_exception<TypeError>("int64", idx.type());
    }
    if (idx < 0 || idx >= parray->size()) {
      throw_exception<std::out_of_range>("out of range in dynamic array");
    }
    return (*parray)[size_t(idx.asInt())];
  } else if (auto* pobject = get_nothrow<ObjectImpl>()) {
    auto it = pobject->find(idx);
    if (it == pobject->end()) {
      throw_exception<std::out_of_range>(
          sformat("couldn't find key {} in dynamic object", idx.asString()));
    }
    return it->second;
  } else {
    throw_exception<TypeError>("object/array", type());
  }
}

dynamic const& dynamic::at(StringPiece idx) const& {
  auto* pobject = get_nothrow<ObjectImpl>();
  if (!pobject) {
    throw_exception<TypeError>("object", type());
  }
  auto it = pobject->find(idx);
  if (it == pobject->end()) {
    throw_exception<std::out_of_range>(
        sformat("couldn't find key {} in dynamic object", idx));
  }
  return it->second;
}

dynamic& dynamic::operator[](StringPiece k) & {
  auto& obj = get<ObjectImpl>();
  auto ret = obj.emplace(k, nullptr);
  return ret.first->second;
}

dynamic dynamic::getDefault(StringPiece k, const dynamic& v) const& {
  auto& obj = get<ObjectImpl>();
  auto it = obj.find(k);
  return it == obj.end() ? v : it->second;
}

dynamic dynamic::getDefault(StringPiece k, dynamic&& v) const& {
  auto& obj = get<ObjectImpl>();
  auto it = obj.find(k);
  // Avoid clang bug with ternary
  if (it == obj.end()) {
    return std::move(v);
  } else {
    return it->second;
  }
}

dynamic dynamic::getDefault(StringPiece k, const dynamic& v) && {
  auto& obj = get<ObjectImpl>();
  auto it = obj.find(k);
  // Avoid clang bug with ternary
  if (it == obj.end()) {
    return v;
  } else {
    return std::move(it->second);
  }
}

dynamic dynamic::getDefault(StringPiece k, dynamic&& v) && {
  auto& obj = get<ObjectImpl>();
  auto it = obj.find(k);
  return std::move(it == obj.end() ? v : it->second);
}

const dynamic* dynamic::get_ptrImpl(dynamic const& idx) const& {
  if (auto* parray = get_nothrow<Array>()) {
    if (!idx.isInt()) {
      throw_exception<TypeError>("int64", idx.type());
    }
    if (idx < 0 || idx >= parray->size()) {
      return nullptr;
    }
    return &(*parray)[size_t(idx.asInt())];
  } else if (auto* pobject = get_nothrow<ObjectImpl>()) {
    auto it = pobject->find(idx);
    if (it == pobject->end()) {
      return nullptr;
    }
    return &it->second;
  } else {
    throw_exception<TypeError>("object/array", type());
  }
}

const dynamic* dynamic::get_ptr(StringPiece idx) const& {
  auto* pobject = get_nothrow<ObjectImpl>();
  if (!pobject) {
    throw_exception<TypeError>("object", type());
  }
  auto it = pobject->find(idx);
  if (it == pobject->end()) {
    return nullptr;
  }
  return &it->second;
}

std::size_t dynamic::size() const {
  if (auto* ar = get_nothrow<Array>()) {
    return ar->size();
  }
  if (auto* obj = get_nothrow<ObjectImpl>()) {
    return obj->size();
  }
  if (auto* str = get_nothrow<std::string>()) {
    return str->size();
  }
  throw_exception<TypeError>("array/object/string", type());
}

dynamic::iterator dynamic::erase(const_iterator first, const_iterator last) {
  auto& arr = get<Array>();
  return get<Array>().erase(
      arr.begin() + (first - arr.begin()), arr.begin() + (last - arr.begin()));
}

std::size_t dynamic::hash() const {
  switch (type()) {
    case NULLT:
      return 0xBAAAAAAD;
    case OBJECT: {
      // Accumulate using addition instead of using hash_range (as in the ARRAY
      // case), as we need a commutative hash operation since unordered_map's
      // iteration order is unspecified.
      auto h = std::hash<std::pair<dynamic, dynamic>>{};
      return std::accumulate(
          items().begin(),
          items().end(),
          size_t{0x0B1EC7},
          [&](auto acc, auto item) { return acc + h(item); });
    }
    case ARRAY:
      return folly::hash::hash_range(begin(), end());
    case INT64:
      return std::hash<int64_t>()(getInt());
    case DOUBLE:
      return std::hash<double>()(getDouble());
    case BOOL:
      return std::hash<bool>()(getBool());
    case STRING:
      // keep consistent with detail::DynamicHasher
      return Hash()(getString());
  }
  assume_unreachable();
}

char const* dynamic::typeName(Type t) {
#define FB_X(T) return TypeInfo<T>::name
  FB_DYNAMIC_APPLY(t, FB_X);
#undef FB_X
}

void dynamic::destroy() noexcept {
  // This short-circuit speeds up some microbenchmarks.
  if (type_ == NULLT) {
    return;
  }

#define FB_X(T) detail::Destroy::destroy(getAddress<T>())
  FB_DYNAMIC_APPLY(type_, FB_X);
#undef FB_X
  type_ = NULLT;
  u_.nul = nullptr;
}

dynamic dynamic::merge_diff(const dynamic& source, const dynamic& target) {
  if (!source.isObject() || source.type() != target.type()) {
    return target;
  }

  dynamic diff = object;

  // added/modified keys
  for (const auto& pair : target.items()) {
    auto it = source.find(pair.first);
    if (it == source.items().end()) {
      diff[pair.first] = pair.second;
    } else {
      diff[pair.first] = merge_diff(source[pair.first], target[pair.first]);
    }
  }

  // removed keys
  for (const auto& pair : source.items()) {
    auto it = target.find(pair.first);
    if (it == target.items().end()) {
      diff[pair.first] = nullptr;
    }
  }

  return diff;
}

const dynamic* dynamic::get_ptr(json_pointer const& jsonPtr) const& {
  auto const& tokens = jsonPtr.tokens();
  if (tokens.empty()) {
    return this;
  }
  dynamic const* dyn = this;
  for (auto const& token : tokens) {
    if (!dyn) {
      return nullptr;
    }
    // special case of parsing "/": lookup key with empty name
    if (token.empty()) {
      if (dyn->isObject()) {
        dyn = dyn->get_ptr("");
        continue;
      }
      throw_exception<TypeError>("object", dyn->type());
    }
    if (auto* parray = dyn->get_nothrow<dynamic::Array>()) {
      if (token.size() > 1 && token.at(0) == '0') {
        throw std::invalid_argument(
            "Leading zero not allowed when indexing arrays");
      }
      // special case, always return non-existent
      if (token.size() == 1 && token.at(0) == '-') {
        dyn = nullptr;
        continue;
      }
      auto const idx = folly::to<size_t>(token);
      dyn = idx < parray->size() ? &(*parray)[idx] : nullptr;
      continue;
    }
    if (auto* pobject = dyn->get_nothrow<dynamic::ObjectImpl>()) {
      auto const it = pobject->find(token);
      dyn = it != pobject->end() ? &it->second : nullptr;
      continue;
    }
    throw_exception<TypeError>("object/array", dyn->type());
  }
  return dyn;
}

//////////////////////////////////////////////////////////////////////

} // namespace folly
