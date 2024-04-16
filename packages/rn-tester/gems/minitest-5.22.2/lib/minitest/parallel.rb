module Minitest
  module Parallel #:nodoc:

    ##
    # The engine used to run multiple tests in parallel.

    class Executor

      ##
      # The size of the pool of workers.

      attr_reader :size

      ##
      # Create a parallel test executor of with +size+ workers.

      def initialize size
        @size  = size
        @queue = Queue.new
        @pool  = nil
      end

      ##
      # Start the executor

      def start
        @pool  = size.times.map {
          Thread.new(@queue) do |queue|
            Thread.current.abort_on_exception = true
            while (job = queue.pop)
              klass, method, reporter = job
              reporter.synchronize { reporter.prerecord klass, method }
              result = Minitest.run_one_method klass, method
              reporter.synchronize { reporter.record result }
            end
          end
        }
      end

      ##
      # Add a job to the queue

      def << work; @queue << work; end

      ##
      # Shuts down the pool of workers by signalling them to quit and
      # waiting for them all to finish what they're currently working
      # on.

      def shutdown
        size.times { @queue << nil }
        @pool.each(&:join)
      end
    end

    module Test # :nodoc:
      def _synchronize; Minitest::Test.io_lock.synchronize { yield }; end # :nodoc:

      module ClassMethods # :nodoc:
        def run_one_method klass, method_name, reporter
          Minitest.parallel_executor << [klass, method_name, reporter]
        end

        def test_order
          :parallel
        end
      end
    end
  end
end
