import { render, screen } from "@testing-library/react";
import LoginForm from "./login-form";

it("shows staff login fields", () => {
  render(<LoginForm onSubmit={async () => {}} />);
  expect(screen.getByLabelText("Username")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
});
