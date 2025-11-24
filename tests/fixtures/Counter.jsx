import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function Counter({ initial = 0, label = 'count' }) {
  const [count, setCount] = useState(initial);

  return h('div', { class: 'counter' },
    h('p', null, `${label}: ${count}`),
    h('button', { onClick: () => setCount(count + 1) }, '+'),
    h('button', { onClick: () => setCount(count - 1) }, '-')
  );
}
