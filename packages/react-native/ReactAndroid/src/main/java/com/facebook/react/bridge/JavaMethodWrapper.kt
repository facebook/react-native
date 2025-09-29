/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.debug.holder.PrinterHolder
import com.facebook.debug.tags.ReactDebugOverlayTags
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.systrace.Systrace.TRACE_TAG_REACT
import com.facebook.systrace.SystraceMessage
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method

@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal class JavaMethodWrapper(
    private val moduleWrapper: JavaModuleWrapper,
    val method: Method,
    isSync: Boolean,
) : JavaModuleWrapper.NativeMethod {
  private abstract class ArgumentExtractor<T> {
    open fun getJSArgumentsNeeded(): Int = 1

    @Suppress("DEPRECATION")
    abstract fun extractArgument(
        jsInstance: JSInstance,
        jsArguments: ReadableArray,
        atIndex: Int,
    ): T?
  }

  private val parameterTypes: Array<Class<*>>
  private val paramLength: Int

  /**
   * Determines how the method is exported in JavaScript: METHOD_TYPE_ASYNC for regular methods
   * METHOD_TYPE_PROMISE for methods that return a promise object to the caller. METHOD_TYPE_SYNC
   * for sync methods
   */
  override var type: String = BaseJavaModule.METHOD_TYPE_ASYNC
  private var argumentsProcessed = false
  private var argumentExtractors: Array<ArgumentExtractor<*>>? = null
  private var internalSignature: String? = null
  private var arguments: Array<Any?>? = null
  private var jsArgumentsNeeded = 0

  init {
    method.isAccessible = true
    parameterTypes = method.parameterTypes
    paramLength = parameterTypes.size

    if (isSync) {
      type = BaseJavaModule.METHOD_TYPE_SYNC
    } else if (paramLength > 0 && (parameterTypes[paramLength - 1] == Promise::class.java)) {
      type = BaseJavaModule.METHOD_TYPE_PROMISE
    }
  }

  private fun processArguments() {
    if (argumentsProcessed) {
      return
    }
    SystraceMessage.beginSection(TRACE_TAG_REACT, "processArguments")
        .arg("method", moduleWrapper.name + "." + method.name)
        .flush()
    try {
      argumentsProcessed = true
      argumentExtractors = buildArgumentExtractors(parameterTypes)
      internalSignature =
          buildSignature(method, parameterTypes, (type == BaseJavaModule.METHOD_TYPE_SYNC))
      // Since native methods are invoked from a message queue executed on a single thread, it is
      // safe to allocate only one arguments object per method that can be reused across calls
      arguments = arrayOfNulls(parameterTypes.size)
      jsArgumentsNeeded = calculateJSArgumentsNeeded()
    } finally {
      SystraceMessage.endSection(TRACE_TAG_REACT).flush()
    }
  }

  val signature: String?
    get() {
      if (!argumentsProcessed) {
        processArguments()
      }
      return checkNotNull(internalSignature)
    }

  private fun buildSignature(method: Method, paramTypes: Array<Class<*>>, isSync: Boolean): String =
      buildString(paramTypes.size + 2) {
        if (isSync) {
          append(returnTypeToChar(method.returnType))
          append('.')
        } else {
          append("v.")
        }

        for (i in paramTypes.indices) {
          val paramClass = paramTypes[i]
          if (paramClass == Promise::class.java) {
            check(i == paramTypes.size - 1) { "Promise must be used as last parameter only" }
          }
          append(paramTypeToChar(paramClass))
        }
      }

  private fun buildArgumentExtractors(paramTypes: Array<Class<*>>): Array<ArgumentExtractor<*>> {
    val argumentExtractors = arrayOfNulls<ArgumentExtractor<*>>(paramTypes.size)
    var i = 0
    while (i < paramTypes.size) {
      val argumentClass = paramTypes[i]
      val extractor: ArgumentExtractor<*> =
          when (argumentClass) {
            Boolean::class.javaObjectType,
            Boolean::class.javaPrimitiveType -> ARGUMENT_EXTRACTOR_BOOLEAN
            Int::class.javaObjectType,
            Int::class.javaPrimitiveType -> ARGUMENT_EXTRACTOR_INTEGER
            Double::class.javaObjectType,
            Double::class.javaPrimitiveType -> ARGUMENT_EXTRACTOR_DOUBLE
            Float::class.javaObjectType,
            Float::class.javaPrimitiveType -> ARGUMENT_EXTRACTOR_FLOAT
            String::class.java -> ARGUMENT_EXTRACTOR_STRING
            Callback::class.java -> ARGUMENT_EXTRACTOR_CALLBACK
            Promise::class.java -> {
              check(i == paramTypes.size - 1) { "Promise must be used as last parameter only" }
              ARGUMENT_EXTRACTOR_PROMISE
            }
            ReadableMap::class.java -> ARGUMENT_EXTRACTOR_MAP
            ReadableArray::class.java -> ARGUMENT_EXTRACTOR_ARRAY
            Dynamic::class.java -> ARGUMENT_EXTRACTOR_DYNAMIC
            else ->
                throw RuntimeException("Got unknown argument class: ${argumentClass.simpleName}")
          }

      argumentExtractors[i] = extractor
      i += extractor.getJSArgumentsNeeded()
    }

    return argumentExtractors.requireNoNulls()
  }

  private fun calculateJSArgumentsNeeded(): Int {
    var n = 0
    for (extractor in checkNotNull(argumentExtractors)) {
      n += extractor.getJSArgumentsNeeded()
    }
    return n
  }

  private fun getAffectedRange(startIndex: Int, jsArgumentsNeeded: Int): String =
      if (jsArgumentsNeeded > 1) {
        "$startIndex-${startIndex + jsArgumentsNeeded - 1}"
      } else {
        "$startIndex"
      }

  @Suppress("DEPRECATION")
  override fun invoke(jsInstance: JSInstance, parameters: ReadableArray) {
    val traceName = moduleWrapper.name + "." + method.name
    SystraceMessage.beginSection(TRACE_TAG_REACT, "callJavaModuleMethod")
        .arg("method", traceName)
        .flush()
    if (DEBUG) {
      PrinterHolder.printer.logMessage(
          ReactDebugOverlayTags.BRIDGE_CALLS,
          "JS->Java: %s.%s()",
          moduleWrapper.name,
          method.name,
      )
    }
    try {
      if (!argumentsProcessed) {
        processArguments()
      }

      val validatedArguments =
          requireNotNull(arguments) { "processArguments failed: 'arguments' is null." }
      val validatedArgumentExtractors =
          requireNotNull(argumentExtractors) {
            "processArguments failed: 'argumentExtractors' is null."
          }

      if (jsArgumentsNeeded != parameters.size()) {
        throw JSApplicationCausedNativeException(
            "$traceName got ${parameters.size()} arguments, expected $jsArgumentsNeeded"
        )
      }

      var i = 0
      var jsArgumentsConsumed = 0
      try {
        while (i < validatedArgumentExtractors.size) {
          validatedArguments[i] =
              validatedArgumentExtractors[i].extractArgument(
                  jsInstance,
                  parameters,
                  jsArgumentsConsumed,
              )
          jsArgumentsConsumed += validatedArgumentExtractors[i].getJSArgumentsNeeded()
          i++
        }
      } catch (e: UnexpectedNativeTypeException) {
        throw JSApplicationCausedNativeException(
            "${e.message} (constructing arguments for $traceName at argument index ${
              getAffectedRange(
                  jsArgumentsConsumed,
                  validatedArgumentExtractors[i].getJSArgumentsNeeded(),
              )
          })",
            e,
        )
      } catch (e: NullPointerException) {
        throw JSApplicationCausedNativeException(
            "${e.message} (constructing arguments for $traceName at argument index ${
              getAffectedRange(
                  jsArgumentsConsumed,
                  validatedArgumentExtractors[i].getJSArgumentsNeeded(),
              )
          })",
            e,
        )
      }

      try {
        method.invoke(moduleWrapper.module, *validatedArguments)
      } catch (e: IllegalArgumentException) {
        throw RuntimeException(createInvokeExceptionMessage(traceName), e)
      } catch (e: IllegalAccessException) {
        throw RuntimeException(createInvokeExceptionMessage(traceName), e)
      } catch (e: InvocationTargetException) {
        // Exceptions thrown from native module calls end up wrapped in InvocationTargetException
        // which just make traces harder to read and bump out useful information
        if (e.cause is RuntimeException) {
          throw (e.cause as RuntimeException)
        }
        throw RuntimeException(createInvokeExceptionMessage(traceName), e)
      }
    } finally {
      SystraceMessage.endSection(TRACE_TAG_REACT).flush()
    }
  }

  companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "JavaMethodWrapper",
          LegacyArchitectureLogLevel.ERROR,
      )
    }

    private val ARGUMENT_EXTRACTOR_BOOLEAN: ArgumentExtractor<Boolean> =
        object : ArgumentExtractor<Boolean>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): Boolean = jsArguments.getBoolean(atIndex)
        }

    private val ARGUMENT_EXTRACTOR_DOUBLE: ArgumentExtractor<Double> =
        object : ArgumentExtractor<Double>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): Double = jsArguments.getDouble(atIndex)
        }

    private val ARGUMENT_EXTRACTOR_FLOAT: ArgumentExtractor<Float> =
        object : ArgumentExtractor<Float>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): Float = jsArguments.getDouble(atIndex).toFloat()
        }

    private val ARGUMENT_EXTRACTOR_INTEGER: ArgumentExtractor<Int> =
        object : ArgumentExtractor<Int>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): Int = jsArguments.getDouble(atIndex).toInt()
        }

    private val ARGUMENT_EXTRACTOR_STRING: ArgumentExtractor<String> =
        object : ArgumentExtractor<String>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): String? = jsArguments.getString(atIndex)
        }

    private val ARGUMENT_EXTRACTOR_ARRAY: ArgumentExtractor<ReadableArray> =
        object : ArgumentExtractor<ReadableArray>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): ReadableArray? = jsArguments.getArray(atIndex)
        }

    private val ARGUMENT_EXTRACTOR_DYNAMIC: ArgumentExtractor<Dynamic> =
        object : ArgumentExtractor<Dynamic>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): Dynamic = DynamicFromArray.create(jsArguments, atIndex)
        }

    private val ARGUMENT_EXTRACTOR_MAP: ArgumentExtractor<ReadableMap> =
        object : ArgumentExtractor<ReadableMap>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): ReadableMap? = jsArguments.getMap(atIndex)
        }

    private val ARGUMENT_EXTRACTOR_CALLBACK: ArgumentExtractor<Callback> =
        object : ArgumentExtractor<Callback>() {
          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): Callback? =
              if (jsArguments.isNull(atIndex)) {
                null
              } else {
                val id = jsArguments.getDouble(atIndex).toInt()
                @Suppress("DEPRECATION") CallbackImpl(jsInstance, id)
              }
        }

    private val ARGUMENT_EXTRACTOR_PROMISE: ArgumentExtractor<Promise> =
        object : ArgumentExtractor<Promise>() {
          override fun getJSArgumentsNeeded(): Int = 2

          @Suppress("DEPRECATION")
          override fun extractArgument(
              jsInstance: JSInstance,
              jsArguments: ReadableArray,
              atIndex: Int,
          ): Promise {
            val resolve =
                ARGUMENT_EXTRACTOR_CALLBACK.extractArgument(jsInstance, jsArguments, atIndex)
            val reject =
                ARGUMENT_EXTRACTOR_CALLBACK.extractArgument(jsInstance, jsArguments, atIndex + 1)
            return PromiseImpl(resolve, reject)
          }
        }

    private val DEBUG =
        PrinterHolder.printer.shouldDisplayLogMessage(ReactDebugOverlayTags.BRIDGE_CALLS)

    private fun paramTypeToChar(paramClass: Class<*>): Char {
      val tryCommon = commonTypeToChar(paramClass)
      if (tryCommon != '\u0000') {
        return tryCommon
      }
      return when (paramClass) {
        Callback::class.java -> 'X'
        Promise::class.java -> 'P'
        ReadableMap::class.java -> 'M'
        ReadableArray::class.java -> 'A'
        Dynamic::class.java -> 'Y'
        else -> throw RuntimeException("Got unknown param class: ${paramClass.simpleName}")
      }
    }

    private fun returnTypeToChar(returnClass: Class<*>): Char {
      // Keep this in sync with MethodInvoker
      val tryCommon = commonTypeToChar(returnClass)
      if (tryCommon != '\u0000') {
        return tryCommon
      }
      return when (returnClass) {
        Void.TYPE -> 'v'
        WritableMap::class.java -> 'M'
        WritableArray::class.java -> 'A'
        else -> throw RuntimeException("Got unknown return class: ${returnClass.simpleName}")
      }
    }

    private fun commonTypeToChar(typeClass: Class<*>): Char {
      return when (typeClass) {
        Boolean::class.javaPrimitiveType -> 'z'
        Boolean::class.javaObjectType -> 'Z'
        Int::class.javaPrimitiveType -> 'i'
        Int::class.javaObjectType -> 'I'
        Double::class.javaPrimitiveType -> 'd'
        Double::class.javaObjectType -> 'D'
        Float::class.javaPrimitiveType -> 'f'
        Float::class.javaObjectType -> 'F'
        String::class.java -> 'S'
        else -> '\u0000'
      }
    }

    /**
     * Makes it easier to determine the cause of an error invoking a native method from Javascript
     * code by adding the function name.
     */
    private fun createInvokeExceptionMessage(traceName: String): String =
        "Could not invoke $traceName"
  }
}
