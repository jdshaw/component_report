require 'aspace_logger'

class Cart

  include JSONModel

  attr_accessor :cart_items

  def initialize(uris)
    @uris = uris.take(self.class.limit)
    @cart_items = []

    build_cart_items
  end


  def build_cart_items
    @uris.each do | uri |
      if URIResolver.record_exists?(uri)
        build_cart_item_for(uri)
      end
    end
  end


  def build_cart_item_for(uri)
    cart_item = { "selected" => {"ref" => uri} }

    parsed = JSONModel.parse_reference(uri)
    if parsed[:type] == "resource"
      cart_item["resource"] = { "ref" => uri }
    elsif parsed[:type] == "archival_object"
      ancestors = calculate_archival_object_ancestors(uri, parsed[:id])

      ancestors.reverse.each do |level, uri|
        if uri
          if level == "otherlevel"
            level = "box"
          end
          
          cart_item[level] = { "ref" => uri }
        end
      end
    end

    @cart_items << cart_item

  end

  private

  def calculate_archival_object_ancestors(uri, ao_id)
    ao = ArchivalObject[ao_id]
    level = [ao.level]
    ancestors = [uri]

    while(ao.parent_id) do
      ao = ArchivalObject[ao.parent_id]
      ancestors.push(ao.uri)
      level.push(ao.level)
    end
    
    resource = Resource[ao.root_record_id]
    ancestors.push(resource.uri)
    level.push("resource")

    level.zip(ancestors)
  end

  def self.limit
    AppConfig.has_key?(:component_report_cart_limit) ? AppConfig[:component_report_cart_limit] : 1000
  end

end