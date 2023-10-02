/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core;

import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

class TurboModuleInteropUtils {

  static class MethodDescriptor {

    @DoNotStrip public final String methodName;
    @DoNotStrip public final String jniSignature;
    @DoNotStrip public final String jsiReturnKind;
    @DoNotStrip public final int jsArgCount;

    MethodDescriptor(String methodName, String jniSignature, String jsiReturnKind, int jsArgCount) {
      this.methodName = methodName;
      this.jniSignature = jniSignature;
      this.jsiReturnKind = jsiReturnKind;
      this.jsArgCount = jsArgCount;
    }
  }

  private static class ParsingException extends RuntimeException {

    ParsingException(String moduleName, String message) {
      super(
          "Unable to parse @ReactMethod annotations from native module: "
              + moduleName
              + ". Details: "
              + message);
    }

    ParsingException(String moduleName, String methodName, String message) {
      super(
          "Unable to parse @ReactMethod annotation from native module method: "
              + moduleName
              + "."
              + methodName
              + "()"
              + ". Details: "
              + message);
    }
  }

  static List<MethodDescriptor> getMethodDescriptorsFromModule(NativeModule module) {
    final Method[] methods = getMethodsFromModule(module);

    List<MethodDescriptor> methodDescriptors = new ArrayList<>();
    Set<String> methodNames = new HashSet<>();

    for (Method method : methods) {
      @Nullable ReactMethod annotation = method.getAnnotation(ReactMethod.class);
      final String moduleName = module.getName();
      final String methodName = method.getName();
      if (annotation == null && !"getConstants".equals(methodName)) {
        continue;
      }

      if (methodNames.contains(methodName)) {
        throw new ParsingException(
            moduleName,
            "Module exports two methods to JavaScript with the same name: \"" + methodName);
      }

      methodNames.add(methodName);

      Class<?>[] paramClasses = method.getParameterTypes();
      Class<?> returnType = method.getReturnType();

      if ("getConstants".equals(methodName)) {
        if (returnType != Map.class) {
          // TODO(T145105887) Output error. getConstants must always have a return type of Map
        }
      } else if (annotation.isBlockingSynchronousMethod() && returnType == void.class
          || !annotation.isBlockingSynchronousMethod() && returnType != void.class) {
        // TODO(T145105887): Output error. TurboModule system assumes returnType == void iff the
        // method is synchronous.
      }

      methodDescriptors.add(
          new MethodDescriptor(
              methodName,
              createJniSignature(moduleName, methodName, paramClasses, returnType),
              createJSIReturnKind(moduleName, methodName, paramClasses, returnType),
              getJsArgCount(moduleName, methodName, paramClasses)));
    }

    return methodDescriptors;
  }

  private static Method[] getMethodsFromModule(NativeModule module) {
    Class<? extends NativeModule> classForMethods = module.getClass();
    Class<? extends NativeModule> superClass =
        (Class<? extends NativeModule>) classForMethods.getSuperclass();
    if (TurboModule.class.isAssignableFrom(superClass)) {
      // For java module that is based on generated flow-type spec, inspect the
      // spec abstract class instead, which is the super class of the given java
      // module.
      classForMethods = superClass;
    }
    return classForMethods.getDeclaredMethods();
  }

  private static String createJniSignature(
      String moduleName, String methodName, Class<?>[] paramClasses, Class<?> returnClass) {
    StringBuilder jniSignature = new StringBuilder("(");
    for (Class<?> paramClass : paramClasses) {
      jniSignature.append(convertParamClassToJniType(moduleName, methodName, paramClass));
    }
    jniSignature.append(")");
    jniSignature.append(convertReturnClassToJniType(moduleName, methodName, returnClass));
    return jniSignature.toString();
  }

  private static String convertParamClassToJniType(
      String moduleName, String methodName, Class<?> paramClass) {
    if (paramClass == boolean.class) {
      return "Z";
    }

    if (paramClass == int.class) {
      return "I";
    }

    if (paramClass == double.class) {
      return "D";
    }

    if (paramClass == float.class) {
      return "F";
    }

    if (paramClass == Boolean.class
        || paramClass == Integer.class
        || paramClass == Double.class
        || paramClass == Float.class
        || paramClass == String.class
        || paramClass == Callback.class
        || paramClass == Promise.class
        || paramClass == ReadableMap.class
        || paramClass == ReadableArray.class) {
      return convertClassToJniType(paramClass);
    }

    if (paramClass == Dynamic.class) {
      // TODO(T145105887): Output warnings that TurboModules doesn't yet support Dynamic arguments
    }

    throw new ParsingException(
        moduleName,
        methodName,
        "Unable to parse JNI signature. Detected unsupported parameter class: "
            + paramClass.getCanonicalName());
  }

  private static String convertReturnClassToJniType(
      String moduleName, String methodName, Class<?> returnClass) {
    if (returnClass == boolean.class) {
      return "Z";
    }

    if (returnClass == int.class) {
      return "I";
    }

    if (returnClass == double.class) {
      return "D";
    }

    if (returnClass == float.class) {
      return "F";
    }

    if (returnClass == void.class) {
      return "V";
    }

    if (returnClass == Boolean.class
        || returnClass == Integer.class
        || returnClass == Double.class
        || returnClass == Float.class
        || returnClass == String.class
        || returnClass == WritableMap.class
        || returnClass == WritableArray.class
        || returnClass == Map.class) {
      return convertClassToJniType(returnClass);
    }

    throw new ParsingException(
        moduleName,
        methodName,
        "Unable to parse JNI signature. Detected unsupported return class: "
            + returnClass.getCanonicalName());
  }

  private static String convertClassToJniType(Class<?> cls) {
    return 'L' + cls.getCanonicalName().replace('.', '/') + ';';
  }

  private static int getJsArgCount(String moduleName, String methodName, Class<?>[] paramClasses) {
    for (int i = 0; i < paramClasses.length; i += 1) {
      if (paramClasses[i] == Promise.class) {
        if (i != (paramClasses.length - 1)) {
          throw new ParsingException(
              moduleName,
              methodName,
              "Unable to parse JavaScript arg count. Promises must be used as last parameter only.");
        }

        return paramClasses.length - 1;
      }
    }

    return paramClasses.length;
  }

  private static String createJSIReturnKind(
      String moduleName, String methodName, Class<?>[] paramClasses, Class<?> returnClass) {
    for (int i = 0; i < paramClasses.length; i += 1) {
      if (paramClasses[i] == Promise.class) {
        if (i != (paramClasses.length - 1)) {
          throw new ParsingException(
              moduleName,
              methodName,
              "Unable to parse JSI return kind. Promises must be used as last parameter only.");
        }

        return "PromiseKind";
      }
    }

    if (returnClass == boolean.class || returnClass == Boolean.class) {
      return "BooleanKind";
    }

    if (returnClass == double.class
        || returnClass == Double.class
        || returnClass == float.class
        || returnClass == Float.class
        || returnClass == int.class
        || returnClass == Integer.class) {
      return "NumberKind";
    }

    if (returnClass == String.class) {
      return "StringKind";
    }

    if (returnClass == void.class) {
      return "VoidKind";
    }

    if (returnClass == WritableMap.class || returnClass == Map.class) {
      return "ObjectKind";
    }

    if (returnClass == WritableArray.class) {
      return "ArrayKind";
    }

    throw new ParsingException(
        moduleName,
        methodName,
        "Unable to parse JSI return kind. Detected unsupported return class: "
            + returnClass.getCanonicalName());
  }
}
