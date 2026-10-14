import { RouterProvider } from "react-router-dom";
import Providers from "@/providers";
import router from "@/routes";

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
