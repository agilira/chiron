<script>
  import { onMount } from 'svelte';
  
  // Props
  export let initialCount = 0;
  export let step = 1;
  
  // Parse props (they come as strings from JSON)
  let count = parseInt(initialCount) || 0;
  const stepValue = parseInt(step) || 1;
  
  function increment() {
    count += stepValue;
  }
  
  function decrement() {
    count -= stepValue;
  }
  
  function reset() {
    count = parseInt(initialCount) || 0;
  }
  
  onMount(() => {
    console.log('Svelte Counter mounted:', { initialCount, step });
  });
</script>

<div class="svelte-counter">
  <h3>Svelte Counter</h3>
  <div class="counter-display">{count}</div>
  <div class="counter-controls">
    <button class="btn-decrement" on:click={decrement}>−{stepValue}</button>
    <button class="btn-reset" on:click={reset}>Reset</button>
    <button class="btn-increment" on:click={increment}>+{stepValue}</button>
  </div>
  <p class="counter-info">Step: {stepValue} | Initial: {initialCount}</p>
</div>

<style>
  .svelte-counter {
    padding: 20px;
    border: 2px solid #ff3e00;
    border-radius: 8px;
    text-align: center;
    max-width: 300px;
    margin: 20px auto;
    background-color: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  h3 {
    margin: 0 0 15px 0;
    color: #333;
  }
  
  .counter-display {
    font-size: 48px;
    font-weight: bold;
    color: #ff3e00;
    margin: 20px 0;
  }
  
  .counter-controls {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  
  button {
    padding: 10px 20px;
    font-size: 18px;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-decrement {
    background-color: #e74c3c;
  }
  
  .btn-decrement:hover {
    background-color: #c0392b;
  }
  
  .btn-reset {
    background-color: #95a5a6;
  }
  
  .btn-reset:hover {
    background-color: #7f8c8d;
  }
  
  .btn-increment {
    background-color: #2ecc71;
  }
  
  .btn-increment:hover {
    background-color: #27ae60;
  }
  
  .counter-info {
    margin-top: 15px;
    font-size: 12px;
    color: #7f8c8d;
  }
</style>
