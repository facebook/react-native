/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator;

import com.facebook.react.codegen.generator.model.AliasType;
import com.facebook.react.codegen.generator.model.AnyType;
import com.facebook.react.codegen.generator.model.ArrayType;
import com.facebook.react.codegen.generator.model.BooleanType;
import com.facebook.react.codegen.generator.model.CodegenException;
import com.facebook.react.codegen.generator.model.DoubleType;
import com.facebook.react.codegen.generator.model.FloatType;
import com.facebook.react.codegen.generator.model.FunctionType;
import com.facebook.react.codegen.generator.model.GenericObjectType;
import com.facebook.react.codegen.generator.model.Int32Type;
import com.facebook.react.codegen.generator.model.NativeModuleType;
import com.facebook.react.codegen.generator.model.NullableType;
import com.facebook.react.codegen.generator.model.NumberType;
import com.facebook.react.codegen.generator.model.ObjectType;
import com.facebook.react.codegen.generator.model.PromiseType;
import com.facebook.react.codegen.generator.model.ReservedFunctionValueType;
import com.facebook.react.codegen.generator.model.StringType;
import com.facebook.react.codegen.generator.model.Type;
import com.facebook.react.codegen.generator.model.TypeData;
import com.facebook.react.codegen.generator.model.TypeId;
import com.facebook.react.codegen.generator.model.VoidType;
import com.google.common.base.CaseFormat;
import com.google.common.collect.ImmutableList;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

public final class SchemaJsonParser {
  private final TypeData mTypeData = new TypeData();

  public static TypeData parse(final File schemaFile)
      throws CodegenException, FileNotFoundException, IOException {
    final SchemaJsonParser parser = new SchemaJsonParser();
    return parser.buildTypeData(schemaFile);
  }

  private TypeData buildTypeData(final File schemaFile)
      throws CodegenException, FileNotFoundException, IOException {
    final JsonParser parser = new JsonParser();
    final JsonElement rootElement = parser.parse(new FileReader(schemaFile));

    final Map<String, Map<String, NativeModuleType>> collection = new HashMap<>();

    if (rootElement.isJsonObject()) {
      final JsonObject root = rootElement.getAsJsonObject();
      final JsonObject modules = root.getAsJsonObject("modules");
      modules
          .entrySet()
          .forEach(
              entry -> {
                final String jsModuleName = entry.getKey();
                final JsonObject jsModule = entry.getValue().getAsJsonObject();
                final String jsModuleType = jsModule.get("type").getAsString();

                if (!"NativeModule".equals(jsModuleType)) {
                  return;
                }

                if (jsModule.has("excludedPlatforms")) {
                  final JsonArray excludedPlatforms = jsModule.getAsJsonArray("excludedPlatforms");
                  for (JsonElement p : excludedPlatforms) {
                    if (p.getAsString().equals("android")) {
                      // This module is not for Android.
                      return;
                    }
                  }
                }

                final Type parsedType =
                    parseNativeModule(
                        // TODO (T71955395): NativeModule spec type name does not
                        // exist in the schema. For now assume it's "Spec".
                        // The final type name will be the output class name.
                        TypeId.of(jsModuleName, jsModuleName + "Spec"), jsModule);
                mTypeData.addType(parsedType);
              });
    }

    return mTypeData;
  }

  // Parse type information from a JSON "typeAnnotation" node.
  private Type parseTypeAnnotation(final TypeId typeId, final JsonObject originalTypeAnnotation) {
    JsonObject typeAnnotation = originalTypeAnnotation;
    String type = typeAnnotation.get("type").getAsString();
    boolean nullable = false;
    Type parsedType = null;

    if (type.equals(NullableType.TYPE_NAME)) {
      nullable = true;
      typeAnnotation = typeAnnotation.get("typeAnnotation").getAsJsonObject();
      type = typeAnnotation.get("type").getAsString();
    }

    switch (type) {
      case AliasType.TYPE_NAME:
        parsedType = parseAliasTypeAnnotation(typeId, typeAnnotation);
        break;
      case AnyType.TYPE_NAME:
        parsedType = new AnyType(typeId);
        break;
      case ArrayType.TYPE_NAME:
        parsedType = parseArrayTypeAnnotation(typeId, typeAnnotation);
        break;
      case BooleanType.TYPE_NAME:
        parsedType = new BooleanType(typeId);
        break;
      case DoubleType.TYPE_NAME:
        parsedType = new DoubleType(typeId);
        break;
      case FloatType.TYPE_NAME:
        parsedType = new FloatType(typeId);
        break;
      case FunctionType.TYPE_NAME:
        parsedType = parseFunctionTypeAnnotation(typeId, typeAnnotation);
        break;
      case GenericObjectType.TYPE_NAME:
        parsedType = new GenericObjectType(typeId);
        break;
      case Int32Type.TYPE_NAME:
        parsedType = new Int32Type(typeId);
        break;
      case NumberType.TYPE_NAME:
        // Use double type for generic numbers.
        parsedType = new DoubleType(typeId);
        break;
      case ObjectType.TYPE_NAME:
        parsedType = parseObjectTypeAnnotation(typeId, typeAnnotation);
        break;
      case PromiseType.TYPE_NAME:
        parsedType = new PromiseType(typeId);
        break;
      case ReservedFunctionValueType.TYPE_NAME:
        parsedType = parseReservedFunctionValueTypeAnnotation(typeId, typeAnnotation);
        break;
      case StringType.TYPE_NAME:
        parsedType = new StringType(typeId);
        break;
      case VoidType.TYPE_NAME:
        return VoidType.VOID;
      default:
        throw new CodegenException("Found invalid type annotation: " + type);
    }

    final Type finalType = maybeCreateNullableType(nullable, parsedType);
    mTypeData.addType(finalType);
    return finalType;
  }

  private NativeModuleType parseNativeModule(final TypeId typeId, final JsonObject json) {
    final JsonObject aliases = json.getAsJsonObject("aliases");
    final JsonArray properties = json.getAsJsonObject("spec").getAsJsonArray("properties");

    final ImmutableList<Type> collectedAliases =
        ImmutableList.copyOf(
            aliases.entrySet().stream()
                .map(
                    entry -> {
                      final String typeName = entry.getKey();
                      final JsonObject typeAnnotation = entry.getValue().getAsJsonObject();
                      // The alias name is the type name that other types can refer to.
                      return parseTypeAnnotation(
                          TypeId.of(typeId.moduleName, typeName), typeAnnotation);
                    })
                .collect(Collectors.toList()));

    ImmutableList.Builder<NativeModuleType.Property> collectedPropertiesBuilder =
        new ImmutableList.Builder<>();
    properties.forEach(
        p -> {
          final JsonObject node = p.getAsJsonObject();
          final String name = node.get("name").getAsString();
          final JsonObject typeAnnotation = node.getAsJsonObject("typeAnnotation");
          final boolean optional = node.get("optional").getAsBoolean();
          final TypeId propertyTypeId =
              TypeId.expandOf(typeId, CaseFormat.LOWER_CAMEL.to(CaseFormat.UPPER_CAMEL, name));
          collectedPropertiesBuilder.add(
              new NativeModuleType.Property(
                  name, parseTypeAnnotation(propertyTypeId, typeAnnotation), optional));
        });

    return new NativeModuleType(typeId, collectedAliases, collectedPropertiesBuilder.build());
  }

  private Type parseAliasTypeAnnotation(final TypeId typeId, final JsonObject typeAnnotation) {
    // For now, assume the alias lives inside the same file.
    return new AliasType(
        typeId, TypeId.of(typeId.moduleName, typeAnnotation.get("name").getAsString()));
  }

  private Type parseArrayTypeAnnotation(final TypeId typeId, final JsonObject typeAnnotation) {
    final JsonObject elementTypeAnnotation = typeAnnotation.getAsJsonObject("elementType");
    final TypeId elementTypeId = TypeId.expandOf(typeId, "ElementType");
    // TODO (T71847026): Some array types are missing elementType annotation.
    final Type elementType =
        elementTypeAnnotation != null
            ? parseTypeAnnotation(elementTypeId, elementTypeAnnotation)
            : new AnyType(elementTypeId);
    return new ArrayType(typeId, elementType);
  }

  private Type parseFunctionTypeAnnotation(final TypeId typeId, final JsonObject typeAnnotation) {
    final JsonArray params = typeAnnotation.getAsJsonArray("params");

    ImmutableList.Builder<FunctionType.ArgumentType> paramsList = new ImmutableList.Builder<>();

    for (int i = 0; i < params.size(); i++) {
      final JsonElement p = params.get(i);
      final JsonObject node = p.getAsJsonObject();
      final String name = node.get("name").getAsString();
      paramsList.add(
          FunctionType.createArgument(
              name,
              parseTypeAnnotation(
                  TypeId.expandOf(typeId, CaseFormat.LOWER_CAMEL.to(CaseFormat.UPPER_CAMEL, name)),
                  node.getAsJsonObject("typeAnnotation"))));
    }

    final JsonObject returnTypeAnnotation = typeAnnotation.getAsJsonObject("returnTypeAnnotation");
    final Type returnType =
        parseTypeAnnotation(TypeId.expandOf(typeId, "ReturnType"), returnTypeAnnotation);

    return new FunctionType(typeId, paramsList.build(), returnType);
  }

  private Type parseObjectTypeAnnotation(final TypeId typeId, final JsonObject typeAnnotation) {
    final JsonArray properties = typeAnnotation.getAsJsonArray("properties");

    ImmutableList.Builder<ObjectType.Property> propertiesList = new ImmutableList.Builder<>();
    properties.forEach(
        p -> {
          final JsonObject node = p.getAsJsonObject();
          final String name = node.get("name").getAsString();
          final boolean optional = node.get("optional").getAsBoolean();
          final JsonObject propertyTypeAnnotation = node.getAsJsonObject("typeAnnotation");
          final TypeId propertyTypeId =
              TypeId.expandOf(typeId, CaseFormat.LOWER_CAMEL.to(CaseFormat.UPPER_CAMEL, name));
          final Type propertyType = parseTypeAnnotation(propertyTypeId, propertyTypeAnnotation);
          propertiesList.add(new ObjectType.Property(name, propertyType, optional));
        });

    return new ObjectType(typeId, propertiesList.build());
  }

  private Type parseReservedFunctionValueTypeAnnotation(
      final TypeId typeId, final JsonObject typeAnnotation) {
    return new ReservedFunctionValueType(
        typeId,
        ReservedFunctionValueType.ReservedName.valueOf(typeAnnotation.get("name").getAsString()));
  }

  private Type maybeCreateNullableType(final boolean nullable, final Type original) {
    if (!nullable || original instanceof VoidType) {
      return original;
    }
    return new NullableType(TypeId.of(original.getTypeId()), original);
  }
}
