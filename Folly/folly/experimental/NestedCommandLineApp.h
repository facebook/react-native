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
#pragma once

#include <functional>
#include <set>
#include <stdexcept>

#include <folly/CPortability.h>
#include <folly/String.h>
#include <folly/experimental/ProgramOptions.h>

namespace folly {

/**
 * Exception that commands may throw to force the program to exit cleanly
 * with a given exit code. NestedCommandLineApp::run() catches this and
 * makes run() print the given message on stderr (followed by a newline, unless
 * empty; the message is only allowed when exiting with a non-zero status), and
 * return the exit code. (Other exceptions will propagate out of run())
 */
class FOLLY_EXPORT ProgramExit : public std::runtime_error {
 public:
  explicit ProgramExit(int status, const std::string& msg = std::string());
  int status() const {
    return status_;
  }

 private:
  int status_;
};

/**
 * App that uses a nested command line, of the form:
 *
 * program [--global_options...] command [--command_options...] command_args...
 */
class NestedCommandLineApp {
 public:
  typedef std::function<void(
      const std::string& command,
      const boost::program_options::variables_map& options,
      const std::vector<std::string>& args)>
      InitFunction;

  typedef std::function<void(
      const boost::program_options::variables_map& options,
      const std::vector<std::string>&)>
      Command;

  static constexpr StringPiece const kHelpCommand = "help";
  static constexpr StringPiece const kVersionCommand = "version";
  /**
   * Initialize the app.
   *
   * If programName is not set, we try to guess (readlink("/proc/self/exe")).
   *
   * version is the version string printed when given the --version flag.
   *
   * initFunction, if specified, is called after parsing the command line,
   * right before executing the command.
   */
  explicit NestedCommandLineApp(
      std::string programName = std::string(),
      std::string version = std::string(),
      std::string programHeading = std::string(),
      std::string programHelpFooter = std::string(),
      InitFunction initFunction = InitFunction());

  /**
   * Add GFlags to the list of supported options with the given style.
   */
  void addGFlags(ProgramOptionsStyle style = ProgramOptionsStyle::GNU) {
    globalOptions_.add(getGFlags(style));
  }

  /**
   * Return the global options object, so you can add options.
   */
  boost::program_options::options_description& globalOptions() {
    return globalOptions_;
  }

  /**
   * Add a command.
   *
   * name:  command name
   * argStr: description of arguments in help strings
   *   (<filename> <N>)
   * shortHelp: one-line summary help string
   * fullHelp: full help string
   * command: function to run
   *
   * Returns a reference to the options_description object that you can
   * use to add options for this command.
   */
  boost::program_options::options_description& addCommand(
      std::string name,
      std::string argStr,
      std::string shortHelp,
      std::string fullHelp,
      Command command);

  /**
   * Add an alias; running the command newName will have the same effect
   * as running oldName.
   */
  void addAlias(std::string newName, std::string oldName);

  /**
   * Run the command and return; the return code is 0 on success or
   * non-zero on error, so it is idiomatic to call this at the end of main():
   * return app.run(argc, argv);
   *
   * On successful exit, run() will check for errors on stdout (and flush
   * it) to help command-line applications that need to write to stdout
   * (failing to write to stdout is an error). If there is an error on stdout,
   * we'll print a helpful message on stderr and return an error status (1).
   */
  int run(int argc, const char* const argv[]);
  int run(const std::vector<std::string>& args);

  /**
   * Return true if name represent known built-in command (help, version)
   */
  bool isBuiltinCommand(const std::string& name) const;

 private:
  void doRun(const std::vector<std::string>& args);
  const std::string& resolveAlias(const std::string& name) const;

  struct CommandInfo {
    std::string argStr;
    std::string shortHelp;
    std::string fullHelp;
    Command command;
    boost::program_options::options_description options;
  };

  const std::pair<const std::string, CommandInfo>& findCommand(
      const std::string& name) const;

  void displayHelp(
      const boost::program_options::variables_map& options,
      const std::vector<std::string>& args) const;

  void displayVersion() const;

  std::string programName_;
  std::string programHeading_;
  std::string programHelpFooter_;
  std::string version_;
  InitFunction initFunction_;
  boost::program_options::options_description globalOptions_;
  std::map<std::string, CommandInfo> commands_;
  std::map<std::string, std::string> aliases_;
  std::set<folly::StringPiece> builtinCommands_;
};

} // namespace folly
