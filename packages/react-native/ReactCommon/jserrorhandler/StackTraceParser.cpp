/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StackTraceParser.h"
#include <glog/logging.h>
#include <charconv>
#include <optional>
#include <regex>
#include <sstream>
#include <string>

namespace facebook::react {

const std::string UNKNOWN_FUNCTION = "<unknown>";

// TODO(T198763073): Migrate away from std::regex in this file
// @lint-ignore-every CLANGTIDY facebook-hte-StdRegexIsAwful

/**
 * Stack trace parsing for other jsvms:
 * Port of https://github.com/errwischt/stacktrace-parser
 */
namespace {

std::optional<int> toInt(std::string_view input) {
  int out;
  const std::from_chars_result result =
      std::from_chars(input.data(), input.data() + input.size(), out);
  if (result.ec == std::errc::invalid_argument ||
      result.ec == std::errc::result_out_of_range) {
    return std::nullopt;
  }
  return out;
}

JsErrorHandler::ProcessedError::StackFrame parseStackFrame(
    std::string_view file,
    std::string_view methodName,
    std::string_view lineStr,
    std::string_view columnStr) {
  JsErrorHandler::ProcessedError::StackFrame frame;
  frame.file = file.empty() ? std::nullopt : std::optional(file);
  frame.methodName = !methodName.empty() ? methodName : UNKNOWN_FUNCTION;
  frame.lineNumber = !lineStr.empty() ? toInt(lineStr) : std::nullopt;
  auto columnOpt = !columnStr.empty() ? toInt(columnStr) : std::nullopt;
  frame.column = columnOpt ? std::optional(*columnOpt - 1) : std::nullopt;
  return frame;
}

std::optional<JsErrorHandler::ProcessedError::StackFrame> parseChrome(
    const std::string& line) {
  static const std::regex chromeRe(
      R"(^\s*at (.*?) ?\(((?:file|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|\/|[a-z]:\\|\\\\).*?)(?::(\d+))?(?::(\d+))?\)?\s*$)",
      std::regex::icase);
  static const std::regex chromeEvalRe(R"(\((\S*)(?::(\d+))(?::(\d+))\))");
  std::smatch match;

  if (!std::regex_match(line, match, chromeRe)) {
    return std::nullopt;
  }
  std::string methodName = match[1].str();
  std::string file = match[2].str();
  std::string lineStr = match[3].str();
  std::string columnStr = match[4].str();

  bool isNative = std::regex_search(file, std::regex("^native"));
  bool isEval = std::regex_search(file, std::regex("^eval"));
  std::string evalFile;
  std::string evalLine;
  std::string evalColumn;
  if (isEval && std::regex_search(file, match, chromeEvalRe)) {
    evalFile = match[1].str();
    evalLine = match[2].str();
    evalColumn = match[3].str();
    file = evalFile;
    lineStr = evalLine;
    columnStr = evalColumn;
  }
  std::string actualFile = !isNative ? file : "";
  return parseStackFrame(actualFile, methodName, lineStr, columnStr);
}

std::optional<JsErrorHandler::ProcessedError::StackFrame> parseWinjs(
    const std::string& line) {
  static const std::regex winjsRe(
      R"(^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$)",
      std::regex::icase);
  std::smatch match;
  if (!std::regex_match(line, match, winjsRe)) {
    return std::nullopt;
  }
  std::string methodName = match[1].str();
  std::string file = match[2].str();
  std::string lineStr = match[3].str();
  std::string columnStr = match[4].str();
  return parseStackFrame(file, methodName, lineStr, columnStr);
}

std::optional<JsErrorHandler::ProcessedError::StackFrame> parseGecko(
    const std::string& line) {
  static const std::regex geckoRe(
      R"(^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|resource|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$)",
      std::regex::icase);
  static const std::regex geckoEvalRe(
      R"((\S+) line (\d+)(?: > eval line \d+)* > eval)", std::regex::icase);
  std::smatch match;
  if (!std::regex_match(line, match, geckoRe)) {
    return std::nullopt;
  }
  std::string methodName = match[1].str();
  std::string tmpStr = match[2].str();
  std::string file = match[3].str();
  std::string lineStr = match[4].str();
  std::string columnStr = match[5].str();
  bool isEval = std::regex_search(file, std::regex(" > eval"));
  std::string evalFile;
  std::string evalLine;
  if (isEval && std::regex_search(file, match, geckoEvalRe)) {
    evalFile = match[1].str();
    evalLine = match[2].str();
    file = evalFile;
    lineStr = evalLine;
    columnStr = ""; // No column number in eval
  }
  return parseStackFrame(file, methodName, lineStr, columnStr);
}

std::optional<JsErrorHandler::ProcessedError::StackFrame> parseJSC(
    const std::string& line) {
  static const std::regex javaScriptCoreRe(
      R"(^\s*(?:([^@]*)(?:\((.*?)\))?@)?(\S.*?):(\d+)(?::(\d+))?\s*$)",
      std::regex::icase);
  std::smatch match;
  if (!std::regex_match(line, match, javaScriptCoreRe)) {
    return std::nullopt;
  }
  std::string methodName = match[1].str();
  std::string tmpStr =
      match[2].str(); // This captures any string within parentheses if present
  std::string file = match[3].str();
  std::string lineStr = match[4].str();
  std::string columnStr = match[5].str();
  return parseStackFrame(file, methodName, lineStr, columnStr);
}

std::optional<JsErrorHandler::ProcessedError::StackFrame> parseNode(
    const std::string& line) {
  static const std::regex nodeRe(
      R"(^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$)",
      std::regex::icase);
  std::smatch match;
  if (!std::regex_match(line, match, nodeRe)) {
    return std::nullopt;
  }
  std::string methodName = match[1].str();
  std::string file = match[2].str();
  std::string lineStr = match[3].str();
  std::string columnStr = match[4].str();
  return parseStackFrame(file, methodName, lineStr, columnStr);
}

std::vector<JsErrorHandler::ProcessedError::StackFrame> parseOthers(
    const std::string& stackString) {
  std::vector<JsErrorHandler::ProcessedError::StackFrame> stack;
  std::istringstream iss(stackString);
  std::string line;

  while (std::getline(iss, line)) {
    std::optional<JsErrorHandler::ProcessedError::StackFrame> frame =
        parseChrome(line);

    if (!frame) {
      frame = parseWinjs(line);
    }
    if (!frame) {
      frame = parseGecko(line);
    }
    if (!frame) {
      frame = parseNode(line);
    }
    if (!frame) {
      frame = parseJSC(line);
    }

    if (frame) {
      stack.push_back(*frame);
    }
  }

  return stack;
}

} // namespace

/**
 * Hermes stack trace parsing logic
 */
namespace {
struct HermesStackLocation {
  std::string type;
  std::string sourceUrl;
  int line1Based{};
  int column1Based{};
  int virtualOffset0Based{};
};

struct HermesStackEntry {
  std::string type;
  std::string functionName;
  HermesStackLocation location;
  int count{};
};

bool isInternalBytecodeSourceUrl(const std::string& sourceUrl) {
  return sourceUrl == "InternalBytecode.js";
}

std::vector<JsErrorHandler::ProcessedError::StackFrame> convertHermesStack(
    const std::vector<HermesStackEntry>& stack) {
  std::vector<JsErrorHandler::ProcessedError::StackFrame> frames;
  for (const auto& entry : stack) {
    if (entry.type != "FRAME") {
      continue;
    }
    if (entry.location.type == "NATIVE" ||
        entry.location.type == "INTERNAL_BYTECODE") {
      continue;
    }
    JsErrorHandler::ProcessedError::StackFrame frame;
    frame.methodName = entry.functionName;
    frame.file = entry.location.sourceUrl;
    frame.lineNumber = entry.location.line1Based;
    if (entry.location.type == "SOURCE") {
      frame.column = entry.location.column1Based - 1;
    } else {
      frame.column = entry.location.virtualOffset0Based;
    }
    frames.push_back(frame);
  }
  return frames;
}

HermesStackEntry parseLine(const std::string& line) {
  static const std::regex RE_FRAME(
      R"(^ {4}at (.+?)(?: \((native)\)?| \((address at )?(.*?):(\d+):(\d+)\))$)");
  static const std::regex RE_SKIPPED(R"(^ {4}... skipping (\d+) frames$)");
  HermesStackEntry entry;
  std::smatch match;
  if (std::regex_match(line, match, RE_FRAME)) {
    entry.type = "FRAME";
    entry.functionName = match[1].str();
    std::string type = match[2].str();
    std::string addressAt = match[3].str();
    std::string sourceUrl = match[4].str();
    if (type == "native") {
      entry.location.type = "NATIVE";
    } else {
      int line1Based = std::stoi(match[5].str());
      int columnOrOffset = std::stoi(match[6].str());
      if (addressAt == "address at ") {
        if (isInternalBytecodeSourceUrl(sourceUrl)) {
          entry.location = {
              "INTERNAL_BYTECODE", sourceUrl, line1Based, 0, columnOrOffset};
        } else {
          entry.location = {
              "BYTECODE", sourceUrl, line1Based, 0, columnOrOffset};
        }
      } else {
        entry.location = {"SOURCE", sourceUrl, line1Based, columnOrOffset, 0};
      }
    }
    return entry;
  }
  if (std::regex_match(line, match, RE_SKIPPED)) {
    entry.type = "SKIPPED";
    entry.count = std::stoi(match[1].str());
  }
  return entry;
}

std::vector<JsErrorHandler::ProcessedError::StackFrame> parseHermes(
    const std::string& stack) {
  static const std::regex RE_COMPONENT_NO_STACK(R"(^ {4}at .*?$)");
  std::istringstream stream(stack);
  std::string line;
  std::vector<HermesStackEntry> entries;
  std::smatch match;
  while (std::getline(stream, line)) {
    if (line.empty()) {
      continue;
    }
    HermesStackEntry entry = parseLine(line);
    if (!entry.type.empty()) {
      entries.push_back(entry);
      continue;
    }

    if (std::regex_match(line, match, RE_COMPONENT_NO_STACK)) {
      continue;
    }
    entries.clear();
  }
  return convertHermesStack(entries);
}
} // namespace

std::vector<JsErrorHandler::ProcessedError::StackFrame> StackTraceParser::parse(
    const bool isHermes,
    const std::string& stackString) {
  std::vector<JsErrorHandler::ProcessedError::StackFrame> stackFrames =
      isHermes ? parseHermes(stackString) : parseOthers(stackString);
  return stackFrames;
}

} // namespace facebook::react
