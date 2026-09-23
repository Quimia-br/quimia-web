import { RouterProvider } from "react-router-dom";
import { SpacemanThemeProvider } from "@space-man/react-theme-animation";
import { router } from "./routes";

function App() {
  return (
    <SpacemanThemeProvider defaultTheme="system" defaultColorTheme="default">
      <RouterProvider router={router} />
    </SpacemanThemeProvider>
  );
}

export default App;
