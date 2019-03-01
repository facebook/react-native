LIBLETNAME = Yoga
LIBLET_NO_PRECOMP = 1

!include $(WAREHOUSEIMPORTDIR)\libletmake\x-none\nmake\make.inc

!IF ("$(PLATFORM)" != "droidarm") && ("$(PLATFORM)" != "droidx86")
C_DEFINES = $(C_DEFINES) /D _WINDLL
!ENDIF

C_FLAGS = -J -w44986 -w44287  -w44471  -w44296 -wd4232 -wd4100

SOURCES_SHARED = \
	..\Utils.cpp \
	..\YGConfig.cpp \
	..\YGEnums.cpp \
	..\YGFloatOptional.cpp \
	..\YGLayout.cpp \
	..\YGNode.cpp \
	..\YGNodePrint.cpp \
	..\YGStyle.cpp \
	..\Yoga.cpp \

SOURCES_WIN32 = $(SOURCES_SHARED) \

SOURCES_ANDROID = $(SOURCES_SHARED) \

SOURCES_WINRT = $(SOURCES_SHARED) \
