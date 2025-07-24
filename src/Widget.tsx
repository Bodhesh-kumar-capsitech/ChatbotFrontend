import { render } from 'preact';
import App from './components/App';
import './index.css';

class ChatBotWidget extends HTMLElement {
  shadow: ShadowRoot;

  constructor() {
    super();
    // Create open shadow DOM so we can inspect it in dev tools
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const mountPoint = document.createElement('div');
    this.shadow.appendChild(mountPoint);

    // Mount the Preact ChatBot component inside shadow DOM
    render(<App/>, mountPoint);
  }
}

// Define the element
customElements.define('chat-bot-widget', ChatBotWidget);
