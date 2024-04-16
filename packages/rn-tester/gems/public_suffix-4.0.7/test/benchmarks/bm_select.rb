require 'benchmark'
require_relative "../../lib/public_suffix"

JP   = "www.yokoshibahikari.chiba.jp"

TIMES = (ARGV.first || 50_000).to_i

# Initialize
class PublicSuffix::List
  public :select
end
PublicSuffixList = PublicSuffix::List.default
PublicSuffixList.select("example.jp")
PublicSuffixList.find("example.jp")

Benchmark.bmbm(25) do |x|
  x.report("JP select") do
    TIMES.times { PublicSuffixList.select(JP) }
  end
  x.report("JP find") do
    TIMES.times { PublicSuffixList.find(JP) }
  end
  # x.report("JP (noprivate)") do
  #   TIMES.times { PublicSuffixList.find(JP, ignore_private: true) != nil }
  # end
end
