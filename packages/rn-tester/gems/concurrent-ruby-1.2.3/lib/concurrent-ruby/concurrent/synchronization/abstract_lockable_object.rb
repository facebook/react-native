require 'concurrent/utility/native_extension_loader' # load native parts first
require 'concurrent/utility/monotonic_time'
require 'concurrent/synchronization/object'

module Concurrent
  module Synchronization

    # @!visibility private
    class AbstractLockableObject < Synchronization::Object

      protected

      # @!macro synchronization_object_method_synchronize
      #
      #   @yield runs the block synchronized against this object,
      #     equivalent of java's `synchronize(this) {}`
      #   @note can by made public in descendants if required by `public :synchronize`
      def synchronize
        raise NotImplementedError
      end

      # @!macro synchronization_object_method_ns_wait_until
      #
      #   Wait until condition is met or timeout passes,
      #   protects against spurious wake-ups.
      #   @param [Numeric, nil] timeout in seconds, `nil` means no timeout
      #   @yield condition to be met
      #   @yieldreturn [true, false]
      #   @return [true, false] if condition met
      #   @note only to be used inside synchronized block
      #   @note to provide direct access to this method in a descendant add method
      #     ```
      #     def wait_until(timeout = nil, &condition)
      #       synchronize { ns_wait_until(timeout, &condition) }
      #     end
      #     ```
      def ns_wait_until(timeout = nil, &condition)
        if timeout
          wait_until = Concurrent.monotonic_time + timeout
          loop do
            now = Concurrent.monotonic_time
            condition_result = condition.call
            return condition_result if now >= wait_until || condition_result
            ns_wait wait_until - now
          end
        else
          ns_wait timeout until condition.call
          true
        end
      end

      # @!macro synchronization_object_method_ns_wait
      #
      #   Wait until another thread calls #signal or #broadcast,
      #   spurious wake-ups can happen.
      #
      #   @param [Numeric, nil] timeout in seconds, `nil` means no timeout
      #   @return [self]
      #   @note only to be used inside synchronized block
      #   @note to provide direct access to this method in a descendant add method
      #     ```
      #     def wait(timeout = nil)
      #       synchronize { ns_wait(timeout) }
      #     end
      #     ```
      def ns_wait(timeout = nil)
        raise NotImplementedError
      end

      # @!macro synchronization_object_method_ns_signal
      #
      #   Signal one waiting thread.
      #   @return [self]
      #   @note only to be used inside synchronized block
      #   @note to provide direct access to this method in a descendant add method
      #     ```
      #     def signal
      #       synchronize { ns_signal }
      #     end
      #     ```
      def ns_signal
        raise NotImplementedError
      end

      # @!macro synchronization_object_method_ns_broadcast
      #
      #   Broadcast to all waiting threads.
      #   @return [self]
      #   @note only to be used inside synchronized block
      #   @note to provide direct access to this method in a descendant add method
      #     ```
      #     def broadcast
      #       synchronize { ns_broadcast }
      #     end
      #     ```
      def ns_broadcast
        raise NotImplementedError
      end

    end
  end
end
