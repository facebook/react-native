# frozen_string_literal: true

require "active_support/core_ext/module/attribute_accessors"
require "active_support/core_ext/class/attribute"
require "active_support/subscriber"

module ActiveSupport
  # <tt>ActiveSupport::LogSubscriber</tt> is an object set to consume
  # ActiveSupport::Notifications with the sole purpose of logging them.
  # The log subscriber dispatches notifications to a registered object based
  # on its given namespace.
  #
  # An example would be Active Record log subscriber responsible for logging
  # queries:
  #
  #   module ActiveRecord
  #     class LogSubscriber < ActiveSupport::LogSubscriber
  #       def sql(event)
  #         info "#{event.payload[:name]} (#{event.duration}) #{event.payload[:sql]}"
  #       end
  #     end
  #   end
  #
  # And it's finally registered as:
  #
  #   ActiveRecord::LogSubscriber.attach_to :active_record
  #
  # Since we need to know all instance methods before attaching the log
  # subscriber, the line above should be called after your
  # <tt>ActiveRecord::LogSubscriber</tt> definition.
  #
  # A logger also needs to be set with <tt>ActiveRecord::LogSubscriber.logger=</tt>.
  # This is assigned automatically in a Rails environment.
  #
  # After configured, whenever a <tt>"sql.active_record"</tt> notification is published,
  # it will properly dispatch the event
  # (<tt>ActiveSupport::Notifications::Event</tt>) to the sql method.
  #
  # Being an ActiveSupport::Notifications consumer,
  # <tt>ActiveSupport::LogSubscriber</tt> exposes a simple interface to check if
  # instrumented code raises an exception. It is common to log a different
  # message in case of an error, and this can be achieved by extending
  # the previous example:
  #
  #   module ActiveRecord
  #     class LogSubscriber < ActiveSupport::LogSubscriber
  #       def sql(event)
  #         exception = event.payload[:exception]
  #
  #         if exception
  #           exception_object = event.payload[:exception_object]
  #
  #           error "[ERROR] #{event.payload[:name]}: #{exception.join(', ')} " \
  #                 "(#{exception_object.backtrace.first})"
  #         else
  #           # standard logger code
  #         end
  #       end
  #     end
  #   end
  #
  # Log subscriber also has some helpers to deal with logging and automatically
  # flushes all logs when the request finishes
  # (via <tt>action_dispatch.callback</tt> notification) in a Rails environment.
  class LogSubscriber < Subscriber
    # Embed in a String to clear all previous ANSI sequences.
    CLEAR   = "\e[0m"
    BOLD    = "\e[1m"

    # Colors
    BLACK   = "\e[30m"
    RED     = "\e[31m"
    GREEN   = "\e[32m"
    YELLOW  = "\e[33m"
    BLUE    = "\e[34m"
    MAGENTA = "\e[35m"
    CYAN    = "\e[36m"
    WHITE   = "\e[37m"

    mattr_accessor :colorize_logging, default: true

    class << self
      def logger
        @logger ||= if defined?(Rails) && Rails.respond_to?(:logger)
          Rails.logger
        end
      end

      attr_writer :logger

      def log_subscribers
        subscribers
      end

      # Flush all log_subscribers' logger.
      def flush_all!
        logger.flush if logger.respond_to?(:flush)
      end

      private
        def fetch_public_methods(subscriber, inherit_all)
          subscriber.public_methods(inherit_all) - LogSubscriber.public_instance_methods(true)
        end
    end

    def logger
      LogSubscriber.logger
    end

    def start(name, id, payload)
      super if logger
    end

    def finish(name, id, payload)
      super if logger
    rescue => e
      log_exception(name, e)
    end

    def publish_event(event)
      super if logger
    rescue => e
      log_exception(event.name, e)
    end

  private
    %w(info debug warn error fatal unknown).each do |level|
      class_eval <<-METHOD, __FILE__, __LINE__ + 1
        def #{level}(progname = nil, &block)
          logger.#{level}(progname, &block) if logger
        end
      METHOD
    end

    # Set color by using a symbol or one of the defined constants. If a third
    # option is set to +true+, it also adds bold to the string. This is based
    # on the Highline implementation and will automatically append CLEAR to the
    # end of the returned String.
    def color(text, color, bold = false) # :doc:
      return text unless colorize_logging
      color = self.class.const_get(color.upcase) if color.is_a?(Symbol)
      bold  = bold ? BOLD : ""
      "#{bold}#{color}#{text}#{CLEAR}"
    end

    def log_exception(name, e)
      if logger
        logger.error "Could not log #{name.inspect} event. #{e.class}: #{e.message} #{e.backtrace}"
      end
    end
  end
end
