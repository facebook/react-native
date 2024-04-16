# frozen_string_literal: true

require "drb"
require "drb/unix" unless Gem.win_platform?
require "active_support/core_ext/module/attribute_accessors"
require "active_support/testing/parallelization/server"
require "active_support/testing/parallelization/worker"

module ActiveSupport
  module Testing
    class Parallelization # :nodoc:
      @@after_fork_hooks = []

      def self.after_fork_hook(&blk)
        @@after_fork_hooks << blk
      end

      cattr_reader :after_fork_hooks

      @@run_cleanup_hooks = []

      def self.run_cleanup_hook(&blk)
        @@run_cleanup_hooks << blk
      end

      cattr_reader :run_cleanup_hooks

      def initialize(worker_count)
        @worker_count = worker_count
        @queue_server = Server.new
        @worker_pool = []
        @url = DRb.start_service("drbunix:", @queue_server).uri
      end

      def start
        @worker_pool = @worker_count.times.map do |worker|
          Worker.new(worker, @url).start
        end
      end

      def <<(work)
        @queue_server << work
      end

      def size
        @worker_count
      end

      def shutdown
        @queue_server.shutdown
        @worker_pool.each { |pid| Process.waitpid pid }
      end
    end
  end
end
