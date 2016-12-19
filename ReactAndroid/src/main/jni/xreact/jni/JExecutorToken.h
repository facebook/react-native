// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <mutex>

#include <fb/fbjni.h>

#include <cxxreact/ExecutorToken.h>
#include <jschelpers/noncopyable.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

class JExecutorTokenHolder;
class JExecutorToken : public HybridClass<JExecutorToken> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ExecutorToken;";

  ExecutorToken getExecutorToken(alias_ref<JExecutorToken::javaobject> jobj);

  static local_ref<JavaPart> extractJavaPartFromToken(ExecutorToken token);
private:
  friend HybridBase;
  friend JExecutorTokenHolder;

  JExecutorToken() {}

  std::weak_ptr<PlatformExecutorToken> owner_;
  std::mutex createTokenGuard_;
};

/**
 * Wrapper class to hold references to both the c++ and Java parts of the
 * ExecutorToken object. The goal is to allow a reference to a token from either
 * c++ or Java to keep both the Java object and c++ hybrid part alive. For c++
 * references, we accomplish this by having JExecutorTokenHolder keep a reference
 * to the Java object (which has a reference to the JExecutorToken hybrid part).
 * For Java references, we allow the JExecutorTokenHolder to be deallocated if there
 * are no references to it in c++ from a PlatformExecutorToken, but will dynamically
 * create a new one in JExecutorToken.getExecutorToken if needed.
 */
class JExecutorTokenHolder : public PlatformExecutorToken, public noncopyable {
public:
  explicit JExecutorTokenHolder(alias_ref<JExecutorToken::javaobject> jobj) :
    jobj_(make_global(jobj)),
    impl_(cthis(jobj)) {
  }

  JExecutorToken::javaobject getJobj() {
    return jobj_.get();
  }

private:
  global_ref<JExecutorToken::javaobject> jobj_;
  JExecutorToken *impl_;
};

} }
