# frozen_string_literal: true

require "monitor"

module ActiveSupport
  module Concurrency
    # A monitor that will permit dependency loading while blocked waiting for
    # the lock.
    class LoadInterlockAwareMonitor < Monitor
      EXCEPTION_NEVER = { Exception => :never }.freeze
      EXCEPTION_IMMEDIATE = { Exception => :immediate }.freeze
      private_constant :EXCEPTION_NEVER, :EXCEPTION_IMMEDIATE

      # Enters an exclusive section, but allows dependency loading while blocked
      def mon_enter
        mon_try_enter ||
          ActiveSupport::Dependencies.interlock.permit_concurrent_loads { super }
      end

      def synchronize(&block)
        Thread.handle_interrupt(EXCEPTION_NEVER) do
          mon_enter

          begin
            Thread.handle_interrupt(EXCEPTION_IMMEDIATE, &block)
          ensure
            mon_exit
          end
        end
      end
    end
  end
end
