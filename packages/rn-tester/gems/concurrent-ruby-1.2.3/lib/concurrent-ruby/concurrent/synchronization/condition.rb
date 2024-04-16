require 'concurrent/synchronization/lockable_object'

module Concurrent
  module Synchronization

    # @!visibility private
    # TODO (pitr-ch 04-Dec-2016): should be in edge
    class Condition < LockableObject
      safe_initialization!

      # TODO (pitr 12-Sep-2015): locks two objects, improve
      # TODO (pitr 26-Sep-2015): study
      # http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/8-b132/java/util/concurrent/locks/AbstractQueuedSynchronizer.java#AbstractQueuedSynchronizer.Node

      singleton_class.send :alias_method, :private_new, :new
      private_class_method :new

      def initialize(lock)
        super()
        @Lock = lock
      end

      def wait(timeout = nil)
        @Lock.synchronize { ns_wait(timeout) }
      end

      def ns_wait(timeout = nil)
        synchronize { super(timeout) }
      end

      def wait_until(timeout = nil, &condition)
        @Lock.synchronize { ns_wait_until(timeout, &condition) }
      end

      def ns_wait_until(timeout = nil, &condition)
        synchronize { super(timeout, &condition) }
      end

      def signal
        @Lock.synchronize { ns_signal }
      end

      def ns_signal
        synchronize { super }
      end

      def broadcast
        @Lock.synchronize { ns_broadcast }
      end

      def ns_broadcast
        synchronize { super }
      end
    end

    class LockableObject < LockableObjectImplementation
      def new_condition
        Condition.private_new(self)
      end
    end
  end
end
