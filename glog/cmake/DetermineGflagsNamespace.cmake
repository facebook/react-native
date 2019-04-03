macro(determine_gflags_namespace VARIABLE)
  if (NOT DEFINED "${VARIABLE}")
    if (CMAKE_REQUIRED_INCLUDES)
      set (CHECK_INCLUDE_FILE_CXX_INCLUDE_DIRS "-DINCLUDE_DIRECTORIES=${CMAKE_REQUIRED_INCLUDES}")
    else ()
      set (CHECK_INCLUDE_FILE_CXX_INCLUDE_DIRS)
    endif ()

    set(MACRO_CHECK_INCLUDE_FILE_FLAGS ${CMAKE_REQUIRED_FLAGS})

    set(_NAMESPACES gflags google)
    set(_check_code
"
#include <gflags/gflags.h>

int main(int argc, char**argv)
{
  GFLAGS_NAMESPACE::ParseCommandLineFlags(&argc, &argv, true);
}
")
    if (NOT CMAKE_REQUIRED_QUIET)
      message (STATUS "Looking for gflags namespace")
    endif ()
    if (${ARGC} EQUAL 3)
      set (CMAKE_CXX_FLAGS_SAVE ${CMAKE_CXX_FLAGS})
      set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${ARGV2}")
    endif ()

    set (_check_file
        ${CMAKE_BINARY_DIR}${CMAKE_FILES_DIRECTORY}/CMakeTmp/DetermineGflagsNamespace.cxx)

    foreach (_namespace ${_NAMESPACES})
      file (WRITE "${_check_file}" "${_check_code}")
      try_compile (${VARIABLE}
        "${CMAKE_BINARY_DIR}" "${_check_file}"
        COMPILE_DEFINITIONS "${CMAKE_REQUIRED_DEFINITIONS}" -DGFLAGS_NAMESPACE=${_namespace}
        LINK_LIBRARIES "${gflags_LIBRARIES}"
        CMAKE_FLAGS -DINCLUDE_DIRECTORIES:STRING="${gflags_INCLUDE_DIR}"
        OUTPUT_VARIABLE OUTPUT)

      if (${VARIABLE})
        set (${VARIABLE} ${_namespace} CACHE INTERNAL "gflags namespace" FORCE)
        break ()
      else ()
        file(APPEND ${CMAKE_BINARY_DIR}${CMAKE_FILES_DIRECTORY}/CMakeError.log
          "Determining the gflags namespace ${_namespace} failed with the following output:\n"
          "${OUTPUT}\n\n")
      endif ()
    endforeach (_namespace)

    if (${ARGC} EQUAL 3)
      set (CMAKE_CXX_FLAGS ${CMAKE_CXX_FLAGS_SAVE})
    endif ()

    if (${VARIABLE})
      if (NOT CMAKE_REQUIRED_QUIET)
        message (STATUS "Looking for gflags namespace - ${${VARIABLE}}")
      endif ()
      file (APPEND ${CMAKE_BINARY_DIR}${CMAKE_FILES_DIRECTORY}/CMakeOutput.log
        "Determining the gflags namespace passed with the following output:\n"
        "${OUTPUT}\n\n")
    else ()
      if (NOT CMAKE_REQUIRED_QUIET)
        message (STATUS "Looking for gflags namespace - failed")
      endif ()
      set (${VARIABLE} ${_namespace} CACHE INTERNAL "gflags namespace")
    endif ()
  endif ()
endmacro ()
