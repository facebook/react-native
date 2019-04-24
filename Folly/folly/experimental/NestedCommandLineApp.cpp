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

} // namespace

ProgramExit::ProgramExit(int status, const std::string& msg)
    : std::runtime_error(msg), status_(status) {
  // Message is only allowed for non-zero exit status
  CHECK(status_ != 0 || msg.empty());
}

constexpr StringPiece const NestedCommandLineApp::kHelpCommand;
constexpr StringPiece const NestedCommandLineApp::kVersionCommand;

NestedCommandLineApp::NestedCommandLineApp(
    std::string programName,
    std::string version,
    std::string programHeading,
    std::string programHelpFooter,
    InitFunction initFunction)
    : programName_(std::move(programName)),
      programHeading_(std::move(programHeading)),
      programHelpFooter_(std::move(programHelpFooter)),
      version_(std::move(version)),
      initFunction_(std::move(initFunction)),
      globalOptions_("Global options") {
  addCommand(
      kHelpCommand.str(),
      "[command]",
      "Display help (globally or for a given command)",
      "Displays help (globally or for a given command).",
      [this](
          const po::variables_map& vm, const std::vector<std::string>& args) {
        displayHelp(vm, args);
      });
  builtinCommands_.insert(kHelpCommand);

  addCommand(
      kVersionCommand.str(),
      "[command]",
      "Display version information",
      "Displays version information.",
      [this](const po::variables_map&, const std::vector<std::string>&) {
        displayVersion();
      });
  builtinCommands_.insert(kVersionCommand);

  globalOptions_.add_options()(
      kHelpCommand.str().c_str(),
      "Display help (globally or for a given command)")(
      kVersionCommand.str().c_str(), "Display version information");
}

po::options_description& NestedCommandLineApp::addCommand(
    std::string name,
    std::string argStr,
    std::string shortHelp,
    std::string fullHelp,
    Command command) {
  CommandInfo info{
      std::move(argStr),
      std::move(shortHelp),
      std::move(fullHelp),
      std::move(command),
      po::options_description(folly::sformat("Options for `{}'", name))};

  auto p = commands_.emplace(std::move(name), std::move(info));
  CHECK(p.second) << "Command already exists";

  return p.first->second.options;
}

void NestedCommandLineApp::addAlias(std::string newName, std::string oldName) {
  CHECK(aliases_.count(oldName) || commands_.count(oldName))
      << "Alias old name does not exist";
  CHECK(!aliases_.count(newName) && !commands_.count(newName))
      << "Alias new name already exists";
  aliases_.emplace(std::move(newName), std::move(oldName));
}

void NestedCommandLineApp::displayHelp(
    const po::variables_map& /* globalOptions */,
    const std::vector<std::string>& args) const {
  if (args.empty()) {
    // General help
    printf(
        "%s\nUsage: %s [global_options...] <command> [command_options...] "
        "[command_args...]\n\n",
        programHeading_.c_str(),
        programName_.c_str());
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
      printf(
          "  %-*s    %s\n",
          int(maxLen),
          p.first.c_str(),
          p.second.shortHelp.c_str());
    }

    if (!aliases_.empty()) {
      printf("\nAvailable aliases:\n");
      for (auto& p : aliases_) {
        printf(
            "  %-*s => %s\n",
            int(maxLen),
            p.first.c_str(),
            resolveAlias(p.second).c_str());
      }
    }
    std::cout << "\n" << programHelpFooter_ << "\n";
  } else {
    // Help for a given command
    auto& p = findCommand(args.front());
    if (p.first != args.front()) {
      printf(
          "`%s' is an alias for `%s'; showing help for `%s'\n",
          args.front().c_str(),
          p.first.c_str(),
          p.first.c_str());
    }
    auto& info = p.second;

    printf(
        "Usage: %s [global_options...] %s%s%s%s\n\n",
        programName_.c_str(),
        p.first.c_str(),
        info.options.options().empty() ? "" : " [command_options...]",
        info.argStr.empty() ? "" : " ",
        info.argStr.c_str());

    printf("%s\n", info.fullHelp.c_str());

    std::cout << globalOptions_;

    if (!info.options.options().empty()) {
      printf("\n");
      std::cout << info.options;
    }
  }
}

void NestedCommandLineApp::displayVersion() const {
  printf("%s %s\n", programName_.c_str(), version_.c_str());
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
        folly::sformat(
            "Command '{}' not found. Run '{} {}' for help.",
            name,
            programName_,
            kHelpCommand));
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
    if (ex.what()[0]) { // if not empty
      fprintf(stderr, "%s\n", ex.what());
    }
    status = ex.status();
  } catch (const po::error& ex) {
    fprintf(
        stderr,
        "%s",
        folly::sformat(
            "{}. Run '{} help' for {}.\n",
            ex.what(),
            programName_,
            kHelpCommand)
            .c_str());
    status = 1;
  }

  if (status == 0) {
    if (ferror(stdout)) {
      fprintf(stderr, "error on standard output\n");
      status = 1;
    } else if (fflush(stdout)) {
      fprintf(
          stderr,
          "standard output flush failed: %s\n",
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

  bool not_clean = false;
  std::vector<std::string> cleanArgs;
  std::vector<std::string> endArgs;

  for (auto& na : args) {
    if (na == "--") {
      not_clean = true;
    } else if (not_clean) {
      endArgs.push_back(na);
    } else {
      cleanArgs.push_back(na);
    }
  }

  auto parsed = parseNestedCommandLine(cleanArgs, globalOptions_);
  po::variables_map vm;
  po::store(parsed.options, vm);
  if (vm.count(kHelpCommand.str())) {
    std::vector<std::string> helpArgs;
    if (parsed.command) {
      helpArgs.push_back(*parsed.command);
    }
    displayHelp(vm, helpArgs);
    return;
  }

  if (vm.count(kVersionCommand.str())) {
    displayVersion();
    return;
  }

  if (!parsed.command) {
    throw ProgramExit(
        1,
        folly::sformat(
            "Command not specified. Run '{} {}' for help.",
            programName_,
            kHelpCommand));
  }

  auto& p = findCommand(*parsed.command);
  auto& cmd = p.first;
  auto& info = p.second;

  auto cmdOptions =
      po::command_line_parser(parsed.rest).options(info.options).run();

  po::store(cmdOptions, vm);
  po::notify(vm);

  auto cmdArgs =
      po::collect_unrecognized(cmdOptions.options, po::include_positional);

  cmdArgs.insert(cmdArgs.end(), endArgs.begin(), endArgs.end());

  if (initFunction_) {
    initFunction_(cmd, vm, cmdArgs);
  }

  info.command(vm, cmdArgs);
}

bool NestedCommandLineApp::isBuiltinCommand(const std::string& name) const {
  return builtinCommands_.count(name);
}

} // namespace folly
