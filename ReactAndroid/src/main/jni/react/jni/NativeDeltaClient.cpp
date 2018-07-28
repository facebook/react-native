// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "NativeDeltaClient.h"

#include <sstream>
#include <fb/fbjni/ByteBuffer.h>
#include <folly/json.h>

namespace facebook {
namespace react {

jni::local_ref<NativeDeltaClient::jhybriddata> NativeDeltaClient::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

void NativeDeltaClient::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", NativeDeltaClient::initHybrid),
    makeNativeMethod("processDelta", NativeDeltaClient::jniProcessDelta),
    makeNativeMethod("reset", NativeDeltaClient::jniReset),
  });
}

void NativeDeltaClient::jniProcessDelta(
    jni::alias_ref<jni::JReadableByteChannel> delta) {

  std::ostringstream deltaMessage;
  std::vector<uint8_t> buffer(8192);
  auto byteBuffer = jni::JByteBuffer::wrapBytes(buffer.data(), buffer.size());

  size_t pos = 0;
  int read = 0;
  do {
    read = delta->read(byteBuffer);
    if (read < 1) {
      deltaMessage.write(reinterpret_cast<const char *>(buffer.data()), pos);
      byteBuffer->rewind();
      pos = 0;
    } else {
      pos += read;
    }
  } while (read != -1);


  deltaClient_->patch(folly::parseJson(deltaMessage.str()));
}

void NativeDeltaClient::jniReset() {
  deltaClient_->clear();
}

} // namespace react
} // namespace facebook
