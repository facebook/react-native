/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/experimental/NestedCommandLineApp.h>

#include <iostream>
#include <folly/FileUtil.h>
#include <folly/Format.h>
#include <folly/experimental/io/FsUtil.h>

namespace po = ::boost::program_options;

namespace folly {

namespace {

// Guess the program name as basename(executable)
std::string guessProgramName() {
  try {
    return fs::executable_path().filename().string();
  } catch (const std::exception&) {
    return "UNKNOWN";
  }
}

}  // namespace

ProgramExit::ProgramExit(int status, const std::string& msg)
  : std::runtime_error(msg),
    status_(status) {
  // Message is only allowed for non-zero exit status
  CHECK(status_ != 0 || msg.empty());
}

NestedCommandLineApp::NestedCommandLineApp(
    std::string programName,
    std::string version,
    InitFunction initFunction)
  : programName_(std::move(programName)),
    version_(std::move(version)),
    initFunction_(std::move(initFunction)),
    globalOptions_("Global options") {
  addCommand("help", "[command]",
             "Display help (globally or for a given command)",
             "Displays help (globally or for a given command).",
             [this] (const po::variables_map& vm,
                     const std::vector<std::string>& args) {
               displayHelp(vm, args);
             });

  globalOptions_.add_options()
    ("help,h", "Display help (globally or for a given command)")
    ("version", "Display version information");
}

po::options_description& NestedCommandLineApp::addCommand(
    std::string name,
    std::string argStr,
    std::string shortHelp,
    std::string fullHelp,
    Command command) {
  CommandInfo info {
    std::move(argStr),
    std::move(shortHelp),
    std::move(fullHelp),
    std::move(command),
    po::options_description(folly::sformat("Options for `{}'", name))
  };

  auto p = commands_.emplace(std::move(name), std::move(info));
  CHECK(p.second) << "Command already exists";

  return p.first->second.options;
}

void NestedCommandLineApp::addAlias(std::string newName,
                                     std::string oldName) {
  CHECK(aliases_.count(oldName) || commands_.count(oldName))
    << "Alias old name does not exist";
  CHECK(!aliases_.count(newName) && !commands_.count(newName))
    << "Alias new name already exists";
  aliases_.emplace(std::move(newName), std::move(oldName));
}

void NestedCommandLineApp::displayHelp(
    const po::variables_map& /* globalOptions */,
    const std::vector<std::string>& args) {
  if (args.empty()) {
    // General help
    printf(
        "Usage: %s [global_options...] <command> [command_options...] "
        "[command_args...]\n\n", programName_.c_str());
    std::cout << globalOptions_;
    printf("\nAvailable commands:\n");

    size_t maxLen = 0;
    for (auto& p : commands_) {
      maxLen = std::max(maxLen, p.first.size());
    }
    for (auto& p : aliases_) {
      maxLen = std::max(maxLen, p.first.size());
    }

    for (auto& p : commands_) {
      printf("  %-*s    %s\n",
             int(maxLen), p.first.c_str(), p.second.shortHelp.c_str());
    }

    if (!aliases_.empty()) {
      printf("\nAvailable aliases:\n");
      for (auto& p : aliases_) {
        printf("  %-*s => %s\n",
               int(maxLen), p.first.c_str(), resolveAlias(p.second).c_str());
      }
    }
  } else {
    // Help for a given command
    auto& p = findCommand(args.front());
    if (p.first != args.front()) {
      printf("`%s' is an alias for `%s'; showing help for `%s'\n",
             args.front().c_str(), p.first.c_str(), p.first.c_str());
    }
    auto& info = p.second;

    printf(
        "Usage: %s [global_options...] %s%s%s%s\n\n",
        programName_.c_str(),
        p.first.c_str(),
        info.options.options().empty() ? "" : " [command_options...]",
        info.argStr.empty() ? "" : " ",
        info.argStr.c_str());

    std::cout << globalOptions_;

    if (!info.options.options().empty()) {
      printf("\n");
      std::cout << info.options;
    }

    printf("\n%s\n", info.fullHelp.c_str());
  }
}

const std::string& NestedCommandLineApp::resolveAlias(
    const std::string& name) const {
  auto dest = &name;
  for (;;) {
    auto pos = aliases_.find(*dest);
    if (pos == aliases_.end()) {
      break;
    }
    dest = &pos->second;
  }
  return *dest;
}

auto NestedCommandLineApp::findCommand(const std::string& name) const
  -> const std::pair<const std::string, CommandInfo>& {
  auto pos = commands_.find(resolveAlias(name));
  if (pos == commands_.end()) {
    throw ProgramExit(
        1,
        folly::sformat("Command `{}' not found. Run `{} help' for help.",
                       name, programName_));
  }
  return *pos;
}

int NestedCommandLineApp::run(int argc, const char* const argv[]) {
  if (programName_.empty()) {
    programName_ = fs::path(argv[0]).filename().string();
  }
  return run(std::vector<std::string>(argv + 1, argv + argc));
}

int NestedCommandLineApp::run(const std::vector<std::string>& args) {
  int status;
  try {
    doRun(args);
    status = 0;
  } catch (const ProgramExit& ex) {
    if (ex.what()[0]) {  // if not empty
      fprintf(stderr, "%s\n", ex.what());
    }
    status = ex.status();
  } catch (const po::error& ex) {
    fprintf(stderr, "%s. Run `%s help' for help.\n",
            ex.what(), programName_.c_str());
    status = 1;
  }

  if (status == 0) {
    if (ferror(stdout)) {
      fprintf(stderr, "error on standard output\n");
      status = 1;
    } else if (fflush(stdout)) {
      fprintf(stderr, "standard output flush failed: %s\n",
              errnoStr(errno).c_str());
      status = 1;
    }
  }

  return status;
}

void NestedCommandLineApp::doRun(const std::vector<std::string>& args) {
  if (programName_.empty()) {
    programName_ = guessProgramName();
  }
  auto parsed = parseNestedCommandLine(args, globalOptions_);
  po::variables_map vm;
  po::store(parsed.options, vm);
  if (vm.count("help")) {
    std::vector<std::string> helpArgs;
    if (parsed.command) {
      helpArgs.push_back(*parsed.command);
    }
    displayHelp(vm, helpArgs);
    return;
  }

  if (vm.count("version")) {
    printf("%s %s\n", programName_.c_str(), version_.c_str());
    return;
  }

  if (!parsed.command) {
    throw ProgramExit(
        1,
        folly::sformat("Command not specified. Run `{} help' for help.",
                       programName_));
  }

  auto& p = findCommand(*parsed.command);
  auto& cmd = p.first;
  auto& info = p.second;

  auto cmdOptions =
    po::command_line_parser(parsed.rest).options(info.options).run();
  po::store(cmdOptions, vm);
  po::notify(vm);

  auto cmdArgs = po::collect_unrecognized(cmdOptions.options,
                                          po::include_positional);

  if (initFunction_) {
    initFunction_(cmd, vm, cmdArgs);
  }

  info.command(vm, cmdArgs);
}

}  // namespaces
