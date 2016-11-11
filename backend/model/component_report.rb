require 'axlsx'

class ComponentReport
  
  # constant for report type=patron
  PATRON_TYPE = "patron"

  RESOURCE_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|resource| record_title(resource)}},
    {:header => "Resource ID",          :proc => Proc.new {|resource| resource_id(resource)}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|resource| resource_creator(resource)}},
    {:header => "Resource Dates",       :proc => Proc.new {|resource| record_dates(resource)}},
    {:header => "Location",             :proc => Proc.new {|resource| resource_locations(resource)}},
  ]

  SERIES_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|resource, series| record_title(resource)}},
    {:header => "Resource ID",          :proc => Proc.new {|resource, series| resource_id(resource)}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|resource, series| resource_creator(resource)}},
    {:header => "Series Title",         :proc => Proc.new {|resource, series| record_title(series)}},
    {:header => "Series Dates",         :proc => Proc.new {|resource, series| record_dates(series)}},
  ]

  BOX_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|resource, series, box| record_title(resource)}},
    {:header => "Resource ID",          :proc => Proc.new {|resource, series, box| resource_id(resource)}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|resource, series, box| resource_creator(resource)}},
    {:header => "Series Title",         :proc => Proc.new {|resource, series, box| record_title(series)}},
    {:header => "Series Dates",         :proc => Proc.new {|resource, series, box| record_dates(series)}},
    {:header => "Box Title",            :proc => Proc.new {|resource, series, box| record_title(box)}},
    {:header => "Box Number",           :proc => Proc.new {|resource, series, box| box_number(box)}},
    {:header => "Box Dates",            :proc => Proc.new {|resource, series, box| record_dates(box)}},
    {:header => "Box Location",         :proc => Proc.new {|resource, series, box, type| box_locations(box)}},
    {:header => "Restrictions",         :proc => Proc.new {|resource, series, box| restrictions(resource, series, box)}},
  ]

  FILE_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|resource, series, box, file| record_title(resource)}},
    {:header => "Resource ID",          :proc => Proc.new {|resource, series, box, file| resource_id(resource)}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|resource, series, box, file| resource_creator(resource)}},
    {:header => "Series Title",         :proc => Proc.new {|resource, series, box, file| record_title(series)}},
    {:header => "Series Dates",         :proc => Proc.new {|resource, series, box, file| record_dates(series)}},
    {:header => "Box Title",            :proc => Proc.new {|resource, series, box, file| record_title(box)}},
    {:header => "Box Number",           :proc => Proc.new {|resource, series, box, file| box_number(box)}},
    {:header => "Box Dates",            :proc => Proc.new {|resource, series, box, file| record_dates(box)}},
    {:header => "Box Location",         :proc => Proc.new {|resource, series, box, file, type| box_locations(box)}},
    {:header => "File Number",          :proc => Proc.new {|resource, series, box, file| file_number(file)}},
    {:header => "File Title",           :proc => Proc.new {|resource, series, box, file| record_title(file)}},
    {:header => "File Date",            :proc => Proc.new {|resource, series, box, file| record_dates(file)}},
    {:header => "File Scope/Content",   :proc => Proc.new {|resource, series, box, file| file_scope(file)}},
    {:header => "Restrictions",         :proc => Proc.new {|resource, series, box, file| restrictions(resource, series, box, file)}},
  ]

  ITEM_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|resource, series, box, file, item| record_title(resource)}},
    {:header => "Resource ID",          :proc => Proc.new {|resource, series, box, file, item| resource_id(resource)}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|resource, series, box, file, item| resource_creator(resource)}},
    {:header => "Series Title",         :proc => Proc.new {|resource, series, box, file, item| record_title(series)}},
    {:header => "Series Dates",         :proc => Proc.new {|resource, series, box, file, item| record_dates(series)}},
    {:header => "Box Title",            :proc => Proc.new {|resource, series, box, file, item| record_title(box)}},
    {:header => "Box Number",           :proc => Proc.new {|resource, series, box, file, item| box_number(box)}},
    {:header => "Box Dates",            :proc => Proc.new {|resource, series, box, file, item| record_dates(box)}},
    {:header => "Box Location",         :proc => Proc.new {|resource, series, box, file, item, type| box_locations(box)}},
    {:header => "File Number",          :proc => Proc.new {|resource, series, box, file, item| file_number(file)}},
    {:header => "File Title",           :proc => Proc.new {|resource, series, box, file, item| record_title(file)}},
    {:header => "File Date",            :proc => Proc.new {|resource, series, box, file, item| record_dates(file)}},
    {:header => "File Scope/Content",   :proc => Proc.new {|resource, series, box, file, item| file_scope(file)}},
    {:header => "Item Description",     :proc => Proc.new {|resource, series, box, file, item| record_title(item)}},
    {:header => "Item Date",            :proc => Proc.new {|resource, series, box, file, item| record_dates(item)}},
    {:header => "Restrictions",         :proc => Proc.new {|resource, series, box, file, item| restrictions(resource, series, box, file, item)}},
  ]

  SHARED_SHELF_COLUMNS = [
    {:header => "SSID",                 :proc => Proc.new {ss_id}},
    {:header => "Filename",             :proc => Proc.new {|resource, item, report_id| ss_filename(report_id)}},
    {:header => "Creator[46369]",       :proc => Proc.new {|resource, item, report_id| resource_creator(item)}},
    {:header => "Title[46370]",         :proc => Proc.new {|resource, item, report_id| record_title(item)}},
    {:header => "Date[46371]",          :proc => Proc.new {|resource, item, report_id| record_dates(item,false)}},
    {:header => "Description[46373]",   :proc => Proc.new {|resource, item, report_id| file_scope(item)}},
    {:header => "Format[46380]",        :proc => Proc.new {|resource, item, report_id| extents(item)}},
    {:header => "Identifier[46382]",    :proc => Proc.new {|resource, item, report_id|
                                                              resource_id(resource) +
                                                              (item_ss_locations(item).length>0? ": " : "") +
                                                              item_ss_locations(item)}},

  ]


  def initialize(cart,type,report_id)
    @cart = cart
    
    @report_id = report_id
    @p = Axlsx::Package.new
    @wb = @p.workbook
    @wb.use_shared_strings = true # fix newlines/wrapping in Mac Excel

    @cell_style = @wb.styles.add_style alignment: {
      wrap_text: true,
      vertical: :top
    }
    if type == 'shared_shelf'
      build_ss_report
    else
      build_report(type)
    end
    
  end

  def to_stream
    #For testing, serialize report to a file
    #@p.serialize("testing.xlsx")
    @p.to_stream
  end

  private

  def build_report(type)

    add_empty_worksheets_with_headers(type)

    @cart.each do |cart_item|
      # bit of a kluge for objects in the tree that do not have series in the ancestors
      # ie if we have a box directly descended from a resource
      # basically build out a minimal, empty series object and add that to the cart_item
      # also a kluge for files that hang directly off of a resource or a series - eg vertical files and alumni files
      
      if cart_item['item'] && !cart_item['file']
        cart_item['file'] = {"ref"=>"", "_resolved" => {"title"=>"","dates"=>[],"notes"=>[]}}
      end
      if cart_item['file'] && !cart_item['box']
        cart_item['box'] = {"ref"=>"", "_resolved" => {"title"=>"","dates"=>[],"notes"=>[], "instances"=>[]}}
      end
      if cart_item['box'] && !cart_item['series']
        cart_item['series'] = {"ref"=>"", "_resolved" => {"title"=>"","dates"=>[],"notes"=>[]}}
      end

      add_cart_item_to_report(cart_item, type)
    end
  end
  
  def build_ss_report
    add_empty_ss_worksheet_with_headers

    @cart.each do |cart_item|
      add_cart_item_to_ss_report(cart_item)
    end
  end

  def add_empty_ss_worksheet_with_headers
    # resources
    @shared_shelf_ws = @wb.add_worksheet(:name => "Shared Shelf")
    @shared_shelf_ws.add_row(SHARED_SHELF_COLUMNS.map{|col| col[:header]})
  end

  def add_empty_worksheets_with_headers(type)
    # resources
    @resources_ws = @wb.add_worksheet(:name => "Resources")
    @resources_ws.add_row(RESOURCE_COLUMNS.map{|col| col[:header]})

    # series
    @series_ws = @wb.add_worksheet(:name => "Series")
    @series_ws.add_row(SERIES_COLUMNS.map{|col| col[:header]})

    # boxes
    @boxes_ws = @wb.add_worksheet(:name => "Boxes")
    box_headers = BOX_COLUMNS.map{|col| (col[:header]=="Box Location" && type==PATRON_TYPE)? next : col[:header]}.reject{|e| e.to_s.empty?}
    @boxes_ws.add_row(box_headers)
    

    # files
    @files_ws = @wb.add_worksheet(:name => "Files")
    file_headers = FILE_COLUMNS.map{|col| (col[:header]=="Box Location" && type==PATRON_TYPE)? next : col[:header]}.reject{|e| e.to_s.empty?}
    @files_ws.add_row(file_headers)
    
    # items
    @items_ws = @wb.add_worksheet(:name => "Items")
    item_headers = ITEM_COLUMNS.map{|col| (col[:header]=="Box Location" && type==PATRON_TYPE)? next : col[:header]}.reject{|e| e.to_s.empty?}
    @items_ws.add_row(item_headers)
  end

  # a placeholder so that we can remove the array element that corresponds to the box location for patron reports
  # we can't use empty or nil since other elements may fit that criteria
  BOX_LOCATION_PLACEHOLDER = "BOX_LOCATION_PLACEHOLDER"

  # Add the cart item to the correct worksheet
  def add_cart_item_to_report(cart_item, type)
    add_item(cart_item, type) || add_file(cart_item, type) || add_box(cart_item, type) || add_series(cart_item) || add_resource(cart_item)
  end

  def add_cart_item_to_ss_report(cart_item)
    add_ss_item(cart_item)
  end

  def add_item(cart_item, type)
    cart_item['item'] && @items_ws.add_row(ITEM_COLUMNS.map {|col| (col[:header]=="Box Location" && type==PATRON_TYPE)? BOX_LOCATION_PLACEHOLDER : col[:proc].call(cart_item['resource']['_resolved'],cart_item['series']['_resolved'],cart_item['box']['_resolved'], cart_item['file']['_resolved'],cart_item['item']['_resolved'])}.reject{|e| e==BOX_LOCATION_PLACEHOLDER}, style: @cell_style)
  end
  
  def add_ss_item(cart_item)
    cart_item['item'] && @shared_shelf_ws.add_row(SHARED_SHELF_COLUMNS.map {|col| col[:proc].call(cart_item['resource']['_resolved'],cart_item['item']['_resolved'], @report_id)}, style: @cell_style)
  end

  def add_file(cart_item, type)
    cart_item['file'] && @files_ws.add_row(FILE_COLUMNS.map {|col| (col[:header]=="Box Location" && type==PATRON_TYPE)? BOX_LOCATION_PLACEHOLDER : col[:proc].call(cart_item['resource']['_resolved'],cart_item['series']['_resolved'],cart_item['box']['_resolved'],cart_item['file']['_resolved'])}.reject{|e| e==BOX_LOCATION_PLACEHOLDER}, style: @cell_style)
  end


  def add_box(cart_item, type)
    cart_item['box'] && @boxes_ws.add_row(BOX_COLUMNS.map {|col| (col[:header]=="Box Location" && type==PATRON_TYPE)? BOX_LOCATION_PLACEHOLDER : col[:proc].call(cart_item['resource']['_resolved'],cart_item['series']['_resolved'],cart_item['box']['_resolved'])}.reject{|e| e==BOX_LOCATION_PLACEHOLDER}, style: @cell_style)
  end


  def add_series(cart_item)
    cart_item['series'] && @series_ws.add_row(SERIES_COLUMNS.map {|col| col[:proc].call(cart_item['resource']['_resolved'],cart_item['series']['_resolved'])}, style: @cell_style)
  end


  def add_resource(cart_item)
    cart_item['resource'] && @resources_ws.add_row(RESOURCE_COLUMNS.map {|col| col[:proc].call(cart_item['resource']['_resolved'])}, style: @cell_style)
  end


  # Cell value generators
  
  # always return "NEW"
  def self.ss_filename(report_id)
    "component_report_"+report_id+".xlsx"
  end
  
  def self.ss_id
    "NEW"
  end
  
  def self.record_title(record)
    record['title']
  end


  def self.resource_id(resource)
    (0..3).map {|i| resource["id_#{i}"]}.compact.join(".")
  end


  def self.resource_creator(resource)
    resource['linked_agents'].map{|agent|
      agent['_resolved']['title'].strip if agent['role'] == "creator"
    }.compact.join(", ")
  end
  

  def self.record_dates(record, label=true)
    record['dates'].map{|date|
      if label
        date_string = I18n.t("enumerations.date_label.#{date['label']}", :default => date['label'])
        date_string << ": "
      else
        date_string = ""
      end
      if date['expression']
        date_string << date['expression']
      elsif date['date_type'] == 'single'
        date_string << date['begin']
      else
        date_string << "#{date['begin']} - #{date['end']}"
      end
    }.join(", ")
  end


  def self.resource_locations(resource)
    # (Location: Instance 1, Container 1 Indicator)
    container_instances = resource['instances'].map{|inst| inst if inst['container']}.compact

    container_instances.map{|instance|
      container = instance['container']
      current_location = ASUtils.as_array(container['container_locations']).find{|cl| cl['status'] == 'current'}

      location_display_string = current_location.nil? ? "No Location" : current_location['_resolved']['title']
      container_display_string = container['indicator_1']

      "#{location_display_string}: #{container_display_string}"
    }.join("; ")
  end


  def self.box_locations(box)
    # (Location: Area, Coord Ind 1, Coord Ind 2, Coord Ind 3)
    container_instances = box['instances'].map{|inst| inst if inst['container']}.compact

    container_instances.map{|instance|
      container = instance['container']
      current_location = ASUtils.as_array(container['container_locations']).find{|cl| cl['status'] == 'current'}

      current_location.nil? ? "No Location" : current_location['_resolved']['title']
    }.join("; ")
  end
  
  def self.item_ss_locations(item)
    container_instances = item['instances'].map{|inst| inst if inst['container']}.compact

    container_instances.map{|instance|
      container = instance['container'] ? instance['container'] : []

        (0..3).map {|i|
          container["type_#{i}"].titlecase + " " + container["indicator_#{i}"] if container["type_#{i}"]
        }.compact.join(", ")
    }.join("; ")
  end
  
  def self.extents(item)
    extents = item['extents'].map{|ext| ext if ext['number']}.compact
    
    extents.map{|extent|
      extent['number'] + " " + extent['extent_type'] + (", " + extent['container_summary'] if extent['container_summary'])
    }.compact.join("; ")
  end

  NEWLINE = "\x0D\x0A"
  def self.restrictions(*records)
    restrictions_per_note_type = []
    notes = {}

    ASUtils.as_array(records).each{|record|
      record['notes'].each{ |note|
        notes[note['type']] ||= []
        notes[note['type']] << note
      }
    }

    if notes["accessrestrict"]
      summary = "#{I18n.t("enumerations.note_multipart_type.accessrestrict")}:#{NEWLINE}"
      summary += notes["accessrestrict"].map{|note|
        ASUtils.as_array(note['subnotes']).map{|subnote| subnote['content']}.compact
      }.flatten.uniq.join(NEWLINE)

      restrictions_per_note_type << summary
    end


    if notes["userestrict"]
      summary = "#{I18n.t("enumerations.note_multipart_type.userestrict")}:#{NEWLINE}"

      summary += notes["userestrict"].map{|note|
        ASUtils.as_array(note['subnotes']).map{|subnote| subnote['content']}.compact
      }.flatten.uniq.join(NEWLINE)

      restrictions_per_note_type << summary
    end

    restrictions_per_note_type.join(NEWLINE+NEWLINE)
  end


  def self.file_scope(file)
    # File Scope/Content (note of type scopecontent)
    subnotes = ASUtils.as_array(file['notes']).map{|note|
      note['subnotes'] if note['type'] == "scopecontent"
    }.compact.flatten
    subnotes.map{|subnote|
      subnote['content']
    }.compact.join(NEWLINE)
  end


  def self.box_number(box)
    first_container_instance = ASUtils.wrap(box["instances"]).find{|instance| instance.has_key?("container")}

    first_container_instance ? first_container_instance["container"]["indicator_1"] : ""
  end
  
  def self.file_number(file)
    first_container_instance = ASUtils.wrap(file["instances"]).find{|instance| instance.has_key?("container")}

    first_container_instance ? first_container_instance["container"]["indicator_2"] : ""
  end
end