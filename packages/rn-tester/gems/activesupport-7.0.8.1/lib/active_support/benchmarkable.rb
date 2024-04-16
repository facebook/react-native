# frozen_string_literal: true

require "active_support/core_ext/benchmark"
require "active_support/core_ext/hash/keys"

module ActiveSupport
  module Benchmarkable
    # Allows you to measure the execution time of a block in a template and
    # records the result to the log. Wrap this block around expensive operations
    # or possible bottlenecks to get a time reading for the operation. For
    # example, let's say you thought your file processing method was taking too
    # long; you could wrap it in a benchmark block.
    #
    #  <% benchmark 'Process data files' do %>
    #    <%= expensive_files_operation %>
    #  <% end %>
    #
    # That would add something like "Process data files (345.2ms)" to the log,
    # which you can then use to compare timings when optimizing your code.
    #
    # You may give an optional logger level (<tt>:debug</tt>, <tt>:info</tt>,
    # <tt>:warn</tt>, <tt>:error</tt>) as the <tt>:level</tt> option. The
    # default logger level value is <tt>:info</tt>.
    #
    #  <% benchmark 'Low-level files', level: :debug do %>
    #    <%= lowlevel_files_operation %>
    #  <% end %>
    #
    # Finally, you can pass true as the third argument to silence all log
    # activity (other than the timing information) from inside the block. This
    # is great for boiling down a noisy block to just a single statement that
    # produces one log line:
    #
    #  <% benchmark 'Process data files', level: :info, silence: true do %>
    #    <%= expensive_and_chatty_files_operation %>
    #  <% end %>
    def benchmark(message = "Benchmarking", options = {}, &block)
      if logger
        options.assert_valid_keys(:level, :silence)
        options[:level] ||= :info

        result = nil
        ms = Benchmark.ms { result = options[:silence] ? logger.silence(&block) : yield }
        logger.public_send(options[:level], "%s (%.1fms)" % [ message, ms ])
        result
      else
        yield
      end
    end
  end
end
