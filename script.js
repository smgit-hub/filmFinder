/**
 * Movie Search and Display Application
 *
 * This script implements the core functionality of a movie search web application
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

// OMDb API Key
const API_KEY = "78e0df47";

/**
 * Represents a movie search and fetch utility.
 *
 * Handles communication with the OMDb API to search movies by title and fetch detailed
 * information by IMDb ID.
 */
class Movie {
  /**
   * Create a Movie instance.
   * @param {string} title - The movie title to search for.
   */
  constructor(title) {
    this.title = title;
  }

  /**
   * Construct the search URL for the OMDb API using the movie title.
   * @returns {string} The full search URL.
   */
  get searchUrl() {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
      this.title.trim()
    )}`;
  }

  /**
   * Generate the details URL for a specific movie by IMDb ID.
   * @param {string} imdbID - The IMDb ID of the movie.
   * @returns {string} The full details URL.
   */
  static getDetailsUrl(imdbID) {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`;
  }

  /**
   * Fetch a list of movies matching the title from the OMDb API.
   * @async
   * @throws Will throw an error if no results are found or the fetch fails.
   * @returns {Promise<Array>} An array of movie search results (up to 15).
   */
  async fetchMovies() {
    try {
      const response = await fetch(this.searchUrl);
      const data = await response.json();
      if (data.Response === "True") {
        return data.Search.slice(0, 15);
      } else {
        throw new Error("No results found.");
      }
    } catch (error) {
      throw new Error("Error fetching movie data.");
    }
  }

  /**
   * Fetch detailed information about a movie by its IMDb ID.
   * @async
   * @param {string} imdbID - The IMDb ID of the movie.
   * @throws Will throw an error if details are not found or the fetch fails.
   * @returns {Promise<Object>} The detailed movie data object.
   */
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
 * Class responsible for rendering a movie card element.
 */
class MovieCard {
  /**
   * Create a MovieCard instance.
   * @param {Object} details - The detailed movie information.
   */
  constructor(details) {
    this.details = details;
  }

  /**
   * Determine the color for the IMDb rating text based on the rating value.
   * @returns {string} A color hex code representing the rating category.
   */
  getRatingColor() {
    const rating = parseFloat(this.details.imdbRating);
    if (isNaN(rating)) return "#888"; // Default gray for no rating
    if (rating >= 8.0) return "#4CAF50"; // Green for high ratings
    if (rating >= 6.0) return "#FF9800"; // Orange for medium ratings
    return "#F44336"; // Red for low ratings
  }

  /**
   * Create and return a jQuery element representing the movie card.
   * @returns {jQuery} The jQuery object containing the movie card HTML.
   */
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
 * Main application class that manages the movie search UI and application logic.
 */
class MovieApp {
  /**
   * Initialize the movie application.
   * Sets up event listeners, suggested movies dropdown, and initial UI description.
   */
  constructor() {
    /**
     * Predefined pool of movie suggestions to display in dropdown.
     * @type {string[]}
     */
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

    /**
     * Maximum number of movie cards to display.
     * @type {number}
     */
    this.maxDisplay = 9;

    this.setupEventListeners();
    this.populateSuggestedMovies();
    this.showDescription();
  }

  /**
   * Shuffle an array and return a new shuffled array.
   * @param {Array} array - The array to shuffle.
   * @returns {Array} A new array with elements shuffled randomly.
   */
  shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Populate the suggested movies dropdown with a shuffled subset of movies.
   */
  populateSuggestedMovies() {
    const shuffled = this.shuffleArray(this.movieSuggestionsPool);
    const suggestions = shuffled.slice(0, 10);
    const $dropdown = $("#suggestedMovies");
    $dropdown.empty().append('<option value="">Suggested Movies</option>');
    suggestions.forEach((title) => {
      $dropdown.append(`<option value="${title}">${title}</option>`);
    });
  }

  /**
   * Display the page description section.
   */
  showDescription() {
    $("#pageDescription").fadeIn(400);
  }

  /**
   * Hide the page description section.
   */
  hideDescription() {
    $("#pageDescription").fadeOut(400);
  }

  /**
   * Search movies by title and display the results as movie cards.
   * @async
   * @param {string} title - The movie title to search for.
   */
  async searchAndDisplayMovies(title) {
    if (!title) {
      alert("Please enter a movie title.");
      return;
    }

    $("#movieCards").empty();
    $("#loading").show();
    this.hideDescription();

    const movieSearch = new Movie(title);
    try {
      const movies = await movieSearch.fetchMovies();
      await this.displayMovies(movies);
    } catch (error) {
      $("#movieCards").html(
        `<p class="text-center text-danger" role="alert">${error.message}</p>`
      );
      $("#loading").hide();
      this.showDescription();
    }
  }

  /**
   * Fetch details for each movie, validate poster images, and render movie cards.
   * @async
   * @param {Array} movies - Array of movie search result objects.
   */
  async displayMovies(movies) {
    $("#movieCards").empty();
    $("#loading").show();

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

    if (validDetails.length === 0) {
      $("#movieCards").html(
        `<p class="text-center text-warning mt-3" role="alert">No valid posters found.</p>`
      );
      $("#loading").hide();
      this.showDescription();
      return;
    }

    // Verify image loading success for each poster
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

    const toDisplay = loadedValidDetails.slice(0, this.maxDisplay);
    toDisplay.forEach((detail) => {
      const card = new MovieCard(detail).render();
      $("#movieCards").append(card);
    });

    if (toDisplay.length < this.maxDisplay) {
      $("#movieCards").append(
        `<p class="text-center text-warning mt-3" role="alert">Only ${toDisplay.length} movie(s) could be displayed.</p>`
      );
    }

    // Animate cards on display
    anime({
      targets: ".anime-card",
      translateY: [100, 0],
      opacity: [0, 1],
      duration: 1500,
      delay: anime.stagger(500),
      easing: "easeOutExpo",
    });

    $("#loading").hide();
  }

  /**
   * Setup event listeners for UI elements: search input, buttons, dropdown.
   */
  setupEventListeners() {
    $(document).ready(() => {
      // Repopulate suggestions on focus/click
      $("#suggestedMovies").on("focus click", () =>
        this.populateSuggestedMovies()
      );

      // Search button click
      $("#searchBtn").on("click", () => {
        const title = $("#movieInput").val().trim();
        this.searchAndDisplayMovies(title);
      });

      // Enter key triggers search
      $("#movieInput").on("keydown", (event) => {
        if (event.key === "Enter") {
          $("#searchBtn").click();
        }
      });

      // Suggested movie selected from dropdown
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

// Initialize the movie app instance
new MovieApp();

/**
 * Contact Form Handling Script
 *
 * This script handles the validation and submission behavior of a contact form.
 * It prevents default form submission, validates inputs using HTML5 validation,
 * displays a success message on valid submission, and resets the form.
 *
 * Dependencies:
 * - jQuery for DOM manipulation and event handling.
 */
$(document).ready(() => {
  /**
   * Handle contact form submission.
   * Validates the form and shows a success message if valid.
   */
  $("#contactForm").on("submit", function (e) {
    e.preventDefault();
    const form = this;
    if (!form.checkValidity()) {
      // Show validation feedback
      form.classList.add("was-validated");
    } else {
      // Display success message and reset form
      $("#formSuccess").removeClass("d-none");
      form.reset();
      form.classList.remove("was-validated");
    }
  });
});

/**
 * Animate page headings on DOM content loaded event.
 * Uses Anime.js for smooth entrance animations.
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
