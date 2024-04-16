$LOAD_PATH.unshift File.expand_path("../../lib", __dir__)

require "memory_profiler"
require "public_suffix"

PublicSuffix::List.default

report = MemoryProfiler.report do
  PublicSuffix::List.default.find("a.b.ide.kyoto.jp")
end

report.pretty_print
