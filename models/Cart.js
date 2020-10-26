const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Float = require('mongoose-float').loadType(mongoose);
var User = mongoose.model('User');
import { v4 as uuidv4 } from 'uuid';

const cartSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    // items: [{
        // pid: String,
        // title: String,
        // description: String,
        // condition: String,
        // price: Float,
        // quantity: Number,
        // brand: String,
        // item_group_id: String,
        // color: String,
        // pattern: String,
        // product_type: String,
        // allergens: String
    // }],
    items: [{
        pid: String,
        quantity: Float
        }]
    // totalPrice: { type: Float, required: true, default: 0.00 },
})

cartSchema.plugin(uniqueValidator, { message: 'is already taken.' });

const Cart = mongoose.model('Cart', cartSchema);

// Initial creation of a fresh cart with an item(s)
async function createCart(userId, pid, quantity) {
    // const totalPrice = price * quantity;
    const cartId = uuidv4();
    var newCart = new Cart({
        uid: cartId,
        items: [{
            pid: pid,
            quantity: quantity
        }]
        // totalPrice: totalPrice
    });

    // Add cart id to user document
    await User.findOne({id: userId})
        .then((user) => {
            if (!user) {
                console.log("User not found when creating cart.");
             }

            const query_param_userId = user._id;
            const user_cartId = newCart.uid;

            User.findByIdAndUpdate(query_param_userId, { "cartId": user_cartId },{ new: true })
                .then((result) => console.log("User document updated with cart id."))
                .catch((err) => console.log("User document failed to update cart id."))
        })
        .catch(err => console.log("Error in finding user during cart creation."));

    // Save cart document
    let setCart = await newCart.save()
        .then(doc => doc)
        .catch(err => {
            console.log("Error in saving cart");
            return null;
        });

    return setCart;
}

//Check for user active cart
async function checkCart(userId) {

    let getCartId = await User.findOne({id: userId})
        .then((user) => {
            if (!user) console.log('User doesnt exist!');

            const cartId = user.cartId;
            return cartId;
        });

    // Early return if cart id is not found
    if (!getCartId) return null;

    let getCart = await Cart.findOne({ uid: getCartId })
        .then((result) => result)
        .catch((err) => null);

    return getCart
}

async function addItemToCart(cartId, pid, quantity) {
    let itemData = {
        pid: pid,
        quantity: quantity
    };
    
    let userCart = await Cart.findOne({uid:cartId,'items.pid':pid}).then((cart) => cart).catch((err) =>  null)
    
    if (userCart==null){
        let addItem = await Cart.findOneAndUpdate(
            { uid: cartId },
            { $push: { items: itemData } },
            { new: true })
            .then((result) => result)
            .catch((err) => {
                console.error(err);
                return null;
            });

        return addItem
    }
    var cartItems = [];
    for (var i = 0; i < userCart.items.length; i++){
        let cartItem = userCart.items[i];
        if (cartItem.pid===pid){
            cartItem.quantity += quantity;
        }
        cartItems.push(cartItem);
    }
    userCart.items = cartItems;
    
    // Save cart document
    let setCart = await userCart.save()
        .then(doc => doc)
        .catch(err => {
            console.log("Error in saving cart");
            return null;
        });

    return setCart;

}

async function removeItemFromCart(cartId,pid){
    let userCart = await Cart.findOne({uid:cartId,'items.pid':pid}).then((cart) => cart).catch((err) =>  null)
    
    if (userCart == null){
        return userCart;
    }
    
    var cartItems = [];
    for (var i = 0; i < userCart.items.length; i++){
        let cartItem = userCart.items[i];
        if (cartItem.pid!==pid){
            cartItems.push(cartItem);
        }
    }
    userCart.items = cartItems;
    
    // Save cart document
    let setCart = await userCart.save()
        .then(doc => doc)
        .catch(err => {
            console.log("Error in saving cart");
            return null;
        });

    return setCart;
}

async function removeAllItemsFromCart(cartId){
    let deleteItemsFromCart = await Cart.findOneAndUpdate(
        { uid: cartId },
        { items: [] },
        { new: true }
    ).then((result) => { console.log(result); return result }).catch((err) => {console.error(err); return null;})
    
    return deleteItemsFromCart;
}

async function deleteCart(userId, cartId) {

    await User.findOne({id: userId}).then((user) => {
        if (!user) { return res.status(401).send('User doesnt exist!'); } 

        const query_param_userId = user._id;
        const user_cartId = "";

        User.findByIdAndUpdate(query_param_userId, { "cartId": user_cartId },{ new: true })
            .then((result) => { console.log(result); return result })
            .catch((err) => {console.error(err); return null;})
    });
    
    await Cart.findOneAndDelete({ uid: cartId })
        .then((result) => { console.log(result); return result })
        .catch((err) => {console.error(err); return null;});
}

export { createCart, checkCart, addItemToCart, removeItemFromCart, removeAllItemsFromCart, deleteCart };
