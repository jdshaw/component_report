$(function() {

  var init_search_cart = function() {
    var $table = $(this);

    var $summary = $table.closest(".record-pane").find(".pagination-summary-of-selection");

    var pageKey = location.pathname;
    var multiselectData = AS.getData("multiselect") || {};
    multiselectData[pageKey] = multiselectData[pageKey] || {};

    var updateSelectionSummary = function() {
      if ($.isEmptyObject(multiselectData[pageKey])) {
        $summary.addClass("hide");
      } else {
        var size = 0;
        for (var key in multiselectData[pageKey]) {
          size++
        }
        $summary.removeClass("hide").find(".pagination-summary-of-selection-count").html(size);
      }
    };


    var addToSelection = function(uri, display_string, record_type) {
      multiselectData = AS.setData("multiselect", function(data) {
        if (data == null) {
          data = {};
        }
        if (!data.hasOwnProperty(pageKey)) {
          data[pageKey] = {};
        }

        data[pageKey][uri] = {
          display_string: display_string,
          record_type: record_type
        };

        return data;
      });
    };


    var removeFromSelection = function(uri) {
      multiselectData = AS.setData("multiselect", function(data) {
        if (data == null) {
          data = {};
        }
        if (!data.hasOwnProperty(pageKey)) {
          data[pageKey] = {};
        }

        delete data[pageKey][uri];

        return data;
      });
    };

    var clearSelection = function() {
      multiselectData = AS.setData("multiselect", function(data) {
        if (data) {
          delete data[pageKey];
        }

        return data;
      });
    };


    /*if (AS.QueryString.hasOwnProperty("deleted_uri")) {
      $.each(AS.QueryString.deleted_uri, function(i, uri) {
        removeFromSelection(uri);
      });
    }*/

    updateSelectionSummary();

    $table.on("click", ".multiselect-column :input", function(event) {
      var $this = $(event.target);
      var $row = $this.closest("tr");

      if ($row.hasClass("selected")) {
        addToSelection($this.val(), $row.data("display-string"), $row.data("record-type"));
      } else {
        removeFromSelection($this.val());
      }

      updateSelectionSummary();

      setTimeout(function() {
        if ($.isEmptyObject(multiselectData[pageKey])) {
          $table.trigger("multiselectempty.aspace");
        }
      });
    });

    $(".multiselect-enabled").each(function() {
      var $multiselectAffectedWidget = $(this);
      if ($table.is($multiselectAffectedWidget.data("multiselect"))) {
        $table.on("multiselectselected.aspace", function() {
          $multiselectAffectedWidget.removeAttr("disabled");
          var selected_records = [];
          $.each(multiselectData[pageKey], function(uri) {
            selected_records.push(uri);
          });
          $multiselectAffectedWidget.data("form-data", {
            record_uris: selected_records
          });
        }).on("multiselectempty.aspace", function() {
          $multiselectAffectedWidget.attr("disabled", "disabled");
          $multiselectAffectedWidget.data("form-data", {});
        });
      }
    });

    $(".pagination-summary-of-selection-popup-link").on("click", function(event) {
      event.preventDefault();

      var $modal = AS.openCustomModal("quickModal",
                                      AS.renderTemplate("template_cart_dialog_title"),
                                      AS.renderTemplate("modal_quick_template", {
                                        message: AS.renderTemplate("template_cart_dialog_contents", {
                                          selected: multiselectData[pageKey]
                                        })
                                      }));

      $modal.on("click", "#clearSelection", function() {
        clearSelection();
        location.reload();
      });
    });

    $("button.multiselect-enabled").on("confirmed.aspace", function() {
      clearSelection();
    });
    /*$(".search-filters #component_switch_link, .search-filters a").on("click", function() {
      clearSelection();
    });
    $(".search-filters form").on("submit", function() {
      clearSelection();
    });*/


    if ($.isEmptyObject(multiselectData[pageKey])) {
      $table.trigger("multiselectempty.aspace");
    } else {
      $.each(multiselectData[pageKey], function(uri, recordData) {
        $(".multiselect-column :input[value='"+uri+"']").prop("checked", "checked");
      });
      $table.trigger("multiselectselected.aspace");
    }

    $(".multiselect-column :input:checked", $table).closest("tr").addClass("selected");
  };

  $(".table-search-results[data-multiselect]").each(init_search_cart);
});

// Add API for storing to LocalStorage
AS.getData = function(key) {
  return $.jStorage.get(key);
};
AS.setData = function(key, mutator) {
  var old = AS.getData(key);
  var updated = mutator(old);

  $.jStorage.set(key, updated);

  return updated;
};