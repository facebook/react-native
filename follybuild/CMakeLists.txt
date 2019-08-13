set(FOLLY_ROOT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../Folly")
set(FOLLY_DIR "${FOLLY_ROOT_DIR}/folly")

set(SOURCES
	${FOLLY_DIR}/container/detail/F14Table.cpp
	${FOLLY_DIR}/Conv.cpp
	${FOLLY_DIR}/Demangle.cpp
	${FOLLY_DIR}/dynamic.cpp
	${FOLLY_DIR}/Format.cpp
	${FOLLY_DIR}/hash/SpookyHashV2.cpp
	${FOLLY_DIR}/json.cpp
	${FOLLY_DIR}/json_pointer.cpp
	${FOLLY_DIR}/lang/Assume.cpp
	${FOLLY_DIR}/lang/ColdClass.cpp
	${FOLLY_DIR}/lang/SafeAssert.cpp
	${FOLLY_DIR}/memory/detail/MallocImpl.cpp
	${FOLLY_DIR}/ScopeGuard.cpp
	${FOLLY_DIR}/String.cpp
	${FOLLY_DIR}/Unicode.cpp
	${FOLLY_DIR}/lang/ColdClass.cpp
	${FOLLY_DIR}/detail/Demangle.cpp )

if(WIN32 AND NOT WINRT)
	set(SOURCES ${SOURCES} ${FOLLY_DIR}/portability/SysMman.cpp)
endif(WIN32 AND NOT WINRT)

add_library(folly ${SOURCES})

if(WIN32)
	set(SOURCES ${SOURCES} ${FOLLY_DIR}/portability/string.cpp)
	target_include_directories(folly PUBLIC ${REACT_DEP_STUBS})
endif(WIN32)

target_include_directories(folly PUBLIC ${FOLLY_ROOT_DIR})

target_compile_definitions(folly PUBLIC FOLLY_NO_CONFIG)

if(WIN32)
	target_compile_options(folly PUBLIC /wd4068 /wd4146)
endif(WIN32)

if(IOS OR APPLE OR ANDROID)
	target_compile_definitions(folly PUBLIC FOLLY_MOBILE=1 FOLLY_USE_LIBCPP=1)
endif(IOS OR APPLE OR ANDROID)

# If the target is android-23 above, please comment this line.
# NDK uses GNU style stderror_r() after API 23.
if(ANDROID)
	target_compile_definitions(folly PUBLIC FOLLY_HAVE_XSI_STRERROR_R=1 FOLLY_HAVE_MEMRCHR=1)
endif(ANDROID)
if(WIN32)
	target_compile_definitions(folly PUBLIC FOLLY_HAVE_MEMRCHR=0)
endif(WIN32)

find_package(Boost REQUIRED)
target_link_libraries(folly PUBLIC Boost::boost)

if(IOS OR APPLE OR ANDROID)
	target_link_libraries(folly PUBLIC glog double-conversion)
endif(IOS OR APPLE OR ANDROID)
