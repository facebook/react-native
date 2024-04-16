module Typhoeus
  class Hydra

    # This module handles the request queueing on
    # hydra.
    #
    # @api private
    module Queueable

      # Return the queued requests.
      #
      # @example Return queued requests.
      #   hydra.queued_requests
      #
      # @return [ Array<Typhoeus::Request> ] The queued requests.
      def queued_requests
        @queued_requests ||= []
      end

      # Abort the current hydra run as good as
      # possible. This means that it only
      # clears the queued requests and can't do
      # anything about already running requests.
      #
      # @example Abort hydra.
      #   hydra.abort
      def abort
        queued_requests.clear
      end

      # Enqueues a request in order to be performed
      # by the hydra. This can even be done while
      # the hydra is running. Also sets hydra on
      # request.
      #
      # @example Queue request.
      #   hydra.queue(request)
      def queue(request)
        request.hydra = self
        queued_requests << request
      end

      # Pushes a request to the front of the queue,
      # to be performed by the hydra. Also sets hydra
      # on request
      #
      # @example Queue reques.
      #   hydra.queue_front(request)
      def queue_front(request)
        request.hydra = self
        queued_requests.unshift request
      end

      # Removes a request from queued_requests and
      # adds it to the hydra in order to be
      # performed next.
      #
      # @example Dequeue request.
      #   hydra.dequeue
      #
      # @since 0.6.4
      def dequeue
        add(queued_requests.shift) unless queued_requests.empty?
      end

      # Removes requests from queued_requests and
      # adds them to the hydra until max_concurrency
      # is reached.
      #
      # @example Dequeue requests.
      #   hydra.dequeue_many
      #
      # @since 0.6.8
      def dequeue_many
        number = multi.easy_handles.count
        until number == max_concurrency || queued_requests.empty?
          add(queued_requests.shift)
          number += 1
        end
      end
    end
  end
end
