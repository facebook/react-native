LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)

LOCAL_SRC_FILES:= \
  folly/json.cpp \
  folly/Unicode.cpp \
  folly/Conv.cpp \
  folly/Demangle.cpp \
  folly/memory/detail/MallocImpl.cpp \
  folly/String.cpp \
  folly/dynamic.cpp \
  folly/FileUtil.cpp \
  folly/Format.cpp \
  folly/net/NetOps.cpp \
  folly/json_pointer.cpp \
  folly/lang/CString.cpp \
  folly/lang/SafeAssert.cpp \
  folly/detail/UniqueInstance.cpp \
  folly/hash/SpookyHashV2.cpp \
  folly/container/detail/F14Table.cpp \
  folly/ScopeGuard.cpp \
  folly/portability/SysUio.cpp \
  folly/lang/ToAscii.cpp

ifeq ($(APP_OPTIM),debug)
  LOCAL_SRC_FILES += \
    folly/lang/Assume.cpp
endif

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fexceptions -fno-omit-frame-pointer -frtti -Wno-sign-compare

FOLLY_FLAGS := \
  -DFOLLY_NO_CONFIG=1 \
  -DFOLLY_HAVE_CLOCK_GETTIME=1 \
  -DFOLLY_USE_LIBCPP=1 \
  -DFOLLY_MOBILE=1 \
  -DFOLLY_HAVE_RECVMMSG=1 \
  -DFOLLY_HAVE_PTHREAD=1

# If APP_PLATFORM in Application.mk targets android-23 above, please comment this line.
# NDK uses GNU style stderror_r() after API 23.
FOLLY_FLAGS += -DFOLLY_HAVE_XSI_STRERROR_R=1

LOCAL_CFLAGS += $(FOLLY_FLAGS)

LOCAL_EXPORT_CPPFLAGS := $(FOLLY_FLAGS)

LOCAL_MODULE := libfolly_json

LOCAL_SHARED_LIBRARIES := libglog libdouble-conversion
LOCAL_STATIC_LIBRARIES := libboost libfmt

include $(BUILD_SHARED_LIBRARY)

include $(CLEAR_VARS)

LOCAL_SRC_FILES := \
  folly/ExceptionWrapper.cpp \
  folly/ExceptionString.cpp \
  folly/Executor.cpp \
  folly/SharedMutex.cpp \
  folly/Singleton.cpp \
  folly/Try.cpp \
  folly/concurrency/CacheLocality.cpp \
  folly/detail/AsyncTrace.cpp \
  folly/detail/AtFork.cpp \
  folly/detail/Futex.cpp \
  folly/detail/MemoryIdler.cpp \
  folly/detail/SingletonStackTrace.cpp \
  folly/detail/StaticSingletonManager.cpp \
  folly/detail/ThreadLocalDetail.cpp \
  folly/fibers/Baton.cpp \
  folly/fibers/FiberManager.cpp \
  folly/fibers/Fiber.cpp \
  folly/fibers/GuardPageAllocator.cpp \
  folly/futures/detail/Core.cpp \
  folly/futures/Future.cpp \
  folly/futures/ThreadWheelTimekeeper.cpp \
  folly/executors/ExecutorWithPriority.cpp \
  folly/executors/InlineExecutor.cpp \
  folly/executors/TimedDrivableExecutor.cpp \
  folly/executors/QueuedImmediateExecutor.cpp \
  folly/io/async/AsyncTimeout.cpp \
  folly/io/async/EventBase.cpp \
  folly/io/async/EventBaseBackendBase.cpp \
  folly/io/async/EventBaseLocal.cpp \
  folly/io/async/EventHandler.cpp \
  folly/io/async/HHWheelTimer.cpp \
  folly/io/async/Request.cpp \
  folly/io/async/TimeoutManager.cpp \
  folly/io/async/VirtualEventBase.cpp \
  folly/lang/Exception.cpp \
  folly/memory/MallctlHelper.cpp \
  folly/portability/SysMembarrier.cpp \
  folly/synchronization/AsymmetricMemoryBarrier.cpp \
  folly/synchronization/Hazptr.cpp \
  folly/synchronization/ParkingLot.cpp \
  folly/synchronization/WaitOptions.cpp \
  folly/synchronization/detail/Sleeper.cpp \
  folly/system/Pid.cpp \
  folly/system/ThreadId.cpp \
  folly/system/ThreadName.cpp


LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fexceptions -fno-omit-frame-pointer -frtti -Wno-sign-compare -Wno-unused-variable

LOCAL_CFLAGS += $(FOLLY_FLAGS)

LOCAL_EXPORT_CPPFLAGS := $(FOLLY_FLAGS)

LOCAL_MODULE := libfolly_futures

LOCAL_SHARED_LIBRARIES := libglog libdouble-conversion libfolly_json
LOCAL_STATIC_LIBRARIES := libboost libevent libfmt

include $(BUILD_SHARED_LIBRARY)

$(call import-module,libevent)
$(call import-module,glog)
$(call import-module,double-conversion)
$(call import-module,boost)
$(call import-module,fmt)
