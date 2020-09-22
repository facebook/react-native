// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#include "pch.h"
#include "ReactPromise.h"
#include "JSValueWriter.h"

namespace winrt::Microsoft::ReactNative {

static const char *ErrorDefaultCode = "EUNSPECIFIED";
static const char *ErrorDefaultMessage = "Error not specified.";

// Keys for m_reject's Error object
static const char *ErrorMapKeyCode = "code";
static const char *ErrorMapKeyMessage = "message";
static const char *ErrorMapKeyUserInfo = "userInfo";

ReactPromiseBase::ReactPromiseBase(
    IJSValueWriter const &writer,
    MethodResultCallback const &resolve,
    MethodResultCallback const &reject) noexcept
    : m_state{new std::atomic<State>{State::Pending}}, m_writer{writer}, m_resolve{resolve}, m_reject{reject} {}

ReactPromiseBase::~ReactPromiseBase() noexcept {
  if (m_state.use_count() == 1) {
    Reject(L"Promise destroyed.");
  }
}

// Reject the ReactPromise and report an error.
void ReactPromiseBase::Reject(ReactError const &error) const noexcept {
  if (TrySetState(State::Rejected)) {
    m_writer.WriteArrayBegin();
    m_writer.WriteObjectBegin();

    if (!error.Code.empty()) {
      WriteProperty(m_writer, ErrorMapKeyCode, error.Code);
    } else {
      WriteProperty(m_writer, ErrorMapKeyCode, ErrorDefaultCode);
    }

    if (!error.Message.empty()) {
      WriteProperty(m_writer, ErrorMapKeyMessage, error.Message);
    } else {
      WriteProperty(m_writer, ErrorMapKeyMessage, ErrorDefaultMessage);
    }

    // For consistency with iOS ensure userInfo key exists, even if we null it.
    // iOS: /React/Base/RCTUtils.m -> RCTJSErrorFromCodeMessageAndNSError
    WriteProperty(m_writer, ErrorMapKeyUserInfo, error.UserInfo);

    m_writer.WriteObjectEnd();
    m_writer.WriteArrayEnd();
    m_reject(m_writer);
  }
}

void ReactPromiseBase::Reject(char const *errorMessage) const noexcept {
  if (TrySetState(State::Rejected)) {
    m_writer.WriteArrayBegin();
    m_writer.WriteObjectBegin();

    WriteProperty(m_writer, ErrorMapKeyCode, ErrorDefaultCode);
    WriteProperty(m_writer, ErrorMapKeyMessage, errorMessage);

    // For consistency with iOS ensure userInfo key exists, even if we null it.
    // iOS: /React/Base/RCTUtils.m -> RCTJSErrorFromCodeMessageAndNSError
    WriteProperty(m_writer, ErrorMapKeyUserInfo, nullptr);

    m_writer.WriteObjectEnd();
    m_writer.WriteArrayEnd();
    m_reject(m_writer);
  }
}

void ReactPromiseBase::Reject(wchar_t const *errorMessage) const noexcept {
  if (TrySetState(State::Rejected)) {
    m_writer.WriteArrayBegin();
    m_writer.WriteObjectBegin();

    WriteProperty(m_writer, ErrorMapKeyCode, ErrorDefaultCode);
    WriteProperty(m_writer, ErrorMapKeyMessage, errorMessage);

    // For consistency with iOS ensure userInfo key exists, even if we null it.
    // iOS: /React/Base/RCTUtils.m -> RCTJSErrorFromCodeMessageAndNSError
    WriteProperty(m_writer, ErrorMapKeyUserInfo, nullptr);

    m_writer.WriteObjectEnd();
    m_writer.WriteArrayEnd();
    m_reject(m_writer);
  }
}

bool ReactPromiseBase::TrySetState(State newState) const noexcept {
  auto state = m_state->load(std::memory_order_relaxed);
  while (state == State::Pending) {
    if (m_state->compare_exchange_weak(state, newState, std::memory_order_release, std::memory_order_relaxed)) {
      return true;
    }
  }

  return false;
}

// Successfully resolve the ReactPromise<void>.
void ReactPromise<void>::Resolve() const noexcept {
  if (TrySetState(State::Resolved) && m_resolve) {
    WriteArgs(m_writer, nullptr);
    m_resolve(m_writer);
  }
}

} // namespace winrt::Microsoft::ReactNative
