// Copyright 2004-present Facebook. All Rights Reserved.

#ifndef FBXPLATMODULE
#define FBXPLATMODULE

#include <folly/dynamic.h>

#include <functional>

#include <map>
#include <tuple>
#include <vector>

using namespace std::placeholders;

namespace facebook { namespace react {
  class Instance;
}}

namespace facebook { namespace xplat { namespace module {

/**
 * Base class for Catalyst native modules whose implementations are
 * written in C++.  Native methods are represented by instances of the
 * Method struct.  Generally, a derived class will manage an instance
 * which represents the data for the module, and non-Catalyst-specific
 * methods can be wrapped in lambdas which convert between
 * folly::dynamic and native C++ objects.  The Callback arguments will
 * pass through to js functions passed to the analogous javascript
 * methods.  At most two callbacks will be converted.  Results should
 * be passed to the first callback, and errors to the second callback.
 * Exceptions thrown by a method will be converted to platform
 * exceptions, and handled however they are handled on that platform.
 * (TODO mhorowitz #7128529: this exception behavior is not yet
 * implemented.)
 *
 * There are two sets of constructors here.  The first set initializes
 * a Method using a name and anything convertible to a std::function.
 * This is most useful for registering a lambda as a RN method.  There
 * are overloads to support functions which take no arguments,
 * arguments only, and zero, one, or two callbacks.
 *
 * The second set of methods is similar, but instead of taking a
 * function, takes the method name, an object, and a pointer to a
 * method on that object.
 */

class CxxModule {
  class AsyncTagType {};
  class SyncTagType {};

public:
  typedef std::function<std::unique_ptr<CxxModule>()> Provider;

  typedef std::function<void(std::vector<folly::dynamic>)> Callback;

  constexpr static AsyncTagType AsyncTag = AsyncTagType();
  constexpr static SyncTagType SyncTag = SyncTagType();

  struct Method {
    std::string name;

    size_t callbacks;
    std::function<void(folly::dynamic, Callback, Callback)> func;

    std::function<folly::dynamic(folly::dynamic)> syncFunc;

    // std::function/lambda ctors

    Method(std::string aname,
           std::function<void()>&& afunc)
      : name(std::move(aname))
      , callbacks(0)
      , func(std::bind(std::move(afunc))) {}

    Method(std::string aname,
           std::function<void(folly::dynamic)>&& afunc)
      : name(std::move(aname))
      , callbacks(0)
      , func(std::bind(std::move(afunc), _1)) {}

    Method(std::string aname,
           std::function<void(folly::dynamic, Callback)>&& afunc)
      : name(std::move(aname))
      , callbacks(1)
      , func(std::bind(std::move(afunc), _1, _2)) {}

    Method(std::string aname,
           std::function<void(folly::dynamic, Callback, Callback)>&& afunc)
      : name(std::move(aname))
      , callbacks(2)
      , func(std::move(afunc)) {}

    // method pointer ctors

    template <typename T>
    Method(std::string aname, T* t, void (T::*method)())
      : name(std::move(aname))
      , callbacks(0)
      , func(std::bind(method, t)) {}

    template <typename T>
    Method(std::string aname, T* t, void (T::*method)(folly::dynamic))
      : name(std::move(aname))
      , callbacks(0)
      , func(std::bind(method, t, _1)) {}

    template <typename T>
    Method(std::string aname, T* t, void (T::*method)(folly::dynamic, Callback))
      : name(std::move(aname))
      , callbacks(1)
      , func(std::bind(method, t, _1, _2)) {}

    template <typename T>
    Method(std::string aname, T* t, void (T::*method)(folly::dynamic, Callback, Callback))
      : name(std::move(aname))
      , callbacks(2)
      , func(std::bind(method, t, _1, _2, _3)) {}

    // sync std::function/lambda ctors

    // Overloads for functions returning void give ambiguity errors.
    // I am not sure if this is a runtime/compiler bug, or a
    // limitation I do not understand.

    Method(std::string aname,
           std::function<folly::dynamic()>&& afunc,
           SyncTagType)
      : name(std::move(aname))
      , callbacks(0)
      , syncFunc([afunc=std::move(afunc)] (const folly::dynamic&)
                 { return afunc(); })
    {}

    Method(std::string aname,
           std::function<folly::dynamic(folly::dynamic)>&& afunc,
           SyncTagType)
      : name(std::move(aname))
      , callbacks(0)
      , syncFunc(std::move(afunc))
      {}
  };

  /**
   * This may block, if necessary to complete cleanup before the
   * object is destroyed.
   */
  virtual ~CxxModule() {}

  /**
   * @return the name of this module. This will be the name used to {@code require()} this module
   * from javascript.
   */
  virtual std::string getName() = 0;

  /**
   * Each entry in the map will be exported as a property to JS.  The
   * key is the property name, and the value can be anything.
   */
  virtual auto getConstants() -> std::map<std::string, folly::dynamic> = 0;

  /**
   * @return a list of methods this module exports to JS.
   */
  virtual auto getMethods() -> std::vector<Method> = 0;

  /**
   *  Called during the construction of CxxNativeModule.
   */
  void setInstance(std::weak_ptr<react::Instance> instance) {
    instance_ = instance;
  }

  /**
   * @return a weak_ptr to the current instance of the bridge.
   * When used with CxxNativeModule, this gives Cxx modules access to functions
   * such as `callJSFunction`, allowing them to communicate back to JS outside
   * of the regular callbacks.
   */
  std::weak_ptr<react::Instance> getInstance() {
    return instance_;
  }

private:
  std::weak_ptr<react::Instance> instance_;
};

}}}

#endif
