import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js"

@customElement("aerolit-dashboard")
export class AerolitDashboard extends LitElement {
    static styles = [
        css`
            :host {
                display: block;
            }
        `
    ];

    render() {
        return html`
        <h1>AeroLit Dashboard</h1>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-dashboard": AerolitDashboard;
    }
}
