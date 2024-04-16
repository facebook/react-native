# frozen_string_literal: true
class OSMemoryLeakTracker
  attr_reader :current_run

  def initialize
    @previous_run = @current_run = 0
  end

  def difference_between_runs(basis=@previous_run)
    @current_run - basis
  end

  def total_difference_between_runs
    difference_between_runs(@initial_count_run)
  end

  def capture_initial_memory_usage
    capture_memory_usage
    @initial_count_run = @current_run
  end

  def capture_memory_usage
    @previous_run = @current_run
    @current_run = rss_bytes
  end

  def dump_status(logger)
    delta = difference_between_runs
    logger.add(log_level(delta), sprintf("\tTotal memory usage (kb): %d (%+d)", current_run, delta))
  end

  private
  # amount of memory the current process "is using", in RAM
  # (doesn't include any swap memory that it may be using, just that in actual RAM)
  # Code loosely based on https://github.com/rdp/os/blob/master/lib/os.rb
  # returns 0 on windows
  def rss_bytes
    if ENV['OS'] == 'Windows_NT'
      0
    else
      `ps -o rss= -p #{Process.pid}`.to_i # in kilobytes
    end
  end

  def log_level(delta)
    delta > 0 ? Logger::WARN : Logger::DEBUG
  end
end