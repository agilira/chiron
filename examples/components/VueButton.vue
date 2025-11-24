<template>
  <div class="vue-button">
    <button 
      :class="['btn', `btn-${variant}`]"
      @click="handleClick"
    >
      {{ label }}
    </button>
    <p v-if="clickCount > 0" class="click-count">
      Clicked {{ clickCount }} {{ clickCount === 1 ? 'time' : 'times' }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'VueButton',
  props: {
    label: {
      type: String,
      default: 'Button'
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'success', 'danger'].includes(value)
    }
  },
  data() {
    return {
      clickCount: 0
    };
  },
  methods: {
    handleClick() {
      this.clickCount++;
      console.log(`Vue Button clicked: ${this.label}`, this.clickCount);
    }
  },
  mounted() {
    console.log('Vue Button mounted:', {
      label: this.label,
      variant: this.variant
    });
  }
};
</script>

<style scoped>
.vue-button {
  text-align: center;
  max-width: 300px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f8f9fa;
  border: 2px solid #42b883;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.btn {
  padding: 12px 32px;
  font-size: 18px;
  font-weight: 600;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #35a372 0%, #2c3e50 100%);
}

.btn-secondary {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
}

.btn-success {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.click-count {
  margin-top: 15px;
  color: #42b883;
  font-size: 14px;
  font-weight: 600;
}
</style>
