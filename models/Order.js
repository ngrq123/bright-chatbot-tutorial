const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Float = require('mongoose-float').loadType(mongoose);
var User = mongoose.model('User');
var Cart = mongoose.model('Cart');
var Product = mongoose.model('Product');

import { v4 as uuidv4 } from 'uuid';
import {getProductByID} from './Product';

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    trackingNumber: { type: String, unique: true },
    orderStatus: {
        type: String,
        enum : ['Order Received','Packing','Out For Delivery','Delivered','Refund'],
        default: 'Order Received'
    },
    products : [{
        title:String,
        price:Float,
        image_link:String,
        pattern:String,
        quantity:Float
    }]
}, { timestamps: true });

orderSchema.plugin(uniqueValidator, { message: 'is already exist.' });

const Order = mongoose.model('Order', orderSchema);

// Pass in user and cart object
async function createOrder(user){
    const trackingNum = uuidv4();
    let cart = await Cart.findOne({uid:user.cartId}).then((cart) => cart).catch((err) => null);
    
    if (cart==null){
        return null;
    }
    
    let productItems = [];
    for (var i = 0; i < cart.items.length; i++){
        let pId = cart.items[i].pid;
        let product = await getProductByID(pId);
        productItems.push({
            title:product.title,
            price:product.price,
            image_link:product.image_link,
            pattern:product.pattern,
            quantity:cart.items[i].quantity
        });
    }
    
    var newOrder = new Order({
        customer: user,
        trackingNumber: trackingNum,
        products: productItems
    })
    
    let setOrder = await newOrder.save().then((doc) => doc).catch((err) => {console.log(err); null});
    
    return setOrder;
}

async function getAllOrders(user){
    
    let getOrders = await Order.find({customer: user}).then((order) => order).catch((err) => null);
    
    return getOrders;

}

async function getOrder(user,trackingNumber){
    let getOrder = await Order.findOne({customer: user, trackingNumber: trackingNumber}).then((order) => order).catch((err) => null);
    
    return getOrder;
}

export{ createOrder, getAllOrders, getOrder};