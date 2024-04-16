# frozen_string_literal: true

require "active_support/core_ext/module/delegation"
require "active_support/core_ext/object/blank"
require "logger"
require "active_support/logger"

module ActiveSupport
  # Wraps any standard Logger object to provide tagging capabilities.
  #
  # May be called with a block:
  #
  #   logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))
  #   logger.tagged('BCX') { logger.info 'Stuff' }                            # Logs "[BCX] Stuff"
  #   logger.tagged('BCX', "Jason") { logger.info 'Stuff' }                   # Logs "[BCX] [Jason] Stuff"
  #   logger.tagged('BCX') { logger.tagged('Jason') { logger.info 'Stuff' } } # Logs "[BCX] [Jason] Stuff"
  #
  # If called without a block, a new logger will be returned with applied tags:
  #
  #   logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))
  #   logger.tagged("BCX").info "Stuff"                 # Logs "[BCX] Stuff"
  #   logger.tagged("BCX", "Jason").info "Stuff"        # Logs "[BCX] [Jason] Stuff"
  #   logger.tagged("BCX").tagged("Jason").info "Stuff" # Logs "[BCX] [Jason] Stuff"
  #
  # This is used by the default Rails.logger as configured by Railties to make
  # it easy to stamp log lines with subdomains, request ids, and anything else
  # to aid debugging of multi-user production applications.
  module TaggedLogging
    module Formatter # :nodoc:
      # This method is invoked when a log event occurs.
      def call(severity, timestamp, progname, msg)
        super(severity, timestamp, progname, "#{tags_text}#{msg}")
      end

      def tagged(*tags)
        new_tags = push_tags(*tags)
        yield self
      ensure
        pop_tags(new_tags.size)
      end

      def push_tags(*tags)
        tags.flatten!
        tags.reject!(&:blank?)
        current_tags.concat tags
        tags
      end

      def pop_tags(size = 1)
        current_tags.pop size
      end

      def clear_tags!
        current_tags.clear
      end

      def current_tags
        # We use our object ID here to avoid conflicting with other instances
        thread_key = @thread_key ||= "activesupport_tagged_logging_tags:#{object_id}"
        IsolatedExecutionState[thread_key] ||= []
      end

      def tags_text
        tags = current_tags
        if tags.one?
          "[#{tags[0]}] "
        elsif tags.any?
          tags.collect { |tag| "[#{tag}] " }.join
        end
      end
    end

    module LocalTagStorage # :nodoc:
      attr_accessor :current_tags

      def self.extended(base)
        base.current_tags = []
      end
    end

    def self.new(logger)
      logger = logger.clone

      if logger.formatter
        logger.formatter = logger.formatter.dup
      else
        # Ensure we set a default formatter so we aren't extending nil!
        logger.formatter = ActiveSupport::Logger::SimpleFormatter.new
      end

      logger.formatter.extend Formatter
      logger.extend(self)
    end

    delegate :push_tags, :pop_tags, :clear_tags!, to: :formatter

    def tagged(*tags)
      if block_given?
        formatter.tagged(*tags) { yield self }
      else
        logger = ActiveSupport::TaggedLogging.new(self)
        logger.formatter.extend LocalTagStorage
        logger.push_tags(*formatter.current_tags, *tags)
        logger
      end
    end

    def flush
      clear_tags!
      super if defined?(super)
    end
  end
end
