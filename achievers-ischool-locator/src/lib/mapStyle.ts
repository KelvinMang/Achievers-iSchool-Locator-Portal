export const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#f8faff" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#0c007d" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#e4ebff" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#c7d6ff" }],
    },
  
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#b3c7ff" }],
    },
  
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#eef2ff" }],
    },
  ] as const;
  