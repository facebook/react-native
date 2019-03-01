set(SOURCES
	folly/Assume.cpp
	folly/Conv.cpp
	folly/Demangle.cpp
	folly/detail/MallocImpl.cpp
	folly/dynamic.cpp
	folly/json.cpp
	folly/portability/BitsFunctexcept.cpp
	folly/ScopeGuard.cpp
	folly/SpookyHashV2.cpp
	folly/StringBase.cpp
	folly/Unicode.cpp)

if(WIN32 AND NOT WINRT)
	set(SOURCES ${SOURCES} folly/portability/SysMman.cpp)
endif(WIN32 AND NOT WINRT)

add_library(folly ${SOURCES})

if(WIN32)
	target_include_directories(folly PUBLIC ${REACT_DEP_STUBS})
endif(WIN32)

target_include_directories(folly PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_compile_definitions(folly PUBLIC FOLLY_NO_CONFIG)

if(WIN32)
	target_compile_options(folly PUBLIC /wd4068 /wd4146)
endif(WIN32)

if(IOS OR APPLE OR ANDROID)
	target_compile_definitions(folly PUBLIC FOLLY_MOBILE=1 FOLLY_USE_LIBCPP=1)
endif(IOS OR APPLE OR ANDROID)

find_package(Boost REQUIRED)
target_link_libraries(folly PUBLIC Boost::boost)

if(IOS OR APPLE OR ANDROID)
	target_link_libraries(folly PUBLIC glog double-conversion)
endif(IOS OR APPLE OR ANDROID)
