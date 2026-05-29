import { render, screen } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";
import { ThemeProvider } from "./theme-provider";

it("renders theme toggle button", () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
  expect(screen.getByRole("button", { name: /theme toggle/i })).toBeInTheDocument();
});
