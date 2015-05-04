function Cart(key) {
  this.key = key;
  this.$cart = this.createCartWidget();

  this.STORAGE_KEY = "component_report"

  var allData = AS.getData(this.STORAGE_KEY) || {};
  this.data = allData[key] || {};

  // only allow these types to be added to the cart
  this.SUPPORTED_JSONMODEL_TYPES = ['resource', 'archival_object'];

  this.setupCartEvents();
  this.updateSelectionSummary();
  this.setupSearchResultsActions();
  this.setupTreePageActions();
};

Cart.prototype.createCartWidget = function() {
  var $cart = $(AS.renderTemplate("template_cart_toolbar_action"));

  $(".repository-header .navbar-nav .repo-container").before($cart);

  return $cart;
};


Cart.prototype.loadCart = function($container) {
  var self = this;

  var load_url = $container.data("load-url");

  $.post(load_url, {uri: self.data}, function(html) {
    $container.html(html);

    self.bindSummaryEvents($container);
  });

  $container.on("click", ".clear-cart-btn", function() {
    self.clearSelection();
  });
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

    if ($modal.has("#cartCheckoutPane")) {
      self.loadCart($("#cartCheckoutPane", $modal));
    }

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

  self.$cart.on("click", ".clear-cart-btn", function() {
    self.clearSelection();
    location.reload();
  });
};


Cart.prototype.bindSummaryEvents = function($container) {
  var self = this;

  $container.
    on("click", ".clear-cart-btn", function(event) {
      self.clearSelection();
      location.reload();
    }).
    on("click", ".remove-from-cart-btn", function(event) {
      event.stopPropagation();

      var $btn = $(event.target).closest(".btn");
      var $tr = $btn.closest("tr");
      self.removeFromSelection($btn.data("uri"));
      $tr.remove();
    });
}


Cart.prototype.clearSelection = function() {
  var self = this;

  self.data = AS.setData(self.STORAGE_KEY, function(data) {
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

  self.data = AS.setData(self.STORAGE_KEY, function(data) {
    if (data == null) {
      data = {};
    }
    if (!data.hasOwnProperty(self.key)) {
      data[self.key] = [];
    }

    if ($.inArray(uri, data[self.key]) >= 0) {
      data[self.key].splice($.inArray(uri, data[self.key]), 1);
    }

    return data;
  })[self.key] || [];

  if (self.$table && self.$table.length) {
    var $tr = self.$table.find("[data-uri='"+uri+"']");
    $tr.find(".add-to-cart-btn").removeClass("hide");
    $tr.find(".remove-from-cart-btn").addClass("hide");
  }

  self.updateSelectionSummary();
};


Cart.prototype.addToSelection = function(uri, record_type) {
  var self = this;

  if ($.inArray(record_type, self.SUPPORTED_JSONMODEL_TYPES) < 0) {
    return;
  }

  self.data = AS.setData(self.STORAGE_KEY, function(data) {
    if (data == null) {
      data = {};
    }

    if (!data.hasOwnProperty(self.key)) {
      data[self.key] = [];
    }

    if ($.inArray(uri, data[self.key]) < 0) {
      data[self.key].push(uri);
    }

    return data;
  })[self.key];

  self.updateSelectionSummary();
};


Cart.prototype.setupSearchResultsActions = function() {
  var self = this;

  self.$table = $(".table-search-results");
  var actions = AS.renderTemplate("template_cart_actions");

  self.$table.find("tr[data-uri]").each(function() {
    var $tr = $(this);
    if ($.inArray($tr.data("record-type"), self.SUPPORTED_JSONMODEL_TYPES) >= 0) {
      $tr.find(".table-record-actions").append(actions);

      if (self.isSelected($tr.data("uri"))) {
        $tr.find(".add-to-cart-btn").addClass("hide");
        $tr.find(".remove-from-cart-btn").removeClass("hide");
      }
    }
  });

  self.$table.
    on("click", ".add-to-cart-btn", function(event) {
      var $tr = $(event.target).closest("tr");
      self.addToSelection($tr.data("uri"), $tr.data("record-type"));
      $tr.find(".add-to-cart-btn").addClass("hide");
      $tr.find(".remove-from-cart-btn").removeClass("hide");
    }).
    on("click", ".remove-from-cart-btn", function(event) {
      var $tr = $(event.target).closest("tr");
      self.removeFromSelection($tr.data("uri"))
      $tr.find(".add-to-cart-btn").removeClass("hide");
      $tr.find(".remove-from-cart-btn").addClass("hide");
    });

};


Cart.prototype.isSelected = function(uri) {
  return $.inArray(uri, this.data || []) >= 0;
}


Cart.prototype.setupTreePageActions = function() {
  var self = this;
  var $tree = $("#archives_tree");
  if (!AS.hasOwnProperty("tree_data") || $tree.data("root-node-type") != "resource") {
    return;
  }

  function toggleCartActions(uri) {
    if (self.isSelected(uri)) {
      $toolbar.find(".add-to-cart-btn").addClass("hide");
      $toolbar.find(".remove-from-cart-btn").removeClass("hide");
    } else {
      $toolbar.find(".add-to-cart-btn").removeClass("hide");
      $toolbar.find(".remove-from-cart-btn").addClass("hide");
    }
  }

  function uriForNode($node) {
    if ($node.data("uri")) {
      return $node.data("uri");
    }
    // Some nodes don't store the uri...
    return CURRENT_REPO_URI + "/" + $node.attr("rel") + "s/" + $node.data("id");
  };

  function setupTreeToolbar(event) {
    var $node = $(".primary-selected", $tree);

    if ($node.hasClass("new")) {
      // nothing to do as item is new
      return;
    }

    var uri = uriForNode($node);

    var actions = AS.renderTemplate("template_cart_actions");
    $toolbar.find(".btn-toolbar").append(actions);

    toggleCartActions(uri);
  };

  $tree.on("after_open.jstree loaded.jstree", function(event) {
    setupTreeToolbar(event);
  });
  $(window).hashchange(function(event) {
    setupTreeToolbar(event);
  });

  var $toolbar = $("#archives_tree_toolbar");

  $toolbar.
    on("click", ".add-to-cart-btn", function(event) {
      var $node = $tree.find(".primary-selected");
      var uri = uriForNode($node);

      self.addToSelection(uri, $node.attr("rel"));
      toggleCartActions(uri);
    }).
    on("click", ".remove-from-cart-btn", function(event) {
      var $node = $tree.find(".primary-selected");
      var uri = uriForNode($node);

      self.removeFromSelection(uri)

      toggleCartActions(uri);
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
