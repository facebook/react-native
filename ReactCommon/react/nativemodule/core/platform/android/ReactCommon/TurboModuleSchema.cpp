/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModuleSchema.h"
#include <glog/logging.h>
#include <cassert>
#include <exception>

namespace facebook {
namespace react {

std::ostream &operator<<(std::ostream &os, const TurboModuleSchema &schema) {
  os << "TurboModuleSchema {" << std::endl;
  os << "  .moduleName = " << schema.moduleName_ << "," << std::endl;
  os << "  .methods = [" << std::endl;

  for (const TurboModuleSchema::Method &method : schema.methods_) {
    os << "    {" << std::endl;
    os << "      .jsReturnType = ";
    if (method.jsReturnType == VoidKind) {
      os << "VoidKind";
    } else if (method.jsReturnType == BooleanKind) {
      os << "BooleanKind";
    } else if (method.jsReturnType == NumberKind) {
      os << "NumberKind";
    } else if (method.jsReturnType == StringKind) {
      os << "StringKind";
    } else if (method.jsReturnType == ObjectKind) {
      os << "ObjectKind";
    } else if (method.jsReturnType == ArrayKind) {
      os << "ArrayKind";
    } else if (method.jsReturnType == FunctionKind) {
      os << "FunctionKind";
    } else if (method.jsReturnType == PromiseKind) {
      os << "PromiseKind";
    }
    os << "," << std::endl;
    os << "      .name = \"" << method.name << "\"," << std::endl;
    os << "      .jniSignature = \"" << method.jniSignature << "\","
       << std::endl;
    os << "      .isOptional = " << (method.isOptional ? "true" : "false")
       << std::endl;
    os << "      .jsParamCount = " << method.jsParamCount << "," << std::endl;
    os << "    }," << std::endl;
  }

  os << "  ]" << std::endl;
  os << "}" << std::endl;
  return os;
}

namespace {
struct UnwrappedTypeAnnotation {
  jsi::Object typeAnnotation;
  bool nullable;
};

UnwrappedTypeAnnotation unwrapTypeAnnotation(
    jsi::Runtime &runtime,
    jsi::Object &&typeAnnotation) {
  std::string type = typeAnnotation.getProperty(runtime, "type")
                         .asString(runtime)
                         .utf8(runtime);
  if (type == "NullableTypeAnnotation") {
    return UnwrappedTypeAnnotation{
        .typeAnnotation = typeAnnotation.getProperty(runtime, "typeAnnotation")
                              .asObject(runtime),
        .nullable = true,
    };
  }

  return UnwrappedTypeAnnotation{
      .typeAnnotation = std::move(typeAnnotation),
      .nullable = false,
  };
}
} // namespace

TurboModuleSchema::ParseException::ParseException(std::string what)
    : jsi::JSIException(what) {}

TurboModuleSchema::TurboModuleSchema(
    const std::string &moduleName,
    std::vector<Method> &&methods)
    : moduleName_(moduleName), methods_(std::move(methods)) {}

bool TurboModuleSchema::hasMethod(const std::string &methodName) const {
  for (const Method &method : methods_) {
    if (method.name == methodName) {
      return true;
    }
  }
  return false;
}

TurboModuleSchema::Method &TurboModuleSchema::getMethod(
    const std::string &methodName) {
  for (Method &method : methods_) {
    if (method.name == methodName) {
      return method;
    }
  }

  throw std::runtime_error(
      std::string("TurboModuleSchema::getMethod: TurboModule method \"") +
      moduleName_ + "." + methodName + "()\" doesn't exist");
}

static TurboModuleMethodValueKind convertFunctionTypeAnnotationReturnToJSType(
    jsi::Runtime &runtime,
    std::string moduleName,
    std::string methodName,
    UnwrappedTypeAnnotation &unwrappedTypeAnnotation) {
  jsi::Object &returnTypeAnnotation = unwrappedTypeAnnotation.typeAnnotation;
  std::string returnType = returnTypeAnnotation.getProperty(runtime, "type")
                               .asString(runtime)
                               .utf8(runtime);
  /**
   * NativeModuleReturnOnlyTypeAnnotation
   */
  if (returnType == "PromiseTypeAnnotation") {
    return PromiseKind;
  }

  if (returnType == "VoidTypeAnnotation") {
    return VoidKind;
  }

  /**
   * NativeModuleBaseTypeAnnotation
   */
  if (returnType == "StringTypeAnnotation") {
    return StringKind;
  }

  if (returnType == "NumberTypeAnnotation" ||
      returnType == "Int32TypeAnnotation" ||
      returnType == "DoubleTypeAnnotation" ||
      returnType == "FloatTypeAnnotation") {
    return NumberKind;
  }

  if (returnType == "BooleanTypeAnnotation") {
    return BooleanKind;
  }

  if (returnType == "GenericObjectTypeAnnotation") {
    return ObjectKind;
  }

  std::string errorHeader =
      "TurboModuleSchema::parse(): Failed to parse JS return type for TurboModule method " +
      moduleName + "." + methodName + "(): ";

  if (returnType == "ReservedTypeAnnotation") {
    std::string reservedFunctionValueTypeName =
        returnTypeAnnotation.getProperty(runtime, "name")
            .asString(runtime)
            .utf8(runtime);

    if (reservedFunctionValueTypeName == "RootTag") {
      return NumberKind;
    }

    throw TurboModuleSchema::ParseException(
        errorHeader + "Detected invalid ReservedTypeAnnotation \"" +
        reservedFunctionValueTypeName + "\"");
  }

  if (returnType == "ArrayTypeAnnotation") {
    return ArrayKind;
  }

  if (returnType == "ObjectTypeAnnotation" ||
      returnType == "TypeAliasTypeAnnotation") {
    return ObjectKind;
  }

  throw TurboModuleSchema::ParseException(
      errorHeader + "Unsupported return type \"" + returnType + "\"");
}

static std::string convertFunctionTypeAnnotationReturnToJNIType(
    jsi::Runtime &runtime,
    std::string moduleName,
    std::string methodName,
    UnwrappedTypeAnnotation &unwrappedTypedAnnotation) {
  jsi::Object &returnTypeAnnotation = unwrappedTypedAnnotation.typeAnnotation;
  std::string returnType = returnTypeAnnotation.getProperty(runtime, "type")
                               .asString(runtime)
                               .utf8(runtime);
  /**
   * NativeModuleReturnOnlyTypeAnnotation
   */
  if (returnType == "PromiseTypeAnnotation" ||
      returnType == "VoidTypeAnnotation") {
    return "V";
  }

  /**
   * NativeModuleBaseTypeAnnotation
   */
  if (returnType == "StringTypeAnnotation") {
    return "Ljava/lang/String;";
  }

  bool isReturnNullable = unwrappedTypedAnnotation.nullable;

  if (returnType == "NumberTypeAnnotation" ||
      returnType == "Int32TypeAnnotation" ||
      returnType == "DoubleTypeAnnotation" ||
      returnType == "FloatTypeAnnotation") {
    if (isReturnNullable) {
      return "Ljava/lang/Double;";
    }

    return "D";
  }

  if (returnType == "BooleanTypeAnnotation") {
    if (isReturnNullable) {
      return "Ljava/lang/Boolean;";
    }

    return "Z";
  }

  if (returnType == "GenericObjectTypeAnnotation") {
    return "Lcom/facebook/react/bridge/WritableMap;";
  }

  std::string errorHeader =
      "TurboModuleSchema::parse(): Failed to parse JNI return type for TurboModule method " +
      moduleName + "." + methodName + "(): ";

  if (returnType == "ReservedTypeAnnotation") {
    std::string reservedFunctionValueTypeName =
        returnTypeAnnotation.getProperty(runtime, "name")
            .asString(runtime)
            .utf8(runtime);

    if (reservedFunctionValueTypeName == "RootTag") {
      if (isReturnNullable) {
        return "Ljava/lang/Double;";
      }
      return "D";
    }

    throw TurboModuleSchema::ParseException(
        errorHeader + "Detected invalid ReservedTypeAnnotation \"" +
        reservedFunctionValueTypeName + "\"");
  }

  if (returnType == "ArrayTypeAnnotation") {
    return "Lcom/facebook/react/bridge/WritableArray;";
  }

  if (returnType == "ObjectTypeAnnotation" ||
      returnType == "TypeAliasTypeAnnotation") {
    return "Lcom/facebook/react/bridge/WritableMap;";
  }

  throw TurboModuleSchema::ParseException(
      errorHeader + "Unsupported return type \"" + returnType + "\"");
}

static std::string convertFunctionTypeAnnotationParamToJNIType(
    jsi::Runtime &runtime,
    std::string moduleName,
    std::string methodName,
    std::string paramName,
    bool isParamOptional,
    UnwrappedTypeAnnotation &unwrappedParamTypeAnnotation) {
  jsi::Object &paramTypeAnnotation =
      unwrappedParamTypeAnnotation.typeAnnotation;

  std::string paramType = paramTypeAnnotation.getProperty(runtime, "type")
                              .asString(runtime)
                              .utf8(runtime);

  /**
   * NativeModuleParamOnlyTypeAnnotation
   */
  if (paramType == "FunctionTypeAnnotation") {
    return "Lcom/facebook/react/bridge/Callback;";
  }

  /**
   * NativeModuleBaseTypeAnnotation
   */
  if (paramType == "StringTypeAnnotation") {
    return "Ljava/lang/String;";
  }

  bool isParamRequired =
      !(unwrappedParamTypeAnnotation.nullable || isParamOptional);

  if (paramType == "NumberTypeAnnotation" ||
      paramType == "Int32TypeAnnotation" ||
      paramType == "DoubleTypeAnnotation" ||
      paramType == "FloatTypeAnnotation") {
    if (!isParamRequired) {
      return "Ljava/lang/Double;";
    }

    return "D";
  }

  if (paramType == "BooleanTypeAnnotation") {
    if (!isParamRequired) {
      return "Ljava/lang/Boolean;";
    }

    return "Z";
  }

  if (paramType == "GenericObjectTypeAnnotation") {
    return "Lcom/facebook/react/bridge/ReadableMap;";
  }

  std::string errorHeader =
      "TurboModuleSchema::parse(): Failed to parse JNI type for param \"" +
      paramName + "\" in TurboModule method " + moduleName + "." + methodName +
      "(): ";

  if (paramType == "ReservedTypeAnnotation") {
    std::string reservedFunctionValueTypeName =
        paramTypeAnnotation.getProperty(runtime, "name")
            .asString(runtime)
            .utf8(runtime);

    if (reservedFunctionValueTypeName == "RootTag") {
      if (!isParamRequired) {
        return "Ljava/lang/Double;";
      }
      return "D";
    }

    throw TurboModuleSchema::ParseException(
        errorHeader + "Detected invalid ReservedTypeAnnotation \"" +
        reservedFunctionValueTypeName + "\"");
  }

  if (paramType == "ArrayTypeAnnotation") {
    return "Lcom/facebook/react/bridge/ReadableArray;";
  }

  if (paramType == "ObjectTypeAnnotation" ||
      paramType == "TypeAliasTypeAnnotation") {
    return "Lcom/facebook/react/bridge/ReadableMap;";
  }

  throw TurboModuleSchema::ParseException(
      errorHeader + "Unsupported param type \"" + paramType + "\"");
}

TurboModuleSchema::Method parseMethod(
    jsi::Runtime &runtime,
    const std::string &moduleName,
    const std::string &methodName,
    bool isMethodOptional,
    UnwrappedTypeAnnotation &unwrappedFunctionTypeAnnotation) {
  jsi::Object &functionTypeAnnotation =
      unwrappedFunctionTypeAnnotation.typeAnnotation;
  bool isMethodRequired =
      !(unwrappedFunctionTypeAnnotation.nullable || isMethodOptional);

  /**
   * Step 1: Take care of getConstants special case.
   */
  if (methodName == "getConstants") {
    return TurboModuleSchema::Method{
        .jsReturnType = ObjectKind,
        .name = methodName,
        .jniSignature = "()Ljava/util/Map;",
        .isOptional = !isMethodRequired,
        .jsParamCount = 0,
        .implStatus = TurboModuleSchema::Method::ImplStatus::Unknown,
    };
  }

  /**
   * Step 2: Get JS and JNI return type
   */
  UnwrappedTypeAnnotation unwrappedReturnTypeAnnotation = unwrapTypeAnnotation(
      runtime,
      functionTypeAnnotation.getProperty(runtime, "returnTypeAnnotation")
          .asObject(runtime));

  TurboModuleMethodValueKind returnType =
      convertFunctionTypeAnnotationReturnToJSType(
          runtime, moduleName, methodName, unwrappedReturnTypeAnnotation);

  std::string jniReturnType = convertFunctionTypeAnnotationReturnToJNIType(
      runtime, moduleName, methodName, unwrappedReturnTypeAnnotation);

  /**
   * Step 3: Get method param types
   */
  jsi::Array functionTypeAnnotationParams =
      functionTypeAnnotation.getProperty(runtime, "params")
          .asObject(runtime)
          .asArray(runtime);

  size_t numFunctionTypeAnnotationParams =
      functionTypeAnnotationParams.size(runtime);

  std::string jniSignatureParams = "";

  for (size_t j = 0; j < numFunctionTypeAnnotationParams; j += 1) {
    jsi::Object functionTypeAnnotationParam =
        functionTypeAnnotationParams.getValueAtIndex(runtime, j)
            .asObject(runtime);

    std::string paramName =
        functionTypeAnnotationParam.getProperty(runtime, "name")
            .asString(runtime)
            .utf8(runtime);

    bool isParamOptional = jsi::Value::strictEquals(
        runtime,
        functionTypeAnnotationParam.getProperty(runtime, "optional"),
        jsi::Value(true));

    UnwrappedTypeAnnotation unwrappedParamTypeAnnotation = unwrapTypeAnnotation(
        runtime,
        functionTypeAnnotationParam.getProperty(runtime, "typeAnnotation")
            .asObject(runtime));

    std::string jniParamType = convertFunctionTypeAnnotationParamToJNIType(
        runtime,
        moduleName,
        methodName,
        paramName,
        isParamOptional,
        unwrappedParamTypeAnnotation);

    jniSignatureParams += jniParamType;
  }

  /**
   * Step 4a: Append Promise param if return type is promise
   */

  if (returnType == PromiseKind) {
    jniSignatureParams += "Lcom/facebook/react/bridge/Promise;";
  }

  /**
   * Step 5: Create jni Signature
   */
  std::string jniSignature = "(" + jniSignatureParams + ")" + jniReturnType;

  /**
   * Create method
   */
  return TurboModuleSchema::Method{
      .jsReturnType = returnType,
      .name = methodName,
      .jniSignature = jniSignature,
      .isOptional = !isMethodRequired,
      .jsParamCount = numFunctionTypeAnnotationParams,
      .implStatus = TurboModuleSchema::Method::ImplStatus::Unknown,
  };
}

TurboModuleSchema TurboModuleSchema::parse(
    jsi::Runtime &runtime,
    const std::string &moduleName,
    const jsi::Value &schema) {
  if (schema.isNull() || schema.isUndefined()) {
    throw std::invalid_argument(
        std::string("TurboModuleSchema::parse(): TurboModule schema was ") +
        (schema.isNull() ? "null" : "undefined ") + " for module \"" +
        moduleName + "\"");
  }

  jsi::Array properties = schema.asObject(runtime)
                              .getProperty(runtime, "spec")
                              .asObject(runtime)
                              .getProperty(runtime, "properties")
                              .asObject(runtime)
                              .asArray(runtime);

  size_t numProperties = properties.size(runtime);
  std::vector<Method> methods;
  methods.reserve(numProperties);

  for (size_t i = 0; i < numProperties; i += 1) {
    jsi::Object property =
        properties.getValueAtIndex(runtime, i).asObject(runtime);

    bool isPropertyOptional = jsi::Value::strictEquals(
        runtime, property.getProperty(runtime, "optional"), jsi::Value(true));

    std::string propertyName =
        property.getProperty(runtime, "name").asString(runtime).utf8(runtime);

    /**
     * Step 0: Ignore non-function property keys
     */
    UnwrappedTypeAnnotation unwrappedPropertyTypeAnnotation =
        unwrapTypeAnnotation(
            runtime,
            property.getProperty(runtime, "typeAnnotation").asObject(runtime));

    if (unwrappedPropertyTypeAnnotation.typeAnnotation
            .getProperty(runtime, "type")
            .asString(runtime)
            .utf8(runtime) != "FunctionTypeAnnotation") {
      continue;
    }

    try {
      methods.push_back(parseMethod(
          runtime,
          moduleName,
          propertyName,
          isPropertyOptional,
          unwrappedPropertyTypeAnnotation));
    } catch (const TurboModuleSchema::ParseException &ex) {
      /**
       * If we fail parsing the method, assume that it doesn't exist.
       */
      LOG(ERROR) << ex.what() << std::endl;
      continue;
    }
  }

  return TurboModuleSchema{moduleName, std::move(methods)};
}

} // namespace react
} // namespace facebook
