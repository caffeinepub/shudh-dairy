import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
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

  let adminUsername = "admin";
  let adminPassword = "sunrise2024";

  var products = List.empty<Product>();
  var orders = List.empty<Order>();

  stable var stableProducts : [Product] = [];
  stable var stableOrders : [Order] = [];
  stable var stableNextProductId : Nat = 1;
  stable var stableNextOrderId : Nat = 1001;

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.toArray();
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    orders.toArray();
  };

  public query ({ caller }) func adminLogin(username : Text, password : Text) : async Bool {
    Text.equal(username, adminUsername) and Text.equal(password, adminPassword);
  };

  public shared ({ caller }) func addProduct(_sessionToken : Text, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool, image : Storage.ExternalBlob) : async () {
    let newProduct : Product = {
      id = stableNextProductId;
      name;
      description;
      price;
      category;
      weight;
      inStock;
      image;
    };

    products.add(newProduct);
    stableNextProductId += 1;
    stableProducts := products.toArray();
  };

  public shared ({ caller }) func updateProduct(_sessionToken : Text, id : Nat, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool, image : Storage.ExternalBlob) : async Bool {
    var updatedProducts = List.empty<Product>();
    var foundProduct = false;

    for (product in products.values()) {
      if (product.id == id) {
        foundProduct := true;
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
        updatedProducts.add(updatedProduct);
      } else {
        updatedProducts.add(product);
      };
    };

    if (foundProduct) {
      products.clear();
      products.addAll(updatedProducts.values());
      stableProducts := products.toArray();
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func deleteProduct(_sessionToken : Text, id : Nat) : async Bool {
    var filteredProducts = List.empty<Product>();
    var foundProduct = false;

    for (product in products.values()) {
      if (product.id != id) {
        filteredProducts.add(product);
      } else {
        foundProduct := true;
      };
    };

    if (foundProduct) {
      products.clear();
      products.addAll(filteredProducts.values());
      stableProducts := products.toArray();
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func placeOrder(customerName : Text, customerPhone : Text, customerAddress : Text, items : [OrderItem], total : Float) : async Nat {
    let newOrder : Order = {
      id = stableNextOrderId;
      customerName;
      customerPhone;
      customerAddress;
      items;
      total;
      status = "Pending";
      timestamp = Time.now();
    };

    orders.add(newOrder);
    stableNextOrderId += 1;
    stableOrders := orders.toArray();
    newOrder.id;
  };

  public query ({ caller }) func getOrdersByPhone(phone : Text) : async [Order] {
    let ordersArray = orders.toArray();
    let matchingOrders = ordersArray.filter(
      func(order) {
        Text.equal(order.customerPhone, phone);
      }
    );
    matchingOrders;
  };

  public shared ({ caller }) func updateOrderStatus(_sessionToken : Text, orderId : Nat, status : Text) : async Bool {
    var updatedOrders = List.empty<Order>();
    var foundOrder = false;

    for (order in orders.values()) {
      if (order.id == orderId) {
        foundOrder := true;
        let updatedOrder : Order = {
          order with status;
        };
        updatedOrders.add(updatedOrder);
      } else {
        updatedOrders.add(order);
      };
    };

    if (foundOrder) {
      orders.clear();
      orders.addAll(updatedOrders.values());
      stableOrders := orders.toArray();
      true;
    } else {
      false;
    };
  };
};
