import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { Chart, registerables } from 'chart.js';
import { flightService } from '../../services/flight-service';
import '@phosphor-icons/webcomponents/PhChartLineUp';

// Registramos todos los componentes de Chart.js
Chart.register(...registerables);

@customElement('activity-chart')
export class ActivityChart extends LitElement {
  @query('canvas')
  private canvasElement!: HTMLCanvasElement;

  private chartInstance: Chart | null = null;

  @state()
  private loading = true;

  static styles = css`
    :host {
      display: block;
      margin-top: 2rem;
      background-color: var(--card-bg);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid rgba(128, 128, 128, 0.15);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      color: var(--text-color);
    }

    h2 {
      margin-top: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
      opacity: 0.9;
    }

    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      opacity: 0.6;
      font-style: italic;
    }
  `;

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    await this.loadDataAndRenderChart();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  public async refresh() { await this.loadDataAndRenderChart(); }

  private async loadDataAndRenderChart() {
    try {
      this.loading = true;
      const chartData = await flightService.getFlightsByTime();
      
      // Destruir la instancia anterior si existe
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const ctx = this.canvasElement.getContext('2d');
      if (!ctx) return;

      // Obtener el color primario dinámicamente de las variables CSS
      const styles = getComputedStyle(this);
      const primaryColor = styles.getPropertyValue('--primary-color').trim() || '#1e3a8a';
      const textColor = styles.getPropertyValue('--text-color').trim() || '#333';

      const currentHour = new Date().getHours();

      const currentHourLinePlugin = {
        id: 'currentHourLine',
        beforeDraw: (chart: any) => {
          if (chart.scales.x && typeof chart.scales.x.getPixelForValue === 'function') {
            const x = chart.scales.x.getPixelForValue(currentHour);
            const top = chart.scales.y.top;
            const bottom = chart.scales.y.bottom;
            const ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ef4444'; // red-500
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('AHORA', x, top - 10);
            ctx.restore();
          }
        }
      };

      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [{
            label: 'Vuelos',
            data: chartData.data,
            borderColor: primaryColor,
            backgroundColor: 'rgba(30, 58, 138, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: primaryColor,
            segment: {
              borderDash: (ctx: any) => ctx.p0DataIndex >= currentHour ? [5, 5] : undefined,
              borderColor: (ctx: any) => ctx.p0DataIndex >= currentHour ? 'rgba(128, 128, 128, 0.5)' : primaryColor,
            }
          }]
        },
        plugins: [currentHourLinePlugin],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 20 // espacio para el label AHORA
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (context: any) => {
                  const hour = context.dataIndex;
                  const value = context.parsed.y;
                  if (hour < currentHour) return 'Vuelos Finalizados: ' + value;
                  if (hour === currentHour) return 'Vuelos Activos: ' + value;
                  return 'Vuelos Programados: ' + value;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, maxTicksLimit: 12 }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(128, 128, 128, 0.1)' },
              ticks: { color: textColor, stepSize: 1 }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al cargar datos del gráfico', error);
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <h2>
        <ph-chart-line-up weight="bold"></ph-chart-line-up>
        Actividad de Vuelos (Hoy)
      </h2>
      <div class="chart-container" style="display: ${this.loading ? 'none' : 'block'}">
        <canvas></canvas>
      </div>
      ${this.loading ? html`<div class="empty-state">Cargando gráfico...</div>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'activity-chart': ActivityChart;
  }
}
