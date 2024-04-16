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

Benchmark.bmbm(25) do |x|
  x.report("select jp") do
    TIMES.times { PublicSuffixList.select("jp") }
  end
  x.report("select example.jp") do
    TIMES.times { PublicSuffixList.select("example.jp") }
  end
  x.report("select www.example.jp") do
    TIMES.times { PublicSuffixList.select("www.example.jp") }
  end
end
