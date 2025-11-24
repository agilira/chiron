<script>
  export let title = 'Card Title';
  export let description = 'Card description';
  
  // Parse if they come as strings
  const cardTitle = typeof title === 'string' ? title : String(title);
  const cardDesc = typeof description === 'string' ? description : String(description);
</script>

<div class="svelte-card">
  <div class="card-header">
    <h4>{cardTitle}</h4>
  </div>
  <div class="card-body">
    <p>{cardDesc}</p>
  </div>
  <div class="card-footer">
    <button on:click={() => alert(`You clicked: ${cardTitle}`)}>
      Learn More
    </button>
  </div>
</div>

<style>
  .svelte-card {
    border: 2px solid #ff3e00;
    border-radius: 8px;
    overflow: hidden;
    max-width: 400px;
    margin: 20px auto;
    background-color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  .card-header {
    background: linear-gradient(135deg, #ff3e00 0%, #ff6b35 100%);
    color: white;
    padding: 20px;
  }
  
  .card-header h4 {
    margin: 0;
    font-size: 24px;
  }
  
  .card-body {
    padding: 20px;
    color: #333;
  }
  
  .card-body p {
    margin: 0;
    line-height: 1.6;
  }
  
  .card-footer {
    padding: 15px 20px;
    background-color: #f8f9fa;
    border-top: 1px solid #e0e0e0;
    text-align: center;
  }
  
  button {
    padding: 10px 24px;
    background-color: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  button:hover {
    background-color: #cc3200;
  }
</style>
