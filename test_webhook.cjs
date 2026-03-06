const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
console.log('Using secret:', PAYSTACK_WEBHOOK_SECRET ? 'Found' : 'Missing');

const payload = {
    event: 'charge.success',
    data: {
        reference: `test_${Date.now()}`,
        amount: 3000000,
        customer: {
            email: process.env.FROM_EMAIL ? process.env.FROM_EMAIL.match(/<([^>]+)>/)?.[1] || process.env.FROM_EMAIL : 'test@example.com'
        },
        metadata: {
            genre: 'Acoustic Pop',
            mood: 'Happy',
            tempo: 120,
            customerEmail: process.env.FROM_EMAIL ? process.env.FROM_EMAIL.match(/<([^>]+)>/)?.[1] || process.env.FROM_EMAIL : 'test@example.com'
        }
    }
};

const body = JSON.stringify(payload);
const hash = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET).update(body).digest('hex');

console.log('Sending mock webhook...');

fetch('http://localhost:3001/api/paystack/webhook', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': hash
    },
    body: body
})
    .then(async res => {
        console.log('Status code:', res.status);
        try {
            const text = await res.text();
            console.log('Response body:', text);
        } catch (e) {
            console.log('Response body empty');
        }
    })
    .catch(err => console.error('Fetch error:', err));
