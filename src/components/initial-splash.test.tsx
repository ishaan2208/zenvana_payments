import { render, screen } from "@testing-library/react";
import { InitialSplash } from "./initial-splash";

it("shows splash on first load", () => {
  sessionStorage.removeItem("zenvana_payments_splash_seen");
  render(<InitialSplash />);
  expect(screen.getByLabelText(/loading zenvana/i)).toBeInTheDocument();
});
