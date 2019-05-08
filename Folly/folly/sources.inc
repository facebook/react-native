LIBLETNAME = Folly

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon\make.inc

SOURCES_SHARED = \
	..\Conv.cpp \
	..\Demangle.cpp \
	..\dynamic.cpp \
	..\Format.cpp \
	..\json.cpp \
	..\json_pointer.cpp \
	..\ScopeGuard.cpp \
	..\String.cpp \
	..\Unicode.cpp \

SOURCES_WIN32 = $(SOURCES_SHARED) \

SOURCES_ANDROID = $(SOURCES_SHARED) \

SOURCES_WINRT = $(SOURCES_SHARED) \
