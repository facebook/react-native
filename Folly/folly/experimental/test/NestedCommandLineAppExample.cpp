/*
 * Copyright 2015-present Facebook, Inc.
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

// Example application using the nested command line parser.
//
// Implements two commands: "cat" and "echo", which behave similarly to their
// Unix homonyms.

#include <folly/ScopeGuard.h>
#include <folly/String.h>
#include <folly/experimental/NestedCommandLineApp.h>
#include <folly/experimental/ProgramOptions.h>

namespace po = ::boost::program_options;

namespace {

class InputError : public std::runtime_error {
 public:
  explicit InputError(const std::string& msg) : std::runtime_error(msg) {}
};

class OutputError : public std::runtime_error {
 public:
  explicit OutputError(const std::string& msg) : std::runtime_error(msg) {}
};

class Concatenator {
 public:
  explicit Concatenator(const po::variables_map& options)
      : printLineNumbers_(options["number"].as<bool>()) {}

  void cat(const std::string& name);
  void cat(FILE* file);

  bool printLineNumbers() const {
    return printLineNumbers_;
  }

 private:
  bool printLineNumbers_;
  size_t lineNumber_ = 0;
};

// clang-format off
[[noreturn]] void throwOutputError() {
  throw OutputError(folly::errnoStr(errno).toStdString());
}

[[noreturn]] void throwInputError() {
  throw InputError(folly::errnoStr(errno).toStdString());
}
// clang-format on

void Concatenator::cat(FILE* file) {
  char* lineBuf = nullptr;
  size_t lineBufSize = 0;
  SCOPE_EXIT {
    free(lineBuf);
  };

  ssize_t n;
  while ((n = getline(&lineBuf, &lineBufSize, file)) >= 0) {
    ++lineNumber_;
    if ((printLineNumbers_ && printf("%6zu  ", lineNumber_) < 0) ||
        fwrite(lineBuf, 1, n, stdout) < size_t(n)) {
      throwOutputError();
    }
  }

  if (ferror(file)) {
    throwInputError();
  }
}

void Concatenator::cat(const std::string& name) {
  auto file = fopen(name.c_str(), "r");
  if (!file) {
    throwInputError();
  }

  // Ignore error, as we might be processing an exception;
  // during normal operation, we call fclose() directly further below
  auto guard = folly::makeGuard([file] { fclose(file); });

  cat(file);

  guard.dismiss();
  if (fclose(file)) {
    throwInputError();
  }
}

void runCat(
    const po::variables_map& options,
    const std::vector<std::string>& args) {
  Concatenator concatenator(options);
  bool ok = true;
  auto catFile = [&concatenator, &ok](const std::string& name) {
    try {
      if (name == "-") {
        concatenator.cat(stdin);
      } else {
        concatenator.cat(name);
      }
    } catch (const InputError& e) {
      ok = false;
      fprintf(stderr, "cat: %s: %s\n", name.c_str(), e.what());
    }
  };

  try {
    if (args.empty()) {
      catFile("-");
    } else {
      for (auto& name : args) {
        catFile(name);
      }
    }
  } catch (const OutputError& e) {
    throw folly::ProgramExit(
        1, folly::to<std::string>("cat: write error: ", e.what()));
  }
  if (!ok) {
    throw folly::ProgramExit(1);
  }
}

void runEcho(
    const po::variables_map& options,
    const std::vector<std::string>& args) {
  try {
    const char* sep = "";
    for (auto& arg : args) {
      if (printf("%s%s", sep, arg.c_str()) < 0) {
        throw OutputError(folly::errnoStr(errno).toStdString());
      }
      sep = " ";
    }
    if (!options["-n"].as<bool>()) {
      if (putchar('\n') == EOF) {
        throw OutputError(folly::errnoStr(errno).toStdString());
      }
    }
  } catch (const OutputError& e) {
    throw folly::ProgramExit(
        1, folly::to<std::string>("echo: write error: ", e.what()));
  }
}

} // namespace

int main(int argc, char* argv[]) {
  // Initialize a NestedCommandLineApp object.
  //
  // The first argument is the program name -- an empty string will cause the
  // program name to be deduced from the executable name, which is usually
  // fine. The second argument is a version string.
  //
  // You may also add an "initialization function" that is always called
  // for every valid command before the command is executed.
  folly::NestedCommandLineApp app("", "0.1");

  // Add any GFlags-defined flags. These are global flags, and so they should
  // be valid for any command.
  app.addGFlags();

  // Add any commands. For our example, we'll implement simplified versions
  // of "cat" and "echo". Note that addCommand() returns a reference to a
  // boost::program_options object that you may use to add command-specific
  // options.
  // clang-format off
  app.addCommand(
      // command name
      "cat",

      // argument description
      "[file...]",

      // short help string
      "Concatenate files and print them on standard output",

      // Long help string
      "Concatenate files and print them on standard output.",

      // Function to execute
      runCat)
    .add_options()
      ("number,n", po::bool_switch(), "number all output lines");
  // clang-format on

  // clang-format off
  app.addCommand(
      "echo",
      "[string...]",
      "Display a line of text",
      "Display a line of text.",
      runEcho)
    .add_options()
      (",n", po::bool_switch(), "do not output the trailing newline");
  // clang-format on

  // You may also add command aliases -- that is, multiple command names
  // that do the same thing; see addAlias().

  // app.run returns an appropriate error code
  return app.run(argc, argv);
}
