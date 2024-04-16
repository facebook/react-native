require 'concurrent/collection/copy_on_notify_observer_set'
require 'concurrent/collection/copy_on_write_observer_set'

module Concurrent
  module Concern

    # The [observer pattern](http://en.wikipedia.org/wiki/Observer_pattern) is one
    # of the most useful design patterns.
    #
    # The workflow is very simple:
    # - an `observer` can register itself to a `subject` via a callback
    # - many `observers` can be registered to the same `subject`
    # - the `subject` notifies all registered observers when its status changes
    # - an `observer` can deregister itself when is no more interested to receive
    #     event notifications
    #
    # In a single threaded environment the whole pattern is very easy: the
    # `subject` can use a simple data structure to manage all its subscribed
    # `observer`s and every `observer` can react directly to every event without
    # caring about synchronization.
    #
    # In a multi threaded environment things are more complex. The `subject` must
    # synchronize the access to its data structure and to do so currently we're
    # using two specialized ObserverSet: {Concurrent::Concern::CopyOnWriteObserverSet}
    # and {Concurrent::Concern::CopyOnNotifyObserverSet}.
    #
    # When implementing and `observer` there's a very important rule to remember:
    # **there are no guarantees about the thread that will execute the callback**
    #
    # Let's take this example
    # ```
    # class Observer
    #   def initialize
    #     @count = 0
    #   end
    #
    #   def update
    #     @count += 1
    #   end
    # end
    #
    # obs = Observer.new
    # [obj1, obj2, obj3, obj4].each { |o| o.add_observer(obs) }
    # # execute [obj1, obj2, obj3, obj4]
    # ```
    #
    # `obs` is wrong because the variable `@count` can be accessed by different
    # threads at the same time, so it should be synchronized (using either a Mutex
    # or an AtomicFixum)
    module Observable

      # @!macro observable_add_observer
      #
      #   Adds an observer to this set. If a block is passed, the observer will be
      #   created by this method and no other params should be passed.
      #
      #   @param [Object] observer the observer to add
      #   @param [Symbol] func the function to call on the observer during notification.
      #     Default is :update
      #   @return [Object] the added observer
      def add_observer(observer = nil, func = :update, &block)
        observers.add_observer(observer, func, &block)
      end

      # As `#add_observer` but can be used for chaining.
      #
      # @param [Object] observer the observer to add
      # @param [Symbol] func the function to call on the observer during notification.
      # @return [Observable] self
      def with_observer(observer = nil, func = :update, &block)
        add_observer(observer, func, &block)
        self
      end

      # @!macro observable_delete_observer
      #
      #   Remove `observer` as an observer on this object so that it will no
      #   longer receive notifications.
      #
      #   @param [Object] observer the observer to remove
      #   @return [Object] the deleted observer
      def delete_observer(observer)
        observers.delete_observer(observer)
      end

      # @!macro observable_delete_observers
      #
      #   Remove all observers associated with this object.
      #
      #   @return [Observable] self
      def delete_observers
        observers.delete_observers
        self
      end

      # @!macro observable_count_observers
      #
      #   Return the number of observers associated with this object.
      #
      #   @return [Integer] the observers count
      def count_observers
        observers.count_observers
      end

      protected

      attr_accessor :observers
    end
  end
end
