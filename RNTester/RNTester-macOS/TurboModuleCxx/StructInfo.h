// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#ifndef MICROSOFT_REACTNATIVE_STRUCTINFO
#define MICROSOFT_REACTNATIVE_STRUCTINFO

#include "winrt/Microsoft.ReactNative.h"

// We implement optional parameter macros based on the StackOverflow discussion:
// https://stackoverflow.com/questions/3046889/optional-parameters-with-c-macros
// Please refer to it if you want to understand it works.
#define INTERNAL_REACT_GET_ARG_3(arg1, arg2, arg3, ...) arg3
#define INTERNAL_REACT_RECOMPOSER_3(argsWithParentheses) INTERNAL_REACT_GET_ARG_3 argsWithParentheses

//
// These macros are internal implementation details for REACT_STRUCT and REACT_FIELD macros.
// Please skip below to read about REACT_STRUCT and REACT_FIELD macros.
//

#define INTERNAL_REACT_STRUCT(structType)                                                  \
  struct structType;                                                                       \
  inline winrt::Microsoft::ReactNative::FieldMap GetStructInfo(structType *) noexcept {    \
    winrt::Microsoft::ReactNative::FieldMap fieldMap{};                                    \
    winrt::Microsoft::ReactNative::CollectStructFields<structType, __COUNTER__>(fieldMap); \
    return fieldMap;                                                                       \
  }

#define INTERNAL_REACT_FIELD_2_ARGS(field, fieldName)                      \
  template <class TClass>                                                  \
  static void RegisterField(                                               \
      winrt::Microsoft::ReactNative::FieldMap &fieldMap,                   \
      winrt::Microsoft::ReactNative::ReactFieldId<__COUNTER__>) noexcept { \
    fieldMap.emplace(fieldName, &TClass::field);                           \
  }

#define INTERNAL_REACT_FIELD_1_ARG(field) INTERNAL_REACT_FIELD_2_ARGS(field, L## #field)
#define INTERNAL_REACT_FIELD(...) \
  INTERNAL_REACT_RECOMPOSER_3((__VA_ARGS__, INTERNAL_REACT_FIELD_2_ARGS, INTERNAL_REACT_FIELD_1_ARG, ))

// REACT_STRUCT(structType)
// Arguments:
// - structType (required) - the struct name the macro is attached to.
//
// REACT_STRUCT annotates a C++ struct that then can be serialized and deserialized with IJSValueReader and
// IJSValueWriter. With the help of REACT_FIELD it generates FieldMap associated with the struct which then used by
// ReactValue and ReactWrite methods.
#define REACT_STRUCT(structType) INTERNAL_REACT_STRUCT(structType)

// REACT_FIELD(field, [opt] fieldName)
// Arguments:
// - field (required) - the field the macro is attached to.
// - fieldName (optional) - the field name visible to JavaScript. Default is the field name.
//
// REACT_FIELD annotates a field to be added to FieldMap which then used by ReactValue and ReactWrite methods.
#define REACT_FIELD(/* field, [opt] fieldName */...) INTERNAL_REACT_FIELD(__VA_ARGS__)(__VA_ARGS__)

namespace winrt::Microsoft::ReactNative {

struct FieldInfo;
using FieldMap = std::map<std::wstring, FieldInfo, std::less<>>;
using FieldReaderType =
    void (*)(IJSValueReader const & /*reader*/, void * /*obj*/, const uintptr_t * /*fieldPtrStore*/) noexcept;
using FieldWriterType =
    void (*)(IJSValueWriter const & /*writer*/, const void * /*obj*/, const uintptr_t * /*fieldPtrStore*/) noexcept;

template <class T>
void GetStructInfo(T *) {}

template <class TClass, class TValue>
void FieldReader(IJSValueReader const &reader, void *obj, const uintptr_t *fieldPtrStore) noexcept;

template <class TClass, class TValue>
void FieldWriter(IJSValueWriter const &writer, const void *obj, const uintptr_t *fieldPtrStore) noexcept;

struct FieldInfo {
  template <class TClass, class TValue>
  FieldInfo(TValue TClass::*fieldPtr) noexcept
      : m_fieldReader{FieldReader<TClass, TValue>},
        m_fieldWriter{FieldWriter<TClass, TValue>},
        m_fieldPtrStore{*reinterpret_cast<uintptr_t *>(&fieldPtr)} {
    static_assert(sizeof(m_fieldPtrStore) >= sizeof(fieldPtr));
  }

  void ReadField(IJSValueReader const &reader, void *obj) const noexcept {
    m_fieldReader(reader, obj, &m_fieldPtrStore);
  }

  void WriteField(IJSValueWriter const &writer, const void *obj) const noexcept {
    m_fieldWriter(writer, obj, &m_fieldPtrStore);
  }

 private:
  FieldReaderType m_fieldReader;
  FieldWriterType m_fieldWriter;
  const uintptr_t m_fieldPtrStore;
};

template <class TClass, class TValue>
void FieldReader(IJSValueReader const &reader, void *obj, const uintptr_t *fieldPtrStore) noexcept {
  using FieldPtrType = TValue TClass::*;
  ReadValue(reader, /*out*/ static_cast<TClass *>(obj)->*(*reinterpret_cast<const FieldPtrType *>(fieldPtrStore)));
}

template <class TClass, class TValue>
void FieldWriter(IJSValueWriter const &writer, const void *obj, const uintptr_t *fieldPtrStore) noexcept {
  using FieldPtrType = TValue TClass::*;
  WriteValue(writer, static_cast<const TClass *>(obj)->*(*reinterpret_cast<const FieldPtrType *>(fieldPtrStore)));
}

template <class T>
struct StructInfo {
  static const FieldMap FieldMap;
};

template <class T>
/*static*/ const FieldMap StructInfo<T>::FieldMap = GetStructInfo(static_cast<T *>(nullptr));

template <int I>
using ReactFieldId = std::integral_constant<int, I>;

template <class TClass, int I>
auto HasRegisterField(FieldMap &fieldMap, ReactFieldId<I> id)
    -> decltype(TClass::template RegisterField<TClass>(fieldMap, id), std::true_type{});
template <class TClass>
auto HasRegisterField(...) -> std::false_type;

template <class TClass, int I>
void CollectStructFields(FieldMap &fieldMap) noexcept {
  if constexpr (decltype(HasRegisterField<TClass>(fieldMap, ReactFieldId<I + 1>{}))::value) {
    TClass::template RegisterField<TClass>(fieldMap, ReactFieldId<I + 1>{});
    CollectStructFields<TClass, I + 1>(fieldMap);
  }
}

} // namespace winrt::Microsoft::ReactNative

#endif // MICROSOFT_REACTNATIVE_STRUCTINFO
