"use client";

import type GeoJSON from "geojson";
import type { MapLayerMouseEvent, Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useRef, useState } from "react";
import type { LayerProps, MapRef, ViewState } from "react-map-gl/maplibre";
import MapLib, { Layer, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type GlobeFeatureProperties = {
  city: string;
  country: string;
  users: number;
};

type GlobeFeature = GeoJSON.Feature<GeoJSON.Point, GlobeFeatureProperties>;
export type GlobeFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  GlobeFeatureProperties
>;

type GlobeMapProps = {
  data?: GlobeFeatureCollection;
  className?: string;
};

const DEFAULT_DATA: GlobeFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-122.4194, 37.7749] },
      properties: { city: "San Francisco", country: "USA", users: 2847 },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-74.006, 40.7128] },
      properties: { city: "New York", country: "USA", users: 4521 },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-0.1276, 51.5074] },
      properties: { city: "London", country: "UK", users: 3892 },
    },
  ],
};

const DEFAULT_VIEW_STATE: ViewState = {
  longitude: 0,
  latitude: 30,
  zoom: 1.5,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

const MAP_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const GLOBE_PROJECTION = "globe" as const;

const glowLayerStyle: LayerProps = {
  id: "signal-glow",
  type: "circle",
  source: "user-signals",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "users"],
      500,
      15,
      5500,
      40,
    ],
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "users"],
      500,
      "#60a5fa",
      5500,
      "#c084fc",
    ],
    "circle-opacity": 0.3,
    "circle-blur": 1,
    "circle-pitch-alignment": "map",
  },
};

const circleLayerStyle: LayerProps = {
  id: "signal-circles",
  type: "circle",
  source: "user-signals",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "users"],
      500,
      6,
      5500,
      18,
    ],
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "users"],
      500,
      "#60a5fa",
      5500,
      "#c084fc",
    ],
    "circle-opacity": 0.9,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#ffffff",
    "circle-pitch-alignment": "map",
  },
};

const getFirstSymbolId = (map: MapLibreMap | null): string | undefined => {
  if (!map) {
    return;
  }
  const layers = map.getStyle().layers || [];
  const symbolLayer = layers.find(
    (l: { type?: string }) => l.type === "symbol"
  );
  return symbolLayer?.id;
};

export default function GlobeMap({
  data = DEFAULT_DATA,
  className = "h-[320px] min-h-[320px] w-full",
}: GlobeMapProps): React.JSX.Element {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW_STATE);

  const handleFlyTo = useCallback((coords: [number, number]): void => {
    mapRef.current?.flyTo({
      center: coords,
      zoom: 5,
      pitch: 45,
      duration: 2000,
      essential: true,
    });
  }, []);

  const firstSymbolId: string | undefined = getFirstSymbolId(
    mapRef.current?.getMap() || null
  );

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)",
        }}
      />
      <MapLib
        ref={mapRef}
        {...viewState}
        attributionControl={false}
        interactiveLayerIds={["signal-circles"]}
        mapLib={import("maplibre-gl")}
        mapStyle={MAP_STYLE_URL}
        onClick={(e: MapLayerMouseEvent): void => {
          const feature = e.features?.[0] as GlobeFeature | undefined;
          if (feature) {
            handleFlyTo(feature.geometry.coordinates as [number, number]);
          }
        }}
        onMove={(evt: { viewState: ViewState }): void =>
          setViewState(evt.viewState)
        }
        projection={GLOBE_PROJECTION}
        style={{ width: "100%", height: "100%" }}
      >
        <Source data={data} id="user-signals" type="geojson">
          <Layer {...glowLayerStyle} beforeId={firstSymbolId} />
          <Layer {...circleLayerStyle} beforeId={firstSymbolId} />
        </Source>
      </MapLib>
    </div>
  );
}
