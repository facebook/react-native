# frozen_string_literal: true

require "active_support/logger_silence"
require "active_support/logger_thread_safe_level"
require "logger"

module ActiveSupport
  class Logger < ::Logger
    include LoggerSilence

    # Returns true if the logger destination matches one of the sources
    #
    #   logger = Logger.new(STDOUT)
    #   ActiveSupport::Logger.logger_outputs_to?(logger, STDOUT)
    #   # => true
    def self.logger_outputs_to?(logger, *sources)
      logdev = logger.instance_variable_get(:@logdev)
      logger_source = logdev.dev if logdev.respond_to?(:dev)
      sources.any? { |source| source == logger_source }
    end

    # Broadcasts logs to multiple loggers.
    def self.broadcast(logger) # :nodoc:
      Module.new do
        define_method(:add) do |*args, &block|
          logger.add(*args, &block)
          super(*args, &block)
        end

        define_method(:<<) do |x|
          logger << x
          super(x)
        end

        define_method(:close) do
          logger.close
          super()
        end

        define_method(:progname=) do |name|
          logger.progname = name
          super(name)
        end

        define_method(:formatter=) do |formatter|
          logger.formatter = formatter
          super(formatter)
        end

        define_method(:level=) do |level|
          logger.level = level
          super(level)
        end

        define_method(:local_level=) do |level|
          logger.local_level = level if logger.respond_to?(:local_level=)
          super(level) if respond_to?(:local_level=)
        end

        define_method(:silence) do |level = Logger::ERROR, &block|
          if logger.respond_to?(:silence)
            logger.silence(level) do
              if defined?(super)
                super(level, &block)
              else
                block.call(self)
              end
            end
          else
            if defined?(super)
              super(level, &block)
            else
              block.call(self)
            end
          end
        end
      end
    end

    def initialize(*args, **kwargs)
      super
      @formatter = SimpleFormatter.new
    end

    # Simple formatter which only displays the message.
    class SimpleFormatter < ::Logger::Formatter
      # This method is invoked when a log event occurs
      def call(severity, timestamp, progname, msg)
        "#{String === msg ? msg : msg.inspect}\n"
      end
    end
  end
end
