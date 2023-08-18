# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
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
### folly_runtime ###
##################

SET(folly_runtime_SRC
        folly/SharedMutex.cpp
        folly/concurrency/CacheLocality.cpp
        folly/detail/Futex.cpp
        folly/lang/SafeAssert.cpp
        folly/lang/ToAscii.cpp
        folly/synchronization/ParkingLot.cpp
        folly/system/ThreadId.cpp
        folly/system/ThreadName.cpp
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
        folly/detail/UniqueInstance.cpp
        folly/hash/SpookyHashV2.cpp
        folly/container/detail/F14Table.cpp
        folly/ScopeGuard.cpp
        folly/portability/SysUio.cpp)

IF (CMAKE_BUILD_TYPE MATCHES Debug)
  list(APPEND folly_runtime_SRC folly/lang/Assume.cpp)
ENDIF ()

add_library(folly_runtime SHARED ${folly_runtime_SRC})

target_compile_options(folly_runtime
        PRIVATE
        -fexceptions
        -fno-omit-frame-pointer
        -frtti
        -Wno-sign-compare
        ${folly_FLAGS})

target_compile_options(folly_runtime PUBLIC ${folly_FLAGS})

target_include_directories(folly_runtime PUBLIC .)
target_link_libraries(folly_runtime glog double-conversion boost fmt)

#####################
### folly_futures ###
#####################

add_library(folly_futures STATIC
        folly/ExceptionWrapper.cpp
        folly/ExceptionString.cpp
        folly/Executor.cpp
        folly/Singleton.cpp
        folly/Try.cpp
        folly/concurrency/CacheLocality.cpp
        folly/detail/AsyncTrace.cpp
        folly/detail/AtFork.cpp
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
        folly/synchronization/WaitOptions.cpp
        folly/synchronization/detail/Sleeper.cpp
        folly/system/Pid.cpp)

target_compile_options(folly_futures
        PRIVATE
        -fexceptions
        -fno-omit-frame-pointer
        -frtti
        -Wno-sign-compare
        -Wno-unused-variable)

target_include_directories(folly_futures PUBLIC .)
target_link_libraries(folly_futures glog double-conversion folly_runtime boost event fmt)
