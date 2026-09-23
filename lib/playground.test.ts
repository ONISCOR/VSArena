import { describe, expect, it } from "vitest";
import { matchPlayCommand } from "@/lib/playground";

describe("matchPlayCommand", () => {
  it("maps stacking language to ColorSeek", () => {
    expect(matchPlayCommand("stack the three cubes")).toBe("colorseek");
    expect(matchPlayCommand("impila i tre cubi")).toBe("colorseek");
  });

  it("maps IK language to Baseline-IK", () => {
    expect(matchPlayCommand("run baseline IK")).toBe("ik");
    expect(matchPlayCommand("esegui baseline IK")).toBe("ik");
  });

  it("maps reset language", () => {
    expect(matchPlayCommand("reset the table")).toBe("reset");
    expect(matchPlayCommand("azzera il tavolo")).toBe("reset");
  });

  it("maps canned tricks", () => {
    expect(matchPlayCommand("ciao")).toBe("wave");
    expect(matchPlayCommand("wave with the arm")).toBe("wave");
    expect(matchPlayCommand("hello")).toBe("wave");
    expect(matchPlayCommand("annuisci")).toBe("nod");
    expect(matchPlayCommand("d'accordo")).toBe("nod");
    expect(matchPlayCommand("point at the cyan cube")).toBe("point");
    expect(matchPlayCommand("punta il cubo ciano")).toBe("point");
    expect(matchPlayCommand("pinch")).toBe("snap");
    expect(matchPlayCommand("apri la pinza")).toBe("snap");
  });

  it("does not steal stack from a point prompt", () => {
    expect(matchPlayCommand("point at the cyan cube")).not.toBe("colorseek");
  });
});
