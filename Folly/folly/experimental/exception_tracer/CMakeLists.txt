if (FOLLY_USE_SYMBOLIZER)
  add_library(
    folly_exception_tracer_base
    ExceptionTracer.cpp
    StackTrace.cpp
  )
  apply_folly_compile_options_to_target(folly_exception_tracer_base)
  target_link_libraries(
    folly_exception_tracer_base
    PUBLIC folly
  )

  add_library(
    folly_exception_tracer
    ExceptionStackTraceLib.cpp
    ExceptionTracerLib.cpp
  )
  apply_folly_compile_options_to_target(folly_exception_tracer)
  target_link_libraries(
    folly_exception_tracer
    PUBLIC folly_exception_tracer_base
  )

  add_library(
    folly_exception_counter
    ExceptionCounterLib.cpp
  )
  apply_folly_compile_options_to_target(folly_exception_counter)
  target_link_libraries(
    folly_exception_counter
    PUBLIC folly_exception_tracer
  )

  install(
    FILES
      ExceptionAbi.h
      ExceptionCounterLib.h
      ExceptionTracer.h
      ExceptionTracerLib.h
      StackTrace.h
    DESTINATION
      ${INCLUDE_INSTALL_DIR}/folly/experimental/exception_tracer
  )
  install(
    TARGETS
      folly_exception_tracer_base
      folly_exception_tracer
      folly_exception_counter
    EXPORT folly
    RUNTIME DESTINATION ${BIN_INSTALL_DIR}
    LIBRARY DESTINATION ${LIB_INSTALL_DIR}
    ARCHIVE DESTINATION ${LIB_INSTALL_DIR}
  )
endif()
