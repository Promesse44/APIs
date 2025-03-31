document.addEventListener('DOMContentLoaded', function() {
    // API Configuration
    const API_BASE_URL = 'http://localhost:4000'; // Match your backend port
    
    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const checkInDate = document.getElementById('checkInDate');
    const checkOutDate = document.getElementById('checkOutDate');
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('locationBtn');
    const sortBy = document.getElementById('sortBy');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    const hotelsList = document.getElementById('hotelsList');
    const hotelDetails = document.getElementById('hotelDetails');
    const backBtn = document.getElementById('backBtn');
    
    // Set default dates
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    checkInDate.valueAsDate = today;
    checkOutDate.valueAsDate = tomorrow;
    
    // Event Listeners
    searchBtn.addEventListener('click', searchHotels);
    locationBtn.addEventListener('click', useMyLocation);
    sortBy.addEventListener('change', sortHotels);
    priceRange.addEventListener('input', updatePriceFilter);
    backBtn.addEventListener('click', () => {
        hotelDetails.style.display = 'none';
        hotelsList.style.display = 'grid';
    });
    
    // Add live search functionality with debouncing
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        // Clear any previous timeout
        clearTimeout(searchTimeout);
        
        // Create search suggestions container if it doesn't exist
        if (!document.getElementById('searchSuggestions')) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.id = 'searchSuggestions';
            suggestionsDiv.className = 'search-suggestions';
            searchInput.parentNode.appendChild(suggestionsDiv);
        }
        
        const searchTerm = this.value.trim();
        
        // Only search if input has at least 3 characters
        if (searchTerm.length >= 3) {
            // Show loading indicator in search field
            searchInput.classList.add('searching');
            
            // Set timeout for debouncing (wait 500ms before searching)
            searchTimeout = setTimeout(() => {
                searchHotels();
            }, 500);
        } else {
            // Hide suggestions if input is too short
            searchInput.classList.remove('searching');
            const suggestions = document.getElementById('searchSuggestions');
            if (suggestions) {
                suggestions.style.display = 'none';
            }
        }
    });
    
    // Also trigger search on date changes for better UX
    checkInDate.addEventListener('change', () => {
        if (searchInput.value.trim().length >= 3) {
            searchHotels();
        }
    });
    
    checkOutDate.addEventListener('change', () => {
        if (searchInput.value.trim().length >= 3) {
            searchHotels();
        }
    });
    
    // Update price range display
    function updatePriceFilter() {
        priceValue.textContent = `$${priceRange.value}+`;
        if (currentHotels) {
            filterAndDisplayHotels();
        }
    }
    
    let currentHotels = null;
    
    // Add a city name to destination ID mapping
    const cityToDestId = {
        'prague': '-553173',
        'paris': '-1456928',
        'london': '-2601889', 
        'new york': '-72537',
        'tokyo': '-246227',
        'rome': '-126693',
        'amsterdam': '-2140479',
        'barcelona': '-372490',
        'dubai': '-782831',
        'vienna': '-1991597',
        // Add more cities as needed
    };

    // Search hotels by location - updated to use Booking.com search endpoint
    async function searchHotels() {
        const location = searchInput.value.trim().toLowerCase();
        
        // Don't search if input is too short
        if (location.length < 3) {
            return;
        }
        
        const checkIn = formatDate(checkInDate.valueAsDate);
        const checkOut = formatDate(checkOutDate.valueAsDate);
        
        // Get destination ID from mapping or use Prague as default
        let destId = '-553173'; // Prague as default
        
        if (location) {
            // Check if the location is in our mapping
            if (cityToDestId[location]) {
                destId = cityToDestId[location];
            } else {
                // Check if the input is already a numeric ID
                if (/^-?\d+$/.test(location)) {
                    destId = location;
                } else {
                    // If not found, show a message that we're using default
                    console.warn(`City "${location}" not found in mapping, using Prague as default`);
                    
                    // Use a non-modal notification instead of alert for better UX
                    showNotification(`Location "${location}" not found. Showing results for Prague instead.`);
                }
            }
        }
        
        // Build query parameters for Booking.com API
        const params = new URLSearchParams({
            checkin_date: checkIn,
            checkout_date: checkOut,
            dest_id: destId,
            dest_type: 'city',
            units: 'metric',
            room_number: '1',
            adults_number: '2',
            children_number: '2', 
            children_ages: '5,0',
            include_adjacency: 'true',
            order_by: 'popularity',
            page_number: '0',
            filter_by_currency: 'AED',
            locale: 'en-gb',
            categories_filter_ids: 'class::2,class::4,free_cancellation::1'
        });
        
        console.log("Making request to:", `${API_BASE_URL}/api/booking/search?${params}`);
        
        try {
            showLoading(true);
            // Remove searching class
            searchInput.classList.remove('searching');
            
            const response = await fetch(`${API_BASE_URL}/api/booking/search?${params}`);
            
            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Received data:", data);
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }
            
            // Store and display the hotels from Booking.com API
            currentHotels = data.result || [];
            displayBookingHotels(data);
        } catch (error) {
            console.error('Full error:', error);
            hotelsList.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        } finally {
            showLoading(false);
        }
    }
    
    // Show a temporary notification instead of alert
    function showNotification(message) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Add to page
        document.querySelector('.container').appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    // Display hotels from Booking.com API response
    function displayBookingHotels(data) {
        const hotels = data.result || [];
        
        if (!hotels || hotels.length === 0) {
            hotelsList.innerHTML = '<div class="no-results">No hotels found. Try a different search.</div>';
            return;
        }
        
        hotelsList.innerHTML = hotels.map(hotel => `
            <div class="hotel-card" data-id="${hotel.hotel_id || hotel.id}">
                <img src="${hotel.max_photo_url || hotel.main_photo_url || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${hotel.hotel_name}">
                <div class="hotel-card-content">
                    <h3>${hotel.hotel_name || 'Unknown Hotel'}</h3>
                    <p class="address">${hotel.address_trans || hotel.address || 'Address not available'}</p>
                    <p class="rating">${hotel.review_score || 'N/A'} ★</p>
                    <p class="price">${hotel.composite_price_breakdown?.all_inclusive_amount?.currency || '€'} ${hotel.min_total_price || 'N/A'}</p>
                    <button class="view-details">View Details</button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to view details buttons
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', function() {
                const hotelCard = this.closest('.hotel-card');
                const hotelId = hotelCard.dataset.id;
                viewBookingHotelDetails(hotelId); // Use Booking.com details endpoint
            });
        });
    }
    
    // Use geolocation to find nearby hotels
    function useMyLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                searchInput.value = 'Nearby';
                const checkIn = formatDate(checkInDate.valueAsDate);
                const checkOut = formatDate(checkOutDate.valueAsDate);
                
                try {
                    showLoading(true);
                    // Convert coordinates to city code (simplified for example)
                    const cityCode = await getCityCode(position.coords.latitude, position.coords.longitude);
                    const response = await fetch(`${API_BASE_URL}/api/search?city=${cityCode}&checkIn=${checkIn}&checkOut=${checkOut}&radius=5`);
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to fetch hotels');
                    }
                    
                    const data = await response.json();
                    currentHotels = data;
                    displayHotels(data);
                } catch (error) {
                    console.error('Location search error:', error);
                    hotelsList.innerHTML = `<div class="error">Error: ${error.message}</div>`;
                } finally {
                    showLoading(false);
                }
            },
            (error) => {
                alert(`Error getting location: ${error.message}`);
            }
        );
    }
    
    // Helper function to get city code from coordinates (mock implementation)
    async function getCityCode(lat, lon) {
        // In a real app, you would call a geocoding API here
        // For demo purposes, we'll just return a default city code
        return 'PAR'; // Paris as default
    }
    
    // View detailed information for a specific hotel
    async function viewHotelDetails(hotelId) {
        try {
            showLoading(true);
            const checkIn = formatDate(checkInDate.valueAsDate);
            const checkOut = formatDate(checkOutDate.valueAsDate);
            
            // Get hotel details
            const detailsResponse = await fetch(`${API_BASE_URL}/api/hotel/${hotelId}`);
            if (!detailsResponse.ok) {
                const errorData = await detailsResponse.json();
                throw new Error(errorData.error || 'Failed to fetch hotel details');
            }
            const details = await detailsResponse.json();
            
            // Get room availability
            const roomsResponse = await fetch(`${API_BASE_URL}/api/rooms/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}`);
            if (!roomsResponse.ok) {
                const errorData = await roomsResponse.json();
                throw new Error(errorData.error || 'Failed to fetch room availability');
            }
            const rooms = await roomsResponse.json();
            
            // Display hotel details
            hotelDetails.style.display = 'block';
            hotelsList.style.display = 'none';
            
            document.getElementById('hotelName').textContent = details.name || 'Unknown Hotel';
            document.getElementById('hotelAddress').textContent = details.address?.lines?.join(', ') || 'Address not available';
            document.getElementById('hotelRating').textContent = `${details.rating || 'N/A'} ★`;
            document.getElementById('hotelContact').textContent = details.contact?.phone || 'Contact not available';
            
            // Display rooms
            const roomsList = document.getElementById('roomsList');
            roomsList.innerHTML = rooms.map(room => `
                <div class="room-card">
                    <h4>${room.room?.type || 'Standard Room'}</h4>
                    <p>${room.room?.description || 'No description available'}</p>
                    <p class="room-price">$${room.price?.total || 'N/A'} ${room.price?.currency || ''}</p>
                    <p>Includes: ${room.price?.includes || 'No information'}</p>
                    <button class="book-now">Book Now</button>
                </div>
            `).join('');
            
            // Attach booking event listeners
            document.querySelectorAll('.book-now').forEach(button => {
                button.addEventListener('click', async function() {
                    const roomCard = this.closest('.room-card');
                    // For simplicity, we use hotelId from viewHotelDetails scope and room type from the card
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/book`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                hotelId, // from viewHotelDetails parameters
                                roomType: roomCard.querySelector('h4').textContent
                            })
                        });
                        const result = await response.json();
                        alert(result.message);
                    } catch (error) {
                        alert("Booking failed: " + error.message);
                    }
                });
            });
            
        } catch (error) {
            console.error('Details error:', error);
            hotelDetails.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        } finally {
            showLoading(false);
        }
    }
    
    // New Booking.com API integration example functions
    async function viewBookingHotelDetails(hotelId) {
        try {
            showLoading(true);
            // Use current checkin/checkout; currency and locale are hardcoded for demo
            const checkIn = formatDate(checkInDate.valueAsDate);
            const checkOut = formatDate(checkOutDate.valueAsDate);
            const url = `${API_BASE_URL}/api/booking/hotel-details?hotel_id=${hotelId}&checkin_date=${checkIn}&checkout_date=${checkOut}&currency=AED&locale=en-gb`;
            
            console.log("Making hotel details request to:", url);
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch booking hotel details');
            }
            
            const details = await response.json();
            console.log("Hotel details:", details);
            
            // Display booking hotel details
            hotelDetails.style.display = 'block';
            hotelsList.style.display = 'none';
            
            document.getElementById('hotelName').textContent = details.hotel_name || 'Unknown Hotel';
            document.getElementById('hotelAddress').textContent = details.hotel_address_line || details.address_trans || 'Address not available';
            document.getElementById('hotelRating').textContent = `${details.class || 'N/A'} ★`;
            document.getElementById('hotelContact').textContent = 'Contact information not available'; // API doesn't provide phone
            
            // After displaying details, fetch room information
            viewBookingRoomList(hotelId);
            
        } catch (error) {
            console.error('Booking details error:', error);
            hotelDetails.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        } finally {
            showLoading(false);
        }
    }

    async function viewBookingRoomList(hotelId) {
        try {
            showLoading(true);
            // Use current checkin/checkout; other parameters hardcoded for demo
            const checkIn = formatDate(checkInDate.valueAsDate);
            const checkOut = formatDate(checkOutDate.valueAsDate);
            const url = `${API_BASE_URL}/api/booking/room-list?hotel_id=${hotelId}&checkin_date=${checkIn}&checkout_date=${checkOut}&adults_number_by_rooms=3,1&children_number_by_rooms=2,1&units=metric&currency=AED&locale=en-gb&children_ages=5,0,9`;
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch booking room list');
            }
            const roomData = await response.json();
            
            // Parse and display room list in a structured way
            const roomsList = document.getElementById('roomsList');
            
            // Clear previous content
            roomsList.innerHTML = '';
            
            // Check if we have block array in the response
            if (roomData && roomData.block && roomData.block.length > 0) {
                // Display each room option
                roomData.block.forEach(room => {
                    // Create room card
                    const roomCard = document.createElement('div');
                    roomCard.className = 'room-card';
                    
                    // Room header with name
                    const roomHeader = document.createElement('h4');
                    roomHeader.textContent = room.name_without_policy || room.room_name || 'Standard Room';
                    roomCard.appendChild(roomHeader);
                    
                    // Room layout with image and details
                    const roomLayout = document.createElement('div');
                    roomLayout.className = 'room-layout';
                    
                    // Room image
                    if (roomData.rooms && roomData.rooms[room.room_id] && 
                        roomData.rooms[room.room_id].photos && 
                        roomData.rooms[room.room_id].photos.length > 0) {
                        
                        const roomImage = document.createElement('div');
                        roomImage.className = 'room-image';
                        const img = document.createElement('img');
                        img.src = roomData.rooms[room.room_id].photos[0].url_max300;
                        img.alt = room.room_name || 'Room Image';
                        roomImage.appendChild(img);
                        roomLayout.appendChild(roomImage);
                    }
                    
                    // Room info
                    const roomInfo = document.createElement('div');
                    roomInfo.className = 'room-info';
                    
                    // Room description
                    if (roomData.rooms && roomData.rooms[room.room_id] && roomData.rooms[room.room_id].description) {
                        const description = document.createElement('p');
                        description.className = 'room-description';
                        description.textContent = roomData.rooms[room.room_id].description;
                        roomInfo.appendChild(description);
                    }
                    
                    // Bed configuration
                    if (roomData.rooms && roomData.rooms[room.room_id] && 
                        roomData.rooms[room.room_id].bed_configurations && 
                        roomData.rooms[room.room_id].bed_configurations.length > 0) {
                        
                        const bedConfig = document.createElement('p');
                        bedConfig.className = 'bed-config';
                        
                        // Get all bed types
                        const bedTypes = roomData.rooms[room.room_id].bed_configurations[0].bed_types;
                        const bedNames = bedTypes.map(bed => bed.name_with_count).join(', ');
                        
                        bedConfig.innerHTML = `<strong>Bed:</strong> ${bedNames}`;
                        roomInfo.appendChild(bedConfig);
                    }
                    
                    // Room size
                    if (room.room_surface_in_m2) {
                        const roomSize = document.createElement('p');
                        roomSize.className = 'room-size';
                        roomSize.innerHTML = `<strong>Room size:</strong> ${room.room_surface_in_m2} m²`;
                        roomInfo.appendChild(roomSize);
                    }
                    
                    // Meal plan
                    if (room.mealplan) {
                        const mealPlan = document.createElement('p');
                        mealPlan.className = 'meal-plan';
                        mealPlan.innerHTML = `<strong>Meal plan:</strong> ${room.mealplan}`;
                        roomInfo.appendChild(mealPlan);
                    }
                    
                    // Room highlights/amenities
                    if (roomData.rooms && roomData.rooms[room.room_id] && 
                        roomData.rooms[room.room_id].highlights && 
                        roomData.rooms[room.room_id].highlights.length > 0) {
                        
                        const highlights = document.createElement('div');
                        highlights.className = 'room-highlights';
                        highlights.innerHTML = '<strong>Room features:</strong>';
                        
                        const highlightList = document.createElement('ul');
                        roomData.rooms[room.room_id].highlights.slice(0, 6).forEach(highlight => {
                            const item = document.createElement('li');
                            item.textContent = highlight.translated_name;
                            highlightList.appendChild(item);
                        });
                        
                        highlights.appendChild(highlightList);
                        roomInfo.appendChild(highlights);
                    }
                    
                    roomLayout.appendChild(roomInfo);
                    roomCard.appendChild(roomLayout);
                    
                    // Price and booking section
                    const bookingSection = document.createElement('div');
                    bookingSection.className = 'booking-section';
                    
                    // Display cancellation policy
                    if (room.paymentterms && room.paymentterms.cancellation) {
                        const cancellation = document.createElement('p');
                        cancellation.className = 'cancellation-policy';
                        cancellation.innerHTML = `<strong>${room.paymentterms.cancellation.type_translation || 'Cancellation policy'}:</strong> ${room.paymentterms.cancellation.description || 'Check cancellation terms'}`;
                        bookingSection.appendChild(cancellation);
                    }
                    
                    // Price info
                    const priceInfo = document.createElement('div');
                    priceInfo.className = 'price-info';
                    
                    if (room.price_breakdown) {
                        const currency = room.price_breakdown.currency || 'AED';
                        const price = room.price_breakdown.all_inclusive_price || 0;
                        
                        const priceElement = document.createElement('p');
                        priceElement.className = 'room-price';
                        priceElement.innerHTML = `<strong>${currency} ${price.toFixed(2)}</strong>`;
                        
                        if (room.nr_stays > 1) {
                            priceElement.innerHTML += ` <span>for ${room.nr_stays} nights</span>`;
                        }
                        
                        priceInfo.appendChild(priceElement);
                    }
                    
                    // Booking button
                    const bookButton = document.createElement('button');
                    bookButton.className = 'book-now';
                    bookButton.textContent = 'Book Now';
                    bookButton.dataset.blockId = room.block_id;
                    bookButton.addEventListener('click', function() {
                        alert(`Room booking selected for ${room.room_name || 'this room'}.\nIn a real app, this would proceed to the booking form.`);
                        // Here you would collect guest info and make the booking
                    });
                    
                    priceInfo.appendChild(bookButton);
                    bookingSection.appendChild(priceInfo);
                    roomCard.appendChild(bookingSection);
                    
                    // Add the room card to the room list
                    roomsList.appendChild(roomCard);
                });
            } else {
                roomsList.innerHTML = '<p>No rooms available for the selected dates.</p>';
            }
        } catch (error) {
            console.error('Booking room list error:', error);
            const roomsList = document.getElementById('roomsList');
            roomsList.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        } finally {
            showLoading(false);
        }
    }

    // Sort hotels based on selected criteria
    function sortHotels() {
        if (!currentHotels) return;
        
        const sortValue = sortBy.value;
        let sortedHotels = [...currentHotels];
        
        switch (sortValue) {
            case 'price':
                sortedHotels.sort((a, b) => (a.offers[0]?.price?.total || 0) - (b.offers[0]?.price?.total || 0));
                break;
            case 'price-desc':
                sortedHotels.sort((a, b) => (b.offers[0]?.price?.total || 0) - (a.offers[0]?.price?.total || 0));
                break;
            case 'rating':
                sortedHotels.sort((a, b) => (b.hotel.rating || 0) - (a.hotel.rating || 0));
                break;
            case 'distance':
                // Note: Would require distance data from API
                break;
        }
        
        displayHotels(sortedHotels);
    }
    
    // Filter hotels by price range
    function filterAndDisplayHotels() {
        const maxPrice = parseFloat(priceRange.value);
        const filteredHotels = currentHotels.filter(hotel => {
            return (hotel.offers[0]?.price?.total || Infinity) <= maxPrice;
        });
        
        displayHotels(filteredHotels);
    }
    
    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        
        return [year, month, day].join('-');
    }
    
    // Show/hide loading indicator with improved styling
    function showLoading(show) {
        const loadingElement = document.getElementById('loading') || createLoadingElement();
        
        if (show) {
            document.body.classList.add('loading-active');
            loadingElement.style.display = 'flex';
        } else {
            document.body.classList.remove('loading-active');
            loadingElement.style.display = 'none';
        }
    }
    
    // Create loading element if it doesn't exist with improved design
    function createLoadingElement() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading';
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Finding the best hotels for you...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }
});