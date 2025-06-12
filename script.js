/**
 * Movie Search and Display Application
 *
 * This script implements the core functionality of the movie search web application
 * that interacts with the OMDb API. It allows searching movies by title, fetching detailed
 * movie information, rendering movie cards with posters and ratings, and handling UI interactions.
 *
 * Classes:
 * - Movie: Handles fetching movie data from the OMDb API.
 * - MovieCard: Responsible for creating and rendering movie cards in the UI.
 * - MovieApp: Manages UI interactions, event handling, and overall application logic.
 *
 * Dependencies:
 * - jQuery for DOM manipulation and event handling.
 * - Anime.js for animations.
 */

// OMDb API key used for fetching movie data
const API_KEY = "78e0df47";

/**
 * Represents a movie search and fetch utility.
 */
class Movie {
  constructor(title) {
    this.title = title; // Movie title to search
  }

  // Returns the full OMDb API search URL for the title
  get searchUrl() {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
      this.title.trim()
    )}`;
  }

  // Returns the full OMDb API URL to fetch detailed movie info by IMDb ID
  static getDetailsUrl(imdbID) {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`;
  }

  // Fetch up to 15 movies matching the title
  async fetchMovies() {
    try {
      const response = await fetch(this.searchUrl); // Fetch search results
      const data = await response.json(); // Parse JSON

      if (data.Response === "True") {
        return data.Search.slice(0, 15); // Return first 15 movies
      } else {
        throw new Error("No results found.");
      }
    } catch (error) {
      throw new Error("Error fetching movie data.");
    }
  }

  // Fetch full details of a movie by IMDb ID
  static async fetchDetails(imdbID) {
    try {
      const response = await fetch(Movie.getDetailsUrl(imdbID));
      const data = await response.json();

      if (data.Response === "True") {
        return data;
      } else {
        throw new Error(data.Error || "No details found.");
      }
    } catch {
      throw new Error("Error fetching movie details.");
    }
  }
}

/**
 * Class responsible for rendering a single movie card in the UI.
 */
class MovieCard {
  constructor(details) {
    this.details = details; // Detailed movie info
  }

  // Determines the color of the IMDb rating text based on score
  getRatingColor() {
    const rating = parseFloat(this.details.imdbRating);
    if (isNaN(rating)) return "#888"; // Gray if no rating
    if (rating >= 8.0) return "#4CAF50"; // Green for great
    if (rating >= 6.0) return "#FF9800"; // Orange for average
    return "#F44336"; // Red for low
  }

  // Renders the movie card as a jQuery object
  render() {
    const card = $(`
       <div class="col-md-4 mb-4 d-flex justify-content-center anime-card">
         <div class="card movie-card" aria-label="${
           this.details.Title
         } movie card" tabindex="0">
           <img src="${this.details.Poster}" class="card-img-top" alt="${
      this.details.Title
    } poster" />
           <div class="plot-overlay">
             <div>
               <h5 class="text-white mb-2">${this.details.Genre} · ${
      this.details.Year
    }</h5>
               <p>${this.details.Plot}</p>
             </div>
           </div>
           <div class="card-body">
             <h5 class="card-title">${this.details.Title}</h5>
             <p class="card-text">
               <strong>IMDb Rating:</strong>
               <span style="color:${this.getRatingColor()};">${
      this.details.imdbRating
    }</span>
             </p>
           </div>
         </div>
       </div>
     `);
    return card;
  }
}

/**
 * Main class for managing the entire movie app.
 */
class MovieApp {
  constructor() {
    // Pool of suggested movie titles
    this.movieSuggestionsPool = [
      "Inception",
      "The Matrix",
      "Titanic",
      "Interstellar",
      "The Dark Knight",
      "Forrest Gump",
      "Pulp Fiction",
      "The Shawshank Redemption",
      "Gladiator",
      "Fight Club",
      "The Godfather",
      "Avatar",
      "The Lord of the Rings",
      "Jurassic Park",
      "The Avengers",
      "Back to the Future",
      "Star Wars",
      "The Lion King",
      "The Silence of the Lambs",
      "The Prestige",
      "Harry Potter and the Sorcerer's Stone",
      "Pirates of the Caribbean",
      "The Departed",
      "Guardians of the Galaxy",
      "Black Panther",
      "Joker",
      "La La Land",
      "The Social Network",
      "Mad Max: Fury Road",
      "The Wolf of Wall Street",
    ];

    this.maxDisplay = 9; // Number of movies to display per search

    // Initialize UI event listeners, dropdown, and description
    this.setupEventListeners();
    this.populateSuggestedMovies();
    this.showDescription();
  }

  // Shuffles an array randomly
  shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Populates dropdown with random movie suggestions
  populateSuggestedMovies() {
    const shuffled = this.shuffleArray(this.movieSuggestionsPool);
    const suggestions = shuffled.slice(0, 10);
    const $dropdown = $("#suggestedMovies");
    $dropdown.empty().append('<option value="">Suggested Movies</option>');
    suggestions.forEach((title) => {
      $dropdown.append(`<option value="${title}">${title}</option>`);
    });
  }

  // Shows the description block
  showDescription() {
    $("#pageDescription").fadeIn(400);
  }

  // Hides the description block
  hideDescription() {
    $("#pageDescription").fadeOut(400);
  }

  // Searches for movies by title and displays results
  async searchAndDisplayMovies(title) {
    if (!title) {
      alert("Please enter a movie title.");
      return;
    }

    $("#movieCards").empty(); // Clear previous results
    $("#loading").show(); // Show loader
    this.hideDescription(); // Hide description during search

    const movieSearch = new Movie(title);
    try {
      const movies = await movieSearch.fetchMovies(); // Fetch matching titles
      await this.displayMovies(movies); // Display result cards
    } catch (error) {
      // Show error message
      $("#movieCards").html(
        `<p class="text-center text-danger" role="alert">${error.message}</p>`
      );
      $("#loading").hide();
      this.showDescription(); // Show description if no results
    }
  }

  // Displays movie cards by fetching details and filtering invalid entries
  async displayMovies(movies) {
    $("#movieCards").empty();
    $("#loading").show();

    // Fetch full details for each movie
    const detailPromises = movies.map(async (movie) => {
      try {
        const detail = await Movie.fetchDetails(movie.imdbID);
        return detail.Poster === "N/A" ? null : detail;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(detailPromises);
    const validDetails = results.filter((d) => d !== null);

    // If no valid posters found
    if (validDetails.length === 0) {
      $("#movieCards").html(
        `<p class="text-center text-warning mt-3" role="alert">No valid posters found.</p>`
      );
      $("#loading").hide();
      this.showDescription();
      return;
    }

    // Validate that poster images actually load
    const imageLoadPromises = validDetails.map(
      (detail) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(detail);
          img.onerror = () => resolve(null);
          img.src = detail.Poster;
        })
    );

    const loadedDetails = await Promise.all(imageLoadPromises);
    const loadedValidDetails = loadedDetails.filter((d) => d !== null);

    if (loadedValidDetails.length === 0) {
      $("#movieCards").html(
        `<p class="text-center text-warning mt-3" role="alert">No valid posters could be loaded.</p>`
      );
      $("#loading").hide();
      this.showDescription();
      return;
    }

    // Display up to maxDisplay number of movie cards
    const toDisplay = loadedValidDetails.slice(0, this.maxDisplay);
    toDisplay.forEach((detail) => {
      const card = new MovieCard(detail).render();
      $("#movieCards").append(card);
    });

    // Show message if not all movies could be shown
    if (toDisplay.length < this.maxDisplay) {
      $("#movieCards").append(
        `<p class="text-center text-warning mt-3" role="alert">Only ${toDisplay.length} movie(s) could be displayed.</p>`
      );
    }

    // Animate movie cards into view using Anime.js
    anime({
      targets: ".anime-card",
      translateY: [100, 0],
      opacity: [0, 1],
      duration: 1500,
      delay: anime.stagger(500),
      easing: "easeOutExpo",
    });

    $("#loading").hide(); // Hide loader after render
  }

  // Setup all event listeners on page load
  setupEventListeners() {
    $(document).ready(() => {
      // Regenerate suggestions on dropdown focus or click
      $("#suggestedMovies").on("focus click", () =>
        this.populateSuggestedMovies()
      );

      // On clicking search button
      $("#searchBtn").on("click", () => {
        const title = $("#movieInput").val().trim();
        this.searchAndDisplayMovies(title);
      });

      // Pressing Enter in input triggers search
      $("#movieInput").on("keydown", (event) => {
        if (event.key === "Enter") {
          $("#searchBtn").click();
        }
      });

      // When a suggested movie is selected from dropdown
      $("#suggestedMovies").on("change", () => {
        const selectedMovie = $("#suggestedMovies").val();
        if (selectedMovie) {
          $("#movieInput").val(selectedMovie);
          $("#searchBtn").click();
        } else {
          $("#movieInput").val("");
          $("#movieCards").empty();
          this.showDescription();
        }
      });
    });
  }
}

// Initialize and run the movie application
new MovieApp();

/**
 * Contact Form Validation
 *
 * Validates name, email, and message inputs before submission.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");
  const successMsg = document.getElementById("formSuccess");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    let valid = true;

    // Validate name (letters, spaces, hyphens, 2+ chars)
    const namePattern = /^[A-Za-z\s\-]{2,}$/;
    if (!namePattern.test(nameInput.value.trim())) {
      nameInput.classList.add("is-invalid");
      valid = false;
    } else {
      nameInput.classList.remove("is-invalid");
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value.trim())) {
      emailInput.classList.add("is-invalid");
      valid = false;
    } else {
      emailInput.classList.remove("is-invalid");
    }

    // Validate that message has at least 5 words
    const wordCount = messageInput.value.trim().split(/\s+/).length;
    if (wordCount < 5) {
      messageInput.classList.add("is-invalid");
      valid = false;
    } else {
      messageInput.classList.remove("is-invalid");
    }

    // Show success message or keep invalid alerts
    if (valid) {
      successMsg.classList.remove("d-none");
      form.reset();
    } else {
      successMsg.classList.add("d-none");
    }
  });
});

/**
 * Animate page headings when the DOM content is fully loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  anime({
    targets: "h1, h2, p",
    translateY: [-50, 0],
    opacity: [0, 1],
    duration: 1200,
    easing: "easeOutExpo",
  });
});
