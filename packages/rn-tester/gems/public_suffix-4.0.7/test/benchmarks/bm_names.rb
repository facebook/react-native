require 'benchmark/ips'

STRING = "www.subdomain.example.com"
ARRAY  = %w(
  com
  example.com
  subdomain.example.com
  www.subdomain.example.com
)

def tokenizer1(string)
  parts = string.split(".").reverse!
  index = 0
  query = parts[index]
  names = []

  loop do
    names << query

    index += 1
    break if index >= parts.size
    query = parts[index] + "." + query
  end
  names
end

def tokenizer2(string)
  parts = string.split(".")
  index = parts.size - 1
  query = parts[index]
  names = []

  loop do
    names << query

    index -= 1
    break if index < 0
    query = parts[index] + "." + query
  end
  names
end

def tokenizer3(string)
  isx = string.size
  idx = string.size - 1
  names = []

  loop do
    isx = string.rindex(".", isx - 1) || -1
    names << string[isx + 1, idx - isx]

    break if isx <= 0
  end
  names
end

def tokenizer4(string)
  isx = string.size
  idx = string.size - 1
  names = []

  loop do
    isx = string.rindex(".", isx - 1) || -1
    names << string[(isx+1)..idx]

    break if isx <= 0
  end
  names
end

(x = tokenizer1(STRING)) == ARRAY or fail("tokenizer1 failed: #{x.inspect}")
(x = tokenizer2(STRING)) == ARRAY or fail("tokenizer2 failed: #{x.inspect}")
(x = tokenizer3(STRING)) == ARRAY or fail("tokenizer3 failed: #{x.inspect}")
(x = tokenizer4(STRING)) == ARRAY or fail("tokenizer4 failed: #{x.inspect}")

Benchmark.ips do |x|
  x.report("tokenizer1") do
    tokenizer1(STRING).is_a?(Array)
  end
  x.report("tokenizer2") do
    tokenizer2(STRING).is_a?(Array)
  end
  x.report("tokenizer3") do
    tokenizer3(STRING).is_a?(Array)
  end
  x.report("tokenizer4") do
    tokenizer4(STRING).is_a?(Array)
  end

  x.compare!
end
