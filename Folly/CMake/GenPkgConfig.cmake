# Generate variables that can be used to help emit a pkg-config file
# using configure_file().
#
# Usage: gen_pkgconfig_vars(VAR_PREFIX target)
#
# This will set two variables in the caller scope:
# ${VAR_PREFIX}_CFLAGS: set to the compile flags computed from the specified
#   target
# ${VAR_PREFIX}_PRIVATE_LIBS: set to the linker flags needed for static
#   linking computed from the specified target
function(gen_pkgconfig_vars)
  if (NOT ${ARGC} EQUAL 2)
    message(FATAL_ERROR "gen_pkgconfig_vars() requires exactly 2 arguments")
  endif()
  set(var_prefix "${ARGV0}")
  set(target "${ARGV1}")

  get_target_property(target_cflags "${target}" INTERFACE_COMPILE_OPTIONS)
  if(target_cflags)
    list(APPEND cflags "${target_cflags}")
  endif()
  get_target_property(
    target_inc_dirs "${target}" INTERFACE_INCLUDE_DIRECTORIES)
  if(target_inc_dirs)
    list(APPEND include_dirs "${target_inc_dirs}")
  endif()
  get_target_property(target_defns "${target}" INTERFACE_COMPILE_DEFINITIONS)
  if(target_defns)
    list(APPEND definitions "${target_defns}")
  endif()

  # The INTERFACE_LINK_LIBRARIES list is unfortunately somewhat awkward to
  # process.  Entries in this list may be any of
  # - target names
  # - absolute paths to a library file
  # - plain library names that need "-l" prepended
  # - other linker flags starting with "-"
  #
  # Walk through each entry and transform it into the desired arguments
  get_target_property(link_libs "${target}" INTERFACE_LINK_LIBRARIES)
  if(link_libs)
    foreach(lib_arg IN LISTS link_libs)
      if(TARGET "${lib_arg}")
        # Add any compile options specified in the targets
        # INTERFACE_COMPILE_OPTIONS.  We don't need to process its
        # INTERFACE_LINK_LIBRARIES property, since our INTERFACE_LINK_LIBRARIES
        # will already include its entries transitively.
        get_target_property(lib_cflags "${lib_arg}" INTERFACE_COMPILE_OPTIONS)
        if(lib_cflags)
          list(APPEND cflags "${lib_cflags}")
        endif()
        get_target_property(lib_defs "${lib_arg}"
          INTERFACE_COMPILE_DEFINITIONS)
        if(lib_defs)
          list(APPEND definitions "${lib_defs}")
        endif()
      elseif(lib_arg MATCHES "^[-/]")
        list(APPEND private_libs "${lib_arg}")
      else()
        list(APPEND private_libs "-l${lib_arg}")
      endif()
    endforeach()
  endif()

  list(APPEND cflags "${CMAKE_REQUIRED_FLAGS}")
  if(definitions)
    list(REMOVE_DUPLICATES definitions)
    foreach(def_arg IN LISTS definitions)
      list(APPEND cflags "-D${def_arg}")
    endforeach()
  endif()
  if(include_dirs)
    list(REMOVE_DUPLICATES include_dirs)
    foreach(inc_dir IN LISTS include_dirs)
      list(APPEND cflags "-I${inc_dir}")
    endforeach()
  endif()

  # Set the output variables
  string(REPLACE ";" " " cflags "${cflags}")
  set("${var_prefix}_CFLAGS" "${cflags}" PARENT_SCOPE)
  string(REPLACE ";" " " private_libs "${private_libs}")
  set("${var_prefix}_PRIVATE_LIBS" "${private_libs}" PARENT_SCOPE)
endfunction()
