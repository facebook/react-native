set(CMAKE_CXX_FLAGS_COMMON "-g -Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_COMMON}")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_COMMON} -O3")

set(CMAKE_REQUIRED_FLAGS "${CMAKE_REQUIRED_FLAGS} -std=gnu++14")
function(apply_folly_compile_options_to_target THETARGET)
  target_compile_definitions(${THETARGET}
    PRIVATE
      _REENTRANT
      _GNU_SOURCE
      "FOLLY_XLOG_STRIP_PREFIXES=\"${FOLLY_DIR_PREFIXES}\""
  )
  target_compile_options(${THETARGET}
    PRIVATE
      -g
      -std=gnu++14
      -finput-charset=UTF-8
      -fsigned-char
      -Werror
      -Wall
      -Wno-deprecated
      -Wno-deprecated-declarations
      -Wno-sign-compare
      -Wno-unused
      -Wunused-label
      -Wunused-result
      -Wnon-virtual-dtor
      ${FOLLY_CXX_FLAGS}
  )
endfunction()
