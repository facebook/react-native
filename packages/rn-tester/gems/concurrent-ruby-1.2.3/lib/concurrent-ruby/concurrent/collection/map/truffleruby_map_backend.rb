module Concurrent

  # @!visibility private
  module Collection

    # @!visibility private
    class TruffleRubyMapBackend < TruffleRuby::ConcurrentMap
      def initialize(options = nil)
        options ||= {}
        super(initial_capacity: options[:initial_capacity], load_factor: options[:load_factor])
      end
    end
  end
end
