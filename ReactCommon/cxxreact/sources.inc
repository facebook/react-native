LIBLETNAME = CxxReact

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon\make.inc

INCLUDES = $(INCLUDES); \
	$(PKGJAVASCRIPTCORE_TEMP)\build\native\include; \

SOURCES_SHARED = \
	..\CxxNativeModule.cpp \
	..\Instance.cpp \
	..\JSBundleType.cpp \
	..\JSDeltaBundleClient.cpp \
	..\JSExecutor.cpp \
	..\JSIndexedRAMBundle.cpp \
	..\MethodCall.cpp \
	..\ModuleRegistry.cpp \
	..\NativeToJsBridge.cpp \
	..\Platform.cpp \
	..\RAMBundleRegistry.cpp \
	..\ReactMarker.cpp \

SOURCES_V8_FILES = \
    ..\File.cpp \
    ..\V8NativeModules.cpp \
    ..\V8Executor.cpp \

SOURCES_WIN32 = \
    $(SOURCES_WIN32) \
    $(SOURCES_SHARED) \

SOURCES_ANDROID = \
    $(SOURCES_SHARED) \
    ..\fbsystrace.cpp \
    ..\JSBigString.cpp \

SOURCES_WINRT = \
    $(SOURCES_WINRT) \
    $(SOURCES_SHARED) \
