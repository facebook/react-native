# frozen_string_literal: true

require "active_support/time_with_zone"

module ActiveSupport
  module EachTimeWithZone # :nodoc:
    def each(&block)
      ensure_iteration_allowed
      super
    end

    def step(n = 1, &block)
      ensure_iteration_allowed
      super
    end

    private
      def ensure_iteration_allowed
        raise TypeError, "can't iterate from #{first.class}" if first.is_a?(TimeWithZone)
      end
  end
end

Range.prepend(ActiveSupport::EachTimeWithZone)
