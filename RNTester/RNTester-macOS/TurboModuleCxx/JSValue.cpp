// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#include "pch.h"
#include "JSValue.h"
#include <cctype>
#include <iomanip>
#include <set>
#include <sstream>
#include <string_view>

#undef min
#undef max

namespace winrt::Microsoft::ReactNative {

//===========================================================================
// JSValue type conversion helpers.
//===========================================================================

namespace {

struct JSConverter {
  static constexpr char const *NullString = "null";
  static constexpr char const *ObjectString = "[object Object]";
  static constexpr char const *WhiteSpace = " \n\r\t\f\v";
  static const std::set<std::string> StringToBoolean;

  static std::string LowerString(std::string const &value) noexcept {
    std::string result{value};
    std::transform(
        result.begin(), result.end(), result.begin(), [](char ch) { return static_cast<char>(std::tolower(ch)); });
    return result;
  }

  static std::string_view TrimString(std::string_view value) noexcept {
    size_t start = value.find_first_not_of(WhiteSpace);
    if (start == std::string::npos) {
      return "";
    }

    size_t end = value.find_last_not_of(WhiteSpace);
    return {value.data() + start, end - start + 1};
  }

  static char const *ToCString(bool value) noexcept {
    return value ? "true" : "false";
  }

  static char const *NaNToCString(double value) noexcept {
    if (std::isnan(value)) {
      return "NaN";
    } else if (value == std::numeric_limits<double>::infinity()) {
      return "Infinity";
    } else if (value == -std::numeric_limits<double>::infinity()) {
      return "-Infinity";
    } else {
      return nullptr;
    }
  }

  static std::string ToJSString(double value) noexcept {
    if (std::isfinite(value)) {
      std::stringstream ss;
      ss << value;
      return ss.str();
    } else {
      return NaNToCString(value);
    }
  }

  static std::ostream &WriteJSString(std::ostream &stream, double value) noexcept {
    if (std::isfinite(value)) {
      return stream << value;
    } else {
      return stream << NaNToCString(value);
    }
  }

  static bool ToBoolean(std::string const &value) noexcept {
    auto key = LowerString(value);
    auto it = StringToBoolean.find(key);
    return it != StringToBoolean.end();
  }

  static double ToJSNumber(std::string_view value) noexcept {
    auto trimmed = TrimString(value);
    if (trimmed.empty()) {
      return 0;
    }

    char *end;
    double result = strtod(trimmed.data(), &end);
    return (end == trimmed.data() + trimmed.size()) ? result : std::numeric_limits<double>::quiet_NaN();
  }

  static int64_t ToInt64(double value) noexcept {
    return (std::numeric_limits<int64_t>::min() <= value && value <= std::numeric_limits<int64_t>::max())
        ? static_cast<int64_t>(value)
        : 0;
  }
};

/*static*/ const std::set<std::string> JSConverter::StringToBoolean{"true", "1", "yes", "y", "on"};

struct JSValueLogWriter {
  static constexpr char const *IndentString = "  ";

  JSValueLogWriter(std::ostream &stream) noexcept : m_stream{stream} {}

  static std::string ToString(JSValue const &value) noexcept {
    std::stringstream stream;
    JSValueLogWriter writer{stream};
    writer.WriteValue(value);
    return stream.str();
  }

  JSValueLogWriter &WriteIndent() noexcept {
    for (size_t i = 0; i < m_indent; ++i) {
      m_stream << IndentString;
    }

    return *this;
  }

  JSValueLogWriter &WriteLine() noexcept {
    m_stream << '\n';
    return WriteIndent();
  }

  JSValueLogWriter &Write(std::string_view value) noexcept {
    m_stream << value;
    return *this;
  }

  JSValueLogWriter &WriteQuotedString(std::string_view value) noexcept {
    auto writeChar = [](std::ostream & stream, char ch) noexcept->std::ostream & {
      switch (ch) {
        case '"':
          return stream << "\\\"";
        case '\\':
          return stream << "\\\\";
        case '\b':
          return stream << "\\b";
        case '\f':
          return stream << "\\f";
        case '\n':
          return stream << "\\n";
        case '\r':
          return stream << "\\r";
        case '\t':
          return stream << "\\t";
        default:
          if ('\x00' <= ch && ch <= '\x1f') { // Non-printable ASCII characters.
            return stream << "\\u" << std::hex << std::setw(4) << std::setfill('0') << (int)ch;
          } else {
            return stream << ch;
          }
      }
    };

    m_stream << '"';
    for (auto ch : value) {
      writeChar(m_stream, ch);
    }

    m_stream << '"';
    return *this;
  }

  JSValueLogWriter &WriteSeparator(bool &start) noexcept {
    if (start) {
      start = false;
    } else {
      m_stream << ",";
    }
    return *this;
  }

  JSValueLogWriter &WriteObject(JSValueObject const &value) noexcept {
    if (value.empty()) {
      return Write("{}");
    }

    Write("{");
    ++m_indent;
    bool start = true;
    for (auto const &prop : value) {
      WriteSeparator(start).WriteLine();
      Write(prop.first).Write(": ").WriteValue(prop.second);
    }

    --m_indent;
    return WriteLine().Write("}");
  }

  JSValueLogWriter &WriteArray(JSValueArray const &value) noexcept {
    if (value.empty()) {
      return Write("[]");
    }

    Write("[");
    ++m_indent;
    bool start = true;
    for (auto const &item : value) {
      WriteSeparator(start).WriteLine();
      WriteValue(item);
    }

    --m_indent;
    return WriteLine().Write("]");
  }

  JSValueLogWriter &WriteValue(JSValue const &value) noexcept {
    if (value.IsNull()) {
      return Write(JSConverter::NullString);
    } else if (auto objectPtr = value.TryGetObject()) {
      return WriteObject(*objectPtr);
    } else if (auto arrayPtr = value.TryGetArray()) {
      return WriteArray(*arrayPtr);
    } else if (auto stringPtr = value.TryGetString()) {
      return WriteQuotedString(*stringPtr);
    } else if (auto boolPtr = value.TryGetBoolean()) {
      return Write(JSConverter::ToCString(*boolPtr));
    } else if (auto int64Ptr = value.TryGetInt64()) {
      return (m_stream << *int64Ptr, *this);
    } else if (auto doublePtr = value.TryGetDouble()) {
      return (JSConverter::WriteJSString(m_stream, *doublePtr), *this);
    } else {
      VerifyElseCrashSz(false, "Unexpected JSValue type");
    }
  }

 private:
  size_t m_indent{0};
  std::ostream &m_stream;
};

} // namespace

//===========================================================================
// JSValueObject implementation
//===========================================================================

JSValueObject::JSValueObject(std::initializer_list<JSValueObjectKeyValue> initObject) noexcept {
  for (auto const &item : initObject) {
    this->try_emplace(std::string(item.Key), std::move(*const_cast<JSValue *>(&item.Value)));
  }
}

JSValueObject::JSValueObject(std::map<std::string, JSValue, std::less<>> &&other) noexcept : map{std::move(other)} {}

JSValueObject JSValueObject::Copy() const noexcept {
  JSValueObject object;
  for (auto const &property : *this) {
    object.try_emplace(property.first, property.second.Copy());
  }

  return object;
}

JSValue &JSValueObject::operator[](std::string_view propertyName) noexcept {
  // When we search for a node we do no want to convert string_view to a string.
  auto it = lower_bound(propertyName);
  if (it != end() && !key_comp()(propertyName, it->first)) {
    return it->second;
  } else {
    return emplace_hint(it, propertyName, nullptr)->second;
  }
}

JSValue const &JSValueObject::operator[](std::string_view propertyName) const noexcept {
  auto it = find(propertyName);
  if (it != end()) {
    return it->second;
  }

  return JSValue::Null;
}

bool JSValueObject::Equals(JSValueObject const &other) const noexcept {
  if (size() != other.size()) {
    return false;
  }

  // std::map keeps key-values in an ordered sequence.
  // Make sure that pairs are matching at the same position.
  auto otherIt = other.begin();
  for (auto const &property : *this) {
    auto it = otherIt++;
    if (property.first != it->first || !property.second.Equals(it->second)) {
      return false;
    }
  }

  return true;
}

bool JSValueObject::JSEquals(JSValueObject const &other) const noexcept {
  if (size() != other.size()) {
    return false;
  }

  // std::map keeps key-values in an ordered sequence.
  // Make sure that pairs are matching at the same position.
  auto otherIt = other.begin();
  for (auto const &property : *this) {
    auto it = otherIt++;
    if (property.first != it->first || !property.second.JSEquals(it->second)) {
      return false;
    }
  }

  return true;
}

/*static*/ JSValueObject JSValueObject::ReadFrom(IJSValueReader const &reader) noexcept {
  JSValueObject object;
  if (reader.ValueType() == JSValueType::Object) {
    hstring propertyName;
    while (reader.GetNextObjectProperty(/*ref*/ propertyName)) {
      object.try_emplace(to_string(propertyName), JSValue::ReadFrom(reader));
    }
  }

  return object;
}

void JSValueObject::WriteTo(IJSValueWriter const &writer) const noexcept {
  writer.WriteObjectBegin();
  for (auto const &property : *this) {
    writer.WritePropertyName(to_hstring(property.first));
    property.second.WriteTo(writer);
  }

  writer.WriteObjectEnd();
}

//===========================================================================
// JSValueArray implementation
//===========================================================================

JSValueArray::JSValueArray(size_type size) noexcept {
  reserve(size);
  for (size_type i = 0; i < size; ++i) {
    emplace_back(nullptr);
  }
}

JSValueArray::JSValueArray(size_type size, JSValue const &defaultValue) noexcept {
  reserve(size);
  for (size_type i = 0; i < size; ++i) {
    push_back(defaultValue.Copy());
  }
}

JSValueArray::JSValueArray(std::initializer_list<JSValueArrayItem> initArray) noexcept {
  for (auto const &item : initArray) {
    this->push_back(std::move(*const_cast<JSValue *>(&item.Item)));
  }
}

JSValueArray::JSValueArray(std::vector<JSValue> &&other) noexcept : vector{std::move(other)} {}

JSValueArray JSValueArray::Copy() const noexcept {
  JSValueArray array;
  array.reserve(size());
  for (auto const &item : *this) {
    array.push_back(item.Copy());
  }

  return array;
}

bool JSValueArray::Equals(JSValueArray const &other) const noexcept {
  if (size() != other.size()) {
    return false;
  }

  auto otherIt = other.begin();
  for (auto const &item : *this) {
    if (!item.Equals(*otherIt++)) {
      return false;
    }
  }

  return true;
}

bool JSValueArray::JSEquals(JSValueArray const &other) const noexcept {
  if (size() != other.size()) {
    return false;
  }

  auto otherIt = other.begin();
  for (auto const &item : *this) {
    if (!item.JSEquals(*otherIt++)) {
      return false;
    }
  }

  return true;
}

/*static*/ JSValueArray JSValueArray::ReadFrom(IJSValueReader const &reader) noexcept {
  JSValueArray array;
  if (reader.ValueType() == JSValueType::Array) {
    while (reader.GetNextArrayItem()) {
      array.push_back(JSValue::ReadFrom(reader));
    }
  }

  return array;
}

void JSValueArray::WriteTo(IJSValueWriter const &writer) const noexcept {
  writer.WriteArrayBegin();
  for (const JSValue &item : *this) {
    item.WriteTo(writer);
  }

  writer.WriteArrayEnd();
}

//===========================================================================
// JSValue implementation
//===========================================================================

/*static*/ JSValue const JSValue::Null;
/*static*/ JSValue const JSValue::EmptyObject{JSValueObject{}};
/*static*/ JSValue const JSValue::EmptyArray{JSValueArray{}};
/*static*/ JSValue const JSValue::EmptyString{std::string{}};

#pragma warning(push)
#pragma warning(disable : 26495) // False positive for union member not initialized
JSValue::JSValue(JSValue &&other) noexcept : m_type{other.m_type} {
  switch (m_type) {
    case JSValueType::Object:
      new (&m_object) JSValueObject(std::move(other.m_object));
      break;
    case JSValueType::Array:
      new (&m_array) JSValueArray(std::move(other.m_array));
      break;
    case JSValueType::String:
      new (&m_string) std::string(std::move(other.m_string));
      break;
    case JSValueType::Boolean:
      m_bool = other.m_bool;
      break;
    case JSValueType::Int64:
      m_int64 = other.m_int64;
      break;
    case JSValueType::Double:
      m_double = other.m_double;
      break;
  }

  other.m_type = JSValueType::Null;
  other.m_int64 = 0;
}
#pragma warning(pop)

JSValue::~JSValue() noexcept {
  switch (m_type) {
    case JSValueType::Object:
      m_object.~JSValueObject();
      break;
    case JSValueType::Array:
      m_array.~JSValueArray();
      break;
    case JSValueType::String:
      m_string.~basic_string();
      break;
    case JSValueType::Boolean:
    case JSValueType::Int64:
    case JSValueType::Double:
    case JSValueType::Null:
      break;
  }

  m_type = JSValueType::Null;
  m_int64 = 0;
}

JSValue &JSValue::operator=(JSValue &&other) noexcept {
  if (this != &other) {
    this->~JSValue();
    new (this) JSValue(std::move(other));
  }

  return *this;
}

JSValue JSValue::Copy() const noexcept {
  switch (m_type) {
    case JSValueType::Object:
      return JSValue{m_object.Copy()};
    case JSValueType::Array:
      return JSValue{m_array.Copy()};
    case JSValueType::String:
      return JSValue{std::string(m_string)};
    case JSValueType::Boolean:
      return JSValue{m_bool};
    case JSValueType::Int64:
      return JSValue{m_int64};
    case JSValueType::Double:
      return JSValue{m_double};
    default:
      return JSValue{};
  }
}

JSValueObject JSValue::MoveObject() noexcept {
  JSValueObject result;
  if (m_type == JSValueType::Object) {
    result = std::move(m_object);
    m_type = JSValueType::Null;
    m_int64 = 0;
  }

  return result;
}

JSValueArray JSValue::MoveArray() noexcept {
  JSValueArray result;
  if (m_type == JSValueType::Array) {
    result = std::move(m_array);
    m_type = JSValueType::Null;
    m_int64 = 0;
  }

  return result;
}

std::string JSValue::AsString() const noexcept {
  switch (m_type) {
    case JSValueType::Null:
      return JSConverter::NullString;
    case JSValueType::String:
      return m_string;
    case JSValueType::Boolean:
      return JSConverter::ToCString(m_bool);
    case JSValueType::Int64:
      return std::to_string(m_int64);
    case JSValueType::Double:
      return JSConverter::ToJSString(m_double);
    default:
      return "";
  }
}

bool JSValue::AsBoolean() const noexcept {
  switch (m_type) {
    case JSValueType::Object:
      return !m_object.empty();
    case JSValueType::Array:
      return !m_array.empty();
    case JSValueType::String:
      return JSConverter::ToBoolean(m_string);
    case JSValueType::Boolean:
      return m_bool;
    case JSValueType::Int64:
      return m_int64 != 0;
    case JSValueType::Double:
      return !std::isnan(m_double) && m_double != 0;
    default:
      return false;
  }
}

int64_t JSValue::AsInt64() const noexcept {
  switch (m_type) {
    case JSValueType::String:
      return JSConverter::ToInt64(JSConverter::ToJSNumber(m_string));
    case JSValueType::Boolean:
      return m_bool ? 1 : 0;
    case JSValueType::Int64:
      return m_int64;
    case JSValueType::Double:
      return JSConverter::ToInt64(m_double);
    default:
      return 0;
  }
}

double JSValue::AsDouble() const noexcept {
  switch (m_type) {
    case JSValueType::String:
      return JSConverter::ToJSNumber(m_string);
    case JSValueType::Boolean:
      return m_bool ? 1 : 0;
    case JSValueType::Int64:
      return static_cast<double>(m_int64);
    case JSValueType::Double:
      return m_double;
    default:
      return 0;
  }
}

std::string JSValue::AsJSString() const noexcept {
  struct JSStringWriter {
    static std::ostream &Write(std::ostream &os, JSValue const &node) noexcept {
      switch (node.m_type) {
        case JSValueType::Null:
          return os << JSConverter::NullString;
        case JSValueType::Object:
          return os << JSConverter::ObjectString;
        case JSValueType::Array: {
          bool start = true;
          for (auto const &item : node.m_array) {
            if (start) {
              start = false;
            } else {
              os << ",";
            }

            JSStringWriter::Write(os, item);
          }

          return os;
        }
        case JSValueType::String:
          return os << node.m_string;
        case JSValueType::Boolean:
          return os << JSConverter::ToCString(node.m_bool);
        case JSValueType::Int64:
          return os << node.m_int64;
        case JSValueType::Double:
          return JSConverter::WriteJSString(os, node.m_double);
        default:
          return os;
      }
    }
  };

  switch (m_type) {
    case JSValueType::Null:
      return JSConverter::NullString;
    case JSValueType::Object:
      return JSConverter::ObjectString;
    case JSValueType::Array: {
      std::stringstream stream;
      JSStringWriter::Write(stream, *this);
      return stream.str();
    }
    case JSValueType::String:
      return m_string;
    case JSValueType::Boolean:
      return JSConverter::ToCString(m_bool);
    case JSValueType::Int64:
      return std::to_string(m_int64);
    case JSValueType::Double:
      return JSConverter::ToJSString(m_double);
    default:
      return "";
  }
}

bool JSValue::AsJSBoolean() const noexcept {
  switch (m_type) {
    case JSValueType::Object:
    case JSValueType::Array:
      return true;
    case JSValueType::String:
      return !m_string.empty();
    case JSValueType::Boolean:
      return m_bool;
    case JSValueType::Int64:
      return m_int64 != 0;
    case JSValueType::Double:
      return !std::isnan(m_double) && m_double != 0;
    default:
      return false;
  }
}

double JSValue::AsJSNumber() const noexcept {
  switch (m_type) {
    case JSValueType::Object:
      return std::numeric_limits<double>::quiet_NaN();
    case JSValueType::Array:
      switch (m_array.size()) {
        case 0:
          return 0;
        case 1:
          return JSConverter::ToJSNumber(m_array[0].AsJSString());
        default:
          return std::numeric_limits<double>::quiet_NaN();
      }
    case JSValueType::String:
      return JSConverter::ToJSNumber(m_string);
    case JSValueType::Boolean:
      return m_bool ? 1 : 0;
    case JSValueType::Int64:
      return static_cast<double>(m_int64);
    case JSValueType::Double:
      return m_double;
    default:
      return 0;
  }
}

std::string JSValue::ToString() const noexcept {
  switch (m_type) {
    case JSValueType::Null:
      return JSConverter::NullString;
    case JSValueType::Object:
    case JSValueType::Array:
    case JSValueType::String:
      return JSValueLogWriter::ToString(*this);
    case JSValueType::Boolean:
      return JSConverter::ToJSString(m_bool);
    case JSValueType::Int64:
      return std::to_string(m_int64);
    case JSValueType::Double:
      return JSConverter::ToJSString(m_double);
    default:
      VerifyElseCrashSz(false, "Unexpected JSValue type");
  }
}

size_t JSValue::PropertyCount() const noexcept {
  return (m_type == JSValueType::Object) ? m_object.size() : 0;
}

JSValue const *JSValue::TryGetObjectProperty(std::string_view propertyName) const noexcept {
  if (m_type == JSValueType::Object) {
    auto it = m_object.find(propertyName);
    if (it != m_object.end()) {
      return &it->second;
    }
  }

  return nullptr;
}

JSValue const &JSValue::GetObjectProperty(std::string_view propertyName) const noexcept {
  auto result = TryGetObjectProperty(propertyName);
  return result ? *result : Null;
}

size_t JSValue::ItemCount() const noexcept {
  return (m_type == JSValueType::Array) ? m_array.size() : 0;
}

JSValue const *JSValue::TryGetArrayItem(JSValueArray::size_type index) const noexcept {
  return (m_type == JSValueType::Array && index < m_array.size()) ? &m_array[index] : nullptr;
}

JSValue const &JSValue::GetArrayItem(JSValueArray::size_type index) const noexcept {
  auto result = TryGetArrayItem(index);
  return result ? *result : Null;
}

bool JSValue::Equals(JSValue const &other) const noexcept {
  if (m_type != other.m_type) {
    return false;
  }

  switch (m_type) {
    case JSValueType::Null:
      return true;
    case JSValueType::Object:
      return m_object.Equals(other.m_object);
    case JSValueType::Array:
      return m_array.Equals(other.m_array);
    case JSValueType::String:
      return m_string == other.m_string;
    case JSValueType::Boolean:
      return m_bool == other.m_bool;
    case JSValueType::Int64:
      return m_int64 == other.m_int64;
    case JSValueType::Double:
      return m_double == other.m_double;
    default:
      return false;
  }
}

bool JSValue::JSEquals(JSValue const &other) const noexcept {
  if (m_type == other.m_type) {
    switch (m_type) {
      case JSValueType::Object:
        return m_object.JSEquals(other.m_object);
      case JSValueType::Array:
        return m_array.JSEquals(other.m_array);
      default:
        return Equals(other);
    }
  } else if (m_type == JSValueType::Null || other.m_type == JSValueType::Null) {
    return false;
  }

  // If one of the types Boolean, Int64, or Double, then compare as Numbers,
  // otherwise compare as strings.
  JSValueType const greatestType = m_type > other.m_type ? m_type : other.m_type;
  if (greatestType >= JSValueType::Boolean) {
    return AsJSNumber() == other.AsJSNumber();
  } else {
    return AsJSString() == other.AsJSString();
  }
}

/*static*/ JSValue JSValue::ReadFrom(IJSValueReader const &reader) noexcept {
  switch (reader.ValueType()) {
    case JSValueType::Null:
      return JSValue();
    case JSValueType::Object:
      return JSValue(JSValueObject::ReadFrom(reader));
    case JSValueType::Array:
      return JSValue(JSValueArray::ReadFrom(reader));
    case JSValueType::String:
      return JSValue(to_string(reader.GetString()));
    case JSValueType::Boolean:
      return JSValue(reader.GetBoolean());
    case JSValueType::Int64:
      return JSValue(reader.GetInt64());
    case JSValueType::Double:
      return JSValue(reader.GetDouble());
    default:
      VerifyElseCrashSz(false, "Unexpected JSValue type");
  }
}

void JSValue::WriteTo(IJSValueWriter const &writer) const noexcept {
  switch (m_type) {
    case JSValueType::Null:
      return writer.WriteNull();
    case JSValueType::Object:
      return m_object.WriteTo(writer);
    case JSValueType::Array:
      return m_array.WriteTo(writer);
    case JSValueType::String:
      return writer.WriteString(to_hstring(m_string));
    case JSValueType::Boolean:
      return writer.WriteBoolean(m_bool);
    case JSValueType::Int64:
      return writer.WriteInt64(m_int64);
    case JSValueType::Double:
      return writer.WriteDouble(m_double);
    default:
      VerifyElseCrashSz(false, "Unexpected JSValue type");
  }
}

} // namespace winrt::Microsoft::ReactNative
