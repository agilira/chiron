<template>
  <div class="vue-counter">
    <h3>Vue Counter</h3>
    <div class="counter-display">{{ count }}</div>
    <div class="counter-controls">
      <button class="btn-decrement" @click="decrement">−{{ stepValue }}</button>
      <button class="btn-reset" @click="reset">Reset</button>
      <button class="btn-increment" @click="increment">+{{ stepValue }}</button>
    </div>
    <p class="counter-info">Step: {{ stepValue }} | Initial: {{ initialCount }}</p>
  </div>
</template>

<script>
export default {
  name: 'VueCounter',
  props: {
    initialCount: {
      type: [Number, String],
      default: 0
    },
    step: {
      type: [Number, String],
      default: 1
    }
  },
  data() {
    return {
      count: parseInt(this.initialCount) || 0
    };
  },
  computed: {
    stepValue() {
      return parseInt(this.step) || 1;
    }
  },
  methods: {
    increment() {
      this.count += this.stepValue;
    },
    decrement() {
      this.count -= this.stepValue;
    },
    reset() {
      this.count = parseInt(this.initialCount) || 0;
    }
  },
  mounted() {
    console.log('Vue Counter mounted:', {
      initialCount: this.initialCount,
      step: this.step
    });
  }
};
</script>

<style scoped>
.vue-counter {
  padding: 20px;
  border: 2px solid #42b883;
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
  color: #42b883;
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
