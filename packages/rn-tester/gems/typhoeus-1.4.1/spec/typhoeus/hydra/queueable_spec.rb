require 'spec_helper'

describe Typhoeus::Hydra::Queueable do
  let(:base_url) { "localhost:3001" }
  let(:options) { {} }
  let(:hydra) { Typhoeus::Hydra.new(options) }

  describe "#queue" do
    let(:request) { Typhoeus::Request.new("") }

    it "accepts requests" do
      hydra.queue(request)
    end

    it "sets hydra on request" do
      hydra.queue(request)
      expect(request.hydra).to eq(hydra)
    end

    it "adds to queued requests" do
      hydra.queue(request)
      expect(hydra.queued_requests).to include(request)
    end
    
    it "adds to front of queued requests" do 
      hydra.queue_front(request)
      expect(hydra.queued_requests.first).to be(request)
    end
  end

  describe "#abort" do
    before { hydra.queued_requests << 1 }

    it "clears queue" do
      hydra.abort
      expect(hydra.queued_requests).to be_empty
    end
  end

  describe "#dequeue_many" do
    before do
      requests.each { |r| hydra.queue r }
    end

    context "when no request queued" do
      let(:requests) { [] }

      it "does nothing" do
        expect(hydra).to_not receive(:add)
        hydra.dequeue_many
      end
    end

    context "when request queued" do
      let(:first) { Typhoeus::Request.new("localhost:3001/first") }
      let(:requests) { [first] }

      it "adds request from queue to multi" do
        expect(hydra).to receive(:add).with(first)
        hydra.dequeue_many
      end
    end

    context "when three request queued" do
      let(:first) { Typhoeus::Request.new("localhost:3001/first") }
      let(:second) { Typhoeus::Request.new("localhost:3001/second") }
      let(:third) { Typhoeus::Request.new("localhost:3001/third") }
      let(:requests) { [first, second, third] }

      it "adds requests from queue to multi" do
        expect(hydra).to receive(:add).with(first)
        expect(hydra).to receive(:add).with(second)
        expect(hydra).to receive(:add).with(third)
        hydra.dequeue_many
      end

      context "when max_concurrency is two" do
        let(:options) { {:max_concurrency => 2} }
        it "adds requests from queue to multi" do
          expect(hydra).to receive(:add).with(first)
          expect(hydra).to receive(:add).with(second)
          expect(hydra).to_not receive(:add).with(third)
          hydra.dequeue_many
        end
      end

      context "when max_concurrency is a string" do
        let(:options) { {:max_concurrency => "2"} }
        it "adds requests from queue to multi" do
          expect(hydra).to receive(:add).with(first)
          expect(hydra).to receive(:add).with(second)
          expect(hydra).to_not receive(:add).with(third)
          hydra.dequeue_many
        end
      end
    end
  end
end
