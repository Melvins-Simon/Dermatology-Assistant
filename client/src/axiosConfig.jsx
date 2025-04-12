// src/axiosConfig.js
import axios from 'axios';
import Cookies from 'js-cookie';

// Retrieve the CSRF token from the cookie
const csrfToken = Cookies.get('csrftoken');

// Create an Axios instance with default headers
const axiosInstance = axios.create({
  headers: {
    'X-CSRFToken': csrfToken,
  },
  // Include credentials in requests
  withCredentials: true,
});

export default axiosInstance;
