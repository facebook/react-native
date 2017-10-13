// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cassert>
#include <cstdlib>
#include <type_traits>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

// Base class for private data used to implement hybrid JS-native objects. A common root class,
// rtti and dynamic_cast allow us to do some runtime type checking that makes it possible
// for multiple hybrid object implementations to co-exist.
class RN_EXPORT PrivateDataBase {
 public:
  virtual ~PrivateDataBase();

  // Casts given void* to PrivateDataBase and performs dynamic_cast to desired type. Returns null on
  // failure.
  template <typename T>
  static typename std::enable_if<std::is_base_of<PrivateDataBase, T>::value, T>::type* tryCast(void* ptr) {
    return dynamic_cast<T*>(reinterpret_cast<PrivateDataBase*>(ptr));
  }

  // Like tryCast, but aborts on failure.
  template <typename T>
  static typename std::enable_if<std::is_base_of<PrivateDataBase, T>::value, T>::type* cast(void* ptr) {
    auto result = tryCast<T>(ptr);
    if (!result) {
      assert(false && "could not cast to desired type");
      abort();
    }
    return result;
  }
};

} }
