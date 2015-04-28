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

    Thread.new do
      begin
        JSONModel::HTTP::stream("/plugins/component_report/repositories/#{session[:repo_id]}/report", "uri[]" => uris) do |report_response|
          response.headers['Content-Disposition'] = report_response['Content-Disposition']
          response.headers['Content-Type'] = report_response['Content-Type']
          queue << :ok
          report_response.read_body do |chunk|
            queue << chunk
          end
        end
      rescue
        queue << {:error => ASUtils.json_parse($!.message)}
      ensure
        queue << :EOF
      end

    end

    first_on_queue = queue.pop
    if first_on_queue.kind_of?(Hash)
      @report_errors = first_on_queue[:error]
      return render :action => :checkout
    end

    self.response_body = Class.new do
      def self.queue=(queue)
        @queue = queue
      end
      def self.each(&block)
        while(true)
          elt = @queue.pop
          break if elt === :EOF
          block.call(elt)
        end
      end
    end

    self.response_body.queue = queue
  end


  # def download_report
  #   uris = ASUtils.as_array(params[:uri])
  #
  #   queue = Queue.new
  #
  #   #session = Thread.current[:backend_session]
  #
  #   #Thread.new do
  #     begin
  #       #Thread.current[:backend_session] = session
  #       post_with_stream_response("/plugins/component_report/repositories/#{session[:repo_id]}/report", "uri[]" => uris) do |report_response|
  #         response.headers['Content-Disposition'] = report_response['Content-Disposition']
  #         response.headers['Content-Type'] = report_response['Content-Type']
  #         queue << :ok
  #         report_response.read_body do |chunk|
  #           queue << chunk
  #         end
  #       end
  #     rescue
  #       queue << {:error => ASUtils.json_parse($!.message)}
  #     ensure
  #       queue << :EOF
  #     end
  #
  #   #end
  #
  #   first_on_queue = queue.pop
  #   if first_on_queue.kind_of?(Hash)
  #     @report_errors = first_on_queue[:error]
  #
  #     return render :action => :checkout
  #   end
  #
  #   self.response_body = Class.new do
  #     def self.queue=(queue)
  #       @queue = queue
  #     end
  #     def self.each(&block)
  #       while(true)
  #         elt = @queue.pop
  #         break if elt === :EOF
  #         block.call(elt)
  #       end
  #     end
  #   end
  #
  #   self.response_body.queue = queue
  # end
  #
  #
  # private
  #
  # def post_with_stream_response(uri, params = {}, &block)
  #   uri = URI("#{ JSONModel::backend_url}#{uri}")
  #   uri.query = URI.encode_www_form(params)
  #
  #   req = Net::HTTP::Post.new(uri.request_uri)
  #
  #   req['X-ArchivesSpace-Session'] = JSONModel::HTTP::current_backend_session
  #
  #   Net::HTTP.start(uri.host, uri.port) do |http|
  #     http.request(req, nil) do |response|
  #       if response.code =~ /^4/
  #         JSONModel::handle_error(ASUtils.json_parse(response.body))
  #         raise response.body
  #       end
  #
  #       block.call(response)
  #     end
  #   end
  # end

end

