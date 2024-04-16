#!/usr/bin/env ruby

# Thanks William James!
# http://www.ruby-forum.com/topic/95519#200484
def cart_prod(*args)
  args.inject([[]]){|old,lst|
    new = []
    lst.each{|e| new += old.map{|c| c.dup << e }}
    new
  }
end

require 'benchmark'

a = [1,2,3]
b = [4,5]
Benchmark.bmbm do |x|
  x.report("native") do
    500_000.times { a.product(b) }
  end
  x.report("william-james") do |x|
    500_000.times { cart_prod(a, b) }
  end
end

# results:
# $ ruby foo.rb 
# Rehearsal -------------------------------------------------
# native          0.720000   0.000000   0.720000 (  0.729319)
# william-james   3.620000   0.010000   3.630000 (  3.629198)
# ---------------------------------------- total: 4.350000sec
# 
#                     user     system      total        real
# native          0.710000   0.000000   0.710000 (  0.708620)
# william-james   3.800000   0.000000   3.800000 (  3.792538)

# thanks for all the fish!
