module Concurrent
  module Collection

    # @!macro priority_queue
    # 
    # @!visibility private
    # @!macro internal_implementation_note
    class RubyNonConcurrentPriorityQueue

      # @!macro priority_queue_method_initialize
      def initialize(opts = {})
        order = opts.fetch(:order, :max)
        @comparator = [:min, :low].include?(order) ? -1 : 1
        clear
      end

      # @!macro priority_queue_method_clear
      def clear
        @queue = [nil]
        @length = 0
        true
      end

      # @!macro priority_queue_method_delete
      def delete(item)
        return false if empty?
        original_length = @length
        k = 1
        while k <= @length
          if @queue[k] == item
            swap(k, @length)
            @length -= 1
            sink(k) || swim(k)
            @queue.pop
          else
            k += 1
          end
        end
        @length != original_length
      end

      # @!macro priority_queue_method_empty
      def empty?
        size == 0
      end

      # @!macro priority_queue_method_include
      def include?(item)
        @queue.include?(item)
      end
      alias_method :has_priority?, :include?

      # @!macro priority_queue_method_length
      def length
        @length
      end
      alias_method :size, :length

      # @!macro priority_queue_method_peek
      def peek
        empty? ? nil : @queue[1]
      end

      # @!macro priority_queue_method_pop
      def pop
        return nil if empty?
        max = @queue[1]
        swap(1, @length)
        @length -= 1
        sink(1)
        @queue.pop
        max
      end
      alias_method :deq, :pop
      alias_method :shift, :pop

      # @!macro priority_queue_method_push
      def push(item)
        raise ArgumentError.new('cannot enqueue nil') if item.nil?
        @length += 1
        @queue << item
        swim(@length)
        true
      end
      alias_method :<<, :push
      alias_method :enq, :push

      #   @!macro priority_queue_method_from_list
      def self.from_list(list, opts = {})
        queue = new(opts)
        list.each{|item| queue << item }
        queue
      end

      private

      # Exchange the values at the given indexes within the internal array.
      # 
      # @param [Integer] x the first index to swap
      # @param [Integer] y the second index to swap
      # 
      # @!visibility private
      def swap(x, y)
        temp = @queue[x]
        @queue[x] = @queue[y]
        @queue[y] = temp
      end

      # Are the items at the given indexes ordered based on the priority
      # order specified at construction?
      #
      # @param [Integer] x the first index from which to retrieve a comparable value
      # @param [Integer] y the second index from which to retrieve a comparable value
      #
      # @return [Boolean] true if the two elements are in the correct priority order
      #   else false
      # 
      # @!visibility private
      def ordered?(x, y)
        (@queue[x] <=> @queue[y]) == @comparator
      end

      # Percolate down to maintain heap invariant.
      # 
      # @param [Integer] k the index at which to start the percolation
      # 
      # @!visibility private
      def sink(k)
        success = false

        while (j = (2 * k)) <= @length do
          j += 1 if j < @length && ! ordered?(j, j+1)
          break if ordered?(k, j)
          swap(k, j)
          success = true
          k = j
        end

        success
      end

      # Percolate up to maintain heap invariant.
      # 
      # @param [Integer] k the index at which to start the percolation
      # 
      # @!visibility private
      def swim(k)
        success = false

        while k > 1 && ! ordered?(k/2, k) do
          swap(k, k/2)
          k = k/2
          success = true
        end

        success
      end
    end
  end
end
