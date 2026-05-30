import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CreateSessionForm from "./create-session-form";

describe("CreateSessionForm", () => {
  it("keeps locked ORDERS_ONLY amount in paise precision", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateSessionForm
        quote={{
          queueItemType: "ORDER",
          queueItemId: 101,
          bookingId: 10,
          anchorOrderId: 101,
          bookingDue: 0,
          ordersDueTotal: 271.95,
          totalDue: 271.95,
          allowedModes: ["ORDERS_ONLY"],
        }}
        onSubmit={onSubmit}
      />
    );

    const amountInput = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(amountInput).toHaveValue("271.95");

    fireEvent.click(screen.getByRole("button", { name: /continue to checkout/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        modeSelection: "ORDERS_ONLY",
        amountRequested: 271.95,
      })
    );
  });
});
