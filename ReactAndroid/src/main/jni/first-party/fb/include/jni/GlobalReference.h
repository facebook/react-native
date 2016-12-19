/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <memory>
#include <type_traits>

#include <jni.h>

#include <fb/Environment.h>

namespace facebook { namespace jni {

template<typename T>
class GlobalReference {
  static_assert(std::is_convertible<T, jobject>::value,
                "GlobalReference<T> instantiated with type that is not "
                "convertible to jobject");

 public:
  explicit GlobalReference(T globalReference) :
    reference_(globalReference? Environment::current()->NewGlobalRef(globalReference) : nullptr) {
  }

  ~GlobalReference() {
    reset();
  }

  GlobalReference() :
    reference_(nullptr) {
  }

  // enable move constructor and assignment
  GlobalReference(GlobalReference&& rhs) :
    reference_(std::move(rhs.reference_)) {
    rhs.reference_ = nullptr;
  }

  GlobalReference& operator=(GlobalReference&& rhs) {
    if (this != &rhs) {
      reset();
      reference_ = std::move(rhs.reference_);
      rhs.reference_ = nullptr;
    }
    return *this;
  }

  GlobalReference(const GlobalReference<T>& rhs) :
    reference_{} {
    reset(rhs.get());
  }

  GlobalReference& operator=(const GlobalReference<T>& rhs) {
    if (this == &rhs) {
      return *this;
    }
    reset(rhs.get());
    return *this;
  }

  explicit operator bool() const {
    return (reference_ != nullptr);
  }

  T get() const {
    return reinterpret_cast<T>(reference_);
  }

  void reset(T globalReference = nullptr) {
    if (reference_) {
      Environment::current()->DeleteGlobalRef(reference_);
    }
    if (globalReference) {
      reference_ = Environment::current()->NewGlobalRef(globalReference);
    } else {
      reference_ = nullptr;
    }
  }

 private:
  jobject reference_;
};

}}
