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
#include <folly/experimental/JSONSchema.h>

#include <boost/algorithm/string/replace.hpp>
#include <boost/regex.hpp>

#include <folly/CPortability.h>
#include <folly/Conv.h>
#include <folly/Memory.h>
#include <folly/Optional.h>
#include <folly/Singleton.h>
#include <folly/String.h>
#include <folly/json.h>

namespace folly {
namespace jsonschema {

namespace {

/**
 * We throw this exception when schema validation fails.
 */
struct FOLLY_EXPORT SchemaError : std::runtime_error {
  SchemaError(SchemaError&&) = default;
  SchemaError(const SchemaError&) = default;

  SchemaError(folly::StringPiece expected, const dynamic& value)
      : std::runtime_error(to<std::string>(
            "Expected to get ",
            expected,
            " for value ",
            toJson(value))) {}
  SchemaError(
      folly::StringPiece expected,
      const dynamic& schema,
      const dynamic& value)
      : std::runtime_error(to<std::string>(
            "Expected to get ",
            expected,
            toJson(schema),
            " for value ",
            toJson(value))) {}
};

template <class... Args>
Optional<SchemaError> makeError(Args&&... args) {
  return Optional<SchemaError>(SchemaError(std::forward<Args>(args)...));
}

struct ValidationContext;

struct IValidator {
  virtual ~IValidator() = default;

 private:
  friend struct ValidationContext;

  virtual Optional<SchemaError> validate(
      ValidationContext&,
      const dynamic& value) const = 0;
};

/**
 * This is a 'context' used only when executing the validators to validate some
 * json. It keeps track of which validators have been executed on which json so
 * we can detect infinite recursion.
 */
struct ValidationContext {
  Optional<SchemaError> validate(IValidator* validator, const dynamic& value) {
    auto ret = seen.insert(std::make_pair(validator, &value));
    if (!ret.second) {
      throw std::runtime_error("Infinite recursion detected");
    }
    return validator->validate(*this, value);
  }

 private:
  std::unordered_set<std::pair<const IValidator*, const dynamic*>> seen;
};

/**
 * This is a 'context' used only when building the schema validators from a
 * piece of json. It stores the original schema and the set of refs, so that we
 * can have parts of the schema refer to other parts.
 */
struct SchemaValidatorContext final {
  explicit SchemaValidatorContext(const dynamic& s) : schema(s) {}

  const dynamic& schema;
  std::unordered_map<std::string, IValidator*> refs;
};

/**
 * Root validator for a schema.
 */
struct SchemaValidator final : IValidator, public Validator {
  SchemaValidator() = default;
  void loadSchema(SchemaValidatorContext& context, const dynamic& schema);

  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override;

  // Validator interface
  void validate(const dynamic& value) const override;
  exception_wrapper try_validate(const dynamic& value) const noexcept override;

  static std::unique_ptr<SchemaValidator> make(
      SchemaValidatorContext& context,
      const dynamic& schema) {
    // We break apart the constructor and actually loading the schema so that
    // we can handle the case where a schema refers to itself, e.g. via
    // "$ref": "#".
    auto v = std::make_unique<SchemaValidator>();
    v->loadSchema(context, schema);
    return v;
  }

 private:
  std::vector<std::unique_ptr<IValidator>> validators_;
};

struct MultipleOfValidator final : IValidator {
  explicit MultipleOfValidator(dynamic schema) : schema_(std::move(schema)) {}
  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override {
    if (!schema_.isNumber() || !value.isNumber()) {
      return none;
    }
    if (schema_.isDouble() || value.isDouble()) {
      const auto rem = std::remainder(value.asDouble(), schema_.asDouble());
      if (std::abs(rem) > std::numeric_limits<double>::epsilon()) {
        return makeError("a multiple of ", schema_, value);
      }
    } else { // both ints
      if ((value.getInt() % schema_.getInt()) != 0) {
        return makeError("a multiple of ", schema_, value);
      }
    }
    return none;
  }
  dynamic schema_;
};

struct ComparisonValidator final : IValidator {
  enum class Type { MIN, MAX };
  ComparisonValidator(dynamic schema, const dynamic* exclusive, Type type)
      : schema_(std::move(schema)), exclusive_(false), type_(type) {
    if (exclusive && exclusive->isBool()) {
      exclusive_ = exclusive->getBool();
    }
  }

  template <typename Numeric>
  Optional<SchemaError>
  validateHelper(const dynamic& value, Numeric s, Numeric v) const {
    if (type_ == Type::MIN) {
      if (exclusive_) {
        if (v <= s) {
          return makeError("greater than ", schema_, value);
        }
      } else {
        if (v < s) {
          return makeError("greater than or equal to ", schema_, value);
        }
      }
    } else if (type_ == Type::MAX) {
      if (exclusive_) {
        if (v >= s) {
          return makeError("less than ", schema_, value);
        }
      } else {
        if (v > s) {
          return makeError("less than or equal to ", schema_, value);
        }
      }
    }
    return none;
  }

  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override {
    if (!schema_.isNumber() || !value.isNumber()) {
      return none;
    }
    if (schema_.isDouble() || value.isDouble()) {
      return validateHelper(value, schema_.asDouble(), value.asDouble());
    } else { // both ints
      return validateHelper(value, schema_.asInt(), value.asInt());
    }
  }

  dynamic schema_;
  bool exclusive_;
  Type type_;
};

template <class Comparison>
struct SizeValidator final : IValidator {
  explicit SizeValidator(const dynamic& schema, dynamic::Type type)
      : length_(-1), type_(type) {
    if (schema.isInt()) {
      length_ = schema.getInt();
    }
  }

  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override {
    if (length_ < 0) {
      return none;
    }
    if (value.type() != type_) {
      return none;
    }
    if (!Comparison()(length_, int64_t(value.size()))) {
      return makeError("different length string/array/object", value);
    }
    return none;
  }
  int64_t length_;
  dynamic::Type type_;
};

struct StringPatternValidator final : IValidator {
  explicit StringPatternValidator(const dynamic& schema) {
    if (schema.isString()) {
      regex_ = boost::regex(schema.getString());
    }
  }

  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override {
    if (!value.isString() || regex_.empty()) {
      return none;
    }
    if (!boost::regex_search(value.getString(), regex_)) {
      return makeError("string matching regex", value);
    }
    return none;
  }
  boost::regex regex_;
};

struct ArrayUniqueValidator final : IValidator {
  explicit ArrayUniqueValidator(const dynamic& schema) : unique_(false) {
    if (schema.isBool()) {
      unique_ = schema.getBool();
    }
  }

  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override {
    if (!unique_ || !value.isArray()) {
      return none;
    }
    for (const auto& i : value) {
      for (const auto& j : value) {
        if (&i != &j && i == j) {
          return makeError("unique items in array", value);
        }
      }
    }
    return none;
  }
  bool unique_;
};

struct ArrayItemsValidator final : IValidator {
  ArrayItemsValidator(
      SchemaValidatorContext& context,
      const dynamic* items,
      const dynamic* additionalItems)
      : allowAdditionalItems_(true) {
    if (items && items->isObject()) {
      itemsValidator_ = SchemaValidator::make(context, *items);
      return; // Additional items is ignored
    } else if (items && items->isArray()) {
      for (const auto& item : *items) {
        itemsValidators_.emplace_back(SchemaValidator::make(context, item));
      }
    } else {
      // If items isn't present or is invalid, it defaults to an empty schema.
      itemsValidator_ = SchemaValidator::make(context, dynamic::object);
    }
    if (additionalItems) {
      if (additionalItems->isBool()) {
        allowAdditionalItems_ = additionalItems->getBool();
      } else if (additionalItems->isObject()) {
        additionalItemsValidator_ =
            SchemaValidator::make(context, *additionalItems);
      }
    }
  }

  Optional<SchemaError> validate(ValidationContext& vc, const dynamic& value)
      const override {
    if (!value.isArray()) {
      return none;
    }
    if (itemsValidator_) {
      for (const auto& v : value) {
        if (auto se = vc.validate(itemsValidator_.get(), v)) {
          return se;
        }
      }
      return none;
    }
    size_t pos = 0;
    for (; pos < value.size() && pos < itemsValidators_.size(); ++pos) {
      if (auto se = vc.validate(itemsValidators_[pos].get(), value[pos])) {
        return se;
      }
    }
    if (!allowAdditionalItems_ && pos < value.size()) {
      return makeError("no more additional items", value);
    }
    if (additionalItemsValidator_) {
      for (; pos < value.size(); ++pos) {
        if (auto se =
                vc.validate(additionalItemsValidator_.get(), value[pos])) {
          return se;
        }
      }
    }
    return none;
  }
  std::unique_ptr<IValidator> itemsValidator_;
  std::vector<std::unique_ptr<IValidator>> itemsValidators_;
  std::unique_ptr<IValidator> additionalItemsValidator_;
  bool allowAdditionalItems_;
};

struct RequiredValidator final : IValidator {
  explicit RequiredValidator(const dynamic& schema) {
    if (schema.isArray()) {
      for (const auto& item : schema) {
        if (item.isString()) {
          properties_.emplace_back(item.getString());
        }
      }
    }
  }

  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override {
    if (value.isObject()) {
      for (const auto& prop : properties_) {
        if (!value.get_ptr(prop)) {
          return makeError("property ", prop, value);
        }
      }
    }
    return none;
  }

 private:
  std::vector<std::string> properties_;
};

struct PropertiesValidator final : IValidator {
  PropertiesValidator(
      SchemaValidatorContext& context,
      const dynamic* properties,
      const dynamic* patternProperties,
      const dynamic* additionalProperties)
      : allowAdditionalProperties_(true) {
    if (properties && properties->isObject()) {
      for (const auto& pair : properties->items()) {
        if (pair.first.isString()) {
          propertyValidators_[pair.first.getString()] =
              SchemaValidator::make(context, pair.second);
        }
      }
    }
    if (patternProperties && patternProperties->isObject()) {
      for (const auto& pair : patternProperties->items()) {
        if (pair.first.isString()) {
          patternPropertyValidators_.emplace_back(
              boost::regex(pair.first.getString()),
              SchemaValidator::make(context, pair.second));
        }
      }
    }
    if (additionalProperties) {
      if (additionalProperties->isBool()) {
        allowAdditionalProperties_ = additionalProperties->getBool();
      } else if (additionalProperties->isObject()) {
        additionalPropertyValidator_ =
            SchemaValidator::make(context, *additionalProperties);
      }
    }
  }

  Optional<SchemaError> validate(ValidationContext& vc, const dynamic& value)
      const override {
    if (!value.isObject()) {
      return none;
    }
    for (const auto& pair : value.items()) {
      if (!pair.first.isString()) {
        continue;
      }
      const std::string& key = pair.first.getString();
      auto it = propertyValidators_.find(key);
      bool matched = false;
      if (it != propertyValidators_.end()) {
        if (auto se = vc.validate(it->second.get(), pair.second)) {
          return se;
        }
        matched = true;
      }

      const std::string& strkey = key;
      for (const auto& ppv : patternPropertyValidators_) {
        if (boost::regex_search(strkey, ppv.first)) {
          if (auto se = vc.validate(ppv.second.get(), pair.second)) {
            return se;
          }
          matched = true;
        }
      }
      if (matched) {
        continue;
      }
      if (!allowAdditionalProperties_) {
        return makeError("no more additional properties", value);
      }
      if (additionalPropertyValidator_) {
        if (auto se =
                vc.validate(additionalPropertyValidator_.get(), pair.second)) {
          return se;
        }
      }
    }
    return none;
  }

  std::unordered_map<std::string, std::unique_ptr<IValidator>>
      propertyValidators_;
  std::vector<std::pair<boost::regex, std::unique_ptr<IValidator>>>
      patternPropertyValidators_;
  std::unique_ptr<IValidator> additionalPropertyValidator_;
  bool allowAdditionalProperties_;
};

struct DependencyValidator final : IValidator {
  DependencyValidator(SchemaValidatorContext& context, const dynamic& schema) {
    if (!schema.isObject()) {
      return;
    }
    for (const auto& pair : schema.items()) {
      if (!pair.first.isString()) {
        continue;
      }
      if (pair.second.isArray()) {
        auto p = make_pair(pair.first.getString(), std::vector<std::string>());
        for (const auto& item : pair.second) {
          if (item.isString()) {
            p.second.push_back(item.getString());
          }
        }
        propertyDep_.emplace_back(std::move(p));
      }
      if (pair.second.isObject()) {
        schemaDep_.emplace_back(
            pair.first.getString(),
            SchemaValidator::make(context, pair.second));
      }
    }
  }

  Optional<SchemaError> validate(ValidationContext& vc, const dynamic& value)
      const override {
    if (!value.isObject()) {
      return none;
    }
    for (const auto& pair : propertyDep_) {
      if (value.count(pair.first)) {
        for (const auto& prop : pair.second) {
          if (!value.count(prop)) {
            return makeError("property ", prop, value);
          }
        }
      }
    }
    for (const auto& pair : schemaDep_) {
      if (value.count(pair.first)) {
        if (auto se = vc.validate(pair.second.get(), value)) {
          return se;
        }
      }
    }
    return none;
  }

  std::vector<std::pair<std::string, std::vector<std::string>>> propertyDep_;
  std::vector<std::pair<std::string, std::unique_ptr<IValidator>>> schemaDep_;
};

struct EnumValidator final : IValidator {
  explicit EnumValidator(dynamic schema) : schema_(std::move(schema)) {}

  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override {
    if (!schema_.isArray()) {
      return none;
    }
    for (const auto& item : schema_) {
      if (value == item) {
        return none;
      }
    }
    return makeError("one of enum values: ", schema_, value);
  }
  dynamic schema_;
};

struct TypeValidator final : IValidator {
  explicit TypeValidator(const dynamic& schema) {
    if (schema.isString()) {
      addType(schema.stringPiece());
    } else if (schema.isArray()) {
      for (const auto& item : schema) {
        if (item.isString()) {
          addType(item.stringPiece());
        }
      }
    }
  }

  Optional<SchemaError> validate(ValidationContext&, const dynamic& value)
      const override {
    auto it =
        std::find(allowedTypes_.begin(), allowedTypes_.end(), value.type());
    if (it == allowedTypes_.end()) {
      return makeError("a value of type ", typeStr_, value);
    }
    return none;
  }

 private:
  std::vector<dynamic::Type> allowedTypes_;
  std::string typeStr_; // for errors

  void addType(StringPiece value) {
    if (value == "array") {
      allowedTypes_.push_back(dynamic::Type::ARRAY);
    } else if (value == "boolean") {
      allowedTypes_.push_back(dynamic::Type::BOOL);
    } else if (value == "integer") {
      allowedTypes_.push_back(dynamic::Type::INT64);
    } else if (value == "number") {
      allowedTypes_.push_back(dynamic::Type::INT64);
      allowedTypes_.push_back(dynamic::Type::DOUBLE);
    } else if (value == "null") {
      allowedTypes_.push_back(dynamic::Type::NULLT);
    } else if (value == "object") {
      allowedTypes_.push_back(dynamic::Type::OBJECT);
    } else if (value == "string") {
      allowedTypes_.push_back(dynamic::Type::STRING);
    } else {
      return;
    }
    if (!typeStr_.empty()) {
      typeStr_ += ", ";
    }
    typeStr_ += value.str();
  }
};

struct AllOfValidator final : IValidator {
  AllOfValidator(SchemaValidatorContext& context, const dynamic& schema) {
    if (schema.isArray()) {
      for (const auto& item : schema) {
        validators_.emplace_back(SchemaValidator::make(context, item));
      }
    }
  }

  Optional<SchemaError> validate(ValidationContext& vc, const dynamic& value)
      const override {
    for (const auto& val : validators_) {
      if (auto se = vc.validate(val.get(), value)) {
        return se;
      }
    }
    return none;
  }

  std::vector<std::unique_ptr<IValidator>> validators_;
};

struct AnyOfValidator final : IValidator {
  enum class Type { EXACTLY_ONE, ONE_OR_MORE };

  AnyOfValidator(
      SchemaValidatorContext& context,
      const dynamic& schema,
      Type type)
      : type_(type) {
    if (schema.isArray()) {
      for (const auto& item : schema) {
        validators_.emplace_back(SchemaValidator::make(context, item));
      }
    }
  }

  Optional<SchemaError> validate(ValidationContext& vc, const dynamic& value)
      const override {
    std::vector<SchemaError> errors;
    for (const auto& val : validators_) {
      if (auto se = vc.validate(val.get(), value)) {
        errors.emplace_back(*se);
      }
    }
    const auto success = validators_.size() - errors.size();
    if (success == 0) {
      return makeError("at least one valid schema", value);
    } else if (success > 1 && type_ == Type::EXACTLY_ONE) {
      return makeError("exactly one valid schema", value);
    }
    return none;
  }

  Type type_;
  std::vector<std::unique_ptr<IValidator>> validators_;
};

struct RefValidator final : IValidator {
  explicit RefValidator(IValidator* validator) : validator_(validator) {}

  Optional<SchemaError> validate(ValidationContext& vc, const dynamic& value)
      const override {
    return vc.validate(validator_, value);
  }
  IValidator* validator_;
};

struct NotValidator final : IValidator {
  NotValidator(SchemaValidatorContext& context, const dynamic& schema)
      : validator_(SchemaValidator::make(context, schema)) {}

  Optional<SchemaError> validate(ValidationContext& vc, const dynamic& value)
      const override {
    if (vc.validate(validator_.get(), value)) {
      return none;
    }
    return makeError("Expected schema validation to fail", value);
  }
  std::unique_ptr<IValidator> validator_;
};

void SchemaValidator::loadSchema(
    SchemaValidatorContext& context,
    const dynamic& schema) {
  if (!schema.isObject() || schema.empty()) {
    return;
  }

  // Check for $ref, if we have one we won't apply anything else. Refs are
  // pointers to other parts of the json, e.g. #/foo/bar points to the schema
  // located at root["foo"]["bar"].
  if (const auto* p = schema.get_ptr("$ref")) {
    // We only support absolute refs, i.e. those starting with '#'
    if (p->isString() && p->stringPiece()[0] == '#') {
      auto it = context.refs.find(p->getString());
      if (it != context.refs.end()) {
        validators_.emplace_back(std::make_unique<RefValidator>(it->second));
        return;
      }

      // This is a ref, but we haven't loaded it yet. Find where it is based on
      // the root schema.
      std::vector<std::string> parts;
      split("/", p->stringPiece(), parts);
      const auto* s = &context.schema; // First part is '#'
      for (size_t i = 1; s && i < parts.size(); ++i) {
        // Per the standard, we must replace ~1 with / and then ~0 with ~
        boost::replace_all(parts[i], "~1", "/");
        boost::replace_all(parts[i], "~0", "~");
        if (s->isObject()) {
          s = s->get_ptr(parts[i]);
          continue;
        }
        if (s->isArray()) {
          try {
            const size_t pos = to<size_t>(parts[i]);
            if (pos < s->size()) {
              s = s->get_ptr(pos);
              continue;
            }
          } catch (const std::range_error&) {
            // ignore
          }
        }
        break;
      }
      // If you have a self-recursive reference, this avoids getting into an
      // infinite recursion, where we try to load a schema that just references
      // itself, and then we try to load it again, and so on.
      // Instead we load a pointer to the schema into the refs, so that any
      // future references to it will just see that pointer and won't try to
      // keep parsing further.
      if (s) {
        auto v = std::make_unique<SchemaValidator>();
        context.refs[p->getString()] = v.get();
        v->loadSchema(context, *s);
        validators_.emplace_back(std::move(v));
        return;
      }
    }
  }

  // Numeric validators
  if (const auto* p = schema.get_ptr("multipleOf")) {
    validators_.emplace_back(std::make_unique<MultipleOfValidator>(*p));
  }
  if (const auto* p = schema.get_ptr("maximum")) {
    validators_.emplace_back(std::make_unique<ComparisonValidator>(
        *p,
        schema.get_ptr("exclusiveMaximum"),
        ComparisonValidator::Type::MAX));
  }
  if (const auto* p = schema.get_ptr("minimum")) {
    validators_.emplace_back(std::make_unique<ComparisonValidator>(
        *p,
        schema.get_ptr("exclusiveMinimum"),
        ComparisonValidator::Type::MIN));
  }

  // String validators
  if (const auto* p = schema.get_ptr("maxLength")) {
    validators_.emplace_back(
        std::make_unique<SizeValidator<std::greater_equal<int64_t>>>(
            *p, dynamic::Type::STRING));
  }
  if (const auto* p = schema.get_ptr("minLength")) {
    validators_.emplace_back(
        std::make_unique<SizeValidator<std::less_equal<int64_t>>>(
            *p, dynamic::Type::STRING));
  }
  if (const auto* p = schema.get_ptr("pattern")) {
    validators_.emplace_back(std::make_unique<StringPatternValidator>(*p));
  }

  // Array validators
  const auto* items = schema.get_ptr("items");
  const auto* additionalItems = schema.get_ptr("additionalItems");
  if (items || additionalItems) {
    validators_.emplace_back(
        std::make_unique<ArrayItemsValidator>(context, items, additionalItems));
  }
  if (const auto* p = schema.get_ptr("maxItems")) {
    validators_.emplace_back(
        std::make_unique<SizeValidator<std::greater_equal<int64_t>>>(
            *p, dynamic::Type::ARRAY));
  }
  if (const auto* p = schema.get_ptr("minItems")) {
    validators_.emplace_back(
        std::make_unique<SizeValidator<std::less_equal<int64_t>>>(
            *p, dynamic::Type::ARRAY));
  }
  if (const auto* p = schema.get_ptr("uniqueItems")) {
    validators_.emplace_back(std::make_unique<ArrayUniqueValidator>(*p));
  }

  // Object validators
  const auto* properties = schema.get_ptr("properties");
  const auto* patternProperties = schema.get_ptr("patternProperties");
  const auto* additionalProperties = schema.get_ptr("additionalProperties");
  if (properties || patternProperties || additionalProperties) {
    validators_.emplace_back(std::make_unique<PropertiesValidator>(
        context, properties, patternProperties, additionalProperties));
  }
  if (const auto* p = schema.get_ptr("maxProperties")) {
    validators_.emplace_back(
        std::make_unique<SizeValidator<std::greater_equal<int64_t>>>(
            *p, dynamic::Type::OBJECT));
  }
  if (const auto* p = schema.get_ptr("minProperties")) {
    validators_.emplace_back(
        std::make_unique<SizeValidator<std::less_equal<int64_t>>>(
            *p, dynamic::Type::OBJECT));
  }
  if (const auto* p = schema.get_ptr("required")) {
    validators_.emplace_back(std::make_unique<RequiredValidator>(*p));
  }

  // Misc validators
  if (const auto* p = schema.get_ptr("dependencies")) {
    validators_.emplace_back(
        std::make_unique<DependencyValidator>(context, *p));
  }
  if (const auto* p = schema.get_ptr("enum")) {
    validators_.emplace_back(std::make_unique<EnumValidator>(*p));
  }
  if (const auto* p = schema.get_ptr("type")) {
    validators_.emplace_back(std::make_unique<TypeValidator>(*p));
  }
  if (const auto* p = schema.get_ptr("allOf")) {
    validators_.emplace_back(std::make_unique<AllOfValidator>(context, *p));
  }
  if (const auto* p = schema.get_ptr("anyOf")) {
    validators_.emplace_back(std::make_unique<AnyOfValidator>(
        context, *p, AnyOfValidator::Type::ONE_OR_MORE));
  }
  if (const auto* p = schema.get_ptr("oneOf")) {
    validators_.emplace_back(std::make_unique<AnyOfValidator>(
        context, *p, AnyOfValidator::Type::EXACTLY_ONE));
  }
  if (const auto* p = schema.get_ptr("not")) {
    validators_.emplace_back(std::make_unique<NotValidator>(context, *p));
  }
}

void SchemaValidator::validate(const dynamic& value) const {
  ValidationContext vc;
  if (auto se = validate(vc, value)) {
    throw *se;
  }
}

exception_wrapper SchemaValidator::try_validate(const dynamic& value) const
    noexcept {
  try {
    ValidationContext vc;
    if (auto se = validate(vc, value)) {
      return make_exception_wrapper<SchemaError>(*se);
    }
  } catch (const std::exception& e) {
    return exception_wrapper(std::current_exception(), e);
  } catch (...) {
    return exception_wrapper(std::current_exception());
  }
  return exception_wrapper();
}

Optional<SchemaError> SchemaValidator::validate(
    ValidationContext& vc,
    const dynamic& value) const {
  for (const auto& validator : validators_) {
    if (auto se = vc.validate(validator.get(), value)) {
      return se;
    }
  }
  return none;
}

/**
 * Metaschema, i.e. schema for schema.
 * Inlined from the $schema url
 */
const char* metaschemaJson =
    "\
{ \
    \"id\": \"http://json-schema.org/draft-04/schema#\", \
    \"$schema\": \"http://json-schema.org/draft-04/schema#\", \
    \"description\": \"Core schema meta-schema\", \
    \"definitions\": { \
        \"schemaArray\": { \
            \"type\": \"array\", \
            \"minItems\": 1, \
            \"items\": { \"$ref\": \"#\" } \
        }, \
        \"positiveInteger\": { \
            \"type\": \"integer\", \
            \"minimum\": 0 \
        }, \
        \"positiveIntegerDefault0\": { \
            \"allOf\": [ \
          { \"$ref\": \"#/definitions/positiveInteger\" }, { \"default\": 0 } ]\
        }, \
        \"simpleTypes\": { \
            \"enum\": [ \"array\", \"boolean\", \"integer\", \
                        \"null\", \"number\", \"object\", \"string\" ] \
        }, \
        \"stringArray\": { \
            \"type\": \"array\", \
            \"items\": { \"type\": \"string\" }, \
            \"minItems\": 1, \
            \"uniqueItems\": true \
        } \
    }, \
    \"type\": \"object\", \
    \"properties\": { \
        \"id\": { \
            \"type\": \"string\", \
            \"format\": \"uri\" \
        }, \
        \"$schema\": { \
            \"type\": \"string\", \
            \"format\": \"uri\" \
        }, \
        \"title\": { \
            \"type\": \"string\" \
        }, \
        \"description\": { \
            \"type\": \"string\" \
        }, \
        \"default\": {}, \
        \"multipleOf\": { \
            \"type\": \"number\", \
            \"minimum\": 0, \
            \"exclusiveMinimum\": true \
        }, \
        \"maximum\": { \
            \"type\": \"number\" \
        }, \
        \"exclusiveMaximum\": { \
            \"type\": \"boolean\", \
            \"default\": false \
        }, \
        \"minimum\": { \
            \"type\": \"number\" \
        }, \
        \"exclusiveMinimum\": { \
            \"type\": \"boolean\", \
            \"default\": false \
        }, \
        \"maxLength\": { \"$ref\": \"#/definitions/positiveInteger\" }, \
        \"minLength\": { \"$ref\": \"#/definitions/positiveIntegerDefault0\" },\
        \"pattern\": { \
            \"type\": \"string\", \
            \"format\": \"regex\" \
        }, \
        \"additionalItems\": { \
            \"anyOf\": [ \
                { \"type\": \"boolean\" }, \
                { \"$ref\": \"#\" } \
            ], \
            \"default\": {} \
        }, \
        \"items\": { \
            \"anyOf\": [ \
                { \"$ref\": \"#\" }, \
                { \"$ref\": \"#/definitions/schemaArray\" } \
            ], \
            \"default\": {} \
        }, \
        \"maxItems\": { \"$ref\": \"#/definitions/positiveInteger\" }, \
        \"minItems\": { \"$ref\": \"#/definitions/positiveIntegerDefault0\" }, \
        \"uniqueItems\": { \
            \"type\": \"boolean\", \
            \"default\": false \
        }, \
        \"maxProperties\": { \"$ref\": \"#/definitions/positiveInteger\" }, \
        \"minProperties\": { \
        \"$ref\": \"#/definitions/positiveIntegerDefault0\" }, \
        \"required\": { \"$ref\": \"#/definitions/stringArray\" }, \
        \"additionalProperties\": { \
            \"anyOf\": [ \
                { \"type\": \"boolean\" }, \
                { \"$ref\": \"#\" } \
            ], \
            \"default\": {} \
        }, \
        \"definitions\": { \
            \"type\": \"object\", \
            \"additionalProperties\": { \"$ref\": \"#\" }, \
            \"default\": {} \
        }, \
        \"properties\": { \
            \"type\": \"object\", \
            \"additionalProperties\": { \"$ref\": \"#\" }, \
            \"default\": {} \
        }, \
        \"patternProperties\": { \
            \"type\": \"object\", \
            \"additionalProperties\": { \"$ref\": \"#\" }, \
            \"default\": {} \
        }, \
        \"dependencies\": { \
            \"type\": \"object\", \
            \"additionalProperties\": { \
                \"anyOf\": [ \
                    { \"$ref\": \"#\" }, \
                    { \"$ref\": \"#/definitions/stringArray\" } \
                ] \
            } \
        }, \
        \"enum\": { \
            \"type\": \"array\", \
            \"minItems\": 1, \
            \"uniqueItems\": true \
        }, \
        \"type\": { \
            \"anyOf\": [ \
                { \"$ref\": \"#/definitions/simpleTypes\" }, \
                { \
                    \"type\": \"array\", \
                    \"items\": { \"$ref\": \"#/definitions/simpleTypes\" }, \
                    \"minItems\": 1, \
                    \"uniqueItems\": true \
                } \
            ] \
        }, \
        \"allOf\": { \"$ref\": \"#/definitions/schemaArray\" }, \
        \"anyOf\": { \"$ref\": \"#/definitions/schemaArray\" }, \
        \"oneOf\": { \"$ref\": \"#/definitions/schemaArray\" }, \
        \"not\": { \"$ref\": \"#\" } \
    }, \
    \"dependencies\": { \
        \"exclusiveMaximum\": [ \"maximum\" ], \
        \"exclusiveMinimum\": [ \"minimum\" ] \
    }, \
    \"default\": {} \
}";

folly::Singleton<Validator> schemaValidator([]() {
  return makeValidator(parseJson(metaschemaJson)).release();
});
} // namespace

Validator::~Validator() = default;

std::unique_ptr<Validator> makeValidator(const dynamic& schema) {
  auto v = std::make_unique<SchemaValidator>();
  SchemaValidatorContext context(schema);
  context.refs["#"] = v.get();
  v->loadSchema(context, schema);
  return std::move(v);
}

std::shared_ptr<Validator> makeSchemaValidator() {
  return schemaValidator.try_get();
}
} // namespace jsonschema
} // namespace folly
