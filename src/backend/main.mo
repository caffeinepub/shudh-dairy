import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";



actor {
  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Float;
    category : Text;
    weight : Text;
    inStock : Bool;
  };

  let adminUsername = "admin";
  let adminPassword = "sunrise2024";

  var products = [
    {
      id = 1;
      name = "Ghee";
      description = "Pure cow ghee, rich in flavor and nutrients";
      price = 15.99;
      category = "Dairy";
      weight = "500g";
      inStock = true;
    },
    {
      id = 2;
      name = "Paneer";
      description = "Fresh homemade paneer, soft and delicious";
      price = 9.99;
      category = "Dairy";
      weight = "250g";
      inStock = true;
    },
  ];

  public query ({ caller }) func getAllProducts() : async [Product] {
    products;
  };

  public query ({ caller }) func adminLogin(username : Text, password : Text) : async Bool {
    Text.equal(username, adminUsername) and Text.equal(password, adminPassword);
  };

  public shared ({ caller }) func addProduct(_sessionToken : Text, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool) : async () {
    let newId = products.size() + 1;
    let newProduct : Product = {
      id = newId;
      name;
      description;
      price;
      category;
      weight;
      inStock;
    };

    products := products.concat([newProduct]);
  };

  public shared ({ caller }) func updateProduct(_sessionToken : Text, id : Nat, name : Text, description : Text, price : Float, category : Text, weight : Text, inStock : Bool) : async Bool {
    let updatedProducts = products.map(
      func(product) {
        if (product.id == id) {
          {
            id;
            name;
            description;
            price;
            category;
            weight;
            inStock;
          };
        } else { product };
      }
    );
    let existed = products.find(func(product) { product.id == id });
    products := updatedProducts;
    switch (existed) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared ({ caller }) func deleteProduct(_sessionToken : Text, id : Nat) : async Bool {
    let filteredProducts = products.filter(
      func(product) {
        product.id != id;
      }
    );
    let existed = products.find(func(product) { product.id == id });
    products := filteredProducts;
    switch (existed) {
      case (null) { false };
      case (?_) { true };
    };
  };
};
