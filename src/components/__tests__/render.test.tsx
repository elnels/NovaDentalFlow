import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p role="status">{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}

describe("Counter component", () => {
  it("renders initial count of 0", () => {
    render(<Counter />);
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });

  it("increments on click", async () => {
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByRole("button", { name: /increment/i }));
    expect(screen.getByRole("status")).toHaveTextContent("1");
  });

  it("increments multiple times", async () => {
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByRole("button", { name: /increment/i }));
    await user.click(screen.getByRole("button", { name: /increment/i }));
    await user.click(screen.getByRole("button", { name: /increment/i }));
    expect(screen.getByRole("status")).toHaveTextContent("3");
  });
});
