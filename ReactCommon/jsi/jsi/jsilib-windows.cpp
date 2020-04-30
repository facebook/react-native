/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef _WINDOWS

#include <jsi/jsilib.h>

namespace facebook {
namespace jsi {

FileBuffer::FileBuffer(const std::string&) {
  // TODO(T41045067) Implement this on Windows
  throw new JSINativeException("FileBuffer is not implemented on Windows");
}

FileBuffer::~FileBuffer() {
  assert(false && "FileBuffer is not implemented on Windows");
}

} // namespace jsi
} // namespace facebook

#endif //_WINDOWS
