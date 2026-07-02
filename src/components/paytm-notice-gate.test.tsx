import { fireEvent, render, screen } from "@testing-library/react";
import { PaytmNoticeGate } from "./paytm-notice-gate";

it("shows paytm notice before the app", () => {
  render(
    <PaytmNoticeGate>
      <p>App content</p>
    </PaytmNoticeGate>
  );

  expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  expect(screen.getByText(/paytm is working normally as usual/i)).toBeInTheDocument();
  expect(screen.queryByText("App content")).not.toBeInTheDocument();
});

it("opens the app after the user proceeds", () => {
  render(
    <PaytmNoticeGate>
      <p>App content</p>
    </PaytmNoticeGate>
  );

  fireEvent.click(screen.getByRole("button", { name: /yes, proceed/i }));

  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(screen.getByText("App content")).toBeInTheDocument();
});
