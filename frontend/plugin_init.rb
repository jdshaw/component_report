my_routes = [File.join(File.dirname(__FILE__), "routes.rb")]
ArchivesSpace::Application.config.paths['config/routes'].concat(my_routes)

Rails.application.config.after_initialize do


  SearchController.class_eval do
    alias_method :advanced_search_pre_search_cart, :advanced_search
    def advanced_search
      @show_multiselect_column = true
      advanced_search_pre_search_cart
    end
  end


  ActionView::PartialRenderer.class_eval do
    alias_method :render_pre_search_cart, :render
    def render(context, options, block)
      result = render_pre_search_cart(context, options, block);

      # Add our cart-specific templates to shared/templates
      if options[:partial] == "shared/templates"
        result += render(context, options.merge(:partial => "search/cart"), nil)
      end

      result
    end
  end

end
