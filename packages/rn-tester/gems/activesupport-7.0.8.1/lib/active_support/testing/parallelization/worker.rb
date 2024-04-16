# frozen_string_literal: true

module ActiveSupport
  module Testing
    class Parallelization # :nodoc:
      class Worker
        def initialize(number, url)
          @id = SecureRandom.uuid
          @number = number
          @url = url
          @setup_exception = nil
        end

        def start
          fork do
            set_process_title("(starting)")

            DRb.stop_service

            @queue = DRbObject.new_with_uri(@url)
            @queue.start_worker(@id)

            begin
              after_fork
            rescue => @setup_exception; end

            work_from_queue
          ensure
            set_process_title("(stopping)")

            run_cleanup
            @queue.stop_worker(@id)
          end
        end

        def work_from_queue
          while job = @queue.pop
            perform_job(job)
          end
        end

        def perform_job(job)
          klass    = job[0]
          method   = job[1]
          reporter = job[2]

          set_process_title("#{klass}##{method}")

          result = klass.with_info_handler reporter do
            Minitest.run_one_method(klass, method)
          end

          safe_record(reporter, result)
        end

        def safe_record(reporter, result)
          add_setup_exception(result) if @setup_exception

          begin
            @queue.record(reporter, result)
          rescue DRb::DRbConnError
            result.failures.map! do |failure|
              if failure.respond_to?(:error)
                # minitest >5.14.0
                error = DRb::DRbRemoteError.new(failure.error)
              else
                error = DRb::DRbRemoteError.new(failure.exception)
              end
              Minitest::UnexpectedError.new(error)
            end
            @queue.record(reporter, result)
          rescue Interrupt
            @queue.interrupt
            raise
          end

          set_process_title("(idle)")
        end

        def after_fork
          Parallelization.after_fork_hooks.each do |cb|
            cb.call(@number)
          end
        end

        def run_cleanup
          Parallelization.run_cleanup_hooks.each do |cb|
            cb.call(@number)
          end
        end

        private
          def add_setup_exception(result)
            result.failures.prepend Minitest::UnexpectedError.new(@setup_exception)
          end

          def set_process_title(status)
            Process.setproctitle("Rails test worker #{@number} - #{status}")
          end
      end
    end
  end
end
