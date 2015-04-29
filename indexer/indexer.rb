class CommonIndexer

  add_indexer_initialize_hook do |indexer|

    indexer.add_document_prepare_hook {|doc, record|
      if record['record']['jsonmodel_type'] == 'archival_object'
        level = record['record']['level_display_string']
        doc['title'] = [doc['title'], level].compact.join(", ")
      end
    }

  end

end
