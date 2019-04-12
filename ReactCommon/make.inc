###########################################################
#
#  Common include file for NMAKE
#
###########################################################

LIBLET_NO_PRECOMP = 1
LIBLET_DEF_USEGENERATED = 0
!include $(WAREHOUSEIMPORTDIR)\libletmake\x-none\nmake\make.inc

INCLUDES = $(INCLUDES); \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\Folly; \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon; \

INCLUDES_ANDROID = \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\glog\src; \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\double-conversion; \
    $(PKGOFFICE_GOOGLE_V8_ANDROID)\headers\include; \

INCLUDES_WINDOWS = \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactWindows\stubs; \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactWindows\shared; \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactWindows\include; \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactWindows\Desktop; \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactWindows\ReactWindowsCore; \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactWindows\ChakraCoreShim\ChakraHeaders; \

!if "$(IS_DROID)" == "1"
INCLUDES = \
    $(INCLUDES); \
    $(INCLUDES_ANDROID); \
!else
INCLUDES = \
    $(INCLUDES); \
    $(INCLUDES_WINDOWS); \
!endif

!LISTFILES -recursive BOOST_HEADERS = $(PKGBOOST) *
!LISTFILES -recursive JAVASCRIPTCORE_TEMP_HEADERS = $(PKGJAVASCRIPTCORE_TEMP) *.h
!LISTFILES -recursive V8_ANDROID_HEADERS = $(PKGOFFICE_GOOGLE_V8_ANDROID)\headers\include *.h

HEADERS = $(HEADERS) \
    $(BOOST_HEADERS) \
    $(JAVASCRIPTCORE_TEMP_HEADERS) \
    $(V8_ANDROID_HEADERS) \

C_DEFINES = $(C_DEFINES) -D FOLLY_NO_CONFIG
C_DEFINES = $(C_DEFINES) -D RN_EXPORT=
C_DEFINES = $(C_DEFINES) -D JSI_EXPORT=
C_DEFINES = $(C_DEFINES) -D RN_JSC_EXECUTOR_EXPORT=__declspec(dllexport)
C_DEFINES = $(C_DEFINES) -D NOMINMAX

!if "$(PLATFORM)" == "x86" || "$(PLATFORM)" == "x64"
# Set to 1 for more verbose traces.
C_DEFINES = $(C_DEFINES) -D WITH_OFFICE_TRACING=0
!endif

NOJSC = 1;
C_DEFINES = $(C_DEFINES) -D NOJSC

C_FLAGS = $(C_FLAGS) -wd4068 -wd4100 -wd4244
