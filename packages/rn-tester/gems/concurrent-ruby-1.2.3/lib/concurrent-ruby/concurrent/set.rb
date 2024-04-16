require 'concurrent/utility/engine'
require 'concurrent/thread_safe/util'
require 'set'

module Concurrent

  # @!macro concurrent_set
  #
  #   A thread-safe subclass of Set. This version locks against the object
  #   itself for every method call, ensuring only one thread can be reading
  #   or writing at a time. This includes iteration methods like `#each`.
  #
  #   @note `a += b` is **not** a **thread-safe** operation on
  #     `Concurrent::Set`. It reads Set `a`, then it creates new `Concurrent::Set`
  #     which is union of `a` and `b`, then it writes the union to `a`.
  #     The read and write are independent operations they do not form a single atomic
  #     operation therefore when two `+=` operations are executed concurrently updates
  #     may be lost. Use `#merge` instead.
  #
  #   @see http://ruby-doc.org/stdlib-2.4.0/libdoc/set/rdoc/Set.html Ruby standard library `Set`

  # @!macro internal_implementation_note
  SetImplementation = case
                      when Concurrent.on_cruby?
                        # The CRuby implementation of Set is written in Ruby itself and is
                        # not thread safe for certain methods.
                        require 'monitor'
                        require 'concurrent/thread_safe/util/data_structures'

                        class CRubySet < ::Set
                        end

                        ThreadSafe::Util.make_synchronized_on_cruby CRubySet
                        CRubySet

                      when Concurrent.on_jruby?
                        require 'jruby/synchronized'

                        class JRubySet < ::Set
                          include JRuby::Synchronized
                        end

                        JRubySet

                      when Concurrent.on_truffleruby?
                        require 'concurrent/thread_safe/util/data_structures'

                        class TruffleRubySet < ::Set
                        end

                        ThreadSafe::Util.make_synchronized_on_truffleruby TruffleRubySet
                        TruffleRubySet

                      else
                        warn 'Possibly unsupported Ruby implementation'
                        ::Set
                      end
  private_constant :SetImplementation

  # @!macro concurrent_set
  class Set < SetImplementation
  end
end

