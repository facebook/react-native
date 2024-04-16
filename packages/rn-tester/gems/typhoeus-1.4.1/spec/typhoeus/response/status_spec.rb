require 'spec_helper'

describe Typhoeus::Response::Status do
  let(:response) { Typhoeus::Response.new(options) }
  let(:options) { {} }

  describe "timed_out?" do
    context "when return code is operation_timedout" do
      let(:options) { {:return_code => :operation_timedout} }

      it "return true" do
        expect(response).to be_timed_out
      end
    end
  end

  describe "#status_message" do
    context "when no header" do
      it "returns nil" do
        expect(response.status_message).to be_nil
      end
    end

    context "when header" do
      context "when no message" do
        let(:options) { {:response_headers => "HTTP/1.1 200\r\n"} }

        it "returns nil" do
          expect(response.status_message).to be_nil
        end
      end

      context "when messsage" do
        let(:options) { {:response_headers => "HTTP/1.1 200 message\r\n"} }

        it "returns message" do
          expect(response.status_message).to eq("message")
        end
      end
    end
  end

  describe "#http_version" do
    context "when no header" do
      it "returns nil" do
        expect(response.http_version).to be_nil
      end
    end

    context "when header" do
      context "when no http version" do
        let(:options) { {:response_headers => "HTTP OK"} }

        it "returns nil" do
          expect(response.http_version).to be_nil
        end
      end

      context "when invalid http_version" do
        let(:options) { {:response_headers => "HTTP foo/bar OK"} }

        it "returns nil" do
          expect(response.http_version).to be_nil
        end
      end

      context "when valid http_version" do
        let(:options) { {:response_headers => "HTTP/1.1 OK"} }

        it "returns http_version" do
          expect(response.http_version).to eq("1.1")
        end
      end
    end
  end

  describe "#success?" do
    context "when response code 200-299" do
      let(:options) { {:return_code => return_code, :response_code => 201} }

      context "when mock" do
        before { response.mock = true }

        context "when return_code :ok" do
          let(:return_code) { :ok }

          it "returns true" do
            expect(response.success?).to be_truthy
          end
        end

        context "when return_code nil" do
          let(:return_code) { nil }

          it "returns true" do
            expect(response.success?).to be_truthy
          end
        end
      end

      context "when no mock" do
        before { response.mock = nil }

        context "when return_code :ok" do
          let(:return_code) { :ok }

          it "returns true" do
            expect(response.success?).to be_truthy
          end
        end

        context "when return_code nil" do
          let(:return_code) { nil }

          it "returns false" do
            expect(response.success?).to be_falsey
          end
        end
      end
    end

    context "when response code is not 200-299" do
      let(:options) { {:return_code => :ok, :response_code => 500} }

      it "returns false" do
        expect(response.success?).to be_falsey
      end
    end
  end

  describe "#failure?" do
    context "when response code between 300-526 and 100-300" do
      let(:options) { {:return_code => return_code, :response_code => 300} }

      context "when mock" do
        before { response.mock = true }

        context "when return_code :internal_server_error" do
          let(:return_code) { :internal_server_error }

          it "returns true" do
            expect(response.failure?).to be_truthy
          end
        end

        context "when return_code nil" do
          let(:return_code) { nil }

          it "returns true" do
            expect(response.failure?).to be_truthy
          end
        end
      end

      context "when no mock" do
        before { response.mock = nil }

        context "when return_code :internal_server_error" do
          let(:return_code) { :internal_server_error }

          it "returns true" do
            expect(response.failure?).to be_truthy
          end
        end

        context "when return_code nil" do
          let(:return_code) { nil }

          it "returns false" do
            expect(response.failure?).to be_falsey
          end
        end
      end
    end

    context "when response code is not 300-526" do
      let(:options) { {:return_code => :ok, :response_code => 200} }

      it "returns false" do
        expect(response.failure?).to be_falsey
      end
    end
  end

  describe "#modified?" do
    context "when response code 304" do
      let(:options) { {:return_code => :ok, :response_code => 304} }

      context "when mock" do
        before { response.mock = true }

        context "when return_code :ok" do
          let(:return_code) { :ok }

          it "returns false" do
            expect(response.modified?).to be_falsey
          end
        end

        context "when return_code nil" do
          let(:return_code) { nil }

          it "returns false" do
            expect(response.modified?).to be_falsey
          end
        end
      end

      context "when no mock" do
        before { response.mock = nil }

        context "when return_code :ok" do
          let(:return_code) { :ok }

          it "returns false" do
            expect(response.modified?).to be_falsey
          end
        end

        context "when return_code nil" do
          let(:return_code) { nil }

          it "returns true" do
            expect(response.modified?).to be_falsey
          end
        end
      end
    end

    context "when response code is not 304" do
      let(:options) { {:return_code => :ok, :response_code => 500} }

      it "returns true" do
        expect(response.modified?).to be_truthy
      end
    end
  end

  describe "#first_header_line" do
    context "when multiple header" do
      let(:options) { {:response_headers => "1\r\n\r\n2\r\nbla"} }

      it "returns first line of last block" do
        expect(response.method(:first_header_line).call).to eq("2")
      end
    end

    context "when single header" do
      let(:options) { {:response_headers => "1"} }

      it "returns first line" do
        expect(response.method(:first_header_line).call).to eq("1")
      end
    end
  end
end
