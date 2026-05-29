import { render, screen } from "@testing-library/react";
import HomePage from "./page";

it("renders payments portal heading", () => {
  render(<HomePage />);
  expect(screen.getByText("Zenvana Payments Portal")).toBeInTheDocument();
});
