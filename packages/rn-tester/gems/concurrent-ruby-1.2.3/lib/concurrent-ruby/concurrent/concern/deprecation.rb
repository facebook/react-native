require 'concurrent/concern/logging'

module Concurrent
  module Concern

    # @!visibility private
    # @!macro internal_implementation_note
    module Deprecation
      # TODO require additional parameter: a version. Display when it'll be removed based on that. Error if not removed.
      include Concern::Logging

      def deprecated(message, strip = 2)
        caller_line = caller(strip).first if strip > 0
        klass       = if Module === self
                        self
                      else
                        self.class
                      end
        message     = if strip > 0
                        format("[DEPRECATED] %s\ncalled on: %s", message, caller_line)
                      else
                        format('[DEPRECATED] %s', message)
                      end
        log WARN, klass.to_s, message
      end

      def deprecated_method(old_name, new_name)
        deprecated "`#{old_name}` is deprecated and it'll removed in next release, use `#{new_name}` instead", 3
      end

      extend self
    end
  end
end
