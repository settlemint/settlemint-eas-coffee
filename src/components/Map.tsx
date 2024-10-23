import { type GeoProjection, geoEquirectangular } from 'd3-geo';
import type React from 'react';
import type { GeographyProps } from "react-simple-maps";
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from "react-simple-maps";

interface MapProps {
  coordinates: [number, number][];
}

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-50m.json";

const MapComponent: React.FC<MapProps> = ({ coordinates }) => {
  const width = 800;
  const height = 400;

  const projection: GeoProjection = geoEquirectangular()
    .scale((width / 2.5) / Math.PI)
    .translate([width / 2, height / 2]);

  // Calculate the bounding box of the coordinates
  const bounds = coordinates.reduce(
    (acc, coord) => ({
      minLon: Math.min(acc.minLon, coord[0]),
      maxLon: Math.max(acc.maxLon, coord[0]),
      minLat: Math.min(acc.minLat, coord[1]),
      maxLat: Math.max(acc.maxLat, coord[1]),
    }),
    { minLon: Number.POSITIVE_INFINITY, maxLon: Number.NEGATIVE_INFINITY, minLat: Number.POSITIVE_INFINITY, maxLat: Number.NEGATIVE_INFINITY }
  );

  // Calculate the appropriate zoom level with padding
  const padding = 0.2; // 20% padding
  const lonDiff = (bounds.maxLon - bounds.minLon) * (1 + padding);
  const latDiff = (bounds.maxLat - bounds.minLat) * (1 + padding * 2); // Double padding for latitude
  const maxDiff = Math.max(lonDiff, latDiff);
  const zoom = Math.max(1, Math.min(6, 360 / maxDiff));

  // Calculate the center, shifting it southward
  const center: [number, number] = [
    (bounds.minLon + bounds.maxLon) / 2,
    ((bounds.minLat + bounds.maxLat) / 2) - (latDiff / 4) // Shift south by 1/4 of the latitude difference
  ];

  return (
    <div className="relative w-full h-[400px]">
      <ComposableMap
        width={width}
        height={height}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={center} zoom={zoom} disablePanning>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: GeographyProps[] }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.key as string}
                  geography={geo}
                  fill="#EAEAEC"
                  stroke="#D6D6DA"
                />
              ))
            }
          </Geographies>

          {coordinates.map((coord, index) => (
            <Marker key={`marker-${coord.join(',')}`} coordinates={coord}>
              <circle r={2} fill="#D4A574" />
            </Marker>
          ))}

          <Line
            coordinates={coordinates}
            stroke="#D4A574"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default MapComponent;