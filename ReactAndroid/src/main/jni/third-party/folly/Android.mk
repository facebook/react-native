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
  folly/Format.cpp \
  folly/json_pointer.cpp \
  folly/lang/ColdClass.cpp \
  folly/detail/Demangle.cpp \
  folly/hash/SpookyHashV2.cpp \
  folly/container/detail/F14Table.cpp \
  folly/ScopeGuard.cpp \

ifeq ($(APP_OPTIM),debug)
  LOCAL_SRC_FILES += \
    folly/lang/Assume.cpp \
    folly/lang/SafeAssert.cpp \
    folly/FileUtil.cpp \
    folly/portability/SysUio.cpp
endif

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fexceptions -fno-omit-frame-pointer -frtti -Wno-sign-compare

FOLLY_FLAGS := \
  -DFOLLY_NO_CONFIG=1 \
  -DFOLLY_HAVE_CLOCK_GETTIME=1 \
  -DFOLLY_HAVE_MEMRCHR=1 \
  -DFOLLY_USE_LIBCPP=1

# If APP_PLATFORM in Application.mk targets android-23 above, please comment this line.
# NDK uses GNU style stderror_r() after API 23.
FOLLY_FLAGS += -DFOLLY_HAVE_XSI_STRERROR_R=1

LOCAL_CFLAGS += $(FOLLY_FLAGS)

LOCAL_EXPORT_CPPFLAGS := $(FOLLY_FLAGS)

LOCAL_MODULE := libfolly_json

LOCAL_SHARED_LIBRARIES := libglog libdouble-conversion
# Boost is header-only library we pretend to link is statically as
# this way android makefile will automatically setup path to boost header
# file, but except from that this will have no effect, as no c/cpp files
# are part of this static library
LOCAL_STATIC_LIBRARIES := libboost

include $(BUILD_SHARED_LIBRARY)

include $(CLEAR_VARS)

LOCAL_SRC_FILES := \
  folly/ExceptionWrapper.cpp \
  folly/Executor.cpp \
  folly/SharedMutex.cpp \
  folly/concurrency/CacheLocality.cpp \
  folly/detail/AtFork.cpp \
  folly/detail/Futex.cpp \
  folly/detail/MemoryIdler.cpp \
  folly/detail/StaticSingletonManager.cpp \
  folly/detail/ThreadLocalDetail.cpp \
  folly/executors/InlineExecutor.cpp \
  folly/executors/TimedDrivableExecutor.cpp \
  folly/io/async/Request.cpp \
  folly/memory/MallctlHelper.cpp \
  folly/portability/SysMembarrier.cpp \
  folly/synchronization/AsymmetricMemoryBarrier.cpp \
  folly/synchronization/Hazptr.cpp \
  folly/synchronization/ParkingLot.cpp \
  folly/synchronization/WaitOptions.cpp

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fexceptions -fno-omit-frame-pointer -frtti -Wno-sign-compare

FOLLY_FLAGS += \
  -DFOLLY_FUTURE_USING_FIBER=0

LOCAL_CFLAGS += $(FOLLY_FLAGS)

LOCAL_EXPORT_CPPFLAGS := $(FOLLY_FLAGS)

LOCAL_MODULE := libfolly_futures

LOCAL_SHARED_LIBRARIES := libglog libdouble-conversion libfolly_json
# Boost is header-only library we pretend to link is statically as
# this way android makefile will automatically setup path to boost header
# file, but except from that this will have no effect, as no c/cpp files
# are part of this static library
LOCAL_STATIC_LIBRARIES := libboost

include $(BUILD_SHARED_LIBRARY)

$(call import-module,glog)
$(call import-module,double-conversion)
$(call import-module,boost)
