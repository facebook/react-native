// Copyright 2004-present Facebook. All Rights Reserved.

#include "JExecutorToken.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

ExecutorToken JExecutorToken::getExecutorToken(alias_ref<JExecutorToken::javaobject> jobj) {
  std::lock_guard<std::mutex> guard(createTokenGuard_);
  auto sharedOwner = owner_.lock();
  if (!sharedOwner) {
    sharedOwner = std::shared_ptr<PlatformExecutorToken>(new JExecutorTokenHolder(jobj));
    owner_ = sharedOwner;
  }
  return ExecutorToken(sharedOwner);
}

local_ref<JExecutorToken::JavaPart> JExecutorToken::extractJavaPartFromToken(ExecutorToken token) {
  return make_local(static_cast<JExecutorTokenHolder*>(token.getPlatformExecutorToken().get())->getJobj());
}


} }
