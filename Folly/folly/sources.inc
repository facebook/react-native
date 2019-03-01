LIBLETNAME = Folly

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon\make.inc

SOURCES_SHARED = \
	..\Assume.cpp \
	..\Conv.cpp \
	..\Demangle.cpp \
	..\dynamic.cpp \
	..\json.cpp \
	..\StringBase.cpp \
	..\ScopeGuard.cpp \
	..\Unicode.cpp \

SOURCES_WIN32 = \
    $(SOURCES_SHARED) \
	..\SpookyHashV2.cpp \

SOURCES_ANDROID = $(SOURCES_SHARED) \

SOURCES_WINRT = $(SOURCES_SHARED) \
