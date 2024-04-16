# frozen_string_literal: true

require "benchmark"

class << Benchmark
  # Benchmark realtime in milliseconds.
  #
  #   Benchmark.realtime { User.all }
  #   # => 8.0e-05
  #
  #   Benchmark.ms { User.all }
  #   # => 0.074
  def ms(&block)
    1000 * realtime(&block)
  end
end
