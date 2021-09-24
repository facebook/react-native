/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.NativeModuleType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.ClassName;
import com.squareup.javapoet.CodeBlock;
import com.squareup.javapoet.MethodSpec;
import com.squareup.javapoet.ParameterSpec;
import com.squareup.javapoet.ParameterizedTypeName;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.Nullable;
import javax.lang.model.element.Modifier;

public final class NativeModuleResolvedType extends ResolvedType<NativeModuleType> {
  private final Map<String, ResolvedType> mResolvedAliasTypes;
  private final Map<String, FunctionResolvedType> mResolvedPropertyTypes;

  private NativeModuleResolvedType(
      final NativeModuleType type, final TypeData typeData, final boolean nullable) {
    super(type, nullable);
    mResolvedAliasTypes =
        Collections.unmodifiableMap(
            type.aliases.stream()
                .collect(
                    Collectors.toMap(
                        item -> item.getTypeId().typeName,
                        item -> resolveType(item, typeData, false))));
    mResolvedPropertyTypes =
        Collections.unmodifiableMap(
            type.properties.stream()
                .collect(
                    Collectors.toMap(
                        item -> item.name,
                        // TODO: Optional Object property is not necessarily nullable.
                        item -> {
                          final ResolvedType resolvedType =
                              resolveType(item.type, typeData, item.optional);
                          TypeUtils.assertCondition(
                              resolvedType instanceof FunctionResolvedType,
                              "NativeModules can only contain methods. Constants like '"
                                  + item.name
                                  + "' must be declared in the return type of the 'getConstants()' method.");
                          return (FunctionResolvedType) resolvedType;
                        })));
  }

  public static NativeModuleResolvedType create(
      final NativeModuleType type, final TypeData typeData, final boolean nullable) {
    return new NativeModuleResolvedType(type, typeData, nullable);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    throw new UnsupportedOperationException(
        "NativeModuleType cannot be referred to by other types.");
  }

  @Override
  public @Nullable TypeSpec getGeneratedCode(final String packageName) {
    final TypeSpec.Builder classBuilder =
        TypeSpec.classBuilder(mType.getTypeId().typeName)
            .addModifiers(Modifier.PUBLIC, Modifier.ABSTRACT)
            .superclass(ReactClassNames.REACT_CONTEXT_BASE_JAVA_MODULE)
            .addSuperinterface(ReactClassNames.REACT_MODULE_WITH_SPEC)
            .addSuperinterface(ReactClassNames.REACT_TURBOMODULE);

    final MethodSpec.Builder constructorBuilder =
        MethodSpec.constructorBuilder()
            .addModifiers(Modifier.PUBLIC)
            .addParameter(
                ParameterSpec.builder(ReactClassNames.REACT_APPLICATION_CONTEXT, "reactContext")
                    .build())
            .addStatement("super($N)", "reactContext");
    classBuilder.addMethod(constructorBuilder.build());

    mResolvedPropertyTypes.forEach(
        (name, resolvedType) -> {
          if (name.equals("getConstants")) {
            classBuilder.addMethod(generateGetTypedExportedConstantsMethod());
            classBuilder.addMethod(generateGetConstantsMethod(resolvedType));
          } else {
            classBuilder.addMethod(
                ((FunctionResolvedType) resolvedType).getGeneratedMethodWithReactAnnotation(name));
          }
        });

    return classBuilder.build();
  }

  // For now, getConstants() needs a runtime check to ensure the object return value has the
  // required properties. In the future, the method should return the specific object type that
  // can be verified during build time.
  private static MethodSpec generateGetConstantsMethod(final FunctionResolvedType resolvedType) {
    final ResolvedType resolvedReturnType = resolvedType.getResolvedReturnType();
    TypeUtils.assertCondition(
        resolvedReturnType instanceof ObjectResolvedType,
        "getConstants() method must return an exact object. Found: " + resolvedType.mType);

    final ParameterizedTypeName returnType =
        ParameterizedTypeName.get(ClassName.get(Map.class), ClassNames.STRING, ClassName.OBJECT);
    return MethodSpec.methodBuilder("getConstants")
        .addModifiers(Modifier.PUBLIC, Modifier.FINAL)
        .addAnnotation(Annotations.OVERRIDE)
        .returns(returnType.annotated(Annotations.NULLABLE))
        .addCode(
            getConstantsMethodBody(
                returnType, ((ObjectResolvedType) resolvedReturnType).getResolvedPropertyTypes()))
        .build();
  }

  private static MethodSpec generateGetTypedExportedConstantsMethod() {
    return MethodSpec.methodBuilder("getTypedExportedConstants")
        .addModifiers(Modifier.PROTECTED, Modifier.ABSTRACT)
        .returns(ClassNames.CONSTANTS_MAP)
        .build();
  }

  private static CodeBlock getConstantsMethodBody(
      final ParameterizedTypeName returnType, final Map<String, ResolvedType> constantsTypes) {
    final CodeBlock.Builder methodBody = CodeBlock.builder();

    final Map<Boolean, List<Map.Entry<String, ResolvedType>>> constantsByNullability =
        constantsTypes.entrySet().stream()
            .collect(Collectors.partitioningBy(entry -> entry.getValue().mNullable));

    final String constantsVariableName = "constants";
    final String obligatoryFlowConstantsVariableName = "obligatoryFlowConstants";
    final String optionalFlowConstantsVariableName = "optionalFlowConstants";
    final TypeName setOfStringsType =
        ParameterizedTypeName.get(ClassName.get(Set.class), ClassNames.STRING);
    final TypeName hashsetType = ClassName.get(HashSet.class);

    methodBody.addStatement(
        "$T $N = $N()",
        returnType,
        constantsVariableName,
        generateGetTypedExportedConstantsMethod().name);

    // Enable all of this for internal (debug) builds only.
    methodBody.beginControlFlow(
        "if ($1T.DEBUG || $1T.IS_INTERNAL_BUILD)", ReactClassNames.REACT_BUILD_CONFIG);
    {
      final List<String> obligatoryConstants =
          constantsByNullability.get(false).stream()
              .map(Map.Entry::getKey)
              .sorted()
              .collect(Collectors.toList());
      addVariableDeclaration(
          methodBody,
          obligatoryFlowConstantsVariableName,
          obligatoryConstants,
          setOfStringsType,
          hashsetType);

      final List<String> optionalConstants =
          constantsByNullability.get(true).stream()
              .map(Map.Entry::getKey)
              .sorted()
              .collect(Collectors.toList());
      addVariableDeclaration(
          methodBody,
          optionalFlowConstantsVariableName,
          optionalConstants,
          setOfStringsType,
          hashsetType);

      final String undeclaredConstantsVariableName = "undeclaredConstants";

      methodBody
          .addStatement(
              "$T $N = new $T<>($N.keySet())",
              setOfStringsType,
              undeclaredConstantsVariableName,
              hashsetType,
              constantsVariableName)
          .addStatement(
              "$N.removeAll($N)",
              undeclaredConstantsVariableName,
              obligatoryFlowConstantsVariableName)
          .addStatement(
              "$N.removeAll($N)",
              undeclaredConstantsVariableName,
              optionalFlowConstantsVariableName);
      methodBody.add(
          checkForConstantsFulfillmentBlock(
              undeclaredConstantsVariableName,
              "Native Module Flow doesn\'t declare constants: %s"));

      methodBody
          .addStatement(
              "$N = $N", undeclaredConstantsVariableName, obligatoryFlowConstantsVariableName)
          .addStatement(
              "$N.removeAll($N.keySet())", undeclaredConstantsVariableName, constantsVariableName);
      methodBody.add(
          checkForConstantsFulfillmentBlock(
              undeclaredConstantsVariableName, "Native Module doesn\'t fill in constants: %s"));
    }
    methodBody.endControlFlow();
    methodBody.addStatement("return $N", constantsVariableName);

    return methodBody.build();
  }

  private static void addVariableDeclaration(
      final CodeBlock.Builder builder,
      final String variableName,
      final List<String> values,
      final TypeName varType,
      final TypeName actualType) {
    if (values.isEmpty()) {
      builder.addStatement("$T $N = new $T<>()", varType, variableName, actualType);
    } else {
      builder.add(
          "$T $N = new $T<>($T.asList(\n",
          varType,
          variableName,
          actualType,
          ClassName.get(Arrays.class));
      builder.indent().indent();

      int constantsToAdd = values.size();
      for (final String constantName : values) {
        builder.add("\"$L\"", constantName);
        if (--constantsToAdd > 0) {
          builder.add(",");
        }
        builder.add("\n");
      }

      builder.unindent().unindent();
      builder.addStatement("))");
    }
  }

  private static CodeBlock checkForConstantsFulfillmentBlock(
      final String undeclaredConstantsVariableName, final String formatString) {
    return CodeBlock.builder()
        .beginControlFlow("if (!$N.isEmpty())", undeclaredConstantsVariableName)
        .addStatement(
            "throw new IllegalStateException(String.format(\"" + formatString + "\", $N))",
            undeclaredConstantsVariableName)
        .endControlFlow()
        .build();
  }
}
