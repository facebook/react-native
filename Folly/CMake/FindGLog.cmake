#
# Find libglog
#
#  LIBGLOG_INCLUDE_DIR - where to find glog/logging.h, etc.
#  LIBGLOG_LIBRARY     - List of libraries when using libglog.
#  LIBGLOG_FOUND       - True if libglog found.


IF (LIBGLOG_INCLUDE_DIR)
  # Already in cache, be silent
  SET(LIBGLOG_FIND_QUIETLY TRUE)
ENDIF ()

FIND_PATH(LIBGLOG_INCLUDE_DIR glog/logging.h)

FIND_LIBRARY(LIBGLOG_LIBRARY glog)

# handle the QUIETLY and REQUIRED arguments and set LIBGLOG_FOUND to TRUE if
# all listed variables are TRUE
INCLUDE(FindPackageHandleStandardArgs)
FIND_PACKAGE_HANDLE_STANDARD_ARGS(LIBGLOG DEFAULT_MSG LIBGLOG_LIBRARY LIBGLOG_INCLUDE_DIR)

MARK_AS_ADVANCED(LIBGLOG_LIBRARY LIBGLOG_INCLUDE_DIR)
