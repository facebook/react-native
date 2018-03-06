/*
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CoreClasses.h"
#include "File.h"

namespace facebook {
namespace jni {

class AContext : public JavaClass<AContext> {
 public:
  static constexpr const char* kJavaDescriptor = "Landroid/content/Context;";

  // Define a method that calls into the represented Java class
  local_ref<JFile::javaobject> getCacheDir() {
    static auto method = getClass()->getMethod<JFile::javaobject()>("getCacheDir");
    return method(self());
  }

  local_ref<JFile::javaobject> getFilesDir() {
    static auto method = getClass()->getMethod<JFile::javaobject()>("getFilesDir");
    return method(self());
  }
};

}
}
