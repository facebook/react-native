/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <type_traits>

#include <jni.h>

#include <fb/Environment.h>

namespace facebook {
namespace jni {

template<class T>
struct LocalReferenceDeleter {
  static_assert(std::is_convertible<T, jobject>::value,
    "LocalReferenceDeleter<T> instantiated with type that is not convertible to jobject");
  void operator()(T localReference) {
    if (localReference != nullptr) {
      Environment::current()->DeleteLocalRef(localReference);
    }
  } 
 };

template<class T>
using LocalReference =
  std::unique_ptr<typename std::remove_pointer<T>::type, LocalReferenceDeleter<T>>;

} }
