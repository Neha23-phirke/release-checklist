function getStatus(completedSteps, totalSteps = 8) {
  if (completedSteps.length === 0) return "planned";
  if (completedSteps.length === totalSteps) return "done";
  return "ongoing";
}

test("no completed steps means planned", () => {
  expect(getStatus([])).toBe("planned");
});

test("all completed steps means done", () => {
  expect(getStatus([0, 1, 2, 3, 4, 5, 6, 7])).toBe("done");
});

test("partially completed steps means ongoing", () => {
  expect(getStatus([0, 1])).toBe("ongoing");
});