import { geoEquirectangular } from 'd3-geo';
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

  const projection = geoEquirectangular()
    .scale((width / 2.5) / Math.PI)
    .translate([width / 2, height / 2]);

  // Calculate the center of the coordinates
  const center = coordinates.reduce(
    (acc, coord) => [acc[0] + coord[0] / coordinates.length, acc[1] + coord[1] / coordinates.length],
    [0, 0]
  ) as [number, number];

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

  // Calculate the appropriate zoom level
  const lonDiff = bounds.maxLon - bounds.minLon;
  const latDiff = bounds.maxLat - bounds.minLat;
  const zoom = Math.min(360 / Math.max(lonDiff * 2, latDiff * 4), 50);

  return (
    <div className="relative w-full h-[400px]">
      <ComposableMap
        projection={projection as unknown as string}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={center} zoom={zoom}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: GeographyProps[] }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.key}
                  geography={geo}
                  fill="#EAEAEC"
                  stroke="#D6D6DA"
                />
              ))
            }
          </Geographies>

          {coordinates.map((coord, index) => (
            <Marker key={`marker-${index}`} coordinates={coord}>
              <circle r={4} fill="#F00" />
            </Marker>
          ))}

          <Line
            coordinates={coordinates}
            stroke="#F00"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default MapComponent;