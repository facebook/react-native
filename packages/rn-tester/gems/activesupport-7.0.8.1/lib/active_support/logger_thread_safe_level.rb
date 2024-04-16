# frozen_string_literal: true

require "active_support/concern"
require "active_support/core_ext/module/attribute_accessors"
require "concurrent"
require "fiber"

module ActiveSupport
  module LoggerThreadSafeLevel # :nodoc:
    extend ActiveSupport::Concern

    Logger::Severity.constants.each do |severity|
      class_eval(<<-EOT, __FILE__, __LINE__ + 1)
        def #{severity.downcase}?                # def debug?
          Logger::#{severity} >= level           #   DEBUG >= level
        end                                      # end
      EOT
    end

    def local_level
      IsolatedExecutionState[:logger_thread_safe_level]
    end

    def local_level=(level)
      case level
      when Integer
      when Symbol
        level = Logger::Severity.const_get(level.to_s.upcase)
      when nil
      else
        raise ArgumentError, "Invalid log level: #{level.inspect}"
      end
      IsolatedExecutionState[:logger_thread_safe_level] = level
    end

    def level
      local_level || super
    end

    # Change the thread-local level for the duration of the given block.
    def log_at(level)
      old_local_level, self.local_level = local_level, level
      yield
    ensure
      self.local_level = old_local_level
    end

    # Redefined to check severity against #level, and thus the thread-local level, rather than +@level+.
    # FIXME: Remove when the minimum Ruby version supports overriding Logger#level.
    def add(severity, message = nil, progname = nil, &block) # :nodoc:
      severity ||= UNKNOWN
      progname ||= @progname

      return true if @logdev.nil? || severity < level

      if message.nil?
        if block_given?
          message  = yield
        else
          message  = progname
          progname = @progname
        end
      end

      @logdev.write \
        format_message(format_severity(severity), Time.now, progname, message)
    end
  end
end
