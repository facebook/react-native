#pragma once

#include <string>
#include <locale>
#include <codecvt>
#include <cwchar>
#include <utility>
#include <memory>
#include <map>
#include <vector>
#include <type_traits>
#include <cmath>
#include <functional>
#include <optional>
#include <folly/Hash.h>

#include "Crash.h"

inline int64_t _wcstoi64(const wchar_t* str, wchar_t** str_end, int base)
{
  return std::wcstol(str, str_end, base);
}

namespace std
{

inline std::wstring operator+(const wchar_t* a, const std::wstring_view& b)
{
  return a + std::wstring(b.cbegin(), b.cend());
}

}

namespace winrt
{

using hstring = std::wstring;

inline hstring to_hstring(const std::string& s)
{
  return std::wstring_convert<std::codecvt_utf8<wchar_t>, wchar_t>().from_bytes(s);
}

inline hstring to_hstring(const char* s)
{
  return std::wstring_convert<std::codecvt_utf8<wchar_t>, wchar_t>().from_bytes(s);
}

inline hstring to_hstring(const std::string_view& w)
{
  return to_hstring(std::string(w.cbegin(), w.cend()));
}

inline hstring to_hstring(const std::wstring& s)
{
  return s;
}

inline hstring to_hstring(const wchar_t* s)
{
  return s;
}

inline hstring to_hstring(const std::wstring_view& w)
{
  return to_hstring(std::wstring(w.cbegin(), w.cend()));
}

inline std::string to_string(const hstring& s)
{
  return std::wstring_convert<std::codecvt_utf8<wchar_t>, wchar_t>().to_bytes(s);
}

template<typename TClass, typename TInterface>
struct implements : TInterface::Itf
{
  using InterfaceHolder = TInterface;
};

template<typename TClass, typename ...TArgs>
typename TClass::InterfaceHolder make(TArgs&& ...args)
{
  using TIH = typename TClass::InterfaceHolder;
  auto obj = std::make_shared<TClass>(std::forward<TArgs>(args)...);
  std::shared_ptr<typename TIH::Itf> ptr(obj);
  return TIH(obj);
}

template<typename TClass, typename TInterface>
TClass* get_self(const TInterface& itf)
{
  return dynamic_cast<TClass*>(itf.get_itf());
}

struct take_ownership_from_abi_t{};
inline const take_ownership_from_abi_t take_ownership_from_abi;

struct auto_revoke_t{};
inline const auto_revoke_t auto_revoke;

struct fire_and_forget{};

}

namespace winrt::param
{

using hstring = winrt::hstring;

}

#define WINRT_TO_MAC_MAKE_WINRT_INTERFACE(NAME)\
  NAME() = default;\
  NAME(std::nullptr_t){}\
  NAME(const NAME&) = default;\
  NAME(NAME&&) = default;\
  NAME& operator=(const NAME&) = default;\
  NAME& operator=(NAME&&) = default;\
  NAME(const std::shared_ptr<Itf>& itf):IInspectable(itf){}\
private:\
  template<typename TClass, typename TInterface>\
  friend TClass* ::winrt::get_self(const TInterface& itf);\
  Itf* get_itf() const noexcept { return static_cast<Itf*>(m_itf.get()); }\

namespace winrt::Windows::Foundation
{

struct IInspectable
{
  struct Itf
  {
    virtual ~Itf() = default;
  };
  
  IInspectable() noexcept = default;
  IInspectable(std::nullptr_t) noexcept {}
  IInspectable(const IInspectable&) noexcept = default;
  IInspectable(IInspectable&&) noexcept = default;
  IInspectable& operator=(const IInspectable&) noexcept = default;
  IInspectable& operator=(IInspectable&&) noexcept = default;
  operator bool() const noexcept { return m_itf.get() != nullptr; }
  
  IInspectable(void*, take_ownership_from_abi_t) noexcept
  {
    VerifyElseCrash(false);
  }
  
  template<
    typename TInterface,
    typename = std::enable_if_t<std::is_base_of_v<IInspectable, TInterface>>
  >
  TInterface try_as() const noexcept
  {
    return std::dynamic_pointer_cast<typename TInterface::Itf>(m_itf);
  }
  
  template<
    typename TInterface_Itf,
    typename = std::enable_if_t<std::is_base_of_v<IInspectable::Itf, TInterface_Itf>>
  >
  TInterface_Itf* try_as() const noexcept
  {
    return std::dynamic_pointer_cast<TInterface_Itf>(m_itf).get();
  }
  
  template<typename TInterface>
  auto as()const noexcept
  {
    auto result = try_as<TInterface>();
    VerifyElseCrash(result);
    return result;
  }
  
protected:
  std::shared_ptr<Itf> m_itf;
  
  IInspectable(const std::shared_ptr<Itf>& itf) noexcept
    : m_itf(itf)
  {
  }
};

}
