require('dotenv').config(); 
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const items = [
    { name: 'Stuffed Animal Shark', imageUrl: 'https://www.ikea.com/nl/nl/images/products/blahaj-pluchen-speelgoed-baby-haai__0716615_pe730956_s5.jpg?f=xl', price: 7.25, quantity: 1},
    { name: 'Stuffed Animal Bear', imageUrl: 'https://www.ikea.com/nl/nl/images/products/djungelskog-pluchen-speelgoed-bruin-beer__1133990_pe878622_s5.jpg?f=xl', price: 6.49, quantity: 1 }
];

app.get('/', (req, res) => {
    res.render('index', { items }); 
});

app.post('/checkout', async (req, res) => {
    try {
        const { name, price, quantity } = req.body;

        if (!name || !price || !quantity || isNaN(quantity) || quantity < 1) {
            return res.status(400).send('Invalid item details or quantity.');
        }

        const lineItems = [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: name,
                    },
                    unit_amount: Math.round(parseFloat(price) * 100), 
                },
                quantity: parseInt(quantity, 10),
            }
        ];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['ideal', 'card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: 'http://localhost:3000/complete',
            cancel_url: 'http://localhost:3000/cancel',
        });

        res.redirect(303, session.url);
    } catch (error) {
        console.error('Error creating checkout session:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/complete', (req, res) => {
    res.send('<h1>Payment Complete! Thank you for your purchase.</h1>');
});

app.get('/cancel', (req, res) => {
    res.send('<h1>Payment Cancelled. Please try again later.</h1>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
