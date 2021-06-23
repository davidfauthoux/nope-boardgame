import { Grid } from "../Grid.class";
import {Layout} from "../../Layout.class";

describe("Verify Grid functions", () => {

  test("Check parseSpotLocation()", () => {
    const layout = new Layout();
    const grid = new Grid(layout,null,null,4,null,200,null);
    expect(grid.parseSpotLocation("01-01")).toStrictEqual({"i": -1, "j": -1});
    expect(grid.parseSpotLocation("01-15")).toStrictEqual({"i": -1, "j": 15});
    expect(grid.parseSpotLocation("15-01")).toStrictEqual({"i": 15, "j": -1});
    expect(grid.parseSpotLocation("15-15")).toStrictEqual({"i": 15, "j": 15});
    expect(grid.parseSpotLocation("0-01")).toStrictEqual({"i": 0, "j": -1});
    expect(grid.parseSpotLocation("01-0")).toStrictEqual({"i": -1, "j": 0});

  });

  test("Check _spotLocation()", () => {
    const layout = new Layout();
    const grid = new Grid(layout,null,null,4,null,200,null);
    expect(grid._spotLocation(-1,1)).toStrictEqual("01-1");
    expect(grid._spotLocation(15,1)).toStrictEqual("15-1");
    expect(grid._spotLocation(0,-5)).toStrictEqual("0-05");
    expect(grid._spotLocation(-6,-45)).toStrictEqual("06-045");

  });

  test("Check rowWidth()", () => {
    const layout = new Layout();
    const grid = new Grid(layout,null,null,4,null,200,null);
    const grid2 = new Grid(layout,null,null,6,null,200,null);
    expect(grid.rowWidth(12)).toBe(200);
    expect(grid2.rowWidth(12)).toBe(199);


  });


});