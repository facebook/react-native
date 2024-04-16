$LOAD_PATH.unshift File.expand_path("../../lib", __dir__)

require "memory_profiler"
require "public_suffix"

PublicSuffix::List.default

report = MemoryProfiler.report do
  PublicSuffix.domain("www.example.com")
end

report.pretty_print
