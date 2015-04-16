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
      "full");

    $modal.find(".modal-footer").replaceWith(AS.renderTemplate("template_cart_dialog_footer"));

    self.bindSummaryEvents($modal);
  });

  self.$cart.on("click", "#cartSummaryDropdownBtn", function(event) {
    $("#cartSummaryDropdownPanel").find(".cart-summary").html(AS.renderTemplate("template_cart_dialog_contents", {
      selected: self.data
    }));

    if ($.isEmptyObject(self.data)) {
      $("#cartSummaryDropdownPanel").find("button").addClass("disabled").attr("disabed", "disabled");
    } else {
      $("#cartSummaryDropdownPanel").find("button").removeClass("disabled").removeAttr("disabed");
    }
  });

  self.$cart.on("click", ".cart-summary button", function(event) {
    event.preventDefault();
    event.stopPropagation();
  });
};


Cart.prototype.bindSummaryEvents = function($container) {
  var self = this;

  $container.
    on("click", ".expand-context-btn", function(event) {
      var $btn = $(event.target).closest(".btn");
      var $tr = $btn.closest("tr");
      var $context = $tr.find(".extra-context");

      if ($btn.data("loaded")) {
        $context.slideToggle();
        $btn.toggleClass("active");
        return;
      }

      $btn.attr("disabled", "disabled").addClass("disabled");

      $.ajax({
        url: "/plugins/search_cart/context",
        type: "get",
        data: {
          uri: $tr.data("uri")
        },
        success: function(data) {
          $tr.find(".extra-context").html(data).slideDown();

          $btn.removeAttr("disabled").removeClass("disabled");

          $btn.data("loaded", true).addClass("active");

          $(window).trigger("resize");
        }
      });
    }).
    on("click", ".clear-cart-btn", function(event) {
      self.clearSelection();
    }).
    on("click", ".remove-from-cart-btn", function(event) {
      event.stopPropagation();

      var $tr = $(event.target).closest("tr");
      self.removeFromSelection(($tr.data("uri")));
      $tr.remove();
    });
}


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

  AS.Cart = new Cart(CURRENT_REPO_URI);
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
