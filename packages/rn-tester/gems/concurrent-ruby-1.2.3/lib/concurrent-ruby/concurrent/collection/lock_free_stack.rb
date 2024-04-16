require 'concurrent/synchronization/object'

module Concurrent

  # @!macro warn.edge
  class LockFreeStack < Synchronization::Object

    safe_initialization!

    class Node
      # TODO (pitr-ch 20-Dec-2016): Could be unified with Stack class?

      # @return [Node]
      attr_reader :next_node

      # @return [Object]
      attr_reader :value

      # @!visibility private
      # allow to nil-ify to free GC when the entry is no longer relevant, not synchronised
      attr_writer :value

      def initialize(value, next_node)
        @value     = value
        @next_node = next_node
      end

      singleton_class.send :alias_method, :[], :new
    end

    # The singleton for empty node
    EMPTY = Node[nil, nil]
    def EMPTY.next_node
      self
    end

    attr_atomic(:head)
    private :head, :head=, :swap_head, :compare_and_set_head, :update_head

    # @!visibility private
    def self.of1(value)
      new Node[value, EMPTY]
    end

    # @!visibility private
    def self.of2(value1, value2)
      new Node[value1, Node[value2, EMPTY]]
    end

    # @param [Node] head
    def initialize(head = EMPTY)
      super()
      self.head = head
    end

    # @param [Node] head
    # @return [true, false]
    def empty?(head = head())
      head.equal? EMPTY
    end

    # @param [Node] head
    # @param [Object] value
    # @return [true, false]
    def compare_and_push(head, value)
      compare_and_set_head head, Node[value, head]
    end

    # @param [Object] value
    # @return [self]
    def push(value)
      while true
        current_head = head
        return self if compare_and_set_head current_head, Node[value, current_head]
      end
    end

    # @return [Node]
    def peek
      head
    end

    # @param [Node] head
    # @return [true, false]
    def compare_and_pop(head)
      compare_and_set_head head, head.next_node
    end

    # @return [Object]
    def pop
      while true
        current_head = head
        return current_head.value if compare_and_set_head current_head, current_head.next_node
      end
    end

    # @param [Node] head
    # @return [true, false]
    def compare_and_clear(head)
      compare_and_set_head head, EMPTY
    end

    include Enumerable

    # @param [Node] head
    # @return [self]
    def each(head = nil)
      return to_enum(:each, head) unless block_given?
      it = head || peek
      until it.equal?(EMPTY)
        yield it.value
        it = it.next_node
      end
      self
    end

    # @return [true, false]
    def clear
      while true
        current_head = head
        return false if current_head == EMPTY
        return true if compare_and_set_head current_head, EMPTY
      end
    end

    # @param [Node] head
    # @return [true, false]
    def clear_if(head)
      compare_and_set_head head, EMPTY
    end

    # @param [Node] head
    # @param [Node] new_head
    # @return [true, false]
    def replace_if(head, new_head)
      compare_and_set_head head, new_head
    end

    # @return [self]
    # @yield over the cleared stack
    # @yieldparam [Object] value
    def clear_each(&block)
      while true
        current_head = head
        return self if current_head == EMPTY
        if compare_and_set_head current_head, EMPTY
          each current_head, &block
          return self
        end
      end
    end

    # @return [String] Short string representation.
    def to_s
      format '%s %s>', super[0..-2], to_a.to_s
    end

    alias_method :inspect, :to_s
  end
end
