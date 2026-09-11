import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@phosphor-icons/webcomponents/PhTrendUp';
import '@phosphor-icons/webcomponents/PhTrendDown';

export type KpiColorType = 'primary' | 'secondary' | 'error' | 'neutral';

@customElement('kpi-card')
export class KpiCard extends LitElement {
  @property({ type: String })
  title = '';

  @property({ type: String })
  value = '';

  @property({ type: String })
  colorType: KpiColorType = 'primary';

  @property({ type: String })
  trend = '';

  @property({ type: String })
  trendDirection: 'up' | 'down' | 'none' = 'none';

  static styles = css`
    :host {
      display: block;
      background-color: var(--card-bg);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid rgba(128, 128, 128, 0.15);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      color: var(--text-color);
      position: relative;
      overflow: hidden;
    }

    :host(:hover) {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
      border-color: rgba(128, 128, 128, 0.3);
    }

    .top-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
      font-weight: 600;
      margin-top: 0.5rem;
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
    }

    /* Asignación de colores usando color-mix para el fondo suave */
    :host([colorType="primary"]) .icon-wrapper {
      color: var(--primary-color);
      background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
    }
    :host([colorType="secondary"]) .icon-wrapper {
      color: var(--secondary-color);
      background-color: color-mix(in srgb, var(--secondary-color) 15%, transparent);
    }
    :host([colorType="error"]) .icon-wrapper {
      color: var(--error-color);
      background-color: color-mix(in srgb, var(--error-color) 15%, transparent);
    }
    :host([colorType="neutral"]) .icon-wrapper {
      color: #888;
      background-color: rgba(136, 136, 136, 0.15);
    }

    .value {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.75rem;
    }

    .trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 20px;
    }

    .trend.up {
      color: #10b981; /* Verde esmeralda moderno */
      background-color: rgba(16, 185, 129, 0.1);
    }

    .trend.down {
      color: var(--error-color);
      background-color: color-mix(in srgb, var(--error-color) 10%, transparent);
    }

    .trend.none {
      color: #888;
    }
    
    .trend ph-trend-up, .trend ph-trend-down {
      font-size: 1rem;
    }
  `;

  render() {
    return html`
      <div class="top-section">
        <div class="title">${this.title}</div>
        <div class="icon-wrapper">
          <slot name="icon"></slot>
        </div>
      </div>
      <div class="value">${this.value}</div>
      
      ${this.trend ? html`
        <div class="trend ${this.trendDirection}">
          ${this.trendDirection === 'up' ? html`<ph-trend-up weight="bold"></ph-trend-up>` : ''}
          ${this.trendDirection === 'down' ? html`<ph-trend-down weight="bold"></ph-trend-down>` : ''}
          ${this.trend}
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kpi-card': KpiCard;
  }
}
