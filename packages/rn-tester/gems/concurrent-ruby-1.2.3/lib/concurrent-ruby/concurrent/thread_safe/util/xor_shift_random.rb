require 'concurrent/thread_safe/util'

module Concurrent

  # @!visibility private
  module ThreadSafe

    # @!visibility private
    module Util

      # A xorshift random number (positive +Fixnum+s) generator, provides
      # reasonably cheap way to generate thread local random numbers without
      # contending for the global +Kernel.rand+.
      #
      # Usage:
      #   x = XorShiftRandom.get # uses Kernel.rand to generate an initial seed
      #   while true
      #     if (x = XorShiftRandom.xorshift).odd? # thread-localy generate a next random number
      #       do_something_at_random
      #     end
      #   end
      module XorShiftRandom
        extend self
        MAX_XOR_SHIFTABLE_INT = MAX_INT - 1

        # Generates an initial non-zero positive +Fixnum+ via +Kernel.rand+.
        def get
          Kernel.rand(MAX_XOR_SHIFTABLE_INT) + 1 # 0 can't be xorshifted
        end

        # xorshift based on: http://www.jstatsoft.org/v08/i14/paper
        if 0.size == 4
          # using the "yˆ=y>>a; yˆ=y<<b; yˆ=y>>c;" transform with the (a,b,c) tuple with values (3,1,14) to minimise Bignum overflows
          def xorshift(x)
            x ^= x >> 3
            x ^= (x << 1) & MAX_INT # cut-off Bignum overflow
            x ^= x >> 14
          end
        else
          # using the "yˆ=y>>a; yˆ=y<<b; yˆ=y>>c;" transform with the (a,b,c) tuple with values (1,1,54) to minimise Bignum overflows
          def xorshift(x)
            x ^= x >> 1
            x ^= (x << 1) & MAX_INT # cut-off Bignum overflow
            x ^= x >> 54
          end
        end
      end
    end
  end
end
