require 'concurrent/utility/native_extension_loader' # load native parts first

module Concurrent
  module Synchronization
    case
    when Concurrent.on_cruby?
      def self.full_memory_barrier
        # relying on undocumented behavior of CRuby, GVL acquire has lock which ensures visibility of ivars
        # https://github.com/ruby/ruby/blob/ruby_2_2/thread_pthread.c#L204-L211
      end

    when Concurrent.on_jruby?
      require 'concurrent/utility/native_extension_loader'
      def self.full_memory_barrier
        JRubyAttrVolatile.full_memory_barrier
      end

    when Concurrent.on_truffleruby?
      def self.full_memory_barrier
        TruffleRuby.full_memory_barrier
      end

    else
      warn 'Possibly unsupported Ruby implementation'
      def self.full_memory_barrier
      end
    end
  end
end
