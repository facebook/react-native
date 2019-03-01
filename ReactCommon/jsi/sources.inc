LIBLETNAME = jsi

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon\make.inc
!include $(OTOOLS)\inc\opensource\reactnative\officereactnative.inc

SOURCES_SHARED = \
  ..\jsi.cpp \
  ..\JSIDynamic.cpp \

SOURCES_V8_FILES = \
  ..\FileUtils.cpp \
  ..\V8Platform.cpp \
  ..\V8Runtime_shared.cpp \
  ..\V8Runtime_droid.cpp \

SOURCES_JSC_FILES = \
  ..\JSCRuntime.cpp \

!if ($(V8_ENABLED) == 1)

SOURCES_ANDROID = \
  $(SOURCES_SHARED) \
  $(SOURCES_V8_FILES) \

!else

SOURCES_ANDROID = \
  $(SOURCES_SHARED);\
  $(SOURCES_JSC_FILES); \
!endif

SOURCES_WIN32 = \
  $(SOURCES_SHARED) \
  ..\V8Platform.cpp \
  ..\V8Runtime_shared.cpp \
  ..\V8Runtime_win.cpp \

SOURCES_WINRT = \
  $(SOURCES_SHARED) \
