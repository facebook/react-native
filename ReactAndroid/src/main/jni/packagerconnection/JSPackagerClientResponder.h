// Copyright 2004-present Facebook. All Rights Reserved.

#include <fb/fbjni.h>

namespace facebook {
namespace react {

class JSPackagerClientResponder
    : public jni::JavaClass<JSPackagerClientResponder> {
public:
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/packagerconnection/Responder;";

  void respond(jni::alias_ref<jobject> result);
  void respond(const std::string& result);

  void error(jni::alias_ref<jobject> result);
  void error(const std::string& result);
};

}
}
