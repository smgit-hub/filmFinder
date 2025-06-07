// OMDb API Key
const API_KEY = "78e0df47";

/**
 * Movie class handles searching and fetching movie data from OMDb.
 */
class Movie {
  constructor(title) {
    this.title = title;
  }

  get searchUrl() {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
      this.title.trim()
    )}`;
  }

  static getDetailsUrl(imdbID) {
    return `https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`;
  }

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
 * MovieCard class handles creation and rendering of movie cards.
 */
class MovieCard {
  constructor(details) {
    this.details = details;
  }

  getRatingColor() {
    const rating = parseFloat(this.details.imdbRating);
    if (isNaN(rating)) return "#888";
    if (rating >= 8.0) return "#4CAF50";
    if (rating >= 6.0) return "#FF9800";
    return "#F44336";
  }

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
 * MovieApp class handles UI interaction and app logic.
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

  shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  populateSuggestedMovies() {
    const shuffled = this.shuffleArray(this.movieSuggestionsPool);
    const suggestions = shuffled.slice(0, 10);
    const $dropdown = $("#suggestedMovies");
    $dropdown.empty().append('<option value="">Suggested Movies</option>');
    suggestions.forEach((title) => {
      $dropdown.append(`<option value="${title}">${title}</option>`);
    });
  }

  showDescription() {
    $("#pageDescription").fadeIn(400);
  }

  hideDescription() {
    $("#pageDescription").fadeOut(400);
  }

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

    anime({
      targets: ".anime-card",
      translateY: [100, 0],
      opacity: [0, 1],
      duration: 800,
      delay: anime.stagger(100),
      easing: "easeOutExpo",
    });

    $("#loading").hide();
  }

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

// Launch app
new MovieApp();

// Contact form validation and success message
$(document).ready(() => {
  $("#contactForm").on("submit", function (e) {
    e.preventDefault();
    const form = this;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
    } else {
      $("#formSuccess").removeClass("d-none");
      form.reset();
      form.classList.remove("was-validated");
    }
  });
});
