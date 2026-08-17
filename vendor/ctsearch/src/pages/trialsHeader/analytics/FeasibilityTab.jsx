import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Mock Data
const patientEnrollment = [
  { phase: "Phase I", p10: 65, p25: 105, p50: 170, p75: 350, p90: 500 },
  { phase: "Phase II", p10: 80, p25: 120, p50: 190, p75: 380, p90: 560 },
  { phase: "Phase III", p10: 95, p25: 140, p50: 210, p75: 400, p90: 600 },
  { phase: "Phase IV", p10: 70, p25: 110, p50: 175, p75: 360, p90: 520 },
];

const medianTimeData = [
  { country: "United States", days: 75 },
  { country: "Germany", days: 55 },
  { country: "Ireland", days: 68 },
  { country: "Canada", days: 94 },
  { country: "France", days: 82 },
  { country: "Spain", days: 120 },
  { country: "India", days: 150 },
];

const enrollmentDuration = [
  { country: "United States", days: 80 },
  { country: "Germany", days: 65 },
  { country: "Ireland", days: 90 },
  { country: "Canada", days: 110 },
  { country: "France", days: 105 },
  { country: "Spain", days: 130 },
  { country: "India", days: 155 },
];

// Fake locations for the dots on world map
const worldDots = [
  { x: 180, y: 110, country: "United States" },
  { x: 480, y: 100, country: "Germany" },
  { x: 460, y: 120, country: "Ireland" },
  { x: 160, y: 130, country: "Canada" },
  { x: 450, y: 140, country: "France" },
  { x: 470, y: 160, country: "Spain" },
  { x: 650, y: 200, country: "India" },
];

export default function FeasibilityTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
      {/* ------------------ Patient Enrollment Box Plot ------------------ */}
      <Card>
        <CardHeader
          title={
            <Typography
              variant="h6"
              sx={{
                fontSize: "23px",
                fontFamily: "Rubik",
                color: "rgba(0, 0, 0, 0.8)",
                fontWeight: 600,
              }}
            >
              Patient Enrollment by Phase
            </Typography>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={patientEnrollment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="phase" />
              <Tooltip />
              {/* Each bar represents IQR (P25 → P75) */}
              <Bar dataKey={(d) => d.p75 - d.p25} fill="rgba(47,128,237,0.4)" />
            </BarChart>
          </ResponsiveContainer>

          {/* MIN/MAX whiskers drawn manually below chart */}
          <div className="text-xs text-gray-600 mt-3">
            This simplified box-plot shows IQR (P25–P75). Median, P10, P90 can
            be added with custom shapes if needed.
          </div>
        </CardContent>
      </Card>

      {/* ------------------ Geographic Footprint World Map ------------------ */}
      <Card>
        <CardHeader
          title={
            <Typography
              variant="h6"
              sx={{
                fontSize: "23px",
                fontFamily: "Rubik",
                color: "rgba(0, 0, 0, 0.8)",
                fontWeight: 600,
              }}
            >
              Geographic Footprint
            </Typography>
          }
        />
        <CardContent>
          <div className="flex">
            {/* MAP */}
            <div className="w-2/3">
              <svg width="100%" height="260" viewBox="0 0 800 400">
                {/* World map background */}
                <image
                  href="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg"
                  width="800"
                  height="400"
                  opacity="0.25"
                />

                {/* Dots */}
                {worldDots.map((dot, idx) => (
                  <circle
                    key={idx}
                    cx={dot.x}
                    cy={dot.y}
                    r="8"
                    fill="#2F80ED"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                ))}
              </svg>dd
            </div>

            {/* COUNTRY LIST */}
            <div className="w-1/3 pl-4 space-y-2">
              {enrollmentDuration.map((c, idx) => (
                <div key={idx} className="text-sm">
                  <strong>{c.country}</strong>
                  <div className="text-gray-500">Trials: {c.days}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------ Median Time to FPI ------------------ */}
      <Card>
        <CardHeader
          title={
            <Typography
              variant="h6"
              sx={{
                fontSize: "23px",
                fontFamily: "Rubik",
                color: "rgba(0, 0, 0, 0.8)",
                fontWeight: 600,
              }}
            >
              Median Time to FPI by Country
            </Typography>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              style={{
                fontSize: "12px",
                fontStyle: "Rubik",
                fontWeight: "500",
              }}
              data={medianTimeData}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="country" width={100} />
              <Tooltip />
              <Bar dataKey="days" fill="rgba(47, 128, 237, 1)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ------------------ Enrollment Duration ------------------ */}
      <Card>
        <CardHeader
          title={
            <Typography
              variant="h6"
              sx={{
                fontSize: "23px",
                fontFamily: "Rubik",
                color: "rgba(0, 0, 0, 0.8)",
                fontWeight: 600,
              }}
            >
              Enrollment Duration by Country
            </Typography>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              style={{
                fontSize: "12px",
                fontStyle: "Rubik",
                fontWeight: "500",
              }}
              data={enrollmentDuration}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="country" width={100} />
              <Tooltip />
              <Bar dataKey="days" fill="rgba(47, 128, 237, 1)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
