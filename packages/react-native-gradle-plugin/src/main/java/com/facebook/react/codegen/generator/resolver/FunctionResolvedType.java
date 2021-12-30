/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.FunctionType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.AnnotationSpec;
import com.squareup.javapoet.CodeBlock;
import com.squareup.javapoet.MethodSpec;
import com.squareup.javapoet.ParameterSpec;
import com.squareup.javapoet.TypeName;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.Nullable;
import javax.lang.model.element.Modifier;

public final class FunctionResolvedType extends ResolvedType<FunctionType> {
  private final Map<String, ResolvedType> mResolvedArgTypes;
  private final ResolvedType mResolvedReturnType;

  private FunctionResolvedType(
      final FunctionType type, final TypeData typeData, final boolean nullable) {
    super(type, nullable);
    mResolvedReturnType = resolveType(type.returnType, typeData, nullable);
    mResolvedArgTypes =
        Collections.unmodifiableMap(
            type.parameters.stream()
                .collect(
                    Collectors.toMap(
                        item -> item.name, item -> resolveType(item.type, typeData, false))));
  }

  public static FunctionResolvedType create(
      final FunctionType type, final TypeData typeData, final boolean nullable) {
    return new FunctionResolvedType(type, typeData, nullable);
  }

  public ResolvedType getResolvedReturnType() {
    return mResolvedReturnType;
  }

  public Map<String, ResolvedType> getResolvedArgTypes() {
    return mResolvedArgTypes;
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    return TypeUtils.makeNullable(ReactClassNames.REACT_CALLBACK, mNullable);
  }

  public MethodSpec getGeneratedMethodWithReactAnnotation(String methodName) {
    TypeName resolvedReturnTypeName =
        mResolvedReturnType.getNativeType(NativeTypeContext.FUNCTION_RETURN);

    boolean isReturnTypePromise = resolvedReturnTypeName == ReactClassNames.REACT_PROMISE;
    TypeName returnTypeName = isReturnTypePromise ? TypeName.VOID : resolvedReturnTypeName;

    MethodSpec.Builder methodBuilder =
        MethodSpec.methodBuilder(methodName).addModifiers(Modifier.PUBLIC);
    methodBuilder.returns(returnTypeName);

    if (!mNullable) {
      methodBuilder.addModifiers(Modifier.ABSTRACT);
    } else {
      String returnStatement = getFalsyReturnStatement(returnTypeName);
      if (returnStatement != null) {
        CodeBlock.Builder methodBody = CodeBlock.builder();
        methodBody.addStatement(returnStatement);
        methodBuilder.addCode(methodBody.build());
      }
    }

    mResolvedArgTypes
        .entrySet()
        .forEach(
            e -> {
              String argName = e.getKey();
              ResolvedType argResolvedType = e.getValue();
              methodBuilder.addParameter(
                  ParameterSpec.builder(
                          argResolvedType.getNativeType(NativeTypeContext.FUNCTION_ARGUMENT),
                          argName)
                      .build());
            });

    AnnotationSpec.Builder annotationBuilder = AnnotationSpec.builder(ReactClassNames.REACT_METHOD);

    // Special case: Promise inserts additional method arg at the end.
    if (isReturnTypePromise) {
      methodBuilder.addParameter(
          ParameterSpec.builder(ReactClassNames.REACT_PROMISE, "promise").build());
    } else if (!TypeName.VOID.equals(returnTypeName)) {
      // A non-promise non-void return type means the method is synchronous.
      annotationBuilder.addMember("isBlockingSynchronousMethod", "$L", true);
    }

    // React methods need special `@ReactMethod` annotation for now.
    methodBuilder.addAnnotation(annotationBuilder.build());

    // TODO(T82242829) Add @DoNotStrip annotation

    return methodBuilder.build();
  }

  private static @Nullable String getFalsyReturnStatement(TypeName returnType) {
    // TODO: Handle nullable falsy return.
    if (returnType == TypeName.BOOLEAN) {
      return "return false";
    } else if (returnType == TypeName.DOUBLE) {
      return "return 0.0";
    } else if (returnType == ClassNames.STRING
        || returnType == ReactClassNames.REACT_WRITABLE_ARRAY
        || returnType == ReactClassNames.REACT_WRITABLE_MAP) {
      return "return null";
    }

    return null;
  }
}
