class CartController < ApplicationController

  set_access_control  "view_repository" => [:checkout, :summary, :download_report]

  def checkout
  end


  def summary
    uris = ASUtils.as_array(params[:uri])
    if uris.empty?
      @cart_items = []
    else
      response = JSONModel::HTTP.post_form("/plugins/component_report/repositories/#{session[:repo_id]}/cart", "uri[]" => uris)
      @cart_items = ASUtils.json_parse(response.body)
    end

    render_aspace_partial :partial => "cart/summary"
  end


  def download_report
    uris = ASUtils.as_array(params[:uri])

    queue = Queue.new

    backend_session = JSONModel::HTTP::current_backend_session

    Thread.new do
      JSONModel::HTTP::current_backend_session = backend_session
      begin
        post_with_stream_response("/plugins/component_report/repositories/#{session[:repo_id]}/report", "uri[]" => uris) do |report_response|
          response.headers['Content-Disposition'] = report_response['Content-Disposition']
          response.headers['Content-Type'] = report_response['Content-Type']
          #response.headers['Content-Type'] = "text/html"
          response.headers['Last-Modified'] = Time.now.to_s
          response.headers['Cache-Control'] = 'no-cache'
          response.headers['X-Content-Type-Options'] = 'nosniff'
          #response.headers['Transfer-Encoding'] = 'chunked'

          queue << :ok
          report_response.read_body do |chunk|
            puts ""
            p "++ PRODUCED: #{chunk}"
            queue << chunk
          end
        end
      rescue EOFError
        puts "!! RESCUE EOFError"
        p $!
        queue << :EOF
      rescue
        puts "!! RESCUE"
        p $!
        queue << {:error => $!.message}
      ensure
        puts ""
        p "++ PRODUCED: EOF"
        queue << :EOF
      end
    end

    first_on_queue = queue.pop # :ok or error hash
    if first_on_queue.kind_of?(Hash)
      @report_errors = first_on_queue[:error]

      return render :action => :checkout
    end

    #self.response_body = QueueStreamer.new(queue)

    self.response_body = Class.new do
      def self.queue=(queue)
        @queue = queue
      end
      def self.each(&block)
        while(true)
          chunk = @queue.pop

          puts ""
          p "-- CONSUMED: #{chunk}"

          break if chunk === :EOF

          block.call(chunk)
          sleep(0.2)
        end
      end
    end

    self.response_body.queue = queue
  end


  private

  def post_with_stream_response(uri, params = {}, &block)
    uri = URI("#{ JSONModel::backend_url}#{uri}")
    uri.query = URI.encode_www_form(params)

    req = Net::HTTP::Post.new(uri.request_uri)

    req['X-ArchivesSpace-Session'] = JSONModel::HTTP::current_backend_session

    Net::HTTP.start(uri.host, uri.port) do |http|
      http.request(req, nil) do |response|
        if response.code =~ /^4/
          JSONModel::handle_error(ASUtils.json_parse(response.body))
          raise response.body
        end

        p response.to_hash

        block.call(response)
      end
    end
  end

end

class QueueStreamer

  def initialize(queue)
    @queue = queue
  end

  def each(&block)
    while(true)
      chunk = @queue.pop

      puts ""
      p "-- CONSUMED: #{chunk}"

      break if chunk === :EOF

      block.call(chunk)
      sleep(0.1)
    end
  end

end