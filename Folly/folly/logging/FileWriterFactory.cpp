/*
 * Copyright 2017-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include <folly/logging/FileWriterFactory.h>

#include <folly/Conv.h>
#include <folly/File.h>
#include <folly/logging/AsyncFileWriter.h>
#include <folly/logging/ImmediateFileWriter.h>

using std::make_shared;
using std::string;

namespace folly {

bool FileWriterFactory::processOption(StringPiece name, StringPiece value) {
  if (name == "async") {
    async_ = to<bool>(value);
    return true;
  } else if (name == "max_buffer_size") {
    auto size = to<size_t>(value);
    if (size == 0) {
      throw std::invalid_argument(to<string>("must be a positive integer"));
    }
    maxBufferSize_ = size;
    return true;
  } else {
    return false;
  }
}

std::shared_ptr<LogWriter> FileWriterFactory::createWriter(File file) {
  // Determine whether we should use ImmediateFileWriter or AsyncFileWriter
  if (async_) {
    auto asyncWriter = make_shared<AsyncFileWriter>(std::move(file));
    if (maxBufferSize_.hasValue()) {
      asyncWriter->setMaxBufferSize(maxBufferSize_.value());
    }
    return asyncWriter;
  } else {
    if (maxBufferSize_.hasValue()) {
      throw std::invalid_argument(to<string>(
          "the \"max_buffer_size\" option is only valid for async file "
          "handlers"));
    }
    return make_shared<ImmediateFileWriter>(std::move(file));
  }
}

} // namespace folly
