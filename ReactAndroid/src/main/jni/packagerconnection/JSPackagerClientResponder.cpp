// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSPackagerClientResponder.h"

#include <jni/LocalString.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

void JSPackagerClientResponder::respond(alias_ref<jobject> result) {
  static auto method =
      javaClassStatic()->getMethod<void(alias_ref<jobject>)>("respond");
  method(self(), result);
}

void JSPackagerClientResponder::respond(const std::string &result) {
  respond(LocalString(result).string());
}

void JSPackagerClientResponder::error(alias_ref<jobject> result) {
  static auto method =
      javaClassStatic()->getMethod<void(alias_ref<jobject>)>("error");
  method(self(), result);
}

void JSPackagerClientResponder::error(const std::string &result) {
  error(LocalString(result).string());
}
}
}
