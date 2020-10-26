const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    cartId: { type: String }
});

const User = mongoose.model('User',userSchema);

// Create user if user not found in database
function createUser(fbid,name){
    var newUser = new User({
        id:fbid,
        name:name
    });
    return newUser.save()
        .then(doc => doc)
        .catch(err => null);
}

function checkUser(fbid){
    return User.findOne({'id':fbid})
        .then(function (user) { return user; })
        .catch(function (err) { return null });
}

export { checkUser, createUser };