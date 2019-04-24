# Find the Snappy libraries
#
# This module defines:
# SNAPPY_FOUND
# SNAPPY_INCLUDE_DIR
# SNAPPY_LIBRARY

find_path(SNAPPY_INCLUDE_DIR NAMES snappy.h)

find_library(SNAPPY_LIBRARY_DEBUG NAMES snappyd)
find_library(SNAPPY_LIBRARY_RELEASE NAMES snappy)

include(SelectLibraryConfigurations)
SELECT_LIBRARY_CONFIGURATIONS(SNAPPY)

include(FindPackageHandleStandardArgs)
FIND_PACKAGE_HANDLE_STANDARD_ARGS(
    SNAPPY DEFAULT_MSG
    SNAPPY_LIBRARY SNAPPY_INCLUDE_DIR
)

mark_as_advanced(SNAPPY_INCLUDE_DIR SNAPPY_LIBRARY)
