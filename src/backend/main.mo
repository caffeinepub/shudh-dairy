import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Float;
    category : Text;
    weight : Text;
    inStock : Bool;
    image : Storage.ExternalBlob;
  };

  type OrderItem = {
    productId : Nat;
    productName : Text;
    productWeight : Text;
    quantity : Nat;
    price : Float;
  };

  type Order = {
    id : Nat;
    customerName : Text;
    customerPhone : Text;
    customerAddress : Text;
    items : [OrderItem];
    total : Float;
    status : Text;
    timestamp : Int;
  };

  type FounderInfo = {
    name : Text;
    title : Text;
    bio : Text;
    foundedYear : Text;
    photoUrl : Text;
  };

  type Review = {
    id : Nat;
    customerName : Text;
    rating : Nat;
    comment : Text;
    timestamp : Int;
    helpful : Nat;
  };

  let adminUsername = "admin";
  stable var adminPassword : Text = "sunrise2024";
  stable var nextProductId : Nat = 1;
  stable var nextOrderId : Nat = 1001;
  stable var nextReviewId : Nat = 1;
  stable var upiQrImage : Text = "";

  stable var products = Map.empty<Nat, Product>();
  stable var orders = Map.empty<Nat, Order>();
  stable var reviews = Map.empty<Nat, Review>();

  stable var founderInfo : FounderInfo = {
    name = "Founder";
    title = "Founder & Managing Director";
    bio = "Started SUNRISE MILK AND AGRO PRODUCT'S with a simple vision — to bring pure, farm-fresh dairy products directly to families in Udaipur. Every product is made with care, tradition, and love for quality.";
    foundedYear = "2018";
    photoUrl = "";
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    orders.values().toArray();
  };

  public query ({ caller }) func adminLogin(username : Text, password : Text) : async Bool {
    Text.equal(username, adminUsername) and Text.equal(password, adminPassword);
  };

  public shared ({ caller }) func changeAdminPassword(_sessionToken : Text, oldPassword : Text, newPassword : Text) : async Bool {
    if (Text.equal(oldPassword, adminPassword)) {
      adminPassword := newPassword;
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func addProduct(_sessionToken : Text, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool, image : Storage.ExternalBlob) : async () {
    let newProduct : Product = {
      id = nextProductId;
      name;
      description;
      price;
      category;
      weight;
      inStock;
      image;
    };

    products.add(nextProductId, newProduct);
    nextProductId += 1;
  };

  public shared ({ caller }) func updateProduct(_sessionToken : Text, id : Nat, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool, image : Storage.ExternalBlob) : async Bool {
    switch (products.get(id)) {
      case (?_product) {
        let updatedProduct : Product = {
          id;
          name;
          description;
          price;
          category;
          weight;
          inStock;
          image;
        };
        products.add(id, updatedProduct);
        true;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func deleteProduct(_sessionToken : Text, id : Nat) : async Bool {
    switch (products.get(id)) {
      case (?_) {
        products.remove(id);
        true;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func placeOrder(customerName : Text, customerPhone : Text, customerAddress : Text, items : [OrderItem], total : Float) : async Nat {
    let newOrder : Order = {
      id = nextOrderId;
      customerName;
      customerPhone;
      customerAddress;
      items;
      total;
      status = "Pending";
      timestamp = Time.now();
    };

    orders.add(nextOrderId, newOrder);
    nextOrderId += 1;
    newOrder.id;
  };

  public query ({ caller }) func getOrdersByPhone(phone : Text) : async [Order] {
    let ordersArray = orders.values().toArray();
    let matchingOrders = ordersArray.filter(
      func(order) {
        order.customerPhone == phone;
      }
    );
    matchingOrders;
  };

  public shared ({ caller }) func updateOrderStatus(_sessionToken : Text, orderId : Nat, status : Text) : async Bool {
    switch (orders.get(orderId)) {
      case (?order) {
        let updatedOrder : Order = {
          order with status;
        };
        orders.add(orderId, updatedOrder);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getFounderInfo() : async FounderInfo {
    founderInfo;
  };

  public shared ({ caller }) func updateFounderInfo(_sessionToken : Text, name : Text, title : Text, bio : Text, foundedYear : Text, photoUrl : Text) : async Bool {
    founderInfo := {
      name;
      title;
      bio;
      foundedYear;
      photoUrl;
    };
    true;
  };

  public shared ({ caller }) func addReview(customerName : Text, rating : Nat, comment : Text) : async Nat {
    let newReview : Review = {
      id = nextReviewId;
      customerName;
      rating;
      comment;
      timestamp = Time.now();
      helpful = 0;
    };

    reviews.add(nextReviewId, newReview);
    nextReviewId += 1;
    newReview.id;
  };

  public query ({ caller }) func getAllReviews() : async [Review] {
    reviews.values().toArray();
  };

  public shared ({ caller }) func deleteReview(_sessionToken : Text, id : Nat) : async Bool {
    switch (reviews.get(id)) {
      case (?_) {
        reviews.remove(id);
        true;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func markReviewHelpful(id : Nat) : async Bool {
    switch (reviews.get(id)) {
      case (?review) {
        let updatedReview : Review = {
          review with helpful = review.helpful + 1;
        };
        reviews.add(id, updatedReview);
        true;
      };
      case (null) { false };
    };
  };

  // ── UPI QR Code ────────────────────────────────────────────────────────────

  public query ({ caller }) func getUpiQrImage() : async Text {
    upiQrImage;
  };

  public shared ({ caller }) func setUpiQrImage(_sessionToken : Text, imageDataUrl : Text) : async Bool {
    upiQrImage := imageDataUrl;
    true;
  };
};
