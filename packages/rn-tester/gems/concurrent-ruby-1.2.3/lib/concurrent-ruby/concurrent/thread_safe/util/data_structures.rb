require 'concurrent/thread_safe/util'
require 'concurrent/utility/engine'

# Shim for TruffleRuby.synchronized
if Concurrent.on_truffleruby? && !TruffleRuby.respond_to?(:synchronized)
  module TruffleRuby
    def self.synchronized(object, &block)
      Truffle::System.synchronized(object, &block)
    end
  end
end

module Concurrent
  module ThreadSafe
    module Util
      def self.make_synchronized_on_cruby(klass)
        klass.class_eval do
          def initialize(*args, &block)
            @_monitor = Monitor.new
            super
          end

          def initialize_copy(other)
            # make sure a copy is not sharing a monitor with the original object!
            @_monitor = Monitor.new
            super
          end
        end

        klass.superclass.instance_methods(false).each do |method|
          klass.class_eval <<-RUBY, __FILE__, __LINE__ + 1
            def #{method}(*args)
              monitor = @_monitor
              monitor or raise("BUG: Internal monitor was not properly initialized. Please report this to the concurrent-ruby developers.")
              monitor.synchronize { super }
            end
          RUBY
        end
      end

      def self.make_synchronized_on_truffleruby(klass)
        klass.superclass.instance_methods(false).each do |method|
          klass.class_eval <<-RUBY, __FILE__, __LINE__ + 1
            def #{method}(*args, &block)    
              TruffleRuby.synchronized(self) { super(*args, &block) }
            end
          RUBY
        end
      end
    end
  end
end
