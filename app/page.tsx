'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

type FieldData = {
  value: any
  unit: string | null
  source: string
  source_url: string
  confidence: string
  notes: string | null
  status: string
}

type MireyeResponse = {
  lat: number
  lng: number
  fetched_at: string
  fields: Record<string, FieldData>
  partial_failures: any[]
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [sidebarData, setSidebarData] = useState<MireyeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98.5795, 39.8283],
      zoom: 4
    })

    mapRef.current = map

    map.on('click', async (e) => {
      const { lat, lng } = e.lngLat
      setCoords({ lat, lng })
      setLoading(true)
      setSidebarData(null)

      try {
        const res = await fetch('/api/mireye', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        })
        const data = await res.json()
        setSidebarData(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })

    return () => map.remove()
  }, [])

  const formatValue = (field: FieldData) => {
    if (field.value === null) return 'N/A'
    if (typeof field.value === 'boolean') return field.value ? 'Yes' : 'No'
    if (typeof field.value === 'number') return `${field.value.toLocaleString()}${field.unit ? ` ${field.unit}` : ''}`
    return `${field.value}${field.unit ? ` ${field.unit}` : ''}`
  }

  const confidenceColor = (confidence: string) => {
    if (confidence === 'high') return '#4ade80'
    if (confidence === 'medium') return '#facc15'
    return '#f87171'
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div ref={mapContainer} style={{ flex: 1 }} />
      <div style={{
        width: '380px',
        background: '#0f0f0f',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Mireye Explorer</div>
          {coords && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {!loading && !sidebarData && (
            <div style={{ color: '#444', fontSize: '13px', marginTop: '2rem', textAlign: 'center' }}>
              Click anywhere on the map<br />to see physical world data
            </div>
          )}

          {loading && (
            <div style={{ color: '#666', fontSize: '13px', marginTop: '2rem', textAlign: 'center' }}>
              Fetching data...
            </div>
          )}

          {sidebarData && sidebarData.fields && (
            <div>
              {Object.entries(sidebarData.fields).map(([key, field]) => (
                <div key={key} style={{
                  marginBottom: '12px',
                  padding: '10px',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  border: '1px solid #222'
                }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
                    {formatValue(field)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#222',
                      color: confidenceColor(field.confidence)
                    }}>
                      {field.confidence} confidence
                    </span>
                    <a href={field.source_url} target="_blank" rel="noreferrer" style={{
                      fontSize: '10px',
                      color: '#3b82f6',
                      textDecoration: 'none'
                    }}>
                      {field.source} ↗
                    </a>
                  </div>
                  {field.notes && (
                    <div style={{ fontSize: '10px', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>
                      {field.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}