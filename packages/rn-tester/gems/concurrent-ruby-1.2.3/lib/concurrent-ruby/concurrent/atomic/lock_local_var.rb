require 'concurrent/utility/engine'
require_relative 'fiber_local_var'
require_relative 'thread_local_var'

module Concurrent
  # @!visibility private
  def self.mutex_owned_per_thread?
    return false if Concurrent.on_jruby? || Concurrent.on_truffleruby?

    mutex = Mutex.new
    # Lock the mutex:
    mutex.synchronize do
      # Check if the mutex is still owned in a child fiber:
      Fiber.new { mutex.owned? }.resume
    end
  end

  if mutex_owned_per_thread?
    LockLocalVar = ThreadLocalVar
  else
    LockLocalVar = FiberLocalVar
  end

  # Either {FiberLocalVar} or {ThreadLocalVar} depending on whether Mutex (and Monitor)
  # are held, respectively, per Fiber or per Thread.
  class LockLocalVar
  end
end
