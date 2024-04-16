# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Multi do
  describe ".new" do
    it "inits curl" do
      expect(Ethon::Curl).to receive(:init)
      Ethon::Multi.new
    end

    context "with default options" do
      it "allows running #perform with the default execution_mode" do
        Ethon::Multi.new.perform
      end

      it "refuses to run #socket_action" do
        expect { Ethon::Multi.new.socket_action }.to raise_error(ArgumentError)
      end
    end

    context "when options not empty" do
      context "when pipelining is set" do
        let(:options) { { :pipelining => true } }

        it "sets pipelining" do
          expect_any_instance_of(Ethon::Multi).to receive(:pipelining=).with(true)
          Ethon::Multi.new(options)
        end
      end

      context "when execution_mode option is :socket_action" do
        let(:options) { { :execution_mode => :socket_action } }
        let(:multi) { Ethon::Multi.new(options) }

        it "refuses to run #perform" do
          expect { multi.perform }.to raise_error(ArgumentError)
        end

        it "allows running #socket_action" do
          multi.socket_action
        end
      end
    end
  end

  describe "#socket_action" do
    let(:options) { { :execution_mode => :socket_action } }
    let(:select_state) { { :readers => [], :writers => [], :timeout => 0 } }
    let(:multi) {
      multi = Ethon::Multi.new(options)
      multi.timerfunction = proc do |handle, timeout_ms, userp|
        timeout_ms = nil if timeout_ms == -1
        select_state[:timeout] = timeout_ms
        :ok
      end
      multi.socketfunction = proc do |handle, sock, what, userp, socketp|
        case what
        when :remove
          select_state[:readers].delete(sock)
          select_state[:writers].delete(sock)
        when :in
          select_state[:readers].push(sock) unless select_state[:readers].include? sock
          select_state[:writers].delete(sock)
        when :out
          select_state[:readers].delete(sock)
          select_state[:writers].push(sock) unless select_state[:writers].include? sock
        when :inout
          select_state[:readers].push(sock) unless select_state[:readers].include? sock
          select_state[:writers].push(sock) unless select_state[:writers].include? sock
        else
          raise ArgumentError, "invalid value for 'what' in socketfunction callback"
        end
        :ok
      end
      multi
    }

    def fds_to_ios(fds)
      fds.map do |fd|
        IO.for_fd(fd).tap { |io| io.autoclose = false }
      end
    end

    def perform_socket_action_until_complete
      multi.socket_action # start things off

      while multi.ongoing?
        readers, writers, _ = IO.select(
          fds_to_ios(select_state[:readers]),
          fds_to_ios(select_state[:writers]),
          [],
          select_state[:timeout]
        )

        to_notify = Hash.new { |hash, key| hash[key] = [] }
        unless readers.nil?
          readers.each do |reader|
            to_notify[reader] << :in
          end
        end
        unless writers.nil?
          writers.each do |writer|
            to_notify[writer] << :out
          end
        end

        to_notify.each do |io, readiness|
          multi.socket_action(io, readiness)
        end

        # if we didn't have anything to notify, then we timed out
        multi.socket_action if to_notify.empty?
      end
    ensure
      multi.easy_handles.dup.each do |h|
        multi.delete(h)
      end
    end

    it "supports an end-to-end request" do
      easy = Ethon::Easy.new
      easy.url = "http://localhost:3001/"
      multi.add(easy)

      perform_socket_action_until_complete

      expect(multi.ongoing?).to eq(false)
    end

    it "supports multiple concurrent requests" do
      handles = []
      10.times do
        easy = Ethon::Easy.new
        easy.url = "http://localhost:3001/?delay=1"
        multi.add(easy)
        handles << easy
      end

      start = Time.now
      perform_socket_action_until_complete
      duration = Time.now - start
      
      # these should have happened concurrently
      expect(duration).to be < 2
      expect(multi.ongoing?).to eq(false)

      handles.each do |handle|
        expect(handle.response_code).to eq(200)
      end
    end
  end
end
