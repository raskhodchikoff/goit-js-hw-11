import 'modern-normalize/modern-normalize.css';
import './sass/index.scss';
import '@fortawesome/fontawesome-free/css/all.css';
import 'notiflix/dist/notiflix-3.2.5.min.css';
import Notiflix from 'notiflix';
import 'simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';
import axios from 'axios';

// import fetchImages from './js/fetchData';
// import renderCards from './js/renderCard';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  loader: document.querySelector('.loader'),
};

const DEFAULT_CURRENT_PAGE = 1;
const HITS_PER_PAGE = 40;

let isLoading = false;
let query = '';
let currentPage = DEFAULT_CURRENT_PAGE;

let lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

// Render Images

const renderCard = items => {
  const gallery = items
    .map(
      ({
        largeImageURL,
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        ` <div class="photo-card">
            <a href="${largeImageURL}">
						  <div>
                <img src="${webformatURL}" alt="${tags}" loading="lazy" />
							</div>
            </a>
            <div class="info">
              <p class="info-item"><i class="fa-solid fa-thumbs-up"></i>&nbsp<span> ${likes}</span></p>
              <p class="info-item"><i class="fa-solid fa-eye"></i>&nbsp<span> ${views}</span></p>
              <p class="info-item"><i class="fa-solid fa-comment"></i>&nbsp<span> ${comments}</span></p>
						  <p class="info-item"><i class="fa-solid fa-download"></i>&nbsp<span> ${downloads}</span></p>
						</div>
					</div>`
    )
    .join('');

  refs.gallery.insertAdjacentHTML('beforeend', gallery);
};

// Load More

const loaderOn = () => refs.loader.classList.add('visible');
const loaderOff = () => refs.loader.classList.remove('visible');

// Service API

const KEY = '29483891-3b013779f21b0689e33cf999d';

axios.defaults.baseURL = 'https://pixabay.com/api/';

async function fetchData(query, currentPage, HITS_PER_PAGE) {
  const response = await axios.get(
    `?key=${KEY}&q=${query}&image_type=photo&orientation=horizontal&safesearch=true&page=${currentPage}&per_page=${HITS_PER_PAGE}`
  );
  return response;
}

// event listener search form

function handleSubmit(e) {
  e.preventDefault();
  refs.gallery.innerHTML = '';
  query = e.target.elements.searchQuery.value.trim();

  if (query === '') {
    return Notiflix.Notify.failure('Please enter your search query.');
  }

  fetchData(query, currentPage, HITS_PER_PAGE)
    .then(({ data }) => {
      const totalPages = Math.ceil(data.totalHits / HITS_PER_PAGE);

      if (data.totalHits === 0) {
        Notiflix.Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
        return;
      }

      renderCard(data.hits);

      if (data.totalHits < HITS_PER_PAGE && data.totalHits === '') {
        loaderOn;
      }
      Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
      lightbox.refresh();

      if (currentPage < totalPages) {
        loaderOn;
      } else {
        loaderOff;
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
      }
    })
    .catch(error => console.log(error));
}

// Next page

const handleLoadNextPage = () => {
  currentPage += 1;

  fetchData(query, currentPage, HITS_PER_PAGE)
    .then(({ data }) => {
      let totalPages = Math.ceil(data.totalHits / HITS_PER_PAGE);

      renderCard(data.hits);
      lightbox.refresh();
      if (currentPage === totalPages) {
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
        loaderOff;
      }
    })
    .catch(error => console.log(error));
};

// infinite Scroll

const handleWindowScroll = ({ target }) => {
  if (
    target.scrollTop + target.clientHeight + 10 >= target.scrollHeight &&
    !isLoading
  ) {
    handleLoadNextPage();
  }
};

refs.form.addEventListener('submit', handleSubmit);
refs.gallery.addEventListener('scroll', handleWindowScroll);
