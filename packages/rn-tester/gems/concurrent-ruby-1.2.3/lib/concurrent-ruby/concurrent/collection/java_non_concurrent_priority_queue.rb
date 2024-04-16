if Concurrent.on_jruby?

  module Concurrent
    module Collection


      # @!macro priority_queue
      # 
      # @!visibility private
      # @!macro internal_implementation_note
      class JavaNonConcurrentPriorityQueue

        # @!macro priority_queue_method_initialize
        def initialize(opts = {})
          order = opts.fetch(:order, :max)
          if [:min, :low].include?(order)
            @queue = java.util.PriorityQueue.new(11) # 11 is the default initial capacity
          else
            @queue = java.util.PriorityQueue.new(11, java.util.Collections.reverseOrder())
          end
        end

        # @!macro priority_queue_method_clear
        def clear
          @queue.clear
          true
        end

        # @!macro priority_queue_method_delete
        def delete(item)
          found = false
          while @queue.remove(item) do
            found = true
          end
          found
        end

        # @!macro priority_queue_method_empty
        def empty?
          @queue.size == 0
        end

        # @!macro priority_queue_method_include
        def include?(item)
          @queue.contains(item)
        end
        alias_method :has_priority?, :include?

        # @!macro priority_queue_method_length
        def length
          @queue.size
        end
        alias_method :size, :length

        # @!macro priority_queue_method_peek
        def peek
          @queue.peek
        end

        # @!macro priority_queue_method_pop
        def pop
          @queue.poll
        end
        alias_method :deq, :pop
        alias_method :shift, :pop

        # @!macro priority_queue_method_push
        def push(item)
          raise ArgumentError.new('cannot enqueue nil') if item.nil?
          @queue.add(item)
        end
        alias_method :<<, :push
        alias_method :enq, :push

        # @!macro priority_queue_method_from_list
        def self.from_list(list, opts = {})
          queue = new(opts)
          list.each{|item| queue << item }
          queue
        end
      end
    end
  end
end
