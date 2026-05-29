import { render, screen } from "@testing-library/react";
import QuoteForm from "./quote-form";

it("renders bookingId and orderId inputs", () => {
  render(<QuoteForm onSubmit={async () => {}} />);
  expect(screen.getByLabelText("Booking ID")).toBeInTheDocument();
  expect(screen.getByLabelText("Order ID")).toBeInTheDocument();
});
