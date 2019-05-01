# dwarf.h is typically installed in a libdwarf/ subdirectory on Debian-style
# Linux distributions.  It is not installed in a libdwarf/ subdirectory on Mac
# systems when installed with Homebrew.  Search for it in both locations.
find_path(LIBDWARF_INCLUDE_DIR NAMES dwarf.h PATH_SUFFIXES libdwarf)
mark_as_advanced(LIBDWARF_INCLUDE_DIR)

find_library(LIBDWARF_LIBRARY NAMES dwarf)
mark_as_advanced(LIBDWARF_LIBRARY)

include(FindPackageHandleStandardArgs)
FIND_PACKAGE_HANDLE_STANDARD_ARGS(
  LIBDWARF
  REQUIRED_VARS LIBDWARF_LIBRARY LIBDWARF_INCLUDE_DIR)

if(LIBDWARF_FOUND)
  set(LIBDWARF_LIBRARIES ${LIBDWARF_LIBRARY})
  set(LIBDWARF_INCLUDE_DIRS ${LIBDWARF_INCLUDE_DIR})
endif()
