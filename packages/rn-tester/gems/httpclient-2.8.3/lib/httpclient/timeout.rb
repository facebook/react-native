# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


require 'timeout'
require 'thread'


class HTTPClient


  # Replaces timeout.rb to avoid Thread creation and scheduling overhead.
  #
  # You should check another timeout replace in WEBrick.
  # See lib/webrick/utils.rb in ruby/1.9.
  #
  # About this implementation:
  # * Do not create Thread for each timeout() call.  Just create 1 Thread for
  #   timeout scheduler.
  # * Do not wakeup the scheduler thread so often.  Let scheduler thread sleep
  #   until the nearest period.
if !defined?(JRUBY_VERSION) and RUBY_VERSION < '1.9'
  class TimeoutScheduler

    # Represents timeout period.
    class Period
      attr_reader :thread, :time

      # Creates new Period.
      def initialize(thread, time, ex)
        @thread, @time, @ex = thread, time, ex
        @lock = Mutex.new
      end

      # Raises if thread exists and alive.
      def raise(message)
        @lock.synchronize do
          if @thread and @thread.alive?
            @thread.raise(@ex, message)
          end
        end
      end

      # Cancel this Period.  Mutex is needed to avoid too-late exception.
      def cancel
        @lock.synchronize do
          @thread = nil
        end
      end
    end

    # Creates new TimeoutScheduler.
    def initialize
      @pool = {}
      @next = nil
      @thread = start_timer_thread
    end

    # Registers new timeout period.
    def register(thread, sec, ex)
      period = Period.new(thread, Time.now + sec, ex || ::Timeout::Error)
      @pool[period] = true
      if @next.nil? or period.time < @next
        begin
          @thread.wakeup
        rescue ThreadError
          # Thread may be dead by fork.
          @thread = start_timer_thread
        end
      end
      period
    end

    # Cancels the given period.
    def cancel(period)
      @pool.delete(period)
      period.cancel
    end

  private

    def start_timer_thread
      thread = Thread.new {
        while true
          if @pool.empty?
            @next = nil
            sleep
          else
            min, = @pool.min { |a, b| a[0].time <=> b[0].time }
            @next = min.time
            sec = @next - Time.now
            if sec > 0
              sleep(sec)
            end
          end
          now = Time.now
          @pool.keys.each do |period|
            if period.time < now
              period.raise('execution expired')
              cancel(period)
            end
          end
        end
      }
      Thread.pass while thread.status != 'sleep'
      thread
    end
  end

  class << self
    # CAUTION: caller must aware of race condition.
    def timeout_scheduler
      @timeout_scheduler ||= TimeoutScheduler.new
    end
  end
  timeout_scheduler # initialize at first time.
end

  module Timeout
    if !defined?(JRUBY_VERSION) and RUBY_VERSION < '1.9'
      def timeout(sec, ex = nil, &block)
        return yield if sec == nil or sec.zero?
        scheduler = nil
        begin
          scheduler = HTTPClient.timeout_scheduler
          period = scheduler.register(Thread.current, sec, ex)
          yield(sec)
        ensure
          scheduler.cancel(period) if scheduler and period
        end
      end
    end
  end


end
