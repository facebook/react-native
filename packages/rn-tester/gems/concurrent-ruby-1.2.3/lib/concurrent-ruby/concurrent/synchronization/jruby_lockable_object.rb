require 'concurrent/utility/native_extension_loader' # load native parts first

module Concurrent
  module Synchronization

    if Concurrent.on_jruby?

      # @!visibility private
      # @!macro internal_implementation_note
      class JRubyLockableObject < AbstractLockableObject

      end
    end
  end
end
