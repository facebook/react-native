# frozen_string_literal: true

require "test_helper"
require "public_suffix"

# This test runs against the current PSL file and ensures
# the definitions satisfies the test suite.
class PslTest < Minitest::Test

  ROOT = File.expand_path("..", __dir__)

  # rubocop:disable Security/Eval
  def self.tests
    File.readlines(File.join(ROOT, "test/tests.txt")).map do |line|
      line = line.strip
      next if line.empty?
      next if line.start_with?("//")

      input, output = line.split(", ")

      # handle the case of eval("null"), it must be eval("nil")
      input  = "nil" if input  == "null"
      output = "nil" if output == "null"

      input  = eval(input)
      output = eval(output)
      [input, output]
    end
  end
  # rubocop:enable Security/Eval


  def test_valid
    # Parse the PSL and run the tests
    data = File.read(PublicSuffix::List::DEFAULT_LIST_PATH)
    PublicSuffix::List.default = PublicSuffix::List.parse(data)

    failures = []
    self.class.tests.each do |input, output|
      # Punycode domains are not supported ATM
      next if input =~ /xn--/

      domain = PublicSuffix.domain(input) rescue nil
      failures << [input, output, domain] if output != domain
    end

    message = "The following #{failures.size} tests fail:\n"
    failures.each { |i, o, d| message += "Expected %s to be %s, got %s\n" % [i.inspect, o.inspect, d.inspect] }
    assert_equal 0, failures.size, message
  end

end
