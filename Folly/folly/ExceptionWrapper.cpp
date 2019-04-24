/*
 * Copyright 2016-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include <folly/ExceptionWrapper.h>

#include <iostream>

#include <folly/GLog.h>

namespace folly {

exception_wrapper::VTable const exception_wrapper::uninit_{
    &noop_<void, exception_wrapper const*, exception_wrapper*>,
    &noop_<void, exception_wrapper*, exception_wrapper*>,
    &noop_<void, exception_wrapper*>,
    &noop_<void, exception_wrapper const*>,
    &uninit_type_,
    &noop_<std::exception const*, exception_wrapper const*>,
    &noop_<exception_wrapper, exception_wrapper const*>};

exception_wrapper::VTable const exception_wrapper::ExceptionPtr::ops_{
    copy_,
    move_,
    delete_,
    throw_,
    type_,
    get_exception_,
    get_exception_ptr_};

exception_wrapper::VTable const exception_wrapper::SharedPtr::ops_{
    copy_,
    move_,
    delete_,
    throw_,
    type_,
    get_exception_,
    get_exception_ptr_};

namespace {
std::exception const* get_std_exception_(std::exception_ptr eptr) noexcept {
  try {
    std::rethrow_exception(eptr);
  } catch (const std::exception& ex) {
    return &ex;
  } catch (...) {
    return nullptr;
  }
}
} // namespace

exception_wrapper exception_wrapper::from_exception_ptr(
    std::exception_ptr const& ptr) noexcept {
  if (!ptr) {
    return exception_wrapper();
  }
  try {
    std::rethrow_exception(ptr);
  } catch (std::exception& e) {
    return exception_wrapper(std::current_exception(), e);
  } catch (...) {
    return exception_wrapper(std::current_exception());
  }
}

exception_wrapper::exception_wrapper(std::exception_ptr ptr) noexcept
    : exception_wrapper{} {
  if (ptr) {
    if (auto e = get_std_exception_(ptr)) {
      LOG(DFATAL)
          << "Performance error: Please construct exception_wrapper with a "
             "reference to the std::exception along with the "
             "std::exception_ptr.";
      *this = exception_wrapper{std::move(ptr), *e};
    } else {
      Unknown uk;
      *this = exception_wrapper{ptr, uk};
    }
  }
}

[[noreturn]] void exception_wrapper::onNoExceptionError(
    char const* const name) {
  std::ios_base::Init ioinit_; // ensure std::cerr is alive
  std::cerr << "Cannot use `" << name
            << "` with an empty folly::exception_wrapper" << std::endl;
  std::terminate();
}

fbstring exceptionStr(exception_wrapper const& ew) {
  return ew.what();
}

} // namespace folly
