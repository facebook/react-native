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

#include <folly/experimental/ProgramOptions.h>

#include <unordered_map>
#include <unordered_set>

#include <boost/version.hpp>
#include <glog/logging.h>

#include <folly/Conv.h>
#include <folly/Portability.h>
#include <folly/portability/GFlags.h>

namespace po = ::boost::program_options;

namespace folly {

namespace {

// Information about one GFlag. Handled via shared_ptr, as, in the case
// of boolean flags, two boost::program_options options (--foo and --nofoo)
// may share the same GFlag underneath.
//
// We're slightly abusing the boost::program_options interface; the first
// time we (successfully) parse a value that matches this GFlag, we'll set
// it and remember not to set it again; this prevents, for example, the
// default value of --foo from overwriting the GFlag if --nofoo is set.
template <class T>
class GFlagInfo {
 public:
  explicit GFlagInfo(gflags::CommandLineFlagInfo info)
      : info_(std::move(info)), isSet_(false) {}

  void set(const T& value) {
    if (isSet_) {
      return;
    }

    auto strValue = folly::to<std::string>(value);
    auto msg =
        gflags::SetCommandLineOption(info_.name.c_str(), strValue.c_str());
    if (msg.empty()) {
      throw po::invalid_option_value(strValue);
    }
    isSet_ = true;
  }

  T get() const {
    std::string str;
    CHECK(gflags::GetCommandLineOption(info_.name.c_str(), &str));
    return folly::to<T>(str);
  }

  const gflags::CommandLineFlagInfo& info() const {
    return info_;
  }

 private:
  gflags::CommandLineFlagInfo info_;
  bool isSet_;
};

template <class T>
class GFlagValueSemanticBase : public po::value_semantic {
 public:
  explicit GFlagValueSemanticBase(std::shared_ptr<GFlagInfo<T>> info)
      : info_(std::move(info)) {}

  std::string name() const override {
    return "arg";
  }
#if BOOST_VERSION >= 105900 && BOOST_VERSION <= 106400
  bool adjacent_tokens_only() const override {
    return false;
  }
#endif
  bool is_composing() const override {
    return false;
  }
  bool is_required() const override {
    return false;
  }
  // We handle setting the GFlags from parse(), so notify() does nothing.
  void notify(const boost::any& /* valueStore */) const override {}
  bool apply_default(boost::any& valueStore) const override {
    // We're using the *current* rather than *default* value here, and
    // this is intentional; GFlags-using programs assign to FLAGS_foo
    // before ParseCommandLineFlags() in order to change the default value,
    // and we obey that.
    auto val = info_->get();
    this->transform(val);
    valueStore = val;
    return true;
  }

  void parse(
      boost::any& valueStore,
      const std::vector<std::string>& tokens,
      bool /* utf8 */) const override;

 private:
  virtual T parseValue(const std::vector<std::string>& tokens) const = 0;
  virtual void transform(T& /* val */) const {}

  mutable std::shared_ptr<GFlagInfo<T>> info_;
};

template <class T>
void GFlagValueSemanticBase<T>::parse(
    boost::any& valueStore,
    const std::vector<std::string>& tokens,
    bool /* utf8 */) const {
  T val;
  try {
    val = this->parseValue(tokens);
    this->transform(val);
  } catch (const std::exception&) {
    throw po::invalid_option_value(
        tokens.empty() ? std::string() : tokens.front());
  }
  this->info_->set(val);
  valueStore = val;
}

template <class T>
class GFlagValueSemantic : public GFlagValueSemanticBase<T> {
 public:
  explicit GFlagValueSemantic(std::shared_ptr<GFlagInfo<T>> info)
      : GFlagValueSemanticBase<T>(std::move(info)) {}

  unsigned min_tokens() const override {
    return 1;
  }
  unsigned max_tokens() const override {
    return 1;
  }

  T parseValue(const std::vector<std::string>& tokens) const override {
    DCHECK(tokens.size() == 1);
    return folly::to<T>(tokens.front());
  }
};

class BoolGFlagValueSemantic : public GFlagValueSemanticBase<bool> {
 public:
  explicit BoolGFlagValueSemantic(std::shared_ptr<GFlagInfo<bool>> info)
      : GFlagValueSemanticBase<bool>(std::move(info)) {}

  unsigned min_tokens() const override {
    return 0;
  }
  unsigned max_tokens() const override {
    return 0;
  }

  bool parseValue(const std::vector<std::string>& tokens) const override {
    DCHECK(tokens.empty());
    return true;
  }
};

class NegativeBoolGFlagValueSemantic : public BoolGFlagValueSemantic {
 public:
  explicit NegativeBoolGFlagValueSemantic(std::shared_ptr<GFlagInfo<bool>> info)
      : BoolGFlagValueSemantic(std::move(info)) {}

 private:
  void transform(bool& val) const override {
    val = !val;
  }
};

const std::string& getName(const std::string& name) {
  static const std::unordered_map<std::string, std::string> gFlagOverrides{
      // Allow -v in addition to --v
      {"v", "v,v"},
  };
  auto pos = gFlagOverrides.find(name);
  return pos != gFlagOverrides.end() ? pos->second : name;
}

template <class T>
void addGFlag(
    gflags::CommandLineFlagInfo&& flag,
    po::options_description& desc,
    ProgramOptionsStyle style) {
  auto gflagInfo = std::make_shared<GFlagInfo<T>>(std::move(flag));
  auto& info = gflagInfo->info();
  auto name = getName(info.name);

  switch (style) {
    case ProgramOptionsStyle::GFLAGS:
      break;
    case ProgramOptionsStyle::GNU:
      std::replace(name.begin(), name.end(), '_', '-');
      break;
  }
  desc.add_options()(
      name.c_str(),
      new GFlagValueSemantic<T>(gflagInfo),
      info.description.c_str());
}

template <>
void addGFlag<bool>(
    gflags::CommandLineFlagInfo&& flag,
    po::options_description& desc,
    ProgramOptionsStyle style) {
  auto gflagInfo = std::make_shared<GFlagInfo<bool>>(std::move(flag));
  auto& info = gflagInfo->info();
  auto name = getName(info.name);
  std::string negationPrefix;

  switch (style) {
    case ProgramOptionsStyle::GFLAGS:
      negationPrefix = "no";
      break;
    case ProgramOptionsStyle::GNU:
      std::replace(name.begin(), name.end(), '_', '-');
      negationPrefix = "no-";
      break;
  }

  // clang-format off
  desc.add_options()
    (name.c_str(),
     new BoolGFlagValueSemantic(gflagInfo),
     info.description.c_str())
    ((negationPrefix + name).c_str(),
     new NegativeBoolGFlagValueSemantic(gflagInfo),
     folly::to<std::string>("(no) ", info.description).c_str());
  // clang-format on
}

typedef void (*FlagAdder)(
    gflags::CommandLineFlagInfo&&,
    po::options_description&,
    ProgramOptionsStyle);

const std::unordered_map<std::string, FlagAdder> gFlagAdders = {
#define X(NAME, TYPE) \
  { NAME, addGFlag<TYPE> }
    X("bool", bool),
    X("int32", int32_t),
    X("int64", int64_t),
    X("uint32", uint32_t),
    X("uint64", uint64_t),
    X("double", double),
    X("string", std::string),
#undef X
};

} // namespace

po::options_description getGFlags(ProgramOptionsStyle style) {
  static const std::unordered_set<std::string> gSkipFlags{
      "flagfile",
      "fromenv",
      "tryfromenv",
      "undefok",
      "help",
      "helpfull",
      "helpshort",
      "helpon",
      "helpmatch",
      "helppackage",
      "helpxml",
      "version",
      "tab_completion_columns",
      "tab_completion_word",
  };

  po::options_description desc("GFlags");

  std::vector<gflags::CommandLineFlagInfo> allFlags;
  gflags::GetAllFlags(&allFlags);

  for (auto& f : allFlags) {
    if (gSkipFlags.count(f.name)) {
      continue;
    }
    auto pos = gFlagAdders.find(f.type);
    CHECK(pos != gFlagAdders.end()) << "Invalid flag type: " << f.type;
    (*pos->second)(std::move(f), desc, style);
  }

  return desc;
}

namespace {

NestedCommandLineParseResult doParseNestedCommandLine(
    po::command_line_parser&& parser,
    const po::options_description& desc) {
  NestedCommandLineParseResult result;

  result.options = parser.options(desc).allow_unregistered().run();

  bool setCommand = true;
  for (auto& opt : result.options.options) {
    auto& tokens = opt.original_tokens;
    auto tokensStart = tokens.begin();

    if (setCommand && opt.position_key != -1) {
      DCHECK(tokensStart != tokens.end());
      result.command = *(tokensStart++);
    }

    if (opt.position_key != -1 || opt.unregistered) {
      // If we see an unrecognized option before the first positional
      // argument, assume we don't have a valid command name, because
      // we don't know how to parse it otherwise.
      //
      // program --wtf foo bar
      //
      // Is "foo" an argument to "--wtf", or the command name?
      setCommand = false;
      result.rest.insert(result.rest.end(), tokensStart, tokens.end());
    }
  }

  return result;
}

} // namespace

NestedCommandLineParseResult parseNestedCommandLine(
    int argc,
    const char* const argv[],
    const po::options_description& desc) {
  return doParseNestedCommandLine(po::command_line_parser(argc, argv), desc);
}

NestedCommandLineParseResult parseNestedCommandLine(
    const std::vector<std::string>& cmdline,
    const po::options_description& desc) {
  return doParseNestedCommandLine(po::command_line_parser(cmdline), desc);
}

} // namespace folly
