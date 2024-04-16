# frozen_string_literal: true

require "securerandom"

module ActiveSupport
  module Notifications
    # Instrumenters are stored in a thread local.
    class Instrumenter
      attr_reader :id

      def initialize(notifier)
        @id       = unique_id
        @notifier = notifier
      end

      # Given a block, instrument it by measuring the time taken to execute
      # and publish it. Without a block, simply send a message via the
      # notifier. Notice that events get sent even if an error occurs in the
      # passed-in block.
      def instrument(name, payload = {})
        # some of the listeners might have state
        listeners_state = start name, payload
        begin
          yield payload if block_given?
        rescue Exception => e
          payload[:exception] = [e.class.name, e.message]
          payload[:exception_object] = e
          raise e
        ensure
          finish_with_state listeners_state, name, payload
        end
      end

      def new_event(name, payload = {}) # :nodoc:
        Event.new(name, nil, nil, @id, payload)
      end

      # Send a start notification with +name+ and +payload+.
      def start(name, payload)
        @notifier.start name, @id, payload
      end

      # Send a finish notification with +name+ and +payload+.
      def finish(name, payload)
        @notifier.finish name, @id, payload
      end

      def finish_with_state(listeners_state, name, payload)
        @notifier.finish name, @id, payload, listeners_state
      end

      private
        def unique_id
          SecureRandom.hex(10)
        end
    end

    class Event
      attr_reader :name, :time, :end, :transaction_id, :children
      attr_accessor :payload

      def initialize(name, start, ending, transaction_id, payload)
        @name           = name
        @payload        = payload.dup
        @time           = start ? start.to_f * 1_000.0 : start
        @transaction_id = transaction_id
        @end            = ending ? ending.to_f * 1_000.0 : ending
        @children       = []
        @cpu_time_start = 0.0
        @cpu_time_finish = 0.0
        @allocation_count_start = 0
        @allocation_count_finish = 0
      end

      def record
        start!
        begin
          yield payload if block_given?
        rescue Exception => e
          payload[:exception] = [e.class.name, e.message]
          payload[:exception_object] = e
          raise e
        ensure
          finish!
        end
      end

      # Record information at the time this event starts
      def start!
        @time = now
        @cpu_time_start = now_cpu
        @allocation_count_start = now_allocations
      end

      # Record information at the time this event finishes
      def finish!
        @cpu_time_finish = now_cpu
        @end = now
        @allocation_count_finish = now_allocations
      end

      # Returns the CPU time (in milliseconds) passed since the call to
      # +start!+ and the call to +finish!+
      def cpu_time
        @cpu_time_finish - @cpu_time_start
      end

      # Returns the idle time time (in milliseconds) passed since the call to
      # +start!+ and the call to +finish!+
      def idle_time
        duration - cpu_time
      end

      # Returns the number of allocations made since the call to +start!+ and
      # the call to +finish!+
      def allocations
        @allocation_count_finish - @allocation_count_start
      end

      # Returns the difference in milliseconds between when the execution of the
      # event started and when it ended.
      #
      #   ActiveSupport::Notifications.subscribe('wait') do |*args|
      #     @event = ActiveSupport::Notifications::Event.new(*args)
      #   end
      #
      #   ActiveSupport::Notifications.instrument('wait') do
      #     sleep 1
      #   end
      #
      #   @event.duration # => 1000.138
      def duration
        self.end - time
      end

      def <<(event)
        @children << event
      end

      def parent_of?(event)
        @children.include? event
      end

      private
        def now
          Process.clock_gettime(Process::CLOCK_MONOTONIC, :float_millisecond)
        end

        begin
          Process.clock_gettime(Process::CLOCK_THREAD_CPUTIME_ID, :float_millisecond)

          def now_cpu
            Process.clock_gettime(Process::CLOCK_THREAD_CPUTIME_ID, :float_millisecond)
          end
        rescue
          def now_cpu # rubocop:disable Lint/DuplicateMethods
            0.0
          end
        end

        if GC.stat.key?(:total_allocated_objects)
          def now_allocations
            GC.stat(:total_allocated_objects)
          end
        else # Likely on JRuby, TruffleRuby
          def now_allocations
            0
          end
        end
    end
  end
end
