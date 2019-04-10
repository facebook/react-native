option(NO_JSC "Don't use JSC in ReactCommon" ON)

set(SOURCES
	cxxreact/CxxNativeModule.cpp
	cxxreact/Instance.cpp
	cxxreact/JSBundleType.cpp
	cxxreact/JSExecutor.cpp
	cxxreact/JSIndexedRAMBundle.cpp
	cxxreact/MethodCall.cpp
	cxxreact/ModuleRegistry.cpp
	cxxreact/NativeToJsBridge.cpp
	cxxreact/Platform.cpp
	cxxreact/RAMBundleRegistry.cpp
	cxxreact/ReactMarker.cpp
	jsi/jsi.cpp
	jsi/JSIDynamic.cpp
	jsiexecutor/jsireact/JSIExecutor.cpp
	jsiexecutor/jsireact/JSINativeModules.cpp
	yoga/yoga/Utils.cpp
	yoga/yoga/YGConfig.cpp
	yoga/yoga/YGEnums.cpp
	yoga/yoga/YGFloatOptional.cpp
	yoga/yoga/YGLayout.cpp
	yoga/yoga/YGNode.cpp
	yoga/yoga/YGNodePrint.cpp
	yoga/yoga/YGStyle.cpp
	yoga/yoga/Yoga.cpp)

if(WIN32)
	set(SOURCES ${SOURCES}
		jsi/V8Runtime_shared.cpp
		jsi/V8Runtime_win.cpp
		jsi/V8Platform.cpp)
endif(WIN32)

# This doesn't build because the NuGet doesn't include droid builds
#if(ANDROID)
#	set(SOURCES ${SOURCES}
#		jsi/V8Runtime_shared.cpp
#		jsi/V8Runtime_droid.cpp
#		jsi/V8Platform.cpp)
#endif(ANDROID)

if(ANDROID)
	set(SOURCES ${SOURCES}
		cxxreact/fbsystrace.cpp
		cxxreact/JSBigString.cpp
		)
endif(ANDROID)

add_library(reactcommon ${SOURCES})

if(WIN32)
	target_include_directories(reactcommon PRIVATE ${REACT_DEP_STUBS})
	find_package(V8 REQUIRED)

	target_link_libraries(reactcommon PUBLIC V8::V8)
endif(WIN32)

if(ANDROID)
	target_include_directories(reactcommon PUBLIC ${CMAKE_CURRENT_SOURCE_DIR} "${CMAKE_SOURCE_DIR}/../src/react-native/ReactAndroid/packages/Office.Google_V8.Android.7.0.276.32/headers/include/")
endif(ANDROID)

target_include_directories(reactcommon PUBLIC ${CMAKE_CURRENT_SOURCE_DIR} "${CMAKE_CURRENT_SOURCE_DIR}/yoga")

target_include_directories(reactcommon PUBLIC ${CMAKE_CURRENT_SOURCE_DIR} "${CMAKE_CURRENT_SOURCE_DIR}/jsiexecutor")

target_link_libraries(reactcommon PUBLIC folly)

target_compile_definitions(reactcommon PUBLIC _CRT_SECURE_NO_WARNINGS RN_EXPORT= JSI_EXPORT=)

if(NOT ANDROID)
	target_compile_definitions(reactcommon PRIVATE _WINDLL)
endif(NOT ANDROID)

if(WIN32)
	target_compile_options(reactcommon PUBLIC /wd4244 /wd4068)

	if (MSVC) # Treat warnings as errors
		target_compile_options(reactcommon PRIVATE /WX)
	endif()
endif()

if(NO_JSC)
	target_compile_definitions(reactcommon PUBLIC NOJSC)
else(NO_JSC)
	#TODO: JavaScriptCore-Temp NuGet package; is this actually used anywhere? YES, for x64 builds - FIXME
endif(NO_JSC)
