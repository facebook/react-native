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
PublicSuffix.valid?("example.com")

Benchmark.bmbm(25) do |x|
  x.report("NAME_SHORT") do
    TIMES.times { PublicSuffix.valid?(NAME_SHORT) == true }
  end
  x.report("NAME_SHORT (noprivate)") do
    TIMES.times { PublicSuffix.valid?(NAME_SHORT, ignore_private: true) == true }
  end
  x.report("NAME_MEDIUM") do
    TIMES.times { PublicSuffix.valid?(NAME_MEDIUM) == true }
  end
  x.report("NAME_MEDIUM (noprivate)") do
    TIMES.times { PublicSuffix.valid?(NAME_MEDIUM, ignore_private: true) == true }
  end
  x.report("NAME_LONG") do
    TIMES.times { PublicSuffix.valid?(NAME_LONG) == true }
  end
  x.report("NAME_LONG (noprivate)") do
    TIMES.times { PublicSuffix.valid?(NAME_LONG, ignore_private: true) == true }
  end
  x.report("NAME_WILD") do
    TIMES.times { PublicSuffix.valid?(NAME_WILD) == true }
  end
  x.report("NAME_WILD (noprivate)") do
    TIMES.times { PublicSuffix.valid?(NAME_WILD, ignore_private: true) == true }
  end
  x.report("NAME_EXCP") do
    TIMES.times { PublicSuffix.valid?(NAME_EXCP) == true }
  end
  x.report("NAME_EXCP (noprivate)") do
    TIMES.times { PublicSuffix.valid?(NAME_EXCP, ignore_private: true) == true }
  end

  x.report("IAAA") do
    TIMES.times { PublicSuffix.valid?(IAAA) == true }
  end
  x.report("IAAA (noprivate)") do
    TIMES.times { PublicSuffix.valid?(IAAA, ignore_private: true) == true }
  end
  x.report("IZZZ") do
    TIMES.times { PublicSuffix.valid?(IZZZ) == true }
  end
  x.report("IZZZ (noprivate)") do
    TIMES.times { PublicSuffix.valid?(IZZZ, ignore_private: true) == true }
  end

  x.report("PAAA") do
    TIMES.times { PublicSuffix.valid?(PAAA) == true }
  end
  x.report("PAAA (noprivate)") do
    TIMES.times { PublicSuffix.valid?(PAAA, ignore_private: true) == true }
  end
  x.report("PZZZ") do
    TIMES.times { PublicSuffix.valid?(PZZZ) == true }
  end
  x.report("PZZZ (noprivate)") do
    TIMES.times { PublicSuffix.valid?(PZZZ, ignore_private: true) == true }
  end

  x.report("JP") do
    TIMES.times { PublicSuffix.valid?(JP) == true }
  end
  x.report("JP (noprivate)") do
    TIMES.times { PublicSuffix.valid?(JP, ignore_private: true) == true }
  end
  x.report("IT") do
    TIMES.times { PublicSuffix.valid?(IT) == true }
  end
  x.report("IT (noprivate)") do
    TIMES.times { PublicSuffix.valid?(IT, ignore_private: true) == true }
  end
  x.report("COM") do
    TIMES.times { PublicSuffix.valid?(COM) == true }
  end
  x.report("COM (noprivate)") do
    TIMES.times { PublicSuffix.valid?(COM, ignore_private: true) == true }
  end
end
