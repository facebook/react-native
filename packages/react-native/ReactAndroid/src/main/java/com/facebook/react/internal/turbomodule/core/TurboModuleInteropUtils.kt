/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.turbomodule.core

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import java.lang.reflect.Method
import java.util.ArrayList
import java.util.HashSet
import kotlin.jvm.JvmField

internal object TurboModuleInteropUtils {

  @JvmStatic
  fun getMethodDescriptorsFromModule(module: NativeModule): List<MethodDescriptor> {
    val methods = getMethodsFromModule(module)

    val methodDescriptors: MutableList<MethodDescriptor> = ArrayList()
    val methodNames: MutableSet<String> = HashSet()

    for (method in methods) {
      val annotation = method.getAnnotation(ReactMethod::class.java)
      val moduleName = module.name
      val methodName = method.name
      if (annotation == null && "getConstants" != methodName) {
        continue
      }

      if (methodNames.contains(methodName)) {
        throw ParsingException(
            moduleName,
            "Module exports two methods to JavaScript with the same name: \"$methodName")
      }

      methodNames.add(methodName)

      val paramClasses = method.parameterTypes
      val returnType = method.returnType

      if ("getConstants" == methodName) {
        if (returnType != MutableMap::class.java) {
          throw ParsingException(moduleName, "getConstants must return a Map")
        }
      } else if ((annotation != null) &&
          ((annotation.isBlockingSynchronousMethod && returnType == java.lang.Void.TYPE) ||
              (!annotation.isBlockingSynchronousMethod && returnType != java.lang.Void.TYPE))) {
        throw ParsingException(
            moduleName,
            "TurboModule system assumes returnType == void iff the method is synchronous.")
      }

      methodDescriptors.add(
          MethodDescriptor(
              methodName,
              createJniSignature(moduleName, methodName, paramClasses, returnType),
              createJSIReturnKind(moduleName, methodName, paramClasses, returnType),
              getJsArgCount(moduleName, methodName, paramClasses)))
    }

    return methodDescriptors
  }

  private fun getMethodsFromModule(module: NativeModule): Array<Method> {
    var classForMethods: Class<out NativeModule> = module.javaClass
    val superClass = classForMethods.superclass as? Class<out NativeModule>
    if (superClass != null && TurboModule::class.java.isAssignableFrom(superClass)) {
      // For java module that is based on generated flow-type spec, inspect the
      // spec abstract class instead, which is the super class of the given java
      // module.
      classForMethods = superClass
    }
    return classForMethods.declaredMethods
  }

  private fun createJniSignature(
      moduleName: String,
      methodName: String,
      paramClasses: Array<Class<*>>,
      returnClass: Class<*>
  ): String {
    val jniSignature = StringBuilder("(")
    for (paramClass in paramClasses) {
      jniSignature.append(convertParamClassToJniType(moduleName, methodName, paramClass))
    }
    jniSignature.append(")")
    jniSignature.append(convertReturnClassToJniType(moduleName, methodName, returnClass))
    return jniSignature.toString()
  }

  private fun convertParamClassToJniType(
      moduleName: String,
      methodName: String,
      paramClass: Class<*>
  ): String {
    if (paramClass == Boolean::class.javaPrimitiveType) {
      return "Z"
    }

    if (paramClass == Int::class.javaPrimitiveType) {
      return "I"
    }

    if (paramClass == Double::class.javaPrimitiveType) {
      return "D"
    }

    if (paramClass == Float::class.javaPrimitiveType) {
      return "F"
    }

    if (paramClass == java.lang.Boolean::class.java ||
        paramClass == java.lang.Integer::class.java ||
        paramClass == java.lang.Double::class.java ||
        paramClass == java.lang.Float::class.java ||
        paramClass == java.lang.String::class.java ||
        paramClass == Callback::class.java ||
        paramClass == Promise::class.java ||
        paramClass == ReadableMap::class.java ||
        paramClass == ReadableArray::class.java ||
        paramClass == Dynamic::class.java) {
      return convertClassToJniType(paramClass)
    }

    throw ParsingException(
        moduleName,
        methodName,
        "Unable to parse JNI signature. Detected unsupported parameter class: ${paramClass.canonicalName}")
  }

  private fun convertReturnClassToJniType(
      moduleName: String,
      methodName: String,
      returnClass: Class<*>
  ): String {
    if (returnClass == java.lang.Boolean::class.javaPrimitiveType) {
      return "Z"
    }

    if (returnClass == java.lang.Integer::class.javaPrimitiveType) {
      return "I"
    }

    if (returnClass == java.lang.Double::class.javaPrimitiveType) {
      return "D"
    }

    if (returnClass == java.lang.Float::class.javaPrimitiveType) {
      return "F"
    }

    if (returnClass == java.lang.Void.TYPE) {
      return "V"
    }

    if (returnClass == java.lang.Boolean::class.java ||
        returnClass == java.lang.Integer::class.java ||
        returnClass == java.lang.Double::class.java ||
        returnClass == java.lang.Float::class.java ||
        returnClass == java.lang.String::class.java ||
        returnClass == WritableMap::class.java ||
        returnClass == WritableArray::class.java ||
        returnClass == MutableMap::class.java) {
      return convertClassToJniType(returnClass)
    }

    throw ParsingException(
        moduleName,
        methodName,
        "Unable to parse JNI signature. Detected unsupported return class: ${returnClass.canonicalName}")
  }

  private fun convertClassToJniType(cls: Class<*>): String {
    val canonicalName = cls.canonicalName
    requireNotNull(canonicalName) { "Class must have a canonical name" }
    return 'L'.toString() + canonicalName.replace('.', '/') + ';'
  }

  private fun getJsArgCount(
      moduleName: String,
      methodName: String,
      paramClasses: Array<Class<*>>
  ): Int {
    var i = 0
    while (i < paramClasses.size) {
      if (paramClasses[i] == Promise::class.java) {
        if (i != (paramClasses.size - 1)) {
          throw ParsingException(
              moduleName,
              methodName,
              "Unable to parse JavaScript arg count. Promises must be used as last parameter only.")
        }

        return paramClasses.size - 1
      }
      i += 1
    }

    return paramClasses.size
  }

  private fun createJSIReturnKind(
      moduleName: String,
      methodName: String,
      paramClasses: Array<Class<*>>,
      returnClass: Class<*>
  ): String {
    var i = 0
    while (i < paramClasses.size) {
      if (paramClasses[i] == Promise::class.java) {
        if (i != (paramClasses.size - 1)) {
          throw ParsingException(
              moduleName,
              methodName,
              "Unable to parse JSI return kind. Promises must be used as last parameter only.")
        }

        return "PromiseKind"
      }
      i += 1
    }

    if (returnClass == java.lang.Boolean::class.javaPrimitiveType ||
        returnClass == java.lang.Boolean::class.java) {
      return "BooleanKind"
    }

    if (returnClass == java.lang.Double::class.javaPrimitiveType ||
        returnClass == java.lang.Double::class.java ||
        returnClass == java.lang.Float::class.javaPrimitiveType ||
        returnClass == java.lang.Float::class.java ||
        returnClass == java.lang.Integer::class.javaPrimitiveType ||
        returnClass == java.lang.Integer::class.java) {
      return "NumberKind"
    }

    if (returnClass == java.lang.String::class.java) {
      return "StringKind"
    }

    if (returnClass == java.lang.Void.TYPE) {
      return "VoidKind"
    }

    if (returnClass == WritableMap::class.java || returnClass == MutableMap::class.java) {
      return "ObjectKind"
    }

    if (returnClass == WritableArray::class.java) {
      return "ArrayKind"
    }

    throw ParsingException(
        moduleName,
        methodName,
        "Unable to parse JSI return kind. Detected unsupported return class: ${returnClass.canonicalName}")
  }

  internal class MethodDescriptor(
      @field:DoNotStrip @JvmField val methodName: String,
      @field:DoNotStrip @JvmField val jniSignature: String,
      @field:DoNotStrip @JvmField val jsiReturnKind: String,
      @field:DoNotStrip @JvmField val jsArgCount: Int
  )

  private class ParsingException : RuntimeException {
    constructor(
        moduleName: String,
        message: String
    ) : super(
        ("Unable to parse @ReactMethod annotations from native module: ${moduleName}. Details: ${message}"))

    constructor(
        moduleName: String,
        methodName: String,
        message: String
    ) : super(
        ("Unable to parse @ReactMethod annotation from native module method: ${moduleName}.${methodName}(). Details: ${message}"))
  }
}
