add_library(
    follybenchmark
    Benchmark.cpp
)
target_link_libraries(follybenchmark PUBLIC folly)
apply_folly_compile_options_to_target(follybenchmark)
install(
  TARGETS follybenchmark
  EXPORT folly
  RUNTIME DESTINATION ${BIN_INSTALL_DIR}
  LIBRARY DESTINATION ${LIB_INSTALL_DIR}
  ARCHIVE DESTINATION ${LIB_INSTALL_DIR}
)

add_subdirectory(experimental/exception_tracer)
