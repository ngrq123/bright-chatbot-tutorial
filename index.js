'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  dotenv = require('dotenv'),
  request = require('request');

dotenv.config();
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Sets server port and logs message on success
const listener = app.listen(process.env.PORT || 1337, () => console.log('webhook is listening on port ' + listener.address().port));

/*
  Mock data in database (remove if database is implemented)
*/
let products = [
  {
    pid: 123,
    title: 'Chocolate Chip Cookies',
    pattern: 'Box of 6',
    price: 15.5,
    image_link: 'https://raw.githubusercontent.com/ngrq123/bright-chatbot-tutorial/main/images/chocolate_chip_cookies.jpg'
  },
  {
    pid: 456,
    title: 'Earl Grey Sunflower Seeds Cookies',
    pattern: 'Box of 9',
    price: 18.5,
    image_link: 'https://raw.githubusercontent.com/ngrq123/bright-chatbot-tutorial/main/images/earl_grey_sunflower_seeds_cookies.jpg'
  }
]

let cart = [
  {
    pid: 123,
    title: 'Chocolate Chip Cookies',
    pattern: 'Box of 6',
    price: 15.5,
    quantity: 1,
    image_link: 'https://raw.githubusercontent.com/ngrq123/bright-chatbot-tutorial/main/images/chocolate_chip_cookies.jpg'
  },
  {
    pid: 456,
    title: 'Earl Grey Sunflower Seeds Cookies',
    pattern: 'Box of 9',
    price: 18.5,
    quantity: 2,
    image_link: 'https://raw.githubusercontent.com/ngrq123/bright-chatbot-tutorial/main/images/earl_grey_sunflower_seeds_cookies.jpg'
  }
]

let order = [
  {
    pid: 123,
    title: 'Chocolate Chip Cookies',
    pattern: 'Box of 6',
    price: 15.5,
    quantity: 1,
    image_link: 'https://raw.githubusercontent.com/ngrq123/bright-chatbot-tutorial/main/images/chocolate_chip_cookies.jpg'
  },
  {
    pid: 456,
    title: 'Earl Grey Sunflower Seeds Cookies',
    pattern: 'Box of 9',
    price: 18.5,
    quantity: 2,
    image_link: 'https://raw.githubusercontent.com/ngrq123/bright-chatbot-tutorial/main/images/earl_grey_sunflower_seeds_cookies.jpg'
  }
]
/*
  End of mock data in database (remove if database is implemented)
*/

app.get('/', (req, res) => {
  res.status(200).send('You are connected to the chatbot application.');
})

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
      
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
  
  let body = req.body;
  
  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      
      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      let sender_psid = webhook_event['sender']['id'];

      let response = getDefaultResponse();
      if (webhook_event['message']) {
        let message = webhook_event['message']['text'];
        console.log('Message received from sender ' + sender_psid + ' : ' + message);
        
        if (webhook_event['message']['quick_reply']) {
          let payload = webhook_event['message']['quick_reply']['payload'];
          response = processPayload(payload);
        } else {
          let nlp = webhook_event['message']['nlp'];
          response = processMessage(message, nlp);
        }
      } else if (webhook_event['postback']) {
        let payload = webhook_event['postback']['payload'];
        response = processPayload(payload);
      }
      
      callSendAPI(sender_psid, response);
    });
    
    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
  
});

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {

  // Construct the message body
  let request_body = {
      messaging_type: 'RESPONSE',
      recipient: {
          id: sender_psid
      },
      message: response
  };

  // console.log(request_body);

  // Send the HTTP request to the Messenger Platform
  request(
      {
        uri: "https://graph.facebook.com/v8.0/me/messages",
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: "POST",
        json: request_body
      },
      (err, res, body) => {
          if (!err) {
              console.log("Message sent!");
          } else {
              console.error("Unable to send message: " + err);
          }
      }
  );
}

// Wrapper method to convert text message string to response object, and sends the message
function getResponseFromMessage(message) {
  const response = {
      text: message
  };

  return response;
}

function getDefaultResponse() {
  return getResponseFromMessage("We could not understand your message. Kindly rephrase your message and send us again.");
}

// Processes and sends text message
function processMessage(message, nlp) {
  
  if (nlp['intents'].length === 0) {
    
    // Check if greeting
    let traits = nlp['traits'];

    if (traits['wit$greetings'] && traits['wit$greetings'][0]['value'] === 'true') {
      console.log('Is greeting');
      return getResponseFromMessage('Hi there! Welcome to Bright. How can I help you?');
    }
    
    console.log('Returning default response');
    return getDefaultResponse();
  }

  console.log('Intents inferred from NLP model: ')
  console.table(nlp['intents']);

  // Get the intent with the highest confidence
  let intent = nlp['intents'][0]['name']
  let confidence = nlp['intents'][0]['confidence']

  // If confidence of intent is less than threshold, do not process
  if (confidence < 0.7) return getDefaultResponse();

  switch (intent) {
    case 'enquiry_general':
      let entities = nlp['entities'];

      // Get entity with highest confidence
      let entity = null;
      let highest_confidence = 0;
      for (const e in entities) {
        let confidence = entities[e][0]['confidence'];
        if (confidence > highest_confidence) {
          highest_confidence = confidence;
          entity = entities[e][0]['name'];
        }
      }

      console.log('Entity with highest confidence: ' + entity);

      return handleGeneralEnquiry(entity);
    case 'enquiry_delivery':
      return handleDeliveryEnquiry();
    case 'recommendation':
      // For Option 1 only: Get products from database and assign it to a variable named "products"

      return generateCarouselOfProductsResponse(products);

    default:
      return getDefaultResponse();
  }

}

function handleGeneralEnquiry(entity) {

  if (entity == null) return getDefaultResponse();

  let responses = {
    organisation: "Bright is a social enterprise where we provide vocational training to adults with intellectual disabilities.\n\n" +
        "We started a range of social enterprise projects to provide alternative work engagement opportunities for our adult trainees. " + 
        "Some of the projects began as therapy programmes which encourage the development of fine motor skills; others provide a realistic vocational training environment.\n\n" +
        "All net revenue earned from the sale of our products and services go towards paying a monthly allowance for our clients' work, as well as their lunch expenses while undergoing training.",
    profit:
        "All net revenue earned from the sale of our products and services go towards paying a monthly allowance for our clients' work, as well as their lunch expenses while undergoing training.",
    manufacturer:
        "We support adults with intellectual disabilities. We started a range of social enterprise projects to provide alternative work engagement for our adult trainees.",
    products: "We sell craft and baker goods.\nLike our Facebook page http://fb.me/brightsocialsg to stay updated!",
    safety: "Our cookies are made by our clients in a clean and sanitised environment. The cookies are safe to consume before the expiry date that is printed on the packaging."
  };
  
  return getResponseFromMessage(responses[entity]);
}

function handleDeliveryEnquiry() {
  return getResponseFromMessage('We deliver islandwide. The average delivery time takes 5-7 days.');
}

function generateCarouselOfProductsResponse(products) {
  
  return {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements":
        products.map(p => {
          let subtitle = '$' + p['price'].toFixed(2);
          if (p['pattern']) {
            subtitle = '(' + p['pattern'] + ') ' + subtitle;
          }

          return {
            title: p['title'],
            subtitle: subtitle,
            image_url: p['image_link'],
            buttons: [
              {
                type: "postback",
                title: "Learn more",
                payload: `enquiry_product ${p['title']}`
              }, 
              {
                type: "postback",
                title: `Add to cart`,
                payload: `cart_add 1 ${p['pid']} ${p['title']}`
              }
            ]
          }
        })
      }
    }
  }

}

function processPayload(payload) {
  let payload_parts = payload.split(' ');
  // console.log(payload_parts);
  let intent = payload_parts.shift();
  
  switch(intent) {
    case 'cart_add':
      // Example of payload: cart_add 1 123 Earl Grey Sunflower Seeds Cookies
      let quantity = payload_parts.shift();
      let pid = payload_parts.shift();
      let product_name = payload_parts.join(' ');
      
      // For Option 1 only: Update cart in database

      return generateAddCartQuickRepliesResponse('Added ' + quantity + ' ' + product_name + ' to cart.');
    case 'recommendation':
      // For Option 1 only: Get products from database and assign it to a variable named "products"

      return generateCarouselOfProductsResponse(products);
    case 'cart_view':
      // For Option 1 only: Get cart from database and assign it to a variable named "cart"

      return generateCartResponse(cart);
    case 'checkout':
      // For Option 1 only: Get order from database and assign it to a variable named "order"

      // For Option 1 only: Add to order and delete cart from database

      return generateCheckoutResponse(order);
    case 'paid':
      // For Option 1 only: Get latest order from database and assign it to a variable named "order"

      return generateReceiptResponse(order);
    default:
      return getDefaultResponse();
  }

}

function generateAddCartQuickRepliesResponse(message) {
  return {
    "text": message,
    "quick_replies": [
      {
        "content_type": "text",
        "title": "Checkout",
        "payload": "checkout"
      },
      {
        "content_type": "text",
        "title": "View more products",
        "payload": "recommendation"
      }, {
        "content_type": "text",
        "title": 'View cart',
        "payload": "cart_view"
      }
    ]
  }

}

function generateCartResponse(cart) {

  return {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements":
        cart.map(p => {
          let subtitle = 'Qty: ' + p['quantity'] + ' ($' + p['price'].toFixed(2) + ' each)';
          if (p['pattern']) {
            subtitle = p['pattern'] + ', ' + subtitle;
          }

          return {
            title: p['title'],
            subtitle: subtitle,
            image_url: p['image_link'],
            buttons: [
              {
                type: "postback",
                title: "Add 1 to Cart",
                payload: `cart_add 1 ${p['pid']} ${p['title']}`
              }, 
              {
                type: "postback",
                title: `Remove All`,
                payload: `cart_remove_all ${p['pid']} ${p['title']}`
              }
            ]
          }
        })
      }
    }
  }

}

function generateCheckoutResponse(order) {
  let total_price = order.reduce((acc, p) => acc + p['price'] * p['quantity'], 0);

  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: `Your order (including shipping) will be $${(total_price + 5).toFixed(2)}.\n\nYou will be contributing to ${Math.ceil(total_price / 5)} meals for our beneficiaries.`,
        buttons: [
          {
            type: "postback",
            title: "Proceed to Pay",
            payload: "paid"
          }
        ]
      }
    }
  }

}

function generateReceiptResponse(order) {
  let total_price = order.reduce((acc, p) => acc + p['price'] * p['quantity'], 0);

  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "receipt",
        recipient_name: "John Doe",
        order_number: "bf23ad46d123",
        currency: "SGD",
        payment_method: "PayPal",
        order_url: "",
        address: {
          street_1: "9 Straits View",
          city: "Singapore",
          postal_code: "018937",
          state: "SG",
          country: "SG"
        },
        summary: {
          subtotal: total_price.toFixed(2),
          shipping_cost: 5,
          total_tax: ((total_price+5)*0.07).toFixed(2),
          total_cost: (total_price+5).toFixed(2)
        },
        elements: order.map(product => {
          return {
            title: `${product["name"]}`,
            title: product["title"],
            subtitle: product["pattern"],
            quantity: product["quantity"],
            price: product["price"]*product["quantity"],
            currency: "SGD",
            image_url: product["image_link"]
          };
        })
      }
    }
  };
}