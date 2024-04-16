# frozen_string_literal: true

require "mutex_m"
require "concurrent/map"
require "set"
require "active_support/core_ext/object/try"

module ActiveSupport
  module Notifications
    class InstrumentationSubscriberError < RuntimeError
      attr_reader :exceptions

      def initialize(exceptions)
        @exceptions = exceptions
        exception_class_names = exceptions.map { |e| e.class.name }
        super "Exception(s) occurred within instrumentation subscribers: #{exception_class_names.join(', ')}"
      end
    end

    # This is a default queue implementation that ships with Notifications.
    # It just pushes events to all registered log subscribers.
    #
    # This class is thread safe. All methods are reentrant.
    class Fanout
      include Mutex_m

      def initialize
        @string_subscribers = Hash.new { |h, k| h[k] = [] }
        @other_subscribers = []
        @listeners_for = Concurrent::Map.new
        super
      end

      def subscribe(pattern = nil, callable = nil, monotonic: false, &block)
        subscriber = Subscribers.new(pattern, callable || block, monotonic)
        synchronize do
          case pattern
          when String
            @string_subscribers[pattern] << subscriber
            @listeners_for.delete(pattern)
          when NilClass, Regexp
            @other_subscribers << subscriber
            @listeners_for.clear
          else
            raise ArgumentError,  "pattern must be specified as a String, Regexp or empty"
          end
        end
        subscriber
      end

      def unsubscribe(subscriber_or_name)
        synchronize do
          case subscriber_or_name
          when String
            @string_subscribers[subscriber_or_name].clear
            @listeners_for.delete(subscriber_or_name)
            @other_subscribers.each { |sub| sub.unsubscribe!(subscriber_or_name) }
          else
            pattern = subscriber_or_name.try(:pattern)
            if String === pattern
              @string_subscribers[pattern].delete(subscriber_or_name)
              @listeners_for.delete(pattern)
            else
              @other_subscribers.delete(subscriber_or_name)
              @listeners_for.clear
            end
          end
        end
      end

      def start(name, id, payload)
        iterate_guarding_exceptions(listeners_for(name)) { |s| s.start(name, id, payload) }
      end

      def finish(name, id, payload, listeners = listeners_for(name))
        iterate_guarding_exceptions(listeners) { |s| s.finish(name, id, payload) }
      end

      def publish(name, *args)
        iterate_guarding_exceptions(listeners_for(name)) { |s| s.publish(name, *args) }
      end

      def publish_event(event)
        iterate_guarding_exceptions(listeners_for(event.name)) { |s| s.publish_event(event) }
      end

      def iterate_guarding_exceptions(listeners)
        exceptions = nil

        listeners.each do |s|
          yield s
        rescue Exception => e
          exceptions ||= []
          exceptions << e
        end

        if exceptions
          if exceptions.size == 1
            raise exceptions.first
          else
            raise InstrumentationSubscriberError.new(exceptions), cause: exceptions.first
          end
        end

        listeners
      end

      def listeners_for(name)
        # this is correctly done double-checked locking (Concurrent::Map's lookups have volatile semantics)
        @listeners_for[name] || synchronize do
          # use synchronisation when accessing @subscribers
          @listeners_for[name] ||=
            @string_subscribers[name] + @other_subscribers.select { |s| s.subscribed_to?(name) }
        end
      end

      def listening?(name)
        listeners_for(name).any?
      end

      # This is a sync queue, so there is no waiting.
      def wait
      end

      module Subscribers # :nodoc:
        def self.new(pattern, listener, monotonic)
          subscriber_class = monotonic ? MonotonicTimed : Timed

          if listener.respond_to?(:start) && listener.respond_to?(:finish)
            subscriber_class = Evented
          else
            # Doing this to detect a single argument block or callable
            # like `proc { |x| }` vs `proc { |*x| }`, `proc { |**x| }`,
            # or `proc { |x, **y| }`
            procish = listener.respond_to?(:parameters) ? listener : listener.method(:call)

            if procish.arity == 1 && procish.parameters.length == 1
              subscriber_class = EventObject
            end
          end

          subscriber_class.new(pattern, listener)
        end

        class Matcher # :nodoc:
          attr_reader :pattern, :exclusions

          def self.wrap(pattern)
            if String === pattern
              pattern
            elsif pattern.nil?
              AllMessages.new
            else
              new(pattern)
            end
          end

          def initialize(pattern)
            @pattern = pattern
            @exclusions = Set.new
          end

          def unsubscribe!(name)
            exclusions << -name if pattern === name
          end

          def ===(name)
            pattern === name && !exclusions.include?(name)
          end

          class AllMessages
            def ===(name)
              true
            end

            def unsubscribe!(*)
              false
            end
          end
        end

        class Evented # :nodoc:
          attr_reader :pattern

          def initialize(pattern, delegate)
            @pattern = Matcher.wrap(pattern)
            @delegate = delegate
            @can_publish = delegate.respond_to?(:publish)
            @can_publish_event = delegate.respond_to?(:publish_event)
          end

          def publish(name, *args)
            if @can_publish
              @delegate.publish name, *args
            end
          end

          def publish_event(event)
            if @can_publish_event
              @delegate.publish_event event
            else
              publish(event.name, event.time, event.end, event.transaction_id, event.payload)
            end
          end

          def start(name, id, payload)
            @delegate.start name, id, payload
          end

          def finish(name, id, payload)
            @delegate.finish name, id, payload
          end

          def subscribed_to?(name)
            pattern === name
          end

          def unsubscribe!(name)
            pattern.unsubscribe!(name)
          end
        end

        class Timed < Evented # :nodoc:
          def publish(name, *args)
            @delegate.call name, *args
          end

          def start(name, id, payload)
            timestack = IsolatedExecutionState[:_timestack] ||= []
            timestack.push Time.now
          end

          def finish(name, id, payload)
            timestack = IsolatedExecutionState[:_timestack]
            started = timestack.pop
            @delegate.call(name, started, Time.now, id, payload)
          end
        end

        class MonotonicTimed < Evented # :nodoc:
          def publish(name, *args)
            @delegate.call name, *args
          end

          def start(name, id, payload)
            timestack = IsolatedExecutionState[:_timestack_monotonic] ||= []
            timestack.push Process.clock_gettime(Process::CLOCK_MONOTONIC)
          end

          def finish(name, id, payload)
            timestack = IsolatedExecutionState[:_timestack_monotonic]
            started = timestack.pop
            @delegate.call(name, started, Process.clock_gettime(Process::CLOCK_MONOTONIC), id, payload)
          end
        end

        class EventObject < Evented
          def start(name, id, payload)
            stack = IsolatedExecutionState[:_event_stack] ||= []
            event = build_event name, id, payload
            event.start!
            stack.push event
          end

          def finish(name, id, payload)
            stack = IsolatedExecutionState[:_event_stack]
            event = stack.pop
            event.payload = payload
            event.finish!
            @delegate.call event
          end

          def publish_event(event)
            @delegate.call event
          end

          private
            def build_event(name, id, payload)
              ActiveSupport::Notifications::Event.new name, nil, nil, id, payload
            end
        end
      end
    end
  end
end
