function Cart(key) {
  this.key = key;
  this.$cart = this.createCartWidget();

  var allData = AS.getData("cart") || {};
  this.data = allData[key] || {};

  this.setupCartEvents();
  this.updateSelectionSummary();
  this.setupSearchResultsActions();
};

Cart.prototype.createCartWidget = function() {
  var $cart = $(AS.renderTemplate("template_cart_toolbar_action"));

  $(".repository-header .navbar-nav .repo-container").before($cart);

  return $cart;
};

Cart.prototype.setupCartEvents = function() {
  var self = this;

  self.$cart.on("click", ".show-cart-btn", function(event) {
    event.preventDefault();

    var $modal = AS.openCustomModal("quickModal",
      AS.renderTemplate("template_cart_dialog_title"),
      AS.renderTemplate("modal_quick_template", {
        message: AS.renderTemplate("template_cart_dialog_contents", {
          selected: self.data
        })
      }),
      "container");

    $modal.find(".modal-footer").replaceWith(AS.renderTemplate("template_cart_dialog_footer"));

    $modal.
      on("click", ".clear-cart-btn", function() {
        self.clearSelection();
        location.reload();
      }).
      on("click", ".remove-from-cart-btn", function(event) {
        var $tr = $(event.target).closest("tr");
        self.removeFromSelection(($tr.data("uri")));
        $tr.remove();
      });
  });
};

Cart.prototype.clearSelection = function() {
  var self = this;

  self.data = AS.setData("cart", function(data) {
    if (data) {
      delete data[self.key];
    }

    return data;
  });

  self.updateSelectionSummary();
};


Cart.prototype.updateSelectionSummary = function() {
  var self = this;

  if ($.isEmptyObject(self.data)) {
    self.$cart.find(".cart-count").html("0");
  } else {
    var size = 0;
    for (var _ in self.data) {
      size++
    }
    self.$cart.find(".cart-count").html(size).removeClass("hide");
  }
};


Cart.prototype.removeFromSelection = function(uri) {
  var self = this;

  self.data = AS.setData("cart", function(data) {
    if (data == null) {
      data = {};
    }
    if (!data.hasOwnProperty(self.key)) {
      data[self.key] = {};
    }

    delete data[self.key][uri];

    return data;
  })[self.key] || {};

  if (self.$table && self.$table.length) {
    var $tr = self.$table.find("[data-uri='"+uri+"']");
    $tr.find(".add-to-cart-btn").removeClass("hide");
    $tr.find(".remove-from-cart-btn").addClass("hide");
  }

  self.updateSelectionSummary();
};


Cart.prototype.addToSelection = function(uri, display_string, record_type) {
  var self = this;

  self.data = AS.setData("cart", function(data) {
    if (data == null) {
      data = {};
    }

    if (!data.hasOwnProperty(self.key)) {
      data[self.key] = {};
    }

    data[self.key][uri] = {
      uri: uri,
      display_string: display_string,
      record_type: record_type
    };

    return data;
  })[self.key];

  if (self.$table && self.$table.length) {
    var $tr = self.$table.find("[data-uri='"+uri+"']");
    $tr.find(".add-to-cart-btn").addClass("hide");
    $tr.find(".remove-from-cart-btn").removeClass("hide");
  }

  self.updateSelectionSummary();
};


Cart.prototype.setupSearchResultsActions = function() {
  var self = this;

  self.$table = $(".table-search-results");
  var actions = AS.renderTemplate("template_cart_actions");
  self.$table.find(".table-record-actions").append(actions);

  $.each(self.data, function(uri, recordData) {
    var $tr = $("tr[data-uri='" + uri + "']", self.$table);
    if ($tr.length) {
      $tr.find(".add-to-cart-btn").addClass("hide");
      $tr.find(".remove-from-cart-btn").removeClass("hide");
    }
  });

  self.$table.
    on("click", ".add-to-cart-btn", function(event) {
      var $tr = $(event.target).closest("tr");
      self.addToSelection($tr.data("uri"), $tr.data("display-string"), $tr.data("record-type"))
    }).
    on("click", ".remove-from-cart-btn", function(event) {
      var $tr = $(event.target).closest("tr");
      self.removeFromSelection($tr.data("uri"))
      $tr.find(".add-to-cart-btn").removeClass("hide");
      $tr.find(".remove-from-cart-btn").addClass("hide");
    });

};


$(function() {
  if (typeof CURRENT_REPO_URI == "undefined") {
    return;
  }

  new Cart(CURRENT_REPO_URI);
});


// Add API for storing to LocalStorage
AS.getData = function(key) {
  return $.jStorage.get(key);
};
AS.setData = function(key, mutator) {
  var data = AS.getData(key);
  var updated = mutator(data);

  $.jStorage.set(key, updated);

  return updated;
};


//var init_search_cart = function() {
//  var $table = $(this);
//  /*if (AS.QueryString.hasOwnProperty("deleted_uri")) {
//   $.each(AS.QueryString.deleted_uri, function(i, uri) {
//   removeFromSelection(uri);
//   });
//   }*/
//
//
//  $table.on("click", ".multiselect-column :input", function(event) {
//    var $this = $(event.target);
//    var $row = $this.closest("tr");
//
//    if ($row.hasClass("selected")) {
//      addToSelection($this.val(), $row.data("display-string"), $row.data("record-type"));
//    } else {
//      removeFromSelection($this.val());
//    }
//
//    updateSelectionSummary();
//
//    setTimeout(function() {
//      if ($.isEmptyObject(multiselectData[pageKey])) {
//        $table.trigger("multiselectempty.aspace");
//      }
//    });
//  });
//
//  $(".multiselect-enabled").each(function() {
//    var $multiselectAffectedWidget = $(this);
//    if ($table.is($multiselectAffectedWidget.data("multiselect"))) {
//      $table.on("multiselectselected.aspace", function() {
//        $multiselectAffectedWidget.removeAttr("disabled");
//        var selected_records = [];
//        $.each(multiselectData[pageKey], function(uri) {
//          selected_records.push(uri);
//        });
//        $multiselectAffectedWidget.data("form-data", {
//          record_uris: selected_records
//        });
//      }).on("multiselectempty.aspace", function() {
//        $multiselectAffectedWidget.attr("disabled", "disabled");
//        $multiselectAffectedWidget.data("form-data", {});
//      });
//    }
//  });
//
//  $("button.multiselect-enabled").on("confirmed.aspace", function() {
//    clearSelection();
//  });
//  /*$(".search-filters #component_switch_link, .search-filters a").on("click", function() {
//   clearSelection();
//   });
//   $(".search-filters form").on("submit", function() {
//   clearSelection();
//   });*/
//
//
//  if ($.isEmptyObject(multiselectData[pageKey])) {
//    $table.trigger("multiselectempty.aspace");
//  } else {
//    $.each(multiselectData[pageKey], function(uri, recordData) {
//      $(".multiselect-column :input[value='"+uri+"']").prop("checked", "checked");
//    });
//    $table.trigger("multiselectselected.aspace");
//  }
//
//  $(".multiselect-column :input:checked", $table).closest("tr").addClass("selected");
//};
//
//$(".table-search-results[data-multiselect]").each(init_search_cart);
//});