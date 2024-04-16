# frozen_string_literal: true
require_relative 'ruby_object_leak_tracker'
require_relative 'os_memory_leak_tracker'

module MemoryTestHelpers
  class << self
    attr_accessor :gc_proc, :iterations, :logger

    def setup
      if RUBY_PLATFORM == "java"
        # for leak detection
        JRuby.objectspace = true if defined?(JRuby)
        # for gc
        require 'java'
        java_import 'java.lang.System'
        self.gc_proc = proc { System.gc }
      else
        self.gc_proc = proc { GC.start }
      end
    end
  end

  module TestMethods
    def memory_leak_test(description, &block)
      context(description) do
        it "doesn't leak ruby objects" do
          object_leak_tracker = RubyObjectLeakTracker.new
          track_memory_usage(object_leak_tracker, &block)
          object_leak_tracker.total_difference_between_runs.should be <= 10
        end

        it "doesn't leak OS memory (C interop check)" do
          os_memory_leak_tracker = OSMemoryLeakTracker.new
          track_memory_usage(os_memory_leak_tracker, &block)
          os_memory_leak_tracker.total_difference_between_runs.should be <= 10
        end
      end
    end
  end

  def track_memory_usage(tracker)
    # Intentionally do all this setup before we do any testing
    logger = MemoryTestHelpers.logger
    iterations = MemoryTestHelpers.iterations

    checkpoint_frequency = (iterations / 10.0).to_i
    gc_frequency = 20

    warmup_iterations = [(iterations / 3.0).to_i, 500].min
    logger.info "Performing #{warmup_iterations} warmup iterations"
    warmup_iterations.times do
      yield
      MemoryTestHelpers.gc_proc.call
    end
    tracker.capture_initial_memory_usage

    logger.info "Performing #{iterations} iterations (checkpoint every #{checkpoint_frequency})"

    iterations.times do |i|
      yield

      last_iteration = (i == iterations - 1)
      checkpoint = last_iteration || (i % checkpoint_frequency == 0)

      if checkpoint || (i % gc_frequency == 0)
        MemoryTestHelpers.gc_proc.call
      end

      if checkpoint
        logger.info "Iteration #{i} checkpoint"
        tracker.capture_memory_usage
        tracker.dump_status(logger)
      end
    end
  end
end
