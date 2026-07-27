const API_BASE_URL = import.meta.env.PROD
? "https://like-jeopardy.onrender.com/api"
: "http://localhost:5050/api";
export default API_BASE_URL;