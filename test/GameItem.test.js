import {GameItem} from "../GameItem.class";

describe("Verify if gameInstance exists", () => {
  const gameItem = new GameItem(null,null,null);


  test("Verify if gameInstance exists", () => {
    expect(gameItem.look(undefined)).toBe(undefined);

  });


});