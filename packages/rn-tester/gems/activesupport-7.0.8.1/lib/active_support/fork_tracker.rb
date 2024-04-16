# frozen_string_literal: true

module ActiveSupport
  module ForkTracker # :nodoc:
    module ModernCoreExt
      def _fork
        pid = super
        if pid == 0
          ForkTracker.check!
        end
        pid
      end
    end

    module CoreExt
      def fork(...)
        if block_given?
          super do
            ForkTracker.check!
            yield
          end
        else
          unless pid = super
            ForkTracker.check!
          end
          pid
        end
      end
    end

    module CoreExtPrivate
      include CoreExt
      private :fork
    end

    @pid = Process.pid
    @callbacks = []

    class << self
      def check!
        new_pid = Process.pid
        if @pid != new_pid
          @callbacks.each(&:call)
          @pid = new_pid
        end
      end

      def hook!
        if Process.respond_to?(:_fork) # Ruby 3.1+
          ::Process.singleton_class.prepend(ModernCoreExt)
        elsif Process.respond_to?(:fork)
          ::Object.prepend(CoreExtPrivate) if RUBY_VERSION < "3.0"
          ::Kernel.prepend(CoreExtPrivate)
          ::Kernel.singleton_class.prepend(CoreExt)
          ::Process.singleton_class.prepend(CoreExt)
        end
      end

      def after_fork(&block)
        @callbacks << block
        block
      end

      def unregister(callback)
        @callbacks.delete(callback)
      end
    end
  end
end

ActiveSupport::ForkTracker.hook!
