import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("live-clock")
export class LiveClock extends LitElement {
    @state()
    private currentTime: Date = new Date();

    private timer?: number;

    static styles = css`
        :host {
            display: block;
            text-align: right;
            background: var(--card-bg);
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(128, 128, 128, 0.1);
            min-width: 200px;
        }
        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8rem;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .live-indicator .dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        .time-display {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--text-color);
            line-height: 1.2;
            font-family: var(--font-heading, sans-serif);
            letter-spacing: -0.5px;
        }
        .date-display {
            font-size: 0.9rem;
            color: var(--primary-color);
            font-weight: 600;
            opacity: 0.8;
            text-transform: capitalize;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.timer = window.setInterval(() => {
            this.currentTime = new Date();
        }, 1000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    render() {
        return html`
            <div class="live-indicator"><span class="dot"></span> Sistema Online</div>
            <div class="time-display">
                ${this.currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div class="date-display">
                ${this.currentTime.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "live-clock": LiveClock;
    }
}
