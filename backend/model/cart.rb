class Cart

  include JSONModel

  attr_accessor :cart_items

  def initialize(uris)
    @uris = uris
    @cart_items = []
    @archival_objects = []
    @resources = []

    build_cart_items
  end


  def build_cart_items
    @uris.each do | uri |
      build_cart_item_for(uri)
    end
  end


  def build_cart_item_for(uri)
    cart_item = { "selected" => {"ref" => uri} }

    parsed = JSONModel.parse_reference(uri)
    if parsed[:type] == "resource"
      @resources << uri
      cart_item["resource"] = { "ref" => uri }
    elsif parsed[:type] == "archival_object"
      @archival_objects << uri
      ancestors = calculate_archival_object_ancestors(uri, parsed[:id])

      ["resource","series", "box", "component"].zip(ancestors.reverse) do |level, uri|
        if uri
          cart_item[level] = { "ref" => uri }
        end
      end
    end

    @cart_items << cart_item
  end

  private

  def calculate_archival_object_ancestors(uri, ao_id)
    ao = ArchivalObject[ao_id]
    ancestors = [uri]
    while(ao.parent_id) do
      ao = ArchivalObject[ao.parent_id]
      ancestors.push(ao.uri)
      @archival_objects << ao.uri
    end
    resource = Resource[ao.root_record_id]
    ancestors.push(resource.uri)
    @resources << resource.uri

    ancestors
  end

end