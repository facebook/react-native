// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#include <winrt/Windows.Foundation.h>
#include "JSValueReader.h"
#include "JSValueWriter.h"
#include "ModuleRegistration.h"
#include "ReactContext.h"
#include "ReactNonAbiValue.h"
#include "ReactPromise.h"
#include "winrt/Microsoft.ReactNative.h"

#include <functional>
#include <type_traits>

// REACT_MODULE(moduleStruct, [opt] moduleName, [opt] eventEmitterName)
// Arguments:
// - moduleStruct (required) - the struct name the macro is attached to.
// - moduleName (optional) - the module name visible to JavaScript. Default is the moduleStruct name.
// - eventEmitterName (optional) - the default event emitter name used by REACT_EVENT.
//   Default is the RCTDeviceEventEmitter.
//
// REACT_MODULE annotates a C++ struct as a ReactNative module.
// It can be any struct which can be instantiated using a default constructor.
// Note that it must be a 'struct', not 'class' because macro does a forward declaration using the 'struct' keyword.
#define REACT_MODULE(/* moduleStruct, [opt] moduleName, [opt] eventEmitterName */...) \
  INTERNAL_REACT_MODULE(__VA_ARGS__)(__VA_ARGS__)

// REACT_INIT(method)
// Arguments:
// - method (required) - the method name the macro is attached to.
//
// REACT_INIT annotates a method that is called when a native module is initialized.
// It must have 'IReactContext const &' parameter.
// It must be an instance method.
#define REACT_INIT(method) INTERNAL_REACT_MEMBER_2_ARGS(InitMethod, method)

// REACT_METHOD(method, [opt] methodName)
// Arguments:
// - method (required) - the method name the macro is attached to.
// - methodName (optional) - the method name visible to JavaScript. Default is the method name.
//
// REACT_METHOD annotates a method to export to JavaScript.
// It declares an asynchronous method. To return a value:
// - Return void and have a Callback as a last parameter. The Callback type can be any std::function like type. E.g.
//   Func<void(Args...)>.
// - Return void and have two callbacks as last parameters. One is used to return value and another an error.
// - Return void and have a ReactPromise as a last parameter. In JavaScript the method returns Promise.
// - Return non-void value. In JavaScript it is treated as a method with one Callback. Return std::pair<Error, Value> to
//   be able to communicate error condition.
// It can be an instance or static method.
#define REACT_METHOD(/* method, [opt] methodName */...) INTERNAL_REACT_MEMBER(__VA_ARGS__)(AsyncMethod, __VA_ARGS__)

// REACT_SYNC_METHOD(method, [opt] methodName)
// Arguments:
// - method (required) - the method name the macro is attached to.
// - methodName (optional) - the method name visible to JavaScript. Default is the method name.
//
// REACT_SYNC_METHOD annotates a method that is called synchronously.
// It must be used rarely because it may cause out-of-order execution when used along with asynchronous methods.
// The method must return non-void value type.
// It can be an instance or static method.
#define REACT_SYNC_METHOD(/* method, [opt] methodName */...) INTERNAL_REACT_MEMBER(__VA_ARGS__)(SyncMethod, __VA_ARGS__)

// REACT_CONSTANT_PROVIDER(method)
// Arguments:
// - method (required) - the method name the macro is attached to.
//
// REACT_CONSTANT_PROVIDER annotates a method that defines constants.
// It must have 'ReactConstantProvider &' parameter.
// It can be an instance or static method.
#define REACT_CONSTANT_PROVIDER(method) INTERNAL_REACT_MEMBER_2_ARGS(ConstantMethod, method)

// REACT_CONSTANT(field, [opt] constantName)
// Arguments:
// - field (required) - the field name the macro is attached to.
// - constantName (optional) - the constant name visible to JavaScript. Default is the field name.
//
// REACT_CONSTANT annotates a field that defines a constant.
// It can be an instance or static field.
#define REACT_CONSTANT(/* field, [opt] constantName */...) \
  INTERNAL_REACT_MEMBER(__VA_ARGS__)(ConstantField, __VA_ARGS__)

// REACT_EVENT(field, [opt] eventName, [opt] eventEmitterName)
// Arguments:
// - field (required) - the field name the macro is attached to.
// - eventName (optional) - the JavaScript event name. Default is the field name.
// - eventEmitterName (optional) - the JavaScript module event emitter name. Default is module's eventEmitterName which
//   is by default 'RCTDeviceEventEmitter'.
//
// REACT_EVENT annotates a field that helps raise a JavaScript event.
// The field type can be any std::function like type. E.g. Func<void(Args...)>.
// It must be an instance field.
#define REACT_EVENT(/* field, [opt] eventName, [opt] eventEmitterName */...) \
  INTERNAL_REACT_MEMBER(__VA_ARGS__)(EventField, __VA_ARGS__)

// REACT_FUNCTION(field, [opt] functionName, [opt] moduleName)
// Arguments:
// - field (required) - the field name the macro is attached to.
// - functionName (optional) - the JavaScript function name. Default is the field name.
// - moduleName (optional) - the JavaScript module name. Default is module's moduleName which is by default the class
//   name.
//
// REACT_FUNCTION annotates a field that helps calling a JavaScript function.
// The field type can be any std::function like type. E.g. Func<void(Args...)>.
// It must be an instance field.
#define REACT_FUNCTION(/* field, [opt] functionName, [opt] moduleName */...) \
  INTERNAL_REACT_MEMBER(__VA_ARGS__)(FunctionField, __VA_ARGS__)

#define REACT_SHOW_METHOD_SIGNATURES(methodName, signatures)                      \
  " (see details below in output).\n"                                             \
  "  It must be one of the following:\n" signatures                               \
  "  The C++ method name could be different. In that case add the L\"" methodName \
  "\" to the attribute:\n"                                                        \
  "    REACT_METHOD(method, L\"" methodName "\")\n...\n"

#define REACT_SHOW_SYNC_METHOD_SIGNATURES(methodName, signatures)                 \
  " (see details below in output).\n"                                             \
  "  It must be one of the following:\n" signatures                               \
  "  The C++ method name could be different. In that case add the L\"" methodName \
  "\" to the attribute:\n"                                                        \
  "    REACT_SYNC_METHOD(method, L\"" methodName "\")\n...\n"

#define REACT_SHOW_METHOD_SPEC_ERRORS(index, methodName, signatures)                                        \
  static_assert(methodCheckResults[index].IsUniqueName, "Name '" methodName "' used for multiple methods"); \
  static_assert(                                                                                            \
      methodCheckResults[index].IsMethodFound,                                                              \
      "Method '" methodName "' is not defined" REACT_SHOW_METHOD_SIGNATURES(methodName, signatures));       \
  static_assert(                                                                                            \
      methodCheckResults[index].IsSignatureMatching,                                                        \
      "Method '" methodName "' does not match signature" REACT_SHOW_METHOD_SIGNATURES(methodName, signatures));

#define REACT_SHOW_SYNC_METHOD_SPEC_ERRORS(index, methodName, signatures)                                   \
  static_assert(methodCheckResults[index].IsUniqueName, "Name '" methodName "' used for multiple methods"); \
  static_assert(                                                                                            \
      methodCheckResults[index].IsMethodFound,                                                              \
      "Method '" methodName "' is not defined" REACT_SHOW_SYNC_METHOD_SIGNATURES(methodName, signatures));  \
  static_assert(                                                                                            \
      methodCheckResults[index].IsSignatureMatching,                                                        \
      "Method '" methodName "' does not match signature" REACT_SHOW_SYNC_METHOD_SIGNATURES(methodName, signatures));

//
// Code below helps to register React Native modules and verify method signatures
// against specification.
//

namespace winrt::Microsoft::ReactNative {

// Often used to create a tuple with arguments or to create a method signature.
template <class T>
using RemoveConstRef = std::remove_const_t<std::remove_reference_t<T>>;

// Checks if type T has a callback-like signature TFunc<void(TArgs...)
template <class T>
struct IsCallback : std::false_type {};
template <template <class> class TFunc, class... TArgs>
struct IsCallback<TFunc<void(TArgs...)>> : std::true_type {};
#if defined(__cpp_noexcept_function_type) || (_HAS_NOEXCEPT_FUNCTION_TYPES == 1)
template <template <class> class TFunc, class... TArgs>
struct IsCallback<TFunc<void(TArgs...) noexcept>> : std::true_type {};
#endif

// Finds how many callbacks the function signature has in the end: 0, 1, or 2.
template <class TArgsTuple>
constexpr size_t GetCallbackCount() noexcept {
  if constexpr (std::tuple_size_v<TArgsTuple> >= 2) {
    return (IsCallback<std::tuple_element_t<std::tuple_size_v<TArgsTuple> - 1, TArgsTuple>>::value ? 1 : 0) +
        (IsCallback<std::tuple_element_t<std::tuple_size_v<TArgsTuple> - 2, TArgsTuple>>::value ? 1 : 0);
  } else if constexpr (std::tuple_size_v<TArgsTuple> == 1) {
    return IsCallback<std::tuple_element_t<0, TArgsTuple>>::value ? 1 : 0;
  } else {
    return 0;
  }
}

// Callback is any std::function<void(TArgs...)> like type.
// For the signature comparison we want to use only input arguments.
template <class... TArgs>
struct CallbackSignature {};

// ==== GetCallbackSignature ===================================================

template <class T>
struct GetCallbackSignatureImpl {};

// Get callback signature from a callback.
template <class TCallback>
using GetCallbackSignature = typename GetCallbackSignatureImpl<TCallback>::Type;

template <template <class> class TCallback, class... TArgs>
struct GetCallbackSignatureImpl<TCallback<void(TArgs...)>> {
  using Type = CallbackSignature<RemoveConstRef<TArgs>...>;
};

#if defined(__cpp_noexcept_function_type) || (_HAS_NOEXCEPT_FUNCTION_TYPES == 1)
template <template <class> class TCallback, class... TArgs>
struct GetCallbackSignatureImpl<TCallback<void(TArgs...) noexcept>> {
  using Type = CallbackSignature<RemoveConstRef<TArgs>...>;
};
#endif

// ==== CallbackCreator ========================================================

template <class T>
struct CallbackCreator;

// Callback signature without noexcept
template <template <class> class TCallback, class... TArgs>
struct CallbackCreator<TCallback<void(TArgs...)>> {
  static TCallback<void(TArgs...)> Create(
      IJSValueWriter const &argWriter,
      MethodResultCallback const &callback) noexcept {
    return TCallback<void(TArgs...)>([ callback, argWriter ](TArgs... args) noexcept {
      WriteArgs(argWriter, std::move(args)...);
      callback(argWriter);
    });
  }
};

// Callback signature with noexcept
template <template <class> class TCallback, class... TArgs>
struct CallbackCreator<TCallback<void(TArgs...) noexcept>> {
  static TCallback<void(TArgs...)> Create(
      IJSValueWriter const &argWriter,
      MethodResultCallback const &callback) noexcept {
    return TCallback<void(TArgs...)>([ callback, argWriter ](TArgs... args) noexcept {
      WriteArgs(argWriter, std::move(args)...);
      callback(argWriter);
    });
  }
};

// ==== TupleElementOrVoid =====================================================

template <bool, size_t Index, class TTuple>
struct TupleElementOrVoidImpl {
  using Type = void;
};

template <size_t Index, class TTuple>
struct TupleElementOrVoidImpl<true, Index, TTuple> {
  using Type = std::tuple_element_t<Index, TTuple>;
};

template <size_t Index, class TTuple>
using TupleElementOrVoid = typename TupleElementOrVoidImpl<(Index < std::tuple_size_v<TTuple>), Index, TTuple>::Type;

// Checks if type T is a has a ReactPromise
template <class T>
struct IsPromise : std::false_type {};
template <class T>
struct IsPromise<ReactPromise<T>> : std::true_type {};

// Return 1 if last parameter is Promise, otherwise 0.
template <class TArgsTuple>
constexpr size_t GetPromiseCount() noexcept {
  if constexpr (
      std::tuple_size_v<TArgsTuple>> 0 &&
      IsPromise<TupleElementOrVoid<std::tuple_size_v<TArgsTuple> - 1, TArgsTuple>>::value) {
    return 1;
  } else {
    return 0;
  }
}

template <class TResult>
constexpr bool IsVoidResultCheck() noexcept {
  return std::is_void_v<TResult> || std::is_same_v<TResult, winrt::fire_and_forget>;
}

template <class TResult, class TArg>
constexpr void ValidateCoroutineArg() noexcept {
  if constexpr (std::is_same_v<TResult, fire_and_forget>) {
    // unfortunately __PRETTY_FUNCTION__ is not able to be put after a string literal
    // so no detail information is provided for macOS
    static_assert(
        !std::is_reference_v<TArg> && !std::is_pointer_v<TArg>,
        "Coroutine parameter must be passed by value for safe access"
#ifndef __APPLE__
        ": " __FUNCSIG__
#endif
    );
  }
}

// ==== TransformListItems =====================================================

template <template <class...> class TFunc, class TList>
struct TransformListItemsImpl;

// TransformListItems transforms each variadic item parameter type using TFunc.
// E.g. std::tuple<int, double> ==> std::tuple<TFunc<int>, TFunc<double>>.
template <template <class...> class TFunc, class TList>
using TransformListItems = typename TransformListItemsImpl<TFunc, TList>::Type;

template <template <class...> class TFunc, template <class...> class TList, class... TItems>
struct TransformListItemsImpl<TFunc, TList<TItems...>> {
  using Type = TList<TFunc<TItems>...>;
};

// ==== TakeTupleElements ======================================================

template <size_t StartIndex, class TIndexSequence, class TTuple>
struct TakeTupleElementsImpl;

// Take Count tuple type parameters starting with StartIndex from TTuple.
template <size_t StartIndex, size_t Count, class TTuple>
using TakeTupleElements = typename TakeTupleElementsImpl<StartIndex, std::make_index_sequence<Count>, TTuple>::Type;

template <size_t StartIndex, class TTuple, size_t... Index>
struct TakeTupleElementsImpl<StartIndex, std::index_sequence<Index...>, TTuple> {
  using Type = std::tuple<std::tuple_element_t<StartIndex + Index, TTuple>...>;
};

//==============================================================================
// MethodSignature is used to compare method signatures.
//==============================================================================

struct MethodSignatureMatchResult {
  int ArgCountCompare;
  int CallbackCountCompare;
  bool IsResultMatching;
  bool AreArgsMatching;
  bool AreCallbacksMatching;
  bool IsPromiseMathcing;
  bool IsSucceeded;
};

template <class TResult, class TInputArgs, class TOutputCallbacks, class TOutputPromises>
struct MethodSignature {
  using Result = TResult;
  using InputArgs = TInputArgs;
  using OutputCallbacks = TOutputCallbacks;
  using OutputPromises = TOutputPromises;
  constexpr static size_t ArgCount = std::tuple_size_v<InputArgs>;
  constexpr static size_t CallbackCount = std::tuple_size_v<TOutputCallbacks>;

  static constexpr int CompareSize(size_t left, size_t right) noexcept {
    if (left < right) {
      return -1;
    } else if (right < left) {
      return 1;
    } else {
      return 0;
    }
  }

  template <class TOtherInputArgs, size_t... I>
  static constexpr bool MatchInputArgs(std::index_sequence<I...>) noexcept {
    return (std::is_same_v<std::tuple_element_t<I, InputArgs>, std::tuple_element_t<I, TOtherInputArgs>> && ...);
  }

  template <class TOtherOutputCallbacks, size_t... I>
  static constexpr bool MatchOutputCallbacks(std::index_sequence<I...>) noexcept {
    return (
        std::is_same_v<std::tuple_element_t<I, OutputCallbacks>, std::tuple_element_t<I, TOtherOutputCallbacks>> &&
        ...);
  }

  template <class TOtherMethodSignature>
  static constexpr MethodSignatureMatchResult Match() noexcept {
    MethodSignatureMatchResult result{};

    result.IsResultMatching = std::is_same_v<Result, typename TOtherMethodSignature::Result>;

    result.ArgCountCompare = CompareSize(ArgCount, TOtherMethodSignature::ArgCount);
    if (result.ArgCountCompare == 0) {
      result.AreArgsMatching =
          MatchInputArgs<typename TOtherMethodSignature::InputArgs>(std::make_index_sequence<ArgCount>{});
    }

    result.CallbackCountCompare = CompareSize(CallbackCount, TOtherMethodSignature::CallbackCount);
    if (result.CallbackCountCompare == 0) {
      result.AreCallbacksMatching = MatchOutputCallbacks<typename TOtherMethodSignature::OutputCallbacks>(
          std::make_index_sequence<CallbackCount>{});
    }

    result.IsPromiseMathcing = std::is_same_v<OutputPromises, typename TOtherMethodSignature::OutputPromises>;

    result.IsSucceeded = result.IsResultMatching && result.ArgCountCompare == 0 && result.AreArgsMatching &&
        result.CallbackCountCompare == 0 && result.AreCallbacksMatching && result.IsPromiseMathcing;

    return result;
  }
};

//==============================================================================
// Module registration helpers
//==============================================================================

template <class TMethod>
struct ModuleInitMethodInfo;

template <class TModule>
struct ModuleInitMethodInfo<void (TModule::*)(ReactContext const &) noexcept> {
  using ModuleType = TModule;
  using MethodType = void (TModule::*)(ReactContext const &) noexcept;

  static InitializerDelegate GetInitializer(void *module, MethodType method) noexcept {
    return [ module = static_cast<ModuleType *>(module), method ](ReactContext const &reactContext) noexcept {
      (module->*method)(reactContext);
    };
  }
};

// ==== MakeCallbackSignatures =================================================

template <class TResult, class TOutputCallbackTuple>
struct MakeCallbackSignaturesImpl {
  using Type = std::tuple<CallbackSignature<TResult>>;
};

template <class TOutputCallbackTuple>
struct MakeCallbackSignaturesImpl<void, TOutputCallbackTuple> {
  using Type = TransformListItems<GetCallbackSignature, TOutputCallbackTuple>;
};

template <class TOutputCallbackTuple>
struct MakeCallbackSignaturesImpl<winrt::fire_and_forget, TOutputCallbackTuple> {
  using Type = TransformListItems<GetCallbackSignature, TOutputCallbackTuple>;
};

template <class TResult, class TOutputCallbackTuple>
using MakeCallbackSignatures = typename MakeCallbackSignaturesImpl<TResult, TOutputCallbackTuple>::Type;

template <class TMethodSignature, class TMethodSpecSignature>
constexpr static bool MatchMethodSignature() noexcept {
  constexpr MethodSignatureMatchResult matchResult = TMethodSignature::template Match<TMethodSpecSignature>();

  static_assert(matchResult.IsResultMatching, "Method return type is different from the method spec.");

  static_assert(matchResult.ArgCountCompare >= 0, "Method has less arguments than method spec.");
  static_assert(matchResult.ArgCountCompare <= 0, "Method has more arguments than method spec.");
  if constexpr (matchResult.ArgCountCompare == 0) {
    static_assert(matchResult.AreArgsMatching, "Method argument types are different from the method spec.");
  }

  static_assert(matchResult.CallbackCountCompare >= 0, "Method has less callbacks than method spec.");
  static_assert(matchResult.CallbackCountCompare <= 0, "Method has more callbacks than method spec.");
  if constexpr (matchResult.CallbackCountCompare == 0) {
    static_assert(matchResult.AreCallbacksMatching, "Method callback types are different from the method spec.");
  }

  static_assert(matchResult.IsPromiseMathcing, "Method Promise type is different from the method spec.");

  return matchResult.IsSucceeded;
}

template <class TSignature>
struct ModuleMethodInfoBase;

template <class TResult, class... TArgs>
struct ModuleMethodInfoBase<TResult(TArgs...) noexcept> {
  constexpr static bool IsVoidResult = IsVoidResultCheck<TResult>();
  constexpr static size_t ArgCount = sizeof...(TArgs);
  using ArgTuple = std::tuple<RemoveConstRef<TArgs>...>;
  constexpr static size_t CallbackCount = GetCallbackCount<ArgTuple>();
  constexpr static size_t PromiseCount = GetPromiseCount<ArgTuple>();
  constexpr static size_t InputArgCount = ArgCount - CallbackCount - PromiseCount;
  using InputArgTuple = TakeTupleElements<0, InputArgCount, ArgTuple>;
  using OutputCallbackTuple = TakeTupleElements<InputArgCount, CallbackCount, ArgTuple>;
  using OutputPromiseTuple = TakeTupleElements<InputArgCount, PromiseCount, ArgTuple>;

  using Signature =
      MethodSignature<void, InputArgTuple, MakeCallbackSignatures<TResult, OutputCallbackTuple>, OutputPromiseTuple>;

  constexpr static MethodReturnType GetMethodReturnType() noexcept {
    if constexpr (!IsVoidResult) {
      return MethodReturnType::Callback;
    } else if constexpr (PromiseCount == 1) {
      return MethodReturnType::Promise;
    } else if constexpr (CallbackCount == 2) {
      return MethodReturnType::TwoCallbacks;
    } else if constexpr (CallbackCount == 1) {
      return MethodReturnType::Callback;
    } else {
      return MethodReturnType::Void;
    }
  }
};

template <class TFunc>
struct ModuleMethodInfo;

// Instance asynchronous method
template <class TModule, class TResult, class... TArgs>
struct ModuleMethodInfo<TResult (TModule::*)(TArgs...) noexcept> : ModuleMethodInfoBase<TResult(TArgs...) noexcept> {
  using Super = ModuleMethodInfoBase<TResult(TArgs...) noexcept>;
  using ModuleType = TModule;
  using MethodType = TResult (TModule::*)(TArgs...) noexcept;

  template <size_t... ArgIndex, size_t... CallbackIndex, size_t... PromiseIndex>
  static MethodDelegate GetMethodDelegate(
      ModuleType *module,
      MethodType method,
      std::index_sequence<ArgIndex...>,
      std::index_sequence<CallbackIndex...>,
      std::index_sequence<PromiseIndex...>) noexcept {
    return [ module, method ](
        IJSValueReader const &argReader,
        [[maybe_unused]] IJSValueWriter const &argWriter,
        [[maybe_unused]] MethodResultCallback const &resolve,
        [[maybe_unused]] MethodResultCallback const &reject) mutable noexcept {
      typename Super::InputArgTuple inputArgs{};
      ReadArgs(argReader, std::get<ArgIndex>(inputArgs)...);
      if constexpr (!Super::IsVoidResult) {
        TResult result = (module->*method)(std::get<ArgIndex>(std::move(inputArgs))...);
        WriteArgs(argWriter, result);
        resolve(argWriter);
      } else if constexpr (Super::PromiseCount == 1) {
        auto promises = std::tuple{
            std::tuple_element_t<PromiseIndex, typename Super::OutputPromiseTuple>{argWriter, resolve, reject}...};
        (module->*method)(std::get<ArgIndex>(std::move(inputArgs))..., std::get<PromiseIndex>(std::move(promises))...);
      } else {
        // When method uses two callbacks the order of resolve and reject can be reversed.
        auto resultCallbacks = std::tuple{resolve, reject};
        auto callbacks = std::tuple{
            CallbackCreator<std::tuple_element_t<CallbackIndex, typename Super::OutputCallbackTuple>>::Create(
                argWriter, std::get<CallbackIndex>(resultCallbacks))...};
        (module->*method)(
            std::get<ArgIndex>(std::move(inputArgs))..., std::get<CallbackIndex>(std::move(callbacks))...);
      }
    };
  }

  static MethodDelegate GetMethodDelegate(void *module, MethodType method, MethodReturnType &returnType) noexcept {
    (ValidateCoroutineArg<TResult, TArgs>(), ...);
    returnType = Super::GetMethodReturnType();
    return GetMethodDelegate(
        static_cast<ModuleType *>(module),
        method,
        std::make_index_sequence<Super::InputArgCount>{},
        std::make_index_sequence<Super::CallbackCount>{},
        std::make_index_sequence<Super::PromiseCount>{});
  }

  template <class TMethodSpec>
  static constexpr bool Match() noexcept {
    // Do not move this method to the ModuleMethodInfoBase for better error reporting.
    return MatchMethodSignature<typename Super::Signature, typename TMethodSpec::Signature>();
  }
};

// Static asynchronous method
template <class TResult, class... TArgs>
struct ModuleMethodInfo<TResult (*)(TArgs...) noexcept> : ModuleMethodInfoBase<TResult(TArgs...) noexcept> {
  using Super = ModuleMethodInfoBase<TResult(TArgs...) noexcept>;
  using MethodType = TResult (*)(TArgs...) noexcept;

  template <size_t... ArgIndex, size_t... CallbackIndex, size_t... PromiseIndex>
  static MethodDelegate GetMethodDelegate(
      MethodType method,
      std::index_sequence<ArgIndex...>,
      std::index_sequence<CallbackIndex...>,
      std::index_sequence<PromiseIndex...>) noexcept {
    return [method](
        IJSValueReader const &argReader,
        [[maybe_unused]] IJSValueWriter const &argWriter,
        [[maybe_unused]] MethodResultCallback const &resolve,
        [[maybe_unused]] MethodResultCallback const &reject) mutable noexcept {
      typename Super::InputArgTuple inputArgs{};
      ReadArgs(argReader, std::get<ArgIndex>(inputArgs)...);
      if constexpr (!Super::IsVoidResult) {
        TResult result = (*method)(std::get<ArgIndex>(std::move(inputArgs))...);
        WriteArgs(argWriter, result);
        resolve(argWriter);
      } else if constexpr (Super::PromiseCount == 1) {
        auto promises = std::tuple{
            std::tuple_element_t<PromiseIndex, typename Super::OutputPromiseTuple>{argWriter, resolve, reject}...};
        (*method)(std::get<ArgIndex>(std::move(inputArgs))..., std::get<PromiseIndex>(std::move(promises))...);
      } else {
        // When method uses two callbacks the order of resolve and reject can be reversed.
        auto resultCallbacks = std::tuple{resolve, reject};
        auto callbacks = std::tuple{
            CallbackCreator<std::tuple_element_t<CallbackIndex, typename Super::OutputCallbackTuple>>::Create(
                argWriter, std::get<CallbackIndex>(resultCallbacks))...};
        (*method)(std::get<ArgIndex>(std::move(inputArgs))..., std::get<CallbackIndex>(std::move(callbacks))...);
      }
    };
  }

  static MethodDelegate GetMethodDelegate(void * /*module*/, MethodType method, MethodReturnType &returnType) noexcept {
    (ValidateCoroutineArg<TResult, TArgs>(), ...);
    returnType = Super::GetMethodReturnType();
    return GetMethodDelegate(
        method,
        std::make_index_sequence<Super::InputArgCount>{},
        std::make_index_sequence<Super::CallbackCount>{},
        std::make_index_sequence<Super::PromiseCount>{});
  }

  template <class TMethodSpec>
  static constexpr bool Match() noexcept {
    // Do not move this method to the ModuleMethodInfoBase for better error reporting.
    return MatchMethodSignature<typename Super::Signature, typename TMethodSpec::Signature>();
  }
};

template <class TSignature>
struct ModuleSyncMethodInfoBase;

template <class TResult, class... TArgs>
struct ModuleSyncMethodInfoBase<TResult(TArgs...) noexcept> {
  using ArgTuple = std::tuple<RemoveConstRef<TArgs>...>;
  using Signature = MethodSignature<TResult, ArgTuple, std::tuple<>, std::tuple<>>;
};

template <class TFunc>
struct ModuleSyncMethodInfo;

// Instance synchronous method
template <class TModule, class TResult, class... TArgs>
struct ModuleSyncMethodInfo<TResult (TModule::*)(TArgs...) noexcept>
    : ModuleSyncMethodInfoBase<TResult(TArgs...) noexcept> {
  using Super = ModuleSyncMethodInfoBase<TResult(TArgs...) noexcept>;
  using ModuleType = TModule;
  using MethodType = TResult (TModule::*)(TArgs...) noexcept;

  template <size_t... I>
  static SyncMethodDelegate GetFunc(ModuleType *module, MethodType method, std::index_sequence<I...>) noexcept {
    return [ module, method ](IJSValueReader const &argReader, IJSValueWriter const &argWriter) mutable noexcept {
      using ArgTuple = std::tuple<std::remove_reference_t<TArgs>...>;
      ArgTuple typedArgs{};
      ReadArgs(argReader, std::get<I>(typedArgs)...);
      TResult result = (module->*method)(std::get<I>(std::move(typedArgs))...);
      WriteArgs(argWriter, result);
    };
  }

  static SyncMethodDelegate GetMethodDelegate(void *module, MethodType method) noexcept {
    return GetFunc(static_cast<ModuleType *>(module), method, std::make_index_sequence<sizeof...(TArgs)>{});
  }

  template <class TMethodSpec>
  static constexpr bool Match() noexcept {
    // Do not move this method to the ModuleSyncMethodInfoBase for better error reporting.
    return MatchMethodSignature<typename Super::Signature, typename TMethodSpec::Signature>();
  }
};

// Static synchronous method
template <class TResult, class... TArgs>
struct ModuleSyncMethodInfo<TResult (*)(TArgs...) noexcept> : ModuleSyncMethodInfoBase<TResult(TArgs...) noexcept> {
  using Super = ModuleSyncMethodInfoBase<TResult(TArgs...) noexcept>;
  using MethodType = TResult (*)(TArgs...) noexcept;

  template <size_t... I>
  static SyncMethodDelegate GetFunc(MethodType method, std::index_sequence<I...>) noexcept {
    return [method](IJSValueReader const &argReader, IJSValueWriter const &argWriter) mutable noexcept {
      using ArgTuple = std::tuple<std::remove_reference_t<TArgs>...>;
      ArgTuple typedArgs{};
      ReadArgs(argReader, std::get<I>(typedArgs)...);
      TResult result = (*method)(std::get<I>(std::move(typedArgs))...);
      WriteArgs(argWriter, result);
    };
  }

  static SyncMethodDelegate GetMethodDelegate(void * /*module*/, MethodType method) noexcept {
    return GetFunc(method, std::make_index_sequence<sizeof...(TArgs)>{});
  }

  template <class TMethodSpec>
  static constexpr bool Match() noexcept {
    // Do not move this method to the ModuleSyncMethodInfoBase for better error reporting.
    return MatchMethodSignature<typename Super::Signature, typename TMethodSpec::Signature>();
  }
};

template <class TField>
struct ModuleConstFieldInfo;

template <class TModule, class TValue>
struct ModuleConstFieldInfo<TValue TModule::*> {
  using ModuleType = TModule;
  using FieldType = TValue TModule::*;

  static ConstantProviderDelegate GetConstantProvider(void *module, std::wstring_view name, FieldType field) noexcept {
    return
        [ module = static_cast<ModuleType *>(module), name, field ](IJSValueWriter const &argWriter) mutable noexcept {
      WriteProperty(argWriter, name, module->*field);
    };
  }
};

template <class TValue>
struct ModuleConstFieldInfo<TValue *> {
  using FieldType = TValue *;

  static ConstantProviderDelegate
  GetConstantProvider(void * /*module*/, std::wstring_view name, FieldType field) noexcept {
    return [ name, field ](IJSValueWriter const &argWriter) mutable noexcept {
      WriteProperty(argWriter, name, *field);
    };
  }
};

struct ReactConstantProvider {
  ReactConstantProvider(IJSValueWriter const &writer) noexcept : m_writer{writer} {}

  template <class T>
  void Add(std::wstring_view name, const T &value) noexcept {
    WriteProperty(m_writer, name, value);
  }

  IJSValueWriter const &Writer() const noexcept {
    return m_writer;
  }

 private:
  IJSValueWriter m_writer;
};

template <class TMethod>
struct ModuleConstantInfo;

template <class TModule>
struct ModuleConstantInfo<void (TModule::*)(ReactConstantProvider &) noexcept> {
  using ModuleType = TModule;
  using MethodType = void (TModule::*)(ReactConstantProvider &) noexcept;

  static ConstantProviderDelegate GetConstantProvider(void *module, MethodType method) noexcept {
    return [ module = static_cast<ModuleType *>(module), method ](IJSValueWriter const &argWriter) mutable noexcept {
      ReactConstantProvider constantProvider{argWriter};
      (module->*method)(constantProvider);
    };
  }
};

template <>
struct ModuleConstantInfo<void (*)(ReactConstantProvider &) noexcept> {
  using MethodType = void (*)(ReactConstantProvider &) noexcept;

  static ConstantProviderDelegate GetConstantProvider(void * /*module*/, MethodType method) noexcept {
    return [method](IJSValueWriter const &argWriter) mutable noexcept {
      ReactConstantProvider constantProvider{argWriter};
      (*method)(constantProvider);
    };
  }
};

template <class TField>
struct ModuleEventFieldInfo;

template <class TModule, template <class> class TFunc, class... TArgs>
struct ModuleEventFieldInfo<TFunc<void(TArgs...)> TModule::*> {
  using ModuleType = TModule;
  using EventType = TFunc<void(TArgs...)>;
  using FieldType = EventType TModule::*;

  static InitializerDelegate GetEventHandlerInitializer(
      void *module,
      FieldType field,
      std::wstring_view eventName,
      std::wstring_view eventEmitterName) noexcept {
    return [ module = static_cast<ModuleType *>(module), field, eventName, eventEmitterName ](
        IReactContext const &reactContext) noexcept {
      module->*field = [ reactContext, eventEmitterName, eventName ](TArgs... args) noexcept {
        reactContext.EmitJSEvent(
            eventEmitterName, eventName, [&args...]([[maybe_unused]] IJSValueWriter const &argWriter) noexcept {
              (void)argWriter; // [[maybe_unused]] above does not work
              (WriteValue(argWriter, args), ...);
            });
      };
    };
  }
};

template <class TField>
struct ModuleFunctionFieldInfo;

template <class TModule, template <class> class TFunc, class... TArgs>
struct ModuleFunctionFieldInfo<TFunc<void(TArgs...)> TModule::*> {
  using ModuleType = TModule;
  using FunctionType = TFunc<void(TArgs...)>;
  using FieldType = FunctionType TModule::*;

  static InitializerDelegate GetFunctionInitializer(
      void *module,
      FieldType field,
      std::wstring_view functionName,
      std::wstring_view moduleName) noexcept {
    return [ module = static_cast<ModuleType *>(module), field, functionName, moduleName ](
        IReactContext const &reactContext) noexcept {
      module->*field = [ reactContext, functionName, moduleName ](TArgs... args) noexcept {
        reactContext.CallJSFunction(moduleName, functionName, [&args...](IJSValueWriter const &argWriter) noexcept {
          WriteArgs(argWriter, args...);
        });
      };
    };
  }
};

template <int I>
using ReactAttributeId = std::integral_constant<int, I>;

template <class TModule>
struct ReactMemberInfoIterator {
  template <int StartIndex, class TVisitor>
  constexpr void ForEachMember(TVisitor &visitor) noexcept {
    ForEachMember<StartIndex>(visitor, static_cast<std::make_index_sequence<10> *>(nullptr));
  }

  template <int I, class TVisitor>
  constexpr void GetMemberInfo(TVisitor &visitor) noexcept {
    if constexpr (decltype(HasGetReactMemberAttribute(visitor, ReactAttributeId<I>{}))::value) {
      TModule::template GetReactMemberAttribute<TModule>(visitor, ReactAttributeId<I>{});
    }
  }

 private:
  template <class TVisitor, int I>
  static auto HasGetReactMemberAttribute(TVisitor &visitor, ReactAttributeId<I> id)
      -> decltype(TModule::template GetReactMemberAttribute<TModule>(visitor, id), std::true_type{});
  static auto HasGetReactMemberAttribute(...) -> std::false_type;

  // Visit members in groups of 10 to avoid deep recursion.
  template <size_t StartIndex, class TVisitor, size_t... I>
  constexpr void ForEachMember(TVisitor &visitor, std::index_sequence<I...> *) noexcept {
    if constexpr (decltype(HasGetReactMemberAttribute(visitor, ReactAttributeId<StartIndex>{}))::value) {
      (GetMemberInfo<StartIndex + I>(visitor), ...);
      ForEachMember<StartIndex + sizeof...(I)>(visitor, static_cast<std::make_index_sequence<10> *>(nullptr));
    }
  }
};

enum class ReactMemberKind {
  InitMethod,
  AsyncMethod,
  SyncMethod,
  ConstantMethod,
  ConstantField,
  EventField,
  FunctionField,
};

template <ReactMemberKind MemberKind>
struct ReactMemberAttribute : std::integral_constant<ReactMemberKind, MemberKind> {
  constexpr ReactMemberAttribute(std::wstring_view jsMemberName, std::wstring_view jsModuleName) noexcept
      : JSMemberName{jsMemberName}, JSModuleName{jsModuleName} {}

  std::wstring_view JSMemberName;
  std::wstring_view JSModuleName;
};

using ReactInitMethodAttribute = ReactMemberAttribute<ReactMemberKind::InitMethod>;
using ReactAsyncMethodAttribute = ReactMemberAttribute<ReactMemberKind::AsyncMethod>;
using ReactSyncMethodAttribute = ReactMemberAttribute<ReactMemberKind::SyncMethod>;
using ReactConstantMethodAttribute = ReactMemberAttribute<ReactMemberKind::ConstantMethod>;
using ReactConstantFieldAttribute = ReactMemberAttribute<ReactMemberKind::ConstantField>;
using ReactEventFieldAttribute = ReactMemberAttribute<ReactMemberKind::EventField>;
using ReactFunctionFieldAttribute = ReactMemberAttribute<ReactMemberKind::FunctionField>;

template <class T>
struct IsReactMemberAttribute : std::false_type {};
template <ReactMemberKind MemberKind>
struct IsReactMemberAttribute<ReactMemberAttribute<MemberKind>> : std::true_type {};

template <class TModule>
struct ReactModuleBuilder {
  ReactModuleBuilder(TModule *module, IReactModuleBuilder const &moduleBuilder) noexcept
      : m_module{module}, m_moduleBuilder{moduleBuilder} {}

  template <int I>
  void RegisterModule(std::wstring_view moduleName, std::wstring_view eventEmitterName, ReactAttributeId<I>) noexcept {
    RegisterModuleName(moduleName, eventEmitterName);
    ReactMemberInfoIterator<TModule>{}.template ForEachMember<I + 1>(*this);
  }

  void RegisterModuleName(std::wstring_view moduleName, std::wstring_view eventEmitterName = L"") noexcept {
    m_moduleName = moduleName;
    m_eventEmitterName = !eventEmitterName.empty() ? eventEmitterName : L"RCTDeviceEventEmitter";
  }

  void CompleteRegistration() noexcept {
    // Add REACT_INIT initializers after REACT_EVENT and REACT_FUNCTION initializers.
    // This way REACT_INIT method is invoked after event and function fields are initialized.
    for (auto &initializer : m_initializers) {
      m_moduleBuilder.AddInitializer(initializer);
    }
  }

  template <class TMember, class TAttribute, int I>
  void Visit(
      [[maybe_unused]] TMember member,
      ReactAttributeId<I> /*attributeId*/,
      [[maybe_unused]] TAttribute attributeInfo) noexcept {
    if constexpr (std::is_same_v<TAttribute, ReactInitMethodAttribute>) {
      RegisterInitMethod(member);
    } else if constexpr (std::is_same_v<TAttribute, ReactAsyncMethodAttribute>) {
      RegisterMethod(member, attributeInfo.JSMemberName);
    } else if constexpr (std::is_same_v<TAttribute, ReactSyncMethodAttribute>) {
      RegisterSyncMethod(member, attributeInfo.JSMemberName);
    } else if constexpr (std::is_same_v<TAttribute, ReactConstantMethodAttribute>) {
      RegisterConstantMethod(member);
    } else if constexpr (std::is_same_v<TAttribute, ReactConstantFieldAttribute>) {
      RegisterConstantField(member, attributeInfo.JSMemberName);
    } else if constexpr (std::is_same_v<TAttribute, ReactEventFieldAttribute>) {
      RegisterEventField(member, attributeInfo.JSMemberName, attributeInfo.JSModuleName);
    } else if constexpr (std::is_same_v<TAttribute, ReactFunctionFieldAttribute>) {
      RegisterFunctionField(member, attributeInfo.JSMemberName, attributeInfo.JSModuleName);
    }
  }

  template <class TMethod>
  void RegisterInitMethod(TMethod method) noexcept {
    auto initializer = ModuleInitMethodInfo<TMethod>::GetInitializer(m_module, method);
    m_initializers.push_back(std::move(initializer));
  }

  template <class TMethod>
  void RegisterMethod(TMethod method, std::wstring_view name) noexcept {
    MethodReturnType returnType;
    auto methodDelegate = ModuleMethodInfo<TMethod>::GetMethodDelegate(m_module, method, /*out*/ returnType);
    m_moduleBuilder.AddMethod(name, returnType, methodDelegate);
  }

  template <class TMethod>
  void RegisterSyncMethod(TMethod method, std::wstring_view name) noexcept {
    auto syncMethodDelegate = ModuleSyncMethodInfo<TMethod>::GetMethodDelegate(m_module, method);
    m_moduleBuilder.AddSyncMethod(name, syncMethodDelegate);
  }

  template <class TMethod>
  void RegisterConstantMethod(TMethod method) noexcept {
    auto constantProvider = ModuleConstantInfo<TMethod>::GetConstantProvider(m_module, method);
    m_moduleBuilder.AddConstantProvider(constantProvider);
  }

  template <class TField>
  void RegisterConstantField(TField field, std::wstring_view name) noexcept {
    auto constantProvider = ModuleConstFieldInfo<TField>::GetConstantProvider(m_module, name, field);
    m_moduleBuilder.AddConstantProvider(constantProvider);
  }

  template <class TField>
  void
  RegisterEventField(TField field, std::wstring_view eventName, std::wstring_view eventEmitterName = L"") noexcept {
    auto eventHandlerInitializer = ModuleEventFieldInfo<TField>::GetEventHandlerInitializer(
        m_module, field, eventName, !eventEmitterName.empty() ? eventEmitterName : m_eventEmitterName);
    m_moduleBuilder.AddInitializer(eventHandlerInitializer);
  }

  template <class TField>
  void RegisterFunctionField(TField field, std::wstring_view name, std::wstring_view moduleName = L"") noexcept {
    auto functionInitializer = ModuleFunctionFieldInfo<TField>::GetFunctionInitializer(
        m_module, field, name, !moduleName.empty() ? moduleName : m_moduleName);
    m_moduleBuilder.AddInitializer(functionInitializer);
  }

 private:
  void *m_module;
  IReactModuleBuilder m_moduleBuilder;
  std::wstring_view m_moduleName{L""};
  std::wstring_view m_eventEmitterName{L""};
  std::vector<InitializerDelegate> m_initializers;
};

struct VerificationResult {
  size_t MethodNameCount{0};
  size_t MatchCount{0};
  int MatchedMemberId{0};
};

template <class TModule>
struct ReactModuleVerifier {
  static constexpr VerificationResult VerifyMember(std::wstring_view name, ReactMemberKind memberKind) noexcept {
    ReactModuleVerifier verifier{name, memberKind};
    GetReactModuleInfo(static_cast<TModule *>(nullptr), verifier);
    return verifier.m_result;
  }

  constexpr ReactModuleVerifier(std::wstring_view memberName, ReactMemberKind memberKind) noexcept
      : m_memberName{memberName}, m_memberKind{memberKind} {}

  template <int I>
  constexpr void RegisterModule(std::wstring_view /*_*/, std::wstring_view /*_*/, ReactAttributeId<I>) noexcept {
    ReactMemberInfoIterator<TModule>{}.template ForEachMember<I + 1>(*this);
  }

  template <class TMember, class TAttribute, int I>
  constexpr void Visit(
      TMember /*member*/,
      [[maybe_unused]] ReactAttributeId<I> attributeId,
      [[maybe_unused]] TAttribute attributeInfo) noexcept {
    if constexpr (IsReactMemberAttribute<TAttribute>::value) {
      if (attributeInfo.JSMemberName == m_memberName) {
        if (IsMethod(attributeInfo())) {
          ++m_result.MethodNameCount;
        }

        if (attributeInfo() == m_memberKind) {
          m_result.MatchedMemberId = attributeId();
          ++m_result.MatchCount;
        }
      }
    }
  }

  static bool constexpr IsMethod(ReactMemberKind memberKind) noexcept {
    return memberKind == ReactMemberKind::AsyncMethod || memberKind == ReactMemberKind::SyncMethod;
  }

 private:
  std::wstring_view m_memberName;
  ReactMemberKind m_memberKind;
  VerificationResult m_result;
};

template <class TModule, int I, class TMethodSpec>
struct ReactMethodVerifier {
  static constexpr bool Verify() noexcept {
    ReactMethodVerifier verifier{};
    ReactMemberInfoIterator<TModule>{}.GetMemberInfo<I>(verifier);
    return verifier.m_result;
  }

  template <class TMember, class TAttribute, int I2>
  constexpr void
  Visit([[maybe_unused]] TMember member, ReactAttributeId<I2> /*attributeId*/, TAttribute /*attributeInfo*/) noexcept {
    m_result = ModuleMethodInfo<TMember>::template Match<TMethodSpec>();
  }

 private:
  bool m_result{false};
};

template <class TModule, int I, class TMethodSpec>
struct ReactSyncMethodVerifier {
  static constexpr bool Verify() noexcept {
    ReactSyncMethodVerifier verifier{};
    ReactMemberInfoIterator<TModule>{}.GetMemberInfo<I>(verifier);
    return verifier.m_result;
  }

  template <class TMember, class TAttribute, int I2>
  constexpr void
  Visit([[maybe_unused]] TMember member, ReactAttributeId<I2> /*attributeId*/, TAttribute /*attributeInfo*/) noexcept {
    m_result = ModuleSyncMethodInfo<TMember>::template Match<TMethodSpec>();
  }

 private:
  bool m_result{false};
};

struct TurboModuleSpec {
  struct BaseMethodSpec {
    constexpr BaseMethodSpec(int index, std::wstring_view name) : Index{index}, Name{name} {}

    int Index;
    std::wstring_view Name;
  };

  template <class TSignature>
  struct Method : BaseMethodSpec {
    using BaseMethodSpec::BaseMethodSpec;
    using Signature = typename ModuleMethodInfoBase<TSignature>::Signature;
    static constexpr bool IsSynchronous = false;
  };

  template <class TSignature>
  struct SyncMethod : BaseMethodSpec {
    using BaseMethodSpec::BaseMethodSpec;
    using Signature = typename ModuleSyncMethodInfoBase<TSignature>::Signature;
    static constexpr bool IsSynchronous = true;
  };

  template <class... TArgs>
  using Callback = std::function<void(TArgs...)>;

  template <class TArg>
  using Promise = ReactPromise<TArg>;

  struct MethodCheckResult {
    bool IsUniqueName{false};
    bool IsMethodFound{false};
    bool IsSignatureMatching{true};
  };

  template <class TModule, class TModuleSpec, size_t I>
  static constexpr MethodCheckResult CheckMethod() noexcept {
    constexpr VerificationResult verificationResult = ReactModuleVerifier<TModule>::VerifyMember(
        std::get<I>(TModuleSpec::methods).Name,
        std::get<I>(TModuleSpec::methods).IsSynchronous ? ReactMemberKind::SyncMethod : ReactMemberKind::AsyncMethod);
    MethodCheckResult result{};
    result.IsUniqueName = verificationResult.MethodNameCount <= 1;
    result.IsMethodFound = verificationResult.MatchCount == 1;
    if constexpr (verificationResult.MatchCount == 1) {
      if constexpr (std::get<I>(TModuleSpec::methods).IsSynchronous) {
        result.IsSignatureMatching = ReactSyncMethodVerifier<
            TModule,
            verificationResult.MatchedMemberId,
            RemoveConstRef<decltype(std::get<I>(TModuleSpec::methods))>>::Verify();
      } else {
        result.IsSignatureMatching = ReactMethodVerifier<
            TModule,
            verificationResult.MatchedMemberId,
            RemoveConstRef<decltype(std::get<I>(TModuleSpec::methods))>>::Verify();
      }
    }

    return result;
  }

  template <class TModule, class TModuleSpec, size_t... I>
  static constexpr auto CheckMethodsHelper(std::index_sequence<I...>) noexcept {
    return std::array<MethodCheckResult, sizeof...(I)>{CheckMethod<TModule, TModuleSpec, I>()...};
  }

  template <class TModule, class TModuleSpec>
  static constexpr auto CheckMethods() noexcept {
    return CheckMethodsHelper<TModule, TModuleSpec>(
        std::make_index_sequence<std::tuple_size_v<decltype(TModuleSpec::methods)>>{});
  }
};

// The default factory for the TModule.
// It wraps up the TModule into a ReactNonAbiValue to be passed through the ABI boundary.
template <class TModule>
inline std::tuple<winrt::Windows::Foundation::IInspectable, TModule *> MakeDefaultReactModuleWrapper() noexcept {
  ReactNonAbiValue<TModule> moduleWrapper{std::in_place};
  TModule *module = moduleWrapper.GetPtr();
  return std::tuple<winrt::Windows::Foundation::IInspectable, TModule *>{std::move(moduleWrapper), module};
}

// The default factory for TModule inherited from enable_shared_from_this<T>.
// It wraps up the TModule into an  std::shared_ptr before giving it to ReactNonAbiValue.
template <class TModule>
inline std::tuple<winrt::Windows::Foundation::IInspectable, TModule *>
MakeDefaultSharedPtrReactModuleWrapper() noexcept {
  ReactNonAbiValue<std::shared_ptr<TModule>> moduleWrapper{std::in_place, std::make_shared<TModule>()};
  TModule *module = moduleWrapper.GetPtr()->get();
  return std::tuple<winrt::Windows::Foundation::IInspectable, TModule *>{std::move(moduleWrapper), module};
}

namespace Internal {
// Internal functions to test if type is inherited from std::enable_shared_from_this<T>.
template <class T>
std::true_type IsBaseOfTemplateTest(std::enable_shared_from_this<T> *);
std::false_type IsBaseOfTemplateTest(...);
} // namespace Internal

// Check if type T is inherited from std::enable_shared_form_this<U>.
// We support the scenario when the T and U are different types.
template <class T>
using IsEnabledSharedFromThisT = decltype(Internal::IsBaseOfTemplateTest((T *)nullptr));
template <class T>
inline constexpr bool IsEnabledSharedFromThisV = IsEnabledSharedFromThisT<T>::value;

// Default implementation of factory getter for a TModule type **not** inherited from std::enable_shared_form_this.
// For the custom implementation define GetReactModuleFactory with the last parameter to be 'int' (not 'int *').
template <class TModule, std::enable_if_t<!IsEnabledSharedFromThisV<TModule>, int> = 0>
inline constexpr auto GetReactModuleFactory(TModule * /*moduleNullPtr*/, int * /*useDefault*/) noexcept {
  return &MakeDefaultReactModuleWrapper<TModule>;
}

// Default implementation of factory getter for a TModule type inherited from std::enable_shared_form_this.
// For the custom implementation define GetReactModuleFactory with the last parameter to be 'int' (not 'int *').
template <class TModule, std::enable_if_t<IsEnabledSharedFromThisV<TModule>, int> = 0>
inline constexpr auto GetReactModuleFactory(TModule * /*moduleNullPtr*/, int * /*useDefault*/) noexcept {
  return &MakeDefaultSharedPtrReactModuleWrapper<TModule>;
}

// Type traits for TModule. It defines a factory to create the module and its ABI-safe wrapper.
template <class TModule>
struct ReactModuleTraits {
  using FactoryType = std::tuple<winrt::Windows::Foundation::IInspectable, TModule *>() noexcept;
  static constexpr FactoryType *Factory = GetReactModuleFactory((TModule *)nullptr, 0);
};

// Create a module provider for TModule type.
template <class TModule>
inline ReactModuleProvider MakeModuleProvider() noexcept {
  return [](IReactModuleBuilder const &moduleBuilder) noexcept {
    auto [moduleWrapper, module] = ReactModuleTraits<TModule>::Factory();
    ReactModuleBuilder builder{module, moduleBuilder};
    GetReactModuleInfo(module, builder);
    builder.CompleteRegistration();
    return moduleWrapper;
  };
}

// Create a module provider for TModule type that satisfies the TModuleSpec.
template <class TModule, class TModuleSpec>
inline ReactModuleProvider MakeTurboModuleProvider() noexcept {
  TModuleSpec::template ValidateModule<TModule>();
  return MakeModuleProvider<TModule>();
}

} // namespace winrt::Microsoft::ReactNative

namespace React {
using namespace winrt::Microsoft::ReactNative;
}
