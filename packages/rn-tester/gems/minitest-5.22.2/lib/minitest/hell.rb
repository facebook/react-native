require "minitest/parallel"

class Minitest::Test
  parallelize_me!
end

begin
  require "minitest/proveit"
rescue LoadError
  warn "NOTE: `gem install minitest-proveit` for even more hellish tests"
end
