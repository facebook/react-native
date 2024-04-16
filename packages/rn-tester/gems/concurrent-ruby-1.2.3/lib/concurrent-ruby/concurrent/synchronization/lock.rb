require 'concurrent/synchronization/lockable_object'

module Concurrent
  module Synchronization

    # @!visibility private
    # TODO (pitr-ch 04-Dec-2016): should be in edge
    class Lock < LockableObject
      # TODO use JavaReentrantLock on JRuby

      public :synchronize

      def wait(timeout = nil)
        synchronize { ns_wait(timeout) }
      end

      public :ns_wait

      def wait_until(timeout = nil, &condition)
        synchronize { ns_wait_until(timeout, &condition) }
      end

      public :ns_wait_until

      def signal
        synchronize { ns_signal }
      end

      public :ns_signal

      def broadcast
        synchronize { ns_broadcast }
      end

      public :ns_broadcast
    end
  end
end
