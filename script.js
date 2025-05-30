// OMDb API Key
const API_KEY = "78e0df47";

/**
 * Movie class handles searching and fetching movie data from OMDb.
 */
class Movie {
  constructor(title) {
    this.title = title; // The movie title to search
  }

  // Construct the search URL using the movie title
  get searchUrl() {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
      this.title.trim()
    )}`;
  }

  // Static method to construct URL to fetch movie details by IMDb ID
  static getDetailsUrl(imdbID) {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`;
  }

  /**
   * Fetch movies by title.
   * @param {Function} callback - Function called on successful fetch.
   * @param {Function} errorCallback - Function called on failure.
   */
  fetchMovies(callback, errorCallback) {
    // jQuery AJAX GET request to OMDb API to search movies
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
   * @param {string} imdbID - IMDb ID of the movie.
   * @param {Function} callback - Called with movie details on success.
   * @param {Function} errorCallback - Called with error message on failure.
   */
  static fetchDetails(imdbID, callback, errorCallback) {
    // jQuery AJAX GET request to fetch movie details
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
  constructor(details) {
    this.details = details; // Movie details object
  }

  // Determine color based on IMDb rating
  getRatingColor() {
    const rating = parseFloat(this.details.imdbRating);
    if (isNaN(rating)) return "#888"; // Grey for missing rating
    if (rating >= 8.0) return "#4CAF50"; // Green for excellent
    if (rating >= 6.0) return "#FF9800"; // Orange for average
    return "#F44336"; // Red for poor
  }

  // Render and return a jQuery movie card element
  render() {
    // Create a Bootstrap card using jQuery with movie data
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

    this.maxDisplay = 9; // Max number of movie cards to show

    this.setupEventListeners(); // Attach event handlers
    this.populateSuggestedMovies(); // Load suggestions
    this.showDescription(); // Show default description
  }

  // Shuffle an array using Fisher-Yates algorithm
  shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Populate the dropdown with 10 random movie suggestions
  populateSuggestedMovies() {
    const shuffled = this.shuffleArray(this.movieSuggestionsPool);
    const suggestions = shuffled.slice(0, 10);
    const $dropdown = $("#suggestedMovies"); // jQuery: get dropdown
    $dropdown.empty().append('<option value="">Suggested Movies</option>'); // Clear and reset
    suggestions.forEach((title) => {
      $dropdown.append(`<option value="${title}">${title}</option>`); // Add suggestions
    });
  }

  // Show the default description section
  showDescription() {
    $("#pageDescription").fadeIn(400); // jQuery: fade in description
  }

  // Hide the description when results are showing
  hideDescription() {
    $("#pageDescription").fadeOut(400); // jQuery: fade out description
  }

  // Perform movie search and show results
  searchAndDisplayMovies(title) {
    if (!title) {
      alert("Please enter a movie title."); // Basic input validation
      return;
    }

    $("#movieCards").empty(); // Clear previous results
    $("#loading").show(); // jQuery: show loading spinner
    this.hideDescription(); // Hide default description

    const movieSearch = new Movie(title);
    movieSearch.fetchMovies(
      (movies) => this.displayMovies(movies), // On success
      (errorMessage) => {
        $("#movieCards").html(
          `<p class="text-center text-danger" role="alert">${errorMessage}</p>` // jQuery: show error message
        );
        $("#loading").hide(); // Hide loading
        this.showDescription(); // Restore description
      }
    );
  }

  // Display up to 9 movie cards
  displayMovies(movies) {
    $("#movieCards").empty(); // Clear movie cards
    $("#loading").show(); // Show loading

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
            img.onload = () => resolve(detail); // Load success
            img.onerror = () => resolve(null); // Load failed
            img.src = detail.Poster;
          })
      );

      Promise.all(imageLoadPromises).then((loadedDetails) => {
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
          $("#movieCards").append(card); // Add card to page
        });

        if (toDisplay.length < this.maxDisplay) {
          $("#movieCards").append(
            `<p class="text-center text-warning mt-3" role="alert">Only ${toDisplay.length} movie(s) could be displayed.</p>`
          );
        }

        $("#loading").hide(); // Hide loading
      });
    });
  }

  // Set up all DOM event listeners
  setupEventListeners() {
    $(document).ready(() => {
      // On dropdown focus or click, repopulate suggestions
      $("#suggestedMovies").on("focus click", () =>
        this.populateSuggestedMovies()
      );

      // On search button click, trigger movie search
      $("#searchBtn").on("click", () => {
        const title = $("#movieInput").val().trim(); // Get input
        this.searchAndDisplayMovies(title); // Search
      });

      // Trigger search on Enter key
      $("#movieInput").on("keydown", (event) => {
        if (event.key === "Enter") {
          $("#searchBtn").click(); // Simulate button click
        }
      });

      // Handle movie dropdown selection
      $("#suggestedMovies").on("change", () => {
        const selectedMovie = $("#suggestedMovies").val();
        if (selectedMovie) {
          $("#movieInput").val(selectedMovie); // Set input value
          $("#searchBtn").click(); // Search
        } else {
          $("#movieInput").val(""); // Clear input
          $("#movieCards").empty(); // Clear results
          this.showDescription(); // Show default view
        }
      });
    });
  }
}

// Launch the app
new MovieApp();
