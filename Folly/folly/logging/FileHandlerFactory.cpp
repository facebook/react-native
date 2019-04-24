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
#include <folly/logging/FileHandlerFactory.h>

#include <folly/logging/FileWriterFactory.h>
#include <folly/logging/StandardLogHandler.h>
#include <folly/logging/StandardLogHandlerFactory.h>

namespace folly {

class FileHandlerFactory::WriterFactory
    : public StandardLogHandlerFactory::WriterFactory {
 public:
  bool processOption(StringPiece name, StringPiece value) override {
    if (name == "path") {
      path_ = value.str();
      return true;
    }

    // TODO(T29811675): In the future it would be nice to support log rotation,
    // and add parameters to control when the log file should be rotated.

    return fileWriterFactory_.processOption(name, value);
  }

  std::shared_ptr<LogWriter> createWriter() override {
    // Get the output file to use
    if (path_.empty()) {
      throw std::invalid_argument("no path specified for file handler");
    }
    return fileWriterFactory_.createWriter(
        File{path_, O_WRONLY | O_APPEND | O_CREAT});
  }

  std::string path_;
  FileWriterFactory fileWriterFactory_;
};

std::shared_ptr<LogHandler> FileHandlerFactory::createHandler(
    const Options& options) {
  WriterFactory writerFactory;
  return StandardLogHandlerFactory::createHandler(
      getType(), &writerFactory, options);
}

} // namespace folly
