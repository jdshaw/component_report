class ArchivesSpaceService < Sinatra::Base

  Endpoint.post('/plugins/component_report/repositories/:repo_id/cart')
  .description("Return resolved JSON of the records in the cart")
  .params(["repo_id", :repo_id],
          ["uri", [String], "The uris of the records in the cart"])
  .permissions([:view_repository])
  .returns([200, "[(:cart_item)]"]) \
  do
    cart = Cart.new(params[:uri])

    json_response(resolve_references(cart.cart_items, ["resource","series", "box", "file", "item"]))
  end


  Endpoint.post('/plugins/component_report/repositories/:repo_id/report')
  .description("Return Excel formatted component report for record uris")
  .params(["repo_id", :repo_id],
          ["uri", [String], "The uris of the records in the cart"])
  .permissions([:view_repository])
  .returns([200, "report"]) \
  do
    cart_resolved = resolve_references(Cart.new(params[:uri]).cart_items, ["resource","series", "box", "file", "item", "resource::linked_agents", "resource::container_locations", "box::container_locations"])

    [
      200,
      {
        "Content-Type" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition" => "attachment; filename=\"component_report.xlsx\""
      },
      ComponentReport.new(cart_resolved).to_stream
    ]
  end


  Endpoint.get('/plugins/component_report/repositories/:repo_id/uris_for_search')
  .description("Return all Resource or Archival Object URIs for records returned  the search")
  .params(["repo_id", :repo_id],
          *BASE_SEARCH_PARAMS)
  .permissions([:view_repository])
  .returns([200, "OK"]) \
  do
    query = if params[:q]
              Solr::Query.create_keyword_search(params[:q])
            elsif params[:aq] && params[:aq]['query']
              Solr::Query.create_advanced_search(params[:aq])
            else
              Solr::Query.create_match_all_query
            end


    query.pagination(1, CartSettings.limit).
      set_repo_id(params[:repo_id]).
      set_record_types(['resource', 'archival_object']).
      set_filter_terms(params[:filter_term]).
      add_solr_param(:fl, 'id')

    search_response = Solr.search(query)

    json_response(search_response["results"].map{|r| r['uri']})
  end

end