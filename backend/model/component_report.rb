require 'axlsx'

class ComponentReport

  RESOURCE_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Resource ID",          :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Resource Dates",       :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Location",             :proc => Proc.new {|cart_item| "TODO"}},
  ]

  SERIES_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Resource ID",          :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Series Title",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Series Dates",         :proc => Proc.new {|cart_item| "TODO"}},
  ]

  BOX_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Resource ID",          :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Series Title",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Series Dates",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Title",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Dates",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Location",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Restrictions",         :proc => Proc.new {|cart_item| "TODO"}},
  ]

  FILE_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Resource ID",          :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Series Title",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Series Dates",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Title",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Dates",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Location",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "File Title",           :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "File Date",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "File Scope/Content",   :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Restrictions",         :proc => Proc.new {|cart_item| "TODO"}},
  ]

  ITEM_COLUMNS = [
    {:header => "Resource Title",       :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Resource ID",          :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Agent Name (creator)", :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Series Title",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Series Dates",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Title",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Dates",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Box Location",         :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "File Title",           :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "File Date",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "File Scope/Content",   :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Item Description",     :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Item Date",            :proc => Proc.new {|cart_item| "TODO"}},
    {:header => "Restrictions",         :proc => Proc.new {|cart_item| "TODO"}},
  ]



  def initialize(cart)
    @cart = cart

    @p = Axlsx::Package.new
    @wb = @p.workbook

    build_report
  end

  def to_stream
    p "**********"
    p @p.validate
    p "**********"
    @p.serialize 'testing.xlsx'
    @p.to_stream(true)
  end

  private

  def build_report
    add_empty_worksheets_with_headers

    @cart.each do |cart_item|
      add_cart_item_to_report(cart_item)
    end
  end


  def add_empty_worksheets_with_headers
    # resources
    @resources_ws = @wb.add_worksheet(:name => "Resources")
    @resources_ws.add_row(RESOURCE_COLUMNS.map{|col| col[:header]})

    # series
    @series_ws = @wb.add_worksheet(:name => "Series")
    @series_ws.add_row(SERIES_COLUMNS.map{|col| col[:header]})

    # boxes
    @boxes_ws = @wb.add_worksheet(:name => "Boxes")
    @boxes_ws.add_row(BOX_COLUMNS.map{|col| col[:header]})

    # files
    @files_ws = @wb.add_worksheet(:name => "Files")
    @files_ws.add_row(FILE_COLUMNS.map{|col| col[:header]})

    # items
    @items_ws = @wb.add_worksheet(:name => "Items")
    @items_ws.add_row(ITEM_COLUMNS.map{|col| col[:header]})
  end


  def add_cart_item_to_report(cart_item)
    @resources_ws.add_row(RESOURCE_COLUMNS.map {|col| col[:proc].call(cart_item)})
    @series_ws.add_row(SERIES_COLUMNS.map {|col| col[:proc].call(cart_item)})
    @boxes_ws.add_row(BOX_COLUMNS.map {|col| col[:proc].call(cart_item)})
    @files_ws.add_row(FILE_COLUMNS.map {|col| col[:proc].call(cart_item)})
    @items_ws.add_row(ITEM_COLUMNS.map {|col| col[:proc].call(cart_item)})
  end

end