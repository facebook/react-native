// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

namespace facebook {
namespace xplat {

namespace detail {

template <typename R, typename M, typename... T>
R jsArg1(const folly::dynamic& arg, M asFoo, const T&... desc) {
  try {
    return (arg.*asFoo)();
  } catch (const folly::TypeError& ex) {
    throw JsArgumentException(
      folly::to<std::string>(
        "Error converting javascript arg ", desc..., " to C++: ", ex.what()));
  } catch (const std::range_error& ex) {
    throw JsArgumentException(
      folly::to<std::string>(
        "Could not convert argument ", desc..., " to required type: ", ex.what()));
  }
}

}

template <typename R, typename... T>
R jsArg(const folly::dynamic& arg, R (folly::dynamic::*asFoo)() const, const T&... desc) {
  return detail::jsArg1<R>(arg, asFoo, desc...);
}

template <typename R, typename... T>
R jsArg(const folly::dynamic& arg, R (folly::dynamic::*asFoo)() const&, const T&... desc) {
  return detail::jsArg1<R>(arg, asFoo, desc...);
}

template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsDynamic(T&& args, size_t n) {
  try {
    return args[n];
  } catch (const std::out_of_range& ex) {
    // Use 1-base counting for argument description.
    throw JsArgumentException(
      folly::to<std::string>(
        "JavaScript provided ", args.size(),
        " arguments for C++ method which references at least ", n + 1,
        " arguments: ", ex.what()));
  }
}

template <typename R>
R jsArgN(const folly::dynamic& args, size_t n, R (folly::dynamic::*asFoo)() const) {
  return jsArg(jsArgAsDynamic(args, n), asFoo, n);
}
template <typename R>
R jsArgN(const folly::dynamic& args, size_t n, R (folly::dynamic::*asFoo)() const&) {
  return jsArg(jsArgAsDynamic(args, n), asFoo, n);
}

namespace detail {

// This is a helper for jsArgAsArray and jsArgAsObject.

template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsType(T&& args, size_t n, const char* required,
                                                  bool (folly::dynamic::*isFoo)() const) {
  T& ret = jsArgAsDynamic(args, n);
  if ((ret.*isFoo)()) {
    return ret;
  }

  // Use 1-base counting for argument description.
  throw JsArgumentException(
    folly::to<std::string>(
      "Argument ", n + 1, " of type ", ret.typeName(), " is not required type ", required));
}

} // end namespace detail

template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsArray(T&& args, size_t n) {
  return detail::jsArgAsType(args, n, "Array", &folly::dynamic::isArray);
}

template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsObject(T&& args, size_t n) {
  return detail::jsArgAsType(args, n, "Object", &folly::dynamic::isObject);
}

}}
