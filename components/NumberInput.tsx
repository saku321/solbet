import { useState } from "react"

interface Props {
  name: string,
  formRef: React.RefObject<HTMLFormElement>,
}

export default function NumberInput({ name, formRef }: Props) {
  const [number, setNumber] = useState(0)

  function decrement() {
    setNumber(n => n > 0 ? n - 0.25: 0)
  }

  function increment() {
    setNumber(n => n + 0.25)
  }

  function handleKeyboard(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      decrement();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      increment();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      formRef.current?.submit();
    }
  }

  return (
    <div
          className="w-36 border-2 border-gray-200 rounded-md flex flex-row items-center"
          style={{ "width": "200px" }}
    >
      <button
        type="button"
        tabIndex={-0.25}
        className="basis-1/3 focus:outline-none"
        onClick={decrement}
        onKeyDown={handleKeyboard}
      >
        <span className="m-auto text-2xl font-thin">−</span>
      </button>
    <input
        style={{ "width": "100px" }}
        type="number"
        name={name}
        step={0.25}
        value={number}
        onChange={e => setNumber(Number(e.target.value))}
        min={0}
        className="w-12 border-none focus:ring-0 text-center bg-gray-200"
      />
      <button
        type="button"
        tabIndex={-0.25}
        className="basis-1/3 focus:outline-none"
        onClick={increment}
        onKeyDown={handleKeyboard}
      >
        <span className="m-auto text-2xl font-thin">+</span>
      </button>
    </div>
  )
}
