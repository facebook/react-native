require 'benchmark'
require_relative "../../lib/public_suffix"

NAME_SHORT  = "example.de"
NAME_MEDIUM = "www.subdomain.example.de"
NAME_LONG   = "one.two.three.four.five.example.de"
NAME_WILD   = "one.two.three.four.five.example.bd"
NAME_EXCP   = "one.two.three.four.five.www.ck"

IAAA = "www.example.ac"
IZZZ = "www.example.zone"

PAAA = "one.two.three.four.five.example.beep.pl"
PZZZ = "one.two.three.four.five.example.now.sh"

JP   = "www.yokoshibahikari.chiba.jp"
IT   = "www.example.it"
COM  = "www.example.com"

TIMES = (ARGV.first || 50_000).to_i

# Initialize
PublicSuffixList = PublicSuffix::List.default
PublicSuffixList.find("example.com")

Benchmark.bmbm(25) do |x|
  x.report("NAME_SHORT") do
    TIMES.times { PublicSuffixList.find(NAME_SHORT) != nil }
  end
  x.report("NAME_MEDIUM") do
    TIMES.times { PublicSuffixList.find(NAME_MEDIUM) != nil }
  end
  x.report("NAME_LONG") do
    TIMES.times { PublicSuffixList.find(NAME_LONG) != nil }
  end
  x.report("NAME_WILD") do
    TIMES.times { PublicSuffixList.find(NAME_WILD) != nil }
  end
  x.report("NAME_EXCP") do
    TIMES.times { PublicSuffixList.find(NAME_EXCP) != nil }
  end

  x.report("IAAA") do
    TIMES.times { PublicSuffixList.find(IAAA) != nil }
  end
  x.report("IZZZ") do
    TIMES.times { PublicSuffixList.find(IZZZ) != nil }
  end

  x.report("PAAA") do
    TIMES.times { PublicSuffixList.find(PAAA) != nil }
  end
  x.report("PZZZ") do
    TIMES.times { PublicSuffixList.find(PZZZ) != nil }
  end

  x.report("JP") do
    TIMES.times { PublicSuffixList.find(JP) != nil }
  end
  x.report("IT") do
    TIMES.times { PublicSuffixList.find(IT) != nil }
  end
  x.report("COM") do
    TIMES.times { PublicSuffixList.find(COM) != nil }
  end
end
