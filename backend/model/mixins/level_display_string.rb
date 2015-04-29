module LevelDisplayString

  def self.included(base)
    base.extend(ClassMethods)
  end

  def level_display_string
    self.other_level || I18n.t("enumerations.archival_record_level.#{self.level}", self.level)
  end

  module ClassMethods
    def sequel_to_jsonmodel(objs, opts = {})
      jsons = super

      jsons.zip(objs).each do |json, obj|
        json['level_display_string'] = obj.level_display_string
      end

      jsons
    end
  end

end