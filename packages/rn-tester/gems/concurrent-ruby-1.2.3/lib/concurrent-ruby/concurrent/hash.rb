require 'concurrent/utility/engine'
require 'concurrent/thread_safe/util'

module Concurrent

  # @!macro concurrent_hash
  #
  #   A thread-safe subclass of Hash. This version locks against the object
  #   itself for every method call, ensuring only one thread can be reading
  #   or writing at a time. This includes iteration methods like `#each`,
  #   which takes the lock repeatedly when reading an item.
  #
  #   @see http://ruby-doc.org/core/Hash.html Ruby standard library `Hash`

  # @!macro internal_implementation_note
  HashImplementation = case
                       when Concurrent.on_cruby?
                         # Hash is not fully thread-safe on CRuby, see
                         # https://bugs.ruby-lang.org/issues/19237
                         # https://github.com/ruby/ruby/commit/ffd52412ab
                         # https://github.com/ruby-concurrency/concurrent-ruby/issues/929
                         # So we will need to add synchronization here (similar to Concurrent::Map).
                         ::Hash

                       when Concurrent.on_jruby?
                         require 'jruby/synchronized'

                         class JRubyHash < ::Hash
                           include JRuby::Synchronized
                         end
                         JRubyHash

                       when Concurrent.on_truffleruby?
                         require 'concurrent/thread_safe/util/data_structures'

                         class TruffleRubyHash < ::Hash
                         end

                         ThreadSafe::Util.make_synchronized_on_truffleruby TruffleRubyHash
                         TruffleRubyHash

                       else
                         warn 'Possibly unsupported Ruby implementation'
                         ::Hash
                       end
  private_constant :HashImplementation

  # @!macro concurrent_hash
  class Hash < HashImplementation
  end

end
