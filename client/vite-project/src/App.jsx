import { useEffect } from "react";
import axios from "axios";

function App() {
  const API = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    axios
      .get(`${API}/products`)
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h1>MB Store</h1>
    </div>
  );
}

export default App;