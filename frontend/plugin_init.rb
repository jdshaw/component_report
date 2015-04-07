Rails.application.config.after_initialize do


  SearchController.class_eval do
    alias_method :advanced_search_pre_search_cart, :advanced_search
    def advanced_search
      @show_multiselect_column = true
      advanced_search_pre_search_cart
    end
  end


  # ApplicationHelper.class_eval do
  #   alias_method :render_aspace_partial_pre_search_cart, :render_aspace_partial
  #   def render_aspace_partial(args)
  #     result = render_aspace_partial_pre_search_cart(args);
  #
  #     if args[:partial] == "shared/pagination_summary"
  #       result += render args.merge(:partial => "cart/templates")
  #     end
  #
  #     result
  #   end
  # end

end
