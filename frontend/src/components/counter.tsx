/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from "react";

export default function counter() {
  const [count, setCount] = useState(0);
  return (
    <>
      <div>
        <button
          onClick={() => {
            setCount(count + 1);
          }}
          style={{ cursor: "pointer" }}
        >
          {count > 0 ? "Clicked: " + count : "Click Me :D"}
        </button>
        <p
          style={{
            color: count % 2 ? "orange" : "green",
          }}
        >
          {count > 0 ? (count % 2 ? "Odd Num" : "Even Num") : ""}
        </p>
      </div>
    </>
  );
}
