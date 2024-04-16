require 'concurrent/synchronization/lockable_object'

module Concurrent
  module Collection

    # A thread safe observer set implemented using copy-on-write approach:
    # every time an observer is added or removed the whole internal data structure is
    # duplicated and replaced with a new one.
    #
    # @api private
    class CopyOnWriteObserverSet < Synchronization::LockableObject

      def initialize
        super()
        synchronize { ns_initialize }
      end

      # @!macro observable_add_observer
      def add_observer(observer = nil, func = :update, &block)
        if observer.nil? && block.nil?
          raise ArgumentError, 'should pass observer as a first argument or block'
        elsif observer && block
          raise ArgumentError.new('cannot provide both an observer and a block')
        end

        if block
          observer = block
          func = :call
        end

        synchronize do
          new_observers = @observers.dup
          new_observers[observer] = func
          @observers = new_observers
          observer
        end
      end

      # @!macro observable_delete_observer
      def delete_observer(observer)
        synchronize do
          new_observers = @observers.dup
          new_observers.delete(observer)
          @observers = new_observers
          observer
        end
      end

      # @!macro observable_delete_observers
      def delete_observers
        self.observers = {}
        self
      end

      # @!macro observable_count_observers
      def count_observers
        observers.count
      end

      # Notifies all registered observers with optional args
      # @param [Object] args arguments to be passed to each observer
      # @return [CopyOnWriteObserverSet] self
      def notify_observers(*args, &block)
        notify_to(observers, *args, &block)
        self
      end

      # Notifies all registered observers with optional args and deletes them.
      #
      # @param [Object] args arguments to be passed to each observer
      # @return [CopyOnWriteObserverSet] self
      def notify_and_delete_observers(*args, &block)
        old = clear_observers_and_return_old
        notify_to(old, *args, &block)
        self
      end

      protected

      def ns_initialize
        @observers = {}
      end

      private

      def notify_to(observers, *args)
        raise ArgumentError.new('cannot give arguments and a block') if block_given? && !args.empty?
        observers.each do |observer, function|
          args = yield if block_given?
          observer.send(function, *args)
        end
      end

      def observers
        synchronize { @observers }
      end

      def observers=(new_set)
        synchronize { @observers = new_set }
      end

      def clear_observers_and_return_old
        synchronize do
          old_observers = @observers
          @observers = {}
          old_observers
        end
      end
    end
  end
end
