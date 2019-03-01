if(CMAKE_SOURCE_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
	message("react-native built as top-level project")

	cmake_minimum_required(VERSION 3.10 FATAL_ERROR)
	project(react-native VERSION 0.1 LANGUAGES C CXX)
	set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../cmake")

	# We need minimum C++14 across the board, but WinRT needs C++17 (for features such as std::optional)
	if(WINRT)
		set(CMAKE_CXX_STANDARD 17)
	else()
		set(CMAKE_CXX_STANDARD 14)
	endif()

	set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/../lib)
	set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/../lib)
	set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/../bin)

	# If the architecture was not passed down (through the make.js script), try to guess it
	if(WIN32 AND NOT DEFINED WIN32_BUILD_ARCH)
		if(CMAKE_SIZEOF_VOID_P EQUAL 8)
			set(WIN32_BUILD_ARCH x64)
		else()
			set(WIN32_BUILD_ARCH x86)
		endif()
	endif()
else()
	# react-native is being built as part of sdx-platform, no need to set up a project here
endif()

# Stubs for glog and double-conversion
set(REACT_DEP_STUBS "${CMAKE_CURRENT_SOURCE_DIR}/../react-native-win/stubs")

if(WIN32)
	add_definitions(-DMS_TARGET_WINDOWS -DWIN32 -DNOMINMAX -DWIN32_LEAN_AND_MEAN)
endif(WIN32)

if(WIN32 AND NOT WINRT)
	# Set it to one for more verbose traces.
	# TODO : Avoid magic numbers as logging levels : https://office.visualstudio.com/ISS/_workitems/edit/2602025
	add_definitions(-DWITH_OFFICE_TRACING=0)
endif(WIN32 AND NOT WINRT)

add_subdirectory(folly)
add_subdirectory(ReactCommon)

if(IOS OR APPLE OR ANDROID)
	add_subdirectory(glog)
	add_subdirectory(double-conversion)
endif(IOS OR APPLE OR ANDROID)

if(IOS OR APPLE)
	add_subdirectory(React)
endif(IOS OR APPLE)
