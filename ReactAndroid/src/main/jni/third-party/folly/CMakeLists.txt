# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

SET(folly_FLAGS
        -DFOLLY_NO_CONFIG=1
        -DFOLLY_HAVE_CLOCK_GETTIME=1
        -DFOLLY_USE_LIBCPP=1
        -DFOLLY_MOBILE=1
        -DFOLLY_HAVE_RECVMMSG=1
        -DFOLLY_HAVE_PTHREAD=1
        # If APP_PLATFORM in Application.mk targets android-23 above, please comment
        # the following line. NDK uses GNU style stderror_r() after API 23.
        -DFOLLY_HAVE_XSI_STRERROR_R=1
        )

##################
### folly_json ###
##################

SET(folly_json_SRC
        folly/json.cpp
        folly/Unicode.cpp
        folly/Conv.cpp
        folly/Demangle.cpp
        folly/memory/detail/MallocImpl.cpp
        folly/String.cpp
        folly/dynamic.cpp
        folly/FileUtil.cpp
        folly/Format.cpp
        folly/net/NetOps.cpp
        folly/json_pointer.cpp
        folly/lang/CString.cpp
        folly/lang/SafeAssert.cpp
        folly/detail/UniqueInstance.cpp
        folly/hash/SpookyHashV2.cpp
        folly/container/detail/F14Table.cpp
        folly/ScopeGuard.cpp
        folly/portability/SysUio.cpp
        folly/lang/ToAscii.cpp)

IF (CMAKE_BUILD_TYPE MATCHES Debug)
  list(APPEND folly_json_SRC folly/lang/Assume.cpp)
ENDIF ()

add_library(folly_json SHARED ${folly_json_SRC})

target_compile_options(folly_json
        PRIVATE
        -fexceptions
        -fno-omit-frame-pointer
        -frtti
        -Wno-sign-compare
        ${folly_FLAGS})

target_compile_options(folly_json PUBLIC ${folly_FLAGS})

target_include_directories(folly_json PUBLIC .)
target_link_libraries(folly_json glog double-conversion boost fmt)

#####################
### folly_futures ###
#####################

add_library(folly_futures SHARED
        folly/ExceptionWrapper.cpp
        folly/ExceptionString.cpp
        folly/Executor.cpp
        folly/SharedMutex.cpp
        folly/Singleton.cpp
        folly/Try.cpp
        folly/concurrency/CacheLocality.cpp
        folly/detail/AsyncTrace.cpp
        folly/detail/AtFork.cpp
        folly/detail/Futex.cpp
        folly/detail/MemoryIdler.cpp
        folly/detail/SingletonStackTrace.cpp
        folly/detail/StaticSingletonManager.cpp
        folly/detail/ThreadLocalDetail.cpp
        folly/fibers/Baton.cpp
        folly/fibers/FiberManager.cpp
        folly/fibers/Fiber.cpp
        folly/fibers/GuardPageAllocator.cpp
        folly/futures/detail/Core.cpp
        folly/futures/Future.cpp
        folly/futures/ThreadWheelTimekeeper.cpp
        folly/executors/ExecutorWithPriority.cpp
        folly/executors/InlineExecutor.cpp
        folly/executors/TimedDrivableExecutor.cpp
        folly/executors/QueuedImmediateExecutor.cpp
        folly/io/async/AsyncTimeout.cpp
        folly/io/async/EventBase.cpp
        folly/io/async/EventBaseBackendBase.cpp
        folly/io/async/EventBaseLocal.cpp
        folly/io/async/EventHandler.cpp
        folly/io/async/HHWheelTimer.cpp
        folly/io/async/Request.cpp
        folly/io/async/TimeoutManager.cpp
        folly/io/async/VirtualEventBase.cpp
        folly/lang/Exception.cpp
        folly/memory/MallctlHelper.cpp
        folly/portability/SysMembarrier.cpp
        folly/synchronization/AsymmetricMemoryBarrier.cpp
        folly/synchronization/Hazptr.cpp
        folly/synchronization/ParkingLot.cpp
        folly/synchronization/WaitOptions.cpp
        folly/synchronization/detail/Sleeper.cpp
        folly/system/Pid.cpp
        folly/system/ThreadId.cpp
        folly/system/ThreadName.cpp)

target_compile_options(folly_futures
        PRIVATE
        -fexceptions
        -fno-omit-frame-pointer
        -frtti
        -Wno-sign-compare
        -Wno-unused-variable)

target_include_directories(folly_futures PUBLIC .)
target_link_libraries(folly_futures glog double-conversion folly_json boost event fmt)
