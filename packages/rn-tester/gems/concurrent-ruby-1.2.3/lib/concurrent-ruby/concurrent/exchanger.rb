require 'concurrent/constants'
require 'concurrent/errors'
require 'concurrent/maybe'
require 'concurrent/atomic/atomic_reference'
require 'concurrent/atomic/count_down_latch'
require 'concurrent/utility/engine'
require 'concurrent/utility/monotonic_time'

module Concurrent

  # @!macro exchanger
  #
  #   A synchronization point at which threads can pair and swap elements within
  #   pairs. Each thread presents some object on entry to the exchange method,
  #   matches with a partner thread, and receives its partner's object on return.
  #
  #   @!macro thread_safe_variable_comparison
  #
  #   This implementation is very simple, using only a single slot for each
  #   exchanger (unlike more advanced implementations which use an "arena").
  #   This approach will work perfectly fine when there are only a few threads
  #   accessing a single `Exchanger`. Beyond a handful of threads the performance
  #   will degrade rapidly due to contention on the single slot, but the algorithm
  #   will remain correct.
  #
  #   @see http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Exchanger.html java.util.concurrent.Exchanger
  #   @example
  #
  #     exchanger = Concurrent::Exchanger.new
  #
  #     threads = [
  #       Thread.new { puts "first: " << exchanger.exchange('foo', 1) }, #=> "first: bar"
  #       Thread.new { puts "second: " << exchanger.exchange('bar', 1) } #=> "second: foo"
  #     ]
  #     threads.each {|t| t.join(2) }

  # @!visibility private
  class AbstractExchanger < Synchronization::Object

    # @!visibility private
    CANCEL = ::Object.new
    private_constant :CANCEL

    def initialize
      super
    end

    # @!macro exchanger_method_do_exchange
    #
    #   Waits for another thread to arrive at this exchange point (unless the
    #   current thread is interrupted), and then transfers the given object to
    #   it, receiving its object in return. The timeout value indicates the
    #   approximate number of seconds the method should block while waiting
    #   for the exchange. When the timeout value is `nil` the method will
    #   block indefinitely.
    #
    #   @param [Object] value the value to exchange with another thread
    #   @param [Numeric, nil] timeout in seconds, `nil` blocks indefinitely
    #
    # @!macro exchanger_method_exchange
    #
    #   In some edge cases when a `timeout` is given a return value of `nil` may be
    #   ambiguous. Specifically, if `nil` is a valid value in the exchange it will
    #   be impossible to tell whether `nil` is the actual return value or if it
    #   signifies timeout. When `nil` is a valid value in the exchange consider
    #   using {#exchange!} or {#try_exchange} instead.
    #
    #   @return [Object] the value exchanged by the other thread or `nil` on timeout
    def exchange(value, timeout = nil)
      (value = do_exchange(value, timeout)) == CANCEL ? nil : value
    end

    # @!macro exchanger_method_do_exchange
    # @!macro exchanger_method_exchange_bang
    #
    #   On timeout a {Concurrent::TimeoutError} exception will be raised.
    #
    #   @return [Object] the value exchanged by the other thread
    #   @raise [Concurrent::TimeoutError] on timeout
    def exchange!(value, timeout = nil)
      if (value = do_exchange(value, timeout)) == CANCEL
        raise Concurrent::TimeoutError
      else
        value
      end
    end

    # @!macro exchanger_method_do_exchange
    # @!macro exchanger_method_try_exchange
    #
    #   The return value will be a {Concurrent::Maybe} set to `Just` on success or
    #   `Nothing` on timeout.
    #
    #   @return [Concurrent::Maybe] on success a `Just` maybe will be returned with
    #     the item exchanged by the other thread as `#value`; on timeout a
    #     `Nothing` maybe will be returned with {Concurrent::TimeoutError} as `#reason`
    #
    #   @example
    #
    #     exchanger = Concurrent::Exchanger.new
    #
    #     result = exchanger.exchange(:foo, 0.5)
    #
    #     if result.just?
    #       puts result.value #=> :bar
    #     else
    #       puts 'timeout'
    #     end
    def try_exchange(value, timeout = nil)
      if (value = do_exchange(value, timeout)) == CANCEL
        Concurrent::Maybe.nothing(Concurrent::TimeoutError)
      else
        Concurrent::Maybe.just(value)
      end
    end

    private

    # @!macro exchanger_method_do_exchange
    #
    # @return [Object, CANCEL] the value exchanged by the other thread; {CANCEL} on timeout
    def do_exchange(value, timeout)
      raise NotImplementedError
    end
  end

  # @!macro internal_implementation_note
  # @!visibility private
  class RubyExchanger < AbstractExchanger
    # A simplified version of java.util.concurrent.Exchanger written by
    # Doug Lea, Bill Scherer, and Michael Scott with assistance from members
    # of JCP JSR-166 Expert Group and released to the public domain. It does
    # not include the arena or the multi-processor spin loops.
    # http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/util/concurrent/Exchanger.java

    safe_initialization!

    class Node < Concurrent::Synchronization::Object
      attr_atomic :value
      safe_initialization!

      def initialize(item)
        super()
        @Item      = item
        @Latch     = Concurrent::CountDownLatch.new
        self.value = nil
      end

      def latch
        @Latch
      end

      def item
        @Item
      end
    end
    private_constant :Node

    def initialize
      super
    end

    private

    attr_atomic(:slot)

    # @!macro exchanger_method_do_exchange
    #
    # @return [Object, CANCEL] the value exchanged by the other thread; {CANCEL} on timeout
    def do_exchange(value, timeout)

      # ALGORITHM
      #
      # From the original Java version:
      #
      # > The basic idea is to maintain a "slot", which is a reference to
      # > a Node containing both an Item to offer and a "hole" waiting to
      # > get filled in.  If an incoming "occupying" thread sees that the
      # > slot is null, it CAS'es (compareAndSets) a Node there and waits
      # > for another to invoke exchange.  That second "fulfilling" thread
      # > sees that the slot is non-null, and so CASes it back to null,
      # > also exchanging items by CASing the hole, plus waking up the
      # > occupying thread if it is blocked.  In each case CAS'es may
      # > fail because a slot at first appears non-null but is null upon
      # > CAS, or vice-versa.  So threads may need to retry these
      # > actions.
      #
      # This version:
      #
      # An exchange occurs between an "occupier" thread and a "fulfiller" thread.
      # The "slot" is used to setup this interaction. The first thread in the
      # exchange puts itself into the slot (occupies) and waits for a fulfiller.
      # The second thread removes the occupier from the slot and attempts to
      # perform the exchange. Removing the occupier also frees the slot for
      # another occupier/fulfiller pair.
      #
      # Because the occupier and the fulfiller are operating independently and
      # because there may be contention with other threads, any failed operation
      # indicates contention. Both the occupier and the fulfiller operate within
      # spin loops. Any failed actions along the happy path will cause the thread
      # to repeat the loop and try again.
      #
      # When a timeout value is given the thread must be cognizant of time spent
      # in the spin loop. The remaining time is checked every loop. When the time
      # runs out the thread will exit.
      #
      # A "node" is the data structure used to perform the exchange. Only the
      # occupier's node is necessary. It's the node used for the exchange.
      # Each node has an "item," a "hole" (self), and a "latch." The item is the
      # node's initial value. It never changes. It's what the fulfiller returns on
      # success. The occupier's hole is where the fulfiller put its item. It's the
      # item that the occupier returns on success. The latch is used for synchronization.
      # Because a thread may act as either an occupier or fulfiller (or possibly
      # both in periods of high contention) every thread creates a node when
      # the exchange method is first called.
      #
      # The following steps occur within the spin loop. If any actions fail
      # the thread will loop and try again, so long as there is time remaining.
      # If time runs out the thread will return CANCEL.
      #
      # Check the slot for an occupier:
      #
      #   * If the slot is empty try to occupy
      #   * If the slot is full try to fulfill
      #
      # Attempt to occupy:
      #
      #   * Attempt to CAS myself into the slot
      #   * Go to sleep and wait to be woken by a fulfiller
      #   * If the sleep is successful then the fulfiller completed its happy path
      #     - Return the value from my hole (the value given by the fulfiller)
      #   * When the sleep fails (time ran out) attempt to cancel the operation
      #     - Attempt to CAS myself out of the hole
      #     - If successful there is no contention
      #       - Return CANCEL
      #     - On failure, I am competing with a fulfiller
      #       - Attempt to CAS my hole to CANCEL
      #       - On success
      #         - Let the fulfiller deal with my cancel
      #         - Return CANCEL
      #       - On failure the fulfiller has completed its happy path
      #         - Return th value from my hole (the fulfiller's value)
      #
      # Attempt to fulfill:
      #
      # * Attempt to CAS the occupier out of the slot
      #   - On failure loop again
      # * Attempt to CAS my item into the occupier's hole
      #   - On failure the occupier is trying to cancel
      #     - Loop again
      #   - On success we are on the happy path
      #     - Wake the sleeping occupier
      #     - Return the occupier's item

      value  = NULL if value.nil? # The sentinel allows nil to be a valid value
      me     = Node.new(value) # create my node in case I need to occupy
      end_at = Concurrent.monotonic_time + timeout.to_f # The time to give up

      result = loop do
        other = slot
        if other && compare_and_set_slot(other, nil)
          # try to fulfill
          if other.compare_and_set_value(nil, value)
            # happy path
            other.latch.count_down
            break other.item
          end
        elsif other.nil? && compare_and_set_slot(nil, me)
          # try to occupy
          timeout = end_at - Concurrent.monotonic_time if timeout
          if me.latch.wait(timeout)
            # happy path
            break me.value
          else
            # attempt to remove myself from the slot
            if compare_and_set_slot(me, nil)
              break CANCEL
            elsif !me.compare_and_set_value(nil, CANCEL)
              # I've failed to block the fulfiller
              break me.value
            end
          end
        end
        break CANCEL if timeout && Concurrent.monotonic_time >= end_at
      end

      result == NULL ? nil : result
    end
  end

  if Concurrent.on_jruby?
    require 'concurrent/utility/native_extension_loader'

    # @!macro internal_implementation_note
    # @!visibility private
    class JavaExchanger < AbstractExchanger

      def initialize
        @exchanger = java.util.concurrent.Exchanger.new
      end

      private

      # @!macro exchanger_method_do_exchange
      #
      # @return [Object, CANCEL] the value exchanged by the other thread; {CANCEL} on timeout
      def do_exchange(value, timeout)
        result = nil
        if timeout.nil?
          Synchronization::JRuby.sleep_interruptibly do
            result = @exchanger.exchange(value)
          end
        else
          Synchronization::JRuby.sleep_interruptibly do
            result = @exchanger.exchange(value, 1000 * timeout, java.util.concurrent.TimeUnit::MILLISECONDS)
          end
        end
        result
      rescue java.util.concurrent.TimeoutException
        CANCEL
      end
    end
  end

  # @!visibility private
  # @!macro internal_implementation_note
  ExchangerImplementation = case
                            when Concurrent.on_jruby?
                              JavaExchanger
                            else
                              RubyExchanger
                            end
  private_constant :ExchangerImplementation

  # @!macro exchanger
  class Exchanger < ExchangerImplementation

    # @!method initialize
    #   Creates exchanger instance

    # @!method exchange(value, timeout = nil)
    #   @!macro exchanger_method_do_exchange
    #   @!macro exchanger_method_exchange

    # @!method exchange!(value, timeout = nil)
    #   @!macro exchanger_method_do_exchange
    #   @!macro exchanger_method_exchange_bang

    # @!method try_exchange(value, timeout = nil)
    #   @!macro exchanger_method_do_exchange
    #   @!macro exchanger_method_try_exchange
  end
end
