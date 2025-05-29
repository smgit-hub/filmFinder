// OMDb API Key
const API_KEY = "78e0df47";

/**
 * Movie class handles searching and fetching movie data from OMDb.
 */
class Movie {
  /**
   * @param {string} title - The title of the movie to search.
   */
  constructor(title) {
    this.title = title; // Movie title to search
  }

  /**
   * Constructs the search URL using the movie title.
   * @returns {string} URL to query OMDb for search results.
   */
  get searchUrl() {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
      this.title.trim()
    )}`;
  }

  /**
   * Static method to construct the URL to fetch movie details by IMDb ID.
   * @param {string} imdbID - The IMDb ID of the movie.
   * @returns {string} URL to query OMDb for full movie details.
   */
  static getDetailsUrl(imdbID) {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`;
  }

  /**
   * Fetches movies by title.
   * @param {function} callback - Called with movie results on success.
   * @param {function} errorCallback - Called with error message on failure.
   */
  fetchMovies(callback, errorCallback) {
    $.ajax({
      url: this.searchUrl,
      method: "GET",
      success: (response) => {
        if (response.Response === "True") {
          callback(response.Search.slice(0, 15)); // Return top 15 results
        } else {
          errorCallback("No results found.");
        }
      },
      error: () => errorCallback("Error fetching movie data."),
    });
  }

  /**
   * Static method to fetch full movie details by IMDb ID.
   * @param {string} imdbID - The IMDb ID of the movie.
   * @param {function} callback - Called with movie details on success.
   * @param {function} errorCallback - Called with error message on failure.
   */
  static fetchDetails(imdbID, callback, errorCallback) {
    $.ajax({
      url: Movie.getDetailsUrl(imdbID),
      method: "GET",
      success: (response) => {
        if (response.Response === "True") {
          callback(response);
        } else {
          errorCallback(response.Error || "No details found.");
        }
      },
      error: () => errorCallback("Error fetching movie details."),
    });
  }
}

/**
 * MovieCard class handles the creation and rendering of individual movie cards.
 */
class MovieCard {
  /**
   * @param {object} details - Movie details returned from OMDb.
   */
  constructor(details) {
    this.details = details; // Full movie details including title, poster, etc.
  }

  /**
   * Determine the color for the IMDb rating badge.
   * @returns {string} A hex color code representing the rating tier.
   */
  getRatingColor() {
    const rating = parseFloat(this.details.imdbRating);
    if (isNaN(rating)) return "#888"; // Grey for missing rating
    if (rating >= 8.0) return "#4CAF50"; // Green for excellent
    if (rating >= 6.0) return "#FF9800"; // Orange for average
    return "#F44336"; // Red for poor
  }

  /**
   * Renders and returns a jQuery element for the movie card.
   * @returns {jQuery} The rendered movie card element.
   */
  render() {
    const card = $(`
      <div class="col-md-4 mb-4 d-flex justify-content-center">
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
 * MovieApp class handles UI interactions, events, and controls the application.
 */
class MovieApp {
  constructor() {
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

    this.maxDisplay = 9;

    this.setupEventListeners();
    this.populateSuggestedMovies();
    this.showDescription();
  }

  /**
   * Validates the user input for a movie title.
   * @param {string} title - The user input title to validate.
   * @returns {boolean} True if input is valid, false otherwise.
   */
  validateTitleInput(title) {
    const trimmed = title.trim();

    if (!trimmed) {
      alert("Please enter a movie title.");
      return false;
    }

    if (trimmed.length < 2 || trimmed.length > 100) {
      alert("Movie title must be between 2 and 100 characters.");
      return false;
    }

    const validPattern = /^[a-zA-Z0-9\s'":,\-!?()]+$/;
    if (!validPattern.test(trimmed)) {
      alert("Title contains invalid characters.");
      return false;
    }

    return true;
  }

  /**
   * Shuffles an array using the Fisher-Yates algorithm.
   * @param {Array} array - The array to shuffle.
   * @returns {Array} The shuffled array.
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
   * Populates the suggestion dropdown with random movie titles.
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
   * Displays the main description on the home page.
   */
  showDescription() {
    $("#pageDescription").fadeIn(400);
  }

  /**
   * Hides the main description when search results are shown.
   */
  hideDescription() {
    $("#pageDescription").fadeOut(400);
  }

  /**
   * Initiates search and rendering of movie cards based on the title.
   * @param {string} title - The movie title to search for.
   */
  searchAndDisplayMovies(title) {
    if (!this.validateTitleInput(title)) return;

    $("#movieCards").empty();
    $("#loading").show();
    this.hideDescription();

    const movieSearch = new Movie(title);
    movieSearch.fetchMovies(
      (movies) => this.displayMovies(movies),
      (errorMessage) => {
        $("#movieCards").html(
          `<p class="text-center text-danger" role="alert">${errorMessage}</p>`
        );
        $("#loading").hide();
        this.showDescription();
      }
    );
  }

  /**
   * Displays movie cards based on fetched results.
   * @param {Array} movies - Array of movie search results from OMDb.
   */
  displayMovies(movies) {
    $("#movieCards").empty();
    $("#loading").show();

    const detailPromises = movies.map((movie) =>
      $.ajax({
        url: Movie.getDetailsUrl(movie.imdbID),
        method: "GET",
      })
        .then((detail) => (detail.Poster === "N/A" ? null : detail))
        .catch(() => null)
    );

    $.when(...detailPromises).done((...results) => {
      const detailsArray = Array.isArray(results[0])
        ? results.map((r) => r[0])
        : results;

      const validDetails = detailsArray.filter((d) => d !== null);

      if (validDetails.length === 0) {
        $("#movieCards").html(
          `<p class="text-center text-warning mt-3" role="alert">No valid posters found.</p>`
        );
        $("#loading").hide();
        this.showDescription();
        return;
      }

      const imageLoadPromises = validDetails.map(
        (detail) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(detail);
            img.onerror = () => resolve(null);
            img.src = detail.Poster;
          })
      );

      Promise.all(imageLoadPromises).then((loadedDetails) => {
        const loadedValidDetails = loadedDetails.filter((d) => d !== null);
        const toDisplay = loadedValidDetails.slice(0, this.maxDisplay);

        if (toDisplay.length === 0) {
          $("#movieCards").html(
            `<p class="text-center text-warning mt-3" role="alert">No valid posters could be loaded.</p>`
          );
          $("#loading").hide();
          this.showDescription();
          return;
        }

        toDisplay.forEach((detail) => {
          const card = new MovieCard(detail).render();
          $("#movieCards").append(card);
        });

        if (toDisplay.length < this.maxDisplay) {
          $("#movieCards").append(
            `<p class="text-center text-warning mt-3" role="alert">Only ${toDisplay.length} movie(s) could be displayed.</p>`
          );
        }

        $("#loading").hide();
      });
    });
  }

  /**
   * Sets up event listeners for user interactions.
   */
  setupEventListeners() {
    $(document).ready(() => {
      $("#suggestedMovies").on("focus click", () =>
        this.populateSuggestedMovies()
      );

      $("#searchBtn").on("click", () => {
        const title = $("#movieInput").val().trim();
        this.searchAndDisplayMovies(title);
      });

      $("#movieInput").on("keydown", (event) => {
        if (event.key === "Enter") {
          $("#searchBtn").click();
        }
      });

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

// Initialize the movie app
new MovieApp();
