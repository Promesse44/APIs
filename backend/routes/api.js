const express = require('express');
const router = express.Router();


// Updated /search endpoint to return the expected search hotel result
router.get('/search', (req, res) => {
    const sampleResponse = {
        "primary_count": 420,
        "count": 420,
        "room_distribution": [{"children": [5, 0], "adults": "2"}],
        "map_bounding_box": {
            "sw_long": 14.2691427469254,
            "ne_long": 14.6035552024841,
            "ne_lat": 50.1492922727814,
            "sw_lat": 49.9970216
        },
        "total_count_with_filters": 420,
        "unfiltered_count": 3402,
        "extended_count": 0,
        "unfiltered_primary_count": 3402,
        "search_radius": 0.0,
        "sort": [
            {"name": "Distance from city centre", "id": "distance"},
            {"name": "Popularity", "id": "popularity"},
            {"id": "class_descending", "name": "Stars (5 to 0)"},
            {"name": "Stars (0 to 5)", "id": "class_ascending"},
            {"name": "Guest review score", "id": "bayesian_review_score"},
            {"id": "price", "name": "Price (low to high)"}
        ],
        "result": [
            {
                "is_mobile_deal": 1,
                "distance_to_cc_formatted": "1.3 km",
                "address_trans": "Masarykovo nabrezi",
                "hotel_name": "Boat Hotel Matylda",
                // ...other fields...
                "min_total_price": 147.5,
                "currency_code": "EUR"
            },
            {
                "is_genius_deal": 0,
                "review_score": 8.2,
                "hotel_id": 341174,
                "currency_code": "EUR",
                // ...other fields...
                "min_total_price": 64.0
            }
        ]
    };
    res.json(sampleResponse);
});

router.get('/hotel/:hotelId', (req, res) => {
    // Return a stub hotel details response
    res.json({
        name: "Demo Hotel",
        address: { lines: ["123 Demo St"] },
        rating: "4.5",
        contact: { phone: "123-456-7890" },
        amenities: ["WiFi", "Pool", "Gym"]
    });
});

router.get('/rooms/:hotelId', (req, res) => {
    // Return a stub room list response
    res.json([{
        room: { type: "Standard Room", description: "A comfortable room" },
        price: { total: 200, currency: "USD", includes: "Breakfast" }
    }]);
});

router.post('/book', (req, res) => {
    // Return a stub booking confirmation response
    res.json({ message: "Booking confirmed (stub response)" });
});


// Helper to proxy Booking.com requests
async function proxyBookingRequest(rapidPath, req, res) {
    const baseUrl = `https://booking-com.p.rapidapi.com${rapidPath}`;
    const query = new URLSearchParams(req.query).toString();
    try {
        const response = await fetch(`${baseUrl}?${query}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'booking-com.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

router.get('/booking/hotel-details', (req, res) => {
    const https = require('https');
    const query = new URLSearchParams(req.query).toString();
    
    const options = {
        method: 'GET',
        hostname: 'booking-com.p.rapidapi.com',
        path: `/v2/hotels/details?${query}`,
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'booking-com.p.rapidapi.com'
        }
    };
    
    const request = https.request(options, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            try {
                const data = JSON.parse(body);
                res.json(data);
            } catch (err) {
                res.status(500).json({ error: 'Invalid JSON response', details: err.message });
            }
        });
    });
    
    request.on('error', error => {
        res.status(500).json({ error: error.message });
    });
    
    request.end();
});

router.get('/booking/room-list', async (req, res) => {
    // expects: adults_number_by_rooms, children_number_by_rooms, checkout_date,
    // checkin_date, units, currency, hotel_id, locale, children_ages
    await proxyBookingRequest('/v2/hotels/room-list', req, res);
});

router.get('/booking/meta-properties', async (req, res) => {
    await proxyBookingRequest('/v2/hotels/meta-properties', req, res);
});

router.get('/booking/description-full', async (req, res) => {
    // expects: locale, hotel_id
    await proxyBookingRequest('/v2/hotels/description-full', req, res);
});

router.get('/booking/search-filters', async (req, res) => {
    await proxyBookingRequest('/v2/hotels/search-filters', req, res);
});

router.get('/booking/search', (req, res) => {
    const https = require('https');
    const query = new URLSearchParams(req.query).toString();
    const options = {
        method: 'GET',
        hostname: 'booking-com.p.rapidapi.com',
        path: `/v1/hotels/search?${query}`,
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'booking-com.p.rapidapi.com'
        }
    };
    const request = https.request(options, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            try {
                const data = JSON.parse(body);
                res.json(data);
            } catch (err) {
                res.status(500).json({ error: 'Invalid JSON response', details: err.message });
            }
        });
    });
    request.on('error', error => {
        res.status(500).json({ error: error.message });
    });
    request.end();
});

router.get('/booking/search-by-coordinates', async (req, res) => {
    await proxyBookingRequest('/v2/hotels/search-by-coordinates', req, res);
});

router.get('/booking/description', async (req, res) => {
    // expects: locale, hotel_id
    await proxyBookingRequest('/v2/hotels/description', req, res);
});

module.exports = router;
