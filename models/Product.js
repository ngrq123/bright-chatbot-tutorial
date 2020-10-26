const mongoose = require('mongoose');
var Float = require('mongoose-float').loadType(mongoose);

const productsSchema = new mongoose.Schema({
    pid: String,
    pid: String,
    title: String,
    description: String,
    availability: String,
    inventory: String,
    condition: String,
    price: Float,
    link: String,
    image_link: String,
    brand: String,
    item_group_id: String,
    color: String,
    pattern: String,
    product_type: String,
    allergens: [String],
    ingredients: [String],
    weight: String,
    flavor: String,
    color: String,
    quantity: Float
});

const Product = mongoose.model('Product',productsSchema);


//Get all products
function getAllProducts(){
    return Product.find({}).then(function(products){
        return products;
    }).catch(function(err){
        console.log(err);
        return [];
    });
}

//Get product by type
function getProductsByType(typeValue){
    return Product.find({'product_type':typeValue}).then(function(products){
        return products;
    }).catch(function(err){
        console.log(err);
        return [];
    });
}

//Get product by ID
function getProductByID(pid){
    return Product.findOne({'pid':pid}).then(function(prod){
        return prod;
    }).catch(function(err){
       console.log(err);
       return null;
    });
}

// Get product Price by ID
function getProductPrice(pid){
    return Product.findOne({'pid':pid}).then(function(prod){
        return prod.price;
    }).catch(function(err){
        console.log(err);
        return null;
    });
}

// get product Desc by ID
function getProductDesc(pid){
    return Product.findOne({'pid':pid}).then(function(prod){
        return prod.description;
    }).catch(function(err){
        console.log(err);
        return null;
    });
}

// get products with all the differnt variations by Name
function getProductsByName(name){
    return Product.find({'title':name}).then(function(prod){
        return prod;
    }).catch(function(err){
        console.log(err);
        return null;
    });
}

// get product by name and variation
function getProductByNameVar(name,variation){
    return Product.findOne({'title':name,'pattern':variation}).then(function(prod){
        return prod;
    }).catch(function(err){
        console.log(err);
        return null;
    });
}

//get products by allergens
function getProductsByAllergens(allergen){
    return Product.find({allergens:allergen}).then(function(products){
        return products;
    }).catch(function(err){
        console.log(err);
        return [];
    });
}

//get products by _id
function getProductsByDefaultId(defId){
    return Product.findOne({_id:defId}).then(function(product){
        return product;
    }).catch(function(err){
        console.log(err);
        return [];
    });
}

export { getAllProducts, getProductsByType, getProductByID, getProductPrice, getProductDesc, getProductsByName, getProductByNameVar, getProductsByAllergens, getProductsByDefaultId };