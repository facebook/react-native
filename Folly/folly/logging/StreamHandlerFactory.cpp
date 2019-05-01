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
#include <folly/logging/StreamHandlerFactory.h>

#include <folly/Conv.h>
#include <folly/logging/FileWriterFactory.h>
#include <folly/logging/StandardLogHandler.h>
#include <folly/logging/StandardLogHandlerFactory.h>

namespace folly {

class StreamHandlerFactory::WriterFactory
    : public StandardLogHandlerFactory::WriterFactory {
 public:
  bool processOption(StringPiece name, StringPiece value) override {
    if (name == "stream") {
      stream_ = value.str();
      return true;
    }
    return fileWriterFactory_.processOption(name, value);
  }

  std::shared_ptr<LogWriter> createWriter() override {
    // Get the output file to use
    File outputFile;
    if (stream_.empty()) {
      throw std::invalid_argument(
          "no stream name specified for stream handler");
    } else if (stream_ == "stderr") {
      outputFile = File{STDERR_FILENO, /* ownsFd */ false};
    } else if (stream_ == "stdout") {
      outputFile = File{STDOUT_FILENO, /* ownsFd */ false};
    } else {
      throw std::invalid_argument(to<std::string>(
          "unknown stream \"",
          stream_,
          "\": expected one of stdout or stderr"));
    }

    return fileWriterFactory_.createWriter(std::move(outputFile));
  }

  std::string stream_;
  FileWriterFactory fileWriterFactory_;
};

std::shared_ptr<LogHandler> StreamHandlerFactory::createHandler(
    const Options& options) {
  WriterFactory writerFactory;
  return StandardLogHandlerFactory::createHandler(
      getType(), &writerFactory, options);
}

} // namespace folly
