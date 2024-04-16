unless defined?(Minitest) then
  # all of this crap is just to avoid circular requires and is only
  # needed if a user requires "minitest/unit" directly instead of
  # "minitest/autorun", so we also warn

  from = caller.reject { |s| s =~ /rubygems/ }.join("\n  ")
  warn "Warning: you should require 'minitest/autorun' instead."
  warn %(Warning: or add 'gem "minitest"' before 'require "minitest/autorun"')
  warn "From:\n  #{from}"

  module Minitest # :nodoc:
  end
  MiniTest = Minitest # :nodoc: # prevents minitest.rb from requiring back to us
  require "minitest"
end

MiniTest = Minitest unless defined?(MiniTest)

module Minitest
  class Unit # :nodoc:
    VERSION = Minitest::VERSION
    class TestCase < Minitest::Test # :nodoc:
      def self.inherited klass # :nodoc:
        from = caller.first
        warn "MiniTest::Unit::TestCase is now Minitest::Test. From #{from}"
        super
      end
    end

    def self.autorun # :nodoc:
      from = caller.first
      warn "MiniTest::Unit.autorun is now Minitest.autorun. From #{from}"
      Minitest.autorun
    end

    def self.after_tests &b # :nodoc:
      from = caller.first
      warn "MiniTest::Unit.after_tests is now Minitest.after_run. From #{from}"
      Minitest.after_run(&b)
    end
  end
end
