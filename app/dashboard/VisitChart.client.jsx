"use client"

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

// Register core chart elements up-front. The zoom plugin accesses `window` during import
// so we dynamically import and register it inside a client-only effect below.
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)


export default function VisitChart({ labels = [], data = [] }) {
  const [zoomReady, setZoomReady] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    // dynamic import of plugin to avoid server-side evaluation that references `window`
    ;(async () => {
      try {
        const mod = await import('chartjs-plugin-zoom')
        const zoom = mod && mod.default ? mod.default : mod
        ChartJS.register(zoom)
      } catch (e) {
        // plugin failed to load; chart still works without zoom
        // eslint-disable-next-line no-console
        console.error('zoom plugin load failed', e && e.message ? e.message : e)
      } finally {
        if (mounted) setZoomReady(true)
      }
    })()
    return () => { mounted = false }
  }, [])
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Kunjungan',
        data,
        backgroundColor: 'rgba(59,130,246,0.85)',
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
        pan: { enabled: true, mode: 'x' },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  }

  return (
    <div className="w-full h-56">
      {/* render chart immediately; zoom will be available once dynamically registered */}
      <Bar data={chartData} options={options} />
    </div>
  )
}
