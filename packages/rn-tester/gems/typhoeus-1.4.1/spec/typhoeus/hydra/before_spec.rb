require 'spec_helper'

describe Typhoeus::Hydra::Before do
  let(:request) { Typhoeus::Request.new("") }
  let(:hydra) { Typhoeus::Hydra.new }
  let(:receive_counter) { double :mark => :twain }

  describe "#add" do
    context "when before" do
      context "when one" do
        it "executes" do
          Typhoeus.before { |r| receive_counter.mark }
          expect(receive_counter).to receive(:mark)
          hydra.add(request)
        end

        context "when true" do
          it "calls super" do
            Typhoeus.before { true }
            expect(Typhoeus::Expectation).to receive(:response_for)
            hydra.add(request)
          end
        end

        context "when falsy" do
          context "when queue requests" do
            let(:queued_request) { Typhoeus::Request.new("") }

            before { hydra.queue(queued_request) }

            it "dequeues" do
              Typhoeus.before { false }
              hydra.add(request)
              expect(hydra.queued_requests).to be_empty
            end
          end

          context "when false" do
            it "doesn't call super" do
              Typhoeus.before { false }
              expect(Typhoeus::Expectation).to receive(:response_for).never
              hydra.add(request)
            end
          end

          context "when response" do
            it "doesn't call super" do
              Typhoeus.before { Typhoeus::Response.new }
              expect(Typhoeus::Expectation).to receive(:response_for).never
              hydra.add(request)
            end
          end
        end
      end

      context "when multi" do
        context "when all true" do
          before { 3.times { Typhoeus.before { |r| receive_counter.mark } } }

          it "calls super" do
            expect(Typhoeus::Expectation).to receive(:response_for)
            hydra.add(request)
          end

          it "executes all" do
            expect(receive_counter).to receive(:mark).exactly(3).times
            hydra.add(request)
          end
        end

        context "when middle false" do
          before do
            Typhoeus.before { |r| receive_counter.mark }
            Typhoeus.before { |r| receive_counter.mark; nil }
            Typhoeus.before { |r| receive_counter.mark }
          end

          it "doesn't call super" do
            expect(Typhoeus::Expectation).to receive(:response_for).never
            hydra.add(request)
          end

          it "executes only two" do
            expect(receive_counter).to receive(:mark).exactly(2).times
            hydra.add(request)
          end
        end
      end
    end

    context "when no before" do
      it "calls super" do
        expect(Typhoeus::Expectation).to receive(:response_for)
        hydra.add(request)
      end
    end
  end
end
