require 'spec_helper'

describe Typhoeus::Hydra::Runnable do
  let(:base_url) { "localhost:3001" }
  let(:options) { {} }
  let(:hydra) { Typhoeus::Hydra.new(options) }
  let(:receive_counter) { double :mark => :twain }

  describe "#run" do
    let(:requests) { [] }

    before do
      requests.each { |r| hydra.queue r }
    end

    it "runs multi#dequeue_many" do
      expect(hydra).to receive(:dequeue_many)
      hydra.run
    end

    it "runs multi#perform" do
      expect(hydra.multi).to receive(:perform)
      hydra.run
    end

    context "when request queued" do
      let(:first) { Typhoeus::Request.new("localhost:3001/first") }
      let(:requests) { [first] }

      it "sends" do
        hydra.run
        expect(first.response).to be
      end
    end

    context "when three request queued" do
      let(:first) { Typhoeus::Request.new("localhost:3001/first") }
      let(:second) { Typhoeus::Request.new("localhost:3001/second") }
      let(:third) { Typhoeus::Request.new("localhost:3001/third") }
      let(:requests) { [first, second, third] }

      it "sends first" do
        hydra.run
        expect(first.response).to be
      end

      it "sends second" do
        hydra.run
        expect(second.response).to be
      end

      it "sends third" do
        hydra.run
        expect(third.response).to be
      end

      it "sends first first" do
        first.on_complete do
          expect(second.response).to be_nil
          expect(third.response).to be_nil
        end
      end

      it "sends second second" do
        first.on_complete do
          expect(first.response).to be
          expect(third.response).to be_nil
        end
      end

      it "sends thirds last" do
        first.on_complete do
          expect(second.response).to be
          expect(third.response).to be
        end
      end
    end

    context "when really queued request" do
      let(:options) { {:max_concurrency => 1} }
      let(:first) { Typhoeus::Request.new("localhost:3001/first") }
      let(:second) { Typhoeus::Request.new("localhost:3001/second") }
      let(:third) { Typhoeus::Request.new("localhost:3001/third") }
      let(:requests) { [first, second, third] }

      it "sends first" do
        hydra.run
        expect(first.response).to be
      end

      it "sends second" do
        hydra.run
        expect(second.response).to be
      end

      it "sends third" do
        hydra.run
        expect(third.response).to be
      end
    end

    context "when request queued in callback" do
      let(:first) do
        Typhoeus::Request.new("localhost:3001/first").tap do |r|
          r.on_complete{ hydra.queue(second) }
        end
      end
      let(:second) { Typhoeus::Request.new("localhost:3001/second") }
      let(:requests) { [first] }

      before { Typhoeus.on_complete { |r| receive_counter.mark } }
      after { Typhoeus.on_complete.clear; Typhoeus.before.clear }

      context "when real request" do
        context "when max_concurrency default" do
          let(:options) { {} }

          it "calls on_complete callback once for every response" do
            expect(receive_counter).to receive(:mark).exactly(2).times
            hydra.run
          end
        end
      end

      context "when no real request" do
        context "when before hook returns and finishes response" do
          before { Typhoeus.before{ |request|  request.finish(Typhoeus::Response.new) } }

          it "simulates real multi run and adds and finishes both requests" do
            expect(receive_counter).to receive(:mark).exactly(2).times
            hydra.run
          end
        end
      end
    end
  end
end
