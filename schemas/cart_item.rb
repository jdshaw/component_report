{
  :schema => {
    "$schema" => "http://www.archivesspace.org/archivesspace.json",
    "version" => 1,
    "type" => "object",
    "properties" => {

      "selected" => {
        "type" => "object",
        "subtype" => "ref",
        "ifmissing" => "error",
        "properties" => {
          "ref" => {
            "type" => "JSONModel(:resource) uri",
            "ifmissing" => "error",
          },
          "_resolved" => {
            "type" => "object",
            "readonly" => "true"
          }
        }
      },

      "resource" => {
        "type" => "object",
        "subtype" => "ref",
        "ifmissing" => "error",
        "properties" => {
          "ref" => {
            "type" => "JSONModel(:resource) uri",
            "ifmissing" => "error",
          },
          "_resolved" => {
            "type" => "object",
            "readonly" => "true"
          }
        }
      },

      "series" => {
        "type" => "object",
        "subtype" => "ref",
        "properties" => {
          "ref" => {
            "type" => "JSONModel(:archival_object) uri",
          },
          "_resolved" => {
            "type" => "object",
            "readonly" => "true"
          }
        }
      },

      "box" => {
        "type" => "object",
        "subtype" => "ref",
        "properties" => {
          "ref" => {
            "type" => "JSONModel(:archival_object) uri",
          },
          "_resolved" => {
            "type" => "object",
            "readonly" => "true"
          }
        }
      },

      "file" => {
        "type" => "object",
        "subtype" => "ref",
        "properties" => {
          "ref" => {
            "type" => "JSONModel(:archival_object) uri",
          },
          "_resolved" => {
            "type" => "object",
            "readonly" => "true"
          }
        }
      },

      "item" => {
        "type" => "object",
        "subtype" => "ref",
        "properties" => {
          "ref" => {
            "type" => "JSONModel(:archival_object) uri",
          },
          "_resolved" => {
            "type" => "object",
            "readonly" => "true"
          }
        }
      },
    },
  },
}
