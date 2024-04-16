$LOAD_PATH.unshift File.expand_path("../../lib", __dir__)

require "memory_profiler"
require "public_suffix"

report = MemoryProfiler.report do
  PublicSuffix::List.default
end

report.pretty_print
# report.pretty_print(to_file: 'profiler-%s-%d.txt' % [ARGV[0], Time.now.to_i])
