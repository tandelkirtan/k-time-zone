const apiKey = `f6372ba6e2b94cd6b258df60b222b37c`;

// DOM Elements - Current Location
const currentEls = {
    timezone: document.getElementById("current-timezone"),
    date: document.getElementById("current-date"), // New element
    time: document.getElementById("current-time"),
    lat: document.getElementById("current-lat"),
    lon: document.getElementById("current-lon"),
    offsetStd: document.getElementById("current-offset-std"),
    offsetStdSec: document.getElementById("current-offset-std-sec"),
    offsetDst: document.getElementById("current-offset-dst"),
    offsetDstSec: document.getElementById("current-offset-dst-sec"),
    country: document.getElementById("current-country"),
    postcode: document.getElementById("current-postcode"),
    city: document.getElementById("current-city")
};

// DOM Elements - Search
const searchForm = document.getElementById("address-time-zone-form");
const resultsContainer = document.querySelector(".results-container");
const searchEls = {
    timezone: document.getElementById("search-timezone"),
    date: document.getElementById("search-date"), // New element
    time: document.getElementById("search-time"),
    lat: document.getElementById("search-lat"),
    lon: document.getElementById("search-lon"),
    offsetStd: document.getElementById("search-offset-std"),
    offsetStdSec: document.getElementById("search-offset-std-sec"),
    offsetDst: document.getElementById("search-offset-dst"),
    offsetDstSec: document.getElementById("search-offset-dst-sec"),
    country: document.getElementById("search-country"),
    postcode: document.getElementById("search-postcode"),
    city: document.getElementById("search-city")
};

// Store intervals to clear them when updating
const intervals = {
    current: null,
    search: null
};

// Helper function to format time
function getDateTimeInTimeZone(timeZoneName) {
    try {
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timeZoneName
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: timeZoneName,
            timeZoneName: 'short'
        };
        
        const now = new Date();
        const dateStr = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
        const timeStr = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
        
        return { date: dateStr, time: timeStr };
    } catch (error) {
        console.error("Invalid TimeZone:", timeZoneName);
        return { date: "Invalid TimeZone", time: "Invalid TimeZone" };
    }
}

// Start a live clock for a specific element and timezone
function startClock(dateElement, timeElement, timeZoneName, type) {
    // Clear existing interval if any
    if (intervals[type]) {
        clearInterval(intervals[type]);
    }

    const update = () => {
        const { date, time } = getDateTimeInTimeZone(timeZoneName);
        dateElement.innerText = date;
        timeElement.innerText = time;
    };

    // Update immediately
    update();

    // Update every second
    intervals[type] = setInterval(update, 1000);
}

// Helper function to update UI with data
function updateUI(elements, data, type) {
    // Check if data exists and has results
    if (!data || !data.results || data.results.length === 0) {
        alert("No results found.");
        return;
    }

    const result = data.results[0];
    const timezone = result.timezone || {};

    elements.timezone.innerText = timezone.name || "N/A";
    elements.lat.innerText = result.lat || "N/A";
    elements.lon.innerText = result.lon || "N/A";
    elements.offsetStd.innerText = timezone.offset_STD || "N/A";
    elements.offsetStdSec.innerText = timezone.offset_STD_seconds || "N/A";
    elements.offsetDst.innerText = timezone.offset_DST || "N/A";
    elements.offsetDstSec.innerText = timezone.offset_DST_seconds || "N/A";
    elements.country.innerText = result.country || "N/A";
    elements.postcode.innerText = result.postcode || "N/A";
    elements.city.innerText = result.city || "N/A";

    // Start the live clock if we have a valid timezone name
    if (timezone.name) {
        startClock(elements.date, elements.time, timezone.name, type);
    } else {
        elements.date.innerText = "N/A";
        elements.time.innerText = "N/A";
    }
}

// Function to get current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    reject("Geolocation access denied or failed.");
                }
            );
        } else {
            reject("Geolocation is not supported by this browser.");
        }
    });
}

// Initialize Current Location Data
async function init() {
    try {
        currentEls.timezone.innerText = "Locating...";
        const coords = await getCurrentLocation();
        
        currentEls.lat.innerText = coords.lat;
        currentEls.lon.innerText = coords.lon;
        currentEls.timezone.innerText = "Fetching details...";

        const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json&apiKey=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        updateUI(currentEls, data, 'current');

    } catch (error) {
        console.error("Current Location Error:", error);
        currentEls.timezone.innerText = "Unavailable";
    }
}

// Search Form Handler
searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const addressInput = document.getElementById("address-input");
    const address = addressInput.value.trim();

    if (!address) return;

    try {
        // Visual feedback for loading
        searchEls.timezone.innerText = "Searching...";
        resultsContainer.classList.remove("active");

        // Added format=json to ensure correct response structure
        const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&format=json&apiKey=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        updateUI(searchEls, data, 'search');
        resultsContainer.classList.add("active");

    } catch (error) {
        console.error("Search Error:", error);
        searchEls.timezone.innerText = "Error";
        alert("Error fetching data: " + error.message);
    }
});

// Start the app
init();
